# STORY-1044 : La bibliothèque `series` — des séries sans perte

Status: done

**Épic :** EPIC-224 · **Dépôts :** `prospera-plateforme` (`series/`, tenu par D), consommée par
`prospera-ventes-service` · **Plage :** groupe D, n° 15 du lot 2. Dépend de 1042. Hors profil hébergé (EPIC-263).

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **50 émissions simultanées = 50 numéros consécutifs** | MongoDB réel (ventes) ; en mémoire (plateforme) |
| AC-2 | **Un bon annulé garde son numéro** : un numéro émis est consommé | MongoDB réel, mémoire |
| AC-3 | **La première facture suit le dernier numéro Sage** ; une série entamée ne s'amorce plus (`SERIE_DEJA_ENTAMEE`) | MongoDB réel, mémoire |
| AC-4 | **Après restauration, aucun numéro réémis** : relève au-delà de la tête ancrée, nouvelle époque | MongoDB réel, mémoire |

## Décisions retenues par défaut (contestables)

- **D-1044-1 — Un fichier unique, sans dépendance ni import**, copié à l'octet par chaque service à l'étiquette
  `series-v1` (e0cb763, sha256 `ef5105b7bca753af5ca4184f89d8f9c26c739f94bd1c84ea28d7695ada89bad2`), comme les autres
  bibliothèques de la plateforme ; l'empreinte est gardée chez le consommateur.
- **D-1044-2 — Un document par série**, chaque opération un `findOneAndUpdate` atomique (`$inc`, `$max`) : la
  concurrence se règle dans MongoDB, sans verrou applicatif ; l'adaptateur est typé structurellement (pilote ou
  Mongoose, sans dépendance).
- **D-1044-3 — La tête (dernier numéro, époque) est ce que l'agent reçoit chaque jour** (AD-21) ; la reprise après
  restauration la prend en paramètre : l'ancrage chez l'agent est EPIC-148 (B) et l'hébergé EPIC-263.
- **D-1044-4 — La facturation n'émet pas encore** : la bibliothèque est copiée dans le socle de ventes et éprouvée sur
  sa collection ; les numéros `BL-` et de facture s'émettront avec les stories de la chaîne de vente.

## Preuves

- Plateforme : **8 tests** de la logique (`node --test`), typage strict ; PR prospera-plateforme#14, étiquette `series-v1`.
- Ventes : copie à l'octet gardée par son empreinte ; Node 24 : **297** unitaires, **11** e2e ; MongoDB réel : **4** tests
  de séries (50 émissions simultanées consécutives, bon annulé, reprise de Sage, restauration sans réémission) ;
  pile `healthy` ; recette depuis `origin/dev` (d668e45) : 8/8. PR prospera-ventes-service#2.
