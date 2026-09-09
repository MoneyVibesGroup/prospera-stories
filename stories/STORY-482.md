# STORY-482 : Une trésorerie négative n'est ni nommée, ni financée : portée à l'actif, sans découvert, sans agios, sans besoin chiffré

Status: done

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-036** (projection 3 ans, trésorerie 12 mois, scénarios comparés), 2026-08-27.
Relevé en lisant le bilan prévisionnel simplifié d'un exercice déficitaire en trésorerie, puis en cherchant le besoin de financement à l'écran.

---

## Le fait

Trois manques qui n'en font qu'un : le modèle sait produire une trésorerie négative, et ne sait rien
en dire.

**① Elle est portée à l'actif.** `BilanSimplifiePrevisionnel.tresorerieNette` reçoit
`tresorerieCloture` telle quelle, et `totalActif = actifImmobiliseNet + bfr + tresorerieNette`. Un
solde de −804 945 est donc un **emploi négatif**. Comptablement, un découvert est une **ressource au
passif** (concours bancaires courants). L'équilibre reste arithmétiquement vrai — l'écart vaut 0 par
construction — mais **la lecture est fausse**, et c'est un bilan qu'on remet à un banquier.

**② Il n'y a ni découvert, ni agios.** Six mois dans le rouge en N+1 sur le dossier de démonstration,
et **aucune charge financière**. Un découvert coûte, et son coût creuse le découvert.

**③ Le besoin de financement n'est chiffré nulle part.** C'est pourtant le chiffre pour lequel on
ouvre l'écran : **804 945** à couvrir sur N+1, **4 092 714** sur l'horizon. Il est dérivable en une
ligne (`−min(clôtures)`), la maquette le calcule elle-même — mais aucun champ du contrat ne le porte,
donc chaque client le recalculera à sa façon.

## Critères d'acceptation

- [ ] AC-1 — Le bilan prévisionnel simplifié sépare `tresorerieActive` (≥ 0, à l'actif) et
      `concoursBancaires` (≥ 0, au passif) — jamais un montant négatif à l'actif.
- [ ] AC-2 — Le contrôle d'équilibre est **maintenu** : `ecart === 0` après la ventilation, arrondis
      compris. Un test le vérifie sur un exercice à trésorerie négative — le cas que le modèle
      produit aujourd'hui sans le traiter.
- [ ] AC-3 — Une hypothèse de **taux de découvert** (`tauxDecouvertPct`, défaut 0) génère une charge
      financière décaissée, publiée comme ligne du plan de trésorerie.
- [ ] AC-4 — La réponse porte `besoinFinancement: { maximal, moisMaximal, surHorizon }` — annuel et
      mensuel. Un besoin de financement calculé par chaque client est un besoin de financement
      différent chez chacun.
- [ ] AC-5 — `MODELE_PROJECTION_VERSION` évolue.

---

## Arbitrages de cadrage (2026-09-08, avant la première ligne)

⚡⚡ **La fiche a été rédigée le 2026-08-27 ; STORY-467 a été clôturée le 2026-09-07.** Elle a livré
une partie de l'AC-3 : `coutDeDecouvert` chiffre déjà l'agio quand la clôture est négative
(`projection/charges-financieres.ts`), le montant entre au compte de résultat via
`ChargesFinancieresExercice`, et le plan mensuel le **décaisse** déjà sous
`decaissementsChargesFinancieres`. Ce qui reste de l'AC-3 est donc le **taux distinct**, que
D-467-6 nommait explicitement hors périmètre. Le reste des AC est intact.

**D-482-1 — la ventilation, et pourquoi l'équilibre tient.** `tresorerieActive = max(0, clôture)`,
`concoursBancaires = max(0, −clôture)`. `totalActif` prend `tresorerieActive`, `totalPassif` prend
`concoursBancaires` en plus des ressources. L'écart reste **nul par construction** parce que
`max(0, T) − max(0, −T) = T` pour tout `T` : la ventilation déplace le même montant d'un côté à
l'autre, elle n'en crée aucun. Les deux montants sont **entiers** (la clôture l'est déjà), donc
aucun arrondi ne s'y glisse — AC-2 sans condition d'arrondi.

**D-482-2 — `tresorerieNette` reste publié, et ce n'est pas de la compatibilité molle.** Il vaut
`tresorerieActive − concoursBancaires`, c'est-à-dire la position nette, qui est une information
distincte des deux lignes de bilan et que le plan de trésorerie porte déjà. Le retirer casserait
des lecteurs sans rien gagner ; le garder **sans** les deux nouvelles lignes est ce que la story
refuse. Sa description dit désormais qu'il n'est **pas** une ligne d'actif.

**D-482-3 — `tauxDecouvertPct` est FACULTATIF, et absent il vaut `tauxInteretPct` — PAS `0`.**
⛔ La fiche écrit « défaut 0 » ; c'était le comportement en place **le 2026-08-27**, quand aucun coût
de découvert n'existait. Depuis le 2026-09-07 le découvert est facturé au taux de l'emprunt, et
vérifié en docker (3 475 633 sur une clôture à −46 921 051). Appliquer « défaut 0 » à la lettre
**retirerait ce coût à tous les jeux déjà enregistrés** : une régression silencieuse d'une story
clôturée la veille. ⛔ Et le motif de D-467-1 vaut ici mot pour mot : un défaut à 0 affirmerait que
**le découvert ne coûte rien**, alors qu'un découvert coûte toujours, et en pratique plus cher qu'un
emprunt. Le repli sur `tauxInteretPct` est un **défaut sourcé** — le patron de la surcharge de TVA
(D-469) —, pas une valeur inventée. Aucun jeu antérieur n'est refusé de plus : le champ est
facultatif, donc `exigerFormeCourante` ne s'y ajoute pas.

**D-482-4 — `besoinFinancement`, une seule forme sur les deux routes, deux mailles.**
- `maximal` — le creux le plus profond **à la maille de la réponse** : `max(0, −min(clôtures))` sur
  les douze mois de l'exercice demandé (route mensuelle) ou sur les trois clôtures annuelles (route
  annuelle).
- `surHorizon` — le creux le plus profond de **l'horizon entier**, mesuré sur les clôtures
  **annuelles**. Identique sur les deux routes, donc jamais deux chiffres pour la même question :
  sur la route mensuelle, c'est lui qui dit que le creux de l'exercice consulté n'est pas forcément
  le pire de l'horizon.
- `moisMaximal` — le rang du mois, **sur l'horizon (1..36)**, où survient `maximal`. `0` quand
  `maximal` est nul, la convention d'absence de `moisTresorerieMinimale`. Sur la route annuelle la
  maille est l'exercice : son creux est daté du **dernier mois** de celui-ci (12, 24 ou 36), qui est
  bien le mois dont la clôture a été mesurée.
- ⛔⛔ **`surHorizon` est un MINORANT, et le contrat le dit.** Le mesurer à la maille mensuelle
  exigerait que le moteur **annuel** projette les trente-six mois, c'est-à-dire qu'il dépende du
  moteur **mensuel**, qui dépend déjà de lui : la dépendance ne peut pas s'inverser. Le vrai creux
  mensuel se lit donc sous `maximal` de la route mensuelle, un exercice à la fois. ⚡⚡ **Mesuré** :
  sur un jeu à 120 jours de délai clients et sans trésorerie de départ, les trois clôtures annuelles
  sont positives — 10 000 000, 20 000 000, 30 000 000 — donc la route annuelle annonce
  `surHorizon: 0`, *« aucun besoin »*, pendant que l'entreprise est à **−3 333 337 au mois 4**. C'est
  le défaut que STORY-481 avait nommé, et la raison d'être de la distinction entre les deux champs.
  Publié, jamais tu — même traitement que `dettesBaseNonPortees` (D-467-3).

**D-482-5 — `MODELE_PROJECTION_VERSION` : mineure.** Des champs s'ajoutent et un montant change
(`totalActif` d'un exercice à trésorerie négative), mais aucun champ ne disparaît et aucune saisie ne
devient requise.

**D-482-6 — les trois délais de BFR rejoignent `exigerFormeCourante`, et c'est une conséquence, pas
un débordement.** ⚡⚡ Découvert **par un test qui a rougi** : `anteriorite.spec.ts` plantait un
`delaiBfrClientsJours: NaN` pour éprouver le repli d'apurement, « sans lever ». Or ce `NaN` corrompt
le BFR, donc la trésorerie, donc **les douze clôtures mensuelles et les trois clôtures annuelles** —
et la réponse partait en **HTTP 200 avec tous les montants à `null`**, quatrième occurrence exacte du
piège de STORY-457/459/467. Le besoin de financement ne peut pas être chiffré là-dessus : le moteur
**lève** plutôt que de publier `0`, c'est-à-dire *« aucun besoin »* sur un scénario qui n'a rien
calculé — l'erreur faussement rassurante que la revue de sécurité de STORY-457 avait relevée sur
`moisTresorerieMinimale`. Sans la garde, ce refus légitime remonterait en **500 anonyme** ; avec
elle, c'est un **422 qui nomme le champ**. ⚠️ Aucun jeu enregistré n'est refusé de plus : les trois
délais existent depuis l'origine du schéma, sont requis au DTO et bornés `[0, 365]` — seule une
écriture **hors DTO** peut y planter autre chose. À confirmer sur les jeux réels en vérification
docker.

### Hors périmètre, nommé

- La **boucle** agio → résultat → trésorerie → agio reste à **une itération** (D-467-5) : le taux de
  découvert change la valeur du plafond publié, pas la méthode.
- Le **découvert n'est pas plafonné** : aucun modèle d'autorisation bancaire n'est saisi. Un
  `concoursBancaires` de plusieurs millions est publié tel quel, sans dire s'il serait accordé.

## Conséquences ailleurs

- **STORY-467** (aucune charge d'intérêt sur les emprunts) et l'AC-3 relèvent du même mécanisme :
  les traiter ensemble, sinon le modèle facturera le découvert et pas l'emprunt.
  ✅ **Traité** : 467 est clôturée depuis le 2026-09-07, le mécanisme est en place, et cette story n'y
  ajoute que le taux distinct (D-482-3).


---

## Progress Tracking

### Développement (2026-09-08 → 2026-09-09)

Branches `MNV-482` créées **avant la première ligne** sur `bilan-service` (base `dev`) et `docs` (base `main`).

**Livré, AC par AC.**

- **AC-1** — `ventilerTresorerie` (unité pure) rend `tresorerieActive = max(0, clôture)` et
  `concoursBancaires = max(0, −clôture)`. `totalActif` prend la première, `totalPassif` la seconde. Le
  signe a cessé d'être une donnée : il est devenu le **choix du côté**, ce qui rend le montant négatif à
  l'actif structurellement impossible.
- **AC-2** — l'écart reste nul **par identité** : `max(0, T) − max(0, −T) = T`, donc les deux totaux
  bougent du même montant et aucune division n'intervient. Éprouvé sur un exercice à découvert en
  unitaire, en e2e et en docker.
- **AC-3** — `tauxDecouvertPct` facultatif ; absent il vaut `tauxInteretPct` (D-482-3). Publié à côté de
  `tauxPct` dans `ChargesFinancieresExercice` pour que le bloc reste recomposable dès qu'un jeu dissocie
  les deux. ⚠️ Le reste de l'AC-3 — la charge décaissée, publiée comme ligne du plan de trésorerie —
  était **déjà livré par STORY-467** sous `decaissementsChargesFinancieres` : rien à refaire.
- **AC-4** — `besoinFinancement` à la racine des deux réponses, une seule forme, une seule unité pure.
- **AC-5** — `MODELE_PROJECTION_VERSION` : `1.11.0` → `1.12.0`.

**Portes de qualité.** Lint 0 warning · build OK · **2 454 unitaires** + **768 e2e** verts · couverture
**99,06 / 95,07 / 99,33 / 99,12** pour des seuils de 65/90/90/90 · `besoin-financement.ts` à 100 % sur
les quatre axes.

### Table de mutations — 15 sur 15 ROUGES

⚠️⚠️ **La table m'a menti au premier tour, et la leçon vaut d'être écrite.** Trois mutations sortaient
« vertes » alors qu'elles **ne compilaient pas** (`TS6133` : une variable devenue inutilisée). Ma boucle
lisait la ligne `Tests:` et n'y trouvait pas le mot `failed` — mais elle disait `Tests: 0 total`. **Une
suite qui ne tourne pas ne prouve rien**, ni dans un sens ni dans l'autre. Rejouées en gardant le code
compilable (`offsetMois * 0 + …`, `MOIS_PAR_EXERCICE * 0 + 1`, `||` → `&&`), les trois sont rouges.

| # | Mutation | Verdict |
|---|---|---|
| M1 | `ventilerTresorerie` inverse les deux côtés | ROUGE (13) |
| M2 | `totalActif` reprend la clôture signée — l'état d'avant la story | ROUGE (5) |
| M3 | `totalPassif` oublie les concours bancaires | ROUGE (4) |
| M4 | `??` devient `||` : un `tauxDecouvertPct: 0` saisi est écrasé | ROUGE (1) |
| M5 | le défaut redevient `0`, à la lettre de la fiche | ROUGE (7) |
| M6 | `moisMaximal` perd sa convention d'absence | ROUGE (1) |
| M7 | `moisMaximal` perd son offset d'horizon | ROUGE (3) |
| M8 | à profondeur égale, le **dernier** rang gagne | ROUGE (2) |
| M9 | la série corrompue rend `0` au lieu de lever | ROUGE (4) |
| M10 | `surHorizon` dérivé du seul exercice servi | ROUGE (1) |
| M11 | la maille annuelle se date au mois 1, 2, 3 | ROUGE (1) |
| M12 | la garde des délais de BFR est retirée | ROUGE (6) |
| M13 | l'export imprime la position nette à l'actif | ROUGE (2) |
| M14 | la mention du découvert redit « au même taux » | ROUGE (1) |
| M15 | la métadonnée de besoin annonce toujours « Aucun » | ROUGE (1) |

⚡⚡ **M13 et M14 étaient de VRAIS trous**, et seuls dans la pièce remise au banquier. L'export pouvait
réimprimer la position nette **négative** sous le libellé « Trésorerie active » — le défaut exact que la
story ferme — et la mention des charges financières pouvait redire « au même taux », une phrase
**imprimée** devenue fausse dès qu'un jeu dissocie les deux taux. Les 41 tests du module restaient
VERTS : la fixture du fichier clôture en positif, donc rien ne discriminait. Deux blocs de tests
construisent désormais un exercice **à découvert**, le seul état qui mesure.

### Vérification docker — sur les données réellement persistées

Stack relancée (`mongo`, `bilan-service`). ⚠️ **Version servie confirmée AVANT de conclure** : le
conteneur annonce `MODELE_PROJECTION_VERSION = 1.12.0`, donc le code de la branche est bien celui qui
tourne — le piège relevé en clôturant STORY-467.

**① D-482-6 mesurée, pas supposée.** Sur **52 jeux** et **14 versions** persistés, la nouvelle garde des
délais de BFR en refuse **0**. La revendication « aucun jeu enregistré n'est refusé de plus » est donc
mesurée. (25 des 52 restent refusés par la garde de STORY-467, ce qui est son comportement attendu et
inchangé.)

**② D-482-3 mesurée.** **0 jeu sur 52** porte `tauxDecouvertPct` : tous retombent sur `tauxInteretPct`,
donc le coût de découvert livré par STORY-467 est préservé partout. Un défaut à `0`, à la lettre de la
fiche, l'aurait retiré aux 27 jeux projetables.

**③ Le moteur réel, sur les 27 jeux projetables et leurs snapshots réels — 81 exercices :**

| Mesure | Résultat |
|---|---|
| exercices dont `controle.ecart !== 0` ou dont `totalActif` ne se recompose pas | **0** |
| exercices publiant un montant négatif à l'actif ou au passif | **0** |
| exercices réellement **à découvert** | **5** |

Les 5 exercices à découvert, tous avec `tresorerieActive = 0`, `tresorerieNette` négative et
`ecart = 0` :

| jeu | taux emprunt | taux découvert | découvert | coût |
|---|---|---|---|---|
| `v467-decouvert` | 8 | 8 | 46 772 551 | 3 464 633 |
| `v467-decouvert` | 8 | 8 | 102 504 160 | 7 592 901 |
| `v467-decouvert` | 8 | 8 | 162 493 277 | 12 036 539 |
| `472-structure` | 0 | 0 | 3 503 174 | 0 |
| `472-structure` | 0 | 0 | 7 542 261 | 0 |

⛔ Les deux exercices à coût nul ne sont **pas** une régression : `472-structure` saisit
`tauxInteretPct: 0`, et `??` fait gagner ce `0` — c'est précisément ce que M4 garde.

**⚠️ Deux limites de cette vérification, nommées plutôt que tues.**

1. **La sonde applique `SANS_IMPOT`**, là où la route résout le paquet fiscal du référentiel. Les
   montants ci-dessus ne sont donc pas au centime ceux de la route ; les **invariants** mesurés
   (ventilation, écart nul, absence de montant négatif, préservation du taux) ne dépendent pas de la
   fiscalité.
2. **Le trajet HTTP n'a pas pu être exercé.** Le proxy de ports de Docker Desktop a cessé de relayer
   vers l'hôte — les connexions sur `3004` sont acceptées puis jamais servies, `auth-service` compris —
   et sans `auth-service` joignable il n'y avait pas de jeton à minter. Le service répond bien depuis
   l'intérieur du conteneur (`/health` en 503 `kafka: down`, le **démarrage dégradé** de l'invariant 4).
   Le contrat HTTP est couvert par les **768 e2e**, qui montent l'application Nest réelle avec son
   `ValidationPipe`, dont **15 tests neufs** écrits pour cette story.

**⚡⚡ Un fait mesuré qui NUANCE D-482-4.** Sur les 27 jeux réels, le creux **mensuel** ne dépasse
**jamais** `surHorizon` : le portefeuille actuel n'exhibe pas le sous-estimation que le contrat annonce.
La limite reste réelle — elle est démontrée sur un jeu construit (120 jours de délai clients, sans
trésorerie de départ : trois clôtures annuelles positives, **−3 333 337 au mois 4**) — mais elle est,
aujourd'hui, théorique sur les données en base. Le contrat la publie quand même : c'est une propriété du
modèle, pas du portefeuille du jour.


### Revue de sécurité — 0 vulnérabilité, 1 durcissement

Six axes clos sans constat (authentification, autorisation et multi-tenant, injection NoSQL sur le
chemin `Mixed`, web, fichiers et export, infrastructure, logique métier). Le refus 422 ajouté est bien
**précédé** du 404 anti-énumération, donc il ne peut citer qu'un nom de jeu que l'appelant possède
déjà ; le filtre d'exception global ne laisse fuir ni message ni pile sur un 500.

⚡⚡ **Un durcissement retenu, et vérifié avant d'être corrigé.** `tauxDecouvertPct` était le **seul**
intrant neuf du moteur exclu d'`exigerFormeCourante`, alors qu'il vit sur le même chemin `Mixed` que
les cinq autres. L'argument qui l'en excluait — « aucun document existant ne le porte » — est vrai de
la **rétro-compatibilité** et ne dit rien du **mode d'échec**. *Mesuré : à `-8`, le coût de découvert
sort à **−4 323 067** — un **produit financier tiré d'un découvert** — et le résultat net passe de
−19 903 067 à −11 256 933, publié en **HTTP 200** sans aucun signal.* C'est mot pour mot le motif pour
lequel la garde refuse un `tauxInteretPct` négatif. ⛔ La garde valide le repli **résolu** et non le
champ écrit : le contrôler nu refuserait les 52 jeux en base.

### Revue de code — 7 constats, tous réels, tous traités

**C1 — BLOQUANT.** Trois sites affirmaient encore que `tauxInteretPct` porte le découvert, dont une
**description OpenAPI publiée sur la surface de SAISIE**, vingt lignes au-dessus d'un
`tauxDecouvertPct` disant l'inverse. Un intégrateur qui saisit 16 % attendait un agio à 8 %, parce que
le contrat le lui disait. ⛔ **Aucun des trois filets du dépôt ne regarde une description** — la leçon
de STORY-400, où le bloquant était déjà une phrase publiée. Un test de contrat regarde désormais la
phrase, et exige que les deux descriptions se renvoient l'une à l'autre.

**C2** — le test « le moteur MENSUEL refuse lui aussi » ne l'atteignait **jamais** : même entrée à
l'octet que celui du dessus, il ré-assertionnait l'exception du moteur **annuel**, levée avant que le
mensuel soit construit. On pouvait neutraliser la mesure du besoin dans le mensuel seul sans qu'aucun
des deux ne rougisse. Réécrit sur un ancrage sain, avec un témoin qui prouve que l'ancrage, lui, passe.

**C3** — `tauxDecouvertPct` n'était éprouvé par **aucun** test de la surface d'écriture ni du contrat.
S'il avait manqué au DTO, `forbidNonWhitelisted` aurait rendu **400** à toute saisie — fonctionnalité
inutilisable par HTTP, avec les 2 467 unitaires et les 785 e2e **verts**. Le patron `tauxTvaPct` a été
repris intégralement, mutations comprises.

**C4** — la garde de forme nomme **six** intrants, le moteur en lit une douzaine. Les sept autres
rendaient un **500 anonyme** depuis que le besoin de financement est chiffré : la panne exacte que
D-482-6 disait vouloir remplacer par un 422 nommé, déplacée d'un champ à l'autre. ⛔ Ajouter un bloc
de garde par champ aurait reproduit, au prochain champ, la « garde sur un seul des chemins » de
STORY-445 : le filet rattrape par le **type** de l'échec — `SerieCloturesCorrompue` — sur les
**quatre** appels de moteur du dépôt, dont un quatrième qu'aucune revue précédente n'avait dénombré.
⛔⛔ Et surtout **pas** sur `RangeError` : celui d'`ancrerExercice` signale un rang hors bornes, donc un
bug, et l'attraper le déguiserait en « ré-enregistrez votre jeu ».

**C5** — la description de version de la route de comparaison annonçait un changement qui n'y a pas
lieu (elle ne publie rien du bilan simplifié hors `bfr.montant`) et taisait celui qui y a lieu
(`parametresDivergents` peut nommer `tauxDecouvertPct` résolu, qu'aucun scénario n'a saisi).

**C6** — `ventilerTresorerie` avalait en `{ 0, 0 }` la corruption que sa sœur **lève**, violant
l'identité que sa propre docstring pose. Deux fonctions exportées du même fichier ne peuvent pas
traiter la même corruption à l'opposé l'une de l'autre.

**C7** — `MOIS_HORIZON` était du code mort gardé par une assertion tautologique, sous un test qui
mesurait le **premier** rang en prétendant mesurer la borne haute : ses deux séries étaient
entièrement égales, donc la convention « à profondeur égale, le premier gagne » sortait 25 et 12,
jamais 36. Sa suppression retire aussi le seul import de valeur vers `projection.types`, donc le cycle
d'imports documenté.

### Table de mutations finale — 23 sur 23 ROUGES

Aux quinze de la phase de développement s'ajoutent huit mutations sur les correctifs de revue : le
filet retiré de chaque appelant, le filet élargi à `RangeError`, la ventilation qui ravale à nouveau la
corruption, le mensuel qui cesse de chiffrer le besoin, la garde du taux de découvert sous ses trois
angles, et la description publiée qui redit « AUSSI au découvert ». ⚠️ Deux d'entre elles ont d'abord
sorti « NE COMPILE PAS » et ont dû être réécrites compilables — la même leçon qu'au premier tour.

### Portes finales et vérification docker rejouée

Lint 0 warning · build OK · **2 467 unitaires** + **785 e2e** verts · couverture
**99,06 / 95,09 / 99,34 / 99,12** · `besoin-financement.ts` et `forme-hypotheses.ts` à 100 % sur les
quatre axes.

⚠️ **Vérification docker REJOUÉE sur l'état final**, les correctifs touchant le moteur déjà mesuré.
Le conteneur sert le code corrigé (`SerieCloturesCorrompue` et `calculerOuRefuser` présents dans
`dist`, modèle `1.12.0`), et les mesures sont **identiques au chiffre** : 27 jeux projetés, 0 écart non
nul, 0 totalActif non recomposable, 0 montant négatif à l'actif ou au passif, 5 exercices réellement à
découvert. ⛔ Les refus restent à **25**, exactement ceux de STORY-467 : la garde ajoutée sur le taux
de découvert n'en refuse **aucun de plus**, tous les jeux retombant sur le repli déjà validé.
