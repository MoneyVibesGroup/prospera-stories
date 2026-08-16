# `outils/` — le vérificateur du dépôt

```bash
python outils/verifier.py             # rapport complet
python outils/verifier.py --bref      # que les anomalies
python outils/verifier.py --matrice   # + régénère MATRICE-COMPLETUDE.md
```

**Code de sortie : `1` s'il reste un `ECHEC`.** Utilisable en CI ou en pre-commit.

---

## Pourquoi il existe

Le 2026-08-16, un audit de couverture a trouvé, **en une journée** : un document d'épics resté deux
versions en arrière, une valeur de référentiel absente qui rendait une AC intenable, un engagement de
sprint qui ne correspondait plus à ses stories, une note de périmètre fausse **sur neuf sprints à la
fois**, et une architecture antérieure au PRD qu'elle prétendait servir.

⛔ **Aucun de ces contrôles n'existait dans le dépôt.** Ils ont été faits par des scripts jetables,
dans un dossier temporaire, que personne ne pouvait relancer le lendemain.

> ⚡ **Le problème n'était pas qu'il manquait des documents. C'est que rien ne disait quand un document
> ment.** Ce script le dit.

**Chaque contrôle ici correspond à un défaut réellement constaté.** Aucun n'est théorique. Quand un
nouveau défaut apparaît deux fois, il gagne son contrôle.

## Les trois niveaux

| Niveau | Sens | Fait échouer ? |
| --- | --- | :---: |
| `OK` | le contrôle passe | non |
| `ALERTE` | **un constat à arbitrer**, pas une erreur — une dette connue et assumée en est une | non |
| `ECHEC` | **une incohérence interne** : deux endroits du dépôt se contredisent. Ça se corrige, ça ne s'arbitre pas | **oui** |

⚠️ **La distinction est le cœur de l'outil.** Un vérificateur qui traite une dette assumée comme une
erreur devient du bruit, et un outil bruyant n'est plus relancé — c'est ainsi qu'ils meurent.

## Ce qu'il contrôle

**1. Tracker** — doublons de `story_id` · `story_path` cassés · **stories slottées sans fichier**
*(le défaut « un titre n'est porté par personne », 5 occurrences)* · fichiers hors planning
*(les `SUPERSEDED` sont exclues : les signaler inviterait à les re-slotter)* ·
**somme des points ≠ engagement** *(silencieux par nature — pris ainsi sur S20 et S28 à un jour
d'écart)* · `completed_points` décroché · compteurs d'attribution · chevauchement de plages d'épics.

**2. Découpages** — total annoncé ≠ somme des épics · **une exigence du PRD que le découpage ne couvre
nulle part** *(c'est `FR-F79`/`FR-F80`, invisibles 24 h)* · **plage `AD-1 → AD-n` citée ≠ nombre réel de
décisions de la spine** *(c'était « AD-19 » quand la spine en portait 21)*.

**3. Référentiels** — les endroits où **la règle est là et la valeur n'y est pas**. Trois cas le même
jour : le SMIG, les durées d'amortissement, l'Art. 75. ⛔ Chacun est un calcul qui sortira bloqué —
**ou pire, codé en dur par quelqu'un qui trouvera un chiffre en ligne.**

**4. Documents** — un document marqué dépassé **encore cité sans réserve** ailleurs. Un renvoi nu le
laisse faire autorité.

**5. Couverture** — la matrice PRD × Architecture × Découpage des 29 modules.
⚡ **Les modules sont lus depuis `PROSPERA_SEQUENCE_MODULES_v2.md`, pas recopiés** : en ajouter un
là-bas le fait apparaître ici **en trou**, sans toucher au script.

## ⚠️ Ce qu'il ne peut pas faire

- **Il ne trouve que les trous DÉCLARÉS.** Le SMIG remonte parce que le paquet dit `aCompleter`. Les
  **durées d'amortissement** ne remontent pas : rien dans le paquet ne dit qu'elles manquent. ⛔ **Un
  référentiel qui ignore son propre manque reste invisible.**
- Il ne lit **pas le code des services** — seulement ce dépôt.
- Il ne juge **pas la qualité** d'un document, seulement sa cohérence avec les autres.

## Ce qu'il a appris en étant écrit

Trois de ses contrôles ont dû être **corrigés parce qu'ils criaient faux**, et chaque correction est
commentée dans le source :

1. Les découpages citent les exigences **par plages** (`FR-S06 → FR-S09`) — 82 fausses alertes.
2. Une exigence que le PRD **annule lui-même** (`FR-R28c`, barrée) n'a pas à figurer dans le découpage.
3. Un « superseded » qui traîne dans une phrase parle **d'autre chose** — ici d'`EPIC-009` ; et
   *« remplace X »* signifie que le document est **actif**, l'inverse de *« remplacé par »*.

> ⚡ **La leçon vaut plus que l'outil : un contrôle faux coûte plus cher qu'un contrôle absent**, parce
> qu'il apprend à ignorer le rapport.

## Le tenir vivant

- Quand un défaut se produit **deux fois**, lui écrire un contrôle plutôt qu'une note.
- Quand un contrôle produit un faux positif, **le corriger le jour même** — pas le désactiver.
- Un `ECHEC` se corrige avant de commiter. Une `ALERTE` se lit, et se transforme en écart tracé dans
  `sprint-status.yaml` si elle doit survivre à la semaine.
