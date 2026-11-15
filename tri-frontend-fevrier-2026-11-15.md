# Le front du cabinet : remise à niveau (FE-069) et tri des stories pour février

> **Date :** 2026-11-15 · **Écrit par :** groupe A, à la demande de l'utilisateur (PO)
> **Lu par :** le PO, le groupe D, quiconque prend une story frontend du cabinet
> **Décide :** (1) ce que FE-069 corrige ; (2) quelles stories couvrent le bloc C de FE-069 et les écrans fiscaux ;
> (3) ce qui part en février et ce qui attend.

---

## 1. La demande

> *Remettre le front à niveau, sans rien ajouter : FE-069 (blocs A et B). C'est la priorité de S2. […]
> Transformer le bloc C en stories nommées, puis trier pour février :*
> *En février : dépôt de la liasse (C11 et B14), rôles du cabinet (C16 et 902), profil société par dossier (C7),
> immobilisations (C1), inventaire (C3), et les écrans fiscaux (FE-112 et suivants).*
> *Après février : consolidation (C14, C15), scénarios fiscaux (C4), analyse financière (C10).*

Et, en cours de route : *vérifier tout avant de créer les stories, parce qu'il y a eu beaucoup de changements* — le
type de société, le paquet fiscal, une logique très retravaillée — *et regarder les stories faites pendant cette
période pour comprendre l'ampleur des modifications.*

## 2. Ce qui a été vérifié, et comment

Le relevé du 14/11 (FE-069, blocs A, B, C) comparait des **chemins** et des **schémas**. Il ne voyait pas la logique.
Le relevé du 15/11 l'a refait autrement :

- **La période.** Le front du cabinet n'a pas été remis à niveau depuis le **27/08** (FE-050, FE-051 ; seul MNV-171
  a touché `dev` depuis). Entre le 27/08 et le 15/11, le tracker compte **≈ 200 stories backend livrées** sur les
  services que le cabinet appelle : bilan (≈ 90 dont 15 de consolidation), balance (≈ 45), fiscal-service (≈ 35),
  dossier, document, auth, catalogue. Leurs fiches ont été lues pour les plus structurantes.
- **Le code.** Chaque service a été relu sur `origin/dev` du 15/11 (balance `3a31578`, bilan `3f8e235`, dossier
  `b14e16c`, document `7068952`, auth `f29e902`, catalogue `da88214`, fiscal `8fdfc14`) et confronté, écran par
  écran, au front de `origin/fe-069` (`4148d65`). Contrôleurs, DTO, codes de refus, règles de résolution.
- **Le backlog front.** Les 171 entrées de `frontend-sprint-status.yaml` et les fiches correspondantes : **la plupart
  des sujets du bloc C ont déjà une fiche**, écrite fin août, restée `blocked` alors que son backend est livré.
- **Les affirmations décisives ont été revérifiées dans le code** avant d'être écrites ici (plantage du Bilan sans
  cascade, codes de refus renommés, devise IMF, rôle métier absent de la réponse des membres, garde de lecture
  seule).

### Ce qui a changé sous le front, en une page

| Avant (ce que le front croit) | Aujourd'hui (ce que le backend fait) |
|---|---|
| Une organisation = une société | Un **dossier** = une société. Profil société, référentiel, paquet fiscal, devise, trésorerie se résolvent **par dossier**. |
| Un pays : le Togo, en dur | Un **registre de 23 pays** (`GET /pays`), chacun `servi` / `partiel` / `non-servi` avec ses `manques`. Seul le Togo est servi. |
| Le référentiel lu au niveau de l'organisation | Le référentiel se déduit du dossier : **axes datés** d'abord, sinon **type d'entité** (`ENTREPRISE` / `MICROFINANCE` / `ASSURANCE`), sinon profil ; sinon refus `SYSTEME_COMPTABLE_INDETERMINE`. Version épinglée par exercice. |
| Deux axes (système, régime) | **Trois axes** : le régime dérogatoire (`AUCUN` / `ZONE_FRANCHE`, avec agrément). |
| Un paquet fiscal implicite | Le paquet se résout par **pays du dossier × année de clôture × régime dérogatoire** (`togo@2026`, `togo-zonefranche@2026`). MNV-901 : assiette IS arrondie, minimum de MFP. |
| La forme juridique = un détail | `formeJuridique` reste déclarative ; c'est le **type d'entité** qui commande le cadre comptable. |
| XOF, « ×100 », « F CFA » | `devise`, `exposant` publiés ; six devises tenues ; devise obligatoire pour un dossier IMF. |
| Liasse : brouillon / validée | `BROUILLON` / `VALIDE` / **`DEPOSE`** ; dépôt constaté (bilan) **ou** chaîne de dépôts avec accusé et rejet (fiscal-service), qui passe la liasse en `DEPOSE` toute seule. |
| Un administrateur fait tout | **Droits** `fiscalite:declaration:preparer|valider|deposer` dans le jeton ; rôles `CAB_ASSOCIE` / `CAB_COLLABORATEUR` ; rôles composés et surcharges. |
| Un abonnement échu bloque | Un abonnement échu passe en **lecture seule** (`403 ABONNEMENT_EXPIRE` sur toute écriture). |
| fiscal-service n'existe pas pour le front | Neuf familles de routes : obligations, implantations, redevables, rémunération, dépôts, livrable e-DSF, calendrier, qualification, invitations. Le front n'en appelle **aucune**. |

## 3. FE-069 : ce que « sans rien ajouter » veut dire

**Règle de partage, appliquée ligne à ligne :** FE-069 corrige ce qui **casse** ou ce qui **dit faux** sur un écran
**qui existe déjà**, avec des données que le backend sert déjà. Tout ce qui ajoute un écran, une action ou une
information nouvelle devient une story nommée.

Le détail (A1 → A13, B1 → B25) est dans `frontend-stories/FE-069.md`, section « Recensement revérifié le 15/11 ». En
bref, le 15/11 ajoute au relevé du 14/11 :

- **dix ruptures** (A4 → A13) que le relevé de schémas ne pouvait pas voir : le Bilan plante pour tout dossier SFD ou
  CIMA ; une liasse déposée s'affiche « brouillon » ; la création d'un dossier IMF échoue ; un pays non servi tombe
  dans le message générique ; l'enregistrement des axes d'un dossier en zone franche est refusé ; l'onglet fiscal
  entier tombe en « refus inconnu » ; le refus du référentiel par dossier n'est pas lu ; un abonnement échu n'est
  pas compris ; deux refus de validation de balance s'affichent bruts ;
- **huit contre-vérités** (B18 → B25) : des phrases ou des valeurs à l'écran que des stories livrées ont rendues
  fausses (exonérations de MFP, types de crédits d'impôt, TPU forfaitaire, imputation « inconditionnelle » des
  déficits, assiette IS arrondie et minimum de MFP, `BZ`/`DZ` en dur, échéance absente traitée comme nulle,
  commentaires périmés) ;
- **trois corrections du relevé du 14/11** : B12 (ce n'est pas « 8 pays » mais un registre à statut), B14
  (`LIASSE_FIGEE` ne veut plus dire « déposée »), B15 (le troisième axe n'est pas qu'un sujet de tests).

**Charge :** la fiche disait 5 points (8 au tracker). Avec ce relevé, **13 points**. FE-069 reste une story : un gate
qu'on découpe ne prouve plus le parcours.

**Qui la prend :** le groupe A, cette semaine (voir §6).

## 4. Le tri

**Lecture du tableau.**
- **Fiche** : *réancrée* = la fiche d'août existe, son en-tête reçoit le 15/11 un bloc « Réancrage » qui dit le
  backend réel ; *neuve* = écrite le 15/11.
- **PO** : le classement vient de la consigne du PO (✔), ou c'est **ma recommandation** (◆), à confirmer ou
  déplacer.
- Toutes les stories dont l'écran est neuf passent par la **règle des maquettes** : maquette ajoutée à
  `prototypes/prospera-prototype.html` et validée **avant** le code.

### 4.1 Février

| Sujet | Story | Fiche | PO | Ce qu'elle fait | Bloquée par |
|---|---|---|:--:|---|---|
| **Remise à niveau** | **FE-069** | réancrée | ✔ | Ruptures et contre-vérités A + B, puis le gate du parcours | — |
| Dépôt de la liasse (C11) | **FE-034** | réancrée | ◆ | Cycle de la liasse : créer, recalculer, compléments, valider, rouvrir avec motif, supprimer un brouillon, versions et comparaison, échéance, audit | FE-069 |
| Dépôt de la liasse (C11, B14) | **FE-081** | réancrée | ✔ | Le dépôt : constat (bilan) ou chaîne de dépôts avec accusé (fiscal), passage à `DEPOSE` | FE-034, FE-112 |
| Dépôt de la liasse | **FE-096** | réancrée | ◆ | Le classeur e-DSF : complétude, trace case par case, livrable | FE-034, FE-112 |
| Dépôt de la liasse | **FE-095** | réancrée | ◆ | La déclaration rejetée | FE-081 |
| Dépôt de la liasse | **FE-038** | réancrée | ◆ | Export PDF / XLSX de la liasse : le seul moyen, en février, de relire la liasse entière avant de la déposer | FE-034 |
| Rôles du cabinet (C16, 902) | **FE-115** | neuve | ✔ | Le rôle métier de chaque membre, l'attribution, les rôles composés et les surcharges | **ticket backend** (rôle métier absent de la réponse des membres) |
| Profil société par dossier (C7) | **FE-040** | réancrée | ✔ | CRUD et complétude du profil **du dossier** | FE-069 |
| Profil société par dossier (C7) | **FE-041** | réancrée | ✔ | Pré-remplissage par OCR, appliqué au dossier | FE-040 |
| Immobilisations (C1) | **FE-097** | réancrée | ✔ | Le registre, les mouvements | FE-069 |
| Immobilisations (C1) | **FE-098** | réancrée | ✔ | Le plan d'amortissement, la publication des dotations (balance d'origine `AMORTISSEMENTS`) | FE-097 |
| Inventaire (C3) | **FE-084** | réancrée | ✔ | Canevas, aperçu, application (balance d'origine `INVENTAIRE`) | FE-069 |
| Écrans fiscaux | **FE-112** | neuve | ✔ | Obligations fiscales de l'exercice ; **branche fiscal-service** (client, URL, CORS, droits lus dans le jeton, module `declarations` ou `fiscalite`) | FE-069 |
| Écrans fiscaux | **FE-113** | neuve | ✔ | Implantations multiples, redevables, mandat, rattachement du dirigeant, invitations côté cabinet | FE-112 |
| Écrans fiscaux | **FE-114** | neuve | ✔ | Base de rémunération par période | FE-113 |
| Écrans fiscaux | **FE-116** | neuve | ✔ | Liquidation et TPU relues : régime dérogatoire, palier, échéance de dépôt, exonérations, type de contribuable | FE-069 |
| Écrans fiscaux | **FE-117** | neuve | ✔ | Déficits : plafond volontaire, motif, constat à l'arrêté, rendement de l'imputation | FE-069 |
| Écrans fiscaux | **FE-118** | neuve | ◆ | Le régime dérogatoire du dossier (zone franche, agrément) : prérequis de FE-116 et du distributeur en zone franche | FE-069 |
| Écrans fiscaux | **FE-094** | réancrée | ✔ | Le calendrier de dépôt du portefeuille | FE-112 |
| Écrans fiscaux | **FE-102** | réancrée | ✔ | Un barème non validé le dit — étendu au tampon du référentiel comptable | FE-069 |
| Écrans fiscaux | **FE-078** | inchangée | ✔ | Articulation comptable ↔ fiscal (lot de D, prête) | — |

### 4.2 Après février

| Sujet | Story | Fiche | PO | Ce qu'elle fait |
|---|---|---|:--:|---|
| Consolidation (C15) | **FE-099** | réancrée | ✔ | Participations et périmètre de groupe |
| Consolidation (C14) | **FE-100** | réancrée | ✔ | Les comptes agrégés (le mot « consolidé » n'y figure pas) |
| Consolidation (C14) | **FE-120** | neuve | ✔ | La consolidation SYSCOHADA : ≈ 50 routes, **à découper au moment de la maquette** |
| Scénarios fiscaux (C4, C5) | **FE-052** | réancrée | ✔ | Scénarios, simulation, comparatif, dossier de justification, export du résultat fiscal |
| Analyse financière (C10) | **FE-089** | réancrée | ✔ | Indicateurs, seuils sectoriels, lecture courant / non courant |
| Espace déclarant | **FE-119** | neuve | ◆ | Qualification, rattachements, invitations **côté salarié et dirigeant** : aucune app ne peut le porter aujourd'hui (coque `prospera-app`, EPIC-265) |
| Devises (C2) | **FE-093** | réancrée | ◆ | Créances et dettes en devises, réévaluation |
| Devise et échelle | **FE-121** | neuve | ◆ | Formater par `devise` et `exposant` ; fin de « F CFA » en dur. Tous les dossiers de février sont en XOF. |
| Contrôles de balance (C6) | **FE-053** | réancrée | ◆ | Le rapport de contrôles et le statut de preuve |
| Export de balance (C6) | **FE-074** | réancrée | ◆ | Lot de D : l'export existe maintenant côté serveur (`balances/{id}/export`) |
| Plan comptable, réintégrations (C8) | **FE-083**, **FE-046** | réancrées | ◆ | Plan du dossier, règles de rattachement, sélecteurs de comptes et de codes |
| Imports de relevé (C9) | **FE-122** | neuve | ◆ | Historique et annulation d'un import ; canal microfinance |
| Prévisionnel (C12) | **FE-035** | réancrée | ◆ | Cycle de vie des hypothèses (renommer, dupliquer, rebaser, verrouiller, supprimer) |
| Référentiels (C13) | **FE-123** | neuve | ◆ | Catalogue des référentiels, postes et plan du Bilan, aperçu CIMA |
| Pièces (C17) | **FE-124** | neuve | ◆ | Rattacher au dossier une pièce extraite avant sa création |
| Balance | **FE-125** | neuve | ◆ | Origine et lignée des versions, antériorité, comptes de travail à 8 caractères, provenance typée |
| États de la liasse | **FE-033**, **FE-091**, **FE-092** | inchangées | ◆ | Compte de résultat, TFT, notes annexes à l'écran. En février, l'export (FE-038) en tient lieu. |
| Bilan à l'écran | **FE-086**, **FE-087** | inchangées | ◆ | Diagnostic d'équilibre, colonne N-1 recalculée, périodes et comparabilité |

### 4.3 Fiches qui sortent

- **FE-042** (*deux axes*) : **remplacée**. Les axes vivent dans `dossier-service` et ont déjà leur panneau dans la
  fiche dossier ; le troisième axe est **FE-118**.

## 5. Ce que le backend doit encore

- **Ticket au groupe B** (`tickets/TICKET-BACKEND-role-metier-absent-de-la-reponse-des-membres.md`) : `GET /users` ne
  publie pas le rôle métier effectif (`CAB_ASSOCIE`, `CAB_COLLABORATEUR` ou rôle composé). Sans lui, FE-115 ne peut
  pas afficher qui a le droit de déposer. **Bloque FE-115.**
- **STORY-905, nommée par A** (balance et bilan, dépôts de A) : un abonnement échu met le service en lecture seule,
  mais la garde juge sur la méthode HTTP ; les **simulations** (`POST …/dry-run`) sont donc refusées, alors qu'elles
  n'écrivent rien. À trancher dans la story : la simulation est une lecture.
- **À arbitrer dans FE-081, sans backend neuf :** deux chemins mènent à `DEPOSE` (le constat de `bilan-service`,
  `TENANT_ADMIN` ; la chaîne de dépôts de `fiscal-service`, droit `deposer`). Recommandation : l'écran suit la
  chaîne fiscale quand le cabinet détient `declarations` ou `fiscalite`, le constat sinon.

## 6. Qui fait quoi cette semaine

- **FE-069 : le groupe A**, qui l'avait entamée (branche `fe-069`, `4148d65`, poussée). Le dépôt
  `prospera-frontend-expert-comptable` passe au groupe A **jusqu'à la fusion de FE-069**, puis revient au groupe D.
  Amendement écrit au plan (§2 et §6).
- **Le groupe D**, en attendant, commence par **AP-38** (console, dépôt qu'il tient) et par les **maquettes** des
  stories de février (`prototypes/`, qu'il tient), dans l'ordre du §4.1. Il reprend le dépôt du cabinet à la fusion
  de FE-069.
- **Identifiants.** FE-112 → FE-125 sont écrits par A le 15/11, sur décision de l'utilisateur. La plage libre du
  groupe D devient **FE-126 → FE-139**.

## 7. La charge

Février compte **21 stories front** au §4.1 (FE-069 et FE-078 comprises), dont **7 neuves** ; **une quinzaine
demandent une maquette neuve ou complétée** (seules FE-034, FE-038, FE-078 et FE-069 n'en demandent pas). C'est beaucoup pour un seul porteur
d'écrans : les maquettes du groupe D (§6) sont le seul moyen de tenir. Si quelque chose doit céder, mon ordre de
sacrifice est : FE-114 (rémunération), puis FE-096 (classeur e-DSF), puis FE-095 (rejet). Le dépôt de la liasse, le
profil du dossier et les obligations ne cèdent pas : ce sont eux que le PO a nommés.
