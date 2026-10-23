# STORY-589 : Chemin d'entrée direct authentifié pour les messages porteurs d'un secret ⛔ C8

Status: done

**Épic :** EPIC-058 — Le service devient l'organe de parole unique
**Service :** `notification-service`
**Points :** 5 · **Sprint :** S42
**Prérequis :** ⛔ **C8 — authentification machine-à-machine (décision PROGRAMME, hors service)** · **STORY-588**
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-2, AR-05, AR-06.

---

## Le fait

⛔⛔ **Story la plus bloquée du module, et son blocage vit ailleurs.** C8 — l'authentification
machine-à-machine entre services — est une **décision programme ouverte depuis STORY-034**. Elle n'est
pas livrable par l'équipe notification.

⚡ **Pourquoi on ne peut pas la contourner ici alors que `paiement-service` l'a fait (son AD-13) :** un
lien à usage unique **est** la preuve d'identité — qui l'a, prend le compte. Le déposer sur un topic
Kafka, c'est le déposer dans un journal **durable, rejouable depuis l'offset 0, lisible par tout
consumer group du programme et copié dans les sauvegardes**.

## Critères d'acceptation

- [x] AC-1 — ⚡ **Le discriminant est le contenu, jamais l'appelant.** Un message qui transporte un
      **lien à usage unique ou un code** — vérification d'e-mail, invitation, réinitialisation de mot
      de passe — entre par **appel direct authentifié machine-à-machine**. Tout autre déclencheur
      entre par le bus. Le test est **binaire et vérifiable en revue**.
- [x] AC-2 — La route directe est authentifiée par le mécanisme retenu par C8, et **elle seule**.
      Aucune autre route du service ne l'emprunte.
- [x] AC-3 — ⚠️ **L'appel direct ne remplace pas l'événement** : `auth-service` publie toujours
      `identity.user.registered` pour les read-models des autres services — **sans le secret**.
- [x] AC-4 — ⚠️ **Une indisponibilité de ce service ne fait pas échouer l'inscription.** Le client
      sortant de l'appelant réessaie avec backoff — une file de réessai n'est ni un appel SMTP ni un
      appel de canal, donc `SM-1` reste à zéro — et tout message porteur d'un secret expose un chemin
      de **renvoi à l'initiative de l'utilisateur**.
- [x] AC-5 — Ces envois partent sur la file **`transactionnel-prioritaire`** (STORY-578) : ce sont les
      messages sensibles au temps, `P95 < 10 s` (NFR-3).
- [x] AC-6 — ⛔ Le secret **n'est jamais journalisé** : ni en clair, ni masqué partiellement, ni dans
      une trace d'erreur (NFR-7). Vérifié sur des journaux réels.

## Notes

⛔ **À trancher avant l'ouverture du S42.** L'ordre de tirage du sprint place EPIC-058 en queue
précisément pour qu'un glissement de C8 coûte 13 points et non un sprint entier.

---

## Livré le 2026-10-23 — branche `MNV-589` (`prospera-notification-service`, sur `origin/dev`)

`npm test` 3 374/3 374 (252 suites) · `npm run test:e2e` 246/246 (`--runInBand`) · lint 0 · build vert.

⚡⚡ **C8 est tranchée par le mécanisme que `paiement-service` avait déjà livré (STORY-608), et
c'est ce que « ratifier » voulait dire.** Un jeton de service **par appelant**, en
`Authorization: Bearer`, dit *qui appelle* ; l'organisation dans le corps dit *pour qui*. Route :
`POST /api/v1/service/envois`, marquée `@AppelDeService()` et gardée par `JetonDeServiceGuard` —
`JwtAuthGuard` et `EmailVerifiedGuard` s'effacent sur elle, un JWT d'utilisateur y est refusé.

- **AC-1 — le discriminant est une LISTE de clés de modèle** (`CLES_PORTEUSES_DE_SECRET` :
  vérification, invitation, confirmation de changement d'adresse, réinitialisation), confrontée par
  un test au contrat de variables des modèles système (tout modèle qui déclare un `lien` y figure).
  ⛔ **Sur la clé NORMALISÉE** : la résolution normalise `Verification-Email` — comparer la clé brute
  aurait laissé passer le secret par la route d'un utilisateur, en majuscules. La route
  transactionnelle (`POST /envois`) et l'écriture d'une règle du bus refusent ces clés ; la route
  directe refuse toutes les autres. Un seul code dans les deux sens, `CHEMIN_D_ENTREE_INADAPTE`, dont
  le détail `entreePar` nomme la bonne porte.
- **AC-2 — le module appelant se DÉDUIT du jeton**, jamais du corps (le DTO n'a pas le champ).
  Chaque appelant a un **périmètre écrit dans le dépôt** (`appelants-de-service.ts`) : un appelant
  inconnu refuse le démarrage, un propos hors périmètre rend `403 APPELANT_HORS_PERIMETRE`. Seules les
  **empreintes** SHA-256 des jetons sont gardées, comparées à temps constant. Garde
  `appel-de-service.invariant.spec.ts` : un seul contrôleur porte `@AppelDeService()`, il n'est ni
  public ni gardé par le gate d'un utilisateur, et le guard est monté juste après celui des JWT.
- **AC-3 — côté notification, rien à faire** : les contrats consommés ne portent aucun secret
  (`aucun-secret-sur-le-bus.spec.ts`, STORY-588). Que `auth-service` continue de publier
  `identity.user.registered` sans le secret relève de STORY-610.
- **AC-4 — la part de ce service est l'idempotence** : le réessai de l'appelant, sous la même clé, rend
  le même envoi et un seul travail de file (e2e). Le réessai lui-même et le renvoi à l'initiative de
  l'utilisateur appartiennent à l'appelant (STORY-608 pour `paiement-service`, STORY-610 pour
  `auth-service`).
- **AC-5 — trois des quatre propos partent sur `transactionnel-prioritaire`** (`CLES_SENSIBLES_AU_TEMPS`).
  ⚠️ **Écart assumé : l'invitation reste sur la file transactionnelle**, par l'arbitrage de STORY-611
  (son lien vit 72 h ; la ranger devant un code que quelqu'un attend écran allumé dégraderait NFR-3).
  Deux règles, deux questions : *par où entre-t-il ?* et *à quelle vitesse part-il ?*
- **AC-6 — le secret traverse, il ne séjourne pas.** ⚡ Ce que la fiche ne disait pas : le journal des
  variables (90 jours, lu par l'attestation et le rejeu) aurait gardé le lien de réinitialisation —
  une seconde copie du secret. Les variables secrètes d'un propos secret n'y entrent plus ; un tel
  message **ne se rejoue donc pas** (`ENVOI_NON_REJOUABLE`, motif `SECRET_NON_CONSERVE`, annoncé
  aussi au journal et à la console) — il se redemande. Vérifié sur des **journaux réels** : e2e monté
  sur un vrai `pino` (options livrées, chemin de production), relu après succès, rejeu, refus `401`,
  `400`, `422` et panne `500` — ni le lien, ni le jeton n'y apparaissent, et la contre-preuve montre
  que la capture voit bien la panne.

**Configuration** : `JETONS_DE_SERVICE=auth-service:<jeton>` (32 caractères au moins ; absente ⇒ la
route refuse tout, le service démarre) et `ORGANISATION_PLATEFORME_ID` (l'organisation d'un message qui
précède toute organisation ; absente ⇒ `ORGANISATION_REQUISE`).

⛔ **Points ouverts :**
- **`paiement-service` n'est PAS branché.** Son client (STORY-608) poste un `MessageDeLien` sur
  `/api/v1/envois` — forme métier, sans canal, sans langue, sans clé de modèle — et aucun modèle
  « lien de paiement » n'existe au socle. L'inscrire au périmètre aurait ouvert une porte qui ne mène à
  aucun texte. Il faut une story : modèle `lien-de-paiement` (texte à valider par le PO), canal quand
  le payeur n'a pas de téléphone, mise en forme du montant côté appelant, puis l'adaptateur sur
  `/api/v1/service/envois`.
- **Les trois alertes de compte sans lien** (`alerte-changement-email`, `alerte-adresse-deja-prise`,
  `confirmation-reinitialisation-mot-de-passe`) ne peuvent pas passer par la route directe (AC-1 est
  binaire) et n'ont pas de chemin par le bus (`identity.user.*` ne porte ni organisation ni adresse).
  STORY-610 doit trancher : contrat d'événement neuf, ou amendement d'AD-2.
- `JETONS_DE_SERVICE` et `ORGANISATION_PLATEFORME_ID` sont à poser au `docker-compose` racine (hors git).

