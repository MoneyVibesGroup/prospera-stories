# STORY-1097 : De la facture à l'écriture proposée — achats et ventes en partie double, pour le système normal

Status: ready-for-dev — **créée le 2026-11-18** à la demande de l'utilisateur. Non slottée : à placer au prochain plan.

**Services :** `prospera-comptabilite-service` (tenu par B au lot 4) ; lecture de `document-service` (pièces extraites)
**Points :** 13 · **Suite :** STORY-1098 (mémoire des choix), FE-149 (l'écran)

---

## Pourquoi

Le petit commerçant (système minimal de trésorerie, SMT) a ses cahiers : une facture y devient une recette ou une
dépense (STORY-084). Une entreprise au **système normal**, elle, tient une comptabilité en **partie double**. Une
facture d'achat à crédit crée une **dette** envers le fournisseur avant tout paiement. Une facture de vente crée une
**créance**. La TVA se ventile, et chaque écriture va dans **son** journal.

Le service comptable sait déjà tenir cette comptabilité : brouillard, écritures, validation, contre-passation,
journaux, tiers, lettrage, pièces liées. `document-service` lit déjà une facture : `date`, `fournisseur`, `nifEmetteur`,
`numeroFacture`, `montantHT`, `montantTVA`, `montantTTC` (`piece-extraction/parsers/facture.parser.ts`). **Rien ne
relie les deux** : l'expert-comptable ressaisit chaque facture ligne à ligne. C'est le travail le plus répétitif du
cabinet, et la raison pour laquelle il garde Sage.

## Ce qui est attendu

### 1. Déposer des factures, une ou un lot

- **Un lot** de factures pour un dossier au système normal, avec un **sens déclaré au dépôt** : `ACHAT` ou `VENTE`.
  On ne devine jamais le sens d'une pièce. Le dépôt et la lecture reprennent le patron de STORY-084 : un dépôt
  asynchrone, puis la relecture de ce que la machine a lu.
- **Le dépôt ne crée aucune écriture**, pas même au brouillard. L'invariant est le même que pour les cahiers
  (NFR-A05).

### 2. L'écriture proposée, par pièce

**Pour une facture d'achat**, en SYSCOHADA révisé :

| Ligne | Compte | Montant |
|---|---|---|
| débit | **compte de charge** (classe 6) | HT |
| débit | **TVA récupérable** (4452, ou la subdivision du référentiel du dossier) | TVA |
| crédit | **compte du fournisseur** (auxiliaire sous 401) | TTC |

**Pour une facture de vente** :

| Ligne | Compte | Montant |
|---|---|---|
| débit | **compte du client** (auxiliaire sous 411) | TTC |
| crédit | **compte de produit** (classe 7) | HT |
| crédit | **TVA facturée** (443) | TVA |

Les numéros viennent toujours du **référentiel du dossier** et de son plan propre (STORY-1094/1095), jamais d'une
liste écrite dans le service.

Règles de proposition :

- **Le tiers** est retrouvé par son **NIF** (`nifEmetteur`) dans les tiers du dossier, sinon par son nom normalisé. Un
  tiers inconnu est **proposé à la création** (nom, NIF), et jamais créé sans validation.
- **Le compte de charge ou de produit** vient, dans l'ordre :
  1. de la **mémoire des choix** (STORY-1098) ;
  2. du compte par défaut du tiers ;
  3. de rien : le compte est alors **laissé vide et signalé**. On n'invente jamais un compte.
- **Le journal** : le journal d'achats ou de ventes du plan de journaux du dossier (codes publiés, ou journaux propres).
- **La pièce** est liée à l'écriture : numéro de facture, empreinte, lien vers le document.
- **L'équilibre** est contrôlé : débit = crédit au franc près.
  - Si HT + TVA ≠ TTC à la lecture, l'écart est **signalé**, jamais corrigé en silence.
  - Si la TVA est absente, la TVA est laissée à zéro et un avertissement le dit. La facture peut être exonérée ou mal
    lue : le comptable tranche.

### 3. Les cas qui reviennent chaque mois

- **Avoir** : le même schéma en sens inverse, reconnu par le mot « avoir » ou déclaré au dépôt.
- **Doublon probable** (même tiers, même numéro de facture) : averti, jamais écarté d'office.
- **TVA non récupérable** (par exemple un véhicule de tourisme) : quand le compte retenu est marqué non récupérable
  au référentiel, la TVA s'ajoute à la charge.
- **Montant élevé sur un compte de classe 2** : quand le comptable choisit une immobilisation, l'écriture le suit. La
  mise au registre des immobilisations reste un geste à part (module livré).
- **Exercice** : la date de la facture désigne l'exercice. Exercice clos ou absent : refus nommé (`EXERCICE_CLOS`,
  `EXERCICE_INDETERMINE`).
- **Devise** : une facture dans une autre devise que celle du dossier est signalée. Sa conversion relève de la story
  des devises, hors de celle-ci.

### 4. Valider, une par une ou en lot

- Le comptable **retient** les écritures proposées, **corrige** comptes, montants, tiers et journal, puis les
  **inscrit au brouillard**.
- La **validation** (numérotation définitive, inaltérable) reste le geste existant du service. Rien n'est validé
  automatiquement.
- **Ce qui est appliqué = ce qui a été relu** : une valeur corrigée par le comptable prime sur la lecture de la
  machine, et cette correction alimente la mémoire (STORY-1098).

## ⛔ Cloisonnement par cabinet — exigence de l'utilisateur (2026-11-18), non négociable

> « Ça doit être lié par cabinet. Un cabinet A a sa façon d'écrire et sa propre compta : s'il insère quelque chose et
> que demain la même facture vient, on le lui suggère et on le remplit par défaut ; il peut modifier s'il veut, et
> c'est pris. Mais cela ne va pas apparaître pour un cabinet B, **même s'il a le même client**. C'est important. »

- Toute mémoire, toute suggestion et tout compte propre appartiennent à **l'organisation du cabinet** (`orgId` du
  jeton). Ils ne sont **jamais** indexés par le seul NIF du client ou du fournisseur : la clé contient toujours le
  cabinet.
- **Le même client suivi par deux cabinets** (même NIF, un dossier chez A, un dossier chez B) : B ne reçoit **rien** de
  A. Aucune suggestion, aucun compte, aucun tiers, aucune statistique, même anonymisée ou agrégée. Il n'existe **aucune
  mémoire « plateforme »** partagée entre cabinets.
- La valeur suggérée est **pré-remplie par défaut** ; le comptable la garde ou la change. **Ce qu'il valide devient la
  nouvelle mémoire** de son cabinet.
- **Test obligatoire** : deux cabinets A et B, un même client (même NIF) chez les deux. A comptabilise une facture de
  ce client. B dépose la même facture et ne reçoit aucune suggestion venant de A, alors que A la reçoit à la facture
  suivante.

## Critères d'acceptation

- **AC-1** : déposer un lot n'écrit aucune écriture ; seule l'inscription au brouillard écrit, et seulement les pièces
  retenues.
- **AC-2** : une facture d'achat lue (HT 100 000, TVA 18 000, TTC 118 000) propose exactement : 6xx débit 100 000,
  4452 débit 18 000, 401-tiers crédit 118 000, dans le journal d'achats, avec la pièce liée.
- **AC-3** : un écart HT + TVA ≠ TTC est signalé, et aucun montant n'est recalculé.
- **AC-4** : un tiers inconnu est proposé, jamais créé sans validation ; un tiers connu par son NIF est retrouvé.
- **AC-5** : un compte que rien ne propose reste vide et signalé, jamais inventé.
- **AC-6** : réservé aux dossiers au système normal. Un dossier SMT reçoit un refus nommé qui renvoie aux cahiers.
- **AC-7** : étanchéité. Un lot, ses pièces et ses écritures n'apparaissent dans aucun autre dossier (patron du gate
  FE-069).
- **AC-8** : le contrat est publié dans l'OpenAPI et annoncé dans « ⚠ Contrats » avant le code.
- **AC-9** : le tiers est retrouvé parmi les tiers **du cabinet et du dossier** seulement ; un tiers créé par un autre
  cabinet pour le même NIF n'est jamais retrouvé ni proposé.
- **AC-10** : les factures comptabilisées rejoignent le fonds d'archives du client **de ce cabinet** (STORY-1100).

## Hors périmètre (nommé pour plus tard)

- Le **règlement** de la facture : l'écriture banque/401 et le lettrage automatique, à partir du relevé bancaire déjà
  importé (rapprochement livré). Ce sera une story à part.
- La lecture des factures **multi-taux** ligne à ligne : ici, un seul taux par facture, et l'écart est signalé.
