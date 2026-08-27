# STORY-479 : Le plan de trésorerie n'a aucune date : douze parts égales, ni acomptes d'impôt, ni saisonnalité

Status: ready-for-dev

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 8 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-036** (projection 3 ans, trésorerie 12 mois, scénarios comparés), 2026-08-27.
Relevé en balayant 576 jeux d'hypothèses sur le moteur mensuel transcrit, puis en confrontant le résultat aux échéances du paquet fiscal.

---

## Le fait

`ProjectionMensuelleService` répartit les charges, les investissements, le financement et les
remboursements par `partition()` — une **division entière exacte en douze parts égales**. Sur le
dossier de démonstration, les décaissements de charges valent 232 116 pendant huit mois puis 232 115
les quatre derniers : **deux valeurs distinctes sur douze, et l'écart est un reste de division**.

Le modèle ne connaît donc **aucune date**. En particulier :

- Les **quatre acomptes provisionnels** que le paquet fiscal publie déjà — `31-01`, `31-05`, `31-07`,
  `31-10` (Art. 114-116 CGI) — n'apparaissent nulle part. C'est le seul calendrier fiscal structuré
  dont dispose le produit, et le plan de trésorerie l'ignore.
- Aucune **saisonnalité** n'est exprimable. Pour un distributeur — le profil du dossier de
  démonstration — c'est la structure même de son année.

**Conséquence mesurée.** Sur **576** jeux d'hypothèses balayés (croissance, marge, charges et délai
clients croisés), le `moisTresorerieMinimale` publié par la comparaison tombe **toujours** dans les
quatre premiers mois ou au douzième — **jamais entre le cinquième et le onzième**. Un creux d'été est
**structurellement impossible** dans ce modèle : l'indicateur « mois de trésorerie minimale » n'est
donc pas une prévision, c'est un artefact du lissage.

## Critères d'acceptation

- [ ] AC-1 — Le jeu d'hypothèses accepte un **profil de saisonnalité** optionnel : douze poids dont la
      somme vaut 100 (ou 12 coefficients de 1). Absent ⇒ répartition uniforme, **comme aujourd'hui**,
      et la réponse dit lequel des deux a servi.
- [ ] AC-2 — Les décaissements d'impôt suivent les échéances du **paquet fiscal du dossier**
      (`acomptesProvisionnels.echeances`) plus le solde — dépend de **STORY-458**.
- [ ] AC-3 — L'articulation `Σ mensuel = annuel` reste une **identité** quel que soit le profil : la
      partition pondérée doit conserver la garantie « aucune unité mineure perdue » de `partition()`.
- [ ] AC-4 — La réponse publie `repartition: 'uniforme' | 'saisonniere'` — un plan lissé qui ne se
      déclare pas se lit comme une prévision.
- [ ] AC-5 — Test de non-régression du balayage : avec un profil saisonnier, `moisTresorerieMinimale`
      doit pouvoir tomber en juillet.
