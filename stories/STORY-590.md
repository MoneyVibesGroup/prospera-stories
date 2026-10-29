# STORY-590 : Les trois services cessent d'envoyer — SM-1 = 0, mesuré et non affirmé

Status: done

**Épic :** EPIC-058 — Le service devient l'organe de parole unique 🏁
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S42
**Prérequis :** **STORY-588** (consumers) · **STORY-589** (chemin direct) ⛔ C8
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-2.

---

## Le fait

⛔ **C'est le motif d'existence du module, et son critère de sortie est un nombre.**

`auth-service`, `kyc-service` et `expert-comptable` perdent **tout** code d'envoi : plus de
`nodemailer`, plus de `.hbs` sur disque, plus de sujet en dur, plus de `MAIL_QUEUE`.

## Critères d'acceptation

- [x] AC-1 — Les messages sortants des trois services sont **migrés** vers `notification-service`
      (FR-N27), chacun sous une clé de modèle du socle.
- [x] AC-2 — ⚡ **`SM-1 = 0` se mesure par recherche de `nodemailer` et `createTransport` dans les
      trois services** — pas par relecture, pas par déclaration. **La mesure est l'AC, et elle tourne
      en CI.**
- [x] AC-3 — Les gabarits `.hbs` disparaissent du disque des trois services. Leur contenu vit
      désormais comme **modèles socle** (`orgId = null`, STORY-576).
- [x] AC-4 — Chaque message migré est **prouvé de bout en bout** contre Mailhog : le texte reçu après
      migration est celui d'avant.
- [x] AC-5 — Aucune régression du parcours d'inscription : l'AC-4 de STORY-589 (indisponibilité sans
      échec d'inscription) est rejoué **avec les trois services réels**.

## Notes

🏁 Clôt EPIC-058 et le **bloc 2**.

⚠️ **Cette story touche trois dépôts en plus du sien.** Elle se compte en 3 points sur le périmètre
notification, mais son coût réel inclut **trois PR de retrait**. Leçon STORY-434 : une story qui
touche deux dépôts se mesure **avant** de coder.

---

## Livré le 2026-10-29 — branches `MNV-590` de quatre dépôts

| Dépôt | Base | Commits |
|---|---|---|
| `prospera-notification-service` | `MNV-610` (774b81b) | 2216aa4 |
| `auth-service` | `MNV-610` (0a41634) | 02276f2, 6abf4d1 |
| `expert-comptable` | `origin/dev` | cbf7bf8, c171863 |
| `kyc-service` | `origin/dev` | 83ea922, 0cffb61 |

⚠️ **Ordre de fusion** : `MNV-610` avant `MNV-590` dans `notification-service` et `auth-service`
(les deux branches 590 sont empilées dessus) ; `notification-service` avant `expert-comptable`
(sans les modèles KYC et l'appelant `expert-comptable`, ses trois demandes seraient refusées).

### Arbitrage PO du 2026-10-27 — les messages sans secret

La route directe de STORY-589 ne servait que les secrets ; les trois alertes de compte **et les
trois e-mails KYC d'`expert-comptable`** n'avaient aucun chemin (aucun événement ne porte
d'adresse, AD-12 refuse que notification détienne celle des membres). **AD-2 amendé** (STORY-610) :
un secret ne passe JAMAIS par le bus ; la route directe sert les messages de service d'un appelant,
dans son périmètre écrit au dépôt. Appliqué ici au second appelant.

### Ce qui a été fait

- **AC-1** — `expert-comptable` : ses trois messages (dossier reçu, approuvé, à corriger) sont
  demandés à la route directe sous son propre jeton ; destinataires résolus depuis son read-model
  d'identité, une demande par destinataire, clé d'idempotence = `jobId` + empreinte SHA-256 de
  l'adresse (jamais l'adresse). Côté notification : modèles socle `kyc-dossier-recu` (`nom`),
  `kyc-dossier-approuve`, `kyc-dossier-a-corriger` (`motif`), e-mail seul ; appelant
  `expert-comptable` au périmètre, **disjoint** de celui d'`auth-service`. `auth-service` : ses sept
  messages passaient déjà par notification depuis STORY-610 ; le repli local est retiré.
- **AC-2 — SM-1 = 0, mesuré** : `src/sm-1.invariant.spec.ts` dans les trois services, exécuté par
  `npm test`. ⚡ **Il cherche des FORMES EXÉCUTABLES** (import, dépendance au `package.json`, appel
  qui ouvre un transport, file d'e-mails déclarée ou injectée) et tout `.hbs` sur disque. Sa première
  version cherchait des mots et a rougi sur un commentaire qui racontait le retrait — deux
  contre-preuves désormais : le code fautif rougit, le commentaire qui le nomme passe.
  **Mesure** : sur `origin/dev`, auth-service **16** formes + **7** gabarits, expert-comptable
  **9** + **3**, kyc-service **0** ; sur `MNV-590`, **0 partout**.
  ⚠️ Aucun des trois dépôts n'a de workflow CI : « tourne en CI » veut dire ici « tourne avec
  `npm test` ». Le jour où la CI existe, la garde y est sans rien ajouter.
- **AC-3** — les dix gabarits `.hbs` sont supprimés, et la règle d'asset `**/*.hbs` de
  `nest-cli.json` avec eux (kyc-service n'avait plus que celle-là). Contenus au socle : les sept de
  compte depuis STORY-611, les trois KYC ici — français transcrit mot pour mot de la version texte
  d'origine, objet compris ; anglais traduit (le socle sert toutes ses clés dans les mêmes langues).
  ⚠️ `motif` est obligatoire alors que le gabarit le tenait pour facultatif : le moteur n'a pas de
  conditionnelle (AD-8), et `kyc-service` refuse déjà un rejet sans motif (`RejectKycDto`).
- **AC-4 / AC-5** — vérifiés en Docker (ci-dessous).

### `MAIL_QUEUE` : la file d'ENVOI disparaît, la file de RÉESSAI reste

La fiche dit « plus de `MAIL_QUEUE` ». La file d'auth-service tient pourtant l'AC-2 de 610 (une
inscription n'attend pas notification) et l'AC-4 de 589 l'autorise expressément (« une file de
réessai n'est ni un appel SMTP ni un appel de canal »). Tranché : elle reste, renommée pour ce
qu'elle est — `NOTIFICATION_QUEUE`, `auth-notification` (auth) et `expert-comptable-notification`.
⚠️ **Déploiement d'auth-service** : vider la file `mail` avant de basculer — un travail resté dans
l'ancienne file ne serait plus lu par personne.

### Gate Docker (2026-10-29) — quatre images construites depuis les branches `MNV-590`

38 verdicts, 0 KO, contre Mailhog (santé 4, comptes 20, KYC 10, panne 4) :
- **Les sept messages de compte** : vérification (`1440 minutes` rendu, le lien reçu vérifie
  l'adresse), invitation (`72 heures`), réinitialisation (le lien reçu réinitialise) puis
  confirmation, adresse déjà prise, confirmation de changement (le lien reçu bascule) puis alerte à
  l'ancienne adresse (nouvelle adresse citée) — **un exemplaire chacun**.
- **Les trois messages KYC** de bout en bout (dépôt RCCM + CFE → `kyc.status.changed` →
  expert-comptable → notification) : reçu (prénom), à corriger (motif rendu), approuvé.
- **Organisations** : l'invitation et les KYC partent sous l'organisation du cabinet, les messages
  de compte sous `ORGANISATION_PLATEFORME_ID` ; identité `PLATEFORME` faute de passerelle cabinet.
- **AC-5 — panne** : notification-service arrêté ⇒ inscription **201**, aucun courriel pendant la
  panne (aucun repli local), trois échecs de remise, livraison à la 4ᵉ tentative, **un seul**
  courriel, envoi en `tentative: 1`.
- **15 courriels dans Mailhog = 15 envois au journal de notification** : rien n'est parti par un
  autre chemin.
- **Texte d'avant** : l'invitation dit « Un administrateur vous a invité(e) à rejoindre votre
  cabinet » — littéralement ce qu'`invitation.service.ts` envoyait sur `origin/dev`.

Portes : notification **3 551/3 551** unitaires, lint 0 ; auth-service **921** unitaires + garde,
lint 0, build sans `templates/` ; expert-comptable **330/330**, build ; kyc-service **519/519**.
⚠️ e2e d'expert-comptable : `billing-plans.e2e-spec.ts` rougit (3-4 cas), **identique sur `dev`
intact** — préexistant, sans lien ; JWKS et throttler passent en série (flakes de charge).

### ⛔ Points ouverts

- ✅ **Journal d'accès d'auth-service (AC-4 de STORY-610) — CORRIGÉ le 2026-10-29** (commit
  `6abf4d1` sur `MNV-590` d'auth-service). Le jeton d'un lien CLIQUÉ
  (`GET /api/v1/auth/verify-email?token=<64 hex>`, idem `confirm-email-change`) sortait en clair
  par **trois** chemins, pas un : l'objet `req` de pino (`url` ET `query`), la ligne de fin de
  requête de `LoggingInterceptor`, et la ligne d'erreur d'`AllExceptionsFilter` pour un lien
  expiré. Une seule règle (`common/utils/url-journalisable.util.ts` : la valeur d'un paramètre
  dont le nom contient `token`/`secret`/`password` devient `[masqué]`, chemin et noms gardés),
  appliquée aux trois. Prouvé par `test/journal-sans-jeton.e2e-spec.ts` (chaîne de journalisation
  de production, tout ce que pino écrit est lu ; un témoin ordinaire y apparaît, le jeton jamais) ;
  contre-preuves : sans le correctif les deux cas rougissent, sans celui du filtre seul le cas
  « lien expiré » rougit. auth-service : 936 unitaires, lint 0.
- **Politique de réessai** : 5 essais à backoff exponentiel depuis 5 s ⇒ le dernier part ~75 s
  après le premier. Une panne de notification plus longue perd le message (l'utilisateur peut
  redemander l'envoi — AC-4 de 589). Héritée de la file SMTP d'origine.
- **Clé `auth:<travail>:<jobId>`** : le compteur de `jobId` repart à 1 avec la file renommée.
  Examiné et **écarté comme défaut** : l'idempotence de notification porte aussi le destinataire
  (même clé, autre adresse ⇒ nouvel envoi, vérifié en Docker). Collision seulement pour la même
  personne, le même travail et le même numéro après remise à zéro.
- **Environnement local** (hors code) : l'image `runtime` d'expert-comptable et de kyc-service n'a
  pas `pino-pretty`, et leurs `.env` posent `NODE_ENV=development` ⇒ crash au démarrage
  (« unable to determine transport target for pino-pretty ») ; contourné pour la gate par
  `NODE_ENV=production`. `APP_PUBLIC_URL` du `.env` racine pointe une IP de réseau local. Mailpit et
  Herd (Laragon) tiennent 1025/8025/9001, un serveur Node tient 3000 : la gate republie Mailhog sur
  18025, la console MinIO sur 19001, expert-comptable sur 13000.
- `docker-compose.yml` racine (hors git) : `JETONS_DE_SERVICE` (auth-service + expert-comptable),
  `ORGANISATION_PLATEFORME_ID`, `NOTIFICATION_*` posés ; `MAIL_*` retirées d'auth-service et
  d'expert-comptable.

🏁 **EPIC-058 close, bloc 2 clos** — sous réserve de la fusion des branches 610 et 590.
