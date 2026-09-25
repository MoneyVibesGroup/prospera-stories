# STORY-537 : Le fichier e-DSF Togo — le premier pays, et le jalon `format confirmé` est la story

Status: done

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service` (générateur, paquet `TG` × `DSF`) + `dossier-service` (miroir du registre pays) — `bilan-service` **lu, non modifié**
**Points :** 13 · **Sprint :** S20
**Prérequis :** **STORY-536** (le contrat de paquet de dépôt)
**Bloquée par :** ✅ **DÉBLOQUÉE le 2026-08-28.** Le seul motif était *« le gabarit officiel e-DSF de
l'OTR n'est pas au dépôt »* — le PO a fourni une **DSF définitive réelle** :
`1000745307_2025_Definitif (1).xlsx`, dossier PMS, NIF 1000745307, exercice 2025, **92 feuilles**.

> ### ⚡ Ce que la pièce réelle apporte, mesuré le 2026-08-28
>
> | Constat | Conséquence |
> |---|---|
> | **92 feuilles**, dont **44 de notes** (1→35 avec les A/B/C/bis) | le gabarit existe, case par case |
> | `syscohada-revise@2.1` ne déclare que **11 notes** | ⛔ **STORY-559 est le préalable** — sans elle, 33 feuilles sortent vides |
> | Feuilles hors états : page de garde, fiche conditions, **fiche dépôt**, NAEMA, table des codes, identification 1 & 2, dirigeants, P64→P86, listes clients/fournisseurs | sources hors `bilan-service` — `dossier-service` et balance ventilée |
> | Feuille **« Balance (Optionnel) »** | le dépôt accepte la balance en pièce jointe ⇒ **STORY-555** la produit, **STORY-557** lui donne ses colonnes |
> | Les 2 dernières feuilles rendent **8 contrôles** `VRAI`/`FAUX` ; sur cette pièce le 1ᵉʳ est **`FAUX`** *(Actif 3 060 000 / Passif 0)* | `bilan-service` en produit **4** : ⛔ **l'écart se publie, il ne se comble pas en silence**, et le visa se rend **avant** remise |
>
> ⚠️ **Le classeur note ce qu'on y dépose.** Un produit qui le remplit hérite de son barème.
>
> *(Mesures issues de STORY-558, ouverte par erreur le même jour puis `superseded` — elle
> réinventait le périmètre de cette fiche.)*
**Origine :** arbitrage PO du 2026-08-28 — voie A.

---

## Le fait

C'est la première application concrète de la voie A : produire le fichier que le cabinet dépose à
l'**OTR**. Le produit a déjà tout ce qui précède — la liasse calculée, ses contrôles, sa version
figée, son empreinte.

⛔ **Et il n'a pas la seule chose qui compte ici : le gabarit officiel.** Tant qu'il n'est pas au
dépôt, sourcé et daté, il n'y a **rien à développer et rien à chiffrer honnêtement** — les 13 points
sont une borne, pas une estimation.

## ⚠️ Pourquoi le jalon `format confirmé` n'est pas une formalité, sur CE sujet précisément

Le programme a produit deux erreurs de ce type, et **les deux étaient plausibles** — donc invisibles
à la relecture :

| Erreur | Ce qui était écrit | Ce qui est vrai |
|---|---|---|
| Acomptes d'IS | posés en **trimestriel** (`30-04`…) | `31-01 / 31-05 / 31-07 / 31-10` |
| Retenue sur loyers | **10 %** | **8,75 %** |

⇒ **Une case de formulaire décalée est de la même famille, en pire** : elle passe tous les contrôles
internes du produit — la liasse est juste, l'équilibre tient, l'empreinte est bonne — et elle est
**rejetée au guichet**, ou pire, **acceptée avec des montants dans les mauvaises cases**.

## ⚖️ Cadrage du 2026-09-25 — décisions prises avant la première ligne

**Décisions user** : gabarit = **copie anonymisée** de la DSF réelle (option b) ; le générateur
**remplit le classeur fourni** (celui que le cabinet télécharge sur le portail de l'OTR pour son
client ; en test, le gabarit anonymisé).

### ⚡ Ce que la mesure du classeur a appris — et qui fonde la conception

| Mesure (DSF réelle, 92 feuilles) | Conséquence |
|---|---|
| Le classeur est **personnalisé par l'OTR** : NIF dans une cellule **verrouillée** (`Page de garde!F29`), GUID identique en `A1` des 92 feuilles, empreintes de 40 caractères cachées (`AL30xx`, 84 feuilles) | on **remplit le classeur du contribuable**, on n'en fabrique pas un : un fichier rebâti sur un gabarit commun perdrait ces marques, dont le contrôle au guichet est inconnu |
| **6 061 formules**, 87 feuilles protégées, 5 validations, feuilles « Contrôle de cohérence » (VRAI/FAUX) | écriture **chirurgicale** dans le XML des seules cellules de saisie : aucune formule écrasée, rien réenregistré par une bibliothèque |
| Sur les lignes de titre (`AD`, `AI`, `AQ`…), le formulaire **calcule lui-même** brut/amortissements | le gabarit ne cible **que des cellules de saisie** (style déverrouillé) — jamais une formule |
| États : ~300 cellules de saisie, chaque ligne porte son **code poste** en colonne B | le rattachement poste → case est **mécanique et sourcé par le formulaire lui-même** |
| Notes : **4 291** cellules de saisie, lignes par nature (« Marchandises », « Matières premières »…) | rattacher chaque ligne à des comptes est une transcription du calibre de STORY-559 ⇒ **hors périmètre**, story à part |

Gabarit anonymisé : `PROSPERA/tmp/gabarit-dsf/dsf-togo-sn-gabarit.xlsx` (sha256 `4576c003…`,
reproductible) — saisies vidées, 93 formules liées au classeur 2024 du client retirées, NIF/GUID/
empreintes remplacés par des zéros de même forme, métadonnées, chemin d'enregistrement
(`C:\Users\<poste>\Desktop\OTR\<sigle>\`), lien externe et paramètres d'impression retirés ;
**deux contrôles de fuite** (l'un indépendant du script, à marqueurs connus, jamais versionnés) et
tous deux **mutés** ; ouvert par Excel sans réparation. Versé comme **fixture** avec son script.

### La conception retenue

- **Où** : `fiscal-service` — AD-11 (« le contenu de la liasse vient de `bilan-service` ;
  `fiscal-service` en fait l'emballage ») et PRD §4. Il lit la **version figée** par
  `GET …/bilan/etats/:id/versions/:version` (empreinte vérifiée par `bilan-service`) et le dossier par
  `GET /dossiers/:id` (`dossier-service`), par des **ports** à adaptateur HTTP qui transmettent le jeton
  de l'appelant — chaque service applique son propre cloisonnement (404). Aucune base partagée,
  aucune copie.
- **Le paquet `TG` × `DSF` v1.0** (1ʳᵉ instance du contrat de STORY-536) : `format.support: TABLEUR`,
  `schema` = la description du classeur attendu (feuilles, **ancres** — le code poste de chaque ligne
  ciblée —, référentiels acceptés, devise) ; `gabarit` = une entrée par cellule de saisie, **sourcée**
  (feuille, ligne, colonne du formulaire) ; `canal` GUDEF (LPF art. 17) ; `calendrier` clôture + 4 mois
  (CGI art. 96, **à confirmer**) ; `penalites` 30/40/80 % (LPF art. 121) ; statut
  `a-valider-par-expert`.
- **Stateless** : le classeur entre dans la requête, le classeur rempli en sort ; rien n'est stocké.
  Le fichier produit **porte la référence du format et de la liasse** qui l'ont produit (propriétés
  personnalisées du document — AC-3 de 536). L'archivage du livrable et l'accusé : STORY-538.
- **Dépôt assisté** : le classeur rempli s'ouvre dans Excel (recalcul forcé à l'ouverture), le cabinet
  complète ce que le produit ne sait pas (notes, champs hors liasse), lit la feuille « Contrôle de
  cohérence », enregistre et dépose sur GUDEF.

### Gardes (refus sans rien produire)

| Refus | Pourquoi |
|---|---|
| Classeur non reconnu (feuille ou ancre absente) | un formulaire révisé ne se remplit pas « à peu près » : c'est le jalon `format confirmé` |
| **NIF du classeur ≠ NIF du dossier** | ne jamais verser la liasse d'un client dans le formulaire d'un autre |
| Référentiel ou devise hors de ceux que le paquet déclare | le gabarit est écrit en postes SYSCOHADA, en XOF |
| Un contrôle bloquant figé n'est pas `OK`/`NON_APPLICABLE`, ou `RESULTAT_NON_AFFECTE` (STORY-426) est absent de la version | AC-5 |
| **Cascade des sous-totaux incohérente** (`coherenceSousTotaux.coherent: false`) | le trou de STORY-678 : une liasse `@2.1` imprime un Bilan déséquilibré que rien ne bloque |
| Période inconnue (`motifN`) | la DSF a ses dates : on ne les invente pas (STORY-532) |
| Fichier hostile : taille, bombe zip, macro (`vbaProject`), `DOCTYPE`/entités XML | le classeur vient de l'utilisateur |

## Critères d'acceptation

- [x] AC-1 — *(cadré : le gabarit anonymisé versé comme fixture avec son script et sa date ; le paquet `TG` × `DSF` v1.0 publié au manifeste de `fiscal-service`, `dossier-service` le reflète — Togo `depot: servi` pour `DSF`)* Le **gabarit officiel de l'OTR** est versé au dépôt, avec sa référence et sa date, et
      packagé selon STORY-536. **C'est l'AC-0 de fait : rien ne commence avant.**
- [x] AC-2 — Le fichier est généré **depuis une version FIGÉE** de la liasse, jamais depuis un
      brouillon ni depuis un recalcul. ⚠️ `JeuEtatsService.consulter()` recalcule aujourd'hui quel
      que soit le statut (**STORY-449**) : lire la liasse par `GET …/versions/:version`, jamais par
      `GET /etats/:id`.
- [x] AC-3 — Chaque case du fichier est **traçable jusqu'au poste de liasse** qui l'a alimentée. Un
      dépôt qu'on ne peut pas expliquer case par case n'est pas défendable devant un contrôle.
- [x] AC-4 — *(cadré : déclarant = raison sociale + NIF lus dans `dossier-service` ; signataire {nom, qualité} et expert-comptable {nom, n° d'inscription à l'ordre} fournis à la génération — aucune donnée inventée : date de signature et date d'arrêté vides si non fournies)* Le fichier porte l'**identité du déclarant** et du **signataire** (nom, n° d'inscription
      à l'ordre) — reprise de FE-081, et **STORY-441** reste le blocage réel : aucune route ne
      résout aujourd'hui un `userId` en nom.
- [x] AC-5 — ⛔ **Les contrôles bloquants de la liasse sont rejoués avant génération** : on ne
      produit pas un fichier de dépôt depuis une liasse en anomalie. Y compris **STORY-426** (deux
      résultats coexistant), qui est précisément le contrôle nº 2 de l'OTR.
- [x] AC-6 — La **durée de l'exercice** (STORY-532) est portée : la DSF a sa colonne, et un premier
      exercice de 18 mois est le cas normal d'une entreprise qui démarre.
- [x] AC-7 — *(cadré : liasse synthétique + gabarit anonymisé → classeur attendu épinglé par **sha256** — sortie déterministe)* Un jeu de test complet est déposé au dépôt : une liasse connue → le fichier attendu,
      **octet pour octet**. C'est la seule non-régression qui tienne sur un format administratif.

## Hors périmètre (cadrage du 2026-09-25)

- **Les 43 feuilles de notes** : 4 291 cellules de saisie à rattacher ligne par ligne aux comptes —
  **story à créer** à la clôture. Le classeur produit les laisse vierges ; le cabinet les complète.
- Les champs d'identification hors liasse et hors dossier (RCCM, CNSS, activité, dirigeants,
  domiciliations bancaires…) : laissés au cabinet.
- L'archivage du livrable, l'accusé de dépôt, le cycle de vie après `VALIDE` : **STORY-538**.
- Le dépôt automatisé sur GUDEF : **STORY-560** (amende AD-13).
- La feuille « Balance (Optionnel) » : **STORY-555/557**.


## Notes

- Voir [[STORY-536]], [[STORY-538]], [[STORY-449]], [[STORY-441]], [[STORY-426]], [[STORY-532]], [[FE-081]].
- ✅ **Ce que STORY-532 a posé (2026-09-24)** — pour l'AC-6 : `periode` est au contrat de la liasse
  (`bilan-service`, jeu d'états et version figée) — bornes `AAAA-MM-JJ` (fin incluse), `dureeMoisN` en
  mois révolus (la convention de la DSF : 17 mars → 31 décembre rend 9), celles du N-1 désigné et
  `comparabiliteReduite`. Une version figée rend SES bornes. Une liasse non datée le dit (`motifN`) :
  la DSF ne doit pas l'inventer.

## Progress Tracking

**Statut : `done` (2026-09-25).** PR jumelles rebase-mergées ensemble : `prospera-fiscal-service` **#6** puis `prospera-dossier-service` **#36**. Branches `MNV-537` : `prospera-fiscal-service` et
`prospera-dossier-service` (base `dev`), `docs` (base `main`).

- 2026-09-25 — ③ **dev** — `prospera-fiscal-service` `7717c65` (PR **#6**), `prospera-dossier-service`
  `5e6545c` (PR **#36**, jumelle — à intégrer après fiscal-service) :
  - paquet `TG` × `DSF` v1.0 (`sha256:44a99f80…`) produit par un script reproductible depuis le
    gabarit anonymisé : **223 cases de saisie** (Bilan actif 66, passif 44, compte de résultat 66,
    TFT 35, page de garde 3, fiche d'identification 9), **125 ancres** ; non ciblé : les 95 cases de
    lignes à code qui sont des **formules** du formulaire (titres, totaux, NET = F−G), `K9`, `R5`,
    `F29` (NIF OTR) ; grammaire des postes typée (`SOURCE|CODE|champ`) ; `signeParSens` (le formulaire
    attend les charges en négatif) et `controlesExiges` déclarés dans le schéma, jamais dans le code ;
  - générateur hexagonal (ports `SourceLiasseFigee`, `SourceDossier`, `ClasseurTableur`), écriture
    chirurgicale (`fflate` 0.8.3 à la compression, `zlib` borné à la décompression), 17 gardes ;
  - **AC-7** : liasse synthétique au format réel (produite par le vrai moteur de `bilan-service`) +
    gabarit ⇒ sha256 épinglé `fb2bb20f…` ; un **évaluateur des formules du formulaire** prouve au
    centime que le classeur recalcule nos totaux (BZ, AZ, CP, DZ, les 9 SIG, ZA…ZH, `R5` = 12) et
    que les contrôles OTR n°1 et n°2 valent « VRAI » ;
  - 18 mutations tuées ; portes : lint 0 · build · `test:cov` 869 · e2e 60.
  - ⚠️ **Relevé en session avant commit** : le vrai NIF du contribuable servait de valeur de test dans
    4 specs et un commentaire (pris dans la doc) — remplacé par un NIF fictif ; la fixture de liasse est
    synthétique (contrôlé) ; le gabarit repasse le vérificateur indépendant (0 fuite).
  - ⚠️ **Rattrapage** dans `dossier-service` : le miroir des référentiels n'avait pas reçu
    `syscohada-revise@2.2` (STORY-559/677) — `registre-pays.coherence.spec.ts` rougissait.
- 2026-09-25 — ⑦ **revue de sécurité** (scan `opus`) : **1 constat grave, confiance 95, mesuré** —
  CWE-1333 : des expressions à coût **quadratique** sur une balise ouvrante sans fermante
  (`<Relationship ` ×40k, 1,45 Ko envoyés ⇒ 21,6 s ; ~96 Ko ⇒ des heures) gelaient la boucle
  d'événements : **tout `fiscal-service`** (routes de tous les cabinets, `/health`, Kafka) — une seule
  requête, le throttler n'y pouvait rien. Corrigé (`a26402a`) : balayage **linéaire** du XML, petites
  parties bornées, ouverture/remplissage dans un **fil isolé** (délai 30 s, tas plafonné, 2 fils au plus) ;
  23 formes hostiles < 7 ms à 2N ; test chronométré qui rougit sur les anciennes expressions. Le reste
  tient : bombe zip, chemins, XXE, SSRF (redirections non suivies), jeton, cloisonnement 404, injection.
- 2026-09-25 — ⑥ **revue de code** (scan `opus`, trois points mesurés sur le vrai moteur) : **3 bloquants**
  corrigés (`7a4cd95`) — C1 **montant perdu sans bruit** (immobilisations sur `AD`/`AI` en `@2.1` ⇒ AZ du
  formulaire 10 000 contre 470 000, contrôle OTR n°1 FAUX, fichier livré) ⇒ refus nommé
  `LIASSE_NON_TRANSCRIPTIBLE` ; C2 `E23` (« NOM COMMERCIAL ») recevait le sigle ⇒ retirée ; C3 balance
  **après détermination** ⇒ CR à zéro écrit comme mesuré ⇒ refus nommé en N, cases N-1 (CR et TFT)
  vierges tracées `NON_PRODUIT` sur une N-1 définitive. + un test qu'une mutation traversait (caches de
  formules), 2 mineurs. `CJ` : aucun double comptage (mesuré dans les deux états de balance).
- 2026-09-25 — ④ **vérification docker sur stack NEUVE** (état final) : **221 OK, 0 bug** — habilitations
  par le catalogue ; livrable A : 163 cases écrites conformes à des attentes recalculées depuis
  `versions/1`, 59 vierges à raison, NIF et GUID intacts, 5 966 formules, protections et validations
  identiques, 0 cache, `fullCalcOnLoad`, propriétés du format et de la liasse, déterministe ; refus
  `NIF_DIVERGENT`, `CLASSEUR_NON_RECONNU`, `CLASSEUR_MACRO_INTERDITE`, `.rels` hostile en 1,6 s avec
  `/health` réactif ; 404 version / autre organisation / liasse non figée ; **aucune écriture** en base.
  ⚡ **Le livrable ouvert dans Excel, recalculé : contrôle OTR n°1 (équilibre) = VRAI (759 000 =
  759 000), n°2 (résultat CR = passif) = VRAI (97 000), durée = 12.** Scripts :
  `PROSPERA/tmp/verif-docker-537/`.
- 2026-09-25 — portes finales rejouées en session (`7a4cd95`) : lint 0 · build (prebuild) ·
  `test:cov` 958 · e2e 60. ⑧ `#6` puis `#36` rebase-mergées.

**Pour la suite :**

- **STORY-680 (créée)** : les 43 feuilles de notes (4 291 cases) — le classeur les laisse aujourd'hui au
  cabinet.
- `'Page de garde'!E23` : le formulaire la libelle « NOM COMMERCIAL » mais la relit « SIGLE USUEL »
  (`'FICHE DEPOT'!D31`, en-têtes des notes) — à trancher par l'expert ; laissée au cabinet.
- Le calendrier (CGI art. 96, 30/04) et l'adresse GUDEF restent **à confirmer** (paquet
  `a-valider-par-expert`).
- STORY-538 (archive du livrable, accusé), STORY-560 (dépôt automatisé), STORY-678/679 inchangées.
