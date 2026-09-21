# STORY-667 : Le QR imprimé d'un point de vente — le paiement spontané trouve sa créance

Status: review

**Épic :** EPIC-036 — Fournisseurs de paiement interchangeables et simultanés
**Service :** `paiement-service`
**Points :** 3 · **Sprint :** ⚠️ **NON SLOTTÉE** — `PLAN-PI-SPI-CAS-D-USAGE-2026-09-15`, phase B
**Prérequis :** **STORY-664** (le QR qu'on présente, et la mesure « la référence traverse »),
**STORY-666** (le raccordement par organisation), **STORY-271** (les encaissements en attente
d'affectation)
**Origine :** le parcours « QR Code imprimé réutilisable » du catalogue PI-SPI. Un distributeur colle
une affiche à son comptoir ; le client scanne, saisit le montant, paie. **Aucune demande n'existe** :
c'est le seul parcours du plan où l'argent arrive avant que le service sache pourquoi.

---

## Le fait

Le service sait déjà ranger un paiement sans demande : il devient un **encaissement en attente
d'affectation** ([[STORY-271]], FR-P39) — ni rejeté, ni rattaché d'office. Et il sait déjà former un
QR du schéma ([[STORY-655]]) et le présenter ([[STORY-664]]). Il manquerait donc « juste » un QR
**statique** : canal `000`, pas de montant, une référence qui dit d'où vient l'argent.

⛔⛔ **CE « JUSTE » AVALERAIT LE DEUXIÈME CLIENT DE LA JOURNÉE, EN SILENCE.** STORY-664 a mesuré que
le schéma **reprend le champ de référence du QR comme `txId`** du `PAIEMENT_RECU`, et STORY-665 que
l'événement ne porte **aucun `end2endId`**. La clef d'unicité d'un événement se dérive donc de
`PAIEMENT_RECU:<txId>`. Sur un QR dynamique, c'est une chance : la référence est la demande, le
rapprochement est automatique. Sur un QR **réutilisable**, c'est un piège : **tous** les paiements
d'une affiche reviennent avec le **même** `txId`, donc la **même** clef — le premier est rangé, et
chacun des suivants est écarté comme un **rejeu**, avec un `204`, sans une ligne d'erreur. Les deux
barrières d'idempotence de STORY-257 feraient exactement leur travail, contre nous.

⚡ **Ce qui distingue deux paiements d'une même affiche, c'est l'instant.** L'événement d'un paiement
par QR porte `evDate` (mesuré en STORY-664, là où une demande poussée n'en porte pas). Une
re-livraison du même événement porte le même instant ; deux clients, deux instants. La clef d'un
paiement spontané de point de vente se dérive donc de la référence **et** de l'instant — et
**seulement** là : une demande garde sa clef, celle que la consultation de [[STORY-670]] sait
recomposer.

⚠️ **« Trouve sa créance » ne veut pas dire « se rattache tout seul ».** FR-P39 l'interdit, et il a
raison : un montant égal n'est pas une preuve. Ce que le point de vente apporte est la
**provenance** : l'encaissement en attente dit **à quel comptoir** l'argent est arrivé, la liste se
filtre par point de vente, et la personne qui affecte sait où chercher la créance. Le geste
d'affectation, son motif obligatoire et son auteur restent ceux de STORY-271.

## Critères d'acceptation

- [x] AC-1 — Une organisation déclare un **point de vente** : un libellé et le compte d'encaissement
      qui reçoit. Droit `paiement:compte:administrer` (il gouverne « où l'argent d'une organisation
      arrive », FR-P59 — une affiche **publie** cette destination), gate d'AD-16, trace au journal
      chaîné. Le compte doit être à elle, ouvert chez un fournisseur qui **sait** former un QR
      réutilisable, et **vérifié**.
- [x] AC-2 — `GET /v1/points-de-vente/:id/qr-interoperable` rend la charge utile et son dessin :
      canal **statique**, **aucun montant** (le payeur le saisit), et pour référence **l'identifiant
      du point de vente**. Méthode **facultative** du port : son absence ferme le canal, elle ne
      l'ajourne pas. Le participant du raccordement et celui du compte doivent concorder
      ([[STORY-666]], AC-6) ; une organisation sans raccordement n'imprime rien.
- [x] AC-3 — ⛔⛔ **DEUX PAIEMENTS SUR LA MÊME AFFICHE SONT DEUX ENCAISSEMENTS.** Quand la référence
      d'un `PAIEMENT_RECU` désigne un point de vente, la clef d'unicité porte **aussi l'instant** de
      l'événement : le second client n'est pas un rejeu. La **re-livraison** du même événement, elle,
      reste écartée (même instant, même clef). ⚠️ La clef d'une **demande** ne change pas.
- [x] AC-4 — ⛔ **Sans instant, on ne devine pas.** Un événement de point de vente qui ne porte aucune
      date ne peut pas être distingué du précédent : le premier est rangé comme aujourd'hui, et la
      collision est **journalisée en erreur** avec sa cause — « rejeu ou second paiement,
      indiscernable » — jamais avalée en `debug`.
- [x] AC-5 — L'encaissement en attente **porte son point de vente** : la liste de STORY-271 le rend
      et se **filtre** par lui. **Aucun rattachement d'office** (FR-P39) : l'affectation reste le
      geste de STORY-271, motif et auteur compris.
- [x] AC-6 — La référence d'une **autre** organisation ne désigne rien : le point de vente se cherche
      **dans l'organisation du compte qui a reçu la notification** (AD-16), et un paiement dont la
      référence ne désigne ni demande ni point de vente reste l'orphelin simple qu'il était.
- [ ] AC-7 — **MESURE réelle** sur le bac à sable : un QR statique scanné et payé **deux fois**. Ce
      que porte `txId`, si `evDate` est présent, et si les deux paiements produisent deux
      encaissements en attente sous le même point de vente. La story ne suppose pas, elle mesure.

## Ce que cette story ne fait pas

- Elle **ne rattache rien d'office** et ne propose aucune créance : FR-P39.
- Elle **ne ferme pas** un point de vente. Une affiche imprimée ne se rappelle pas : l'adresse
  qu'elle porte reste payable, et l'argent qui y arrive doit continuer de dire d'où il vient. Fermer
  ne pourrait être que cosmétique — ce sera un écran ([[STORY-286]]), pas une règle.
- Elle **ne touche pas** à la clef d'un paiement de **demande**. Un QR dynamique scanné **deux
  fois** a le même défaut de naissance (même `txId`) ; le remède appartient à l'unification des
  clefs nommée par [[STORY-665]] (id ≥ 674 — 673 est pris par FedaPay), et il est porté ici comme point ouvert.
- Elle **n'ouvre aucun écran** et n'imprime aucune affiche : elle rend un SVG.

## Livraison (2026-09-21 — branche `MNV-667`, commit `a9103a1`, sur `origin/dev` à `8b45a74`)

**Suites :** 3 633 unitaires (271 suites), 295 e2e, lint 0, `tsc` 0. **Recette Docker sur le
vrai conteneur : 21/21** (vrai Mongo, vrai coffre, vrai journal, vraie route publique de
notification ; le participant est joué — voir AC-7).

⚠️ **AC-7 RESTE OUVERT, ET IL NE PEUT PAS SE FERMER SANS UN TÉLÉPHONE.** La recette signe elle-même
ses webhooks, sous la forme que [[STORY-664]] a **mesurée** pour un code dynamique. Ce que le schéma
envoie pour un code **statique** n'a pas été vu : il faut scanner l'affiche **deux fois** dans
l'application du bac à sable, par le tunnel. Trois questions, dans l'ordre où elles coûtent :

1. `txId` est-il bien la référence du lieu ? S'il est **absent**, l'événement entier est refusé
   (« ni identifiant de bout en bout ni référence ») et le participant rejouera sans fin — il faudra
   alors une clef de repli dans l'adaptateur. S'il est **autre chose**, le paiement arrive orphelin
   simple : rien n'est perdu, mais la provenance l'est.
2. `evDate` est-il présent sur ce canal ? Sinon on retombe dans AC-4 : le deuxième client est
   journalisé en `error`, pas rangé.
3. `evDate` est-il **stable d'une re-livraison à l'autre** ? C'est l'hypothèse sur laquelle AC-3
   repose. S'il changeait, un rejeu compterait deux fois — à mesurer en coupant le tunnel pendant
   un paiement.

### Ce qui a été construit

- `POST` / `GET /v1/points-de-vente`, `GET /v1/points-de-vente/:id/qr-interoperable` (droit
  `paiement:compte:administrer` sur les trois : le code rendu contient l'adresse de paiement en
  clair). Collection `points_de_vente` ; **`_id` EST la référence imprimée** (24 caractères, le
  champ du code en admet 25). Ni `PUT`, ni `DELETE`, ni méthode de registre qui modifie : **une
  affiche ne se rappelle pas**.
- Méthode facultative du port `construireUnQrReutilisable?` : canal statique `000`, **aucun
  montant** (le type ne l'admet pas), la référence du lieu. Déléguée par l'enveloppe **sans
  `suivre`** et conditionnée à la présence ; le registre en dérive `saitFormerUnQrReutilisable()`,
  demandé **à la déclaration** pour qu'aucun point de vente ne soit rangé sur un compte dont aucune
  affiche ne sortira.
- La déclaration se trace sur **la chaîne du COMPTE** (`POINT_DE_VENTE_DECLARE`, maillon 11 en
  recette) : c'est sa vie qu'on suit — déclaré, désigné, vérifié, puis publié sur une affiche. Aucun
  type de chaîne nouveau.
- `attestationAuPointDeVente` (domaine) : rend l'événement unique **avant** qu'il entre dans la
  boîte de réception. Les deux barrières de [[STORY-257]] en dérivent sans savoir pourquoi :
  pièce `API_BUSINESS|PAIEMENT_RECU:<lieu>:<instant>`, orphelin `PSP|API_BUSINESS|PAIEMENT_RECU:
  <lieu>:<instant>`.
- `pointDeVenteId` sur l'encaissement en attente (dans le `$setOnInsert` : un fait de l'arrivée),
  rendu par la liste et **filtre** de celle-ci ; index **partiel** sur l'existence du champ.

### Ce que la story a tranché, et qu'il ne faut pas refaire

- ⚡⚡ **LA RÈGLE VIT DANS LE CAS D'USAGE, PAS DANS L'ADAPTATEUR.** L'adaptateur est pur : il ne
  peut pas savoir qu'une référence désigne un lieu plutôt qu'une demande. Et discriminer **tous**
  les événements datés aurait changé la clef des demandes payées par QR — celle que la consultation
  de [[STORY-670]] doit pouvoir recomposer.
- ⚡ **Seulement quand la clef repose sur NOTRE référence.** Si le fournisseur donne son
  identifiant de transaction, l'unicité est la sienne ; y ajouter l'instant ferait deux clefs pour
  un paiement vu par deux chemins (leçon de [[STORY-665]]).
- ⛔ **L'heure de RÉCEPTION n'entre jamais dans une clef.** Elle distinguerait deux clients — et
  aussi deux livraisons du même. Un encaissement compté deux fois n'est pas un moindre mal qu'un
  encaissement perdu : sans instant, on **dit** qu'on ne sait pas (`error`), on ne devine pas.
- ⚡ **La demande est cherchée AVANT le point de vente** : les deux références sont de la même
  espèce, et le chemin des demandes — tout le parc — ne paie aucune lecture de plus.
- ⚡ Le compte de l'orphelin reste **celui dont la clef a authentifié la pièce**, pas celui du
  point de vente : un webhook est « général » chez le schéma ([[STORY-665]]), et la référence d'un
  code est un libellé que n'importe qui peut recopier.
- ⚡ Un paiement de comptoir part en `log`, pas en `error` : ce n'est pas une anomalie, c'est le
  parcours. `error` reste réservé à l'orphelin que personne n'attendait — et à AC-4.

### Pièges payés

- ⛔⛔ **LA GARDE DE CÂBLAGE A ROUGI À SA PREMIÈRE EXÉCUTION, ET ELLE AVAIT RAISON.** Le module
  tenait `EncaissementsModule` et `ComptesModule` pour globaux : un `grep` de `@Global` avait
  accroché **deux commentaires**. Le conteneur serait mort au démarrage
  (`UnknownDependenciesException`), invisible aux 3 600 tests. La garde de [[STORY-664]] avouait ne
  pas voir « un module qui oublie d'en importer un autre » : celle-ci le voit — elle confronte les
  **classes** que les providers injectent (`design:paramtypes`) à ce que les imports et les modules
  `@Global()` **exportent**. ⚠️ À reprendre sur les autres modules.
- ⛔⛔ **`{ champ: null }` S'ACCORDE AUSSI AVEC L'ABSENCE DU CHAMP.** Le filtre « ce comptoir-là »
  rendait, sur un identifiant mal formé, **tous les orphelins qui n'ont pas de comptoir** — le
  contraire de ce que son commentaire affirmait. `{ $in: [] }` ne s'accorde avec rien. Le test que
  j'avais écrit asservissait le défaut (`toHaveProperty(..., null)`) : il a été retourné.
- ⛔ Le double de la boîte de réception des specs existants répond toujours « rangé » : AC-3 y
  serait **vert sans une ligne de production**. La suite du comptoir a ses propres doubles, qui
  dédoublonnent par clef — et une contre-preuve qui montre que, sans la règle, les deux clients
  ont la même clef.
- ⚠️ Un heredoc bash a encore cassé sur un bloc long ; le générateur de barrels de l'IDE a reposé
  ses `index.ts` une douzaine de fois (purge avant chaque `tsc`/`jest`/build).

### ⚠️ Points ouverts pour le PO

1. **AC-7** — le scan réel (ci-dessus). L'affiche de Money Vibes est prête dans le volume Docker
   (point de vente `6ab09cc2d75e710b7b300549`).
2. **UN QR DYNAMIQUE SCANNÉ DEUX FOIS A LE MÊME DÉFAUT DE NAISSANCE.** Même `txId`, donc même
   clef : le second paiement d'une demande est écarté comme un rejeu, alors que ce serait un
   trop-perçu à constater. Hors périmètre ici — sa clef doit rester recomposable par la
   consultation — et à instruire avec l'unification des clefs (id ≥ 674).
3. **La provenance s'arrête à la liste.** Aucune proposition de créance, aucun rapprochement par
   montant : c'est FR-P39. Si le PO veut qu'un comptoir « propose » ses créances ouvertes, c'est
   un amendement du PRD, pas un réglage.
4. **Aucune fermeture.** Un point de vente ne se retire pas, par construction. Un écran pourra le
   masquer ([[STORY-286]]) ; il continuera de recevoir.

## Notes

- Voir [[STORY-655]] (la charge utile, les trois canaux), [[STORY-664]] (la mesure : la référence
  du QR revient comme `txId`, avec `evDate`), [[STORY-665]] (aucun `end2endId` sur le webhook),
  [[STORY-666]] (le raccordement), [[STORY-271]] (l'attente d'affectation), [[STORY-257]] (les deux
  barrières d'idempotence).
