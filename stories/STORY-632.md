# STORY-632 : Recette croisée — un distributeur encaisse pour lui-même

Status: blocked

**Bloc :** Convergence E4 — les recettes croisées (`CONVERGENCE-RAILS-C-D-2026-09-08.md`, n° 12)
**Dépôt :** `prospera-recette` (`paquets/recette-croisee/recette/`) · **Points :** 5
**Services traversés :** `auth-service` · `kyc-service` · `platform-catalog-service` ·
`paiement-service` · `notification-service`
**Prérequis :** E0 complet ✅ (643 → 646) · STORY-241, 272, 274, 275 ✅ · STORY-648 ✅ ·
STORY-666 ✅ · **STORY-166/167 ⛔** (voir « Ce qui bloque »)
**Renumérotée** depuis 631.

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
