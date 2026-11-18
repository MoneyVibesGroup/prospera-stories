# STORY-976 : `paiement` reçoit `facturation.facture.emise@1` et ouvre la Créance

Status: in-progress

**Complexité :** moyenne (un consommateur neuf sur le socle supervisé ; aucune écriture neuve : la même
`OuvrirLaCreance` que la route ; la preuve est sur une pile)

**Épic :** EPIC-231 (la Créance, le crédit du tiers et l'amendement de `paiement`), d'`epics-distributeur-2026-11-13.md`
**Dépôt :** `MoneyVibesGroup/prospera-paiement-service`
**Plage :** groupe B, n° 6 du lot 4 (`coordination/PLAN-4-SESSIONS-LOT-4-2026-11-18.md` §3, ligne 976).
**Dépend de :** STORY-963 (`OuvrirLaCreance`, la route, paiement #122), STORY-965 (l'état publié, paiement #123,
`ad35786`) ; D-1059 (`ventes` publie le fait, `dev` `1c1e944` → `bd8d211`) ; D-1061 (le numéro n'a plus de motif
`FAC-`, `dev` `68b293c`).
**Demande de :** D (« → B (2026-11-17) : consommer `facturation.facture.emise@1` dans `paiement` », journal de D).

**Sources lues :** fiche STORY-965 (D-965-9), STORY-963 (D-963-1 → 12, « → D » : comment ouvrir une Créance) ;
journal de D (STORY-1059 : charge du fait, « → B » ; STORY-1061 : `numero` sans motif `FAC-`) ; schéma
`contrat/schemas/facturation.facture.emise.json` de `prospera-ventes-service` (`origin/dev`) ; registre
`prospera-plateforme/contrats/distributeur/catalogue-faits.json` (`origin/dev` : `facturation.facture.emise@1`, publié
par `facturation`, consommé par `paiement`, entre autres) ; manifeste `manifestes/paiement.manifest.ts` (`consomme`
le déclare déjà) ; code de `paiement` sur `origin/dev` (`ad35786`) : `OuvrirLaCreance`, la route, le socle des
consommateurs (`ConsommateurReadModel`, `SupervisionConsommateur`), le pont de la consommation (STORY-647) ; pièges du
journal de B (D-957-6, consommateurs neufs, §1.9 des règles).

---

## Pourquoi

AD-7 : la facture ouvre sa Créance par son fait. D-1059 l'ouvre aujourd'hui par la route (`PUT
/creances/sources/FACTURE/{factureId}`), avec le jeton du membre qui émet : si `paiement` est arrêté, la facture
reste `A_OUVRIR` jusqu'à ce qu'un membre relance, et un redémarrage de `ventes` perd la relance en mémoire. Le fait,
lui, est dans l'outbox de `ventes` (durable) : le consommer ferme ce trou sans membre, sur la même clé. Les deux
chemins doivent ouvrir **la même** Créance, une fois.

## Ce qui doit être vrai à la fin (plan du lot 4, §3, ligne 976)

| Exigence | Fait |
|---|---|
| Même `OuvrirLaCreance` que la route de D-1059 | le consommateur appelle `OuvrirLaCreanceDeLaFacture`, qui appelle `OuvrirLaCreance` avec l'ouverture que la route construit pour le corps de `ventes` (D-976-1) |
| Idempotent par `(source, sourceId)` | la clé `(FACTURE, factureId)` ; un fait relivré ou rejoué depuis le début du topic retombe sur la Créance existante sans rien écrire (`RejeuSansEffet`, STORY-963) |
| Même résultat par le fait et par la route (D-965-9) | même document de Créance, même état publié (`OUVERTURE`, révision 1), quel que soit le premier chemin ; refus : la route rend 400/409, le fait est ignoré avec le même code (D-976-4) |
| Preuve Docker | pile `grp-b` (paiement + MongoDB en jeu de répliques + Kafka + Karapace) : un fait publié ⇒ Créance ouverte ; rejeu ⇒ aucune seconde Créance ; même résultat que la route |

## Décisions (prises par défaut, contestables)

- **D-976-1 : un cas d'usage mince, `OuvrirLaCreanceDeLaFacture`, entre le consommateur et `OuvrirLaCreance`.** Il
  construit l'ouverture exactement comme la route la construit pour le corps que `ventes` envoie (`{ tiersId,
  perimetre, montantOrigineMineur, devise, echeanceLe, libelle }`) : `orgId` = `organisationId`, `source` = `FACTURE`,
  `sourceId` = `factureId`, montant d'origine = `montantTtcMineur` (couple refait à la frontière, `montant()`),
  libellé = `numero`, `livraisonId` quand le fait le nomme (absent s'il porte `null`). Auteur `MODULE`
  `FAIT_DE_FACTURE` : le fait n'a pas de membre. Aucune écriture neuve : l'inventaire des écritures d'argent et des
  changeurs de Créance ne bouge pas.
- **D-976-2 : la lecture du fait juge sa FORME, le domaine juge la Créance.** `lireLaFactureEmise` (couverte, hors du
  `bootstrap`) vérifie l'enveloppe du distributeur (`eventId`, l'en-tête primant ; `schemaVersion` 1 ;
  `occurredAt` ; `organisationId` en ObjectId) et les types des champs lus. Les motifs (identifiants, périmètre, date
  civile, montant positif, devise, libellé) sont ceux du domaine, communs à la route. `numero` n'est pas validé sur
  `FAC-` (STORY-1061). Le registre Karapace n'est pas lu à la consommation : le producteur y enregistre son schéma
  (BACKWARD), le message est du JSON simple.
- **D-976-3 : aucune garde d'accès au module sur le chemin du fait.** `@RequiresPaiementAccess` juge un membre qui
  appelle une route (courriel vérifié, KYC, droit d'usage, lecture seule) ; un fait n'a pas d'appelant. Le refuser
  perdrait une dette, comme l'a dit le pont de la consommation (STORY-647, même socle). Écart assumé au « même
  résultat » : une organisation sans le module, que la route refuserait `403`, aurait sa Créance par le fait.
- **D-976-4 : un refus métier est ignoré et journalisé, jamais rejoué ; une panne remonte.** `CREANCE_INVALIDE`,
  `CREANCE_SOURCE_EN_CONFLIT`, `MONTANT_INVALIDE`, `SOURCE_DE_CREANCE_NON_SERVIE` refuseraient à l'identique à chaque
  passage : l'offset avance, le code est journalisé (`facture émise ignorée`). `ECRITURE_CONCURRENTE` (après les trois
  essais d'`OuvrirLaCreance`) et toute panne de base remontent au client Kafka, qui relivre ; la clé rend le rejeu
  sûr. Un montant divergent n'est pas un refus : c'est l'anomalie tracée d'AD-7, comme par la route.
- **D-976-5 : un groupe neuf, `paiement-factures`, depuis le début.** Variable facultative `KAFKA_FACTURES_GROUP_ID`
  (défaut `paiement-factures`). `fromBeginning` (socle) : les factures émises avant le premier démarrage ouvrent leur
  Créance ; celles que la route a déjà ouvertes retombent sur la clé sans rien écrire. Le socle crée le topic avant
  l'abonnement et rafraîchit les métadonnées en 10 s (§1.9) ; un consommateur neuf à chaque relance (STORY-957) ;
  `/health` compte le groupe (`kafka: down` tant qu'il n'a pas rejoint).
- **D-976-6 : la recette de la pile est versionnée** (`scripts/recette/976/` de `paiement`, comme D l'a fait pour 1059) :
  la pile `grp-b`, l'émetteur de jetons de recette (repris de `ventes`, `scripts/recette/1059/`), le pilote.
- **D-976-7 (information à D) : les motifs du schéma de `ventes` sont plus larges que ceux de la Créance.** Au
  registre : `tiersId` admet `:` et `.`, `factureId` peut commencer par `_` ou `-`, `livraisonId` admet `:` et
  128 caractères. `paiement` (route comme fait) exige `[A-Za-z0-9][A-Za-z0-9_-]{0,63}` : une telle facture est refusée
  `CREANCE_INVALIDE` par les deux chemins (même résultat). Sans effet aujourd'hui (UUID, `PDV-…`) ; à dire si `ventes`
  doit en émettre.

## Contrat touché (annoncé dans « ⚠ Contrats » du journal de B AVANT la fusion du code)

Aucune route, aucun champ, aucun topic publié ne change. **Consommation neuve** : `paiement` lit
`facturation.facture.emise` (groupe `paiement-factures`, depuis le début) et ouvre la Créance `(FACTURE, factureId)`.
Variable facultative neuve `KAFKA_FACTURES_GROUP_ID`. Le manifeste `paiement` la déclarait déjà (`consomme`) : non
amendé.

## Ce qui a été livré

_(à remplir à la fusion)_

## Preuves

_(à remplir)_

## Pour la suite

- `facturation.avoir.emis@1` et `facturation.facture.reprise@1` (manifeste `paiement`, `consomme`) : même patron, quand
  `ventes` les publiera.
