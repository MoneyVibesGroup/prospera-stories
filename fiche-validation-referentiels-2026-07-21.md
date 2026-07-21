# Fiche de validation — Référentiels SFD complet · CIMA assurances · Zone Franche Togo

> **Date :** 2026-07-21 · **Service :** `bilan-service` · **Objet :** faire valider par un expert les
> **3 zones « amorce »** des nouveaux référentiels (le plan de comptes officiel n'est PAS en cause ; seules
> la **ventilation en postes**, les **formules de résultat** et le **barème fiscal** sont proposés et à valider).
>
> **Destinataires :** §1 → expert-comptable **SFD / microfinance** · §2 → **actuaire / expert-comptable assurance** ·
> §3 → **fiscaliste**.
> **Tags :** **[À CONFIRMER]** = une proposition est écrite, la valider ou la corriger · **[À TRANCHER]** = choix ouvert.
> **Comment répondre :** cocher ☑ *Validé* ou ☐ *À corriger* et écrire la correction sur la ligne « → … ».
> Source technique (pour info) : `bilan-service/scripts/referentiels/sources/*` ; analyse : `docs/analyse-referentiels-sfd-zonefranche-cima-2026-07-21.md`.

---

## §1 — SFD-BCEAO complet (`sfd-bceao@2.0`) — Compte de résultat DIMF 2080

**Contexte :** le plan de comptes RCSFD (classes 1-7) est déjà en place. On y **ajoute** les **Soldes
Intermédiaires de Gestion** (SIG) du DIMF 2080 pour que le Compte de résultat aboutisse à un **excédent/déficit net**.
Convention : chaque poste de détail est en **valeur positive** ; les produits s'**ajoutent (+)**, les charges se **soustraient (−)**.

**S1 — Composition des postes de détail (compte → poste).** **[À CONFIRMER]**

| Poste | Libellé | Comptes SFD |
|---|---|---|
| RP1 | Produits d'exploitation financière | 70 |
| RP2 | Ventes | 71 |
| RP3 | Produits divers d'exploitation | 72 |
| RP4 | Subventions d'exploitation | 74 |
| RP5 | Reprises d'amortissements, provisions, récupérations | 75, 76 |
| RP6 | Produits exceptionnels | 77 |
| RC1 | Charges d'exploitation financière | 60 |
| RC2 | Achats et variations de stocks | 61 |
| RC3 | Autres charges externes et diverses | 62 |
| RC4 | Impôts, taxes et versements assimilés | 63 |
| RC5 | Charges de personnel | 64 |
| RC6 | Dotations aux amortissements et provisions | 65, 66 |
| RC7 | Charges exceptionnelles | 67 |
| RC8 | Impôts sur les excédents | 69 |

Réponse : ☐ Validé ☐ À corriger → ______________________________________________

**S2 — Cascade des SIG (la partie vraiment à valider).** **[À CONFIRMER]**

| Solde | Libellé | Formule proposée |
|---|---|---|
| RSA | Résultat financier | **+ RP1 − RC1** |
| RSB | Résultat des autres activités | **+ RP2 + RP3 − RC2 − RC3** |
| RSC | Résultat brut d'exploitation | **+ RSA + RSB + RP4 − RC4 − RC5** |
| RSD | Résultat d'exploitation *(cpte 595)* | **+ RSC + RP5 − RC6** |
| RSE | Résultat exceptionnel *(cpte 596)* | **+ RP6 − RC7** |
| RSF | Excédent/déficit avant impôt | **+ RSD + RSE** |
| RSG | **Excédent/déficit net** *(cpte 592)* | **+ RSF − RC8** |

Réponse : ☐ Validé ☐ À corriger → ______________________________________________
> Questions ouvertes : l'ordre des soldes correspond-il à la présentation officielle du DIMF 2080 ? Faut-il
> isoler une **marge sur opérations avec les membres** (cpte 593) en amont de RSA ? **[À TRANCHER]** → __________

**S3 — Totaux du Bilan.** BAT (total actif) = somme des rubriques actif ; BPT (total passif) = somme des rubriques
passif ; le **résultat (cpte 59)** est logé dans la rubrique fonds propres (BP4) → équilibre **BAT = BPT**. **[À CONFIRMER]**
Réponse : ☐ Validé ☐ À corriger → ______________________________________________

**S4 — Absence de TFT.** Le RCSFD ne prévoit **pas** de tableau des flux de trésorerie → aucun n'est produit. **[À CONFIRMER]**
Réponse : ☐ Validé ☐ À corriger → ______________________________________________

---

## §2 — CIMA assurances (`cima-assurances@1.0`, version allégée)

**Contexte :** plan de comptes = **liste officielle art. 431 du Code CIMA** (non modifiable). À valider : le
**regroupement en rubriques** de Bilan / Compte de résultat et les **2 formules de résultat**.

**C1 — Bilan ACTIF (poste → comptes).** **[À CONFIRMER]**

| Poste | Libellé | Comptes CIMA |
|---|---|---|
| CA1 | Valeurs immobilisées (placements et immobilisations) | 20 à 28 |
| CA2 | Part des cessionnaires/rétrocessionnaires dans les provisions techniques | 39 |
| CA3 | Créances (assurés & intermédiaires, réassureurs, État, divers) | 40, 41, 44, 45, 46, 48 |
| CA4 | Comptes financiers (titres de placement, banques, caisse) | 51, 53, 54, 55, 56, 57 |

Réponse : ☐ Validé ☐ À corriger → ______________________________________________

**C2 — Bilan PASSIF (poste → comptes).** **[À CONFIRMER]**

| Poste | Libellé | Comptes CIMA |
|---|---|---|
| CP1 | Capitaux propres | 10 à 14 |
| CP2 | Provisions pour risques et charges et dépréciations | 15, 19 |
| CP3 | **Provisions techniques brutes** | 31, 32, 34, 35, 38 |
| CP4 | Dettes (financières, réassureurs, tiers) | 16, 17, 18, 42, 43, 46, 47, 50, 52 |

Réponse : ☐ Validé ☐ À corriger → ______________________________________________
> Ambiguïté connue : les comptes **40** (réassureurs/cédants/coassureurs) et **46** (débiteurs ET créditeurs divers)
> peuvent figurer à l'actif **ou** au passif selon leur solde — répartition à confirmer. **[À TRANCHER]** → __________

**C3 — Compte de résultat, détails (poste → comptes).** **[À CONFIRMER]**

| Poste | Libellé | Comptes |
|---|---|---|
| RP1 | Primes ou cotisations | 70 |
| RP2 | Subventions d'exploitation reçues | 71 |
| RP3 | Commissions et participations reçues des réassureurs | 75 |
| RP4 | Produits accessoires | 76 |
| RP5 | Produits financiers (produits de placements) | 77 |
| RC1 | Charges de prestations (sinistres, capitaux, rentes) | 60 |
| RC2 | Frais de personnel | 61 |
| RC3 | Impôts et taxes | 62 |
| RC4 | Travaux, fournitures, services extérieurs ; transports | 63, 64 |
| RC5 | Commissions | 65 |
| RC6 | Frais divers de gestion | 66 |
| RC7 | Frais financiers (charges de placements) | 67 |
| RC8 | Dotations aux amortissements et provisions | 68 |

Réponse : ☐ Validé ☐ À corriger → ______________________________________________

**C4 — Formules de résultat.** **[À CONFIRMER]**

| Solde | Libellé | Formule proposée |
|---|---|---|
| RT | Résultat **technique** (amorce) | **+ RP1 + RP3 + RP5 − RC1 − RC5 − RC8** |
| RN | Résultat **net** de l'exercice (avant impôt, amorce) | **+ RT + RP2 + RP4 − RC2 − RC3 − RC4 − RC6 − RC7** |

Réponse : ☐ Validé ☐ À corriger → ______________________________________________

**C5 — Éléments volontairement HORS amorce v1 (à cadrer pour une version complète).** **[À TRANCHER]**
- Séparation **Vie / Non-Vie** du compte d'exploitation générale (compte 80) → __________
- **Variations de provisions techniques** dans le résultat (cycle inversé de l'assurance) → __________
- Ventilation de la **part des réassureurs** poste par poste (comptes 39, 75, 40) → __________
- Traitement de l'**impôt sur les bénéfices** (compte 85) dans la cascade → __________
- États annexes réglementaires **C1..C25** (antériorité primes, cadence sinistres…) → __________

---

## §3 — Zone Franche Togo (`zone-franche-togo@1.0`) — barème fiscal

**Contexte :** la **présentation comptable est identique au SYSCOHADA révisé** (rien à valider côté états). Seul
le **paquet fiscal dérogatoire** est une amorce. Il ne sert **pas** à la liasse mais au **prévisionnel d'impôt**.

**Z1 — Barème IS dégressif (par ancienneté depuis l'agrément).** **[À CONFIRMER]**

| Années d'exploitation | Taux IS proposé | Rappel droit commun |
|---|---|---|
| 1 → 5 | **0 %** | 27 % |
| 6 → 10 | **8 %** | 27 % |
| 11 → 20 | **10 %** | 27 % |
| 21 et + | **20 %** | 27 % |

Réponse : ☐ Validé ☐ À corriger → ______________________________________________

**Z2 — Taxe sur les dividendes.** Exonération totale années 1→5 · **50 %** du taux normal années 6→10 · droit
commun ensuite. **[À CONFIRMER]**
Réponse : ☐ Validé ☐ À corriger → ______________________________________________

**Z3 — TVA & fiscalité de porte.** TVA exonérée sur travaux/services pour le compte de l'entreprise franche ;
exonération des droits d'entrée et de la taxe statistique sur les équipements ; **−50 %** sur véhicules utilitaires. **[À CONFIRMER]**
Réponse : ☐ Validé ☐ À corriger → ______________________________________________

**Z4 — Variantes régionales.** Plateaux/Centrale : exonération IS **10 ans** puis progressif dès l'an 11.
Kara/Savanes : exonération **15 ans** puis progressif dès l'an 16. **[À CONFIRMER]**
Réponse : ☐ Validé ☐ À corriger → ______________________________________________

**Z5 — Référence légale.** Statut d'Entreprise Franche (SAZOF), cadre **loi n°89-14** et textes modificatifs +
lois de finances récentes : la référence est-elle à jour pour 2026 ? **[À TRANCHER]** → __________

---

## Récapitulatif de validation

| # | Zone | Validé par | Date | Décision globale |
|---|---|---|---|---|
| §1 | SIG SFD (RSA→RSG) | __________ | ______ | ☐ OK ☐ Corrections jointes |
| §2 | Postes & résultat CIMA | __________ | ______ | ☐ OK ☐ Corrections jointes |
| §3 | Barème fiscal zone franche | __________ | ______ | ☐ OK ☐ Corrections jointes |

> Après validation, reporter les corrections dans les sources
> (`bilan-service/scripts/referentiels/sources/`), régénérer (`node scripts/referentiels/build.mjs`),
> mettre à jour les checksums du `ReferentielRegistry`, puis lever le statut « amorce » sur les stories
> **STORY-120 / 121 / 122**.
