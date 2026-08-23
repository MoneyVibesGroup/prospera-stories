# STORY-382 : Le journal nomme son AUTEUR, mais pas les personnes dont il parle

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** ticket `TICKET-BACKEND-journal-affectation-userids-bruts.md` · **STORY-360** *(le journal devient lisible)* · **STORY-294** *(le même piège, côté organisations)* · décision **D12** · question **Q2**
**Priorité :** Should Have
**Story Points :** 2
**Statut :** `ready-for-dev`
**Complexité :** low
**Créée le :** 2026-08-22 — **par FE-068**, qui a consommé le journal pour la première fois
**Sprint :** 20
**Service :** `dossier-service`

---

## Le constat

STORY-360 a fait exactement ce que STORY-294 exigeait pour l'**auteur** d'une ligne : le `userId`
n'est jamais rendu seul, il est résolu **à la lecture**, par lot, sur le read-model `identity_users`.
Et comme ce read-model **ne réplique aucun statut**, un collaborateur parti reste nommé — c'est Q2,
et c'est délibéré.

**Ce traitement s'arrête à l'auteur. Il ne s'applique pas au CONTENU des entrées.**

`AFFECTATION_MODIFIEE` consigne son couple avant/après ainsi
(`dossiers.service.ts` → `affectationLisible`) :

```json
{
  "avant": { "responsableUserId": "68a1…0001", "contributeursUserIds": [] },
  "apres": { "responsableUserId": "68a1…0002", "contributeursUserIds": ["68a1…0003"] }
}
```

Trois identifiants bruts, qu'aucune résolution ne traverse. Le chemin de départ d'un collaborateur
(`MOTIF_DEPART_COLLABORATEUR`) ajoute même un `partantUserId`, dans la même forme.

## Pourquoi ça compte — et pourquoi le front ne peut pas le réparer seul

Le front les résout sur `GET /users`, l'annuaire du **cabinet**. Ça marche pour les membres actifs, et
**ça échoue précisément là où le journal a le plus de valeur** : un collaborateur **parti** n'y figure
plus. On lit alors :

> Responsable : ~~68a18000cafe0000beef0001~~ → Kofi Santos

C'est mot pour mot le défaut que STORY-294 a documenté et que STORY-360 a corrigé pour l'auteur : *un
identifiant que le client ne sait pas résoudre rend le journal illisible, donc inutile.* Et c'est
**exactement le cas Q2** — celui où l'historique doit survivre à la personne.

⚠️ **Le contournement en place est délibérément visible, pas silencieux** : FE-068 affiche
l'identifiant **et l'annonce comme non résolu** (patron `AuditActor` d'AP-24 — le maquiller en
« utilisateur inconnu » effacerait la seule preuve qui subsiste). C'est un pis-aller : la résolution
appartient au service, seul endroit où le read-model connaît les partants.

---

## User Story

En tant qu'**administratrice de cabinet**,
je veux **lire les noms des personnes citées par une ligne d'affectation**, pas leurs identifiants,
afin de **comprendre qui a repris quel dossier, même quand la personne a quitté le cabinet**.

---

## Ce que la story livre

Étendre la résolution **déjà présente** dans `JournalService.habiller` aux identifiants portés par
`details` :

| Acte | Clés concernées |
|---|---|
| `AFFECTATION_MODIFIEE` | `avant.responsableUserId`, `apres.responsableUserId`, `avant.contributeursUserIds[]`, `apres.contributeursUserIds[]`, `partantUserId` |

⚡ **Le même lot de résolution suffit** : `habiller()` collecte déjà les `parUserId` de la page en une
requête. Y ajouter les identifiants de `details` ne coûte **aucun aller-retour supplémentaire** —
c'est la même `resoudre()`, sur une liste plus longue.

⚠️ **Sans réécrire les entrées.** Le journal est *append-only*, et ce n'est pas une contrainte subie :
ce qui a été écrit **est** la preuve. La résolution se fait **à la lecture**, comme le libellé de
l'acte et comme l'auteur, en **ajoutant** un champ à côté de l'identifiant plutôt qu'en le
remplaçant :

```jsonc
"apres": {
  "responsableUserId": "68a1…0002",
  // ajouté à la lecture, jamais stocké
  "responsable": { "userId": "68a1…0002", "prenom": "Kofi", "nom": "Santos", "systeme": false }
}
```

## Hors périmètre

- ⛔ Les autres actes : aucun ne porte d'identifiant d'utilisateur dans `details` *(vérifié sur les
  dix — `EXERCICE_*` portent `exerciceId`, `AXES_DECIDES` un `decisionId`)*.
- ⛔ Toute réécriture rétroactive des entrées existantes.

---

## Acceptance Criteria

- [ ] `GET /dossiers/:id/journal` et `GET /activite` rendent, pour chaque `AFFECTATION_MODIFIEE`,
      **l'identité des personnes citées en plus de leur identifiant**.
- [ ] Un collaborateur **désactivé / parti** y est **nommé** — c'est l'AC central *(Q2)*, et le seul
      qui ne peut pas être satisfait côté client.
- [ ] Un identifiant que le read-model ne connaît pas rend la ligne **quand même**, avec son
      identifiant seul : un journal qui perd des entrées parce qu'une jointure échoue ne prouve plus
      rien.
- [ ] **Aucune entrée n'est réécrite** — un test de mutation tente une écriture sur la collection et
      échoue si elle passe *(la garde de STORY-360 existe, elle doit continuer de tenir)*.
- [ ] **Le nombre de requêtes par page ne change pas** : un test le fige. *(C'est la garde qui empêche
      la résolution ligne à ligne — 25 allers-retours par page.)*

---

## Dépendances

**Prérequise :** **STORY-360** *(la résolution par lot et le read-model `identity_users` existent)*.
**Consommateur :** **FE-068** — le repli client (`CHAMPS_UTILISATEUR`, `estIdentifiantBrut` dans
`journal-presentation.ts`) se retire quand cette story est livrée. ⚠️ **Pas avant** : c'est lui qui
empêche l'écran d'afficher un identifiant nu sans le dire.

## Definition of Done

- [ ] Lint 0 · build OK · couverture ≥ seuils.
- [ ] e2e : affectation dont l'ancien responsable a quitté le cabinet → **nommé**.
- [ ] Vérification docker : un vrai départ de collaborateur (`identity.membership.changed`,
      `SUSPENDED`) suivi d'une lecture du journal.
- [ ] `/code-review` + `/security-review` *(le journal est une preuve opposable)*.

## Story Points Breakdown

- Collecte des identifiants de `details` dans le lot existant : 0,5 pt
- Enrichissement du DTO à la lecture, sans réécriture : 1 pt
- Tests (auteur parti, non résolu, nombre de requêtes figé) : 0,5 pt
- **Total : 2 points**
