# STORY-174 : La fenêtre de support N/N-1 devient une règle du **service**, pas une politique d'écran

**Epic :** EPIC-007 — `platform-catalog-service`
**Réf. :** ticket `TICKET-BACKEND-ecarts-releves-par-integration-gate-console.md` §A · **AP-04** · **STORY-032** (CRUD catalogue)
**Découverte par :** AP-INT-0, en branchant le catalogue sur le vrai service
**Priorité :** Must Have
**Story Points :** 5
**Statut :** À faire
**Créée le :** 2026-08-04
**Sprint :** 21
**Service :** `platform-catalog-service` (`:3003`)

---

## Le constat

`CreateModuleVersionDto` ne porte que `{ version, releasedAt? }`. **Le service ne connaît ni
`supersedesMajor`, ni la notion de fenêtre de support.**

La console, elle, applique un garde-fou complet : refuser une **troisième majeure active** tant
qu'une ancienne n'est pas dépréciée **avec une date de fin de support**. Elle croyait *reproduire*
une règle du backend. Vérifié à la bascule : cette règle n'existe **que côté front**.

**Deux conséquences, et la seconde est pire que la première.**

1. **La règle se contourne sans rien signaler.** Tout appel direct au service — un script, un autre
   client, un `curl` — peut publier une quatrième majeure active. Rien ne le refuse, rien ne le
   journalise.
2. **Personne ne peut la découvrir en lisant le service.** Un développeur qui ouvre
   `platform-catalog-service` ne voit aucune trace d'une politique de support. Il conclura
   légitimement qu'il n'y en a pas.

> ⚡ **Ce n'est donc pas un invariant du système, c'est une politique d'interface.** Et une règle que
> le front croit tenir du backend est le pire des deux mondes : ni garantie, ni documentée.

## Le second effet : un état intermédiaire que rien ne rattrape

Faute de geste atomique amont, la console fait **deux appels** : déprécier la majeure sortante, puis
créer la nouvelle. Si la création échoue après la dépréciation, **l'ancienne majeure reste
dépréciée** alors que la nouvelle n'existe pas — le module se retrouve avec une majeure active de
moins, sans que personne l'ait décidé.

---

## Périmètre

### A. La règle, portée par le service

Refuser la publication d'une version dont la majeure n'est pas déjà supportée **lorsque deux
majeures sont déjà actives**, sauf si l'appelant désigne la majeure sortante **et** sa date de fin
de support.

`CreateModuleVersionDto` reçoit deux champs **optionnels** : `supersedesMajor` et
`deprecationDate` — exigés uniquement dans ce cas.

### B. Le geste devient atomique

Déprécier la sortante et créer la nouvelle dans **la même transaction**. Un échec ne laisse aucun
état intermédiaire.

### C. Ce que cette story ne fait pas

- Elle ne change **aucune** version existante : la règle vaut pour les publications futures.
- Elle ne retire pas le garde-fou de la console — l'écran doit continuer à guider l'utilisateur
  **avant** l'appel. Ce qui change, c'est qu'il n'est plus le seul rempart.

---

## Critères d'acceptation

1. Publier une mineure d'une majeure déjà supportée reste possible sans arbitrage.
2. Publier une **troisième majeure** sans `supersedesMajor` **ni** `deprecationDate` est refusée
   avec `{ message, code }` (`STORY-138`) nommant le champ manquant.
3. Nommer `supersedesMajor` **sans** date est refusé de la même façon — une dépréciation sans date
   de fin de support ne dit pas au client jusqu'à quand il peut rester.
4. ⚡ Avec l'arbitrage complet, la dépréciation et la création sont **atomiques** : prouvé en faisant
   échouer la création, l'ancienne majeure doit rester **ACTIVE**.
5. La règle s'applique **quel que soit l'appelant** — vérifié par un appel direct, sans passer par
   la console.
6. Non-régression : les modules existants gardent leurs versions et leurs statuts.

---

## Definition of Done

- [ ] Les 6 critères vérifiés · `lint` 0 · couverture ≥ 90 %
- [ ] **Vérification docker** : les trois refus, le cas nominal, et l'atomicité
- [ ] ⚡ **La console est ALLÉGÉE en conséquence** : son garde-fou reste, mais son commentaire
      « reproduit le garde-fou du backend » redevient vrai — il était faux depuis le début
- [ ] Branche `MNV-174`, PR rebase-mergée sur `dev`
