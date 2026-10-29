# STORY-674 : Les paiements envoyés entrent au relevé — la position se recoupe de nouveau

Status: done

**Épic :** EPIC-036 — Fournisseurs de paiement interchangeables et simultanés
**Service :** `paiement-service`
**Points :** 5 · **Sprint :** ⚠️ **NON SLOTTÉE** — suite du `PLAN-PI-SPI-CAS-D-USAGE-2026-09-15`
**Prérequis :** **STORY-669** (le relevé se relève chez le participant), **STORY-668** (l'ordre de
paiement), **STORY-270** (la cascade de rapprochement)
**Origine :** point ouvert n° 2 de [[STORY-668]] et n° 4 de [[STORY-669]], constaté en recette le
2026-09-21.

---

## Le fait

[[STORY-669]] relève un compte chez le participant par `GET /paiements-recus` : le relevé ne porte
que des **entrées**. Tant que rien ne sortait, c'était exact — et la recette l'a montré au franc
près : position 1 000 001 025 = 1 000 000 000 d'ouverture + 1 025 de paiements relevés.

⛔⛔ **DEPUIS [[STORY-668]], CE RECOUPEMENT EST FAUX.** Deux envois irrévocables sont partis du même
compte le 2026-09-21 — 50 francs par la sonde de cadrage, 25 par l'ordre de la recette — et un
troisième, de 10, est resté `INITIE` sans déplacer un franc. La position vaut
1 000 000 950 ; le relevé dit toujours 1 025 d'entrées. **L'écart de 75 n'est écrit nulle part dans
ce service** : ni ligne, ni écart de rapprochement, ni alerte. Quelqu'un qui rapproche son compte
voit un nombre chez sa banque et un autre chez nous, et rien ne lui dit que la différence est de
l'argent qu'il a lui-même ordonné de payer.

⚡ **Le participant sait le dire — mesuré le 2026-09-21.** `GET /paiements-envoyes` (portée
`paiement.read`) rend, par tentative : `txId`, `end2endId`, `montant`, `statut`, `statutRaison`,
`categorie` (`733`), **`payeurCompte`**, `payeCompte`, `dateEnvoi`, `dateIrrevocabilite`, `motif`.

⛔ **Et cette liste-là ment par excès, là où l'autre ne mentait pas.** Elle rend **toutes les
tentatives** : l'envoi exécuté, mais aussi son **doublon rejeté** (`REJETE` / `DU03`, sous le même
`txId` et un autre `end2endId`) et les envois **`INITIE`** qui n'ont déplacé aucun franc. Ranger la
liste telle quelle ferait sortir du compte de l'argent qui n'en est jamais sorti.

⚡ **La cascade sait déjà quoi faire d'une sortie : elle la compte.** `cascade-de-cles.ts` ne
confronte que les mouvements `ENTRANT` ; un `SORTANT` est rendu dans `horsPerimetre`. Rien ne casse
donc à l'arrivée de ces lignes — et c'est aussi pourquoi, aujourd'hui, une sortie ne s'apparie à
rien.

## Critères d'acceptation

- [x] AC-1 — La relève d'un compte ([[STORY-669]]) range **aussi** les paiements envoyés depuis ce
      compte, comme des lignes de sens `SORTANT`, par le **même** chemin d'écriture
      (`ImporterLeReleve`) : même empreinte, même rang parmi les jumelles, et relever deux fois
      n'ajoute toujours rien.
- [x] AC-2 — ⛔⛔ **Seul l'argent SORTI entre au relevé.** Une tentative n'est une ligne que si elle
      est **irrévocable**. Un rejet — et d'abord un rejet pour **doublon** — et un envoi `INITIE`
      sont écartés et **comptés**. Les vecteurs de test sont les corps **mesurés** du 2026-09-21,
      doublon compris.
- [x] AC-3 — ⛔ **Les filtres se mesurent avant de s'écrire.** `payeurCompte` et les opérateurs de
      date de `/paiements-envoyes` n'ont **pas** été sondés (seul `txId` l'a été). La story les
      mesure **un par un** — l'API ne nomme qu'une erreur par réponse — et les **revérifie** à la
      lecture : un filtre accepté n'est pas un filtre appliqué. Même curseur, même refus au-delà du
      plafond, même méfiance envers `meta.total` et `sort` que [[STORY-669]].
- [x] AC-4 — ⚡ **La position se recoupe de nouveau, et la relève le DIT.** Le bilan rend le total
      des entrées, le total des sorties, et la position lue : sur une période qui remonte à
      l'ouverture du compte, `ouverture + entrées − sorties = position`. ⚠️ La position reste
      **rendue et jamais rangée** (NFR-1b) ; aucun champ ne s'appelle `solde`.
- [x] AC-5 — ⚡ **Une sortie s'apparie à SON ordre, par clef certaine.** La ligne porte en
      référence l'identifiant de transaction du schéma — celui que [[STORY-668]] range sur l'ordre
      exécuté (`referenceFournisseur`) — et, au libellé, l'identifiant de l'ordre. Un ordre
      `EXECUTE` sans ligne de sortie, et une sortie sans ordre (un paiement fait **hors de
      Prospera**, depuis l'application de la banque), sont deux **écarts nommés**.
- [x] AC-6 — ⛔ **Aucun ordre n'est créé ni modifié par la relève.** L'invariant de [[STORY-269]]
      s'étend tel quel : un relevé est un référentiel de comparaison. L'issue d'un ordre se constate
      par `demanderDesNouvelles` ([[STORY-668]]), jamais parce qu'une ligne est apparue — par
      **absence d'injection**, comme pour les encaissements.
- [x] AC-7 — ⛔ **Le bénéficiaire n'entre pas dans une ligne** : ni son nom, ni son adresse de
      paiement. Le libellé porte le motif et notre référence, comme pour une entrée.
- [x] AC-8 — Recette **réelle** : le compte de Money Vibes relevé sur septembre 2026 rend ses cinq
      entrées **et** ses deux sorties irrévocables (50 et 25), écarte le doublon `DU03` et l'envoi
      `INITIE`, et le recoupement de l'AC-4 tombe juste.

## Ce que cette story ne fait pas

- Elle **ne constate pas** l'exécution d'un ordre à partir du relevé (AC-6).
- Elle **ne relève pas** `GET /comptes/transactions` (mouvements entre comptes du même client
  business) : la liste existe, elle est vide, et personne n'a encore deux comptes.
- Elle **ne touche pas** FedaPay, dont le relevé reste un fichier.

## Notes

- Voir [[STORY-669]] (la lecture pure des pages, le curseur, les filtres revérifiés),
  [[STORY-668]] (les tentatives sous un même `txId`, `DU03`, « l'exécution gagne »), [[STORY-270]]
  (la cascade et son `horsPerimetre`), [[STORY-269]] (l'empreinte), [[STORY-242]] (NFR-1b).
- ⚠️ `ordre-api-business.ts` lit déjà ces mêmes tentatives pour dire l'issue d'un ordre. **Deux
  lectures de la même liste, deux questions** : « qu'est devenu CET ordre ? » et « qu'est-il sorti de
  CE compte ? ». La règle « un doublon n'est pas un fait » leur est commune ; elle ne doit pas
  s'écrire deux fois.

## Livraison — 2026-10-23

**Code :** `prospera-paiement-service`, branche `MNV-674` (`32cae3d`), basée sur `origin/dev`
(`4c7d385`). 4 015 tests unitaires (293 suites), 46 e2e des relevés et encaissements, lint 0.
**Recette réelle :** `npm run recette:pi-spi` — 9 prouvés, **1 bloqué nommé**, 0 échec.

### Ce qui a été mesuré (AC-3), un filtre à la fois, sur le bac à sable

| Paramètre de `GET /paiements-envoyes` | Verdict |
|---|---|
| `payeurCompte` | **appliqué** — un autre compte du client rend `[]`, un compte inconnu `403` qui le nomme |
| `dateIrrevocabilite[gte\|lte]` | **appliqué** — une tentative rejetée n'a pas de date et n'y répond jamais |
| `dateEnvoi[gte\|lte]` | appliqué (non utilisé) |
| `statut` | appliqué ici, **refusé** sur `/paiements-recus` — non utilisé, l'irrévocabilité se revérifie à la lecture |
| `dateDebut` | refusé (`400`) |
| `sort` | accepté, sans effet |
| `meta.page` (curseur) | même forme que `/paiements-recus` ; `meta.total` = taille de page |

### ⛔⛔ Fait nouveau : le participant ne garde qu'UNE tentative par identifiant, la dernière

Le 2026-09-21, la liste filtrée sur un `txId` rendait l'exécution **et** son doublon. Le 2026-10-23,
elle ne rend plus que le doublon `REJETE/DU03`, sans date d'irrévocabilité ; l'envoi `INITIE` de
10 F a disparu. Les 75 F partis le 2026-09-21 sont toujours sortis du compte (position
1 000 000 950, puis 945 après l'envoi de recette de 5 F) et **ne sont plus listés nulle part**.

- AC-8 n'est donc **pas atteignable tel qu'écrit** (« rend ses deux sorties irrévocables, 50 et
  25 ») : le participant ne les rend plus. Un envoi de recette neuf de 5 F (sans doublon,
  `txId 51d5443bf60008c0f3db4798`) est relevé comme sortie irrévocable.
- Le recoupement le **dit** au lieu de l'affirmer : `1 000 000 945 − 1 025 + 5 = 999 999 925`, soit
  exactement 75 F de moins que l'ouverture. La recette classe cet écart précis en `BLOQUE` nommé ;
  tout autre écart serait un `ECHEC`.
- ⚠️ **Conséquence pour [[STORY-668]]** (point ouvert ci-dessous) : « l'exécution gagne » suppose
  que la liste montre l'exécution. Ce n'est plus vrai après un doublon : un ordre réémis sous le
  même identifiant lirait `INCONNU` au lieu d'`EXECUTE`. L'argent ne part pas deux fois (même
  `txId`), mais l'ordre ne se constate plus exécuté.

### Ce qui a été fait

- **AC-1** — `releverUnCompte` lit `/paiements-recus` puis `/paiements-envoyes` par **une seule
  lecture de page** (`lireUnePage`, sens en paramètre) et une seule boucle de pagination ; un même
  plafond borne tout le relevé. Les lignes `SORTANT` passent par `ImporterLeReleve`.
- **AC-2** — seul l'`IRREVOCABLE` entre ; doublon et `INITIE` sont comptés dans `mouvementsEcartes`.
  La règle « un doublon n'est pas un fait » vit dans `tentatives-api-business.ts`, **commune** à la
  relève et aux ordres (la note de la fiche le demandait).
- **AC-4** — le bilan rend `recoupement: { entreesMineur, sortiesMineur, positionAuDebutMineur? }`,
  ce dernier seulement quand la période couvre l'instant de lecture de la position. Rien n'est
  rangé, aucun champ `solde`.
- **AC-5** — `confronterLesSorties` (domaine, pur) : clef 1 = identifiant du schéma
  (`referenceFournisseur` de l'ordre), clef 2 = identifiant de l'ordre retrouvé **entier** au
  libellé ; l'ambiguïté n'apparie pas et ne redescend pas. Écarts nommés `SORTIE_SANS_ORDRE`,
  `ORDRE_SANS_SORTIE`. Les ordres sont lus avec un jour de marge avant la période, et seuls ceux
  validés dans la période peuvent être déclarés sans sortie. Rendu par le rapprochement
  (`sorties`), compté au journal (`sortiesAppariees`, `ecartsDeSortie`), jamais rangé.
- **AC-6** — le rapprochement ne reçoit des ordres que `OrdresExecutesDuCompte`, qui ne sait que
  lister ; `OrdresModule` n'exporte qu'elle. La relève, elle, ne connaît aucun ordre. Garde de
  câblage neuve sur `RapprochementModule` (avec contre-preuve).
- **AC-7** — ni alias, ni compte, ni nom du bénéficiaire dans une ligne : le libellé porte le motif
  et le `txId` de notre ordre.

### Points ouverts

1. **STORY-668 après un doublon** — voir plus haut. Remède à cadrer : se souvenir de l'exécution
   au moment où on la lit (elle est déjà rangée dans `referenceFournisseur`), ou rapprocher l'ordre
   par la position. Une story à créer.
2. Un ordre réémis sous le même identifiant fait **disparaître sa sortie du relevé** : le
   recoupement le montre, la confrontation le nomme `ORDRE_SANS_SORTIE` — c'est voulu, et c'est le
   seul endroit où cela se voit.
3. Aucune conformité Docker jouée (règle « Docker à la demande ») : le module de rapprochement
   importe désormais `OrdresModule`, prouvé par la garde de câblage, pas par un démarrage.
