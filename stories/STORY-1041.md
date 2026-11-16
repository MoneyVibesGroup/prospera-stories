# STORY-1041 : L'administration, l'import tout ou rien, le journal d'audit lisible

Status: done

**Épic :** EPIC-053 · **Dépôt :** `MoneyVibesGroup/reseau-service` · **Plage :** groupe D, n° 12 du lot 2.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **Cinq droits distincts** (consulter, modifier un nœud, redécouper, affecter, attribuer une portée), chacun sur ses routes | table rôle → droits, invariant des routes (depuis 1032) |
| AC-2 | **Import avec compte rendu avant persistance, tout ou rien** : chaque erreur nommée avec sa ligne ; un fichier fautif n'écrit rien ; un compte rendu périmé est refusé | intégration |
| AC-3 | **Journal en ajout seul avec sa route de lecture** : hiérarchie, affectations, rattachements, redécoupages, portées ; auteur rendu par son identité ; lignes de portée réservées à `reseau:portee:attribuer` | intégration ; invariant « ajout seul » |
| AC-4 | Les vérifications du manifeste : `portees-totales` (CM-2), `noeuds-sans-responsable`, `commerciaux-sans-compte` (et `consommateurs-conformes` depuis 1037) | intégration |

## Décisions retenues par défaut (contestables)

- **D-1041-1 — L'auteur d'une ligne de journal est pris au jeton** (`TenantContext.userId`), « systeme » hors requête.
- **D-1041-2 — `GET /journal` s'ouvre à `reseau:noeud:consulter`** (il était réservé aux portées en 1035) ; les lignes de
  portée restent réservées à `reseau:portee:attribuer`.
- **D-1041-3 — L'import ne porte que des zones** (code, nom, type, code du parent, localités) ; les commerciaux arrivent
  par la Reprise (objet `reseau.commercial@1`) ou l'API de 1034. **Le volet Reprise attend le kit des cibles de B
  (947)** : le même point d'écriture (compte rendu, puis application tout ou rien) s'y branchera.
- **D-1041-4 — Un code en double dans le fichier** est nommé, et la simulation ne garde que sa première ligne (défaut
  trouvé par la preuve).
- **D-1041-5 — La protection « rôle serveur » du journal** (un utilisateur MongoDB sans droit de modifier la collection)
  est d'exploitation : à porter avec l'agent d'instance ; le code est gardé par l'invariant d'ajout seul.

## Preuves

Node 24 : **441** unitaires ; **13** e2e. MongoDB réel : **104** tests d'intégration (10 d'administration). Recette depuis
`origin/dev` (5922180) : 104/104. PR reseau-service#12.
