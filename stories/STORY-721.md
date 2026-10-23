# STORY-721 : Frais imputés par moyen de paiement — quand le fournisseur le nomme

Status: done

**Épic :** EPIC-038 · **Service :** `paiement-service` · **Points :** 3 · **Rail :** E3
**Prérequis :** [[STORY-254]] (les tarifs figés par couple fournisseur × moyen), [[STORY-258]] (l'imputation)

## Le fait

`tarifDe` prenait le **premier** tarif figé du fournisseur, « choisi par fournisseur, et non par
méthode » : chez un fournisseur qui offre le mobile money et la carte à deux tarifs, une carte était
imputée au tarif du mobile money. Le commentaire refusait — à raison — de **deviner** le moyen depuis
un code de mode propre au fournisseur.

## Critères d'acceptation

- [x] AC-1 — Une attestation peut nommer le moyen (`methode`) ; **seul l'adaptateur** le nomme, et
      seulement quand il le sait.
- [x] AC-2 — Le tarif se choisit par fournisseur **et** moyen quand le moyen est nommé ; sinon, celui
      du fournisseur (approché s'il en a plusieurs) ; jamais celui d'un autre fournisseur.
- [x] AC-3 — Un moyen nommé sans tarif figé retombe sur le fournisseur, et le journal le dit.
- [x] AC-4 — PI-SPI nomme son moyen (`PI_SPI`, le seul du schéma).
- [ ] AC-5 — ⚠️ **FedaPay** : non fait, voir ci-dessous.

## Mesure (bac à sable FedaPay, 2026-10-23)

| Geste | Réponse |
|---|---|
| Créer une transaction | `200`, `mode: null`, `status: pending` |
| Jeton de paiement | `200` |
| Payer par `POST /v1/mtn` ou `/v1/mtn_open` | `400 « Opération non autorisée »` |
| Relire la transaction | `mode: null` — le champ existe, ses valeurs ne se mesurent qu'une fois payé |

⇒ La correspondance des codes de mode FedaPay vers nos moyens **n'est pas mesurable ici** et n'a
**pas été inventée** : FedaPay reste imputé au tarif du fournisseur, et ses **frais réels**
l'emportent dès qu'il les annonce (`entity.fees`).

## Livraison — 2026-10-23

`MNV-721` (`1286c1b`) sur `origin/dev` (`69a35be`). 4 126 tests unitaires, 40 e2e, lint 0.

## Point ouvert

- Au premier encaissement FedaPay réel ([[STORY-673]]) : relever `entity.mode` dans la notification,
  et poser la correspondance mesurée dans l'adaptateur FedaPay.
