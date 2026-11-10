# Validation Report — PRD — Moteur d'installation (platform-catalog-service) · passage 2

- **PRD:** `C:/Users/thier/AppData/Local/Temp/claude/9bbf1c22b9374251/0ae42633-f0a2-4ec7-a361-b981128c3d88/scratchpad/wt/stories/prds/prd-moteur-installation-2026-11-09/prd.md`
- **Rubric:** `C:/Users/thier/Documents/.claude/skills/bmad-prd/assets/prd-validation-checklist.md` (revue de grille : `C:/Users/thier/AppData/Local/Temp/claude/9bbf1c22b9374251/0ae42633-f0a2-4ec7-a361-b981128c3d88/scratchpad/wt/stories/prds/prd-moteur-installation-2026-11-09/review-rubric.md`)
- **Run at:** 2026-11-10T13:25:55+00:00
- **Grade:** Poor (Insuffisant) — 5 constats critical dans les trois revues (4 thèmes) ; aucune dimension *thin* ou *broken*
- **Passage 1 :** `C:/Users/thier/AppData/Local/Temp/claude/9bbf1c22b9374251/0ae42633-f0a2-4ec7-a361-b981128c3d88/scratchpad/wt/stories/prds/prd-moteur-installation-2026-11-09/revue-1/validation-report.md` (Poor, thèmes T-01 → T-30)

## Overall verdict

La réécriture est un vrai saut : le §3.1 (trois axes, huit états publiés, table menu / garde / bandeau), FR-34 → FR-41, C12/C13, NFR-7/NFR-8 et l'horloge scellée referment presque tous les constats de la revue 1, et le texte reflète fidèlement le journal du PO. Ce qui reste à risque, c'est la **jonction avec ce qui tourne déjà sur `dev`** : les chemins de droits 2 → 6 (paiement, socle de vertical, licence) posent un `ACTIVE` que la table des états publiés ne sait pas représenter — ce qui casse la règle de menu au cœur de la spine de la coque et la décision T-01 du PO pour le distributeur de février — et STORY-280 (impayé ⇒ `SUSPENDED` automatique, arbitrage PO du 08/11) contredit FR-32/FR-41 sans qu'aucune ligne ne le dise. Les deux se corrigent en une demi-journée de texte ; sans eux, le PRD n'est pas prêt à être consommé.

Les deux relecteurs supplémentaires déplacent le tableau. La revue adversariale (37 nouveaux constats, dont 3 critical) montre que les nouveautés **ne sont pas croisées entre elles** : une restauration de sauvegarde rembobine l'horloge scellée, le compteur de licence et le registre des consentements ; les gardes des modules calculent l'échéance sur l'horloge du système, pas sur l'horloge scellée ; les interrupteurs de changement n'ont aucun comportement sur site ; la licence courte de FR-41 fait mentir « le silence ne punit pas ». La revue de cohérence (21 nouveaux constats, dont 1 critical) confronte la table des états au code de `dev` : six états sur huit s'y projettent, mais `PREAVIS` et `ESSAI_PROSPECT` ne se lisent pas sur l'entitlement, la règle « l'axe 2 prime » ferait disparaître du menu **tous les modules existants**, le socle `distributeur` ouvre 7 codes sans contrat dès la création de l'organisation, et `auth-service` refuse les droits `instance:*`.

Une fois dédoublonnés, les 88 nouveaux constats (et les 46 constats du passage 1 restés partiels ou non résolus) se ramènent à **28 thèmes** : 4 critical, 15 high, 9 medium — 5 `bloque-coque`, 11 `decision-PO`, 12 `reecriture` (détail dans `validation-report.md`, section « Constats consolidés du passage 2 »). Aucune dimension n'est plus *thin* ; la note reste **Poor** à cause des 5 constats critical (4 thèmes). Sans eux, elle serait *Fair* (des constats high subsistent). Pour la séance du 13/11, trois arbitrages commandent le reste : U-01 (ce que publient les chemins 2 → 6), U-02 (impayé : STORY-280 contre préavis) et U-05 (licence courte contre « le silence ne punit pas »).

## Constats consolidés du passage 2 (dédoublonnés)

Les trois revues se recoupent : les **88 nouveaux constats** (30 de la grille, 37 adversariaux, 21 de cohérence) et les **46 constats du passage 1 restés partiels ou non résolus** sont regroupés en **28 thèmes**, ordonnés par gravité. Chaque constat nouveau et chaque constat repris figure dans au moins un thème.

Identifiants : **G-N-xx** = nouveaux constats de la grille `review-rubric.md` (N-01 → N-26 de sa table ; G-N-27 à G-N-30 = constats de dimension qu'elle ne numérote pas : SM-6/SM-7, §8.2, reste de T-23, renvois à la revue) ; **A-N-xx** = `review-adversarial-general.md` ; **C-N-xx** = `review-coherence-contrat.md`. Constats repris du passage 1 : **G-xx / M-xx** (grille), **F-xx** (adversariale), **R-xx** (cohérence), avec leur statut.

Sévérité d'un thème : la plus haute de ses constats nouveaux ; un constat non résolu garde sa sévérité du passage 1 ; un constat partiel ne relève pas la sévérité (son reste est porté par un constat nouveau).

Étiquettes : `bloque-coque` = l'architecture de `prospera-app` ne peut pas avancer sans ; `decision-PO` = demande un arbitrage du PO, pas une simple réécriture ; `reecriture` = correction rédactionnelle ou d'architecture sans arbitrage.

**Décompte :** 4 critical · 15 high · 9 medium · 0 low — 5 `bloque-coque` · 11 `decision-PO` · 12 `reecriture`.

| Thème | Sévérité | Étiquette | Titre |
|---|---|---|---|
| U-01 | critical | `decision-PO` | Ce que publient les chemins de droits 2 → 6 : un module ouvert sans installation |
| U-02 | critical | `decision-PO` | Impayé : STORY-280 (suspension à J+7, arbitrage PO du 08/11) contre préavis 30 j + lecture seule |
| U-03 | critical | `bloque-coque` | Lire l'état publié : canal, transitions dans le temps, représentation sur l'entitlement |
| U-04 | critical | `reecriture` | État de confiance : restauration, horloge scellée en avance, gel à trois définitions |
| U-05 | high | `decision-PO` | Licence courte contre « le silence ne punit pas » |
| U-06 | high | `bloque-coque` | Lecture seule, visibilité et export : C8 et C2 non amendés, trois mécanismes |
| U-07 | high | `bloque-coque` | Fin de l'essai prospect : 30 jours d'export sans état publié |
| U-08 | high | `bloque-coque` | Droits `instance:*` : code de module, intersection, droit de consentir |
| U-09 | high | `bloque-coque` | Une organisation dans deux espaces : naissance, rejeu, rafraîchissement |
| U-10 | high | `decision-PO` | Ce que vend le contrat : socle de vertical = package, « pack distributeur », modules non installables |
| U-11 | high | `reecriture` | Obligations nouvelles des modules hors C13, gabarit du contrat à 11 lignes |
| U-12 | high | `decision-PO` | Interrupteurs de changement : sur site, empilement, forme des données |
| U-13 | high | `decision-PO` | Retour arrière : `AVEC_PERTE` sur la plateforme et en automatique, promotions rapprochées, durée |
| U-14 | high | `decision-PO` | Correctifs critiques pour les versions figées, maintenance datée module par module |
| U-15 | high | `reecriture` | Connecteurs en essai : liste blanche, identifiants en lecture seule, aller-retour, messages d'identité |
| U-16 | high | `decision-PO` | Apprentissage sur la plateforme : clause d'adhésion, AD-P16, SM-4 aveugle |
| U-17 | high | `decision-PO` | Sauvegardes : clé « détenue par le client » contre automatismes, RPO de la plateforme |
| U-18 | high | `reecriture` | Feu vert de la Reprise trop large ; jonction avec le PRD Reprise |
| U-19 | high | `reecriture` | Licence et clés : clé compromise, compteur, vérification quotidienne qui « n'envoie aucune donnée » |
| U-20 | medium | `decision-PO` | Ordre de sacrifice partiel, §8.2 « Aucun » point ouvert |
| U-21 | medium | `reecriture` | §8.4 et amendements du contrat incomplets |
| U-22 | medium | `reecriture` | Indicateurs : SM-6 et SM-7 sans instrument |
| U-23 | medium | `reecriture` | Plateforme : espace d'essai partagé, majeure, rafraîchissement, vagues, version épinglée |
| U-24 | medium | `decision-PO` | Dépendances : majeure qui ajoute une dépendance non souscrite, propagation d'un pack, cycles |
| U-25 | medium | `reecriture` | Effacement du prospect et désinstallation |
| U-26 | medium | `reecriture` | Santé d'un module en service : un prérequis qui disparaît |
| U-27 | medium | `reecriture` | Parcours, vocabulaire et résidus de texte |
| U-28 | medium | `reecriture` | Canal de données : schéma du signal, ré-identification, registre, purge |

### Gravité critical (4)

#### U-01 · critical · `decision-PO` — Ce que publient les chemins de droits 2 → 6 : un module ouvert sans installation

- **Sévérité max :** critical
- **Origine :** G-N-01 (critical), A-N-01 (critical), C-N-03 (high), A-N-03 (high), A-N-08 (medium), C-N-08 (medium), C-N-20 (low) ; repris : G-13 (partiel), G-18 (partiel), R-27 (partiel), F-04 (partiel), F-15 (partiel)
- **Touche :** §3.1 (axe 2, « L'axe 2 prime », état publié), FR-4, FR-6, FR-11, FR-12, FR-14, FR-34
- **Écart :** Les trois revues tombent sur la même faille : l'échéance soldée (727 lot 2), la propagation d'un pack, le socle de vertical, l'opérateur et la licence posent `ACTIVE` sans passer par l'axe 2, et « l'axe 2 prime » les publie `NON_INSTALLE` : menu caché, garde ouverte. Sur `dev`, **tous** les droits existants viennent de ces chemins : le jour de la mise en route du moteur, tous les modules disparaissent du menu ; ou bien, si l'on ouvre, le distributeur de février a tous ses modules ouverts dans le réel dès son premier paiement, avant toute répétition générale, contre la décision T-01. Corollaires : les vérifications d'un module en `EN_INSTALLATION` tournent sans droit (circularité), la liste « il n'en existe pas d'autre » oublie régularisation, offre d'essai, réinstallation, levée de sanction. Bloque aussi la spine de la coque.
- **Correction suggérée :** Le PO tranche entre deux modèles : (a) **souscrit ≠ ouvert** — les chemins 2 → 6 ne donnent que le droit d'installer (axe 3), `ACTIVE` n'est posé que par la mise en service (ou directement pour socle et opérateur), état « acquis, à installer » ; ou (b) **un chemin de droits vaut installation** dans l'espace où il s'exécute, un `ACTIVE` sans trace d'installation se publie `EN_SERVICE`, avec reprise de l'existant. Puis : table de FR-4 complétée (8 chemins, espace touché, état publié, refus applicables, sort d'un refus asynchrone) ; identité de service pour les vérifications (C2/C13) ; cas « `ACTIVE` × `NON_INSTALLE` » dans la matrice de FR-34.
- **Étiquette :** `decision-PO`

#### U-02 · critical · `decision-PO` — Impayé : STORY-280 (suspension à J+7, arbitrage PO du 08/11) contre préavis 30 j + lecture seule

- **Sévérité max :** critical
- **Origine :** C-N-01 (critical), G-N-02 (high), A-N-14 (high, point 3), A-N-06 (high), C-N-09 (medium), A-N-16 (low) ; repris : R-03 (partiel)
- **Touche :** §3 « Suspendre », §3.1 axe 3 et table `SUSPENDU`, FR-13, FR-32, FR-39, FR-41, §8.4
- **Écart :** Le code de `dev` (`echeancier.ts`, `suspension-par-impaye.service.ts`) suspend **automatiquement** tous les droits du contrat à J+7 d'un impayé, sur arbitrage du PO du 08/11 ; le PRD (décision du 10/11) fait passer l'impayé par 30 jours de préavis puis une lecture seule sans fin, et réserve `SUSPENDU` à une sanction humaine — tout en citant STORY-280 comme source de `SUSPENDU`. Aucune ligne ne confronte les deux décisions ; §8.4 ne touche ni 280, ni 281 (grâce), ni le jalon `IMPAYE`. Le mot `PREAVIS` a deux sens (J-7 dans `paiement`, après échéance dans l'état publié) et le renommage est adressé à la mauvaise story. Si la suspension survit, un module `SUSPENDU` ferme aussi l'export et les états BCEAO (manquement réglementaire chez le client) ; la suspension d'un acheteur payé reste juridiquement fragile.
- **Correction suggérée :** Le PO tranche : (a) **le PRD l'emporte** — §8.4 « STORY-280/281 : l'impayé ne suspend plus », sort de la grâce de 281 ; ou (b) **le code l'emporte** — §3.1 écrit `PREAVIS` de J0 à J+7 puis `SUSPENDU`, FR-32/FR-41 corrigées. Dans les deux cas : « impayé persistant » défini par une durée, un seul parcours identique sur site et plateforme, ce qu'un module suspendu garde ouvert (export, états réglementaires), suspension d'un acheteur payé interdite ou renvoyée au juriste, renommage `PREAVIS` adressé à 280/281 ou état publié renommé.
- **Étiquette :** `decision-PO`

#### U-03 · critical · `bloque-coque` — Lire l'état publié : canal, transitions dans le temps, représentation sur l'entitlement

- **Sévérité max :** critical
- **Origine :** A-N-10 (critical), C-N-02 (high), A-N-02 (high, point 1), C-N-07 (medium)
- **Touche :** §3.1 (axe 3, ordre de priorité, table publiée), FR-15, FR-34, C2, C5
- **Écart :** Les passages `PREAVIS` → `LECTURE_SEULE`, fin d'essai et fin de grâce sont déclenchés par le temps et n'émettent aucun événement : chaque garde C2 calcule `EXPIRED` sur l'horloge de **son** conteneur, que le client peut reculer — menu « lecture seule », garde qui accepte les écritures, FR-15 contourné sans toucher au moteur. `PREAVIS` (« échéance repoussée de 30 j ») et `ESSAI_PROSPECT` sont indiscernables d'un `ACTIF` sur l'entitlement ; l'axe 3 hésite entre automate (« état antérieur ») et drapeaux (ordre de priorité). « Une vue, jamais une seconde source » est faux (axe 2, espace, gel ne sont pas dans `entitlement.changed`) et le canal de lecture (route ? topic ? droit ?) n'est pas nommé. La coque ne peut pas écrire sa lecture.
- **Correction suggérée :** Axe 3 **calculé** à partir de faits indépendants, sans « état antérieur » ; état publié **calculé à la lecture**, route par organisation et par espace, droit exigé ; représentation de chaque état dans FR-34 (`essai: { finLe }`, `preavis: { echeanceContrat, finLe }`, `statutEffectif` étendu) ; les gardes lisent l'état poussé ou une heure de référence fournie par l'agent, jamais leur horloge ; amender C2 ; cas « date système reculée de 40 jours » dans la matrice de FR-34.
- **Étiquette :** `bloque-coque`

#### U-04 · critical · `reecriture` — État de confiance : restauration, horloge scellée en avance, gel à trois définitions

- **Sévérité max :** critical
- **Origine :** A-N-09 (critical), A-N-11 (high), A-N-12 (medium), A-N-13 (medium), G-N-19 (low) ; repris : F-16 (partiel)
- **Touche :** FR-14, FR-15, FR-18, FR-19, FR-20, FR-27, FR-33, NFR-4, NFR-7, §3 « Gel », §3.1
- **Écart :** Horloge scellée, plus haut numéro de licence, registre des consentements et journal vivent sur le disque de l'instance : restaurer une sauvegarde ou un instantané (ou le retour arrière `AVEC_PERTE` de Money Vibes elle-même) rembobine l'horloge, rend l'ancienne licence acceptable, annule un retrait de consentement et ampute le journal. À l'inverse, une date mise en avance par erreur est acceptée et ne se corrige jamais. « Toutes les échéances sur l'horloge scellée » est faux pour les 72 h, l'essai prospect, J+7 et les 7 jours ; le gel a trois définitions, et un vieux fichier redéposé remet le silence à zéro.
- **Correction suggérée :** Un **état de confiance** hors périmètre restauré, qui n'avance que et est rapporté à Money Vibes à chaque contact (refus de licence et d'export s'il a reculé) ; avance bornée sans preuve et **correction signée** par Money Vibes ; table « délai → horloge → événement de départ → observateur » ; une seule définition du contact (authentifié, daté, jamais déjà vu). Tests : restauration ancienne, date avancée de 10 ans.
- **Étiquette :** `reecriture`

### Gravité high (15)

#### U-05 · high · `decision-PO` — Licence courte contre « le silence ne punit pas »

- **Sévérité max :** high
- **Origine :** A-N-14 (high, points 1-2), G-N-12 (medium)
- **Touche :** FR-15, FR-32, FR-41, FR-22
- **Écart :** FR-41 ne donne à un abonné sur site qu'une licence courte, valable jusqu'à sa prochaine échéance payée. Un abonné qui **paie** mais dont la liaison est coupée ne reçoit pas la suivante : préavis, puis lecture seule. Le principe de FR-15 est donc faux pour tous les abonnés sur site, et seul un e-mail manuel les sauve. FR-41 applique en outre le parcours de fin de contrat (FR-32) à chaque échéance de paiement, mensuelle comprise.
- **Correction suggérée :** Le PO choisit : assumer (conséquence écrite dans FR-15 : « sans licence par fichier, l'échéance tombe ») ou distinguer **échéance de licence** (technique, renouvelée tant que le compte est à jour) et **échéance du droit d'utiliser** (contractuelle, seule à déclencher FR-32), avec alerte Money Vibes à J-7 d'une licence non renouvelée faute de contact et envoi par e-mail.
- **Étiquette :** `decision-PO`

#### U-06 · high · `bloque-coque` — Lecture seule, visibilité et export : C8 et C2 non amendés, trois mécanismes

- **Sévérité max :** high
- **Origine :** G-N-03 (high), C-N-11 (medium)
- **Touche :** §3.1 table, FR-32, FR-33, FR-35, FR-39, §8.4 ; contrat C2, C8 ; STORY-727 lot 4
- **Écart :** C8 rend une entrée visible **ssi** `ACTIVE` ; la table publiée rend `LECTURE_SEULE` visible. C2 refuse toute route hors `ACTIVE` ; FR-32 ouvre lecture, recherche, export et états réglementaires. Le code (727 lot 4, 8 services) filtre par **verbe HTTP**, FR-32 par **catégorie**, FR-35 par **droit** : un export ou un état BCEAO est un `POST`, donc refusé. FR-39, FR-33 et FR-32 exportent depuis des états dont la garde rend 403. La spine de la coque part de C8, que §8.4 n'amende pas.
- **Correction suggérée :** Un seul mécanisme (ex. verbe + liste blanche d'export et d'états déclarée au manifeste, versée dans C13) ; §8.4 « C8 : visible ssi l'état publié ∈ {`EN_SERVICE`, `ESSAI_PROSPECT`, `PREAVIS`, `LECTURE_SEULE`} et droit » ; route d'export C13 exemptée de la garde, réservée à `instance:donnees:exporter`.
- **Étiquette :** `bloque-coque`

#### U-07 · high · `bloque-coque` — Fin de l'essai prospect : 30 jours d'export sans état publié

- **Sévérité max :** high
- **Origine :** G-N-06 (high), A-N-02 (high, points 2-3), C-N-02 (high, point 2) ; repris : F-21 (partiel)
- **Touche :** FR-33, FR-36, §3.1 axe 3 et table publiée
- **Écart :** FR-33 : « l'accès se ferme », puis « 30 jours pour exporter ou signer ». « Fermé » n'est ni un état de l'axe 3 ni l'un des huit états publiés ; sur le code, la fin d'essai se lit `EXPIRED`, donc `LECTURE_SEULE` (visible, lecture, export), l'inverse de « l'accès se ferme ». La coque ne sait pas quoi afficher pendant 30 jours, et ce que l'espace réel publie pour un prospect n'est pas dit.
- **Correction suggérée :** 9ᵉ état `ESSAI_TERMINE{effacementLe}` (export seul pour l'administrateur du prospect, bandeau « effacement le … »), calculé comme `EXPIRED`, sans tâche planifiée ; ou dire que c'est `LECTURE_SEULE`, ou que l'export passe par un fichier envoyé par Money Vibes.
- **Étiquette :** `bloque-coque`

#### U-08 · high · `bloque-coque` — Droits `instance:*` : code de module, intersection, droit de consentir

- **Sévérité max :** high
- **Origine :** C-N-06 (high), A-N-07 (high), G-N-09 (medium), G-N-26 (low) ; repris : G-20 (partiel), R-26 (partiel), F-37 (partiel)
- **Touche :** FR-27, FR-35, FR-36, §7 C7/C8 ; `auth-service` (STORY-167 AC 2)
- **Écart :** `auth-service` refuse tout droit dont le premier segment n'est pas un module `ACTIVE` de l'organisation : aucun module `instance` n'existe, donc ces droits n'entrent dans aucun rôle ; le format refuse aussi les codes à tiret. L'intersection « attribués ∩ modules ouverts » n'existe nulle part (et `auth` voit un `EXPIRED` comme `ACTIVE`) ; si elle s'applique aux droits du moteur, la lecture seule retire au DSI le droit de déposer la licence qui la lèverait. `instance:consentement:donner` est attribuable par l'administrateur, contre FR-27 (DG ou désigné par écrit). Les publics « administrateurs » et « DG » des bandeaux ne sont pas des droits.
- **Correction suggérée :** Module `instance` au socle de toute organisation, sans terme et non suspendable (ou exception nommée dans STORY-167) ; droits `instance:*` hors intersection, toujours effectifs ; intersection calculée dans la coque et dans C2 à partir de l'état publié ; consentement attribuable par le DG seul, référence de l'écrit au registre ; droit derrière chaque bandeau ; droits sans objet masqués selon l'hébergement ; signaler à C7 la limite du format.
- **Étiquette :** `bloque-coque`

#### U-09 · high · `bloque-coque` — Une organisation dans deux espaces : naissance, rejeu, rafraîchissement

- **Sévérité max :** high
- **Origine :** C-N-05 (high), C-N-14 (medium) ; repris : R-17 (partiel)
- **Touche :** FR-6, FR-8, FR-10, FR-33, §3 « Dossier d'installation », §3.1 axe 1, §7 C3
- **Écart :** Une organisation naît dans **un** `auth-service`. Créé dans le réel, le prospect y reçoit le socle `distributeur` ; créé dans l'essai, sa signature crée l'organisation dans le réel où le chemin 4 ouvre 7 codes avant rejeu et feu vert. Rejeu et rafraîchissement supposent la même identité d'organisation dans les deux déploiements, non dite. Le rejeu écrit chez `auth` (rôles), `reseau` (zones) et la Reprise (correspondances) sans contrat nommé, alors que C3 « n'écrit dans aucun autre module » ; les comptes ne sont pas au dossier.
- **Correction suggérée :** Une FR « Une organisation dans deux espaces » (où elle naît, même identifiant, créée par le moteur dans l'autre espace, chemin 4 suspendu dans le réel avant la mise en service d'une organisation issue d'un essai) ; pour chaque élément du dossier, propriétaire et point d'import ; « comptes et invitations » au dossier ou recréés ; C13 « importer sa part d'un dossier ».
- **Étiquette :** `bloque-coque`

#### U-10 · high · `decision-PO` — Ce que vend le contrat : socle de vertical = package, « pack distributeur », modules non installables

- **Sévérité max :** high
- **Origine :** C-N-04 (high), A-N-34 (medium), G-N-20 (low) ; repris : G-19 (partiel), R-14 (partiel), R-12 (partiel)
- **Touche :** §1, §3 « Socle de vertical », FR-7, FR-12, FR-37, SM-1, SM-2, NFR-5, QA-1
- **Écart :** Dans le code, le `VerticalPack` est à la fois le socle offert à la création et l'unité de vente du contrat (le `cabinet` l'achète) ; le socle `distributeur` ouvre `balance, bilan, pdv, stock, catalogue, commande, facturation` sans contrat ni terme. FR-37 n'a pas la colonne « package du contrat → codes », `MODULE_NON_SOUSCRIT` n'a pas de base, FR-12/FR-8/FR-32 ne s'appliquent pas à ces 7 codes, SM-1 (« organisation vierge », « pack distributeur ») est indémontrable. Un contrat peut aussi vendre un module absent du catalogue : client « En service partiel » pour toujours, NFR-5 inatteignable, 18 manifestes C13 à produire hors de tout jalon.
- **Correction suggérée :** Le PO tranche : le socle `distributeur` garde-t-il `pdv`, `stock`, `commande`, `facturation` « inclus » alors qu'ils sont vendus dans les packs ? Peut-on vendre un module non installable ? Puis : « socle de vertical » redéfini depuis le code, colonne « package → codes » dans FR-37, codes inclus hors FR-12/FR-32 nommés, SM-1 avec la liste exacte des codes et l'organisation de départ, NFR-5 sur les codes installables, « 18 manifestes C13 » au §8.4 avec propriétaire et date.
- **Étiquette :** `decision-PO`

#### U-11 · high · `reecriture` — Obligations nouvelles des modules hors C13, gabarit du contrat à 11 lignes

- **Sévérité max :** high
- **Origine :** G-N-05 (high), C-N-17 (medium), C-N-18 (medium) ; repris : R-06 (partiel), R-07 (partiel), R-08 (non résolu)
- **Touche :** FR-6, FR-10, FR-17, FR-32, FR-35, FR-38, §0, §7 C1/C12/C13 ; contrat §6
- **Écart :** La réécriture impose à chaque module, sans clause : un interrupteur de changement par organisation avec date limite, le classement de ses routes pour la lecture seule, une clef d'idempotence par vérification, une route d'export hors garde, l'**import** de la part d'une organisation (rafraîchissement par organisation) — C13 ne prévoit qu'exporter et effacer. Le contrat §6 exige onze lignes (vérifiées par `bmad-check-implementation-readiness`) ; les PRD Reprise et Connecteurs, premiers débiteurs de C13, ont encore C1 → C11. Toujours rien sur la remise des indicateurs IA de niveau 0 (R-08) ni sur la garde de comparaison du manifeste (R-07). C'est le mécanisme de T-10 : les PRD des lots 2 à 4 l'ignoreront.
- **Correction suggérée :** Étendre C13 (« exporter, importer et effacer par organisation », classement lecture seule, idempotence des vérifications, export exempté) et C12 (interrupteur déclaré au manifeste, support nommé) ; §8.4 « contrat §6 : 13 lignes » ; C12/C13 dans les deux PRD frères ; C1 décrit le manifeste du moteur lui-même ; une ligne pour les indicateurs IA de niveau 0.
- **Étiquette :** `reecriture`

#### U-12 · high · `decision-PO` — Interrupteurs de changement : sur site, empilement, forme des données

- **Sévérité max :** high
- **Origine :** A-N-18 (high), A-N-19 (high), C-N-18 (medium, support du mécanisme)
- **Touche :** FR-17 (deux variantes), FR-18, FR-21, C12
- **Écart :** Une seule ligne de version : les interrupteurs arrivent aussi sur site, où personne ne dit qui les allume ni quand — éteints pour toujours (version cachée par instance), allumés seuls à la date limite (changement dans le réel sans l'accord du DSI) ou allumés à la promotion (non écrit). Sur la plateforme, des fenêtres plus rapprochées que 30 jours empilent les interrupteurs (2ⁿ combinaisons non testées) ; un interrupteur qui change la forme des données, allumé au 10ᵉ jour, sort de la fenêtre C12 ; personne ne classe ce qui est « visible des utilisateurs ».
- **Correction suggérée :** Le PO choisit la règle sur site (forcés à leur position finale à la promotion, ou date limite = date choisie par le DSI). Puis : au plus les interrupteurs d'une version ouverts à la fois, date limite antérieure à la fenêtre suivante ; interdiction de changer la forme des données ; manifeste `interrupteurs: [...]` et revue obligatoire ; test de conformité.
- **Étiquette :** `decision-PO`

#### U-13 · high · `decision-PO` — Retour arrière : `AVEC_PERTE` sur la plateforme et en automatique, promotions rapprochées, durée

- **Sévérité max :** high
- **Origine :** A-N-20 (high), A-N-21 (high), A-N-23 (medium), A-N-24 (medium), G-N-21 (low) ; repris : F-02 (partiel), F-20 (partiel)
- **Touche :** §1, FR-17, FR-18, FR-19, FR-40, NFR-7, NFR-9, C12
- **Écart :** Sur la plateforme, une version `AVEC_PERTE` est promue sans bandeau et son retour arrière global efface les saisies de tous les distributeurs ; en automatique (santé en échec, promotion interrompue), elle restaure sans que personne l'ait décidé. Deux promotions dans la même fenêtre de 7 jours font perdre des données ; revenir sous un correctif de sécurité rouvre la faille ou est refusé, sans règle. C12 ne couvre que les champs (pas les nouvelles valeurs d'énumération, événements, `@2`, re-promotion). Un « clic » `AVEC_PERTE` peut durer 4 h ; un retour arrière interrompu n'a pas d'état. §1 promet encore « sans rien perdre ».
- **Correction suggérée :** Le PO choisit : `AVEC_PERTE` interdite sur la plateforme, ou fenêtre dédiée avec accord écrit et préavis. Puis : l'automatisme d'une version `AVEC_PERTE` s'arrête et alerte ; une version hérite du pire `retourArriere` ; contraction seulement quand la fenêtre de la version qui a ajouté est close partout, retour arrière d'un pas ; règle nommée pour les correctifs ; C12 étendue et test « re-promouvoir » ; durées affichées avant le clic ; retour arrière = plan enregistré (FR-40) ; réserve au §1.
- **Étiquette :** `decision-PO`

#### U-14 · high · `decision-PO` — Correctifs critiques pour les versions figées, maintenance datée module par module

- **Sévérité max :** high
- **Origine :** A-N-22 (high), A-N-05 (high), G-N-13 (medium) ; repris : F-18 (partiel)
- **Touche :** §1, §3.1 axe 1, FR-14, FR-19, FR-21, FR-32, C6, SM-6
- **Écart :** Livrer les correctifs critiques à toute instance figée revient à maintenir à vie un portage par version figée distincte (N-5, N-3…) : la négation de la ligne unique (C6) et de « sans dix produits », coût absent de l'ordre de sacrifice ; « critique » n'est pas défini. `VERSION_FIGEE` est un état de l'instance, mais la licence date la maintenance module par module : entre deux dates, l'instance est figée ou non ? On ne dit toujours pas si une instance figée envoie son signal ni si `GEL` et `VERSION_FIGEE` cumulés alertent le DG à vie.
- **Correction suggérée :** Le PO borne l'engagement (fenêtre de support, ex. 24 mois, au-delà « hors correctifs » et DG prévenu ; ou correctifs conditionnés au rattrapage N-1) et choisit maintenance par instance ou par module (gel à la première échéance, échéances alignées par la vente) ; définir « critique » ; inscrire le coût au §8.
- **Étiquette :** `decision-PO`

#### U-15 · high · `reecriture` — Connecteurs en essai : liste blanche, identifiants en lecture seule, aller-retour, messages d'identité

- **Sévérité max :** high
- **Origine :** A-N-28 (high), G-N-10 (medium), G-N-11 (medium), A-N-29 (medium), A-N-30 (medium), C-N-12 (medium)
- **Touche :** FR-6, FR-9, FR-10, FR-33, UJ-3, UJ-5 ; PRD Connecteurs
- **Écart :** La cascade de FR-9 fonctionne par liste noire (seules les destinations déclarées du réel sont refusées) et « bac à sable vérifié » n'a pas de critère. La lecture du vrai logiciel exige des identifiants du vrai logiciel, que FR-9 interdit. L'interception casse la synchronisation aller-retour (pas d'accusé) et vaut pourtant 🟢. Le rafraîchissement envoie des données personnelles réelles dans le bac à sable du client. L'interception totale empêche l'invitation et le code de connexion du prospect autonome. Le PRD Connecteurs ne reprend rien de FR-9.
- **Correction suggérée :** Garde en liste blanche ; critère de « vérifié » (confirmation écrite + base distincte) ; identifiants **en lecture seule** propres à l'essai, écriture testée et refusée ; ligne 🟠 « aller-retour non vérifié » et vérification dans le réel à la mise en service ; accord ou masquage pour le bac à sable ; exception nommée pour les messages d'identité de l'essai ; FR-9 « doit reprendre » et ajouts au PRD Connecteurs (cascade, comportement en `LECTURE_SEULE`) validés ensemble le 13/11.
- **Étiquette :** `reecriture`

#### U-16 · high · `decision-PO` — Apprentissage sur la plateforme : clause d'adhésion, AD-P16, SM-4 aveugle

- **Sévérité max :** high
- **Origine :** A-N-31 (high), G-N-17 (medium) ; repris : F-25 (partiel), R-18 (partiel)
- **Touche :** §4.C, FR-27, SM-4, §8.2, §8.4 ; AD-P16, contrat C11 §5
- **Écart :** La clause unique du contrat d'abonnement n'est ni libre ni spécifique, ne couvre pas les clients du distributeur, et « Money Vibes reste couverte par la loi » est une conclusion juridique non validée présentée comme acquise. Sur la plateforme, une lecture « d'exploitation » par AD-P16 lit les mêmes données sans passer par la garde du registre : SM-4 vaut zéro par construction. §8.4 n'amende ni AD-P16 ni C11 §5.
- **Correction suggérée :** Le PO fait de la validation juridique de la clause un point ouvert daté, avec propriétaire ; clause par finalités, une ligne de registre par finalité ; retirer « reste couverte par la loi » ; compte de service IA dédié dont toute lecture passe par la garde, pas d'export en masse pour l'exploitation ; SM-4 alimenté aussi par le journal d'AD-P16 ; §8.4 amende AD-P16 et C11 §5.
- **Étiquette :** `decision-PO`

#### U-17 · high · `decision-PO` — Sauvegardes : clé « détenue par le client » contre automatismes, RPO de la plateforme

- **Sévérité max :** high
- **Origine :** A-N-32 (high), G-N-14 (medium)
- **Touche :** NFR-7, FR-17, FR-18, FR-25 ; journal l. 85
- **Écart :** Retour arrière automatique, restauration `AVEC_PERTE`, test mensuel et bilan d'instance doivent déchiffrer sans personne : la clé est sur l'instance (et « détenue par le client » ne veut rien dire) ou les automatismes sont impossibles ; clé perdue, RTO jamais tenu. Le PO a décidé RPO 1 h sans restriction ; NFR-7 donne à la plateforme « une sauvegarde par jour », soit 24 h de perte possible pour le distributeur de février, marqué seulement `[ASSUMPTION]`. Le lieu de la copie hors machine n'est pas dit.
- **Correction suggérée :** Le PO valide un RPO/RTO explicite pour la plateforme (ou l'écart). Puis : clé d'exploitation scellée sur l'instance + clé de secours détenue par le client, séquestre ou procédure de perte ; lieu de la copie hors machine (locaux du client, autre support).
- **Étiquette :** `decision-PO`

#### U-18 · high · `reecriture` — Feu vert de la Reprise trop large ; jonction avec le PRD Reprise

- **Sévérité max :** high
- **Origine :** G-N-04 (high), C-N-13 (medium) ; repris : R-16 (partiel)
- **Touche :** FR-7, FR-8, FR-11, §3 « Mettre en service », « Réception définitive » ; PRD Reprise (FR-3, FR-15, FR-19, C8, QR-2)
- **Écart :** FR-8 refuse toute mise en service sans feu vert de la Reprise, alors que FR-7 rend la Reprise facultative et FR-11 permet de mettre en service le jour même un module sans reprise : un client sans Reprise ne passe jamais En service. Côté Reprise : la réception définitive est par reprise, celle du moteur par sous-ensemble (quels lots libérés ?) ; Reprise C8 met ses écrans « plus tard » dans `prospera-app` ; l'effacement du prospect n'y figure pas.
- **Correction suggérée :** « refusée tant que la Reprise, quand l'offre l'inclut et que le sous-ensemble a un lot de reprise, n'a pas donné son feu vert » ; §3 aligné ; ligne « PRD Reprise » du §8.4 complétée (C8 en `prospera-app` dès février, réception par sous-ensemble = libération de ses lots, effacement du prospect via C13).
- **Étiquette :** `reecriture`

#### U-19 · high · `reecriture` — Licence et clés : clé compromise, compteur, vérification quotidienne qui « n'envoie aucune donnée »

- **Sévérité max :** high
- **Origine :** A-N-15 (high), G-N-18 (medium), C-N-16 (medium), A-N-17 (low) ; repris : F-41 (partiel)
- **Touche :** FR-14, FR-16, FR-41, NFR-8
- **Écart :** Une licence numéro 2⁶³ signée par une clé compromise verrouille l'instance contre toutes les licences légitimes futures ; le fichier d'urgence ne dit pas qu'il réinitialise le compteur ; une instance coupée ne reçoit jamais la révocation. La vérification quotidienne « n'envoie aucune donnée » mais doit s'identifier pour recevoir la licence de FR-41 « en 24 heures » ; la « réponse au prochain contact » n'existe pas quand le contact est un fichier.
- **Correction suggérée :** Compteur par clé de signature ou saut borné ; fichier d'urgence signé par la racine qui réinitialise le plus haut numéro et révoque ce que la clé a signé ; clés à validité courte pour les licences courtes ; FR-16 « n'envoie que l'identifiant de l'instance, sa version et le numéro de sa licence » (niveau 0), ou FR-41 ramenée au signal hebdomadaire.
- **Étiquette :** `reecriture`

### Gravité medium (9)

#### U-20 · medium · `decision-PO` — Ordre de sacrifice partiel, §8.2 « Aucun » point ouvert

- **Sévérité max :** medium
- **Origine :** A-N-35 (medium), G-N-28 (low) ; repris : G-02 (partiel), M-10 (partiel), F-36 (partiel)
- **Touche :** §0, §8.2, §8.3, §8.4
- **Écart :** L'ordre de sacrifice est lui-même un `[ASSUMPTION : à valider par le PO]`, absent de l'index §8.3 ; environ 25 exigences ne sont ni sacrifiables ni protégées ; sacrifier le poste d'accès (FR-29) retire l'enregistrement de session tout en gardant le niveau 2 ; FR-15 et NFR-7 sont « jamais sacrifiés » sans mécanisme chiffré ; la charge de Dev B n'est chiffrée nulle part. §8.2 annonce « Aucun » point ouvert alors que la clause unique, D3, C12/C13, l'horloge et la suspension d'un acheteur restent ouverts ; §8.3 n'a ni propriétaire ni date ; toujours aucun `[NOTE FOR PM]`.
- **Correction suggérée :** Le PO valide l'ordre de sacrifice et classe chaque FR/NFR (jamais / sacrifiable avec ordre / dégradable avec version minimale) ; remplacer le 4ᵉ sacrifice par « niveau 2 fermé jusqu'à FR-29 » ; §8.2 = liste réelle des points ouverts avec propriétaire et date, et `[NOTE FOR PM]` ; trier §8.3 en « à confirmer vendredi » / « laissé à l'architecture ».
- **Étiquette :** `decision-PO`

#### U-21 · medium · `reecriture` — §8.4 et amendements du contrat incomplets

- **Sévérité max :** medium
- **Origine :** G-N-23 (medium), C-N-15 (medium) ; repris : R-02 (partiel), R-05 (partiel)
- **Touche :** §8.4, §3 (Installer, Pack, Suspendre), frontmatter ; contrat §0/§1, C1, C6, C8, C11 §5
- **Écart :** §8.4 n'adresse rien à STORY-280, à `paiement-service` (topic renommé, dépendances résolues à la vente), à AD-P16, à la garde C6, à C8. Il ne liste pas non plus les définitions du contrat que le PRD change : Installer (« poser `ACTIVE` » contre « dans l'espace d'essai »), Pack (`VerticalPack`), Suspendre (« impayé, STORY-280 »), forme de `depends`. Le frontmatter (`service: platform-catalog-service`) et le titre parlent encore pour tout le moteur.
- **Correction suggérée :** Ajouter ces lignes au §8.4 (contrat §0/§1, C1, C8, C11 §5, garde C6, STORY-280/281, `paiement-service`, AD-P16) ; corriger frontmatter et titre.
- **Étiquette :** `reecriture`

#### U-22 · medium · `reecriture` — Indicateurs : SM-6 et SM-7 sans instrument

- **Sévérité max :** medium
- **Origine :** G-N-27 (medium) ; repris : G-04 (partiel), F-32 (partiel), F-33 (partiel)
- **Touche :** §6 (SM-1, SM-6, SM-7), NFR-5
- **Écart :** SM-6 se mesure par une « garde C6 en CI » qui n'existe pas et qu'aucune FR ne crée : la cible « 0 » est atteinte par défaut. SM-7 vise « en baisse » sans source ni seuil. Le « journal des promotions » ne voit pas un changement passé hors promotion ; les bornes du chronomètre de NFR-5 ne sont pas fixées.
- **Correction suggérée :** Garde C6 au §8.4 ; SM-7 mesuré par le plan d'installation (FR-40) avec seuil (2ᵉ ≤ 50 % du 1ᵉʳ) ; bornes de NFR-5 ; test d'intrusion de la sonde.
- **Étiquette :** `reecriture`

#### U-23 · medium · `reecriture` — Plateforme : espace d'essai partagé, majeure, rafraîchissement, vagues, version épinglée

- **Sévérité max :** medium
- **Origine :** G-N-16 (medium), A-N-26 (medium), A-N-25 (medium), C-N-21 (low)
- **Touche :** FR-8, FR-10, FR-17, FR-20, FR-21, FR-33, §3 « Version de plateforme »
- **Écart :** Sur la plateforme, l'essai est partagé : une répétition en cours rejoue un dossier N+1 vers un réel en N, et le rafraîchissement « obligatoire avant une majeure » mais « refusé pendant une répétition » laisse une seule organisation bloquer la majeure de toutes ; les essais prospects ne sont pas migrés. Un pilote qui attend ou un retour arrière de confort bloque toutes les vagues ; la place de la plateforme dans les vagues n'est pas dite. `versionCode` est épinglé par organisation, la promotion « pour toutes » ne dit pas le réécrire.
- **Correction suggérée :** Rafraîchissement obligatoire avant que l'organisation n'essaie la majeure ; répétitions et essais prospects migrés ; dossier rejoué vers la même version seulement ; attente du pilote bornée, incident qualifié ; plateforme placée dans les vagues ; promotion = mise à jour journalisée de `versionCode`.
- **Étiquette :** `reecriture`

#### U-24 · medium · `decision-PO` — Dépendances : majeure qui ajoute une dépendance non souscrite, propagation d'un pack, cycles

- **Sévérité max :** medium
- **Origine :** G-N-15 (medium), A-N-27 (medium), C-N-19 (low) ; repris : F-11 (partiel), F-12 (partiel)
- **Touche :** FR-2, FR-4 (chemin 3), FR-12, FR-21, FR-38
- **Écart :** FR-38 calcule l'écart de dépendances sans dire la suite : refuser la majeure fait sortir le client de la fenêtre N-1 sans faute de sa part, l'installer d'office contredit « le contrat fait foi ». La propagation d'un pack modifié aux contrats existants n'est pas définie ; l'annulation d'une dépendance partagée par deux demandeurs non plus. Un cycle ne se détecte pas dans la CI d'un seul dépôt.
- **Correction suggérée :** Le PO choisit : dépendance dure fournie sans facturation (amendement automatique) ou majeure non publiable ; propagation d'un pack aux nouveaux contrats seulement, les autres par avenant. Puis : code nommé ; règle de comptage pour une dépendance partagée ; cycle refusé par le catalogue à la publication.
- **Étiquette :** `decision-PO`

#### U-25 · medium · `reecriture` — Effacement du prospect et désinstallation

- **Sévérité max :** medium
- **Origine :** A-N-33 (medium), G-N-25 (low), G-N-22 (low), A-N-36 (low) ; repris : F-22 (partiel), F-21 (partiel)
- **Touche :** FR-33, FR-39, NFR-4, NFR-7, §3 « Rappel »
- **Écart :** Le certificat d'effacement est remis alors que les sauvegardes gardent les données environ 90 jours ; effacer les journaux nominatifs contredit NFR-4 (ajout seul). La chronologie n'a pas de rappel en cas de prolongation, ni de règle de prolongation après fermeture, ni de destinataire ; « J+23 rappel » emploie un terme défini pour l'abonné. FR-39 garde les copies voisines mais affiche l'emplacement vide, sans durée de conservation.
- **Correction suggérée :** Certificat daté de l'expiration de la dernière sauvegarde (ou chiffrement par organisation et destruction de clé) ; journaux pseudonymisés ; rappel à J-7 de chaque fin, destinataire nommé, prolongation avant fermeture seulement ; autre mot que « rappel » ; « copies stockées et masquées » ; durée de conservation renvoyée à la politique d'effacement.
- **Étiquette :** `reecriture`

#### U-26 · medium · `reecriture` — Santé d'un module en service : un prérequis qui disparaît

- **Sévérité max :** medium
- **Origine :** A-N-04 (medium) ; repris : F-01 (partiel)
- **Touche :** §3.1 axe 2, FR-16, FR-34, FR-40
- **Écart :** Clé PI-SPI révoquée, numéro WhatsApp banni : le module reste `EN_SERVICE` 🟢. La santé par module de FR-16 n'apparaît ni dans l'état publié, ni dans le bilan, ni dans les bandeaux. Restent aussi sans réponse le module 🟢 en essai et 🔴 au rejeu, et l'état « interrompue » de FR-40.
- **Correction suggérée :** Attribut `sante: OK | DEGRADE{raison, action}` orthogonal à l'état publié dans FR-34 (bandeau administrateur, ligne 🔴 dans la supervision), sans fermeture automatique ; état du rejeu en échec et de la promotion interrompue.
- **Étiquette :** `reecriture`

#### U-27 · medium · `reecriture` — Parcours, vocabulaire et résidus de texte

- **Sévérité max :** medium
- **Origine :** G-N-07 (medium), G-N-08 (medium), C-N-10 (medium), G-N-24 (low), G-N-30 (low), A-N-37 (low) ; repris : M-6 (partiel), R-19 (partiel), R-29 (partiel), F-35 (partiel), F-43 (partiel)
- **Touche :** UJ-4, §1, §3, 4.A, 4.B, FR-5, FR-7, FR-11, FR-14, FR-15, FR-22, §4.C
- **Écart :** UJ-4 installe deux modules hors contrat dans le parcours censé illustrer « le contrat fait foi ». FR-22 met encore l'écran « fichier » dans la console. « Délai de grâce » est l'homonyme de la grâce de `paiement`. Résidus : §1 « sans rien perdre », 4.A « tout vert », 4.B « mêmes étapes », FR-5 « sans effet de bord », FR-7 « PDF reçu », FR-11 « promu », `LICENCE_PERIMEE` ; renvoi cassé vers FR-30 ; identifiants de revue (G-09, T-01…) dans le texte produit ; « bascule » toujours hors glossaire ; §3 « cette seule organisation » sur site.
- **Correction suggérée :** Faire signer à Moussa Terrain & Ventes + Relances + Encaissements ; FR-22 « `prospera-app`, Administration » ; « délai de silence » ; corriger chaque résidu ; « décision du PO, 2026-11-10 » à la place des identifiants de revue ; définir « bascule » ; passe de recherche des termes du §3.
- **Étiquette :** `reecriture`

#### U-28 · medium · `reecriture` — Canal de données : schéma du signal, ré-identification, registre, purge

- **Sévérité max :** medium
- **Origine :** G-N-29 (low) ; non résolus du passage 1 : F-27 (medium), F-28 (medium), F-29 (medium) ; repris : F-26 (partiel)
- **Touche :** FR-26, FR-27, FR-28, FR-30
- **Écart :** FR-26 « un test le vérifie sur chaque envoi » reste irréalisable sans schéma fermé du signal ; FR-28 ne dit rien de la ré-identification par recoupement (identifiants de dossier, seuil d'effectif). Où vit le registre, comment est prouvée la désignation écrite, comment est signé le consentement : rien (aggravé par U-08). Ni purge des contributions non consommées, ni durée de conservation chez Money Vibes. La grille juge ce reste non bloquant pour février.
- **Correction suggérée :** Schéma fermé du signal et test qui échoue si un champ non déclaré sort ; règle de ré-identification (sel, jointure, k-anonymat) ; lieu et preuve du registre ; purge et durée de conservation des contributions.
- **Étiquette :** `reecriture`

## Progrès depuis le passage 1

**Note :** passage 1 **Poor** (5 thèmes critical, 3 dimensions *thin*) → passage 2 **Poor** (4 thèmes critical, 0 dimension *thin*). Un seul constat critical suffit à fixer la note ; sans les 5 constats critical du passage 2, elle serait *Fair* (des constats high subsistent ; *Good* exige qu'il n'y en ait plus).

### Suivi des constats du passage 1, par revue

| Revue | Suivis | Résolus | Partiels | Non résolus | Nouveaux (c · h · m · l) |
|---|--:|--:|--:|--:|---|
| Grille (`review-rubric.md`) | 35 | 27 | 8 | 0 | 30 (1 · 5 · 14 · 10) |
| Adversariale (`review-adversarial-general.md`) | 43 | 20 | 20 | 3 | 37 (3 · 16 · 14 · 4) |
| Cohérence (`review-coherence-contrat.md`) | 29 | 14 | 14 | 1 | 21 (1 · 5 · 12 · 3) |
| **Total** | **107** | **61** | **42** | **4** | **88 (5 · 26 · 40 · 17)** |

La grille suit 25 constats et 10 notes mécaniques ; elle numérote 26 nouveaux constats (1 · 5 · 12 · 8). Quatre constats de dimension sans numéro y sont ajoutés ici (G-N-27 à G-N-30), et G-N-23 (« §8.4 incomplet ») est porté à medium, sévérité de la dimension Scope.

- **Partiels — grille :** G-02, G-04, G-13, G-18, G-19, G-20, M-6, M-10
- **Partiels — adversariale :** F-01, F-02, F-04, F-11, F-12, F-15, F-16, F-18, F-20, F-21, F-22, F-25, F-26, F-32, F-33, F-35, F-36, F-37, F-41, F-43
- **Partiels — cohérence :** R-02, R-03, R-05, R-06, R-07, R-12, R-14, R-16, R-17, R-18, R-19, R-26, R-27, R-29
- **Non résolus :** F-27, F-28, F-29 (canal de données → U-28) ; R-08 (indicateurs IA de niveau 0 → U-11)

### Verdicts de dimension

| Dimension | Passage 1 | Passage 2 |
|---|---|---|
| Decision-readiness | adequate | **adequate** |
| Substance over theater | strong | **strong** |
| Strategic coherence | adequate | **adequate** |
| Done-ness clarity | thin | **adequate** |
| Scope honesty | thin | **adequate** |
| Downstream usability | thin | **adequate** |
| Shape fit | adequate | **adequate** |

### Thèmes consolidés

- **Passage 1 :** 30 thèmes (5 critical · 20 high · 5 medium) — 4 `bloque-coque` · 13 `decision-PO` · 13 `reecriture`.
- **Passage 2 :** 28 thèmes (4 critical · 15 high · 9 medium · 0 low) — 5 `bloque-coque` · 11 `decision-PO` · 12 `reecriture`.
- **Filiation :** T-01 (états, lecture pour la coque) → U-01, U-03, U-06, U-07 ; T-04 (horloge, licence) → U-04, U-19 ; T-05 (consentement, AD-P16) → U-16 ; T-06 (STORY-727) → U-01, U-10 ; T-07 (droits de tenant) → U-08 ; T-09 (« pack ») → U-10 ; T-10 (obligations de module) → U-11 ; T-11 (feu vert) → U-18 ; T-15 (échu, suspension) → U-02, U-06 ; T-02 (connecteurs) → U-15 ; T-03 (retour arrière) → U-13 ; T-16 et T-20 (gel, version figée, correctifs) → U-14 ; T-13 (plateforme contre DSI) → U-12, U-23 ; T-18 (contrat ↔ dépendances) → U-24 ; T-14 (effacement) → U-07, U-25 ; T-19 (périmètre, §8) → U-20 ; T-21 (sauvegardes) → U-17 ; T-23 (canal de données) → U-28 ; T-28 (indicateurs) → U-22 ; T-30 (vocabulaire) → U-27. T-08, T-12, T-17, T-22, T-24 → T-27 et T-29 n'ont plus de descendant de gravité propre.

## Dimension verdicts

- Decision-readiness — adequate
- Substance over theater — strong
- Strategic coherence — adequate
- Done-ness clarity — adequate
- Scope honesty — adequate
- Downstream usability — adequate
- Shape fit — adequate

## Findings by severity

### Critical (5)

**[Downstream usability]** — G-N-01 · Les chemins de droits 2 → 6 posent un `ACTIVE` que l'état publié ne sait pas représenter (§3.1 axe 2 et « état publié », FR-4, FR-11, FR-12, FR-14, FR-34)
§3.1 : « Le droit `ACTIVE` n'est posé qu'à l'entrée en `INSTALLE` … Seuls les chemins de droits nommés de FR-4 font exception », puis « L'axe 2 prime ». Un module ouvert par l'échéance soldée (727 lot 2), le socle de vertical (lot 7), la propagation d'un pack (lot 6) ou la licence est donc `ACTIVE` au catalogue mais `NON_INSTALLE` sur l'axe 2 : menu caché, garde ouverte. Le test en matrice de FR-34 échoue par construction. (a) Le distributeur de février paie sa première échéance ⇒ tous ses modules sont ouverts dans l'**espace réel** avant toute répétition générale, contre la décision T-01 du PO ; (b) sur site, la licence est projetée en droits sans dire dans quel espace ; (c) FR-12 dit « devient **installable** », FR-4 et §3.1 « `ACTIVE` » ; (d) la parenthèse du §3.1 oublie les chemins 3 et 6.
Fix: Distinguer **souscrit** (contrat, paiement, licence, socle : droit d'installer) et **ouvert** (`ACTIVE`, posé par la mise en service, ou directement pour les seuls chemins dont c'est la raison d'être) ; donner, pour chaque chemin de FR-4, l'espace touché et l'état publié obtenu (option (a) de G-13).

**[Adversarial]** — A-N-01 · Un droit sans installation est soit invisible, soit une porte dérobée (§3.1 « L'état publié », §3.1 axe 2, FR-4 chemins 2 à 6)
Échéance soldée, socle de vertical, opérateur, licence : chacun pose `ACTIVE` **sans** passer par l'axe 2 ; comme l'axe 2 prime, l'état publié vaut `NON_INSTALLE`. Deux lectures, toutes deux fausses : soit ces chemins **n'ouvrent rien** (le socle n'est jamais visible, le paiement de 727 lot 2 déjà codé n'a plus d'effet) ; soit les services lisent `entitlement.changed`, voient `ACTIVE` et **ouvrent quand même** — sans prérequis, sans bilan, sans feu vert, menu caché contre garde ouverte. Sur site, une licence peut rendre `ACTIVE` un module dont le conteneur n'est même pas déployé.
Fix: Les chemins 2 à 6 n'agissent **que sur l'axe 3** ; un module payé mais non installé se publie « acquis, à installer » (console Money Vibes seulement) ; le socle de vertical est **installé** par le chemin 1 automatisé ; ajouter à la matrice de FR-34 « droit `ACTIVE` × axe 2 `NON_INSTALLE` ».

**[Adversarial]** — A-N-09 · Restaurer une sauvegarde rembobine tout ce que le PRD croit irréversible (FR-15, FR-14, FR-18, FR-27, NFR-4, NFR-7)
Horloge scellée, plus haut numéro de licence vu, registre des consentements et journal en ajout seul vivent **sur le disque de l'instance** ; le client détient la clé des sauvegardes et l'hyperviseur. Restaurer un instantané de six mois donne : une horloge rembobinée, un compteur de licence rembobiné (l'ancienne licence redevient acceptable), un retrait de consentement qui n'a jamais eu lieu, un journal amputé. Pas besoin de tricher : le retour arrière `AVEC_PERTE` déclenché par Money Vibes produit exactement ces effets.
Fix: Un **état de confiance** (horloge, plus haut numéro, registre, journal) hors du périmètre restauré, qui n'avance que, rapporté à Money Vibes à chaque contact ; refus de licence et d'export si l'état a reculé. Tests : restaurer une sauvegarde ancienne, puis vérifier que l'ancienne licence reste refusée, que le retrait tient, que l'échéance tombe à la même date.

**[Adversarial]** — A-N-10 · L'horloge scellée ne protège rien si les gardes lisent l'horloge du système (FR-15, FR-34, §3.1 (`EXPIRED` calculé, STORY-609))
Les passages `PREAVIS` → `LECTURE_SEULE`, fin d'essai et fin de grâce sont déclenchés par le **temps** ; personne n'émet `entitlement.changed` à l'échéance. Chaque garde C2 calcule donc `EXPIRED` avec l'horloge de **son** conteneur, que le client peut reculer : le menu affiche « lecture seule », la garde accepte les écritures. FR-15 est contourné sans toucher au moteur, et le test « menu et garde ne se contredisent jamais » ne le voit pas. La promesse « en moins d'une minute » de FR-34 tombe aussi.
Fix: Le moteur (l'agent sur site) **émet un événement** à chaque transition temporelle, à l'heure scellée ; les gardes ne calculent **jamais** une échéance sur leur propre horloge. Amender C2 ; ajouter à la matrice de FR-34 « date système reculée de 40 jours ».

**[Cohérence contrat]** — C-N-01 · L'impayé suspend dans le code et la décision du PO, mais le PRD le fait passer par un préavis (§3 « Suspendre », §3.1 axe 3, FR-32, FR-41)
`echeancier.ts` pose `PREAVIS` à J-7 et `IMPAYE` à J+7 ; `IMPAYE` publie `paiement.abonnement.impayee`, et `suspension-par-impaye.service.ts` passe **automatiquement** en `SUSPENDED` (`motif: IMPAYE`) tous les droits à terme du contrat (« arbitrage PO du 2026-11-08 »). Sur la plateforme aujourd'hui : J0 `EXPIRED`, J+7 `SUSPENDED` (caché). Le PRD promet 30 jours où « tout fonctionne », puis une lecture seule **sans fin**, et réserve la suspension à une décision humaine. Le memlog (T-15) ne dit pas que la décision du 08/11 est abandonnée ; §8.4 ne cite ni STORY-280, ni 281, ni le jalon `IMPAYE`, ni le consommateur. La spine ne peut pas savoir si un impayé produit `PREAVIS` ou `SUSPENDU`.
Fix: Faire trancher le PO. (a) **Le PRD l'emporte** : §8.4 « STORY-280/281 : l'impayé ne suspend plus ; consommateur retiré ou réservé à la sanction », et sort de la grâce de 281. (b) **Le code l'emporte** : §3.1 écrit `PREAVIS` de J0 à J+7 puis `SUSPENDU`, FR-32/FR-41 corrigées. Dans les deux cas, définir « impayé persistant » par une durée.

### High (26)

**[Decision-readiness]** — G-N-02 · Impayé : STORY-280 contre FR-32/FR-41, deux décisions du PO non confrontées (§3 « Suspendre », §3.1 axe 3, FR-32, FR-41, §8.4)
STORY-280 (`Status: done`, « arbitrage PO 2026-11-08 ») fait passer **automatiquement** `SUSPENDED` tous les modules du contrat sur `paiement.abonnement.impayee` (J+7 après l'échéance). Le PRD dit au contraire « Un impayé suit le chemin de FR-32 (préavis, puis lecture seule). La suspension complète (`SUSPENDU`) reste une sanction décidée par Money Vibes » (FR-41), tout en citant STORY-280 comme source de `SUSPENDU`. Le même impayé produit donc `SUSPENDED` à J+7 sur `dev` et `PREAVIS` jusqu'à J+30 dans le PRD. §8.4 amende 727 lot 4 mais pas 280. Le titre de FR-41 annonce en outre un état d'**instance** que le §3.1 n'a pas.
Fix: Une ligne qui dit laquelle des deux décisions prime ; si FR-32 prime, ajouter STORY-280 au §8.4 ; définir ce qu'est un « impayé décidé » (qui, quand) ; renommer FR-41 « Faire respecter l'échéance hors ligne ».

**[Done-ness clarity]** — G-N-04 · Le feu vert de la Reprise bloque toute mise en service, même sans Reprise (FR-8, FR-7, FR-11, §3 « Mettre en service »)
FR-8 : « La mise en service est **refusée** tant que la Reprise de données n'a pas donné son feu vert … `MISE_EN_SERVICE_SANS_FEU_VERT` (409) ». Or FR-7 : sans Reprise dans l'offre, seulement « un avertissement à lire, non bloquant » ; FR-11 : « Un module sans reprise de données peut être promu le jour même ». Tel qu'écrit, un client sans Reprise ne passe jamais En service, et un module ajouté à un client déjà En service attend un feu vert qui ne viendra pas.
Fix: « refusée tant que la Reprise, **quand l'offre l'inclut et que le sous-ensemble mis en service a un lot de reprise**, n'a pas donné son feu vert » ; aligner la définition du §3.

**[Done-ness clarity]** — G-N-06 · Le prospect après la fin de l'essai : « l'accès se ferme » mais il doit exporter (FR-33, §3.1 axe 3, FR-36)
FR-33 : « À son terme, l'accès se ferme » puis « → **30 jours pour exporter** ou signer ». Comment exporte-t-il sans accès ? L'axe 3 écrit « fin de l'essai → fermé », un état qui n'existe ni dans l'axe 3 ni parmi les huit états publiés : la coque ne sait pas quoi afficher pendant ces 30 jours.
Fix: Un état `ESSAI_TERMINE{effaceLe}` (export seul, bandeau « effacement le … ») dans l'axe 3 et dans la table publiée, ou dire que l'export passe par Money Vibes.

**[Scope honesty]** — G-N-05 · De nouvelles obligations de module échappent à C13 (FR-17, FR-32, FR-35, FR-6, FR-38, §0, §7 C13)
C13 est défini comme « prérequis, vérifications, santé, interception en essai, export et effacement par organisation ». Mais la réécriture impose à chaque module, sans clause : un **interrupteur de changement par organisation** avec date limite (FR-17) ; le **classement de ses routes et de ses droits** en consultation / export / écriture pour la lecture seule (FR-32, FR-35) ; une **clef d'idempotence par vérification** (FR-6) ; l'ouverture de son **export** malgré une garde 403. C'est exactement le mécanisme de T-10 : les PRD des lots 2 à 4 l'ignoreront.
Fix: Étendre la liste de C13 (ou C2 pour la lecture seule) et la reporter au §8.4.

**[Downstream usability]** — G-N-03 · La règle de visibilité et la lecture seule contredisent C8 et C2, et l'export passe sous une garde 403 (§3.1 table, FR-32, FR-33, FR-39, §8.4)
C8 : « Une entrée est visible **si et seulement si** l'entitlement effectif est `ACTIVE` » ; la table publiée rend `LECTURE_SEULE` (`EXPIRED` calculé) **visible**. C2 : refus de **toute** route métier hors `ACTIVE`, test e2e « expiré ⇒ 403 » ; FR-32 ouvre lecture, recherche, export et états réglementaires. §8.4 ne demande rien pour C8, or la spine de la coque part de C8. FR-39, FR-33 et FR-32 exportent depuis des états dont la garde rend 403 : par quelle route ?
Fix: §8.4 « C8 : visible ssi l'état publié ∈ {`EN_SERVICE`, `ESSAI_PROSPECT`, `PREAVIS`, `LECTURE_SEULE`} et l'utilisateur a le droit » ; C2 : lecture seule par catégorie ; nommer la route d'export C13 **exemptée de la garde** et réservée au droit `instance:donnees:exporter`.

**[Adversarial]** — A-N-02 · L'axe 3 est-il un automate ou un jeu de drapeaux ? et l'essai fermé n'a pas d'état (§3.1 axe 3 et ordre de priorité, FR-33)
La table décrit un **automate** ; un ordre de priorité n'a de sens que si les états **coexistent**. Suspendu pendant le préavis, levée après la date de fin : l'« état antérieur » `PREAVIS{finLe}` a expiré, on rend un état périmé. « Fermé » n'est ni un état de l'axe 3 ni l'un des huit états publiés, alors que FR-33 promet 30 jours pour exporter après la fermeture ; la règle « inconnu ⇒ `NON_INSTALLE` » ferme tout. Ce que publie l'espace réel pour un prospect n'est pas dit.
Fix: Axe 3 **calculé** à partir de faits indépendants (sanction, échéance, fin du préavis), sans « état antérieur » mémorisé ; 9ᵉ état `ESSAI_TERMINE{effacementLe}` ou export par un autre canal.

**[Adversarial]** — A-N-03 · Les vérifications d'un module tournent sans droit (§3.1, FR-6)
Pour sortir de `EN_INSTALLATION`, les vérifications doivent passer ; pour passer, le module doit **fonctionner** (créer des comptes, générer un lien, synchroniser). Mais son droit est absent et sa garde C2 répond 403 : dépendance circulaire. Même problème au rejeu dans le réel.
Fix: Identité de service « moteur d'installation » admise par C2 sur les seules routes de vérification déclarées (C13), ou `ACTIVE` dès le lancement avec fermeture aux utilisateurs par l'état publié seul. Choisir, l'écrire dans C2 et C13.

**[Adversarial]** — A-N-05 · `VERSION_FIGEE` est un état de l'instance, mais la maintenance se date module par module (§3.1 axe 1, FR-14, FR-21)
La licence permet que la maintenance de Sinistres s'arrête en mars et celle de la GED en septembre. Entre les deux, l'instance est-elle figée ? Une version de plateforme se publie d'un bloc : la maintenance encore payée de la GED ne donne rien, ou celle de Sinistres est prolongée gratuitement.
Fix: Maintenance portée par **l'instance** (une seule date), ou par module avec gel à la **première** échéance tant qu'elle n'est pas alignée ; la vente aligne les échéances (prorata dans `paiement-service`).

**[Adversarial]** — A-N-06 · Un module suspendu est plus fermé qu'un module en lecture seule ou désinstallé (§3.1 table (`SUSPENDU`), FR-32, FR-39)
Un client en `SUSPENDU` ne peut ni consulter ni exporter ses propres données, alors qu'un client en lecture seule ou qui a désinstallé le peut. Pour une IMF sur site, la sanction commerciale bloque les états BCEAO que FR-32 garde ouverts : elle crée un manquement réglementaire chez le client, en tension avec la loi 2019-014 et avec « jamais d'écran noir ».
Fix: Dire ce qu'un module suspendu garde ouvert (au minimum export par l'administrateur et le DG, états réglementaires), ou justifier par écrit, avec validation juridique, que la suspension ferme tout.

**[Adversarial]** — A-N-07 · Les droits `instance:*` peuvent s'annuler eux-mêmes, et le consentement échappe au DG (FR-35, FR-36, FR-27)
Si l'intersection « attribués ∩ modules ouverts » s'applique aux droits du moteur, la lecture seule ou une suspension retire au DSI le droit de **déposer la licence** qui lèverait l'état : l'instance s'enferme elle-même. `instance:consentement:donner` est attribuable par l'administrateur, contre FR-27. Sur la plateforme, `instance:mise-a-jour:planifier` et `:revenir` n'ont pas d'objet.
Fix: Droits `instance:*` **hors intersection**, toujours effectifs ; consentement attribuable **par le DG seul**, avec la référence de l'écrit au registre ; masquer les droits sans objet selon l'hébergement.

**[Adversarial]** — A-N-11 · Une horloge qui ne recule jamais ne se corrige jamais (FR-15)
Date système mise **en avance** par erreur (NTP, pile du BIOS en 2036, faute de frappe) : l'horloge scellée l'accepte et ne revient plus. Droit d'utiliser expiré, essai fermé, fenêtre de retour arrière perdue. Rien n'est prévu pour corriger, et l'erreur est **honnête**.
Fix: Borner l'avance acceptée sans preuve (ex. 48 h d'écart, anomalie tracée) ; **correction signée** par Money Vibes, seule capable de reculer l'horloge. Test : avancer de 10 ans, aucune échéance ne tombe.

**[Adversarial]** — A-N-14 · La licence courte fait punir le silence et confond l'impayé avec la fin de contrat (FR-41, FR-15, FR-32, §3 « Suspendre », FR-13)
(1) Un abonné qui **paie** mais dont la liaison est coupée deux mois ne reçoit pas sa licence suivante : préavis, puis lecture seule. Le silence **punit**, le titre de FR-15 est faux pour tous les abonnés sur site ; seul un e-mail manuel le sauve. (2) FR-32 décrit l'échéance **du contrat** ; FR-41 l'applique à chaque **échéance de paiement** : un retard d'un mois déclenche le parcours d'une fin de contrat. (3) Sur site, impayé ⇒ préavis puis lecture seule ; sur la plateforme (STORY-280), ⇒ `SUSPENDU` ; FR-13 promet des refus « identiques ».
Fix: Distinguer **échéance de licence** (technique, renouvelée à chaque contact tant que le compte est à jour) et **échéance du droit d'utiliser** (contractuelle, seule à déclencher FR-32) ; alerte Money Vibes à J-7 d'une licence non renouvelée faute de contact ; un seul parcours de l'impayé, identique sur site et plateforme.

**[Adversarial]** — A-N-15 · Une clé compromise peut verrouiller l'instance contre toutes les licences futures (FR-14, NFR-8)
L'attaquant qui détient une clé compromise émet une licence numéro 2⁶³ : l'instance la retient et **refuse toutes les licences légitimes futures**. Le fichier d'urgence « ré-émet les licences » sans dire qu'il réinitialise le compteur. Une instance coupée ne reçoit jamais la liste de révocation et continue d'accepter la clé.
Fix: Compteur **par clé de signature** ou saut borné ; fichier d'urgence signé par la racine qui **réinitialise** le plus haut numéro ; durée de validité courte des clés qui signent les licences courtes.

**[Adversarial]** — A-N-18 · Les interrupteurs de changement n'ont aucun comportement sur site (FR-17 (plateforme et sur site), FR-21)
Une seule ligne de version : le code qui arrive sur site contient les mêmes interrupteurs. Qui les allume, quand ? Éteints pour toujours : ils survivent à leur date limite et chaque instance dérive vers sa « version cachée ». Allumés seuls à la date limite : le comportement change dans le réel sans l'accord du DSI. Allumés à la promotion : il faut le dire.
Fix: Sur site, interrupteurs **forcés à leur position finale à la promotion** (l'essai du DSI tient lieu d'adaptation), ou date limite = date de promotion ; test de conformité.

**[Adversarial]** — A-N-19 · Interrupteurs, retour arrière à 7 jours et versions successives (FR-17 (plateforme), FR-18, C12)
Si les fenêtres reviennent plus souvent que 30 jours, les interrupteurs **s'empilent** : 2ⁿ combinaisons non testées, « version cachée » pendant 30 jours contre 7 pour C12. Un interrupteur qui **écrit des données dans une nouvelle forme**, allumé au 10ᵉ jour, sort de la fenêtre C12. Personne ne décide ce qui est « visible des utilisateurs ».
Fix: Plafonner les interrupteurs ouverts (une version à la fois, date limite antérieure à la fenêtre suivante) ; interdire qu'un interrupteur change la **forme** des données ; manifeste `interrupteurs: [...]` et revue obligatoire.

**[Adversarial]** — A-N-20 · `AVEC_PERTE` sur la plateforme et dans le retour arrière automatique (FR-18, FR-40, FR-17)
Sur la plateforme, personne ne choisit de date : une version `AVEC_PERTE` est soit interdite, soit promue sans bandeau, et son retour arrière **global** efface les saisies de **tous** les distributeurs. Le retour arrière **automatique** d'une version `AVEC_PERTE` restaure la sauvegarde sans que personne l'ait décidé. Et une version de plateforme est `AVEC_PERTE` dès qu'**un** module l'est, ce que le PRD ne dit pas.
Fix: Interdire `AVEC_PERTE` sur la plateforme, ou fenêtre dédiée avec accord écrit et préavis ; l'automatisme d'une version `AVEC_PERTE` **s'arrête et alerte** ; la version hérite du pire `retourArriere` de ses modules.

**[Adversarial]** — A-N-21 · Deux promotions dans la même fenêtre de 7 jours (FR-18, C12, FR-19)
N+1 promue le jour 0, N+2 le jour 3 : la contraction permise par N+2 supprime ce que N+1 avait ajouté, alors que la fenêtre de N+1 court encore. Un correctif de sécurité promu le jour 2 : si le DSI revient à N, le retour arrière **retire le correctif** et rouvre la faille, ou il est refusé — le PRD ne dit ni l'un ni l'autre.
Fix: Contraction permise seulement quand la fenêtre de la version qui a ajouté est **close partout** ; retour arrière d'**un** pas ; une nouvelle promotion clôt la fenêtre précédente ; correctifs reportés sur N, ou retour arrière sous la version corrigée refusé avec un code nommé.

**[Adversarial]** — A-N-22 · Un correctif pour une version figée, c'est une branche de maintenance par client (FR-19, FR-32, FR-21, C6)
Une instance figée peut être en N-5 ; deux instances figées sur des versions différentes demandent **deux portages**. Money Vibes maintient **à vie** autant de branches que de versions figées : la négation de la ligne unique (C6), un coût que l'ordre de sacrifice ignore. « Critique » n'est pas défini.
Fix: Borner : correctifs seulement pour les versions dans une fenêtre de support (ex. 24 mois), au-delà « hors correctifs » et DG prévenu ; ou correctifs conditionnés à N-1 ; définir « critique » (CVSS ≥ 9, exploitation connue) ; coût au §8.

**[Adversarial]** — A-N-28 · La cascade de FR-9 est en « autorisation par défaut », et la lecture réelle exige les identifiants réels (FR-9)
« Vérifié » n'a pas de critère : une base Odoo de production nommée `test` passe. Le refus ne porte que sur les destinations **déclarées** pour le réel : une adresse non déclarée (même hôte, autre base, IP au lieu du nom) passe — liste noire. Lire le vrai logiciel exige des identifiants du vrai logiciel ; des identifiants qui peuvent écrire, présents dans l'essai, rouvrent F-08.
Fix: Garde en **liste blanche** (bac à sable déclaré **et** distinct de toute destination du réel ; le reste intercepté) ; « vérifié » = confirmation écrite + signature technique distincte ; lecture réelle seulement avec des identifiants **en lecture seule**, dont le droit d'écriture est **testé et refusé**.

**[Adversarial]** — A-N-31 · Une clause d'adhésion n'est pas un consentement, et la frontière exploitation / apprentissage n'a pas de garde (§4.C (clause unique), FR-27, SM-4)
Une clause intégrée au contrat, condition de la vente, n'est ni **libre** ni **spécifique** ; les personnes concernées sont les **clients du distributeur**, qui ne consentent pas à leur place ; « Money Vibes reste couverte par la loi » est une conclusion juridique **non validée** ; les effets du retrait sur l'abonnement ne sont pas dits. Sur la plateforme, une analyse « pour l'exploitation » lit les mêmes données sans garde, et SM-4 ne compte que les lectures déclarées : zéro garanti par construction.
Fix: Validation juridique de la clause en **point ouvert daté** (§8.2) ; clause par finalités, une ligne de registre par finalité ; retirer « reste couverte par la loi » ; compte de service IA dédié dont toute lecture passe par la garde, pas d'export en masse pour l'« exploitation » ; SM-4 mesure aussi les extractions hors garde.

**[Adversarial]** — A-N-32 · Une clé de sauvegarde « détenue par le client » est incompatible avec les automatismes (NFR-7, FR-17, FR-18, FR-25)
Retour arrière automatique, restauration `AVEC_PERTE`, test mensuel automatique et bilan d'instance exigent de **déchiffrer** sans personne : soit la clé est sur l'instance et « détenue par le client » ne veut rien dire, soit ces automatismes sont impossibles. Clé perdue : aucune restauration, RTO jamais tenu. RPO 1 h contredit par « une sauvegarde par jour » sur la plateforme. La copie hors machine d'un assureur dont les données « ne quittent pas ses locaux » : où ?
Fix: **Clé d'exploitation** scellée sur l'instance et **clé de secours** détenue par le client ; séquestre ou procédure de perte ; RPO explicite pour la plateforme ; lieu de la copie hors machine.

**[Cohérence contrat]** — C-N-02 · Deux états (`ESSAI_PROSPECT`, `PREAVIS`) ne se lisent pas sur l'entitlement (§3.1 table « état publié », FR-33)
`PREAVIS` = `ACTIVE` à échéance repoussée de 30 jours : indiscernable d'un `ACTIF`, et diverge de l'échéance de `paiement` (`terme.ts` : « le même calcul des deux côtés »). `ESSAI_PROSPECT` : à `finLe`, `statutEffectif` rend `EXPIRED`, donc la règle publie **`LECTURE_SEULE`** (visible, export) alors que FR-33 dit « l'accès se ferme » ; fermer vraiment exige d'écrire un statut à une date, ce que `terme.ts` refuse. `source` n'est porté ni par `entitlement.changed` ni par FR-34.
Fix: Donner dans FR-34 la **représentation** de chaque état (`essai: { finLe }`, `preavis: { echeanceContrat, finLe }`, champs additifs v2 ou vue du moteur) ; dire si la fin d'essai donne `LECTURE_SEULE` ou un état fermé, par statut calculé ; `PREAVIS` **calculé** (échéance passée de moins de 30 jours) avec un `statutEffectif` étendu.

**[Cohérence contrat]** — C-N-03 · « L'axe 2 prime » × chemins 2 à 5 × « le menu et la garde ne se contredisent jamais » (§3.1, FR-4, FR-34)
Les chemins 2, 3 et 4 **créent** des entitlements `ACTIVE` (`decisionDOctroi`, `decisionVerticale`, `propagation-des-packs`) sans aucune notion d'installation ; tous les droits existants sur `dev` viennent de ces chemins ou du `PUT` opérateur. La règle de priorité publie `NON_INSTALLE` alors que la garde sert le module : le jour de la mise en route du moteur, **tous les modules de toutes les organisations disparaîtraient du menu**.
Fix: « Un chemin de droits (2 à 6) pose l'axe 2 à `INSTALLE` dans l'espace où il s'exécute ; un droit `ACTIVE` sans trace d'installation se publie `EN_SERVICE` » ; conséquence testable pour la **reprise de l'existant**.

**[Cohérence contrat]** — C-N-04 · Le `VerticalPack` est aussi le package vendu, et le socle distributeur ouvre 7 codes sans contrat (§3 « Socle de vertical », FR-37, FR-12, SM-1)
STORY-727 : l'abonnement porte `packs` (clés `VerticalPack`) et une échéance soldée ouvre leurs modules ; `cabinet` **achète** son package. `distributeur` = `balance, bilan, pdv, stock, catalogue, commande, facturation`, ouvert **sans terme** dès `identity.org.created`. Le `VerticalPack` est donc à la fois le socle offert et l'unité de vente : FR-37 n'a pas la colonne qui traduit l'un en l'autre, et `MODULE_NON_SOUSCRIT` n'a pas de base définie. FR-12, FR-8 et FR-32 ne s'appliquent pas à ces 7 codes, sans que le PRD le dise ; SM-1 (« organisation **vierge** ») est indémontrable sur une organisation `distributeur`.
Fix: Redéfinir « socle de vertical » depuis le code (`VerticalPack` = package vendu **ou** inclus) ; colonne « package du contrat → codes » dans FR-37 ; codes inclus hors FR-12 et FR-32 ; SM-1 avec la liste exacte des codes et l'organisation de départ ; faire trancher le PO sur `pdv`, `stock`, `commande`, `facturation` « inclus » alors qu'ils sont vendus dans les packs.

**[Cohérence contrat]** — C-N-05 · L'organisation du prospect et ses deux déploiements ne sont pas situés (FR-33, §3.1 axe 1, FR-8, FR-10)
Une organisation naît par `identity.org.created` dans **un** `auth-service`. Créé dans le réel, le prospect reçoit aussitôt le socle `distributeur` **dans le réel**, ce que FR-33 interdit. Créé dans l'essai seulement, sa signature crée l'organisation dans le réel, où le chemin 4 ouvre 7 codes **avant** le rejeu et le feu vert. Rafraîchissement et rejeu supposent la **même identité d'organisation** dans les deux déploiements, ce que le PRD ne dit nulle part.
Fix: Une FR « Une organisation dans deux espaces » : où elle naît, comment elle apparaît dans l'autre (même identifiant, créée par le moteur), chemin 4 suspendu dans le réel avant la mise en service d'une organisation issue d'un essai.

**[Cohérence contrat]** — C-N-06 · Les droits `instance:*` et le filtre « attribués ∩ ouverts » ne tiennent pas dans `auth-service` (FR-35)
`moduleDePermission()` lit le premier segment comme code de module et `exigerModulesSouscrits` refuse `CODE_TENANT_ROLE_MODULE_NON_SOUSCRIT` s'il n'est pas `ACTIVE` : aucune organisation n'a d'entitlement `instance`, ces droits n'entrent dans aucun rôle (et contredisent C7). `TENANT_PERMISSION_FORMAT` refuse les codes à tiret (`pi-spi`). Le filtre « ∩ modules ouverts » n'existe nulle part ; `AbonnementsClient` lit le `status` brut : un module `EXPIRED` est vu `ACTIVE` par `auth`.
Fix: Code de module `instance` au socle de **toute** organisation, sans terme et non suspendable, ou exception nommée dans STORY-167 AC 2 ; intersection calculée dans la coque et la garde de chaque module, à partir de l'état publié, pas dans `perms[]` ; signaler à C7 la limite du format.

### Medium (40)

**[Decision-readiness]** — G-N-12 · « Le silence ne punit pas » est faux pour un abonné payé mais coupé (FR-15, FR-41)
FR-41 donne à un abonné « une licence courte, valable jusqu'à sa prochaine échéance payée ». Un abonné qui **a payé** mais dont la liaison est coupée ne reçoit pas la licence suivante : elle expire sur l'horloge scellée, puis `PREAVIS`, puis `LECTURE_SEULE`. C'est peut-être voulu (le remède est la licence par e-mail, FR-22), mais FR-15 promet le contraire en tête de FR.
Fix: Une conséquence dans FR-15 : « un abonné payé mais coupé reçoit sa licence par fichier ; sans elle, l'échéance tombe ».

**[Decision-readiness]** — G-N-13 · Correctifs critiques pour toute version figée : le coût contre la thèse n'est pas nommé (FR-19, FR-32, FR-21, §1, SM-6)
Décision du PO légitime (journal l. 88). Mais une instance figée peut avoir n majeures de retard : lui livrer un correctif « sans migration » suppose de maintenir un correctif par version figée encore vivante, contre « une seule ligne de version » (§3, FR-21) et « sans dix produits à maintenir » (§1).
Fix: Nommer le compromis et le borner (correctifs sur les N dernières majeures seulement, ou « au mieux » au-delà), ou un `[NOTE FOR PM]`.

**[Strategic coherence]** — G-N-27 · SM-6 et SM-7 sans instrument (reste de G-04) (§6)
SM-6 se mesure par la « garde C6 en CI », mais le contrat constate « ⚠️ règle écrite (pdv AD-8), **aucune garde transverse** », et aucune FR ni §8.4 ne demande de la créer : la cible « 0 » est donc atteinte par défaut. SM-7 a pour cible « en baisse », sans source ni seuil.
Fix: Ajouter la garde C6 au §8.4 ; SM-7 « durée mesurée par le plan d'installation (FR-40), 2ᵉ ≤ 50 % du 1ᵉʳ » ou équivalent.

**[Strategic coherence]** — G-N-17 · SM-4 sur la plateforme ne voit que les lectures honnêtes (SM-4, FR-27, §4.C)
SM-4 compte les lectures sans consentement « vérifiées … par le journal de la garde ». Une lecture qui passe par la route AD-P16 (que §4.C maintient « pour l'exploitation ») n'entre jamais dans ce journal : SM-4 vaut 0 par construction. §8.4 ne demande pas non plus de restreindre AD-P16 à l'exploitation.
Fix: §8.4 « AD-P16 : lecture d'exploitation journalisée, finalité déclarée » et SM-4 alimenté aussi par ce journal.

**[Done-ness clarity]** — G-N-10 · FR-9 : lecture du vrai logiciel permise, identifiants du réel interdits (FR-9)
« La **lecture** depuis le vrai logiciel du client reste permise pendant l'essai » mais « L'espace d'essai n'a **jamais les identifiants** du réel ». Lire le vrai Odoo exige une destination et des identifiants du vrai Odoo.
Fix: « des identifiants **en lecture seule**, propres à l'essai, vers le vrai logiciel ; toute écriture par eux est refusée `ECRITURE_REELLE_DEPUIS_ESSAI` ».

**[Done-ness clarity]** — G-N-11 · Interception totale contre usage autonome de l'essai (FR-9, FR-6, FR-33, UJ-5 étape 2)
FR-9 intercepte « SMS, WhatsApp, e-mail » sauf liste blanche de test. Le prospect autonome (FR-33) et les utilisateurs clés (UJ-5) doivent pourtant recevoir **invitation, code de connexion, réinitialisation de mot de passe** de l'espace d'essai ; FR-6 compte l'invitation interceptée comme réussie alors que personne ne la reçoit.
Fix: Une exception nommée : les messages d'identité aux utilisateurs de l'espace d'essai lui-même partent réellement ; tout le reste est intercepté.

**[Done-ness clarity]** — G-N-15 · FR-38 calcule l'écart de dépendances, sans conséquence (FR-38, FR-12, FR-17)
« l'écart avec le contrat de chaque client est calculé avant la mise à jour ». Et ensuite ? Mise à jour refusée pour ce client, dépendance ajoutée gratuitement au contrat, ou blocage jusqu'à avenant ? Sans réponse, FR-12 (`MODULE_NON_SOUSCRIT`) et FR-21 (N-1 obligatoire) se contredisent pour ce client.
Fix: Une conséquence et un code nommé.

**[Done-ness clarity]** — G-N-18 · FR-16 « n'envoie aucune donnée » contre FR-41 « en 24 heures » (FR-16, FR-41)
La vérification quotidienne « n'envoie aucune donnée », mais FR-41 l'utilise pour remettre une licence **propre à l'instance** « dans la réponse au prochain contact ». Il faut au moins l'identité de l'instance et le numéro de licence courant.
Fix: « n'envoie que l'identifiant de l'instance, sa version et le numéro de sa licence ».

**[Done-ness clarity]** — G-N-14 · NFR-7 : le RPO de 1 h décidé par le PO ne s'applique plus à la plateforme (NFR-7 ; journal l. 85)
Le journal enregistre « sauvegardes 3-2-1 chiffrées, … RPO 1 h, RTO 4 h » sans restriction d'hébergement. NFR-7 rattache ces valeurs au site puis donne à la plateforme « une sauvegarde par jour au moins », soit une perte possible de 24 h pour le distributeur de février, marquée seulement `[ASSUMPTION : paliers]`.
Fix: RPO/RTO explicites pour la plateforme, ou faire valider l'écart par le PO.

**[Scope honesty]** — G-N-23 · §8.4 incomplet (§8.4, FR-12)
Manquent : STORY-280 ; `paiement-service` (le topic `paiement.abonnement.preavis.emis` devient « rappel », et FR-12 impose que « la vente résout les dépendances comme la console ») ; AD-P16 ; la garde C6 (SM-6) ; l'amendement de C8. (La table de la grille le classe low, la dimension Scope medium : la sévérité la plus haute est retenue.)
Fix: Compléter §8.4 de ces cinq lignes.

**[Downstream usability]** — G-N-08 · FR-22 place encore « Mettre à jour depuis un fichier » dans la console (FR-22, FR-36, FR-23)
FR-22 : « le DSI la dépose dans la console de l'instance … ». FR-36 met cet écran dans `prospera-app` « Administration », et les comptes Money Vibes de la console sont « fermés par défaut » (FR-23).
Fix: Remplacer « console » par « `prospera-app`, Administration (droit `instance:fichier:deposer`) ».

**[Downstream usability]** — G-N-09 · Le droit de consentir s'attribue comme les autres, contre FR-27 (FR-35, FR-27)
FR-35 : « L'administrateur du client attribue ces droits lui-même », dont `instance:consentement:donner`. FR-27 : le consentement est donné par le **DG**, ou par une personne qu'il **désigne par écrit**. Un DSI administrateur peut donc s'attribuer le droit de consentir.
Fix: Droit attribuable par le DG seul (ou réservé au rôle DG) ; désignation écrite enregistrée au registre.

**[Downstream usability]** — G-N-16 · Plateforme : un seul espace d'essai partagé, une majeure et des répétitions en cours (FR-10, FR-17, FR-8, FR-33, §3.1 axe 1)
Sur la plateforme, l'essai est partagé par toutes les organisations et les prospects. Une répétition générale en cours rejoue un dossier préparé en N+1 vers un réel en N ; et le rafraîchissement « obligatoirement avant une majeure » est « refusé pendant une répétition générale en cours » : une seule organisation peut bloquer une majeure de toute la plateforme.
Fix: Dire si le rafraîchissement obligatoire vaut sur la plateforme, et la règle de version d'un dossier d'installation (rejoué seulement vers la même version de plateforme).

**[Shape fit]** — G-N-07 · UJ-4 contredit FR-12 (UJ-4, FR-12, FR-2)
« Moussa … a signé « Terrain & Ventes » plus Facturation » ; puis « Cocher Relances ajoute Facturation » (déjà au contrat, et Relances ne l'est pas : `MODULE_NON_SOUSCRIT`) ; puis « Encaissements passe 🔴 », hors contrat aussi. Le parcours qui doit illustrer « le contrat fait foi » installe deux modules hors contrat.
Fix: Faire signer à Moussa Terrain & Ventes + Relances + Encaissements, et laisser FR-2 ajouter Facturation à la vente.

**[Adversarial]** — A-N-04 · Un prérequis qui disparaît après la mise en service (§3.1 axe 2, FR-16)
Clé PI-SPI révoquée, numéro WhatsApp banni, API du core-banking changée : le module reste `EN_SERVICE` 🟢 alors qu'il ne marche plus. La « santé par module » de FR-16 n'apparaît ni dans l'état publié, ni dans le bilan, ni dans les bandeaux.
Fix: Attribut `sante: OK | DEGRADE{raison, action}` orthogonal à l'état publié (bandeau administrateur, ligne du bilan repassée 🔴), sans fermeture automatique.

**[Adversarial]** — A-N-08 · FR-4 : « il n'en existe pas d'autre » est faux (FR-4)
Offre d'essai (pose `ACTIVE` avec `finLe`), mise en service, réinstallation, levée d'une sanction, signature pendant la fenêtre d'effacement : autant d'ouvertures hors table, donc sans garde. Rien n'exige sur site **la même implémentation**. Et `MODULE_NON_SOUSCRIT` suppose de lire le contrat sur site, où l'instance ne le connaît pas hors ligne.
Fix: Compléter la table en séparant axe 2 et axe 3 ; bibliothèque de décision unique embarquée sur site avec la même suite de conformité ; sur site seul `MODULE_HORS_LICENCE` s'évalue.

**[Adversarial]** — A-N-12 · Chaque délai n'a pas d'horloge propriétaire (FR-15, FR-19, FR-20, FR-33, FR-17)
« **Toutes les échéances** se lisent sur l'horloge scellée » : faux pour les 72 h (départ = un appel téléphonique), l'essai prospect (plateforme, pas d'horloge scellée), J+7 (alerte de Money Vibes contre gel de l'instance), les 7 jours (vagues contre retour arrière, et C12 ne dit pas laquelle borne la rétrocompatibilité).
Fix: Une table « délai → horloge de référence → événement de départ → qui l'observe → si observé en retard » ; retirer « toutes ».

**[Adversarial]** — A-N-13 · Trois définitions du gel (§3 « Gel », §3.1, FR-15, FR-19)
« sans contact » (§3), « sans signal » (§3.1), « signal ou licence fraîche » (FR-15). Une vérification quotidienne lève-t-elle le gel ? Le correctif reçu par fichier est un « contact » au sens du §3. Si tout fichier compte, redéposer un ancien paquet remet le compteur de silence à zéro indéfiniment.
Fix: Un contact = un échange **authentifié et daté par Money Vibes** ; un fichier déjà vu ne compte pas ; aligner §3, §3.1 et FR-15.

**[Adversarial]** — A-N-23 · La rétrocompatibilité ne couvre que les champs (FR-18, C12)
Ignorer un champ inconnu ne suffit pas pour une **nouvelle valeur d'énumération** (`EN_EXPERTISE` écrit par N+1), un **nouveau type d'événement** ou un topic `@2`. Le test s'arrête au retour : rien ne vérifie les données modifiées par N après le retour, quand N+1 revient.
Fix: Étendre C12 (valeur inconnue = « autre », lecture seule ; nouveaux événements ignorés et journalisés) ; test : promouvoir, saisir, revenir, modifier, **re-promouvoir**.

**[Adversarial]** — A-N-24 · Combien de temps dure un « clic » ? (FR-18, NFR-7, NFR-9, FR-40)
Un retour arrière `AVEC_PERTE` est une restauration : jusqu'à 4 heures d'arrêt, que NFR-9 ne borne pas. Un retour arrière **interrompu** n'a pas d'état défini dans FR-40.
Fix: NFR-9 : durée maximale du retour arrière sans perte (≤ 15 min) et avec perte (≤ RTO), affichée avant le clic ; le retour arrière est un plan enregistré qui reprend après coupure.

**[Adversarial]** — A-N-25 · Un client pilote ou un client mécontent bloque tous les autres (FR-20, FR-17 (sur site))
Le DSI du pilote attend six semaines : la vague suivante attend six semaines. N'importe quel retour arrière sans lien avec la version (formation, confort) est un « incident » qui bloque tout le monde. La place de la plateforme dans les vagues n'est pas dite.
Fix: Limiter l'attente du pilote ; qualifier l'incident (raison imputée à la version, validée par Money Vibes) ; placer la plateforme dans l'ordre des vagues.

**[Adversarial]** — A-N-26 · Le rafraîchissement obligatoire avant une majeure peut bloquer la plateforme (FR-10, FR-17)
Une majeure de plateforme exige le rafraîchissement de **chaque** organisation, refusé pour celles qui ont une répétition en cours, et jamais appliqué aux essais prospects : une seule répétition bloque la majeure de tous, ou la majeure part sans rafraîchissement, contre FR-10.
Fix: Rafraîchissement obligatoire **avant que l'organisation n'essaie** la majeure ; répétitions et essais prospects **migrés** comme le réel ; répétition en cours reportée ou rejouée.

**[Adversarial]** — A-N-27 · Une majeure qui ajoute une dépendance non souscrite (FR-38, FR-21, FR-4 chemin 3)
Refusée au client à qui manque la dépendance, la majeure le laisse en N, hors de la fenêtre N-1 : il perd son support **sans faute de sa part**. Installée d'office, elle contredit FR-12. La « propagation d'un pack modifié » n'est toujours pas définie.
Fix: Dépendance dure fournie **sans facturation** (amendement automatique du contrat), ou majeure non publiable ; propagation d'un pack : seuls les **nouveaux** contrats, les autres par avenant.

**[Adversarial]** — A-N-29 · L'interception casse une synchronisation dans les deux sens (FR-9, FR-6, UJ-3)
Une écriture interceptée ne reçoit ni identifiant ni accusé : l'essai accumule des enregistrements sans correspondance externe, en conflit avec les vraies opérations que la lecture fait remonter. La vérification « aller-retour » n'est jamais faite et vaut pourtant 🟢 : pour l'IMF sans bac à sable, la répétition ne teste pas le point le plus risqué.
Fix: Ligne 🟠 « aller-retour non vérifié » pour un connecteur intercepté ; vérification aller-retour **dans le réel** à la mise en service ; le PRD Connecteurs dit comment il simule l'accusé.

**[Adversarial]** — A-N-30 · Le rafraîchissement envoie des données réelles dans le bac à sable du client (FR-9 (étape 1), FR-10)
Après un rafraîchissement, les données personnelles réelles partent vers le **bac à sable** du logiciel du client, aux contrôles plus faibles et aux accès tiers. FR-10 garde les règles d'accès dans Prospera, pas au-delà. Le bac à sable diverge à chaque rafraîchissement.
Fix: Accord du client, ou masquage des champs personnels vers le bac à sable ; dire ce qui se passe côté bac à sable au rafraîchissement.

**[Adversarial]** — A-N-33 · Le certificat d'effacement est remis alors que les données existent encore (FR-33, NFR-4, NFR-7)
Les données du prospect restent environ 90 jours dans les sauvegardes mensuelles **après** le certificat. Effacer les « journaux nominatifs » contredit NFR-4 (ajout seul) ; l'effacement lui-même doit être journalisé. Pas de rappel en cas de prolongation, prolongation après fermeture indéfinie, destinataire des rappels non défini.
Fix: Le certificat date l'expiration de la dernière sauvegarde (ou chiffrement par organisation et destruction de clé) ; journaux **pseudonymisés**, pas supprimés ; rappel à J-7 de chaque fin, destinataire nommé, prolongation seulement avant fermeture.

**[Adversarial]** — A-N-34 · Des modules commerciaux vendables qui n'existent pas encore au catalogue (FR-37, QA-1, FR-7, SM-2, NFR-5)
Un contrat peut inclure un module non installable : le client est **En service partiel pour toujours**, ce qui suffit à SM-2, et En service n'est jamais atteignable. NFR-5 chronomètre « la plateforme complète », qui inclut ces modules. Faire entrer 18 modules et leurs manifestes (C13 compris) avant février est un chantier **caché**.
Fix: Interdire la vente d'un module non installable ou l'exclure de l'état (« livraison prévue le … ») ; NFR-5 sur les codes **installables** ; §8.4 « 18 manifestes C13 » avec propriétaire et date.

**[Adversarial]** — A-N-35 · La moitié du PRD n'a pas de priorité, et ce qu'on sacrifie est une garantie juridique (§8.4 (ordre de sacrifice), §8.2, §0)
Environ 25 exigences ne sont ni sacrifiables ni protégées. Sacrifier le poste d'accès enregistré retire l'enregistrement de session et la coupure du transfert de fichiers tout en gardant le niveau 2. FR-15 et NFR-7 sont « jamais sacrifiés » alors que leur mécanisme n'est pas chiffré. §8.2 annonce « Aucun » point ouvert alors que la clause unique, D3, C12/C13, l'horloge, la suspension d'un acheteur et l'ordre de sacrifice lui-même restent ouverts.
Fix: Classer **chaque** FR et NFR (jamais sacrifiée / sacrifiable avec ordre / dégradable avec version minimale) ; « niveau 2 fermé jusqu'à la livraison de FR-29 » ; §8.2 = liste réelle des points ouverts, propriétaire et date.

**[Cohérence contrat]** — C-N-07 · « Une vue, jamais une seconde source » est faux, et le canal n'est pas nommé (FR-34, §7 C5)
Axe 2, espace, gel, accueil et droits déclarés **ne sont pas** dans `entitlement.changed` : l'état publié est une **source** pour ces champs. Les états qui dépendent du temps changent sans événement : « < 1 min » n'est tenable que si l'état est **calculé à la lecture**. Route ou topic, avec quel droit : non dit.
Fix: « L'état publié est **calculé à la lecture** (entitlement + faits du moteur) ; une route de lecture par organisation et par espace » ; « jamais une seconde source » réservé au **droit**.

**[Cohérence contrat]** — C-N-08 · La liste des chemins se dit complète, mais il en manque, et les refus ne sont pas répartis par chemin (FR-4)
`suspension-par-impaye` **rétablit** `SUSPENDED → ACTIVE` sur `regularise` : une ouverture hors liste. L'offre d'essai pose `finLe`, ce que le `PUT` opérateur ne sait pas faire : un septième chemin. Les chemins 2, 3 et 4 sont des consommateurs Kafka : un 422 n'y a personne à qui répondre.
Fix: Ajouter « 7. Régularisation » et « 8. Offre d'essai » ; refus applicables par chemin (`MODULE_NON_SOUSCRIT` ne vaut ni pour 4 ni pour 5) ; refus asynchrone = écart nommé, journalisé, visible au bilan ; FR-12 « **ouvert** au paiement », pas « devient installable ».

**[Cohérence contrat]** — C-N-09 · Le « rappel » est attribué à la mauvaise story, et `PREAVIS` change de sens (§8.4 ligne STORY-727, §3 « Rappel » / « Préavis »)
Le préavis de J-7 appartient à `paiement` (STORY-280/281 : `HORIZON_PREAVIS_JOURS`, jalon `'PREAVIS'`, clef `<contrat>:<échéance>:PREAVIS`) ; 727 n'en a pas. Renommer la nature change les clefs des jalons posés. Tant que le code garde `PREAVIS` pour « avant » et l'état publié pour « après », le même mot a deux sens.
Fix: Adresser le renommage à STORY-280/281 (paiement + modèles de notification), en gardant la valeur technique ou avec migration des clefs ; à défaut, renommer l'état publié (ex. `ECHU_EN_SURSIS`).

**[Cohérence contrat]** — C-N-10 · « Délai de grâce » entre en collision avec la grâce de `paiement` (§3 « Délai de grâce », FR-15, QB-1)
Dans `paiement`, une **grâce** est un délai **accordé** par un humain sur un impayé (`paiement:grace:attribuer`, 30 j par défaut, 90 au plus). Deux « grâces » de 30 jours dans la même console ; l'homonyme est pire qu'un synonyme.
Fix: Renommer le terme du PRD (ex. « délai de silence ») et citer la grâce de paiement au §3.

**[Cohérence contrat]** — C-N-11 · Trois définitions de la lecture seule (FR-32, FR-35, §3.1 ligne `LECTURE_SEULE`)
Par **verbe HTTP** (727 lot 4, livré dans 8 services : `GET/HEAD/OPTIONS` passent, toute écriture 403 `ABONNEMENT_EXPIRE`), par **catégorie d'action** (FR-32), par **droit** (FR-35). Produire un état BCEAO ou lancer un export est en général un `POST`, refusé par le code. Le test en matrice de FR-34 n'a pas d'attendu unique.
Fix: Choisir un mécanisme (ex. verbe + **liste blanche déclarée au manifeste** pour export et états, versée dans C13) ; aligner FR-35 ; retirer l'`[ASSUMPTION]`.

**[Cohérence contrat]** — C-N-12 · La règle « reprise » par les Connecteurs n'y est pas (FR-9 × PRD Connecteurs)
Le PRD Connecteurs, finalisé après le moteur, ne contient ni bac à sable, ni interception, ni `ECRITURE_REELLE_DEPUIS_ESSAI`, ni identifiants par espace, ni comportement en lecture seule. Pour une IMF dont le logiciel **reste la référence**, couper la synchronisation laisse Prospera se périmer en silence.
Fix: FR-9 « **doit** reprendre » ; ajouter au PRD Connecteurs la cascade et le comportement en `LECTURE_SEULE` ; valider les deux ensemble le 13/11.

**[Cohérence contrat]** — C-N-13 · Jonction avec le PRD Reprise : réception, écrans, effacement (FR-8, §3 « Réception définitive » × PRD Reprise)
La Reprise garde ses fichiers « jusqu'à la réception définitive » **par reprise** ; le moteur l'enregistre **par sous-ensemble** : aucun PRD ne dit quels lots une réception partielle libère. Reprise C8 dit « plus tard dans `prospera-app` » alors que le moteur met le libre-service en février. L'effacement du prospect n'apparaît pas dans la Reprise. Le feu vert, lui, concorde.
Fix: Compléter la ligne « PRD Reprise » du §8.4 : C8 en `prospera-app` dès février ; réception par sous-ensemble = libération de ses lots ; effacement du prospect (C13).

**[Cohérence contrat]** — C-N-14 · Le rejeu écrit chez d'autres propriétaires sans contrat nommé (§3 « Dossier d'installation », FR-33, §7 C3)
Rôles (`auth-service`), zones (`reseau`), tables de correspondance (Reprise) : rejouer le dossier, c'est écrire chez chacun par un contrat C5 qu'aucun PRD ne nomme, alors que C3 dit « n'écrit dans aucun autre module ». Les **comptes** ne figurent pas au dossier.
Fix: Pour chaque élément du dossier, son propriétaire et son point d'import ; ajouter « comptes et invitations » ou dire qu'ils sont recréés ; gabarit C13 « importer la part d'un dossier qui vous appartient ».

**[Cohérence contrat]** — C-N-15 · §8.4 : les définitions du contrat que le PRD change ne sont pas listées (§8.4 ligne « Contrat de module »)
Le PRD redéfinit **Installer** (contrat : « poser `ACTIVE` »), **Pack** (contrat : `VerticalPack`), **Suspendre** (contrat : « impayé, STORY-280 »), la forme de `depends` (C1) et ajoute le préavis. §8.4 ne demande que C2, C12, C13, Q4 et §9.
Fix: Ajouter : « §0 et §1 : Installer, Pack, Suspendre, Expiré (préavis) ; C1 : `depends: [{ code, raison }]` et nouveaux champs ; C11 §5 : clause unique de la plateforme ».

**[Cohérence contrat]** — C-N-16 · La vérification quotidienne transporte une licence alors qu'elle « n'envoie aucune donnée » (FR-41 × FR-16)
Pour recevoir **sa** licence, l'instance doit s'identifier (donnée de niveau 0). La promesse « en 24 heures » repose sur une requête qui change de nature.
Fix: La vérification quotidienne porte l'identifiant et le numéro de licence (niveau 0, FR-26), ou FR-41 ramenée à « au prochain signal hebdomadaire (7 jours) ».

**[Cohérence contrat]** — C-N-17 · Les nouvelles clauses ne sont reportées ni au gabarit ni à leurs premiers débiteurs (§0, FR-38, §7 C12/C13)
Le contrat §6 impose **onze lignes** (vérifiées par `bmad-check-implementation-readiness`) : avec C12 et C13 il en faut treize. FR-10 (rafraîchissement par organisation) exige que chaque module sache **importer** la part d'une organisation ; C13 ne prévoit qu'« exporter et effacer ». Les PRD Reprise et Connecteurs ont encore un tableau C1 → C11.
Fix: C13 = « exporter, **importer** et effacer par organisation » ; §8.4 « contrat §6, 13 lignes » ; C12 et C13 aux deux PRD frères.

**[Cohérence contrat]** — C-N-18 · Les interrupteurs de changement sont une obligation de module hors contrat (FR-17, variante plateforme)
Chaque module doit lire un interrupteur par organisation, avec date limite, et prouver qu'il ne lui survit pas : ni dans C12, ni dans C13, ni au manifeste. Le support n'est pas nommé (`Entitlement.config` existe). Même défaut que R-04.
Fix: L'ajouter à C12 (interrupteur déclaré au manifeste) et nommer son support (`config.interrupteurs` dans `entitlement.changed`, ou la vue de FR-34).

### Low (17)

**[Decision-readiness]** — G-N-28 · §8.2 « Aucun » point ouvert (reste de G-02) (§8.2, §8.3, §8.4)
Défendable après la séance du 10/11, mais §8.3 liste une vingtaine d'inférences dont plusieurs portent la spine (deux adresses par instance, sens de « pack », liste `instance:*`, module suspendu caché), sans propriétaire ni date, et l'ordre de sacrifice (§8.4) n'y figure pas.
Fix: Trier §8.3 en « à confirmer vendredi » / « laissé à l'architecture ».

**[Done-ness clarity]** — G-N-29 · Reste de T-23 : test « sur chaque envoi » et ré-identification (FR-26, FR-28)
FR-26 « un test le vérifie sur chaque envoi » reste irréalisable sur un flux libre (un schéma fermé du signal le rendrait vérifiable) ; FR-28 ne dit rien de la ré-identification par recoupement (montants exacts + année de naissance + agence). Non bloquant pour février si FR-28 reste peu utilisé.
Fix: Schéma fermé du signal ; règle de ré-identification (généralisation, seuil d'effectif).

**[Done-ness clarity]** — G-N-19 · Levée du gel : « premier contact » contre « signal ou licence fraîche » (§3 « Gel », FR-15, FR-19)
Le §3 lève le gel au premier contact (tout fichier, y compris le correctif de sécurité qui doit justement passer *en* gel) ; FR-15 exige le retour du signal ou une licence fraîche.
Fix: Une seule définition du contact qui lève le gel.

**[Done-ness clarity]** — G-N-21 · « Sans rien perdre pendant 7 jours » sans la réserve `AVEC_PERTE` (§1, titre de FR-18)
La promesse de la Vision et du titre de FR-18 n'est pas bornée par le cas `AVEC_PERTE` que FR-18 introduit.
Fix: Ajouter la réserve au §1 et au titre.

**[Done-ness clarity]** — G-N-25 · Certificat d'effacement remis alors que les sauvegardes gardent les données (FR-33, NFR-7)
Les sauvegardes gardent les données jusqu'à 3 mois après le certificat.
Fix: Le certificat date l'expiration de la dernière sauvegarde concernée.

**[Downstream usability]** — G-N-26 · « instance » n'est pas un code de module (FR-35, §7 C7/C8)
Les droits `instance:*` suivent le format `<module>:<objet>:<action>` (C7), mais aucun module `instance` n'existe au catalogue, et l'état publié du module d'écran « Administration » n'est pas dit.
Fix: Déclarer le moteur comme module du socle, toujours `EN_SERVICE`.

**[Shape fit]** — G-N-30 · Renvois à la revue dans le texte produit (§3, FR-7, FR-8, §3.1, FR-34, titres de FR-34 → FR-40)
« G-09, G-12 », « voir T-16 pour le PO », « T-29 », « T-01 », « T-07 »… Ces identifiants ne se résolvent pas pour la spine ni les stories.
Fix: Les remplacer par « décision du PO, 2026-11-10 ».

**[Shape fit]** — G-N-20 · « Un pack distributeur » n'a plus de référent (§1, SM-1)
Les packs sont désormais Terrain & Ventes… ; le socle de vertical n'est pas un pack.
Fix: Nommer la liste exacte de codes démontrés.

**[Shape fit]** — G-N-22 · « J+23 rappel » emploie un terme défini pour l'abonné seulement (FR-33, §3 « Rappel »)
Le « rappel » est défini au §3 pour l'échéance d'un abonné.
Fix: Employer un autre mot pour le prospect, ou élargir la définition.

**[Shape fit]** — G-N-24 · Renvoi cassé vers FR-30 (§4.C)
« face à des distributeurs concurrents (FR-30) » : FR-30 n'en parle pas.
Fix: Corriger le renvoi.

**[Adversarial]** — A-N-16 · Suspendre un acheteur entièrement payé (FR-41 (dernière puce), §3.1)
Le PRD autorise une sanction logicielle sur un droit d'utiliser **perpétuel et payé** : juridiquement fragile (c'est une vente), et contradictoire avec « jamais de suspension » écrit pour la version figée. Le litige n'est pas défini.
Fix: Interdire la suspension d'un acheteur payé, ou renvoyer au juriste en point ouvert (§8.2).

**[Adversarial]** — A-N-17 · La vérification quotidienne « n'envoie aucune donnée » mais livre une licence (FR-41, FR-16)
Pour recevoir **sa** licence, l'instance doit s'authentifier et se nommer ; et « la réponse au prochain contact » n'existe pas quand le contact est un fichier déposé.
Fix: Écrire ce que la requête transmet (identifiant, version, plus haut numéro, état de confiance) et retirer « aucune donnée ».

**[Adversarial]** — A-N-36 · FR-39 : copies gardées, mais emplacement vide (FR-39)
Si la copie existe, pourquoi l'emplacement est-il vide ? Les données d'un module désinstallé sont conservées **sans limite**, sans durée au regard de la loi 2019-014.
Fix: « Les copies restent stockées et **masquées** ; elles réapparaissent à la réinstallation » ; renvoyer la durée de conservation à la politique d'effacement.

**[Adversarial]** — A-N-37 · Résidus de texte qui contredisent les FR réécrites (§1, 4.A, 4.B, FR-5, FR-7, FR-11, FR-14)
§1 « sans rien perdre » (faux pour `AVEC_PERTE`) ; 4.A « seulement quand tout est vert » (contre En service partiel) ; 4.B « mêmes étapes » (contre les deux variantes de FR-17) ; FR-5 « sans effet de bord » (FR-6 dit « sans doublon ») ; FR-7 « PDF reçu » (invérifiable) ; FR-11 « promu » (réservé aux versions) ; FR-14 `LICENCE_PERIMEE` (vise une licence **antérieure**).
Fix: Corriger chaque phrase, puis rechercher les termes du §3 employés hors de leur sens.

**[Cohérence contrat]** — C-N-19 · Un cycle ne se détecte pas dans la CI d'un seul dépôt (FR-4)
Un cycle traverse plusieurs manifestes ; un dépôt ne voit que le sien. Seul le catalogue voit le graphe.
Fix: « Le catalogue refuse à la publication ; la CI d'un dépôt vérifie son manifeste contre la copie publiée du graphe ».

**[Cohérence contrat]** — C-N-20 · `EN_INSTALLATION`, colonne « Droit » : la réinstallation (§3.1)
Pour une réinstallation, l'entitlement existe déjà en `REVOKED` ; les chemins 2, 3 et 4 ne rouvrent jamais un `REVOKED`, seul le `PUT` opérateur le fait.
Fix: « absent, ou `REVOKED` pour une réinstallation ; seul le chemin 1 le rouvre ».

**[Cohérence contrat]** — C-N-21 · La version de plateforme coexiste avec une version épinglée par organisation (§3 « Version de plateforme », FR-17, FR-21)
`Entitlement.versionCode` épingle une version par organisation et par module ; deux organisations ouvertes à deux dates peuvent avoir deux versions. FR-17 suppose que la promotion réécrit `versionCode` pour tous, sans le dire.
Fix: « Une promotion de version de plateforme met à jour `versionCode` de tous les droits concernés (une seule écriture, journalisée) ».

## Mechanical notes

- **Identifiants :** FR-1 → FR-41 uniques et sans trou (ordre non séquentiel assumé au §0) ; NFR-1 → NFR-10 et SM-1 → SM-7 contigus ; QA-1 → QA-4, QB-1/2, QC-1 se résolvent. UJ-1 → UJ-5 nommés, protagonistes présents.
- **Renvois vers la revue** dans le texte produit (G-09, G-12, T-01, T-07, T-09, T-10, T-16, T-21, T-24, T-29) : à remplacer par « décision du PO, 2026-11-10 ».
- **Frontmatter :** `validation: validation-report.md` pointait vers un fichier archivé dans `revue-1/` ; le présent rapport le remplace à cet emplacement.
- **Niveaux de titre :** UJ-1 → UJ-5 en `###`, frères de « ### 2.3 » au lieu d'en être les enfants ; UJ-4 et UJ-5 n'ont pas de ligne vide après le titre.
- **Termes employés hors glossaire :** feu vert (central pour FR-8 et C5), vague, client pilote, bac à sable, liste blanche de test, plan d'installation (FR-40), poste d'accès contrôlé (FR-29), certificat d'effacement, état publié (défini au §3.1 seulement). Le PRD Reprise emploie « bascule », que ce glossaire ne relie pas à « mise en service ».
- **« Bilan d'instance » :** défini comme le bilan qui *clôt le montage* (§3, FR-25), mais NFR-7 le fait « passer en orange » chaque mois : c'est le voyant de santé de l'instance (FR-16), pas ce bilan.
- **§7 C3 :** « Possède : … licences, consentements » parle pour tout le moteur alors que l'en-tête du §7 confie B et C à d'autres services.
- **Index des hypothèses :** l'aller-retour tient pour toutes les marques en ligne, sauf l'ordre de sacrifice (§8.4), absent du §8.3. FR-22 utilise une marque non standard (`[hors périmètre du produit : décision commerciale]`) ; NFR-8 « changent chaque année » n'est ni au journal ni marqué.
- **§8.1 :** la liste des thèmes tranchés le 10/11 ne dit pas *ce qui* a été tranché ; pour la séance du 13/11, une table thème → choix → FR éviterait au PO de rouvrir le journal.
- **§3.1 :** la parenthèse « (paiement, socle de vertical, opérateur) » ne reprend que trois des cinq chemins d'exception de FR-4.
- **Contrat de module :** cité et respecté (onze lignes + C12/C13 au §7) ; demandes d'amendement au §8.4, à compléter pour C8 (U-06) et pour les définitions du §0/§1 (U-21).

## Reviewer files

- `review-rubric.md`
- `review-adversarial-general.md`
- `review-coherence-contrat.md`
- Passage 1 archivé : `revue-1/validation-report.md` (et ses trois revues)
