# STORY-523 : États annuels CIMA (art. 433) — une trentaine d'états, pas une liasse

Status: in_progress

**Épic :** EPIC-134 — États annuels CIMA et marge de solvabilité
**Service :** `assurance-service` + `bilan-service`
**Points :** 13 · **Sprint :** S20
**Complexité :** high
**Prérequis :** **STORY-521** (les trois comptes de résultat) — `done`
**Origine :** découpage `epics-assurance-2026-08-27.md`, **AD-10** de la spine.

---

## Le fait

L'article **433 du code CIMA** publie les **états modèles**. Ce n'est pas une liasse de quatre
états : c'est une **trentaine d'états annexes** (répartition des primes, sinistres par branche et
par exercice de survenance, placements, réassurance, engagements réglementés…). L'analyse du
2026-07-21 les a explicitement mis **hors amorce**.

⛔ **C'est ici que l'écart de promesse se referme ou explose.** Un assureur à qui l'on vend « le
bilan CIMA » comprend **la liasse réglementaire**, c'est-à-dire ces états-là — pas un bilan et un
compte de résultat.

## ✅ TRANCHÉ PAR LE PO — 2026-08-28 : **VOIE A**, le produit dépose

⇒ **Le jalon `format confirmé` devient la story elle-même** : tant que les gabarits de l'art. 433
ne sont pas au dépôt, il n'y a rien à chiffrer.

---

# ⛔ JALON `format confirmé` — LEVÉ le 2026-09-22

**Les gabarits sont au dépôt.** Relevé sur le texte officiel de l'article 433 (*États modèles*),
**3 757 lignes utiles, 50 blocs d'en-tête**, croisé avec les articles **422** (liste annuelle
faisant autorité), **422-1** (états de groupe), **422-2** (intermédiaires) et **425** (régime de
dépôt). Aucun état de la liste de l'art. 422 n'est sans gabarit — **sauf un**, et c'est le constat
M3.

---

## Les constats mesurés

### M1 — La liste annuelle faisant autorité est l'art. 422, et elle compte 18 états + 4 comptes

> **Art. 422** — « Outre les comptes prévus par ailleurs au plan comptable, notamment : le bilan
> établi selon le compte 89 ; le compte d'exploitation générale établi selon le compte 80 ; le
> compte général de pertes et profits établi selon le compte 87 ; le compte des résultats en
> instance d'affectation établi selon le compte 88, **les entreprises doivent établir chaque année
> les états suivants** : C1, C4, C5, C9, C10, C10a, C10b, C10c, C10d, C11, C20, C21, C25,
> C25 Bis (tableaux A et B), C26, RA1, RA2. »

⇒ **Le sous-ensemble déposable ne se choisit pas « par la valeur perçue »** : il est écrit. C'est
la réponse de la voie A à Q1.

### M2 — Deux états portent **deux modèles alternatifs**, pas deux colonnes

Le **compte 80** (déjà traité en STORY-521) **et l'état C1** :

> « L'état C1 établi par les entreprises d'assurances **sur la vie** comporte en colonnes les
> catégories concernées de l'article 411… »
> « L'état C1 établi par les entreprises d'assurances **en dommage** comporte… »

⇒ Même règle qu'au compte 80 : l'**art. 326 al. 3** interdit de pratiquer les deux, donc `C1_VIE`
et `C1_DOMMAGES` sont **alternatifs**. `deriverAgrement()` de STORY-521 les arbitre sans une ligne
de logique nouvelle.

### M3 — ⛔⛔ L'état **C11 n'a aucun gabarit, et n'en aura jamais**

> **Art. 433** — « **La présentation de l'état C11 est laissée à l'initiative de chaque
> entreprise.** »

C'est la **seule** occurrence de cette formule dans tout l'article 433 : 2 lignes là où le C4 en a
138 et le C10 en a 470.

⚡ **Conséquence sur la garde elle-même.** Le jalon dit « aucune ligne de code avant d'avoir les
**gabarits** officiels en main ». Appliqué littéralement au C11, il **bloque pour toujours** : le
régulateur a délégué la forme. Or le **contenu** du C11 est, lui, entièrement normé — art. **337-1**
(éléments constitutifs), **337-2** (montant minimal IARD), **337-3** (montant minimal vie),
**337-4** (sociétés mixtes).

⇒ **D-523-3 reformule la garde** : *gabarit imposé **ou** norme de contenu identifiée*. Un état à
forme libre n'est pas un état non spécifié.

### M4 — Les « squelettes » du groupe sont des états **narratifs**, pas des gabarits manquants

G5, G13, G14, G16 tiennent en 2 à 9 lignes parce que le Code y demande une **description**, pas un
tableau : « les entreprises **dressent la liste** des GIE, pools et autres groupements… », « les
entreprises **décrivent sommairement**… ». Un relevé qui les compte comme « gabarit absent » se
trompe de forme.

### M5 — Cinq états sont réservés à un agrément, et le texte le dit

| État | Réservé à | Source |
|---|---|---|
| `C1_VIE` | vie et capitalisation | art. 433, « établi par les entreprises d'assurances sur la vie » |
| `C1_DOMMAGES` | toute nature | art. 433, « établi par les entreprises d'assurances en dommage » |
| `C20`, `C21` | vie et capitalisation | art. 433, « établi par les entreprises d'assurances sur la vie » |
| `C10A`, `C10B` | toute nature | art. 433, « pour l'ensemble des opérations d'assurances **dommages** » |
| `C10`, `C10C`, `C10D` | toute nature | art. 433 — RC véhicules terrestres à moteur / transports / sinistres de grande ampleur |

⇒ **C'est la matière de l'AC-4** : sur un assureur vie, neuf états sortent `NON_APPLICABLE` —
servis et expliqués, jamais masqués.

### M6 — Le régime de dépôt CIMA est **le même que celui du SFD** : papier certifié

> **Art. 425** — « Les entreprises **remettent au Ministre** en charge des assurances […] dans les
> **trente jours qui suivent la réunion de leur assemblée générale et au plus tard le 1er juin** de
> chaque année, un dossier relatif aux opérations effectuées au cours de l'exercice écoulé. Ce
> dossier est produit **en trois exemplaires**. Il est **certifié** par le président du Conseil
> d'Administration […] : “le présent document, comprenant x feuillets numérotés, est certifié
> conforme aux écritures de l'entreprise et aux règles applicables à l'assurance, sous les sanctions
> prévues”. […] Elles doivent adresser les mêmes documents dans les mêmes conditions à la
> **Commission de Contrôle des Assurances**. »

⇒ **Aucun format de fichier n'est prescrit.** Exactement ce que [[STORY-509]] avait mesuré pour les
SFD (art. 7 de l'instruction n°030-02-2009 : support papier signé). **La doctrine de dépôt unique
demandée par Q1 existe donc déjà** — `DEPOT_PHYSIQUE` — et elle n'est pas un choix produit : c'est
la mesure, deux fois.

### M7 — ⚠️ Le bilan CIMA servi aujourd'hui est à **10 postes** face à un gabarit de **296 lignes**

Mesuré sur `cima-assurances@5.0` : `BILAN_ACTIF` **5 postes**, `BILAN_PASSIF` **5 postes**. Le
modèle du compte 89 de l'art. 433 en aligne 296.

⛔ **Publier « bilan : produit » sur cet écart est exactement l'écart de promesse que la story
nomme.** D-523-6 y répond sans inventer de verdict.

### M8 — L'état C10b est déjà produit — **par l'autre service**

`assurance-service`, module `etat-sinistres` (STORY-516). Un catalogue servi par `bilan-service` qui
déclarerait « C10b : non produit » serait **faux le jour de sa livraison**.

---

## Les décisions

**D-523-1 — Le jalon `format confirmé` est levé**, et le relevé est versé au dépôt sous forme
d'artefact sourcé `etats-cima@1.0`, à l'identique du patron `etats-dimf-sfd-bceao@1.0` de
STORY-509 (générateur + portes + sha256 + registre + pont depuis le référentiel comptable).

**D-523-2 — Le périmètre de CETTE story est le catalogue, pas les trente états.** La story livre
*le format confirmé* : l'inventaire sourcé, son applicabilité, et **le statut de production dérivé**.
La transcription ligne à ligne de chaque état reste le **lot**, en stories dédiées — conformément à
« 13 points est une borne basse assumée […] son chiffrage réel sort du jalon ».

**D-523-3 — La garde du jalon devient : *gabarit imposé **ou** norme de contenu identifiée***
(cf. M3). Le C11 entre au catalogue avec `gabarit: "LIBRE"` et ses articles de contenu.

**D-523-4 — Hors périmètre, nommément** : les états de **groupe** G1..G16 (art. 422-1 — réservés
aux entreprises tenues d'établir des comptes consolidés ou combinés au sens de l'art. 434) et les
états **intermédiaires** T1/T2 et semestriels (art. 422-2). Ils entrent au catalogue — **l'AC-3
l'exige** — avec leur rythme, et ne sont pas produits.

**D-523-5 — Le statut de production est DÉRIVÉ, jamais déclaré.** Un catalogue qui porterait
`produit: true/false` en dur serait une seconde constante que rien ne confronte — le défaut mesuré
en [[STORY-519]]. Le statut se lit sur ce que le moteur **émet réellement**.

**D-523-6 — Face à l'écart de M7, le catalogue publie deux nombres mesurés, pas un verdict** :
`postesPublies` (dérivé du paquet servi) et `lignesGabarit` (sourcé de l'art. 433). L'assureur voit
`10 / 296` et juge. **Le produit n'invente aucun seuil de complétude** — un seuil arbitraire
transformerait une mesure en promesse.

**D-523-7 — L'attribution inter-services est confrontée dans le dépôt qui la porte.** L'artefact
nomme le service producteur de chaque état (`produitPar`) ; une garde **dans chaque dépôt** vérifie
que les états qui lui sont attribués sont bien émis par lui. Aucune requête ni appel synchrone
inter-services (invariants #2 et #3) — même discipline que « un contrat d'événement touche 2 dépôts ».

---

## Critères d'acceptation

- [x] **AC-1** — Chaque état produit est **sourcé** (article, gabarit, version) et porte sa référence.
- [x] **AC-2** — Les états sont produits **depuis la liasse et les agrégats déjà calculés**, jamais
      recalculés en parallèle. Deux moteurs sur le même nombre divergeraient en silence.
- [x] **AC-3** — ⛔ **Les états NON produits sont nommés à l'écran**, avec leur code d'état — jamais
      omis. Un assureur doit savoir ce qu'il devra produire ailleurs. Doctrine FE-073, transposée.
- [x] **AC-4** — Un état non applicable (assureur mono-activité) rend `NON_APPLICABLE`, **visible et
      expliqué**, jamais masqué (STORY-521 AC-5).

## Hors périmètre — hooks inertes documentés

- La **transcription ligne à ligne** des états (concordances vers le plan de comptes) : le contrat
  d'artefact prévoit un champ `lignes` **absent en `@1.0`**, que les stories du lot rempliront état
  par état sans changer le contrat.
- Le **calcul** du C11 (marge de solvabilité, art. 337-1 à 337-4) : EPIC-134 le porte en propre.
- Les états **de groupe** et **intermédiaires** (D-523-4).

## Notes

- Voir [[STORY-509]] et [[STORY-525]] (la même question de doctrine), [[STORY-521]], [[STORY-524]].

## Progress Tracking

- 2026-09-22 — branche `MNV-523` ouverte sur `docs/`, `bilan-service`, `assurance-service`.
- 2026-09-22 — **jalon `format confirmé` levé** : relevé de l'art. 433 (3 757 lignes, 50 blocs),
  croisé art. 422 / 422-1 / 422-2 / 425. Constats M1 à M8, décisions D-523-1 à D-523-7.
