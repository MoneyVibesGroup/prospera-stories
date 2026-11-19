# STORY-978 : le catalogue demande un jeton du moteur par organisation

Status: done

**Complexité :** moyenne (un fournisseur neuf et son module dans le catalogue, trois appelants qui changent de jeton,
une variable retirée et une neuve ; aucune route, aucun topic, aucune collection ; auth inchangé)

**Épic :** EPIC-145 (le moteur : installation, C13), EPIC-147 (l'essai prospect)
**Dépôts :** `MoneyVibesGroup/prospera-platform-catalog-service` seul. `prospera-auth-service` : **non touché** (la
route `POST /api/v1/interne/jetons-de-service` de STORY-948 sert telle quelle, relue sur `origin/dev`).
**Plage :** groupe B, 930 → 979. **Hors des lignes du plan** : c'est le préalable D-975-11 de STORY-1080 (journal de B,
« ⚠ Pour 1080 (D-975-11) »), sorti de 1080 par la session du groupe B (D-978-1).
**Plan :** `coordination/PLAN-4-SESSIONS-LOT-4-2026-11-18.md` §3 (B), avant la ligne 10 (1080). **Docker : non**
(décision de la session du groupe B).
**Livraison :** catalogue #63 (`dev` **`f9e9e26`**) ; contrat annoncé avant la fusion (stories #725), sans écart.
**Suivante :** STORY-1080 (le cabinet installé par le moteur, clôture ; recette croisée complète).

**Sources lues :** plan du lot 4 (§0, §1, §3, §7, §8) ; `REGLES-DES-GROUPES.md` ; journal de B (état du lot 4, D-975-11,
« Pour 1080 » de 1082, pièges) ; journaux de A, C, D (aucune demande neuve à B qui passe avant) ; fiches STORY-948 (la
route des jetons de service : 300 s, `organisationId` connue, secret de l'identité), 972 (l'essai et ses adresses),
974 (le catalogue appelle déjà auth sous `MOTEUR_JETON_SERVICE`, D-974-11), 975 (D-975-11), 1082 (D-1082-11 : jeton
de l'organisation obtenu à la main ; balance relaie le jeton du moteur à `dossier-service`). Code relu sur
`origin/dev` : catalogue **`a5a2676`** (`VerificationsParHttp`, `AppelsC13ParHttp`, `LecteurDeLaRepriseParHttp`,
`InvitationsDAuthParHttp`, `RouteInterneDAuthParHttp`, `configuration.ts`, `env.validation.ts`, exécuteur de plans,
import du jeu), auth **`96f8ab3`** (`JetonsDeServiceController`, `JetonsDeServiceService`, `IdentiteDeServiceGuard`) ;
`prospera-recette` `a1d68d7` (`docker-compose.recette.yml` : le catalogue n'y reçoit ni l'adresse d'auth ni le secret
du moteur).

**Ce qui existait déjà (relu avant la fiche) :**
- Trois appelants du moteur présentent le même jeton STATIQUE, `INSTALLATION_JETON_SERVICE` (STORY-944) : les
  vérifications d'installation (`VerificationsParHttp`), l'import et l'effacement C13 de l'essai (`AppelsC13ParHttp`)
  et la vérification `donnees-importees` de la Reprise à la mise en service (`LecteurDeLaRepriseParHttp`). Aucun
  autre appel du catalogue à un module (la naissance et l'invitation parlent à auth sous le secret, pas sous un jeton).
- Auth émet le jeton : `POST /api/v1/interne/jetons-de-service`, `Bearer <MOTEUR_JETON_SERVICE>`, corps
  `{ organisationId }` ⇒ 200 `{ jeton, identite, organisationId, expireDans }` (300 s par défaut) ; 404
  `ORGANISATION_INCONNUE` ; 401 `IDENTITE_DE_SERVICE_REQUISE`. Rien à changer.
- Le catalogue connaît déjà l'adresse d'auth et le secret du moteur : `NAISSANCE_AUTH_URL`, `MOTEUR_JETON_SERVICE`,
  `NAISSANCE_DELAI_MS` (naissance 948, invitations 974).
- Une vérification `NON_EXECUTEE` arrête le plan `EN_ATTENTE` (« Réessayer ») ; seule `SERVICE_NON_CONFIGURE` d'un plan
  du `PUT` de la console est différée (STORY-945). L'import du jeu s'arrête à la première part en échec, sans reprise
  dans l'appel ; l'effacement de l'essai se rejoue par sa file BullMQ (10 essais, bornée).

---

## Ce qui doit être vrai à la fin

| # | Exigence | Preuve |
|:--:|---|---|
| AC-1 | Pour chaque appel du moteur à un module (vérification d'installation, import et effacement C13, vérification de la Reprise), le catalogue présente le jeton de l'identité `MOTEUR` **pour l'organisation de l'appel**, obtenu d'auth (`POST /api/v1/interne/jetons-de-service`, sous `MOTEUR_JETON_SERVICE`) | unitaires ; e2e (auth doublée) |
| AC-2 | Deux organisations ⇒ deux jetons, chacun présenté à SA route ; jamais le jeton d'une organisation pour une autre : la réponse d'auth et la claim `organisationId` du jeton doivent nommer l'organisation demandée, sinon rien n'est gardé ni présenté | unitaires ; e2e |
| AC-3 | Le jeton est gardé par organisation et renouvelé AVANT son expiration (vie − `JETON_DU_MOTEUR_MARGE_S`, 60 s par défaut) ; des demandes simultanées pour une organisation partagent un appel ; un jeton refusé par un module (401) est oublié | unitaires ; e2e |
| AC-4 | Auth en panne (non configurée, injoignable, trop lente, 404, 401, 5xx, réponse hors contrat) ⇒ un **résultat nommé** : vérification `NON_EXECUTEE` / C13 `ok: false`, raison `JETON_DU_MOTEUR_INDISPONIBLE`, cause dans `detail` ; Reprise `executee: false` ; jamais une exception ni un 500 ; **un seul** appel à auth par tentative, aucun échec gardé, le module n'est pas appelé | unitaires ; e2e |
| AC-5 | `INSTALLATION_JETON_SERVICE` est retirée : plus lue, et refusée au démarrage si elle est posée (message qui nomme la remplaçante) | unitaires (validation, configuration) ; e2e |
| AC-6 | La variable neuve est documentée et validée (`.env.example`, `.env.essai.example`, `env.validation.ts`) ; la raison neuve est au contrat de l'essai (`essai-prospect.openapi.json`, description de `raison`) et annoncée dans « ⚠ Contrats » avant la fusion | spec ; journal |
| AC-7 | Tests relancés par chemin, lint des fichiers touchés, `tsc`, build, mutations rouges sur une assertion ; câblage du module racine vert (module Nest neuf ; binding de Confluent doublé sous Node 25) | « Preuves » |

## Décisions (recommandations appliquées, contestables)

- **D-978-1 — Le correctif sort de STORY-1080, en story à part, numéro 978** (décision de la session du groupe B, le
  2026-11-19). 978 est libre dans la plage de B (`STORY-930 → STORY-979`) : vérifié au rituel sur toutes les branches
  de `prospera-stories` (aucune fiche, aucune entrée au tracker) et sur les branches distantes du catalogue et d'auth.
  Sans Docker, sa preuve de bout en bout (vrai auth, vrais modules, deux organisations installées par
  `POST /installations`) se fait **dans la recette croisée complète de STORY-1080** : point ouvert pour 1080.
- **D-978-2 — Un fournisseur unique, `JetonsDuMoteur`, dans un module neuf importé par l'installation, l'essai et la
  mise en service** (`src/jetons-du-moteur/`). Une seule instance, donc un seul cache, pour les trois appelants. Il
  réutilise ce qui existe (patron de 974) : l'adresse d'auth, le secret et le délai de la naissance
  (`NAISSANCE_AUTH_URL`, `MOTEUR_JETON_SERVICE`, `NAISSANCE_DELAI_MS`). Aucun secret neuf, aucune route d'auth neuve.
- **D-978-3 — Gardé par organisation, renouvelé avant son terme.** Un jeton est gardé jusqu'à `envoi de la demande +
  expireDans − marge` (marge `JETON_DU_MOTEUR_MARGE_S`, 60 s par défaut, 1 → 3 600) : 300 s de vie ⇒ neuf à 240 s.
  Compter depuis l'envoi (et non la réponse) laisse au jeton relayé par balance à `dossier-service` (D-1082-1) au moins
  la marge. Un jeton qui vit moins que la marge sert à l'appel en cours sans être gardé (pas de boucle). Les demandes
  simultanées pour une organisation partagent un appel ; les entrées échues sont purgées à chaque jeton gardé.
- **D-978-4 — Le temps du processus, pas l'heure de référence.** La vie du jeton est comptée par auth en temps réel ;
  l'heure de référence peut être avancée en recette (`RECETTE_HORLOGE_AVANCE_JOURS`). Le cache est un minuteur
  technique, comme le bail d'un plan : aucune décision d'état n'en dépend (règle « Horloge » du groupe B tenue).
- **D-978-5 — Jamais le jeton d'une autre organisation.** La clé du cache est l'organisation de l'appel. La réponse
  d'auth est lue au contrat de 948 : `jeton` non vide, `identite: 'MOTEUR'`, `organisationId` = celle demandée,
  `expireDans` entier > 0 ; et la claim `organisationId` du jeton lui-même (charge utile décodée, non vérifiée : le
  catalogue n'en est pas la cible, le module la vérifie) doit être celle demandée. Sinon `REPONSE_HORS_CONTRAT`, rien
  de gardé ni de présenté.
- **D-978-6 — Une panne d'auth est un résultat nommé, sans boucle.** Raison neuve `JETON_DU_MOTEUR_INDISPONIBLE`, cause
  en `detail` : `NON_CONFIGURE`, `AUTH_INJOIGNABLE`, `DELAI_DEPASSE`, `ORGANISATION_INCONNUE`, `HTTP_<n>`,
  `REPONSE_HORS_CONTRAT`. Un seul appel à auth par tentative, aucune nouvelle tentative dans le fournisseur, aucun
  échec gardé : le rejeu reste celui de l'appelant (« Réessayer » d'un plan `EN_ATTENTE`, reprise de l'essai, file
  bornée de l'effacement). Le module n'est pas appelé sans jeton (il rendrait 401). L'adresse et la route du module sont
  lues AVANT de demander le jeton : un module sans adresse reste `SERVICE_NON_CONFIGURE`, donc différable par le `PUT`
  de la console (945) ; `JETON_DU_MOTEUR_INDISPONIBLE` ne l'est jamais (une panne d'auth n'est pas « un module qui ne
  sert pas encore ses routes »).
- **D-978-7 — Un 401 d'un module fait oublier le jeton gardé de cette organisation** (clé d'auth tournée, jeton
  révoqué) : la tentative en cours reste `STATUT_INATTENDU` (pas de nouvel essai immédiat), la suivante obtient un
  jeton neuf. Un 403 ne fait rien oublier (c'est un refus de droit, pas un jeton périmé).
- **D-978-8 — `INSTALLATION_JETON_SERVICE` est retirée, et refusée au démarrage si elle est posée.** La garder « en
  secours » remettrait l'erreur de D-975-11 en silence (le jeton d'une organisation présenté pour toutes, mort après
  300 s). L'ignorer en silence laisserait croire qu'elle sert. La validation refuse donc toute valeur non vide, avec un
  message qui nomme `NAISSANCE_AUTH_URL` et `MOTEUR_JETON_SERVICE`. Aucun compose versionné ne la pose (vérifié :
  `prospera-recette`, compose racine du poste, `.env*.example`) ; seul le piège D-975-11 du journal de B la citait (mis
  à jour).
- **D-978-9 — Une seule variable neuve, `JETON_DU_MOTEUR_MARGE_S`** (facultative, 60 par défaut, 1 → 3 600),
  documentée dans `.env.example` avec les trois variables qu'elle accompagne (jusqu'ici absentes de l'exemple) ;
  `.env.essai.example` ne cite plus le jeton statique.
- **D-978-10 — Contrat : un ajout.** `JETON_DU_MOTEUR_INDISPONIBLE` entre dans la liste des raisons d'une part non
  importée de l'essai (`essai-prospect.openapi.json`, description du champ `raison`, chaîne libre : aucun type ne
  change, version inchangée) et dans les raisons d'une vérification `NON_EXECUTEE` du plan d'installation (chaîne
  libre). Annoncé dans « ⚠ Contrats » avant la fusion du code.
- **D-978-11 — Pas de Docker** (décision de la session du groupe B). Un module Nest neuf : câblage prouvé par
  `app-cablage.invariant.spec.ts` (binding de Confluent doublé sous Node 25, comme à 974), qui rougit sans l'import du
  module neuf. Aucune dépendance, aucun Dockerfile ne change. Le démarrage réel est celui de 1080.

## Preuves

- **Node 25 (poste), tests relancés par chemin** :
  - `src/jetons-du-moteur/jetons-du-moteur.spec.ts` **31/31** (auth doublée par un vrai serveur HTTP : forme de la
    demande ; deux organisations ⇒ deux jetons, chacun le sien, gardés ; gardé jusqu'à 239,999 s, neuf à 240 s ; marge
    réglée ; jeton plus court que la marge servi sans être gardé ; appels simultanés partagés ; `oublier` ; 404, 401,
    503, 500, injoignable, délai, non configuré, cinq réponses hors contrat ⇒ résultat nommé, UN appel, rien de gardé ;
    jeton échu jamais présenté quand le renouvellement échoue ; purge) ;
  - `src/installation/verifications.spec.ts` **25/25** (jeton de l'organisation du plan ; deux organisations ; panne
    d'auth ⇒ module non appelé ; module sans adresse : `SERVICE_NON_CONFIGURE` sans demander de jeton ; 401 oublie,
    403 non) ; `acquis.spec.ts` (`JETON_DU_MOTEUR_INDISPONIBLE` jamais différée) ; `config/` 5 suites (validation :
    jeton statique refusé en nommant la remplaçante, marge 1 → 3 600 ; configuration).
  - **e2e** `test/jetons-du-moteur.e2e-spec.ts` **9/9** : vrais appelants et vrai fournisseur câblés par Nest avec la
    VRAIE configuration (environnement + `validateEnv`), auth doublée et un module doublé qui refuse
    `ORGANISATION_HORS_JETON` comme les vrais : deux organisations ⇒ deux jetons, aucun refus ; vérification, import
    C13 et Reprise de la même organisation ne redemandent rien ; renouvelé à 240 s ; auth en panne ⇒ trois résultats
    nommés, **trois demandes à auth pour trois appels**, aucun appel au module, puis reprise ; auth injoignable ;
    organisation inconnue ; 401 du module (×3 appelants) ⇒ jeton neuf à la tentative suivante ; jeton statique refusé.
  - Suite complète : **100/103 suites, 1 592 passés** ; 3 rouges connues (binding de Confluent : câblage du module
    racine, producteur, relais d'outbox), **vertes avec le binding doublé** (19/19). E2e complète : 5 suites rouges
    (172 tests) **identiques sur `origin/dev`** (témoin par `git stash`), plus la suite neuve verte.
  - **Câblage** (`app-cablage.invariant.spec.ts`, binding doublé) : vert ; **rouge** (« can't resolve dependencies of
    the AppelsC13ParHttp … JETONS_DU_MOTEUR ») quand on retire `JetonsDuMoteurModule` d'`EssaiModule`.
- **Mutations : 26/26 rouges sur une assertion** (borne et usage du cache, appels partagés, marge, jeton court gardé,
  organisation du corps, claim du jeton, identité, durée nulle, 404, délai, secret absent, purge, `oublier`, statut
  200, clé du jeton et raison dans les trois appelants, ordre adresse/jeton, 401 ×3, jeton statique accepté, marge par
  défaut). Trois ont demandé une reprise : une survivante d'abord (jeton court gardé : effet seulement en mémoire, le
  test vérifie désormais que rien n'est gardé), deux qui ne compilaient pas (paramètre inutilisé ; import `IsEmpty`
  inutilisé), réécrites.
- `tsc --noEmit`, lint des fichiers touchés (`endOfLine auto`), `nest build` verts ; `git diff --stat` =
  `--ignore-cr-at-eol` ; aucun fichier non suivi hors des quatre neufs.
- Après la fusion : arbre de `f9e9e26` (dev) = arbre de la branche poussée `51723c3`.
- **Docker** : aucun (D-978-11) ; aucun verrou pris.

## Pour STORY-1080 (points ouverts, à reprendre par sa fiche)

- **Le compose de la recette doit donner au catalogue** : `NAISSANCE_AUTH_URL=http://auth-service:3001/api/v1`,
  `MOTEUR_JETON_SERVICE` (**la même valeur** que celle d'auth-service, `${MOTEUR_JETON_SERVICE:-jeton-de-recette-du-
  moteur-32-caracteres-min}`), `INSTALLATION_SERVICES` (avec `comptabilite=http://comptabilite-service:3420`) ;
  facultatif : `JETON_DU_MOTEUR_MARGE_S`. **Jamais `INSTALLATION_JETON_SERVICE`** : le catalogue refuserait de
  démarrer. `JETON_DE_SERVICE_DUREE_S` d'auth peut rester à 300 s.
- **Preuve de bout en bout de 978** : dans la recette croisée complète, deux organisations installées par
  `POST /installations` (plans `TERMINE`, vérifications `VERT`) sans jeton posé à la main, et le relais du jeton par
  balance à `dossier-service` à l'import C13 de l'essai.
- Le démarrage réel du catalogue avec `JetonsDuMoteurModule` (D-978-11).
