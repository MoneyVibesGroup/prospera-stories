# STORY-383 : Le fil d'activité se filtre par dossier — la recherche cesse de s'arrêter à la page

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** ticket `TICKET-BACKEND-activite-filtre-par-dossier.md` · **STORY-360** *(le fil existe)* · **STORY-144** *(le défaut du résultat partiel)* · décision **D12** · question **Q10-b**
**Priorité :** Should Have
**Story Points :** 3
**Statut :** `ready-for-dev`
**Complexité :** medium
**Créée le :** 2026-08-22 — **par FE-068 v2**, sur retour PO direct
**Sprint :** 20
**Service :** `dossier-service`

---

## Le constat

Le PO a rejeté le premier rendu du fil pour une raison d'**usage**, pas d'esthétique :

> « J'ai plusieurs modifications, je vais faire suivant, fatigué. […] pourquoi pas un tableau pour
> faciliter, mais aussi une **recherche par dossier ou par nom de client**. »

Il a raison, et la conséquence est un manque **de contrat** : la question réelle n'est pas
« rends-moi les 128 actes dans l'ordre », c'est **« qu'est-ce qui a bougé chez Kossi »**.

`LireJournalQueryDto` n'expose que **`page`** et **`size`**. Aucun filtre.

## Ce que le front fait en attendant, et pourquoi ce n'est pas suffisant

1. Il demande **`size=100`** sur `/activite` — le plafond du service — pour que la recherche porte sur
   le maximum servi en un appel.
2. Il filtre les lignes sur `raisonSociale`, **côté client**.
3. ⚠️ Il **ANNONCE la portée** : le pied de table lit « 1 acte trouvé **sur cette page** ». Un test
   unitaire **et** une étape d'e2e verrouillent cette mention.

Le point 3 rend la situation **acceptable, pas satisfaisante**. Sans lui, l'écran produirait
exactement le défaut que ce dépôt documente depuis STORY-144 : **un résultat partiel qui se lit comme
un fait** — « Kossi n'a rien eu ce mois-ci », alors que la page 2 dit le contraire.

⚡ **Un cabinet de 60 dossiers actifs dépasse 100 actes en quelques jours.** La recherche devient alors
**structurellement incomplète**, et « sur cette page » cesse d'être une nuance pour devenir un aveu.

---

## User Story

En tant qu'**administratrice de cabinet**,
je veux **filtrer le fil sur un dossier ou un nom de client**,
afin de **répondre à « qu'est-ce qui a bougé chez ce client » sans dérouler tout l'historique du
cabinet**.

---

## Ce que la story livre

Deux paramètres **facultatifs** et **cumulables** avec la pagination existante, sur `GET /activite` :

| Paramètre | Type | Effet |
|---|---|---|
| `dossierId` | `ObjectId` | restreint le fil à **un** dossier du cabinet |
| `q` | `string` | recherche sur la **raison sociale** du dossier concerné, insensible à la casse **et aux accents** |

⚡ **L'index de `dossierId` existe déjà** : `{ dossierId: 1, le: -1, _id: -1 }`, posé par STORY-360.
`q` demande en revanche de résoudre les dossiers **avant** la lecture du journal — les raisons
sociales vivent dans `dossiers`, pas dans `dossiers_journal`. Chemin naturel :
`dossiers.find({ orgId, raisonSociale: /…/i })` → liste d'`_id` → `$in` sur le journal.

⚠️ **`total` et `nonLus` doivent rester cohérents avec le filtre appliqué** — ou déclarer
explicitement qu'ils ne le sont pas. Un `total` non filtré sous une liste filtrée **redonnerait le
problème par l'autre bout**.

## Hors périmètre

- ⛔ **Aucun filtre par AUTEUR**, et c'est délibéré : `LireJournalQueryDto` documente déjà que
  « montre-moi ce que X a fait » ouvrirait une **énumération d'identifiants**. La recherche reste sur
  le dossier.
- ⛔ Aucune recherche **plein texte** dans les valeurs d'un diff : l'utilisateur ne saurait pas
  reproduire le résultat.
- ⛔ Le journal d'**un** dossier (`GET /dossiers/:id/journal`) : on y est déjà dans un dossier, et le
  service n'y sert même pas `raisonSociale`.

---

## Acceptance Criteria

- [ ] `GET /activite?dossierId=…` rend **uniquement** les actes de ce dossier, **dans la portée du
      jeton** ; un dossier hors portée rend une liste **vide**, jamais `403` *(anti-énumération, comme
      le journal du dossier)*.
- [ ] `GET /activite?q=kossi` rend les actes des dossiers correspondants, sans distinction de casse
      **ni d'accents** — « Société » doit se trouver en tapant « societe ».
- [ ] **`total` reflète le filtre appliqué**, pas l'historique entier.
- [ ] Les deux paramètres se combinent avec `page` / `size` ; une page hors bornes rend une liste
      vide, jamais une erreur.
- [ ] Un `q` **vide ou fait d'espaces** est traité comme **absent**, pas comme « ne correspond à
      rien ».
- [ ] Le filtre n'introduit **pas de `COLLSCAN`** sur `dossiers_journal` — un test le vérifie sur le
      plan d'exécution.

---

## Dépendances

**Prérequise :** **STORY-360** *(le fil, ses index et son curseur de non-lus)*.
**Consommateur :** **FE-068**. À la livraison, le front :

1. déplace la recherche vers le serveur (`useActivite(page, { recherche, dossierId })`) ;
2. **retire la mention « sur cette page »** de `JournalPied` — ⚡ **c'est le vrai livrable de cette
   story** : cette mention existe pour dire une limite, elle doit disparaître avec elle ;
3. redescend `TAILLE_PAGE_FIL` de 100 à 25 — les 100 ne servaient qu'à élargir un filtre client.

⚠️ **Tant que cette story n'est pas livrée, ne pas retirer la mention** : c'est elle qui empêche un
résultat partiel de se lire comme un fait.

## Definition of Done

- [ ] Lint 0 · build OK · couverture ≥ seuils.
- [ ] e2e : filtre par dossier, filtre par `q` accentué, combinaison avec la pagination, `total`
      cohérent, dossier hors portée → liste vide.
- [ ] Vérification docker : deux dossiers, un filtre, et le plan d'exécution lu sur la vraie base.
- [ ] `/code-review` + `/security-review` *(un paramètre de recherche est une surface d'injection —
      `q` ne doit jamais atteindre Mongo comme opérateur)*.

## Story Points Breakdown

- `dossierId` : validation, portée, index existant : 0,5 pt
- `q` : résolution des dossiers puis `$in`, insensibilité aux accents : 1,5 pt
- Cohérence de `total` / `nonLus` sous filtre : 0,5 pt
- Tests (e2e, plan d'exécution, injection) : 0,5 pt
- **Total : 3 points**
