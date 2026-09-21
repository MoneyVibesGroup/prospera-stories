# STORY-668 : L'ordre de paiement — il part du compte de l'organisation, validé par un second rôle

Status: in-progress

**Épic :** EPIC-036 — Fournisseurs de paiement interchangeables et simultanés
**Service :** `paiement-service`
**Points :** 8 · **Sprint :** ⚠️ **NON SLOTTÉE** — `PLAN-PI-SPI-CAS-D-USAGE-2026-09-15`, phase B
**Prérequis :** **STORY-666** (le raccordement par organisation), **STORY-661** (l'adresse confirmée
par l'annuaire), **STORY-669** (relever les paiements) — et ⛔ **l'amendement du PRD**
**Origine :** le parcours « Règlement fournisseurs » du catalogue PI-SPI, demandé par le PO le
2026-09-15 pour les distributeurs.

✅ **DÉBLOQUÉE PAR LE PO LE 2026-09-21.** Elle était bloquée par une décision, pas par du code : le PRD
ne couvrait que l'encaissement, et ordonner un paiement sortant touche NFR-1. L'amendement est
**validé et appliqué** (`prds/prd-paiement-service-2026-08-02/amendement-2026-09-21-ordres-de-paiement.md`,
FR-P65→P69, NFR-1d, R8). Trois décisions : (1) on code, **en bac à sable** — la confirmation
juridique reste un préalable de la PRODUCTION ; (2) les deux rôles réemploient la paire de droits de
FR-P60 ; (3) des envois réels de **100 XOF au plus** sont autorisés pour mesurer le contrat.

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
### ⚡⚡ Puis mesuré AVEC de l'argent du bac à sable (50 et 10 XOF, autorisés par le PO)

- `confirmation: false` → `200 {txId, end2endId, statut: "ENVOYE", payeNom, payePays}` ; quatre
  secondes plus tard la liste le montre `IRREVOCABLE` (`categorie: "733"`), et la position du compte
  a baissé **du montant exact** (1 000 001 025 → 1 000 000 975).
- `confirmation: true` → `statut: "INITIE"`, **aucun franc ne bouge** ; le second temps du schéma
  est `PUT /paiements-envoyes/{txId}/confirmations`. **Non utilisé** : nos deux rôles sont les
  nôtres, et l'ordre part en un temps, à la validation.
- ⛔⛔ **LE MÊME `txId` REPOSTÉ REND `HTTP 200`** — avec `statut: "REJETE"`, `statutRaison: "DU03"`
  et un **nouvel** `end2endId`. Le schéma protège donc lui-même du double envoi. Mais **deux
  lectures naïves sont fausses** : qui lit le code HTTP croit l'ordre parti ; qui lit ce rejet le
  croit **échoué**, alors qu'il est exécuté.
- ⛔⛔ **`GET /paiements-envoyes/{txId}` REND LA DERNIÈRE TENTATIVE** (`REJETE/DU03`), **pas celle
  qui est partie.** Seule la liste `GET /paiements-envoyes?txId=` montre les deux. **L'issue se lit
  dans la liste, et `IRREVOCABLE` gagne sur tout** ; `DU03` n'est jamais une issue, c'est l'écho
  d'un rejeu.

⚡ **C'est cette mesure qui a durci FR-P68.** Le texte validé disait « un échec laisse l'ordre
rejouable par une nouvelle validation ». Rejouer sous un **nouvel** identifiant ferait partir
l'argent deux fois ; rejouer sous le **même** rend un `DU03` qu'on lirait comme un échec. Un ordre
rejeté est donc **terminal** : on en prépare un autre, à deux.

## Critères d'acceptation

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
- [ ] AC-5 — L'issue (exécuté, rejeté) vient **du fournisseur**, jamais d'une supposition : elle se
      lit dans la **liste** par identifiant, où l'exécution **gagne sur tout** et où un rejet pour
      doublon n'est **jamais** une issue. ⛔ **Un ordre rejeté est terminal.** Une transmission dont
      l'issue est inconnue (panne au milieu) **se consulte** ; si le schéma ne connaît rien, l'ordre
      redevient **à valider** — par un humain, jamais par une reprise automatique.
- [ ] AC-6 — ⛔ **Aucune imputation.** Un ordre n'éteint aucune créance de l'organisation et ne crée
      aucun encaissement : il sort du périmètre d'AD-3/AD-4. Il se trace (deux auteurs), il ne se
      supprime pas, il s'annule tant qu'il n'est pas parti.
- [ ] AC-7 — La garde NFR-1b passe **sans exception ajoutée** : ni `payout`, ni `reversement`, ni
      `solde`. Si elle rougit, c'est le code qui se range.
- [ ] AC-8 — Recette **réelle** : un ordre préparé par un rôle, validé par un autre, exécuté sur le
      bac à sable, et **relevé** ensuite parmi les paiements envoyés.

## Tranché par le PO le 2026-09-21

1. ✅ **Le périmètre est ouvert, et on code maintenant** — bac à sable seulement ; la confirmation
   juridique est un préalable de la **production**, écrit au §10 du PRD.
2. ✅ **Les droits de FR-P60 sont réemployés** : `paiement:demande:emettre` prépare (et annule),
   `paiement:encaissement:valider` valide (et consulte). ⚠️ Coût nommé : le nom du droit ne dit plus
   exactement ce qu'il ouvre — à reprendre quand le catalogue saura créer un droit de tenant.
3. ✅ **Envois réels autorisés : 100 XOF au plus**, vers l'adresse du payeur de test.
4. **IBAN / numéro de compte** : hors de cet amendement (le bac à sable exige un SHID).

## Notes

- Voir la proposition d'amendement (même dossier que le PRD), [[STORY-666]], [[STORY-661]],
  [[STORY-669]], [[STORY-242]] (NFR-1b et sa garde), [[STORY-290]] (la séparation des pouvoirs, et
  la transition dans le filtre).
