# Revue de cohérence : PRD Moteur d'installation × contrat de module, plan v3, PRD frères, code

> **Date :** 2026-11-10 · **Objet relu :** `prds/prd-moteur-installation-2026-11-09/prd.md` (+ `.memlog.md`)
> **Confronté à :** `CONTRAT-DE-MODULE-2026-11-09.md` (C1 → C11, §3, §6, §7, §8, §9), `PLAN-2-DEVS-8-SEMAINES-2026-10-26.md`
> (v3 : D1, D2, D3, §1.4, §3, §5), `architecture-prospera-ecosystem-2026-07-04.md` (AD-P16, AD-P17),
> `prds/prd-reprise-donnees-2026-11-10/prd.md`, `prds/prd-connecteurs-2026-11-10/prd.md`, et le code de
> `origin/dev` (`platform-catalog-service`, `auth-service`, `prospera-paiement-service`, `docker-compose.yml`,
> fiches STORY-280 et STORY-727). Lecture seule ; aucun autre fichier modifié.

## Verdict

Le PRD couvre bien le **geste d'installation** (dépendances, refus nommés, bilan, répétition générale), et
il est fidèle à Q2 et Q5. Il n'est **pas prêt à nourrir la spine de la coque** : il ajoute au cycle de vie
d'un module des états qu'aucun contrat ne porte (essai/réel, voyant, gel, préavis, essai prospect), sans
dire comment la coque les lit. Il **oublie les droits de tenant**, que le contrat et le plan lui confient.
Il **contredit D3 et Q4**. Il décrit la suspension et les chemins d'installation d'une façon que le code
dément.

| Sévérité | Nombre |
|---|:--:|
| critical | 1 |
| high | 11 |
| medium | 13 |
| low | 4 |
| **Total** | **29** |

⚠️ **Prémisse de la commande à corriger.** La commande parle de « questions Q1 → Q5 réservées au PO le
13/11 ». Le contrat les dit **toutes tranchées le 2026-11-09** (en-tête, §0, §8), et AD-P17 v1.8 les
inscrit. La question 2 de la revue devient donc : *le PRD respecte-t-il les décisions Q1 → Q5 déjà
rendues ?* C'est ainsi qu'elle est traitée au §2.

---

## 1. Couverture du contrat de module (C1 → C11) et §7 du PRD

### R-01 · high · absence (§4.A, §7 ligne C7) : les droits de tenant ne sont pas traités

- **Citation (contrat §7) :** « Catalogue des droits fermé dans `auth-service` | accepté en v1 (C7) ;
  **lecture depuis les manifestes au moteur** | sem. 5 » ; « Un droit d'un module non installé est-il
  filtré ? | Dev B, à mesurer au lot 1 » ; « STORY-365 dépassée par 166 et 167 | Dev B, à requalifier ».
  **Plan §5, sem. 5 :** « Moteur d'installation : **STORY-365 (droits de tenant)**, `depends` au catalogue,
  installation d'un pack | une organisation reçoit un pack, **et ses droits apparaissent sans
  déploiement** ». Plan §9 : « STORY-365 est la **première** story de code de B ».
- **PRD §7, C7 :** « Droits plateforme existants ; droit client à créer pour donner un consentement
  (FR-27) ». Aucune FR ne parle de `droits` du manifeste, de `TenantPermission`, ni de filtrer `perms[]`
  par les modules installés.
- **Écart :** trois écarts du contrat §7 et le jalon du plan en semaine 5 ont pour porteur le moteur, et le
  PRD n'en couvre aucun. La garde C7 (`manifeste.droits ⊂ TENANT_PERMISSION_CATALOG`) n'a pas de
  consommateur côté moteur.
- **Correction :** ajouter une FR « Les droits suivent l'installation ». (a) À l'installation, les droits
  déclarés au manifeste deviennent attribuables dans la console du client, sans déploiement. (b) Les droits
  d'un module non installé, suspendu ou révoqué ne figurent pas dans les droits **effectifs** d'un membre,
  ou bien sont ignorés par la coque, selon le résultat de la mesure du §7. (c) STORY-365 est requalifiée
  contre 166/167. Ajouter le jalon SM « droits visibles sans déploiement ».

### R-02 · high · §3 « Installer » / « Mettre en service », FR-5, FR-7, FR-8 : le cycle de vie contredit AD-P17 et C8

- **Citation (PRD §3) :** « **Installer** : rendre un module disponible pour une organisation **dans
  l'espace d'essai**. **Mettre en service** : … **dans l'espace réel**. » FR-5 : « Un module en attente
  ou bloqué n'apparaît pas dans le menu ».
- **Contrat §1 / AD-P17 :** « **Installer = entitlement `ACTIVE`** ». C8 : « Une entrée est visible **si et
  seulement si** l'entitlement effectif est `ACTIVE` **et** l'utilisateur a le droit. »
- **Écart :** le PRD redéfinit « installer » alors que son §3 annonce « aucun synonyme », et il ajoute deux
  dimensions que l'entitlement ne porte pas : l'**espace** (essai ou réel) et le **voyant** (🟢 🟠 🔴). Si
  l'entitlement d'un module 🔴 est `ACTIVE`, le module apparaît au menu (violation de FR-5), et ses dépendants
  passent la garde 422 du serveur (FR-4). S'il ne l'est pas, on ne sait pas quand il le devient. Sur la
  plateforme Money Vibes, qui sert plusieurs organisations, on ne sait pas non plus si l'espace est un
  déploiement distinct (deux catalogues, deux entitlements) ou une dimension de l'entitlement.
- **Correction :** écrire la **table d'états** d'un couple (organisation × module) dans le PRD, avec pour
  chaque état le statut d'entitlement correspondant, le voyant, la visibilité au menu et le comportement de
  la gate. Dire explicitement que l'espace d'essai et l'espace réel sont **deux déploiements**, chacun avec
  son catalogue (ou l'inverse). Puis aligner le vocabulaire sur AD-P17 : par exemple « installer » = poser
  `ACTIVE` dans l'espace considéré, et le voyant ≠ 🟢 garde l'entitlement fermé.

### R-03 · high · FR-32, §3 « Préavis » : la suspension « consulter et exporter » contredit C2, et le code la dément

- **Citation (FR-32) :** « Abonné, droit d'utiliser échu : **30 jours de préavis** où tout fonctionne …
  puis **suspension** : on ne peut plus que **consulter et exporter**. … **Même règle que la suspension
  d'impayé de la plateforme (STORY-280)**, avec l'export en plus. »
- **Contrat C2 :** « refuse **toute** route métier quand le statut effectif n'est pas `ACTIVE` … Preuve :
  un e2e par statut (`SUSPENDED`, `REVOKED`, expiré, absent) : un 403 nommé, **aucune donnée** ».
- **Code :** `SUSPENDED` ferme tout (`paiement-access.guard.ts` l.122 : « Égalité à `ACTIVE` … `SUSPENDED`
  ferme »). STORY-280, AC-1 : « Chaque service en aval refuse déjà un droit `SUSPENDED` ». La **lecture
  seule** existe, mais pour un droit **échu** : STORY-727 lot 4 dit « Échu ⇒ lecture seule : GET passent,
  toute écriture ⇒ 403 `ABONNEMENT_EXPIRE` », et ce passage est **immédiat**, sans préavis de 30 jours.
  Le mot « préavis » de STORY-280 désigne aussi autre chose : l'avis publié **avant** une suspension.
- **Écart :** le PRD appelle « suspension » ce que le code appelle « échu » et attribue la règle à la
  mauvaise story. Ses 30 jours « où tout fonctionne » après l'échéance contredisent 727 lot 4. Au passage,
  le contrat C2 (« expiré ⇒ 403 sans donnée ») est lui aussi démenti par 727 lot 4.
- **Correction :** remplacer « suspension » par « **expiré (lecture seule)** », citer STORY-727 lot 4
  (`ABONNEMENT_EXPIRE`), et dire si les 30 jours de préavis décalent la date d'échéance portée par la
  licence, ou s'ils ajoutent un état « en préavis » au terme (`terme.ts`). Renommer le « préavis » du PRD
  pour éviter la collision avec STORY-280. Signaler au contrat que C2 doit distinguer « expiré » (lecture
  seule) de `SUSPENDED` et `REVOKED` (fermés).

### R-04 · high · FR-5, FR-6, FR-9, FR-10, FR-16, FR-26, §7 C1 : de nouvelles obligations pèsent sur chaque module, hors contrat

- **Citation :** FR-5 « Chaque module déclare ses prérequis au manifeste » ; FR-6 « Chaque module installé
  **exécute ses vérifications** et en rend le résultat chiffré » ; FR-9 « Aucun envoi réel ne part de
  l'espace d'essai … vérifié côté serveur » ; FR-10 « l'espace d'essai se rafraîchit depuis l'espace réel …
  cloisonnée par organisation » ; FR-16 « santé **par module** » ; FR-26 « indicateurs IA agrégés (taux
  d'erreur par modèle, nombre de corrections, dérive) ».
- **Contrat §6 :** chaque PRD remplit **onze lignes**, C1 → C11. Aucune ne porte « prérequis »,
  « vérifications », « santé », « mode essai (interception des envois) », « export/import par organisation
  pour le rafraîchissement » ou « indicateurs de niveau 0 ».
- **Écart :** le PRD crée des obligations pour **tous** les modules (y compris `notification` et `paiement`
  pour l'interception, et `auth` pour « comptes créés, invitation envoyée »), mais le contrat ne les porte
  pas. Les PRD des lots 2 à 4, qui remplissent le gabarit du §6, les ignoreront. Le contrôle de
  préparation ne les verra pas.
- **Correction :** faire amender le contrat par le PO (comme pour C11). Par exemple, une clause **C12
  « installable sous contrôle »** : prérequis, vérifications et santé exposés par un endpoint nommé ;
  respect du mode essai ; export et import par organisation. Ou bien étendre officiellement C1 (champs du
  manifeste) et C10. Lister ces obligations, nommément, dans le §7 du PRD.

### R-05 · high · frontmatter `service: platform-catalog-service`, §7 C3 et C10 : les parties B et C ne peuvent pas vivre dans le catalogue

- **Citation :** frontmatter `service: platform-catalog-service` ; §7 « Le moteur vit dans
  `platform-catalog-service` » ; C10 « Socle minimal : démarre toujours, sans profil » ; C3 « Possède :
  offres, bilans, licences, consentements, journal ».
- **Contrat §4 :** « **un agrégat distinct, c'est un service distinct** ».
- **Écart :** la partie B met en jeu plusieurs composants : l'**émission** de licences et la
  **distribution** de paquets, côté Money Vibes ; la supervision (FR-16) ; et, sur l'instance, un agent de
  signal et un **outil de promotion et de retour arrière** qui sauvegarde, bascule de version et restaure
  (FR-17, FR-18, FR-25). Un retour arrière de la plateforme ne peut pas être exécuté par un service de la
  plateforme qu'il remplace. La partie C ajoute le registre des consentements et le canal sortant. Ce sont
  des agrégats et des lieux d'exécution distincts. Les PRD frères laissent le service « à trancher dans la
  spine » ; celui-ci le fige.
- **Correction :** remplacer par « partie A dans `platform-catalog-service` ; parties B et C : services à
  trancher dans la spine (émetteur Money Vibes, agent d'instance hors des conteneurs métier, registre des
  consentements) ». Ajuster C3 et C10 en conséquence : l'agent d'instance fait partie du socle, mais il est
  hors `docker compose` des modules.

### R-06 · medium · §7, lignes C1, C4, C5, C7 et C8 : le contrat du moteur lui-même est incomplet

- **Citation :** C1 « Le manifeste s'enrichit : raison par dépendance, prérequis, vérifications, champ
  `ia` » ; C5 « Publie `entitlement.changed` (existant) ; topics de bilan et de licence à nommer » ; C8
  « Écrans dans la console Money Vibes (installation, bilan, supervision, consentements) ».
- **Écart :** la ligne C1 décrit ce que le moteur exige des **autres**, pas le manifeste du moteur : son
  code, ses `depends` et son `enrichiPar`, qui devrait déclarer `[reprise, connecteurs]` d'après la ligne
  C4. La ligne C5 ne cite aucun topic **consommé** : feu vert de la Reprise (Reprise FR-15), santé des
  Connecteurs (Connecteurs FR-13), `echeance.encaissee` et `identity.org.created/updated` (déjà consommés,
  STORY-727). La ligne C7 omet les droits du DSI : choisir la date, revenir en arrière, reporter un
  correctif, déposer un fichier, ouvrir le tunnel. La ligne C8 omet les écrans côté client (voir R-22).
- **Correction :** compléter ces cinq lignes. Une ligne qui dit « à nommer dans la spine » doit au moins
  lister les faits échangés.

### R-07 · medium · FR-2, FR-4, §7 C1 : aucune FR ne dit comment un manifeste entre au catalogue (Q1)

- **Citation :** FR-2 « **La raison vient du manifeste** : chaque dépendance dure y porte un libellé » ;
  FR-4 « Un manifeste qui crée un cycle de dépendances est refusé : `MANIFESTE_CYCLE` (422) ».
- **Contrat C1 / Q1 :** « source = le fichier du dépôt du service ; **le catalogue en garde une copie par
  `ModuleVersion`** … une garde de test compare les deux ». Exemple : `depends: ['reseau']`.
- **Écart :** le refus `MANIFESTE_CYCLE` suppose une **publication** de manifeste, que le PRD ne décrit
  nulle part : qui publie, à quel moment (avec la `ModuleVersion`), avec quelle garde de comparaison. De
  plus, FR-2 change la forme de `depends` (un code + un libellé) sans le dire au contrat.
- **Correction :** ajouter une FR « Publier le manifeste d'une version » (copie au catalogue, garde de
  comparaison, refus `MANIFESTE_CYCLE`, dépendance vers un code inconnu refusée). Faire amender l'exemple
  de C1 (`depends: [{ code, raison }]`).

### R-08 · low · §7 C11 : la ligne est exacte, mais la preuve C11 dépend d'un tuyau non décrit

- **Citation (contrat C11, preuve) :** « une correction humaine fait **croître** le journal, et
  l'indicateur agrégé de niveau 0 la compte ».
- **Écart :** FR-26 liste les indicateurs, mais aucune FR ne dit comment un module avec IA les remet au
  signal (endpoint ou topic). Ce trou fait partie de R-04.
- **Correction :** traiter avec R-04 (clause d'exposition des indicateurs de niveau 0).

---

## 2. Décisions déjà rendues : Q1 → Q5, D1 → D3, memlog

### R-09 · high · partie 4.B en entier, FR-25 : D3 est contredite, et le plan n'est pas amendé

- **Citation (plan §8, D3) :** « **le profil `docker compose` par module dans les 8 semaines** … ; **le
  packaging client complet après** ». Contrat §9 : « Il **ne traite pas l'installation complète chez le
  client** (images, mises à jour, licence) : D3 la renvoie après les 8 semaines ».
- **Memlog :** « D3 RÉVISÉE (PO confirme) : l'installation complète chez le client … doit être prête AVANT
  FÉVRIER 2027 ».
- **Écart :** le PRD applique une révision de D3 qu'il ne mentionne nulle part. Le plan (§8, et §5 où Dev B
  n'a que la semaine 5 pour le moteur), le contrat §9 et AD-P17 disent toujours le contraire. Le PRD ne
  découpe pas non plus ce qui est dû le **15/01** (SM-1, partie A seule ?) et ce qui l'est en **février**
  (parties B et C, deux espaces, licence). La charge des parties B et C n'apparaît pas au plan.
- **Correction :** ajouter au PRD une section « Jalons » qui affecte chaque FR à 15/01, février ou plus
  tard. Inscrire **D3 révisée** dans le plan (§8), dans le contrat §9 et dans AD-P17, avec ses conséquences
  sur la charge (lot de Dev B, ordre de sacrifice du §7 du plan).

### R-10 · high · FR-33, §3 « Effacer » : Q4 est contredite, et le PRD se contredit lui-même

- **Citation (FR-33) :** « S'il ne signe pas, tout est **effacé 30 jours après la fin de l'essai**, et
  l'effacement est tracé ». §3 : « **Effacer** : … acte séparé, demandé, tracé, **hors de ce PRD** ».
- **Contrat Q4 :** « **Sans limite jusqu'à une demande d'effacement**, qui est un acte séparé et tracé ».
- **Écart :** FR-33 crée un effacement **automatique**, à échéance, que le PRD spécifie alors qu'il le
  déclare hors périmètre. Et C3 interdit au moteur d'effacer les collections des autres modules : il faut
  un contrat d'effacement par organisation (topic ou endpoint dans chaque module).
- **Correction :** soit faire acter par le PO que la non-signature d'un essai **vaut demande
  d'effacement** (exception à Q4, écrite au contrat), soit transformer FR-33 en « effacement **proposé** ».
  Dans les deux cas, déclarer le mécanisme d'effacement par organisation comme une obligation de module
  (voir R-04).

### R-11 · medium · FR-5, FR-14 : Q3 n'est pas reprise, et FR-5 peut être lue contre elle

- **Contrat Q3 / §3.6 :** si une dépendance dure est suspendue, le dépendant « **reste ouvert** ; ce qu'il
  lit d'elle se déclare `SUSPENDU` ».
- **PRD :** FR-14 « Une suspension (impayé, litige) … arrive par une nouvelle licence » ; FR-5 « Les
  modules qui dépendent du module bloqué passent 🟠 en attente » et sont masqués du menu.
- **Écart :** FR-5 traite un prérequis manquant à l'installation, mais rien ne dit qu'une **suspension**
  ultérieure (licence, litige) ne bascule pas les dépendants en 🟠. L'architecte peut généraliser FR-5 et
  violer Q3.
- **Correction :** ajouter une phrase à FR-14 : « Une suspension ne change ni le voyant ni la visibilité
  des modules dépendants (contrat Q3) ; seule l'installation initiale propage l'attente. »

### R-12 · medium · QA-1 : les 18 modules commerciaux n'ont pas de dépôt où tenir leur manifeste (Q1)

- **Citation (QA-1) :** « le catalogue technique est incomplet par choix : **chacun de ces modules doit y
  entrer, avec son manifeste** ».
- **Contrat Q1 :** la **source** du manifeste est un fichier dans le dépôt du service.
- **Écart :** la plupart des 18 modules commerciaux (CRM, Terrain & Tournées, Application mobile, Prise de
  commande, Relances & Recouvrement, Encaissements & PI-SPI…) n'ont ni service ni dépôt. Certains ne
  correspondent à aucun code du catalogue (le seed a `pi-spi`, `commande`, `recouvrement`, mais ni « CRM »
  ni « Application mobile »). Q1 ne dit pas où vit le manifeste d'un module encore sans service.
- **Correction :** définir la correspondance entre module commercial et code(s) au catalogue (voir R-14).
  Dire que le manifeste d'un module sans service est tenu au catalogue avec le statut « non octroyable »
  (`MODULE_NON_OCTROYABLE` existe), jusqu'à la création du dépôt.

### R-13 · medium · §2.2, §8 : la limite « pas de libre-service » est contredite par FR-33 et par Reprise FR-19

- **Citation (§2.2) :** « Le client qui voudrait installer lui-même … hors cible » ; §8 « Seule la limite
  "pas de libre-service en v1" reste une inférence, **sans effet sur février** ».
- **PRD FR-33 :** le prospect « teste **sans Money Vibes** ». Reprise FR-19 : « **Le libre-service est prêt
  en février** pour le distributeur … des prospects chargeront leurs propres données ».
- **Écart :** l'inférence a bien un effet sur février. Le prospect se sert seul : il crée ses comptes,
  importe ses données et utilise une interface.
- **Correction :** reformuler §2.2 ainsi : « l'**installation** reste faite par Money Vibes (y compris
  l'offre d'essai) ; l'**usage**, l'**import** et l'essai sont en libre-service dès février ». Retirer la
  phrase du §8.

---

## 3. Cohérence avec les PRD Reprise et Connecteurs

### R-14 · high · FR-1, QA-1, SM-1, NFR-5 (+ Connecteurs FR-3) : « pack » a deux sens incompatibles

- **Citation (PRD FR-1) :** « la plateforme complète, ou un ou plusieurs packs (**Terrain & Ventes,
  Finance & Recouvrement, Stock & Logistique, Croissance & Équipes**) » ; QA-1 « 18 modules, 4 packs,
  add-on Freelance » ; SM-1 « le **pack distributeur** installé en une action ».
- **Contrat §1 :** « **Pack** | … | `VerticalPack` : `distributeur`, `imf-sfd`, `assurance-cima`,
  `cabinet` ». **Code :** `packs.seed-data.ts`, où `distributeur` = `balance, bilan, pdv, stock, catalogue,
  commande, facturation`. Ce pack est aussi la clé de l'**octroi par vertical** (STORY-727 lot 7) et des
  contrats de packages (STORY-727 lot 1).
- **Écart :** le PRD emploie « pack » pour des sous-ensembles commerciaux qui n'existent pas au catalogue,
  tout en se réclamant du vocabulaire du contrat. SM-1 et NFR-5 deviennent ambigus : s'agit-il du
  `VerticalPack` de 7 modules ou de la « plateforme complète » de 18 modules ? Connecteurs FR-3 hérite de
  la même ambiguïté (« Finance & Recouvrement », « Terrain & Ventes »).
- **Correction :** fixer un seul sens. Par exemple, « pack » = `VerticalPack`, et « **bouquet** » pour les
  sous-ensembles commerciaux, ou l'inverse avec migration du seed. Écrire la table *bouquet → modules
  commerciaux → codes du catalogue*. Préciser SM-1 et NFR-5 (liste exacte des codes). Reporter le même
  terme dans Connecteurs FR-3.

### R-15 · medium · FR-6, FR-7, §7 C5 : le feu vert de la Reprise n'a pas de consommateur explicite

- **Citation (Reprise FR-15) :** « Le feu vert est un **fait publié, lisible par le moteur** … le moteur
  d'installation ne peut pas mettre le client en service ». Reprise FR-3 : fichiers supprimés « à la
  **réception définitive** ».
- **PRD moteur :** §3 « Mettre en service … une fois ses conditions remplies (… reprise de données
  réconciliée) » ; FR-6 ne parle que du **nombre** d'objets repris.
- **Écart :** aucune FR du moteur ne dit « la ligne Reprise du bilan reste 🟠 tant que le feu vert n'est
  pas reçu pour le lot rejoué dans l'espace réel ». La ligne C5 ne cite pas le fait. La « réception
  définitive », qui déclenche une suppression chez la Reprise, n'est définie dans aucun des deux PRD :
  UJ-1 la cite, et elle n'est pas « En service ».
- **Correction :** ajouter à FR-7 ou FR-8 la règle « feu vert ⇒ 🟢 de la ligne Reprise », et la ligne
  « consomme : `reprise.feu-vert` » au §7 C5. Définir « réception définitive » au §3 (événement, auteur)
  ou dire qu'elle équivaut à « En service ».

### R-16 · medium · FR-33 (+ Reprise §7 C8 et FR-19) : l'écran de libre-service de février n'a pas de lieu

- **Citation (Reprise C8) :** « Écrans dans la console Money Vibes ; **plus tard** dans `prospera-app`
  pour le libre-service ». Reprise FR-19 et PRD FR-33 : le prospect et le DSI importent seuls, **dès
  février**.
- **Écart :** un prospect n'a pas accès à la console Money Vibes. Les deux PRD supposent un écran client
  que ni l'un ni l'autre ne place. Le moteur, qui ouvre l'offre d'essai, ne dit pas où le prospect atterrit.
- **Correction :** décider (PO) que l'import en libre-service et l'essai prospect vivent dans
  `prospera-app` dès février, et corriger Reprise C8 dans le même sens. Voir aussi R-22.

### R-17 · medium · FR-33, FR-8 : le sort des « réglages » de l'essai contredit la règle de non-copie

- **Citation (FR-33) :** « S'il signe, il garde son espace d'essai **et ses réglages (tables de
  correspondance, rôles, zones)** ; la reprise est rejouée à frais dans l'espace réel ». FR-8 : « **on ne
  copie jamais l'essai vers le réel** » ; la même offre et les mêmes tables de correspondance sont rejouées.
- **Écart :** les rôles appartiennent à `auth-service` et les zones à `reseau` (C3). FR-8 ne rejoue que
  l'offre et les tables de correspondance. On ne sait pas comment les rôles et les zones passent dans le
  réel sans copie. « À frais » est sans doute une coquille pour « à neuf ».
- **Correction :** lister ce qui est **rejoué** (offre, tables de correspondance, rôles, zones…) et par
  quel contrat de chaque module propriétaire. Corriger « à frais ».

### R-18 · medium · partie 4.C : AD-P16 n'est pas conciliée avec la règle de non-mise en commun

- **Citation (PRD 4.C) :** « avoir leurs données sur nos serveurs ne donne pas le droit de les mettre en
  commun ». §3 : la console Money Vibes « tourne **sur l'instance du client** ».
- **AD-P16 (écosystème v1.6) :** « Money Vibes peut lire la donnée métier de TOUTE organisation, dans TOUS
  les modules » (routes plateforme, journalisées).
- **Memlog :** la tension est relevée (« AD-P16 permet à Money Vibes de lire … À trancher par le PO »),
  mais elle n'est pas tranchée dans le PRD.
- **Écart :** sur site, une console Money Vibes munie des routes AD-P16 est un accès de niveau 2 sans
  consentement. Sur la plateforme, la lecture AD-P16 et le niveau 1 (« approuvé à chaque export ») se
  recouvrent.
- **Correction :** ajouter une FR ou une note : sur une instance sur site, les routes AD-P16 ne sont
  utilisables qu'en session de support ouverte par le client (FR-23) ; sur la plateforme, une lecture
  AD-P16 ne vaut jamais contribution. Faire amender AD-P16 en conséquence.

### R-19 · low · UJ-1, UJ-2, Reprise et Connecteurs : dérive de vocabulaire

- **Citation :** UJ-1 « un **environnement de test**, la **production** » (alors que le §3 dit « Au lieu
  de… ») ; UJ-2 « un **rapport d'import** » (le PRD Reprise dit « rapport de reprise ») ; la « **bascule** »
  (Reprise FR-15 à FR-19, Connecteurs FR-3 et UJ-8) n'est pas définie au §3 du moteur et y recouvre « mise
  en service ».
- **Correction :** remplacer par « espace d'essai », « espace réel » et « rapport de reprise ». Définir
  « bascule » au §3, par exemple « bascule = mise en service d'un client dont la reprise a donné son feu
  vert », ou la bannir des PRD frères.

---

## 4. Ce dont la spine de la coque `prospera-app` aura besoin

### R-20 · critical · absence : le moteur ne dit pas ce qu'il expose à la coque

- **Constat :** C8 rend la visibilité d'un module fonction de « entitlement effectif `ACTIVE` + droit ». Le
  PRD ajoute pourtant, pour un même couple (organisation × module) ou pour l'instance : l'espace (essai ou
  réel), le voyant 🟢 🟠 🔴, l'état du client (En installation ou En service), l'**essai prospect** (30 j,
  prolongeable une fois, puis fermeture), le **préavis**, l'**échu en lecture seule**, le **gel** (instance)
  et la **suspension**. FR-5 en tire une règle de menu (« 🟠/🔴 n'apparaît pas »), FR-9, FR-15 et FR-32 des
  bandeaux. Aucune FR ne dit **par quel canal** la coque obtient cet état : extension de
  `entitlement.changed` (v3 ?), route de lecture du catalogue, ou licence lue sur l'instance.
- **Pourquoi c'est critique :** la spine de la coque est due le **20/11** (plan §3), et sa première
  décision porte sur la construction du menu. Sans cette réponse, l'architecte doit inventer une énumération
  d'états et un contrat de lecture, c'est-à-dire écrire une exigence produit à la place du PO.
- **Correction :** ajouter une FR « **Ce que le moteur publie pour la coque** ». (1) La liste des modules
  d'une organisation avec, pour chacun, un **état effectif unique** pris dans une énumération fermée (par
  exemple `EN_SERVICE`, `EN_ATTENTE`, `BLOQUE`, `ESSAI_PROSPECT{finLe}`, `PREAVIS{finLe}`,
  `LECTURE_SEULE`, `SUSPENDU`, `NON_INSTALLE`), la règle de menu de chaque état, et le canal (topic
  versionné et route de lecture). (2) L'état de l'**instance** : espace, gel, fin de maintenance. (3) La
  garantie que la gate de chaque module et le menu lisent la même énumération.

### R-21 · high · FR-9 : la coque ne sait pas dans quel espace elle tourne

- **Citation (FR-9) :** « L'espace d'essai porte en permanence un **bandeau jaune**, une couleur différente
  et un **titre d'onglet différent** ».
- **Écart :** la coque doit l'afficher, mais la source de vérité n'est pas dite : variable de déploiement,
  champ de l'instance au catalogue, ou licence. Le PRD ne dit pas non plus si un même utilisateur peut
  passer d'un espace à l'autre (un lien, deux URL), ni comment se fait le bandeau d'un prospect qui n'a
  **que** l'essai.
- **Correction :** préciser au PRD : « l'espace est une propriété de **l'instance déployée**, exposée par
  le moteur à la coque (route publique de configuration) ; deux URL distinctes ».

### R-22 · high · §7 C8, FR-17, FR-18, FR-19, FR-22, FR-23, FR-27, FR-32, FR-33 : D1 ignorée, les écrans côté client n'ont pas de lieu

- **Citation (§7 C8) :** « Écrans dans la console Money Vibes (installation, bilan, supervision,
  consentements) ». FR-22 : « le DSI la dépose **dans la console de l'instance** ». FR-27 : le
  consentement est donné **par le DG du client**.
- **D1 (plan §8) :** « **la coque unique** … l'organisation de l'utilisateur décide du menu, des données et
  de l'habillage ». Plan §1.5 : la console est le **CRM interne de Money Vibes**.
- **Écart :** le DG qui consent, le DSI qui choisit une date, revient en arrière, reporte un correctif,
  dépose un fichier ou ouvre un tunnel, le prospect en essai et l'abonné échu qui exporte sont tous des
  **utilisateurs du client**. Les placer dans la console Money Vibes oblige à leur donner des rôles
  **plateforme**, ce qui mêle portée plateforme et portée tenant (AD-P15). Le PRD ne mentionne jamais
  `prospera-app`.
- **Correction :** partager la ligne C8 en deux. **Console Money Vibes** : offre, installation, bilan,
  supervision, émission de licences. **`prospera-app`, espace « Administration de mon instance »** :
  mises à jour, retour arrière, fichier, tunnel, consentements, export, essai. Pour chaque écran, déclarer
  le **droit de tenant** correspondant (voir R-01).

### R-23 · medium · D1 « habillage », §4.A : l'habillage et la configuration par organisation ne sont pas traités

- **D1 / plan §1.4 :** « la vertical n'est **qu'une configuration** : un pack, une marque, un tableau de
  bord d'accueil ».
- **Code :** `Entitlement.config` (`Record<string, unknown>`) existe déjà par couple (organisation ×
  module). STORY-727 y range `dossiersMax`.
- **Écart :** le PRD ne dit pas qui possède la marque, le logo, les couleurs et le tableau de bord
  d'accueil d'une organisation, ni si l'installation les pose. La coque devra les lire quelque part.
- **Correction :** une FR « L'installation pose la configuration d'accueil » (marque, accueil, langue),
  avec son propriétaire (catalogue, offre ou organisation dans `auth`) et sa lecture par la coque. Sinon,
  écrire « hors moteur, porté par … ».

### R-24 · medium · FR-13, FR-14 : la relation entre la licence et les entitlements n'est pas définie

- **Citation (FR-13) :** « Sur une instance sur site, … les droits viennent de la **licence** ». FR-14 :
  licence = `usage: perpétuel | jusqu'au <date>` et `miseAJour: jusqu'au <date>` par module.
- **Écart :** les gates des services et la coque lisent l'**entitlement** (statut, `terme`, `echeanceLe`)
  par `entitlement.changed`. On ne sait pas si la licence importée **se projette** en entitlements (et sur
  quel `source`), ni si elle coexiste avec eux. `miseAJour` et le gel n'ont pas d'équivalent dans
  l'entitlement : ce sont des états d'instance.
- **Correction :** écrire « une licence importée se projette en entitlements (source `licence`) par le
  point de décision unique de FR-4 ; `usage` → `terme`/`echeanceLe` ; `miseAJour` et le gel sont des
  états d'**instance** exposés à part (voir R-20) ».

### R-25 · medium · QA-1, contrat C8 : la correspondance entre module commercial, code et dossier d'écran n'est pas écrite

- **Contrat C8 :** chaque module livre `src/modules/<code>/` et ses entrées de menu. **PRD QA-1 :** la
  console montre **18 modules commerciaux**.
- **Écart :** si un module commercial regroupe plusieurs codes (« Encaissements & PI-SPI ») ou si un code
  n'a pas d'écran propre (`balance`), la coque ne sait pas si elle doit construire son menu par **code**
  ou par **module commercial**, ni avec quel libellé. Ce trou se rattache à R-14.
- **Correction :** dans la table de R-14, ajouter la colonne « dossier d'écran / libellé de menu ». Dire
  que le menu se construit **par code** et que le libellé commercial n'est qu'un affichage.

### R-26 · low · FR-15, FR-32, FR-33 : la visibilité des bandeaux et la fonction d'export ne sont pas précisées

- **Citation :** FR-15 « bandeau orange **pour les administrateurs seulement** » ; FR-32 « tout fonctionne,
  **avec un avertissement** » (vu par qui ?) ; FR-32 et FR-33 « **exporter** ».
- **Écart :** la coque doit savoir qui est « administrateur » (quel droit ?), qui voit l'avertissement de
  préavis et le compte à rebours de l'essai, et où vit l'export (module par module ou global).
- **Correction :** une ligne par bandeau dans la FR de R-20 (public, droit exigé, texte) et une FR
  « Exporter mes données » avec son propriétaire.

---

## 5. Affirmations du PRD démenties par le code

### R-27 · high · FR-4, FR-11, FR-12 : les chemins d'installation réels contredisent le PRD

- **Citation (FR-4) :** « **quatre chemins** : console, abonnement payé, propagation d'un pack, licence
  importée ». FR-11 : « Il n'existe **aucune commande** qui installe ou met à jour directement dans l'espace
  réel ». FR-12 : « Installer un module que le contrat ne couvre pas est refusé : `MODULE_NON_SOUSCRIT` » ;
  « Un module ajouté au contrat devient **installable** sans autre action ».
- **Code (`platform-catalog-service/src/modules/entitlements/`) :** il existe **quatre chemins aujourd'hui,
  mais pas ceux-là**. (1) `PUT :orgId/:moduleCode` (opérateur). (2) `octroi-par-abonnement` (STORY-279 et
  727 lot 2 : « une échéance soldée **ouvre** tous les modules des packages »). (3)
  `propagation-des-packs` (727 lot 6). (4) **`octroi-par-vertical`** (727 lot 7 : `distributeur`,
  `imf-sfd` et `assurance-cima` reçoivent leur package **sans terme, sans contrat**, dès
  `identity.org.created`). La licence n'existe pas encore. Les modules de l'organisation Money Vibes
  elle-même sont ouverts par l'opérateur (STORY-650/728 : `notification` à l'amorçage).
- **Écart :** le PRD oublie l'octroi par vertical, qui installe **sans contrat** (contre FR-12) et
  **directement** (contre FR-11). Il décrit le contrat payé comme rendant un module « installable »,
  alors que le code l'**installe**. Appliquée telle quelle, FR-12 casserait aussi les octrois d'opérateur
  existants.
- **Correction :** lister les **cinq** chemins (les quatre existants et la licence). Pour chacun, dire s'il
  **installe** ou **rend installable**, s'il passe par l'espace d'essai, et s'il est soumis à
  `MODULE_NON_SOUSCRIT`. Prévoir des exceptions nommées : comptabilité incluse par vertical, octroi
  d'opérateur, organisation Money Vibes. Compter le test de mutation de FR-4 sur ces cinq chemins.

### R-28 · medium · FR-21 : la « fenêtre N/N-1 » du catalogue ne règle pas le retard d'une instance

- **Citation (FR-21) :** « Une instance ne peut pas rester **plus de deux versions majeures en retard** :
  c'est la fenêtre de support N/N-1 **déjà appliquée par le catalogue** (`fenetre-de-support.ts`). »
- **Code :** `fenetre-de-support.ts` limite à `MAX_ACTIVE_MAJORS` les majeures **`ACTIVE` d'un module au
  catalogue**, à la publication (refus `SUPPORT_WINDOW_ARBITRATION_REQUIRED`). Elle ne mesure aucune
  instance. Par ailleurs, `Entitlement.versionCode` **épingle une version par organisation**.
- **Écart :** (a) la règle existante porte sur la publication des versions d'un module, pas sur le retard
  d'une instance. (b) « deux versions en retard » correspond à N-2, donc **hors** d'une fenêtre N/N-1.
  (c) « une seule ligne de version » (§3) suppose une version de **plateforme**, alors que le catalogue
  versionne **chaque module** et épingle une version par organisation.
- **Correction :** écrire « au plus **une** majeure de retard (N-1) », dire que c'est une règle **nouvelle**
  qui reprend le principe de `fenetre-de-support.ts`, et définir la relation entre la version de plateforme
  et les `ModuleVersion` (une version de plateforme = un ensemble figé de `versionCode`).

### R-29 · low · en-tête, numérotation, §3 « Organisation »

- **Citation :** « *Brouillon. Sections rédigées : §0, §1, §2, §3. À venir : §4…* », alors que tout est
  rédigé. FR-33 est placée entre FR-13 et la partie 4.B, FR-32 après FR-25. §3 : « Instance sur site : …
  elle sert **cette seule organisation** ».
- **Écart :** l'en-tête est périmé et l'ordre des FR est confus. Une instance sur site héberge aussi
  l'organisation Money Vibes, qui porte les rôles plateforme de la console, comme
  `ORGANISATION_PLATEFORME` aujourd'hui.
- **Correction :** mettre l'en-tête à jour, renuméroter ou ajouter un renvoi, et écrire « sert une
  organisation cliente (plus l'organisation Money Vibes, pour la console) ».

**Vérifiées et exactes :** `entitlement:grant` et `entitlement:revoke` existent (`auth-service`
`permission.enum.ts`, garde du contrôleur d'entitlements) ; `DELETE` = `REVOKED` (statuts octroyables par
`PUT` sans `REVOKED`) ; `entitlement.changed` est publié ; STORY-727 porte bien les packages et les options
du contrat ; `docker-compose.yml` ne déclare **aucun** `profiles:` ; `reseau` est absent du seed ;
`TenantPermission` est un `enum` fermé (paiement et notification).

---

## Ce que la coque peut consommer tel quel / ce qui manque

### Consommable tel quel

| Élément | Source |
|---|---|
| La règle de menu de base : visible ⇔ entitlement effectif `ACTIVE` **et** droit de l'utilisateur ; écran « module non installé » sur URL saisie | contrat C8 |
| Les statuts d'entitlement `ACTIVE` / `SUSPENDED` / `REVOKED`, l'expiré dérivé de `terme`, le topic `entitlement.changed` v2, la route `GET entitlements/:orgId` | code du catalogue |
| Le comportement d'un droit échu : lecture seule, écriture refusée `ABONNEMENT_EXPIRE` | STORY-727 lot 4 (code) |
| La forme d'un emplacement vide `{ etat: "NON_INSTALLE", module }` et l'état `SUSPENDU` d'une dépendance | contrat C4, §3.6 |
| « Un module 🟠 ou 🔴 n'apparaît pas au menu » | PRD FR-5 |
| Le texte et le style du bandeau d'essai, le bandeau de gel réservé aux administrateurs | PRD FR-9, FR-15 |
| Les codes de refus à afficher : `MODULE_DEPENDANCE_MANQUANTE`, `MODULE_REQUIS_PAR`, `MANIFESTE_CYCLE`, `MODULE_NON_SOUSCRIT`, `MODULE_HORS_LICENCE`, `<MODULE>_NOT_ENTITLED` | PRD FR-3, FR-4, FR-12, FR-14 ; contrat C2 |

### Ce qui manque (l'architecte devrait l'inventer)

1. **L'état effectif unique d'un module pour une organisation**, son énumération fermée et son canal de
   lecture (R-20).
2. **L'état de l'instance** (espace essai ou réel, gel, fin de maintenance) et sa source (R-20, R-21).
3. **Les droits effectifs d'un membre** = droits attribués ∩ modules installés ; les droits déclarés par le
   manifeste qui deviennent attribuables sans déploiement (R-01).
4. **Le lieu des écrans côté client** du moteur (mises à jour, retour arrière, fichier, tunnel,
   consentements, export, essai prospect, import en libre-service) et leurs droits de tenant (R-22, R-16).
5. **La correspondance entre module commercial, code au catalogue, dossier d'écran et libellé de menu**,
   et le sens unique de « pack » (R-14, R-25).
6. **L'habillage et la configuration d'accueil** par organisation (marque, tableau de bord) : propriétaire
   et lecture (R-23).
7. **La projection de la licence en entitlements** sur site (R-24).
8. **La visibilité des bandeaux** (préavis, essai prospect et son compte à rebours, lecture seule) et la
   fonction d'export (R-26).
