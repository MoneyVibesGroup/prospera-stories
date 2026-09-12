# STORY-492 : Aucun registre ne dit quels pays sont servis — la liste des cinq pays est codée dans un `<select>`

Status: in_progress

**Épic :** EPIC-108 — Le référentiel devient un plugin déclaré (zone, pays, devise, norme)
**Service :** `dossier-service` (registre, refus de création) + `balance-service` (paquet fiscal résolu par le pays du dossier) + `bilan-service` (prévisionnel) — la fiche disait `platform-catalog-service` (`:3006`), voir la requalification et **D-492-1**
**Points :** 5 · **Complexité :** high · **Assigné à :** vivianMoneyVibesGroupes · **Sprint :** S20
**Prérequis :** **STORY-491** (le paquet déclare ses pays) — `done` le 2026-09-11.
**Origine :** revue **expert-comptable** de la maquette cumulative, 2026-08-27.

---

## Le fait

La seule chose qui, dans tout le produit, énumère les pays servis est un **menu déroulant de
l'assistant de création de dossier** : cinq entrées (`TG` disponible, `BJ` / `CI` / `SN` / `BF`
« paquet à venir »). Aucune de ces cinq n'est vérifiable : ce n'est ni une donnée, ni un contrat,
ni une projection — c'est un balisage.

Trois conséquences immédiates :

1. **« Paquet à venir » n'est adossé à rien.** Rien ne dit si le paquet béninois est en cours, prévu
   ou imaginé. Le jour où il arrive, personne ne saura que ce `<select>` doit changer.
2. **L'UEMOA n'est pas la CEDEAO, et le produit confond les deux.** L'assistant écrit « Zone UEMOA →
   monnaie XOF ». L'UEMOA compte 8 États ; la CEDEAO 15, dont **six hors OHADA et hors franc CFA**.
   La Guinée est OHADA **sans** être UEMOA (monnaie GNF) : elle tombe entre les deux règles que le
   produit connaît.
3. **Aucune question ne peut être posée au système.** « Ce pays est-il servi ? », « avec quel
   référentiel ? », « quelle devise ? », « quel paquet fiscal ? » n'ont pas de destinataire.

## Le registre à construire

Une entrée par pays, dérivée et non ressaisie :

| Champ | Source |
|---|---|
| `pays` | ISO 3166-1 alpha-2 |
| `devise` | ISO 4217 (code + exposant) |
| `zonesComptables[]` | dérivé des `_meta.pays[]` des référentiels packagés (STORY-491) |
| `referentielsDisponibles[]` | référentiels effectivement **packagés** couvrant ce pays |
| `paquetFiscal` | identifiant + version, ou `null` |
| `statut` | `servi` · `partiel` (référentiel oui, paquet fiscal non) · `non-servi` |

## Critères d'acceptation

- [x] AC-1 — `GET /pays` rend le registre. `GET /pays/{code}` rend une entrée, ou `404` — jamais une
      entrée vide qui se lirait « servi avec rien ».
- [x] AC-2 — Le statut est **calculé**, jamais saisi : `servi` exige un référentiel packagé **et** un
      paquet fiscal ; `partiel` exige le référentiel seul. Un pays devient `servi` le jour où son
      paquet est packagé, sans qu'on touche au registre.
- [x] AC-3 — La création d'un dossier sur un pays `non-servi` est **refusée**
      (`409 PAYS_NON_SERVI`) ; sur un pays `partiel`, elle est **acceptée avec un avertissement
      publié** — le référentiel comptable suffit à tenir une balance et une liasse ; c'est le
      calcul de l'impôt qui manque, et il faut le dire au lieu de le laisser découvrir.
- [x] AC-4 — Le registre est semé pour les **17 États de l'OHADA** au minimum, et les six États de
      la CEDEAO hors OHADA y figurent en `non-servi` **avec leur devise et leur norme réelle**
      (IFRS / IFRS for SMEs). ⚡ Les faire figurer en `non-servi` vaut mieux que les omettre :
      omettre laisse croire à un oubli, `non-servi` est une décision qu'on peut relire.
- [x] AC-5 — Un test de cohérence croise le registre et les manifestes : **aucun pays `servi` sans
      artefact packagé correspondant**. Il vire au rouge si l'un des deux bouge sans l'autre.

## Conséquences ailleurs

- **FE-082** consomme `GET /pays` au lieu de son `<select>` en dur.
- Ouvre la trajectoire annoncée par le PO — CEDEAO, puis Afrique de l'Est, puis Europe — **sans
  aucune ligne de code d'écran par pays** : ajouter un pays devient un paquet + une entrée.

## Notes

- ⚠️ **Le registre n'est pas une liste de pays où l'on vend** : c'est une liste de pays dont le
  cadre comptable et fiscal est packagé. Les deux se confondent aujourd'hui parce qu'il n'y en a
  qu'un.
- Voir [[STORY-491]], [[STORY-489]], [[FE-082]].

---

## ⚠️ Requalification (2026-09-11) — mesurée dans le code avant de brancher

La fiche date du 27/08. Deux de ses prémisses sont **fausses**, et c'est la seconde qui décide du
périmètre :

| La fiche dit | La valeur réelle |
|---|---|
| Service `platform-catalog-service` (`:3006`) | ⛔ `:3006` est `document-service` (le catalogue écoute sur `:3003`) — et le registre vit dans `dossier-service` (**D-492-1**) |
| AC-3 : sur un pays `partiel`, « c'est le calcul de l'impôt qui **manque** » | ⛔⛔ il ne manquerait pas, il serait **faux**. `balance-service` résout le paquet fiscal depuis la **configuration** (`PAQUET_FISCAL_PAR_DEFAUT = togo@2026`), jamais depuis le pays du dossier : module fiscal (7 services), cahiers de recettes et de dépenses (imputation de la TVA), échéance de dépôt, diagnostic. Le prévisionnel de `bilan-service` lit le paquet **togolais** embarqué dans `syscohada-revise@2.1`. Un dossier béninois accepté aurait eu ses impôts, sa TVA et ses cahiers calculés au barème togolais — sans un signal (**D-492-4**, **D-492-5**) |
| AC-2/AC-3 : `partiel` = « référentiel sans paquet fiscal », et « le référentiel comptable suffit à tenir une balance » | ⛔ `balance-service` ne tient qu'**une** monnaie (`DEVISES_SUPPORTEES = ['XOF']`). Les **neuf** États OHADA hors XOF (XAF ×6, GNF, KMF, CDF) ne peuvent pas tenir de balance : les déclarer `partiel` les ferait accepter à la création, puis refuser à la première balance (`DEVISE_DOSSIER_NON_TENUE`) — ou, sans devise déclarée, recevoir en XOF par héritage du profil de l'organisation (**D-492-2**) |
| « la CEDEAO 15 [États] » | ⚠️ **12** depuis le 29 janvier 2025 : le Burkina Faso, le Mali et le Niger en sont sortis (communiqué de la Commission du 30/01/2025, ecowas.int). Les « six hors OHADA » restent six : Cabo Verde, Gambie, Ghana, Liberia, Nigeria, Sierra Leone |
| AC-4 : les six hors OHADA « avec leur norme réelle (IFRS / IFRS for SMEs) » | ⚠️ vrai pour **cinq**, sous des régimes différents (voir **D-492-8**). **Cabo Verde n'applique pas les IFRS** : son cadre est le SNCRF national (Décret-loi n.º 5/2008) |
| « référentiels effectivement packagés » | ⚠️ six paquets dans `bilan-service`, quatre recopiés dans `balance-service` : `sfd-bceao@1.0` et `zone-franche-togo@1.0` ne peuvent tenir **aucune** balance (**D-492-3**) |
| (implicite) rien ne refuse aujourd'hui | la création refuse déjà : `400 PAYS_NON_SUPPORTE` (STORY-302), sur une liste `PAYS_SUPPORTES = ['TG']` recopiée à la main dans `dossier-service`, « dette assumée qui touche deux dépôts ». L'AC-3 la remplace par `409 PAYS_NON_SERVI` (**D-492-6**) |

⚡ **Ce que la seconde ligne change** : accepter un pays `partiel` sans toucher au fiscal aurait
**ouvert** un chemin de calcul faux et silencieux — exactement le « tout passe, tout est faux » de
STORY-422, transposé à l'impôt. Arbitrage **user du 2026-09-11** : le trou se referme **dans cette
story** (D-492-4, D-492-5), et le registre vit dans `dossier-service` (D-492-1).

### Le registre, calculé sur les artefacts d'aujourd'hui

| Statut | États | Ce qui manque |
|---|---|---|
| `servi` | TG | — |
| `partiel` | BF · BJ · CI · GW · ML · NE · SN | le paquet fiscal |
| `non-servi` | CF · CG · CM · GA · GQ · TD (XAF) · CD (CDF) · GN (GNF) · KM (KMF) | la devise **et** le paquet fiscal — le référentiel existe (SYSCOHADA, et CIMA pour les six CEMAC) |
| `non-servi` | CV · GH · GM · LR · NG · SL | le référentiel, la devise et le paquet fiscal |

## Arbitrages de cadrage

### D-492-1 — Le registre vit dans `dossier-service` (arbitrage user du 2026-09-11)

- **La règle qui le lit y vit** — le refus de création (AC-3) — et la liste de pays que le front lit
  déjà vient de **son** contrat : l'`enum` Swagger de `CreerDossierDto.pays`, seule source de FE-060.
- **Kafka est le seul bus inter-services, et ce registre ne bouge qu'au déploiement d'un paquet** :
  aucun appel synchrone, aucun topic. Il se **calcule** à partir d'un **miroir** des déclarations des
  paquets — `meta` des référentiels de `bilan-service` et de `balance-service`, `_meta` des paquets
  fiscaux et devises tenues de `balance-service` — que le test de l'AC-5 **confronte aux deux dépôts
  voisins**.
- Hébergé par `platform-catalog-service`, il aurait fallu répliquer ces mêmes déclarations dans le
  catalogue **et** faire parvenir le statut à `dossier-service` (nouveau topic ou seconde copie) :
  deux points de divergence au lieu d'un.
- ⚠️ **Même angle mort, déclaré, que `referentiel-assets-coherence.spec.ts` (AD-6)** : dans la CI
  d'un dépôt isolé, les voisins sont absents et la confrontation ne peut pas avoir lieu. Le test le
  **dit** (et exige que le chemin résolve dès que le dépôt voisin est présent — leçon STORY-368) ;
  il ne le tait pas.

### D-492-2 — `servi` exige aussi une devise **tenue**

| Statut | Condition |
|---|---|
| `servi` | un référentiel packagé de bout en bout couvre le pays **et** sa devise est tenue **et** un paquet fiscal est packagé pour lui |
| `partiel` | un référentiel **et** la devise tenue, sans paquet fiscal |
| `non-servi` | tout le reste |

Le registre publie `manques[]` — `REFERENTIEL_COMPTABLE`, `DEVISE`, `PAQUET_FISCAL` — pour que le
statut se **relise** au lieu de se croire (« `non-servi` est une décision qu'on peut relire », AC-4).

### D-492-3 — « packagé » veut dire « de bout en bout »

Un référentiel ne sert un pays que s'il est packagé dans `balance-service` (sans quoi aucune balance
ne s'y valide — `REFERENTIEL_NON_PACKAGE`, STORY-487) **et** dans `bilan-service` (sans quoi aucune
liasse). Aujourd'hui : `syscohada-revise@2.1`, `sfd-bceao@2.0`, `cima-assurances@1.0`, `smt-togo@1.0`.
Écartés : `sfd-bceao@1.0` et `zone-franche-togo@1.0`, packagés dans `bilan-service` seul.

### D-492-4 — Le paquet fiscal se résout par le pays **du dossier** (arbitrage user du 2026-09-11)

- **`balance-service`** : pays = celui du dossier (read-model `dossiers_dossier`), année = clôture de
  l'exercice (inchangé). Tous les lecteurs **à portée dossier** : module fiscal, cahiers de recettes
  et de dépenses, échéance de dépôt, diagnostic.
- Pays sans paquet ⇒ le **`409 PAQUET_FISCAL_NON_PUBLIE` existant**, dont le message nomme le pays :
  « c'est le calcul de l'impôt qui manque » devient **vrai**.
- ⚡ **L'AC-2 devient vraie de bout en bout** : le jour où un paquet béninois est packagé, les dossiers
  béninois le reçoivent sans qu'une ligne change. Sous la configuration, ils seraient restés au barème
  togolais — et le registre aurait dit `servi` d'un pays que le moteur calculait faux.
- `PAQUET_FISCAL_PAR_DEFAUT` ne sert plus qu'aux lecteurs **à portée organisation** (catégories de
  dépenses et leurs codes de réintégration, proposition de régime du profil société) — un cabinet n'a
  pas de pays fiscal unique ; son **année** reste l'année par défaut du diagnostic sans exercice.
- **Déclarer un déficit** sur un dossier dont le pays n'a pas de paquet est refusé (même `409`) : sans
  cela, le constat de l'imputation (STORY-455) bloquerait l'arrêté de sa balance, la seule action que
  le statut `partiel` promet.
- **L'échéance de dépôt** d'un tel dossier part avec le motif `DEPOT_NON_PACKAGE` : une règle, pas un
  incident journalisé.

### D-492-5 — Le prévisionnel n'applique le paquet embarqué **que dans son pays** (arbitrage user)

- `bilan-service` : le paquet fiscal embarqué dans un référentiel déclare son pays (`_meta.pays` —
  `TG` pour les deux paquets embarqués). Hors de ce pays, ou s'il n'en déclare aucun, l'IS **et** la TVA
  ne sont pas applicables, motif **`PAQUET_FISCAL_HORS_PAYS`**, publié (impôt, TVA, export).
- **Pas un `409`** : le prévisionnel sait déjà rendre « impôt non calculable » avec un motif
  (`PAQUET_FISCAL_ABSENT`, STORY-458) — c'est ce que l'onglet attend pour « rester visible et
  s'expliquer » (FE-082).

### D-492-6 — `409 PAYS_NON_SERVI` remplace `400 PAYS_NON_SUPPORTE` — rupture de contrat assumée

- C'est la lettre de l'AC-3 : **le code et le statut changent**. Un client qui branchait
  `PAYS_NON_SUPPORTE` ne le recevra plus ; le code quitte l'inventaire publié (STORY-375), ce qui fait
  rougir le `Record<CodeRefusDossier, string>` du client généré au lieu de le laisser tomber en silence
  dans le générique.
- Le corps porte `details.{pays, statut, manques}`.
- Un code ISO-2 **absent du registre** est `non-servi` : fail-closed, jamais accepté.

### D-492-7 — L'avertissement d'un pays `partiel` est publié deux fois

- Sur la réponse **`201`** de `POST /dossiers` : `avertissements[]` (code `PAYS_PARTIEL`, message,
  `manques`), dans un DTO propre à la création — les autres routes ne le portent pas.
- Au **journal** (`DOSSIER_CREE.details.statutPays`), consigné **à l'écriture** : le registre bougera,
  le journal dit ce qui était vrai le jour de la création.
- Le message dit ce qui est servi et ce qui ne l'est pas : balance importée et liasse, **oui** ; calculs
  fiscaux, cahiers de recettes et de dépenses, impôt du prévisionnel, **non**.

### D-492-8 — Le semis : 23 États, chaque valeur à sa source primaire (leçon STORY-491)

| États | Cadre comptable réel | Source |
|---|---|---|
| 17 OHADA : BF BJ CD CF CG CI CM GA GN GQ GW KM ML NE SN TD TG | SYSCOHADA révisé — AUDCIF (2017) | ohada.org, *State Members* |
| GH | IFRS exigées (sociétés cotées, établissements financiers, entreprises publiques) ; IFRS pour les PME **permises** | IFRS Foundation, profil Ghana (16/06/2016) |
| NG | IFRS exigées (entités d'intérêt public, 2012) ; IFRS pour les PME **exigées** (2014), sauf micro-entités | IFRS Foundation, profil Nigeria (16/06/2016) |
| SL | IFRS exigées (sociétés cotées, banques, assurances) ; IFRS pour les PME **permises** | IFRS Foundation, profil Sierra Leone (16/06/2016) |
| LR | IFRS exigées (établissements financiers) ; PME : IFRS pour les PME ou IFRS complètes **exigées** (31/12/2018) | IFRS Foundation, profil Liberia (30/08/2016) |
| GM | IFRS exigées des seules banques commerciales (2013), permises ailleurs ; IFRS pour les PME **permises** | IFRS Foundation, profil Gambie (16/06/2016) |
| CV | **SNCRF** national — pas les IFRS | Décret-loi n.º 5/2008, *Boletim Oficial* n.º 5, I Série, 04/02/2008 |

- **Devises** : ISO 4217, liste officielle publiée par SIX le 2026-01-01 — code et exposant **ISO**,
  publié sous le nom `exposantIso`, celui du contrat de balance (STORY-489). ⛔ L'échelle **appliquée**
  aux montants (× 100 pour le XOF) n'est **pas** publiée par le registre : elle appartient aux montants,
  qui la portent (STORY-489/490).
- Pas de libellé de pays : le code ISO suffit, et le front le localise.

### D-492-9 — Le gate KYC s'applique au registre

L'invariant de STORY-363 (`dossier-access.invariant.spec.ts` : tout contrôleur porte
`@RequiresDossierAccess()` au niveau de la classe) s'applique **sans exception** : le registre sert
l'assistant de création, dont les utilisateurs ont déjà passé le gate.

### D-492-10 — « Mon cabinet » continue d'accepter tout pays

L'arbitrage ③ de STORY-302 est inchangé (chemin système, non corrigeable). Le journal consigne
désormais `statutPays` à côté de `paysSupporte`, qui garde son sens : vrai si et seulement si le pays
est `servi`.

## Périmètre

**Inclus**
- `dossier-service` — module `pays` : semis des 23 États (AC-4), miroir des déclarations des paquets,
  statut calculé et `manques` (AC-2), `GET /pays` et `GET /pays/:code` (AC-1), test de cohérence
  contre les dépôts voisins (AC-5). Création : `409 PAYS_NON_SERVI`, avertissement `PAYS_PARTIEL`
  (AC-3), `statutPays` au journal ; `enum` Swagger de `pays` dérivé du registre ; `pays-supportes.util`
  supprimé.
- `balance-service` — paquet fiscal résolu par le pays du dossier (D-492-4).
- `bilan-service` — motif `PAQUET_FISCAL_HORS_PAYS` du prévisionnel (D-492-5).

**Hors périmètre**
- FE-082 et le prototype.
- ⚠️ **Le référentiel d'un dossier n'est confronté à son pays nulle part** : un dossier béninois au
  Système Minimal de Trésorerie serait résolu vers `smt-togo@1.0`, déclaré pour le seul Togo. Trou
  distinct de celui-ci (le référentiel, pas le paquet fiscal), confié à une story à part.
- Paquets fiscaux et référentiels d'autres pays (EPIC-109/110), devises supplémentaires (STORY-495).
- La devise contrôlée à la soumission d'une balance reste celle du **profil de l'organisation**
  (STORY-489), pas celle du dossier — observé, laissé.
- `ReferentielVersion.zone` (catalogue, STORY-149) : champ libre sans lecteur, laissé.

**🪝 Hooks inertes documentés**
- `DEVISE_PAR_DEFAUT = XOF` reste le défaut de création : exact pour les huit pays créables
  aujourd'hui. Un test rougit le jour où un pays devient créable sans être tenu en XOF — le défaut se
  lira alors au registre.
- Les lecteurs du paquet de **référence** (à portée organisation) gardent la configuration.

---

## Progress Tracking

**Statut : `in_progress`** — démarrée le **2026-09-11** (flux APEX complet), développée et
validée le **2026-09-12**.

Branches `MNV-492` créées **avant la moindre ligne de code** :

```
docs: MNV-492 @ 9371889
dossier-service: MNV-492 @ a57b1a7
balance-service: MNV-492 @ 7e39470
bilan-service: MNV-492 @ 2d9edbd
```

### Ce qui est livré, critère par critère

| | Livré | Preuve |
|---|---|---|
| AC-1 | `GET /pays` (23 entrées, par code ISO) et `GET /pays/:code` — `404 PAYS_INTROUVABLE` sur un pays hors registre, `400` sur une forme invalide | e2e sur la vraie chaîne de guards + **vérification docker** (⑥ ci-dessous) |
| AC-2 | statut **calculé** sur le miroir des paquets, `manques[]` publié ; ajouter un paquet fiscal fait basculer un pays sans toucher au semis | `registre-pays.spec.ts` (mutations M1–M3, M9) dont un test qui n'écarte QUE le paquet fiscal entre deux calculs |
| AC-3 | `409 PAYS_NON_SERVI` (code et statut changés, D-492-6) ; `partiel` accepté avec `avertissements[PAYS_PARTIEL]` et `statutPays` consigné au journal | unitaires + e2e + **docker** : BJ créé en `201`, CM et FR refusés sans **rien** écrire |
| AC-4 | 17 États OHADA + 6 États CEDEAO hors OHADA, devise ISO 4217 et cadre comptable réel, chaque valeur à sa source primaire | `registre-pays.semis.spec.ts` — listes recopiées des sources, jamais du semis ; codes ISO contrôlés par les noms de régions ICU |
| AC-5 | `registre-pays.coherence.spec.ts` confronte le miroir aux artefacts **réels** des deux dépôts voisins, puis **recalcule** le registre sur eux seuls et exige les mêmes statuts | mutations M10 et M11 (miroir amputé / miroir qui invente) ⇒ rouge |
| D-492-4 | le paquet fiscal se résout par le **pays du dossier** dans `balance-service` | **docker** : même route, même jeton — BJ `409 PAQUET_FISCAL_NON_PUBLIE`, TG `200` |
| D-492-5 | le paquet embarqué du prévisionnel ne vaut que dans son pays (`PAQUET_FISCAL_HORS_PAYS`) | unitaires (les trois chemins) ; ⚠️ **non rejoué en docker**, dit comme tel ci-dessous |

### Table de mutations — 29 rouges, et un contrôle vert délibéré

| # | Mutation | Résultat |
|---|---|---|
| M1 | `pays: []` d'un référentiel vaudrait « tous les pays » | ROUGE |
| M2 | le statut ignore la devise tenue (la condition que la fiche oubliait) | ROUGE (5) |
| M3 | un référentiel packagé dans **un seul** dépôt suffirait | ROUGE (6) |
| M4 | un pays `non-servi` est accepté à la création | ROUGE (29) |
| M5 | un pays `partiel` est refusé | ROUGE (8) |
| M6 | `statutPays` disparaît du journal | ROUGE (2) |
| M7 | la création ne publie plus aucun avertissement | ROUGE (4) |
| M8 | un pays **absent** du registre vaut `partiel` (fail-open) | ROUGE (5) |
| M9 | tout pays du registre devient créable | ROUGE (2) |
| M10 / M11 | le miroir perd un paquet réel / invente un pays couvert | ROUGE / ROUGE |
| M12 | la réponse HTTP **partage** les tableaux du registre au lieu de les copier | ROUGE |
| M13 | `GET /pays/:code` rend une entrée quelconque au lieu de `404` | ROUGE |
| M14 | le paquet fiscal résolu sur la **clé** du manifeste au lieu de `paysSource` | ROUGE (4) |
| M15 | repli silencieux sur le paquet togolais quand le pays n'en a pas | ROUGE (3) |
| M16 | retour à la résolution par **configuration** | ROUGE (2) |
| M17 | le pays du dossier lu **sans son tenant** | ROUGE (13) |
| M18 | read-model absent ⇒ repli silencieux sur `TG` au lieu du 404 | ROUGE (2) |
| M19 | un déficit se déclare sur un pays sans paquet | ROUGE |
| M20 | un pays sans paquet traité comme un **incident** (bloc absent, `warn`) | ROUGE |
| M21 | le diagnostic avale **toute** erreur fiscale, pas seulement celle du pays | ROUGE |
| M22 | le paquet embarqué s'applique quel que soit le pays | ROUGE (7) |
| M23 | un paquet qui ne **déclare** aucun pays est réputé universel | ROUGE |
| M24 | « absent » et « hors pays » confondus en un seul motif | ROUGE |
| M25 / M26 | la projection / la comparaison n'utilisent pas le pays lu | ROUGE / ROUGE |
| M27 | l'export rend la mention « absent » pour un paquet hors pays | ROUGE |
| M28 / M29 | contexte sans dossier ⇒ pays inventé / read-model lu sans son tenant | ROUGE / ROUGE |
| **M28b** | **contrôle** : filtre réécrit à l'identique (mutation **équivalente**) | **VERTE, attendue** — c'est ce qui prouve que le harnais ne rougit pas à tort |

⛔ **HUIT mutations sont d'abord sorties rouges PAR COMPILATION** (`noUnusedLocals`,
narrowing en `never`, `possibly null`) — M4, M14, M15, M17, M18, M20, M25, M28. **Un rouge de
compilation ne prouve rien** (leçon STORY-491) : chacune a été **rejouée** sous une forme qui
compile, et c'est ce second résultat qui est consigné ci-dessus. ⚠️ Le harnais lui-même a
menti d'abord : il cherchait `error TS` dans une sortie **colorée**, où la chaîne est coupée
par un code ANSI — six mutations se sont affichées « vertes » avant que la détection ne soit
corrigée.

### ⚡ Un défaut trouvé par son propre test, avant d'être livré

`chargerFiscalite` passait `PAQUET_FISCAL_HORS_PAYS` **sans condition** : un référentiel qui
ne publie **aucun** paquet (SFD-BCEAO, CIMA) aurait vu son motif changer de `ABSENT` à
`HORS_PAYS` — un mensonge sur un document remis à une banque, et une régression invisible aux
2 774 tests existants. Le cas « un référentiel SANS paquet reste ABSENT », écrit **avec** la
garde, l'a fait rougir immédiatement (mutation M24 le verrouille).

### Vérification docker — stack réelle, code de la branche

⚠️ Kafka refusait de démarrer (`DUPLICATE_BROKER_REGISTRATION` + checkpoint corrompu par un
arrêt non propre) : volume `prospera_kafka-data` **réinitialisé** — en dev les volumes repartent
de zéro (CLAUDE.md). Cabinet créé de bout en bout par l'API (`register` → lien de vérification
relevé dans Mailhog → `login` → jeton **RS256 réel**).

| # | Ce qui est prouvé | Mesuré |
|---|---|---|
| ① | **L'application démarre** avec le module neuf — aucun e2e ne monte `AppModule` | `Found 0 errors` puis `PaysController {/api/pays} (version: 1)` |
| ② | Les deux routes sont gardées | `GET /api/v1/pays` et `/pays/TG` sans jeton → **401** |
| ③ | **D-492-9** — le gate KYC s'applique au registre | jeton valide, KYC non approuvé → **403 `KYC_NOT_APPROVED`** |
| ④ | Le registre servi | **23** entrées : `TG` servi, 7 UEMOA `partiel`, 15 `non-servi` ; `BJ` porte devise, cadre comptable, 3 zones, 3 référentiels, `manques: [PAQUET_FISCAL]` |
| ⑤ | `GET /pays/:code` | `TG` servi · `BJ` partiel · `CM` non-servi (`DEVISE`, `PAQUET_FISCAL`) · `FR` **404 PAYS_INTROUVABLE** · `tg` et `TOGO` **400** |
| ⑥ | **AC-3 — création sur un pays `partiel`** | `201` + `avertissements[PAYS_PARTIEL]` ; en base : dossier `ACTIF` persisté, journal `DOSSIER_CREE.details.statutPays = 'partiel'` **et** `MANDAT_ATTESTE` dans la **même** transaction, outbox `dossier.created` `SENT` |
| ⑦ | **Refus sans écriture** | `CM` → 409 (`manques: [DEVISE, PAQUET_FISCAL]`), `FR` → 409 (absent) ; **0 dossier, 0 entrée de journal** — aucun orphelin |
| ⑧ | **D-492-10** — « Mon cabinet » né de `identity.org.created` (chemin Kafka, hors e2e) | journal : `paysSupporte: true` **et** `statutPays: 'servi'` |
| ⑨ | L'événement traverse le **vrai** bus | le dossier béninois apparaît dans `dossiers_dossier` de `balance-service` |
| ⑩ | ⚡⚡ **Le cœur de la story** — même route, même cabinet, même jeton | dossier **BJ** → `409 PAQUET_FISCAL_NON_PUBLIE`, `details.pays: "BJ"` ; dossier **TG** → `200` avec la règle togolaise (`Art. 101 CGI`, plafond 50 %). Avant cette story, le béninois recevait **la même réponse togolaise** |
| ⑪ | La déclaration d'un déficit est refusée hors pays servi | `POST …/fiscal/deficits` sur BJ → `409` (sans quoi l'arrêté de sa balance aurait été bloqué plus tard) |
| ⑫ | Le diagnostic distingue les deux axes | BJ : `referentiel syscohada-revise@2.1`, `integrity: verified`, **`fiscal: null`** ; TG : le même référentiel **et** `togo@2026` |

⚠️ **Non rejoué en docker, et dit comme tel** : le motif `PAQUET_FISCAL_HORS_PAYS` du
**prévisionnel** (D-492-5) — il exige une balance validée, un jeu d'états, un snapshot figé
puis un jeu d'hypothèses sur un dossier béninois. Il est prouvé en unitaire sur les **trois**
chemins (projection annuelle, mensuelle, comparaison) et par ses mutations M22–M27.
⚠️ **Simulé par écriture directe des read-models, et dit comme tel** : l'approbation KYC
(`kyc.status.changed`), l'octroi `balance` (`entitlement.changed`) et les axes du dossier
(`dossier.axes.decides`) — trois événements dont les producteurs ne sont pas dans la stack
démarrée. Tout le reste a transité par le vrai bus.

### Portes

| Dépôt | Lint | Build | Unit | E2E | Couverture (st/br/fn/li) |
|---|---|---|---|---|---|
| `dossier-service` | 0 | ✅ | 1 245 | 272 | 99.31 / 94.06 / 96.88 / 99.33 |
| `balance-service` | 0 | ✅ | 3 785 | 905 | 99.15 / 92.53 / 98.49 / 99.25 |
| `bilan-service` | 0 | ✅ | 2 776 (+1 skip préexistant) | 817 | 99.19 / 95.38 / 99.37 / 99.26 |

Seuils 65 / 90 / 90 / 90 : tenus, aucun abaissement. ⚠️ Chiffres **rejoués après les
commits de revue** (⑥/⑦) : `bilan-service` gagne 2 unitaires (la garde de lecture unique
du pays, et le troisième cas de contexte du repository) et rend 0.01 point de branches —
les deux branches de `paysDe` fusionnées en une.

### Revue de code et revue de sécurité (phases ⑥/⑦)

Les deux revues ont tourné **en session sur `opus`** : les sous-agents délégués sont morts
trois fois sur la limite de session sans rendre de rapport. Aucun downgrade.

**Cinq constats retenus, tous corrigés dans un commit de revue dédié par dépôt.** Aucun
bloquant sur `dossier-service`.

| # | Dépôt | Constat | Gravité |
|---|---|---|---|
| 1 | `bilan-service` | **Trois `enum` OpenAPI publiaient une liste que le serveur avait cessé de respecter** : `PAQUET_FISCAL_HORS_PAYS` est rendu par `FiscaliteProjectionDto.motif`, `.motifTva` et `TvaAppliqueeDto.source`, et aucun des trois ne l'annonçait. Un client généré typait l'union **sans** la valeur qu'il allait recevoir — et les `*.dto.ts` étant hors `collectCoverageFrom`, aucun test ne pouvait rougir. | **bloquant** |
| 2 | `balance-service` | **Deux justifications devenues fausses** : les docstrings de `resoudrePaquetFiscalDeReference` et `chargerPaquetFiscalDeReference` rangeaient « la proposition de régime du profil » parmi les lecteurs du paquet **de référence**, alors que `regime.service` lit celui **du dossier**. Une justification périmée à cet endroit précis invite à y ramener la route — c'est-à-dire à réintroduire le défaut que la story ferme. | non bloquant |
| 3 | `bilan-service` | `paysDuDossier()` dupliqué **à l'identique** dans `ProjectionService` et `ComparaisonService`, chacun injectant son `TenantContext`. Une règle fail-closed en deux exemplaires est une règle qu'un correctif futur ne changera qu'à moitié. | non bloquant |
| 4 | `balance-service` | `anneeDeReference()` re-parsait la configuration et redupliquait le `throw` de `resoudrePaquetFiscalDeReference()`. | non bloquant |
| 5 | `bilan-service` | « le pays est lu **une** fois pour toute la comparaison » était une phrase de commentaire que **rien ne mesurait** : déplacer l'appel dans la boucle des snapshots n'aurait rougi nulle part. | non bloquant |

#### Le correctif du constat 1 est structurel, pas littéral

Ajouter la valeur manquante aux trois listes aurait refermé ce trou-ci et laissé le
suivant ouvert. Les unions de motifs deviennent donc des **inventaires runtime** —
`MOTIFS_IMPOT_ABSENT`, `MOTIFS_TVA`, `SOURCES_TAUX_TVA` — dont le **type dérive** et que
`@ApiProperty({ enum })` publie tels quels (patron STORY-375, déjà en place dans
`balance-service` pour `MOTIFS_DATE_LIMITE_ABSENTE`). Le contrat ne peut plus diverger de
ce que le code rend : c'est le compilateur qui l'interdit, pas un test à écrire.

**Mutation de contrôle** — retirer `PAQUET_FISCAL_HORS_PAYS` de `MOTIFS_IMPOT_ABSENT` :
**rouge**, 2 erreurs de compilation (`fiscalite-loader.ts` ne peut plus produire le motif,
`modele-previsionnel.ts` ne peut plus le lire). ⚠️ Le premier passage de cette mutation
s'est affiché **VERT** : `grep "error TS"` ne matchait pas parce que les codes ANSI coupent
la chaîne (`error\x1b[0m\x1b[90m TS2345`) — le même piège que pendant la campagne de
mutations de la phase ④, retombé dans le même trou.

#### Revue de sécurité — sept axes, aucun constat

| Axe | Vérifié |
|---|---|
| Contrôle d'accès | `PaysController` porte `@RequiresDossierAccess()` **au niveau de la classe**, et l'invariant `dossier-access.invariant.spec.ts` balaie le **système de fichiers** (tout `*.controller.ts`) avec un garde-fou de non-vacuité : un contrôleur ajouté demain sans le gate rougit. |
| Injection | `:code` borné par `@Matches(/^[A-Z]{2}$/)` ; le registre est **en mémoire** — aucune valeur d'entrée n'atteint une requête Mongo depuis ces routes. |
| IDOR / multi-tenant | Les **deux** lectures ajoutées de `dossiers_dossier` portent l'`orgId` **dans le filtre**, pas seulement le `dossierId`. |
| Anti-énumération | Read-model absent ⇒ **404** `DOSSIER_INTROUVABLE`, jamais 403 ; `PAYS_INTROUVABLE` en 404, jamais une entrée vide. |
| Fuite d'information | `details.pays` nomme le pays **du dossier de l'appelant** ou celui qu'il vient de saisir ; le registre ne publie que des métadonnées produit, aucune donnée d'organisation. |
| Intégrité comptable | Les **19** sites d'appel fiscaux énumérés un à un : tout ce qui connaît un dossier passe par `chargerPaquetFiscal(orgId, dossierId, …)`. Les deux seuls lecteurs du paquet de référence sont les catégories de dépenses et leurs codes de réintégration (D-083-3). |
| Fail-open par absence | Pays absent du registre ⇒ `non-servi` ; `pays === null` ⇒ aucun paquet ; paquet sans pays déclaré ⇒ non appliqué. L'absence n'est jamais une permission. |

⚠️ **Pas de rejeu de la vérification docker** : aucun correctif ne touche ce qui est écrit
en base ni le résultat d'une résolution — métadonnées de contrat, déplacement d'une lecture
inchangée, et deux commentaires.

### Décisions prises pendant le développement

- **Le libellé du pays n'est pas publié** : le code ISO suffit, et le front le localise
  (`Intl.DisplayNames`). Publier un nom aurait ajouté 23 valeurs à vérifier et à maintenir,
  pour une donnée que le navigateur possède déjà.
- **`paquetsFiscaux` est une LISTE** là où la fiche écrivait un champ au singulier : un pays a
  un paquet **par loi de finances** (D-078-1). `[]` dit « aucun ».
- **Les 409 des routes fiscales publiaient `PAQUET_FISCAL_NON_PACKAGE`** — un code
  **qu'aucune route n'émet** (le vrai est `PAQUET_FISCAL_NON_PUBLIE`). Découvert en documentant
  le cas « pays », corrigé sur les sept contrôleurs fiscaux.
- **`codesReintegration` perd son paramètre d'organisation** : la réponse n'en dépendait pas, et
  le garder aurait fait chercher un dossier là où il n'y en a pas.
- **Le régime proposé (`profil-societe`) lit désormais le paquet du dossier**, mais **sans son
  exercice** : faire suivre l'année changerait le verdict des exercices non packagés — une autre
  décision, à prendre pour les deux routes à la fois.
