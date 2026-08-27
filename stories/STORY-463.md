# STORY-463 : L'ancre des emplois durables peut devenir négative — un actif immobilisé net négatif que le contrôle d'équilibre ne peut pas voir

Status: ready-for-dev

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 2 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé en faisant varier le délai clients sur le jeu de démonstration de FE-035, contre le moteur réel.

---

## Le fait

Le bilan prévisionnel simplifié part d'un **solde d'ancrage** :

```
actifImmobiliseNet = totalActifBase − bfrNormatif(0) − tresorerieBase
```

assumé comme tel dans les types (« elle absorbe tout ce que le modèle simplifié ne ventile pas »).
Rien ne le borne. Or `bfrNormatif(0)` croît linéairement avec les délais saisis, qui sont bornés à
**3 650 jours** par le DTO.

Sur le dossier de démonstration (total actif 5 700 000, trésorerie 850 000, marge 18 %, stocks 75 j,
fournisseurs 60 j), l'ancre bascule **négative dès 95 jours** de délai clients — un délai parfaitement
banal en Afrique de l'Ouest. Le bilan prévisionnel affiche alors un **actif immobilisé net négatif**,
c'est-à-dire une ligne d'actif impossible.

⚠️ **Et `controle.ecart` ne rougit pas** : il est nul **par construction** (la trésorerie de clôture
absorbe exactement les flux). C'est exactement le défaut déjà relevé sur `coherenceResultat` dans la
liasse — un voyant qui ne peut pas s'allumer donne une fausse assurance.

## Critères d'acceptation

- [ ] AC-1 — La réponse porte `ancrageEmploisDurables: { montant, coherent: boolean }` et le
      `coherent: false` est **explicite** quand le montant est négatif.
- [ ] AC-2 — Un contrôle dédié apparaît à côté de `controle` : `ANCRAGE_EMPLOIS_DURABLES`, de nature
      **INFORMATIVE** (il ne doit pas empêcher de projeter), avec son écart.
- [ ] AC-3 — Le test unitaire exerce le **seuil** : une projection au-delà du seuil produit
      `coherent: false`, une projection en-deçà `true` — la relation doit être mise à l'épreuve, pas
      seulement écrite (même argument que `controleEquilibre` exporté à dessein).
- [ ] AC-4 — La borne des délais est ramenée à une valeur métier (proposition : **365 jours**) — 3 650
      jours n'a aucun sens et laisse passer les saisies fautives d'un facteur 10.

## Conséquences ailleurs

- Alimente l'écran FE-035, qui affiche aujourd'hui le seuil calculé au cas par cas.
