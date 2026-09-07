# STORY-630 : La suite e2e rougit au hasard — les batteries laissent supertest ouvrir et refermer un port à chaque requête

Status: done

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois) — rattachement d'outillage
**Service :** `bilan-service`
**Points :** 2 · **Sprint :** S20
**Origine :** relevée pendant la validation de **STORY-466** (2026-09-07), puis mesurée et diagnostiquée.

> ⚠️ **Renumérotée de 599 en 630 le 2026-09-07, collision d'identifiant.** `sprint-status.yaml`
> sur `main` annonçait `story_id_high_water_mark: "STORY-598"`, mais **599 et 600 étaient déjà
> pris** par la branche non mergée `MNV-599` de `docs` (« le compte d'encaissement PI-SPI »,
> 2026-09-05), dont le message signalait lui-même la collision, et des fiches existent jusqu'à
> **STORY-629** sur d'autres branches non mergées. C'est exactement le mode de collision décrit
> par le bloc `RESERVED_RANGES` du fichier : **seul `sprint-status.yaml` MERGÉ fait foi**, et il
> ne voit pas les branches en vol. Le balayage a donc porté sur **toutes les branches
> distantes**, pas sur `main`.

---

## Le fait

`npm run test:e2e -- --runInBand` échoue **par intermittence**, sur `dev`, sans aucune
modification : **1 passe rouge sur 7** mesurée. Le test qui tombe **change à chaque fois** —
`bilan-jeu-etats`, `bilan-comparaison`, `mapping-overrides`, `bilan-dossier-scope`,
`bilan-referentiel`, `bilan-hypotheses` — et le fichier rejoué **seul** est vert. La signature
est toujours la même : un **401** ou un **404** là où la requête devrait passer.

Ce rouge coûte deux fois. Il fait douter d'un livrable sain, et surtout il **entraîne à ignorer
un e2e rouge** — le jour où l'un d'eux tombe pour une vraie raison, il sera classé « encore le
flake ».

## La cause, mesurée et non déduite

`app.init()` construit l'application **sans la mettre en écoute** : `server.address()` vaut
`null`. Dans ce cas, `supertest` appelle lui-même `server.listen(0)` **à chaque requête**, puis
`server.close()` dès la réponse reçue. Une batterie qui fait cent requêtes ouvre et referme donc
**cent ports éphémères**.

Or **deux applications Nest cohabitent dans le processus** : `bilan-referentiel` et
`bilan-projection` en déclarent chacune deux, et `--runInBand` les exécute dans le même
interpréteur. Elles puisent dans la même plage de ports, et une requête destinée à l'une finit
**servie par l'autre**.

La preuve est le corps brut de la réponse fautive, capturé par sonde :

```
BILAN_ACTIF/Réf. -> 404
texte  = "<!DOCTYPE html>…<pre>Cannot POST /api/v1/dossiers/…/bilan/mapping-overrides</pre>…"
entêtes= {"x-powered-by":"Express", "content-type":"text/html; charset=utf-8", …}
```

Ce n'est **pas** le JSON du filtre global — c'est le 404 par défaut d'**Express**, rendu par une
application **qui n'a pas cette route**. Le **401** est le même accident vu d'un autre angle :
l'application d'accueil valide les jetons contre **une autre paire de clés RS256**, et le `kid`
du jeton lui est inconnu.

## Critères d'acceptation

- [x] AC-1 — Chaque batterie e2e ouvre **une fois** son socket d'écoute, sur `127.0.0.1`, et le
      garde pour toute la durée de la suite. `supertest` réutilise alors cette adresse et
      **n'ouvre ni ne ferme plus rien**.
- [x] AC-2 — Le point d'entrée est **unique et documenté** (`test/utils/serveur-e2e.ts`) : une
      recopie par fichier finirait par diverger, et le défaut est justement invisible du fichier
      qui le porte.
- [x] AC-3 — Une garde de **balayage** lit **tous** les `test/*.e2e-spec.ts` et refuse
      l'affectation directe `server = app.getHttpServer()`. Aucune batterie ne peut se garder
      elle-même : celle qui porte le défaut reste **verte**, c'est un voisin qui tombe.
- [x] AC-4 — Le taux de rouge est mesuré **avant et après**, sur un nombre de passes qui rende
      la mesure lisible.

## Périmètre

**Inclus** : les 22 batteries e2e de `bilan-service`, l'utilitaire partagé, la garde de balayage.

**Hors** : le code de production — **aucun fichier de `src/` n'est touché**. Le défaut est
entièrement dans l'outillage de test. Hors également : les autres services, qui portent
probablement le même patron et méritent leur propre passage.

---

## Progress Tracking

**Statut : done** — clôturée le 2026-09-07. PR `bilan-service` #97 rebase-mergée sur `dev`.

### Le diagnostic, et comment il a été obtenu

Les hypothèses faciles ont toutes été **écartées par mesure**, pas par raisonnement :

| Hypothèse | Verdict |
|---|---|
| Jetons expirés | Écartée — `expiresIn: 900` contre une suite de 40 s. |
| Limiteur du `Throttler` (100/min/IP) | Écartée — le module de test du fichier fautif **ne le monte pas**. |
| Limiteur de `jwks-rsa` (10 requêtes/min) | Écartée — sonde posée sur le serveur JWKS : **exactement 22 requêtes par passe**, une par application. Le cache tient. |
| Ma branche | Écartée — mesurée **sur `dev` seul** : 1 passe rouge sur 7. |

La cause est venue de la **capture du corps brut** de la réponse fautive, pas de sa seule
lecture de statut :

```
404   x-powered-by: Express   content-type: text/html
<pre>Cannot POST /api/v1/dossiers/…/bilan/mapping-overrides</pre>
```

Ce n'est pas le JSON du filtre global : c'est le 404 par défaut d'**Express**, rendu par une
application **qui n'a pas cette route**. Le **401** est le même accident vu d'un autre angle —
l'application d'accueil valide les jetons contre **une autre paire de clés RS256**.

### Mesure

| | avant | après |
|---|---|---|
| `bilan-referentiel` seul (`--runInBand`) | **2 rouges / 20 passes** | **0 / 25** |
| suite complète (`--runInBand`) | **1 rouge / 7 passes** | **0 / 35** |
| suite complète en **mode CI** (parallèle) | jamais mesuré avant | 1 rouge / 38 — cf. ci-dessous |

Portes : lint 0 avertissement, build OK, 2 096 unitaires (couverture inchangée à 98,89 / 94,62),
**622 e2e**. Cinq mutations sur la garde de balayage, toutes rouges.

### ⚠️ Un second mode de défaillance, DISTINCT, non corrigé par cette story

Une passe sur 38 en **mode parallèle** (celui de la CI) a montré un échec d'une **autre**
signature : dans un seul fichier, les 26 premiers tests passent puis **50 tombent d'un coup en
401**, tous ceux qui exigent une résolution de clé. Aucun 404.

L'analyse du mécanisme : `jwks-rsa` **ne met pas les échecs en cache**. Si la toute première
récupération du JWKS échoue, rien n'est mémorisé, chaque requête suivante retente — et le
limiteur à **10 requêtes par minute** rejette alors tout le reste. **Un seul hoquet transitoire
suffit donc à empoisonner un fichier entier.**

⛔ **Ce n'est pas ce que cette story corrige, et ce n'est pas mesurable comme un progrès** : le
mode parallèle n'a **jamais été mesuré avant** le correctif, il n'y a donc aucun taux de
référence. Le déclencheur du premier échec reste inconnu : 38 passes parallèles n'en ont
reproduit qu'une, et la sonde JWKS n'était pas en place ce jour-là. **À traiter par une story
dédiée**, avec la sonde en place dès le départ.

### Revue de code — 3 constats, 1 bloquant, tous corrigés

1. ⚡⚡ **BLOQUANT — la garde de balayage laissait repasser le défaut exact de la story.** Elle
   était ancrée sur la **forme littérale** de l'affectation. Un fichier montant **DEUX**
   applications et n'en convertissant qu'une passait au vert : un second montage sous un autre
   nom de variable, ou un appel écrit inline dans un essai. Or `bilan-referentiel` et
   `bilan-projection` sont **précisément** les deux fichiers à double montage. La garde
   interdit désormais le **verbe** dans tout `*.e2e-spec.ts` — le seul appelant légitime vit
   dans `test/utils/`, hors balayage. Deux mutations ajoutées, les deux rouges.

2. **Le balayage n'était pas récursif alors que la découverte de jest l'est** (`rootDir: "."`,
   `testRegex: ".e2e-spec.ts$"`) : une batterie rangée dans un sous-dossier aurait été
   **exécutée** et invisible du balayage, et le compteur de non-vacuité n'aurait pas bougé.
   Mesuré par une batterie temporaire en sous-dossier : verte avant, rouge après.

3. ⚡ **Un commentaire structurant FAUX** : il attribuait la cohabitation des deux applications
   au mode séquentiel. Elles vivent dans un **même fichier**, donc dans le même *worker* quel
   que soit le mode — et ma propre mesure (« `bilan-referentiel` joué **seul**, 2 rouges sur
   20 ») le démentait déjà. Ni `npm run test:e2e` ni la CI ne passent ce drapeau : le
   commentaire aurait fait conclure à tort que la CI est immunisée. Famille STORY-402.

### Revue de sécurité — 0 vulnérabilité, et un durcissement inattendu

Cinq axes instruits et clos. Le plus utile n'est pas un constat mais une **découverte** :

⚡⚡ **Avant cette story, l'application sous test était joignable depuis le réseau de la
machine.** `supertest` appelait `server.listen(0)` **sans hôte** — Node lie alors `::`,
c'est-à-dire **toutes les interfaces** — et le faisait à **chaque requête**. Toute la surface
API, guards compris, était exposée sur un port éphémère pendant les tests. Le correctif la
ramène à un socket **loopback unique**. Un correctif de performance de suite est aussi, ici, un
durcissement.

Le dernier socket qui restait ouvert à tous — le serveur JWKS de la fixture RS256 — a été
aligné dans un commit dédié. Il ne sert qu'une clé **publique**, mais l'incohérence avec
l'argument écrit du helper était elle-même un piège.

Deux tests de sécurité vérifiés **non vacants sous le nouveau socket**, par mutation : ouvrir
`trust proxy` en grand fait rougir `throttler-proxy` ; transformer le 404 d'anti-énumération en
403 fait rougir **12 tests sur 77** de `bilan-dossier-scope`.
