# STORY-988 : la machine à états du dossier — 42 transitions en donnée versionnée, un seul écrivain

Status: done

**Complexité :** grande (la table de vérité du circuit, l'évaluation des conditions au serveur, la trace chaînée)

**Épic :** EPIC-205 (le dossier : machine à états, versions et échéances)
**Dépôt :** `MoneyVibesGroup/prospera-sinistres-service` (module `sinistres`)
**Plage :** groupe C, n° 9 du lot (`coordination/PLAN-4-SESSIONS-2026-11-14.md` §5).

---

## Pourquoi

Le dossier sinistre avance par 11 statuts et 4 sorties, et **chaque pas est gardé** (FR-30 → FR-33, FR-134 → FR-139).
La spine (AD-4) fait de `sinistres` le **seul écrivain** du statut, par une **commande**, et de la table des 42
transitions une **donnée versionnée** : un statut ou une transition ne change que par un amendement versionné ; un
dossier garde la version de son ouverture ; un écran ne peut pas forcer ce que le serveur refuse (FR-137).

**Source** : `prds/prd-assurance-2026-11-13/prd.md` §5.13 (FR-134 statuts, FR-135 transitions, FR-136 conditions et
codes) ; spine AD-4, AD-7, AD-17.

## Ce qui doit être vrai à la fin (plan §5, n° 10)

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **La table est une donnée versionnée** (`table-des-transitions.json`, version `2026.1`) : 15 statuts (11 + 4 sorties, terminaux marqués), **42 transitions sur 43 lignes** (10a et 10b), rôles, conditions nommées, motif obligatoire ; les textes de FR-136 ; un dossier garde la version de son ouverture | tests générés du tableau |
| AC-2 | **Aucun état non terminal sans issue** ; chaque statut est atteignable depuis `DECLARE` ; un terminal (`CLOTURE`, `REJETE`, `SANS_SUITE`) ne se quitte que par une réouverture | tests sur la table |
| AC-3 | **Une commande, un écrivain** : `POST /api/v1/sinistres/dossiers/{id}/transitions` `{ transition, roleExerce, motif?, versionLue, cleIdempotence }` ; le serveur revérifie le rôle exercé (`DROIT_INSUFFISANT`), la transition (`TRANSITION_INCONNUE`, la réponse nomme le statut et les transitions possibles pour le rôle), le motif (`MOTIF_ECRIT`, 10 caractères), la version (`ETAT_PERIME`), puis **chaque condition nommée** (le code de refus est la condition non remplie, avec son texte) | tests générés : un cas réussi et un cas refusé par condition, pour chaque ligne |
| AC-4 | **Idempotence** : même clé et même contenu, la réponse d'origine ; même clé, autre contenu : `CLE_REUTILISEE` | tests |
| AC-5 | **La trace** (AD-17) : chaque transition **et chaque refus** écrit une ligne d'audit en ajout seul, chaînée (empreinte de la précédente) : acteur, rôle exercé, statut avant et après, motif, conditions évaluées et leur résultat, version de la table ; la transition et sa ligne dans la même transaction | tests ; vrai MongoDB |
| AC-6 | Suites vertes sous Node 24, lint 0, build ; la pile démarre ; un dossier mené de `DECLARE` à `CLOTURE` sur la pile | pile `grp-c` |

## Décisions retenues par défaut (contestables)

- **D-988-1 — Les conditions se lisent dans les « constats » du dossier.** Pièces, expertises, garantie, accord,
  règlements… arrivent avec EPIC-206 → 211 ; chacun posera ses constats par ses propres commandes. La machine les
  évalue au serveur, **en échec fermé** : un constat inconnu est une condition non remplie. Quelques conditions sont
  calculées ici même : `DOSSIER_AFFECTE` (un gestionnaire désigné), `MONTANT_EVALUE` (montant > 0),
  `SEPARATION_DES_TACHES` (l'historique des acteurs du dossier, AD-7), `DECISION_DIRECTION` (corporel automobile).
- **D-988-2 — Le rôle exercé est lu dans le jeton** (revendication `roles`) en attendant les rôles et portées
  d'EPIC-202 : il doit y figurer et dans la ligne de la table.
- **D-988-3 — Une création minimale du dossier** (`POST /api/v1/sinistres/dossiers`, statut `DECLARE`, référence
  `DEC-AAAA-NNNNN` sans trou, AD-6) pour que la machine se prouve ; la déclaration complète est EPIC-206.
- **D-988-4 — Les faits (`sinistres.dossier.changed@1`…) viennent avec leurs premiers consommateurs** (STORY-991 pour
  `liaison-assureur`) : leurs schémas classent d'abord chaque champ au registre `classification-sante` (AD-23).
- **D-988-5 — `comité` est une instance, pas un rôle** : la ligne porte `COMITE`, que la délégation (§5.7, EPIC-209)
  résoudra ; ici, `RESP`, `DT`, `DG` suffisent.
- **D-988-6 — La version lue se contrôle avant la transition** (un écran périmé voit un autre statut : « rechargez »
  vaut mieux que « étape impossible ») ; l'ordre des contrôles est donc : rôle du jeton, table, version, transition,
  rôle de la ligne, motif, conditions. La ligne 10 du PRD est faite de deux pas : **10a** (valider selon la
  délégation, reste `EN_VALIDATION`, pose la validation acquise) et **10b** (envoyer l'offre, exige la validation
  acquise) ; la validation acquise ne survit à aucune autre transition.
- **D-988-7 — Seule une commande acceptée consomme sa clé d'idempotence.** Un refus ne change rien au dossier : la
  commande corrigée peut repartir avec la même clé. Le refus est tracé quand même (AD-17).

## Ce qui a été livré

**2026-11-16** — `prospera-sinistres-service` **#3** fusionnée en « Rebase and merge » (`dev` `a445102`) :

- `src/modules/sinistres/machine/` : `table-des-transitions.json` (version `2026.1`, 15 statuts, 43 lignes, contrôlée
  au chargement), `machine.ts` (décision pure ; six conditions calculées, les autres lues dans les constats, en échec
  fermé).
- `src/modules/sinistres/dossiers/` : `POST /api/v1/sinistres/dossiers`, `GET …/{id}` (avec les transitions possibles
  des rôles du jeton), `POST …/{id}/transitions`, `GET …/{id}/audit` ; collections `sinistres_dossiers`,
  `sinistres_audit` (unique `dossierId` + `sequence`), `sinistres_commandes` (unique `organisationId` + `cle`),
  `sinistres_compteurs` ; dépôts Mongo (transaction `snapshot`, rejouée sur conflit transitoire) et mémoire.
- **Preuves** :
  - Node 24 (étage `verification`, export LF) : 673 unitaires, dont les tests générés de la table (un succès par
    ligne et par rôle, un refus par condition, rôle, motif, version ; `TRANSITION_INCONNUE` depuis chaque statut),
    17 e2e sur la vraie chaîne de gardes ; lint 0 ; build.
  - Le service sur un **vrai MongoDB** (jeu de répliques) : parcours complet, refus tracés, idempotence, **course de
    deux commandes sur la même version : une passe, l'autre `ETAT_PERIME`**.
  - **Pile `grp-c`** (droit ouvert par un vrai fait `entitlement.changed`, IdP de test, constats posés en base) : un
    dossier mené de `DECLARE` à `CLOTURE` par HTTP par six agents ; `SEPARATION_DES_TACHES` refusé à l'agent qui a
    instruit et évalué, bien qu'il tienne aussi `RESP` ; `MOTIF_ECRIT` ; réouverture (39) ; rejeu identique ;
    `CLE_REUTILISEE` ; course `200 / 409 ETAT_PERIME` ; piste de 17 lignes, intègre ; aucune erreur au journal.
    **Rejoué sur l'image reconstruite depuis `dev`** : vert.

**Reste** : les constats sont posés par les commandes des épics suivants (pièces, expertises, garantie, accord,
règlement : EPIC-206 → 211) ; les faits `sinistres.dossier.changed@1`… avec leurs premiers consommateurs (D-988-4) ;
la délégation qui résoudra `COMITE` (EPIC-209) ; les rôles et portées d'EPIC-202, qui remplaceront la lecture des
rôles dans le jeton (D-988-2).
