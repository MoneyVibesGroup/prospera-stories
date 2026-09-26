# STORY-687 : Les dividendes versés entre sociétés du groupe gonflent le résultat consolidé

Status: ready-for-dev

**Épic :** EPIC-137 — Homogénéisation et éliminations (consolidation)
**Service :** `bilan-service` — module `consolidation`
**Points :** 5 · **Sprint :** S20 · **Complexité :** medium · **Assigné à :** `vivianMoneyVibesGroupes`
**Prérequis :** **STORY-542** (le journal des résultats internes, le report, le prorata)
**Origine :** cadrage de STORY-542 (2026-09-26), constat M7 et décision D-542-11.

---

## Le fait

Une filiale distribue à la mère un dividende prélevé sur ses réserves : dans les comptes individuels de la
mère, c'est un **produit** ; pour le groupe, c'est un **transfert interne** d'un résultat que la consolidation
a déjà compté (l'exercice où la filiale l'a gagné). Le laisser au résultat consolidé le **compte deux fois**.

*« Les dividendes intra-groupes sont également éliminés en totalité, y compris les dividendes qui portent sur
des résultats antérieurs à la première consolidation »* (règlement ANC n° 2020-01, art. 251-2 — doctrine que le
SYSCOHADA révisé reprend du CRC 99-02) ; fondement : AUDCIF, art. 86 4° (résultats internes).

⚠️ Le libellé de `RESULTATS_INTERNES` (STORY-531) promettait les dividendes ; aucun critère de STORY-542 ne les
couvrait, et leur traitement diffère sur deux points : l'effet d'impôt est **permanent** (aucune différence
temporelle — l'impôt de distribution relève de l'art. 86 5°, STORY-686) et le prorata est celui du
**bénéficiaire** (le dividende reçu est déjà la quote-part du groupe), pas le plus faible des deux. STORY-542
les a nommés `DIVIDENDES_INTERNES`, `NON_TRAITE`, requis.

## Critères d'acceptation

- [ ] AC-1 — Un dividende interne est **déclaré** (distributrice, bénéficiaire, montant reçu, compte de produit
      du bénéficiaire, exercice) — il s'élimine du résultat du bénéficiaire contre les **réserves** de la
      distributrice, tracé, justifié, réversible au journal de consolidation.
- [ ] AC-2 — ⛔ Aucun effet d'impôt différé : l'écriture le **dit** (différence permanente), et STORY-545 ne le
      lit pas comme une différence temporelle.
- [ ] AC-3 — Bénéficiaire intégré proportionnellement : éliminé à **son** pourcentage d'intégration ; test du
      cas IG ← IP (le dividende reçu est déjà la quote-part : jamais le plus faible des deux).
- [ ] AC-4 — Comme les autres familles (D-542-9) : aucune décision n'est déduite d'un silence — une omission
      motivée, ou au moins une déclaration, fait passer `DIVIDENDES_INTERNES` à `APPLIQUE`.

## Notes

- Voir [[STORY-542]] (D-542-6 à D-542-11), [[STORY-686]], [[STORY-544]], [[STORY-545]].

## Progress Tracking

**Statut : `ready-for-dev` (2026-09-26).** Créée par le cadrage de STORY-542 (D-542-11) — numéro réservé par
balayage de TOUTES les branches distantes de `docs/` (maximum 686).
