# Dossier de validation de `cima-assurances` — ce qu'on soumet, à qui, et ce qu'on attend en retour

> **STORY-540** · constitué le 2026-09-26 · artefact soumis : **`cima-assurances@5.0`**, empreinte
> sha256 `5234764a311cf472bef7f1fd3e8ae1066f6a7c3d8d8cf6849948be92b72c0859`.

Le PO a décidé le 2026-08-28 qu'on **développe** en considérant `cima-assurances` validé. Une décision
de produit ne valide pas une structure de liasse ni une méthode de provisionnement : ce dossier met la
**validation elle-même** en chantier, en parallèle, sans rien bloquer.

⛔ **Ce que ce dossier n'est pas.** Ni une demande d'agrément — la Commission Régionale de Contrôle des
Assurances contrôle des entreprises, pas des logiciels —, ni une certification : tant qu'il n'est pas
revenu signé, rien ne change dans le produit, et son statut reste `amorce`.

## Ce qu'on soumet

| Pièce | Où | État |
|---|---|---|
| **L'artefact** tel que le produit le sert, octet pour octet | [`cima-assurances-5.0.json`](cima-assurances-5.0.json) | identique aux trois copies de service ; empreinte épinglée dans leurs trois manifestes |
| **Sa structure écrite en clair** : 72 postes en cinq états, 65 lignes de table de passage, 12 formules développées jusqu'aux comptes, le plan et ce que chaque compte alimente | [`formules-en-clair.md`](formules-en-clair.md) | **générée** depuis l'artefact (voir « Vérifier ce dossier ») |
| **Les six questions**, reposées sur le texte, et la **fiche de réponse** | [`questions.md`](questions.md) | 28 sous-questions : lectures à confirmer, écarts à arbitrer, questions ouvertes |
| **Les textes** que les questions lisent, en extraits verbatim | [`textes-de-reference.md`](textes-de-reference.md) | art. 432 et 433, art. 334-4, circulaire n° 00230/2005, règlements de 2024 |
| **Le registre des réserves** | [`registre-des-reserves.md`](registre-des-reserves.md) | 47 réserves, toutes `OUVERTE` au 2026-09-26 |
| **Les méthodes de provisionnement** | servies par `assurance-service` : `GET /api/v1/dossiers/{dossierId}/assurance/provisions-techniques/methodes` | 14 lignes, une seule calculée ; reproduites en `questions.md` § 5.1 |

⚠️ **Pourquoi `@5.0` seul.** Cinq versions sont packagées ; les quatre premières restent servies
**intactes** aux organisations qui les ont reçues, parce qu'on ne réécrit pas un chiffre déjà publié.
Une validation vaut pour **l'empreinte examinée** et pour elle seule : elle ne remonte pas aux versions
antérieures, et elle ne s'étend pas à la suivante (STORY-671 changera le plan).

## À qui

Le Code ne désigne **personne** pour valider une structure de liasse ou une méthode de
provisionnement : le dossier annuel est certifié par un **mandataire social** de l'entreprise, « sous
les sanctions prévues » (art. 425). La validation que ce dossier sollicite est une exigence **du
produit**. Deux profils, désignés par le PO :

| Profil | Pour | Pourquoi ce profil |
|---|---|---|
| **A** — expert-comptable ou commissaire aux comptes **pratiquant l'assurance en zone CIMA** | **Q1 à Q4** : structure des états, variations au compte 80, frontière Vie / toute nature, classe 8 | les art. 431 à 433 sont des règles **comptables** ; la question est de savoir comment une liasse CIMA s'établit en pratique |
| **B** — **actuaire** | **Q5, Q6** : méthodes de provisionnement, cadence des sinistres | les méthodes et leurs données relèvent de l'actuariat, même quand le Code n'exige pas d'actuaire |

- La **qualité** du signataire reste un **texte libre** : aucune profession n'est imposée par le texte,
  et en imposer une serait écrire dans le produit une règle que le Code ne pose pas.
- ⛔ **La Commission n'est pas un destinataire.** Ce qu'on attend d'elle est un **texte** : ses
  circulaires, que le dossier cite quand il les a (n° 00230/2005 pour les tardifs). Son **accord** sur
  une méthode statistique est donné **à une entreprise** (art. 334-12), jamais à un logiciel : le
  produit ne peut pas l'obtenir pour ses utilisateurs.

## Ce qu'on attend en retour

Pour chaque profil, **la fiche de réponse de [`questions.md`](questions.md), remplie et signée** :

1. pour **chaque** sous-question, un verdict — dans le vocabulaire de son type (lecture confirmée ou
   à corriger ; écart à corriger ou acceptable, et à quel usage ; proposition acceptée ou autre
   réponse) — ou « hors de ma compétence », qui laisse la sous-question **ouverte** ;
2. pour toute correction, **la référence qui la fonde** : article, circulaire, instruction nationale,
   usage de place nommable. Sans elle, une correction ne peut pas entrer dans la `normeSource` d'une
   version suivante ;
3. l'**identité** du signataire (nom, qualité, date), l'**empreinte** de l'artefact examiné et le
   **commit** du dossier qu'il a reçu : l'empreinte lie les octets du paquet, pas le rendu qu'il a lu
   (`formules-en-clair.md`, `questions.md`) — le commit, si ;
4. son **accord**, ou non, pour que son nom soit publié avec le paquet (voir « Le statut »).

⛔ **Ce dépôt est public** (`MoneyVibesGroup/prospera-stories`). Les fiches remplies et signées, et
l'identité des experts, **n'y sont jamais versées** : elles sont conservées dans l'espace documentaire
de l'entreprise. Le registre ne consigne que le **verdict**, sa **date**, l'**empreinte** examinée et
un **identifiant opaque** de la fiche — jamais un nom de fichier ou une mention qui porterait le nom de
l'expert.

## Ce que le produit ne demande PAS de valider

| Ce qu'on ne fait pas valider | Pourquoi | Ce qui, là-dedans, est soumis quand même |
|---|---|---|
| Le **texte** de l'art. 431 — la liste des comptes | c'est la norme, pas une proposition | sa **transcription** est notre affaire et elle est **imparfaite** : 90 comptes sur 1 052, 26 libellés abrégés (R-06, STORY-671). Le **niveau de détail** retenu est une proposition : question 1.6 |
| L'**architecture** du moteur — versions immuables, empreintes, manifestes, évaluation des formules | c'est du logiciel, que l'expert n'a pas à connaître | ses **règles de rattachement**, qui décident des montants, sont écrites en clair ci-dessous et en [`formules-en-clair.md`](formules-en-clair.md) : elles font partie de ce qu'on soumet |
| Les **textes** de 2024 et la circulaire de 2005 | ce sont des normes | notre **lecture** : questions 5.2, 5.4 et 6.1 |

## Comment le produit passe d'une balance aux postes

Ce sont les règles qui décident des montants. Lues dans le code de `bilan-service` le 2026-09-26.

- **Un compte est capté par le plus long préfixe** que cite la table de passage, **tous états
  confondus**, et reçoit toutes les lignes qui portent ce préfixe : `6091` va aux postes qui citent
  `609` (`RC9`, `EV2`, `EN2`), jamais à celui qui cite `60` (`RC1`). Un compte plus long que le plan
  (jusqu'à 6 chiffres) se rattache à son préfixe **sans qu'aucune erreur ne puisse être détectée**
  s'il est mal placé. Et un compte que l'art. 432 range au compte 80 mais que le plan ignore — `6030`,
  `6060`, `606`, `703`, `706` — est capté par `60` ou `70` : il n'alimente que `RC1` ou `RP1`, jamais le
  compte 80 (R-08).
- **Une surcharge de rattachement** validée par une organisation l'emporte sur la table packagée —
  comptes 80 et 87 compris — sans changer l'empreinte du paquet : ce que ce dossier fait valider, c'est
  la table packagée, pas les surcharges d'une organisation (R-47).
- **Un compte qu'aucune ligne ne capte** est écarté de tous les totaux et **publié** avec son solde ;
  s'il n'est pas nul, un contrôle **bloquant** (`COMPTES_NON_AFFECTES`) empêche de valider la liasse.
  Exception : la route qui sert les comptes 80 et 87 ne publie pas ces comptes — ils y disparaissent en
  silence (R-29). Sur `@5.0`, **23** comptes du plan ne sont captés par rien (`formules-en-clair.md` § 8).
- **Actif** (`NET_ACTIF`, `SOLDE_DEBITEUR` — même calcul) : débit en brut, crédit en amortissements, net =
  débit − crédit. **Passif** (`SOLDE_CREDITEUR`) : crédit − débit. **Charge** : débit − crédit.
  **Produit** : crédit − débit.
- **Un solde de sens inverse** sur un compte rattaché à un seul côté **diminue** son poste, compté en
  négatif, sans signal. Un compte rattaché aux **deux** côtés (`46`) va, compte par compte, du côté
  que désigne le sens de son solde.
- **Une variation** (`Δ`) est la valeur d'un poste de bilan à l'arrêté N moins sa valeur à N-1. Sans
  colonne N-1, elle n'est **pas publiée** — jamais mise à 0.
- **Le résultat** des classes 6 et 7 est ajouté au **total** du passif pour que l'actif égale le passif ;
  la ligne `CP1` publiée ne le contient pas (question 1.5).
- **L'agrément** se déduit des comptes d'affaires directes présents dans la balance ; le modèle du
  compte 80 qui ne s'applique pas est servi **vide** (question 3.1).
- **Les contrôles** qui décident si une liasse CIMA est validable : équilibre du bilan, cohérence du
  résultat, comptes non affectés. L'articulation du compte 80 n'est calculée qu'en consultation.

## Le statut de l'artefact

Il vaut **`amorce`**, et c'est la valeur juste. Le vocabulaire en compte trois :

| Statut | Sens |
|---|---|
| `certifie` | une validation par un professionnel qualifié est **consignée** |
| `a-valider-par-expert` | transcription **couvrant les états de sa norme**, sans validation |
| `amorce` | le paquet **déclare lui-même** ne pas couvrir des parties obligatoires de sa norme |

La mise en garde de `@5.0` énumère ce qu'il ne couvre pas — états C1 à C25, reprise de l'impôt,
rétrocession, cessions à l'étranger, plafonds de l'art. 308, compte 88, niveau de détail du plan.
Passer à `a-valider-par-expert` serait prétendre le contraire.

⛔ **Il n'est pas publié partout où le paquet est servi.** Onze routes le servent — catalogue et
diagnostic du référentiel, les six états en consultation (`dry-run`), référentiel et suggestions de
comptes de `balance-service`, référentiel d'`assurance-service` ; le
**jeu d'états** — création, validation, dépôt — et l'**export PDF/XLSX** ne le servent pas. Une liasse
CIMA exportée ne dit pas qu'elle vient d'une amorce : réserve **R-01**, la première du registre.
⚠️ La liasse **scellée**, elle, stocke le statut et la mise en garde du paquet qui l'a produite, et deux
routes les ressertent sous `liasse` : c'est là que la correction de R-01 doit les lire.

### La bascule à `certifie` — ce qu'elle exigera

La signature est une condition **nécessaire, pas suffisante** (STORY-540, D-540-2) :

1. **Chaque ligne** de la version à certifier a été **validée telle quelle**, ou corrigée **puis revue**
   par le même profil — l'empreinte revue est celle que le `meta` citera.
2. **La mise en garde ne dit plus** « Restent NON couverts » : tant que le paquet est une amorce, une
   validation se **consigne** (registre, fiche signée) sans changer le statut.
3. **Une story propre** fera la bascule : elle ajoutera au `meta` un bloc du signataire — nom, qualité,
   date, empreinte validée — et fera **refuser par le générateur** tout `certifie` sans lui
   (aujourd'hui, il l'accepterait : R-03). La garde « aucun paquet ne se déclare `certifie` » sera
   révisée **sciemment**, avec la preuve de validation.
4. **Le nom publié suppose l'accord** du signataire, recueilli sur sa fiche : le `meta` est servi à
   tout utilisateur du produit — et à tout lecteur de ce dépôt public, si le paquet y est copié.

## Au retour des fiches

1. **Consigner** chaque verdict au [registre](registre-des-reserves.md) : statut, date, empreinte,
   référence de la fiche — jamais la fiche elle-même.
2. **Une réserve infirmée devient une story**, qui cite son identifiant `R-NN`.
3. **Une correction de l'artefact est une nouvelle version** (`@6.0`…) ; `@1.0` à `@5.0` restent
   packagées intactes. **Une correction de méthode** produit une **nouvelle version d'évaluation** : les
   provisions sont des évaluations datées et versionnées (STORY-517), l'historique n'est pas réécrit.
4. **Une réponse « hors de ma compétence »** laisse la sous-question ouverte : elle part au profil
   suivant, ou reste au registre.

## Vérifier ce dossier

```bash
cd referentiels/validation-cima             # Python 3.9 ou plus
python3 generer_formules.py --verifier     # la copie est-elle l'artefact servi, le document est-il à jour ?
shasum -a 256 cima-assurances-5.0.json      # doit rendre 5234764a…0859
```

Le générateur **refuse** de travailler sur une copie dont l'empreinte n'est pas celle qu'épinglent les
manifestes de service, et `--verifier` échoue dès que [`formules-en-clair.md`](formules-en-clair.md)
ne correspond plus à la copie. Régénérer : `python3 generer_formules.py`.

## Ce qui précède ce dossier

- La fiche du 2026-07-21 ([`../../fiche-validation-referentiels-2026-07-21.md`](../../fiche-validation-referentiels-2026-07-21.md))
  soumettait `@1.0` ; sa § 2 est **remplacée** par ce dossier.
- L'histoire des cinq versions est dans [`../README-cima-assurances.md`](../README-cima-assurances.md).
