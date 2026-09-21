# STORY-673 : FedaPay contre le réel — un compte marchand ne se vérifie jamais, donc n'encaisse jamais

Status: ready-for-dev

**Épic :** EPIC-036 — Fournisseurs de paiement interchangeables et simultanés
**Service :** `paiement-service`
**Points :** 5 · **Sprint :** ⚠️ **NON SLOTTÉE** — créée par une mesure, le 2026-09-21
**Prérequis :** **STORY-244** (la vérification d'un compte), **STORY-246** (l'adaptateur FedaPay),
**STORY-665** (la clef de notification se dépose après la déclaration)
**Origine :** le **premier appel réel** au bac à sable FedaPay, le 2026-09-21, avec les clés de
bac à sable d'un compte marchand. Jusque-là, FedaPay n'avait été éprouvé que contre des doubles :
la recette de STORY-288 le disait elle-même — le bac à sable exige la clef marchande d'une
organisation, et il n'y en avait pas.

---

## Le fait

`identifierLeCompteMarchand` (STORY-244) pose sa question par `GET /v1/currencies` et **exige** que
la réponse porte un `account_id` : « un `200` sans `account_id` est un ÉCHEC, pas un succès ». La
règle est défendable — la vérification ne veut pas dire « la clef est acceptée », elle veut dire
« le fournisseur **nomme** le compte ».

⛔⛔ **LA VRAIE RÉPONSE N'EN PORTE AUCUN.** Mesuré : sous l'enveloppe `v1/currencies`, une devise
rend `klass, id, name, iso, code, prefix, suffix, div, default, created_at, updated_at, modes` —
et rien qui nomme un compte. `validerCompte` lève donc **toujours**
`REPONSE_FOURNISSEUR_ILLISIBLE`, avec une clef parfaitement valide.

⚡ **Et la chaîne des conséquences est entière.** Un compte qui ne se vérifie pas reste
`NON_VERIFIE` ; un compte non vérifié ne reçoit aucune demande de paiement (STORY-244, AC-3 — le
contrôle vit au seul passage par lequel une clef sort du coffre, il est incontournable, et c'est
voulu). **FedaPay n'a donc jamais pu encaisser de bout en bout**, alors qu'il passe pour livré
depuis STORY-246. Aucun des 3 569 tests unitaires ne pouvait le voir : ils rendent à l'adaptateur
la réponse que sa documentation lui promettait.

⚠️ **Ce n'est pas un champ mal lu, c'est une prémisse fausse.** Sur un compte marchand **neuf**,
**aucun** appel en lecture ne nomme le compte — mesuré, avec une clef secrète de bac à sable :

| Appel | Réponse |
| --- | --- |
| `GET /v1/currencies` | `200`, aucun `account_id` |
| `GET /v1/transactions/search`, `/customers`, `/events`, `/webhooks`, `/logs` | `200`, listes **vides** |
| `GET /v1/transactions` | `400` — « obsolète, utiliser `/v1/transactions/search` » |
| `GET /v1/accounts`, `/v1/api_keys` | `401` — interdits à une clef secrète |
| `GET /v1/payouts` | `403` |

`account_id` n'apparaît que sur des objets nés d'une **écriture** : une transaction, l'événement
qu'elle produit. Or le premier geste d'un marchand est précisément de déclarer son compte — avant
toute transaction.

✅ **Ce qui tient contre le réel**, éprouvé avec le vrai client de l'adaptateur (`api-fedapay.ts`,
pas une imitation) : `creerTransaction` (l'identifiant revient en **nombre** et sort en chaîne,
comme prévu), `demanderUrlDeCheckout` (hôte `sandbox-process.fedapay.com`, en `https`), et
l'enveloppe `v1/<ressource>` que `contenu()` et `liste()` attendent.

## Critères d'acceptation

- [ ] AC-1 — Un compte marchand FedaPay **se vérifie** contre le bac à sable réel, par un appel
      **sans montant et sans effet de bord** chez le fournisseur (AD-14 : une question, jamais une
      transaction symbolique), y compris sur un compte marchand **neuf** — sans transaction, sans
      client, sans webhook.
- [ ] AC-2 — Ce que la vérification consigne comme référence **est vrai** : la phrase « le
      fournisseur nomme le compte » disparaît du code et de ses tests si le fournisseur ne le
      nomme pas. Voir l'arbitrage ci-dessous ; l'option retenue s'écrit dans la fiche **avant** le
      code.
- [ ] AC-3 — Une clef **refusée** par FedaPay laisse le compte `NON_VERIFIE` (jamais
      `NON_VERIFIABLE` : l'indisponibilité et le refus sont des faits du moment, pas une propriété
      du code), avec un refus qui ne recopie ni la clef ni la réponse du fournisseur.
- [ ] AC-4 — ⛔ Les doubles des tests de l'adaptateur rendent désormais la **forme mesurée** de la
      réponse, pas celle que la documentation promettait — et une garde le dit : un test qui
      fabrique un `account_id` dans `/v1/currencies` prouve un fournisseur qui n'existe pas.
- [ ] AC-5 — Recette **réelle, de bout en bout**, par l'API du service et le bac à sable : déclarer
      le compte, le vérifier, poser routage et barème, émettre une demande, ouvrir le checkout
      hébergé et **payer** en bac à sable.
- [ ] AC-6 — Recette réelle de la **notification signée** : webhook créé chez FedaPay sur un
      tunnel, secret déposé par la route de STORY-665, notification `X-FEDAPAY-SIGNATURE` reçue et
      **vérifiée sur le corps brut**, encaissement constaté, demande **Soldée**. C'est la moitié de
      FedaPay qui n'a jamais été vue non plus — et sur PI-SPI, c'est elle qui portait les défauts
      (STORY-660, STORY-665).
- [ ] AC-7 — La route des raccordements (STORY-666) **refuse** FedaPay
      (`RACCORDEMENT_FOURNISSEUR_SANS_OBJET`) et une demande FedaPay s'émet **sans** raccordement :
      vrai aujourd'hui sur des doubles, à prouver sur le service qui tourne.

## ⚠️ L'arbitrage à trancher à l'ouverture — que prouve la vérification d'un compte FedaPay ?

| Option | Effet de bord chez le fournisseur | Ce qu'elle répond |
| --- | --- | --- |
| **A — la clef est acceptée (`200`), et la référence consignée est l'EMPREINTE de la clef** (`masquerIdentifiant`) | aucun : une pure question | « la même **clef** ? », plus « le même **compte** ? » |
| B — lire `account_id` dans `events` ou `transactions/search` quand il y en a | aucun — mais ces réponses portent des **montants** | rien sur un compte neuf ; et STORY-244 a refusé `balances` pour cette raison exacte : *entre deux appels qui prouvent la même chose, on prend celui qui apprend le moins* |
| C — créer un client (`POST /v1/customers`, sans montant) pour lire son `account_id` | **un client fantôme chez le marchand à chaque vérification** | le compte — mais ce n'est plus une question, c'est une écriture |

⚡ **Recommandation : A.** Le précédent est dans le dépôt, mot pour mot : l'adaptateur du schéma
interopérable consigne l'**empreinte** de l'adresse de paiement, parce que « quand la référence du
compte chez le fournisseur *est* le secret, on consigne son empreinte, jamais lui » (STORY-600). Le
prix est connu et il s'écrit : une **rotation de clef sur le même compte marchand** se lira comme
une autre référence — ce qui est acceptable, puisque déposer une nouvelle clef est déjà un acte
tracé au journal chaîné, et qu'une référence qui change **avec** un acte tracé n'apprend rien de
faux à personne.

## Ce que cette story ne fait pas

- Elle **ne touche pas** le schéma interopérable : sa vérification passe par l'annuaire et tient
  contre le réel depuis STORY-661.
- Elle **ne rend pas** le barème FedaPay administrable, ni n'ouvre un mode `API_DIRECTE` : le
  checkout reste hébergé.
- Elle **n'ouvre aucun écran** : la console est STORY-286.

## Notes

- ⚠️ **Les clés de bac à sable** vivent dans le `.env` de la **racine** du monorepo (non versionné,
  hors de tout dépôt), sous `RECETTE_FEDAPAY_SECRET_KEY` et `RECETTE_FEDAPAY_PUBLIC_KEY`. Ce sont des
  noms de **recette** : aucun service ne les lit, et il ne doit pas — la clef marchande d'une
  organisation entre par `POST /v1/comptes-encaissement`, scellée au coffre (STORY-243, STORY-246).
  ⛔ Elles ont été transmises en clair dans une conversation : à **régénérer** dans le tableau de
  bord FedaPay avant la recette, puis remplacer les deux valeurs.
- ⚠️ La recette a laissé une transaction `pending` de 100 XOF (n° 510709) dans le bac à sable : sans
  conséquence, et utile — c'est elle qui a montré où `account_id` apparaît.
- ⚡ **Outillage de la sonde**, pour qui reprendra : le vrai client de l'adaptateur se lance hors
  du dépôt par `npx ts-node --transpile-only -P tsconfig.json <script>` (sans `-P`, `TS5109`), et
  n'imprime que des **formes** — noms de champs et types, jamais une valeur.
- ⚠️ **Leçon à garder, et ce n'est pas la première fois** : un fournisseur « livré » sur la foi de
  sa documentation n'est pas livré. PI-SPI l'a montré cinq fois entre le 9 et le 20 septembre
  (chemin `/TGD999`, date limite obligatoire, signature de la documentation fausse, secret absent
  de `GET /webhooks/{id}`, enveloppe d'observation qui ne déléguait pas) ; FedaPay le montre au
  premier appel. **La recette réelle d'un adaptateur appartient à la story qui le livre.**
- Voir [[STORY-244]] (la vérification, et pourquoi `currencies` plutôt que `balances`),
  [[STORY-246]] (l'adaptateur, la clef marchande par organisation), [[STORY-256]] (la signature
  FedaPay sur le corps brut), [[STORY-600]] (le précédent de l'empreinte), [[STORY-665]] (le dépôt
  de la clef de notification), [[STORY-666]] (FedaPay n'attend aucun raccordement).
