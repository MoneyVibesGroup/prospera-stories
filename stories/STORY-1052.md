# STORY-1052 : les séries hébergées — aucun numéro perdu ni réémis après une restauration

Status: done

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
  `reconcilierTout`, `etat`, `lister`, `ancreMongo`, `ancreEnMemoire`, `TrouDeclare`, codes `ANCRE_INDISPONIBLE`,
  `DEPOT_INCOMPLET`, `SERIE_INSTABLE`) ; les méthodes neuves du dépôt (`sauter`, `lister`, `enTransaction`,
  `assurer`, `lireEngage`) sont facultatives dans l'interface ; ce que rendent `emettre`, `tete` et
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

- **D-1052-13 — En transaction, la série se crée hors de la transaction, et une transaction périmée ne saute pas.**
  Mesuré sur MongoDB réel (premier passage de l'intégration, rouge une fois sur trois) : 50 transactions concurrentes
  sur une série **à créer** tirent toutes le n° 1 (deux créations du même document ne se heurtent qu'à
  l'acquittement) ; les condamnées voyaient l'ancre déjà confirmée par la gagnante, croyaient la base restaurée et
  réservaient plus haut — l'ancre était polluée et la suite sautait 2 → 5 sans restauration. Correctif dans la
  bibliothèque : `assurer` crée le document hors de la transaction avant l'incrément (sur un document qui existe,
  deux incréments concurrents se heurtent tout de suite) ; avant tout saut en transaction, `lireEngage` relit l'état
  engagé : s'il tient déjà le numéro tiré, la transaction est périmée, **rien n'est sauté ni réservé**, refus
  `SERIE_INSTABLE`, et `ventes` rejoue l'émission (cinq fois au plus).
- **D-1052-14 — `LOG_PRETTY`** (facultatif, `true` | `false`) : par défaut rien ne change (lisible hors production).
  Une pile de recette pose `NODE_ENV=staging` pour ouvrir la route de recette ; l'image runtime n'a pas `pino-pretty`
  et le service ne démarrait pas (« unable to determine transport target ») : la pile pose `LOG_PRETTY=false`.

## Ce qui n'est pas fait ici

Le numéro `BL-` d'un vrai bon (1056) ; la publication de `commande.serie.changed@1` ; l'envoi quotidien de la tête à
l'agent (EPIC-148, B) ; le rapprochement des encaissements avec le relevé du fournisseur après restauration
(`paiement`, B) ; les séries de `facturation` (EPIC-230).

## Preuves

- **Bibliothèque** (`prospera-plateforme`, Node 24, `node:24-slim`, archive de la branche) : `npm run typecheck` vert ;
  `npm test` racine **575 tests, 574 pass, 0 fail** (1 sauté, hérité) ; `series/` **32/32** (8 de v1 inchangés,
  24 neufs : ancre, sauvegarde et restauration, démarrage, émission abandonnée, dernier numéro perdu, transaction
  périmée, amorçage ancré, ancre en panne, 50 émissions simultanées sur ancre lente, niveaux MongoDB des deux
  adaptateurs). **Mutations : 12/12 rouges sur une assertion** (la confirmation ou la réservation ne disent plus le
  recul ; numéro rendu sans réservation ; série non créée hors transaction ; transaction périmée qui saute ; démarrage
  qui ne confirme plus ; émission qui ne confirme plus la précédente ; écriture `w: 1` ; lecture `majority` ; amorçage
  d'une série entamée d'après l'ancre ; saut sans époque ; émissions hors transaction sans file).
- **Copie à l'octet** dans `ventes` (`git -c core.autocrlf=false show series-v1.1:series/src/index.ts`, `cmp`
  identique) : `src/socle/series/series.ts` sha256
  **`68833b1af555ab70f50054f11f9bfddf37316d692082d11bd62b8a42f37a13a4`**, figée par `src/series.invariant.spec.ts`
  (valeur écrite dans le test) ; ni lint ni formatage sur la copie.
- **`ventes`, Node 24** (étage `verification`, image construite depuis `git -c core.autocrlf=false archive HEAD`) :
  `tsc --noEmit` vert ; `npm run lint` (tout le dépôt) vert, et lint des fichiers touchés avec `endOfLine auto` ;
  `npm run build` vert ; unitaires **Test Suites: 38 passed, 38 total ; Tests: 348 passed** ; e2e **1 suite, 11
  passed** ; intégration sur **MongoDB 8.0 réel en jeu de répliques** **Test Suites: 6 passed, 6 total ; Tests: 44
  passed** (dont 12 neufs : 50 émissions transactionnelles simultanées consécutives, l'ancre à 50/50 ; sauvegarde
  par copie, émissions, restauration : 16 rendu, trou 11 → 15 déclaré et tracé dans la piste, piste intègre ; relève au
  démarrage ; dernier numéro rendu puis perdu : trou d'un numéro ; émission abandonnée reprise sans trou ; lecture
  linéarisable ; jeu de répliques à trois exigé : refus ; et par le banc HTTP : garde du module, rôle, route de recette
  fermée, 30 émissions parallèles, série inconnue, bornes). Les deux suites de séries rejouées 8 fois : vertes.
  **Mutations : 11/11 rouges sur une assertion** (confirmation après l'acquittement retirée ; trou non tracé ;
  démarrage sans réconciliation ; jeu de répliques non jugé ; un membre de moins accepté ; route de recette permise en
  production ; route ouverte sans configuration ; copie retouchée ; saut MongoDB sans époque ; saut MongoDB sans
  trou ; ancre sans espace du service). **Mutant équivalent écarté** : l'ancre MongoDB qui rend l'état d'après au lieu
  de l'état d'avant ne change rien en transaction (`$max` garde la plus haute réservation, l'état d'après contient le
  recul) ; il ne diffère que hors transaction, chemin que `ventes` n'emploie pas.
- **La course mesurée** (D-1052-13) : le premier passage de l'intégration a rougi une fois sur trois (« trou 2 → 5 »
  sans restauration) ; un diagnostic instrumenté a montré des transactions condamnées qui tiraient toutes le n° 1 sur
  une série à créer. Corrigé dans la bibliothèque avant toute PR ; rejoué vert depuis.
- **Pile `grp-d` réelle, profil hébergé** (`docker compose -p grp-d -f docker-compose.yml -f
  docker-compose.heberge.yml --profile commande up --build`, plus une surcouche de preuve hors dépôt : émetteur RS256
  de recette, `NODE_ENV=staging`, `SERIES_EMISSIONS_DE_RECETTE=actif`, `LOG_PRETTY=false` ; droit `commande` publié
  sur `entitlement.changed`). MongoDB du service en **jeu de répliques à trois membres porteurs** (`rs0` : un
  primaire, deux secondaires), ancre dans un **autre jeu** (`mongo-ancre`, `rsa`). Au démarrage : « Jeu de répliques
  rs0 : 3 membre(s) porteur(s) (3 exigé(s)) ».
  - `GET /api/v1/commande/series` : 200 au `TENANT_ADMIN` (`ancree: true`, série vierge), 403 au `TENANT_USER`.
  - **20 émissions parallèles** (chacune sa transaction et son témoin) : 1 → 20, époque 1.
  - **`mongodump`** de `ventes_service` ; **15 émissions** : 21 → 35.
  - **`mongorestore --drop`, service en marche** : la base revient à `dernier 20`, 20 témoins ; l'ancre, hors de la
    base, garde `reserve 35, confirme 35`. **5 émissions** : **36 → 40, époque 2**, l'émission déclare le trou
    **21 → 35** (tous émis et confirmés) ; journal `SERIE_DERIVE … (EMISSION)`, niveau erreur.
  - **`mongodump` (2)**, 5 émissions : 41 → 45 ; **service arrêté, `mongorestore --drop`, service redémarré** : avant
    d'écouter, `SERIE_DERIVE … (DEMARRAGE) ; trou déclaré 41 → 45 … époque 3` ; `GET` : `dernier 45, époque 3, trous
    [21 → 35 (époque 2), 41 → 45 (époque 3)]` ; **3 émissions : 46 → 48**.
  - Piste d'audit de `commande` : deux lignes `SYSTEME` (20 → 36, époque 2 ; 40 → 45, époque 3) ; témoins en base :
    28, tous distincts (1 → 20, 36 → 40, 46 → 48).
  - **Un membre sur trois arrêté** : 5 émissions, 49 → 53. **Deux membres arrêtés** (plus de majorité) : la demande
    échoue (500 au bout de 35 à 40 s), **aucun numéro rendu**, l'ancre reste à 53. **Membres relancés** : 54 → 56.
  - **Bilan : 56 numéros rendus, 56 distincts, aucun réémis** ; les 20 numéros que les restaurations ont fait
    disparaître de la base (21 → 35, 41 → 45) sont déclarés, jamais comblés.
  - **Rejoué à l'identique** sur des images reconstruites depuis `origin/dev` (e4a27c7, `build --no-cache`, code neuf
    vérifié dans `dist`), volumes neufs. `down -v` après chaque passage : aucun conteneur, volume ni réseau `grp-d`.
- `git diff --stat` = `--ignore-cr-at-eol` (plateforme 4 fichiers ; ventes 22) ; aucun `index.ts` non suivi.
- Annonce « ⚠ Contrats » fusionnée **avant** le code : prospera-stories **#632** (`main` 62a9adb).
- PR **prospera-plateforme#27**, `head.sha` f704f12 vérifié, fusionnée en rebase : **`dev` bb6d96c, c0021e1, 867d4c1,
  1fe8c5e** ; étiquette annotée **`series-v1.1`** sur 1fe8c5e (`series-v1` inchangée, e0cb763).
- PR **prospera-ventes-service#4**, `head.sha` 39587a6 vérifié, fusionnée en rebase : **`dev` 32d8b5f, 4782467,
  dbe3fa6, e4a27c7**.
- Verrou Docker du poste : libre (B l'avait rendu), pris à 09:40, rendu à 10:27.
