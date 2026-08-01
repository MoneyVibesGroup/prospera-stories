# `frontend-stories/` — **toutes** les stories frontend, cabinet ET console

## Dossier unique

Depuis le 2026-08-01, ce dossier contient **l'intégralité** des stories frontend des deux
applications. Le dossier `admin-stories/` a été supprimé et son contenu déplacé ici.

| Préfixe | Application | Dépôt |
|---|---|---|
| `FE-…` | app cliente cabinet (vertical pilote) | `prospera-frontend-expert-comptable` |
| `AP-…` | console interne Money Vibes (PLATFORM_ADMIN) | `frontend-admin-panel` |
| `FE-INT-…` / `AP-INT-…` | Integration Gate — la story qui remplace les contrats supposés par les vrais | les deux |

**Pourquoi un seul dossier.** Le tracker `frontend-sprint-status.yaml` est déjà une source
unique pour les deux apps : ses sprints sont des **tranches verticales** qui traversent la
console *et* le cabinet (principe 0 — l'admin octroie, le client s'allume ; découper par app
produit des demi-boucles indémontrables). Deux dossiers pour un tracker unique obligeait à
savoir dans lequel chercher avant de pouvoir lire une story, et c'est exactement ce qui a fait
qu'un ticket *frontend* a dormi dans `stories/`, le dossier *backend*.

Le préfixe porte déjà l'application. Le dossier n'a rien à ajouter.

## Nommage

```
FE-<NNN>.md      FE-INT-<N>.md      AP-<NN>.md      AP-INT-<N>.md
```

Un fichier = une story = une branche = une PR (`fe-027`, `ap-06`…), commits préfixés par
l'identifiant.

## Où vit quoi

| | |
|---|---|
| `frontend-stories/` | **les stories frontend** (ce dossier) |
| `stories/` | les stories **backend** (`STORY-<NNN>.md`) |
| `tickets/` | les manques découverts **chez l'autre**, en attente de porteur — cf. `tickets/README.md` |
| `frontend-sprint-status.yaml` | **la** source de vérité des sprints frontend |
| `sprint-status.yaml` | idem, backend |

## La règle qui évite les orphelines

Une story rédigée est **slottée dans un sprint**, ou explicitement marquée `deferred` dans un
sprint. Jamais laissée sans sprint : une story hors sprint est invisible du sprint-planning et
de tout comptage de points.

Le contrôle tient en une commande — comparer les fichiers aux `id` slottés :

```bash
python -c "
import yaml,glob,os
f=yaml.safe_load(open('frontend-sprint-status.yaml',encoding='utf-8'))
ids={y['id'] for s in f['sprints'] for y in s['stories']}
files={os.path.basename(p)[:-3] for p in glob.glob('frontend-stories/*.md')} - {'README'}
print('sans sprint :', sorted(files-ids) or 'aucune')
print('sans fichier :', sorted(ids-files) or 'aucune')
"
```

Au 2026-08-01 : **75 stories, 0 écart** dans les deux sens. Côté backend, le même contrôle
donne **0 orpheline** (8 avaient dormi jusqu'à 8 jours, dont une masquée par un commentaire
erroné du tracker).
