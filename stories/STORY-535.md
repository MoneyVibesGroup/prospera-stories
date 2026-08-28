# STORY-535 : Des achats sans aucun compte de stock — le contrôle qui rend l'oubli visible, sans jamais refuser

Status: ready-for-dev

**Épic :** EPIC-011 — États financiers (contrôles de cohérence de la liasse)
**Service :** `bilan-service` — `controles-coherence`
**Points :** 5 · **Sprint :** S20
**Origine :** §8.1 de `analyse-scalabilite-multireferentiel-2026-08-27.md`, validé par le PO le 2026-08-28. **Geste ② sur trois.**

---

## Le fait

Aujourd'hui, une liasse dont le compte de résultat porte **des achats de marchandises** et dont le
bilan ne porte **aucun stock** passe tous les contrôles : `EQUILIBRE_BILAN` est vert,
`coherenceSousTotaux` est vert, l'articulation des notes est verte.

⇒ **Le seul contrôle qui manque est celui qui verrait le trou.** Une entreprise commerciale qui
achète pour revendre a nécessairement du stock à la clôture — ou alors elle a tout vendu, ce qui
arrive et se dit, mais ne se suppose pas.

⚡ C'est exactement le mode de panne récurrent du programme : **le calcul est juste, la source ne
l'est pas**, et aucun contrôle d'équilibre ne peut s'en apercevoir. Ici la conséquence est la
**marge commerciale**, c'est-à-dire le premier nombre qu'un chef d'entreprise et un banquier
regardent.

## ⛔ Ce contrôle est INFORMATIF, jamais bloquant

Une entreprise **peut** légitimement clôturer sans stock : déstockage complet, activité de pure
prestation, première année sans achat. **Refuser une liasse sur cette base serait faux.** Le
contrôle **signale**, il ne décide pas — catégorie `INFORMATIF`, comme le module en connaît déjà.

## Critères d'acceptation

- [ ] AC-1 — Nouveau contrôle `COHERENCE_STOCKS` dans la batterie existante, suivant **exactement**
      le contrat des autres : `statut` ∈ `CALCULE` / `INDETERMINABLE` / `NON_APPLICABLE`, un booléen
      `coherent`, une catégorie `INFORMATIF`.
- [ ] AC-2 — ⛔ **Le booléen se lit avec son statut, jamais seul.** 6ᵉ occurrence du patron, après
      `coherenceSousTotaux`, `coherenceResultat` et `ControleTresorerie` : lire `coherent` seul
      afficherait une anomalie là où il n'y a qu'une absence. Un test le prouve.
- [ ] AC-3 — Règle : la liasse porte des **achats** (comptes de la classe 6 déclarés « achats » par
      le référentiel) **non négligeables**, et **aucun solde de classe 3** ni **aucune variation**
      (`603x` / `73x`) ⇒ `coherent: false`, avec le montant des achats en cause.
- [ ] AC-4 — ⚠️ **Le seuil de « non négligeable » est déclaré, pas codé** : un montant nul ou
      symbolique ne doit pas produire un signal que personne ne regardera. Un contrôle qui crie tout
      le temps ne dit plus rien.
- [ ] AC-5 — `NON_APPLICABLE` quand le **référentiel du dossier ne déclare pas de classe 3 marchande**
      (`sfd-bceao`, `cima-assurances`) — et `coherent: true`, parce que *« rien à réconcilier »
      compte comme un succès*. Doctrine déjà appliquée au TFT absent du SFD.
- [ ] AC-6 — Le message **nomme le geste** : « saisissez votre inventaire de clôture » avec le renvoi
      vers l'écran de STORY-534, jamais « incohérence détectée ».
- [ ] AC-7 — ⚠️ **Non-régression : le drapeau global de la liasse ne change pas de couleur** du seul
      fait de ce contrôle informatif. Un vert qui devient rouge sur une liasse déjà validée hier
      ferait chercher ce qu'on a cassé.

## Notes

- Voir [[STORY-534]] (le geste qui referme le trou), [[FE-084]], `controles-coherence-response.dto.ts`.
