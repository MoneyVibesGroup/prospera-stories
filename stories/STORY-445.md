# STORY-445 : Rouvrir une liasse sur un exercice CLOS est accepté — et sans retour : la liasse reste bloquée en brouillon et le portefeuille l'affiche « bilan en cours »

Status: done

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `bilan-service`
**Points :** 2 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-034** (cycle brouillon → validé, snapshot immuable, piste d'audit), 2026-08-27.
Relevé en lisant les contrôleurs de `bilan-service` sur `origin/dev`.

---

## Le fait

`JeuEtatsService.valider()` appelle `refuserSiExerciceClos()` (409 `EXERCICE_CLOS`, STORY-066).
**`rouvrir()` et `recalculer()` ne l'appellent pas.**

Sur un exercice déclaré `CLOS`, la séquence est donc :

1. `POST …/rouvrir` → **200**. Le jeu repasse `BROUILLON`.
2. `liasse.etat.change` publie `etat: 'BROUILLON'` → `dossier-service` recalcule l'avancement du
   dossier en `BILAN_EN_COURS`. **Le portefeuille affiche « bilan en cours » sur un exercice clos.**
3. `POST …/valider` → **409 `EXERCICE_CLOS`**.

La liasse est en **cul-de-sac** : elle n'a plus de version courante déclarée, elle ne peut pas
être re-figée, et rien à l'écran n'indique que le geste manquant est de rouvrir l'**exercice**,
pas la liasse. L'utilisateur a détruit un état stable en une requête que le serveur a acceptée.

## Critères d'acceptation

- [ ] AC-1 — `rouvrir()` appelle `refuserSiExerciceClos()` **avant** toute écriture →
      `409 EXERCICE_CLOS`, aucune transition, aucun événement publié.
- [ ] AC-2 — `recalculer()` fait de même (un brouillon d'exercice clos n'a rien à recalculer :
      il ne pourra pas être validé).
- [ ] AC-3 — Un test couvre la séquence complète (clore → rouvrir → **refus**), pas seulement
      l'appel isolé.
- [ ] AC-4 — Le message nomme le geste : « rouvrir l'exercice 2025 d'abord ».
- [ ] AC-5 — **Cas des jeux déjà en cul-de-sac** : aucune migration. Rouvrir l'exercice suffit à
      les débloquer ; le préciser dans les notes de version.

## Conséquences ailleurs

- Le symptôme est visible **hors** de `bilan-service` : c'est `dossier-service` qui affiche l'état
  faux. Un refus au bon endroit supprime les deux.
- La maquette FE-034 joue cette séquence : bascule « **Rouverte sur exercice clos** ».

---

## Progress Tracking

**Statut : `done`** — implémentée, validée, revue (code + sécurité), **vérification docker
rejouée sur l'état final**, PR `bilan-service` **#77** (2 commits) rebase-mergée sur `dev` le
2026-09-03.

Branches créées **avant** la première ligne de code :

```
docs             MNV-445
bilan-service    MNV-445
```

**Un seul dépôt impacté** : la garde, son message et ses tests vivent dans `bilan-service`.
Aucun contrat d'événement ne change — au contraire, la story **supprime** une publication
(`liasse.etat.change` en `BROUILLON` sur un exercice clos) qui n'aurait jamais dû partir.

### Ce qui est livré

- **AC-1** — `rouvrir()` appelle `refuserSiExerciceClos()` **avant la lecture du dernier
  snapshot et avant la transaction** : aucune transition, **aucun événement publié**.
- **AC-2** — `recalculer()` de même, juste avant l'écriture.
- **AC-3** — la **séquence complète** est jouée en e2e : valider → clore → rouvrir → refus →
  l'état stable est **intact** (jeu `VALIDE`, version 1, `derniereReouverture` toujours
  `null`) → rouvrir l'exercice → la réouverture repasse.
- **AC-4** — le message nomme **l'exercice, le geste refusé et le geste à poser** :
  « Exercice 2025 clos : la réouverture de la liasse est interdite. Rouvrir l'exercice 2025
  d'abord, côté dossier (POST /api/v1/dossiers/{dossierId}/exercices/{id}/rouvrir). »
- **AC-5** — **aucune migration** : mesuré sur un jeu réellement mis en cul-de-sac (par le
  code muté), rouvrir l'**exercice** — et rien d'autre — le débloque.

### ⚠️ Le message unique aurait été faux sur deux chemins sur trois

`refuserSiExerciceClos` portait un message en dur : « validation interdite jusqu'à
ré-ouverture ». Réutilisé tel quel sur `rouvrir` et `recalculer`, il aurait **nommé un geste
que l'utilisateur n'a pas posé**, et laissé entier le vrai malentendu — croire que c'est la
**liasse** qu'il faut rouvrir alors que c'est l'**exercice**. D'où le paramètre `geste` et sa
table `GESTE_INTERDIT`.

### ⚠️ Précédence des refus, documentée

Sur `rouvrir`, la garde est posée **après** le contrôle de statut : un jeu déjà `BROUILLON`
sur un exercice clos rend `JEU_NON_VALIDE`, pas `EXERCICE_CLOS` — c'est le motif exact de cet
appel-là. Sur `recalculer`, la garde vient **après** toutes les gardes préexistantes, donc
juste avant l'écriture : les refus déjà rendus gardent leur priorité. Règle uniforme :
`EXERCICE_CLOS` est le **dernier** contrôle de conflit, juste avant l'écriture — c'est aussi
ce que fait `valider` depuis STORY-066.

### ⛔ Hook inerte documenté : `saisirComplements` reste le QUATRIÈME chemin non gardé

Relevé par la revue de code **et**, indépendamment, par la revue de sécurité. Sur un exercice
clos, `PUT …/complements` rend `200`, persiste les compléments avec leur auteur… et la
validation suivante rend `409` : le travail de saisie est accepté puis inutilisable. **Hors
périmètre de cette story** — l'ajouter serait déborder. Consigné dans le JSDoc de la garde
pour que l'énumération « valider, rouvrir, recalculer » ne se lise pas comme « les autres
gestes sont permis ». Matière à story de suite.

### ⚡⚡ Revue de code — cinq docstrings nommaient encore `valider` comme LE site de la garde

`jeu-etats.codes.ts` a suivi l'élargissement de l'invariant ; cinq docstrings internes non. Le
plus dangereux, `exercice.schema.ts` : « **validation interdite** dans un exercice `CLOS`
(garde dans `JeuEtatsService.valider`) ». Un développeur qui ajoute un chemin d'écriture y lit
**un seul** site de garde et n'en pose pas — rien ne rougit. C'est très exactement le
mécanisme dont `exercice-dossier.schema.ts` s'accuse lui-même d'avoir été victime en
STORY-374. Les cinq sont corrigés.

⚠️ **Et mon e2e AC-2 promettait « soldes inchangés » sans le vérifier — et ne le POUVAIT
pas** : il rejouait le corps de la création, donc aucun `GET` n'aurait vu de différence même
si l'écriture avait eu lieu. Il envoie désormais des soldes **déséquilibrés** et relit
`valide: true`. Mutation vérifiée : la garde déplacée après l'écriture le fait rougir — avant
le correctif, ce niveau ne l'attrapait pas.

⚠️ Troisième constat : `GESTE_INTERDIT.valider` n'était gardé par **aucune** assertion, alors
que c'est le chemin le plus emprunté des trois. Asymétrie inverse de celle que la story
corrige. Verrouillé.

### ⚡ Revue de sécurité — aucun constat

Blanchi explicitement : le libellé d'exercice publié dans le message est **déjà** servi par
`GET /:id` et son statut par `ConsultationService`, aux **mêmes rôles** — ni fuite ni oracle
neuf ; la route citée est un **gabarit** (`{dossierId}`), sans hôte ni identifiant ; le
`libelle` de la requête est une chaîne typée, aucune injection d'opérateur ; l'ordre des
gardes ne crée ni oracle ni écriture avant refus (`refuserSiAutreBalance` impose que le corps
nomme la balance **du jeu lui-même**, donc pas de sondage d'un `balanceId` arbitraire) ; le
TOCTOU lecture-statut / écriture est inhérent à l'invariant « pas d'appel synchrone sur le
chemin chaud » et **préexistait** sur `valider` ; le repli « inconnu ⇒ permissif » (D-374-1)
est **conservé**, donc aucune régression de disponibilité.

### Vérification

Lint 0 warning · build OK · **1 647 unitaires + 453 e2e verts** · couverture **98,8 / 93,97 /
98,74 / 98,82** · **6 mutations rouges par assertion**, aucune par erreur de compilation :

| mutation | ce qui vire au rouge |
|---|---|
| garde retirée de `rouvrir` | 2 unitaires + 1 e2e |
| garde retirée de `recalculer` | 2 unitaires + 1 e2e |
| message redevenu générique | 2 unitaires + 2 e2e |
| garde de `rouvrir` déplacée **après** la transition | les assertions « aucune écriture, aucun événement » |
| garde de `recalculer` déplacée **après** l'écriture | l'e2e AC-2 **durci** (et lui seul) |
| `GESTE_INTERDIT.valider` régressé à l'ancien message | la garde ajoutée en revue |

**Vérification docker** (stack `docker compose`, JWT réel de l'IdP, read-models semés) :

| critère | mesure |
|---|---|
| AC-1 | sur exercice clos, `rouvrir` rend **409 `EXERCICE_CLOS`** ; le jeu reste `VALIDE` avec son `validePar`, le compteur d'outbox `liasse.etat.change` est **inchangé** (24 → 24) et **aucune** ligne d'audit n'est ajoutée |
| AC-2 | `recalculer` sur un `BROUILLON` d'exercice clos rend **409 `EXERCICE_CLOS`**, message portant « le recalcul de la liasse est interdit » |
| AC-4 | le message rendu porte le libellé (`Exercice 2025 clos`), le geste refusé et la route de `dossier-service` |
| AC-5 | sur un jeu **réellement bloqué**, rouvrir l'exercice — et rien d'autre — ramène `valider` à `200` |

⚠️⚠️ **La vérification a été prouvée NON-VACANTE d'une façon particulière : elle REPRODUIT le
défaut.** Rejouée sur le code muté (garde retirée de `rouvrir`), la séquence donne exactement
ce que la fiche décrit : `rouvrir` → **200**, le jeu passe `BROUILLON`, l'outbox gagne une
ligne `etat: BROUILLON` (celle qui met le portefeuille en `BILAN_EN_COURS`), puis `valider` →
**409**. Le cul-de-sac est constaté, pas déduit.

⚠️ **Un piège de la vérification elle-même, à retenir** : le premier `updateOne` sur
`exercices_dossier` filtrait sur le **seul `libelle: '2025'`** et a modifié le document d'une
**autre organisation** laissée par une vérification antérieure. `modifiedCount: 1` a fait
croire à un succès, la garde n'a pas tiré, et j'ai d'abord soupçonné le code. Sur une base de
dev jamais réinitialisée, un filtre de semis doit porter la **portée complète**
(`orgId` + `dossierId`), jamais le seul libellé.
