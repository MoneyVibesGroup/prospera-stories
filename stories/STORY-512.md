# STORY-512 : Le plan CIMA packagé s'arrête à 2 chiffres — la question du niveau de détail n'a jamais été posée

Status: in_progress

**Complexité :** high

**Épic :** EPIC-128 — Socle vertical CIMA
**Service :** `assurance-service` + `bilan-service` / `balance-service` (référentiel)
**Points :** 8 · **Sprint :** S20
**Origine :** revue de l'artefact, 2026-08-27 — **AD-11** de la spine.

---

## Le fait

`cima-assurances@1.0` porte **80 comptes, tous à 2 chiffres** : c'est la liste de l'article 431,
verbatim, et c'est exactement ce que l'amorce annonçait. Le rattachement résolvant par **plus long
préfixe**, tout fonctionne : un compte `3012` d'un assureur tombe sur la racine `30`.

⚠️ **Et c'est le problème.** Tout marche, rien ne refuse — et **la liasse n'a aucun détail** : les
25 postes agrègent 80 racines, là où SYSCOHADA en a 163 pour 174 comptes et le SFD 31 pour 372.
Un assureur réel tient des comptes à 4, 5 ou 6 chiffres ; ils se rattacheront tous, sans qu'aucune
erreur ne soit possible **ni détectable**.

⚡ **Le SFD a payé cette question deux fois** — STORY-172 (les comptes de paramétrage échappaient au
niveau de détail) puis STORY-368 (l'artefact était **tronqué à 156 comptes sur 372**, et personne ne
le voyait). **CIMA ne l'a jamais posée.**

## Cadrage mesuré avant de coder (2026-09-20)

⛔ **La question a été posée, et la réponse déplace la story.** Le recoupement exigé par l'AC-3 a été
fait contre la **page officielle** de l'article 431 (`cima-afrique.org`, Code CIMA 2019, art. 431
« Liste des comptes », *Modifié par Décision du Conseil des Ministres du 20 avril 1995*), octets
téléchargés et dépouillés — **pas** contre l'artefact, **pas** contre le README du dépôt.

### F1 — ⚡⚡ L'article 431 énumère 1 052 comptes sur QUATRE niveaux, pas 80 sur un seul

| Longueur | Comptes énumérés par l'art. 431 | Portés par `cima-assurances@1.0` |
|---|---|---|
| 2 chiffres | **79** | **80** (les 79 + `05`, cf. F2) |
| 3 chiffres | **345** | 0 |
| 4 chiffres | **499** | 0 |
| 5 chiffres | **129** | 0 |
| **Total** | **1 052** | **80** |

Répartition officielle par classe : 1 → 57 · 2 → 226 · 3 → 69 · 4 → 117 · 5 → 43 · 6 → 312 · 7 → 105 ·
8 → 61 · 0 → 62.

⇒ **Le plan packagé n'est complet qu'au niveau 2.** Ce n'est pas la troncature *accidentelle* de
STORY-368 (le SFD perdait 216 comptes sur 372 sans que personne l'ait décidé) : ici la limitation est
**déclarée** — l'artefact dit « comptes principaux à 2 chiffres, verbatim » et son `statut` vaut
`amorce`. Mais elle n'était **chiffrée nulle part**, et c'est ce chiffre qui manquait pour décider.

### F2 — ⚠️ `05` n'est pas imprimé dans la liste officielle en ligne

La page enchaîne `03` → `039` → **`050`** → `052`/`057`/`059` → `06` : les quatre enfants de `05`
y sont, **la racine non**. L'artefact porte `05 Plan d'investissement`, déduit de ses enfants. La
déduction est défendable, elle n'est pas du *verbatim* — et elle explique l'écart 80 / 79.

### F3 — ⚡ 26 libellés sur 79 sont ABRÉGÉS par rapport au texte, et plusieurs perdent leur portée

L'artefact annonce des libellés « verbatim ». Mesuré compte par compte : **26 divergent**. Trois
exemples qui ne sont pas cosmétiques — c'est la **portée du compte** qui disparaît :

| Compte | Artefact | Article 431 |
|---|---|---|
| `23` | « Valeurs mobilières et titres assimilés (affectables à la représentation) » | « …**détenus dans le pays concerné**, affectables à la représentation des engagements réglementés, **appartenant à l'entreprise et conservés par elle (autres que les titres de participation)** » |
| `31` | « Provisions techniques opérations d'assurance directe vie » | « …**dans le pays concerné** » |
| `78` | « Travaux faits par l'entreprise pour elle-même » | « Travaux faits par l'entreprise pour elle-même. **Charges non imputables à l'exploitation de l'exercice**, dans le pays concerné » |

⛔ **« Dans le pays concerné » n'est pas du remplissage** : le plan CIMA oppose explicitement le
national à l'étranger (`28` « Valeurs immobilisées à l'étranger », `159` « Étranger », `517` « Prêts à
l'étranger »). Un libellé qui laisse tomber la restriction fait lire un compte **national** comme un
**total**.

### F4 — ⚠️ L'exemple de l'énoncé est faux, et le vrai comportement est plus dur

L'énoncé dit « un compte `3012` d'un assureur tombe sur la racine `30` ». **`30` n'existe pas** : la
classe 3 de l'art. 431 commence à `31` (`31`, `32`, `34`, `35`, `38`, `39`). `3012` n'est donc
rattachable à **aucune** racine — `isCompteValide('3012')` rend `false`, et le compte est **refusé**
aujourd'hui. Le vrai angle mort n'est pas « tout passe » : c'est que sous une racine **qui existe**
(`3112`, `311234`, `3112345678`), **aucune profondeur n'est bornée**.

### F5 — ⚡⚡ L'article 430 dit 4 chiffres. L'article 431 en énumère 129 à 5. Le Code se contredit.

**L'article 430 « Classes comptables » est l'équivalent CIMA du texte que STORY-172 avait trouvé pour
le SFD** — c'est l'article qui *nomme* les niveaux. Verbatim, page officielle (la parenthèse non
fermée est dans le texte) :

> « Les classes du cadre comptable sont numérotées de 1 à 8 et 0. Chaque classe comporte des comptes
> principaux (dont le deuxième chiffre est numéroté de 0 à 9. Les comptes principaux sont eux-mêmes
> subdivisés en **comptes divisionnaires (trois chiffres)** à leur tour ventilés en **sous-comptes
> (quatre chiffres** dont le dernier est également numéroté de 0 à 9). Les chiffres qui codifient les
> comptes se lisent toujours à partir de la gauche. »

⛔ **Et l'article 431 ne respecte pas l'article 430** : il énumère **129 comptes à 5 chiffres**
(`01010`, `01011`, `01030`, `01031`, `20480`, `69091`…) — un niveau que le cadre ne nomme pas et
n'autorise pas.

⚠️ **La différence décisive avec le SFD.** Le texte BCEAO porte une **clause d'ouverture** — « les
autres chiffres décrivent de façon plus détaillée la nature des opérations » — qui laisse
l'établissement subdiviser. **Le Code CIMA n'en a aucune** : ni « liste non limitative », ni « les
entreprises peuvent créer les subdivisions dont elles ont besoin ». La seule latitude du Code est
nominative et vise **un** compte : « Ce compte [`08`] est subdivisé, **selon les besoins**, en comptes
divisionnaires et sous-comptes structurés sur le modèle de la classe 2 » (art. 432).

⇒ Le silence du Code au-delà de ce qu'il énumère est un **silence**, pas une permission. On ne peut
donc ni plafonner à 4 (le texte lui-même en fait 5), ni justifier davantage que 5 par un texte.

⚠️ Le README du dépôt (`docs/referentiels/README-cima-assurances.md`) écrit « comptes principaux à
2 chiffres, divisionnaires à 3, sous-comptes à 4 » : c'est une transcription **fidèle de l'art. 430**,
et **insuffisante** — elle décrit le cadre, pas la liste, et la liste va plus loin. Deuxième fois que
ce README induit en erreur (la revue de STORY-491 y avait déjà corrigé « Livre III, Titre IV » en
« Livre IV »). ⇒ **Une référence recopiée d'un README n'est pas une référence vérifiée** — la règle
de 491 s'applique à elle-même.

### F6 — Une coquille dans la page officielle elle-même : `6126` pour `6026`

La page de l'art. 431 imprime `6126. Frais accessoires` — en classe 6, sous `602. Prestations et frais
payés`. L'**article 432 tranche** : il cite `6026` **trois fois** (« au débit des sous-comptes 6020 et
6026 », « par le débit des comptes 6020 et 6026 », « comptabilisés au compte 6026 »). C'est `6026`.
De même, `6905` est imprimé **sans son point** dans la liste — un parseur naïf sur `^\d+\.` le perd —
et l'art. 432 confirme son existence (« 602, 604, 605, 606, 6902, 6904, 6905 »). ⇒ **Deux pièges pour
la transcription de STORY-671**, relevés ici pendant qu'ils sont sous les yeux.

## Décisions de cadrage du 2026-09-20 — à relire en revue

| # | Décision | Pourquoi |
|---|---|---|
| **D-512-1** | `longueurCompteDetail` **= 5** pour `cima-assurances@1.0` | **Sourcé, pas choisi — et le sourcing est double.** L'art. 430 nomme les niveaux et s'arrête à 4 ; l'art. 431 **énumère 129 comptes à 5 chiffres**. Déclarer `4` refuserait `20480`, qui est un compte **du plan officiel** : entre le cadre théorique et la liste qui l'applique, c'est la liste qui fait foi. Exactement la méthode de STORY-172 (« la longueur se constate sur le plan lui-même, pas par analogie avec SYSCOHADA ») — appliquée ici au plan **officiel**, non au plan packagé. ⚠️ Et l'on ne peut pas aller au-delà de 5 : contrairement au RCSFD, le Code CIMA **n'a aucune clause d'ouverture** (F5) |
| **D-512-2** | La valeur ne se dérive **PAS** du plan packagé | Le plan packagé s'arrête à 2 : en dériver `2` refuserait **tout** compte réel d'assureur (`3112` est un compte de production normal). Le niveau de détail est une propriété du **référentiel**, pas de l'état d'avancement de sa transcription |
| **D-512-3** | ⛔ Le plan n'est **pas** enrichi ici. F1 et F3 partent en **STORY-671** | AC-5 : « on ne complète pas un plan comptable par analogie » — et on ne transcrit pas 972 comptes en marge d'une story de 8 points. La transcription change les **octets** de l'artefact dans **trois** dépôts, impose une **version `@1.1`**, et rouvre la table de passage. C'est une story, avec son sourcing |
| **D-512-4** | La branche fail-open `longueurDetail === undefined` reste **exercée**, sur une entrée **synthétique** | CIMA était le **seul** référentiel packagé sans niveau de détail : le déclarer rend la branche inatteignable depuis le manifeste de production. Patron déjà rencontré en STORY-494 (`nonPackage` devenu vacant) — la garde s'exerce sur une entrée fabriquée, jamais on ne laisse mourir le mécanisme |
| **D-512-5** | `05` est **conservé** et sa déduction est **écrite** | Ses quatre enfants sont au texte ; le retirer casserait le rattachement de `050…059` sans rien gagner. Ce qui manquait n'est pas le compte, c'est la **mention** qu'il est déduit |

## Périmètre

### Livré

- `longueurCompteDetail: 5` déclaré pour `cima-assurances@1.0` dans les manifestes de
  **`balance-service`** et **`assurance-service`**, avec son sourcing **au commentaire du manifeste**
  (article, URL, méthode de constat).
- Le comportement en profondeur **testé et documenté** : rattachable par préfixe jusqu'à 5 chiffres,
  refusé par `isCompteDeDetail` au-delà — et `isCompteValide` inchangé (deux prédicats, deux
  questions).
- La branche fail-open `longueurDetail === undefined` **conservée et exercée** sur une entrée
  synthétique (D-512-4).
- La garde de **byte-identité** inter-dépôts conservée, et **prouvée détectante** par mutation.
- Le recoupement F1/F2/F3 **consigné** ici, et **STORY-671** créée avec son sourcing.
- Correction du README `docs/referentiels/README-cima-assurances.md` sur la profondeur (F5).

### Hors périmètre

- ⛔ **La transcription des 972 comptes manquants** et la correction des 26 libellés abrégés →
  **STORY-671**. Aucun octet de `cima-assurances-1.0.json` n'est touché ici, dans aucun des trois
  dépôts : le checksum reste `9ca429c8…`.
- Toute évolution de la **table de passage** ou des **postes** de la liasse.
- `bilan-service` : il ne porte pas la notion de `longueurCompteDetail` (il ne valide aucun compte
  déposé) — il reste la **source des octets**, inchangée.
- Contrats, quittances, primes (STORY-513) et provisions (STORY-514).

## Critères d'acceptation

- [ ] AC-1 — Un `longueurCompteDetail` est **déclaré** pour `cima-assurances`, comme il l'est pour
      les autres référentiels — et il est **sourcé**, pas choisi.
- [ ] AC-2 — Le comportement sur un compte plus long que la profondeur du plan est **testé et
      documenté** : accepté par rattachement de préfixe, ou refusé. ⛔ Le laisser implicite reproduit
      exactement l'angle mort de STORY-172.
- [ ] AC-3 — ⚠️ **Vérifier que les 80 comptes sont bien la liste complète de l'article 431**, en
      recoupant contre la source officielle — pas contre l'artefact. C'est précisément le contrôle
      qui a révélé la troncature du SFD.
- [ ] AC-4 — La byte-identité de l'artefact entre `balance-service` et `bilan-service` est **gardée**
      (règle AD-6/STORY-368), et la garde **prouve qu'elle détecte** (test de mutation).
- [ ] AC-5 — Si le plan doit être enrichi au-delà de l'article 431, l'enrichissement est **une story
      séparée avec son sourcing** : on ne complète pas un plan comptable par analogie.

## Table de mutations obligatoire

⚠️ À remplir **pendant** le dev : chaque mutation réellement appliquée, prouvée rouge, puis restaurée.
Une mutation qui ne compile pas n'est pas « 0 test », c'est une mutation **mal formulée** (leçon
STORY-505) — la reformuler, ne jamais la compter.

| ID | Mutation à appliquer | Ce qui doit virer au rouge |
|---|---|---|
| M1 | `longueurCompteDetail: 5` → `6` dans le manifeste de `balance-service` | le test de valeur sourcée |
| M2 | `longueurCompteDetail: 5` → `6` dans le manifeste d'`assurance-service` | le test de valeur sourcée |
| M3 | Retirer la ligne `longueurCompteDetail` du manifeste CIMA (retour au fail-open) | les tests de profondeur : un compte à 6 chiffres redevient « de détail » |
| M4 | `normalise.length <= longueurDetail` → `<` dans `estCompteDeDetail` | le test de la borne exacte (5 chiffres accepté) |
| M5 | Altérer un octet de `cima-assurances-1.0.json` dans **un** dépôt | la garde de byte-identité, dans les **trois** dépôts |
| M6 | Faire pointer la garde sur le dépôt local au lieu du voisin | la garde cesse de comparer — elle doit rougir, pas passer |
| M7 | Supprimer l'entrée synthétique qui exerce le fail-open | la couverture de branche de `estCompteDeDetail` |

## Definition of Done

- [ ] Statut synchronisé dans ce document, `sprint-status.yaml` et le présent Progress Tracking.
- [ ] Lint 0 warning, build, couverture ≥ 65/90/90/90, unit + e2e verts sur **`balance-service`** et
      **`assurance-service`**.
- [ ] M1 à M7 appliquées une par une, prouvées rouges, puis restaurées.
- [ ] ⛔ **Non-régression mesurée sur `balance-service`** : déclarer un niveau de détail pour CIMA
      **restreint** `isCompteDeDetail`. Aucune suite existante ne doit changer de verdict sans que ce
      soit voulu et dit.
- [ ] Checksum `cima-assurances-1.0.json` **inchangé** dans les trois dépôts (`9ca429c8…`).
- [ ] STORY-671 créée, sourcée et slottée.
- [ ] Revue de code et revue de sécurité sans constat ouvert.
- [ ] PR module(s) vers `dev`, PR docs vers `main`, rebase-merge, branches supprimées.

## Progress Tracking

- **Statut courant :** `in_progress` — ouverte le **2026-09-20**.
- **2026-09-20 — cadrage mesuré :** branche `MNV-512` sur `docs`. Page officielle de l'art. 431
  téléchargée et dépouillée (1 093 lignes, 1 052 comptes extraits) ; artefact comparé compte par
  compte et libellé par libellé. Cinq constats : F1 (troncature de profondeur, 80/1 052), F2 (`05`
  déduit), F3 (26 libellés abrégés), F4 (l'exemple `3012`/`30` de l'énoncé est faux — `30` n'existe
  pas), F5 (l'art. 430 plafonne à 4, l'art. 431 en énumère 129 à 5 — le Code se contredit, et il n'a
  **aucune** clause d'ouverture là où le RCSFD en a une), F6 (deux coquilles dans la page officielle,
  `6126` pour `6026` et `6905` sans point, arbitrées par l'art. 432). Cinq décisions : D-512-1 à
  D-512-5. **Recoupement croisé** : art. 430, 431 et 432 relus un par un sur les pages officielles ;
  le PDF consolidé cité par le README (`droit-afrique.com`) est **mort**.

## Notes

- Voir [[STORY-172]], [[STORY-368]], [[STORY-488]], [[STORY-491]], [[STORY-494]] (le patron de la
  garde devenue vacante), [[STORY-671]] (la transcription complète), spine AD-11.
- Source officielle : art. 431 · https://cima-afrique.org/wp-content/code-cima/fr/Article431Listedescomptes.html
