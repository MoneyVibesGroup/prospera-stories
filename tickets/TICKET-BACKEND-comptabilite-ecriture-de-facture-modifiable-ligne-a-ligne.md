# Ticket backend — l'écriture proposée d'une facture ne se corrige que par ses montants, son compte et son tiers : pas ligne à ligne

**Ouvert le :** 2026-11-24 · **Par :** FE-149 (retour de l'utilisateur à la validation de la maquette)
**Service :** `prospera-comptabilite-service` (tenu par C) · **Appui d'origine :** STORY-1097 (#751, livrée), D-1097-8
**Sévérité :** moyenne : rien n'est faux, mais le comptable ne peut pas faire ce que l'écran lui montre

---

## Le constat

L'utilisateur a validé la maquette de FE-149 le 24/11 en demandant : « me donner la possibilité de modifier directement » la facture à corriger
(Quincaillerie Adjovi, écart HT + TVA ≠ TTC, aucun compte proposé), **et l'écriture proposée elle-même, dans son tableau** : changer le compte d'une
ligne, changer un débit ou un crédit, ajouter ou supprimer une ligne, avec le total et l'équilibre recalculés en direct.

Le contrat de `POST /{lotId}/inscrire` (STORY-1097) accepte ces corrections, toutes facultatives : `dateEcriture`, `numeroFacture`, `montantHT`,
`montantTVA`, `montantTTC`, `tiersId`, `compte` (le compte de charge ou de produit), `journal`, `tva` (`RECUPERABLE` | `NON_RECUPERABLE`), `compteDeTva`,
`avoir`, `libelle`, `devise`. **Les lignes sont toujours dérivées** de ces valeurs par la règle de proposition : charge HT, TVA, tiers TTC.

## Ce qui manque

1. **Des lignes libres** : un champ `lignes[]` en correction (`compte`, `debit`, `credit`, `libelle?`) qui remplace les lignes dérivées, avec les mêmes contrôles
   que la saisie du brouillard (exercice ouvert, comptes admis du plan propre, tiers du collectif, équilibre débit = crédit au franc près, au moins deux lignes).
2. **Le compte de la ligne du tiers** (le collectif 401 ou 411) : aujourd'hui fixé par `comptes-collectifs@1`.
3. **Ce que la décision devient** : la piste cite la proposition ; une écriture à lignes libres est `MODIFIEE` (D-1097-8), et ce qui remonte à la mémoire (STORY-1098)
   reste le compte de charge ou de produit, le traitement de la TVA et le journal ; les lignes libres ne s'apprennent pas.
4. **Une correction qui répare un signal** : la maquette fait disparaître `ECART_HT_TVA_TTC` et `COMPTE_A_CHOISIR` dès que les valeurs corrigées tombent juste. À confirmer :
   `inscrire` ré-évalue les signaux sur les valeurs corrigées (aujourd'hui le contrat dit « ce qui est appliqué = ce qui a été relu », sans préciser que le signal est levé).

## Ce que l'écran fait en attendant

Il dessine l'édition ligne à ligne (maquette validée) et recalcule l'équilibre à l'écran. Sans ce ticket, l'écran du code se limite aux corrections servies (points ci-dessus non faits)
et le tableau d'écriture reste en lecture. **Ne pas coder l'édition libre côté écran sans le champ serveur : l'inscription refuserait ce que l'écran a laissé faire.**
