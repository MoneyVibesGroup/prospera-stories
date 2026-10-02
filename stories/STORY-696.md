# STORY-696 : Les dossiers existants restent fermes aux collaborateurs tant que leur affectation n a pas ete republiee

Status: ready-for-dev

**Épic :** EPIC-012
**Service :** `dossier-service` (republication) + relying parties du contrat `dossier.*`
**Points :** 3 · **Sprint :** S20 · **Complexité :** medium · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** clôture de STORY-683 (2026-10-02) — D-683-3, constat de la revue de code (écarté du périmètre : migration de données = souci de prod, différé).

---

## Le fait

STORY-683 rend la portée par collaborateur **fail-closed** sur une affectation inconnue : un document du
read-model `dossiers_dossier` projeté **avant** 683 ne porte ni `responsableUserId` ni
`contributeursUserIds`, et aucun `TENANT_USER` n'y accède tant qu'un `dossier.updated` ne l'a pas
republié (vérifié en docker : `tmp/verif-docker-683/p3_etapes.py` étape 7, `p7_projection.py` P2).

En développement, les volumes repartent de zéro. **En production**, un dossier qui ne change jamais ne
republiera jamais son affectation : ses collaborateurs le perdront pour de bon dans `bilan-service`
(et dans chaque relying party qui adoptera la règle — [[STORY-694]], [[STORY-695]]).

## Critères d'acceptation

- [ ] AC-1 — Un moyen **opérateur** (script ou route `PLATFORM_ADMIN`, jamais ouvert aux tenants) republie
      un `dossier.updated` à état absolu pour chaque dossier, par lots bornés, via l'outbox (même
      transaction, même contrat) — idempotent, rejouable.
- [ ] AC-2 — Aucun changement de contrat : les consommateurs projettent sans modification.
- [ ] AC-3 — Vérification docker : un read-model fabriqué « avant 683 » retrouve l'affectation après
      republication ; collaborateur affecté ⇒ 200.
- [ ] AC-4 — Procédure de mise en production consignée (ordre : déployer 683 partout, puis republier).

## Notes

- Voir [[STORY-683]] (D-683-3).

## Progress Tracking

**Statut : `ready-for-dev` (2026-10-02).** Créée à la clôture de STORY-683.
