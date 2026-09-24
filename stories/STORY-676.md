# STORY-676 : Les notes 3A et 4 renvoient à des lignes de titre que le Bilan ne produit jamais — la note des immobilisations totalise 1 000 000 face à 47 000 000

Status: ready-for-dev

**Épic :** EPIC-010 — Référentiels & table de passage
**Service :** `bilan-service` (`:3004`) — paquet `syscohada-revise@2.2`, moteur des notes annexes
**Points :** 5 · **Sprint :** S20 · **Complexité :** high · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** vérification docker de STORY-559 (2026-09-24) — défaut **antérieur**, identique en `@2.1`.
**Débloque :** **STORY-537** — un fichier de dépôt généré aujourd'hui porterait deux feuilles fausses.
**Doit précéder :** **STORY-677** (l'octroi de `@2.2` recopie ses octets dans `balance-service`).

---

## Le fait, mesuré

Sur une balance réaliste, par les API réelles (vérification docker de STORY-559, stack neuve) :

| Note | Renvois (GUIDEF) | Total de la note | Ce que porte le Bilan |
|---|---|---|---|
| **3A** — IMMOBILISATION BRUTE | `AD`, `AI`, `AP` | **1 000 000** | **47 000 000** d'immobilisations |
| **4** — IMMOBILISATIONS FINANCIERES | `AQ` | **0** | **2 000 000** en `AS` |

**Aucun contrôle ne le signale** : `ARTICULATION_NOTES` classe 3A « détail non dérivable » (trame
alimentée par le registre), et la note 4 est `MIXTE` depuis 559 mais son seul poste ne reçoit rien.

## La cause, lue dans la donnée

Le formulaire imprime le renvoi sur la **ligne de titre** de la rubrique (`AD` IMMOBILISATIONS
INCORPORELLES, `AI` CORPORELLES, `AQ` FINANCIERES). Or la table de passage déclare ces titres
**`type: 'detail'`** avec le **préfixe de leurs enfants** :

```
AD  detail  NET_ACTIF  [21]        ← AE [211] … AH : les enfants prennent tout
AI  detail  NET_ACTIF  [22,23,24]  ← AJ [22] …
AQ  detail  NET_ACTIF  [26,27]     ← AR [26], AS [27] : ÉGALITÉ de longueur de préfixe
```

Le rattachement au **plus long préfixe** envoie chaque compte à l'enfant : le titre ne reçoit que des
résidus (rien, en pratique), la note hérite de ce zéro. `AP` (avances, `251`/`252`) n'a pas d'enfant :
c'est lui seul qui fait le 1 000 000.

⚠️ **À mesurer en premier (AC-0)** : ce que le **Bilan** imprime sur les lignes `AD`/`AI`/`AQ`. Si
elles sortent elles aussi à 0 alors que le formulaire y attend le sous-total de la rubrique, le
défaut n'est pas propre aux notes — et le correctif est dans la table de passage, pas dans le moteur
des notes.

## Ce que la story fait

- **Réviser `syscohada-revise@2.2` EN PLACE** : il n'est octroyé à **aucune** organisation (STORY-677
  ne l'a pas encore fait) — c'est exactement le cas où la doctrine du registre autorise la révision en
  place. `@2.1` reste **figé à l'octet** (décision user du 2026-09-24).
- Deux voies, à trancher par la mesure de l'AC-0 :
  - **(A) — recommandée si le Bilan est faux aussi** : les titres deviennent des **sous-totaux
    déclarés** (`type: 'total'`, opérandes = leurs enfants) dans une table de passage **propre à
    `@2.2`** (`table-de-passage-syscohada-2.2.json`) — la source partagée ne bouge pas, `@2.1` et
    `zone-franche-togo@1.0` gardent leurs octets. La note reprend le montant du titre, qui vaut enfin
    la rubrique ;
  - **(B) — si le Bilan est juste** : la note justifie les postes **de détail** de la rubrique. Le
    renvoi imprimé reste sur le titre ; le paquet **déclare** quels postes le titre couvre. Aucun
    numéro de poste dans le moteur (P7).

## Critères d'acceptation

- [ ] AC-0 — Mesuré et consigné : ce que le Bilan `@2.2` imprime sur `AD`, `AI`, `AP`, `AQ` et
      `AZ` sur la balance de la vérification docker de 559 ; la voie (A) ou (B) est tranchée sur
      cette mesure.
- [ ] AC-1 — Sur la même balance, `Σ` note 3A = les immobilisations incorporelles + corporelles +
      avances du Bilan ; `Σ` note 4 = les immobilisations financières du Bilan (N **et** N-1).
- [ ] AC-2 — `ARTICULATION_NOTES` **rougit** si un poste de la note 4 (`MIXTE`) ne rejoint pas sa
      ventilation — la note 4 cesse d'être un zéro silencieux.
- [ ] AC-3 — `@2.1` et `zone-franche-togo@1.0` : **octets inchangés** ; la non-régression AC-6 de
      559 (empreinte `adfc8d6e…`) passe toujours.
- [ ] AC-4 — Le nouveau checksum de `@2.2` est reporté au registre ; aucune liasse figée n'existe
      sous `@2.2` (vérifié en base : 0 snapshot `2.2` hors vérification).
- [ ] AC-5 — Mutation : remettre `AQ` en `detail [26,27]` (ou retirer la déclaration de la voie B)
      fait **rougir** AC-1.

## Hors périmètre

- Les autres lignes de titre des états (passif, résultat) : **à mesurer** dans l'AC-0 et, s'il y en a,
  **à ficher** — pas à absorber.
- L'octroi de `@2.2` : STORY-677.

## Notes

- Voir [[STORY-559]], [[STORY-677]], [[STORY-537]], [[STORY-528]] (le registre alimente 3A).

## Progress Tracking

**Statut : `ready-for-dev` (2026-09-24).** Créée par la clôture de STORY-559.
