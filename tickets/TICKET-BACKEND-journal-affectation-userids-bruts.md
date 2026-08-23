# Ticket backend — le journal nomme son AUTEUR, mais pas les personnes dont il parle

**Ouvert le :** 2026-08-22 · **Par :** FE-068 *(journal du dossier + fil d'activité)*
**➡️ FICHÉ : `STORY-382`** — `stories/STORY-382.md`, **EPIC-043, sprint 20, 2 pts, `ready-for-dev`**
*(un ticket qui n'entre pas au tracker n'est porté par personne — c'est le défaut de chaînage que ce
programme a constaté 3 fois en une semaine)*
**Service :** `dossier-service` · **Appui d'origine :** **STORY-360** *(clôturée le 2026-08-20)*
**Sévérité :** moyenne — **aucune donnée perdue**, une piste partiellement illisible
**Décisions concernées :** **D12** *(l'administrateur doit savoir qui a modifié quoi)* · **Q2**
*(l'historique appartient au dossier, pas à l'employé)*

---

## Le constat

STORY-360 a fait exactement ce que STORY-294 demandait pour l'**auteur** d'une ligne : le `userId`
n'est jamais rendu seul, il est résolu à la lecture, par lot, sur le read-model `identity_users` — et
comme ce read-model **ne réplique aucun statut**, un collaborateur parti reste nommé.

**Ce traitement s'arrête à l'auteur. Il ne s'applique pas au CONTENU des entrées.**

`AFFECTATION_MODIFIEE` consigne son couple avant/après ainsi
(`dossiers.service.ts` → `affectationLisible`) :

```json
{
  "avant": { "responsableUserId": "68a18000cafe0000beef0001", "contributeursUserIds": [] },
  "apres": { "responsableUserId": "68a18000cafe0000beef0002",
             "contributeursUserIds": ["68a18000cafe0000beef0003"] }
}
```

Trois identifiants bruts, qu'aucune résolution ne traverse. `MOTIF_DEPART_COLLABORATEUR` ajoute même
un `partantUserId`, dans la même forme.

## Pourquoi ça compte, et pourquoi le front ne peut pas le réparer seul

Le front les résout sur `GET /users` — l'annuaire du **cabinet**. Ça marche pour les membres actifs,
et **ça échoue précisément là où le journal a le plus de valeur** : un collaborateur **parti** n'est
plus dans l'annuaire. On lit alors :

> Responsable : ~~68a18000cafe0000beef0001~~ → Kofi Santos

C'est-à-dire, mot pour mot, le défaut que STORY-294 a documenté et que STORY-360 a corrigé pour
l'auteur : *un identifiant que le client ne sait pas résoudre rend le journal illisible, donc
inutile.* Et c'est **exactement le cas Q2** — celui où l'historique doit survivre à la personne.

⚠️ **Le contournement actuel est délibérément visible, pas silencieux.** Le front affiche
l'identifiant **et l'annonce comme non résolu** (patron `AuditActor` d'AP-24) : le maquiller en
« utilisateur inconnu » effacerait la seule preuve qui subsiste. Mais c'est un pis-aller — la
résolution appartient au service, seul endroit où le read-model connaît les partants.

## Ce qui est demandé

Étendre la résolution déjà présente dans `JournalService.habiller` aux identifiants **portés par
`details`**, pour les actes qui en portent :

| Acte | Clés concernées |
|---|---|
| `AFFECTATION_MODIFIEE` | `avant.responsableUserId`, `apres.responsableUserId`, `avant.contributeursUserIds[]`, `apres.contributeursUserIds[]`, `partantUserId` |

⚠️ **Sans réécrire les entrées.** Le journal est *append-only* — et ce n'est pas une contrainte
subie : ce qui a été écrit est la preuve. La résolution se fait **à la lecture**, comme le libellé de
l'acte et comme l'auteur, en **ajoutant** un champ à côté de l'identifiant plutôt qu'en le
remplaçant. Par exemple :

```jsonc
"apres": {
  "responsableUserId": "68a1…0002",
  // ajouté à la lecture, jamais stocké
  "responsable": { "userId": "68a1…0002", "prenom": "Kofi", "nom": "Santos", "systeme": false }
}
```

⚡ **Le même lot de résolution suffit** : `habiller()` collecte déjà les `parUserId` de la page en une
requête. Y ajouter les identifiants de `details` ne coûte pas d'aller-retour supplémentaire — c'est
la même `resoudre()`, sur une liste plus longue.

## Critères d'acceptation proposés

- [ ] `GET /dossiers/:id/journal` et `GET /activite` rendent, pour chaque `AFFECTATION_MODIFIEE`,
      l'identité des personnes citées **en plus** de leur identifiant.
- [ ] Un collaborateur **désactivé / parti** y est **nommé** — c'est l'AC central *(Q2)*, et c'est le
      seul qui ne peut pas être satisfait côté client.
- [ ] Un identifiant que le read-model ne connaît pas rend la ligne **quand même**, avec son
      identifiant seul : un journal qui perd des entrées parce qu'une jointure échoue ne prouve plus
      rien.
- [ ] **Aucune entrée n'est réécrite** — un test de mutation tente une écriture sur la collection et
      échoue si elle passe *(la garde existe déjà, elle doit continuer de tenir)*.
- [ ] Le nombre de requêtes par page **ne change pas** : un test le fige.

## Impact frontend une fois livré

Retirer la résolution de repli de `journal-entree.tsx` / `journal-presentation.ts`
(`CHAMPS_UTILISATEUR`, `estIdentifiantBrut`) et lire l'identité servie. **Tant que ce ticket n'est pas
livré, ne pas retirer le repli** : il est ce qui empêche l'écran d'afficher un identifiant nu sans le
dire.
