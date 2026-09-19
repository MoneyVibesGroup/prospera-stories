# États réglementaires DIMF des SFD (UMOA) — sources, gabarits et régime de dépôt

Fiche de référence pour [[STORY-509]] (états DIMF 2000 et 2080) et les stories d'EPIC-127. Elle
**source** le gabarit officiel et le régime de dépôt : c'est ce que le jalon `format confirmé` de
STORY-509 exigeait avant toute ligne de code.

> ⚠️ **Relevé le 2026-09-19.** Les empreintes ci-dessous sont celles des PDF téléchargés ce jour-là.
> Un relecteur qui retéléchargerait doit **recalculer** et comparer : un texte réglementaire est
> republié sans préavis.

---

## 1. Les deux versions du référentiel — et laquelle s'applique

Le RCSFD existe en **deux versions**, et le gabarit des états DIMF **diffère** entre elles.

| Version | ISBN | Maquette | Pages | Empreinte sha256 |
|---|---|---|---|---|
| **Développée** | 978-2-916140-08-7 | 27/07/2009 | 457 | `d21c6949ad652248b1e86724eb82b07895f76dce05544facacd72add7d7ffa17` |
| **Allégée** (1re éd., fascicule autonome) | 978-2-916140-11-7 | 17/11/2009 (PDF de mai 2022) | 201 | `334ded79e3ed47e33b247b9423c9a6ed2624f35b8fc40e5339696bd5f90e709d` |

- **Développée** — [microfinance.tresor.gouv.ci (DRSSFD Côte d'Ivoire)](https://microfinance.tresor.gouv.ci/micro/wp-content/uploads/2019/11/RCSSFD.pdf) (23,5 Mo)
- **Allégée** — [cb-umoa.org](https://cb-umoa.org/sites/default/files/2022-05/R%C3%A9f%C3%A9rentiel%20comptable%20sp%C3%A9cifique%20des%20SFD_1.pdf)

⛔ **Les binaires ne sont pas committés** : 23,5 Mo de PDF dans `docs/` seraient de la dette
permanente. Le patron du dépôt est celui de [README-prudentiel-sfd-bceao.md](README-prudentiel-sfd-bceao.md) —
**URL + sha256**, le fichier restant reproductible et vérifiable. Le plus gros PDF versionné ici
pèse 476 Ko.

### Quelle version pour quel SFD — TROIS textes, jamais un seul

| Texte | Ce qu'il fixe |
|---|---|
| **Instruction n°030-02-2009, art. 4** | Les SFD visés à l'**article 44** « sont tenus de présenter leurs états financiers suivant la **version développée** ». Les autres « **peuvent** adopter la version allégée ». |
| **Instruction n°021-12-2010, art. 2** | Restreint cette faculté : allégée réservée aux SFD dont les **encours de dépôts ou de crédit sont < 50 millions FCFA** sur **deux exercices consécutifs**. |
| **Instruction n°007-06-2010, art. 2** | Définit l'**article 44** : encours de dépôts ou de crédits **≥ 2 milliards FCFA** au terme de **deux exercices consécutifs**. Pour les réseaux mutualistes, le seuil s'applique à la faîtière **et** aux caisses de base affiliées. |

⚡ **La conséquence n'est lisible dans aucun des trois pris isolément** : un SFD dont les encours
sont **entre 50 M et 2 Md FCFA** n'est ni tenu par l'article 44, ni éligible à l'allégée — il relève
donc de la **version développée**. ⇒ **L'allégée est le cas marginal**, pas le cas courant.

⚠️ **Choix irréversible** (Instruction n°021-12-2010, art. 3) : un SFD éligible à l'allégée peut
opter pour la développée ; il ne revient à l'allégée que sur **autorisation formelle** des Autorités
de contrôle, et seulement sur changement important de structure ou d'activité. Un modèle qui
recalculerait la version applicable à chaque arrêté se tromperait.

---

## 2. Le régime de dépôt — **papier signé**, annuel

### Instruction n°030-02-2009 (3 février 2009, en vigueur le 1er janvier 2010)

**Article 6** — périodicité, destinataires, délai :

> « Les états financiers ou documents de synthèse sont **arrêtés le 31 décembre** de chaque année et
> transmis en **cinq (5) exemplaires** au Ministre chargé des Finances, dans un délai de **six (6)
> mois** après la clôture de l'exercice. Dans le cas des systèmes financiers décentralisés visés à
> l'article 44 […], ces documents sont également transmis dans le même délai, en **deux (2)
> exemplaires**, respectivement à la BCEAO et à la Commission Bancaire de l'UMOA. »

**Article 7** — support :

> « Les états financiers ou documents de synthèse sont communiqués **sur support papier** au Ministre
> chargé des Finances, à la Banque Centrale et à la Commission Bancaire. Ils doivent être revêtus de
> la **signature** d'une personne dûment accréditée pour engager la responsabilité du système
> financier décentralisé ou de celle d'un commissaire aux comptes, le cas échéant.
>
> Les états financiers ou documents de synthèse **peuvent également** être transmis […] **sur support
> électronique, en complément** des documents sur support papier. »

**Article 8** — conservation **10 ans**.

⛔⛔ **AUCUN format de fichier n'est prescrit — et ce n'est pas une lacune de nos sources, c'est le
texte qui n'en prévoit aucun.** Pas de XML, pas de XBRL, pas de schéma, pas de plateforme régionale
de télétransmission (aucun équivalent SFD du FODEP/BAFI des établissements de crédit n'a été
trouvé). Le RCSFD lui-même (chap. V) décrit un **dossier papier** avec **bordereau d'authentification**
signé et **carte de spécimens de signature** déposée auprès de la tutelle et de la Banque Centrale.

⇒ **Conséquence pour la voie A** ([[STORY-525]]) : « produire le fichier déposable » ne peut pas
vouloir dire produire un flux de télétransmission — il n'en existe pas. Cela signifie produire un
**document imprimable conforme au gabarit**, prêt à signer. **C'est un arbitrage produit, à trancher
par le PO**, mais désormais adossé au texte et non à une supposition.

### Ne pas confondre : deux dispositifs, deux périodicités

| | États DIMF (documents de synthèse) | Indicateurs périodiques |
|---|---|---|
| Texte | Instruction **n°030-02-2009** | Instruction **n°020-12-2010** |
| SFD art. 44 | **annuel**, 31/12, délai **6 mois** | **mensuel**, délai 30 jours calendaires |
| Autres SFD | **annuel**, 31/12, délai **6 mois** | **trimestriel**, délai 30 jours calendaires |
| Support | **papier** obligatoire (électronique en sus) | électronique obligatoire (art. 44) / papier à défaut |

⚠️ **C'est la réponse à l'AC-4 de STORY-509** : l'infra-annuel existe bien (loi-cadre, **art. 55** —
« des **données périodiques** dont la forme, le contenu et le délai de transmission sont précisés par
instruction »), mais il porte sur les **indicateurs**, pas sur les DIMF. Les états DIMF 2000/2080
sont **annuels**. Sous chaque état, le RCSFD porte la même mention : « **Périodicité : remise
annuelle** pour les Systèmes Financiers Décentralisés. »

🪝 Réserve honnête, à ne pas oublier : le RCSFD (§2.4) laisse une porte ouverte — « Les documents de
synthèse **périodiques** sont transmis suivant une périodicité fixée par la BCEAO. » **Aucun texte
trouvé n'active cette faculté pour les DIMF.** Si elle l'était un jour, l'état ne changerait pas de
forme (« les modes de présentation des états périodiques et des états réglementaires sont
**identiques** »), seulement de rythme.

### Instruction n°001-02-2018 (23 février 2018) — le CONTENU, pas le canal

⚠️ **Plusieurs synthèses en ligne lui attribuent à tort le « 5 exemplaires / 6 mois »** : c'est
l'article 6 de l'instruction de 2009. Celle de 2018 **ne traite ni du support, ni du nombre
d'exemplaires, ni du délai**, et son article 8 n'abroge que les « dispositions antérieures
**contraires** traitant du même objet » — **030-02-2009 reste en vigueur**.

Ce qu'elle apporte réellement :

- **Art. 2** — les états financiers sont « le bilan, **le hors-bilan**, le compte de résultat et les
  annexes », avec neuf éléments d'annexe obligatoires : déclaration de conformité au RCSFD, méthodes
  d'évaluation, dérogations, changements de méthode, tableau des emplois et ressources, état des
  crédits en souffrance, **état des engagements par signature**, état des valeurs immobilisées,
  détail du compte « Personnel extérieur à l'institution ».
- **Art. 4** — ⚡ **règle de présentation directement implémentable** : une rubrique ayant enregistré
  une **valeur nulle sur deux exercices consécutifs** peut être omise, **à l'exception des rubriques
  principales, obligatoirement mentionnées**. Un générateur qui masquerait une rubrique principale
  nulle produirait un état non conforme.
- **Art. 5-6** — publication à la charge du SFD ; les références de publication sont notifiées sous
  **7 jours** au Ministère des Finances et à la Direction Nationale de la BCEAO.

---

## 3. Les gabarits — où ils sont, page par page

⚡⚡ **Utiliser le livre DÉVELOPPÉ comme source machine.** Ses annexes sortent en texte brut avec
`pdftotext -layout` — codes postes, libellés **et formules de concordance**. Le fascicule allégé
autonome, lui, a des annexes **en images** (police sans table Unicode) : `pdftotext` n'y rend que du
charabia, il faut `pdftoppm` et une lecture à l'écran. Même piège que pour le prudentiel.

**Et le livre développé contient les DEUX versions** : ses annexes 2 et 3 sont intitulées
« (VERSIONS DÉVELOPPÉE ET ALLÉGÉE) ».

### Cartographie du livre développé (pages **PDF**, pas pages imprimées)

| Annexe | Contenu | Pages PDF |
|---|---|---|
| 1.1 | **Nomenclature des codes postes + concordance avec le plan de comptes** | 351–371 |
| 1.2 | suite, hors-bilan | 372–378 |
| 2.0 / 2.1 | DIMF 2000 — Bilan version **allégée** | 381–388 |
| **2.2 / 2.3** | **DIMF 2000 — Bilan version DÉVELOPPÉE** | **389–396** |
| 2.4 | DIMF 2000 — **Hors bilan**, allégée (397) et développée (398) | 397–398 |
| 3.0 / 3.1 / 3.2 | DIMF 2080 — Compte de résultat version **allégée** | 401–410 |
| **3.3 / 3.4** | **DIMF 2080 — Compte de résultat version DÉVELOPPÉE** | **411–422** |
| 4.1 → 4.14 | États annexes : DIMF 2005 à 2016, 2011-1, 2018 | 425–438 |
| 5 | Tableaux de passage | 439–440 |
| 6.1 → 6.4 | **DIMF 2900** (bilan + hors bilan consolidés), **DIMF 2980** (résultat consolidé) | 443–451 |

**Dix-huit états** au total : DIMF 2000, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2011-1, 2012,
2013, 2014, 2015, 2016, 2018, 2080, 2900, 2980.

### Cartographie du fascicule allégé (à lire en IMAGE)

| Contenu | Pages PDF | Pages imprimées |
|---|---|---|
| Annexe 1 — nomenclature + concordance | 139–154 | A5–A20 |
| Annexe 2 — **DIMF 2000 Bilan** (tables : 157, 158, 159) | 155–160 | A21–A26 |
| Annexe 3 — **DIMF 2080 + SIG** (tables : 163–166) | 161–166 | A27–A32 |
| Annexe 4 — états annexes | 167–176 | A33–A42 |

### Ce que porte l'en-tête d'un état

`Etat:` · `Etablissement:` · `Date d'arrêté : AAAA/MM/JJ` · code document **`D : AA0`** (bilan) ou
**`D : RA0`** (compte de résultat) · `P : A` · `N.S. : XXX X/XX` · `F:XX / NT:XXX` · `M:X` ·
`(en Francs CFA)`. Colonnes **N** et **N-1** ; le bilan ajoute **BRUT / AMT-PROV / NET**.

### La concordance, telle qu'elle se lit

Directement transcriptible, une formule par code (`ex` = extrait de compte, pouvant être débiteur ou
créditeur) :

```
A01  + 101 + 1101 + 111111 + 111121 + 1121 + 1131
     + ex 1141 + ex 1151 + ex 1161 + ex 1171
     + 111117 + 111127 + 1137 + 1147 + 1157 + 1167 + 1177
     + 1261 + 1271 + 1281 + 1267 + 1277 + 1287
     + 1311 + 1331
     + ex 1511 + ex 1521 + ex 1531 + ex 1541 + ex 1551 + ex 1561 + ex 1571
     + 1317 + 1337 + 1517 + 1527 + 1537 + 1547 + 1557 + 1567 + 1577
     + 191 + 192 + 193 + 194 - 199
A10  + 10
A11  + 101
```

⇒ **C'est ce qui rend l'AC-2 de STORY-509 réalisable** (« l'état est produit depuis la liasse déjà
calculée, jamais recalculé en parallèle ») sans inventer une seule correspondance.

### Totaux et soldes

- Bilan : **`E90` TOTAL ACTIF** / **`L90` TOTAL PASSIF**.
- Compte de résultat : **`T84` TOTAL CHARGES** / **`X84` TOTAL PRODUITS** / **`L80`** (EXCÉDENT côté
  charges, DÉFICIT côté produits).
- ⚠️ **Le tableau des SIG n'est PAS un état séparé.** Ses soldes (marge d'intérêt, produit financier
  net, excédent/déficit…) sont des **lignes intercalaires SANS code poste** à l'intérieur du
  DIMF 2080 : « Le modèle est présenté en annexe N°3 **avec le compte de résultat**. » Chercher un
  « état SIG » indépendant, c'est chercher ce qui n'existe pas.

⚠️ **Piège de version** : les tables dites « allégée » **à l'intérieur du livre développé** (maquette
27/07/2009) sont **plus détaillées** que celles du fascicule allégé autonome (maquette 17/11/2009,
donc postérieur) — par exemple `R1A` y est suivi de `R1B…R1K`, absents du fascicule. **Pour
l'allégée, faire foi du fascicule de novembre 2009** ; pour la développée, du livre de juillet 2009.

---

## Ce qui reste NON TROUVÉ — et qu'il ne faut pas inventer

- **Tout format de fichier normé** (XML, XBRL, CSV, schéma) imposé par la BCEAO aux SFD.
- **Tout applicatif régional de télétransmission** SFD.
- Les **canevas tableur des portails nationaux** : leur existence est rapportée par des communiqués
  et de la presse (DRSSFD Côte d'Ivoire, e-Contrôle au Bénin, « Espace Pro » DRS-SFD au Sénégal),
  mais **aucun fichier n'a pu être téléchargé, ni aucun texte fondateur trouvé**. ⛔ Ne pas traiter
  ces mentions comme une source : ce sont des pistes à confirmer pays par pays.

## Textes cités

| Texte | Objet |
|---|---|
| Loi-cadre SFD (6 avril 2007), art. **44, 51, 52, 55** | contrôle BCEAO/CB ; états annuels, délai 6 mois ; données périodiques en cours d'exercice |
| Instruction **n°025-02-2009** | institue le RCSFD |
| Instruction **n°026-02-2009** | conditions de mise en œuvre du plan de comptes |
| Instruction **n°030-02-2009** | établissement et conservation des états financiers — **version applicable (art. 4), délais (art. 6), support (art. 7)** |
| Instruction **n°007-06-2010** | modalités de contrôle — **définit le seuil de l'article 44** |
| Instruction **n°020-12-2010** | **indicateurs périodiques** (à ne pas confondre avec les DIMF) |
| Instruction **n°021-12-2010** | **catégorie autorisée à appliquer la version allégée** |
| Instruction **n°001-02-2018** | **contenu** des états financiers et modalités de publication |

Recueil des textes : [bceao.int](https://www.bceao.int/sites/default/files/2017-11/recueil_texte_sfd.pdf) ·
instructions à l'unité : [cb-umoa.org/fr/sfd](https://cb-umoa.org/fr/sfd).

Voir aussi [README-sfd-bceao.md](README-sfd-bceao.md) (le référentiel comptable côté produit) et
[README-prudentiel-sfd-bceao.md](README-prudentiel-sfd-bceao.md) (provisionnement et ratios).
