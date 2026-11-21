# STORY-1108 : Les conditions préalables à lever et le décaissement

Status: ready-for-dev — **créée le 2026-11-21** à la demande de l'utilisateur, après validation de la maquette de FE-140
(PR #741). Non slottée : à placer au prochain plan.

**Service :** `prospera-bilan-service`, module `financement` · **Points :** 3
**Dépend de :** STORY-1107 (le suivi et l'offre retenue), STORY-1104 (le contrat des documents).
**Débloque :** FE-155.
**Écran :** FE-155 (étape 7 « Le suivi », fin du parcours).
**Suite :** aucune dans ce parcours.

---

## Pourquoi

Une banque qui accorde un prêt ne verse pas l'argent tout de suite : l'offre est assortie de **conditions préalables** (l'apport
est versé sur le compte, le gage est enregistré, les assurances sont souscrites). Tant qu'une condition reste ouverte, le
décaissement ne peut pas avoir lieu. Le cabinet suit chacune, y joint la pièce qui le prouve, puis note le décaissement : sa date,
son montant, et la première échéance du client.

## Ce qui est attendu

1. **Les conditions de l'offre retenue**, levées **une à une**, chacune avec sa pièce.
2. **Le décaissement bloqué** tant qu'une condition reste ouverte.
3. **L'état « Décaissé »** : date, montant, première échéance.

## Décisions retenues par défaut (contestables)

- **D-1108-1 — Une condition préalable** : `{ id, libelle (3 à 300), levee (booléen), leveeLe, document, sansPieceMotif }`. Elle naît
  avec l'offre (STORY-1107, `offre.conditionsPrealables`) ou s'ajoute ensuite (`POST /suivi/{banqueId}/conditions`, valider, tant
  que la banque est `OFFRE_RETENUE`). **Valeurs de la maquette** pour l'offre d'Orabank Togo : « Apport de 6 250 000 FCFA versé sur
  le compte » ; « Gage du camion enregistré » ; « Assurances souscrites (décès-invalidité, camion) ». Le libellé de l'apport
  reprend le montant du projet (STORY-1104).
- **D-1108-2 — Lever une condition** (`POST /suivi/{banqueId}/conditions/{conditionId}/lever`, préparer) : `leveeLe` (pas dans le
  futur, après la date du choix du client, sinon 422 `DATE_INCOHERENTE`) et **une pièce** (document de STORY-1104, cible
  `CONDITION`) **ou** un `sansPieceMotif` de 10 à 300 caractères ; ni l'un ni l'autre : 422 `PIECE_OU_MOTIF_REQUIS`.
  `DELETE …/lever` (valider, motif) rouvre une condition tant que rien n'est décaissé.
  **Téléversement réel et « Voir »** : la pièce se téléverse avec le sélecteur de fichier et le glisser-déposer du contrat de
  STORY-1104 (D-1104-9), se voit en aperçu dans l'application, se remplace en gardant l'historique.
- **D-1108-3 — Le décaissement** (`POST /suivi/{banqueId}/decaissement`, valider) : `date` et `montant` (entier FCFA).
  - Refus tant qu'une condition est ouverte : 409 `CONDITIONS_OUVERTES` (`details.conditions` : les libellés restants).
  - La banque doit être `OFFRE_RETENUE` (409 `ETAT_BANQUE_INTERDIT` sinon).
  - `montant` ≤ montant accordé (422 `MONTANT_DECAISSE_SUPERIEUR`) ; `date` pas dans le futur et après le choix du client (422
    `DATE_INCOHERENTE`).
  - Effets **en une écriture conditionnelle** : la banque passe `DECAISSE` ; le dossier passe `DECAISSE` (état final, STORY-1107) ; le
    **choix du client est verrouillé** (STORY-1107, D-1107-7).
- **D-1108-4 — La première échéance** est calculée par l'échéancier de STORY-1084 sur le capital décaissé, avec le taux, la durée
  et le différé de l'offre retenue : la 1re échéance tombe une période (un mois) après la date de décaissement (règle du jour du
  mois de D-1084-5) ; pendant un différé, ce sont les intérêts seuls. **Référence (maquette)** : Orabank Togo, offre 22 000 000 à
  11,5 %, 48 mois, sans différé ; décaissement du **01/04/2026**, **22 000 000** ⇒ première échéance le **01/05/2026**,
  **573 958**. Le décaissement publie `premiereEcheance: { date, montant }`.
- **D-1108-5 — Les routes** (sous `/api/v1/dossiers/{dossierId}/financements/{financementId}`, mêmes gardes et portée que 1083) :

  | Route | Droit | Effet |
  |---|---|---|
  | `GET /suivi/{banqueId}/conditions` | consulter | les conditions, avec leur pièce |
  | `POST /suivi/{banqueId}/conditions` | valider | ajoute une condition (201) |
  | `POST /suivi/{banqueId}/conditions/{conditionId}/lever` | préparer | lève |
  | `DELETE /suivi/{banqueId}/conditions/{conditionId}/lever` | valider | rouvre |
  | `POST /suivi/{banqueId}/decaissement` | valider | décaisse |

  Refus : 404 `CONDITION_INTROUVABLE`, 409 `CONDITIONS_OUVERTES`, `ETAT_BANQUE_INTERDIT`, `DECAISSEMENT_FAIT` (rouvrir une condition
  après décaissement), `CONFLIT_CONCURRENT`, 422 `PIECE_OU_MOTIF_REQUIS`, `MONTANT_DECAISSE_SUPERIEUR`, `DATE_INCOHERENTE`.
- **D-1108-6 — Piste d'audit** : `FINANCEMENT_SUIVI_BANQUE` (STORY-1107) avec `geste` = `CONDITION_LEVEE`, `CONDITION_ROUVERTE`,
  `DECAISSEMENT`. Le manifeste M49 passe en 0.3.0 avec la lecture des conditions en lecture seule.

## Critères d'acceptation

- **AC-1** : tant qu'une des trois conditions de la maquette est ouverte, le décaissement répond `CONDITIONS_OUVERTES` avec les
  libellés restants ; les trois levées, il passe.
- **AC-2** : la valeur de référence est reproduite au franc : décaissement du 01/04/2026, 22 000 000, première échéance le
  01/05/2026 de 573 958, écrite en dur dans le test.
- **AC-3** : le décaissement passe la banque et le dossier `DECAISSE` en une seule écriture ; le choix du client ne s'annule plus ;
  mutation sur le contrôle des conditions.
- **AC-4 (upload et voir)** : la pièce d'une condition se téléverse (vrai fichier, refus `FORMAT_NON_ACCEPTE`,
  `FICHIER_TROP_VOLUMINEUX`, `FICHIER_ILLISIBLE`), se **voit** en aperçu dans l'application, se remplace en gardant l'ancienne ;
  lever sans pièce ni motif est refusé.
- **AC-5** : un décaissement supérieur au montant accordé est refusé ; rouvrir une condition après décaissement est refusé.
- **AC-6** : droits (lever = préparer ; ajouter, rouvrir, décaisser = valider) et portée comme 1083 ; contrat publié, typé dans
  l'OpenAPI, annoncé dans « ⚠ Contrats » avant le code.

## Hors périmètre

- L'enregistrement de l'emprunt décaissé comme dette existante du client dans les dossiers suivants : à nommer plus tard.
- L'inscription du gage, la souscription des assurances, le versement de l'apport : faits hors de Prospera ; le cabinet n'en
  note que la preuve.
- Les décaissements échelonnés (plusieurs tranches) : un seul décaissement par offre.
