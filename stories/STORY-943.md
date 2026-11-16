# STORY-943 : la logique du point de décision

Status: done

**Complexité :** moyenne (une fonction pure, sa suite de conformité, sa preuve par mutation, le lecteur de licence)

**Épic :** EPIC-144 (installer une offre en une action, par un seul point de décision)
**Dépôts :** `MoneyVibesGroup/prospera-plateforme` (`paquets/point-de-decision`)
**Plage :** groupe B, n° 3 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §3).

---

## Pourquoi

AD-23 interdit deux calculs de « qui a droit » : la partie A (installation, chemin 1 de FR-4) et la centrale (qui
dérive la licence, AD-25) embarquent **la même bibliothèque**, avec la même suite de conformité et une preuve par
mutation. STORY-931 n'en avait posé que l'amorce : `decider` refusait `POINT_DE_DECISION_NON_LIVRE`. STORY-944
(l'installation, un plan enregistré) en a besoin.

## Ce qui doit être vrai à la fin (plan du lot 2, §3, n° 3)

| Exigence | Fait |
|---|---|
| `decider` rend les refus dans l'ordre (AD-23) | oui : **tous** les refus qui s'appliquent (FR-4 : « le serveur les renvoie tous »), dans l'ordre `MODULE_NON_SOUSCRIT`, `MODULE_HORS_LICENCE`, `MODULE_DEPENDANCE_MANQUANTE` |
| Mode sur site | oui : `MODULE_HORS_LICENCE` seul ; la licence acceptée est lue par `lireLicence`, à l'horloge scellée |
| Conformité | oui : `conformite.json`, 14 cas, rejoués contre la source (et demain contre chaque copie) |
| Mutation | oui : dix mutations automatiques du fichier, chacune fait rougir la suite |

## Ce qui a été livré

1. **`src/index.ts`** : un fichier unique, sans import ni horloge, copié tel quel (étiquette `point-de-decision-v1`,
   sha256 `de37c40e52abe5281840ffd5879e360f6f484619ead71cd61ad0e5cd7363d940`).
   - Entrée : `{ lieu: 'PLATEFORME' | 'SITE', organisationId, module, souscrits, licence: string[] | null,
     dependances, installes, planifies? }`.
   - Sortie : `{ ouvert: true }` ou `{ ouvert: false, code, refus: [{ code, modules? }] }`. `code` est le premier
     refus ; `modules` porte les dépendances manquantes, dans l'ordre du manifeste, sans doublon.
   - Plateforme : souscription, licence (si elle n'est pas `null`), dépendances dures (installées ou planifiées par le
     même plan).
   - Site : licence seule ; `null` ⇒ `MODULE_HORS_LICENCE`.
   - Un lieu inconnu ou une liste mal formée lèvent une erreur : jamais un « oui ».
2. **`conformite.json`** (sha256 `6f3eb92c38b5647b56706f8488f2c530130dc61dca07aacd3dbb9da10b7af97b`) : 14 cas, dont
   les trois refus ensemble, deux refus, le plan en cours, la casse, le site sans licence.
3. **`test/mutation.test.ts`** : chaque mutation est un remplacement précis (motif absent ⇒ rouge) ; la copie mutée se
   charge, puis la suite doit rougir sur au moins un cas. Un témoin non muté passe toute la suite.
4. **`src/licence.ts`** (`@prospera/point-de-decision/licence`) : `lireLicence(jws, contexte)`.
   - Chaîne de `@prospera/signature`, à l'heure de `contexte.horloge` (horloge scellée, AD-5).
   - Refus nommés d'AD-8 : `HORLOGE_INDISPONIBLE`, `LICENCE_AUTRE_INSTANCE`, `LICENCE_ANTERIEURE` (numéro non
     supérieur au plus haut vu pour sa clé, ou heure de référence antérieure à la dernière acceptée, toutes clés
     confondues), `LICENCE_INVALIDE` (la cause porte le code de signature).
   - Rend les codes des modules : l'entrée `licence` de `decider` sur site.
5. **README** de la plateforme : le paquet n'est plus une amorce ; comment le copier.

## Comment le copier (STORY-944, centrale)

Recopier depuis le blob de l'étiquette, jamais à la main :
`git -c core.autocrlf=false show point-de-decision-v1:paquets/point-de-decision/src/index.ts > <copie>`, de même pour
`conformite.json`. À côté, un `ORIGINE.json` (dépôt, étiquette, commit `5883740`, fichier, sha256), sur le patron de
`prospera-paiement-service/src/vendor/garde-etat-publie/`. Un test du consommateur vérifie l'empreinte et rejoue
`conformite.json` contre sa copie.

## Preuves

- Node 24 (`node:24-slim`, export de la branche) : `npm ci` ✔, `npm run typecheck` ✔, `npm test` **253 passés,
  0 échec, 1 sauté** (la comparaison de la garde à la matrice du catalogue, absente du conteneur).
- Paquet : 44 tests (conformité 21, mutation 11, licence 12) ; garde `scripts-racines` verte (le lien de l'espace de
  travail et sa dépendance à `@prospera/signature` sont au verrou).
- Mutations manuelles du lecteur de licence (horloge ignorée, `<=` en `<`, heure antérieure ignorée, autre instance non
  nommée) : chacune rougit.
- Pas de `docker compose up` : le dépôt n'a pas de service.

## Décisions

- **D-943-1 — Tous les refus, pas le premier seul.** FR-4 dit « le serveur les renvoie tous, dans cet ordre » ;
  l'amorce n'en rendait qu'un. `code` (le premier) reste, pour un appelant qui n'en montre qu'un.
- **D-943-2 — `licence: null` sur la plateforme veut dire « hébergé ».** Sa licence est remplacée par les faits du
  contrat (AD-8, AD-19) : `MODULE_HORS_LICENCE` ne s'y évalue pas. Une liste (même vide) l'évalue : c'est le cas de la
  centrale qui dérive la licence d'une instance sur site.
- **D-943-3 — `planifies`.** Une dépendance installée par le même plan, avant le module, n'est pas manquante : sans
  cela, une offre résolue (dépendances ajoutées, FR-1) se refuserait elle-même.
- **D-943-4 — La casse compte.** Les codes de manifeste sont en minuscules ; normaliser revient à l'appelant
  (paiement le fait déjà, D-939). Un cas de conformité le fixe.
- **D-943-5 — Le lecteur de licence est à part.** Il importe `@prospera/signature` ; la partie A de la plateforme n'a
  pas de licence (AD-19) et ne copie que `decider`. Le consommateur sur site embarque les deux paquets à la même
  étiquette.
- **D-943-6 — Les chemins 0 et 2 à 6 ne passent pas par `decider`.** Ils n'ouvrent aucun module (FR-4) : le refus
  « aucun droit hors des chemins 0 et 1 » se prouve dans le catalogue (STORY-945).

## Suite

- STORY-944 : le catalogue copie `decider` et `conformite.json` à `point-de-decision-v1` et décide chaque étape du plan
  d'installation avec.
