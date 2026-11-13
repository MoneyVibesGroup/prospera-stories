# Amendement du 2026-11-13 — ce que la microfinance demande au réseau

**Statut : ✅ VALIDÉ par le PO le 2026-11-13** (décision T6 et tri des hypothèses du PRD Microfinance). À appliquer à `prd.md` quand les stories de `reseau` pour la microfinance seront écrites.

**Source :** `prds/prd-microfinance-2026-11-13/prd.md`, FR-255.

## Ce qui change

1. **Code d'agence.** Une agence porte le **code du cœur de l'IMF** s'il en a un ; sinon, le code attribué par Prospera (décision T6). Le code est unique dans l'organisation et ne change pas après la reprise.
2. **Échelons.** Le réseau de l'IMF a cinq échelons de portée : réseau, région, agence, zone, portefeuille. Une agence est un lieu ; une zone est un périmètre, dessiné en **polygone**.
3. **Portée « portefeuille ».** Elle est tenue par les modules `credit` et `microfinance` (les prêts et les clients d'un gestionnaire de portefeuille) et **lue** par `reseau`, qui la publie dans `reseau.portee.changed@1` avec les autres portées.
4. **Transfert d'agent.** Le rattachement d'un agent à une agence et à ses zones est daté et tracé ; un transfert ne réécrit pas l'historique.

## Critères de recette

- Une agence importée avec le code `AG-014` du cœur garde ce code ; une agence créée sans code du cœur reçoit un code Prospera.
- Un GP ne lit que les prêts de son portefeuille ; un RA, tous ceux de son agence.
- Une position GPS est rattachée à la zone dont le polygone la contient.
