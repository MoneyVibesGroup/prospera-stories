# STORY-604 : La passerelle de l'organisation est résolue à la remise

Status: done

**Épic :** EPIC-054 — Permissions au catalogue et cloisonnement des passerelles
**Service :** `notification-service`
**Points :** 5 · **Sprint :** S34
**Prérequis :** **STORY-572** (configuration de passerelle par organisation), **STORY-578** (files par nature)
**Origine :** revue d'architecture du 2026-09-06 · FR-N54, AR-14, AD-6.

---

## Le récit

En tant qu'**organisation cliente**, je veux que mes messages partent **de mon compte d'envoi et sous
mon expéditeur**, afin que mes clients reçoivent un message de moi et non de Prospera.

## Le fait

⛔ **La configuration existe et personne ne la lit sur le chemin d'envoi.** `STORY-572` a livré
`configurations_passerelles`, clé `(orgId, canal)`, expéditeur affiché et secrets chiffrés. Mais
`EmailSmtpAdapter` lit `ConfigService` et rien d'autre, et le **seul** consommateur de
`PasserellesService` hors de son module est `accuses.service`, pour résoudre le jeton de webhook.
Conséquence exacte aujourd'hui : le message d'une microfinance part **du relais Money Vibes, sous
l'expéditeur Money Vibes**.

⚡ **La résolution se fait à la REMISE, jamais à la demande.** Le travail est persisté dans Redis et
peut attendre. Figer la passerelle au moment de la demande ferait partir toute une file sous une
identité que l'organisation vient précisément de changer — et le défaut n'apparaîtrait que le jour
d'un changement de fournisseur, sur les messages en attente, c'est-à-dire jamais en recette.

⛔ **Le secret déchiffré n'entre JAMAIS dans la charge du travail.** `TravailRemise` porte déjà
`organizationId` : c'est **lui** qui voyage, et le déchiffrement a lieu chez l'exécutant. Un secret
dans la charge serait un secret **en clair dans Redis**, et l'invariant `aucun-secret-sur-le-bus`
de `STORY-588` en a déjà écrit le prix pour le bus.

⚠️ **L'adaptateur cesse de connaître sa configuration.** C'est le geste structurant : le port reçoit
la passerelle résolue **en paramètre**. Tant qu'un adaptateur sait aller chercher ses identifiants
tout seul, il existe un chemin par lequel il enverra sous la mauvaise identité, et aucun test ne
peut prouver le contraire.

## Critères d'acceptation

- [x] AC-1 — Le port de canal reçoit la **passerelle résolue en paramètre**. Aucun adaptateur ne lit
      `ConfigService` pour obtenir des identifiants d'envoi. Garde de balayage sur `src/adapters`.
- [x] AC-2 — La résolution part de `travail.organizationId`, qui vient du jeton signé à la demande.
      **Aucune valeur de corps de requête** n'atteint la résolution. Test.
- [x] AC-3 — ⛔ Un secret déchiffré n'apparaît dans **aucune** charge BullMQ. Garde de présence sur
      les types de `travail-remise.ts` : y ajouter un champ de secret doit faire **rougir un test**.
- [x] AC-4 — Deux organisations, deux passerelles, **la même route d'appel** : deux `from` distincts
      chez le relais. Prouvé par test, pas par lecture.
- [x] AC-5 — Une passerelle **désactivée** rend le canal indisponible **pour cette organisation
      seule** ; les autres organisations continuent d'envoyer.
- [x] AC-6 — ⚡ **`/health` reste une question de plateforme.** L'indicateur de canaux ne déclenche
      aucun appel sortant avec le secret d'une organisation — la surface est publique, et
      `STORY-249` a déjà payé cette leçon.
- [x] AC-7 — Le journal d'envoi enregistre **quelle identité a servi**, comme un fait écrit à la
      remise, jamais comme une jointure faite à la lecture (patron de `STORY-595`).

## Notes

⚠️ **Point ouvert PO / technique :** un transport SMTP par organisation se met-il en cache, ou se
crée-t-il à chaque remise ? Le cache est nécessaire à la tenue en charge et dangereux au changement
de configuration. Proposition : cache **invalidé par l'écriture** de la passerelle, jamais par un
délai.

⚠️ **Ne pas confondre `expediteur` et l'émetteur technique.** `canal.port.ts` le dit déjà :
`expediteur` est ce que le **destinataire voit** ; la passerelle est **qui envoie**. Cette story
touche les deux, et elles ne se déduisent pas l'une de l'autre.


---

## Journal de livraison (2026-09-06) — branche `MNV-604`

**Livré :** 2 343 tests unitaires (191 suites), e2e complet au vert, `tsc --noEmit` propre.

### ⚡ Le geste qui tient la story : le port reçoit, il ne cherche plus

`CanalProvider.remettre(demande, passerelle)`. Tout le reste en découle — et rien ne
l'aurait remplacé. Une garde qui interdirait à l'adaptateur de lire la configuration serait
restée une garde ; **un adaptateur qui ne reçoit plus de `ConfigService` n'a plus rien à
chercher**. Le montage du test le montre en une ligne : il n'y a plus de configuration à
simuler, parce qu'il n'y a plus rien à aller chercher.

### ⛔ Ce que la garde a dû devenir : une garde de CIBLE, pas de chemin

`identifiants-jamais-cherches.spec.ts` ne balaie pas `src/adapters/` : elle balaie les
fichiers qui écrivent `implements CanalProvider`. La différence se paiera à EPIC-063 —
le SMS, WhatsApp et le push entreront sous la garde **sans que personne ait à les y
inscrire**, alors qu'une garde par répertoire aurait dû exclure la boîte à outils BullMQ,
le chiffrement et le référentiel, qui lisent légitimement la configuration du processus.
*Une garde qui classe par répertoire finit par décrire l'arborescence au lieu de la règle.*

### ⚡⚡ AC-6 ne tient pas par une garde : il tient par un TYPE et par une SIGNATURE SYNCHRONE

`/api/v1/health` est `@Public()`. Deux mécanismes indépendants, et ni l'un ni l'autre n'est
une discipline :

1. `verifierDisponibilite` n'accepte qu'une `PasserellePlateforme`, **marquée par un symbole
   `unique`** qu'aucune valeur littérale ne peut habiter. Un seul fichier du service sait
   l'apposer, et une garde vérifie que l'inventaire des apposeurs est exactement celui-là.
   C'est le patron de `RenduDeMasse` (STORY-583), repris tel quel.
2. `plateforme(canal)` est **synchrone**. Une méthode qui ne peut pas attendre ne peut pas
   interroger Mongo, donc ne peut pas déchiffrer le secret d'une organisation. ⚡ *Un port
   asynchrone peut avoir une méthode synchrone, et c'est parfois la synchronie qui porte
   l'invariant* — même leçon qu'en `paiement-service` STORY-245.

### ⚡ Le point ouvert du cache, tranché : la clé CONTIENT ce qu'une écriture change

La fiche demandait « cache invalidé par l'écriture, jamais par un délai ». La réponse livrée
est plus forte : **il n'y a pas d'invalidation**. La `revision` d'une passerelle vaut
`org:<id>:<horodatage de mise à jour>` ; le transport SMTP est mis en cache sous cette clé.
Une écriture produit une clé neuve, donc un transport neuf, **sans que personne ait à penser
à invalider quoi que ce soit**. Un cache invalidé par un délai aurait laissé partir des
messages sous l'ancien compte pendant toute la durée du délai ; un cache invalidé par un
message aurait exigé qu'on pense à l'émettre.

⚠️ Corollaire de nommage : la révision désigne un **compte d'envoi**, pas une configuration.
Deux organisations n'en partagent jamais une, tous ceux qui se replient sur le relais de la
plateforme partagent exactement la même — donc **un seul transport pour tout le repli**. Et
c'est ce qui permet à `PasserelleResolue` de ne pas porter d'`organizationId` : l'adaptateur
n'a pas besoin de savoir pour qui il envoie, seulement avec quel compte.

### ⛔ L'expéditeur affiché a dû QUITTER la charge du travail

Il était recopié dans `TravailRemise.demande.expediteur` à l'enfilement — c'est-à-dire
**figé au moment de la demande**, précisément ce que la fiche interdit pour la passerelle.
Le défaut était déjà là, sur le seul champ d'identité qui existait, et personne ne l'avait vu
parce qu'aucun appelant ne le remplissait. *Qui envoie et ce que le destinataire voit sont
deux choses, mais elles se décident au même instant.*

### ⚡ Ce que STORY-572 n'avait pas : les réglages NON SECRETS

`configurations_passerelles` savait chiffrer des secrets pour un compte d'envoi dont
**personne ne pouvait dire où il se trouvait** : le point de terminaison venait de la
configuration du processus, donc de la plateforme. Un secret d'organisation présenté au
relais de la plateforme n'authentifie rien. D'où `reglages` (hôte, port, chiffrement du
transport), bornés en nombre, en longueur et en alphabet.

⚡ **La frontière entre `reglages` et `secrets` n'est pas la sensibilité ressentie : c'est ce
que la fuite permettrait.** Un hôte SMTP ne dit rien que le réseau ne dise déjà, et l'API le
restitue en clair ; un mot de passe permet d'envoyer sous l'identité du client, et rien ne le
restitue jamais. La dissymétrie entre `reglages` et `secretsDefinis` dans le DTO est
exactement cette phrase, écrite en types.

### ⛔ Le relais de la plateforme n'a AUCUN secret, et ce n'est pas un oubli

`verifierAbsenceDIdentifiantsSmtp` (STORY-577) fait échouer le **démarrage** si une variable
d'environnement de courriel porte un mot d'identifiant — déclarée au schéma ou non. Il était
donc impossible de donner un compte authentifié au relais de plateforme par l'environnement,
et ajouter `MAIL_USER`/`MAIL_PASSWORD` aurait cassé le boot. La contrainte s'est révélée
juste : **un compte d'envoi authentifié ne peut venir que du coffre chiffré, donc d'une
organisation.**

### ⚠️ Une garde EXISTANTE a rougi, et elle avait raison

`capacites-sont-des-donnees` (AD-6) a refusé un `if (canal !== 'email')` dans la résolution
du relais de plateforme. Elle avait raison : *ce qui dépend d'une passerelle se déclare, il
ne se code pas*. Le remède est une **table** `Partial<Record<NomCanal, RelaisDePlateforme>>`
— les quatre autres canaux n'ont pas de relais de plateforme et le disent par leur absence
de la table, pas par une comparaison.

### ⚠️ Et une garde a dû être ÉLARGIE, sous peine de ne plus protéger que son exemple

`cloisonnement-par-le-jeton` interdisait aux contrôleurs d'appeler `secretsEnClair`.
STORY-604 ajoute un **second** chemin de lecture du clair, `configurationPourRemise`, qui
déchiffre exactement les mêmes secrets. Une garde qui nomme UN chemin protège ce chemin, pas
la règle.

### Ce que la story ne fait pas

- ⛔ **Le repli sur le relais de plateforme n'est pas encore NOMMÉ ni désactivable** : ici il
  se produit silencieusement quand aucune configuration n'existe, et l'identité employée est
  écrite au journal. Distinguer *rien n'est configuré* de *ce qui est configuré ne répond
  pas* est **STORY-605**, et c'est là que le repli devient refusable par organisation.
- ⚠️ **Une passerelle enregistrée n'est pas vérifiée** : rien n'éprouve qu'elle fonctionne au
  moment de l'enregistrement. C'est **STORY-614**.
- ⚠️ `identiteEnvoi` est **optionnel** sur `Envoi` et sur l'entrée d'audit : les documents
  écrits avant cette story n'en portent pas, et une base de preuves ne se rattrape pas.
