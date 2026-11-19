# TICKET backend : une liasse rouverte est relue avec `version: null`

**Dépôt :** `bilan-service`, tenu par B au lot 4. **Découvert par :** le gate de FE-034 sur la vraie pile (groupe A,
2026-11-19). Le défaut était déjà nommé en septembre (STORY-449 : « POST /rouvrir rend version: 2 là où GET /:id rend
null, défaut pré-existant depuis STORY-065 »), mais il n'avait jamais été fiché.
**Statut :** ouvert.

## Le constat

Après `POST …/etats/{id}/rouvrir`, la réponse porte la version qui fait foi (par exemple 1). Mais `GET …/etats/{id}`
sur le même jeu rend `version: null`. Un écran qui lit le jeu croit donc qu'aucune version figée n'existe. Il dirait
« Brouillon » au lieu de « Rouverte — la version 1 reste la seule qui fasse foi », et il proposerait de supprimer un
brouillon qui a pourtant des versions.

## Contournement côté front (FE-034, #55)

L'écran prend la plus haute version de `GET …/versions` quand le jeu ne la dit pas.

## Ce qui est attendu

`GET …/etats/{id}` rend, sur un jeu rouvert, la même `version` que `POST …/rouvrir` : la dernière version figée. Un test
couvre la séquence valider → rouvrir → lire.
