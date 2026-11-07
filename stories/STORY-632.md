# STORY-632 : Recette croisée — un distributeur encaisse pour lui-même

Status: review

**Bloc :** Convergence E4 — les recettes croisées (`CONVERGENCE-RAILS-C-D-2026-09-08.md`, n° 12)
**Dépôt :** `prospera-recette` (`paquets/recette-croisee/recette/`) · **Points :** 5
**Services traversés :** `auth-service` · `kyc-service` · `platform-catalog-service` ·
`paiement-service` · `notification-service`
**Prérequis :** E0 complet ✅ (643 → 646) · STORY-241, 272, 274, 275 ✅ · STORY-648 ✅ ·
STORY-666 ✅ · STORY-166/167/171 ✅ (fusionnées sur `dev` le 2026-11-07)
**Renumérotée** depuis 631.
**Branches `MNV-632` (toutes basées sur `origin/dev`) :**

| Dépôt | Commits | Objet |
|---|---|---|
| `prospera-recette` | `7175bb3`, `3a4ef64` | la recette, ses outils, l'alignement de la pile |
| `prospera-paiement-service` | `94126eb` | le compte d'autrui introuvable au dépôt de clef : 404, plus 422 |
| `auth-service` | `50d1040` | les 2 droits au catalogue PLATEFORME + la route qui les donne à un membre de Money Vibes |
| `kyc-service` | `9de4d23` | copie du catalogue, à l'octet près |
| `platform-catalog-service` | `713a4ba` | copie du catalogue, à l'octet près |
| `admin-panel` | `a028c26` | copie du catalogue, à l'octet près (son `@IsEnum` refuserait sinon un rôle en 400) |

---

## ✅ Livraison du 2026-11-07 — verdicts

Gate sur la vraie pile, images construites depuis les branches `MNV-632` (worktrees, surcouche
`RECETTE_SURCOUCHES`). **`npm run recette` : 16/16 sur des volumes NEUFS** (`COMPOSE_PROJECT_NAME`
distinct, `down -v` avant — aucune organisation, aucun marché, aucun administrateur au départ) **et
16/16 sur la pile partagée** (volumes conservés). Recette : 80 unitaires, `verifier` propre. Auth :
1 213 unitaires, 92 e2e touchés. Copies du catalogue : tests et typage verts dans les 3 dépôts.

| AC | Verdict | Ce qui le prouve |
|---|---|---|
| Étape 0 | ✅ | Deux organisations accueillies par les vraies routes ; chaque jeton porte `org` = SON organisation et des droits de tenant à trois segments, aucun droit de plateforme. |
| AC-1 | ✅ | `PUT /raccordements/API_BUSINESS` et `POST /comptes-encaissement` (titulaire = A, `secretNotification` posé) avec le jeton de `DIST_ADMIN` de A ; ni le secret client, ni la clé d'API, ni la clef de notification ne reviennent dans une réponse. |
| AC-2 | ✅ | Passerelle e-mail de A sur **son propre relais** (aucun contrôle de domaine, STORY-615). Liste **fermée** : TOUS les courriels reçus par le payeur de A (lien, reçu, avis d'annulation) portent l'expéditeur de A, et lui seul ; l'envoi de référence de Money Vibes (route directe) porte un autre expéditeur ; il n'apparaît pas au journal de A, qui ne contient pas l'identifiant de Money Vibes. |
| AC-3 | ✅ | Un **opérateur de Money Vibes** (rôle plateforme donné par la console) **ouvre lui-même** le marché `API_BUSINESS` → `TG` ; contre-preuves : le membre d'un distributeur ne reçoit pas de rôle plateforme (`422 PLATFORM_ROLE_HORS_PLATEFORME`), l'opérateur sans organisation est arrêté à la porte. Puis créance, demande de 100 000 sur 150 000, lien sous l'expéditeur de A, notification `PAIEMENT_RECU` signée HMAC avec le secret d'AC-1 ⇒ `204` (signée d'un autre secret : refusée), solde `confirme 100 000 / restant 50 000`. |
| AC-4 | ✅ | Le caissier **détient** `valider` (rôle composé) : sa validation de sa propre déclaration rend `409 SEPARATION_POUVOIRS_VIOLEE` — c'est l'**acte** qui borne. Le premier DAF valide ; +50 000 confirmés ; le reçu part sous l'expéditeur de A. |
| AC-5 | ✅ | Le déclarant puis le validant (qui détiennent tous deux `annulation:enregistrer`) : `409 SEPARATION_POUVOIRS_VIOLEE` ; le second DAF annule (`montantContrePasseMineur` 50 000, `annulePar` = lui) ; le restant remonte de 50 000 ; l'avis d'annulation arrive au payeur sous l'expéditeur de A. |
| AC-6 | ✅ | Liste fermée : **tout** identifiant à 24 hexadécimaux de la chaîne (raccordement, compte, créance, routage, barème, demande, encaissements, annulation, passerelle), **enchâssés compris** (`<org>\|SAISIE_MANUELLE\|<réf>`, `DEC\|<org>\|<clé>`), appartient à A : `etrangers(vus, connus)` = `[]`. |
| AC-7 | ✅ | Une sonde de B qui **détient** tous les droits concernés : 9 lectures et écritures sur les ressources de A ⇒ **404** chacune (après correctif) ; ses listes ne contiennent rien de A. |

## Ce que la recette a trouvé — et ce que la story a corrigé

1. ⛔⛔ **Aucun jeton réel ne pouvait ouvrir un marché fournisseur — donc aucune demande ne
   s'émettait, pour personne.** Trois maillons manquaient, les trois sont posés :
   - **le catalogue** : `paiement:fournisseur:administrer` (STORY-289) et
     `paiement:exploitation:consulter` (STORY-286) n'étaient au catalogue de PERSONNE — STORY-166
     les a laissés, à raison, hors du catalogue de tenant. Ils entrent au catalogue PLATEFORME
     (15 codes, 4 copies à l'octet près) ; `PLATFORM_ADMIN` les reçoit au réalignement du boot ;
   - **le porteur** (arbitrage PO du 2026-11-07 : « rôle plateforme sur un membre de Money
     Vibes ») : le registre est une surface de l'organisation `plateforme`, dont seul un membre
     passe la porte ; un rôle plateforme ne vivait que sur des opérateurs sans organisation.
     Nouvelle route `PUT|DELETE /admin/organizations/:id/members/:userId/platform-role`
     (`user:invite`), refusée pour tout vertical autre que `plateforme`, anti-escalade,
     anti-verrouillage, journalisée (`MEMBER_PLATFORM_ROLE_ASSIGNED`) ;
   - **la porte** : le compose défaut `ORGANISATION_PLATEFORME` à une organisation factice
     (`507f1f77…`) — la porte n'était ouverte à personne. La recette l'aligne après l'amorçage
     (relance d'un service, aucun état en base). ⚠️ À poser dans le `.env` racine des postes.
2. ⛔ **`paiement-service` — le dépôt de clef sur le compte d'autrui rendait `422`**
   (`COMPTE_ENCAISSEMENT_INTROUVABLE`, nature `REGLE_METIER`) là où toutes les autres routes du
   compte rendent `404`. Pas de fuite, mais AD-16 n'était pas tenu. **Corrigé** : `refusHorsOrganisation()`.
3. ⚠️ **L'ordre des gestes** : une organisation ne peut pas router vers un marché fermé
   (`422 ROUTAGE_MARCHE_FERME`, vu seulement sur volumes neufs) — la plateforme ouvre d'abord.
4. ⚠️ **`prospera-recette`** : double décodage quoted-printable (un jeton sur ~60 mangé) ; amorçage
   non rejouable sur volumes conservés (l'IdP est désormais interrogé) ; sur volumes neufs,
   l'administrateur plateforme n'existe pas (`seed:admin` joué sur `401`) ; les vues du paiement
   n'exposent aucune clé d'organisation (AC-6 porte sur la forme des identifiants).
5. ⚠️ **Pile partagée** : le marché `API_BUSINESS` → `TG` y a été ouvert le 2026-09-15 sous
   l'organisation factice ; sa chaîne d'audit lui appartient, une écriture de Money Vibes y est
   refusée (`422 CHAINE_AUDIT_ORGANISATION`, à raison). La recette **lit** le registre avant
   d'écrire et n'y écrit que si le marché est fermé.

➡️ **STORY-631 et STORY-649 ne sont plus bloquées par ce droit.** Restent à la console : l'écran
d'attribution du rôle plateforme (AP-) et, si besoin, un rôle plateforme « opérateur paiement » du
socle (la recette le compose comme une donnée, `OPERATEUR_PAIEMENT_RECETTE`).

---

## (historique) La fiche telle qu'écrite le 2026-10-30

---

## Le récit

En tant que **direction de Money Vibes**, je veux voir un distributeur encaisser **son** argent sur
**son** compte, avec **ses** clés et **sa** passerelle, sans que rien de Money Vibes n'apparaisse
dans la chaîne, afin de savoir que `NFR-1` (« Prospera ne détient jamais les fonds ») tient sur la
vraie pile et pas seulement dans les tests d'un service.

⚡ **C'est la recette qui matérialise NFR-1.** Elle emprunte le même code que STORY-631 ; seule la
configuration change. Si une ligne de code distinguait les deux cas, cette recette serait le seul
endroit où on le verrait.

## ⚡ Le prérequis « 631 » se relâche

Le plan chaînait 632 derrière 631 pour une seule raison : AC-2 compare l'expéditeur du distributeur
à « l'envoi de Money Vibes du scénario précédent ». Cet envoi de référence, la recette le **produit
elle-même** par la route directe, comme la recette de STORY-646 l'a déjà fait. 632 n'a donc besoin
ni de 279, ni de 609, ni de la cloche : **c'est la première recette croisée qui se débloquera**, dès
que STORY-166/167 seront livrées.

## Le scénario, dans l'ordre

0. **Accueil par la plateforme** (droits que l'IdP sait déjà porter) : l'organisation du
   distributeur s'inscrit, son dossier KYC est approuvé (`kyc:approve`), et les droits d'usage des
   modules paiement et notification lui sont octroyés (`entitlement:grant`) — les étapes 3 et 4 de
   l'amorçage de STORY-613, rejouées pour une autre organisation.
1. Le distributeur se raccorde à son fournisseur et déclare son compte d'encaissement.
2. Il arme sa passerelle d'envoi.
3. Il matérialise une créance, émet une demande, le payeur paie par lien.
4. Il encaisse un second règlement en espèces, déclaré par une personne et validé par une autre.
5. Un encaissement est annulé par contre-passation ; l'avis d'annulation part.
6. Un second distributeur ne voit rien du premier.

## Critères d'acceptation

- [ ] AC-1 — Le distributeur enregistre **ses propres** identifiants de fournisseur
      (`PUT /api/v1/raccordements/:fournisseur`, STORY-666) et **son propre** compte d'encaissement
      (`POST /api/v1/comptes-encaissement`, titulaire = le distributeur, `secretNotification` posé),
      **par la surface de l'organisation** : jeton d'un membre du distributeur, jamais un jeton de
      plateforme. ⛔ Aucune route d'administration n'est appelée (elles n'existent pas encore —
      STORY-650 — et ne doivent pas servir ici).
- [ ] AC-2 — Il arme **sa propre** passerelle (`PUT /api/v1/passerelles/:canal`,
      `notification-service`) ; le lien de paiement qu'il émet part sous **son** expéditeur. Preuve
      par **comparaison**, dans Mailhog : l'envoi de référence de Money Vibes (route directe) et
      celui du distributeur n'ont ni le même expéditeur, ni la même organisation au journal des
      envois.
- [ ] AC-3 — Il matérialise une créance (`POST /api/v1/creances`), émet une demande, et le payeur
      règle **une partie** par lien : la notification signée du fournisseur, reçue sur
      `/api/v1/public/notifications/:fournisseur/:compteId` et signée par la recette avec le secret
      qu'elle a déclaré en AC-1, crée l'encaissement. Le solde se **décompose** (STORY-272,
      `GET /creances/:id/restants`) : réglé par lien, reste dû.
- [ ] AC-4 — Il encaisse le reste **en espèces déclarées** (`POST /creances/:id/encaissements`,
      méthode `ESPECES`) ; la validation (`POST …/encaissements/:id/validation`) est faite par une
      **seconde personne**. ⛔ La recette prouve aussi l'envers : la personne qui a déclaré ne peut
      pas valider — refus `SEPARATION_POUVOIRS_VIOLEE` (STORY-241, contrôle porté par l'**acte**, pas
      par le rôle).
- [ ] AC-5 — L'encaissement en espèces est **annulé par contre-passation** (`POST
      …/encaissements/:id/annulation`, STORY-274). ⛔ STORY-275 : celui qui a **déclaré ou validé**
      ce versement ne l'annule pas, quels que soient ses droits — la recette prouve les **deux**
      refus, puis fait annuler par une **troisième** personne. Le solde de la créance remonte du
      montant annulé ; l'**avis d'annulation** arrive au payeur dans Mailhog (STORY-648), sous
      l'expéditeur du distributeur.
- [ ] AC-6 — ⛔ L'argent atterrit sur le compte **du distributeur**. Un test parcourt la chaîne —
      raccordement, compte, créance, demande, encaissements, annulation, envois — et vérifie
      qu'**aucun** identifiant de compte, de raccordement ou d'organisation de Money Vibes n'y
      apparaît. ⚡ Liste **fermée** : la recette compare l'ensemble des identifiants rencontrés à
      ceux du distributeur (`toEqual`), jamais par absence d'une valeur attendue — une liste ouverte
      ne rougit pas, elle accueille.
- [ ] AC-7 — Un **second distributeur**, accueilli de la même façon, ne voit **rien** du premier :
      ni compte, ni raccordement, ni passerelle, ni créance, ni encaissement, ni annulation. Chaque
      lecture et chaque écriture sur une ressource du premier rend **`404`**, jamais `403`
      (anti-énumération).

## ⛔ Ce qui bloque — vérifié dans le code le 2026-10-30

| # | Blocage | Constat | AC touchés | Story qui lève |
|---|---|---|---|---|
| 1 | **Aucun jeton réel ne porte `paiement:*`** | Catalogue d'`auth-service` : 13 codes, aucun `paiement:*` ; une membership de tenant donne `perms: []`. Les routes exigent `paiement:compte:administrer` (raccordement, compte), `paiement:demande:emettre` (créance, demande), `paiement:encaissement:declarer`, `paiement:encaissement:valider`, `paiement:annulation:enregistrer`. Toutes rendent `403`. | 1, 3, 4, 5, 6, 7 | **STORY-166**, **STORY-167** — `not_started`, sans branche |
| 2 | **Aucun jeton réel ne porte `notification:*`** | `PUT /passerelles/:canal` exige `notification:canal:administrer`, inventaire local de `notification-service` (STORY-572), absent du catalogue de l'IdP. Constat déjà fait en conditions réelles le 2026-09-08 : un vrai `TENANT_ADMIN` reçoit `403 PERMISSION_DENIED`. | 2 | **STORY-166/167** (même cause) |
| 3 | **La séparation des pouvoirs exige trois personnes habilitées** | Trois membres du distributeur : un déclarant, un validant, un troisième qui annule — donc des droits attribuables à des personnes distinctes. Sans rôles de tenant, aucun n'existe. | 4, 5 | **STORY-166** (socle de rôles), **STORY-167** si la répartition diffère par organisation |

✅ **Ce que la vraie pile sait déjà faire** : l'étape 0 (KYC et droit d'usage) se joue avec les
droits de plateforme que l'IdP émet (`kyc:approve`, `entitlement:grant`) ; l'amorçage de STORY-613
le fait déjà pour Money Vibes.

⚠️ **« Distributeur » n'est pas une donnée.** `Organization.vertical` n'existe pas (STORY-171,
`not_started`). La recette accueille une organisation ordinaire et l'appelle distributeur. C'est
sans conséquence ici — NFR-1 ne dépend pas du type de client, et c'est précisément ce que la recette
doit montrer — mais elle ne prouve rien sur le filtrage des rôles par vertical (STORY-166, AC 10).

⛔ **La voie écartée : un IdP de recette** (`jose`, `:3999`), pour la même raison qu'en STORY-631 —
arbitrage du 2026-10-30 : elle ferait passer pour démontré le seul maillon qui manque.

## Ce que la recette devra savoir faire, et que le dépôt n'a pas encore

- **Accueillir une organisation de plus** : rejouer l'inscription (lien lu dans Mailhog), le KYC et
  l'octroi des droits d'usage pour une organisation qui n'est pas Money Vibes. L'amorçage de
  STORY-613 est écrit pour une seule organisation ; la recette appelle les mêmes routes, sans
  modifier l'amorçage.
- **Inviter deux membres de plus** dans l'organisation (le validateur, puis celui qui annule) et
  leur faire attribuer leurs rôles — c'est le geste que 166 rend possible.
- **Signer comme le fournisseur**, comme en STORY-631 (AC-6) : même outil, à écrire une fois.

## Ce qui NE fait PAS partie de cette story

- Money Vibes qui encaisse ses abonnements : **STORY-631**.
- Les deux flux ensemble, et la facturation de la consommation : **STORY-649**.
- Agir **pour** le distributeur depuis la console : **STORY-650/651**. Ici, le distributeur fait
  tout lui-même — c'est l'objet de la recette.
- Le rapprochement bancaire et la publication comptable (STORY-270, 273) : la recette s'arrête au
  solde de la créance.

## Notes

- Voir [[STORY-631]], [[STORY-649]], [[STORY-646]], [[STORY-613]] (l'amorçage), [[STORY-666]]
  (raccordement), [[STORY-241]] (séparation par l'acte), [[STORY-272]], [[STORY-274]],
  [[STORY-275]], [[STORY-648]] (l'avis d'annulation), [[STORY-572]] (droits de notification),
  [[STORY-166]], [[STORY-167]], [[STORY-171]], [[STORY-650]].
