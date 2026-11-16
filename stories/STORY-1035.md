# STORY-1035 : Le modèle de portée, l'héritage et la gouvernance

Status: done

**Complexité :** élevée (le cœur du contrôle d'accès du programme ; son erreur est silencieuse)

**Épic :** EPIC-049 (la portée d'accès : modèle, héritage, gouvernance)
**Dépôt :** `MoneyVibesGroup/reseau-service`
**Plage :** groupe D, n° 6 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §5). Dépend de STORY-1033 et
1034 ; précède STORY-1036 (publication, jalon du 27/11).

---

## Pourquoi

Le catalogue de permissions dit **quoi** ; la portée dit **sur quoi**. Son défaut le plus coûteux (une portée vide qui
ouvre tout) ne se voit pas en test fonctionnel. La spine en fait des règles : « totale » est une **valeur**, l'écriture
ne déborde jamais la lecture, nul n'attribue plus que ce qu'il détient, tout est journalisé (AD-6 → AD-8).

## Ce qui doit être vrai à la fin (plan lot 2, §5, n° 6)

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **« Totale » distincte de « aucune »** : `TOTALE` est une valeur explicite ; une portée vide se résout en zéro nœud ; une portée retirée ou absente n'est pas une portée | unitaires, intégration |
| AC-2 | Héritage par descendance **explicite** (un nœud avec ou sans sa descendance), restriction par exclusion d'un sous-arbre | unitaires |
| AC-3 | Écriture ⊆ lecture : sinon `PORTEE_ECRITURE_DEBORDE`, **le débordement nommé**, jamais ajusté | intégration ; mutation |
| AC-4 | **Personne n'attribue plus que sa portée** (ni ne modifie ou retire une portée plus large que la sienne) : `PORTEE_SUPERIEURE_A_LA_VOTRE`, débordement nommé | intégration (auteur non racine, sur MongoDB réel) |
| AC-5 | **Journal avant/après** : auteur (rendu par son identité), motif, avant, après ; alerte unitaire sur une portée totale (CM-2) ; la route de lecture livrée avec l'écriture (AD-14) | intégration ; invariant « ajout seul » |
| AC-6 | Le compte rendu d'un déplacement nomme les portées qui changent (AD-2) | intégration |

## Décisions retenues par défaut (contestables)

- **D-1035-1 — Le périmètre** : `{ genre: 'TOTALE' }` ou `{ genre: 'NOEUDS', racines: [{ noeudId, descendants }],
  exclusions: [noeudId] }`, résolu sur l'arbre courant en un ensemble de nœuds. Les nœuds fermés restent dans
  l'ensemble (l'historique se lit) ; un nœud inconnu n'ouvre rien et est refusé à l'attribution.
- **D-1035-2 — Une portée par utilisateur et par organisation** (`portees_reseau`, clé `(organisationId, userId)`),
  versionnée ; un retrait la passe `RETIREE`, il ne l'efface pas.
- **D-1035-3 — Le `TENANT_ADMIN` est la racine de l'autorité** de son organisation : pour la gouvernance, il détient
  une portée totale par son rôle (non publiée, non attribuée). Sans cette racine, personne ne pourrait attribuer la
  première portée. Tout autre auteur est borné par sa portée attribuée, et un auteur sans portée n'attribue rien.
  **Question au PO** (Q-D-3) ; choix par défaut appliqué.
- **D-1035-4 — Modifier ou retirer la portée de quelqu'un exige de la couvrir** : sinon un subordonné pourrait réduire
  la portée de son supérieur.
- **D-1035-5 — Les routes des portées et du journal exigent `reseau:portee:attribuer`** : savoir qui voit quoi est
  déjà une information de sécurité. `GET /journal` ne lit aujourd'hui que les actions de portée ; STORY-1041 l'étend.
- **D-1035-6 — L'alerte CM-2** est une ligne du journal (`alertes: ['PORTEE_TOTALE']`) et un avertissement du journal
  applicatif ; la vérification `portees-totales` du manifeste viendra avec les routes d'instance.
- **D-1035-7 — Le journal en ajout seul** est gardé par un invariant de code ; la protection par un rôle MongoDB est
  d'exploitation (STORY-1041).

## Preuves

- Stage `verification` (Node 24) : lint 0 ; **44 suites, 408 tests** unitaires ; **13 e2e** ; build.
- MongoDB réel : **9 tests** HTTP de la portée (dont la gouvernance d'un auteur non racine sur le service) ; **62** au
  total.
- Défaut trouvé par la preuve et corrigé avant fusion : le débordement nommé sortait dans l'ordre des identifiants, pas
  des codes.
- Mutation : contrôle « écriture ⊆ lecture » neutralisé ⇒ 3 rouges.
- Recette depuis `origin/dev` (b12a988, volumes neufs) : `healthy`, 62/62.
- PR reseau-service#6, `dev` b12a988.
