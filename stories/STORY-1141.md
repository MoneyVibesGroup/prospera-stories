# STORY-1141 : le numéro de compte imprimable sur la facture (Q-D-15)

Status: done

**Plan :** `coordination/PLAN-LOT-7-2026-11-24.md` §4 bis (amendement du 26/11), n° **5d** · **Dépôts :**
`prospera-paiement-service` (à **B**, **prêté à D pour cette story seule** : passation du journal de B, « Passations »,
prospera-stories #936 ; `origin/dev` au départ **`e2be149`**, aucune PR ouverte, checkout du poste sur `dev`, propre) et
`prospera-ventes-service` (D ; `origin/dev` au départ **`bc0f85c`**, module `facturation`) · **Plage :** groupe D,
`STORY-1141` (dernière de la plage 1138 → 1141, réservée le 26/11) · **Dépend de :** STORY-1073 ✅ (le fait
`paiement.compte.changed@1`, sa projection par `facturation`, D-1073-6).
**Sources :** réponse de l'utilisateur du 25/11 à **Q-D-15** (journal de D, « Questions ») : « le DAF déclare avec le
compte un numéro “à imprimer”, non secret et tracé ; `paiement` le publie avec le compte ; la facture et son PDF
l'impriment en entier. Jamais un déchiffrement du coffre. Le choix par défaut de D-1073-6 (l'empreinte visible seule)
reste en service jusqu'à la story qui le fera » ; `stories/STORY-1073.md` (D-1073-6, D-1073-7, D-1073-10, D-1073-12 (1)) ;
STORY-242/243/599 (le compte d'encaissement : titulaire identifié, saisie tracée, identifiant scellé, NFR-1, AD-14) ;
STORY-276 (l'inventaire fermé des écritures d'argent), STORY-650/651 (la surface déléguée et la phrase de chaque acte).
**Code relu avant d'écrire** (paiement `e2be149`) : `domain/comptes/compte-encaissement.ts` (`construireCompte`,
`masquerIdentifiant` : l'empreinte garde les **quatre derniers** caractères de l'identifiant compacté),
`application/comptes/comptes-encaissement.service.ts`, `application/comptes/etat-du-compte.ts`,
`domain/audit/donnees-de-paiement.ts` (**le tamis du journal refuse une valeur qui a la forme d'un téléphone** —
`^\+\d{7,15}$` une fois les séparateurs ôtés — ou d'un numéro de carte : un numéro Mobile Money en clair n'entre pas au
journal), `audit/piste-opposable.invariant.spec.ts`, `domain/envoi/signalement-d-intervention.ts` (+ sa garde),
`modules/comptes/*.controller.ts` (+ le contrat figé des routes du client), `contrat/schemas/paiement.compte.changed.json`.
Ventes `bc0f85c` : `facturation/emetteur/faits-lus.ts` (la lecture **ignore** un champ inconnu : `paiement` peut publier
le champ neuf avant que `ventes` le lise), `emetteur.service.ts` (la projection réécrit l'état entier, `$set`),
`mentions/mentions.ts` (`comptesAImprimer` : `numero` = la destination PI-SPI ou l'empreinte), `pdf/rendu.ts`
(`coordonneesDePaiement` imprime `n° ${numero}`), `factures/factures.service.ts` (`fichesLues`).
**Rituel (2026-11-26, vers 10:30) :** aucune demande neuve à D chez A, B et C ; **← B : passation de paiement pour 1141 —
servie** (#936, constatée : `origin/dev` `e2be149`, aucune PR ouverte, checkout propre) ; 325 de C non fusionnée
(fiscal `origin/dev` `136efdf`) ; ventes : aucune PR ouverte, `origin/dev` `bc0f85c`. Verrou Docker tenu par C
(STORY-324, 09:59).

## « Fini quand » (plan)

« Le DAF déclare avec le compte un numéro “à imprimer”, non secret et tracé ; `paiement` le publie avec le compte ; la
facture et son PDF l'impriment en entier ; jamais un déchiffrement du coffre ; D-1073-6 reste le repli quand rien
n'est déclaré. »

## Ce qui existait déjà

Un compte d'encaissement porte un identifiant **scellé** au coffre (AES-256-GCM, aucun chemin ne le restitue) et son
**empreinte visible** (`••••4521`). Depuis 1073, `paiement.compte.changed@1` publie l'état imprimable du compte à sa
déclaration et à chaque vérification (révision = rang de l'acte au journal chaîné du compte) ; `facturation` le projette
et imprime, pour chaque compte choisi, l'empreinte visible (ou, pour un compte PI-SPI, son numéro de compte chez le
participant, en clair par construction). Aucune donnée « à imprimer » n'existe ; aucun geste ne modifie un compte après
sa déclaration, hors la vérification et la clef de notification.

## Ce qui doit être vrai à la fin

1. **Déclaré avec le compte** : `POST /api/v1/comptes-encaissement` (et la route déléguée de Money Vibes) accepte
   `numeroImprimable`, facultatif ; il est rangé **en clair** sur le compte, à côté du scellé qui ne change pas.
2. **Modifiable après coup, chaque changement tracé** : `PUT /api/v1/comptes-encaissement/{compteId}/numero-imprimable`
   (et sa route déléguée) pose, remplace ou retire (`null`) le numéro d'un compte existant — y compris d'un compte
   déclaré avant cette story. Chaque changement est un acte du journal chaîné du compte (qui, quand, l'empreinte
   SHA-256 de l'avant et de l'après), dans la transaction de l'écriture et de son fait.
3. **Publié avec le compte** : `paiement.compte.changed@1` porte `numeroImprimable` quand il est déclaré (clé absente
   sinon), à la déclaration, à chaque vérification et à chaque changement du numéro ; le schéma reste `@1` (ajout
   facultatif, BACKWARD, prouvé au registre).
4. **Imprimé en entier** : `facturation` le projette ; une facture émise depuis imprime le numéro déclaré, en entier,
   dans ses mentions figées et son PDF ; une facture déjà émise garde le sien (AD-6).
5. **Jamais un déchiffrement** : le numéro ne vient que de la saisie du DAF ; aucun chemin ne lit le scellé pour le
   produire ou le contrôler (le rapprochement se fait avec l'empreinte visible, en clair).
6. **Le repli** : sans numéro déclaré (ou retiré), la facture imprime l'empreinte visible (D-1073-6), et la destination
   d'un compte PI-SPI.

## Décisions retenues par défaut (contestables)

- **D-1141-1 — « Fini quand »** : celui du plan (ci-dessus), précisé par les six points.
- **D-1141-2 — Deux gestes, une seule règle.** Le numéro se déclare **avec** le compte (le plan) et **se change après
  coup** par une route à lui (`PUT …/{compteId}/numero-imprimable`, droit `paiement:compte:administrer`, le même que la
  déclaration). Sans la seconde, un compte déjà déclaré — tous ceux d'aujourd'hui — ne pourrait jamais en recevoir un
  sans être déclaré à nouveau (un second compte, un second scellé), et « tracé » ne s'appliquerait qu'à une première
  saisie. Les deux gestes passent par la même fonction du domaine (`preparerNumeroImprimable`). `PUT`, parce que
  l'appelant pose une valeur : le même numéro reposé ne change rien, n'écrit rien et ne publie rien (200, compte
  inchangé) ; `null` retire le numéro. Le corps exige la clé (`numeroImprimable` absent ⇒ 400) : un corps vide ne
  retire rien par mégarde. La surface déléguée (`admin/organisations/{orgId}/…`, STORY-650) reçoit la même route, son
  acte suffixé `_PAR_MONEY_VIBES` et sa phrase au client (STORY-651).
- **D-1141-3 — Les natures servies : `BANCAIRE` et `MOBILE_MONEY`** (Q-D-26). Un payeur vire sur un RIB ou un IBAN, ou
  transfère sur un numéro Mobile Money : c'est ce que la facture doit dire en entier. Un compte `PI_SPI` imprime déjà sa
  destination en clair (une seconde source du même numéro, refusée) ; un compte `MARCHAND` se paie par un lien de
  paiement, et son identifiant marchand n'est pas une coordonnée qu'un payeur utilise. Refus `422
  COMPTE_NUMERO_IMPRIMABLE_NON_SERVI` (nature `REGLE_METIER`), à la déclaration comme au changement.
- **D-1141-4 — La forme** : la saisie est rangée **normalisée** — espaces de tête et de fin ôtés, suites d'espaces
  réduites à une, majuscules —, et doit être `^\+?[A-Z0-9]+( [A-Z0-9]+)*$` (chiffres et lettres groupés par des
  espaces, un `+` de tête permis), 80 caractères au plus, **4 à 64 sans les espaces** (les bornes de l'identifiant).
  Le DAF écrit le numéro comme il veut le voir imprimé (« TG005 01001 012345678901 21 », « +228 90 12 45 21 ») ; aucune
  autre ponctuation (tirets, points) : ni une seconde forme du même numéro, ni un champ libre. Refus `400
  COMPTE_NUMERO_IMPRIMABLE_INVALIDE`.
- **D-1141-5 — Le numéro imprimé finit comme l'identifiant scellé : le contrôle sans déchiffrement.** Le numéro, sans
  ses espaces, doit **se terminer par les quatre caractères visibles de l'empreinte** (comparés sans casse). C'est le
  seul rapprochement possible sans ouvrir le coffre (point 5), et il ferme les deux fautes qui comptent : la coquille
  (le payeur vire sur un compte qui n'existe pas) et la substitution grossière (un autre compte imprimé sous le
  titulaire et le fournisseur de celui-ci — le changement de RIB est la fraude classique de la facture, D-1073 ; le
  journal fait le reste, D-1141-6). Un identifiant de quatre caractères au plus n'a aucun caractère visible : aucun
  numéro ne peut s'y rapprocher, il est refusé. Refus `422 COMPTE_NUMERO_IMPRIMABLE_DISCORDANT` (le détail nomme le
  champ, jamais une valeur).
- **D-1141-6 — Tracé au journal chaîné du compte, par empreinte, jamais en clair.** Le journal d'audit est
  **ineffaçable** (AD-10) et son tamis refuse, à juste titre, une valeur qui a la forme d'un téléphone (un numéro
  Mobile Money) : le numéro y entre par son **empreinte SHA-256** (hex du numéro normalisé), à la déclaration
  (`empreinteNumeroImprimable`, seulement s'il est déclaré : la forme des entrées d'avant ne change pas) et à chaque
  changement (acte **`COMPTE_ENCAISSEMENT_NUMERO_IMPRIMABLE_DECLARE`** : `compteId`, `empreinteVisible`,
  `empreinteNumeroImprimableAvant`, `empreinteNumeroImprimableApres`, `null` pour « aucun »). Qui et quand sont ceux de
  l'entrée (auteur, acteur délégué nommé, instant). Le clair vit sur le compte (effaçable avec l'organisation), dans le
  fait et sur chaque facture qui l'a figé, avec la révision : une facture se rapproche de l'acte qui a posé son numéro
  (même révision, même empreinte).
- **D-1141-7 — La révision publiée reste le rang de l'acte** (D-1073-6) : le changement du numéro est un acte du compte,
  il publie l'état entier à son rang. Une écriture concurrente du même compte (deux changements simultanés) : la
  seconde trouve un avant qui n'est plus le sien et rend `409 ECRITURE_CONCURRENTE` (rejouable), sans rien écrire.
- **D-1141-8 — Le fait : `numeroImprimable`, propriété facultative** de `paiement.compte.changed@1` (chaîne, même
  motif que D-1141-4), **absente** quand rien n'est déclaré (jamais `null` ni vide, comme D-1073-2), absente toujours
  pour `PI_SPI` et `MARCHAND`. Le topic reste `@1` : ajout facultatif, compatible en BACKWARD (prouvé par
  `test:schemas`, l'ancien schéma enregistré puis le nouveau). Le consommateur garde l'état de plus haute révision :
  une révision sans la clé **retire** le numéro de la projection.
- **D-1141-9 — La facture : le numéro déclaré l'emporte sur l'empreinte, jamais sur la destination PI-SPI** (qui ne
  peut pas en avoir). `CompteImprime.numero` = destination PI-SPI, sinon numéro imprimable, sinon empreinte visible
  (D-1073-6) ; un champ neuf **`origineDuNumero`** (`DESTINATION_PI_SPI` | `NUMERO_IMPRIMABLE` | `EMPREINTE_VISIBLE`)
  dit sur la facture figée lequel a été imprimé (absent d'une facture émise avant 1141, dont le document ne change
  pas). Le PDF n'a rien à apprendre : il imprime `n° ${numero}`. Un fait qui porterait un numéro sur un compte PI-SPI
  est écarté (`NUMERO_IMPRIMABLE_INCOHERENT`), comme une destination incohérente ; un numéro qui n'est pas une chaîne
  non vide, aussi (`NUMERO_IMPRIMABLE_INVALIDE`).
- **D-1141-10 — Les contrats** : manifeste `paiement` **1.1.0 → 1.2.0** à la source (C5 : le fait publié gagne une
  propriété facultative ; une route d'écriture neuve, hors `routesLectureSeule` : en lecture seule, le numéro ne change
  pas) — **→ B** : la recopie au catalogue (`platform-catalog-service`, `copies.json`). Manifeste `facturation`
  inchangé (le topic consommé reste `paiement.compte.changed@1`) ; catalogue des faits du distributeur inchangé (sa
  note dit encore « manifeste paiement 1.1.0 » : une note, aucune garde ne la lit — dit à B).
- **D-1141-11 — Le rejeu des comptes d'avant 1073** (D-1073-10) trouve ici un geste : poser un numéro (ou le reposer
  après l'avoir retiré) republie l'état du compte. Aucune commande de republication n'est écrite pour autant (une
  écriture de plus dans l'inventaire fermé, sans cas d'usage).

## Contrat (annoncé avant le code, « ⚠ Contrats » du journal de D)

- **`paiement`** — `POST /api/v1/comptes-encaissement` et `POST /api/v1/admin/organisations/{orgId}/comptes-encaissement` :
  corps + **`numeroImprimable`** facultatif (chaîne, 4 à 80) ; refus neufs `400 COMPTE_NUMERO_IMPRIMABLE_INVALIDE`,
  `422 COMPTE_NUMERO_IMPRIMABLE_NON_SERVI`, `422 COMPTE_NUMERO_IMPRIMABLE_DISCORDANT`. **Route neuve** `PUT
  /api/v1/comptes-encaissement/{compteId}/numero-imprimable` et `PUT
  /api/v1/admin/organisations/{orgId}/comptes-encaissement/{compteId}/numero-imprimable` : corps `{ numeroImprimable:
  string | null }` (clé exigée, aucune autre), droit `paiement:compte:administrer` (délégué : la porte de STORY-650) ;
  200 la vue du compte ; 404 commun (compte d'autrui, identifiant mal formé) ; les trois refus ci-dessus ; `409
  ECRITURE_CONCURRENTE`. **Vue du compte** (`GET`, `POST`, `PUT …`) : + `numeroImprimable` (absent si rien). **Fait**
  `paiement.compte.changed@1` : + `numeroImprimable` facultatif (D-1141-8), publié aussi au changement du numéro.
  **Journal** : acte neuf `COMPTE_ENCAISSEMENT_NUMERO_IMPRIMABLE_DECLARE` (`…_PAR_MONEY_VIBES` délégué) ; la déclaration
  gagne `empreinteNumeroImprimable` quand un numéro est déclaré. Manifeste `paiement` 1.2.0.
- **`ventes` (`facturation`)** — projection `facturation_comptes_lus` : + `numeroImprimable` (`null` si absent) ; facture
  lue (`mentions.emetteur.comptes[]`) : `numero` peut être le numéro déclaré, en entier ; + **`origineDuNumero`** (sur
  les factures émises depuis 1141). Aucune route, aucun droit, aucun topic neuf ; manifeste `facturation` inchangé.

- **D-1141-12 — Une limite de Karapace, constatée au gate** (comme celle de 965 sur les énumérations) : contre la
  version de 1141, où `numeroImprimable` existe déjà, la rendre **requise** passe pour compatible au registre. Contre
  celle de 1073, où elle n'existe pas, le registre la refuse. `test:schemas` juge donc ce cas contre la version 1. La
  facultativité est gardée par `etat-du-compte.spec.ts`.

## Question au PO

- **Q-D-26 (2026-11-26, STORY-1141) — Un compte `MARCHAND` (ou `PI_SPI`) peut-il porter un numéro imprimable ?**
  Choix par défaut appliqué (D-1141-3) : non ; seuls `BANCAIRE` et `MOBILE_MONEY` en portent un. Si le PO le veut pour
  `MARCHAND` (un identifiant marchand imprimé), c'est une valeur de plus dans une liste du domaine, sans changer le
  contrat ; pour `PI_SPI`, la destination déjà imprimée en tient lieu.

## Où en est-on (pour une reprise après interruption)

- [x] Rituel : la passation de B est constatée, aucune demande neuve n'est arrivée, et 325 de C n'est pas fusionnée.
- [x] Fiche écrite et contrat annoncé avant le code : prospera-stories **#967** (`main` **`6a5d3ab`**), avec le
  manifeste `paiement` 1.2.0.
- [x] `paiement` **#126** fusionnée en rebase (`dev` **`f6a4800`**, **`64b5838`**). L'arbre fusionné est identique au
  commit poussé `83338a1`.
- [x] `ventes` **#17** fusionnée en rebase (`dev` **`dcb5d3b`**). L'arbre fusionné est identique au commit testé
  `3db0431`.
- [x] Verrou Docker pris à 10:51 (une seule prise) et rendu à 11:22 par le `trap` du script autonome. B et C ont été
  prévenus. Il ne reste aucun conteneur, volume ni réseau `grp-d`.
- [x] PR de docs finale. Paiement est rendu à B (journal de D, « Passations »).

## Ce qui a été livré

- **`prospera-paiement-service`** (#126) :
  - `domain/comptes/numero-imprimable.ts` : `preparerNumeroImprimable` (la nature, la forme, le rapprochement avec
    l'empreinte) et `empreinteDuNumeroImprimable`.
  - `construireCompte` prend `numeroImprimable`.
  - `ComptesDEncaissement.declarerLeNumeroImprimable` passe par `EcritureDArgent`, avec un filtre sur l'avant.
  - La déclaration consigne `empreinteNumeroImprimable`.
  - `construireEtatDuCompte` publie le numéro sur une nature servie.
  - Le schéma du compte porte la nature, la forme et la longueur ; la vue du compte, le DTO et le DTO neuf
    `DeclarerNumeroImprimableDto` suivent.
  - Deux routes `PUT …/numero-imprimable` : celle de l'organisation et celle de la surface déléguée.
  - La phrase du signalement au client pour l'acte délégué.
  - `contrat/schemas/paiement.compte.changed.json` gagne la propriété facultative.
  - `test/notifications-webhook.e2e-spec.ts` est recompilé : `publier` prend deux arguments depuis 1073, et la suite
    ne compilait plus.
- **`prospera-ventes-service`** (#17) :
  - `emetteur/faits-lus.ts` lit `numeroImprimable` et écarte un numéro invalide ou incohérent.
  - La projection `facturation_comptes_lus` gagne le champ, et `fichesLues` le relaie.
  - `mentions/mentions.ts` : `numeroImprime` et `origineDuNumero`.
  - Recette `scripts/recette/1141/` (pilote et README), sur la pile de 1073.

## Preuves

| Où | Quoi | Résultat |
|---|---|---|
| paiement, Node 24 (image `verification` de l'archive LF `c668fbb`) | suite unitaire complète ; build | **351/351 suites, 4 776 tests** (2 ignorés) ; OK |
| paiement, Node 24 | e2e | **28/30 suites, 355 tests verts**. Les deux suites rouges, `health` (`admin.listTopics` absent du double, MNV-957) et `notifications-webhook` (`EtatsDeCreance` absent du module de test, MNV-965), **le sont aussi sur `e2be149`**, rejouées dans la même image avec `src` et `test` de `dev`. 1141 ne touche aucune des deux, hormis la recompilation. `comptes-encaissement` et `delegation-comptes` sont verts. |
| paiement, Karapace de la pile | `test:schemas` | **14/14**. Le schéma de 1141 est compatible avec celui de 1073 et s'y enregistre en version 2. Le numéro rendu requis est incompatible avec la version 1 (D-1141-12). Un premier passage, pendant la recette, a rendu 4 rouges transitoires ; les deux passages suivants sont verts. |
| paiement, Node 25 | domaine, comptes, contrôleurs, signalement ; lint des fichiers touchés ; `tsc` | 93/93 suites, 1 602 tests ; 0 ; 0 |
| paiement, mutations | 19 mutations (liste ci-dessous) | **19/19 tuées** sur une assertion ; six ont été réécrites, leur première forme ne compilait pas |
| ventes, Node 24 (image `verification` de l'archive LF `3db0431`) | unitaires ; e2e ; build | **66/66 suites, 720** ; **2/2, 24** ; OK |
| ventes, Node 24, MongoDB réel (jeu de répliques) | intégration | **18/18 suites, 206** (`fiche-legale.int-spec.ts` : le numéro imprimé puis retiré, la facture d'avant qui le garde, une projection d'avant 1141) |
| ventes, Node 25 | facturation ; lint ; `tsc` | 13/13 suites, 212 ; 0 ; 0 |
| ventes, mutations | 8 mutations (liste ci-dessous) | **8/8 tuées** ; une a été réécrite, sa première forme ne compilait pas |
| pile `grp-d` : paiement et ventes (archives de la branche), dossier (`origin/dev` `645a699`), deux MongoDB, Redis, Kafka, Karapace, l'émetteur de jetons | `recette-1141.py` | **38/38**, 0 `UnknownDependencies` dans les journaux de la pile |

**Mutations de paiement (19)** : nature non contrôlée ; rapprochement retiré ; identifiant court accepté ; casse
comparée ; numéro non mis en majuscules ; tiret accepté ; borne de 80 retirée ; `construireCompte` qui ignore le
numéro ; clair au journal à la déclaration ; même numéro réécrit ; avant non reposé en filtre ; avant et après
inversés ; changement non publié ; acte de la déclaration à la place du sien ; fait sans filtre de nature ; `null`
publié ; vue sans le numéro ; schéma sans garde de nature ; DTO qui refuse `null`.

**Mutations de ventes (8)** : forme non contrôlée ; PI-SPI accepté avec un numéro ; numéro jamais lu ; l'empreinte
avant le numéro ; le numéro avant la destination PI-SPI ; numéro vide imprimé ; origine mal nommée ; origine omise.

Ce que la pile établit, sur les vraies routes :
1. Le sujet `paiement.compte.changed-value` porte deux versions, en BACKWARD : celle de 1073, enregistrée d'abord,
   puis celle de 1141.
2. Un numéro discordant est refusé en 422, et le refus ne le recopie pas. Un compte marchand qui porte un numéro est
   refusé en 422 `…_NON_SERVI`. Ni l'un ni l'autre ne publie rien.
3. Un compte Mobile Money déclaré avec « +228 90  12 45 21 » range le numéro normalisé. Le fait de la révision 1 le
   porte et reste valide au schéma relu du registre, et `facturation` le projette. Le journal n'en garde que
   l'empreinte SHA-256.
4. FAC-2026-000001 imprime « Mobile Money — FEDAPAY — n° +228 90 12 45 21 — titulaire : … », d'après le texte du PDF
   lu par `pdfjs`.
5. Le `PUT` écrit un acte de rang 2, avec l'empreinte de l'avant, celle de l'après et l'auteur. La révision 2 est
   projetée. FAC-2026-000002 imprime le nouveau numéro, et le PDF de FAC-2026-000001 ne change pas d'un octet.
6. Reposer le même numéro ne crée ni acte ni fait. Un numéro discordant rend 422 sans rien écrire, et un corps vide
   rend 400.
7. `null` publie la révision 3 sans la clé, et FAC-2026-000003 imprime l'empreinte.
8. L'identifiant scellé (`MM22890124521`) n'apparaît ni sur Kafka, ni dans l'outbox, ni au journal, ni dans les PDF,
   ni dans les journaux des services.
9. Le groupe `ventes-service.emetteur` a un lag de 0, et les trois services sont sains.

## Ce qui reste

- **→ B** : recopier le manifeste `paiement` 1.2.0 au catalogue (`platform-catalog-service`, `copies.json`). La note
  du catalogue des faits du distributeur (`prospera-plateforme`) dit encore « manifeste paiement 1.1.0 » ; aucune
  garde ne la lit.
- **→ A (plus tard)** : l'écran des comptes d'encaissement (le numéro à imprimer, son changement, son retrait).
- Q-D-26 au PO.
