# STORY-1095 : Le plan comptable propre d'un client — ce que le dossier ajoute au modèle du cabinet

Status: ready-for-dev — **créée le 2026-11-18** à la demande de l'utilisateur. Non slottée : à placer au prochain plan.

**Service :** `prospera-comptabilite-service` (tenu par B au lot 4) · **Points :** 5 · **Dépend de :** STORY-1094

---

## Pourquoi

Le modèle du cabinet (STORY-1094) couvre ce que tous ses clients partagent. Mais un client a **ses** banques, **ses**
caisses et parfois un journal à lui (« CAI2 Boutique Bè »). L'utilisateur l'a demandé le 2026-11-18 : la comptabilité
propre se fait « en fonction du cabinet, **par client aussi** ».

## Ce qui est attendu

1. Un **plan propre du dossier**, qui **s'ajoute** au modèle du cabinet. Il ne le remplace pas et ne le copie pas.
   Il porte des comptes propres et des journaux propres, avec la même règle de racine que STORY-1094.
2. **Ordre de lecture** : référentiel publié, puis modèle du cabinet, puis plan du dossier. La réponse dit, pour chaque
   compte et chaque journal, **d'où il vient** (`REFERENTIEL`, `CABINET` ou `DOSSIER`).
3. Un compte ou un journal du dossier ne peut pas porter le numéro ou le code d'un élément du modèle du cabinet
   (`409` qui nomme l'élément existant). Le dossier peut en revanche **masquer**, pour lui seul, un compte du modèle
   qu'il n'utilise pas, s'il n'est pas mouvementé dans ce dossier.
4. **Droits** : l'administrateur du cabinet, et le responsable du dossier, écrivent. Les contributeurs du dossier
   lisent. Toute écriture est inscrite au **journal du dossier** (nouvel acte, publié au contrat).
5. Un dossier **archivé** se lit et ne s'écrit plus (`409 DOSSIER_ARCHIVE`, comme ailleurs).

## Critères d'acceptation

- **AC-1** : le plan servi pour un dossier est l'union, dans l'ordre ci-dessus, avec l'origine de chaque élément.
- **AC-2** : aucun élément du dossier n'apparaît dans un autre dossier du même cabinet (étanchéité, comme au gate
  FE-069).
- **AC-3** : un compte du modèle masqué dans un dossier n'est plus proposé à la saisie de ce dossier, et reste
  proposé dans les autres.
- **AC-4** : chaque écriture sur le plan du dossier est un acte du journal du dossier, avec son auteur.
