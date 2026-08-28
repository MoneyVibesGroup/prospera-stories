---
stepsCompleted: [1]
inputDocuments:
  - prospera-stories/analyse-referentiels-sfd-zonefranche-cima-2026-07-21.md (§1, SFD-BCEAO @2.0)
  - prospera-stories/referentiels/README-sfd-bceao.md
  - prospera-stories/sprint-status.yaml (reserved_ranges, relevé le 2026-08-27)
  - prospera-stories/stories/STORY-422.md (arbitrage voie A du 2026-08-27)
---

# Vertical Microfinance / SFD (`microfinance-service`) — Découpage en épics

> **Décision PO du 2026-08-27 :** l'IMF est **promise**, pas repoussée. Ce document dit ce qu'il faut
> livrer pour que la promesse soit tenable.

## Vue d'ensemble

**Série retenue : épics EPIC-121 → EPIC-127.** Dernier épic attribué au 2026-08-27 : **EPIC-120**
(`comptabilite-service`, pris le même jour). **Aucun `story_id` n'est réservé ici.**

---

## Ce qui est déjà là, et qu'il ne faut pas refaire

Le référentiel comptable est **fait, sourcé et complet** : `sfd-bceao@2.0` porte les 372 comptes du
plan officiel (RCSFD de l'UMOA, instructions BCEAO n°025 et n°026-02-2009), extraits du PDF de la
Commission Bancaire UMOA et recoupés trois fois, plus les totaux de bilan (BAT/BPT) et la cascade des
soldes intermédiaires DIMF 2080 (RSA → RSG). Le moteur d'états sait déjà le servir, y compris ses
**absences** : ni tableau des flux, ni renvois de note, rendus `NON_APPLICABLE` et non « anomalie ».

⇒ **Ce vertical n'a pas de travail comptable de fond à faire.** Il en a un tout autre.

## Le fait qui commande le découpage

**Ce qui fait la comptabilité d'une IMF n'est pas son plan de comptes, c'est son portefeuille.**

Un plan de comptes dit où ranger un encours. Il ne dit pas :
- si un crédit est **sain** ou **en souffrance**, et depuis combien de jours ;
- combien il faut **provisionner** pour cette ancienneté de retard ;
- quand un crédit se **déclasse** automatiquement ;
- ce que valent les **ratios prudentiels** que la Commission Bancaire exigera.

Aujourd'hui, une IMF qui ouvre Prospera trouve un plan de comptes juste et **rien pour tenir un
portefeuille**. Elle cherchera le provisionnement dans les cinq premières minutes, et il n'y sera pas.

⛔ **Et c'est le seul endroit de ce programme où l'absence est un risque réglementaire pour le
client, pas un inconfort** : une IMF sous-provisionnée est en infraction, pas en retard.

---

## Les épics

| Épic | Objet | Note |
|---|---|---|
| **EPIC-121** | **Socle vertical SFD** : service, entitlement `sfd-bceao`, gate, cloisonnement par dossier et par exercice | S'appuie sur **STORY-533** (N référentiels par organisation) : un cabinet tient une IMF **et** des SARL |
| **EPIC-122** | **Membres et comptes de dépôts** : adhésion, parts sociales, dépôts à vue et à terme, rémunération de l'épargne | Le membre d'une mutuelle n'est pas un client : il est **sociétaire**. La distinction porte le capital social |
| **EPIC-123** | **Portefeuille de crédits** : octroi, **échéancier**, décaissement, remboursements, encours restant dû, intérêts courus | L'échéancier est la pièce maîtresse : le retard se calcule **contre lui**, pas contre une date de fin |
| **EPIC-124** | ⚡ **Classement et provisionnement réglementaire** : tranches d'ancienneté de retard, déclassement **automatique**, taux de provision par tranche, écritures de dotation et de reprise | **Le cœur du vertical.** Les taux et les tranches viennent de l'**instruction BCEAO**, packagés et sourcés — jamais codés en dur, jamais approchés |
| **EPIC-125** | **Indicateurs de portefeuille** : PAR 30/90/180, taux de recouvrement, encours à risque, par agence et par produit | Ce que le directeur d'une IMF regarde tous les lundis. Sans eux, le produit est un livre de comptes, pas un outil de pilotage |
| **EPIC-126** | **Articulation portefeuille → balance** : le portefeuille publie une **balance canonique** (nouvelle `origine`), jamais des écritures | Même patron que `stock-service` et `comptabilite-service` : le contrat aval ne change pas |
| **EPIC-127** | **États périodiques et ratios prudentiels BCEAO** : états DIMF, ratios de capitalisation, de liquidité et de limitation des risques | ⚠️ **Jalon `format confirmé` obligatoire**, comme EPIC-032 pour le dépôt fiscal : un état réglementaire au mauvais format n'est pas un état |

---

## Trois décisions à rendre

1. **Q1 — Le provisionnement est-il calculé ou saisi ?** Recommandation : **calculé et proposé,
   jamais appliqué d'office**. Une dotation est une écriture ; la passer sans décision humaine ferait
   signer à l'outil ce que le conseil d'administration arrête. Même doctrine que l'affectation du
   résultat, déjà appliquée à la reprise d'à-nouveaux.
2. **Q2 — Les taux et tranches sont-ils dans le paquet référentiel ou dans un paquet prudentiel
   séparé ?** Recommandation : **paquet séparé**. Le plan comptable et la norme prudentielle
   évoluent à des rythmes différents et par des textes différents ; les fusionner obligerait à
   republier le plan à chaque instruction nouvelle, et à recalculer tous les checksums de liasse.
3. **Q3 — Le portefeuille est-il dans ce service ou dans `comptabilite-service` ?**
   Recommandation : **ici**. Un échéancier de crédit n'est pas une écriture, et le mettre dans le
   moteur d'écritures ferait porter à un module généraliste une norme sectorielle.

---

## Ce que ce vertical NE fait pas

- Il ne fait **pas** de scoring d'octroi, ni de décision de crédit.
- Il ne fait **pas** de mobile money ni d'encaissement : le règlement reste chez `paiement-service`.
- Il ne remplace **pas** un SIG de microfinance. Il tient le **portefeuille comptable et prudentiel**,
  ce qui est ce qu'un cabinet et un régulateur regardent — pas l'agence au guichet.

---

## Stories attribuées — 2026-08-27, après analyse de l'architecture

**14 stories, 122 pts, toutes slottées S20** sur décision PO. Spine :
`architecture/architecture-microfinance-service-2026-08-27/ARCHITECTURE-SPINE.md` (AD-1 → AD-12).

| Épic | Stories | Pts |
|---|---|---:|
| **EPIC-121** Socle | **497** socle et référentiel du dossier · **498** paquet prudentiel séparé | 21 |
| **EPIC-122** Membres & dépôts | **499** membres et parts sociales · **500** dépôts et intérêts courus | 13 |
| **EPIC-123** Portefeuille | **501** le crédit est la somme de ses événements · **502** l'échéancier | 21 |
| **EPIC-124** Classement & provisionnement | **503** classement dérivé · **504** provisionnement · **505** cascade et rééchelonnements | 29 |
| **EPIC-125** Indicateurs | **506** PAR 30/90/180 et recouvrement | 8 |
| **EPIC-126** → balance | **507** publication canonique · **508** engagements hors bilan | 18 |
| **EPIC-127** Prudentiel | **509** états DIMF *(needs-po-decision)* · **510** ratios | 16 |

### Ordre contraignant

```
497 → 498 → 501 → 502 → 503 → 504 → 507
                                  ↘ 505, 506
498 + 508 → 510
```

### Ce que l'analyse de l'architecture a changé au découpage

⚡ **Le vertical est plus petit que prévu du côté comptable, et plus gros du côté portefeuille.**
La lecture de `sfd-bceao-2.0.json` le 2026-08-27 a établi que l'artefact est **complet** — 372
comptes, `BAT`/`BPT` en `FORMULE` avec leurs `role` `TOTAL_ACTIF`/`TOTAL_PASSIF`, cascade
`RSA → RSG` — et non « allégé » comme on aurait pu le supposer depuis son historique `@1.0`.

⇒ **Aucune story de référentiel n'est nécessaire.** Les 122 points vont intégralement au
portefeuille, au provisionnement et au prudentiel, c'est-à-dire à ce qu'une IMF cherche.

⚠️ **Et une story est `needs-po-decision` : STORY-509.** Elle pose la même question que STORY-525
(fiscal) et STORY-523 (assurance) — *le produit dépose-t-il, ou produit-il l'état que l'institution
dépose ?* **Une seule réponse doit valoir pour les trois.**
