---
title: "Revue adversariale n°2 — PRD Moteur d'installation (après réécriture)"
cible: prd.md (status draft, réécrit le 2026-11-10)
methode: bmad-review-adversarial-general (relecteur cynique), deuxième passage
date: 2026-11-10
references_lues: [prd.md, .memlog.md, revue-1/review-adversarial-general.md]
---

# Revue adversariale n°2 — PRD Moteur d'installation

## Verdict

La réécriture a fait le gros du travail : il existe maintenant un modèle d'états, une horloge scellée, une
licence anti-rejeu, deux variantes de mise à jour, des règles pour les connecteurs en essai et une
chronologie d'effacement. Mais les nouveautés **ne sont pas croisées entre elles**. Une restauration de
sauvegarde remet l'horloge scellée et le compteur de licence en arrière. Les chemins de droits de FR-4 posent
`ACTIVE` sur des modules que l'axe 2 publie `NON_INSTALLE`. Les gardes des modules lisent encore l'horloge du
système, pas l'horloge scellée. Les interrupteurs de changement n'ont aucun comportement défini sur site. La
licence courte de FR-41 contredit le principe « le silence ne punit pas » de FR-15. **Le PRD n'est pas prêt
pour la validation du 13/11 tant que les 3 constats critiques et les principaux constats élevés ne sont pas
traités.** Les décisions du `.memlog.md` ne sont pas contestées en elles-mêmes : seules leurs conséquences
non traitées sont relevées.

Revue 1 : **20 résolus · 20 partiels · 3 non résolus** (43).
Nouveaux constats : **3 critiques · 16 élevés · 14 moyens · 4 faibles** (37).
- critique : N-01, N-09, N-10
- élevé : N-02, N-03, N-05, N-06, N-07, N-11, N-14, N-15, N-18, N-19, N-20, N-21, N-22, N-28, N-31, N-32
- moyen : N-04, N-08, N-12, N-13, N-23, N-24, N-25, N-26, N-27, N-29, N-30, N-33, N-34, N-35
- faible : N-16, N-17, N-36, N-37

---

## 1. Suivi de la revue 1

| # | Statut | Commentaire |
|---|---|---|
| F-01 | partiel | §3.1 ajoute les trois axes et les combinaisons. Restent sans réponse : un prérequis qui disparaît après la mise en service (N-04), un module 🟢 en essai et 🔴 au rejeu, l'état « interrompue » de FR-40, et l'axe 3 qui hésite entre automate et drapeaux (N-02). |
| F-02 | partiel | C12 et `AVEC_PERTE` règlent le fond. Mais §1 promet encore « sans rien perdre » sans condition, et `AVEC_PERTE` n'est pas traité sur la plateforme ni dans le retour arrière automatique (N-20). |
| F-03 | résolu | FR-40 (plan enregistré, reprise, test de coupure). Le cas d'un retour arrière lui-même interrompu reste ouvert (N-24). |
| F-04 | partiel | Classement code/droits et SM-3 réécrits. Mais les chemins de droits ouvrent des modules que l'axe 2 ne connaît pas (N-01). La désinstallation dans le réel n'est ni une exception nommée ni un passage par l'essai. |
| F-05 | résolu | FR-39. Une contradiction de détail subsiste (N-36). |
| F-06 | résolu | Dossier d'installation, exception nommée dans NFR-3, calibration recalculée. |
| F-07 | résolu | Rafraîchissement par organisation, règles d'accès du réel. Effet de bord nouveau : N-26. |
| F-08 | résolu | La cascade de FR-9 existe. Ses trous sont relevés en N-28 à N-30. |
| F-09 | résolu | FR-17 a deux variantes. Leurs nouveaux défauts sont en N-18 à N-20. |
| F-10 | résolu | FR-12 : la vente résout les dépendances. |
| F-11 | partiel | Une mineure ne peut plus ajouter de dépendance. Mais ce qui arrive quand une majeure en ajoute une n'est pas dit, la propagation d'un pack n'est pas définie, et la dépendance retirée n'est pas traitée (N-27). |
| F-12 | partiel | Les raisons sont comptées par module. Mais le cas testé (pack + dépendance) n'est pas celui qui était demandé : annuler une dépendance partagée par deux demandeurs (FR-2, 3ᵉ puce) reste indéfini. |
| F-13 | résolu | FR-5 explicite (installation ≠ exploitation). |
| F-14 | résolu | Détection de cycle en CI. La cyclicité d'`enrichiPar` n'est toujours pas dite (mineur). |
| F-15 | partiel | Six chemins sont nommés, mais la liste « il n'en existe pas d'autre » oublie l'offre d'essai, la mise en service et la réinstallation, et n'exige pas une seule implémentation sur site (N-08). |
| F-16 | partiel | L'horloge scellée existe, mais une restauration la rembobine (N-09), les gardes ne la lisent pas (N-10) et une date erronée en avance est irréversible (N-11). |
| F-17 | résolu | Numéro croissant et NFR-8. Nouvelles failles : N-09 (restauration) et N-15 (clé compromise). |
| F-18 | partiel | Gel et version figée sont deux termes. Mais on ne dit toujours pas si une instance figée envoie son signal, ni si son silence alerte le DG à vie (`GEL` et `VERSION_FIGEE` peuvent se cumuler). |
| F-19 | résolu | Retard N-1 au plus, pas de promotion forcée, exemption de la version figée. |
| F-20 | partiel | Correctif hors vagues, appliqué par fichier en gel. Ni l'échéance « 72 h + report » ni le retour arrière manuel d'un correctif ne sont écrits. Nouveau problème : N-21. |
| F-21 | partiel | La chronologie existe. Restent : un rappel absent en cas de prolongation, une prolongation après fermeture, et l'export « accès fermé » sans état publié (N-02). |
| F-22 | partiel | Périmètre et certificat sont définis, mais le certificat est remis alors que des sauvegardes existent encore, et l'effacement des journaux nominatifs contredit NFR-4 (N-33). |
| F-23 | résolu | Catégories de la lecture seule (FR-32, `[ASSUMPTION]`). |
| F-24 | résolu | Licence dérivée du contrat. Le contrôle « licence en retard sur le contrat » manque, ce qui est mineur. |
| F-25 | partiel | Clause unique et garde technique ajoutées. Fragilité juridique et frontière exploitation/apprentissage non tenues (N-31). |
| F-26 | partiel | La liste minimale de champs est là. Manquent : le traitement des identifiants de dossier (sel, jointure), un seuil de k-anonymat, et le test qui échoue si un champ non déclaré sort. |
| F-27 | non résolu | FR-26 dit toujours « un test le vérifie sur chaque envoi », sans schéma fermé ni seuil d'effectif. |
| F-28 | non résolu | Où vit le registre, comment est prouvée la désignation écrite, signature du consentement : rien. Aggravé par FR-35, qui laisse l'administrateur du client attribuer `instance:consentement:donner` (N-07). |
| F-29 | non résolu | Ni purge des contributions non consommées, ni durée de conservation chez Money Vibes. |
| F-30 | résolu | FR-24 distingue mise à jour de code et nouveau modèle commun. |
| F-31 | résolu | SM-1 réécrit. |
| F-32 | partiel | Conditions partielles. La cible sur site est renvoyée à plus tard. « Plateforme complète » inclut des modules absents du catalogue (N-34). Les bornes du chronomètre ne sont pas fixées. |
| F-33 | partiel | Les sources sont nommées. Mais le « journal des promotions » ne voit par construction aucun changement passé hors promotion, et aucun test d'intrusion ne prouve que la sonde le verrait. |
| F-34 | résolu | Critère par vérification ; un envoi intercepté vaut réussite. |
| F-35 | partiel | FR-6 interdit le doublon, mais FR-5 garde « sans effet de bord » (N-37). |
| F-36 | partiel | §0, §2.2 et l'en-tête sont alignés. §8.2 dit encore « Aucun » point ouvert. Les descriptions de 4.A et 4.B contredisent FR-7 et FR-17 (N-37). |
| F-37 | partiel | Les comptes Money Vibes sont fermés par défaut. Le fournisseur d'identité sur site (à qui appartiennent ces comptes, qui les crée avant la fin de l'installation) n'est pas dit. |
| F-38 | résolu | NFR-7 à NFR-10 ajoutées. Leurs défauts sont en N-24 et N-32. |
| F-39 | résolu | Décision « tout en février » et ordre de sacrifice. Leurs défauts sont en N-35. |
| F-40 | résolu | Suspendre et désinstaller sont distingués. |
| F-41 | partiel | « Contact » est défini. FR-16 dit toujours « n'envoie aucune donnée », alors que FR-41 en fait le canal de la licence (N-17). |
| F-42 | résolu | Avec la vérification quotidienne qui compte comme contact, J+7 n'est plus fragile. |
| F-43 | partiel | L'ordre des refus est fixé. FR-7 garde « PDF reçu par le dirigeant », que le système ne peut pas vérifier. |

---

## 2. Nouveaux constats

### A. Modèle d'états (§3.1, FR-4, FR-34, FR-35)

#### N-01 · critique · §3.1 « L'état publié », §3.1 axe 2, FR-4 chemins 2 à 6 : un droit sans installation est soit invisible, soit une porte dérobée
> §3.1 : « L'axe 2 prime ; s'il vaut `INSTALLE`, l'axe 3 décide » / « Le droit `ACTIVE` n'est posé qu'à
> l'entrée en `INSTALLE` [...] Seuls les chemins de droits nommés de FR-4 (paiement, socle de vertical,
> opérateur) font exception. »

**Pourquoi ça casse.** Prenons l'échéance soldée (chemin 2), le socle de vertical (chemin 4), l'octroi par un
opérateur (chemin 5) ou une licence qui ajoute un module (chemin 6). Chacun pose `ACTIVE` **sans** passer par
l'axe 2, et le module reste donc `NON_INSTALLE`. Comme l'axe 2 prime, l'état publié vaut `NON_INSTALLE` :
module caché, garde à 403. Deux lectures sont alors possibles, toutes deux fausses :
- soit ces chemins **n'ouvrent rien**. Le socle de vertical, donné à toute organisation à sa création, n'est
  jamais visible, et le paiement de STORY-727 lot 2 (déjà codé) n'a plus d'effet ;
- soit les services lisent `entitlement.changed` (FR-34, dernière puce), voient `ACTIVE` et **ouvrent quand
  même**. Le module tourne alors sans prérequis vérifiés (FR-5), sans bilan, sans feu vert de la Reprise
  (`MISE_EN_SERVICE_SANS_FEU_VERT`, FR-8), et le menu (caché) contredit la garde (ouverte). C'est exactement
  ce que le test en matrice de FR-34 est censé interdire.

Sur site, une licence peut aussi rendre `ACTIVE` un module dont le **conteneur n'est même pas déployé**
(profil C10).

**Correction.** Écrire que les chemins 2 à 6 n'agissent **que sur l'axe 3** (le droit d'utiliser) et ne
touchent jamais l'axe 2. Un module payé ou licencié mais pas installé se publie dans un état propre à
définir (« acquis, à installer », visible seulement dans la console Money Vibes). Le socle de vertical, lui,
est **installé** à la création de l'organisation par le chemin 1 automatisé. Ajouter à la matrice de FR-34 la
combinaison « droit `ACTIVE` × axe 2 `NON_INSTALLE` ».

#### N-02 · élevé · §3.1 axe 3 et ordre de priorité, FR-33 : l'axe 3 est-il un automate ou un jeu de drapeaux ? et l'essai fermé n'a pas d'état
> « dans l'ordre `SUSPENDU` > `LECTURE_SEULE` > `PREAVIS` > `ESSAI_PROSPECT` > `ACTIF` » / table de l'axe 3 :
> « `ESSAI_PROSPECT` [...] fin de l'essai → fermé » / `SUSPENDU` : « levée de la sanction → état antérieur ».

**Pourquoi ça casse.**
- La table de l'axe 3 décrit un **automate** : un seul état à la fois, avec des transitions. Un ordre de
  priorité, lui, n'a de sens que si plusieurs états **coexistent**, c'est-à-dire si ce sont des drapeaux
  indépendants (sanction, échéance). Les deux modèles donnent des résultats différents. Exemple : suspendu
  pendant le préavis, puis levée après la date de fin. L'« état antérieur » `PREAVIS{finLe}` a déjà expiré,
  donc on rend un état périmé. Un modèle à drapeaux calculerait directement `LECTURE_SEULE`.
- « Fermé » (fin de l'essai prospect) n'est ni un état de l'axe 3 ni l'un des **huit** états publiés. Or
  FR-33 promet « 30 jours pour exporter ou signer » **après** la fermeture de l'accès. Ce qu'affiche
  `prospera-app` pendant cette fenêtre est indéfini. L'export exige un accès que l'état ne donne pas, et la
  règle « valeur inconnue ⇒ `NON_INSTALLE` » ferme tout.
- `ESSAI_PROSPECT` vaut « dans l'espace d'essai seulement ». Ce que publie l'espace réel pour un prospect
  n'est pas dit.

**Correction.** Déclarer l'axe 3 comme **calculé** à partir de faits indépendants (sanction active ou non ;
échéance et fin du préavis lues sur l'horloge de référence), sans « état antérieur » mémorisé. Ajouter un
9ᵉ état publié, `ESSAI_TERMINE{effacementLe}` (export seul, accès en lecture pour l'administrateur du
prospect), ou dire explicitement que l'export de la fenêtre passe par un autre canal (fichier envoyé).

#### N-03 · élevé · §3.1 « Le droit `ACTIVE` n'est posé qu'à l'entrée en `INSTALLE` », FR-6 : les vérifications d'un module tournent sans droit
> « Un module en attente ou bloqué n'ouvre rien (FR-5). » / FR-6 : « Chaque module installé exécute ses
> vérifications » (comptes créés, invitation envoyée, lien PI-SPI généré, synchronisation aller-retour).

**Pourquoi ça casse.** Pour sortir de `EN_INSTALLATION`, il faut que les vérifications passent. Pour qu'elles
passent, le module doit **fonctionner** : créer des comptes, générer un lien, synchroniser. Mais tant qu'il
est en `EN_INSTALLATION`, son droit est absent et sa garde C2 répond 403. Le module se bloque lui-même :
dépendance circulaire. Même problème au rejeu dans le réel, où les vérifications du bilan de mise en service
s'exécutent avant que le droit n'existe.

**Correction.** Définir une identité de service « moteur d'installation » que la garde C2 laisse passer pour
les seules routes de vérification déclarées au manifeste (C13), pendant `EN_INSTALLATION`. Ou poser le droit
`ACTIVE` dès le lancement, et faire porter la fermeture aux utilisateurs par l'état publié seul. Choisir,
puis l'écrire dans C2 et C13.

#### N-04 · moyen · §3.1 axe 2, FR-16 : un prérequis qui disparaît après la mise en service
> Axe 2 : `INSTALLE` → sortie : « désinstallation » (seule sortie).

**Pourquoi ça casse.** La banque révoque la clé PI-SPI. Le numéro WhatsApp est banni. L'API du core-banking
change. Le module reste `EN_SERVICE` 🟢 au menu alors qu'il ne marche plus. FR-16 parle d'une « santé par
module », mais elle n'apparaît ni dans l'état publié, ni dans le bilan, ni dans les bandeaux. C'était le
2ᵉ exemple de F-01.

**Correction.** Ajouter à FR-34 un attribut `sante: OK | DEGRADE{raison, action}` orthogonal à l'état publié
(bandeau administrateur, ligne du bilan repassée 🔴 dans la supervision), sans fermeture automatique du
module.

#### N-05 · élevé · §3.1 axe 1, FR-14, FR-21 : `VERSION_FIGEE` est un état de l'instance, mais la maintenance se date module par module
> FR-14 : « pour chaque module `usage: [...]` et `miseAJour: jusqu'au <date>` » ; §3.1 : « `VERSION_FIGEE`
> (fin de maintenance d'un client acheteur) » est un état de **l'instance** ; §3 : « Version de plateforme : un
> ensemble figé de versions de modules, publié d'un bloc ».

**Pourquoi ça casse.** La licence permet que la maintenance de Sinistres s'arrête en mars et celle de la GED
en septembre. Entre les deux, l'instance est-elle figée ? Comme une version de plateforme se publie d'un bloc
(FR-21), on ne peut pas mettre à jour la GED sans mettre à jour Sinistres : la maintenance encore payée de la
GED ne donne donc rien, ou celle de Sinistres est prolongée gratuitement. Il en va de même pour un module
ajouté avec sa propre date de maintenance.

**Correction.** Soit la maintenance porte sur **l'instance** (une seule date `miseAJour` dans la licence),
soit elle reste par module, et il faut alors dire que l'instance se fige à la **première** échéance tant
qu'elle n'est pas alignée. La vente doit aligner les échéances (règle de prorata dans `paiement-service`).

#### N-06 · élevé · §3.1 table (`SUSPENDU`), FR-32, FR-39 : un module suspendu est plus fermé qu'un module en lecture seule ou désinstallé
> `SUSPENDU` : « caché ; [...] 403, aucune donnée » ; FR-32 : « Jamais d'écran noir » ; FR-39 : les données
> d'un module **désinstallé** restent exportables.

**Pourquoi ça casse.** Un client mis en `SUSPENDU` (litige) ne peut ni consulter ni exporter ses propres
données, alors qu'un client en lecture seule ou qui a désinstallé le module le peut. Pour une IMF sur site,
cela bloque aussi la production des états BCEAO, que FR-32 garde pourtant ouverts en lecture seule : la
sanction commerciale crée un manquement réglementaire chez le client. C'est aussi en tension avec la
portabilité prévue par la loi 2019-014 et avec le principe « jamais d'écran noir » écrit pour une sanction
plus douce.

**Correction.** Dire ce qu'un module suspendu garde ouvert : au minimum, l'export par
l'administrateur et le DG, et les états réglementaires. Ou justifier par écrit, avec la validation
juridique, que la suspension ferme tout. Ajouter la ligne `SUSPENDU` à la liste par catégorie d'action de
FR-32.

#### N-07 · élevé · FR-35, FR-36, FR-27 : les droits `instance:*` peuvent s'annuler eux-mêmes, et le consentement échappe au DG
> FR-35 : « Droits effectifs d'un membre = droits attribués ∩ droits des modules ouverts (`EN_SERVICE`,
> `ESSAI_PROSPECT` ou `PREAVIS`). En `LECTURE_SEULE`, seuls restent effectifs les droits de consultation et
> d'export » ; « L'administrateur du client attribue ces droits lui-même ».

**Pourquoi ça casse.**
- Les droits du moteur (`instance:fichier:deposer`, `instance:mise-a-jour:*`) n'appartiennent à aucun module
  qui a un état publié. Si l'intersection s'applique à eux, la lecture seule ou une suspension retire au DSI
  le droit de **déposer la licence** qui lèverait l'état : l'instance s'enferme elle-même, et le cas
  d'usage central de FR-22 et FR-41 (licence apportée par e-mail) devient impossible. S'ils y échappent, le
  PRD ne le dit pas.
- `instance:consentement:donner` est attribuable par l'administrateur du client, alors que FR-27 réserve le
  consentement au DG ou à une personne qu'il désigne par écrit. Un administrateur informatique peut donc
  s'accorder à lui-même le pouvoir de faire sortir des données (F-28 aggravé).
- Sur la plateforme, `instance:mise-a-jour:planifier` et `instance:mise-a-jour:revenir` n'ont pas d'objet,
  puisque Money Vibes décide (FR-17, FR-18).

**Correction.** Déclarer les droits `instance:*` **hors intersection** et toujours effectifs, quel que soit
l'état des modules et de l'instance. Rendre `instance:consentement:donner` attribuable **par le DG seul**,
avec la référence de l'écrit de désignation conservée au registre. Masquer les droits sans objet selon le
mode d'hébergement.

#### N-08 · moyen · FR-4 : « il n'en existe pas d'autre » est faux
> « Les chemins sont **nommés** ; il n'en existe pas d'autre » (six chemins).

**Pourquoi ça casse.** Plusieurs ouvertures de module ne figurent pas dans la table : l'**offre d'essai**
(FR-33, qui pose `ACTIVE` avec `finLe`), la **mise en service** (rejeu dans le réel, FR-8), la
**réinstallation** (FR-39), la **levée d'une sanction**, et la **signature pendant la fenêtre d'effacement**
(FR-33, « rouvre l'essai »). Le test de mutation « des six chemins » laisse donc ces chemins sans garde. Sur
site, le point de décision tourne sur l'instance, et rien n'exige que ce soit **la même implémentation**
(F-15). Enfin, l'ordre « `MODULE_NON_SOUSCRIT`, `MODULE_HORS_LICENCE` » suppose de lire le contrat sur site,
où l'instance ne le connaît pas hors ligne.

**Correction.** Compléter la table, idéalement en séparant ce qui touche l'axe 2 de ce qui touche l'axe 3
(N-01). Exiger une bibliothèque de décision unique, embarquée sur site, avec la même suite de conformité.
Dire que sur site seul `MODULE_HORS_LICENCE` s'évalue, la licence étant dérivée du contrat.

### B. Horloges

#### N-09 · critique · FR-15, FR-14, FR-18, FR-27, NFR-4, NFR-7 : restaurer une sauvegarde rembobine tout ce que le PRD croit irréversible
> FR-15 : l'horloge scellée « ne recule jamais » ; FR-14 : « L'instance retient le plus haut [numéro]
> qu'elle a vu » ; FR-18 : un retour arrière `AVEC_PERTE` « restaure la sauvegarde d'avant promotion » ;
> NFR-7 : « un test de restauration automatique chaque mois », clé « détenue par le client ».

**Pourquoi ça casse.** L'horloge scellée, le plus haut numéro de licence vu, le registre des consentements
et le journal en ajout seul vivent **sur le disque de l'instance**. Le client détient la clé des sauvegardes
et contrôle l'hyperviseur. Il lui suffit de restaurer une sauvegarde ou un instantané de machine virtuelle
d'il y a six mois pour obtenir à la fois :
- une horloge rembobinée, donc un droit d'utiliser prolongé et des délais de grâce et de préavis remis à
  zéro ;
- un compteur de licence rembobiné : l'ancienne licence d'avant la suspension redevient acceptable, ce qui
  défait la parade de F-17 ;
- un registre où un **retrait de consentement** n'a jamais eu lieu : des données sortent alors sans
  consentement valide (SM-4) ;
- un journal en ajout seul **amputé** (NFR-4).

Il n'est même pas nécessaire que le client triche : le retour arrière `AVEC_PERTE` de FR-18, déclenché par
Money Vibes elle-même, produit exactement ces effets.

**Correction.** Sortir de toute restauration un **état de confiance** (horloge scellée, plus haut numéro de
licence, registre, journal), qui n'avance que. Il est conservé hors du périmètre restauré, et son
**dernier état est rapporté à Money Vibes** à chaque contact. Money Vibes refuse alors toute licence et
tout export pour une instance dont l'état de confiance a reculé, ce qui est détectable au contact suivant.
Tests : restaurer une sauvegarde ancienne, puis vérifier que (1) l'ancienne licence reste refusée, (2) le
retrait de consentement tient toujours, (3) l'échéance tombe à la même date.

#### N-10 · critique · FR-15, FR-34, §3.1 (`EXPIRED` calculé, STORY-609) : l'horloge scellée ne protège rien si les gardes lisent l'horloge du système
> FR-34 : « Les services continuent de lire `entitlement.changed` (C2) : l'état publié en est une vue » ;
> §3.1 : `LECTURE_SEULE` = « `ACTIVE` échu (`EXPIRED` calculé, STORY-609) » ; FR-15 : « Toutes les échéances
> [...] se lisent sur l'horloge scellée ».

**Pourquoi ça casse.** Les passages `PREAVIS` → `LECTURE_SEULE`, fin d'essai et fin du délai de grâce sont
déclenchés par le **temps**, pas par un événement. Personne n'émet `entitlement.changed` à la date d'échéance.
Chaque garde C2 calcule donc `EXPIRED` elle-même, avec l'horloge de **son** conteneur, c'est-à-dire la date
du système que le client peut reculer. Résultat :
- le menu (calculé par le moteur sur l'horloge scellée) affiche « lecture seule » ;
- la garde du module (sur la date système reculée) accepte les écritures.

FR-15 est contourné sans toucher au moteur, et le test « menu et garde ne se contredisent jamais » ne le voit
pas, parce qu'il ne fait pas varier l'horloge. Même problème sur le délai « en moins d'une minute » de FR-34 :
aucune transition temporelle n'émet d'événement.

**Correction.** Exiger que le moteur (l'agent d'instance sur site) **émette un événement** à chaque
transition temporelle, à l'heure de l'horloge scellée. Les gardes C2 ne calculent **jamais** une échéance à
partir de leur propre horloge : elles lisent l'état poussé, ou une heure de référence fournie par l'agent.
Amender C2. Ajouter à la matrice de FR-34 un cas « date système reculée de 40 jours ».

#### N-11 · élevé · FR-15 : une horloge qui ne recule jamais ne se corrige jamais
> « elle ne recule jamais » ; « elle ne croit la date du serveur que si elle avance ».

**Pourquoi ça casse.** Prenons une date système mise **en avance** par erreur : NTP mal configuré, pile du
BIOS morte qui démarre en 2036, faute de frappe du DSI. L'horloge scellée l'accepte, puisque la date avance,
et ne revient plus jamais en arrière. Le droit d'utiliser d'un abonné expire alors immédiatement, l'essai
est fermé, la fenêtre de retour arrière est perdue, et le délai de grâce est dépassé. Rien n'est prévu pour
corriger. Le défaut est d'autant plus grave que l'erreur est **honnête**.

**Correction.** Bornez l'avance qu'accepte l'horloge scellée sans preuve : par exemple, au-delà de 48 h
d'écart avec le temps machine mesuré, l'horloge n'avance pas et l'anomalie est tracée. Prévoir une
**correction signée** par Money Vibes (heure de référence signée dans chaque réponse de contact et dans les
fichiers de mise à jour), seule capable de corriger l'horloge scellée vers l'arrière. Test : avancer la date
système de 10 ans, puis vérifier qu'aucune échéance ne tombe et qu'une anomalie est tracée.

#### N-12 · moyen · FR-15, FR-19, FR-20, FR-33, FR-17 : chaque délai n'a pas d'horloge propriétaire
> FR-15 : « **Toutes les échéances** (droit d'utiliser, préavis, essai, délai de grâce, retour arrière,
> 72 h) se lisent sur l'horloge scellée de l'instance ».

**Pourquoi ça casse.** Plusieurs délais de cette liste ne peuvent pas être lus sur l'horloge scellée :
- **72 h** : le délai part du moment où le client est « prévenu » **par téléphone** (FR-19). L'instance ne
  voit pas cet événement et ne peut donc pas lancer le décompte.
- **Essai prospect** : il est hébergé sur la plateforme, qui n'a pas d'horloge scellée.
- **J+7** : l'alerte est envoyée par Money Vibes et compte donc sur l'horloge de Money Vibes ; le **gel**,
  lui, compte sur celle de l'instance. Les deux divergent dès qu'un contact par fichier n'est connu que de
  l'instance.
- **7 jours** : les vagues comptent sur l'horloge de Money Vibes, le retour arrière sur celle de
  l'instance, et C12 ne dit pas laquelle borne les 7 jours de rétrocompatibilité.

**Correction.** Une table « délai → horloge de référence → événement de départ → qui l'observe → ce qui se
passe s'il est observé en retard ». Retirer « toutes » de FR-15.

#### N-13 · moyen · §3 « Gel », §3.1, FR-15, FR-19 : trois définitions du gel
> §3 : gel « sans contact », « se lève au premier contact » ; §3.1 : « plus de 30 jours sans **signal** » ;
> FR-15 : se lève « dès que le **signal** revient, ou dès qu'une mise à jour depuis un fichier apporte une
> **licence fraîche** ».

**Pourquoi ça casse.** Selon la définition retenue, la même instance est gelée ou non. Une vérification
quotidienne réussie lève-t-elle le gel ? Oui selon §3, non selon FR-15. Le paquet du correctif de sécurité
qu'une instance gelée reçoit **par fichier** (FR-19) est un « contact » au sens du §3 : il lève donc le gel,
alors que FR-15 exige une licence fraîche. Et si tout fichier compte comme contact, redéposer un ancien
paquet déjà appliqué remet le compteur de silence à zéro indéfiniment.

**Correction.** Une seule définition : un contact est un échange **authentifié et daté par Money Vibes**
(signal, vérification quotidienne, ou fichier portant une heure de référence signée plus récente que la
dernière vue, cf. N-11). Aligner §3, §3.1 et FR-15 sur cette définition. Un fichier déjà vu ne compte pas.

### C. Licence et suspension à distance

#### N-14 · élevé · FR-41, FR-15, FR-32, §3 « Suspendre », FR-13 : la licence courte fait punir le silence et confond l'impayé avec la fin de contrat
> FR-41 : « un abonné ne détient jamais qu'une licence courte, valable jusqu'à sa prochaine échéance payée.
> Ne pas payer, c'est ne pas recevoir la suivante » ; FR-15 : « le silence ne punit pas » ; FR-41 : « Un
> impayé suit le chemin de FR-32 (préavis, puis lecture seule) » ; §3 : « Suspendre : [...] impayé
> persistant, STORY-280 ».

**Pourquoi ça casse.**
1. Prenons un abonné qui **paie**, mais dont la liaison est coupée deux mois (le cas même que FR-15 veut
   protéger). Il ne reçoit pas sa licence suivante : il passe en préavis, puis en lecture seule. Le silence
   **punit**, et le titre de FR-15 est faux pour tous les abonnés sur site. Seul un e-mail manuel le sauve,
   et le PRD ne prévoit ni de l'envoyer automatiquement ni d'alerter Money Vibes.
2. FR-32 décrit l'échéance **du contrat** (rappel à J-7, préavis de 30 jours). FR-41 l'applique à chaque
   **échéance de paiement**, par exemple mensuelle. Un retard d'un mois déclenche alors le même parcours
   qu'une fin de contrat. Le « rappel » de J-7 tombe-t-il chaque mois ?
3. Sur site, un impayé mène au préavis puis à la lecture seule. Sur la plateforme, d'après le PO
   (STORY-280), il mène à `SUSPENDU`. FR-13 promet pourtant des refus « identiques ». L'ordre entre les deux
   voies (lecture seule d'abord, suspension ensuite ?) n'est écrit nulle part.

**Correction.** Distinguer l'**échéance de licence** (technique : courte, renouvelée automatiquement à chaque
contact tant que le compte est à jour) de l'**échéance du droit d'utiliser** (contractuelle). Seule la
seconde déclenche FR-32. Une licence courte non renouvelée faute de contact alerte Money Vibes à J-7 de son
expiration, pour que l'envoi par e-mail soit fait. Écrire un seul parcours de l'impayé, identique sur site et
sur la plateforme : rappel → préavis → lecture seule → suspension éventuelle par décision nommée.

#### N-15 · élevé · FR-14, NFR-8 : une clé compromise peut verrouiller l'instance contre toutes les licences futures
> FR-14 : « refuse toute licence plus ancienne, même authentique » ; NFR-8 : clé compromise révoquée par un
> fichier d'urgence « qui ré-émet les licences et passe par le chemin rapide (FR-19) ».

**Pourquoi ça casse.** L'attaquant qui détient une clé de signature compromise émet une licence portant le
numéro 2⁶³, qu'il fait déposer par un complice ou par hameçonnage du DSI. Elle est valide jusqu'à la
révocation. L'instance retient alors ce numéro et **refuse toutes les licences légitimes futures**, puisque
leur numéro est plus petit. Le fichier d'urgence « ré-émet les licences » sans dire qu'il **réinitialise le
compteur**. En outre, FR-19 suppose un DSI joignable sous 72 h ; une instance coupée qui ne reçoit jamais la
liste de révocation (elle voyage dans le signal) continue d'accepter la clé compromise.

**Correction.** Ranger le compteur **par clé de signature**, ou n'accepter un saut de numéro que dans une
borne. Écrire que le fichier d'urgence signé par la racine **réinitialise** le plus haut numéro et révoque
tout ce que la clé compromise a signé. Donner une durée de validité courte aux clés de signature pour les
licences courtes, afin qu'une instance coupée cesse d'elle-même de faire confiance à une clé ancienne. Les
licences perpétuelles restent vérifiables par la chaîne racine.

#### N-16 · faible · FR-41 (dernière puce), §3.1 : suspendre un acheteur entièrement payé
> « Un acheteur entièrement payé ne peut être suspendu (litige) que par une licence qu'il reçoit » ; §3.1 :
> un acheteur ne passe jamais par `SUSPENDU` « pour fin de contrat ».

**Pourquoi ça casse.** Le PRD autorise une sanction logicielle sur un droit d'utiliser **perpétuel et payé**.
C'est juridiquement fragile, puisqu'il s'agit d'une vente, et contradictoire avec « jamais de suspension »
écrit pour la version figée (FR-32). Le litige qui justifie la suspension n'est pas défini.

**Correction.** Soit interdire la suspension d'un acheteur payé (le litige se règle par contrat), soit
renvoyer le cas au juriste en point ouvert. Dans les deux cas, l'écrire dans §8.2.

#### N-17 · faible · FR-41, FR-16 : la vérification quotidienne « n'envoie aucune donnée » mais livre une licence
> FR-16 : « cette requête n'envoie aucune donnée » ; FR-41 : la suspension « part dans la réponse au
> prochain contact, donc en 24 heures au plus (vérification quotidienne) ».

**Pourquoi ça casse.** Pour recevoir **sa** licence, l'instance doit s'authentifier et se nommer. De plus,
« la réponse au prochain contact » n'existe pas quand le contact est un fichier déposé.

**Correction.** Écrire ce que la requête quotidienne transmet (identifiant d'instance, version, plus haut
numéro de licence, état de confiance de N-09) et retirer « aucune donnée ».

### D. Mises à jour, retour arrière, interrupteurs

#### N-18 · élevé · FR-17 (plateforme), FR-21, FR-17 (sur site) : les interrupteurs de changement n'ont aucun comportement sur site
> « Tout changement de comportement visible des utilisateurs est livré derrière un interrupteur de
> changement » ; « Un interrupteur ne survit jamais à sa date limite » ; sur site : « sans son accord, rien ne
> change dans l'espace réel ».

**Pourquoi ça casse.** Il n'y a qu'une seule ligne de version (FR-21) : le code qui arrive sur site contient
donc les mêmes interrupteurs. Le PRD ne dit pas qui les allume sur site, ni quand. Toutes les réponses
cassent quelque chose :
- **éteints pour toujours** : ils survivent à leur date limite, ce que la règle interdit, et chaque instance
  sur site dérive vers sa propre « version cachée » ;
- **allumés seuls à la date limite** : le comportement change dans le réel sans l'accord du DSI, contre la
  promesse de FR-17 ;
- **allumés à la promotion** : il faut alors le dire, et dire que la recette de l'essai porte sur la
  position allumée.

**Correction.** Écrire que, sur site, les interrupteurs sont **forcés à leur position finale à la promotion**,
puisque l'essai du DSI tient lieu de période d'adaptation. Ou bien que leur date limite est la date de
promotion choisie par le DSI. Ajouter un test de conformité.

#### N-19 · élevé · FR-17 (plateforme), FR-18, C12 : interrupteurs, retour arrière à 7 jours et versions successives
> Date limite d'un interrupteur : 30 jours ; C12 : rétrocompatibilité pendant 7 jours ; fenêtre de Money
> Vibes : préavis de 7 jours.

**Pourquoi ça casse.**
- Si les fenêtres de mise à jour reviennent plus souvent que tous les 30 jours, les interrupteurs de
  plusieurs versions **s'empilent**. La version N+2 doit fonctionner avec toutes les positions des
  interrupteurs de N+1 et de N+2, organisation par organisation, soit 2ⁿ combinaisons non testées. La
  promesse « interdit de rester sur une version cachée » est violée pendant 30 jours, contre 7 pour C12.
- Un interrupteur dont le comportement **écrit des données dans une nouvelle forme** (un nouveau statut, par
  exemple) est allumé au 10ᵉ jour, hors de la fenêtre C12. Un retour arrière global ultérieur ne relit pas ces
  données.
- Personne ne dit qui décide qu'un changement est « visible des utilisateurs » et doit donc être derrière un
  interrupteur. Ce n'est pas testable.

**Correction.** Plafonner le nombre d'interrupteurs ouverts (par exemple : ceux d'une seule version à la fois,
et une date limite antérieure à la fenêtre suivante). Interdire qu'un interrupteur change la **forme** des
données : seul le comportement peut changer, ce qui se vérifie par revue et par test C12 interrupteur
allumé. Désigner celui qui classe un changement (manifeste : `interrupteurs: [...]`, revue obligatoire).

#### N-20 · élevé · FR-18, FR-40, FR-17 : `AVEC_PERTE` sur la plateforme et dans le retour arrière automatique
> FR-18 : « Le DSI voit un bandeau rouge qui le dit avant de choisir sa date ; elle ne part jamais dans une
> vague automatique » ; FR-40 : « Une promotion interrompue déclenche le retour arrière automatique » ; FR-17 :
> « en cas d'échec : retour arrière automatique ».

**Pourquoi ça casse.**
- Sur la plateforme, personne ne choisit de date : la promotion est fixée par Money Vibes pour **toutes** les
  organisations. Une version `AVEC_PERTE` y est soit interdite, soit promue sans le bandeau. Et son retour
  arrière, qui est **global**, efface les saisies de **tous** les distributeurs depuis la promotion.
- Le retour arrière **automatique** (contrôle de santé en échec, promotion interrompue) d'une version
  `AVEC_PERTE` restaure la sauvegarde **sans que personne l'ait décidé**. C'est exactement la perte que le
  bandeau rouge devait faire accepter consciemment.
- Une version de plateforme est `AVEC_PERTE` dès qu'**un** de ses modules l'est, mais le PRD ne le dit pas
  (`retourArriere` est déclaré par module, FR-38).

**Correction.** Interdire les versions `AVEC_PERTE` sur la plateforme, ou exiger pour elles une fenêtre
dédiée avec l'accord écrit de Money Vibes et un préavis aux organisations. Écrire que l'automatisme d'une
version `AVEC_PERTE` **s'arrête et alerte**, sans restaurer seul. Écrire qu'une version de plateforme
hérite du pire `retourArriere` de ses modules.

#### N-21 · élevé · FR-18, C12, FR-19 : deux promotions dans la même fenêtre de 7 jours
> C12 : « pendant 7 jours, chaque migration est rétrocompatible (on étend d'abord, on ne retire qu'à une
> version suivante) » ; FR-19 : correctif de sécurité en 72 h.

**Pourquoi ça casse.**
- N+1 est promue le jour 0 et N+2 le jour 3. La « contraction » permise par N+2 (« on ne retire qu'à une
  version suivante ») supprime ce que N+1 avait ajouté, alors que la fenêtre de retour arrière de N+1 court
  encore. Revenir de N+2 à N+1, puis de N+1 à N, perd des données.
- Un correctif de sécurité promu le jour 2 sur N+1. Si le DSI revient ensuite à N, que fait le correctif ?
  Soit le retour arrière **retire le correctif** et rouvre la faille, soit il est refusé, et le PRD ne dit ni
  l'un ni l'autre. FR-19 dit seulement que le retour arrière **du correctif** est sans perte.

**Correction.** Écrire que la contraction d'une donnée n'est permise que lorsque la fenêtre de retour arrière
de la version qui l'a ajoutée est **close sur toutes les instances**, que le retour arrière ne recule que
d'**un** pas, et qu'une nouvelle promotion clôt la fenêtre précédente. Pour les correctifs : ils sont
reportés sur la version N (N-1 de la ligne), ou le retour arrière sous la version corrigée est refusé avec un
code nommé.

#### N-22 · élevé · FR-19, FR-32, FR-21, C6 : un correctif pour une version figée, c'est une branche de maintenance par client
> FR-19 : « Une instance en version figée reçoit les correctifs de sécurité critiques » ; FR-21 : « Aucune
> branche de code propre à un client » ; une instance maintenue n'a « jamais plus d'une version majeure de
> retard ».

**Pourquoi ça casse.** Une instance maintenue est en N ou N-1 : deux lignes à corriger. Une instance figée
peut, elle, être en N-5, et deux instances figées sur des versions différentes demandent **deux portages
différents**. Avec dix clients, dont quelques acheteurs dont la maintenance se termine à des dates diverses,
Money Vibes maintient **à vie** autant de branches que de versions figées distinctes. C'est la négation de la
ligne unique (C6) et un coût que l'ordre de sacrifice ignore. Le mot « critique » n'est pas défini non plus,
alors qu'il décide de ce que reçoit une instance figée.

**Correction.** Borner l'engagement : les correctifs critiques ne sont produits que pour les versions encore
dans une fenêtre de support définie (par exemple 24 mois après leur sortie), et au-delà l'instance figée est
déclarée « hors correctifs », ce que le DG est prévenu. Ou bien exiger du client qui veut des correctifs
qu'il soit en N-1 (rattrapage gratuit des versions de sécurité). Définir « critique » (score CVSS ≥ 9,
exploitation connue). Ajouter le coût à §8.

#### N-23 · moyen · FR-18, C12 : la rétrocompatibilité ne couvre que les champs
> « chaque consommateur d'événements ignore les champs qu'il ne connaît pas » ; test : « promouvoir, saisir,
> revenir, tout se relit ».

**Pourquoi ça casse.** Ignorer un champ inconnu ne suffit pas pour une **nouvelle valeur d'énumération**
(statut `EN_EXPERTISE` écrit par N+1, que N ne sait pas afficher ni faire avancer), un **nouveau type
d'événement**, ou un topic `@2`. Et le test s'arrête au retour : rien ne vérifie que les données **modifiées
par N après le retour** se relisent quand N+1 est promue à nouveau.

**Correction.** Étendre C12 : une nouvelle valeur d'énumération est traitée par N comme « autre » (lecture
seule de l'enregistrement) ; les nouveaux types d'événements sont ignorés et journalisés. Allonger le test :
promouvoir, saisir, revenir, modifier, **re-promouvoir**, tout se relit.

#### N-24 · moyen · FR-18, NFR-7, NFR-9, FR-40 : combien de temps dure un « clic » ?
> FR-18 : retour arrière « en un clic » ; NFR-9 : promotion ≤ 15 minutes ; NFR-7 : remise en route 4 heures.

**Pourquoi ça casse.** Un retour arrière `AVEC_PERTE` est une restauration : jusqu'à 4 heures d'arrêt,
ce que NFR-9 ne borne pas puisqu'elle ne parle que de la promotion. Un retour arrière lui-même **interrompu**
(nouvelle coupure de courant) n'a pas d'état défini dans FR-40. Le DSI qui clique ne sait pas combien de temps
son assurance s'arrête.

**Correction.** Ajouter à NFR-9 une durée maximale pour le retour arrière sans perte (≤ 15 min) et pour celui
avec perte (≤ RTO), affichée avant le clic. Le retour arrière est lui aussi un plan enregistré qui reprend
après une coupure (FR-40).

#### N-25 · moyen · FR-20, FR-17 (sur site) : un client pilote ou un client mécontent bloque tous les autres
> « Une version ne passe à la vague suivante qu'après 7 jours sans incident » ; incident = « un retour
> arrière demandé par un client » ; sur site : « Le DSI choisit la date ».

**Pourquoi ça casse.** Le DSI du client pilote choisit sa date. S'il attend six semaines, la vague suivante
attend six semaines. N'importe quel client qui revient en arrière pour une raison sans lien avec la version
(formation, confort) déclenche un « incident » et bloque tout le monde. La place de la plateforme Money
Vibes dans les vagues (pilote ? dernière ?) n'est pas dite.

**Correction.** Limiter l'attente du pilote (au-delà de N jours, Money Vibes désigne un autre pilote).
Qualifier l'incident : un retour arrière avec une raison imputée à la version, validée par Money Vibes.
Placer la plateforme dans l'ordre des vagues.

#### N-26 · moyen · FR-10, FR-17 : le rafraîchissement obligatoire avant une majeure peut bloquer la plateforme
> FR-10 : « obligatoirement avant une mise à jour majeure » ; « refusé pendant une répétition générale en
> cours » ; « par organisation ».

**Pourquoi ça casse.** Sur la plateforme, une majeure est promue pour **toutes** les organisations dans la
fenêtre de Money Vibes. Elle exige donc le rafraîchissement de **chaque** organisation, mais le
rafraîchissement est refusé pour celles qui ont une répétition en cours, et il ne touche jamais les essais
prospects. Une seule répétition en cours suffit à bloquer la majeure de toute la plateforme, ou alors la
majeure part sans rafraîchissement, contre FR-10. Les essais prospects sont-ils migrés en N+1 ?

**Correction.** Sur la plateforme, rendre le rafraîchissement obligatoire **avant que l'organisation
n'essaie** la majeure, et non avant la promotion globale. Écrire que les répétitions en cours et les essais
prospects sont **migrés** comme le réel. Écrire qu'une répétition en cours est reportée ou rejouée après la
majeure.

#### N-27 · moyen · FR-38, FR-21, FR-4 chemin 3 : une majeure qui ajoute une dépendance non souscrite
> FR-38 : « une nouvelle dépendance n'arrive qu'avec une majeure, et l'écart avec le contrat de chaque client
> est calculé avant la mise à jour ».

**Pourquoi ça casse.** Calculer l'écart ne dit pas ce qu'on en fait. Si la majeure est refusée au client à
qui manque la dépendance, il reste en N, glisse hors de la fenêtre N-1 et perd son support **sans faute de sa
part** (FR-21). Si elle est installée d'office, on contredit FR-12 (« le contrat fait foi »). La
« propagation d'un pack modifié » (chemin 3) n'est toujours pas définie : un client existant reçoit-il le
module ajouté au pack, alors que son contrat ne le couvre pas ?

**Correction.** Dire qu'une majeure qui ajoute une dépendance dure fournit la dépendance **sans
facturation** à ceux qui ont le module dépendant (amendement automatique du contrat), ou qu'elle ne peut pas
être publiée. Définir la propagation d'un pack : seuls les **nouveaux** contrats reçoivent le pack modifié ;
les contrats existants ne changent qu'avec un avenant.

### E. Connecteurs en essai (FR-9)

#### N-28 · élevé · FR-9 : la cascade est en « autorisation par défaut », et la lecture réelle exige les identifiants réels
> « un bac à sable [...] est déclaré et vérifié » ; « le serveur refuse une destination déclarée pour l'espace
> réel » ; « L'espace d'essai n'a jamais les identifiants du réel » ; « La lecture depuis le vrai logiciel du
> client reste permise ».

**Pourquoi ça casse.**
- « Vérifié » n'a pas de critère. Une base Odoo de production nommée `test`, ou un core-banking sans bac à
  sable, passe la vérification si l'on se contente d'un appel qui répond.
- Le refus ne porte que sur les destinations **déclarées** pour le réel. Une adresse de production qui n'est
  pas déclarée (même hôte, autre base ; adresse IP au lieu du nom ; reprise d'un ancien connecteur) n'est pas
  refusée : la garde fonctionne par liste noire.
- Lire le vrai logiciel exige des identifiants **pour le vrai logiciel**. Soit ce sont ceux du réel, ce que
  la règle interdit, soit ce sont des identifiants en lecture seule distincts, mais le PRD ne demande pas au
  client de les fournir et ne vérifie pas qu'ils sont réellement en lecture seule. Des identifiants qui
  peuvent écrire, présents dans l'essai, rouvrent F-08.

**Correction.** Garde en **liste blanche** : depuis l'essai, une écriture ne part que vers une destination
déclarée comme bac à sable **et** distincte (hôte, base, locataire) de toute destination du réel ; tout le
reste est intercepté. Le critère de « vérifié » est une confirmation écrite du client plus une signature
technique distincte (base ou locataire différent). La lecture réelle n'est permise qu'avec des identifiants
**en lecture seule**, fournis par le client, dont le droit d'écriture est **testé et refusé** à la
vérification.

#### N-29 · moyen · FR-9, FR-6, UJ-3 : l'interception casse une synchronisation dans les deux sens
> FR-9 : « pas de bac à sable : les écritures sont interceptées » ; FR-6 : « synchronisation Odoo
> aller-retour » ; « un envoi intercepté vaut réussite ».

**Pourquoi ça casse.** Dans une synchronisation bidirectionnelle, le système de référence **renvoie** un
identifiant ou un accusé pour chaque écriture (numéro de remboursement dans le core-banking). Une écriture
interceptée ne reçoit rien en retour : l'essai accumule des enregistrements sans correspondance externe. La
lecture du vrai logiciel, qui est permise, fait ensuite remonter les vraies opérations, en conflit avec les
opérations fictives. La vérification « aller-retour » n'est jamais réellement faite et vaut pourtant 🟢 :
pour l'IMF (UJ-3), sans bac à sable, la répétition générale ne teste pas le point le plus risqué.

**Correction.** Pour un connecteur intercepté, le bilan d'essai porte une ligne 🟠 « aller-retour non
vérifié (pas de bac à sable) », jamais 🟢. La mise en service du connecteur exige alors une vérification
aller-retour **dans le réel**, sur une opération de test convenue avec le client. Le PRD Connecteurs dit comment
il simule l'accusé en interception.

#### N-30 · moyen · FR-9 (étape 1), FR-10 : le rafraîchissement envoie des données réelles dans le bac à sable du client
> FR-10 : l'essai se rafraîchit depuis le réel ; FR-9 : le connecteur de l'essai écrit dans le bac à sable du
> client.

**Pourquoi ça casse.** Après un rafraîchissement, l'essai contient les données personnelles réelles, qui
partent ensuite vers le **bac à sable** du logiciel du client. Ce bac à sable a souvent des contrôles plus
faibles et des accès tiers (éditeur, prestataire). FR-10 garde les règles d'accès **dans Prospera**, mais
pas au-delà. Le bac à sable diverge aussi de l'essai à chaque rafraîchissement, ce qui produit des conflits
de synchronisation.

**Correction.** Exiger l'accord du client sur le fait que son bac à sable reçoit des données réelles, ou
masquer les champs personnels dans les écritures vers le bac à sable. Dire ce qui se passe côté bac à sable
lors d'un rafraîchissement (réinitialisation ou réalignement par le PRD Connecteurs).

### F. Données, apprentissage, sauvegardes, effacement

#### N-31 · élevé · §4.C (clause unique), FR-27, SM-4 : une clause d'adhésion n'est pas un consentement, et la frontière exploitation/apprentissage n'a pas de garde
> §4.C : l'apprentissage est « couvert par une clause unique du contrat d'abonnement, signée une fois [...]
> Money Vibes reste couverte par la loi togolaise 2019-014 » ; « lire pour le support et l'exploitation est
> permis et journalisé ».

**Pourquoi ça casse.**
- Une clause intégrée au contrat d'abonnement, condition de la vente, n'est ni **libre** ni **spécifique**
  au sens habituel du consentement. FR-27 exige pourtant un consentement « par finalité et par niveau » :
  la clause unique couvre-t-elle toutes les finalités ?
- Les personnes concernées sont les **clients du distributeur** (points de vente, commerciaux). Le
  distributeur ne consent pas à leur place.
- L'affirmation « Money Vibes reste couverte par la loi » est une conclusion juridique **non validée**, que
  le PRD présente comme acquise, alors que la validation juridique est un prérequis (§4.C, « Hors
  périmètre »).
- Le retrait de la clause est permis (« se retire comme les autres »), mais ses effets sur l'abonnement ne
  sont pas dits.
- Sur la plateforme, les données sont dans des bases partagées. La garde du registre ne protège que les
  entraînements **qui passent par elle**. Une analyse lancée « pour l'exploitation » (requête, extraction
  pour le support) lit les mêmes données sans garde, et SM-4 ne compte que les lectures **déclarées**
  d'apprentissage : le zéro est garanti par construction.

**Correction.** Faire de la validation juridique de la clause unique un **point ouvert daté** (§8.2), avec un
propriétaire. Écrire que la clause énumère des finalités, et que le registre en garde une ligne par finalité.
Retirer la phrase « reste couverte par la loi ». Côté technique : les données de la plateforme ne sont
accessibles aux travaux d'IA que par un compte de service dédié, dont toute lecture passe par la garde, et
l'accès « exploitation » n'a pas de droit d'export en masse. SM-4 mesure les accès de ce compte et les
extractions hors garde.

#### N-32 · élevé · NFR-7, FR-17, FR-18, FR-25 : une clé de sauvegarde « détenue par le client » est incompatible avec les automatismes
> NFR-7 : « chiffrées avec une clé détenue par le client sur site ; perte maximale tolérée 1 heure [...] un
> test de restauration automatique chaque mois » ; « Sur la plateforme, une sauvegarde par jour au moins ».

**Pourquoi ça casse.**
- Le retour arrière automatique (FR-17), la restauration `AVEC_PERTE` (FR-18), le test mensuel automatique et
  le bilan d'instance (« sauvegarde testée par une restauration ») exigent tous de **déchiffrer** la
  sauvegarde sans personne. Soit la clé est sur l'instance, et « détenue par le client » ne veut rien dire,
  soit ces automatismes sont impossibles. Si le client perd sa clé, aucune restauration n'est possible, et
  le RTO de 4 heures n'est jamais tenu.
- La perte maximale d'une heure (RPO) est contredite par « une sauvegarde par jour » sur la plateforme, soit
  un RPO de 24 h pour les distributeurs.
- La règle 3-2-1 exige « une copie hors de la machine ». Pour un assureur dont les données « ne quittent pas
  ses locaux », où va cette copie (autre bâtiment ? cloud ?) ? Ce n'est pas dit.

**Correction.** Distinguer une **clé d'exploitation** scellée sur l'instance, qui sert aux automatismes, d'une
**clé de secours** détenue par le client, qui sert à la restauration hors instance. Exiger un séquestre ou
une procédure en cas de perte. Aligner la plateforme sur un RPO explicite (sauvegarde continue ou RPO 1 h
écrit séparément). Écrire où se trouve la copie hors machine (dans les locaux du client, sur un autre
support).

#### N-33 · moyen · FR-33 (chronologie, effacement), NFR-4, NFR-7 : le certificat d'effacement est remis alors que les données existent encore
> « effacement → certificat d'effacement remis au prospect » ; « Ce qui est effacé : [...] journaux
> nominatifs. Les sauvegardes expirent avec leur durée de conservation (NFR-7) » ; NFR-4 : journal en
> « ajout seul ».

**Pourquoi ça casse.**
- Sur la plateforme, les paliers de NFR-7 conservent 3 sauvegardes mensuelles : les données du prospect y
  restent jusqu'à environ 90 jours **après** le certificat. Le certificat affirme donc un effacement qui n'est
  pas complet.
- Effacer les « journaux nominatifs » contredit NFR-4 (ajout seul), et l'effacement lui-même doit être
  journalisé : dans quel journal, sans nom ?
- Le rappel est fixé à J+23, sans équivalent en cas de prolongation (J+53 ?).
- La prolongation peut-elle être accordée **après** la fermeture ?
- Le destinataire des rappels n'est pas défini.

**Correction.** Le certificat indique la date à laquelle la **dernière sauvegarde** contenant les données
expire (ou ces sauvegardes sont exclues par chiffrement par organisation avec destruction de clé). Les
journaux gardent une trace **pseudonymisée** de l'effacement : on remplace le nom, on ne supprime pas
l'entrée. Compléter la chronologie : rappel à J-7 de chaque fin (essai, prolongation, effacement),
destinataire nommé, prolongation possible seulement avant la fermeture.

### G. Cadrage, priorités et résidus

#### N-34 · moyen · FR-37, QA-1, FR-7, SM-2, NFR-5 : des modules commerciaux vendables qui n'existent pas encore au catalogue
> FR-37 : « Un module commercial dont un code n'existe pas encore au catalogue est visible dans l'offre, non
> installable » ; QA-1 : les 18 modules commerciaux « doivent tous entrer » au catalogue.

**Pourquoi ça casse.** Un contrat peut inclure un module non installable (FR-12 ne l'interdit pas). Le
client est alors **En service partiel pour toujours**, ce qui suffit à remplir SM-2 (« au moins partiel »), et
**En service** n'est jamais atteignable. NFR-5 chronomètre « la plateforme complète du distributeur », qui
inclut ces modules. Enfin, faire entrer les 18 modules et leurs manifestes (C13 compris) au catalogue avant
février est un chantier **caché**, absent des FR, des jalons et de l'ordre de sacrifice.

**Correction.** Interdire la vente d'un module commercial non installable, ou l'exclure de l'état du client
avec une mention « livraison prévue le … ». Mesurer NFR-5 sur la liste des codes **installables**. Ajouter en
§8.4 la tâche « 18 manifestes C13 » avec un propriétaire et une date.

#### N-35 · moyen · §8.4 (ordre de sacrifice), §8.2, §0 : la moitié du PRD n'a pas de priorité, et ce qu'on sacrifie est une garantie juridique
> « Jamais sacrifiés : FR-1 → FR-9, FR-14, FR-15, FR-18, FR-34 → FR-36, FR-41, NFR-1, NFR-7, NFR-8 » ;
> 4ᵉ sacrifice : « Poste d'accès enregistré (FR-29) : remplacé par le tunnel journalisé de FR-23 » ;
> §8.2 : « Aucun ».

**Pourquoi ça casse.**
- Environ 25 exigences (FR-10 → 13, 16, 17, 19 → 25, 32, 33, 37 → 40, NFR-2 → 6, 9, 10) ne sont ni
  sacrifiables ni protégées : en cas de glissement, les épics n'ont pas d'arbitrage.
- Sacrifier le poste d'accès enregistré, c'est retirer **l'enregistrement de session et la coupure du
  transfert de fichiers**, c'est-à-dire les garde-fous de la loi 2019-014, tout en gardant le niveau 2. Il
  faudrait plutôt **ne pas ouvrir le niveau 2** tant que le poste n'existe pas.
- FR-15 (horloge scellée) et NFR-7 sont « jamais sacrifiés » alors que leur mécanisme est « laissé à
  l'architecture » (puce de sécurité ?) et n'a pas été chiffré.
- §8.2 annonce « Aucun » point ouvert, alors que le PRD laisse ouverts la validation juridique de la clause
  unique, la révision de D3 non actée dans le plan, le contrat et AD-P17, l'ajout de C12 et C13 au contrat de
  module, le mécanisme de l'horloge, la suspension d'un acheteur payé (N-16) et l'ordre de sacrifice
  lui-même, marqué `[ASSUMPTION]`.

**Correction.** Classer **chaque** FR et NFR en trois catégories : jamais sacrifiée, sacrifiable (avec son
ordre), dégradable (avec sa version minimale). Remplacer le 4ᵉ sacrifice par « niveau 2 fermé jusqu'à la
livraison de FR-29 ». Remplacer §8.2 par la liste réelle des points ouverts, chacun avec son propriétaire et
sa date.

#### N-36 · faible · FR-39 : copies gardées, mais emplacement vide
> « Désinstaller ne supprime rien : ni les données du module, ni les copies qu'en gardent ses voisins [...]
> Les voisins affichent l'emplacement vide (C4) ».

**Pourquoi ça casse.** Si la copie existe, pourquoi l'emplacement est-il vide ? Si elle est masquée, le
dire. Les données d'un module désinstallé sont conservées **sans limite** : aucune durée de conservation n'est
fixée au regard de la loi 2019-014.

**Correction.** « Les copies restent stockées et **masquées** ; elles réapparaissent à la réinstallation. »
Renvoyer la durée de conservation à la politique d'effacement (avec un propriétaire).

#### N-37 · faible · §1, 4.A, 4.B, FR-5, FR-7, FR-11, FR-14 : résidus de texte qui contredisent les FR réécrites
- §1 : « un retour arrière en un clic la défait sans rien perdre pendant 7 jours ». C'est faux pour
  `AVEC_PERTE`, et sur la plateforme le client ne revient pas en arrière lui-même.
- Description de 4.A : « Le client passe En service seulement quand tout est vert ». Cela contredit « En
  service partiel » (§3, FR-7).
- Description de 4.B : « Pour un distributeur, tout cela se passe [...] avec les mêmes étapes ». Cela
  contredit les deux variantes de FR-17.
- FR-5 : « sans effet de bord ». FR-6 dit « sans doublon ».
- FR-7 : « PDF reçu par le dirigeant ». Le système ne peut vérifier qu'« envoyé et journalisé ».
- FR-11 : « peut être **promu** le jour même ». « Promotion » est réservé aux versions (§3) ; ici, il faut
  « mis en service ».
- FR-14 : `LICENCE_PERIMEE` se confond avec une licence **expirée**. Le refus vise une licence **antérieure**
  (`LICENCE_ANTERIEURE`).

**Correction.** Corriger chaque phrase, puis faire une passe de recherche des termes du §3 employés hors de
leur sens.
