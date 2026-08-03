# `mobile-stories/` — l'application **terrain native**

## Pourquoi un dossier séparé

`frontend-stories/README.md` pose la règle : *« le préfixe porte l'application, le dossier n'a rien à
ajouter »*. Ce dossier est une **exception assumée**, et voici son motif.

| | Web (`frontend-stories/`) | **Natif (ici)** |
|---|---|---|
| Plateforme | Navigateur | iOS · Android |
| Chaîne de compilation | Next / Vite | React Native ou Flutter |
| Distribution | Déploiement continu | **Magasins d'applications**, signature, revue |
| Correction urgente | En ligne en dix minutes | ⚡ **Cycle de publication** |
| Capacités | Limitées par le navigateur | Hors connexion robuste, appareil photo, GPS continu, **capture audio** |

Ce ne sont pas deux variantes d'un même métier. **Séparer le dossier évite qu'une story native soit
estimée avec les réflexes du web** — le piège le plus coûteux de ce type de projet.

## Nommage

```
MB-<NN>.md        MB-INT-<N>.md
```

Un fichier = une story = une branche (`mb-01`) = une PR, commits préfixés par l'identifiant.

## L'application

| | |
|---|---|
| **Dépôt** | `prospera-terrain` — ⚠️ **à créer** |
| **Nature** | Application **native** *(décision PO 2026-08-02)* — React Native ou Flutter, choix à trancher à l'ouverture |
| **Utilisateurs** | Les commerciaux du distributeur — salariés et indépendants |
| **Accès** | Activé par l'administrateur du distributeur (`DI-02` §2-ter) |
| **Authentification** | `auth-service`, RS256/JWKS, **direct-par-service** |

## Ce que le socle doit tenir

1. **Hors connexion d'abord** — un commercial à Sokodé n'a pas de réseau. L'application marche
   d'abord, se synchronise ensuite.
2. **Le verrouillage local ne demande jamais le réseau** — sinon elle est inutilisable là où elle sert.
3. **Le stockage local est chiffré** — il contient des créances, des montants, des contacts.
4. **L'état du réseau est visible en permanence** — c'est ce qui fonde la confiance du commercial dans
   tout le reste.

## Où vit quoi

| | |
|---|---|
| `mobile-stories/` | **les stories natives** (ce dossier) |
| `frontend-stories/` | les stories web — `FE-` · `AP-` · `DI-` · `PY-` |
| `stories/` | les stories **backend** (`STORY-<NNN>.md`) |
| `tickets/` | les manques découverts **chez l'autre**, en attente de porteur |
