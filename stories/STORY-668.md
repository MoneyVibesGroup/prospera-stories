# STORY-668 : L'ordre de paiement — il part du compte de l'organisation, validé par un second rôle

Status: blocked

**Épic :** EPIC-036 — Fournisseurs de paiement interchangeables et simultanés
**Service :** `paiement-service`
**Points :** 8 · **Sprint :** ⚠️ **NON SLOTTÉE** — `PLAN-PI-SPI-CAS-D-USAGE-2026-09-15`, phase B
**Prérequis :** **STORY-666** (le raccordement par organisation), **STORY-661** (l'adresse confirmée
par l'annuaire), **STORY-669** (relever les paiements) — et ⛔ **l'amendement du PRD**
**Origine :** le parcours « Règlement fournisseurs » du catalogue PI-SPI, demandé par le PO le
2026-09-15 pour les distributeurs.

⛔⛔ **CETTE STORY EST BLOQUÉE PAR UNE DÉCISION, PAS PAR DU CODE.** Le PRD ne couvre que
l'encaissement ; ordonner un paiement sortant touche NFR-1, c'est-à-dire le régime juridique. La
proposition d'amendement est écrite —
`prds/prd-paiement-service-2026-08-02/amendement-ordres-de-paiement-PROPOSITION.md` — et **elle
attend le PO**. Rien n'a été codé, et rien ne le sera avant.

⚠️ **Le titre du plan disait « Régler un fournisseur ».** Le mot « règlement » est proscrit par la
garde du port (convention de la spine : le PRD ne le dit jamais), et `payout`/`reversement` le sont
par la garde NFR-1b. La story parle donc d'**ordre de paiement** : ce service ne reverse rien — il
n'a rien reçu.

---

## Le fait — mesuré sur le bac à sable le 2026-09-21, sans envoyer un franc

- `POST /paiements-envoyes` (portée `paiement.write`) existe. Champs exigés, dans l'ordre où l'API
  les réclame (elle ne nomme qu'une erreur par réponse) : `txId`, `payeurAlias`, `payeAlias`,
  `montant`, `confirmation`.
- ⚡ **Le bénéficiaire est un SHID** (« must be a valid SHID ») : une adresse de paiement du schéma,
  celle-là même que [[STORY-661]] sait faire confirmer par l'annuaire. **Ni IBAN, ni numéro de
  compte** dans cette version.
- ⚡ **`confirmation` est obligatoire** : le schéma connaît un envoi en deux temps. À mesurer : ce
  que rend `confirmation: true`, et si le second temps est un appel distinct.
- `GET /paiements-envoyes` existe (vide) : un ordre exécuté se **relèvera** comme un paiement reçu
  ([[STORY-669]]), et c'est par là que son issue se constatera si aucun webhook ne la porte.
- ⚠️ **La sonde s'est arrêtée à la validation du SHID**, avec l'UUID nul pour bénéficiaire. Ce que
  rend un envoi accepté, ses événements de webhook (`PAIEMENT_ENVOYE` ?) et son délai restent à
  mesurer — avec de l'argent du bac à sable, donc avec l'accord du PO.

## Critères d'acceptation — PROPOSÉS, sous réserve de l'amendement

- [ ] AC-1 — Une organisation **prépare** un ordre : bénéficiaire (adresse de paiement **confirmée
      par l'annuaire** avant d'être rangée), montant, motif, compte payeur **dont elle est
      titulaire**, vérifié, chez un fournisseur qui **sait** ordonner. Un ordre préparé ne part pas.
- [ ] AC-2 — ⛔⛔ **Un SECOND rôle valide, et jamais la même personne.** Deux droits distincts ; et
      quels que soient ses droits, l'auteur de la préparation ne peut pas valider **son** ordre. Le
      contrôle est dans le filtre de l'écriture, pas dans un `if` qui le précède.
- [ ] AC-3 — ⛔⛔ **Un ordre part UNE fois.** `txId` = l'identifiant de l'ordre ; la transition
      « validé → transmis » est **dans le filtre** ; aucun renvoi automatique, aucune reprise après
      panne qui ne passe par une nouvelle validation. Un ordre envoyé deux fois est de l'argent parti
      deux fois — et FR-P49 interdit à ce service de le faire revenir.
- [ ] AC-4 — L'ordre part **sous le raccordement de l'organisation**, depuis **son** compte. Aucun
      repli. ⛔ **Par absence d'injection** : le chemin qui transmet ne peut pas lire la
      configuration de la plateforme.
- [ ] AC-5 — L'issue (exécuté, rejeté) vient **du fournisseur** — notification signée ou relève —
      jamais d'une valeur de retour. Un ordre rejeté redevient validable ; un ordre exécuté est
      terminal.
- [ ] AC-6 — ⛔ **Aucune imputation.** Un ordre n'éteint aucune créance de l'organisation et ne crée
      aucun encaissement : il sort du périmètre d'AD-3/AD-4. Il se trace (deux auteurs), il ne se
      supprime pas, il s'annule tant qu'il n'est pas parti.
- [ ] AC-7 — La garde NFR-1b passe **sans exception ajoutée** : ni `payout`, ni `reversement`, ni
      `solde`. Si elle rougit, c'est le code qui se range.
- [ ] AC-8 — Recette **réelle** : un ordre préparé par un rôle, validé par un autre, exécuté sur le
      bac à sable, et **relevé** ensuite parmi les paiements envoyés.

## ⛔ Ce que le PO doit trancher avant la première ligne de code

1. **Ouvre-t-on ce périmètre**, et code-t-on **avant** ou **après** la confirmation juridique ?
   (§10 du PRD portait déjà « à faire confirmer juridiquement » pour la seule détention de fonds.)
2. **Les droits des deux rôles.** Le catalogue ne sait pas attribuer un **nouveau** droit de tenant
   aujourd'hui : deux droits neufs = deux routes que personne ne peut appeler ; réemployer la paire
   de FR-P60 (`paiement:demande:emettre` / `paiement:encaissement:valider`) est appelable tout de
   suite, au prix de noms qui ne disent plus exactement ce qu'ils ouvrent.
3. **Une recette avec de l'argent du bac à sable** : envoyer quelques francs du compte de Money
   Vibes vers l'adresse du payeur de test — la seule façon de mesurer ce que rend un envoi accepté.
4. **IBAN / numéro de compte** : hors de cet amendement (le bac à sable exige un SHID).

## Notes

- Voir la proposition d'amendement (même dossier que le PRD), [[STORY-666]], [[STORY-661]],
  [[STORY-669]], [[STORY-242]] (NFR-1b et sa garde), [[STORY-290]] (la séparation des pouvoirs, et
  la transition dans le filtre).
