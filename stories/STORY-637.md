# STORY-637 : Envoi programmé, annulable tant qu'il n'est pas parti

Status: done

**Épic :** EPIC-056 — Le premier message part : port de canal, e-mail, journal et accusés
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S39
**Prérequis :** **STORY-636** (fenêtre et fuseau), **STORY-633** (liste de suppression)
**Origine :** rail D, bloc D2 · FR-N36, AD-3.

---

## Le récit

En tant que **module appelant**, je veux programmer un envoi et pouvoir revenir dessus, afin de
préparer un rappel la veille sans m'interdire de me raviser.

## Critères d'acceptation

- [x] AC-1 — Un envoi peut porter une date de remise ; il occupe une place en file **sans consommer**
      de passerelle avant l'heure.
- [x] AC-2 — Il s'annule tant qu'il n'est pas remis ; après remise, l'annulation est **refusée**, pas
      ignorée — et le refus nomme la remise.
- [x] AC-3 — Le point de non-retour est **observable**.
- [x] AC-4 — ⛔ Un envoi programmé traverse le consentement et la suppression **à la remise**, jamais
      à la demande.

---

## Journal de livraison (2026-09-08) — branche `MNV-637`

**Livré :** `domain/envoi/programmation.ts`, `remettreLe`/`annuleLe` sur l'`Envoi`, le délai BullMQ,
la route d'annulation, le port `PortControlesRemise` et son service. Lint, build et suite unitaire
au vert.

### ⚡ La programmation n'ajoute AUCUN état à l'`Envoi`

Un envoi programmé est `prepare`, exactement comme un envoi immédiat qui attend son tour : ce qui
change est **quand** le travail devient éligible, pas ce que le document dit de lui. Ajouter un
huitième statut aurait cassé la projection de `statut-envoi.ts` — qui est un **maximum sur une
chaîne**, et où un état de plus doit recevoir un rang que rien ne justifie.

⚡ **Et c'est ce qui rend l'annulation lisible** : le point de non-retour n'est pas une date, c'est
la **sortie de `prepare`**. Tant que l'`Envoi` y est, personne n'a parlé au destinataire.

### ⛔ AC-1 — un DÉLAI dans la file, une DATE sur le document

BullMQ raisonne en millisecondes à partir de l'enfilement. Poser une date dans le travail aurait
fait dépendre la remise de l'écart entre l'horloge du service et celle de Redis — un décalage
silencieux sur chaque envoi programmé. Le calcul vit dans le domaine, où il est **borné**.

⚡ Un travail retardé vit dans l'ensemble `delayed` de BullMQ : aucun des trois pools ne le prend,
donc **aucune passerelle n'est ouverte avant l'heure**. C'est la différence entre « programmé » et
« en attente d'un exécutant libre », et elle se voit sur les compteurs de la console.

⛔ **Une date passée est refusée, jamais ramenée à « maintenant ».** La corriger en silence ferait
partir sur-le-champ un message qu'on croyait avoir programmé pour le lendemain, et l'appelant ne
l'apprendrait que du destinataire. Un plancher d'une minute évite en prime le piège d'une horloge
client en avance : BullMQ traite un délai négatif comme zéro, **silencieusement**.

⚠️ **Trente jours d'horizon**, parce qu'un travail retardé occupe Redis pendant tout son délai — une
base que le service traite comme éphémère, qui n'est pas sauvegardée, et dont la purge ne connaît
rien.

### ⛔⛔ AC-4 — l'argument qui décide n'est pas la symétrie, c'est la LEVÉE

Contrôler le consentement et la suppression **à la commande** pour un envoi programmé serait faux
dans les deux sens :

- une personne peut se **désabonner** entre la commande et le jour dit — le message partirait quand
  même ;
- une suppression peut être **levée** entre-temps (STORY-633, AC-5), et une personne peut se
  ré-abonner — le message serait jeté alors qu'il est parfaitement légitime le jour dit, et
  l'appelant n'aurait aucun moyen de le savoir.

C'est la règle de la passerelle de STORY-604, appliquée à ce que le destinataire a le droit de
recevoir, et celle que l'envoi de masse applique lot par lot depuis STORY-594.

⚡ **Un envoi IMMÉDIAT, lui, garde son refus devant l'appelant.** Entre la commande et le départ il
ne se passe rien, et un refus qui tomberait dans un journal ne reviendrait plus à celui qui peut
corriger l'adresse. Le contrôle à la remise est donc **conditionné à `remettreLe`** : le rejouer
partout coûterait deux lectures par message sur le chemin le plus chaud du service, pour attraper
une fenêtre de l'ordre de la seconde.

### ⛔ Un ÉCART à la remise n'est pas un échec — et c'est pourquoi il ne lève pas

L'exécutant écrit `ecarte` et s'arrête. Lever aurait fait rejouer BullMQ **cinq fois** pour un
message qui ne doit pas partir, et le journal l'aurait compté comme une panne de passerelle — donc
gonflé le taux d'échec technique sur lequel on juge un relais parfaitement sain. Un drapeau `ecarte`
sur le résultat du travail dit « succès de travail, pas de remise ».

⚡ Et `enregistrerEcart` n'écrit **aucune trace d'audit**, ce qui est cohérent avec AD-14 : la base
de preuves atteste ce qui est **parti**. Un message qui n'est jamais parti n'a rien à y faire.

### ⛔ AC-2 — l'arbitrage est à la BASE, et le retrait de file n'est qu'une économie

Le filtre porte `statut: 'prepare'`. Entre un test d'existence et une écriture, un exécutant peut
avoir remis le message — et c'est précisément la seconde qui compte. Si le retrait du travail
échoue, l'exécutant prendra le travail, lira un `Envoi` qui n'est plus `prepare`, et ne remettra
rien : la transition de STORY-579 est **conditionnelle**. Même patron que le curseur de STORY-592 :
ce qui optimise ne garantit pas, et ce qui garantit n'optimise pas.

⚠️ **Le retrait balaie les trois files et efface la clé de déduplication.** Sans cette seconde
moitié, une nouvelle demande portant la même clé dans la fenêtre de déduplication serait avalée en
silence : le client annulerait, reprogrammerait, et **rien ne partirait**.

⛔ **Après remise, l'annulation rend `409`, jamais `200`.** Rendre « d'accord » serait le pire des
deux mondes : l'appelant croirait avoir rattrapé son erreur, ne préviendrait personne, et le
destinataire l'aurait quand même reçu. Le refus **nomme la remise** — statut et date — parce que
sans elle l'appelant sait seulement qu'il a perdu, pas quand, donc pas ce qu'il doit dire.

### ⚡ AC-3 — `annulable` est DÉRIVÉ, jamais stocké

Un drapeau en base dépendrait de quelqu'un qui pense à le mettre à jour à l'instant exact de la
remise — c'est-à-dire serait faux précisément dans la seconde qui compte. Il se lit du statut, la
seule chose qui bouge, et il est rendu **avant** toute tentative : sinon la seule façon d'apprendre
qu'on a perdu la main est un refus, trop tard pour décider autre chose.

### ⚠️ Le double d'`envois` ne connaissait qu'un seul chemin de `findOneAndUpdate`

Il ne gérait que `$setOnInsert` et rendait toujours `{ value, lastErrorObject }`. Or Mongo rend le
**document** quand `includeResultMetadata` n'est pas demandé, et `null` quand aucun document ne
correspond au filtre — ce qui est exactement le mécanisme de l'annulation après remise. Le double
honore désormais `$set`, `new`, `upsert` et les deux formes de retour. **7e occurrence** de « le
double doit se comporter comme Mongo » : l'échec initial ne parlait pas du défaut, il parlait d'un
`toHexString` sur `undefined`.

⚠️ Et le test de course de STORY-579 enveloppait `findOneAndUpdate` **en perdant son troisième
argument** : les options. Corrigé.

### ⚠️ Points ouverts

- Le retrait du travail parcourt les trois files pour retrouver un travail retardé. À l'échelle
  d'une file de campagne, ce balayage coûte ; il ne se déclenche qu'à une annulation, qui est rare.
- Aucune surface ne **liste** les envois programmés à venir. La console de STORY-640 serait
  l'endroit ; ce n'était pas demandé ici.
- Aucune conformité Docker : le comportement `delayed` de BullMQ est prouvé par test sur l'option
  passée, jamais contre un vrai Redis.
