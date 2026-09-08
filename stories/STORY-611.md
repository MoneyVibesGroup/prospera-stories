# STORY-611 : Les sept modèles de compte, livrés avec le code

Status: done

**Épic :** EPIC-055 — Modèles, rendu et formes par canal
**Service :** `notification-service`
**Points :** 5 · **Sprint :** S35
**Prérequis :** **STORY-604** (passerelle par organisation)
**Origine :** revue d'architecture du 2026-09-06 · AD-8, FR-N24. **Bloque STORY-610.**

---

## Le récit

En tant que **nouvel utilisateur**, je veux recevoir un message de vérification même si mon
organisation n'a jamais rien configuré, afin de pouvoir simplement créer mon compte.

## Le fait

⚡ **Un modèle de compte n'est pas un modèle d'organisation, et la différence est une question
d'ANTÉRIORITÉ.** Les modèles ordinaires sont écrits par une organisation, dans sa base, après son
inscription. Ces sept-là doivent exister **avant que quiconque ait rien fait** — sinon la toute
première inscription de la plateforme n'a aucun message à envoyer. Ils sont donc **livrés avec le
code**, comme la page de désabonnement de `STORY-583` et pour la même raison.

⛔ **Une organisation peut habiller ces messages, jamais les supprimer.** Un client qui pourrait
retirer le message de réinitialisation de mot de passe fermerait à ses propres utilisateurs le seul
chemin de récupération d'un compte. La surcharge porte sur la **marque et le libellé**, pas sur
l'existence.

⚡ **La nature naît du point d'entrée.** Ces sept messages sont transactionnels parce qu'ils entrent
par le cas d'usage transactionnel, pas parce qu'un champ le dit. `nature-jamais-en-entree.spec.ts`
tient déjà cette règle, et elle vaut ici plus qu'ailleurs : un code de vérification rangé en masse
partirait derrière une campagne de cinquante mille destinataires.

⚠️ **Les textes ne se réécrivent pas de mémoire.** Ils existent en Handlebars dans `auth-service` et
sont en production. Les transcrire mot pour mot est le seul moyen de ne pas changer le contenu d'un
message légal en changeant son transport.

## Critères d'acceptation

- [x] AC-1 — **Sept modèles système** existent, livrés avec le code et **versionnés** : vérification,
      invitation, confirmation de changement d'adresse, alerte de changement, alerte d'adresse déjà
      prise, réinitialisation, confirmation de réinitialisation.
- [x] AC-2 — Ils sont disponibles pour **toute** organisation **sans écriture préalable**, y compris
      pour une organisation créée à la seconde précédente.
- [x] AC-3 — ⛔ Une organisation peut **surcharger la marque et le libellé**, elle ne peut pas
      **retirer** un modèle système. Test de refus explicite.
- [x] AC-4 — La nature est **transactionnelle par construction** ; aucun corps d'entrée ne la porte,
      et le désabonnement ne les atteint pas.
- [x] AC-5 — Le rendu est prouvé sur les **deux canaux servis** aujourd'hui, e-mail et in-app, avec
      la forme propre à chacun (`forme-par-canal.ts`).
- [x] AC-6 — Les textes sont **transcrits** des gabarits Handlebars d'`auth-service`, et un test
      compare les variables attendues de chaque modèle à celles que l'appelant fournira.
- [x] AC-7 — ⛔ Un modèle système dont une variable manque **refuse le rendu** au lieu de laisser
      passer un marqueur non substitué. *Un `{{lien}}` affiché tel quel dans un e-mail de
      réinitialisation est un compte perdu.*

## Notes

⚠️ **Le moteur de gabarits.** AD-8 réserve le moteur système aux mises en page livrées avec le code,
distinct de celui des modèles de base. Ces sept modèles relèvent du **système**. Ne pas ouvrir le
moteur de base à du HTML à cette occasion : ce serait une seconde story, non demandée.

⚡ Livrée avant `STORY-610`, cette story est **inerte et sans risque** : les modèles existent, rien ne
les appelle encore.

---

## Ce que la livraison a appris (2026-09-07)

**Branche :** `MNV-611`, empilée sur `MNV-616`.

### ⚡ Le contrat de variables et le texte sont DEUX déclarations, et c'est ce qui leur donne le droit de se contredire

`VARIABLES_ATTENDUES` est écrit en face des gabarits, jamais dérivé d'eux. Un test qui aurait lu
le contrat *dans* le texte aurait dit « le modèle demande ce que le modèle demande » : vert quoi
qu'il arrive, y compris le jour où quelqu'un retire `{{lien}}` d'un message de réinitialisation.
Ce sont les **déclarations du catalogue** qui se dérivent du contrat, et non l'inverse — donc un
nom absent du contrat rend le texte qui l'emploie irrecevable, **au démarrage**.

### ⚡ Le critère qui décide du canal se lisait tout seul : le LIEN

Quatre des sept messages portent un lien à ouvrir. Leur destinataire est, par construction,
quelqu'un qui **ne peut pas se connecter** — il n'a pas vérifié son adresse, n'a pas encore de mot
de passe, ou vient précisément de le perdre. Une cloche in-app lui serait invisible. Les trois
autres sont des constats adressés à un titulaire en exercice : eux peuvent sonner.

⛔ **Mais l'implication ne vaut que dans un sens, et c'est le test qui l'a dit.** La première
version écrivait l'équivalence : *pas de lien ⇔ servi en cloche*. Elle a rougi sur
`alerte-adresse-deja-prise`, qui ne porte aucun lien et n'est pourtant pas une cloche — son
destinataire est une **adresse**, pas une personne connue de nous. Sonner chez quelqu'un aurait
supposé de rattacher l'adresse à un compte, c'est-à-dire de **confirmer l'existence de ce compte
par le seul fait de la cloche**. Garder le vert en ajoutant le doublet aurait ouvert une
énumération.

### ⚡ Ce qui rend un message prioritaire n'est pas qu'il soit système : c'est un lien qui expire en MINUTES

`CLES_SENSIBLES_AU_TEMPS` gagne `confirmation-changement-email` et **elle seule** parmi les
nouvelles. L'invitation porte un lien elle aussi — il vit soixante-douze heures. La ranger en file
prioritaire aurait mis une campagne de recrutement devant un code que quelqu'un attend, écran
allumé.

### ⛔ AC-3 : la question n'est pas « ce document est-il système ? », mais « ce filtre peut-il en atteindre un ? »

Une suppression par requête s'exécute **sans jamais charger ce qu'elle efface**. Un
`deleteMany({ cle })` bien intentionné aurait emporté les sept modèles de compte de toute la
plateforme sans qu'une seule ligne de code ait prononcé leur nom. La garde juge donc le **filtre**,
et son critère est une **présence** : il faut nommer une organisation. Le critère inverse — « le
filtre ne dit pas `systeme: true` » — aurait laissé passer tout filtre muet, c'est-à-dire
exactement le cas dangereux. ⚠️ Et la même règle vit sur le document (`document.deleteOne()`),
qui ne passe pas par la garde de requête : un seul des deux chemins protégé aurait donné une règle
vraie à moitié.

### ⛔ AC-4 tient à la PORTE de la masse, pas plus loin sur la chaîne

Un modèle de compte demandé en campagne partirait derrière cinquante mille destinataires, dans la
file la plus lente, avec un lien de désabonnement apposé au bas d'un message que personne ne peut
refuser. Le refus (`CLE_SYSTEME_HORS_MASSE`) est posé **avant** la lecture de la liste : plus loin,
l'instantané est déjà pris. Et la clé se **normalise avant** d'être confrontée à l'inventaire,
sans quoi `  Verification-Email ` rouvrait le chemin que la story ferme.

### ⚡ DEUX gardes existantes ont rougi, et elles n'appellent pas le même remède

**`langue-est-une-donnee.spec.ts` (STORY-576) a rougi sur `LANGUES_SOCLE = ['fr', 'en']`.** Elle
refuse toute énumération de codes de langue dans le code, parce qu'une liste écrite quelque part
devient, au premier ajout, la liste des langues que le service **accepte**. Elle avait raison, et
le remède a rendu la règle **plus forte** : les langues du socle se **dérivent** du catalogue, et
ce qui est vérifié n'est plus « fr et en sont là » mais **« toutes les clés servent les mêmes
langues »**. La garde ne connaît aucun code de langue, et la règle ne peut plus s'endormir — un
test vérifie d'ailleurs que le catalogue en sert plus d'une, sans quoi la règle serait vide.

### ⚠️ Une garde existante a rougi sur le test qui la sert — et le remède était de NOMMER

`socle-hors-http.spec.ts` balaye tout le service à la recherche de `organizationId: null` écrit en
toutes lettres. Elle a rougi sur le test qui prouve précisément qu'on protège le socle. Elle avait
raison : le remède n'est pas de la diluer d'une exception de plus, c'est d'exporter
`PROPRIETAIRE_DU_SOCLE` et de cesser d'épeler une nullité que le domaine sait nommer.

### ⛔ Points ouverts légués

1. **La marque reste littérale** (`Prospera` en fin de texte) : STORY-617 la sort des dix-huit
   entrées. Le catalogue changeant, `appliquerSocle` publiera alors une version corrigée — c'est
   le chemin normal, et il est déjà éprouvé.
2. **Aucun appelant** : `auth-service` n'émet toujours pas vers ce service (STORY-610). La story
   est donc **inerte** — les modèles existent, rien ne les appelle. C'était l'intention.
3. **Les textes anglais sont des traductions, pas des transcriptions** : `auth-service` n'a que du
   français. Ils sont exigés par la garde de cohérence parce qu'aucun repli de langue n'existe
   (STORY-576) — une clé servie en `fr` seul refuserait l'envoi en `en`.
