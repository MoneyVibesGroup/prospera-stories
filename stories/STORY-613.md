# STORY-613 : Seed d'amorçage — Money Vibes prête à encaisser, en une commande

Status: done

**Épic :** EPIC-041 — Abonnements Prospera et entitlements par événement
**Service :** `paiement-service` *(le script vit dans son dépôt, il appelle 3 services)*
**Points :** 3 · **Sprint :** S34
**Prérequis :** aucun — **débloque STORY-606 et tout le cas C**
**Origine :** décision PO du 2026-09-06 · AD-16, FR-P43, NFR-1c, NFR-5.

---

## Le récit

En tant qu'**équipe**, je veux amorcer l'organisation Money Vibes en une commande sur un
environnement de développement ou de recette, afin de tester le cas C sans quatre gestes manuels à
refaire à chaque remise à zéro de la base.

## Le fait

⚡ **Le seed ne CONTOURNE rien : il REJOUE les quatre vraies étapes, par les vraies routes.** Créer
l'organisation à l'annuaire d'identité, déclarer le module de paiement et sa version au catalogue,
déposer puis approuver les pièces de conformité, octroyer le droit d'usage. C'est ce qui le rend
**supprimable sans rien casser** le jour du déploiement réel, et ce qui en fait la **documentation
exécutable** de l'accueil d'une organisation.

⛔ **Il n'écrit JAMAIS directement en base, et c'est le seul piège de cette story.** Une insertion
directe dans `orgkycstatuts` ou `orgpaiemententitlements` sauterait les événements qui **alimentent**
ces read-models. Le seed marcherait, la démonstration passerait, et la production resterait fermée —
avec un écart que rien ne signale, parce que le chemin réel n'aurait **jamais** été exécuté une seule
fois. Un raccourci ici retire précisément la valeur pour laquelle on écrit le seed.

⚠️ **Un seed est un compte administrateur qui s'exécute tout seul.** Il porte des identifiants de
plateforme, il approuve une conformité et il ouvre un droit d'usage. Il doit donc **refuser de
s'exécuter** ailleurs que sur les environnements nommés, et son refus doit être un arrêt franc, pas
un avertissement.

⚡ **Les pièces déposées sont explicitement factices.** Une pièce d'apparence réelle dans un dossier
de conformité approuvé est une pièce que quelqu'un finira par croire. Le nom du fichier et son
contenu disent qu'elle vient du seed.

⚠️ **Rejouable, donc idempotent.** L'organisation existe déjà, le module aussi, le droit aussi : le
seed le constate et passe. Un seed qui ne peut tourner qu'une fois est un seed qu'on n'ose plus
lancer.

## Critères d'acceptation

- [x] AC-1 — Une seule commande amorce les **quatre** étapes et rend un rapport lisible, étape par
      étape, avec ce qui a été fait et ce qui existait déjà.
- [x] AC-2 — ⛔ **Aucune écriture directe en base de données.** Le script n'ouvre aucune connexion
      Mongo ; il n'appelle que des routes HTTP existantes. Garde de balayage sur ses dépendances.
- [x] AC-3 — ⛔ Le script **refuse de s'exécuter** si l'environnement n'est pas nommé parmi ceux
      autorisés. Le refus est un code de sortie non nul, pas un message.
- [x] AC-4 — **Idempotent** : deux exécutions successives rendent le même état final et le second
      rapport dit « déjà en place » sur chaque étape.
- [x] AC-5 — Les pièces de conformité déposées sont **marquées comme factices** dans leur nom et
      leur contenu.
- [x] AC-6 — Après exécution, un test de bout en bout montre Money Vibes **émettant une demande** sur
      son propre compte d'encaissement — c'est la preuve que les read-models ont bien été alimentés
      par les événements, et non par le script.
- [x] AC-7 — Une commande symétrique **retire** ce que le seed a posé, ou le document dit
      explicitement que la remise à zéro se fait par la base de développement.
- [x] AC-8 — Le document du dépôt dit, en une phrase, **ce qu'il faudra faire à la main** en
      production : les mêmes quatre étapes, par les mêmes routes, avec de vraies pièces.

## Notes

⚡ **Ce seed a une seconde vie que personne n'a demandée : il devient le test d'accueil d'un
client.** Les quatre étapes sont celles que traversera chaque cabinet, chaque microfinance et chaque
distributeur. Si elles sont pénibles pour Money Vibes, elles le seront pour eux — et c'est le seul
moment où on s'en aperçoit avant le premier client.

⚠️ **Point ouvert :** le jeton d'administration plateforme dont le script a besoin. Ni en dur, ni
dans le dépôt : une variable d'environnement, absente par défaut, dont l'absence fait échouer le
script au premier appel plutôt qu'au milieu.

⛔ **À la mise en production, cette story se termine par une suppression.** Prévoir la ligne au
moment de la livrer, pas au moment de déployer.

---

## Livré le 2026-09-06 — branche `MNV-613` (`prospera-paiement-service`)

`npm run amorcer` · `src/seeds/` · `docs/AMORCAGE-MONEY-VIBES.md`.
`npm test` 2245/2245 · `npm run test:e2e` 173/173 · lint 0.

⚡ **Ce que la garde AC-2 a coûté de plus que prévu, et pourquoi c'est mieux.** Interdire
`mongoose` dans les fichiers du seed ne prouve rien : il suffirait d'importer un service du
dossier `application/` pour ramener un modèle Mongo, une session et une transaction, sans qu'aucun
`mongoose` n'apparaisse. La garde porte donc sur le **cône de dépendances** — *le seed n'importe
que lui-même* — et sa liste d'imports extérieurs autorisés est **vide**.

⚠️ **Point ouvert PO — la vérification d'adresse.** Le jeton arrive par courriel et le seed ne peut
pas le fabriquer. Il n'a pas été contourné : sans `AMORCAGE_JETON_VERIFICATION`, l'amorçage se
déclare **incomplet** (code de sortie `2`) et les étapes 3 et 4 restent « à faire ». C'est
exactement la seconde vie annoncée dans les Notes — le test d'accueil d'un client. À trancher :
faut-il une route d'administration qui vérifie une adresse, chez `auth-service` ?

⚠️ **Le seed ne nomme jamais `ORGANISATION_PLATEFORME` dans son code.** Il **produit** l'identité,
la configuration la **consomme** (le rapport imprime l'identifiant, le document nomme la variable).
L'inventaire fermé de `organisation-plateforme.invariant.spec.ts` reste à quatre fichiers.
