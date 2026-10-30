# STORY-631 : Recette croisée — un cabinet paie son abonnement

Status: blocked

**Bloc :** Convergence E4 — les recettes croisées (`CONVERGENCE-RAILS-C-D-2026-09-08.md`, n° 11)
**Dépôt :** `prospera-recette` (`paquets/recette-croisee/recette/`) · **Points :** 5
**Services traversés :** `auth-service` · `paiement-service` · `notification-service` ·
`platform-catalog-service` (+ `kyc-service`, levé par la pile)
**Prérequis :** E0 complet ✅ (643 → 646) · STORY-610 ✅ · STORY-644 ✅ · STORY-663 ✅ ·
**STORY-166/167 ⛔** · **STORY-279 ⛔** · **STORY-609 ⛔** · **appel de la cloche côté paiement ⛔**
(voir « Ce qui bloque »)
**Renumérotée** depuis 630 (STORY-630 a été prise le 2026-09-07 par l'outillage e2e de
`bilan-service`).

---

## Le récit

En tant que **direction de Money Vibes**, je veux voir un cabinet payer son abonnement de bout en
bout, sur la vraie pile, afin de savoir que la facturation récurrente **ouvre réellement** le droit
d'usage sans qu'un humain n'intervienne.

⚡ **C'est la recette du cas « Money Vibes encaisse pour elle-même ».** Money Vibes est une
organisation comme une autre (STORY-289) : elle a son compte d'encaissement, et ce qu'elle facture
au cabinet est une créance **à son bénéfice**. La recette suivante (STORY-632) emprunte le même code
avec une autre configuration ; la dernière (STORY-649) fait tourner les deux flux ensemble.

## Le scénario, dans l'ordre

1. Un utilisateur s'inscrit ; il reçoit le courriel de vérification et vérifie son adresse.
2. Money Vibes engage un abonnement pour le cabinet : périodicité, montant, échéance.
3. L'échéance devient une créance ; une demande est émise, un lien est créé.
4. Le lien arrive au cabinet par courriel.
5. Le cabinet paie sur la page publique ; la notification signée du fournisseur crée l'encaissement.
6. Le droit d'usage s'ouvre ; une cloche annonce l'échéance suivante.

## Critères d'acceptation

- [ ] AC-1 — Un utilisateur s'inscrit ; le courriel de vérification part **par
      `notification-service`**, et le lien reçu vérifie l'adresse.
      ✅ **Déjà prouvé par STORY-590** (gate Docker du 2026-10-29, 38 verdicts contre Mailhog). La
      recette le **rejoue** comme première marche du scénario, sans le re-démontrer à part.
      ⚠️ **Formulation corrigée.** Le plan disait « sous la marque de son organisation ». Ce n'est
      ni ce que fait le code ni ce qu'il peut faire : à l'inscription l'organisation n'existe pas
      encore, et les messages de compte partent sous `ORGANISATION_PLATEFORME_ID`, identité
      `PLATEFORME` (constat de 590). La recette assère **cette** identité.
- [ ] AC-2 — Money Vibes engage un abonnement pour le cabinet (`POST /api/v1/abonnements`) :
      périodicité, montant, échéance. Le fait `paiement.abonnement.engage` est publié.
- [ ] AC-3 — L'échéance **est une créance** (`POST /abonnements/:id/echeances`, STORY-663) : une
      demande est émise et un lien est créé, au payeur posé par `PUT
      /abonnements/:id/adresse-de-paiement`.
- [ ] AC-4 — Le lien **arrive** au cabinet par courriel, dans Mailhog, sous l'identité d'envoi de
      Money Vibes. ⚡ C'est l'assertion que le câblage de STORY-644 rend possible ; la recette de
      STORY-646 n'a prouvé que la route directe, avec un lien fabriqué.
- [ ] AC-5 — ⛔ Aucun jeton de lien n'a transité par le bus ni n'apparaît dans un journal.
      **Vérifié sur la trace**, pas sur le code : la recette relit les messages Kafka de la fenêtre
      (topics `paiement.*` et `notification.*`) et les `docker logs` des cinq services, et y cherche
      le jeton reçu dans Mailhog. Zéro occurrence hors du courriel.
- [ ] AC-6 — Le cabinet ouvre le lien sur la page publique (`/api/v1/public/liens/:jeton`) ; la
      **notification signée** du fournisseur, reçue sur `/api/v1/public/notifications/:fournisseur/:compteId`,
      crée l'encaissement. La signature est calculée par la recette avec le secret qu'elle a
      elle-même déclaré, par l'API, avec le compte d'encaissement de Money Vibes (la clef qui ouvre
      la signature est celle du **compte**) : une configuration, jamais un état écrit en base
      (STORY-646, AC-3).
- [ ] AC-7 — Le droit d'usage du cabinet s'**ouvre** sans intervention manuelle, sur le seul fait
      `paiement.abonnement.echeance.encaissee`, et son échéance est **prolongée** à la période
      suivante, jamais recréée. La recette lit le droit par `platform-catalog-service`.
- [ ] AC-8 — Une **cloche** annonce l'échéance suivante dans l'application du cabinet : un message
      in-app, au fil de l'utilisateur, déposé par la porte commune des envois (STORY-612).
- [ ] AC-9 — ⛔ Le compte crédité est celui de **Money Vibes**. **Invariant inverse**, vérifié par un
      test : aucune créance dont le payeur est un client de Money Vibes (cas STORY-632) n'a pour
      bénéficiaire un compte que Money Vibes contrôle.

## ⛔ Ce qui bloque — vérifié dans le code le 2026-10-30

La fiche est écrite pour être **tirée telle quelle** le jour où ses prérequis sont livrés. Aucun
d'eux ne l'est. Vérification faite sur `origin/dev` de chaque dépôt, et sur `origin/main` du tracker.

| # | Blocage | Constat | AC touchés | Story qui lève |
|---|---|---|---|---|
| 1 | **Aucun jeton réel ne porte `paiement:*`** | Le catalogue d'`auth-service` (`common/rbac/permission.enum.ts`) compte 13 codes, aucun `paiement:*`. `perms` dérive du seul `platformRole`, et une membership de tenant donne `perms: []`. Les routes d'abonnement exigent `paiement:demande:emettre` ; la déclaration du compte et du fournisseur exige `paiement:compte:administrer` et `paiement:fournisseur:administrer`. **Toutes rendent `403` dans la pile de recette, à tout le monde.** | 2, 3, 6, 9 | **STORY-166** (catalogue de permissions tenant), **STORY-167** — `not_started`, sans branche |
| 2 | **Le catalogue ne consomme aucun fait d'abonnement** | Dans `platform-catalog-service`, aucun consommateur Kafka : `abonnement` n'apparaît que dans un commentaire du schéma d'entitlement. | 7 | **STORY-279** — `not_started`, **sans fiche** |
| 3 | **Un droit d'usage n'a pas d'échéance** | Le schéma d'entitlement ne porte ni échéance ni date de fin : « prolongée, pas recréée » n'est pas exprimable. | 7 | **STORY-609** — `todo` (fiche écrite, prérequis 279) |
| 4 | **`paiement-service` ne dépose rien dans la cloche** | Les quatre modèles in-app d'abonnement existent depuis STORY-612, mais `EnvoiSortant` n'accepte que `'email' \| 'sms'`, et `EVENEMENTS_DECLENCHEURS` de la notification ne contient aucun topic `paiement.*` (choix assumé par 612 : le déclenchement est un appel direct). 612 lègue le point en clair : « `paiement-service` n'appelle encore rien ». | 8 | **aucune** — la story côté paiement n'existe pas. ⚠️ Son identifiant est à réserver par le PO (elle doit aussi ordonner le préavis avant la suspension, AC-5 de 612). |

⚡ **AC-1, AC-4 et AC-5 ne dépendent d'aucun blocage**, mais AC-4 et AC-5 exigent un vrai lien, donc
une vraie demande, donc AC-2 et AC-3. Seul AC-1 se joue aujourd'hui, et 590 l'a déjà joué.

⛔ **La voie écartée : un IdP de recette.** Le gate du 2026-10-24 a éprouvé les rails E et F avec un
IdP local (`jose`, `:3999`) qui signait des jetons portant les droits. Repointer `AUTH_JWKS_URI` dans
la surcouche de recette rendrait 631 jouable sans attendre 166/167. **Écartée par l'arbitrage du
2026-10-30**, qui a préféré écrire les fiches et attendre les prérequis : une recette croisée qui
prouve un chemin d'autorisation que la vraie pile ne sait pas produire ferait passer pour démontré
le seul maillon qui manque.

## Ce que la recette devra savoir faire, et que le dépôt n'a pas encore

- **Lire le bus.** `prospera-recette` ne lit que Mailhog et les conteneurs. AC-5 exige de relire les
  messages d'une fenêtre (un consommateur jetable, groupe propre à la recette, jamais un groupe d'un
  service : il volerait leurs messages).
- **Signer comme le fournisseur.** AC-6 exige la signature du webhook ; elle se calcule dans la
  recette avec le secret qu'elle a déclaré par l'API, jamais lu en base.
- **Créer un second utilisateur, côté cabinet.** L'amorçage ne connaît que l'administrateur de Money
  Vibes. Le cabinet s'inscrit par la vraie route (AC-1), son lien de vérification se lit dans Mailhog
  (même mécanique que le code 2 de l'amorçage).

## Ce qui NE fait PAS partie de cette story

- Le distributeur qui encaisse pour lui-même : **STORY-632**.
- La facturation de la consommation, les deux flux ensemble : **STORY-649**.
- L'impayé, la grâce, la suspension et le rétablissement : leurs stories propres (rail C) ; la
  recette ne joue que le chemin heureux.
- Agir **pour** une organisation depuis la console : **STORY-650/651**.

## Notes

- Voir [[STORY-590]] (AC-1 prouvé), [[STORY-610]], [[STORY-644]], [[STORY-646]] (le dépôt de
  recette), [[STORY-663]] (l'échéance émet sa demande), [[STORY-612]] (la cloche), [[STORY-289]]
  (Money Vibes est une organisation), [[STORY-166]], [[STORY-167]], [[STORY-279]], [[STORY-609]],
  [[STORY-632]], [[STORY-649]].
