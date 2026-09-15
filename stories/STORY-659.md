# STORY-659 : Le portefeuille d'une IMF ne se classe ni ne se provisionne — il manque le texte prudentiel BCEAO, pas du code

Status: blocked

**Complexité :** high

**Épic :** EPIC-121 — Socle vertical SFD (paquet prudentiel séparé, AD-3)
**Service :** `microfinance-service` (artefact `prudentiel-sfd-bceao`, validateur `scripts/referentiels/valider-paquet-prudentiel.mjs`)
**Points :** 5 · **Sprint :** S20
**Origine :** dette **déclarée** par STORY-498 (D-498-A), puis par STORY-503 (D-503-A) et STORY-504 (D-504-A), et
**remesurée le 2026-09-15** à la clôture de STORY-504.

> ⛔ **Bloquée par une ENTRÉE, pas par une dépendance technique.** Toute la mécanique existe et est prouvée ; ce qui
> manque est le **texte réglementaire opposable**. Inventer une tranche ou un taux « vraisemblable » est exactement ce
> que la règle du projet interdit (STORY-498 AC-2 : une valeur sans référence fait échouer le build).

---

## Le fait

Une IMF qui ouvre Prospera aujourd'hui obtient, pour **chaque** crédit décaissé, le classement `NON_CLASSABLE`
(motif `AUCUNE_TRANCHE_DANS_LE_PAQUET`), et toute proposition de provisionnement répond
`409 PAQUET_PRUDENTIEL_SANS_VALEUR`. Le produit sait dériver le retard d'un crédit à une date d'arrêté, le classer par
tranche, calculer l'assiette, la dotation en complément et la reprise, écrire un arrêté de provision — **sur aucune
valeur réelle**.

⛔ C'est le seul endroit du programme où l'absence est un risque réglementaire pour le client, pas un inconfort : une
IMF sous-provisionnée est **en infraction**, pas en retard (spine microfinance, AD-4).

**Mesuré le 2026-09-15, pas supposé :**

| Constat | Mesure |
|---|---|
| le paquet servi est une amorce vide | `prudentiel-sfd-bceao-1.0.json` : `statut: amorce`, `provisionnement.tranches: []`, `provisionnement.garantiesAdmises: []`, `declassement.regles: []`, `ratios.seuils: []` |
| sa `normeSource` ne cite aucun texte | « Aucune — aucun texte prudentiel de la BCEAO ou de la Commission Bancaire de l'UMOA applicable aux SFD n'a été fourni au projet (D-498-A) » |
| le classement ne produit jamais `CLASSE` en production | STORY-503, vérification docker R2 : `NON_CLASSABLE`, `tranchesLivrees: false` ; `CLASSE` n'est prouvé que par le paquet de TEST fictif |
| le provisionnement refuse avant toute lecture de crédit | STORY-504, vérifications docker S2, T1→T6, U1→U5, V1→V4 : `409 PAQUET_PRUDENTIEL_SANS_VALEUR` |
| la mécanique qui recevra les valeurs est prête | schéma + validateur (P1 amorce, P2 partition des tranches, P3 une garantie admise par type), chargeur vérifié par checksum, `tranchesLivrees` / `valeursLivrees` |
| le référentiel COMPTABLE, lui, est complet | `sfd-bceao@2.0` : 372 comptes du RCSFD (instructions n°025 et n°026-02-2009) — ⚠️ ce ne sont PAS des normes prudentielles |

## Ce qui débloque (l'entrée attendue)

Le **texte prudentiel opposable** applicable aux Systèmes Financiers Décentralisés de l'UMOA, fourni au projet
(PDF ou extrait intégral), avec pour chaque élément **l'instruction, l'article et l'année** :

1. les **tranches d'ancienneté de retard** des créances en souffrance et leur **taux de provision** ;
2. les **garanties admises en déduction** de l'assiette et leur **quotité** ;
3. les **règles de déclassement** (dont la contagion par débiteur, utile à STORY-505) ;
4. les **seuils des ratios prudentiels** (utiles à STORY-510).

⚠️ Et l'identité du **praticien SFD** qui relira la transcription : sans relecture, le paquet ne quitte pas le statut
`a-valider-par-expert` (STORY-498 AC-3, vocabulaire `meta-vocabulaire.json`).

## Critères d'acceptation

- [ ] AC-1 — Les tranches, taux, garanties admises (et, si le texte les porte, règles de déclassement et seuils) sont
      transcrits dans une **nouvelle version** du paquet (`prudentiel-sfd-bceao@1.1` ou `@2.0` selon l'ampleur),
      **chaque élément portant sa `source`** (instruction, article, année). La version `1.0` reste lisible et son
      checksum inchangé.
- [ ] AC-2 — ⛔ **Aucune valeur sans référence** : la garde R4 et les règles P1→P3 passent ; une fixture temporaire
      portant une valeur sans source fait échouer la garde (preuve non vacante, patron STORY-498).
- [ ] AC-3 — `_meta.statut` vaut `a-valider-par-expert` tant que le praticien n'a pas relu ; `normeSource` cite le
      texte ; `miseEnGarde` dit ce qui reste à valider. Le passage à un statut certifié est une étape **distincte**,
      datée et attribuée.
- [ ] AC-4 — Les tranches forment une **partition de [0, +∞)** (P2) ; une trouée ou un chevauchement dans le texte est
      signalé à l'user, jamais « corrigé » en silence.
- [ ] AC-5 — Sur la stack docker, avec le paquet réel servi : un crédit en retard est `CLASSE` dans la tranche attendue
      par le texte ; une proposition de provisionnement rend assiette, taux, dotation et formule, montants **calculés
      d'avance à la main depuis le texte** ; un arrêté s'applique (TENANT_ADMIN) et se rejoue `dejaApplique`.
- [ ] AC-6 — Non-régression : les suites de STORY-503/504 fondées sur le paquet fictif restent vertes ; le checksum et
      le manifeste du paquet servi sont mis à jour ; `sfd-bceao-2.0` est intact.

## Hors périmètre

Contagion par débiteur et crédits restructurés (STORY-505) · ratios prudentiels et états (STORY-509/510) · publication
en balance (STORY-507) · tout calcul nouveau : cette story **transcrit** un texte dans une mécanique existante.

## Notes

- ⛔ Tant que le texte n'est pas fourni, **aucune valeur ne s'écrit**, ni « à titre d'exemple », ni dans un commentaire,
  ni dans un exemple Swagger (garde de STORY-504 : aucune valeur d'exemple dans le contrat OpenAPI).
- Voir [[STORY-498]] (paquet séparé, mécanique seule), [[STORY-503]] (classement), [[STORY-504]] (provisionnement),
  spine microfinance AD-3 et AD-4.
