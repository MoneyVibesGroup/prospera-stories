# Ticket backend — le fil d'activité n'a aucun filtre, et la recherche du front s'arrête à la page

**Ouvert le :** 2026-08-22 · **Par :** FE-068 v2 *(retour PO du même jour)*
**➡️ FICHÉ : `STORY-383`** — `stories/STORY-383.md`, **EPIC-043, sprint 20, 3 pts, `ready-for-dev`**
**Service :** `dossier-service` · **Appui d'origine :** **STORY-360** *(clôturée le 2026-08-20)*
**Sévérité :** moyenne — **aucune donnée fausse**, mais un résultat **partiel** là où l'utilisateur
attend un résultat complet
**Décisions concernées :** **D12** *(l'administrateur doit savoir qui a modifié quoi)* · **Q10-b**

---

## Le constat

Le PO a rejeté le premier rendu du fil pour une raison d'usage, pas d'esthétique :

> « J'ai plusieurs modifications, je vais faire suivant, fatigué. […] pourquoi pas un tableau pour
> faciliter, mais aussi une **recherche par dossier ou par nom de client**. »

Il a raison, et la conséquence est un manque côté contrat : **la question réelle n'est pas « rends-moi
les 128 actes dans l'ordre », c'est « qu'est-ce qui a bougé chez Kossi ».**

`LireJournalQueryDto` n'expose que **`page`** et **`size`**. Aucun filtre. La recherche a donc été
implémentée **côté client**, sur la page chargée.

## Ce que le front fait aujourd'hui, et pourquoi ce n'est pas suffisant

1. Il demande **`size=100`** sur `/activite` — le plafond du service — pour que la recherche porte sur
   le maximum servi en un appel.
2. Il filtre les lignes sur `raisonSociale`.
3. ⚠️ **Il ANNONCE la portée du résultat** : le pied de table lit « 1 acte trouvé **sur cette page** ».
   Un test unitaire et une étape d'e2e verrouillent cette mention.

Le point 3 est ce qui rend la situation acceptable, pas satisfaisante. Sans lui, l'écran produirait
exactement le défaut que ce dépôt documente depuis STORY-144 : **un résultat partiel qui se lit comme
un fait** — « Kossi n'a rien eu ce mois-ci », alors que la page 2 dit le contraire.

Un cabinet de 60 dossiers actifs dépasse 100 actes en quelques jours. La recherche devient alors
**structurellement incomplète**, et le libellé « sur cette page » cesse d'être une nuance pour devenir
un aveu.

## Ce qui est demandé

Ajouter à **`GET /activite`** deux paramètres de filtre, tous deux **facultatifs** et **cumulables**
avec la pagination existante :

| Paramètre | Type | Effet |
|---|---|---|
| `dossierId` | `ObjectId` | restreint le fil à **un** dossier du cabinet |
| `q` | `string` | recherche sur la **raison sociale** du dossier concerné (insensible à la casse et aux accents) |

⚡ **L'index existe déjà** : `{ orgId: 1, le: -1, _id: -1 }` couvre le tri ; un filtre `dossierId`
s'appuie sur `{ dossierId: 1, le: -1, _id: -1 }`, également posé par STORY-360. `q` demande en
revanche de résoudre les dossiers **avant** la lecture du journal (les raisons sociales vivent dans
`dossiers`, pas dans `dossiers_journal`) : le chemin naturel est `dossiers.find({orgId, raisonSociale:
/…/i})` → liste d'`_id` → `$in` sur le journal.

⚠️ **`total` et `nonLus` doivent rester cohérents avec le filtre appliqué** — ou déclarer
explicitement qu'ils ne le sont pas. Un `total` non filtré sous une liste filtrée redonnerait le
problème par l'autre bout.

⚠️ **Aucun filtre par AUTEUR**, et c'est délibéré : `LireJournalQueryDto` documente déjà que
« montre-moi ce que X a fait » ouvrirait une énumération d'identifiants. La recherche reste sur le
dossier.

## Critères d'acceptation proposés

- [ ] `GET /activite?dossierId=…` rend **uniquement** les actes de ce dossier, **dans la portée du
      jeton** ; un dossier hors portée rend une liste **vide**, jamais 403 *(anti-énumération, comme
      le journal du dossier)*.
- [ ] `GET /activite?q=kossi` rend les actes des dossiers dont la raison sociale correspond, sans
      distinction de casse **ni d'accents** — « Société » doit se trouver en tapant « societe ».
- [ ] `total` reflète le **filtre appliqué**, pas l'historique entier.
- [ ] Les deux paramètres se combinent avec `page` / `size`, et une page hors bornes rend une liste
      vide, jamais une erreur.
- [ ] Un `q` vide ou fait d'espaces est traité comme **absent**, pas comme « ne correspond à rien ».
- [ ] Un test de charge simple : le filtre n'introduit **pas** de `COLLSCAN` sur `dossiers_journal`.

## Impact frontend une fois livré

- Déplacer la recherche vers le serveur : `useActivite(page, { recherche, dossierId })`.
- **Retirer la mention « sur cette page »** de `JournalPied` — et c'est le vrai livrable de ce
  ticket : cette mention existe pour dire une limite, elle doit disparaître avec elle.
- Redescendre `TAILLE_PAGE_FIL` de 100 à 25 : les 100 ne servaient qu'à élargir un filtre client.

⚠️ **Tant que ce ticket n'est pas livré, ne pas retirer la mention** : c'est elle qui empêche un
résultat partiel de se lire comme un fait.
