# STORY-577 : Port de canal et adaptateur e-mail — aucun canal n'est un prérequis de démarrage

Status: done  ✅ 2026-09-05 — branche `MNV-577` sur `origin/dev` de `prospera-notification-service`

**Épic :** EPIC-056 — Le premier message part : port de canal, e-mail, journal et accusés
**Service :** `notification-service` (nouveau)
**Points :** 5 · **Sprint :** S41
**Prérequis :** **STORY-570** (scaffold et santé à deux niveaux)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-6, AR-17.

---

## Le fait

⚡ **Les capacités sont des données, pas du code appelant** : longueur maximale et encodages, pièces
jointes, accusé de délivrance, accusé de lecture **et son niveau de certitude**, bidirectionnalité,
référence de conversation transportée ou non, exigence d'approbation de modèle, barème de tarif,
devise. Un appelant **interroge** ce qu'un canal sait faire au lieu de le supposer — c'est ce qui
permettra d'ajouter SMS et WhatsApp (EPIC-063, reporté) **sans toucher au noyau**.

⚡ **Cette story est livrable sans aucun contrat externe**, et c'est ce qui fait du bloc 1 le bon
découpage à tirer : `nodemailer@6.9.16` est **déjà au dépôt** — exactement la dépendance que ce
service **reprend** à `auth-service` en soldant la dette — et **Mailhog est déjà au `docker-compose`
racine**.

## Critères d'acceptation

- [x] AC-1 — Un **seul port `ChannelProvider`**. Aucun nom de passerelle n'apparaît dans un type du
      domaine.
- [x] AC-2 — Chaque adaptateur **déclare ses capacités en données**, et FR-N20 les publie. Un test
      lit les capacités du canal e-mail et vérifie qu'elles annoncent l'accusé de lecture comme
      **indisponible** — SMTP n'en rend pas.
- [x] AC-3 — Adaptateur e-mail sur `nodemailer`, prouvé de bout en bout **contre Mailhog** en Docker :
      un message part, il est reçu, son objet et son corps sont ceux du modèle rendu.
- [x] AC-4 — ⛔ **Aucun `si production` dans le code** : le passage du bac à sable à la production est
      une **configuration**. Test de présence.
- [x] AC-5 — ⚡ **L'absence d'une passerelle dégrade le canal, jamais le service** (AD-6, AR-17). Le
      service **démarre** sans configuration SMTP valide, l'état de santé dit « canal e-mail
      indisponible », et une demande d'envoi sur ce canal rend `CANAL_INDISPONIBLE`.
- [x] AC-6 — Le registre des capacités est interrogeable **avant** de choisir un canal, pour que le
      coût et le nombre de segments (STORY-574) soient annonçables à l'appelant.

## Notes

- Le canal in-app est un adaptateur comme les autres et **appartient à EPIC-057**, hors bloc 1. Il
  est le seul dont la certitude de lecture est `confirmé` par construction : son accusé n'est pas
  reçu d'un tiers, il est écrit par le service lui-même.


---

## Ce que la livraison a appris (2026-09-05)

**⚡ Le corps d'un message est du TEXTE ; l'objet est un EN-TÊTE — et c'est la
seule chose que cette story a trouvée qu'aucun critère d'acceptation ne
nommait.** Le moteur de rendu (STORY-575) substitue les valeurs dans l'objet et
dans le corps **de la même façon**, et `typage-valeurs.ts` dit en toutes lettres
qu'une variable de type `texte` accepte *tout ce qui n'est pas vide* — sauts de
ligne compris. Un saut de ligne est légitime dans un corps (une adresse postale
en a) ; dans un objet, il **ouvre un en-tête** : `Objet\r\nBcc: victime@ailleurs`.
L'attaquant n'a jamais eu besoin d'écrire dans un modèle — il a rempli un
formulaire. Deux conséquences transposables à tout adaptateur :

1. **La frontière où cette différence existe est l'ADAPTATEUR**, pas le domaine :
   c'est lui qui sait que son protocole a des en-têtes. Poser le contrôle au
   rendu aurait interdit les sauts de ligne dans les corps.
2. **On refuse, on n'assainit pas** (`OBJET_MULTILIGNE`). Replier le saut de
   ligne en espace ferait partir un objet que personne n'a écrit, et la
   tentative d'injection ne laisserait **aucune trace**.

**⚡ `CANAL_INDISPONIBLE` est un `503`, et le ranger en `422` aurait perdu des
messages.** Une **nature de refus nouvelle** a été ajoutée au domaine — la
première depuis le scaffold. Les deux se ressemblent (l'entrée est bien formée
dans les deux cas) et disent à l'appelant deux choses opposées : `422` = *votre
demande est fautive, corrigez-la* ; `503` = *votre demande est bonne, réessayez*.
Une panne de passerelle rangée en règle métier aurait appris à l'appelant à ne
pas réessayer, au moment précis où il suffisait d'attendre. La même distinction
sert la file d'attente de STORY-578 : l'adaptateur lit le **code de réponse
SMTP** et sépare le `5xx` (définitif — un `550 adresse inconnue` réessayé
indéfiniment occupe un exécutant pour un message qui ne partira jamais) du reste
(rejouable — une coupure abandonnée au premier essai perd un message qui serait
parti trente secondes plus tard).

**⚡ Zéro est le SEUL tarif déclarable aujourd'hui, et ce n'est pas une
commodité.** AD-16 interdit de présumer le nombre de décimales d'une devise, que
seul `pays-devises-ao` détient (EPIC-060, aucun adaptateur). Or **zéro est le
même entier quel que soit ce nombre** : c'est la seule valeur qu'on puisse écrire
sans présumer ce qu'AD-16 interdit de présumer — et elle est **exacte**, un relais
interne ne facturant rien. Généralisable : quand une unité manque, chercher la
valeur qui n'en dépend pas avant de fabriquer une valeur par défaut.

**⚡ Une règle qui n'était qu'une phrase est devenue un refus de démarrage.**
STORY-572 écrivait « les identifiants de passerelle ne figureront jamais dans la
configuration » — dans un commentaire, et rien ne l'empêchait. C'est pourtant le
geste qu'on fait un vendredi soir pour *juste faire partir un mail* :
`MAIL_PASSWORD=…` au compose, et le service envoie **au nom d'un compte commun à
toutes les organisations**. ⚠️ **Le cloisonnement de FR-N54 ne tombe pas avec une
erreur : il tombe avec un envoi qui marche.**
`verifierAbsenceDIdentifiantsSmtp` inspecte **tout l'environnement**, pas les
variables déclarées — une variable inconnue du schéma passe la validation sans
être lue (même raisonnement que `verifierAbsenceDuCompteDeMaintenance`,
STORY-571). ⛔ **Corollaire assumé, à ne pas relire comme un oubli :** le relais
du v1 doit être joignable **sans authentification** — un MTA interne, autorisé
par le réseau. Un relais qui exige un compte se configure comme la passerelle
qu'il est : chiffrée en base, par organisation, branchée sur l'`Envoi` qui porte
une organisation (STORY-579).

**⚡ Le catalogue se lit MÊME quand la passerelle est morte, et c'est l'AC-6.** Ce
qu'un canal *sait faire* ne dépend pas de ce qu'il *peut faire à cet instant* :
sinon une panne de relais rendrait aussi impossible de **préparer** l'envoi qu'on
fera quand elle sera finie. La disponibilité se lit à `/api/v1/health` ; les
capacités, à `/api/v1/canaux`. Deux questions, deux routes.

**⚡ Un catalogue qui se contredit fait échouer le DÉMARRAGE — et ce n'est pas
contredire AD-6.** Ce qui est refusé n'est pas une passerelle absente, c'est un
adaptateur qui **se décrit faux** : accusé de lecture annoncé `confirme` mais
indisponible, tarif flottant, pièces jointes « non supportées » mais
dimensionnées. Le défaut est déterministe, écrit en dur, et il ne se verrait
autrement que des mois plus tard, sur un écran affichant une certitude à propos
d'une information que personne ne reçoit.

**⚠️ Deux gardes de présence, écrites en INVENTAIRE et non en interdiction.**
« Aucun `si production` » et « aucune comparaison d'un canal à un littéral » sont
toutes deux **fausses telles quelles** : trois fichiers lisent légitimement
l'environnement (journal, énumération, exposition Swagger), et
`normalisation-identifiant.ts` compare légitimement un canal (une adresse et un
numéro ne se normalisent pas pareil, et aucune passerelle n'y change rien). Une
interdiction absolue aurait été fausse le jour de son écriture, donc négociable.
Écrites en inventaire, elles refusent le **quatrième** fichier : la liste est une
hypothèse, l'ajout la falsifie, et celui qui l'ajoute doit dire pourquoi. C'est
la forme que prend ici la leçon du *frontend-mockup-gate* : une garde de balayage
s'écrit comme une hypothèse et se retourne quand elle est falsifiée.

**⚠️ La frontière entre `FORME_PAR_CANAL` et les CAPACITÉS tient à une seule
question :** *qu'est-ce qui dépend d'une passerelle ?* Qu'un SMS n'ait pas d'objet
n'en dépend pas (domaine) ; le tarif, les pièces jointes, les accusés et leur
certitude, si (adaptateur). Le piège concret : les deux portent une « longueur
maximale ». L'une vaut 50 000 **caractères** — ce qu'on s'autorise à écrire —,
l'autre 10 Mio **d'octets** — ce que le relais accepte. Les confondre ferait
dépendre une règle de rédaction du contrat commercial du mois.

**⛔ `nodemailer` est retenu en 10.0.0 et non en 6.9.16, contre la colonne
« Stack » de la spine.** `npm audit` relève **huit avis** sur toute la ligne
`<= 9.0.0`, dont un *high* qui touche exactement ce service — *« Email to an
unintended domain can occur due to Interpretation Conflict »* —, deux injections
d'en-tête par CRLF et un contournement de `disableFileAccess`. La 10.0.0 les
corrige (audit : 0 vulnérabilité), exige Node ≥ 20 (l'image est en `node:20`), et
l'API employée est inchangée. ⚠️ **`auth-service` porte toujours la 6.9.16
vulnérable** : dette de programme, que le retrait de son code d'envoi (EPIC-058)
solde.

**⚠️ Le corps qu'on relit d'un relais N'EST PAS celui qu'on a envoyé — mesuré.**
Le test de conformité a rougi sur `=C3=A9ch=C3=A9ance` : `nodemailer` transmet en
*quoted-printable*, avec des coupures de ligne par `=` terminal. Comparer la
chaîne brute fait échouer un envoi correct ; relâcher l'assertion pour la faire
passer aurait fait **cesser de prouver** que les accents traversent — la seule
chose que ce test existe pour vérifier. Décoder fait donc **partie de la preuve**.

**⚡ Le rendu est l'ARGUMENT de la remise** (`remettreEssai` appelle
`rendreEssai`, jamais l'inverse) : il n'existe aucun chemin par lequel un message
partirait sans avoir été rendu et validé. Même geste structurel que
`figerPourEnvoi` en STORY-576 — un contrôle « avant toute écriture » se rend
inévitable en faisant du résultat l'entrée de ce qui suit.

**⚠️ FR-N15 est complet, et sa seconde moitié a sa ROUTE à elle.** Un champ
optionnel sur `POST /modeles/:id/essai` aurait donné le même plafond de débit et
le même droit à deux gestes opposés : prévisualiser (gratuit, appelé à chaque
frappe) et **mettre un message sur le réseau**. `POST :id/essai/remise` porte donc
`notification:modele:rediger` et un plafond dédié. C'est la **seule surface du
service qui envoie sans qu'un `Envoi` en réponde** : trace technique (journal
d'exploitation, destinataire masqué), aucune trace métier. ⚠️ Aucun des cinq
droits de FR-N53 ne nomme l'essai ; en ajouter un sixième est une **décision PO**,
comme pour le carnet (STORY-573).

**⚠️ `${VAR:-défaut}` rendait l'invariant d'AD-6 invérifiable depuis
l'environnement.** Une variable **vide** y réactive le défaut (piège payé en
STORY-173) : `MAIL_HOST=` n'éteignait donc pas le canal. Les deux variables qui
décident de l'**existence** du canal sont passées en `${VAR-défaut}` ; les deux
autres, simples réglages, restent en `:-` (un port vide ferait échouer la
validation de type). L'invariant s'exerce maintenant sans éditer le compose.

## Vérification

**Automatique.** 1 213 tests unitaires (90 suites) + 75 e2e ; couverture
99,61 / 94,28 / 98,27 / 99,60 — seuils du moule tenus. Lint 0 warning, build OK,
`schemas:verifier` conforme.

**Contre un relais réel** (`npm run test:conformite`, Mailhog du compose racine,
2026-09-05) : le message **part**, il est **relu depuis la boîte**, son objet et
son corps sont ceux du modèle rendu, accents intacts ; l'injection d'en-tête
n'atteint jamais le relais ; un port fermé rend `RELAIS_INJOIGNABLE` **sans
pendre** et refuse la remise en `CANAL_INDISPONIBLE`.

**En Docker, sur la stack** (2026-09-05) :

| Ce qui a été fait | Ce qui a été observé |
| --- | --- |
| `docker compose up -d notification-service` | `canaux` passe **`up`** pour la première fois : `TOUS_CANAUX_DISPONIBLES`, `disponibles: ["email"]`. `/health` reste `503` pour **une** seule raison : le référentiel (EPIC-060) |
| `MAIL_HOST= docker compose up -d notification-service` | Le service **démarre**. `/health/live` `200`, `canaux` `down` avec `degrades: [{ canal: email, motif: CANAL_NON_CONFIGURE }]` — le canal est dégradé, pas le service |
| `docker compose run -e MAIL_PASSWORD=hunter2 …` | **Le boot échoue**, en nommant `MAIL_PASSWORD` et **jamais sa valeur** |

## Ce qui reste ouvert

- **`figerPourEnvoi` n'a toujours aucun appelant** (STORY-579), et sa garde
  d'inertie tient. L'outbox reste inerte elle aussi.
- **Les secrets de passerelle par organisation (STORY-572) ne sont branchés sur
  aucune remise** : l'adaptateur emploie le relais de la plateforme. Le
  branchement appartient à l'`Envoi`, qui porte une organisation (STORY-579).
- **Aucune file** : la remise est synchrone. Les trois files d'AR-04 arrivent
  avec STORY-578, et c'est là que la distinction définitif / rejouable posée ici
  devient une politique de reprise.
- **Un sixième droit pour l'essai** — décision PO.
