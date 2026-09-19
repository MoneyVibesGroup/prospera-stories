# STORY-509 : États DIMF 2000 et 2080 — et le jalon `format confirmé` avant d'écrire une ligne

Status: ready-for-dev

**Épic :** EPIC-127 — États périodiques et ratios prudentiels BCEAO
**Service :** `microfinance-service` + `bilan-service`
**Points :** 8 · **Sprint :** S20
**Origine :** découpage `epics-microfinance-2026-08-27.md`, **AD-10** de la spine.

---

## Le fait

`sfd-bceao@2.0` produit **déjà** la matière : ses postes de bilan (`BA1..BA4` / `BP1..BP4`, totaux
`BAT`/`BPT`) et son compte de résultat (`RC1..RC8` / `RP1..RP6`, cascade `RSA → RSG`) sont
**dérivés des états DIMF 2000 et 2080**. *(Vérifié dans l'artefact le 2026-08-27.)*

Ce qui manque n'est pas le calcul : c'est **le format de dépôt**. Un état réglementaire n'est pas un
tableau à l'écran — c'est un gabarit attendu par la Commission Bancaire, avec ses codes de ligne,
son ordre, son support et son canal.

## ⛔ Jalon `format confirmé` — même garde qu'EPIC-032 pour le dépôt fiscal

**Aucune ligne de code avant d'avoir en main le gabarit officiel.** Le programme a déjà payé cette
leçon deux fois : les échéances d'acomptes posées en trimestriel au lieu des dates réelles, et le
RSL à 10 % au lieu de 8,75 % — deux erreurs **plausibles**, donc invisibles à la relecture.
⇒ *Les chiffres et les formats d'un état réglementaire se prennent dans la source officielle, jamais
dans le vraisemblable.*

## ✅ TRANCHÉ PAR LE PO — 2026-08-28 : **VOIE A**, le produit dépose

La doctrine est posée par [[STORY-525]] et vaut pour les trois verticaux. Cette story produit donc
**le fichier déposable**, pas seulement l'état imprimable — et elle hérite du contrat commun de
[[STORY-536]] (paquet de dépôt) et de [[STORY-538]] (transmission, accusé, rejet).

⛔ **Le jalon `format confirmé` reste entier** : aucun développement avant que le gabarit officiel
de la Commission Bancaire ne soit au dépôt, sourcé et daté.

---

## Ce qui devait être tranché — conservé pour la traçabilité

**Q1 — Prospera produit-il le fichier déposable, ou l'état imprimable que l'IMF dépose elle-même ?**
La seconde réponse est parfaitement défendable et divise le coût. ⚠️ **C'est la même question que
STORY-525 pose pour le dépôt fiscal, et elle mérite la même réponse** — deux doctrines de dépôt
dans un même produit seraient incompréhensibles pour le cabinet.

## Critères d'acceptation *(applicables une fois Q1 tranchée)*

- [ ] AC-1 — Le gabarit officiel est **sourcé et référencé** (instruction, année, version) avant tout
      développement, et versé au dépôt.
- [ ] AC-2 — L'état est produit **depuis la liasse SFD déjà calculée**, jamais recalculé en parallèle.
      Deux moteurs sur le même nombre divergeraient en silence.
- [ ] AC-3 — L'état porte **sa période, sa date d'arrêté et la version du gabarit**.
- [ ] AC-4 — ⚠️ Une périodicité **infra-annuelle** (les états DIMF sont périodiques, pas seulement
      annuels) suppose des arrêtés intermédiaires : vérifier que l'exercice du dossier le permet
      **avant** de promettre le mensuel ou le trimestriel.

## Notes

- Voir [[STORY-525]] (la même question, côté fiscal), [[STORY-510]], spine AD-10.

---

## ✅ Jalon `format confirmé` — LEVÉ le 2026-09-19 (sauf un arbitrage produit)

Le constat de blocage posé plus tôt le même jour disait vrai de l'**arbre** — zéro code de ligne
DIMF, `tmp/` suivi par aucun dépôt — mais il concluait trop vite que la matière n'existait pas. Une
recherche sur les sources officielles a trouvé l'essentiel. Tout ce qui suit a été **lu dans les PDF
primaires**, pas résumé depuis un site tiers.

📄 **Tout est consigné, sourcé et daté dans
[`referentiels/README-etats-dimf-sfd-bceao.md`](../referentiels/README-etats-dimf-sfd-bceao.md)** —
empreintes sha256, cartographie des annexes page par page, textes cités article par article.

### ⭐ Le gabarit officiel existe en accès public, et il est lisible par machine

La **version développée du RCSFD** (457 p., ISBN 978-2-916140-08-7, maquette 27/07/2009) est publiée
par la **DRSSFD du Trésor ivoirien**. Vérifié directement :

- **Annexe 2.2** — `BILAN VERSION DEVELOPPEE`, `DIMF 2000`, colonne `Code poste`, en-têtes complets ;
- **Annexe 3.3** — `DIMF 2080` développé (`D : RA0`) ;
- **Annexe 2.4** — le **hors-bilan**, dans les deux versions ;
- **Annexe 1** — la **concordance codes postes ↔ plan de comptes**, en formules directement
  transcriptibles (`A01 = + 101 + 1101 + … − 199`, `A10 = + 10`, `A11 = + 101`).

⚡ **Le tout sort de `pdftotext -layout` en texte brut** — ni image, ni OCR, ni transcription à la
main. C'est précisément ce qui manquait à **AC-2**, et le livre contient **les deux versions**.

### AC-4 est tranché : les DIMF sont ANNUELS

L'infra-annuel existe (loi-cadre **art. 55**), mais il porte sur des « **données périodiques** »
régies par l'Instruction **n°020-12-2010** — mensuelles pour les SFD de l'article 44, trimestrielles
pour les autres. **Ce ne sont pas les DIMF.** Les états de synthèse sont **arrêtés au 31 décembre**
et transmis dans les **six mois** (Instruction n°030-02-2009, art. 6 ; loi-cadre art. 51-52).

### ⚠️ Le gabarit que nous détenions est celui du cas MARGINAL

Trois textes, et la règle n'est lisible dans aucun pris isolément :

- Instruction **n°030-02-2009 art. 4** — les SFD de l'**article 44** *doivent* la version développée ;
- Instruction **n°021-12-2010 art. 2** — l'allégée est réservée aux encours **< 50 M FCFA** sur deux
  exercices, et le choix inverse est **irréversible** (art. 3) ;
- Instruction **n°007-06-2010** — l'article 44, c'est **≥ 2 Md FCFA** sur deux exercices.

⇒ La bande **entre 50 M et 2 Md FCFA** n'est ni tenue par l'article 44, ni éligible à l'allégée :
elle relève de la **développée**. **L'allégée est l'exception, pas la règle** — or c'est son gabarit
que nous avions en main.

### ⛔ Ce qui reste ouvert — un arbitrage PRODUIT, plus une incertitude documentaire

**Il n'existe aucun format de fichier normé, et ce n'est pas une lacune de nos sources : c'est le
texte qui n'en prévoit aucun.** Instruction n°030-02-2009, art. 7 :

> « Les états financiers ou documents de synthèse sont communiqués **sur support papier** […]
> revêtus de la **signature** d'une personne dûment accréditée […]. Ils **peuvent également** être
> transmis […] **sur support électronique, en complément** des documents sur support papier. »

Cinq exemplaires au Ministre, plus deux à la BCEAO et deux à la Commission Bancaire pour les SFD de
l'article 44. Aucun XML, aucun schéma, aucune plateforme régionale de télétransmission.

⇒ **Question au PO, et elle seule reste bloquante** : la voie A ([[STORY-525]]) engage le produit à
« produire le fichier déposable ». Puisque le dépôt légal est **papier signé**, cela signifie
produire un **document imprimable conforme au gabarit** (PDF/A prêt à signer), et non un flux de
télétransmission. **Confirmer cette lecture avant d'écrire le générateur.**

Piste non vérifiée, à ne pas confondre avec une source : des canevas électroniques nationaux sont
rapportés par des communiqués et la presse (DRSSFD Côte d'Ivoire, e-Contrôle au Bénin, « Espace Pro »
au Sénégal). **Aucun fichier téléchargé, aucun texte fondateur trouvé.**

### Ce que la story peut faire dès maintenant

- [x] AC-1 — gabarit officiel **sourcé et référencé** (instruction, année, version) et versé au
      dépôt sous forme de fiche de référence avec empreintes sha256 et cartographie des annexes.
      ⚠️ Les PDF eux-mêmes ne sont pas committés (23,5 Mo) : patron du dépôt, URL + sha256.
- [ ] AC-2 — produire l'état depuis la liasse déjà calculée, via l'annexe 1 de concordance.
- [ ] AC-3 — période, date d'arrêté et **version du gabarit** portées par l'état.
- [x] AC-4 — périodicité **annuelle** établie ; l'infra-annuel relève d'un autre livrable.
- [ ] ⛔ **Préalable** : arbitrage PO sur la forme du livrable (document imprimable signable).

### Rattachement à l'existant

[[STORY-536]] est **livrée** (2026-09-19) : le contrat de paquet de dépôt que cette story consommera
existe — `format` + `schema`, `gabarit` poste → case **sourcé case par case**, `canal`, `calendrier`,
`penalites`, vérifié par checksum. ⚠️ Son alphabet d'`etat` (`^[A-Z][A-Z0-9-]{1,39}$`) n'accepte ni
espace ni minuscule : les états devront être codifiés **`DIMF-2000`** et **`DIMF-2080`**.

⚠️ Le `canal` du paquet devra déclarer un dépôt **papier** (`DEPOT_PHYSIQUE`), pas un téléservice —
le vocabulaire du contrat le prévoit déjà.
