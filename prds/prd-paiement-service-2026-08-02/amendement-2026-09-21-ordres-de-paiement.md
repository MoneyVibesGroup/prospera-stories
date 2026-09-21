# Amendement du 2026-09-21 — les ordres de paiement sortants

**Statut : ✅ VALIDÉ par le PO le 2026-09-21, et APPLIQUÉ à `prd.md`.**

> **Trois décisions du PO, prises le 2026-09-21 :** (1) l'amendement est validé et le code est ouvert
> **en bac à sable** — la confirmation juridique reste un préalable de la PRODUCTION ; (2) les deux
> rôles réemploient la paire de droits de FR-P60 ; (3) des envois réels de **100 XOF au plus** sont
> autorisés sur le bac à sable pour mesurer le contrat.
>
> ⛔ **FR-P68 a été DURCI après validation, par la mesure** : « un échec laisse l'ordre rejouable »
> est devenu « un ordre rejeté est terminal ». Voir la §2bis ci-dessous.
**Date :** 2026-09-21 · **Demandé par :** le PO (objectif du 2026-09-15 : « que les distributeurs
règlent leurs fournisseurs ») · **Débloque :** [[STORY-668]] · **Rédigé pour :** le PO, qui tranche.

---

## 1. Pourquoi un amendement, et pas une story

Le PRD du 2026-08-02 couvre **l'encaissement**. Ses 64 exigences ne mentionnent aucun paiement
*sortant*, FR-P49 exclut tout remboursement, et la §5.2 range « détention de fonds, compte de
transit, séquestre » sous **Interdit par NFR-1**. Ordonner un paiement depuis le compte d'une
organisation est donc une **extension de périmètre** — et elle touche la phrase sur laquelle repose
le régime juridique du produit : *Prospera ne détient jamais les fonds.*

⚡ **Elle est compatible avec NFR-1, à une condition et une seule** : l'ordre part **du compte de
l'organisation, sous ses propres identifiants** ([[STORY-666]]), vers un bénéficiaire qu'**elle**
désigne. Money Vibes n'est ni payeur, ni bénéficiaire, ni intermédiaire de l'argent : elle
transmet un ordre, comme un logiciel de banque à distance. Le jour où un ordre partirait d'un
compte de Money Vibes « pour le compte de », le régime changerait.

⛔ **Ce que le code en dit déjà.** La garde NFR-1b (`detention-de-fonds.invariant.spec.ts`) interdit
les identifiants `payout`, `reversement`, `wallet`, `transit`, `collecte`… partout dans le service.
Elle n'interdit pas `ordre`. Le vocabulaire proposé s'y range : un **ordre de paiement**, jamais un
reversement — ce service ne reverse rien, il n'a rien reçu.

## 2. Ce que le schéma permet — mesuré le 2026-09-21, sans rien envoyer

| Mesure | Résultat |
| --- | --- |
| Route | `POST /paiements-envoyes` (portée `paiement.write`). `/paiements` et `/transferts` n'existent pas. |
| Champs exigés, dans l'ordre où l'API les réclame | `txId`, `payeurAlias`, `payeAlias`, `montant`, `confirmation` |
| Bénéficiaire | **un SHID valide** (« must be a valid SHID ») — donc une adresse de paiement du schéma. **Aucun IBAN ni numéro de compte** dans cette version du bac à sable. |
| `confirmation` | booléen **obligatoire** : le schéma connaît un envoi en deux temps |
| Lecture | `GET /paiements-envoyes` existe (vide) — relevable comme les paiements reçus ([[STORY-669]]) |

⚠️ La sonde s'est arrêtée à la validation du SHID, avec l'UUID nul pour bénéficiaire : **aucun
argent n'a bougé**, et ce que rend un envoi accepté reste à mesurer.

## 2bis. Ce que les envois réels ont mesuré (2026-09-21, 50 puis 10 XOF)

| Mesure | Résultat |
| --- | --- |
| `confirmation: false` | `200 {txId, end2endId, statut: "ENVOYE", payeNom, payePays, dateDemande}` ; quatre secondes plus tard la liste le montre `IRREVOCABLE`, `categorie: "733"`, et la position du compte a baissé **du montant exact** |
| `confirmation: true` | `statut: "INITIE"`, **aucun franc ne bouge** ; le second temps est `PUT /paiements-envoyes/{txId}/confirmations` (corps non mesuré) — **non utilisé** : nos deux rôles sont les nôtres |
| ⛔⛔ **Le même `txId` reposté** | **`HTTP 200`**, avec `statut: "REJETE"`, `statutRaison: "DU03"` et un **nouvel** `end2endId`. Le schéma protège du double envoi — mais un client qui lit le code HTTP croit l'ordre parti, et un client qui lit ce rejet le croit **échoué** |
| ⛔⛔ **`GET /paiements-envoyes/{txId}` après un doublon** | rend **la dernière tentative** (`REJETE/DU03`), **pas celle qui est partie**. Seule la liste `GET /paiements-envoyes?txId=` montre les deux. **L'issue se lit donc dans la liste, et `IRREVOCABLE` gagne sur tout** |

## 3. Texte validé (FR-P68 durci)

### Glossaire (§4) — une entrée

| Terme | Définition |
| --- | --- |
| **Ordre de paiement** | Instruction donnée par une organisation de payer un bénéficiaire **depuis son propre compte, chez son propre établissement**. Prospera le transmet ; il ne l'exécute pas et ne porte jamais l'argent. Jamais « règlement », jamais « reversement ». |

### Périmètre (§5.1) — une ligne ; (§5.2) — une ligne modifiée

- *Dans le périmètre :* **Ordonner un paiement sortant** depuis le compte d'une organisation, vers
  un bénéficiaire désigné par une adresse de paiement du schéma interopérable.
- *Hors périmètre, inchangé et précisé :* l'initiation de **remboursement** (FR-P49) reste exclue.
  Un ordre de paiement n'est pas un remboursement : il ne défait aucun encaissement et ne s'impute
  sur aucune créance de l'organisation.

### Exigences (§6) — cinq

| Id | Exigence |
| --- | --- |
| **FR-P65** | Une organisation peut **préparer un ordre de paiement** : un bénéficiaire (adresse de paiement **confirmée par l'annuaire**, comme l'est déjà celle d'un payeur — STORY-661), un montant, un motif, et le compte de l'organisation qui paie. Un ordre préparé **ne part pas**. |
| **FR-P66** | **Séparation des pouvoirs** (pendant de FR-P60) : préparer un ordre et le **valider** sont deux droits distincts, qui ne se cumulent pas par défaut sur un même rôle — et **la même personne ne valide jamais l'ordre qu'elle a préparé**, quels que soient ses droits. |
| **FR-P67** | Un ordre ne part que **validé**, **une seule fois**, sous le **raccordement de l'organisation** et depuis **un compte dont elle est titulaire**. Aucun repli sur un raccordement de la plateforme ; aucun compte de Money Vibes n'est jamais payeur pour autrui. |
| **FR-P68** | Un ordre porte un **état** que seul le fournisseur fait progresser (transmis, exécuté, rejeté). Un échec laisse l'ordre **rejouable par une nouvelle validation**, jamais renvoyé en silence : un ordre envoyé deux fois est de l'argent parti deux fois. |
| **FR-P69** | Préparation, validation, transmission et issue d'un ordre sont journalisées dans la **piste d'audit append-only** (FR-P61), avec leurs deux auteurs. Un ordre **ne se supprime pas** ; il s'annule tant qu'il n'est pas parti. |

### NFR-1 — une conséquence opposable de plus

- **NFR-1d** — Un ordre de paiement part **exclusivement** du compte d'une organisation, sous ses
  identifiants, vers un tiers qu'elle désigne. Le modèle de données ne comporte **aucun compte
  payeur appartenant à Money Vibes pour le compte d'autrui**, et la garde NFR-1b continue de
  s'appliquer sans exception : ni solde, ni reversement, ni transit.

### Cadre réglementaire (§10) — une ligne, et c'est la plus importante

| Sujet | Position |
| --- | --- |
| **Initiation de paiement** | Prospera **transmet** un ordre donné par le titulaire du compte, avec les identifiants du titulaire, à l'établissement du titulaire. Il ne détient pas les fonds et n'exécute pas l'opération. ⚠️ **[À FAIRE CONFIRMER JURIDIQUEMENT AVANT LA MISE EN PRODUCTION]** : en UEMOA, l'initiation de paiement pour compte de tiers peut relever des services de paiement réglementés (instruction BCEAO sur les services de paiement). Le bac à sable n'engage rien ; la production, si. |

### Risques (§12) — un

| Id | Risque | Parade |
| --- | --- | --- |
| **R-x** | Un ordre part **deux fois** (re-livraison, double clic, reprise après panne) → de l'argent sorti à tort, **sans retour possible par ce service** (FR-P49) | Idempotence par `txId` = identifiant de l'ordre, transition « validé → transmis » **dans le filtre** de l'écriture, et aucun renvoi automatique |

## 4. Ce que le PO doit trancher

1. **Ouvre-t-on ce périmètre ?** Et si oui, **code-t-on avant la confirmation juridique** (bac à
   sable seulement) ou après ?
2. **Quels droits pour les deux rôles ?** Le catalogue de permissions ne sait pas, aujourd'hui,
   attribuer un **nouveau** droit de tenant (voir `catalogue-permissions-plateforme`). Deux droits
   neufs = deux routes que personne ne peut appeler tant que le catalogue n'a pas évolué ; réemployer
   la paire existante de FR-P60 (`…:demande:emettre` pour préparer, `…:encaissement:valider` pour
   valider) est appelable demain matin, au prix d'un nom de droit qui ne dit plus exactement ce
   qu'il ouvre.
3. **Le parcours par IBAN / numéro de compte** : le bac à sable ne l'expose pas (SHID exigé). La
   proposition le laisse **hors** de cet amendement.
