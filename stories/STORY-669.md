# STORY-669 : Le relevé par l'API du participant — il ne se dépose plus, il se relève

Status: in-progress

**Épic :** EPIC-036 — Fournisseurs de paiement interchangeables et simultanés
**Service :** `paiement-service`
**Points :** 5 · **Sprint :** ⚠️ **NON SLOTTÉE** — `PLAN-PI-SPI-CAS-D-USAGE-2026-09-15`, phase C
**Prérequis :** **STORY-269** (le relevé, référentiel de comparaison), **STORY-270** (la cascade de
rapprochement), **STORY-666** (le raccordement par organisation)
**Origine :** le parcours « Suivi de trésorerie en temps réel » du catalogue PI-SPI. Aujourd'hui,
rapprocher exige qu'une personne exporte un fichier chez son établissement et le téléverse
([[STORY-269]]). Le participant sait pourtant dire lui-même ce qui est arrivé sur un compte.

⚠️ **Le titre du plan disait « la trésorerie ».** Le mot ne peut pas entrer dans ce service : la
garde NFR-1b (`detention-de-fonds.invariant.spec.ts`) l'interdit comme identifiant **partout**, et
interdit `solde` dans le modèle de données — parce que « Prospera ne détient jamais de fonds » ne
tient à rien d'autre qu'à l'absence de ces concepts dans le code. Elle a raison, et cette story s'y
range : elle parle de **relevé** et de **position d'un compte**, lue chez le participant, jamais rangée.

---

## Le fait — mesuré sur le bac à sable le 2026-09-21, en lecture seule

| Appel (sous `/TGD999`, raccordement de Money Vibes) | Ce qu'il rend |
| --- | --- |
| `GET /comptes/{numero}` (portée `compte.read`) | `{type, numero, solde: 1000000700, statut, dateOuverture, preConfirmation}` |
| `GET /paiements-recus` (portée `paiement.read`) | les paiements **reçus** : `txId`, **`end2endId`**, `montant`, `payeCompte`, `categorie`, `statut: IRREVOCABLE`, `dateIrrevocabilite`, `motif`, et l'identité du payeur |
| `GET /paiements/{end2endId}` | le détail d'un paiement |
| `GET /paiements-envoyes`, `GET /comptes/transactions` | existent, vides |
| `/comptes/{n}/solde`, `/transactions`, `/releve`, `/operations`, `/transferts`… | **n'existent pas** (`403` de la passerelle) |

⚡ **Le solde dit vrai** : 1 000 000 000 à l'ouverture, plus 300 + 200 + 200 — exactement les trois
paiements des recettes de [[STORY-663]], [[STORY-664]] et [[STORY-670]]. Le relevé et la position se
recoupent au franc près.

⚡ **Filtres mesurés un par un** (l'API ne nomme qu'une erreur par réponse) : `payeCompte`, `txId`,
`montant`, `payeurAlias`, `payeAlias`, `sort`, et `dateIrrevocabilite` avec les opérateurs `[gte]`,
`[lte]`, `[gt]` — **appliqués, pas seulement acceptés** (le `numero` de `GET /comptes` est accepté et
ignoré : un filtre ne se croit pas, il se mesure). `statut`, `dateDebut`, `dateFin`… sont refusés.

⚡ **La pagination est un curseur.** `meta.page` est une chaîne opaque à repasser en `?page=` ; la
dernière page est vide et n'en porte plus. ⛔ **`meta.total` n'est PAS le total** : c'est la taille
de la page (`size=1` rend `total: 1` sur trois paiements). Qui s'y fierait croirait avoir tout lu.

⚡⚡ **`/paiements-recus` porte `txId` ET `end2endId` ENSEMBLE** — les deux identifiants que
[[STORY-665]] avait mesurés sur deux chemins qui ne se rejoignaient pas (le webhook ne connaît que le
premier, la consultation range sous le second). C'est la seule réponse du schéma qui les relie.

## Critères d'acceptation

- [ ] AC-1 — Une organisation **relève** un de ses comptes sur une période : le service interroge le
      participant **sous le raccordement de l'organisation** ([[STORY-666]] — aucun repli), pour le
      compte désigné et lui seul, et range les mouvements dans le **même** registre que l'import de
      [[STORY-269]]. Droit : celui de l'import. Gate d'AD-16, trace au journal chaîné.
- [ ] AC-2 — ⛔⛔ **L'invariant de STORY-269 tient toujours, et par le même moyen.** Relever ne
      constate **aucun** encaissement : un relevé est un référentiel de comparaison, jamais une
      source d'écriture (AD-4). Le cas d'usage n'injecte ni le registre des encaissements, ni les
      créances — une **absence d'injection**, pas une garde.
- [ ] AC-3 — **Relever deux fois n'ajoute rien.** L'empreinte et le rang parmi les jumelles de
      STORY-269 s'appliquent tels quels : deux relèves qui se chevauchent rangent chaque mouvement
      une fois, et le bilan **compte** ce qui était déjà là.
- [ ] AC-4 — ⛔ **On lit TOUTES les pages, ou on le dit.** Le curseur est suivi jusqu'à la page vide ;
      `meta.total` n'est jamais cru. Au-delà du plafond de lignes d'un lot (STORY-269), la relève
      **refuse** et nomme le remède — raccourcir la période — plutôt que de ranger un relevé
      tronqué qui se lirait « complet ».
- [ ] AC-5 — ⛔ **Seul l'argent arrivé entre au relevé.** Un paiement qui n'est pas irrévocable n'est
      pas un mouvement : il est écarté et **compté**. Les filtres du participant sont **revérifiés**
      à la lecture (compte, période) : un filtre accepté n'est pas un filtre appliqué.
- [ ] AC-6 — ⚡ **Le rapprochement devient CERTAIN sans que personne ne saisisse rien.** Chaque
      mouvement relevé porte l'identifiant de transaction du schéma, et son libellé porte **notre
      référence de demande** ; la cascade de [[STORY-270]] la cherche désormais au libellé. Un
      encaissement constaté par webhook et le mouvement qui lui correspond s'apparient par une clef
      certaine, plus par « même montant, à un jour près ».
- [ ] AC-7 — La **position du compte** chez le participant est rendue avec la relève, datée, et
      **n'est rangée nulle part** : ni schéma, ni journal. Un nombre rangé est faux la seconde
      d'après, et c'est exactement le champ que NFR-1b interdit.
- [ ] AC-8 — Méthode **facultative** du port : un fournisseur qui ne sait pas relever garde l'import
      par fichier, et le refus le dit. Déléguée par l'enveloppe d'observation **avec** `suivre` —
      celle-ci PARLE au fournisseur.
- [ ] AC-9 — Recette **réelle** : le compte de Money Vibes relevé sur le bac à sable, les trois
      paiements rangés, la seconde relève n'en ajoute aucun, et le rapprochement apparie par clef
      certaine.

## Ce que cette story ne fait pas

- Elle **ne planifie rien** : la relève est un geste, pas une veille. La périodicité est une
  décision d'exploitation (coût d'appel, quotas du participant) qui viendra avec sa mesure.
- Elle **ne relève pas les paiements envoyés** : le service n'en émet aucun ([[STORY-668]], bloquée
  par l'amendement du PRD). Le relevé ne porte donc que des crédits.
- Elle **n'unifie pas** les clefs d'unicité du webhook et de la consultation. Elle mesure que le
  pont existe (`/paiements-recus?txId=`) ; le construire reste la story nommée par [[STORY-665]]
  (id ≥ 674).
- Elle **ne touche pas** FedaPay : son relevé reste un fichier.

## Notes

- Voir [[STORY-269]] (le relevé et son empreinte), [[STORY-270]] (la cascade), [[STORY-666]] (le
  raccordement), [[STORY-665]] (les deux clefs), [[STORY-242]] (NFR-1b et sa garde).
- ⚠️ Le relevé du participant **nomme le payeur** (`payeurNom`, `payeurAlias`). Rien de cela n'entre
  dans une ligne : le libellé porte le motif et notre référence, et c'est tout ce dont la cascade
  a besoin.
