# STORY-1094 : Le plan comptable propre du cabinet — ses comptes et ses journaux, hérités par ses dossiers

Status: ready-for-dev — **créée le 2026-11-18** à la demande de l'utilisateur. Non slottée : à placer au prochain plan.

**Service :** `prospera-comptabilite-service` (tenu par B au lot 4) · **Points :** 8
**Suite :** STORY-1095 (le plan propre d'un client), STORY-1096 (import du plan de Sage), FE-148 (l'écran).

---

## Pourquoi

Un cabinet qui vient de Sage 100 y a **son** plan comptable : ses comptes de détail (« 521100 BOA Lomé », « 411LOME
Clients Lomé ») et **ses** journaux (« BQ1 », « CAI », « VTE »). Prospera ne lui donne aujourd'hui que le plan du
référentiel publié (SYSCOHADA révisé, SFD-BCEAO, CIMA) et son plan de journaux. Le service comptable ne les sert
qu'en lecture : `GET …/referentiel`, `GET …/journaux`. Le cabinet ne peut rien ajouter.

**Décision (utilisateur, 2026-11-18)** : la comptabilité propre se définit **au niveau du cabinet**, s'ajuste **par
client** (STORY-1095), ou **s'importe depuis Sage** (STORY-1096).

## La règle qui garde la liasse juste

Un compte propre est une **subdivision** d'un compte du référentiel : son numéro **commence par** une racine du plan
publié (`521100` sous `521`, `4111` sous `411`). SYSCOHADA autorise ces subdivisions. La liasse et les contrôles
continuent d'agréger par racine, et rien de ce qui est calculé aujourd'hui ne change. Un compte **sans racine** dans le
référentiel du dossier est refusé, et le refus nomme la racine la plus proche.

## Ce qui est attendu

1. **Le modèle du cabinet**, propre à l'organisation et versionné :
   - **des comptes propres** : numéro, libellé, racine du référentiel. La nature (classe, sens, collectif ou non) est
     **héritée** de la racine, jamais saisie ;
   - **des journaux propres** : code, libellé, type (`ACHATS`, `VENTES`, `TRESORERIE`, `OD`). Un journal de
     trésorerie peut porter son compte de banque ou de caisse. Les journaux du plan publié restent disponibles.
2. **Routes** :
   - lecture par tout membre du cabinet ;
   - écriture par le seul `TENANT_ADMIN` : créer, modifier le libellé, désactiver ;
   - jamais de suppression d'un compte ou d'un journal déjà mouvementé : il se **désactive**, et son historique reste
     lisible.
3. **Héritage** : les comptes et journaux du modèle sont proposés dans **tous** les dossiers du cabinet dont le
   référentiel porte leur racine. Un dossier CIMA ne reçoit pas une subdivision de racine SYSCOHADA absente de son plan.
4. **Les écritures** (brouillard, validation) acceptent un compte propre actif et un journal propre actif du cabinet.
   Elles refusent un compte inconnu, sans racine ou désactivé, avec un code distinct pour chacun.
5. **Journal d'audit** : chaque création, modification ou désactivation nomme son auteur et sa date.

## Critères d'acceptation

- **AC-1** : un compte propre sans racine dans le référentiel est refusé, et le refus nomme la racine la plus proche.
- **AC-2** : la balance et la liasse d'un dossier qui utilise des comptes propres sont **identiques**, à la racine, à
  celles du même dossier saisi sur les seules racines.
- **AC-3** : un compte ou un journal mouvementé ne se supprime pas ; désactivé, il refuse les nouvelles écritures et
  reste lisible dans l'historique.
- **AC-4** : un collaborateur lit le modèle mais ne l'écrit pas (403 nommé).
- **AC-5** : contrat publié et typé dans l'OpenAPI, annoncé dans « ⚠ Contrats » du journal du groupe qui tient le
  service, avant le code.
