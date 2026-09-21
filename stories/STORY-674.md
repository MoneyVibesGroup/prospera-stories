# STORY-674 : Les paiements envoyés entrent au relevé — la position se recoupe de nouveau

Status: ready-for-dev

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

- [ ] AC-1 — La relève d'un compte ([[STORY-669]]) range **aussi** les paiements envoyés depuis ce
      compte, comme des lignes de sens `SORTANT`, par le **même** chemin d'écriture
      (`ImporterLeReleve`) : même empreinte, même rang parmi les jumelles, et relever deux fois
      n'ajoute toujours rien.
- [ ] AC-2 — ⛔⛔ **Seul l'argent SORTI entre au relevé.** Une tentative n'est une ligne que si elle
      est **irrévocable**. Un rejet — et d'abord un rejet pour **doublon** — et un envoi `INITIE`
      sont écartés et **comptés**. Les vecteurs de test sont les corps **mesurés** du 2026-09-21,
      doublon compris.
- [ ] AC-3 — ⛔ **Les filtres se mesurent avant de s'écrire.** `payeurCompte` et les opérateurs de
      date de `/paiements-envoyes` n'ont **pas** été sondés (seul `txId` l'a été). La story les
      mesure **un par un** — l'API ne nomme qu'une erreur par réponse — et les **revérifie** à la
      lecture : un filtre accepté n'est pas un filtre appliqué. Même curseur, même refus au-delà du
      plafond, même méfiance envers `meta.total` et `sort` que [[STORY-669]].
- [ ] AC-4 — ⚡ **La position se recoupe de nouveau, et la relève le DIT.** Le bilan rend le total
      des entrées, le total des sorties, et la position lue : sur une période qui remonte à
      l'ouverture du compte, `ouverture + entrées − sorties = position`. ⚠️ La position reste
      **rendue et jamais rangée** (NFR-1b) ; aucun champ ne s'appelle `solde`.
- [ ] AC-5 — ⚡ **Une sortie s'apparie à SON ordre, par clef certaine.** La ligne porte en
      référence l'identifiant de transaction du schéma — celui que [[STORY-668]] range sur l'ordre
      exécuté (`referenceFournisseur`) — et, au libellé, l'identifiant de l'ordre. Un ordre
      `EXECUTE` sans ligne de sortie, et une sortie sans ordre (un paiement fait **hors de
      Prospera**, depuis l'application de la banque), sont deux **écarts nommés**.
- [ ] AC-6 — ⛔ **Aucun ordre n'est créé ni modifié par la relève.** L'invariant de [[STORY-269]]
      s'étend tel quel : un relevé est un référentiel de comparaison. L'issue d'un ordre se constate
      par `demanderDesNouvelles` ([[STORY-668]]), jamais parce qu'une ligne est apparue — par
      **absence d'injection**, comme pour les encaissements.
- [ ] AC-7 — ⛔ **Le bénéficiaire n'entre pas dans une ligne** : ni son nom, ni son adresse de
      paiement. Le libellé porte le motif et notre référence, comme pour une entrée.
- [ ] AC-8 — Recette **réelle** : le compte de Money Vibes relevé sur septembre 2026 rend ses cinq
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
