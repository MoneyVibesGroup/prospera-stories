# STORY-517 : Une provision technique est une évaluation datée, versionnée, avec sa méthode et son auteur — jamais un solde

Status: ready-for-dev

**Épic :** EPIC-131 — Provisions techniques ⚠️ **PALIER 2**
**Service :** `assurance-service`
**Points :** 13 · **Sprint :** S20
**Origine :** découpage `epics-assurance-2026-08-27.md`, **AD-2** de la spine.

---

## Le fait

Les provisions techniques représentent **l'essentiel du passif** d'un assureur. Le plan CIMA leur
donne un poste dédié : `CP3` — *« Provisions techniques brutes »*, mappé aux comptes `31`, `32`,
`34`, `35`, `38`. *(Lu dans l'artefact le 2026-08-27.)*

⚡ **Ce qui distingue une provision technique d'un solde ordinaire, c'est qu'elle n'est pas
constatée : elle est ÉVALUÉE.** Deux actuaires, deux méthodes, deux montants — tous deux
défendables. Le montant seul ne prouve rien ; ce qu'un contrôle CIMA demande, c'est **la méthode**.

⇒ **Le modèle ne peut donc pas être un champ « montant » que l'on met à jour.** C'est ce qui rend
cette story structurelle et non cosmétique : le mauvais modèle ici ne se rattrape pas, parce qu'il
détruit l'historique des évaluations à mesure qu'il les écrase.

## Critères d'acceptation

- [ ] AC-1 — Une provision technique porte : **type** (PSAP, primes non acquises, risques en cours,
      mathématique vie, autres), **catégorie Vie/Non-Vie**, **exercice**, **date d'évaluation**,
      **montant**, **méthode** (texte structuré), **paramètres** utilisés, **auteur**, et
      **version**.
- [ ] AC-2 — ⛔ **Append-only** : une réévaluation crée une **nouvelle version**, l'ancienne reste
      lisible. Le schéma le refuse, pas seulement la convention — même invariant que le journal
      d'audit.
- [ ] AC-3 — La provision **retenue à une date d'arrêté** est la dernière version antérieure à cette
      date. Un arrêté 2025 ne doit **jamais** consommer une réévaluation faite en 2026.
- [ ] AC-4 — L'**auteur** est une personne identifiée, et son rôle est porté. ⚠️ Une provision
      technique engage celui qui la signe ; publier un `ObjectId` nu reproduirait le défaut de
      STORY-441 sur l'écran où l'identité **est** l'information.
- [ ] AC-5 — La **part des réassureurs** dans chaque provision est portée **séparément** du brut
      (AD-4) : `CP3` est le brut, `CA2` est la part des cessionnaires. Les compenser est interdit.
- [ ] AC-6 — ⛔ **Aucun calcul n'est fait ici** (AD-12) : le module **héberge** l'évaluation et sa
      méthode. C'est STORY-519 qui dit ce qui sera calculé, et à quelle condition.

## Notes

- Voir [[STORY-518]] (les variations au CR), [[STORY-519]], [[STORY-520]], spine AD-2/AD-12.
