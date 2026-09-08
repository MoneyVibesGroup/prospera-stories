# STORY-612 : La cloche reçoit les faits d'abonnement

Status: done

**Épic :** EPIC-057 — Canal in-app et fil d'activité
**Service :** `notification-service` *(déclenché par `paiement-service`)*
**Points :** 3 · **Sprint :** S36
**Prérequis :** **STORY-280** (impayé, suspension, préavis), **STORY-581** (fil d'activité)
**Origine :** revue d'architecture du 2026-09-06 · FR-P48, AD-12.

---

## Le récit

En tant que **dirigeant d'une organisation cliente**, je veux voir dans ma cloche que mon abonnement
arrive à échéance, afin de ne pas découvrir la suspension en ouvrant l'application un matin.

## Le fait

⚡ **La cloche existe et un seul service y dépose.** `STORY-581` a réveillé la route de
`dossier-service`, avec son compteur de non-lus. Depuis, aucun autre module n'y publie. Si chaque
module invente son propre bandeau d'alerte, il y aura des alertes dans quarante-cinq écrans et aucun
endroit commun — ce que la cloche existait précisément pour empêcher.

⚡ **L'abonnement est le meilleur premier client de cette cloche**, parce que son fait est daté
d'avance : une échéance se voit venir. Un préavis in-app coûte un dépôt et évite une suspension
subie.

⛔ **La cloche ne porte pas le lien de paiement.** Un lien à usage unique déposé dans un fil consulté
par tous les membres habilités serait un jeton partagé. Elle porte le **fait** et **renvoie à
l'écran des échéances**, où le lien s'obtient sous le contrôle du gate.

⚡ **Une organisation suspendue voit encore sa cloche.** C'est le seul canal qui lui reste pour
apprendre comment se rétablir. Fermer la cloche avec le module ferait du remède un privilège de
ceux qui n'en ont pas besoin.

⚠️ **Le dépôt passe par la porte commune.** L'in-app est un canal comme un autre depuis `STORY-580` :
deux lignes de fabrique et rien d'autre. Ajouter ici une route d'écriture spéciale rouvrirait ce que
cette story avait fermé.

## Critères d'acceptation

- [x] AC-1 *(côté notification)* — Quatre faits déposent une cloche à l'organisation concernée : **échéance proche**,
      **impayé constaté**, **suspension**, **rétablissement**.
- [x] AC-2 — Le dépôt emprunte **la même porte que tout envoi**, sans route d'écriture nouvelle et
      sans accès direct à la collection des messages in-app.
- [x] AC-3 — ⛔ Aucune cloche ne contient de **lien à usage unique** ni de jeton. Test sur le corps
      déposé.
- [x] AC-4 — Une organisation **suspendue** reçoit et lit ses cloches. Test explicite sur ce cas.
- [ ] AC-5 *(revient à `paiement-service`, voir ci-dessous)* — Le préavis de suspension est déposé **avant** la suspension, et l'ordre est vérifié par
      le test, pas supposé (exigence de `STORY-280`).
- [x] AC-6 — Le compteur de non-lus du fil d'activité intègre ces cloches sans changement de contrat
      pour les consommateurs existants.
- [x] AC-7 — La cloche est **transactionnelle par le point d'entrée**, et un désabonnement de masse
      ne l'éteint pas.

## Notes

⚠️ **Le déclenchement.** Contrairement au lien de paiement, ces faits **ne portent aucun secret** :
ils peuvent donc légitimement passer par le bus. Mais `EVENEMENTS_DECLENCHEURS` reste **fermée** et
ne contient aucun topic `paiement.*` — l'ouvrir demanderait de justifier chaque nouveau topic devant
le discriminant d'AD-2. ⚡ **Point à trancher :** ouvrir la liste aux topics d'abonnement, qui ne
portent que des faits, ou passer par le même appel direct que `STORY-608`. Recommandation : **appel
direct**, pour garder une seule règle à défendre en revue.

⚠️ Le destinataire est un **utilisateur**, pas un contact — l'in-app est le seul canal dans ce cas
(`destinataire.ts`). Choisir *qui* dans l'organisation reçoit l'alerte est une question de règle, pas
de canal : par défaut, tous les membres habilités à voir la facturation.


---

## Ce que la livraison a appris (2026-09-07)

**Branche :** `MNV-612`, empilée sur `MNV-628`.

### ⛔⛔ AC-4 était FAUX au moment où la fiche a été écrite, et c'est là qu'était la story

Le gate d'AD-18 refuse `SUSPENDED`. Une organisation suspendue pour impayé **ne pouvait pas ouvrir
sa cloche** — c'est-à-dire pas lire le message qui lui dit comment se rétablir. Le contrôleur le
disait d'ailleurs en toutes lettres :

> *« Une organisation qui n'est plus servie ne l'est pas non plus pour ses cloches — la conséquence
> est assumée ici plutôt que découverte au premier entitlement révoqué. »*

⚡ **La phrase était juste pour une résiliation, et fausse pour un gel.** Assumer ne veut pas dire
avoir raison : ce commentaire assumait une conséquence dont l'auteur n'avait examiné qu'une moitié.

⚡⚡ **Fermer la cloche avec le module fait du remède un privilège de ceux qui n'en ont pas besoin.**
Le message le plus utile des quatre — « voici comment rouvrir votre accès » — aurait été le seul
illisible, déposé dans une boîte que son destinataire ne peut plus ouvrir. Nous aurions parlé dans
le vide en croyant avoir prévenu.

⛔ **Deux exemptions, deux statuts, et elles ne se croisent jamais.** `@ToleresResiliation` lève
`REVOKED` pour l'export (STORY-587) ; `@ToleresSuspension` lève `SUSPENDED` pour la cloche. Les
fondre en une aurait fondu deux promesses, et laissé une organisation révoquée consulter un fil
qu'on est en train d'effacer.

⛔ **Elle LIT, elle ne PARLE pas**, et une garde de balayage tient l'inventaire des fichiers qui
portent l'exemption — il en compte **un**. Une exemption qui se déplace cesse d'être une exemption :
posée un jour sur un contrôleur d'écriture, elle ferait qu'une suspension ne suspend plus rien.

### ⚡⚡ Un double qui simplifie une distinction finit par prouver son contraire

Le test du gate posait la tolérance par un booléen unique, rendu pour **toute** clé autre que celle
de l'accès. Tant qu'il n'existait qu'une exemption, c'était équivalent. À la seconde, le test
« ⛔ une organisation SUSPENDUE reste refusée » serait passé au vert **pour la mauvaise raison** :
poser la tolérance de résiliation posait aussi celle de suspension.

Le double a donc été corrigé pour distinguer les deux clés — et c'est le genre de défaut qu'aucun
test ne signale, puisque le symptôme est un test qui passe.

### ⚡⚡ Ce qui rassemble les modèles système n'est pas leur SUJET, c'est leur PROPRIÉTAIRE

L'inventaire s'appelait « les sept modèles de compte ». Quatre modèles d'abonnement viennent s'y
ranger, et rien ne les rapproche à la lecture : une invitation et une suspension d'abonnement n'ont
aucun rapport.

Ce qu'ils partagent est ailleurs : **la plateforme les possède, aucune organisation ne peut les
modifier ni les effacer**, et c'est `estCleSysteme` qui le garantit. Les séparer en deux inventaires
par famille aurait dupliqué cette garantie — et l'une des deux copies aurait fini par diverger,
laissant une famille de modèles effaçable sans que personne ne le remarque.

### ⛔ La cloche porte le FAIT, pas le dossier

Aucun des huit textes ne contient de lien, et **aucune des quatre clés ne déclare de montant**.

- **Le lien** : une cloche est lue par tous les membres habilités. Un lien de paiement à usage unique
  déposé là est un jeton partagé — c'est-à-dire un jeton à usage unique qui n'en est plus un.
- **Le montant** : recopié dans une cloche, il resterait affiché après le paiement. Sur l'écran des
  échéances, il est à jour.

⚡ **La garde porte sur TOUTES les entrées in-app**, pas seulement sur les quatre nouvelles : un
texte de cloche ajouté demain la rencontre aussi.

### ⚡ Un ordre, pas un ensemble — et le dernier est celui qu'on oublie

Les quatre clés sont rangées dans l'ordre de la dégradation puis du retour : l'échéance s'annonce,
l'impayé se constate, la suspension tombe, le rétablissement rend la main. C'est le quatrième qui
manque le plus souvent aux systèmes de ce genre, parce qu'il est la bonne nouvelle — et une
organisation rétablie sans confirmation continue de croire sa porte fermée.

### ⚠️ AC-7 tenait déjà, sans une ligne

Une cloche est de nature **transactionnelle** par construction : `natureOpposable` (STORY-582) fait
interroger le registre transactionnel pour tout envoi dont le destinataire n'est pas un `Contact`.
Un désabonnement de masse ne l'éteint donc pas, et il n'a fallu l'écrire nulle part.

### ⛔ Ce qui revient à `paiement-service`, et pourquoi ce n'est pas ici

**AC-5 — le préavis déposé avant la suspension — n'est pas livrable dans ce dépôt.** L'ordre des deux
gestes appartient à celui qui les déclenche : `notification-service` ne décide pas quand une
suspension tombe, il dépose ce qu'on lui demande de déposer. Poser ici un contrôle d'ordre aurait
créé **une seconde vérité sur la chronologie d'un abonnement**, et le jour où les deux auraient
divergé, personne n'aurait su laquelle croire.

Ce qui est livré ici est ce dont l'appelant a besoin : les quatre clés, leurs textes, leur canal,
leur contrat de variables, et la garantie que la boîte s'ouvre même suspendue.

⚡ **Et le déclenchement reste un APPEL DIRECT**, conformément à la recommandation de la fiche.
`EVENEMENTS_DECLENCHEURS` reste fermée et ne contient aucun topic `paiement.*` : ouvrir la liste
aurait demandé de justifier chaque topic devant le discriminant d'AD-2, pour gagner un couplage de
moins. Une seule règle à défendre en revue vaut mieux que deux chemins équivalents.

### ⛔ Points ouverts légués

1. **`paiement-service` n'appelle encore rien.** Les quatre modèles existent et personne ne les
   emploie — c'est exactement la situation de l'outbox de STORY-570, et elle se termine bien tant
   qu'on la nomme. La story côté paiement doit déposer les quatre faits et **ordonner** le préavis
   avant la suspension (AC-5).
2. **Le destinataire n'est pas encore choisi.** La fiche dit « par défaut, tous les membres habilités
   à voir la facturation ». Le service ne construit pas de liste de destinataires (FR-N28) : c'est
   l'appelant qui remet les `userId`. La règle appartient donc à `paiement-service`.
3. **L'écran des échéances est cité par les textes et n'est pas nommé.** Les huit messages disent
   « rendez-vous sur l'écran des échéances » sans lien — c'est voulu (AC-3) — mais si cet écran
   change de nom, huit textes mentent. Ils sont livrés avec le code, donc corrigibles en une
   livraison.
