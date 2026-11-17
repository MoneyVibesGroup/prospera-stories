# STORY-1052 : les séries hébergées — aucun numéro perdu ni réémis après une restauration

Status: in-progress

> **Où en est la story (note de reprise, tenue à jour sur la branche `docs-1052`)** : fiche écrite ; code de
> `series-v1.1` (plateforme, branche `MNV-1052`) puis de `ventes` (branche `MNV-1052`) en cours ; preuves Docker à
> jouer sous le verrou du poste.

**Épics :** EPIC-224 (les séries sans perte, le jeu de répliques et l'exploitation hébergée), EPIC-263 (profil
d'instance hébergée) · **Dépôts :** `prospera-plateforme` (`series/`, tenu par D), `prospera-ventes-service` (socle
des séries, module `commande`) · **Plage :** groupe D, n° 8 du lot 3 (`PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §4).
**Dépend de :** rien. **Suite de :** STORY-1044 (`series-v1`, `dev` e0cb763). **Suivante :** STORY-1053 (les 15
rôles appliqués par le serveur, après B-960) ; la commande (1056) émettra le premier vrai numéro `BL-` par ce qui est
posé ici.

**Sources :** spine distributeur AD-5 (une implémentation, compteur dans la base du module propriétaire, incrément et
document dans la même transaction, un compteur ne recule jamais), AD-26 (hébergé : aucun module ne branche sur
« hébergé » ou « sur site », la différence est dans la configuration), AD-30 (écriture majoritaire synchrone, RPO 0 ;
après une restauration, un compteur reprend au **maximum connu**, un numéro n'est **jamais réémis**, un trou éventuel
est **déclaré et documenté, jamais comblé**), AD-32 (alerte « dérive d'une série »), Q-9 ; spine du moteur AD-43
(profil d'instance hébergée : jeu de répliques à 3 membres porteurs, pas d'arbitre, `w: majority` avec `j: true`) ;
PRD distributeur NFR-1, NFR-3, NFR-9, FR-43, FR-217 ; EPIC-224 (« fini quand ») ; STORY-1044 (D-1044-1 → 4) ; usage
de `series-v1` par B dans la comptabilité (STORY-961 : `src/vendor/series/`, numérotation dans la transaction de
l'acte, D-961-5).

## Pourquoi

`series-v1` rend des numéros consécutifs et jamais réémis **tant que la base ne recule pas**. Une restauration la fait
reculer : la sauvegarde de la nuit ne connaît pas les bons émis le matin, et le compteur restauré les rendrait une
seconde fois. `series-v1` laisse la reprise à un appel manuel (`reprendreApresRestauration`) avec la tête que l'agent a
reçue la veille, donc en retard d'une journée au pire, et ne dit rien d'un trou. L'hébergé (AD-30, AD-43) exige mieux :
un numéro n'est remis qu'après l'acquittement de la majorité du jeu de répliques, et une restauration est **détectée
seule**, relève le compteur au maximum connu, et **déclare** ce qu'elle ne peut pas savoir.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **`series-v1.1`** publiée dans la plateforme, compatible avec `series-v1` (rien de ce qu'appellent `ventes` et la comptabilité ne change de forme) ; `series-v1` n'est pas déplacée ; recopiée à l'octet dans `ventes` avec son empreinte | tests de la plateforme ; invariant d'empreinte |
| AC-2 | **Écriture majoritaire, lecture linéarisable** : hors transaction, chaque écriture du dépôt est `w: majority`, `j: true`, avec un délai borné (pas d'attente infinie) ; la tête se lit `linearizable` ; l'émission sans perte se fait dans une transaction ouverte en `majority` ; un numéro n'est rendu qu'après l'acquittement | MongoDB réel ; jeu de répliques à 3 membres |
| AC-3 | **L'ancre en écriture anticipée** : chaque numéro est réservé hors de la base restaurable **avant** d'être rendu, puis confirmé après l'acquittement ; une émission abandonnée (transaction annulée) reprend le même numéro, sans trou | unitaires ; MongoDB réel |
| AC-4 | **Restauration** : `mongodump`, émissions, `mongorestore --drop`, émissions : **aucun numéro réémis** ; le compteur reprend au maximum connu, une nouvelle époque s'ouvre, **le trou est déclaré** (bornes, émis confirmés, réservés) dans la série, dans la piste d'audit du module et au journal (`SERIE_DERIVE`) | pile `grp-d` réelle ; MongoDB réel |
| AC-5 | **Détectée seule** : au démarrage du service (avant d'écouter) et à l'émission (service non redémarré) | MongoDB réel ; pile `grp-d` |
| AC-6 | **Concurrence** : N émissions parallèles, chacune dans sa transaction : N numéros consécutifs, aucun doublon, l'ancre au dernier | MongoDB réel ; pile `grp-d` |
| AC-7 | **Jeu de répliques** : le service refuse de démarrer si la base n'a pas le nombre de membres porteurs demandé, ou a un arbitre (`JEU_DE_REPLIQUES_INSUFFISANT`) ; l'arrêt d'un membre sur trois ne perd aucun numéro ; sans majorité, aucun numéro n'est rendu | pile `grp-d` (profil hébergé) |
| AC-8 | **Mutations** rouges sur une assertion ; Node 24 ; `docker compose -p grp-d up` ; rejoué depuis `origin/dev` | « Preuves » |

## Décisions retenues par défaut (contestables)

- **D-1052-1 — « Hébergé » est une configuration, pas une branche du code** (AD-26). Le même code tourne partout ;
  l'hébergé se règle par trois variables : `MONGODB_URI` vers un jeu de répliques à trois membres porteurs (AD-43),
  `MONGODB_MEMBRES_PORTEURS_MIN=3` (garde au démarrage) et `SERIES_ANCRE_URI` (l'ancre, D-1052-4). Sans elles (sur
  site, développement), le service se comporte comme avec `series-v1`, écritures majoritaires en plus, et le dit au
  démarrage (`SERIES_SANS_ANCRE`).
- **D-1052-2 — Écrire en `majority`, lire en `linearizable`.** Hors transaction, chaque écriture du dépôt porte
  `w: majority`, `j: true`, `wtimeoutMS: 10000` : sans majorité, l'appel échoue au lieu d'attendre ou de rendre un
  numéro qu'un basculement effacerait. Dans une transaction, le niveau ne se pose pas par opération (MongoDB le
  refuse) : c'est la transaction qui s'ouvre en `majority` (`NumerotationDesSeries`). L'émission est un
  `findOneAndUpdate` atomique acquitté par la majorité : un ancien primaire isolé ne peut pas l'acquitter, ce qui vaut
  une lecture linéarisable. La **tête** (`tete`, `etat`), qu'on remet à l'agent ou qu'on affiche, se lit en
  `linearizable` (`maxTimeMS` 10 s).
- **D-1052-3 — Restaurer ne doit rien réémettre : la base seule ne le sait pas.** Une base restaurée ne connaît pas ce
  qui a été émis après sa sauvegarde. Il faut un témoin **hors** de ce qu'on restaure, écrit **avant** qu'un numéro
  sorte (écriture anticipée). Une époque seule, ou un plancher relu de la piste d'audit et des actes, ne suffit pas :
  la piste et les actes sont restaurés avec la base.
- **D-1052-4 — L'ancre des séries : réservé avant, confirmé après.** Port `AncreDesSeries` de la bibliothèque, par
  série : `reserve` (le plus grand numéro tiré), `confirme` (le plus grand numéro dont l'écriture est acquittée),
  `plancher` (l'amorçage repris de Sage). Une émission : incrément dans la base (dans la transaction de l'acte), puis
  `reserve := max(reserve, n)` acquitté dans l'ancre, puis le numéro est rendu ; après l'acquittement de la
  transaction, `confirme := max(confirme, n)`. Chaque émission confirme aussi la précédente (relue engagée).
  **Invariant** : tout numéro rendu est ≤ `reserve` ; en marche normale, `reserve` ≤ dernier engagé + 1 (deux
  incréments non engagés d'une même série ne coexistent pas : la seconde transaction heurte la première).
- **D-1052-5 — La base est derrière l'ancre ⇒ elle a été restaurée.** `confirme > dernier` ou `reserve > dernier + 1`
  (ou `plancher > dernier`) ne se produit pas en marche normale. Alors le compteur est **relevé** au maximum connu
  (`max(reserve, confirme, plancher)`), **une époque s'ouvre**, et le **trou** `[dernier + 1, max]` est déclaré : de
  `dernier + 1` à `confirme`, des numéros émis et confirmés, absents de la base restaurée ; au-delà, des numéros
  réservés, émis ou abandonnés. Il n'est **jamais comblé**. Détecté **au démarrage** (avant que le service écoute) et
  **à l'émission** (même transaction que le numéro qu'elle rend : sans redémarrage, rien n'est réémis non plus).
- **D-1052-6 — Le cas limite `reserve = dernier + 1` sans confirmation est une émission abandonnée** (transaction
  annulée ou rejouée) : le numéro est repris, sans trou. Le résidu est écrit : une panne **entre** l'acquittement de la
  transaction et la confirmation, **puis** une restauration à une sauvegarde d'avant ce numéro, le réémettrait (double
  panne). Le démarrage le réduit : il confirme toute réservation que la base a engagée.
- **D-1052-7 — Le trou est tracé à trois endroits** : dans le document de la série (`trous[]` : `du`, `au`,
  `confirmesJusqua`, `epoque`, `motif`, `source`, `constateLe`), écrit avec le saut ; dans la piste d'audit chaînée du
  module (acteur `SYSTEME`, objet la série, avant/après) ; au journal du service en `error`, code `SERIE_DERIVE`
  (l'alerte d'AD-32). Une restauration ultérieure qui l'effacerait le fait redéclarer : l'ancre, elle, ne recule pas.
- **D-1052-8 — Où vit l'ancre : une base MongoDB hors de celle du service.** L'adaptateur livré (`ancreMongo`) écrit
  dans `series_ancre` d'une base désignée par `SERIES_ANCRE_URI`, sur **un autre jeu de répliques** que la base du
  service (hébergé : celui de la plateforme Money Vibes, autre support, EPIC-224 « ancrage des têtes de série ») ;
  clé `<service>/<collection>/<série>`. Pourquoi pas le topic `serie.changed@1` comme ancre : un registre au maximum
  doit garder **le plus grand** numéro, de façon atomique, lisible par clé et sûr à plusieurs processus ; un topic
  compacté garde **le dernier écrit**. Le fait `commande.serie.changed@1` (au catalogue `contrats-distributeur-v1`)
  reste la tête publiée d'AD-5 : 1056 le publie avec le manifeste. La tête ancrée chez l'agent (AD-21) et les numéros
  des Créances restent des sources du maximum connu : elles entrent par `reprendreApresRestauration` (inchangée,
  déclare désormais son trou) quand elles existeront.
- **D-1052-9 — `series-v1.1`, pas `v2`** : tout est ajouté (options du constructeur, `confirmer`, `reconcilier`,
  `reconcilierTout`, `etat`, `lister`, `ancreMongo`, `ancreEnMemoire`, `TrouDeclare`, codes `ANCRE_INDISPONIBLE`) ;
  les méthodes neuves du dépôt sont facultatives dans l'interface ; ce que rendent `emettre`, `tete` et
  `reprendreApresRestauration` garde sa forme (un champ `trou` ne s'ajoute à `NumeroEmis` que lors d'un saut). Les
  changements de comportement de `depotMongo` sont plus stricts, jamais plus lâches : `majority` et `linearizable`
  hors transaction ; `lire` passe la session dans une transaction (en `v1`, il lisait hors de la transaction). Garder
  le majeur 1 évite qu'une organisation qui installe la comptabilité (`series-v1`) et `commande` (`series-v1.1`) soit
  refusée pour « majeurs différents » (spine, bibliothèques partagées). `series-v1` reste où elle est.
- **D-1052-10 — Une série par organisation** (AD-5) : `<organisationId>:<série>` dans `<module>_series`
  (`commande_series` ; `facturation_series` viendra avec la facture). `commande` possède `bons-livraison` (`BL-`).
- **D-1052-11 — L'émission sans perte passe par `NumerotationDesSeries.emettreDansUneTransaction`** (socle de
  `ventes`) : transaction `majority`, le numéro et le document qui le porte dans la même transaction (AD-5),
  confirmation après l'acquittement. 1056 l'emploie pour `BL-`.
- **D-1052-12 — Routes** : `GET /api/v1/commande/series` (têtes, époques, trous déclarés de l'organisation ;
  `TENANT_ADMIN` jusqu'à 1053). La route de recette `POST /api/v1/commande/series/{serie}/emissions-de-recette` émet
  N numéros en parallèle, chacun avec un document témoin (`commande_numeros_de_recette`) : elle n'existe que si
  `SERIES_EMISSIONS_DE_RECETTE=actif`, refusé au démarrage en `NODE_ENV=production` (un numéro ne se tire pas sans
  pièce, AD-5 ; elle sert la preuve de restauration sur la pile).

## Ce qui n'est pas fait ici

Le numéro `BL-` d'un vrai bon (1056) ; la publication de `commande.serie.changed@1` ; l'envoi quotidien de la tête à
l'agent (EPIC-148, B) ; le rapprochement des encaissements avec le relevé du fournisseur après restauration
(`paiement`, B) ; les séries de `facturation` (EPIC-230).

## Preuves

À écrire.
