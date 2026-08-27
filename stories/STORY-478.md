# STORY-478 : Le plan de trésorerie 12 mois ne porte aucune ligne de TVA — il fait circuler du HT

Status: ready-for-dev

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 8 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-036** (projection 3 ans, trésorerie 12 mois, scénarios comparés), 2026-08-27.
Relevé en confrontant `projection-mensuelle.service.ts` au taux de TVA du paquet fiscal du dépôt (`referentiels/paquet-fiscal-togo-2026.json`).

---

## Le fait

Dans `ProjectionMensuelleService`, les encaissements clients valent la partition des **produits** et
les décaissements fournisseurs celle du **coût des ventes** — deux agrégats **hors taxes**.

Or un client règle **TTC**. Le paquet fiscal du dépôt publie le taux unique : **18 %**
(`tva.tauxStandard`, Art. 195 CGI, assiette « chiffre d'affaires HT »).

Sur le scénario prudent du dossier de démonstration, en N+1 :

| | Montant |
|---|---|
| Encaissements publiés par le plan (HT) | 17 193 750 |
| Encaissements réels (TTC, 18 %) | **20 288 625** |
| TVA collectée | 3 094 875 |
| TVA à reverser (collectée − déductible sur le coût des ventes) | ≈ **557 078 / an**, soit ≈ **46 423 / mois** |

**Aucune de ces lignes n'existe dans le plan.** Sur douze mois les deux erreurs se compensent
approximativement ; **à l'intérieur d'un mois, non** — et c'est précisément ce qu'un plan mensuel sert
à voir. Une entreprise qui encaisse la TVA de ses clients avant de la reverser dispose d'une
**trésorerie de portage** que le modèle ignore, et une entreprise en crédit de TVA subit un décalage
que le modèle ignore aussi.

⚠️ Distinct de **STORY-469**, qui porte sur le **montant** du BFR (créances et dettes calculées HT).
Ici c'est l'**absence d'une ligne** dans le plan de trésorerie.

## Critères d'acceptation

- [ ] AC-1 — `PeriodeMensuelle` porte `tvaCollectee`, `tvaDeductible` et `tvaReversee` — trois lignes
      publiées, puisque `fluxNet` est par contrat **exactement** la somme des lignes publiées.
- [ ] AC-2 — Les encaissements et décaissements sont **TTC** ; le contrat le dit dans le nom ou dans
      la documentation du champ, jamais implicitement.
- [ ] AC-3 — La périodicité et l'échéance du reversement viennent du **paquet fiscal du dossier**.
      ⚠️ Le paquet ne les publie **pas aujourd'hui** (il ne porte que les 4 acomptes d'IS) : la story
      dépend d'un ajout au référentiel, à tracer séparément — même angle mort que les « dates de dépôt
      DSF » que le `_meta` annonce sans les porter (relevé en FE-034).
- [ ] AC-4 — Un dossier **non assujetti** (sous le seuil, ou exonéré Art. 180) rend les trois lignes à
      `0` **motivé**, jamais absentes.
- [ ] AC-5 — `MODELE_PROJECTION_VERSION` passe à `1.1.0` (ou au-delà) : les montants changent à
      hypothèses inchangées.

## Conséquences ailleurs

- L'articulation `Σ mensuel = annuel` doit rester une **identité** : l'annuel doit donc porter la même
  TVA, ou la story doit expliciter pourquoi elle s'annule sur l'exercice.
