# STORY-396 : Une panne d'infrastructure est rendue au cabinet comme « votre pièce est illisible »

**Epic :** EPIC-020 — Pièces justificatives & OCR
**Réf. :** écart trouvé à la **vérification docker de STORY-385**, 2026-08-24
**Priorité :** Should Have
**Story Points :** 3
**Statut :** not_started
**Complexité :** medium
**Sprint :** 20
**Service :** `document-service` (`:3006`)

---

## Le constat — un défaut du SERVEUR se présente comme un défaut de la PIÈCE

Le processeur d'extraction traduit **toute** erreur synchrone du pipeline OCR en un `ECHEC` métier :

```ts
// profil-extraction.processor.ts
// Pièce **indécodable/corrompue** : l'OCR a échoué (le worker n'a rien pu
// reconnaître). On la traite comme une pièce inexploitable → ECHEC
await this.finaliser(eventId, data, [], 0, ProfilExtractionStatut.ECHEC);
```

Le commentaire annonce le cas qu'il vise — « ex. PNG au chunk IDAT invalide » — et il a raison pour
celui-là. Mais le `catch` ne distingue **pas** ce que l'erreur dit :

| Erreur attrapée | Ce que c'est vraiment | Ce que le cabinet lit |
|---|---|---|
| chunk PNG invalide | la pièce est corrompue | « illisible » ✅ |
| `Cannot find module '@napi-rs/canvas'` | **le serveur n'a pas son rasteriseur** | « illisible » ❌ |
| `tessdata` absent, OOM du worker, disque plein | **le serveur** | « illisible » ❌ |

**Observé en vrai** le 2026-08-24 : un PDF parfaitement valide, déposé sur une stack docker, est ressorti
`ECHEC` avec `champs: []`. Cause réelle dans les logs : `Cannot find module '@napi-rs/canvas'
Require stack: /app/dist/ocr/pdf-page-renderer.js`. Rien, **nulle part**, ne disait au collaborateur que la
panne était de notre côté :

- `/api/v1/health` répond **`ok`** *(mongodb up, kafka up, minio up)* — la santé du service ne couvre
  aucune dépendance du pipeline OCR ;
- la liste des pièces affiche `statutOcr: ECHEC`, que STORY-385 vient précisément de définir comme
  **« illisible »** ;
- le seul geste que l'écran propose alors est de **re-scanner** — c'est-à-dire de refaire, indéfiniment,
  ce qui ne peut pas marcher.

⚠️ **STORY-385 rend ce défaut plus coûteux, pas moins** : elle a fait de `ECHEC` une valeur d'enum au
contrat, opposée à `PRETE` + liste vide (« lu, rien trouvé ») et à `EN_COURS` (« pas encore lu »). Le
contrat est désormais précis — et il **affirme une contre-vérité** dès que la panne est nôtre.

### Comment l'écart a été trouvé (et ce que ça dit du dev)

La stack avait été démarrée par `docker compose up -d` **sans `--build`** : l'image portait un
`node_modules` **antérieur** au commit `bugfix(ocr)` qui a introduit `@napi-rs/canvas`. Vérifié :

```bash
docker compose run --rm --no-deps --entrypoint sh document-service \
  -c 'node -e "console.log(require(\"/app/package.json\").dependencies[\"@napi-rs/canvas\"])"'
# → undefined
```

La dépendance est **bien** déclarée sur `dev` et le `package-lock.json` porte les binaires linux : un
`--build` répare l'exécution. **Ce n'est donc pas un défaut de code** — et c'est exactement ce qui rend
l'écart intéressant : une image périmée est un incident d'exploitation **banal**, et le système l'a
converti en un mensonge métier durable, écrit en base, sans qu'aucun signal ne rougisse.

---

## User Story

En tant que **collaborateur de cabinet**,
je veux **savoir quand une lecture a échoué à cause du système et non de ma pièce**,
afin de **ne pas re-scanner indéfiniment un document qui n'a jamais eu de problème**.

---

## Ce que la story doit livrer

- **Séparer, au moment du `catch`, la panne de PIÈCE de la panne de SERVICE.** Une erreur qui n'est pas
  imputable au contenu déposé (module absent, `tessdata` introuvable, worker tué, écriture impossible) ne
  doit pas produire le même état terminal qu'une pièce corrompue.
- **Un état distinct, terminal ou non**, pour la panne de service — à trancher à la conception : soit une
  5ᵉ valeur de statut *(⚠️ contrat de lecture : elle entre dans l'enum publié par STORY-385, et **casse la
  compilation** des clients — c'est voulu)*, soit un `ECHEC` **requalifiable** assorti d'un motif. La
  différence porte sur une question métier : **la pièce doit-elle être rejouée automatiquement** quand le
  service est réparé ? Si oui, l'état ne peut pas être terminal.
- **`/api/v1/health` couvre les dépendances du pipeline OCR** — au minimum le rasteriseur PDF et les
  `tessdata` : un service qui ne sait plus lire un PDF n'est pas `ok`. C'est le seul signal qui aurait
  transformé 20 minutes d'enquête en une ligne.
- ⚠️ **Aucun changement de contrat d'ÉVÉNEMENT sans arbitrage** : `document.profil.extrait` et
  `document.piece.extrait` publient `statut: 'PRETE' | 'ECHEC'`. Une 5ᵉ valeur les touche, donc **2 dépôts**
  (`document-service` producteur, `balance-service` consommateur) — à cadrer avant, pas à découvrir pendant.

---

## Acceptance Criteria

- [ ] Une erreur **non imputable à la pièce** simulée dans le pipeline OCR ne produit **pas** l'état qui
      signifie « illisible » — vérifié par mutation *(retirer la distinction ⇒ le test rougit)*.
- [ ] Une pièce réellement corrompue produit **toujours** l'état « illisible » — la distinction n'élargit
      rien.
- [ ] `/api/v1/health` passe **`down`** quand le rasteriseur PDF est absent, et le dit nommément.
- [ ] Le motif de la panne de service est **consultable** (journalisé et, si l'arbitrage le retient, publié
      sur la lecture des pièces) — jamais seulement dans les logs du conteneur.
- [ ] Non-régression : le chemin **PNG/JPEG**, qui ne passe pas par le rasteriseur, est inchangé.
- [ ] Si un état s'ajoute au contrat d'événement : la story est **livrée sur 2 dépôts**, PR ouvertes et
      intégrées ensemble.

---

## Dépendances

**Prérequise :** **STORY-385** ✅ *(c'est elle qui a fait de `ECHEC` une valeur de contrat explicite,
donc qui rend la contre-vérité lisible)*.
**Touche potentiellement :** `balance-service` *(consommateur des deux contrats d'extraction)*.

---

## Note de provenance

Trouvée à la **vérification docker de STORY-385**, pas en lisant le code : le PDF de test devait servir à
produire une pièce `PRETE`, il est ressorti `ECHEC`. ⚡ **L'échec a rendu service deux fois** — il a fourni
à STORY-385 le cas `ECHEC` réel dont sa table de vérification avait besoin *(une pièce `ECHEC` porte bien
`champs: []` en base, et c'est ce qui prouve que le statut doit décider, pas le tableau)*, et il a exposé
ce défaut-ci.
