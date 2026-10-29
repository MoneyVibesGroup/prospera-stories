# STORY-723 : Un ordre exécuté se reconnaît après son doublon — le participant oublie l'exécution, pas l'identifiant

Status: done

**Épic :** EPIC-036 · **Service :** `paiement-service` · **Points :** 3 · **Rail :** E (hors liste)
**Prérequis :** [[STORY-668]] (l'ordre de paiement, « l'exécution gagne »), [[STORY-674]] (la mesure
qui a ouvert la story) · **Réf. :** FR-P68, AD-12

## Le fait — et ce que la mesure du 2026-10-27 en a corrigé

[[STORY-674]] avait conclu, le 2026-10-23 : *le participant ne garde qu'une tentative par `txId`, la
dernière* — après un doublon `DU03`, la liste ne montre plus l'exécution. **Mesuré de nouveau le
2026-10-27, c'est faux sur la cause, et juste sur l'effet :**

| Mesure (bac à sable, 5 F) | Ce que la liste `GET /paiements-envoyes?txId=` rend |
|---|---|
| Envoi neuf `cd0e1b4e…`, puis rejeu immédiat (`DU03`) | l'exécution **et** le doublon, encore 10 s plus tard |
| Envoi du 2026-10-23 `51d5443b…`, **jamais rejoué** | **rien** — l'exécution est oubliée, sans aucun doublon |
| Ce même identifiant, rejoué le 2026-10-27 | `200` + `REJETE/DU03` — **le schéma se souvient de l'identifiant** |
| Liste complète du compte | les doublons de septembre sont toujours là ; aucune exécution de plus de 4 jours |

⇒ **Le participant oublie les exécutions au bout de quelques jours, doublon ou pas, et garde les
rejets.** Deux conséquences dans le code de [[STORY-668]] :

1. `nouvellesDeLaListe` lisait « des doublons seuls » comme `INCONNU` (« liste incomplète »). Un
   ordre payé, revalidé sous la même référence, rendait ce doublon seul — et l'ordre repartait
   **« à valider »** au tour suivant, indéfiniment. Une personne finissait par préparer un **second**
   ordre : l'argent serait parti deux fois.
2. Personne ne demandait des nouvelles d'un ordre, sauf une personne, par la route. Celle qui le
   faisait après l'oubli lisait une liste vide.

## Critères d'acceptation

- [x] AC-1 — **Des doublons seuls se lisent `CONNU`**, jamais `INCONNU` : le schéma a reçu l'ordre.
      Le corps mesuré le 2026-10-27 est un vecteur de test. Juste après un rejeu, l'exécution est
      encore listée et elle gagne (comportement de 668 inchangé).
- [x] AC-2 — ⛔ `CONNU` ne porte **aucune** référence : celle d'un doublon est neuve, ce n'est pas la
      transaction de l'ordre (la ranger ferait apparier au relevé une sortie qui n'a pas eu lieu).
- [x] AC-3 — `CONNU` fait passer `EN_TRANSMISSION → TRANSMIS`, **quel que soit le temps écoulé**, et
      ne fait rien d'un ordre `TRANSMIS`. ⛔ Jamais `PREPARE`, jamais `EXECUTE` (l'exécution ne se lit
      plus : déclarer payé sans preuve, c'est oublier un bénéficiaire). Un ordre ainsi transmis ne
      s'annule ni ne se revalide.
- [x] AC-4 — **Une veille relit les ordres en attente d'issue** (`EN_TRANSMISSION`, `TRANSMIS`)
      validés dans une fenêtre bornée des deux côtés : plus d'une minute (la validation constate
      elle-même), moins de 24 h (en deçà de la mémoire du participant), les plus anciens d'abord, par
      lots. L'issue lue se consigne, tracée au nom du module `VEILLE_DES_ORDRES`.
- [x] AC-5 — ⛔ **La veille ne peut pas faire partir un ordre** : elle reçoit une relecture qui ne
      sait que lire et constater, jamais le cas d'usage. ⛔ **Ni la veille ni la relecture ne sortent
      d'`OrdresModule`** : son unique export reste `OrdresExecutesDuCompte` (sinon le rapprochement,
      qui l'importe, pourrait changer l'état d'un ordre). Garde de câblage avec contre-preuve. Un
      ordre en échec n'arrête pas le lot ; un tour en échec est nommé.
- [x] AC-6 — Les inventaires fermés sont mis à jour (porteurs de minuterie, AD-12) et **aucune garde
      n'est desserrée** : le dossier des ordres ne lit aucune configuration (668) — la veille reçoit
      ses trois durées et son lot par un **jeton** (`REGLAGE_VEILLE_DES_ORDRES`), résolu par
      `ReglageDeLaVeilleDesOrdresModule`, hors du dossier.
- [x] AC-7 — La recette réelle lit l'ordre oublié du 2026-10-23 **`CONNU`** (lecture seule, aucun
      envoi), et son recoupement admet exactement la somme des envois de recette connus que le relevé
      ne montre plus — tout autre écart reste un `ECHEC`.

## Arbitrage PO — voie B, confirmée le 2026-10-29

Pris sur recommandation, puis confirmé par le PO le 2026-10-29 : des doublons seuls ne prouvent
pas l'exécution, car « doublon ⇒ exécuté » est une propriété du bac à sable que la documentation
PI-SPI ne garantit pas. L'ordre s'arrête à `TRANSMIS`, jamais à `EXECUTE`.

| Voie | Pourquoi |
|---|---|
| A — doublons seuls = `EXECUTE` | La preuve est indirecte (rejets gardés, exécutions oubliées : propriété du bac à sable, non documentée). Déclarer payé à tort, c'est un bénéficiaire qu'on n'interroge plus. Écartée. |
| **B — doublons seuls = `CONNU` → `TRANSMIS`, + une veille qui lit l'exécution à temps** *(retenue)* | Ferme la double sortie sans rien affirmer de faux ; la veille rend le cas `CONNU` rare (il faut que le service ait été arrêté plus longtemps que la mémoire du participant). |
| C — rapprocher l'ordre par la position du compte | La position n'est pas attribuable ordre par ordre. Écartée. |

## Deux gardes qui ont corrigé la conception — et n'ont pas été desserrées

- **STORY-674, AC-6 (rapprochement)** : la première version exportait la relecture d'`OrdresModule`
  pour une veille logée dans un module à part. La garde « des ordres, seule la LECTURE sort de leur
  module » a rougi : le rapprochement aurait reçu de quoi marquer un ordre. ⇒ la veille est entrée
  **dans** le module, et ses réglages y arrivent par un jeton.
- **STORY-285 (bornes)** : `process.env.ORDRE_VEILLE_AGE_MINIMAL_MS` ressemblait à une borne lue de
  l'environnement (`MIN`). C'est une durée ⇒ renommée `ORDRE_VEILLE_ATTENTE_MS`.

## Ce que cette story ne fait pas

- Elle **ne rend pas `EXECUTE`** un ordre `CONNU` : il reste `TRANSMIS`, et c'est dit au journal
  (`issue: CONNU`).
- Elle ne couvre pas un ordre `EN_TRANSMISSION` relu **après** l'oubli et **sans** doublon : la liste
  est vide, il redevient « à valider » (comportement de 668). Revalidé, il rend un doublon et passe
  `TRANSMIS` — il ne part pas deux fois sous la même référence. La veille rend ce cas improbable.
- La mémoire exacte du participant n'est pas mesurée (entre quelques secondes et 4 jours) : la
  fenêtre de 24 h est un choix prudent, réglable (`ORDRE_VEILLE_FENETRE_MS`).

## Livraison — 2026-10-29

**Code :** `prospera-paiement-service`, branche `MNV-723` (`e5f331c`), basée sur `origin/dev`
(`9802e7e`), poussée — PR à ouvrir (« Rebase and merge »).

| Porte | Résultat |
|---|---|
| Unitaires | **4 189** (311 suites) + 130 du paquet de rapprochement, tous verts |
| e2e | **335** (27 suites) — 5 dépassements de 5 s sous charge parallèle, rejoués seuls et en série : verts |
| Conformité (vrai Mongo) | **5 suites / 30 tests**, dont `ordres-en-attente` (fenêtre, tri, index servi par le planificateur) |
| Lint / build | 0 / OK |
| Mutations | **10 / 10 rouges**, toutes compilées (2 premières versions ne compilaient pas : refaites, non comptées) |
| Docker | image construite depuis la branche, `healthy`, index `etat_1_valideLe_1` posé ; veille observée dans le conteneur : relit l'ordre de la fenêtre, ignore celui de 30 h, refus nommé faute de raccordement (NFR-1d), rien d'écrit |
| Recette réelle | **15 prouvés / 1 bloqué nommé / 0 échec** — `51d5443b…` se lit `CONNU` ; un envoi neuf de 5 F (`67c8fe62…`) est relevé ; écart restant = 85 F exactement, les 4 envois connus et oubliés |

### Mesures qui restent au dossier

- ⛔ **La mémoire du participant est de moins de 27 h** : `cd0e1b4e…`, exécuté le 2026-10-27 à 22:55,
  n'était plus listé le 2026-10-29 à 02:14. Peut-être une purge nocturne — non tranché. La veille
  relit un ordre 1 à 3 minutes après sa validation ; la fenêtre de 24 h est une **durée de reprise**
  (fournisseur injoignable), pas une garantie.
- Les rejets (`DU03`) sont gardés au moins 38 jours (ceux du 2026-09-21).
- Envois de recette exécutés : 50 + 25 (09-21), 5 (10-23), 5 (10-27), 5 (10-29). Position
  1 000 000 935 le 2026-10-29.

### Points ouverts

1. AC-8 de [[STORY-675]] (QR dynamique scanné deux fois) reste **non joué** : il faut un téléphone
   et l'application du bac à sable ; rien dans cette story ne le remplace.
2. Le recoupement de la recette ne tombera jamais plus à zéro tant que des envois de recette sont
   oubliés : c'est voulu, l'écart est nommé au franc près. Tout nouvel envoi de recette s'ajoute à
   `ENVOIS_DE_RECETTE_EXECUTES`.
