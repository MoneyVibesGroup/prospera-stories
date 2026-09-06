# STORY-588 : Consumers du bus et correspondance événement → modèle, configurable par organisation

Status: done

**Épic :** EPIC-058 — Le service devient l'organe de parole unique
**Service :** `notification-service`
**Points :** 5 · **Sprint :** S42
**Prérequis :** **STORY-579** (envoi unitaire et sa clé d'idempotence) · **STORY-576** (résolution de modèle)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-2, AR-05.

**Livrée le 2026-09-06** — branche `MNV-588` de `prospera-notification-service`, sur `origin/dev`.
1 969 tests unitaires (163 suites) + 158 e2e ; lint et types propres.

⛔ **C8 ne bloquait PAS cette story**, contrairement à ce que le découpage laisse croire. AD-2 réserve
l'appel direct machine-à-machine aux messages porteurs de **secret** ; tout le reste entre par
**événement**, et c'est ce chemin que cette story ouvre. Ce qui reste suspendu à C8, ce sont les
stories qui **retirent** son code d'envoi à `auth-service` (STORY-589, STORY-590).

---

## Le fait

⚡ **C'est cette story qui justifie rétrospectivement la clé d'idempotence étendue de STORY-579.** La
correspondance étant configurable par organisation, `kyc.status.changed` déclenche légitimement
**deux** envois — le dirigeant par e-mail, le gestionnaire de compte en in-app. Une clé réduite à
`(orgId, eventId, canal)` avalerait le second **en silence**. Le `regleDeclenchementId` de la clé naît
ici.

## Critères d'acceptation

- [x] AC-1 — Consumers sur `identity.*`, `kyc.status.changed`, `entitlement.changed`. Démarrage
      **dégradé** si un topic est absent : le processus reste vivant, HTTP répond, le consumer rejoint
      plus tard. ⚠️ `document.*` et `paiement.*` ne sont **pas** consommés : ces topics n'existent pas
      encore au programme, et un abonnement à un topic inexistant n'a rien à rattraper.
- [x] AC-2 — La correspondance **événement → modèle** est une **règle de déclenchement** configurable
      par organisation (FR-N24), portant un identifiant stable — celui qui entre dans la clé
      d'idempotence.
- [x] AC-3 — ⚡ Un événement déclenchant **deux règles** produit **deux `Envoi`**, aucun avalé.
      Test explicite avec `kyc.status.changed` sur deux destinataires et deux canaux.
- [x] AC-4 — La `cleIdempotence` vient de l'`eventId` du bus quand l'entrée est un événement.
- [x] AC-5 — ⛔ **Aucun de ces événements ne porte de secret.** Un test de contrat le vérifie sur les
      schémas consommés.

## Notes

- Un poison-pill sur un de ces topics tue le consumer sans tuer le conteneur.

---

## Ce que la livraison a appris

### ⛔ Le marqueur d'idempotence qualifiait un ÉVÉNEMENT ; il devait qualifier un LECTEUR

STORY-573 l'avait écrit noir sur blanc : *« un second consommateur du même topic trouverait chaque
événement déjà marqué et n'écrirait jamais rien, sans une erreur »*. EPIC-058 a besoin de ce second
lecteur. La clé passe donc de `eventId` à **`(eventId, consommateur)`** — et c'est bien le groupe
**configuré** qui y entre : rejouer un topic se fait en changeant son `KAFKA_*_GROUP_ID`, et un nom
figé dans le code aurait fait bloquer par les anciens marqueurs le rejeu qu'on venait de demander.

⚠️ **Cela ne contredit pas le raisonnement d'origine sur le `topic`.** Deux topics portant le même
`eventId` restent un défaut de producteur, qu'une clé composite appliquerait deux fois en silence.
Deux **consommateurs** lisant le même événement sont au contraire le cas nominal. *Le `topic` décrit
l'émetteur, le `consommateur` décrit le lecteur — et c'est le lecteur que ce marqueur qualifie.*

⛔⛔ **Un index `eventId_1` unique survivant bloquerait tout, en silence.** Mongoose **crée** les index
déclarés, il ne **retire** pas ceux qu'il ne connaît plus. Le provisionnement le fait tomber à chaque
démarrage ; la collection portant un TTL de trente jours, il n'y a rien à migrer.

⚡ **Et le consommateur de déclenchement n'utilise même pas ce marqueur** : l'idempotence est déjà
arbitrée par l'index unique de l'`Envoi`. Passer par `ProjectionTransactionnelle` aurait ouvert une
transaction **autour** de `EnvoisService.demander`, qui ouvre déjà la sienne.

### ⛔⛔ Aucun événement consommé ne porte d'identifiant de canal — et cela a décidé du modèle

Vérifié sur les trois contrats : ni `kyc.status.changed`, ni `entitlement.changed`, ni
`identity.org.*` ne transportent une adresse ou un numéro. Une source de destinataire `EVENEMENT`
n'aurait donc eu **rien à lire** — et l'écrire quand même aurait demandé un chemin d'accès
configurable (`data.contact.email`), c'est-à-dire un petit langage d'extraction rangé en base :
exactement ce qu'AD-8 refuse pour le rendu.

| source | qui | pourquoi pas autrement |
| --- | --- | --- |
| `DESTINATAIRE_FIXE` | une adresse que l'**organisation écrit elle-même** sur la règle | c'est ce qui rend « le dirigeant par e-mail » servable **sans projeter une donnée personnelle de plus** — le read-model d'identité ne porte pas l'adresse des membres, et AD-12 tient à ce qu'il ne la porte pas |
| `MEMBRES_ORGANISATION` | tous les membres actifs, en in-app | « tous » n'est pas un critère, c'est l'absence de critère (AD-19) |

⚡ La compatibilité source/canal se **dérive** de `natureDuDestinataire`. Écrite `canal === 'in-app'`,
elle aurait été juste aujourd'hui et fausse au premier canal à utilisateur suivant — et **une garde de
STORY-577 l'a refusée avant que la question ne se pose**.

### ⚡ AC-3 : deux règles, deux envois, aucun avalé

Le `regleDeclenchementId` est l'**`_id` du document de règle**. Un identifiant à part — un slug, un
compteur — aurait été une seconde identité : deux règles renommées auraient partagé une clé, et l'une
des deux aurait cessé d'envoyer sans que rien ne le dise.

⚠️ **Un refus d'une règle n'arrête pas les autres.** Le laisser remonter ferait rejouer tout
l'événement par Kafka, donc réessayer indéfiniment les règles qui, elles, ont abouti — l'idempotence
les protégerait, mais la boucle ne s'arrêterait jamais. ⛔ En revanche une erreur **technique**
remonte : l'avaler ferait avancer l'offset sur un événement que personne n'a traité.

### ⛔ Les incohérences se refusent à l'ÉCRITURE, pas au déclenchement

Une règle `DESTINATAIRE_FIXE` sans adresse, ou `MEMBRES_ORGANISATION` sur un canal qui n'atteint pas
un utilisateur : découvertes au moment de l'événement, elles n'auraient produit **aucun envoi et
aucune erreur visible**.

⚠️ **Deux règles identiques sont refusées** : elles produiraient deux `Envoi` que rien ne
distinguerait *sauf* leur `regleDeclenchementId` — le doublon serait donc *correct*, et personne ne
pourrait le refuser après coup.

⛔ **Aucune route de suppression** : supprimer une règle ferait perdre son `_id`, donc la clé
d'idempotence des envois déjà partis sous elle. On désactive.

### ⛔ AC-5 — la garde a trouvé DEUX vrais défauts en s'écrivant

1. **`code` seul est un mot ambigu.** Le motif le nommait ; il a trouvé `referentiels?: { code,
   version }` — le code d'un **référentiel**. Le premier réflexe est d'ajouter une exception, et il
   **vide la garde** : la fois suivante, un vrai secret nommé `code` passerait dessous. Le bon réflexe
   est de nommer le mot **non ambigu**.
2. **Un mot sensible est rarement seul.** Écrit `\btoken\b`, le motif exigeait une frontière de mot
   **avant** : il voyait `token:` et **pas** `verificationToken:`, parce qu'en camelCase le caractère
   précédent est une lettre. `accessToken`, `resetPasswordToken`, `contactEmail` passaient tous —
   c'est-à-dire la forme sous laquelle un secret s'écrit vraiment. *Même famille que le préfixe
   obligatoire de STORY-585, à l'autre bout du mot.*

### ⚡ Le premier droit existant qui couvre EXACTEMENT la surface ajoutée

`notification:modele:rediger` garde ces routes : une règle décide **quel modèle part sur quel
événement**, c'est le même geste éditorial que rédiger le modèle. Après six surfaces sans aucun droit
(573, 579, 584, 585, 586, 587), cela méritait d'être dit.

### ⚠️ Deux autres gardes de stories précédentes ont rougi

- **STORY-580** refusait qu'un troisième fichier nomme un topic de personne. Les règles peuvent réagir
  à `identity.membership.changed` : le fichier est **inventorié avec sa raison**, et les trois autres
  contrôles de cette garde — dont « aucun de ces fichiers ne peut atteindre le modèle `Contact` » —
  continuent de porter l'invariant.
- **STORY-587** (la mienne, la veille) a refusé la nouvelle collection `regles_declenchement`, absente
  de l'inventaire de suppression. Exactement ce pour quoi elle a été écrite.

## ⛔ Points ouverts après 588

1. **Rien n'a été éprouvé contre un vrai Kafka** : rattrapage, démarrage dégradé et absence de
   poison-pill sur cinq topics demandent la stack.
2. **`identity.user.*` reste hors des déclencheurs** : ces topics ne portent aucune organisation,
   alors qu'une règle appartient à une organisation. Un envoi de bienvenue passe donc par l'appel
   direct (AD-2), c'est-à-dire par C8.
3. **`document.*` et `paiement.*` de l'AC-1 n'ont aucun contrat au programme** : les abonner
   aujourd'hui créerait des topics vides. À rouvrir quand ces services publieront.
4. **Aucun modèle système ne correspond encore à ces événements** : une règle vers une clé inexistante
   est refusée au déclenchement, pas à la saisie — la résolution dépend de la langue et du canal, donc
   d'un contexte que l'écriture de la règle n'a pas.
