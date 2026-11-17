# STORY-1007 : l'accusé de réception du dossier complet

Status: done

**Complexité :** petite (une fonction pure, un événement du référentiel des échéances, un effet dans la commande de pièce contrôlée)

**Épic :** EPIC-206 (déclarer, ouvrir et attribuer)
**Dépôt :** `prospera-sinistres-service`
**Plage :** groupe C, n° 3 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §5) ; dépend de STORY-1001.
Ancrage : D-1001-5 (différé nommé : « l'accusé de réception du dossier complet, dont l'échéance de 10 jours court déjà »).

---

## Pourquoi

STORY-1001 fait passer une pièce à `RECUE` quand `ged` l'a validée au contrôle (`ged.piece.controlee@1`) et pose le
constat `PIECES_COMPLETES`. Mais le moment où le dossier devient complet ne produisait rien : l'accusé de réception du
dossier complet (FR-48, modèle `ACCUSE_RECEPTION`) n'existait pas, et l'échéance interne `ACCUSE_DOSSIER_COMPLET`
(10 jours depuis la déclaration) ne s'arrêtait qu'à l'ouverture du dossier (événement `DOSSIER_OUVERT`). Le mémoire de
2014 relève des accusés « jamais envoyés » : l'échéance est un indicateur de contrôle.

**Source** : PRD FR-48 (« à l'ouverture, un accusé est généré ; l'échéance de 10 jours court depuis la déclaration et
s'arrête à l'envoi journalisé de l'accusé »), FR-45, FR-165 ; plan lot 3 §5 (ligne 1007) ; D-1001-3 (une pièce reçue =
validée au contrôle) ; D-1001-5.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | Quand la **dernière** pièce obligatoire attendue est validée au contrôle (`issue: VALIDEE`), un accusé de réception du dossier complet est posé au dossier : courrier `ACCUSE_RECEPTION`, destinataire `ASSURE`, statut `BROUILLON`, daté du contrôle, avec les pièces obligatoires reçues | test pur ; test du service sur les deux bancs |
| AC-2 | L'échéance `ACCUSE_DOSSIER_COMPLET` est levée au même moment, dans la même écriture (événement `ACCUSE_POSE`, arrêtée « par » cet événement, à la date du contrôle) | test du service sur les deux bancs |
| AC-3 | Une pièce **rejetée** ou **non contrôlée** ne compte pas : elle ne change pas la liste des pièces, donc ne pose ni accusé ni arrêt | tests |
| AC-4 | L'accusé se pose **une seule fois** : le même fait rejoué (`SANS_EFFET`), ou un dossier qui redevient incomplet (pièce rejetée) puis complet de nouveau, ne pose pas un second accusé | tests |
| AC-5 | Un dossier déjà ouvert en attente de pièces reçoit quand même l'accusé à sa dernière pièce ; l'échéance garde son arrêt de l'ouverture (`DOSSIER_OUVERT`) | test |
| AC-6 | L'envoi du courrier n'est pas fait ici (EPIC-220, groupe D) | — |

## Décisions retenues par défaut (contestables)

- **D-1007-1 — « Dossier complet » = le passage de « il manque une pièce obligatoire » à « aucune ne manque »**, sur une
  pièce validée au contrôle. C'est le constat `PIECES_COMPLETES` de STORY-1001, jamais un autre calcul. Un dossier
  sans pièce attendue n'est pas « complet » (la fonction `piecesCompletes` l'exigeait déjà).
- **D-1007-2 — La date de l'accusé et de l'arrêt est celle du contrôle** (`controleLe` du fait de `ged`), non l'heure
  où `sinistres` lit le fait : un rejeu du topic donne la même date, et l'échéance s'arrête au moment réel.
- **D-1007-3 — Un événement neuf, `ACCUSE_POSE`, ajouté à la liste d'arrêt de `ACCUSE_DOSSIER_COMPLET`** dans le
  référentiel `2026.1` (déclaré dans ses événements). **`DOSSIER_COMPLET` n'est pas émis** : il ouvre l'échéance
  `OFFRE_INTERNE` (90 jours au corporel) et reste l'acte de l'agent (transitions 1 et 3). `DOSSIER_OUVERT` **reste** un
  arrêt : un dossier ouvert avant d'être complet arrête déjà son échéance, comme avant (rien d'existant ne change ; la
  liste d'arrêt ne fait que s'allonger, donc un dossier déjà ouvert n'est pas touché). ⚠️ Écart de lecture avec FR-48,
  qui dit que l'échéance s'arrête « à l'envoi de l'accusé » : l'envoi (journalisé par `notification`) viendra avec
  EPIC-220 ; d'ici là, « posé » arrête l'échéance, comme l'écrit le plan du lot 3.
- **D-1007-4 — L'accusé est un `Courrier` du dossier**, du même registre que le courrier de demande de pièces
  (STORY-1001, `courriers[]`), numéroté à la suite ; `modele` s'élargit à `'DEMANDE_PIECES' | 'ACCUSE_RECEPTION'` (ajout
  facultatif, rien ne se renomme). Aucun fait nouveau sur le fil : `sinistres.dossier.changed@1` est republié par la
  commande comme pour toute écriture du dossier.
- **D-1007-5 — Une seule fois par dossier**, même si une pièce est rejetée puis remplacée : l'accusé dit que le dossier
  a été reçu complet, et un second courrier ne dirait rien de plus. Une reprise de la complétude se lira dans l'état des
  pièces et dans la piste d'audit (`PIECE_REJETEE`, `PIECE_RECUE`).

## Ce qui a été livré

**2026-11-17** — `prospera-sinistres-service` **#17** (`dev` `d9444e5`), fusionnée en « Rebase and merge » :

- `ouverture/ouverture.ts` : `accuseDuDossierComplet(avant, apres, courriers, le)` (pure) et `EVENEMENT_ACCUSE_POSE` ;
  `Courrier.modele` élargi.
- `dossiers/dossiers.service.ts` : `appliquerPieceControlee` pose l'accusé et applique `ACCUSE_POSE` aux échéances dans
  la même écriture (version lue, ligne d'audit chaînée, fait du dossier dans la transaction). Les jalons déjà planifiés
  de l'échéance arrêtée se constatent « arrêtée » à leur départ (l'échéancier le refusait déjà : `ECHEANCE_ARRETEE`).
- `echeances/referentiel-des-echeances.json` : événement `ACCUSE_POSE` déclaré ; `ACCUSE_DOSSIER_COMPLET` s'arrête par
  `DOSSIER_OUVERT` ou `ACCUSE_POSE`.
- **Tests** : 1 pur et 3 du service (sur les deux bancs, mémoire et MongoDB réel) ; les échéances, l'ouverture et le
  dossier existants restent verts.
- **Node 24** (étage `verification`, image construite depuis `git archive MNV-1007`, MongoDB réel en jeu de répliques) :
  lint 0, 977 unitaires (49 suites, 1 sautée : la suite Redis), 19 e2e, build 0.
- Aucun module Nest, aucune dépendance, aucun Dockerfile ni aucune route ne change : pas de pile (règle de légèreté du
  lot 3, §5).
- **Rejouée depuis `dev`** (export d'`origin/dev` `d9444e5`, arbre identique à la branche) : lint 0, 977 unitaires
  sur MongoDB réel, 19 e2e, build 0.

**Reste**
- **L'envoi** de l'accusé (canal, date, preuve d'envoi) et sa copie archivée dans `ged` : EPIC-220 (groupe D, `notification`).
- Les alertes de FR-48 (au 8e jour pour l'agent, au-delà de 10 jours pour le `RESP`) : l'échéancier de STORY-989 porte déjà
  l'alerte de l'échéance (85 % du délai) ; ce qui reste est la visée par rôle et l'affichage (écrans).
- Le courtier et les coassureurs informés à l'ouverture (FR-48) ; la provision d'ouverture : **STORY-1008**.
- Le fait `sinistres.garantie.decidee@1` et le type exact d'une pièce de santé : inchangés (D-1001-5, D-1001-6).
