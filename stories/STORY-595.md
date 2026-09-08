# STORY-595 : Coût restitué en unité mineure et référentiel pays × devise — le XOF n'a aucune décimale

Status: done

**Épic :** EPIC-060 — Mesure de consommation, multi-devise et console d'exploitation
**Service :** `notification-service`
**Points :** 5 · **Sprint :** S43
**Prérequis :** **STORY-579** AC-10 (type `Cout`) · **STORY-570** AC-3 (santé dégradée)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-16, AR-15, AR-19.

---

## Le fait

⛔ **Troisième test de la définition de terminé (AR-19) : l'exactitude du XOF à zéro décimale.** Le
traiter à deux décimales donne des coûts **faux d'un facteur 100** sur le marché principal.

⚠️ **Leçon directement applicable de STORY-489** : le contrat canonique de balance a inventé deux
décimales XOF et les a nommées « unités mineures », alors que l'exposant ISO 4217 du XOF vaut **0**.
Le même défaut ici coûterait davantage, parce que **les coûts sont figés et ne se recalculent pas**.

## Critères d'acceptation

- [x] AC-1 — ⚡ **Le nombre de décimales est lu du référentiel `pays-devises-ao@AAAA.N`, jamais
      présumé** — chargé depuis `platform-catalog-service` par `artifactUri` avec **vérification de
      checksum** (AR-15). Référentiel irrésoluble ⇒ **service dégradé**, jamais un défaut silencieux
      (STORY-570 AC-3 cesse ici d'être théorique).
- [x] AC-2 — ⛔ Test de la définition de terminé : un coût XOF de 25 F se lit **25**, jamais 2 500.
      Le test couvre aussi le GNF (zéro décimale) et une devise à deux décimales.
- [x] AC-3 — Aucun flottant, **aucun coût nu en signature de fonction** : `Cout` est le type unique du
      domaine. Test de présence.
- [x] AC-4 — ⚡ **Jamais d'agrégat inter-devises** : la restitution est **par devise**, sans conversion
      ni total (FR-N57c). *Additionner des XOF et des NGN ne produit aucun nombre qui veuille dire
      quelque chose.* Un test refuse la route qui tenterait le total.
- [x] AC-5 — Le **tarif appliqué** est enregistré avec l'envoi, **pas recalculé à la lecture**
      (FR-N62). Le coût réellement facturé, quand la passerelle le transporte, porte sa `sourceCout`
      (`REEL` ou `BAREME`).

## Notes

- Le calcul de segments est déjà une fonction pure du domaine depuis STORY-574 : cette story le
  consomme, elle ne le réécrit pas.

---

## Ce que la livraison a appris

### ⚡ Le port attendait son adaptateur depuis le scaffold — et `/health` le disait

`REFERENTIEL_PAYS_DEVISES` existe depuis STORY-570 **sans aucun fournisseur** : l'indicateur de santé
répondait « irrésoluble » parce que rien n'était branché, et c'était vrai. Cette story lui donne son
premier adaptateur. ⚡ **L'`@Optional()` posé au scaffold n'a pas bougé d'une ligne** : c'est ce qui a
permis au service de démarrer pendant sept stories sans référentiel **tout en le disant**, plutôt que
de planter au boot ou de faire semblant.

### ⛔ L'intégrité porte sur les OCTETS, jamais sur l'objet analysé

Hasher la structure après lecture reviendrait à **signer notre propre interprétation** : deux
sérialisations différentes du même contenu donneraient la même empreinte, et un artefact tronqué au
milieu d'un tableau passerait pour intact tant que ce qui reste s'analyse. On hashe ce qui est
arrivé, **puis** on analyse — et l'ordre est le contrôle, pas une préférence de style. Un test le
prouve : un artefact **illisible et faux** se plaint de l'empreinte, ce qui démontre que rien n'a été
interprété avant d'être reconnu.

### ⛔⛔ `.gitattributes` fait partie du contrôle d'intégrité

L'artefact est un **fichier**, son empreinte est figée dans le code, et `core.autocrlf=true` est actif
sur les postes Windows de l'équipe. Sans `src/adapters/referentiel/artefacts/*.json -text`, un clone
extrait le fichier en CRLF : ses octets changent, l'empreinte ne correspond plus, le référentiel
devient irrésoluble et **le service se déclare dégradé** — sur le poste d'un collègue, jamais sur
celui qui a écrit le fichier, et sans qu'aucun diff ne montre quoi que ce soit.

⚠️ **`-text` et non `text eol=lf`** : la seule garantie qui compte ici est « les octets extraits sont
les octets commités ». `text eol=lf` normalise, ce qui suffit aujourd'hui ; `-text` refuse toute
conversion, ce qui reste vrai le jour où quelqu'un ajoute un `* text=auto` au dépôt.

### ⛔ Une devise qui déclare deux nombres de décimales fait échouer le chargement ENTIER

Les décimales sont une propriété de la **devise** ; le référentiel, lui, est indexé par **pays**, et le
XOF y apparaît **huit fois**. Choisir la première valeur rencontrée — ou la dernière — ferait dépendre
le facteur cent de l'ordre des lignes d'un fichier : un coût juste au Togo et faux au Bénin, sans
qu'aucune ligne de code ne diffère. Refuser est la seule réponse qui ne mente pas.

⚡ **Corollaire de conception** : c'est pour cette même raison que `decimalesDe(devise)` a rejoint le
port à côté de `resoudre(pays)`. La restitution groupe par **devise** (AD-16) ; sans cette question,
chaque appelant aurait dû retrouver un pays qui emploie la devise — c'est-à-dire **inventer une
correspondance que le référentiel ne donne pas**, et la réinventer à chaque fois.

### ⚡ `resoudre` LÈVE, `verifierResolution` ne lève JAMAIS — deux questions, pas deux styles

`resoudre` est appelée **sur le chemin de l'argent** : sans référentiel, il n'existe pas de réponse
acceptable, et rendre un défaut y serait exactement la faute que tout ce module existe pour empêcher.
`verifierResolution` est appelée par `/health` : elle doit dire **pourquoi** ça ne marche pas, donc
elle ne peut pas lever. ⚠️ Et l'indicateur ne fait pas dépendre sa réponse de cet engagement : il
attrape quand même.

⚡ **Le chargement réussi est mémorisé ; l'ÉCHEC ne l'est pas.** Une empreinte fausse au démarrage se
répare en redéployant l'artefact, sans redémarrer le service ; mémoriser l'échec transformerait un
incident de dix secondes en une panne jusqu'au prochain démarrage.

### ⚠️ Un pays hors zone n'est PAS une panne du référentiel

Les distinguer importe : le premier se répare **en publiant une version**, le second **en ouvrant un
marché**. Un pays absent fait donc lever la résolution — mais `/health` reste **vert**, parce que rien
n'est cassé.

### ⛔ Un montant nu est une signature, pas un stockage — et c'est là que la garde porte

AC-3 a fait remonter **cinq** endroits qui redéclaraient un coût sous forme structurelle
(`{ montantMineur: number; devise: string; source: string }`). Trois étaient des **signatures de
service** : elles acceptaient n'importe quel `number`, y compris un flottant, et rouvraient dans le
code le plus proche de l'écriture exactement ce que le type `Cout` ferme depuis STORY-579. Elles
prennent désormais `Cout`.

⚡ **Les DTO, eux, restent des nombres — et l'inventaire le dit.** Une frontière **sérialise** : un
`Cout` traverse HTTP en JSON, sa forme y est forcément décrite champ par champ, sinon Swagger
documente un `object` vide et le client ignore dans quelle unité il lit. La garde est donc un
**inventaire** de sept fichiers, pas une interdiction — et celui qui en ajoute un huitième doit dire
pourquoi.

⚡ **Un gain non prévu** : `creerCout` remplace l'objet littéral du coût **estimé** d'un envoi de
masse, et contrôle donc la multiplication `tarif × segments × destinataires`. Cinquante mille
messages est exactement le calcul qui sort des entiers sûrs — et un dépassement silencieux
annoncerait un coût faux **avant** que l'envoi parte, c'est-à-dire au seul moment où quelqu'un le lit
pour décider.

### ⛔ AC-4 se garde par une ABSENCE et par un balayage, pas par une revue

Le module de restitution n'exporte **que** deux fonctions, et un test le vérifie : il n'existe pas de
`total()`. Une fonction qui accepterait d'additionner des XOF et des NGN **finirait par être
appelée** — par une console qui veut « un chiffre en haut de page », et le chiffre serait faux sans
que rien ne le dise.

La garde de balayage, elle, refuse tout `$group` qui somme un montant sans porter la devise dans son
corps. ⚠️ **Un `$match` sur une devise en amont ne fait PAS d'un total un total par devise** : il le
restreint à une devise *à cet instant*, et le jour où le filtre s'élargit, le total devient faux sans
qu'une ligne du groupement change. La garde le refuse aussi.

### ⚡ Le coût réel est un FAIT rapporté, jamais un recalcul (AC-5)

AD-16 fige le tarif appliqué **précisément pour qu'aucune lecture ne le refasse**. Ce que la
passerelle transporte n'est pas un calcul : c'est une ligne de sa facture. Les deux cohabitent dans la
même collection, et `source` est la seule chose qui permette de ne pas les confondre.

⛔ **Un coût mal formé fait échouer l'accusé ENTIER ; il n'est jamais ignoré.** L'ignorer laisserait la
ligne garder son barème comme si rien n'avait été transporté — une facture réelle silencieusement
remplacée par une estimation, au seul endroit où l'écart devait se voir. Un accusé refusé, lui, est
réémis par la passerelle et visible tout de suite.

⛔ **La `source` est IMPOSÉE à `REEL`, jamais lue de la charge** : une passerelle qui pourrait écrire
`BAREME` ferait passer une estimation pour une facture.

⛔ **Le PREMIER coût réel gagne, et le filtre `cout.source: 'BAREME'` le tient — pas une vérification
en mémoire.** Deux accusés concurrents franchiraient tous deux un test applicatif ; ici le second
`updateOne` ne trouve simplement plus de document. Un coût qui se réécrirait au fil des accusés
changerait, des semaines plus tard, une consommation déjà restituée. La correction n'est pas perdue :
la charge brute de chaque accusé est conservée telle quelle (AD-4).

⚡ **L'écriture est INDÉPENDANTE de l'avancement du statut.** Une passerelle joint volontiers son prix
à une délivrance déjà connue : la ranger dans la projection de statut aurait fait dépendre
l'enregistrement d'une facture de l'ordre d'arrivée des accusés, c'est-à-dire de rien.

⚠️ **Le double de collection a dû apprendre à honorer le filtre** — même leçon qu'en STORY-594 avec
`champ: null`. Un double qui applique le `$set` sans regarder le filtre aurait rendu **vert** un test
de « le premier gagne » sur un code où le dernier gagne.

### ⚠️ Un test qui touche le disque n'a pas le droit au délai par défaut

Mesuré sous la suite complète (178 suites en parallèle) : une lecture de **neuf cents octets** a
dépassé les 5 s de Jest, alors qu'elle prend quelques millisecondes en isolation. Ce n'est pas un test
lent, c'est un test qui **attend son tour** — et le laisser échouer au hasard aurait appris à l'équipe
à relancer plutôt qu'à lire.

## Points ouverts

- ⛔ **La source d'artefact est EMBARQUÉE, pas HTTP.** L'`artifactUri`, le code, la version et
  l'empreinte viennent du registre — dans le code, jamais de l'environnement — et le port
  `SourceArtefact` isole le transport. Le jour où `platform-catalog-service` sert l'objet, seule
  l'implémentation liée à `SOURCE_ARTEFACT` change ; le contrôle d'intégrité, lui, est indifférent au
  transport. **Ce choix est aussi un choix de disponibilité** : le référentiel est une dépendance de
  santé, et le faire dépendre d'un appel réseau au démarrage ferait dépendre la santé de ce service de
  celle d'un autre — ce qu'AD-18 refuse déjà pour le chemin d'autorisation.
- ⚠️ Aucune restitution HTTP n'existe encore : cette story livre le **référentiel**, le **type** et la
  **règle d'agrégation**. La route arrive avec STORY-596, et la vue plateforme avec STORY-597.
- ⚠️ `pays-devises-ao@2026.1` est **recopié** de `prospera-paiement-service` (quinze pays, six
  devises). Les deux services le vérifient sous **deux conventions d'empreinte différentes** — octets
  bruts ici, signature de champs là-bas. Aucune des deux n'est fausse ; elles ne se comparent
  simplement pas, et c'est à trancher le jour où le catalogue sert réellement l'artefact.
