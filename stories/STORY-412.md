# STORY-412 : Les exonérations de MFP ne sont ni transcrites ni exposées — le plancher peut surestimer l'impôt

Status: in_progress

**Épic :** EPIC-023 — Fiscalité (résultat fiscal, liquidation, TVA, provisions, TPU)
**Service :** `balance-service` (`:3007`) — `modules/fiscal` (liquidation) · **et** le paquet fiscal `TG@YYYY` (STORY-078)
**Points :** 5 · **Sprint :** S20 · **Complexité :** high
**Origine :** relevée le **2026-08-26** en construisant la maquette **FE-051**, en confrontant
`LiquidationResponseDto` au paquet fiscal du projet (`referentiels/paquet-fiscal-togo-2026.json`).

---

## Le fait, relevé à la source

Le paquet fiscal du projet publie **quatre exonérations de minimum forfaitaire de perception**
et un **taux majoré**, tous deux **en prose** :

```json
"minimumForfaitairePerception": {
  "taux": 0.01,
  "tauxMajore": { "valeur": 0.02, "cas": "importation en vue de la revente de vehicules d'occasion" },
  "exonerations": [
    "societes cooperatives, groupements, unions/federations/confederations (quelle que soit l'activite)",
    "societes et personnes morales exonerees d'IS",
    "entreprises nouvelles : 12 premiers mois d'exploitation (hors societes issues de transformation)",
    "entreprises agreees au titre du code des investissements et regimes derogatoires"
  ],
  "source": "Art. 120 CGI (taux) ; Art. 121 CGI (exonerations)"
}
```

`LiquidationResponseDto` n'expose **ni les unes ni l'autre** : un seul `tauxMfp`, un seul `mfp`,
aucun indicateur d'exonération, aucun motif. Et `liquidation.regles.ts` calcule
`mfp = tauxMfp × baseMfp` **sans condition**.

⚠️ **Ce n'est pas une régression : c'est un périmètre assumé qui n'a jamais été refermé.**
STORY-092 le dit noir sur blanc (§ « transcription du paquet ») : *« L'exonération de MFP
(`exonerations`, prose) […] »* n'est **pas** appliquée en 092, *« le cadrage ne les demande
pas »*. **Aucune story n'a été ouverte pour la demander**, et **rien à l'écran ne le dit** —
c'est cette double absence qui fait le sujet.

---

## Pourquoi c'est coûteux

La MFP est un **plancher** : `impôt dû = max(IS ; MFP)`. Une MFP calculée à tort n'est donc pas
une ligne d'affichage en trop — elle **remplace l'impôt de droit commun** dès qu'elle le dépasse.

⇒ Sur une **société coopérative**, une **entreprise nouvelle dans ses 12 premiers mois**, une
**société exonérée d'IS** ou une **entreprise agréée au code des investissements**, le moteur
publie un `impotDu` **supérieur au montant réellement dû**, avec `baseRetenue: "MFP"`.

Et c'est **invisible** : le calcul est juste, sa traçabilité est complète, la grille de la liasse
est cohérente. Seule son **application** ne l'est pas. Un montant faux qui porte sa formule, son
checksum de paquet et son poste de liasse est plus difficile à mettre en doute qu'un montant sans
provenance — la traçabilité, ici, **renforce** l'erreur.

⚠️ Le sens de l'erreur compte : elle est **à la hausse**, et elle frappe exactement les
contribuables que l'article 121 protège. Un redressement se conteste ; un impôt payé en trop ne
se réclame que si quelqu'un s'aperçoit qu'il l'était.

---

## Ce qui est demandé

1. **Transcrire les exonérations en donnée structurée** dans le paquet fiscal (STORY-078), comme
   D-092-7 l'a fait pour les types de crédits : une prose ne se parse pas à la regex, elle se
   **transcrit**. Chaque exonération porte un **code stable** et sa source d'article.
2. **Une exonération constatable ⇒ appliquée ; une exonération non constatable ⇒ nommée, jamais
   supposée.** « Entreprise nouvelle, 12 premiers mois » se déduit d'une `dateCreation`
   (même donnée que l'exonération TPU, qui la traite déjà) ; « société coopérative » ou « agréée
   au code des investissements » ne se déduit d'aucune donnée détenue — elle relève d'une
   **déclaration** sur le dossier, exactement comme la `natureActivite` de la TPU (D-095-6).
3. **Exposer dans `LiquidationResponseDto`** : `mfpExoneree: boolean`, `motifExoneration?` (code
   du paquet) et, quand aucune donnée ne permet de trancher, la **liste des exonérations à
   vérifier par l'humain** — même patron que `exclusionsRegime` de la TPU (D-095-10), qui a déjà
   résolu ce problème dans l'autre branche.
4. **Le taux majoré (2 %)** relève du même mécanisme : il dépend d'une activité que le système ne
   détecte pas. Le publier et le laisser déclarer, ou le nommer comme non géré — mais **pas le
   taire**, sinon un importateur-revendeur de véhicules d'occasion est liquidé à la moitié de son
   minimum forfaitaire.
5. ⛔ **Fail-closed, jamais fail-open** : si le paquet ne publie pas les exonérations, la
   liquidation **ne les invente pas** et le dit (`mfpExonerationsNonPackagees`). Une exonération
   supposée absente qui existe coûte de l'impôt en trop ; une exonération supposée présente qui
   n'existe pas coûte un redressement.

---

## Conception — écrite AVANT le code

### D-412-1 — une seule des quatre exonérations est **constatable**, et le code ne doit pas prétendre le contraire

Vérifié plutôt que supposé : `typeEntite` (la seule qualification d'entité que la plateforme
détienne, `dossier-service`) vaut `ENTREPRISE | MICROFINANCE | ASSURANCE`. **Rien** n'y dit
« coopérative », « exonérée d'IS » ou « agréée au code des investissements ». Seule
`dateCreation` — déjà lue par `ContexteFiscalService.chargerProfilFiscal` pour l'exonération TPU —
permet de trancher « entreprise nouvelle : 12 premiers mois ».

⇒ La transcription porte donc un **mode de constatation** par exonération :

| mode | ce que le moteur en fait |
|---|---|
| `DATE_CREATION` | **appliquée** si la donnée le prouve (AC-2) |
| `NON_CONSTATABLE` | **jamais** appliquée d'office ; publiée dans la liste à vérifier (AC-3) |

⛔ **Aucune surface de déclaration n'est ouverte par cette story.** Déclarer « ce dossier est une
coopérative » est une donnée d'identité fiscale qui appelle sa propre story (schéma, endpoint,
RBAC, audit) — exactement comme `natureActivite` a eu la sienne en 095. Ce que la story livre est
la **moitié qui manque au contrat** : la liste nommée, avec ses codes stables, prête à être
consommée par cette surface quand elle existera. Hook inerte, documenté ici.

### D-412-2 — fail-closed dans les **deux** sens, et ce n'est pas symétrique

- **Paquet muet** ⇒ aucune exonération, avertissement `EXONERATIONS_NON_PACKAGEES` (AC-4).
- **Mode inconnu** (un paquet enrichi sans ce dépôt) ⇒ traité en `NON_CONSTATABLE`, donc publié et
  non appliqué. Jamais deviné.
- **`dateCreation` absente** ⇒ pas d'exonération + `DATE_CREATION_INCONNUE`.
- **Exercice à cheval sur la fin des 12 mois** ⇒ **aucun prorata**, avertissement
  `EXONERATION_PARTIELLE_A_ARBITRER` (AC-6). La loi exonère une **période**, pas une fraction
  d'exercice : répartir au jour le jour serait une règle que personne n'a écrite.

⚠️ Le sens du repli est celui de tout le moteur (D-095-1, « ne jamais présumer une faveur
fiscale ») : dans le doute, la MFP **reste calculée** — mais la raison du doute est **publiée**, ce
qui est précisément ce qui manquait. Une exonération tue coûte de l'impôt en trop ; une exonération
supposée coûte un redressement. La liste à vérifier est ce qui évite d'avoir à choisir.

### D-412-3 — la fenêtre de début d'activité est la **même règle** que celle de la TPU : une seule implémentation

`evaluerExonerationDebutActivite` (TPU, Art. 128, 24 mois) et l'exonération MFP (Art. 121, 12 mois)
posent la **même** question : « l'exercice tombe-t-il dans une fenêtre de N mois après la date de
création ? ». Les trois cas et l'interdit de prorata sont identiques.

⇒ Le calcul est extrait **une fois** dans `fiscal.regles.ts` (`situerExerciceDansFenetre`), et les
**deux** branches l'appellent. Chacune garde ses codes d'avertissement et son article : c'est la
**décision** qui diffère, pas l'arithmétique. Deux implémentations de la même règle, ce sont deux
dates de fin différentes le jour où l'une est corrigée — le défaut que D-083-1 nomme déjà pour les
montants. La signature publique de la fonction TPU et ses codes ne bougent pas : ses tests
existants sont la preuve de non-régression.

### D-412-4 — le taux majoré est **publié et nommé non géré**, jamais appliqué en silence

Le déclenchement (« importation en vue de la revente de véhicules d'occasion ») ne se déduit
d'aucune donnée détenue — même impasse que les trois exonérations non constatables. AC-5 laisse le
choix : il est donc **publié** (`tauxMajoreMfp`, avec son cas, son code et sa source) et
**explicitement déclaré non géré** (`TAUX_MAJORE_NON_GERE`). La MFP se calcule au taux de droit
commun. ⛔ L'appliquer d'office doublerait le minimum forfaitaire de tous les autres
contribuables ; le taire liquide l'importateur-revendeur à la moitié de son minimum.

### D-412-5 — l'artefact fiscal est **byte-identique dans deux dépôts** : la story en touche deux

`dossier-service` embarque une **copie** du paquet et **vérifie son sha256 au chargement**
(`portefeuille/echeance/paquet-fiscal.util.ts`, patron STORY-368). Modifier la source dans
`balance-service` sans y reporter la copie **et** l'empreinte ferait diverger les deux en silence :
le portefeuille servirait des échéances d'un paquet que le moteur n'applique plus.

⇒ **Deux dépôts, deux branches `MNV-412`, deux PR, intégrées ensemble** — même discipline qu'un
changement de contrat d'événement. Le contenu lu par `dossier-service`
(`acomptesProvisionnels.echeances`) n'est **pas** touché par la transcription : le report est une
mise à niveau d'octets, pas un changement de comportement, et c'est vérifiable.

⚠️ Deux autres copies existent et sont **déjà divergentes** de l'artefact produit —
`docs/referentiels/` (16 Ko) et `bilan-service/scripts/referentiels/sources/` (4,7 Ko) : elles ne
sont dans la chaîne de production d'aucun service et ne portent aucune garde d'empreinte. Les
aligner déborderait ; leur divergence est **antérieure** et signalée ici.

### Périmètre — ce que cette story ne fait pas

- **Aucune surface de déclaration** (coopérative, agrément, import-revente) : D-412-1.
- **Aucune application du taux majoré** : D-412-4.
- **Aucune règle d'arrondi** (`is.arrondi`, `acomptesProvisionnels.calcul`) — la story le dit
  elle-même : à ficher séparément, l'urgence des deux sujets n'est pas la même.
- **Aucun changement du `max(IS ; MFP)`** : la règle ne bouge pas, c'est son **entrée** qui devient
  conditionnelle.

## Critères d'acceptation

1. Le paquet publie `minimumForfaitairePerception.exonerations[]` **structuré** (code, libellé,
   source, mode de constatation) et `tauxMajore` structuré.
2. Une exonération **constatable depuis les données du dossier** est appliquée : `mfp = 0`,
   `mfpExoneree: true`, `motifExoneration` renseigné, et **`baseRetenue` vaut `IS`** — le plancher
   ne joue plus.
3. Une exonération **non constatable** n'est jamais appliquée d'office : elle est publiée dans la
   liste à vérifier, et la MFP reste calculée.
4. Paquet muet ⇒ **aucune exonération appliquée** + avertissement publié. Jamais un silence.
5. Le `tauxMajore` est publié ; son mode de déclenchement est déclaré (déclaration sur le dossier)
   ou explicitement nommé comme non géré.
6. Tests : coopérative exonérée sur un déficit ⇒ `impotDu = 0` (et non `mfp`) ; entreprise nouvelle
   au 11ᵉ mois ⇒ exonérée, au 13ᵉ ⇒ non ; exercice **à cheval** sur les 12 mois ⇒ **jamais
   proratisé d'office**, arbitrage humain signalé (même posture qu'`EXONERATION_PARTIELLE_A_ARBITRER`
   côté TPU).

---

## Ce que la maquette FE-051 fait en attendant

Elle **le dit à l'écran**, en rouge, sous la confrontation `max(MFP ; IS)` : les quatre situations
sont nommées, et l'écran déclare que **le calcul ne les connaît pas**. C'est la seule chose qu'un
écran puisse faire d'un contrat qui ne publie pas l'information — mais ce n'est pas une solution :
cela déplace la charge sur le comptable, à chaque dossier, à chaque exercice.

---

## Cas voisin, même racine — à trancher par le PO

Le paquet publie aussi **deux règles d'arrondi en prose** que le moteur n'applique pas, et
STORY-092 les documente au même endroit et pour la même raison :

- `acomptesProvisionnels.calcul` : *« arrondi au millier de franc inférieur »* — or
  `liquidation.regles.ts` fait `Math.floor(impôt N−1 / n)` **en unités mineures**, donc un arrondi
  au **centime**. L'acompte théorique proposé peut différer de celui que l'OTR attend de moins de
  1 000 F ;
- `is.arrondi` : *« fraction de bénéfice imposable < 1 000 FCFA négligée »*.

**Impact réel faible** (le théorique est une proposition, il n'entre dans aucun calcul), **cause
identique** (prose non transcrite). ⇒ **À ficher séparément si le PO le veut** — les mêler à
l'exonération ferait une story dont l'urgence est illisible : l'une fausse un impôt, l'autre
décale une proposition de moins de mille francs.

---

## Dépendances

- **STORY-078** — paquet fiscal `pays × année` : c'est là que la transcription structurée atterrit.
- **STORY-092** — liquidation : c'est elle qui consomme la donnée.
- **STORY-095** — la TPU a **déjà** résolu les deux mécanismes réutilisés ici : la donnée déclarée
  qui ne se devine pas (`natureActivite`, D-095-6) et la liste à vérifier par l'humain
  (`exclusionsRegime`, D-095-10). **On transpose, on n'invente pas.**

---

## Notes

- Créée le 2026-08-26 par la revue métier de la maquette **FE-051** (« se mettre à la place d'un
  expert-comptable »), demandée par le PO.

---

## Progress Tracking

**Statut : `in_progress`** — branches `MNV-412` (`docs/`, `balance-service`, `dossier-service`),
ouvertes le 2026-08-29.

### Conception (fait)

D-412-1 à D-412-5 écrites **avant** la première ligne de code. Les trois points qui ont demandé une
vérification plutôt qu'une intuition :

- `typeEntite` ne connaît **pas** la coopérative (lu dans `dossier-service`) ⇒ une seule des quatre
  exonérations est constatable ;
- `dossier-service` **vérifie le sha256** du paquet embarqué ⇒ la story touche **deux** dépôts ;
- la fenêtre « N mois après la création » existe **déjà** dans la branche TPU ⇒ on l'extrait, on ne
  la réécrit pas.

### Reste à faire

Transcription du paquet + rebuild d'artefact, extraction, évaluation, exposition au contrat, report
dans `dossier-service`, portes DoD, passe de mutation, vérification docker, revues, merge.
