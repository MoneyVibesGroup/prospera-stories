# STORY-986 : la compagnie fictive — un logiciel de compagnie d'essai qui parle l'annexe C

Status: done

**Complexité :** grande (une application neuve, les deux transports dans l'autre sens, des réglages de panne)

**Épic :** EPIC-204 (le logiciel de compagnie fictif, la compagnie de démonstration et la recette de la démo)
**Dépôt :** `MoneyVibesGroup/prospera-assureur-fictif` (**neuf**, vide : `main` et `dev` posées par cette story)
**Plage :** groupe C, n° 7 du lot (`coordination/PLAN-4-SESSIONS-2026-11-14.md` §5).

---

## Pourquoi

La démonstration et la recette ne peuvent pas attendre le logiciel réel de la compagnie (LC) : la spine (AD-19) prévoit
un **LC fictif**, application à part, qui parle **l'annexe C et rien d'autre**, par les deux transports, et que l'on
fait tomber en panne à volonté. C'est contre lui que se prouvent l'échange (EPIC-203) et la démo (EPIC-204).

## Ce qui doit être vrai à la fin (plan §5, n° 7)

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **Les deux transports, dans l'autre sens** : il sert l'API que `liaison-assureur` appelle (`GET entree`, `GET entree/{nom}`, `PUT sortie/{nom}`, jeton porteur) **et** dépose / relève dans le même répertoire d'échange (`<racine>/<organisation>/entree` qu'il écrit, `sortie` qu'il lit) | tests ; pile avec `liaison-assureur` |
| AC-2 | **Il répond à ce que Prospera envoie** : une déclaration (C-13) reçoit un **accusé** (C-12) et un **numéro officiel** (C-11) dans un format propre (`LCF-AAAA-NNNNNN`, sans trou ni doublon, la même `DEC-` toujours le même numéro) ; une évaluation, un règlement, un recours, une décision reçoivent leur accusé ; une clôture avec reste à payer est refusée `ETAT_INCOMPATIBLE` | unitaires |
| AC-3 | **Il sait mal se conduire** (FR-204), par réglage : **panne** (API en 503, fichiers non relevés), **refus motivé** des N prochains envois, **doublon** (la prochaine déclaration reconnue comme doublon d'un sinistre existant), **retard** d'attribution du numéro, mode **« ne reçoit pas »** (aucun accusé), **changement d'une police** après l'ouverture d'un dossier (version nouvelle publiée) | unitaires ; e2e |
| AC-4 | **Il publie ses objets** par lots du contrat (C-1 → C-9), version par version ; un jeu de base (les exemples du contrat) se publie à la demande | unitaires |
| AC-5 | **Essai seulement** (AD-19, FR-205) : il refuse de démarrer hors d'un espace d'essai (`ASSUREUR_FICTIF_INTERDIT`) ; ses routes d'administration passent le gate `ASSUREUR_FICTIF_NOT_ENTITLED` | tests ; démarrage |
| AC-6 | Pile du moteur (Node 24, Confluent, MongoDB 8), manifeste copié à l'octet, port 3411, profil `assureur-fictif` ; **prouvé sur une pile avec `liaison-assureur`** : une déclaration envoyée par Prospera revient numérotée, par fichiers puis par API | pile `grp-c` |

## Décisions retenues par défaut (contestables)

- **D-986-1 — Le jeu complet (14 gestionnaires, ~3 500 dossiers, `SIN-2026-9001` → `9004`) est STORY-987.** Ici, un jeu
  de base : les exemples du contrat, publiables à la demande.
- **D-986-2 — L'espace se lit dans l'environnement** (`FICTIF_ESPACE=essai`) en attendant `assureurFictifAutorise` de
  l'état voulu signé (spine du moteur, `agent-instance`, hors de C) ; toute autre valeur refuse le démarrage.
- **D-986-3 — L'horloge de l'essai** (`essai.horloge.changed@1`) viendra avec son producteur ; ici l'horloge du port
  `Horloge`, figeable en test.
- **D-986-4 — Le LC fictif n'utilise aucun code de Prospera** : il copie le contrat de `prospera-plateforme` comme tout
  connecteur, et rien d'autre (il ne lit ni n'écrit aucune base de Prospera).

## Ce qui a été livré

**2026-11-15** — `prospera-assureur-fictif` **#1**, fusionnée en « Rebase and merge » sur `dev` (`0464171` ; `main`
`28c96e0` et `dev` posées par cette story, « Rebase and merge » seul). Image reconstruite depuis `dev` : healthy.

- Node 24 (export LF) : **346 unitaires, 14 e2e**, lint 0, build ; chaque lot publié vérifié conforme au contrat.
- **Pile réelle avec `liaison-assureur`** (même volume d'échange, IdP de test hors dépôt) :
  - **par fichiers** : une déclaration envoyée par Prospera revient numérotée `LCF-2026-000001`, rattachée voie `AUTO`,
    l'envoi passe accepté ; le jeu de base publie 9 lots, tous intégrés ; une police suspendue au LC arrive en
    version 2 dans la projection ; un refus réglé au LC ouvre un écart `REFUS_LC` (`MONTANT_INCOHERENT`) ;
  - **par API** (`LIAISON_TRANSPORT=api`) : la déclaration part par `PUT`, le numéro `LCF-2026-000002` revient par
    `GET` ; une panne réglée au LC est dite au relevé (`HTTP 503`), puis tout reprend.

**Reste** : le jeu complet de la compagnie de démonstration (STORY-987) ; l'horloge de l'essai et le drapeau
`assureurFictifAutorise` de l'état voulu, avec leurs producteurs (moteur).
