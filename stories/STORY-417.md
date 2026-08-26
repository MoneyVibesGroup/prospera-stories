# STORY-417 : L'imputation des déficits est maximale et inconditionnelle — sous le plancher MFP, elle consomme du report pour rien

Status: needs-po-decision

**Épic :** EPIC-023 — Fiscalité (résultat fiscal, liquidation, TVA, provisions, TPU)
**Service :** `balance-service` (`:3007`) — `modules/fiscal` · **et** le paquet fiscal `TG@YYYY`
**Points :** à chiffrer après arbitrage (voir « La question qui commande tout ») · **Sprint :** S20
**Origine :** relevée le **2026-08-26** en construisant la maquette **FE-050**, en mettant côte à
côte les deux moitiés du même écran : le résultat fiscal (STORY-091) et la liquidation (STORY-092).

---

## Le fait, relevé à la source

Deux règles, chacune juste, et qui ne se parlent pas.

**① Le résultat fiscal impute le maximum permis, sans condition.** Le moteur applique le
plafond du paquet (50 % du bénéfice, art. 101 CGI) et impute autant que le stock le
permet. Aucun paramètre du contrat ne borne cette imputation : `ExerciceFiscalQueryDto`
ne porte que l'exercice.

**② L'impôt dû est un PLANCHER**, pas une soustraction : `impôt dû = max(IS ; MFP)`, et
le minimum forfaitaire se calcule sur le **chiffre d'affaires**, pas sur le résultat.

⛔ **Conséquence : dès que la MFP l'emporte, chaque franc de déficit imputé fait baisser
un IS DÉJÀ ÉCARTÉ.** Le report est consommé — il figure comme imputé dans la liasse
déposée — et **le montant dû ne bouge pas d'un franc.**

Exemple, avec les chiffres du paquet (IS 27 %, MFP 1 % du CA HT) :

| | sans imputation | avec imputation maximale |
|---|---|---|
| Résultat avant déficits | 2 000 000 | 2 000 000 |
| Déficit imputé (plafond 50 %) | 0 | 1 000 000 |
| Base imposable | 2 000 000 | 1 000 000 |
| IS de droit commun (27 %) | 540 000 | 270 000 |
| MFP (1 % × 48 000 000) | 480 000 | 480 000 |
| **Impôt dû = max(IS ; MFP)** | **540 000** | **480 000** |
| **Report consommé** | **0** | **1 000 000** |

**1 000 000 F de report reportable sans limitation de durée** ont été dépensés pour
**60 000 F** d'impôt évité. Au taux plein, ce même million en vaut 270 000.

⚠️ **Et le moteur ne peut pas s'en apercevoir** : la MFP est calculée par **STORY-092**,
l'autre moitié de l'écran. `ResultatFiscalResponseDto` ne porte ni le chiffre d'affaires,
ni le taux de MFP, ni le montant du minimum forfaitaire — il porte seulement
`mfpToujoursDue: true`, un rappel **constant**, jamais une comparaison.

---

## La question qui commande tout — à trancher AVANT de chiffrer

⛔ **L'imputation d'un déficit reportable est-elle FACULTATIVE au regard de
l'article 101 du CGI togolais, ou s'impose-t-elle sur le premier exercice bénéficiaire ?**

Le paquet ne le dit pas. Il transcrit « déficit **imputable** dans la limite de 50 % du
bénéfice de l'exercice suivant ; solde reportable sans limitation de durée » et étiquette
la règle « **LEVIER conseil fiscal** » — ce qui suggère un choix sans l'établir. Or les
deux lectures existent dans les droits voisins, et elles conduisent à deux stories
différentes :

- **Si l'imputation est facultative** ⇒ le produit doit permettre de la **borner**, et
  ne pas la décider à la place du cabinet.
- **Si elle est obligatoire** ⇒ il n'y a rien à borner, et la story se réduit à
  **rendre la perte VISIBLE** : le cabinet ne peut pas l'éviter sur cet exercice, mais il
  peut agir sur ce qui la cause (le chiffre d'affaires est la base de la MFP), et il doit
  au minimum **savoir** que son report part.

⚠️ **Ne pas coder avant cette réponse.** Une option « ne pas imputer » offerte contre la
loi produirait une liasse irrégulière ; un silence maintenu alors que le choix existe
coûte du report tous les ans. **C'est une question de droit, pas de produit** — elle se
tranche sur le texte de l'article 101, pas en réunion.

---

## Périmètre

**Inclus** — *dans les deux branches*

- Transcrire dans le paquet le **caractère obligatoire ou facultatif** de l'imputation
  (`resultatFiscal.reportDeficitaire.imputationObligatoire`), avec sa source. Un paquet
  muet **ne fait rien de nouveau** : le comportement actuel (imputation maximale) reste
  le repli, parce qu'il est le seul qui ne risque pas de sous-imposer.
- Publier de quoi **voir** l'arbitrage : le rendement effectif de l'imputation sur
  l'exercice — combien de report consommé pour combien d'impôt évité.

**Inclus** — *seulement si l'imputation est facultative*

- Un moyen de **borner** l'imputation à la demande, sans casser ce qui fait la valeur du
  moteur : le calcul doit rester **pur et rejouable** (D-091-9) — c'est-à-dire un
  **paramètre de lecture**, jamais un état persisté qu'un second appel retrouverait.
  STORY-096 (simulation d'optimisation) rejouera précisément ce paramètre.

**Hors périmètre**

- **Faire calculer la MFP par le moteur du résultat fiscal.** Ce serait faire dépendre
  l'assiette de la liquidation, alors que la liquidation dépend de l'assiette. La
  comparaison appartient à l'appelant, ou à STORY-096.
- **Conseiller.** Dire ce qu'il faut faire est FE-052 / STORY-096. Ici on rend la
  décision *possible*, on ne la prend pas.
- Les exonérations de MFP — c'est **STORY-412**, et elle se combine à celle-ci : une MFP
  calculée à tort ferait croire à un plancher qui n'existe pas, donc à un arbitrage qui
  n'a pas lieu d'être.

---

## Critères d'acceptation

*(à figer après l'arbitrage juridique — formulés ici dans la branche « facultative »)*

1. La règle du paquet publie si l'imputation est obligatoire, avec sa source légale ; un
   paquet muet conserve **exactement** le comportement d'aujourd'hui.
2. Quand elle est facultative, un appelant peut demander une imputation **inférieure** au
   maximum ; une demande supérieure au plafond ou au stock est **plafonnée**, jamais
   refusée silencieusement, et le montant retenu est publié.
3. Le calcul reste **pur** : deux appels identiques rendent le même résultat, et aucun
   n'écrit dans le stock de déficits.
4. La réponse permet de **mesurer** le rendement de l'imputation retenue sans appeler la
   liquidation — ou dit explicitement qu'elle ne le permet pas.

---

## Notes

- ⚠️ **Ce n'est pas une régression, et c'est ce qui la rend durable** : STORY-091 fait
  exactement ce que son cadrage demande, et son cadrage ne parlait pas de la MFP — qui
  n'existait pas encore au contrat. Le défaut naît de la **jonction** de deux stories
  justes, et c'est pour cela qu'aucune revue de l'une ou de l'autre ne pouvait le voir.
  ⚡ **Il n'apparaît qu'en mettant les deux moitiés de l'écran côte à côte** : c'est la
  maquette qui l'a produit, pas la lecture du code.
- ⚠️ **Le sens de l'erreur est trompeur.** Contrairement à STORY-412 (impôt surestimé),
  ici l'impôt de l'exercice est **juste** — le montant dû est le bon. Ce qui est perdu
  est un **actif futur**, et rien dans la liasse déposée ne dit qu'il aurait pu être
  gardé. Une perte qu'aucun total ne signale.
- L'écran FE-050 dit dès aujourd'hui ce qu'il peut dire, puisqu'il a les deux chiffres
  sous les yeux : il nomme le mécanisme et renvoie à la liquidation pour vérifier le
  rapport. Il ne propose **aucun geste** que le contrat n'a pas.
- Consommateur nommé : **FE-050**.
