# STORY-1094 : Le plan comptable propre du cabinet — ses comptes et ses journaux, hérités par ses dossiers

Status: done — **livrée le 2026-11-21** (comptabilite-service #13, `a98ec56` sur `dev` ; contrat annoncé stories #745). Créée le 2026-11-18 à la demande de l'utilisateur. Non slottée.

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

---

## Livraison (2026-11-21, groupe A)

**Routes** (contrat dans le journal du groupe A, « ⚠ Contrats ») : `/api/v1/cabinet/plan-comptable/{comptes,journaux,actes}` (lecture : tout membre ; écriture : `TENANT_ADMIN`) et `GET /api/v1/dossiers/{d}/exercices/{e}/plan-comptable`.

**Preuves** : unitaires 889 passés (Node 24, 60 suites), `test:socle` 273/273 (12 suites, dont 29 neufs), mutation 18/18 rouges sur l'assertion, lint, tsc, build ; gate de câblage `docker compose up` du service (grp-a) : healthy, routes neuves 401 sans jeton, 404 sur une route inconnue.

**AC** : AC-1 (refus nommant la racine la plus proche : `details.racineLaPlusProche`), AC-2 (grand livre du dossier aux comptes propres égal, à la racine, à celui du dossier saisi sur les racines : socle), AC-3 (mouvementé : 409 à la suppression, désactivé : 422 `COMPTE_DESACTIVE` / 409 `JOURNAL_DESACTIVE`, lisible avec `?etat=tous`), AC-4 (403 `TENANT_ADMIN_REQUIS`), AC-5 (contrat annoncé avant le code).

**Décisions** (prises par A, contestables) :
- **D-1094-1** : le service ne portait pas le plan de comptes. Les numéros du plan publié de chaque référentiel sont une donnée du service (`plan-publie@1`, `src/plan-propre/plans-publies.json`), générée par `scripts/plan-publie/generer.mjs` depuis les paquets de `balance-service` (SN `syscohada-revise@2.3`, SMT `smt-togo@1.0`, SFD-BCEAO `sfd-bceao@2.0`, CIMA `cima-assurances@7.0`). Un nouveau paquet se rejoue par le script.
- **D-1094-2** : la nature héritée de la racine est la **classe** et le **collectif** (catégorie de tiers). Le **sens** n'est pas servi : le plan publié n'en porte pas, on ne l'invente pas.
- **D-1094-3** : l'écriture est réservée au rôle `TENANT_ADMIN` du jeton signé (décorateur `@AdministrateurDuCabinet`, 403 `TENANT_ADMIN_REQUIS`), **sans droit de tenant neuf** (aucune attribution à demander à auth-service).
- **D-1094-4** : un compte propre porte **une racine par référentiel** dont le plan en a une (la plus longue qui le préfixe, strictement plus courte que lui). Il est refusé s'il n'en a dans aucun (`COMPTE_SANS_RACINE`) ou s'il est lui-même un compte du plan (`COMPTE_DU_REFERENTIEL`). Un dossier ne reçoit que les comptes dont la racine est dans le plan de son référentiel.
- **D-1094-5** : aux écritures, `COMPTE_INCONNU` = la classe n'existe pas au plan du dossier ; `COMPTE_SANS_RACINE` = classe connue mais aucune racine ; `COMPTE_DESACTIVE`. **La classe 9** (engagements hors bilan, analytique), absente du plan publié mais connue de la clôture (« hors clôture »), **reste saisissable**. Un compte sans racine, accepté sans contrôle jusqu'ici, est donc refusé : seul effet visible pour les cabinets existants.
- **D-1094-6** : la suppression existe pour ce qui n'a jamais été mouvementé (brouillard compris) ; l'acte d'audit reste. Le journal d'audit du modèle est une collection en ajout seul (`actes_du_modele`), chaque geste effectif avance la version du modèle ; un geste sans effet (même libellé, déjà désactivé) n'avance rien.
- **D-1094-7** : un journal propre n'est pas dans le plan arrêté de l'exercice ; la saisie le résout chez le cabinet et le numérote (séries `series-v1` à son nom). Un plan de trésorerie (SMT) n'admet que les journaux propres de type `TRESORERIE`. Un journal désactivé reste numérotable pour contre-passer l'historique ; la **saisie** et la **validation d'un brouillard** exigent un journal actif.
- **D-1094-8** : `MOTIF_JOURNAL` des écritures et le curseur du grand livre acceptent les chiffres (`BQ1`) : ajout seul, tout code d'avant reste valide.
- **Ouvert** : le manifeste `comptabilite` gagne quatre routes de lecture ; la copie du catalogue est à regénérer (demande à B, journal de A).
