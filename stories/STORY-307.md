---
baseline_commit: 53941d3 (prospera-fiscal-service), b4189a1 (balance-service), 0f60de7 (dossier-service)
---

# STORY-307 : Taxes sectorielles et échéances portées par le type d'entité

Status: ready-for-dev

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

- [ ] **AC-1** — Une implantation SFD : la TAF figure au catalogue dérivé, sans configuration, avec
  son taux depuis le paquet.
- [ ] **AC-2** — Une implantation assurance : la TCA figure avec ses taux différenciés par nature.
- [ ] **AC-3** — Assurance : échéance de dépôt annuel au 31/05 de N+1, tirée du paquet. SFD : non
  datée, nommée (décision 2026-11-14).
- [ ] **AC-4** — Le schéma refuse un `parametres` qui ne désigne aucune rubrique.

## Definition of Done

- [ ] Branches `MNV-307` (balance, dossier, fiscal) depuis `origin/dev`, PR fusionnées en rebase
  dans l'ordre ; fiche et tracker par PR sur `main`.
- [ ] Portes vertes ; mutations rouges.

## Progress Tracking

**2026-11-14 — fiche écrite** (bmad-create-story) juste avant de coder.
