# STORY-412 : Les exonérations de MFP ne sont ni transcrites ni exposées — le plancher peut surestimer l'impôt

Status: ready-for-dev

**Épic :** EPIC-023 — Fiscalité (résultat fiscal, liquidation, TVA, provisions, TPU)
**Service :** `balance-service` (`:3007`) — `modules/fiscal` (liquidation) · **et** le paquet fiscal `TG@YYYY` (STORY-078)
**Points :** 5 · **Sprint :** S20
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
