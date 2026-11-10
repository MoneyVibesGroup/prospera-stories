# Relecture : versions et réalité de la pile (spine prospera-app, 2026-11-10)

Méthode : `npm view` (latest, time, peerDependencies, engines), API GitHub Traefik, lecture de `next@16.4.6` et `eslint-plugin-boundaries@7.4.2` packés, build réel `next build --webpack` d'un projet jetable (next 16.4.6, react 19.3.1), docs Traefik v3.7 (raw GitHub).

## Verdict
Les versions de la mémoire sont exactes, mais deux points de la spine sont faux ou périmés : le dossier `src/app/_coque/` n'est PAS routable, et Node ≥ 20.9 est hors support. Deux lignes (Vitest 4.x, TypeScript 5.x) ne sont plus les dernières majeures et doivent être présentées comme un choix.

## Tableau Stack, ligne par ligne

| Ligne spine | Relevé 2026-11-10 | Statut | Constat |
| --- | --- | --- | --- |
| Node ≥ 20.9 | next 16.4.6 `engines.node >=20.9.0` ; LTS actives (nodejs.org) : 24 (Krypton), 26 (Lithium) | vérifié, **à corriger** | Le minimum de Next est exact, mais Node 20 est arrivé en fin de vie (30/04/2026). Exiger l'image d'exécution et le CI en Node 24 LTS (22 au plus bas) ; garder « ≥ 20.9 » comme plancher technique de Next seulement. L'existant utilise `@types/node ^20` : le monter à 24 dans le nouveau dépôt. |
| Next 16.4.x, build webpack | latest 16.4.6 (09/11) ; `next build --webpack` : option présente dans la CLI 16.4.6 et build OK dans le test | vérifié | RAS. L'existant est en 16.2.10 exact : la copie du squelette implique un relevage (next, eslint-config-next, react, react-dom épinglés ensemble). |
| React / React DOM 19.3.x | 19.3.1 ; peer de next 16.4.6 `^19.0.0` | vérifié | Compatible. L'existant est en 19.2.4 exact. |
| TypeScript 5.x | latest **7.0.2** (08/07/2026) ; 5.9.3 dernière 5.x ; eslint-config-next 16.4.6 peer `typescript >=3.3.1` | vérifié, **à justifier** | « 5.x » est un choix, plus la dernière majeure. Soit écrire « 5.9 (7.x non retenu : non validé avec Next 16.4 / typescript-eslint) », soit valider 7. Non confirmé : compatibilité TS 7 avec la pile de lint. |
| Tailwind 4.x + shadcn + Lucide | tailwindcss 4.3.5 ; radix-ui 1.8.1 ; lucide-react 1.71.0 | vérifié | RAS. |
| @tanstack/react-query 5.107.x | 5.107.1 (06/11) | vérifié | RAS. |
| next-intl 4.14.x | 4.14.10 ; peer `next ^12…^16`, `react ... ^19.0.0` | vérifié | Compatible avec Next 16.4 et React 19.3. |
| RHF 7.x + zod 4.x | 7.91.0 ; 4.6.7 | vérifié | RAS. |
| openapi-typescript 7.13.x | 7.13.0 | vérifié | RAS. |
| eslint-plugin-boundaries 7.4.x (ESLint 9 plat) | 7.4.2 ; peer `eslint >=6`, node >=18.18 ; exports `configs.recommended/strict/strict-legacy` | vérifié | Compatible ESLint 9 (et 10). **Réglages en v7** : `settings["boundaries/elements"]` (+ `boundaries/files`) ; règle **`boundaries/dependencies`** (politiques `default`, `policies[{from, allow/disallow:{to}}]`). `boundaries/element-types` est **déprécié** (renommé, avertissement à l'exécution). Autres règles : `entry-point`, `external`, `no-private`, `no-unknown`, `no-unknown-files`, `no-ignored`. La spine ne nomme pas la règle : le dire (AD-8 ou la règle de frontières) pour que le squelette n'écrive pas du v5. |
| Vitest 4.x + Playwright 1.6x | vitest latest **5.1.0** (5.0.0 le 03/09/2026) ; 4.1.12 dernière 4.x ; Playwright 1.65.0 ; @vitejs/plugin-react 6.3.0 | **à corriger** (Vitest) | Playwright « 1.6x » exact. Vitest 4.x est la majeure précédente depuis deux mois : prendre 5.x (changements de rupture de 5.0 non lus, à vérifier au squelette) ou écrire « 4.x, 5 non retenu ». L'existant est en `^4.1.10`. |
| Traefik 3.7.x | v3.7.18 (10/11) ; v3.8.0-rc en cours | vérifié | RAS. |
| ESLint 9 | latest **10.14.0** (depuis 06/02/2026) ; eslint-config-next 16.4.6 peer `>=9` ; boundaries `>=6` | vérifié, à noter | ESLint 9 reste valable (continuité avec l'existant `^9`), mais ce n'est plus la dernière majeure : l'écrire comme choix. |

## Next 16.4

- Fichier `middleware` renommé `proxy` : confirmé dans `next/dist/lib/constants.js` (`PROXY_FILENAME = 'proxy'`, `MIDDLEWARE_FILENAME = 'middleware'` encore présent, ancien nom toujours reconnu). La spine n'utilise aucun des deux (le Traefik fait le routage) : RAS. S'il faut un garde de requête côté Next, écrire `src/proxy.ts`.
- Forme `src/app/(app)/m/[code]/layout.tsx` : groupe de route `(app)` + segment dynamique + layout, valide (build d'essai avec `(app)/m/[code]/page.tsx` : route `/m/[code]` servie). Un seul `layout.tsx` de garde est donc possible.
- **Dossier `_coque` : NON routable.** Le code de 16.4.6 ignore tout dossier dont le nom commence par `_` (`next-app-loader`, `route-discovery`), et le test le confirme : build avec `src/app/_coque/config/route.ts` seul, la route n'apparaît pas.
- **Alternatives testées (build webpack + `next start`)** :
  - `src/app/%5Fcoque/config/route.ts` : **sert `/_coque/config` (200)** ; `/%5Fcoque/config` donne 404. Fonctionne, mais le dossier à nom encodé est fragile (outils, IDE, Windows, `eslint-plugin-boundaries`, jeux de patterns).
  - `src/app/-coque/config/route.ts` : sert `/-coque/config` (200). Sans encodage.
  - Autre option sans dossier spécial : `src/app/coque/...` sous l'URL `/coque/*`, ou `/serveur/*`.

## Traefik 3.7

- `replacePathRegex` (regex + replacement `/bar/$1`, en-tête `X-Replaced-Path`) et `stripPrefixRegex` (liste de regex, en-tête `X-Forwarded-Prefix`) : tous deux présents dans la doc v3.7.
- La réécriture `/api/<code>/v1/… → /api/v1/…` est une **réécriture de milieu de chemin** : `stripPrefixRegex` seul ne peut pas la faire (il ne retire que le préfixe, il faudrait réajouter `/api`). Utiliser `replacePathRegex` (`^/api/(code1|code2|…)/v1/(.*)` → `/api/v1/$2`), ou `stripPrefixRegex` + `addPrefix`. Préciser dans le texte du proxy que la table génère un routeur par code (`PathPrefix(/api/<code>/)`) avec son service.
- Piège de syntaxe : en labels Docker le `$` se double (`$$2`), en fichier YAML non. À noter pour la table générée (C10).

## Corrections à apporter à la spine

1. Remplacer `src/app/_coque/` (lignes 35, 152, 186 et AD-8/AD-11) par un chemin routable : `src/app/%5Fcoque/` (URL `/_coque/*` conservée) ou renommer le préfixe en `/-coque/*` / `/coque/*`. Recommandation : renommer en `/coque/*` (aucune astuce d'encodage), ou garder `/_coque/*` avec `%5Fcoque` et un test e2e qui l'appelle.
2. Node : « ≥ 20.9 » → Node 24 LTS comme cible (20 en fin de vie depuis 04/2026).
3. Vitest : 4.x → 5.x, ou noter « 4.x, 5.1 non retenu » ; idem une phrase sur TypeScript 5.x (7.0 existe) et ESLint 9 (10 existe).
4. Nommer la règle de frontières `boundaries/dependencies` (pas `element-types`) et les réglages `boundaries/elements`.
5. Traefik : préciser `replacePathRegex` (et non `stripPrefixRegex`) pour la réécriture vers `/api/v1`.
6. Note de reprise : l'existant épingle next 16.2.10 / react 19.2.4 ; le nouveau dépôt part sur 16.4.6 / 19.3.1, donc la « copie du squelette » inclut ce relevage (et celui de `eslint-config-next`).

## Non vérifié
Changements de rupture de Vitest 5.0, compatibilité TypeScript 7 avec typescript-eslint et Next, comportement de `%5Fcoque` sous `next dev` (testé en build/start seulement), rendu de `proxy.ts`.
