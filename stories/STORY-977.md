# STORY-977 : le droit `terrain:parametres:modifier` au catalogue de tenant d'auth

Status: in-progress

**Complexité :** faible (un droit neuf au catalogue de tenant, hors du jeton ; une ligne d'ajout à l'annexe B ; aucun
champ, aucune route, aucun topic)

**Épic :** EPIC-223 (les rôles du distributeur, FR-4, FR-5), du PRD distributeur
**Dépôt :** `MoneyVibesGroup/prospera-auth-service`
**Plage :** groupe B, 930 → 979. Story **neuve**, hors des lignes du plan du lot 4 : c'est la demande de D à B du
2026-11-18 (journal de D, « → B (2026-11-18) : un droit neuf, `terrain:parametres:modifier` », STORY-1060, D-1060-6),
inscrite « reçue, pas encore servie » dans le journal de B par STORY-973. Une demande reçue passe avant la story
suivante (`REGLES-DES-GROUPES.md` §1.1) : placée avant STORY-1083 par la session du groupe B (D-977-1).
**Plan :** `coordination/PLAN-4-SESSIONS-LOT-4-2026-11-18.md` (§0 : rituel ; Docker : non, comme les cinq premières
stories de B, D-L4-3).
**Dépend de :** STORY-960 (droits hors du jeton, `droitsHorsJeton`) ; STORY-971 (le modèle :
`commande:parametres:modifier`, `AJOUTS_A_L_ANNEXE_B`).
**Débloque :** `PUT /api/v1/terrain/parametres` de D (STORY-1060, AC-5), qui répond 403 `DROIT_INSUFFISANT` à tous
tant qu'auth n'attribue pas le droit.
**Suivante :** STORY-1083 (le dossier de financement existe, bilan, sans Docker).

**Sources lues :** journal de D (« → B (2026-11-18) », D-1060-6) ; fiche STORY-1060 (AC-5, D-1060-6) ; manifeste
`terrain` (`manifestes/terrain.manifest.ts`, droit C7 amendé par D-1060) ; fiche STORY-971 (D-971-1 → 8) ; journal de
B (« Réponses aux demandes reçues », « ⚠ Contrats » de 971). Code relu sur `origin/dev` d'auth `e83568d` :
`src/common/rbac/droits-hors-jeton.ts`, `src/modules/rbac/table-d-acces-distributeur.ts` (`AJOUTS_A_L_ANNEXE_B`,
`droitsParDefautDu`) et leurs tests.

**Ce qui existait déjà (relu avant la fiche) :** le code n'est nulle part dans auth (`git grep` sur `origin/dev` :
aucun résultat). Le mécanisme est entier depuis 971 : un code de `DROITS_HORS_JETON` est au catalogue de tenant, servi
par `/moi/droits` dans `droitsHorsJeton` ; une ligne d'`AJOUTS_A_L_ANNEXE_B` l'attribue par défaut aux rôles du
distributeur nommés, que `droitsParDefautDu` dérive. Rien à construire : une entrée dans chacune des deux listes.

---

## Ce qui doit être vrai à la fin

| Exigence | Fait |
|---|---|
| `terrain:parametres:modifier` au catalogue de tenant, hors du jeton | une entrée dans `DROITS_HORS_JETON` (section `terrain`) ; servi par `GET /moi/droits` dans `droitsHorsJeton`, jamais dans `perms[]` ; la borne du jeton ne bouge pas (17 + 24 = 41 ≤ 44) |
| Rôles par défaut `DIST_DG` et `DIST_ADMIN`, eux seuls | une ligne d'`AJOUTS_A_L_ANNEXE_B` (`['DG', 'DIST_ADMIN']`), à part de la recopie de l'annexe B (D-977-3) |
| Rôles de l'IMF | hors périmètre (D le dit : ils viendront avec la story de C ou de D qui emploie `terrain` en microfinance) |
| `identity.droits.changed@1`, contrat `moi-droits` 1.1.0 | inchangés (D-977-5) |
| Tests de table d'accès à jour, le droit neuf vérifié par des mutations | § Preuves |

## Décisions (prises par défaut, contestables)

- **D-977-1 — Le numéro 977, et la place avant 1083.** Choisi par la session du groupe B : libre dans la plage de B
  (930 → 979) sur toutes les branches de `prospera-stories` et d'auth (vérifié au rituel : aucune fiche, aucune entrée,
  aucune branche). 975 et 976 sont réservées par le plan ; 977 est le premier libre. La demande reçue passe avant la
  story suivante (§1.1). Le plafond `story_id_high_water_mark` n'est pas touché : il reste le MAX réellement écrit
  (STORY-1060), et 977 est en dessous.
- **D-977-2 — Un droit, hors du jeton, à la lettre du manifeste.** `terrain:parametres:modifier` (27 caractères ≤ 40,
  forme `<module>:<objet>:<acte>`) entre dans `DROITS_HORS_JETON`, à la fin de la section `terrain`, avec le libellé
  « Modifier les paramètres du terrain ». Le catalogue de tenant passe de 152 à **153** codes (24 du jeton, 129 hors
  du jeton). Un droit né hors du jeton n'en sort jamais (D-960-2).
- **D-977-3 — `DIST_DG` et `DIST_ADMIN`, par `AJOUTS_A_L_ANNEXE_B`.** L'annexe B.2 ne nomme pas ce droit (D-1060-6,
  comme `commande:parametres:modifier`, Q-D-5) ; AD-12 réserve le réglage d'un paramètre au DG et à l'administrateur.
  `TABLE_D_ACCES_DU_DISTRIBUTEUR` reste la recopie ligne à ligne de l'annexe ; la ligne entre dans la liste à part,
  avec sa source. Le DG passe de 45 à 46 droits, `DIST_ADMIN` de 24 à 25 : régler le calendrier n'est pas lire une
  donnée métier, `DIST_ADMIN` ne lit toujours rien. Si le PO répond autrement à Q-D-5, les deux lignes se retirent
  ensemble.
- **D-977-4 — Aucun rôle de l'IMF.** Le module `terrain` est partagé, mais aucun rôle de microfinance n'a de table par
  défaut dans auth ; D renvoie ces rôles à la story qui emploie `terrain` en microfinance. Un rôle personnalisé ou une
  surcharge peut déjà composer le droit (module souscrit exigé, STORY-167).
- **D-977-5 — Aucun contrat ne change de forme.** Le jeton ne change pas (le droit n'y voyage pas) ;
  `identity.droits.changed@1` ne porte aucun droit (D-949-4) ; `moi-droits` reste en 1.1.0 à l'octet : seules les
  valeurs de `droitsHorsJeton` changent pour le DG et l'administrateur. Annoncé quand même dans « ⚠ Contrats » avant la
  fusion (valeurs visibles de D).
- **D-977-6 — La livraison n'avance pas `dv`** (D-949-3, D-971-5) : les caches `(membre, organisation, dv)` des
  services voient le droit à leur terme (60 s au plus).
- **D-977-7 — Sans Docker.** Aucun module Nest, aucune dépendance, aucun Dockerfile ne change : deux listes de données
  et leurs tests. La preuve est la suite du service (relancée par chemin de fichier, puis complète) et des mutations ;
  le démarrage d'auth se verra sur la pile de STORY-1080. La preuve de bout en bout de 971 (vrai jeton RS256 `DIST_DG`,
  `/moi/droits`) a établi le mécanisme ; ici, seule la donnée change.

## Livraison

(à compléter)

## Preuves

(à compléter)

## Pour la suite

- **D** : `PUT /api/v1/terrain/parametres` passe pour un DG ou un `DIST_ADMIN` sur une image d'auth reconstruite
  depuis `dev` (cache de 60 s compris).
- **La copie du manifeste `terrain` au catalogue** (`platform-catalog-service`, `copies.json`) n'a pas encore le droit
  (`npm run manifestes:garde` contre `prospera-stories/manifestes` : `terrain : manifeste.droits[11] diverge`, et des
  écarts de `comptabilite`). Sans effet sur l'attribution (auth ne lit pas cette copie) ; à recopier par la prochaine
  story de B qui touche le catalogue (STORY-975 ou 1080).
