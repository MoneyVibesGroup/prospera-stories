# STORY-578 : Trois files séparées, la file déterminée par la nature de l'envoi et jamais par l'appelant

Status: done  ✅ 2026-09-05 — branche `MNV-578` sur `origin/dev` de `prospera-notification-service`

**Épic :** EPIC-056 — Le premier message part : port de canal, e-mail, journal et accusés
**Service :** `notification-service` (nouveau)
**Points :** 3 · **Sprint :** S41
**Prérequis :** **STORY-577** (port de canal et adaptateur e-mail)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-1, AD-18, AR-04.

---

## Le fait

⛔ **Cette story ferme un défaut que la recette ne verrait pas.** Sur une file commune, un envoi de
masse de 50 000 retarde de **plusieurs heures** le code de vérification dont NFR-3 exige
**P95 < 10 s** — et personne ne s'en aperçoit tant que le volume reste petit.

⚡ **La file est déterminée par la nature de l'envoi, jamais choisie par l'appelant.** Aucun DTO
d'entrée ne porte ce mot (AD-1). Il suffirait d'un `nature` à « TRANSACTIONNEL » écrit par
copier-coller pour qu'une promotion parte sous le régime « service » chez quelqu'un qui l'a refusée,
**sans qu'aucun test ne casse**.

## Critères d'acceptation

- [x] AC-1 — Trois files BullMQ **disjointes** — `transactionnel-prioritaire`, `transactionnel`,
      `masse` — avec **pools d'exécutants séparés**.
- [x] AC-2 — ⛔ **Aucun cas d'usage n'accepte `nature` en entrée.** Un test de présence refuse le
      champ dans tout DTO d'entrée. La nature naît du **point d'entrée** : le cas d'usage
      transactionnel produit `TRANSACTIONNEL`, l'exécution d'un `EnvoiDeMasse` produit `MASSE`.
- [x] AC-3 — La file `transactionnel-prioritaire` est réservée aux envois **sensibles au temps**
      (code de vérification). Le critère est une donnée du modèle, pas un paramètre d'appel.
- [x] AC-4 — ⚡ **Preuve de la séparation** : 5 000 travaux poussés sur `masse`, puis un envoi
      prioritaire, dont la latence reste **sous la cible NFR-3**. Mesuré, consigné, et **non
      extrapolé**.
- [x] AC-5 — ⚠️ **Aucun `setInterval`, aucune minuterie applicative, aucun ordonnancement en mémoire
      de processus — nulle part dans le service** (AD-18). Tout fait temporel est un travail BullMQ
      **à clé idempotente**. Test de présence sur l'ensemble des sources.

## Notes

- La règle AD-18 se pose **ici** parce que c'est la story qui introduit BullMQ. Posée plus tard, elle
  arriverait après les premières minuteries.

---

## Ce que la livraison a appris (2026-09-05)

**⚡ La priorité de BullMQ n'aurait pas suffi, et c'est la première chose à
savoir.** Elle ordonne ce qui **attend** ; elle ne libère pas un exécutant
**occupé**. Trente travaux de campagne en cours de remise laissent le code de
vérification patienter qu'un travail finisse, quel que soit son rang dans la
file. *C'est le pool, pas l'ordre, qui décide de la latence* — et c'est pourquoi
l'AC-1 dit « trois files **et** trois pools », là où « une file, trois
priorités » aurait paru équivalent sur le papier et faux à la mesure.

**⚡ Le critère de sensibilité au temps est la CLÉ FONCTIONNELLE du modèle, et
l'alternative évidente rouvrait le défaut que la story ferme.** Un booléen
`sensibleAuTemps` sur le document `modeles` paraissait plus propre et plus
« donnée ». Or une organisation peut **surcharger** un modèle du socle (FR-N11) :
sa copie est créée par une route HTTP, dont le DTO ne porte évidemment pas ce
champ — donc `false`. **Le jour où un client personnalise son message de
vérification, son code de vérification quitte silencieusement la file
prioritaire.** Aucun test ne casse, aucune alerte ne part, et la latence ne se
dégrade que sous charge, c'est-à-dire le jour de la première campagne. La clé,
elle, **survit à la surcharge** — c'est même ce qui fait d'une surcharge une
surcharge. Généralisable : *quand un attribut doit survivre à une copie faite par
l'utilisateur, le porter sur ce qui l'identifie, pas sur ce qui la décrit.*
La déclaration vit dans le dépôt pour la raison de STORY-576 (personne ne
pourrait signer son écriture), et un test la confronte au catalogue du socle —
une faute de frappe n'y lèverait rien, elle sortirait juste un message de la file
prioritaire.

**⚡ La clé de travail dédoublonne pendant une FENÊTRE déclarée, pas pour
toujours.** `deduplication: { id, ttl }` est le bon primitif — un `jobId` aurait
lié la fenêtre à la rétention des travaux terminés, donc à un réglage qui parle
d'autre chose. ⛔ **L'arbitrage durable du doublon appartient à la BASE** (index
unique, STORY-579). Croire l'inverse ferait partir deux fois le même message à
quelques heures d'intervalle — un défaut que personne ne relie jamais à une file,
parce qu'il ne ressemble pas à un doublon : il ressemble à un client qui se
plaint.

**⛔ Un nom de file est un nom GLOBAL sur un Redis partagé, et le programme s'est
déjà brûlé dessus.** Relevé sur la stack en marche le 2026-09-05 :
`bull:mail` et `bull:system` (auth-service) cohabitent avec
`bull:expert-comptable-mail` et `bull:expert-comptable-system` — lesquels ont dû
être **renommés** pour ne pas prendre les premiers. Nos trois noms viennent de la
spine (`masse` surtout) et sont exactement ceux qu'un autre service peut choisir
un jour. Un préfixe de **keyspace** (`notification:`) est la seule protection qui
ne dépende pas de la prudence du prochain service — et il doit être **identique**
côté file et côté exécutant, sinon les travaux partent, rien ne les traite, et
**aucune erreur ne le dit**.

**⛔ `@nestjs/bullmq@12` est publié en ESM pur : `tsc --noEmit` était vert, et
l'échec est arrivé au `require`.** Il se charge sous Node 22 (qui sait requérir
un module ESM) mais **pas sous le runtime CommonJS de Jest**, qui est celui des
sept dépôts du programme. *Un paquet qui compile n'est pas un paquet qui charge*
— exactement la leçon symétrique de STORY-575 (`handlebars` était résolvable sans
être déclaré). Le paquet a été **retiré** : files et exécutants sont construits à
la main. Ce n'est pas seulement un contournement — les options d'un exécutant
sont figées par le décorateur `@Processor`, donc **hors de portée de
`ConfigService`** : la concurrence de chaque pool, qui est le cœur de cette
story, n'aurait pu venir que de `process.env`, en contournant les bornes de
`env.validation.ts` où `FILES_CONCURRENCE_MASSE=beaucoup` devient `NaN` sans une
erreur.

**⚠️ `KeepJobs.age` de BullMQ est en SECONDES quand toute la configuration du
service est en millisecondes.** Non converti, le facteur mille aurait gardé les
travaux terminés — **avec le corps des messages, donc avec des liens à usage
unique** — mille fois plus longtemps que la politique déclarée, dans un Redis que
personne ne relit jamais. La conversion est nommée et testée sur la valeur
exacte.

**⛔ La garde d'inertie de l'outbox cherche un MOT, pas un site d'appel — et elle
rougit aussi sur la PROSE.** Une méthode privée nommée « enfiler » a fait échouer
`hook-inerte.spec.ts` (STORY-570), qui refuse toute occurrence de cette forme
hors de son répertoire. La méthode a été renommée `deposerEnFile` plutôt que la
garde affaiblie — deux actes différents méritent de toute façon deux verbes — et
la raison est écrite **des deux côtés**. ⚠️ Puis la garde a rougi une seconde
fois, sur le **commentaire** qui expliquait le renommage : elle ne retire pas les
commentaires avant de balayer. C'est la **quatrième** fois dans ce dépôt qu'une
garde échoue sur de la documentation, et la première où c'est celle d'une autre
story.

**⚠️ AC-5 est écrit en INVENTAIRE, pas en interdiction — sinon il était faux le
jour de son écriture.** « Aucun `setInterval` nulle part » l'aurait été : deux
fichiers en portent un, légitimement (le relais d'outbox **relit la base** à
chaque tour ; le bootstrap de consommateur **réessaie une connexion**). Une garde
fausse dès sa première exécution se fait désactiver en entier. L'inventaire les
nomme avec leur motif, vérifie qu'ils en portent **vraiment** une, et refuse la
**troisième** — dont l'auteur devra venir écrire pourquoi. ⚡ Et la frontière
n'est pas « une minuterie », c'est **« un fait qu'on retient »** : ce qui ne
survivrait pas au redémarrage du processus va en file ; ce qui se relit d'une
base ne retient rien.

**⚡ La politique de reprise se lit sur la NATURE du refus, jamais sur un code de
protocole.** STORY-577 avait déjà traduit le code SMTP en nature
(`5xx` vers `REGLE_METIER`, le reste vers `CANAL_INDISPONIBLE`) : il n'y a donc
qu'un endroit à lire, et le prochain canal (EPIC-063) n'a pas à réapprendre la
distinction dans un `if` qui connaîtrait son nom. `CANAL_INDISPONIBLE` est la
**seule** nature rejouable — la même frontière que le `503` contre le `422` — et
tout le reste lève `UnrecoverableError`, dont le message ne recopie que le
**code** : le texte d'un refus peut porter l'adresse essayée, et il survivrait
dans le jeu des travaux échoués. ⚠️ Une exception **sans** nature reste
rejouable, et c'est un choix assumé : la ranger en définitive perdrait le message
sur la seule catégorie d'incident qui se répare toute seule.

**⚠️ Ce que la séparation en pools ne donne PAS, et qui doit être dit.** Les
trois exécutants vivent dans le **même processus Node** : un travail qui
monopoliserait le fil d'exécution retarderait les trois files ensemble. Ce qui
les protège aujourd'hui, c'est que la remise est une **attente
d'entrée-sortie**. Le jour où un canal ferait du **calcul** (compression d'une
pièce jointe, rendu d'image), la séparation exigerait des **processus** distincts,
pas des pools — et la mesure ci-dessous cesserait de valoir.

## Vérification

**Automatique.** 1 283 tests unitaires (100 suites) + 75 e2e ; couverture
99,55 / 94,37 / 97,86 / 99,61 — seuils du moule tenus. Lint 0 warning,
`schemas:verifier` conforme.

**⚡ AC-4 — mesuré contre un vrai Redis, avec sa contre-preuve**
(`test/files-separation.conformite-spec.ts`, `npm run test:conformite`,
2026-09-05) :

| Conception | Charge au moment de la mesure | Latence du message prioritaire |
| --- | --- | --- |
| **Trois files séparées** | 4 880 travaux de masse **encore en attente** | **44 ms** |
| **Une file commune**, capacité identique | idem | **> 10 000 ms** — jamais parti |

Le second cas est ce qui rend le premier significatif : sans lui, la mesure
serait verte quelle que soit la conception — y compris le jour où quelqu'un
refusionnerait les files. Et la campagne est **loin d'être finie** au moment où
le message prioritaire part : une file de masse déjà vidée n'aurait rien prouvé.
⚠️ La passerelle est remplacée par une attente de 30 ms (l'ordre de grandeur d'un
aller-retour SMTP) : ce qui est mesuré est l'**ordonnancement**, avec les files,
les pools et les concurrences du service.

**En Docker** (compose racine, 2026-09-05) : le service **démarre**,
`FilesModule dependencies initialized` puis `Nest application successfully
started` ; `/api/v1/health/live` rend `200`, `/api/v1/health` reste `503` pour la
**seule** raison du référentiel (EPIC-060) — `canaux`, `redis`, `kafka` et les
deux bases sont `up`. Les trois files existent dans le keyspace attendu :
`notification:transactionnel-prioritaire:meta`,
`notification:transactionnel:meta` et `notification:masse:meta`, à côté des
`bull:*` des autres services.

## Reste ouvert

- ⛔ **Les deux points d'entrée n'ont AUCUN appelant** (STORY-579) : la remise
  reste **synchrone** (rendu d'essai à destinataire de test, FR-N15). Une garde
  d'inertie (`files-sans-appelant.spec.ts`) le vérifie et **échouera** au premier
  branchement — c'est le rappel voulu, sur le modèle du figement (STORY-574) et
  du hook d'outbox (STORY-570), tous deux toujours inertes.
- ⚠️ **Le compose racine n'a reçu aucune variable `FILES_*`** : les défauts du
  code suffisent, et ce fichier n'est versionné dans aucun dépôt (dette
  STORY-352). Les dix variables sont documentées dans `.env.example`.
- ⚠️ **Aucun indicateur de santé sur les files** : `redis` couvre la connexion,
  pas la profondeur des trois files. La console d'exploitation de FR-N55
  (EPIC-060) est le bon endroit pour la rendre.
- ⛔ **Dans `prospera-stories`, les branches `MNV-574` → `MNV-578` ne sont
  toujours pas fusionnées dans `main`**, chacune basée sur la précédente, pendant
  que d'autres sessions commitent directement sur `main` (STORY-246 y est).
