# TICKET-BACKEND — balance et bilan ne servent pas leurs routes de vérification : le moteur ne peut pas les installer par `POST /installations`

**Cible :** `balance-service` (3 routes) et `bilan-service` (3 routes), tenus par A — puis la recette `cabinet-moteur` (retrait du `PUT`)
**Ouvert par :** STORY-929 (A, 2026-11-17), décision D-929-1
**Story nommée :** **STORY-1080** (id proposé : le max réservé est 1079, groupe D ; la plage suivante de A reste à fixer par le plan suivant)
**Priorité :** Must avant que la console quitte le `PUT` des droits (lot de D) et avant la mise en service (installation par le moteur, S13)
**État :** ✅ fermé le 2026-11-24 par **STORY-1080** (groupe B) — balance #159 (`dev` `4edb4c8`), bilan #182 (`dev`
`0f17ec4`), recette #27 (`dev` `a6da2ea`) : les six routes servies, `cabinet-moteur` installe par
`POST /installations` (six vérifications `VERT`), recette croisée complète verte sur pile neuve. Restent non servies,
hors de ce ticket : les vérifications de `conseil`, `consolidation`, `declarations`.

---

## Le constat (lu dans le code, `platform-catalog-service` `5004cc5`)

`POST /installations` joue, pour chaque module, une étape `VERIFIER` par vérification déclarée au manifeste : `POST …/api/v1/instance/<code>/{organisationId}/verifications/<verification>`,
corps `{}`, en-tête `Idempotency-Key`, jeton de service. **Seul un 200 au corps `verification-installation@1` et au voyant `VERT` passe** ; une route absente (404), un
service sans adresse, un délai, un corps hors contrat, ORANGE ou ROUGE bloquent le module (jamais une réussite, FR-6). Seul le `PUT` de la console (plan `CONSOLE_PUT`) diffère
une vérification dont le service n'a pas d'adresse.

Balance et bilan ne servent, de C13, que l'import et l'effacement (STORY-928). Aucune route `verifications/…`, `sante`, `export`, `migrer`. La recette (`cabinet-moteur`, STORY-929) l'éprouve :
`POST /installations` du module `conseil` s'arrête `EN_ATTENTE`, première vérification `NON_EXECUTEE`, module fermé.

## Ce qu'il faut (aux critères du manifeste, `manifestes/balance.manifest.ts` et `bilan.manifest.ts`)

| Service | Route | Voyant |
|---|---|---|
| balance | `…/verifications/referentiel-resolu` | 🟢 tous les dossiers résolus à un artefact vérifié ; 🔴 ≥ 1 sans référentiel ou ambigu (avec le nombre) |
| balance | `…/verifications/paquet-fiscal-disponible` | 🟢 / 🟠 paquet pays × année manquant (avec le nombre) |
| balance | `…/verifications/balances-equilibrees` | 🟢 0 balance validée hors tolérance (100 unités mineures) ou différente de la valeur rangée ; 🔴 sinon |
| bilan | `…/verifications/referentiel-resolu` | 🟢 / 🔴 comme ci-dessus, postes et table de passage |
| bilan | `…/verifications/snapshots-intacts` | 🟢 0 jeu d'états VALIDÉ dont l'empreinte diffère ; 🔴 sinon |
| bilan | `…/verifications/consommateurs-actifs` | 🟢 aucun consommateur Kafka à l'arrêt (`etat-consommateurs`) ; 🔴 avec leur nom |

Garde : identité `MOTEUR` seule (`@AdmetIdentitesDeService('MOTEUR')`, comme STORY-928), sorte `verification` de la matrice (ouverte au MOTEUR en `EN_INSTALLATION`), idempotence par clef, corps
`verification-installation@1` (`contrat/verification-installation.schema.json` du catalogue). Le catalogue doit connaître l'adresse des services (`INSTALLATION_SERVICES`, `INSTALLATION_JETON_SERVICE`),
**et à ce moment-là le `PUT` ne diffère plus rien** : la recette devra poser ces adresses et basculer `cabinet-moteur` sur `POST /installations` d'un bloc (le test D-929-1 s'inverse).
`conseil`, `consolidation` et `declarations` ont leurs propres vérifications (même service pour `conseil`) : à nommer séparément.

Rien chez B : le moteur fait ce qu'il doit.
