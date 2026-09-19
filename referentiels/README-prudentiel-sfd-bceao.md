# Paquet prudentiel des SFD de l'UMOA — provenance (STORY-659, STORY-505)

Artefact servi : `microfinance-service/src/modules/referentiel/assets/prudentiel-sfd-bceao-1.2.json`
(`prudentiel-sfd-bceao@1.2`, statut **`a-valider-par-expert`**, sha256 `b7c83604…9d209d7e0`) : les valeurs de la
`1.1` (STORY-659), inchangées, plus la rubrique structurée `declassement.contagion`, déclarée **inactive**
(STORY-505, D-505-A). Les versions `1.0` (amorce vide, STORY-498/504) et `1.1` restent packagées, octets inchangés.

⚠️ Ne pas confondre avec l'**Instruction n°026-11-2016** (engagements en souffrance) : elle vise les **banques**
(PCB révisé), pas les SFD.

## Sources — relevées le 2026-09-15

| Texte | Où | Empreinte sha256 du PDF téléchargé |
|---|---|---|
| **Référentiel comptable spécifique des SFD de l'UMOA — version allégée, 1re édition** (BCEAO, ISBN 978-2-916140-11-7), institué par l'Instruction n°025-02-2009 | [cb-umoa.org — PDF de mai 2022](https://cb-umoa.org/sites/default/files/2022-05/R%C3%A9f%C3%A9rentiel%20comptable%20sp%C3%A9cifique%20des%20SFD_1.pdf) (201 pages) | `334ded79e3ed47e33b247b9423c9a6ed2624f35b8fc40e5339696bd5f90e709d` |
| **Recueil des textes légaux et réglementaires régissant les SFD de l'UMOA** (BCEAO) — Instructions n°010-08-2010 et n°021-12-2010 | [bceao.int — PDF](https://www.bceao.int/sites/default/files/2017-11/-recueil-des-textes-legaux-et-reglementaires-regissant-les-sfd-de-lumoa.pdf) (176 pages) | `23ac4caa4fe5255753fae8d5ed3db5a5fec9a97b679621453f163f63a8fba844` |

⚠️ **Lecture du RCSFD** : les pages « Contenu et fonctionnement des comptes » utilisent une police sans table
Unicode — `pdftotext` rend du charabia. Les pages ont été **rendues en image** (`pdftoppm -r 90`, pages PDF 57-58 et
66-67, numéros imprimés 55-56 et 64-65) et lues à l'écran. Un relecteur doit faire de même.

## Transcription

### Tranches et taux (RCSFD, compte 299, p. 65 ; compte 29, p. 64)

Assiette : **solde restant dû = encours du prêt − dépôts constitués en garantie auprès du SFD par le débiteur et/ou
sa caution** (p. 65).

| Texte (mois) | Tranche du paquet (jours) | Taux | Référence |
|---|---|---|---|
| 0 à 3 mois — provisionnement facultatif | 0 à 89 | 0 (minimum légal) | p. 64-65 |
| plus de 3 à 6 mois (2991) | 90 à 181 | 40 % | p. 65 |
| plus de 6 à 12 mois (2992) | 182 à 365 | 80 % | p. 65 |
| plus de 12 à 24 mois (2993) | 366 à 730 | 100 % | p. 65 |
| plus de 24 mois — irrécouvrable, classée en charges | 731 et plus | 100 % (aucun taux écrit) | p. 64 |

Les pages 55-56 (comptes 19/199, prêts aux institutions financières) portent les **mêmes** taux et la même assiette.

### Garantie admise

`NANTISSEMENT_DEPOT`, quotité 1 (p. 65). Les dépôts de la **caution** ne sont pas représentables (un nantissement
cite un blocage de dépôt du membre emprunteur, D-501-D) : ils ne se déduisent pas.

### Règles de déclassement (compte 29, p. 64)

Échéance impayée ⇒ totalité de l'encours déclassée · déclassement facultatif de 0 à 3 mois · maintien à l'actif
jusqu'à 24 mois puis passage en charges · passage en charges anticipé à 100 % sans espoir de recouvrement · crédits
immobilisés (291 : redevenus sains, rééchelonnés, concordat respecté). **Aucune contagion par débiteur** n'est écrite
dans ce texte (STORY-505).

### Seuils des ratios (Instruction n°010-08-2010, annexes I à IX, recueil p. 95-112)

| Ratio | Norme | Annexe |
|---|---|---|
| Limitation des risques | ≤ 200 % | I |
| Couverture des emplois à moyen et long terme | ≥ 100 % | II |
| Prêts aux dirigeants, au personnel, personnes liées | ≤ 10 % | III |
| Risques sur une seule signature | ≤ 10 % | IV |
| Liquidité — non affiliés collectant des dépôts / mutualistes affiliées / sans dépôts | ≥ 100 % / 80 % / 60 % | V |
| Opérations autres qu'épargne et crédit | ≤ 5 % | VI |
| Dotation de la réserve générale | ≥ 15 % de la base | VII |
| Capitalisation | ≥ 15 % | VIII |
| Prises de participation | ≤ 25 % | IX |

Valeurs en **pour cent**, comme le texte les écrit (`ratio = A/B × 100`).

## Décisions de transcription (à relire par le praticien)

- **D-659-A — version allégée.** L'Instruction n°021-12-2010 (art. 2) la réserve aux SFD dont les encours de dépôts
  ou de crédits sont inférieurs à **50 millions de FCFA** sur deux exercices consécutifs ; l'Instruction
  n°030-02-2009 (art. 4) impose la **version développée** aux SFD de l'article 44, et l'Instruction n°007-06-2010
  fixe ce seuil à **2 milliards de FCFA**. ⇒ La bande **50 M – 2 Md** relève de la développée : **l'allégée est le
  cas marginal**.
  ✅ **CORRIGÉ le 2026-09-19** — cette fiche affirmait que la version développée « n'a été trouvée publiée nulle
  part (… Trésor ivoirien) ». **Elle l'est, précisément là** : [microfinance.tresor.gouv.ci](https://microfinance.tresor.gouv.ci/micro/wp-content/uploads/2019/11/RCSSFD.pdf)
  (457 p., ISBN 978-2-916140-08-7, sha256 `d21c6949…7d7ffa17`), et ses annexes sont **extractibles en texte**.
  ⚡ **Ses règles de provisionnement sont IDENTIQUES à celles de l'allégée**, vérifiées dans le texte : mêmes
  tranches (`1991` 6 mois au plus · `1992` plus de 6 à 12 mois · `1993` plus de 12 à 24 mois), mêmes taux
  **40 % / 80 % / 100 %**, même assiette (« solde restant dû » = encours − dépôts de garantie constitués par le
  débiteur et/ou sa caution), même caractère **facultatif de 0 à 3 mois**, et **aucune contagion par débiteur**.
  ⇒ `prudentiel-sfd-bceao@1.2` vaut donc aussi pour les SFD en version développée. Cf.
  [README-etats-dimf-sfd-bceao.md](README-etats-dimf-sfd-bceao.md).
- **D-659-B — une borne = la durée la plus courte de N mois civils.** Le service compte le retard en jours
  (`arrêté − échéance`), le texte en mois. Balayage des dates de 2024 à 2031 : 3 mois civils font **au moins
  89 jours** (du 15 février au 15 mai), 6 mois au moins 181, 12 mois au moins 365, 24 mois au moins 730. Les bornes
  valent ces minima : un retard n'est **jamais** rangé sous sa tranche réelle, et ne l'est au-dessus qu'aux jours
  où la durée civile est plus longue. ⚠️ La première transcription lisait « 1 mois = 30 jours » et affirmait la même
  garantie : elle était fausse à la borne des 3 mois (90 jours de retard sur une échéance de février restaient à
  0 %) — relevé par la revue de code.
- **D-659-C — au-delà de 24 mois, 100 %.** Le texte classe la créance en charges sans écrire de taux ; le passage en
  perte (compte 669) n'est pas modélisé.
- **D-659-D — 0 à 3 mois, taux nul.** Le provisionnement y est facultatif : le paquet transcrit le minimum.

## Contagion par débiteur (STORY-505, version 1.2)

Le RCSFD version allégée (compte 29, p. 64-65, relu en image le 2026-09-15) n'écrit **aucune** règle de contagion
du déclassement aux autres crédits d'un même débiteur. Décision user **D-505-A** : la mécanique est livrée, la règle
est une rubrique structurée (`active`, `seuilJoursRetard`, `source`) et le paquet servi la déclare
`active: false`, `seuilJoursRetard: null`. Aucun seuil n'est inventé ; la contagion n'est prouvée que sur le paquet
fictif des tests. Règle **P4** du validateur : active ⇒ seuil entier sûr ≥ 0 et au moins une tranche ; inactive ⇒
seuil `null`.

Les crédits **rééchelonnés** relèvent du compte 291 « crédits immobilisés » (p. 64) : le texte ne leur fixe aucune
provision propre, et STORY-505 maintient la provision déjà constatée jusqu'à une décision de reprise datée
(D-505-D).

## Ce qui reste avant `certifie`

1. Relecture de chaque valeur contre les pages citées par un **praticien SFD** nommé.
2. ✅ **FAIT le 2026-09-19** — taux de la **version développée** confirmés identiques, et **absence de contagion
   par débiteur** vérifiée dans cette version (cf. D-659-A). Reste à faire relire par un praticien, comme le
   point 1.
3. Validation des conventions D-659-B à D-659-D.
