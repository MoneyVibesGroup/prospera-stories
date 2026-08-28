# STORY-496 : Le dossier n'a que deux axes — le régime dérogatoire (zone franche, code des investissements) n'a nulle part où se déclarer

Status: ready-for-dev

**Épic :** EPIC-109 — Paquets fiscaux pays : gabarit, garde et procédure de sourcing
**Service :** `dossier-service` (axes) + `balance-service` (`modules/fiscal`, résolution du paquet)
**Points :** 8 · **Sprint :** S20
**Origine :** revue **expert-comptable** de la maquette cumulative, 2026-08-27 — cas soulevé par le PO : *« un distributeur de la zone franche »*.

---

## Le fait

Le dossier porte **deux axes** : système comptable (`SN` / `SMT`) et régime fiscal (`Réel — IS` /
`Synthétique — TPU`). Il n'en porte pas de troisième.

Or le référentiel **`zone-franche-togo@1.0` existe, packagé, depuis le 2026-07-21** (STORY-121). Sa
nature est écrite dans son analyse : *« régime fiscal/douanier dérogatoire, pas un plan comptable ;
une entreprise franche tient sa compta en SYSCOHADA révisé »*. Il se distingue du droit commun
**uniquement par son paquet fiscal** : IS dégressif (0 % ans 1-5 · 8 % ans 6-10 · 10 % ans 11-20 ·
20 % dès 21), exonérations de TVA et de droits de douane, taxe sur dividendes exonérée puis à 50 %.

**Et aucun dossier ne peut le sélectionner.** Le paquet est packagé, chiffré, sourcé — et
inatteignable. Un distributeur en zone franche est donc aujourd'hui imposé **au droit commun** :
`30 %` d'IS là où il en doit `0`, plus une MFP dont il est probablement exonéré.

⛔ **C'est le seul endroit du produit où un défaut de paramétrage produit un impôt trop élevé, pas
trop bas.** Le client le découvre en payant.

## Pourquoi un troisième axe, et pas un type de client

Le « type de client » (Entreprise / Microfinance / Assurance) choisit le **plan comptable**. La zone
franche n'en change pas : elle change le **paquet fiscal**, et rien d'autre. Les loger au même
endroit obligerait à créer un type « Entreprise en zone franche », puis « Microfinance en zone
franche », et ainsi de suite — une combinatoire qui se multiplierait à chaque régime dérogatoire
(code des investissements, entreprise nouvelle agréée, coopérative, ONG).

⇒ **Trois axes indépendants** : système comptable × régime fiscal × **régime dérogatoire**.

## Critères d'acceptation

- [ ] AC-1 — Le dossier porte un axe `regimeDerogatoire` (`AUCUN` par défaut), **daté comme les deux
      autres** (STORY-303) : un agrément a une date d'effet et une durée, et un changement d'axe ne
      rejoue jamais un exercice clos.
- [ ] AC-2 — L'axe porte les données que le barème exige : **date d'agrément** et **numéro
      d'agrément**. Sans date d'agrément, un barème dégressif par année d'exploitation est
      inapplicable — le refuser vaut mieux que de compter à partir de la création de la société.
- [ ] AC-3 — La résolution du paquet fiscal tient compte des trois axes. `AUCUN` résout le paquet de
      droit commun du pays ; un régime dérogatoire résout son paquet propre.
- [ ] AC-4 — Le **barème dégressif** se calcule sur l'**année d'exploitation** comptée depuis la date
      d'agrément, et l'écran (comme le contrat) publie l'année retenue. Un taux d'IS sans l'année
      qui l'a produit n'est pas vérifiable à la main.
- [ ] AC-5 — La **TVA exonérée** est traitée par le paquet, pas par le moteur : aucune règle « zone
      franche » codée en dur nulle part. ⛔ Test : retirer l'exonération du paquet doit changer le
      résultat — sinon la règle est ailleurs que là où on croit.
- [ ] AC-6 — Un régime dérogatoire dont le paquet n'est pas packagé pour le pays du dossier est
      **refusé à la sélection**, avec son motif — même conduite que STORY-487.

## Conséquences ailleurs

- Ouvre `zone-franche-togo@1.0`, packagé et inutilisé depuis le 2026-07-21.
- ⚠️ Le barème est marqué **« à valider/actualiser par un fiscaliste »** dans son analyse d'origine.
  Cette story ne le certifie pas ; elle le rend atteignable et le sert **avec son statut**
  (STORY-493 AC-5).
- L'assistant de création de dossier gagne un troisième axe — **FE-082**.

## Notes

- Voir [[STORY-121]], `analyse-referentiels-sfd-zonefranche-cima-2026-07-21.md` §2, [[STORY-303]]
  (axes datés), [[STORY-493]].
