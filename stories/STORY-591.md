# STORY-591 : Liste : sélection, import ou remise par un module — jamais construite ici

Status: done

**Épic :** EPIC-061 — Envoi de masse : listes, lots avec reprise et garde-fous
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S43
**Prérequis :** **STORY-573** (carnet)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-19.

**Livrée le 2026-09-06** — branche `MNV-591` de `prospera-notification-service`, sur `origin/dev`.
2 007 tests unitaires (165 suites) + 172 e2e ; lint et types propres.

⚠️ **Le sprint 43 est tiré en avance** : le sprint 42 est à 28/36 et ses deux dernières stories (589,
590) sont **suspendues à C8**. EPIC-061 est le seul travail disponible qui ne dépende d'aucune
décision programme.

---

## Le fait

⛔ **La dérive la plus probable du service commence ici**, et le PRD la nomme lui-même comme une
frontière mince. Une liste remise par un module appelant est **exécutée** ici ; elle n'est pas
**construite** ici.

## Critères d'acceptation

- [x] AC-1 — Une `Liste` est un ensemble **nommé** de contacts, constitué par sélection, par import,
      ou **remis par un module appelant** (FR-N28).
- [x] AC-2 — ⛔ **Aucun critère de segmentation métier n'entre dans le modèle de données.** Un test de
      schéma refuse tout champ de critère ou de requête stockée sur `Liste`.
- [x] AC-3 — Une liste est cloisonnée à son organisation et ne référence que des contacts de celle-ci.
- [x] AC-4 — Une liste est **alimentable après création**.

## Notes

- Le nom du domaine est `EnvoiDeMasse`, **jamais « campagne »**. ✅ Une garde du module le vérifie.

---

## Ce que la livraison a appris

### ⛔ La frontière est tenue par l'ABSENCE d'endroit où écrire, pas par une revue

Elle n'arrivera pas par malveillance : elle arrivera parce qu'un client demandera « juste un filtre »,
que les données seront déjà là, et que ce sera une journée de travail.

⚡ **La nuance n'est pas la sensibilité du mot, c'est la RÉÉVALUATION.** Un `nom` et une `description`
**décrivent** la liste ; un `filtre` la **redéfinit** à chaque lecture — donc elle change sans que
personne ne la touche, et l'instantané de STORY-592, qui existe pour rendre la reprise prouvable,
cesse de vouloir dire quelque chose.

Deux moitiés tiennent AC-2, et il fallait les deux : une **garde de schéma** (les modèles et les DTO)
et la **frontière HTTP** elle-même — `forbidNonWhitelisted` fait qu'un `filtre` posté est rejeté avant
d'atteindre quoi que ce soit.

⛔ **`requete` seul a dû sortir des mots interdits — deuxième mot ambigu en deux stories.** Il a trouvé
`@Query() requete: ConsulterMembresQuery`, la **chaîne de requête HTTP**. Comme `code` en STORY-588 :
le premier réflexe est d'ajouter une exception, et il **vide la garde** ; le bon réflexe est de nommer
la forme non ambiguë (`requeteStockee`, `requeteDeSelection`).

### ⛔ L'appartenance vit dans une collection à part

Un tableau de `contactIds` aurait plafonné à seize mégaoctets — quelques dizaines de milliers de
contacts, c'est-à-dire exactement la taille d'un envoi de masse — et chaque ajout aurait réécrit le
document entier. AC-4 exige qu'une liste soit alimentable après création.

⚡ **L'index unique `(listeId, contactId)` EST l'idempotence de l'alimentation.** Double clic, import
repassé, module qui remet sa liste après un incident : `insertMany(ordered: false)` se heurte à
l'index sur les lignes déjà présentes et insère les autres. Sans lui, un envoi de masse aurait servi
deux fois la même personne, et le journal l'aurait dit *après*.

⚡ **Deux comptages encadrent l'insertion plutôt que de lire `insertedCount`.** Sur une écriture en
bloc partiellement refusée, ce compteur voyage dans la **forme d'erreur du pilote** — une propriété
non contractuelle, qui a déjà changé de place entre deux versions.

### ⚡ AC-3 tient par une LECTURE, et un refus ligne par ligne

Un contact d'une organisation voisine n'est pas « interdit », il est **introuvable** — la même réponse
que pour un identifiant qui n'a jamais existé, sans quoi l'alimentation d'une liste deviendrait un
moyen de tester l'existence d'un contact chez un concurrent.

⚠️ **Un identifiant refusé ne fait pas échouer le lot** : rejeter cent mille lignes pour un contact
effacé entre-temps (FR-N51) rendrait l'alimentation impossible en pratique.

⛔ **Le carnet n'est jamais écrit depuis ici** : un identifiant inconnu est refusé, pas fabriqué. Sans
cette règle, alimenter une liste serait devenu une seconde porte d'entrée du carnet — sans
dédoublonnage, sans normalisation d'identifiant (AD-11) et sans consentement.

### ⚡ Le droit qui garde ces routes, et celui qui ne les ouvre pas

`notification:envoi-de-masse:executer`. ⚠️ Cela ne dilue **pas** la séparation d'AD-18 — un test montre
que le droit de **valider** n'ouvre pas la surface : détenir une liste ne veut jamais dire la faire
partir (STORY-594).

### ⛔ Piège d'outillage : les plafonds de corps ont quitté `main.ts`

Importer `TAILLE_MAX_CORPS_JSON` depuis `main.ts` **démarrait l'application entière** — le fichier
appelle son `bootstrap()` au chargement, donc le test qui voulait la valeur ouvrait des connexions et
sortait en `process.exit(1)`. *Une constante qu'on ne peut pas lire sans booter le service est une
constante que personne ne réutilise — et qu'on finit par recopier.* Elle vit désormais dans
`config/tailles-corps.ts`, et **une garde de STORY-579 a rougi au déplacement**, puis l'a suivie.

⚠️ Le test du plafond de lot l'a montré autrement : sans la limite posée dans le harnais e2e, cinq
mille identifiants (~130 ko) dépassent le défaut d'Express (100 ko) et sont refusés **avant** que le
DTO ne parle. Le test aurait mesuré une borne d'infrastructure en croyant mesurer une borne métier.

## ⛔ Points ouverts après 591

1. **Aucune route ne retire un contact d'une liste** : la suppression d'un membre n'est demandée par
   aucun AC, et elle interagit avec l'instantané de STORY-592 — retirer quelqu'un d'une liste après la
   préparation ne doit **pas** le retirer de l'envoi en cours. À trancher avec 592.
2. **`nombreDeMembres` est un compteur, pas une source de vérité** : la vérité est le nombre de
   documents de `MembreListe`. L'instantané ne le lira jamais — il comptera ce qu'il a figé.
3. **Aucun droit ne distingue « constituer une liste » de « l'exécuter »** — c'est le même que celui
   d'exécuter, et c'est assumé ; le droit de valider, lui, reste distinct.
