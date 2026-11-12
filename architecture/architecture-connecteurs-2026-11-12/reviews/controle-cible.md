# Contrôle ciblé final : spine Connecteurs et amendements des voisins (2026-11-12)

## Périmètre

Ce contrôle relit, sans rien modifier d'autre que ce rapport :

- `ARCHITECTURE-SPINE.md` (35 AD), `.memlog.md` (D-1 à D-48), `reviews/disposition.md` (152 lignes), `manifestes/connecteurs.manifest.ts` ;
- les 14 fichiers voisins du `git diff origin/main` (contrat de module, plan v3, écosystème, spines du moteur, de la coque et de la Reprise, épics du moteur, `reprise.manifest.ts`, PRD Connecteurs et son journal, PRD moteur, addendum, `manifestes-a-produire.md`, PRD Reprise) ;
- un grep sur tout le dépôt pour les contradictions résiduelles.

Cinq contrôles, dans l'ordre demandé. Gravités : critique = une règle d'argent ou une décision du PO est fausse ; haute = un document actif dit le contraire de la décision ; moyenne = une incohérence qui fera hésiter un développeur ; basse = rédaction ou référence.

## Bilan chiffré

| Gravité | Nombre |
|---|---|
| critique | 0 |
| haute | 2 |
| moyenne | 10 |
| basse | 16 |
| **Total** | **28** |

Ce qui tient :

- Les 38 lignes A (A-31 compte deux fois), les 22 lignes R, les 30 lignes M et les 15 lignes P « contredite » ou « absente » ont été comparées à la spine, au manifeste ou au voisin cité. Une seule ligne critique ou haute est fausse (C1-1). Une ligne R est partiellement vraie (C1-2).
- 55 lignes de plus ont été sondées (V, P, I, M, R). Trois sont fausses ou partielles (C1-3, C1-4, C1-5).
- Le manifeste dit la même chose que la spine : cinq prérequis, cinq vérifications, quatre droits de tenant, neuf routes en lecture seule (même liste qu'AD-27), publie et consomme, interrupteur `odoo-json2`, texte de l'avertissement (identique au caractère près), `objetsDeReprise` et `domainesEchange` vides.
- Aucune décision du PO n'est effacée : QC-3, QC-5, QC-7, QC-8, QC-10, QC-11, A-5 rejetée, D-B et D-13 de la Reprise sont respectées. La liste de février n'est réduite nulle part.
- Les diagrammes sont valides à la relecture, sauf une étiquette (C2-6).
- Fins de ligne : zéro CR dans les 22 fichiers modifiés ou créés, sauf `prds/prd-connecteurs-2026-11-10/.memlog.md` (29 CR pour 29 lignes : CRLF homogène, pas mixte).

## C1 — Fidélité de la disposition

| # | Où | Constat | Gravité | Correction proposée |
|---|---|---|---|---|
| C1-1 | `disposition.md` A-28 ; spine AD-21 (premier point) ; spine du moteur AD-24 | La disposition dit : « âge maximal de l'état publié fixé par la garde du moteur (AD-21, AD-24) ». Faux. AD-24 du moteur ne fixe aucun âge maximal (la seule durée proche est le « périmé plus de 5 minutes » de `GET /heure`, AD-6, qui est une autre chose). AD-21 renvoie donc à rien, et la garde de Connecteurs et celle du kit n'ont aucun seuil. C'est le correctif que demandait la revue A-28 (« au-delà, la garde ferme »). | haute | Dans AD-21, remplacer « se ferme au-delà de l'âge maximal de l'état publié que fixe la garde du moteur (AD-24) » par « se ferme quand la dernière lecture réussie de l'état publié a plus de 15 minutes (valeur réglable par données ; PROPOSÉ) ». Ajouter une ligne à la table d'AD-31 : « spine du moteur AD-24 : âge maximal de l'état publié pour toute garde, 15 minutes, au-delà la garde se ferme ; à porter dans la spine du moteur ». Dans la disposition A-28, écrire « appliqué : 15 minutes en AD-21, demandé au moteur en AD-31 ». Si le PO préfère ne pas fixer de valeur : mettre la ligne au Deferred (« âge maximal de l'état publié », « revoir à la story de la garde ») et passer A-28 à « appliqué autrement ». |
| C1-2 | `disposition.md` R-8 et « Révision D-9 » ; spine Conventions, ligne « États » | R-8 dit « AD-34, Conventions (États) ». Les Conventions ne contiennent pas l'état de domaine `OMBRE` (ajouté par D-48), ni les états d'un écart (ouvert, `RESORBE`, tranché). La ligne est vraie pour AD-34, fausse pour les Conventions. | moyenne | Voir C2-1 pour le texte. Dans la disposition R-8, écrire « AD-34, Conventions (États, après correction C2-1) ». |
| C1-3 | `disposition.md` P-94 et P-106 ; spine AD-31 (voir C3-1) | P-94 cite « PRD Reprise FR-20, A-10 » et P-106 « PRD Reprise FR-20 ». L'amendement est dans FR-23 du PRD Reprise. FR-20 du PRD Reprise traite de l'historique pour la calibration. A-10 est une ligne du PRD Connecteurs, pas du PRD Reprise. | moyenne | P-94 : « AD-18 (prospect), AD-31 (PRD Reprise FR-23 ; renvoi A-10 du PRD Connecteurs) ». P-106 : « AD-20 (dernier point), AD-31 (PRD Reprise FR-23) ». |
| C1-4 | `disposition.md` V-20 | « Où : AD-18, AD-23, manifeste ». AD-23 ne parle pas du contrôle de droits natif. Il est dans AD-18 et dans le manifeste (`verifications.lecture-seule`). | basse | Retirer AD-23 de la colonne « Où », ou ajouter à AD-23 : « Le profil de version porte aussi le contrôle de droits natif (`check_access_rights` jusqu'à 17, `has_access` dès 18, AD-18). » |
| C1-5 | `disposition.md` P-126 ; spine AD-27 ; manifeste (commentaire de `enrichiPar`) | AD-27 promet « une raison par entrée ». Le manifeste donne une raison pour `reprise` et une seule raison pour les six autres modules ensemble. | basse | Dans AD-27 : « une raison par entrée ou par groupe d'entrées ». Ou, dans le manifeste, une ligne de commentaire par module. |
| C1-6 | `disposition.md` (en-tête) ; `.memlog.md` (événement « spine réécrite ») | L'en-tête dit « D-20 → D-47 ». Il y a D-48. Le journal annonce « 151 lignes (124 appliqués, 25 autrement, 1 rejeté, 1 différé) ». Le compte réel est 152 lignes : 124 appliqués, 26 appliqués autrement, 1 rejeté, 1 différé. | basse | En-tête : « Les décisions D-20 → D-48 ». Journal : ajouter « (compte final après D-48 : 152 lignes, 124 appliqués, 26 autrement, 1 rejeté, 1 différé) ». |

## C2 — Cohérence interne de la spine et du manifeste

| # | Où | Constat | Gravité | Correction proposée |
|---|---|---|---|---|
| C2-1 | Spine, Conventions (lignes « États » et « Erreurs ») ; AD-4, AD-15, AD-34 | Le domaine peut être `OMBRE` (AD-34, tableau des transitions) et le kit rend `OMBRE_REFUSE_DANS_LE_REEL` (AD-4, AD-15, AD-34). Ni l'un ni l'autre ne figure aux Conventions. Les états d'un écart (ouvert, `RESORBE`, tranché) y manquent aussi, alors que l'ER les nomme. | moyenne | Ligne « États » : remplacer « domaine : `NON_INSTALLE`, `PREPARE`, `ACTIF`, `BASCULE`, `ARRETE` » par « domaine : `NON_INSTALLE`, `PREPARE`, `ACTIF`, `BASCULE`, `ARRETE`, `OMBRE` (essai seulement) ; écart : `OUVERT`, `RESORBE`, `TRANCHE` ». Ligne « Erreurs », après `ECHANGE_TROP_GROS` : ajouter « `OMBRE_REFUSE_DANS_LE_REEL` ». |
| C2-2 | Spine AD-33 (étape 3) et AD-8 (liste des états) ; Conventions « États » | AD-13 compte comme « en vol » une clé avec une dépendance non résolue (`EN_ATTENTE_DEPENDANCE`). AD-33, étape 3, définit la « file vide » par `EN_ATTENTE`, `ENVOYE`, `A_VERIFIER`, `EN_ECHEC_TECHNIQUE` seulement. Une bascule peut donc passer avec un mouvement qui attend sa facture. AD-8 ne liste pas non plus cet état. | moyenne | AD-33, étape 3 : « (aucun mouvement `EN_ATTENTE`, `EN_ATTENTE_DEPENDANCE`, `ENVOYE`, `A_VERIFIER` ni `EN_ECHEC_TECHNIQUE`) ». AD-8 : après `EN_ATTENTE` ajouter « , `EN_ATTENTE_DEPENDANCE` (AD-6) ». |
| C2-3 | Spine AD-9 (« arrêt du connecteur après 3 essais ») et AD-34 | AD-9 arrête le connecteur après 3 authentifications refusées. AD-34 ne connaît que `CREE`, `VERIFIE`, `EN_SERVICE`, `TERMINE`, `EFFACEMENT_EN_COURS`. Aucun état ne dit ce qu'est un connecteur arrêté, ni comment il repart. | moyenne | AD-9, remplacer « arrêt du connecteur après 3 essais et alerte « identifiants » » par « les travaux du connecteur sont mis en pause après 3 essais (aucun état de plus : le connecteur reste `EN_SERVICE`, la santé passe `DEGRADE`) et une alerte « identifiants » part ; la reprise se fait quand l'intégrateur déclare de nouveaux identifiants (fait `connecteurs.identifiants.declares`) ». |
| C2-4 | Spine AD-33 (étape 2, « Chaque module cible du domaine »), ER (`ACCUSE` « un par cible et numero »), diagramme de la bascule (« modules cibles du domaine ») ; AD-2 et AD-3 | Un domaine a un code `<module>.<domaine>` et le fait porte `moduleCible` au singulier. AD-33 et les diagrammes parlent de plusieurs cibles par domaine. On ne sait pas combien d'accusés attendre. | moyenne | AD-33, étape 2 : « Le module cible du domaine **accuse** : … ». ER : « la relation DOMAINE vers ACCUSE devient : un accusé par numero ». Diagramme : « CI as module cible du domaine ». Si plusieurs modules peuvent partager un domaine, le dire en AD-2 et remplacer `moduleCible` par une liste. |
| C2-5 | Spine AD-15 (dernier point) et AD-20 (« Deux points, pas un ») | AD-15 écrit « la synchro démarre au point de relais = mise en service ». AD-20 et AD-31 disent que le point de relais se scinde en point de coupure et mise en service. | basse | AD-15 : « Dans le réel, la synchro démarre à la mise en service, en relevant depuis le point de coupure (AD-20, A-11 modifiée) ». |
| C2-6 | Spine, diagramme de flux, arête de CIB vers BUS dont l'étiquette est « faits <code>.<objet>.<fait> » | Les chevrons sont lus comme des balises HTML par Mermaid : l'étiquette s'affiche vide ou tronquée. La spine de la Reprise n'en met nulle part. Le reste des trois diagrammes (flux, ER, deux séquences) est syntaxiquement valide. | basse | Remplacer l'étiquette par « faits de domaine (code.objet.fait) ». |
| C2-7 | Spine, paragraphe d'ouverture | « Raisons au `.memlog.md` (D-1 → D-47) ». Il y a D-48. | basse | « (D-1 → D-48) ». |
| C2-8 | Spine AD-2 (dernier point des règles de manifeste) et AD-34 (`PREPARE` vers `ACTIF`) | « Un domaine d'argent dont l'adaptateur n'a pas `lireValeurs` refuse de passer `ACTIF` ». Un domaine `LECTURE` d'argent (solde d'un prêt) n'est jamais comparé (AD-13) et n'a donc pas besoin de `lireValeurs`. | basse | AD-2 et AD-34 : « Un domaine d'argent comparé (`controle: true`) dont l'adaptateur n'a pas `lireValeurs` … ». |
| C2-9 | Spine AD-12 (dernier point) ; Conventions « Erreurs » | Connecteurs « refuse de piloter une cible sous le plancher de la majeure active ». Aucun code d'erreur ni état ne nomme ce refus. | basse | Conventions, « Erreurs » : ajouter « `KIT_TROP_ANCIEN` (cible sous le plancher du kit, domaine rouge) » et le citer en AD-12. |
| C2-10 | `.memlog.md`, D-9 et D-46 | D-48 révise D-9. Mais D-9 n'est pas marquée « révisée » et D-46 liste encore « marche en parallèle après la mise en service » parmi les « contradictions déclarées en AD-31 ». Un lecteur du journal est induit en erreur. | basse | D-9 : ajouter en tête « [RÉVISÉE par D-48] ». D-46 : remplacer « marche en parallele apres la mise en service (D-9, FR-3, UJ-8, FR-9) » par « marche en parallele : plus de contradiction depuis D-48 ». |
| C2-11 | Manifeste (`prerequis[].action`) ; spine AD-27 ; AD-31 (ligne contrat C1) ; manifeste de la Reprise | Le champ `action` d'un prérequis est propre à ce manifeste : ni le contrat C1 ni C13 ni `reprise.manifest.ts` ne le prévoient, et la ligne C1 d'AD-31 ne le dit pas. | basse | Ligne C1 d'AD-31 : ajouter « ; champ `action` sur chaque `prerequis` (ce que l'intégrateur fait si le prérequis échoue) ». Même ajout dans l'amendement C1 du contrat. |
| C2-12 | Spine, diagramme de flux | AD-29 liste `GET /api/instance/v1/etat-publie/{organisationId}` lu par `connecteurs-service` ; le diagramme n'a que le topic `etat-publie.changed.*`. La règle du diagramme est « une flèche = peut appeler ». | basse | Ajouter une arête de CON vers PA, étiquetée « GET etat-publie ». |

## C3 — Amendements des voisins

Toutes les lignes de la table d'AD-31 qui visent un document de ce dépôt sont portées, au bon endroit, avec le même sens (contrat C1, C2, C13, §6 ; plan v3 ; écosystème AD-P18 et version 1.11 ; moteur AD-9, AD-12, AD-15, AD-16, AD-17, AD-26, AD-38, AD-40, Stack ; coque AD-7, AD-8, AD-14, AD-15, AD-25 ; Reprise AD-3, AD-4, AD-7, AD-11, AD-13, AD-18, AD-20, AD-21, AD-23, AD-28, AD-33, Deferred ; épics EPIC-142, 143, 157 ; PRD moteur ; addendum ; `manifestes-a-produire.md` ; `reprise.manifest.ts` ; PRD Reprise FR-17). Les lignes `auth-service`, catalogue de plateforme et `notification-service` visent d'autres dépôts. Aucun amendement n'en contredit un autre : matrice des états, route d'échange et route des contrôles disent la même chose partout. Restent :

| # | Où | Constat | Gravité | Correction proposée |
|---|---|---|---|---|
| C3-1 | Spine AD-31, ligne « PRD Reprise FR-20, A-10 » | L'amendement est dans FR-23 du PRD Reprise (l'en-tête du PRD Reprise le dit : « FR-23 »). FR-20 du PRD Reprise n'a pas été touché. « A-10 » est du PRD Connecteurs. | moyenne | Remplacer la cellule par « PRD Reprise FR-23 (et FR-24 pour le retrait des identifiants), renvoi à A-10 du PRD Connecteurs ». |
| C3-2 | `prds/prd-connecteurs-2026-11-10/prd.md`, FR-8, puce « Trancher est une écriture (la correction part vers le propriétaire) » (autour de la ligne 298) | La puce voisine « Chaque décision est tracée… » est amendée (la correction part vers chaque logiciel dont la valeur diffère). Celle-ci ne l'est pas et dit le contraire dans le même FR. | moyenne | « Trancher est une écriture (la correction part vers chaque logiciel dont la valeur diffère de la valeur retenue, amendement 2026-11-12, AD-14) : l'action est enveloppée dans `<Ecriture>` (spine, AD-7). » |
| C3-3 | PRD Connecteurs, ligne C5 ; en-tête d'amendement (ligne 19) ; spine AD-31 (ligne C5) | La ligne C5 garde les trois anciens noms sans rature avant l'amendement qui les remplace (les autres lignes amendées barrent le texte remplacé). L'en-tête d'amendement ne cite ni C3 ni C11, amendés aussi. La ligne C5 d'AD-31 ne les cite pas. | basse | Barrer `mouvements-echange@1`, `fraicheur-domaine@1`, `etat-connecteur@1` dans la ligne C5 du PRD. Ajouter « C3, C11 » à l'en-tête du PRD et « (C3 et C11 : même remplacement) » à la ligne C5 d'AD-31. |
| C3-4 | Spine AD-31, ligne « PRD Reprise FR-17 » : « (rature retirée) » | Le texte de `origin/main` ne contient aucune rature à retirer. La parenthèse renvoie à un état de travail disparu. | basse | Supprimer « (rature retirée) ». |
| C3-5 | PRD Connecteurs, lignes autour de 217, 406 et 408 | Trois puces disent encore « la console » pour des actes de configuration : le mode (« la console le propose »), la répartition par défaut (« proposition par défaut de la console »), le refus d'un domaine sans propriétaire (« la console refuse de mettre en service »). D-10 et AD-28 placent la configuration dans le module d'écran `connecteurs`. | basse | Remplacer « la console » par « l'écran de configuration du module `connecteurs` » dans ces trois puces (la ligne 369, vue du parc, reste « la console »). |

## C4 — Contradictions résiduelles par grep

| # | Où | Constat | Gravité | Correction proposée |
|---|---|---|---|---|
| C4-1 | `architecture/architecture-prospera-app-2026-11-10/ARCHITECTURE-SPINE.md`, arbre du Structural Seed, ligne 341 : `reprise/ connecteurs/   # requis en février (PRD Reprise, PRD Connecteurs)` | Seul document actif qui dit encore « Connecteurs requis en février ». La spine de la coque est amendée ailleurs (en-tête d'amendement) mais pas ici. | haute | `reprise/ connecteurs/   # reprise : février ; connecteurs : au premier contrat qui garde un logiciel (spine de Connecteurs, AD-32)`. Ajouter « Seed » à la liste de l'en-tête d'amendement de la coque. |
| C4-2 | PRD Connecteurs, FR-9, dernière puce (autour de la ligne 314) : « Pendant la marche en parallèle, c'est la file des écarts qui fait foi pour l'arrêt de la synchro (QC-8) » | Depuis D-48 la marche en parallèle se joue dans l'essai, avant la mise en service. L'arrêt de la synchro a lieu dans le réel, après. La phrase place l'arrêt pendant la marche en parallèle. | moyenne | « Dans le réel, après la mise en service, c'est la file des écarts de Connecteurs qui fait foi pour l'arrêt de la synchro (QC-8). Pendant la marche en parallèle (dans l'essai), la même concordance alimente le rapport d'écarts de la période de la Reprise. Le feu vert de la Reprise est une autre condition… » (reste de la puce inchangé). |
| C4-3 | `CONTRAT-DE-MODULE-2026-11-09.md`, C2, puces autour des lignes 220-222 et 228-229 | Le texte d'origine dit « Aucune autre identité ne passe » et « routes de reprise ouvertes à la seule identité de la Reprise », sans rature. L'amendement qui suit ouvre la route des contrôles à Connecteurs. Le catalogue lit ce contrat : deux phrases se contredisent. | moyenne | Après « Aucune autre identité ne passe », ajouter « (sauf Connecteurs, en lecture, sur la route des contrôles : amendement 2026-11-12 ci-dessous) ». Dans la puce « Matrice », ajouter « (route des contrôles : voir l'amendement 2026-11-12) ». |
| C4-4 | Spine de la Reprise : ligne 242 (« son ordonnancement se décide avec Connecteurs (Deferred) »), ligne 351 (« la comparaison de nuit se règle avec Connecteurs »), ligne 624 de la carte (« ordonnancement avec Connecteurs » / « Deferred ») | Textes d'origine non barrés, alors que le Deferred correspondant est barré et « résolu ». | basse | Ajouter à chacun « (résolu le 2026-11-12 : spine de Connecteurs, AD-15) ». |
| C4-5 | PRD Connecteurs, titre « 4.F Février : l'ordre de livraison du connecteur Odoo » (ligne 452) | Le titre garde « Février » alors que le texte dessous dit « plus en février ». | basse | « 4.F L'ordre de livraison du connecteur Odoo (au premier contrat qui garde un logiciel) ». |

Contrôlé sans reste :

- Place de la marche en parallèle : tous les textes actifs la placent dans l'essai avant la mise en service, sauf C4-2 et le journal (C2-10).
- Route d'échange et matrice des neuf états : contrat C2, PRD moteur (paragraphe §3.1 et FR-43), épics EPIC-142, AD-21 et AD-31 concordent. Les neuf états sont comptés une fois chacun.
- Seuils de fraîcheur (5/15 min, 1/3 h, nuit à 06 h) et bandeau de la file pour `connecteurs:file:consulter` : PRD FR-11 et FR-12, coque AD-7, AD-16 concordent.
- Noms `mouvements-echange@1`, `fraicheur-domaine@1`, `etat-connecteur@1` : plus aucun emploi actif (le PRD C5 les cite avant leur remplacement, voir C3-3).
- Code de source de la clé d'origine : `odoo:<connecteurId>` n'apparaît que pour être interdit.
- Liste des cibles de février : « jusqu'à une trentaine » partout ; la liste de sept modules de la Reprise est étiquetée « présumée ».
- Kit : nom `kit-cible` identique dans la spine, le Seed, le moteur, la Reprise, l'écosystème et `manifestes-a-produire.md`.

## C5 — Fins de ligne

| # | Où | Constat | Gravité | Correction proposée |
|---|---|---|---|---|
| C5-1 | 22 fichiers modifiés ou créés | `tr -cd '\r' < f ` rend 0 pour tous, y compris les cinq relectures, la disposition, ce rapport, la spine, le journal et les deux manifestes. | OK | Aucune. |
| C5-2 | `prds/prd-connecteurs-2026-11-10/.memlog.md` | 29 CR pour 29 lignes, dans `origin/main` (28 pour 28) comme dans la copie de travail. CRLF homogène, la ligne ajoutée est en CRLF. Pas mixte. | OK | Aucune. |

## Suite donnée (2026-11-12)

Les 28 constats sont corrigés. Aucun n'a été écarté.

| # | Suite | Où |
|---|---|---|
| C1-1 | corrigé, sans seuil de fermeture : relecture au-delà de 15 minutes sans confirmation, état courant gardé en cas d'échec, santé `DEGRADE`, nouvelle tentative ; précision proposée au moteur | spine AD-21 (premier point) et AD-31 (ligne moteur AD-24) ; spine du moteur AD-24 (amendement) ; disposition A-28 |
| C1-2 | corrigé | disposition R-8 ; spine Conventions (États) |
| C1-3 | corrigé | disposition P-94 et P-106 |
| C1-4 | corrigé (AD-23 retiré de la colonne « Où ») | disposition V-20 |
| C1-5 | corrigé (« par entrée ou par groupe d'entrées ») | spine AD-27 ; disposition P-126 |
| C1-6 | corrigé | disposition (en-tête) ; `.memlog.md` (événement « spine réécrite ») |
| C2-1 | corrigé | spine Conventions (États, Erreurs) |
| C2-2 | corrigé | spine AD-8 et AD-33 (étape 3) |
| C2-3 | corrigé (pause des travaux, aucun état de plus, reprise à la déclaration de nouveaux identifiants) | spine AD-9 |
| C2-4 | corrigé (« le module cible », un accusé par numéro) | spine AD-33, AD-29, ER, séquence de la bascule |
| C2-5 | corrigé | spine AD-15 (dernier point) |
| C2-6 | corrigé | spine, diagramme de flux |
| C2-7 | corrigé | spine, paragraphe d'ouverture (D-1 → D-48) |
| C2-8 | corrigé | spine AD-2 et AD-34 |
| C2-9 | corrigé (`KIT_TROP_ANCIEN`) | spine AD-12 et Conventions (Erreurs) |
| C2-10 | corrigé | `.memlog.md`, D-9 et D-46 |
| C2-11 | corrigé | spine AD-31 (ligne C1) ; contrat de module C1 (amendement du 2026-11-12) |
| C2-12 | corrigé | spine, diagramme de flux (arête vers la partie A) |
| C3-1 | corrigé | spine AD-31 (ligne PRD Reprise FR-23) |
| C3-2 | corrigé | PRD Connecteurs FR-8 (puce « Trancher est une écriture ») |
| C3-3 | corrigé | PRD Connecteurs ligne C5 (rature) et en-tête d'amendement ; spine AD-31 (ligne C5) |
| C3-4 | corrigé | spine AD-31 (ligne PRD Reprise FR-17) |
| C3-5 | corrigé | PRD Connecteurs FR-2 (mode), FR-14 (répartition par défaut et refus d'un domaine sans propriétaire) |
| C4-1 | corrigé | spine de la coque, Structural Seed et en-tête d'amendement |
| C4-2 | corrigé (précisé sans contredire QC-8 : le réel après la mise en service ; l'essai pendant la marche en parallèle, D-48) | PRD Connecteurs FR-9 (dernière puce) |
| C4-3 | corrigé | contrat de module C2 (deux puces) |
| C4-4 | corrigé | spine de la Reprise (route des contrôles, tableau d'amendements, carte) |
| C4-5 | corrigé | PRD Connecteurs, titre 4.F |
