# Revue expert-comptable de la maquette cumulative — portée multi-secteur et multi-pays

> **Date :** 2026-08-27 · **Demandée par :** le PO · **Objet :** juger la maquette cumulative comme
> un expert-comptable, sur une question de **portée** : le module doit tenir une **microfinance**,
> une **assurance**, une **petite boutique** et un **distributeur de zone franche**, sur la
> **CEDEAO** puis au-delà (Afrique de l'Est, Europe, Amérique).

---

## 0. Décisions PO rendues ce jour

| # | Question | Décision |
|---|---|---|
| **D1** | Qui utilise l'application ? | **Le collaborateur de cabinet ou l'expert-comptable.** Jamais le gérant de la boutique. |
| **D2** | Le plan de comptes suit-il le dossier ? | **Voie A**, confirmée. *« Valider une balance d'une IMF doit être contre son plan, de même pour une assurance. »* |
| **D3** | Une balance dont le référentiel n'est pas packagé ? | **Refus à la construction** (Q2 de STORY-422). |
| **D4** | Portée géographique | **UEMOA d'abord, CEDEAO visée, puis au-delà** — et la scalabilité se corrige **maintenant**, pas quand elle coûtera. |
| **D5** | Journaux, grand livre, tiers, lettrage | **Entrent au programme**, avec l'IA dans le périmètre et non ajoutée après. |
| **D6** | Microfinance et assurance | **Promises.** Découpées, et l'assurance en **deux paliers**. |

### Ce que D1 simplifie, et qu'il faut arrêter de discuter

L'utilisateur est un **professionnel du chiffre**. Trois conséquences immédiates :

1. **Le vocabulaire comptable reste.** « Balance », « à-nouveaux », « classe 7 », « table de
   passage » sont le vocabulaire de l'utilisateur, pas un jargon à traduire. La question
   « faut-il simplifier les termes ? » est close.
2. **La carte « Tenir mes cahiers » s'adresse au cabinet**, pas au commerçant : c'est le
   collaborateur qui saisit les cahiers de son client, ou qui relit ce que l'OCR a lu. Le
   parcours n'a pas à être conçu pour un non-comptable.
3. **En revanche, D1 ne réduit en rien les exigences de justesse.** Un professionnel ne pardonne
   pas un chiffre faux — il le repère, et il perd confiance dans tout l'écran. C'est ce qui rend
   les onze écarts ci-dessous prioritaires malgré leur apparence technique.

---

## 1. Le résultat le plus instructif de la revue

**Quatre des onze écarts portent sur du travail déjà fait.**

| Artefact | État | Pourquoi il est inatteignable |
|---|---|---|
| `cima-assurances@1.0` | packagé côté `bilan-service` depuis **STORY-122** | `REFERENTIELS_BALANCE` ne connaît que `SN`/`SMT`/`SFD-BCEAO` ⇒ **500** sur un dossier régulier |
| `zone-franche-togo@1.0` | packagé, chiffré et sourcé depuis le **2026-07-21** (STORY-121) | le dossier n'a que **deux axes** ; aucun ne le sélectionne |
| Gabarit de liasse **SMT** | `LIASSE SYSCOHADA REVISE- SMT-Réf 24-01-19.xlsx`, **au dépôt** | jamais packagé ⇒ `409 REFERENTIEL_NON_PACKAGE` |
| Plan **SFD-BCEAO @2.0** | 372 comptes sourcés, complet, servi | validé contre le plan de **l'organisation**, pas du dossier |

⇒ **Règle qui sort de cette revue : un artefact livré sans chemin d'accès coûte autant qu'un
artefact absent — et il coûte en plus l'illusion qu'il est disponible.**

## 2. Ce qui a été confirmé, et qu'il ne faut pas refonder

L'architecture multi-référentiel est **la bonne**. `bilan-service` est un moteur d'états agnostique
(invariant P7), toute la sémantique vit dans un paquet vérifié par checksum, et **ajouter un
référentiel ne touche pas le moteur**. Le moteur sait déjà rendre les **absences** d'un référentiel
réduit (`postes: []`, contrôle `NON_APPLICABLE`, `coherent: true`) sans les traiter comme des
anomalies, et l'écran sait déjà les **expliquer** au lieu de masquer l'onglet.

**Le programme n'a pas à se refonder pour aller à la CEDEAO. Il a à finir de brancher ce qu'il a
déjà, et à déclarer ce que ses paquets ne disent pas d'eux-mêmes.**

## 3. Le seul écart dont le coût est daté

**STORY-489 — la devise.** Le contrat canonique de balance ne porte aucune devise, et son « ×100 »
est une convention XOF que rien ne déclare (l'exposant ISO 4217 du franc CFA vaut **0** : le produit
a inventé deux décimales et les a nommées « unités mineures XOF »).

Ce n'est pas cosmétique : la tolérance d'équilibre « < 100 unités mineures » vaut « moins d'1 franc »
aujourd'hui, et vaudrait « moins d'1 euro » sur une monnaie à deux décimales réelles — **cent fois
plus permissif, sans que personne ne l'ait décidé**.

⚡ Le contrat est un contrat de **pièces immuables** : chaque balance porte un checksum, chaque liasse
figée cite la balance qui l'a produite. Aujourd'hui, ajouter la devise est un ajout de champ. Après,
c'est une réinterprétation rétroactive de montants figés. **C'est la seule story du programme dont
le coût double à chaque pays ouvert.**

---

## 4. CEDEAO : ce que le mot recouvre vraiment

L'assistant écrit « Zone UEMOA → monnaie XOF ». **L'UEMOA n'est pas la CEDEAO**, et la confusion se
paie en produit :

| Groupe | Pays | Monnaie | Cadre comptable |
|---|---|---|---|
| UEMOA + OHADA | Bénin, Burkina, Côte d'Ivoire, Guinée-Bissau, Mali, Niger, Sénégal, **Togo** | XOF | SYSCOHADA ✅ packagé |
| OHADA hors UEMOA | **Guinée** | **GNF** | SYSCOHADA ✅ packagé, **devise non exprimable** |
| **Hors OHADA** | Nigeria, Ghana, Sierra Leone, Liberia, Gambie, Cabo Verde | NGN, GHS, SLE, LRD, GMD, CVE | **IFRS / IFRS for SMEs** ❌ rien |

**La Guinée est le cas qui prouve le besoin** : elle est OHADA — donc le référentiel comptable est
déjà là — et elle n'est pas UEMOA, donc sa monnaie est le GNF. Elle tombe **entre les deux règles
que le produit connaît**, et rien aujourd'hui ne peut la servir.

**Trajectoire recommandée :**

1. **Phase 1 — OHADA** (9 États de la CEDEAO + 8 hors CEDEAO). Un référentiel déjà packagé, N
   paquets fiscaux à sourcer. STORY-491/492/493 en font une opération répétable.
2. **Phase 2 — CEDEAO hors OHADA** : un référentiel **IFRS for SMEs** à packager. Le moteur le
   supporte ; c'est un travail de sourcing, pas d'architecture.
3. **Phase 3 — Afrique de l'Est, Europe, Amérique** : mêmes mécanismes. ⚠️ L'Europe ajoute une
   contrainte que rien n'a encore rencontrée — le **RGPD** et la localisation des données — qui est
   une question d'hébergement et de contrat, pas de comptabilité.

⚠️ **Ce que le registre des pays (STORY-492) ne fait pas** : ce n'est pas une liste de pays où l'on
vend, c'est une liste de pays dont le **cadre comptable et fiscal est packagé**. Les deux se
confondent aujourd'hui parce qu'il n'y en a qu'un.

---

## 5. Livrables de cette revue

| Livrable | Détail |
|---|---|
| **11 stories backend** | STORY-487 → 496 **+ STORY-533**, **73 pts, toutes slottées S20** sur décision PO |
| **2 stories frontend** | FE-082 (pays, devise, 3ᵉ axe) et FE-083 (plan du dossier + refus lisibles), sprint front 12, `blocked` |
| **STORY-422 mise à jour** | arbitrage voie A inscrit **dans la fiche**, Q2 tranchée, 3 AC ajoutés |
| **4 plages d'épics** | EPIC-106→110 (socle) · 111→120 (`comptabilite-service`) · 121→127 (microfinance) · 128→134 (assurance) |
| **3 découpages** | `epics-comptabilite-2026-08-27.md` · `epics-microfinance-2026-08-27.md` · `epics-assurance-2026-08-27.md` |
| **2 fondations dé-différées** | `comptabilite-service` → `PROGRAMMÉ` ; verticaux → `PARTIELLEMENT PROGRAMMÉ` |

### L'ordre est contraignant, et il est court

```
STORY-533  →  STORY-422  →  STORY-487 + STORY-494  (ensemble ou pas du tout)
STORY-489  →  STORY-490  →  STORY-495
STORY-491  →  STORY-492
STORY-488, STORY-493, STORY-496 : indépendantes
```

Les tirer autrement coûte une **réécriture**, pas un retard.

---

## 6. Ce qui reste ouvert après ce lot — la liste à arbitrer

Les cinq demandes du PO sont traitées. Voici ce que la revue a trouvé **et qui n'entre dans aucune
des onze stories**, classé par ce qu'il coûte de ne rien faire.

### 6.1 ⛔ Le dépôt, pays par pays — le plus gros poste de coût caché du programme

Le produit s'arrête à la liasse et à son export. Ce que le client achète, c'est **le dépôt** :
l'**e-DSF** à l'OTR au Togo, et des plateformes, des formats et des calendriers **différents** à la
DGI du Bénin, de Côte d'Ivoire, du Sénégal.

**État réel :** `EPIC-032` (dépôt assisté, accusé, dossier de contrôle) est cadré et porte déjà un
jalon `format confirmé` ; **FE-081** (enregistrer un dépôt et son accusé) est écrite et `blocked`
sur **STORY-446**, non livrée. Ce qui existe couvre donc **la trace du dépôt**, pas **le dépôt**.

⚠️ **Sur 9 pays OHADA, ce sont 9 intégrations, pas une.** Aucune n'est chiffrée. ⇒ **À arbitrer :
Prospera produit-il le fichier de télédéclaration, ou s'arrête-t-il à la liasse imprimable que le
cabinet dépose lui-même ?** La seconde réponse est parfaitement défendable et divise le coût du
programme international — mais elle doit être **dite**, parce qu'un cabinet suppose la première.

### 6.2 ⛔ Immobilisations et amortissements — le produit *restitue* ce que rien ne *calcule*

`cadrage-immobilisations-2026-08-16.md` l'a déjà établi et le dit sans confort : le bilan sort ses
colonnes **Brut / Amort / Net** (STORY-059) et les notes d'immobilisations (STORY-062) **sans
qu'aucun registre ne tienne un plan d'amortissement**. Les valeurs viennent de la balance ; si le
client ne les a pas calculées ailleurs, elles n'existent pas.

Le module 5 est **cadré, sans PRD, sans épics, sans story**, 2 sprints estimés, et il concerne
**les quatre verticales**. ⇒ **À arbitrer : le sortir du cadrage.** C'est le manque le plus visible
pour un expert-comptable après les tiers et le lettrage — une dotation aux amortissements est un
calcul d'arrêté, pas une donnée reprise.

### 6.3 ⛔ Un groupe ne peut pas exister — `POST /profil-societe` répond 409

`POST /profil-societe` répond `409 PROFIL_SOCIETE_DEJA_EXISTANT` (index unique sur `orgId`), il n'y
a **pas de `societeId` sur la balance**, et **zéro occurrence de « consolidation »** dans tout le
produit. Le manque est nommé dans le `dc-note` de la maquette depuis longtemps — **il n'a jamais eu
de story**.

Or « gros distributeur » veut presque toujours dire **groupe** : N sociétés, N points de vente, N
patentes. ⇒ **À arbitrer : le multi-société est-il dans la promesse ?** Si oui, c'est structurel et
ça se décide avant `comptabilite-service`, pas après.

### 6.4 ⚠️ Inventaire et variation de stocks — réservé, sans code

`stock-service` a sa plage (EPIC-075→084, 153 pts) et **aucun code**. Sans inventaire physique et
sans variation de stocks, **la marge brute d'un distributeur est fausse** — et rien ne le signale,
puisque la balance reste équilibrée. C'est une question de **rang de séquence**, pas de découpage :
le travail est cadré.

### 6.5 ⚠️ La durée de l'exercice ne traverse pas la liasse

La DSF porte une colonne « **Durée (en mois)** ». Un premier exercice de 18 mois ou une clôture
décalée est le cas **normal** d'une entreprise qui démarre — donc de la persona la plus nombreuse.
`STORY-468` a fiché le manque **côté prévisionnel** (`AncresProjection` et `HypothesesBase` ne
portent pas la durée). ⇒ **À vérifier côté États** : la liasse publie-t-elle la durée de son
exercice ? Si non, c'est une story, et elle est petite.

### 6.6 ⚠️ Le référentiel IFRS for SMEs — phase 2, à décider maintenant pour ne pas la subir

Six des quinze États de la CEDEAO n'auront jamais de liasse SYSCOHADA. Le moteur les supporte
(STORY-491 rend le paquet descriptible) ; ce qui manque est **le sourcing d'un référentiel IFRS-PME**
— plan, postes, table de passage, gabarit d'états. ⇒ **À arbitrer : phase 2 ou hors promesse ?** La
seconde réponse est acceptable ; ce qui ne l'est pas, c'est de laisser croire « CEDEAO » en servant
l'OHADA.

### 6.7 ⚠️ Deux moteurs d'assistance sur les mêmes objets

`ia-service` reste `deferred`, et **deux de ses usages sont désormais dans le périmètre de
`comptabilite-service`** (EPIC-117 imputation et lettrage assistés, EPIC-118 anomalies du journal).
⇒ **À trancher : `ia-service` reste-t-il distinct, ou `assistant-service` porte-t-il ces usages ?**
Deux moteurs d'assistance sur les mêmes objets divergeraient en silence — c'est le patron de
l'union de types dupliquée relevé à FE-050, à l'échelle d'un service.

### 6.8 ⚠️ Europe : une contrainte que le programme n'a jamais rencontrée

La trajectoire annoncée passe par l'Europe. Le RGPD et la **localisation des données** sont une
question d'hébergement et de contrat, pas de comptabilité — mais elle se décide au niveau de
l'architecture plateforme, et **rien dans les 9 spines existantes ne l'aborde**.

---

## 7. Recommandation de séquence

1. **Le lot S20 tel qu'il est ordonné au §5.** Il ferme la scalabilité pendant qu'elle est gratuite.
2. **§6.2 (immobilisations)** — sortir le module 5 du cadrage. Quatre verticales, deux sprints, et
   c'est ce qu'un expert-comptable cherche juste après les tiers.
3. **§6.1 et §6.3** — deux arbitrages de **promesse**, pas de développement. Ils coûtent une
   décision et changent le chiffrage du programme international du simple au double.
4. **`comptabilite-service`** — ses quatre questions (Q1 à Q4 de son découpage) avant son premier
   point. En particulier Q4 : quatre modules réservés en août n'ont toujours aucun code.

---

## 8. Arbitrages du point 6 — rendus par le PO le 2026-08-27

| # | Sujet | Décision | Suite |
|---|---|---|---|
| **6.1** | Le dépôt, pays par pays | **arbitrage à rendre** — la story le pose | **STORY-525** `needs-po-decision` |
| **6.2** | Immobilisations & amortissements | **sorti du cadrage** | **EPIC-135** · STORY-526/527/528 (34 pts) |
| **6.3** | Un groupe ne peut pas exister | **fiché** | **EPIC-136** · STORY-529/530/531 (34 pts) |
| **6.4** | Inventaire & variation de stocks | **laissé en l'état pour l'instant** | voir §8.1 ci-dessous |
| **6.5** | Durée de l'exercice | **vérifié — le manque est CONFIRMÉ et plus large** | **STORY-532** (8 pts) |
| **6.6** | IFRS for SMEs | **PHASE 2** | inscrit ; aucune story avant la phase 1 OHADA |
| **6.7** | Deux moteurs d'IA | **`assistant-service` porte les usages IA** | EPIC-117/118 le citent ; `ia-service` reste différé |
| **6.8** | Europe / RGPD | **reporté** — « on verra au moment opportun » | aucune action |

### 6.5 — ce que la vérification a donné, et pourquoi c'est pire qu'annoncé

Le constat de départ parlait de la **durée**. La lecture du code montre qu'il manque **les bornes**.

```ts
// CreerJeuEtatsDto
// `exercice` est un libellé libre (ex. "2025")
@ApiProperty({ description: 'Libellé/identifiant de l'exercice (1 à 64 caractères).' })
exercice!: string;
```

⇒ **La liasse ne sait pas quelles dates elle couvre.** Or le **dossier** porte des exercices à
bornes libres depuis STORY-303 / FE-066 : l'information existe un service plus haut et ne descend
pas. Et **STORY-527 en dépend** — un prorata temporis d'amortissement sans la durée réelle de
l'exercice est faux sur tout premier exercice.

---

## 8.1 — 6.4 : ce que je suggère si l'on vend à un cabinet

**La question du PO :** *« pour le moment laisse cela, mais si on veut vendre à un cabinet, là ça
devient problématique — que me suggères-tu ? »*

**Le problème, dit précisément.** Sans inventaire ni variation de stocks, la **marge brute** d'un
dossier commercial est fausse — et **rien ne le signale** : la balance reste équilibrée, la liasse
se calcule, tous les contrôles passent. C'est le même mode de panne silencieux que STORY-422.

**Mais l'ampleur dépend d'où vient la balance, et c'est ce qui décide de la conduite :**

| Origine de la balance | Le stock est-il juste ? |
|---|---|
| **Export Sage** (le cas majoritaire en cabinet) | ✅ **oui** — le client a fait son inventaire, ses comptes 3x et sa variation 603x sont dans l'export. Prospera n'a rien à calculer |
| **Reprise d'à-nouveaux** | ✅ oui — les soldes de stock viennent de l'exercice repris |
| **Saisie directe** | ✅ oui — le comptable saisit le stock final |
| **Cahiers de recettes/dépenses** | ⛔ **non** — un cahier n'enregistre que des flux. **Le produit le dit déjà** : *« ni capital, ni immobilisations, ni stocks — ils ne se déduisent d'aucune recette »* |

⇒ **Vendre à un cabinet ne rend PAS `stock-service` nécessaire.** Un cabinet reçoit des balances ou
saisit des soldes ; il n'a pas besoin d'un module de gestion de stock — il a besoin que la **variation
de stocks soit correcte dans la liasse**, ce qui est déjà le cas quand elle vient de l'export.

**Ma suggestion : trois gestes petits, aucun `stock-service`.**

1. ⭐ **Une saisie d'inventaire de clôture, dans l'Atelier.** Stock initial, stock final, variation
   calculée et portée aux comptes du référentiel. C'est **une story, pas un service** — et elle
   ferme le seul trou réel, celui de la persona « cahiers ». **C'est ce que je ferais.**
2. **Un contrôle de cohérence à la liasse** : un dossier commercial avec des achats (classe 6) et
   **aucun compte de stock** (classe 3) est signalé — pas refusé. Aujourd'hui rien ne le voit.
3. **Le dire à l'écran** pour la persona cahiers, doctrine FE-073 : *« la variation de stocks n'est
   pas déduite de vos cahiers ; saisissez votre inventaire »*.

**`stock-service` (153 pts, EPIC-075→084) reste ce qu'il est : un module du vertical
DISTRIBUTEUR**, pour une entreprise qui pilote son stock au quotidien — pas pour un cabinet qui
arrête des comptes. ⇒ **Ne pas le tirer pour la vente cabinet.** Le rang de séquence reste ouvert
pour le distributeur.
