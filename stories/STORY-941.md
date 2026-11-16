# STORY-941 : le verrou npm et les scripts racines de la plateforme ; le README des dossiers

Status: done

**Complexité :** petite (fichiers racines d'un dépôt, une garde)

**Épic :** EPIC-142 (un contrat d'état publié stable, et un socle prêt pour le moteur)
**Dépôts :** `MoneyVibesGroup/prospera-plateforme` (fichiers racines, tenus par B)
**Plage :** groupe B, n° 1 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §3).

---

## Pourquoi

Le 15/11, C a signalé deux trous dans `prospera-plateforme` (journal de C, « → B, deux points ») :

1. `npm ci` échouait : le verrou ne connaissait pas l'espace de travail `@prospera/garde-etat-publie` (STORY-937) ;
2. le `npm test` et le `typecheck` racines ne lisaient pas les dossiers de C : leurs tests ne passaient que chez C.

Le lot 2 donne en plus trois dossiers à D (`series/`, `vocabulaires/`, `contrats/distributeur/`, décision D-L2-3). Le
README doit le dire avant que D y écrive (D-1042, D-1044).

## Ce qui doit être vrai à la fin (plan du lot 2, §3, n° 1)

| Exigence | Fait |
|---|---|
| `npm ci` passe | oui : verrou régénéré (l'espace de travail de la garde y entre) |
| `test` et `typecheck` racines lisent les dossiers de C | oui : `champs-sensibles/`, `classification-sante/`, `contrats/assurance/` |
| README à jour avec les dossiers de D (D-L2-3) | oui : trois lignes au tableau « Qui écrit dans quel dossier » |
| Demande de C servie | oui (plateforme #6, `9f43fa9` sur `dev`) |

## Ce qui a été livré

1. **`package-lock.json`** régénéré par `npm install` : `paquets/garde-etat-publie` et son lien
   `node_modules/@prospera/garde-etat-publie` y entrent.
2. **`package.json`, script `test`** : un motif par dossier, ceux de B (`test/`, `paquets/*/test/`), ceux de C, ceux
   des modules (`contrats/objets/*/test/`) et ceux de D. Un motif qui ne trouve rien ne fait pas échouer `node --test`
   (vérifié) : le dossier de D est joué **dès son premier fichier**, sans PR de B.
3. **`tsconfig.json`** : `include` couvre `<dossier>/**/*.ts` pour chaque dossier de C et de D (dont
   `contrats/assurance/demo/`, que le motif `src|test|scripts` aurait manqué).
4. **`test/scripts-racines.test.ts`**, la garde :
   - chaque `*.test.ts` du dépôt est couvert par un motif du `test` racine ;
   - chaque `.ts` est lu par le `typecheck` racine ;
   - les six dossiers de C et de D ont leur motif, même avant d'exister ;
   - chaque espace de travail (`paquets/*`) est au verrou, avec son nom, sa version et son lien.
5. **README** : les dossiers de D ; les fichiers racines sont à B ; un dossier de C ou de D n'a pas de dépendance propre
   (il emprunte celles de la racine) ; `npm ci` dans « Travailler ici ».

## Preuves

- Node 24 (`node:24-slim`, export de la branche par `git archive`) : `npm ci` ✔, `npm run typecheck` ✔, `npm test`
  **212 passés, 0 échec, 1 sauté**. Le sauté est la comparaison de la garde à la matrice du catalogue, absente du
  conteneur ; il passe sur le poste où le catalogue est cloné à côté.
- Avant : 103 tests à la racine, 106 dans les dossiers de C joués à part (37 + 40 + 29). Après : 213, soit les deux
  plus les 4 de la garde.
- **Mutations** :
  - le verrou d'`origin/dev` ⇒ « paquets/garde-etat-publie absent du verrou » ;
  - l'ancien script `test` ⇒ « fichiers de test que `npm test` ne joue pas : » suivi des six fichiers de C.
- Pas de `docker compose up` : le dépôt n'a pas de service.

## Décisions

- **D-941-1 — Un motif par dossier, pas un `**/test/**` global.** Un motif global jouerait aussi un `test/` venu d'une
  dépendance. La liste explicite dit qui est joué, et la garde attrape tout fichier qu'elle oublie.
- **D-941-2 — Les dossiers de C et de D ne sont pas des espaces de travail npm.** Ils n'ont pas de dépendance propre.
  En faire des espaces de travail lierait chacun de leurs `package.json` au verrou, qui est un fichier de B : chaque
  changement de C ou de D demanderait une PR de B. Une dépendance nouvelle se demande à B.
- **D-941-3 — Les dossiers de D sont déclarés avant d'exister.** D écrit dans `series/` et les autres sans attendre
  une PR de B (plan du lot 2, §7 : « B-941 → D, C, début du lot »).

## Suite

- STORY-943 : la logique du point de décision (`paquets/point-de-decision`).
