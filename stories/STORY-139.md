# STORY-139 : Suggestion de compte à partir d'un **libellé libre**, pilotée par le référentiel — service de mapping assisté pour la saisie directe (`balance-service`)

**Epic :** Atelier Balance (amont) — support de l'adaptateur `direct` (D13)
**Réf. architecture :** hub multi-source D13 ; contrat canonique STORY-101 ; paquets référentiels STORY-056 (SYSCOHADA) / STORY-057 (SFD-BCEAO) / surcharges org STORY-058
**Priorité :** Should Have (aide à la saisie ; **aucun blocage** — le front dégrade proprement, cf. Contexte)
**Story Points :** 5
**Statut :** planned (slottée **Sprint 17**, 2026-07-25 — décision user ; S17 → 26/34)
**Créée le :** 2026-07-25
**Origine :** implémentation de **FE-026** (saisie manuelle de balance) — modèle de saisie validé PO le 2026-07-25 : « on saisit le libellé + le montant, Prospera renseigne le compte » et « ne pas se limiter à SYSCOHADA : microfinance et assurance aussi ».
**Service :** `balance-service` (:3007)
**Couvre :** dette de contrat — comble le trou signalé par FE-026

> **Story de contrat/enablement, pas d'écran.** FE-026 livre la saisie directe avec un **dictionnaire `libellé → compte` intérimaire codé côté client** (`config/plan-comptes.ts`, annoté). Ce n'est **pas** faisable à la main durablement : le mapping fait autorité par **référentiel**, doit suivre les paquets versionnés (STORY-056/057) et les **surcharges par organisation** (STORY-058), et ne peut pas vivre en double côté front. Cette story déplace le mapping **côté serveur** — sa vraie place — et le front le consommera.

---

## User Story

En tant que **comptable qui saisit une balance à la main sans connaître les n° de compte par cœur**,
je veux que **Prospera me propose le compte à partir du libellé que je tape, selon le référentiel de mon organisation**,
afin de **produire une balance canonique correcte sans mémoriser le plan SYSCOHADA / SFD / CIMA.**

---

## Contexte

Le **sens de mapping est inverse** de celui déjà packagé. Les stories existantes vont **compte → poste d'état** (STORY-055 table de passage, longest-prefix, pour le Bilan). Ici on a besoin de **libellé libre → compte**, pour **assister la saisie** en amont. Rien ne le couvre aujourd'hui.

Le référentiel **pilote** le résultat : le même libellé « Banque » donne `521` en SYSCOHADA et `111` dans le plan SFD (BCEAO). Le mécanisme doit être **le même pour tous les référentiels** — SYSCOHADA (SN/SMT), **SFD-BCEAO** (microfinance, déjà packagé STORY-057), et **CIMA (assurance)** dès que ce référentiel entrera dans l'enum `REFERENTIELS_BALANCE`.

**Le front n'est pas bloqué sans cette story :** FE-026 fonctionne avec son dictionnaire client (aide à la saisie ; l'utilisateur corrige ; le serveur reste seul juge du compte via le validateur `^[0-9A-Za-z]{3,20}$`). Mais ce dictionnaire est **plausible, pas opposable** et **duplique** une connaissance qui appartient aux paquets référentiels.

---

## Périmètre

**Inclus**
- Endpoint gardé (`@RequiresBalanceAccess`) exposant une **suggestion de compte** pour un **libellé libre**, **résolue selon le référentiel actif de l'org** (comme `GET /referentiels/actifs`). Forme au choix de l'implémenteur : batch (`POST /balances/suggest-comptes` avec une liste de libellés) de préférence à un appel par ligne.
- Résolution **dérivée des paquets référentiels versionnés** (STORY-056/057) et **des surcharges d'organisation** (STORY-058, priorité surcharge > paquet), pas d'une table ad hoc.
- Correspondance **déterministe et traçable** : normalisation du libellé, correspondance exacte puis approchée (fragment le plus long / synonymes packagés), **checksum/version du paquet** dans la réponse (cohérence avec le reste de l'Atelier).
- Réponse **par libellé** : compte proposé (ou aucun), + éventuellement un score/raison. **Jamais** d'invention : sans correspondance, on renvoie « à préciser », pas un compte au hasard.
- Réponse **non autoritaire** assumée : le validateur de soumission (STORY-101) reste seul juge du compte final.

**Hors périmètre**
- L'**apprentissage** des surcharges depuis les saisies passées (proposé → validé) : réutiliser STORY-058 telle quelle, pas de ML.
- L'ouverture du référentiel **CIMA** : le mécanisme doit l'accueillir, mais packager CIMA est une story de paquet distincte.

---

## Critères d'acceptation

1. Pour un référentiel donné, un libellé courant renvoie le compte attendu (`« Achats de marchandises » → 601` en SYSCOHADA) ; un libellé inconnu renvoie **aucune** proposition (pas un compte inventé).
2. Le **même** libellé mappe un compte **différent** selon le référentiel (`« Banque » → 521` SN / `111` SFD) — piloté par le référentiel **actif de l'org**, pas par un paramètre libre.
3. Une **surcharge d'organisation** (STORY-058) **prime** sur la proposition du paquet.
4. La réponse porte la **version/checksum** du paquet référentiel ayant servi (traçabilité, cohérence Atelier).
5. Endpoint **gardé** : sans accès balance, **403** (mêmes motifs que le reste de l'Atelier).
6. Contrat OpenAPI publié ; **FE-026 remplace son dictionnaire client** par la consommation de cet endpoint (retrait de `config/plan-comptes.ts`), Integration Gate à l'appui.

---

## Definition of Done

- [ ] 6 critères d'acceptation validés ; tests (résolution par référentiel, surcharge prioritaire, libellé inconnu, gate 403).
- [ ] Résolution branchée sur les **paquets référentiels versionnés** + **surcharges org**, pas de table ad hoc.
- [ ] OpenAPI à jour ; ticket/PR de suivi FE-026 pour retirer le dictionnaire client référencé.
- [ ] `lint` / `typecheck` / `test` / `build` verts (local + CI).

---

## Notes

- Créée le 2026-07-25 depuis l'implémentation de **FE-026**. Le dictionnaire intérimaire à remplacer vit dans `prospera-frontend-expert-comptable/src/features/atelier/config/plan-comptes.ts` (annoté « INTÉRIMAIRE » avec renvoi à cette story).
