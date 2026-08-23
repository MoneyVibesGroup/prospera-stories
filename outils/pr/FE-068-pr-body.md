# PR FE-068 — corps prêt à coller

> ⚠️ `gh` n'est pas installé sur ce poste : la branche `fe-068` est **poussée**, la PR reste à ouvrir
> à la main. Ouvrir sur → https://github.com/MoneyVibesGroup/prospera-frontend-expert-comptable/pull/new/fe-068
> **Base `dev`** · fusion en **« Rebase and merge »** uniquement *(convention git du programme)*.

**Titre :**

```
FE-068 — le journal du dossier et le fil d'activité : D12 cesse d'être une promesse sans surface
```

---

## Ce que la PR livre

Deux surfaces pour **une seule source** (`dossiers_journal`, écrit en append-only *dans la transaction
de l'acte* depuis STORY-301) :

| Surface | Route | Qui |
|---|---|---|
| Onglet **« Journal »** de la fiche | `GET /dossiers/{id}/journal` | tout membre **dans la portée** — D12 |
| Bandeau **« dernière modification … · version N »** | *(1ʳᵉ ligne du journal)* | idem |
| Page **`/activite`** + entrée de nav + pastille de non-lus | `GET /activite`, `POST /activite/lu` | **`TENANT_ADMIN` seul** |

⛔ **Aucune cloche, aucun temps réel.** Q10 option (b) : `notification-service` a une architecture
(2026-08-04, `:3008`) et **zéro code**. Le service lui-même a refusé de poser un *hook* inerte (leçon
STORY-173) ; le front n'en préfigure aucun.

---

## ⚡ Le blocage était périmé de deux jours

La fiche disait : *« Backend prêt : ⛔ NON — revérifié le 2026-08-18. Blocage réel. »*
**STORY-360 est clôturée le 2026-08-20** — 2 PR rebase-mergées — et `curl :3009/api/v1/docs-json`
rend **13 chemins**, dont les trois de cette story.

Une ligne **datée** et **explicitement revérifiée** est ce qu'on relit le moins : elle porte tous les
signes du travail déjà fait. ⇒ Le réancrage se fait sur `git log origin/dev` **du service**, pas sur
la fiche.

---

## Trois constats qui ont changé le code

### ① Une fiche peut nommer des actes qui n'existent pas — avec le bon compte

FE-068 annonçait `AXES_MODIFIES` et `RESPONSABLE_CHANGE` ; le contrat sert `AXES_DECIDES` et
`AFFECTATION_MODIFIEE`. **Dix des deux côtés** — c'est le compte juste qui rend l'écart invisible :
rien ne manque, deux choses sont fausses. Écrit sur la fiche, le rendu des détails aurait
**compilé**, puis affiché deux actes sans aucun champ.

⇒ La table des descripteurs est typée `Record<TypeEvenementDossier, …>` sur le type **généré** :
ajouter un acte au service casse `tsc`. Un `satisfies` ou un `Partial<>` ne l'aurait pas fait
*(leçon FE-070)*.

### ② ⛔ `data?.entrees[0]` ne garde que `data` — et le bandeau a fait tomber la fiche entière

L'optionnel s'arrête à `data` : sur un corps qui ne porte pas `entrees`, l'accès **lève**. Le bandeau
vivant dans l'**en-tête**, l'exception emportait tout l'écran, onglets compris.

Le symptôme n'était visible **nulle part dans les tests de cette story** : **12 e2e voisins**
(FE-061, FE-065, FE-066) sont devenus rouges, avec un `element was detached from the DOM, retrying`
qui ne nomme rien.

⇒ Deux règles : **un composant facultatif ne doit jamais pouvoir faire tomber la page qui l'héberge**,
et **un corps sans `entrees` se rend en ERREUR** — « illisible » et « aucun acte » sont deux
informations différentes. Et : **les e2e voisins font partie de la porte de sortie d'une story**.

### ③ Une garde peut être invérifiable sans qu'une seule ligne soit fausse

`if (!estAdmin) return <LoadingState />` : mutation **non concluante**, les 9 tests restaient verts.
Une requête `enabled: false` reste `isPending` **indéfiniment** — la garde absente rendait donc
**exactement le même écran**. Le refus porte désormais un libellé distinct, le test l'exige, la
mutation vire au rouge.

---

## ⑥ v2 — la table et la recherche (maquette validée par le PO)

Le PO a rejeté le premier rendu, et sa raison est un fait d'usage :

> « J'ai plusieurs modifications, je vais faire suivant, fatigué. […] pourquoi pas un tableau pour
> faciliter, mais aussi une **recherche par dossier ou par nom de client**. »

⚡ **Une carte est faite pour être REGARDÉE une par une ; un journal se BALAYE.** À hauteur égale et
colonnes alignées, l'écran tient quatre à cinq fois plus d'actes.

- table `Quand · Dossier · Acte · Par · Ce qui a changé`, séparateurs de journée **dans** la table
  *(un titre entre deux tables casserait l'alignement — et c'est l'alignement qui rend le journal
  balayable)* ;
- **recherche par dossier/client** sur le fil, **filtre par famille d'acte** sur les deux surfaces ;
- non-lu en **liseré** plutôt qu'en fond teinté : sur vingt lignes, un fond redevient du bruit ;
- **un seul bouton de fermeture** sur le panneau du dossier — il y en avait deux.

**Ce qui n'a pas changé : l'avant/après reste champ par champ** (AC-3), *rangé* dans sa colonne.

### ⛔ La recherche a une limite, et l'écran la dit

`LireJournalQueryDto` n'expose que `page` et `size` : **aucun paramètre de recherche côté serveur**.
Le filtre est donc client, sur la page chargée. Deux conséquences assumées : le fil demande
**`size=100`** (le plafond du service), et le pied annonce **« … trouvé sur cette page »** — verrouillé
par un test unitaire *et* une étape d'e2e.

Sans cette mention, l'écran produirait le défaut documenté depuis STORY-144 : **un résultat partiel
qui se lit comme un fait**. ⇒ 📄 **STORY-383** (EPIC-043, sprint 20, 3 pts) — `tickets/TICKET-BACKEND-activite-filtre-par-dossier.md`. Quand elle
sera livré, **c'est la mention qui disparaîtra** — elle existe pour dire une limite.

### Une seconde garde d'exhaustivité, nécessaire

`FAMILLE_ACTE` est un `Record<TypeEvenementDossier, FamilleActe>` : sans lui, un acte neuf serait
visible sous « Tous » et **invisible sous chaque puce** — le filtre mentirait sans rien signaler.

### Un fixture e2e vacant, trouvé et corrigé

Le stub ne contenait **qu'un seul dossier** : chercher « kossi » y rendait toutes les lignes, et
l'assertion serait passée **que le filtre existe ou non**. Un second dossier y a été ajouté, et la
recherche est vérifiée **dans les deux sens**.

---

## Écart transmis (ticket ouvert)

**`AFFECTATION_MODIFIEE` consigne des `userId` bruts que le service ne résout pas.** L'**auteur**
d'une ligne est nommé (read-model `identity_users`, sans statut ⇒ un partant reste nommé) ; les
**valeurs** du couple avant/après, non. Le front les résout sur l'annuaire du cabinet — où un
collaborateur **parti** ne figure plus. L'identifiant est alors **affiché ET annoncé comme tel**
(patron `AuditActor` d'AP-24 : le maquiller en « utilisateur inconnu » effacerait la seule preuve qui
subsiste).

📄 **STORY-382** (EPIC-043, sprint 20, 2 pts) — `prospera-stories/tickets/TICKET-BACKEND-journal-affectation-userids-bruts.md`

---

## Portes de qualité

| Porte | Résultat |
|---|---|
| `typecheck` | ✅ |
| `lint` | ✅ **0 warning** |
| `build` | ✅ — `/activite` au manifeste |
| Unitaires *(fichiers touchés)* | ✅ **363/363** (20 fichiers) |
| Unitaires *(suite complète, `--maxWorkers=3`)* | ✅ **985/987** — les 2 restants : `nouveau-dossier-wizard`, non touché, **vert 21/21 en isolation** |
| e2e `dossier-journal.spec.ts` | ✅ **5/5**, **2 rôles** sur un état de stub partagé |
| e2e voisins *(fiche, axes, exercices)* | ✅ **24/24** après ② |
| Mutations | **10 appliquées, 10 rouges et probantes** — dont **une vacance de test** et **un fixture vacant**, tous deux corrigés |

<details>
<summary>Table de mutations</summary>

| Mutation | Verdict |
|---|---|
| `estNonLue` : `>` → `>=` | 🔴 |
| Un libellé de champ retiré | 🔴 *(garde d'exhaustivité)* |
| `refetchInterval` retiré de `useNonLus` | 🔴 *(l'option est lue **sur la requête**, pas la constante)* |
| La pastille affiche « 0 » | 🔴 ×2 |
| Ses propres actes recomptés comme non lus | 🔴 ×2 |
| Garde de rôle retirée du fil | 🔴 — **après** ③ ; non concluante avant, et c'est le constat |
| `useAcquitterActivite` n'invalide plus | 🔴 **e2e AC-8, à l'étape exacte de l'acquittement** |
| **v2** — la recherche cesse d'ignorer la casse | 🔴 ×3 |
| **v2** — « sur cette page » retiré du pied | 🔴 |
| **v2** — une famille d'acte qu'aucune puce n'atteint | 🔴 ×2 |

</details>

---

## ⏳ Ce qui n'est PAS coché

**Integration Gate — transmis, non coché.** La DoD exige *« une modification jouée par un vrai second
compte collaborateur, vue par l'admin EN LIVE — pas simulée par un seed »*. Les jetons de ce spec sont
**fabriqués côté test**. Ce qui est prouvé ici est la moitié que le front possède ; l'autre a été
prouvée **en docker par STORY-360** (« Koffi ouvre un exercice → Awa lit
`EXERCICE_OUVERT | … | par Koffi Mensah` », `total 5 / nonLus 2`, acquittement persistant). Un gate
coché sur des jetons de test n'aurait prouvé que la capacité du fixture à mentir *(leçon FE-062)*.

**Maquette : validation PO due.** La passe due — fil plein écran, compteur, bandeau, refonte du
panneau journal — est intégrée au prototype cumulatif. Le PO a demandé le 2026-08-22 que
l'intégration **ne l'attende pas** et qu'il valide ensuite.

---

## ⚠️ Rouges préexistants, vérifiés sur `origin/dev` sans ce travail

- **e2e** : `atelier-scope-dossier` ×2 *(reproductibles)*, `bilan` ×1 *(intermittent)*. Suite complète après v2 : **153 passés, 2 échoués** — exactement ces deux-là.
- **unitaires** : **c'est la machine, pas la branche — et c'est mesuré.** Le poste a **16 processeurs
  logiques**, donc Vitest ouvre ~15 forks jsdom : la mémoire s'épuise **avant** que les workers ne
  répondent, et ils abandonnent sur le **timeout de 60 s codé en dur**. Le symptôme n'est pas « des
  tests qui échouent » mais **« des workers qui ne démarrent pas »** — 105 sur 110, soit 24 tests
  évalués sur 987. À **`--maxWorkers=3`** : **985 verts / 987, 0 worker en échec**. ⇒ à ficher :
  **borner `maxWorkers` dans `vitest.config.ts`**, pas relever `testTimeout` — le timeout n'est pas la
  cause, la mémoire l'est.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
