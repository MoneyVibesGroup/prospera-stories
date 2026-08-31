# STORY-417 : L'imputation des déficits est maximale et inconditionnelle — sous le plancher MFP, elle consomme du report pour rien

Status: in_progress

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

**Statut : `in_progress`** — démarrée le **2026-08-31**, branches `MNV-417` sur `docs/` et
`balance-service`. **Un seul dépôt module** : aucun octet du paquet fiscal ne change (**D-417-3**),
donc **aucune PR jumelle** `dossier-service` — la garde de byte-identité de STORY-415 reste intacte.
