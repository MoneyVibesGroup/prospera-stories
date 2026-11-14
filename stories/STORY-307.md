---
baseline_commit: 53941d3 (prospera-fiscal-service), b4189a1 (balance-service), 0f60de7 (dossier-service)
---

# STORY-307 : Taxes sectorielles et échéances portées par le type d'entité

Status: done

**Complexité :** medium

**Épic :** EPIC-028 — Implantations multiples et catalogue d'obligations dérivé  
**Services :** `balance-service` (paquet), `dossier-service` (copie), `fiscal-service` (dérivation)  
**Points :** 5 · **Sprint :** S24 du tracker ; groupe B du plan du 14/11  
**Assigné à :** Dev B  
**Prérequis :** STORY-305 (catalogue dans le paquet, dérivation), STORY-306  
**Origine :** FR-F73, FR-F74.

---

## User Story

En tant qu'**expert-comptable d'une institution de microfinance**, je veux que les taxes de mon
secteur apparaissent sans configuration, afin de ne rien oublier.

## Décisions confrontées au code réel (2026-11-14)

- **Sans case à cocher** : les taxes sectorielles sont des entrées du catalogue du paquet,
  sélectionnées par `typesEntite` — la TAF pour `MICROFINANCE`, la TCA pour `ASSURANCE`. Aucun
  code spécifique.
- **Les taux viennent du paquet, référencés** : nouveau champ d'entrée `parametres` (référence vers
  la rubrique qui fait foi) — `taxeActivitesFinancieres.taux` pour la TAF,
  `taxeConventionsAssurance.tauxParNature` pour la TCA (taux différenciés par nature : incendie
  biens professionnels, vie, autres). L'obligation les porte (`parametres`), pour l'écran ; une
  référence qui ne se résout pas donne `parametres: null`, sans empêcher la dérivation.
- **Calendriers** : la TAF suit les règles de recouvrement de la TVA (Art. 213-221 CGI) ⇒ même
  périodicité mensuelle référencée, jour limite absent du paquet ⇒ non datée (FR-F10) ; la TCA n'a
  aucune périodicité au paquet ⇒ une obligation annuelle non datée, nommée.
- **Le 31/05** est une donnée du paquet (`depot.echeances`, `TYPE_ENTITE_ASSURANCE`), déjà dérivée
  depuis STORY-305 pour l'assurance. ⚠️ **Décision de l'utilisateur (2026-11-14)** : la DSF d'une
  microfinance reste **non datée** — le paquet (STORY-413) exclut les SFD du 31/05 (« ni assurance
  ni banque au sens du LPF »), en attente d'un fiscaliste togolais ; l'écart avec FR-F74 est
  consigné.
- **Propagation** : régénération du paquet (`build.mjs`), réépinglage balance + dossier, fixture du
  fiscal ; règle R9 étendue à `parametres`.

## Critères d'acceptation

- [x] **AC-1** — Une implantation SFD : la TAF figure au catalogue dérivé, sans configuration, avec
  son taux depuis le paquet.
- [x] **AC-2** — Une implantation assurance : la TCA figure avec ses taux différenciés par nature.
- [x] **AC-3** — Assurance : échéance de dépôt annuel au 31/05 de N+1, tirée du paquet. SFD : non
  datée, nommée (décision 2026-11-14).
- [x] **AC-4** — Le schéma refuse un `parametres` qui ne désigne aucune rubrique.

## Definition of Done

- [x] Branches `MNV-307` (balance, dossier, fiscal) depuis `origin/dev`, PR fusionnées en rebase
  dans l'ordre ; fiche et tracker par PR sur `main`.
- [x] Portes vertes ; mutations rouges.

## Progress Tracking

**2026-11-14 — fiche écrite** (bmad-create-story) juste avant de coder.

**2026-11-14 — implémentation.**
- `balance-service` : entrées `TAF` (`MICROFINANCE`, périodicité de la TVA référencée, `parametres`
  → `taxeActivitesFinancieres.taux`) et `TCA` (`ASSURANCE`, aucune périodicité au paquet,
  `parametres` → `taxeConventionsAssurance.tauxParNature`) ; schéma (`parametres`) ; R9 :
  `parametres` doit désigner une rubrique, `moisParPeriode: null` admis ; paquet régénéré (sha256
  `ee6a5554…`, douzième régénération) ; registre et tests réépinglés.
- `dossier-service` : copie à l'octet, empreinte réépinglée.
- `fiscal-service` : `parametres` lus au catalogue (`estParametre` : nombre ou objet de nombres),
  résolus à la dérivation (`null` si introuvables, sans empêcher la dérivation), persistés (champ
  dérivé) et exposés ; fixture du paquet mise à jour.

**2026-11-14 — preuves.** Sur le vrai paquet : microfinance ⇒ 12 TAF au taux 0,10 (non datées :
jour limite absent), DSF non datée ; assurance ⇒ TCA aux taux par nature (incendie biens pro 0,20 ;
vie 0,03 ; autres 0,06), DSF au 2027-05-31 ; entreprise ⇒ aucune taxe sectorielle. Conformité
MongoDB réel 36/36 (taux par nature persistés et relus). Mutations M1 (paramètres jamais résolus),
M2 (prédicat), M3 (R9 sur `parametres`) rouges puis restaurées.

**2026-11-14 — complément demandé par l'utilisateur : le jour limite de la microfinance.**
Recherche (web : rien d'officiel en ligne qui le dise directement ; puis le **CGI/LPF OTR 2025**
présent dans le dépôt, texte extrait) :
- **LPF Art. 60** (rédaction LF 2023) : la TVA se déclare « au plus tard le 15 de chaque mois et au
  titre du mois précédent ».
- **LPF Art. 66-67** : les redevables de la TAF « sont soumis aux mêmes obligations qu'en matière de
  TVA » et la TAF est recouvrée « suivant les mêmes règles » ⇒ **TAF mensuelle, le 15**.
- **LPF Art. 71 et 73** : la TCA se déclare « avant le quinze de chaque mois et au titre du mois
  précédent » ⇒ **TCA mensuelle, au plus tard le 14**.
- ⚠️ **CGI Art. 216-8°** : les opérations de collecte, d'épargne et de crédit des IMCEC (mutualistes),
  dans le cadre de la loi du secteur, sont **exonérées** de TAF — la déclaration reste due ; signalé au
  paquet et dans la source de l'entrée.

**Paramétrable, sans chiffre dans le code** : les jours limites sont des DONNÉES du paquet, dans la
rubrique qui fait foi (`tva.declaration.echeance.jourLimite` = 15 ;
`taxeConventionsAssurance.declaration` = mensuelle, 14) ; le catalogue les RÉFÉRENCE (la TAF pointe la
règle de la TVA) ; une nouvelle version du paquet suffit à les changer. Le fiscal accepte désormais un
`jourEcheance` référencé (R9 vérifie la référence au build). Les bases légales portent enfin leur
**texte verbatim** (FR-F07). Paquet régénéré (sha256 `5977efc5…`).

**Effet** : la TVA (entreprise au réel), la TAF (microfinance) et la TCA (assurance) sont désormais
**DATÉES** (12 échéances chacune : le 15, le 15, le 14 du mois suivant) ; ne restent non datées que
la DSF au réel (`NON_CONSTATABLE`) et la DSF d'un SFD (décision du 2026-11-14). Conformité MongoDB
réel 36/36 ; mutation M4 (jour référencé jamais résolu) rouge.

**2026-11-14 — clôture.** PR rebase-mergées sur `dev` dans l'ordre : balance-service #139
(`083a40b`), dossier-service #46 (`41ecfdd`), fiscal-service #28 (`26fb293`). Paquet en vigueur :
sha256 `5977efc5774fba6634266f365a13f23525276109060a62cee5762bf7d4e3c915`.

⚠️ **Écart consigné** : FR-F74 attend la DSF d'un SFD au 31/05 ; elle reste non datée (décision de
l'utilisateur du 2026-11-14, le paquet exclut les SFD du 31/05 en attendant un fiscaliste togolais).
