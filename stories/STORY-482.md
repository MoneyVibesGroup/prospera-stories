# STORY-482 : Une trésorerie négative n'est ni nommée, ni financée : portée à l'actif, sans découvert, sans agios, sans besoin chiffré

Status: ready-for-dev

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-036** (projection 3 ans, trésorerie 12 mois, scénarios comparés), 2026-08-27.
Relevé en lisant le bilan prévisionnel simplifié d'un exercice déficitaire en trésorerie, puis en cherchant le besoin de financement à l'écran.

---

## Le fait

Trois manques qui n'en font qu'un : le modèle sait produire une trésorerie négative, et ne sait rien
en dire.

**① Elle est portée à l'actif.** `BilanSimplifiePrevisionnel.tresorerieNette` reçoit
`tresorerieCloture` telle quelle, et `totalActif = actifImmobiliseNet + bfr + tresorerieNette`. Un
solde de −804 945 est donc un **emploi négatif**. Comptablement, un découvert est une **ressource au
passif** (concours bancaires courants). L'équilibre reste arithmétiquement vrai — l'écart vaut 0 par
construction — mais **la lecture est fausse**, et c'est un bilan qu'on remet à un banquier.

**② Il n'y a ni découvert, ni agios.** Six mois dans le rouge en N+1 sur le dossier de démonstration,
et **aucune charge financière**. Un découvert coûte, et son coût creuse le découvert.

**③ Le besoin de financement n'est chiffré nulle part.** C'est pourtant le chiffre pour lequel on
ouvre l'écran : **804 945** à couvrir sur N+1, **4 092 714** sur l'horizon. Il est dérivable en une
ligne (`−min(clôtures)`), la maquette le calcule elle-même — mais aucun champ du contrat ne le porte,
donc chaque client le recalculera à sa façon.

## Critères d'acceptation

- [ ] AC-1 — Le bilan prévisionnel simplifié sépare `tresorerieActive` (≥ 0, à l'actif) et
      `concoursBancaires` (≥ 0, au passif) — jamais un montant négatif à l'actif.
- [ ] AC-2 — Le contrôle d'équilibre est **maintenu** : `ecart === 0` après la ventilation, arrondis
      compris. Un test le vérifie sur un exercice à trésorerie négative — le cas que le modèle
      produit aujourd'hui sans le traiter.
- [ ] AC-3 — Une hypothèse de **taux de découvert** (`tauxDecouvertPct`, défaut 0) génère une charge
      financière décaissée, publiée comme ligne du plan de trésorerie.
- [ ] AC-4 — La réponse porte `besoinFinancement: { maximal, moisMaximal, surHorizon }` — annuel et
      mensuel. Un besoin de financement calculé par chaque client est un besoin de financement
      différent chez chacun.
- [ ] AC-5 — `MODELE_PROJECTION_VERSION` évolue.

## Conséquences ailleurs

- **STORY-467** (aucune charge d'intérêt sur les emprunts) et l'AC-3 relèvent du même mécanisme :
  les traiter ensemble, sinon le modèle facturera le découvert et pas l'emprunt.
