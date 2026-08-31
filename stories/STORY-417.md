# STORY-417 : L'imputation des déficits est maximale et inconditionnelle — sous le plancher MFP, elle consomme du report pour rien

Status: done

**Épic :** EPIC-023 — Fiscalité (résultat fiscal, liquidation, TVA, provisions, TPU)
**Service :** `balance-service` (`:3007`) — `modules/fiscal`. ⚠️ Le paquet fiscal `TG@YYYY` reste
**muet** (**D-417-3**) : sa clé `imputationObligatoire` est **lue**, pas transcrite.
**Points :** 8 · **Sprint :** S20 — *chiffré après l'arbitrage PO du 2026-08-28*
**Origine :** relevée le **2026-08-26** en construisant la maquette **FE-050**, en mettant côte à
côte les deux moitiés du même écran : le résultat fiscal (STORY-091) et la liquidation (STORY-092).

---

## ✅ ARBITRAGE PO — 2026-08-28 : **la version BORNABLE**, sur l'asymétrie du risque

> « Construire la version bornable (imputation plafonnable par le cabinet), parce que c'est le
> sur-ensemble. » — PO, 2026-08-28.

**Le raisonnement qui tranche, et il n'est pas fiscal — il est asymétrique :**

| Si on construit… | et que l'article 101 dit… | conséquence |
|---|---|---|
| **bornable** | imputation **obligatoire** | on retire un contrôle. **Coût nul.** |
| **maximale** | imputation **facultative** | ⛔ **on a consommé les reports déficitaires de clients pour rien — et c'est irréversible pour eux.** |

⇒ La version bornable est le **sur-ensemble**, et le seul choix qui ne puisse pas produire un dégât
non rattrapable chez un client.

⚠️ **Ce que cet arbitrage NE tranche pas, et qui reste dû :** la lecture de l'**article 101 du CGI
togolais**. Le paquet transcrit « imputable dans la limite de 50 % » et étiquette la règle « LEVIER
conseil fiscal » — ce qui suggère un choix **sans l'établir**. La sourcer reste une heure de
lecture, pas une décision de produit, et elle décide du **libellé** de l'écran (« vous pouvez
borner » vs « vous devez imputer, et voici ce que ça coûte »).

⚡ **Et une partie ne dépend d'AUCUN arbitrage : l'avertissement.** « Sous le plancher MFP,
l'imputation ne rapporte rien » est vrai dans les deux lectures et part immédiatement.

### Ce que l'arbitrage ajoute aux critères d'acceptation

- [ ] AC-B1 — L'imputation accepte un **plafond volontaire** par exercice (montant ou pourcentage),
      **borné par le plafond légal du paquet** — jamais au-delà.
- [ ] AC-B2 — La valeur par défaut reste l'imputation maximale : **rien ne change** pour un dossier
      qui ne borne pas. Non-régression obligatoire.
- [ ] AC-B3 — ⚡ **L'avertissement est INCONDITIONNEL et part sans attendre la source légale** :
      dès que `MFP > IS après imputation`, l'écran chiffre le report **consommé pour rien** et
      propose le plafond qui l'aurait évité. C'est le cœur de l'écart relevé.
- [ ] AC-B4 — Le bornage est **tracé avec son motif** : un report non imputé volontairement est une
      décision de gestion, et un contrôle fiscal la questionnera.
- [ ] AC-B5 — Le stock de report reste **cohérent entre les deux chemins** : borner puis ne pas
      borner l'exercice suivant ne doit ni perdre ni dupliquer du report. Test de rejeu.

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

## ⚖️ AVIS D'EXPERT-COMPTABLE (2026-08-26, demandé par le PO)

### ① Sur le droit : **l'imputation n'est pas facultative — il n'y a probablement rien à borner**

Formulation transcrite dans le paquet `togo@2026`, `reglesNotables.reportDeficitaire` :

> *« déficit **imputable dans la limite de 50 %** du bénéfice de l'exercice ; solde reportable
> **sans limitation de durée** » — Art. 101 CGI*

**« Imputable dans la limite de » décrit un PLAFOND, pas une option.** Le déficit reporté est
traité, dans toute la zone, comme **une charge de l'exercice suivant** : le contribuable ne
choisit pas de le « garder ». Et la structure même de la règle le confirme — si l'on pouvait
déjà décider de ne pas imputer, **le plafond de 50 % et le report illimité du solde n'auraient
aucun objet** : ils existent précisément parce que l'imputation s'impose et qu'il faut donc
l'étaler.

⚠️ **À faire confirmer par un fiscaliste**, pour une seule raison : le paquet étiquette la règle
*« LEVIER conseil fiscal »*. Ma lecture est que le levier est le **pilotage du résultat**, pas le
choix d'imputer — mais c'est un avis, pas une certitude, et il porte sur du droit.

### ② Ce qui ne dépend d'AUCUN arbitrage : le chiffre exact de la perte

Le tracker dit « 1 000 000 dépensés pour 60 000 ». **C'est en dessous de la vérité.** Le montant
réellement gaspillé se calcule, et il est plus précis :

> **L'imputation cesse de servir dès que l'IS passe sous le plancher**, c'est-à-dire dès que le
> résultat fiscal descend sous **`MFP / taux IS`**.

Sur l'exemple du paquet (IS 27 %, MFP 1 %, CA 48 000 000, résultat avant déficits 2 000 000) :

| | montant |
|---|---|
| MFP (1 % du CA HT) | **480 000** |
| **seuil = MFP / 27 %** | **1 777 778** |
| imputation **faite** (plafond légal 50 %) | 1 000 000 |
| imputation **utile** | **222 222** |
| **report consommé pour rien** | **777 778** |
| valeur de ce gaspillage au taux plein | **210 000 F d'impôt futur** |

Vérification : `max(540 000 ; 480 000) = 540 000` sans imputation, `max(270 000 ; 480 000) =
480 000` avec. **L'économie de 60 000 F est intégralement obtenue avec 222 222 F de report. Les
777 778 F restants ne rapportent rien.**

⇒ **Que l'imputation soit obligatoire ou non, l'expert-comptable DOIT connaître ce chiffre**,
parce qu'il change trois choses : la valeur de l'actif d'impôt différé dans les comptes, le
conseil donné au client, et — si l'imputation était optionnelle — l'engagement de sa propre
responsabilité pour ne pas l'avoir dit.

### ③ Le vrai levier n'est pas l'imputation, c'est le résultat

Dans la **zone `0 < résultat fiscal < MFP / taux`**, chaque franc de report est gaspillé, et
aucun réglage de l'imputation n'y changera rien. Le conseil est de **sortir de cette zone** —
timing des produits, des charges déductibles, des amortissements (le paquet étiquette d'ailleurs
`amortissements` « LEVIER conseil fiscal » pour la même raison). Un produit qui offrirait un
curseur d'imputation sans montrer cette zone donnerait le mauvais levier.

### ④ Découpage recommandé — **ne pas laisser la question de droit bloquer la moitié qui n'en dépend pas**

- **417a — RENDRE LA PERTE VISIBLE** · `ready-for-dev`, **3 pts**. Publier le **seuil**,
  l'**imputation utile** et le **report consommé sans effet**, avec sa valeur au taux plein.
  Zéro question juridique, valeur immédiate, et c'est le préalable à toute décision.
  ⛔ **Le vrai contenu technique est là** : `ResultatFiscalResponseDto` ne porte **ni le CA, ni le
  taux, ni la MFP** — le moteur du résultat fiscal **ne peut pas voir le plancher**. Il faut donc
  faire remonter la MFP (ou le seuil) dans sa réponse, ou l'assumer comme un croisement de deux
  appels côté écran. C'est ce choix-là qui est à faire, et il est technique, pas juridique.
- **417b — BORNER L'IMPUTATION** · `needs-po-decision`, non chiffrée. À ne coder **que si** un
  avis fiscal établit que l'imputation est facultative. ⚠️ Et si elle l'est : **paramètre de
  LECTURE, jamais un état persisté** — le calcul doit rester pur et rejouable (STORY-096).
  **Pronostic : 417b sera fermée sans être développée.**

---

## ~~La question qui commande tout — à trancher AVANT de chiffrer~~ — **DÉPASSÉE le 2026-08-28**

> ⛔ **Section conservée pour l'historique, elle ne commande plus rien.** L'arbitrage PO du
> 2026-08-28 a tranché **sans** attendre la réponse de droit, et sur un autre critère que le droit :
> l'**asymétrie du risque**. Le « ne pas coder avant cette réponse » ci-dessous **ne s'applique
> plus** — ce qui reste dû, c'est la source de l'article 101, et elle décide du **libellé de
> l'écran**, pas du code. Cf. **D-417-3** : le paquet reste **muet** tant qu'un fiscaliste n'a pas
> tranché, et le contrat le publie comme tel (`imputationObligatoire: null`).


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

## Critères d'acceptation — **FIGÉS le 2026-08-31**, branche « bornable » retenue par le PO

### Le bornage (arbitrage PO du 2026-08-28)

1. **AC-B1 — L'imputation accepte un plafond volontaire par exercice**, en **montant**
   (`plafondImputation`, unités mineures) **ou** en **pourcentage du bénéfice**
   (`plafondImputationPourcentage`, 0→100). Les deux ensemble ⇒ **400 `BORNAGE_AMBIGU`**.
   Le plafond volontaire est **borné par le plafond légal du paquet** : jamais au-delà.
2. **AC-B2 — La valeur par défaut reste l'imputation maximale.** Aucun paramètre ⇒ **strictement
   le comportement d'aujourd'hui**, au champ près : la réponse gagne un bloc `imputation`
   **additif**, aucun champ existant ne change de valeur ni de type. Non-régression prouvée par la
   suite 091/092 laissée intacte.
3. **AC-B3 — L'avertissement est INCONDITIONNEL et ne dépend d'aucune source légale** : dès que la
   MFP l'emporte, la réponse **chiffre le report consommé pour rien**, ce qu'il aurait valu au taux
   plein, l'économie réellement obtenue, le **seuil** de résultat fiscal sous lequel imputer ne sert
   plus à rien, et **le plafond qui l'aurait évité** — directement réutilisable comme
   `plafondImputation`.
4. **AC-B4 — Le bornage est tracé avec son motif** : `motifBornage` est **obligatoire** dès qu'un
   plafond volontaire est demandé (**400 `BORNAGE_SANS_MOTIF`** sinon), et il est **republié** dans
   la réponse à côté du plafond retenu. Un report non imputé volontairement est une décision de
   gestion : elle se relit avec sa raison, ou elle est indéfendable en contrôle.
5. **AC-B5 — Le stock de report reste cohérent entre les deux chemins.** Borner puis ne pas borner
   ne perd ni ne duplique de report, parce que **rien n'est écrit** : `montantDejaImpute` reste
   **déclaré** (D-091-9). Prouvé par un **test de rejeu** (n appels, plafonds différents, stock
   identique) **et** par la vérification docker.

### Le contrat (formulation d'origine, conservée et resserrée)

6. **AC-1 — La règle du paquet publie si l'imputation est obligatoire, avec sa source ; un paquet
   muet conserve exactement le comportement d'aujourd'hui.** Le moteur **lit**
   `resultatFiscal.reportDeficitaire.imputationObligatoire` et le republie
   (`null` = le paquet ne tranche pas). Un paquet qui déclare `true` **refuse** tout bornage —
   **409 `IMPUTATION_OBLIGATOIRE`**, en citant sa source. ⚠️ Cf. **D-417-3** : `togo@2026` reste
   **muet**, parce que la source n'a pas été lue et qu'une affirmation fiscale non sourcée est pire
   qu'un silence.
7. **AC-2 — Une demande supérieure au plafond légal ou au stock est PLAFONNÉE, jamais refusée
   silencieusement**, et le montant retenu est publié (`budgetRetenu`, `plafondVolontaire.ecrete`).
8. **AC-3 — Le calcul reste PUR** : deux appels identiques rendent le même résultat, et **aucun
   n'écrit dans le stock de déficits** (D-091-9, prolongé au bornage).
9. **AC-4 — La réponse dit explicitement qu'elle ne mesure PAS le rendement sans la liquidation**
   (`rendementMesurable: false`, même patron que `mfpToujoursDue: true`), et le **mesure** dans la
   liquidation — le seul point qui détient déjà les deux moitiés. C'est la seconde branche de
   l'AC-4 d'origine, prise mot pour mot.

---

## Décisions de conception

- **D-417-1 — L'avertissement est publié par la LIQUIDATION, pas par le moteur du résultat
  fiscal.** Le périmètre interdit de faire calculer la MFP par le moteur d'assiette (« ce serait
  faire dépendre l'assiette de la liquidation, alors que la liquidation dépend de l'assiette »).
  Or `LiquidationService.liquider` **appelle déjà** `ResultatFiscalService.calculer` : il détient
  l'assiette **et** la MFP, sans qu'aucune dépendance nouvelle ne soit créée. Le
  bloc `rendementImputation` naît donc là, et `ResultatFiscalResponseDto` **dit** qu'il ne le
  mesure pas (AC-4, seconde branche).
- **D-417-2 — Le bornage est un PARAMÈTRE DE LECTURE, jamais un état persisté.** `calculer()` et
  `liquider()` restent purs et rejouables (D-091-9, D-092-10) : c'est ce dont STORY-096 a besoin par
  construction. Conséquence assumée : la **trace** du bornage (AC-B4) est **reproductible**, pas
  **stockée** — pour retrouver le chiffre, il faut renvoyer le même paramètre, et le motif voyage
  avec lui.
- **D-417-3 — `imputationObligatoire` est LU du paquet, et NON transcrit.** La story elle-même
  dit que sourcer l'article 101 « reste dû » et que c'est « une heure de lecture, pas une décision
  produit ». Écrire `true` ou `false` dans l'artefact sans avoir lu le texte serait une **affirmation
  fiscale inventée** — la leçon exacte de STORY-415 (« un libellé faux est pire qu'un libellé
  absent »). Le paquet reste donc **muet**, le contrat publie `null`, et le bornage est **accepté**
  (choix du PO sur l'asymétrie du risque). Le jour où un fiscaliste tranche : **une ligne de
  donnée** dans la source du paquet, **zéro ligne de code**.
  ⇒ **Aucun octet d'artefact ne change** ⇒ **un seul dépôt** (pas de PR jumelle `dossier-service`
  comme en STORY-415, dont la garde de byte-identité n'est pas touchée).
- **D-417-4 — Le seuil est l'INVERSION EXACTE de `calculerIsDroitCommun`**, qui arrondit au plus
  proche : `round(t·R) ≥ M ⟺ t·R ≥ M − 0,5 ⟺ R ≥ (M − 0,5)/t`. La table de l'avis
  d'expert-comptable ci-dessus divise simplement (seuil 1 777 778, imputation utile 222 222) ;
  l'inversion exacte donne **1 777 776** et **222 224** — **2 unités d'écart**, et c'est la version
  exacte qui est retenue, avec un test qui la prouve **aux deux bornes** (`IS(seuil) ≥ MFP` et
  `IS(seuil − 1) < MFP`).
- **D-417-5 — `rendementImputation` est publié TOUJOURS**, y compris quand rien n'a été gaspillé
  (mêmes zéros que D-091-11). `seuilResultatUtile` est **en soi** le conseil du §③ de l'avis
  (« sortir de la zone »), et il vaut même sans un franc de déficit au stock.
- **D-417-6 — Le bornage n'est offert NI sur l'export CSV NI sur l'aiguillage `GET /moteur`.**
  ① `postesDsf` ne porte **aucun** poste de déficit : le bornage ne change pas un octet du fichier
  de STORY-416 — et y faire entrer `motifBornage`, **texte libre**, rouvrirait l'injection de
  formule CSV (CWE-1236) que STORY-416 a fermée précisément parce qu'« aucune colonne n'est du
  texte libre ». ② `forbidNonWhitelisted` fait **refuser en 400** un paramètre de bornage envoyé à
  ces routes : fail-closed, jamais ignoré en silence. Hook inerte documenté pour STORY-096.

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

---

## Progress Tracking

**Statut : `done`** — clôturée le **2026-08-31**. PR **#74** (`balance-service`, 3 commits)
rebase-mergée sur `dev`, branche supprimée. **Un seul dépôt module** : aucun octet du paquet fiscal
ne change (**D-417-3**), donc **aucune PR jumelle** `dossier-service` — la garde de byte-identité de
STORY-415 reste intacte.

### Conception — ce que la story laissait ouvert, et comment c'est tranché

| Décision | Ce qu'elle tranche |
|---|---|
| **D-417-1** | ⛔ **L'avertissement naît dans la LIQUIDATION.** Le périmètre interdit de faire calculer la MFP par le moteur d'assiette (« ce serait faire dépendre l'assiette de la liquidation, alors que la liquidation dépend de l'assiette ») — or `LiquidationService.liquider` **appelle déjà** `ResultatFiscalService.calculer` : il détient l'assiette **et** la MFP, **sans une dépendance de plus**. Les deux grandeurs qui manquaient (`resultatAvantDeficits`, `totalDeficitsImputes`) étaient **déjà publiées** par le moteur : aucune lecture, aucun calcul supplémentaire. |
| **D-417-2** | Le bornage est un **paramètre de lecture** (`plafondImputation` \| `plafondImputationPourcentage` + `motifBornage`), jamais un état persisté : `calculer()` et `liquider()` restent purs (D-091-9, D-092-10), donc rejouables par STORY-096. Conséquence assumée : la **trace** de l'AC-B4 est **reproductible**, pas stockée. |
| **D-417-3** | ⚠️ **`imputationObligatoire` est LU du paquet et NON TRANSCRIT — écart au périmètre, assumé et motivé.** Le périmètre demandait de le transcrire ; la story dit elle-même que sourcer l'article 101 « reste dû » et que c'est « une heure de lecture, pas une décision produit ». Écrire `true` ou `false` sans avoir lu le texte serait une **affirmation fiscale inventée** — la leçon de STORY-415 mot pour mot. Le paquet reste **muet**, le contrat publie `null`, et le bornage est **accepté** (arbitrage PO sur l'asymétrie du risque). Le jour où un fiscaliste tranche : **une ligne de donnée**, zéro ligne de code. ⇒ **aucun octet d'artefact ne change ⇒ un seul dépôt**, pas de PR jumelle `dossier-service`. |
| **D-417-4** | Le seuil est l'**inversion exacte** de `calculerIsDroitCommun` (arrondi au plus proche) : `round(t·R) ≥ M ⟺ R ≥ (M − 0,5)/t`. L'avis d'expert-comptable divisait simplement (seuil 1 777 778, utile 222 222) ; l'exact donne **1 777 776** et **222 224**. La division simple **surestime le seuil**, donc **sous-estime l'imputation utile** — un conseil qui laisse gaspiller ce qu'il prétend économiser. Prouvé **aux deux bornes**. |
| **D-417-5** | `rendementImputation` est publié **toujours**, à zéro compris (mêmes zéros que D-091-11) : `seuilResultatUtile` est **en soi** le conseil du §③ de l'avis — « le vrai levier n'est pas l'imputation, c'est le résultat » — et il vaut sans un franc de déficit au stock. |
| **D-417-6** | Le bornage n'est offert **ni** sur l'export CSV **ni** sur `GET /moteur`. ① `postesDsf` ne porte aucun poste de déficit : le bornage ne change pas un octet du fichier de STORY-416 — et y faire entrer `motifBornage`, **texte libre**, rouvrirait l'injection de formule CSV (CWE-1236) fermée en 416 précisément parce qu'« aucune colonne n'est du texte libre ». ② `forbidNonWhitelisted` les fait **refuser en 400** : fail-closed **gratuit**, jamais un paramètre ignoré. |
| **D-417-7** | ⛔ **Le bornage ne remonte JAMAIS à l'acompte théorique de N−1**, et c'est **l'inverse** de la leçon de STORY-412. Là, l'exonération de MFP devait être reportée sur N−1 parce qu'elle est un **fait du dossier**. Ici c'est un **paramètre de lecture de l'exercice interrogé** : le propager rebornerait l'imputation d'un exercice **déjà déposé** et ferait varier l'acompte théorique selon un paramètre d'affichage. Le même geste, la réponse opposée — gardé par un test dédié (mutation M9). |

### Implémentation

| Fichier | Ce qui change |
|---|---|
| `types/fiscal.ts` | `RegleReportDeficitaire.imputationObligatoire` (**requis, nullable**) · `BornageImputation` / `PlafondVolontaire` / `ImputationDeficits` · motif `BORNAGE_VOLONTAIRE` |
| `fiscal.regles.ts` | lecture de `imputationObligatoire` (**typée**, jamais coercée) · `imputerDeficits` bornable · `validerBornage` (4 refus) |
| `types/liquidation.ts` | `RendementImputation` + le champ sur `Liquidation` |
| `liquidation.regles.ts` | `seuilResultatPourImpot` (inversion exacte) · `mesurerRendementImputation` · câblage dans `liquider` |
| `resultat-fiscal.service.ts` | validation du bornage **en un seul point** — la liquidation en hérite |
| `liquidation.service.ts` | le bornage traverse jusqu'à l'assiette ; **jamais** vers N−1 |
| `dto/fiscal.dto.ts` | `ResultatFiscalQueryDto` — **DTO séparé**, c'est lui qui rend le refus de l'export gratuit |
| `dto/*-response.dto.ts` | `ImputationResponseDto`, `PlafondVolontaireResponseDto`, `RendementImputationResponseDto` |
| `exceptions/fiscal.exceptions.ts` | 4 codes + `versExceptionBornage` |
| `fiscal.controller.ts` / `liquidation.controller.ts` | nouveau DTO de requête, 400/409 documentés **par route** (jamais la constante 409 partagée, que `GET /acomptes` ne doit pas hériter) |

### Portes DoD

lint **0 warning** · build OK · **3 353** unitaires · **837** e2e (26 suites) · couverture globale
**99,13 / 92,21 / 98,61 / 99,23** — `modules/fiscal` à **99,56 / 94,38 / 99,18 / 99,73**,
`fiscal.regles.ts` et `liquidation.regles.ts` à **100 % lignes/fonctions**.

### Passe de mutation — **13 mutations, 13 rouges, 13 compilent**

⚠️ Chacune a été **rejetée si `tsc` échouait** : une mutation rouge par erreur de compilation ne
prouve rien (leçon STORY-411/412). Restauration depuis une copie mémoire du fichier, **jamais**
`git checkout` (qui emporterait le travail non committé).

| # | Mutation | Test qui vire au rouge |
|---|---|---|
| M1 | `budgetRetenu` ignore le plafond légal | AC-2 — écrêtement |
| M2 | `ecrete` figé à `false` | AC-2 — le drapeau |
| M3 | `BORNAGE_VOLONTAIRE` évalué **avant** `PLAFOND_ATTEINT` | « plafond LÉGAL nul : PLAFOND_ATTEINT l'emporte » |
| M4 | seuil par **division simple** (la version « naturelle ») | encadrement aux deux bornes + le 1 777 776 |
| M5 | seuil `null` lu « aucun gaspillage » | « taux d'IS nul ⇒ TOUT est gaspillé » |
| M6 | garde `IMPUTATION_OBLIGATOIRE` retirée | les deux 409 |
| M7 | motif non trimé dans le moteur **pur** | « un motif d'ESPACES ne vaut pas un motif » |
| M8 | le bornage ne traverse plus jusqu'à l'assiette | « le bornage TRAVERSE » |
| M9 | le bornage **contamine** le théorique de N−1 | D-417-7 |
| M10 | l'export CSV **accepte** le bornage | D-417-6, e2e |
| M11 | `imputationObligatoire` coercé (`Boolean`) au lieu d'être **typé** | « une valeur MAL TYPÉE vaut silence » |
| M12 | `budgetRetenu` forcé à 0 dans la réponse assemblée | non-régression AC-B2 |
| M13 | le rendement lit le résultat **après** imputation au lieu d'**avant** | le cas de la story |

### Vérification docker — le défaut de la story, chiffré sur une stack NEUVE

`docker compose down -v` → `up --build mongo kafka auth-service balance-service`, tenant réel
(`register` + `emailVerifiedAt`), read-models de gate semés, dossier `ACTIF`, balance réelle
(CA 48 000 000 · charges 46 000 000 ⇒ **résultat 2 000 000**), déficit 2024 de **1 000 000**
déclaré **par l'API**. Paquet : l'artefact `togo@2026` **réel** (IS 27 %, MFP 1 %, Art. 101 CGI).

**① Sans bornage — le défaut, servi par le contrat :**

```json
"isDroitCommun": 270000, "mfp": 480000, "impotDu": 480000, "baseRetenue": "MFP",
"rendementImputation": {
  "imputationRetenue": 1000000,   "imputationUtile": 222224,
  "reportConsommeSansEffet": 777776,   "valeurAuTauxPlein": 210000,
  "economieObtenue": 60000,   "seuilResultatUtile": 1777776,
  "plafondQuiAuraitEvite": 222224 }
```

⇒ **1 000 000 de report consommés pour 60 000 F d'impôt évité**, et **777 776 partis pour rien** —
210 000 F d'impôt futur. Les chiffres exacts de l'avis d'expert-comptable, à l'inversion de
l'arrondi près (D-417-4).

**② Rejeu avec le plafond que le contrat PROPOSE (`plafondImputation=222224`) :**

```json
"isDroitCommun": 480000, "mfp": 480000, "impotDu": 480000, "baseRetenue": "IS",
"rendementImputation": { "imputationRetenue": 222224, "reportConsommeSansEffet": 0,
                         "economieObtenue": 60000 }
```

⇒ **impôt dû identique au franc près, 777 776 de report SAUVÉS.** ⚡ Et `baseRetenue` bascule
**exactement** au seuil (`IS = MFP = 480 000`) : la preuve, sur la machine, que l'inversion de
l'arrondi tombe juste.

**③ AC-3 / AC-B5 — rien n'est écrit, prouvé en base :** `deficits_reportables` et `balances`
relus **avant** et **après** 8 appels dont 6 bornés (montant, pourcentage, plafond au-delà du
stock) — `montantDejaImpute` reste **0**, `balances` reste à **1**. Aucun document créé, aucun
modifié.

**④ `imputation` publié par l'artefact réel :** `imputationObligatoire: null`, `sourceRegle:
"Art. 101 CGI"`, `plafondLegal: 1000000` — le paquet **muet** de D-417-3, servi tel quel.

**⑤ Les refus, sur le service réel :**

| Requête | Réponse |
|---|---|
| montant **et** pourcentage | `400 BORNAGE_AMBIGU` |
| motif sans plafond | `400 BORNAGE_SANS_PLAFOND` |
| plafond sans motif | `400 BORNAGE_SANS_MOTIF` |
| `plafondImputation=-1` / `pourcentage=101` | `400` au DTO |
| `…/resultat-fiscal/export?plafondImputation=…` | `400 property plafondImputation should not exist` |
| `…/fiscal/moteur?plafondImputation=…` | `400` idem — et `moteur` **sans** bornage : `200` |

**⑥ Le contrat OpenAPI publié** (`/api/docs-json`) porte bien `ImputationResponseDto`,
`PlafondVolontaireResponseDto`, `RendementImputationResponseDto`, et les paramètres de bornage
**uniquement** sur `resultat-fiscal` et `liquidation` — **pas** sur l'export.

⚠️ **Ce que la vérification docker NE discrimine PAS, et c'est structurel** : le chemin
`409 IMPUTATION_OBLIGATOIRE` est **inatteignable en docker** — il faudrait modifier l'artefact
`togo@2026`, que la garde de checksum refuse. C'est exactement la garde voulue. Ce chemin est
prouvé par les unitaires (paquet fabriqué) **et** par la mutation **M6**.

---

## Progress Tracking — clôture

### Revue de code — 3 constats, 3 corrigés (commits `23ac7e3` et `c86c8ba`)

| # | Constat | Ce qu'il coûtait |
|---|---|---|
| **F-417-1** | Trois blocs JSDoc **préexistants** détachés de leur déclaration : les nouveaux types avaient été insérés **entre** le commentaire et le symbole qu'il documentait. | `Liquidation`, `ResultatFiscalResponseDto` et `LiquidationResponseDto` perdaient leur doc — dont **deux blocs portant une instruction pour STORY-096**. Même mécanisme que le commentaire périmé de STORY-402 : un commentaire qui porte une instruction et qui glisse est un piège armé. |
| **F-417-2** | ⚡⚡ `seuilResultatPourImpot` **n'était pas l'inversion exacte annoncée**. `0,35 × 1 310 730` vaut `458 755,49999999994` en IEEE-754 là où l'arithmétique exacte donne `458 755,5` : `Math.round` rend `458 755`, et le seuil **rate son propre invariant** d'une unité. Mesuré : les taux **0,29 · 0,35 · 0,41 · 0,47** le violent — **1 449 fois** sur la plage éprouvée. | `plafondQuiAuraitEvite` **surestimé d'une unité** : le plafond que le contrat propose au cabinet consommerait **un franc de report pour rien** — exactement le geste que la story existe pour supprimer. Latent avec `togo@2026` (27 %), mais **`tauxIs` est une donnée du paquet, pas une constante du code.** |
| **F-417-3** | Le bornage en **pourcentage** divisait avant de multiplier : `(29 / 100) × 48 000 000` vaut `13 919 999,999999998`. | Budget publié à `13 919 999` là où le contrat annonce `⌊% × bénéfice⌋` **à trois endroits**. Divergences sur `29 % · 57 % · 58 % · 69 %`. |

⚡⚡ **La leçon de F-417-2, et elle porte au-delà de cette story : le test qui prétendait le prouver
échantillonnait à côté.** L'`it.each` tenait **six couples** (`0,27 · 0,5 · 0,3 · 0,18 · 0,01`) et
**aucun des quatre taux fautifs**, sous un commentaire affirmant « prouvé **aux deux bornes** » et une
JSDoc annonçant « inversion **EXACTE** ». Un échantillon peut satisfaire un théorème qu'il ne prouve
pas — et plus le commentaire est affirmatif, moins on retourne vérifier. Les deux gardes sont
désormais des **balayages** : les 50 taux entiers de 1 % à 50 % pour le seuil, les 101 pourcentages
entiers sur cinq bénéfices pour le budget.

⚡ **Et la branche de sur-correction n'était pas morte.** Le correctif F-417-2 corrige le candidat
dans les **deux** sens, et la branche « candidat trop haut » sortait non couverte — la tentation
étant de la croire inatteignable et de la retirer. **Mesurée avant de trancher : atteinte 1 290 fois**,
*davantage* que la branche inverse (1 022). Au taux `0,45 %` pour un plancher de `5`, la formule rend
`1 001` alors que `IS(1 000) = round(4,5) = 5` atteint déjà le plancher. Un correctif borné d'un seul
côté aurait laissé ce cas faux.

**Ponytail (seconde lentille, over-engineering)** : un seul candidat — `plafondQuiAuraitEvite`
duplique `imputationUtile`. **Écarté** : l'AC-B3 demande explicitement « propose le plafond qui
l'aurait évité », et nommer le **geste** à côté du **constat** est le livrable de la story. Rien
d'autre à couper : hors DTO et Swagger (imposés), le code de production ajouté tient en ~190 lignes.

### Revue de sécurité — **0 vulnérabilité**

Six points instruits explicitement, chacun conclu sur le code réel :

1. **`motifBornage` (texte libre client)** — ne quitte jamais trois destinations : `validerBornage`,
   l'objet `plafondVolontaire`, l'écho JSON. Aucun filtre Mongo, aucun `$where`, aucun nom de
   fichier, aucun événement Kafka, aucun schéma. ⛔ **Le CSV est hors d'atteinte deux fois** : la
   route d'export reste liée à `ExerciceFiscalQueryDto` (400), **et** `construireCsvLiasse` n'écrit
   que `postesDsf`. **La prémisse de STORY-416 (« aucune colonne n'est du texte libre ») est
   intacte** — c'était le risque n°1 de cette story.
2. **`enableImplicitConversion`** — sondé contre le `ValidationPipe` exact : `abc`, `NaN`, `Infinity`,
   `1e999`, doublon de paramètre, `plafondImputation[]`, `plafondImputation[$gt]` ⇒ **400**. ⚡ Et
   `motifBornage[$ne]=x` est **coercé en la chaîne `"[object Object]"`** : aucun opérateur Mongo ne
   survit. Aucun `NaN`/`Infinity` n'atteint le calcul.
3. **Sous-imposition** — impossible par construction (`budgetRetenu = min(légal, volontaire)` ne peut
   que **relever** l'assiette), et vérifié par fuzz jusqu'à `1e308` / `2^53`.
4. **Fuite via `IMPUTATION_OBLIGATOIRE`** — `pays@annee` et `source` sont déjà publiés en clair dans
   toute réponse 200, et le refus est levé **après** le guard de scope et **après** le 404 balance :
   aucun oracle d'énumération.
5. **Placement du DTO** — les 13 autres liaisons `@Query()` du module restent sur
   `ExerciceFiscalQueryDto` ; décorateurs de classe inchangés.
6. **DoS** — aucune boucle pilotée par une valeur client.

⚡ **Un chemin d'écriture a été instruit et écarté** : `provisions.service.ts` appelle `liquider()`
— c'est une **écriture en balance**. Vérifié : il construit ses propres bornes **purement datées**,
sans les trois champs de bornage. Un paramètre d'affichage ne peut donc pas influencer une écriture,
ni contourner `exigerExerciceModifiable`.

### Vérification docker **rejouée sur l'état final** — et elle DISCRIMINE

Les correctifs de revue changent le calcul : reporter la mesure d'avant aurait été exactement la
fausse assurance que le projet interdit.

- **Non-régression** : les chiffres de la story sont identiques au franc près
  (`222 224` / `777 776` / `210 000` / `60 000` / seuil `1 777 776`).
- **F-417-3 discriminé sur le service réel** : bénéfice 48 000 000, `plafondImputationPourcentage=29`
  ⇒ `plafondVolontaire.budget = 13 920 000`. **L'ancien code publiait 13 919 999.** La vérification
  ne se contente pas de passer : elle distingue le code corrigé du code bugué.
- **F-417-2 n'est PAS discriminable en docker, et c'est structurel** : il faudrait un paquet publiant
  un taux d'IS de 29/35/41/47 %, donc modifier `togo@2026`, ce que la garde de checksum refuse.
  Prouvé par balayage unitaire et par les mutations **M14/M16**.

### Portes DoD finales

lint **0 warning** · build OK · **3 354** unitaires · **837** e2e (26 suites) · couverture
**99,13 / 92,27 / 98,61 / 99,23** — `fiscal.regles.ts` et `liquidation.regles.ts` à **100 %**
lignes et fonctions.

**Passe de mutation totale : 16 mutations, 16 rouges, 16 compilent** (13 au développement + 3 sur les
correctifs de revue, dont une **sur-correction d'un pas** pour prouver que la correction est bornée
des deux côtés).
