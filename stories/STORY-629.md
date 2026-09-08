# STORY-629 : Recette de bout en bout du rail notification

Status: done

**Épic :** EPIC-064 — La conversation dans les deux sens
**Service :** `notification-service`
**Points :** 5 · **Sprint :** S37
**Prérequis :** l'ensemble du bloc B4 · 🏁 **Clôture du rail B**

---

## Le récit

En tant qu'**équipe**, je veux une recette qui traverse le service de la configuration d'une
passerelle jusqu'à l'accusé de réception, afin de savoir que le rail tient sans le rail A.

## Critères d'acceptation

- [x] AC-1 — Deux organisations, deux passerelles, deux expéditeurs différents sur la même route.
- [x] AC-2 — Un message part, un accusé revient, le journal le montre.
- [x] AC-3 — Une réponse entrante est rattachée et le statut d'origine passe à **répondu**.
- [x] AC-4 — Un « STOP » ferme la masse et laisse passer le transactionnel.
- [x] AC-5 — ⛔ Aucun code conditionnel `si production` sur ce chemin.

---

## Ce que la livraison a appris (2026-09-07)

**Branche :** `MNV-629`, empilée sur `MNV-612`.

### ⛔⛔ La recette a trouvé DEUX suites e2e cassées, et par mes propres stories

C'est le résultat le plus utile de cette story, et il est arrivé au moment où elle se validait.
Deux montages de bout en bout refusaient de démarrer :

| suite | ce qui manquait | posé par |
|---|---|---|
| `envois.e2e-spec.ts` | le port de résolution de passerelle | **STORY-624** |
| `modeles.e2e-spec.ts` | le service de marque | **STORY-617** |

66 tests, morts depuis plusieurs jours, et **aucune des deux stories ne pouvait s'en apercevoir**.

⚡⚡ **Une dépendance ajoutée à un service casse tout montage qui le construit — et la suite unitaire
ne le voit PAS, parce qu'elle construit le service à la main.** Un test unitaire appelle
`new EnvoisService(a, b, c…)` : ajouter un paramètre y produit une erreur de compilation qu'on
corrige dans la foulée, sur le fichier qu'on a sous les yeux. Un montage Nest, lui, résout par
injection — et il échoue **à l'exécution**, dans un fichier qu'on n'a pas ouvert.

⛔ **Et ces deux stories avaient été déclarées livrées, lint vert et suite unitaire verte.** Elles
l'étaient : leur propre périmètre tenait. Ce qui manquait n'était pas un test, c'était **la
commande** — `npm test` ne lance pas les e2e, et personne ne les lançait.

### ⚡⚡ Le seul maillon du rail qui n'est pas une requête HTTP

La première version de la recette enchaînait trois requêtes — demande, accusé, journal — et l'accusé
n'avançait rien. La cause n'est pas un défaut : **entre la demande et l'accusé, il y a la remise**,
et elle vit dans un exécutant BullMQ. C'est là que l'identité d'envoi se fige (STORY-604) et que la
passerelle rend sa référence — celle-là même que l'accusé cite ensuite.

⛔ **Écrire `referenceExterne` à la main dans la collection aurait fait sauter exactement la jointure
que la recette existe pour éprouver.** Le vrai `JournalRemiseService` est donc monté et appelé : la
recette parle HTTP partout où le rail parle HTTP, et emprunte le service réel là où le rail passe
par une file.

### ⚡⚡ Le même verbe Mongo rend DEUX formes selon ses options

`findOneAndUpdate` renvoie une enveloppe `{ value, lastErrorObject }` avec
`includeResultMetadata` — c'est ce que lit la demande d'envoi, pour savoir si elle a **créé** ou
**retrouvé**. Sans l'option, il renvoie le **document** — c'est ce que lit la remise.

Un double qui n'en connaît qu'une casse l'autre appelant, avec une erreur qui ne dit rien de sa
cause : *« Cannot read properties of undefined »*. ⚠️ **C'est la neuvième fois dans ce service qu'un
double de collection incomplet coûte une enquête**, et la première où les deux formes viennent du
même verbe.

### ⚡ AC-1 est le défaut de STORY-604, et il ne se voit qu'ici

Deux organisations, deux passerelles, la même route, deux expéditeurs. Chaque service pris seul était
juste ; c'est la **jointure** qui envoyait le courrier d'une microfinance sous l'identité de Money
Vibes. Un double qui rendrait la même passerelle pour les deux organisations ferait passer ce défaut
précis pour corrigé — la recette le vérifie donc sur la révision aussi : deux organisations qui
partageraient une révision partageraient un transport en cache, donc un jour un expéditeur.

### ⚡⚡ AC-5 : ce n'est pas le `si production` qui est interdit, c'est sa DIRECTION

Un `if` qui **relâche hors production** laisse la production sur le chemin par défaut — celui que
tout le monde emprunte, donc celui que tout le monde éprouve. Un `if` qui **renforce en production**
fabrique l'inverse : un chemin que rien n'exécute avant le jour J, et qui s'exécute pour la première
fois chez le client.

Le service en compte **un**, dans son amorçage, et il va dans le bon sens : il retire une directive
de politique de sécurité hors production pour que la documentation d'API reste lisible en HTTP clair.
La production, elle, reste sur le comportement par défaut.

⚠️⚠️ **Et la garde a rougi sur un fichier qui affirmait la règle.** Le commentaire de l'adaptateur
e-mail dit fièrement *« aucun `si production` ici »* — la garde l'a compté comme coupable. **Une
garde qui lit ses propres commentaires punit ceux qui documentent** : le piège est payé pour la
troisième fois dans ce programme, et cette fois il est désamorcé (les commentaires sont dépouillés
avant l'examen) plutôt que contourné.

### ⚠️ Ce que la recette a confirmé sans effort

Trois choses n'ont demandé aucune ligne, et c'est le signe que les stories précédentes ont tenu :

1. **Un accusé mal signé n'écrit rien**, et le journal ne bouge pas — la signature est vérifiée avant
   toute persistance, sur les octets bruts.
2. **Une réponse sans contexte est conservée et ne se dit pas rattachée** — et sans destination
   déclarée, rien ne part sur le bus.
3. **Après un « STOP », un envoi transactionnel passe toujours.** La portée `MASSE` ne couvre que la
   nature `MASSE` : le code de vérification n'est jamais coupé, sans qu'aucune ligne ne le dise.

### ⛔ Points ouverts légués

1. **`npm test` ne lance pas les e2e, et rien ne les lance.** C'est la cause racine des 66 tests
   morts. Tant qu'une commande unique ne fait pas les deux — ou qu'une CI ne les impose pas — le
   même défaut reviendra, et la prochaine fois il ne sera pas trouvé par une story de recette.
2. **Ni Mongo, ni Kafka, ni Redis, ni IdP.** La recette monte les vrais services sur des doubles de
   collection. Ce qu'elle ne prouve pas : les index uniques réels, les transactions réelles, l'ordre
   de partition Kafka. Cela demande une recette d'intégration sur conteneurs, et c'est une autre
   story.
3. **Le rail A n'est pas traversé.** Un lien de paiement réel, la marque sur le premier message d'un
   utilisateur, et de vrais faits d'abonnement dans la cloche restent hors d'atteinte — c'est ce que
   le tableau « ce que le rail B ne peut pas prouver seul » annonçait.
