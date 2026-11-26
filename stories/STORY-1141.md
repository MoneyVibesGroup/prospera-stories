# STORY-1141 : le numéro de compte imprimable sur la facture (Q-D-15)

Status: in-progress

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

## Question au PO

- **Q-D-26 (2026-11-26, STORY-1141) — Un compte `MARCHAND` (ou `PI_SPI`) peut-il porter un numéro imprimable ?**
  Choix par défaut appliqué (D-1141-3) : non ; seuls `BANCAIRE` et `MOBILE_MONEY` en portent un. Si le PO le veut pour
  `MARCHAND` (un identifiant marchand imprimé), c'est une valeur de plus dans une liste du domaine, sans changer le
  contrat ; pour `PI_SPI`, la destination déjà imprimée en tient lieu.

## Où en est-on (pour une reprise après interruption)

- [x] Rituel (passation de B constatée, aucune demande neuve, 325 de C non fusionnée).
- [x] Fiche écrite avant le code (cette PR de docs, qui annonce aussi le contrat et porte le manifeste `paiement` 1.2.0).
- [ ] Code `paiement` (branche `MNV-1141`) puis `ventes` (branche `MNV-1141`).
- [ ] Preuves : unitaires et e2e sous Node 24, `test:schemas` (Karapace), mutations, lint et `tsc` ; pile `grp-d`
  (paiement, ventes, dossier, Kafka, Karapace) sous le verrou.
- [ ] PR de code fusionnées en rebase, `paiement` d'abord.
- [ ] PR de docs finale ; paiement rendu à B (journal de D, « Passations »).
