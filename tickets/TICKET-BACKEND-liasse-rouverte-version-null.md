# TICKET backend : une liasse rouverte est relue avec `version: null`

**Dépôt :** `bilan-service`, tenu par B au lot 4. **Découvert par :** le gate de FE-034 sur la vraie pile (groupe A,
2026-11-19). Le défaut était déjà nommé en septembre (STORY-449 : « POST /rouvrir rend version: 2 là où GET /:id rend
null, défaut pré-existant depuis STORY-065 »), mais il n'avait jamais été fiché.
**Statut :** ✅ **FERMÉ le 2026-11-24 par le groupe B** : correctif de STORY-065, **bilan #185** (`7b53ff5` sur
`dev`, branche `MNV-065-rouverte`) ; annonce « ⚠ Contrats » avant la fusion : stories #802. Voir « Résolution » en bas.

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

## Résolution (2026-11-24, groupe B)

- `GET …/etats/{id}` rend, sur un jeu rouvert, la **dernière version figée**, celle que `POST …/rouvrir` rend (même
  source : le dernier snapshot) ; `POST …/recalculer` et `PUT …/complements` aussi (D-065-1). `origine` reste `CALCUL` :
  la liasse d'un brouillon rouvert est calculée. `null` ne se lit plus que « jamais validé ».
- La **liste** `GET …/etats` porte le même `version` (facultatif, nullable, D-065-2) ; `GET …/versions` était juste (sa
  plus haute version est ce `version`).
- `source.version` de l'analyse et `vue.version` de la consultation restent la version **servie** (`null` sur un
  brouillon, même rouvert, D-065-3).
- **Test valider → rouvrir → lire** (`test/bilan-jeu-etats.e2e-spec.ts`) : rouvrir, consulter, recalculer, la liste et
  l'historique disent tous la version 1.
- **Pour A (FE-034)** : `npm run gen:api -- bilan` ; `versionQuiFaitFoi` peut lire `jeu.version` seul et retirer son
  repli sur la plus haute de `GET …/versions` (`src/features/bilan/lib/validation.ts`).
