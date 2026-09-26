# Les six questions — et la fiche de réponse

> **Artefact examiné :** `cima-assurances@5.0`, empreinte sha256
> `5234764a311cf472bef7f1fd3e8ae1066f6a7c3d8d8cf6849948be92b72c0859`.
> **Destinataires :** profil **A** — expert-comptable ou commissaire aux comptes pratiquant
> l'assurance en zone CIMA — pour **Q1 à Q4** ; profil **B** — actuaire — pour **Q5 et Q6**.
> Qui ils sont, et pourquoi pas la Commission : [`README.md`](README.md).

## Avant de répondre

Trois documents accompagnent celui-ci, et chaque question y renvoie :

- [`formules-en-clair.md`](formules-en-clair.md) — **ce que le produit calcule**, généré depuis
  l'artefact : chaque poste, ses comptes, chaque formule et son développement jusqu'aux comptes (§ 1 à 9) ;
- [`textes-de-reference.md`](textes-de-reference.md) — **ce que dit le texte**, en extraits verbatim :
  art. 432 et 433, circulaire n° 00230/2005, règlements de 2024 (§ 1 à 11) ;
- [`registre-des-reserves.md`](registre-des-reserves.md) — **ce que le produit sait déjà de ses
  limites** (`R-01` à `R-47`).

Chaque sous-question est d'un des trois types suivants — **on ne vous demande pas de lire le texte à
notre place** :

| Type | Ce qu'on vous demande | Réponses possibles |
|---|---|---|
| **LECTURE À CONFIRMER** | le texte tranche ; confirmez que nous le lisons bien | ☐ lecture confirmée · ☐ lecture à corriger · ☐ hors de ma compétence |
| **ÉCART À ARBITRER** | le texte tranche, le paquet s'en écarte ; dites si l'écart est acceptable | ☐ le texte s'applique, le paquet est à corriger · ☐ l'écart est acceptable (dire à quel usage) · ☐ notre lecture du texte est erronée · ☐ hors de ma compétence |
| **QUESTION OUVERTE** | le texte ne tranche pas ; arbitrez | ☐ la proposition du produit est acceptable · ☐ autre réponse, ci-dessous · ☐ hors de ma compétence |

⚠️ **Toute correction doit citer sa référence** — article, circulaire, instruction de la Direction
nationale des assurances, ou usage de place qu'on puisse nommer. Une correction sans référence ne
peut pas entrer dans la `normeSource` de la version suivante de l'artefact.

---

## Q1 — La structure des états · profil A

**Ce que le produit présente** (`formules-en-clair.md` § 1 à 7) : un bilan de **4 postes par côté**
(`CA1`–`CA4`, `CP1`–`CP4`) et ses deux totaux ; un compte de résultat **propre au produit**
(`COMPTE_RESULTAT` — `RT`, `RN`), qui n'est pas un modèle du Code ; les **deux** modèles du compte 80 ;
le compte 87 en squelette. La liasse **scellée** — celle qu'on valide, exporte et dépose — ne contient
que le bilan, le compte de résultat propre et les contrôles : les comptes 80 et 87 ne sont servis
qu'en consultation (R-02).

### 1.1 · QUESTION OUVERTE — Une présentation agrégée, pour quel usage ?

Le modèle du bilan de l'art. 433 détaille plusieurs dizaines de lignes (`textes-de-reference.md` § 4) ;
le paquet en présente huit. Le compte d'exploitation générale est l'un des quatre comptes que l'art.
422 exige — avec le bilan et les comptes 87 et 88 — et il n'entre pas dans la liasse scellée.

- **a.** Un bilan agrégé en 4 + 4 postes a-t-il un usage légitime pour une entreprise d'assurance
  (pilotage, revue analytique), sachant qu'il ne peut pas être déposé ?
- **b.** La liasse que le produit **scelle** doit-elle être celle des modèles de l'art. 433 (bilan
  détaillé, comptes 80, 87 et 88), plutôt que la présentation agrégée ?
- **c.** Le compte de résultat propre au produit (`RT`, `RN`) doit-il être conservé à côté des modèles,
  ou retiré ? `RT` n'est pas le solde du compte 80 : il laisse dehors les charges et produits communs
  que l'art. 432 range au compte 80, et les charges des placements (`67`) alors qu'il en retient les
  produits (`77`) (R-20).

*Proposition du produit : aucune décision prise — la présentation actuelle reste servie, avec son
statut `amorce`, jusqu'à votre réponse.* Réserves : R-02, R-15, R-20.

> ☐ la proposition du produit est acceptable · ☐ autre réponse · ☐ hors de ma compétence
>
> Réponse (a, b, c) : ………………………………………………………………………………………………
>
> Référence : ……………………………………………………………………………………………………

### 1.2 · ÉCART À ARBITRER — La provision pour dépréciation des immobilisations et titres

**Texte** (art. 433, bilan actif, § 4) : « Provision pour dépréciation des immobilisations et titres
(192 et 197) » figure **à l'actif**, à déduire des valeurs immobilisées, et « Titres de placements
divers (55 et moins 195) ».
**Paquet** : tout le compte `19` est au **passif**, poste `CP2` « Provisions pour risques et charges
et dépréciations » (`formules-en-clair.md` § 2). Actif et passif sont gonflés du même montant ; aucun
contrôle ne peut le voir.
**Question** : `192`, `197` et `195` doivent-ils être déduits de l'actif ? Le reste du compte `19`
a-t-il sa place au passif ? Réserve : R-09.

> ☐ le texte s'applique, le paquet est à corriger · ☐ l'écart est acceptable (usage : ……………)
>
> ☐ notre lecture du texte est erronée · ☐ hors de ma compétence
>
> Correction : ………………………………………………………………………………………………………
>
> Référence : ……………………………………………………………………………………………………

### 1.3 · ÉCART À ARBITRER — Les comptes de tiers à double sens

**Texte** (§ 4) : le modèle porte `41` à `45` **des deux côtés**, chacun marqué d'un renvoi ➀ dont le
texte **ne figure pas** sur la page officielle. Il scinde `40` **par sous-compte** : comptes courants
débiteurs (`4000`, `4040`, `4080`) à l'actif, créditeurs (`4001`, `4041`, `4081`) au passif ; et les
créditeurs divers (`4600`, `4601`, `4603`, `4604`, `462` à `468`) au passif.
**Paquet** : `40`, `41`, `44`, `45` et `48` à l'actif seul ; `42`, `43` et `47` au passif seul ; `46`
des deux côtés. Dans le moteur, un compte rattaché à un seul côté et de solde **inverse** diminue son
poste — compté en négatif, sans signal. Seul `46` est réparti, compte par compte, selon le sens de son
solde.
**Questions** :
- **a.** Que dit le renvoi ➀ dans l'édition imprimée du Code ? Faut-il répartir `41` à `45`, compte par
  compte, selon le sens de leur solde ?
- **b.** Pour `40`, la répartition se fait-elle **par sous-compte**, comme le modèle l'énumère, plutôt
  que par sens du solde ?

Réserve : R-10.

> ☐ le texte s'applique, le paquet est à corriger · ☐ l'écart est acceptable (usage : ……………)
>
> ☐ notre lecture du texte est erronée · ☐ hors de ma compétence
>
> Correction (a, b) : ……………………………………………………………………………………………
>
> Référence : ……………………………………………………………………………………………………

### 1.4 · ÉCART À ARBITRER — Les comptes `49`, `17` et `4611` à `4618`

**Texte** : art. 432 (§ 2) — le compte `49` « ne figure pas, en principe, au bilan. Si le reclassement
ne peut pas être effectué, il n'est pas établi de compensation entre les soldes créditeurs et les
soldes débiteurs des comptes, qui doivent apparaître au bilan » ; art. 433 (§ 4) — `49` aux deux côtés,
`17` « Comptes avec le siège social » en créances et en dettes, et « A déduire : versements à effectuer
sur titres non libérés (4611 à 4618) » au bas des valeurs immobilisées.
**Paquet** : `49` n'est routé vers **aucun** poste — un `49` non soldé bloque la validation de la
liasse (compte non affecté) ; `17` est au passif seul ; `46` est rangé en créances ou en dettes selon
son solde, sans déduction des immobilisations.
**Question** : confirmez-vous ces trois écarts, et la présentation qu'appelle le texte ?
Réserves : R-11, R-12, R-14.

> ☐ le texte s'applique, le paquet est à corriger · ☐ l'écart est acceptable (usage : ……………)
>
> ☐ notre lecture du texte est erronée · ☐ hors de ma compétence
>
> Correction : ………………………………………………………………………………………………………
>
> Référence : ……………………………………………………………………………………………………

### 1.5 · QUESTION OUVERTE — Le résultat de l'exercice au bilan : `87` ou `88` ?

**Texte** : le modèle du bilan porte « 87. Résultats (pertes de l'exercice) » à l'actif et « 87.
Résultats (excédent avant affectation) » au passif (§ 4) ; l'art. 432 (§ 3) : « Lorsque l'exercice se
solde par un profit, le compte 88 est crédité avant la répartition des bénéfices par le débit du
compte 87. »
**Paquet** : `88` est rattaché aux capitaux propres (`CP1`) ; le résultat calculé sur les classes 6 et
7 est ajouté au **total** du passif, sans figurer dans la ligne `CP1` publiée ; `87` n'est routé
nulle part.
**Question** : à quel stade de la clôture le bilan CIMA est-il établi ? Quel compte doit porter le
résultat dans le bilan du produit, et doit-il y figurer sur **sa propre ligne** ? Réserve : R-13.

> ☐ la proposition du produit est acceptable · ☐ autre réponse · ☐ hors de ma compétence
>
> Réponse : ……………………………………………………………………………………………………………
>
> Référence : ……………………………………………………………………………………………………

### 1.6 · LECTURE À CONFIRMER — Le niveau de détail du plan

**Lecture** : les comptes peuvent descendre jusqu'à **6 chiffres** — l'art. 430 s'arrête aux
sous-comptes à 4, l'art. 431 énumère des comptes à 5, la clause de l'art. 432 sur la classe 4 nomme
des comptes « à cinq chiffres […] ou à six chiffres », et l'art. 412 ferme le reste (« avec leur numéro
et intitulé »).
**Paquet** : 79 racines à deux chiffres, `05`, et **dix** comptes à trois chiffres ; tout compte plus
long se rattache à son **plus long préfixe** (`formules-en-clair.md` § 8). La transcription des 1 052
comptes de l'art. 431, et de 26 libellés abrégés, est l'objet de STORY-671.
**Questions** :
- **a.** Confirmez-vous le plafond de six chiffres ?
- **b.** En attendant la transcription complète, le rattachement par préfixe est-il acceptable, sachant
  qu'il ne peut **pas** détecter un sous-compte mal placé — un `4001` créditeur est lu comme un `40`, à
  l'actif ?

Réserves : R-06, R-07.

> ☐ lecture confirmée · ☐ lecture à corriger · ☐ hors de ma compétence
>
> Correction (a, b) : ……………………………………………………………………………………………
>
> Référence : ……………………………………………………………………………………………………

---

## Q2 — Les variations de provisions techniques et le compte 80 · profil A

### 2.1 · ÉCART À ARBITRER — Une seule ligne de variation

**Texte** : le modèle du compte 80 **toute nature** (§ 5) place la variation des provisions de
**sinistres** avec les prestations (« A ajouter : provisions de sinistres à la clôture de l'exercice
— A déduire : provisions de sinistres à l'ouverture »), et celle des provisions de **primes** avec les
primes (« A ajouter : provision de primes à l'ouverture — A déduire : provisions de primes à la
clôture ») ; le modèle **vie** porte, pour les provisions mathématiques, une « Dotation aux
provisions de l'exercice ». L'art. 432 (§ 1) en donne les comptes : provisions de sinistres `325`, `355`, `3825`, `3855` ; de primes
`320`, `340`, `350`, `360`, `3820`, `3840`, `3850` ; mathématiques `310`, `340`, `3810`, `3840` — et
leurs cessions.
**Paquet** : une seule ligne `Δ CP3` (tous les comptes `31`, `32`, `34`, `35`, `38`) et une ligne
`Δ CA2` (`39`), dans les deux modèles du compte 80 comme dans le compte de résultat propre
(`EV16`, `EV17`, `EN16`, `EN17`, `RV1`, `RV2`). Le plan s'arrêtant à deux chiffres, `320` et `325`
se confondent dans `32` : la répartition est **impossible** avant STORY-671.
**Questions** :
- **a.** Confirmez-vous la répartition du modèle ?
- **b.** D'ici STORY-671, une ligne unique est-elle acceptable — et pour quel usage — ou le produit
  doit-il **refuser** de servir le compte 80 tant qu'il ne distingue pas primes et sinistres ?

Réserve : R-18.

> ☐ le texte s'applique, le paquet est à corriger · ☐ l'écart est acceptable (usage : ……………)
>
> ☐ notre lecture du texte est erronée · ☐ hors de ma compétence
>
> Correction (a, b) : ……………………………………………………………………………………………
>
> Référence : ……………………………………………………………………………………………………

### 2.2 · QUESTION OUVERTE — Où la variation est-elle comptabilisée ?

**Lecture** : l'art. 431 n'a **aucun** compte de gestion pour la variation d'une provision
technique du passif — le mot « variation » n'y paraît que pour `655` et `7024`, qui visent les primes
acquises et non émises ; les listes de l'art. 432 font entrer les comptes de **classe 3** directement dans les
postes du compte 80. La variation passerait donc par une écriture d'inventaire **contre le compte 80**.
**Conséquence pour le produit, si c'est le cas** : sur une balance où cette écriture est passée mais
où les classes 6 et 7 ne sont pas encore soldées, le résultat comptable que le module fiscal calcule
sur les racines de gestion (`6`, `7`, `82` à `86`) **ignore** la variation des provisions techniques
— `80` étant un compte de regroupement qu'aucune racine ne capte.
**Questions** : comment une entreprise d'assurance CIMA comptabilise-t-elle, en pratique, la
variation de ses provisions techniques ? Sur quelle balance — avant ou après cette écriture —
s'établit la liasse, et se calcule l'impôt ? Réserve : R-22.

> ☐ la proposition du produit est acceptable · ☐ autre réponse · ☐ hors de ma compétence
>
> Réponse : ……………………………………………………………………………………………………………
>
> Référence : ……………………………………………………………………………………………………

### 2.3 · ÉCART À ARBITRER — Les comptes `73`, `74`, `78`, `69` et `79`

**Texte** (art. 432, § 1 et 2) : `73` « est, en fin d'année, soldé par les comptes 701 à 706 » ; `74` est
« soldé en fin d'année (en même temps que les produits accessoires 76) par le compte d'exploitation
80 », et la liste le range en « Produits accessoires : 74, 76, 794, 796 » ; `78` a sa ligne — « Travaux
faits par l'entreprise pour elle-même - Charges non imputables à l'exploitation de l'exercice : 78,
798 » ; les comptes « à l'étranger » (`69`, `79`) sont répartis ligne à ligne avec leurs homologues
nationaux (`691` avec `61`, `692` avec `62`…, `6901` avec les sinistres, `7901` avec les primes).
**Paquet** : aucun de ces comptes n'est routé (STORY-672) : les primes des états consultés sont
surévaluées des ristournes de `73` tant qu'il n'est pas soldé.
**Question** : confirmez-vous ce routage — `73` en déduction des primes, `74` avec les produits
accessoires, une ligne propre pour `78`, et `69`/`79` répartis avec leurs homologues nationaux ?
Réserve : R-17.

> ☐ le texte s'applique, le paquet est à corriger · ☐ l'écart est acceptable (usage : ……………)
>
> ☐ notre lecture du texte est erronée · ☐ hors de ma compétence
>
> Correction : ………………………………………………………………………………………………………
>
> Référence : ……………………………………………………………………………………………………

### 2.4 · ÉCART À ARBITRER — Présentation des commissions reçues et des charges de placement

**Texte** (art. 432, § 1) : « Commissions et autres charges (cessions) : 75, 795 » — la commission
reçue du réassureur vient **en cession** d'une ligne de charges ; « Dotations aux amortissements des
valeurs de placement : 6812, 6813, 6981 » vont aux charges des placements ; « Ajustement des valeurs
affectées aux assurances à capital variable » a ses lignes (`679`, `779`).
**Paquet** : `75` est publié comme un **produit** (`EV12`, `EN12`, `RP3`) ; tout `68` est dans une
ligne de dotations ; `679` et `779` se fondent dans `67` et `77`. Le solde est le même ; la
présentation ne l'est pas.
**Question** : cette présentation est-elle acceptable, et à quel usage ? Réserve : R-19.

> ☐ le texte s'applique, le paquet est à corriger · ☐ l'écart est acceptable (usage : ……………)
>
> ☐ notre lecture du texte est erronée · ☐ hors de ma compétence
>
> Correction : ………………………………………………………………………………………………………
>
> Référence : ……………………………………………………………………………………………………

### 2.5 · QUESTION OUVERTE — Deux limites déclarées : acceptables ?

**Paquet** :
- **sans colonne N-1**, les variations — donc `RT` et les soldes des comptes 80 — ne sont **pas
  publiées**, jamais mises à 0 ; une N-1 fournie **sans** compte de classe 3 est lue comme des
  provisions nulles à l'ouverture, ce qui est juste pour une entreprise nouvelle et faux pour une N-1
  incomplète — rien ne distingue les deux (R-21) ;
- **la réassurance** n'est traitée qu'à la cession : ni la rétrocession, ni les cessions « à l'étranger »
  (`6909`, `7909`), ni les plafonds de l'art. 308, ni l'excédent de plein (R-41).

**Question** : ces limites sont-elles acceptables — et pour quel usage — tant que le produit les
publie avec son statut `amorce` ? Réserves : R-21, R-41.

> ☐ la proposition du produit est acceptable · ☐ autre réponse · ☐ hors de ma compétence
>
> Réponse : ……………………………………………………………………………………………………………
>
> Référence : ……………………………………………………………………………………………………

---

## Q3 — La frontière Vie / Assurances de toute nature · profil A

### 3.1 · LECTURE À CONFIRMER — L'agrément se déduit des affaires directes

**Lecture** : l'art. 326 interdit à une entreprise de pratiquer à la fois les opérations du 1°) et du
2°) de l'art. 300 ; les deux modèles du compte 80 sont donc **alternatifs**, jamais les deux colonnes
d'une liasse. Et l'art. 326 al. 1 exempte d'agrément les **acceptations**.
**Paquet** : l'agrément est déduit des comptes d'**affaires directes** présents dans la balance —
`601`/`701` ⇒ Vie, `602`/`702` ⇒ toute nature, les deux ⇒ `INCOMPATIBLE_ART_326`, aucun ⇒
`INDETERMINABLE` —, les acceptations étant écartées de la déduction. Le modèle qui ne s'applique pas
est servi vide. Une balance à deux chiffres (`60`, `70`) sort toujours `INDETERMINABLE` (R-26).
**Question** : confirmez-vous cette lecture ? Réserve : R-26.

> ☐ lecture confirmée · ☐ lecture à corriger · ☐ hors de ma compétence
>
> Correction : ………………………………………………………………………………………………………
>
> Référence : ……………………………………………………………………………………………………

### 3.2 · ÉCART À ARBITRER — `605` et `705` dans le modèle Vie

**Texte** (art. 432, § 1) : les listes **vie** nomment les sinistres `6010`, `6030`, `6040`, `6060`,
`6901`, `6904` et les primes `701`, `703`, `704`, `706`, `7901`, `7904` — **ni `605` ni `705`**, les
acceptations **dommages**, que seules les listes **toute nature** nomment.
**Paquet** : `EV1` reçoit `601`, `604`, **`605`** ; `EV10` reçoit `701`, `704`, **`705`**
(`formules-en-clair.md` § 5).
**Question** : confirmez-vous que `605` et `705` n'ont pas leur place au compte 80 Vie ? Réserve : R-16.

> ☐ le texte s'applique, le paquet est à corriger · ☐ l'écart est acceptable (usage : ……………)
>
> ☐ notre lecture du texte est erronée · ☐ hors de ma compétence
>
> Correction : ………………………………………………………………………………………………………
>
> Référence : ……………………………………………………………………………………………………

### 3.3 · QUESTION OUVERTE — Les acceptations vie d'une entreprise de toute nature

**Texte** : `604` et `704` (acceptations **vie**) figurent dans les **deux** listes de l'art. 432.
**Paquet** : une entreprise de toute nature qui porte un `704` le voit entrer dans son compte 80
(`EN10`).
**Question** : une entreprise agréée en assurances de toute nature peut-elle accepter en réassurance
des risques vie, et ces acceptations entrent-elles dans son compte 80 ? Réserve : R-27.

> ☐ la proposition du produit est acceptable · ☐ autre réponse · ☐ hors de ma compétence
>
> Réponse : ……………………………………………………………………………………………………………
>
> Référence : ……………………………………………………………………………………………………

### 3.4 · QUESTION OUVERTE — Les comptes que l'art. 432 cite et que l'art. 431 ignore

**Texte** : les listes du compte 80 citent `603`, `606`, `703`, `706`, `7909`, `360`, `3910`, `3930`,
`3950`, `3955`, `3960` ; la liste de l'art. 431 ne les énumère pas. La page officielle porte aussi des
coquilles : `6126` pour `6026`, `6905` sans point, un `6029` en double (sous `602` et sous `620`).
**Paquet** : faute de ces comptes au plan, un `6030`, `6060`, `606`, `703` ou `706` — que les listes du
compte 80 nomment — est capté par `60` ou `70` : il n'alimente que `RC1` ou `RP1`, **jamais** le compte
80 (`formules-en-clair.md` § 8).
**Question** : ces comptes existent-ils — dans une édition imprimée, une circulaire, un plan de place ?
Le produit doit-il les créer, et avec quels libellés ? Réserve : R-08.

> ☐ la proposition du produit est acceptable · ☐ autre réponse · ☐ hors de ma compétence
>
> Réponse : ……………………………………………………………………………………………………………
>
> Référence : ……………………………………………………………………………………………………

---

## Q4 — La classe 8 · profil A

### 4.1 · LECTURE À CONFIRMER — Les comptes de regroupement

**Lecture** (art. 432, § 1 et 3) : « Le solde du compte 80 est viré, pour clôture des écritures, au
compte 87 » ; `87` est crédité ou débité du résultat, puis viré à `88`, et `89` est le bilan. `80`,
`87`, `88` et `89` **reprennent** ce que d'autres comptes portent déjà : ce sont des comptes de
**regroupement**. `82` à `86` ont des mouvements propres.
**Paquet** : les racines de gestion sont `6`, `7`, `82` à `86` ; `80`, `87`, `88` et `89` sont
marqués `REGROUPEMENT`, et le générateur refuse tout paquet dont une racine en capterait un
(`formules-en-clair.md` § 9). Additionner `80` aux classes 6 et 7 doublait exactement le résultat.
**Question** : confirmez-vous cette lecture ? Réserve : R-30.

> ☐ lecture confirmée · ☐ lecture à corriger · ☐ hors de ma compétence
>
> Correction : ………………………………………………………………………………………………………
>
> Référence : ……………………………………………………………………………………………………

### 4.2 · QUESTION OUVERTE — Le compte 87, et ce qu'on appelle « résultat net »

**Texte** (art. 433, § 6) : le compte 87 reçoit le résultat d'exploitation (`80`), les pertes et
profits sur exercices antérieurs (`820`, `822`), les **provisions pour moins-values** (`150`, `19`) à
la clôture et à l'ouverture, les dotations aux réserves (`831`, `833`…) et aux provisions pour
pertes (`839`), les reprises (`828`, `829`), les pertes et profits exceptionnels (`840` à `849`), et
les impôts sur les bénéfices (`85`) ; son solde est le « Bénéfice ou excédent net total ».
**Paquet** : le compte 87 est servi en **squelette** (STORY-672) ; `RN` s'intitule « résultat net »
mais n'intègre aucun des comptes `82` à `86` — ni donc l'impôt (`85`) ; le module fiscal ne reprend jamais la charge
d'impôt passée en `85`.
**Questions** :
- **a.** Le « résultat net » du produit doit-il être le solde du compte 87 ?
- **b.** La variation des provisions `150` et `19` passe-t-elle par le compte 87, et non par une
  dotation de classe 6 ? La réponse éclaire aussi la question 1.2.
- **c.** L'impôt sur les bénéfices (`85`) doit-il être repris avant l'assiette fiscale, comme le
  produit le fait pour ses autres référentiels ?

Réserves : R-17, R-23, R-28, R-29.

> ☐ la proposition du produit est acceptable · ☐ autre réponse · ☐ hors de ma compétence
>
> Réponse (a, b, c) : ……………………………………………………………………………………………
>
> Référence : ……………………………………………………………………………………………………

### 4.3 · QUESTION OUVERTE — Le compte 88

**Texte** : l'art. 422 exige « le compte des résultats en instance d'affectation établi selon le compte
88 », dont l'art. 433 donne le modèle (§ 6).
**Paquet** : il n'est pas produit.
**Question** : le produit doit-il le produire, et à partir de quelles données — la décision
d'affectation n'étant pas dans la balance ? Réserve : R-24.

> ☐ la proposition du produit est acceptable · ☐ autre réponse · ☐ hors de ma compétence
>
> Réponse : ……………………………………………………………………………………………………………
>
> Référence : ……………………………………………………………………………………………………

---

## Q5 — Les méthodes de provisionnement · profil B

### 5.1 · LECTURE À CONFIRMER — Ce que le module calcule, et ce qu'il laisse saisir

Le catalogue que sert `assurance-service` (`GET /api/v1/dossiers/{dossierId}/assurance/provisions-techniques/methodes`)
classe **chaque** provision des art. 334-2 (vie) et 334-8 (autres opérations). **Une seule** est
calculée ; toutes les autres sont **saisies** par l'entreprise, avec leur méthode et leur auteur :

| Catégorie | Provision | Origine | Fondement servi | Pourquoi le module ne calcule pas |
|---|---|---|---|---|
| Non-vie | risques en cours | **calculée** | art. 334-8 2°, 334-9, 334-10 | — |
| Non-vie | sinistres à payer | saisie | art. 334-8 3°, 334-12, 334-13 | jugement exigé par le texte ; renvoi à une circulaire ; accord de la Commission requis |
| Non-vie | mathématique des rentes | saisie | art. 334-8 1°, 334-5 | donnée absente de ce service |
| Non-vie | risques croissants | saisie | art. 334-8 4° | donnée absente |
| Non-vie | égalisation | saisie | art. 334-8 5° | aucune méthode dans le texte |
| Non-vie | mathématique des réassurances | saisie | art. 334-8 6° | donnée absente |
| Non-vie | annulation de primes | saisie | art. 334-8 7° | renvoi à une circulaire |
| Non-vie | risque d'exigibilité | saisie | art. 334-8 8°, 334-14, 335-12 | donnée absente |
| Non-vie | autre, fixée par la Commission | saisie | art. 334-8 9° | renvoi à une circulaire |
| Vie | mathématique | saisie | art. 334-2 1°, 334-3, 334-4 1°, 338 | donnée absente |
| Vie | participation aux excédents | saisie | art. 334-2 2° | donnée absente |
| Vie | de gestion | saisie | art. 334-2 3°, 334-4 2° | jugement exigé par le texte ; donnée absente |
| Vie | risque d'exigibilité | saisie | art. 334-2 4°, 334-14, 335-12 | donnée absente |
| Vie | autre, fixée par la Commission | saisie | art. 334-2 5° | renvoi à une circulaire |

**Question** : cette classification est-elle juste, ligne par ligne — et chaque motif est-il le bon ?
Une provision que vous jugeriez calculable ici, ou une provision calculée qui ne devrait pas l'être,
est une correction. ⚠️ La mise en garde servie pour « Vie — de gestion » cite encore la rédaction de
2018 de l'art. 334-4 2° : le règlement n° 02/2024 l'a changée (`textes-de-reference.md` § 10 ; R-38).

> ☐ lecture confirmée · ☐ lecture à corriger · ☐ hors de ma compétence
>
> Correction (ligne, motif) : ……………………………………………………………………………………
>
> Référence : ……………………………………………………………………………………………………

### 5.2 · LECTURE À CONFIRMER — Le Code n'exige pas d'actuaire

**Lecture** : aucun article du Code ne demande qu'un actuaire valide une provision technique ; le
dossier annuel est certifié par un **mandataire social**, « sous les sanctions prévues » (art. 425).
Les trois règlements de 2024 que nous avons lus (n° 02, 004, 006) n'en créent pas ; la seule exigence
actuarielle relevée dans le corpus (STORY-519) vise le **tarif** de la microassurance indicielle
(circulaire n° 0003/CIMA/CRCA/PDT/2015), pas une provision. La validation que
ce dossier sollicite est donc une exigence **du produit**, et la qualité de son signataire reste un
texte libre.
**Question** : confirmez-vous qu'aucun texte en vigueur — Code, règlement, circulaire, instruction
nationale — n'impose un actuaire, agréé ou non, pour ces provisions ? Réserve : R-04.

> ☐ lecture confirmée · ☐ lecture à corriger · ☐ hors de ma compétence
>
> Correction : ………………………………………………………………………………………………………
>
> Référence : ……………………………………………………………………………………………………

### 5.3 · QUESTION OUVERTE — La provision pour risques en cours, seule calculée

**Paquet** : le module calcule le **montant minimal** de l'art. 334-10 — le forfait de 36 % des primes
de l'exercice non annulées, ou, sur déclaration de l'évaluateur, le prorata temporis — et laisse à
l'entreprise l'obligation de suffisance de l'art. 334-9. Quatre réserves sont servies avec le chiffre.
**Questions** — chacune est acceptable ou ne l'est pas :
- **a.** le plancher publié ignore l'**art. 334-11** (part des cessionnaires, abandons de primes), que
  l'art. 334-9 rend pourtant obligatoire (R-31) ;
- **b.** le calcul se fait **par catégorie** (Vie, Non-Vie), non **par branche** comme le demande l'art.
  334-10 (R-32) ;
- **c.** la condition du prorata (« en cas d'inégale répartition des échéances ») est **déclarée** par
  l'évaluateur, jamais vérifiée — le texte ne donne aucun seuil (R-33) ;
- **d.** le module calcule aussi cette provision en **Vie**, que la liste de l'art. 334-2 ne contient
  pas ; elle y est servie sans fondement (R-34).

> ☐ la proposition du produit est acceptable · ☐ autre réponse · ☐ hors de ma compétence
>
> Réponse (a, b, c, d) : …………………………………………………………………………………………
>
> Référence : ……………………………………………………………………………………………………

### 5.4 · LECTURE À CONFIRMER — La méthode des sinistres tardifs

**Lecture** : l'art. 334-12 renvoie à une circulaire pour « le coût des sinistres survenus mais non
déclarés » ; c'est la **circulaire n° 00230/CIMA/CRCA/PDT/2005 du 24 octobre 2005**
(`textes-de-reference.md` § 8) : cadences de **déclarations** tardives construites sur le tableau C de
l'état C10b, moyenne sur quatre années, nombre estimé multiplié par le coût moyen des sinistres
déclarés.
**Questions** : cette circulaire est-elle toujours en vigueur, et sans texte plus récent ? S'applique-t-elle
à toutes les branches, transports compris ? Réserve : R-35.

> ☐ lecture confirmée · ☐ lecture à corriger · ☐ hors de ma compétence
>
> Correction : ………………………………………………………………………………………………………
>
> Référence : ……………………………………………………………………………………………………

### 5.5 · QUESTION OUVERTE — Le chargement de gestion de la PSAP

**Texte** (art. 334-13) : la provision pour sinistres à payer est complétée d'un chargement de gestion
qui « ne peut être inférieure à 5 % » — l'article ne dit pas **de quoi**.
**Question** : quelle assiette, et le plancher de 5 % est-il appliqué en pratique comme un minimum ou
comme un forfait ? Réserve : R-37.

> ☐ la proposition du produit est acceptable · ☐ autre réponse · ☐ hors de ma compétence
>
> Réponse : ……………………………………………………………………………………………………………
>
> Référence : ……………………………………………………………………………………………………

### 5.6 · Pour information — les méthodes statistiques ne se valident pas ici

L'art. 334-12 permet une méthode statistique (chain-ladder compris) « avec l'accord de la Commission »
et pour les **deux derniers exercices** de survenance. Cet accord est donné **à une entreprise** : ce
n'est pas une propriété que le produit peut acquérir, ni une question que vous pouvez trancher pour
lui. Le produit n'en calcule aucune (R-36). *Aucune réponse attendue.*

### 5.7 · QUESTION OUVERTE — Deux limites déclarées : acceptables ?

**Paquet** :
- **aucune provision, aucun sinistre, aucune cession** calculés ou hébergés par `assurance-service`
  n'atteint la liasse : l'adaptateur de balance n'existe pas, et une méthode validée ne change la
  liasse que si l'entreprise en passe le résultat en balance (R-42) ;
- **ne sont pas couverts** : les transports (rattachés à l'exercice de souscription, état C10c), la
  maladie, les sauvetages (sans compte au plan) et le risque d'exigibilité (R-40).

**Question** : ces limites sont-elles acceptables — et pour quel usage — tant que le produit les
publie avec son statut `amorce` ? Réserves : R-40, R-42.

> ☐ la proposition du produit est acceptable · ☐ autre réponse · ☐ hors de ma compétence
>
> Réponse : ……………………………………………………………………………………………………………
>
> Référence : ……………………………………………………………………………………………………

---

## Q6 — La cadence · profil B

### 6.1 · LECTURE À CONFIRMER — La cadence du régulateur est une cadence de déclarations

**Lecture** : le Code ne connaît pas de « cadence de règlement ». La seule cadence qu'un texte nomme est
celle de la circulaire n° 00230/2005 : une cadence de **déclarations**, en **nombre**, par exercice de
survenance — la ligne « Dont déclarés au cours de l'exercice écoulé » du tableau C de l'état C10b
(`textes-de-reference.md` § 7).
**Paquet** : `assurance-service` collecte, par dossier de sinistre, la **date de survenance** et la
**date de déclaration** ; son état C10b (`GET /api/v1/dossiers/{dossierId}/assurance/sinistres-par-exercice-de-survenance`)
publie les tableaux C, D et E, mais pas cette ligne.
**Question** : confirmez-vous que la donnée qui alimente les tardifs est le nombre de sinistres par
exercice de survenance **et d'année de déclaration**, avec le coût moyen des sinistres déclarés — et
que le produit doit publier cette ligne ? Réserve : R-35.

> ☐ lecture confirmée · ☐ lecture à corriger · ☐ hors de ma compétence
>
> Correction : ………………………………………………………………………………………………………
>
> Référence : ……………………………………………………………………………………………………

### 6.2 · QUESTION OUVERTE — La maille de l'état C10b

**Paquet** : l'état est tenu **par catégorie Vie / Non-Vie**, lignes par exercice de survenance,
colonnes par exercice d'opération ; les exercices trop anciens sont agrégés sur une ligne « antérieurs ».
**Texte** : l'art. 433 (§ 7) établit l'état C10b « pour l'ensemble des opérations d'assurances dommages
réalisées dans le pays et pour chacune des catégories d'assurances dommages définies à l'article 411 » ;
le modèle C10 B annexé au règlement n° 006/2024 est « à répéter pour toutes catégories des assurances
terrestres », et ses tableaux A et B — les seuls qu'il republie — portent **dix** exercices (N-9 à N) ;
la circulaire travaille sur **quatre** années de déclaration.
**Questions** : quelle maille — l'ensemble, plus chaque catégorie de l'art. 411 — et quelle profondeur le produit
doit-il tenir pour que son état C10b serve, d'une part au dépôt, d'autre part au calcul des tardifs ?
Réserve : R-39.

> ☐ la proposition du produit est acceptable · ☐ autre réponse · ☐ hors de ma compétence
>
> Réponse : ……………………………………………………………………………………………………………
>
> Référence : ……………………………………………………………………………………………………

### 6.3 · QUESTION OUVERTE — À quoi sert le triangle des paiements ?

**Paquet** : le tableau D publie les **paiements** par exercice de survenance et par exercice
d'opération, avec la provision en vigueur à la date d'arrêté.
**Question** : au-delà du tableau D lui-même, ce triangle a-t-il un usage réglementaire — hors des
méthodes statistiques soumises à l'accord de la Commission (5.6) ? Réserve : R-39.

> ☐ la proposition du produit est acceptable · ☐ autre réponse · ☐ hors de ma compétence
>
> Réponse : ……………………………………………………………………………………………………………
>
> Référence : ……………………………………………………………………………………………………

---

## Récapitulatif

| Sous-question | Type | Profil | Réserves |
|---|---|:---:|---|
| 1.1 Présentation agrégée, pour quel usage | question ouverte | A | R-02, R-15, R-20 |
| 1.2 Provision pour dépréciation `19` | écart | A | R-09 |
| 1.3 Comptes de tiers à double sens | écart | A | R-10 |
| 1.4 `49`, `17`, `4611`–`4618` | écart | A | R-11, R-12, R-14 |
| 1.5 Résultat au bilan : `87` ou `88` | question ouverte | A | R-13 |
| 1.6 Niveau de détail du plan | lecture | A | R-06, R-07 |
| 2.1 Une seule ligne de variation | écart | A | R-18 |
| 2.2 Où la variation est comptabilisée | question ouverte | A | R-22 |
| 2.3 `73`, `74`, `78`, `69`, `79` | écart | A | R-17 |
| 2.4 Commissions reçues, charges de placement | écart | A | R-19 |
| 2.5 Deux limites : la colonne N-1, la réassurance | question ouverte | A | R-21, R-41 |
| 3.1 L'agrément se déduit des affaires directes | lecture | A | R-26 |
| 3.2 `605` et `705` dans le modèle Vie | écart | A | R-16 |
| 3.3 Acceptations vie d'une entreprise de toute nature | question ouverte | A | R-27 |
| 3.4 Comptes cités par l'art. 432, absents de l'art. 431 | question ouverte | A | R-08 |
| 4.1 Comptes de regroupement | lecture | A | R-30 |
| 4.2 Le compte 87 et le « résultat net » | question ouverte | A | R-17, R-23, R-28, R-29 |
| 4.3 Le compte 88 | question ouverte | A | R-24 |
| 5.1 Ce que le module calcule et laisse saisir | lecture | B | R-38 |
| 5.2 Le Code n'exige pas d'actuaire | lecture | B | R-04 |
| 5.3 La provision pour risques en cours | question ouverte | B | R-31 à R-34 |
| 5.4 La méthode des tardifs | lecture | B | R-35 |
| 5.5 Le chargement de la PSAP | question ouverte | B | R-37 |
| 5.6 Les méthodes statistiques | information | B | R-36 |
| 5.7 Deux limites : la chaîne vers la liasse, les branches non couvertes | question ouverte | B | R-40, R-42 |
| 6.1 Une cadence de déclarations | lecture | B | R-35 |
| 6.2 La maille de l'état C10b | question ouverte | B | R-39 |
| 6.3 Le triangle des paiements | question ouverte | B | R-39 |

## Signature

Chaque profil signe pour les questions qu'il a examinées. Une réponse « hors de ma compétence » n'est
pas une validation : la sous-question reste ouverte.

| | Profil A | Profil B |
|---|---|---|
| Nom | | |
| Qualité (texte libre) | | |
| Questions examinées | Q1 à Q4 | Q5, Q6 |
| Commit du dossier reçu (rempli à l'envoi) | | |
| Date | | |
| Signature | | |

> **Déclaration.** Les réponses ci-dessus portent sur l'artefact `cima-assurances@5.0` identifié par
> l'empreinte sha256 `5234764a311cf472bef7f1fd3e8ae1066f6a7c3d8d8cf6849948be92b72c0859`, **telle que
> la présente le dossier au commit indiqué ci-dessus**, et sur lui seul. Elles ne valent pour aucune
> autre version.
>
> ☐ **J'accepte** que mon nom et ma qualité soient publiés avec le paquet, dans son `meta`, si ma
> validation contribue à le déclarer `certifie` — ce `meta` est servi à tout utilisateur du produit,
> et une copie du paquet peut être versée au dépôt **public** de la documentation, lisible par tous.
