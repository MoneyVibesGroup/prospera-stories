# STORY-575 : Rendu par substitution de variables déclarées — aucune compilation d'un modèle client

Status: done  ✅ 2026-09-04 — branche `MNV-575` sur `MNV-574` de `prospera-notification-service`

**Épic :** EPIC-055 — Modèles versionnés, multilingues, et un rendu qui n'exécute rien
**Service :** `notification-service` (nouveau)
**Points :** 3 · **Sprint :** S41
**Prérequis :** **STORY-574** (modèle et ses variables déclarées)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-8, AR-09.

---

## Le fait

⛔ **C'est la story de sécurité du bloc.** FR-N12 laisse les clients écrire leurs propres modèles, et
**compiler un template lu en base est une surface d'exécution de code côté serveur**. La
recommandation universelle est de ne jamais compiler un modèle de source non fiable.

⚠️ **La frontière est à portée de main de qui voudrait « juste » compiler** : `handlebars@4.7.8` est
**déjà au dépôt**, hérité d'`auth-service`. Il reste autorisé pour les gabarits HTML **livrés avec le
code**. La frontière est l'**origine du texte**, pas sa forme.

## Critères d'acceptation

- [x] AC-1 — Le rendu d'un modèle stocké en base est une **substitution sur une liste fermée de
      variables déclarées**. Aucun helper, aucun partiel, aucune expression de bloc, aucune boucle,
      aucun accès au prototype. Le moteur **ne compile rien**.
- [x] AC-2 — ⛔ Un test refuse la compilation d'un texte venu de la base : une chaîne d'expression
      de template placée dans le corps d'un modèle client **ressort littéralement**, elle n'est
      jamais évaluée. Sans ce test, la règle n'est qu'une intention de revue.
- [x] AC-3 — `handlebars` n'est importé que par le module des **gabarits HTML système**. Un test de
      présence refuse tout import de `handlebars` depuis le chemin de rendu des modèles de base.
- [x] AC-4 — ⚡ Le **rendu d'essai** (FR-N15) emprunte un chemin qui **ne peut pas produire d'`Envoi`** :
      la fonction de rendu est **pure et partagée**, l'écriture ne l'est pas. Aucun quota consommé,
      aucune ligne au journal, aucun coût. Prouvé en comptant les documents avant et après.
- [x] AC-5 — Le rendu d'essai fonctionne **sur chaque canal** et rend le résultat sans le persister.

## Notes

⚠️ **Coût assumé, à écrire dans la documentation du module** : pas de conditionnel dans un modèle
client. Une variante se fait par **deux modèles et une règle de déclenchement** — ce qui a l'avantage
d'être visible au journal.

---

## Ce que la livraison a appris (2026-09-04)

**⚡ Le défaut n'est PAS de compiler : c'est de RELIRE sa propre sortie.** AD-8 met en garde contre
un moteur de gabarit, et cette moitié-là est facile — il suffit de ne rien importer. La substitution
qu'on écrit spontanément à la place est fausse d'une manière que nulle relecture ne montre : une
boucle « pour chaque variable, remplacer ses occurrences » **resubstitue les trous contenus dans une
valeur déjà écrite**. Si la valeur de `{{nom}}` contient les caractères `{{ville}}`, le tour suivant
les remplace. Une **donnée** de destinataire — un nom de contact, un libellé recopié d'un autre
système — devient du gabarit, et l'attaquant n'a jamais eu besoin d'écrire dans un modèle : il a
rempli un formulaire. D'où l'invariant du moteur : **un seul balayage de gauche à droite, la sortie
n'est jamais relue**. Une contre-preuve exécute l'implémentation naïve à côté de la bonne, sur la
même entrée.

**⚡ `String.prototype.replace` interprète son second argument, et c'est la donnée qui déclenche.**
`$&`, `` $` ``, `$'`, `$1` et `$$` sont des motifs de remplacement : une valeur portant `$&` —
un objet de courriel recopié, un identifiant technique — réinsère la chaîne trouvée à la place du
texte attendu. Ce n'est pas un choix de style : le moteur n'emploie aucun `replace`, et un test le
prouve en faisant échouer la version qui en emploie un.

**⚡ La table des valeurs est une `Map`, jamais un objet.** `valeurs['toString']` sur un objet
littéral rend une fonction héritée, et `String(fonction)` rend son code source. C'est la **seconde
serrure** : la première est le refus des neuf noms réservés à la déclaration (STORY-574). Une règle
de sécurité qui ne tient qu'à une serrure tient à la vigilance de celui qui la rouvrira.

**⚡ Le plafond du canal doit être REVÉRIFIÉ sur le texte rendu.** À l'écriture, il portait sur le
gabarit : `{{ref}}` y pèse sept caractères, et le corps tenait sous les 1 530 du SMS. Une valeur de
deux cents caractères fait sortir le message du plafond — c'est-à-dire produit une facture que
personne n'a relue. Le contrôle d'écriture ne peut pas le voir : il ne connaît pas les valeurs.

**⚡ Les deux moitiés d'AD-8 lisent désormais le gabarit par le MÊME balayage.** Le contrôle
d'écriture et la substitution partagent `parcourirOccurrences`. Deux balayages écrits séparément
auraient fini par diverger d'un caractère — un espace admis d'un côté, refusé de l'autre — et la
divergence se serait vue chez le destinataire, sous la forme d'un `{{nom}}` non substitué qu'aucun
test d'écriture n'aurait annoncé.

**⚠️ Le moteur ne dépend PAS de la garde d'écriture, et un test l'exige.** Un gabarit portant
`{{#if solde}}` ne peut pas entrer en base ; le test l'injecte quand même dans la collection, comme
le ferait une migration ou un correctif d'exploitation, et vérifie qu'il ressort littéral. Les deux
serrures doivent tomber pour que la règle tombe.

**⛔ AC-3 : la garde d'import était VIDE à sa première écriture, et seule la contre-preuve l'a vu.**
Le motif oubliait l'espace de `from 'handlebars'` — la forme exacte qu'on écrit. Elle balayait les
quatre-vingts fichiers du service et n'aurait jamais rien trouvé : verte en revue, inutile en fait.
C'est toute la raison d'être du test « la garde SAIT échouer ». La garde couvre aussi
`new Function`, `eval` et le module `vm` : la frontière est l'**origine du texte**, et un texte lu en
base peut devenir un programme sans aucune bibliothèque.

**⚡ Et le danger d'AC-3 est mesurable : `handlebars` est RÉSOLVABLE depuis ce dépôt sans y être
déclaré** — `ts-jest` le tire en dépendance transitive. Un import compilerait, passerait tous les
tests, et **échouerait en production** sur un module introuvable : la règle de sécurité tomberait en
développement et le service tomberait en exploitation. Une assertion vérifie que la résolution marche
encore, pour que la garde ne devienne pas une précaution sans le dire.

**⚠️ AC-3 est tenu par une garde plus LARGE que sa lettre, faute de module à excepter.** Le module
des gabarits HTML système n'existe pas encore (EPIC-056). La garde porte donc sur tout `src/`, et
l'exception devra s'écrire comme un **chemin de fichier exact** — « les fichiers de mise en page »
se serait élargi tout seul.

**⚡ AC-4 se prouve par un ÉTAT COMPLET comparé, pas par un compte de documents.** Compter aurait
laissé passer le défaut le plus probable : un `utiliseeLe` posé sur la version essayée, qui ne crée
aucun document et rend pourtant la version immuable parce que quelqu'un a cliqué sur
« prévisualiser ». S'y ajoute une garde structurelle qui extrait le corps de `rendreEssai` par
appariement d'accolades et refuse toute écriture — celle-là survivra aux scénarios qu'on oubliera
d'étendre.

**⚠️ Le jeu de valeurs est un TABLEAU de couples, pas un dictionnaire.** Un objet JSON libre aurait
été plus naturel et impossible : le pipe global (`whitelist` + `forbidNonWhitelisted`) vide toute
propriété qu'un DTO ne déclare pas, aucun **nom** n'aurait été validé, et `JSON.parse` d'un corps
portant `"__proto__"` produit une clé qu'aucune boucle `for…in` ne montre.

**⚠️ L'essai mesure les segments sur le texte RENDU** — c'est la seule différence de fond avec
`GET /modeles/resolution`, et c'est ce qui le rend utile : la valeur peut faire basculer le SMS en
UCS-2 et doubler la facture. **Prévisualiser n'exige pas le droit de rédiger** : c'est le geste de
qui prépare un envoi autant que de qui rédige.

**⛔ FR-N15 est livré à MOITIÉ, et c'est le découpage, pas un oubli.** « Prévisualiser avec un jeu de
variables, sur chaque canal, sans consommer de quota » est fait ; « remettre le rendu à un
destinataire de test » exige un adaptateur de canal, qui arrive avec EPIC-056 (STORY-577). Les cinq
AC de cette story ne demandaient aucune remise.

**⚠️ Ce que STORY-576 hérite, et qu'il vaut mieux savoir avant de l'ouvrir :** le moteur substitue
des valeurs déjà **en texte**. Le typage à l'envoi (`VARIABLE_MAL_TYPEE`) est resté à 576, et deux
des cinq types y poseront une vraie question. **`montant`** ne peut pas être formaté sans le nombre
de décimales, qu'AD-16 interdit de présumer et que seul `pays-devises-ao@AAAA.N` détient — le port
`ReferentielPaysDevises` existe déjà dans le service et **n'a aucun adaptateur avant EPIC-060**.
**`booleen`** est plus gênant encore : le rendre en mots (« oui » / « non ») demanderait une table
par langue, c'est-à-dire exactement ce que FR-N13 et la garde d'AC-6 de STORY-574 refusent — et un
booléen dans un texte n'a d'usage que conditionnel, ce qu'AD-8 exclut par principe. Les deux
appellent une **décision PO**, pas un geste de story.

**Vérification :** 1 026 tests unitaires (78 suites) + 63 e2e ; couverture 99,6 / 93,9 / 98,3 / 99,6,
seuils du moule tenus ; `npm run lint` et `npm run build` verts.
