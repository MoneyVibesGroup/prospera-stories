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

- [ ] AC-1 — `GET /pays` rend le registre. `GET /pays/{code}` rend une entrée, ou `404` — jamais une
      entrée vide qui se lirait « servi avec rien ».
- [ ] AC-2 — Le statut est **calculé**, jamais saisi : `servi` exige un référentiel packagé **et** un
      paquet fiscal ; `partiel` exige le référentiel seul. Un pays devient `servi` le jour où son
      paquet est packagé, sans qu'on touche au registre.
- [ ] AC-3 — La création d'un dossier sur un pays `non-servi` est **refusée**
      (`409 PAYS_NON_SERVI`) ; sur un pays `partiel`, elle est **acceptée avec un avertissement
      publié** — le référentiel comptable suffit à tenir une balance et une liasse ; c'est le
      calcul de l'impôt qui manque, et il faut le dire au lieu de le laisser découvrir.
- [ ] AC-4 — Le registre est semé pour les **17 États de l'OHADA** au minimum, et les six États de
      la CEDEAO hors OHADA y figurent en `non-servi` **avec leur devise et leur norme réelle**
      (IFRS / IFRS for SMEs). ⚡ Les faire figurer en `non-servi` vaut mieux que les omettre :
      omettre laisse croire à un oubli, `non-servi` est une décision qu'on peut relire.
- [ ] AC-5 — Un test de cohérence croise le registre et les manifestes : **aucun pays `servi` sans
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

**Statut : `in_progress`** — démarrée le **2026-09-11** (flux APEX complet).

Branches `MNV-492` créées **avant la moindre ligne de code** :

```
docs: MNV-492 @ 9371889
dossier-service: MNV-492 @ a57b1a7
balance-service: MNV-492 @ 7e39470
bilan-service: MNV-492 @ 2d9edbd
```
