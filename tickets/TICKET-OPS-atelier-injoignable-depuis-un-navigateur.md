# TICKET ops — l'Atelier est injoignable **depuis un navigateur** : CORS absent sur `balance-service`, et artefacts de référentiel invalidés par CRLF

> ## ✅ CORRIGÉ le 2026-08-08 — les deux défauts, **plus** les deux mêmes pièges encore armés ailleurs
>
> | Correctif | Où | Vérification |
> |---|---|---|
> | `CORS_ALLOWED_ORIGINS` ajouté à **`balance-service`** | `docker-compose.yml` | préflight **204** + `Access-Control-Allow-Origin: http://localhost:3100` |
> | …et à **`bilan-service`**, dernier service qui en manquait (préventif : aucun écran de Bilan n'est livré) | `docker-compose.yml` | idem — **les 7 services applicatifs** répondent maintenant au préflight |
> | `.gitattributes` (`-text` sur les artefacts) | `balance-service`, branche `fix-gitattributes-artefacts-checksum` (`8bcf651`) | suppression + re-sortie de caisse ⇒ LF, `01b892c0…`, `integrity: verified` |
> | `.gitattributes` idem | `bilan-service`, branche `fix-gitattributes-artefacts-checksum` (`ac6d5b5`) | ses **cinq** artefacts étaient **déjà** en `w/crlf` — défaut actif, sans témoin |
>
> ⚠️ **Correction d'un constat de la première rédaction de ce ticket** : `bilan-service` n'était pas
> « à risque », il était **déjà cassé** (`git ls-files --eol` → `i/lf w/crlf` sur les 5 artefacts).
> Le premier examen s'était fié à une inspection d'octets erronée plutôt qu'à `git ls-files --eol`.
>
> ⚠️ **Piège rencontré en corrigeant, consigné dans les deux `.gitattributes`** : une fois `-text`
> posé, **`git add --renormalize` n'annule pas la corruption, il l'importe**. Sous `-text` git
> enregistre les octets de l'arbre de travail *tels quels* : lancé sur un poste où les fichiers sont
> sortis en CRLF, il écrit ces CRLF **dans le dépôt** et les propage à tous les postes, Linux compris.
> Le geste correct est l'inverse : `rm` puis `git checkout --`, pour repartir des octets de l'index.
>
> Les branches ne sont **pas poussées** — elles attendent relecture.

**Type :** défaut d'exploitation (stack docker) — **bloquant pour tout le module Atelier**
**Service :** `balance-service` (:3007) + `bilan-service` (:3004) + `docker-compose.yml` de la racine `MoneyVibes_Apps`
**Ouvert par :** **FE-057** à l'Integration Gate, 2026-08-08
**Priorité :** Must — dans l'état constaté, **aucun** écran de l'Atelier ne fonctionne dans un navigateur

---

## Deux défauts, cumulatifs, tous deux invisibles au `curl`

### ① `CORS_ALLOWED_ORIGINS` n'est pas passé à `balance-service`

Six services du `docker-compose.yml` reçoivent
`CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS:-http://localhost:3100,http://localhost:3110}`.
**`balance-service` ne l'avait pas.** Or son bootstrap (STORY-109, étendu STORY-131) applique une
allowlist explicite et **désactive CORS quand elle est vide** :

```ts
if (corsConfig.allowedOrigins.length > 0) { app.enableCors({ … }); }
```

Constaté : `OPTIONS /api/v1/balances` avec `Origin: http://localhost:3100` → **404, sans un seul
en-tête `Access-Control-*`**. Le navigateur bloque donc `referentiels/actifs` **et** `balances`, et
l'écran rend « Le service balance est indisponible pour le moment ».

⚠️ **Pourquoi c'est passé inaperçu.** L'appel serveur-à-serveur (`curl`, tests e2e du service,
vérifications de story) ne fait **pas** de préflight : le service répondait parfaitement `200` à
chaque vérification, pendant qu'aucun navigateur ne pouvait l'atteindre. C'est le seul service que le
navigateur appelle en direct sans qu'un gate navigateur l'ait jamais confronté depuis l'ajout du
défaut de confiance vide.

**Correctif appliqué le 2026-08-08** (une ligne, alignée sur les six autres services) :

```yaml
  balance-service:
    environment:
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS:-http://localhost:3100,http://localhost:3110}
```

Après `docker compose up -d balance-service` : préflight **204**,
`Access-Control-Allow-Origin: http://localhost:3100`. À **relire et conserver** — et à vérifier sur
les autres services que le navigateur appelle en direct.

### ② Les artefacts de référentiel sont checksum-invalides sur un clone Windows

`balance-service` vérifie l'intégrité de ses artefacts embarqués contre le sha256 codé dans
`referentiel-registry.ts`. Sur un clone Windows (`core.autocrlf=true` par défaut, **et
`.gitattributes` absent du dépôt**), git réécrit les `.json` d'`assets/` en **CRLF** à la sortie de
caisse. Le hash change, et comme `docker-compose.override.yml` monte `src/` en volume, le conteneur
lit ces octets-là :

| Fichier | sha256 sur disque (CRLF) | sha256 attendu (LF) |
|---|---|---|
| `syscohada-revise-2.1.json` | `303abe9e…` | `01b892c0…` |

Résultat : `GET /referentiels/actifs` → **502 `REFERENTIEL_INTEGRITY`** — « Paramétrage non intègre
(checksum invalide) ». Le module entier est fermé, avec un message qui accuse l'artefact alors que le
contenu est intact.

**Correctif appliqué** : un `.gitattributes` dans **`balance-service`** et dans **`bilan-service`**
(source de vérité des mêmes octets — décision D-078-2), qui retire à git le droit de convertir ces
fichiers :

```gitattributes
* text=auto
src/modules/referentiel/assets/*.json -text
```

Un artefact dont le checksum fait foi ne peut pas être soumis à la normalisation de fin de ligne :
c'est un **binaire au sens de git**, quoi qu'en dise son extension. `-text` plutôt que
`text eol=lf` — on n'annonce pas la fin de ligne voulue, on interdit la conversion, dans les deux sens.

`* text=auto` est sans effet sur l'existant : `git add --renormalize` ne produit aucun changement
dans les deux dépôts, l'index étant déjà intégralement en LF.

## Definition of Done

- [x] `CORS_ALLOWED_ORIGINS` présent pour `balance-service` dans `docker-compose.yml`.
- [x] Les autres services appelés en direct par un navigateur sont audités : `bilan-service` était le
      dernier sans CORS (défaut sans témoin, aucun écran de Bilan livré) — corrigé. **7/7** services
      applicatifs répondent au préflight avec la bonne origine.
- [x] `.gitattributes` posé dans `balance-service` **et** `bilan-service` pour les artefacts à checksum.
- [x] Un clone Windows neuf ouvre l'Atelier dans un navigateur sans intervention manuelle — prouvé par
      suppression + re-sortie de caisse des artefacts (retour en LF, hash conforme, `integrity: verified`).
- [ ] **Relecture + pousse des deux branches `fix-gitattributes-artefacts-checksum`** (non poussées).
- [ ] Étendre l'audit `.gitattributes` aux dépôts futurs portant des artefacts à checksum
      (`fiscal-service` notamment, non présent localement).
