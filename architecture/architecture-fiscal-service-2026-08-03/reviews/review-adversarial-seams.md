# Revue adverse — deux unités conformes qui construisent quand même incompatible

Lentille imposée par `finalize_reviewers` : construire des paires d'unités qui respectent **tous** les AD
à la lettre et divergent malgré tout. Chaque paire trouvée est un trou à fermer.

---

## S1 — Personne ne possède le déclenchement de la dérivation

**critical**

AD-8 dit que l'obligation est matérialisée et re-dérivable de façon déterministe. Il ne dit ni **qui**
déclenche la dérivation, ni **quand**, ni ce qui la rend idempotente.

Construction : l'unité *Calendrier* dérive les obligations à l'ouverture d'une période. L'unité
*Déclaration* les dérive à l'arrivée d'une balance validée. Les deux respectent AD-8 mot pour mot. Selon
l'ordre réel des événements, on obtient soit **des obligations en double** pour la même période, soit
**aucune** parce que chacune suppose que l'autre l'a faite. Ajoutez une troisième cause de dérivation
— la publication d'une nouvelle version de paquet (AD-5) — et la divergence est certaine.

**Correctif :** un AD nommant le propriétaire unique de la dérivation, ses trois déclencheurs légitimes
(création ou modification d'implantation, publication de paquet, ouverture de période) et sa clé
d'idempotence `(implantation, taxe, période)` en index unique.

---

## S2 — Le chaînage d'empreintes n'a pas de politique de concurrence

**critical**

AD-10 impose que chaque entrée d'audit porte l'empreinte de la précédente. Il ne dit pas **de quelle
précédente**, ni comment deux écritures simultanées se sérialisent.

Construction : l'unité *Workflow* écrit son audit en prenant l'empreinte de la dernière entrée globale.
L'unité *Règlement* fait pareil. Deux transitions concurrentes sur deux dossiers différents lisent la
même « dernière entrée » et écrivent deux successeurs du même maillon — la chaîne fourche, et la preuve
qu'elle devait apporter ne vaut plus rien. La parade naïve (un verrou global) transforme le journal en
goulet d'étranglement de tout le service.

**Correctif :** chaîner **par périmètre** et non globalement — une chaîne par obligation — avec un
numéro de séquence et un index unique `(perimetre, seq)`. Deux dossiers n'entrent alors jamais en
concurrence, et l'insertion concurrente sur un même périmètre échoue proprement au lieu de forker.

---

## S3 — Le port de canal peut être implémenté synchrone ou asynchrone

**high**

AD-12 pose qu'un canal est un adaptateur derrière un port unique, et que le dépôt assisté et un futur
connecteur automatisé sont deux implémentations du même port.

Construction : l'adaptateur *assisté* ne peut **pas** rendre l'accusé dans l'appel — il est saisi ou
téléversé par un humain, plus tard, parfois le lendemain. Un adaptateur *connecteur* rendrait
naturellement l'accusé dans la foulée. Si la forme du port n'est pas fixée, le premier builder l'écrit
synchrone et le second ne rentre pas dedans — ou l'inverse, et on force un connecteur à faire du
polling artificiel.

**Correctif :** fixer la forme du port comme **asynchrone par nature** : déposer rend un identifiant de
dépôt, l'accusé arrive comme un fait séparé. Le connecteur automatisé produira ce fait immédiatement,
l'assisté quand l'humain le fournira.

---

## S4 — « Montant saisi » n'a pas de domicile

**medium**

AD-4 impose qu'une famille sans stratégie produise une obligation à montant saisi. Rien ne dit où ce
montant vit.

Construction : une unité le pose sur l'obligation (c'est elle qui porte le statut), une autre sur la
déclaration (c'est elle qui porte les montants, AD-9). Les deux sont défendables ; le dossier de
contrôle rendra deux formes différentes selon la taxe.

**Correctif :** trancher — le montant, saisi ou calculé, appartient toujours à la déclaration ; le seul
état porté par l'obligation est celui de son avancement.

---

## S5 — Les codes d'erreur n'ont pas de statut HTTP associé

**medium**

Les conventions listent des codes nommés stables mais laissent la correspondance HTTP libre.

Construction : une unité rend `409` sur `OBLIGATION_CLOTUREE`, une autre `422`. Le frontend écrit deux
traitements pour la même situation, puis un troisième « au cas où ».

**Correctif :** une ligne de convention fixant la correspondance code → statut.

---

## S6 — Rien ne gouverne le travail planifié

**high**

Le calendrier alerte sur les échéances à risque (FR-F19) et les obligations se dérivent période après
période. C'est du travail récurrent. La pile héritée mentionne Redis/BullMQ, mais aucun AD ni aucune
convention ne parle d'ordonnancement.

Construction : une unité programme ses alertes avec un `setInterval` en mémoire, une autre avec une file
BullMQ. En deux répliques, la première envoie tout en double et perd tout au redémarrage.

**Correctif :** nommer l'ordonnanceur et la règle — tout travail récurrent passe par la file partagée,
avec une clé de travail idempotente ; aucun ordonnancement en mémoire de processus.
