# STORY-696 : Les dossiers existants restent fermes aux collaborateurs tant que leur affectation n a pas ete republiee

Status: done

**Épic :** EPIC-012
**Service :** `dossier-service` (republication) + relying parties du contrat `dossier.*`
**Points :** 3 · **Sprint :** S20 · **Complexité :** medium · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** clôture de STORY-683 (2026-10-02) — D-683-3, constat de la revue de code (écarté du périmètre : migration de données = souci de prod, différé).

---

## Le fait

STORY-683 rend la portée par collaborateur **fail-closed** sur une affectation inconnue : un document du
read-model `dossiers_dossier` projeté **avant** 683 ne porte ni `responsableUserId` ni
`contributeursUserIds`, et aucun `TENANT_USER` n'y accède tant qu'un `dossier.updated` ne l'a pas
republié (vérifié en docker : `tmp/verif-docker-683/p3_etapes.py` étape 7, `p7_projection.py` P2).

En développement, les volumes repartent de zéro. **En production**, un dossier qui ne change jamais ne
republiera jamais son affectation : ses collaborateurs le perdront pour de bon dans `bilan-service`
(et dans chaque relying party qui adoptera la règle — [[STORY-694]], [[STORY-695]]).

## Critères d'acceptation

- [x] AC-1 — Un moyen **opérateur** (script ou route `PLATFORM_ADMIN`, jamais ouvert aux tenants) republie
      un `dossier.updated` à état absolu pour chaque dossier, par lots bornés, via l'outbox (même
      transaction, même contrat) — idempotent, rejouable.
- [x] AC-2 — Aucun changement de contrat : les consommateurs projettent sans modification.
- [x] AC-3 — Vérification docker : un read-model fabriqué « avant 683 » retrouve l'affectation après
      republication ; collaborateur affecté ⇒ 200.
- [x] AC-4 — Procédure de mise en production consignée (ordre : déployer 683 partout, puis republier).

## Décisions

- **D-696-0 — moyen opérateur = commande CLI, pas une route.** `npm run republier:dossiers -- [--lot=<n>] [--apres=<dossierId>]`, commande Nest *standalone* sur `MigrationCliModule` (patron `migrate:axes`) : aucune route HTTP, aucun jeton, rien d'ouvert aux tenants ; aucun consumer group rejoint, aucun relais démarré — les lignes d'outbox sont publiées par le relais de l'instance vivante.
- **D-696-1 — écriture technique sous verrou de version, ni `version` ni `updatedAt` touchés.** Chaque dossier est republié dans une transaction qui écrit `affectationRepublieeLe` sous le filtre `{ _id, version }` puis dépose le `dossier.updated` dans l'outbox. L'écriture réelle sérialise la republication avec les routes (conflit d'écriture) : jamais un état périmé publié après celui d'une route — les projections n'ont pas de garde de version. Une route qui a commité entre-temps ⇒ `modifiesEntreTemps` (sa propre publication fait foi). `version` (verrou optimiste, marche arrière STORY-356 limitée à `version: 1`) et `updatedAt` (tri « Activité » du portefeuille) restent ceux de la dernière modification métier — constat de la revue de code, la première version incrémentait `version`.
- **D-696-2 — aucune entrée de journal.** Le journal trace les décisions du cabinet ; la trace d'une republication est l'outbox, `affectationRepublieeLe` et le rapport d'exécution.
- **D-696-3 — erreur transitoire rejouée, jamais confondue avec une écriture concurrente.** 112, `TransientTransactionError`, `UnknownTransactionCommitResult` ⇒ rejeu (3 tentatives, même version : sûr, l'état publié est absolu). Après épuisement ou erreur non rejouable ⇒ dossier nommé dans `enEchec`, la suite du parc continue, le rapport est écrit, code de sortie 1.

## Procédure de mise en production (AC-4)

1. Déployer **STORY-683** partout : `dossier-service` (affectation publiée sur `dossier.*`), puis **chaque relying party** qui applique la portée (bilan 683, balance 694, microfinance/assurance/document 695). Un producteur antérieur à 683 republierait sans affectation.
2. Vérifier que le relais d'outbox de `dossier-service` tourne (`/api/v1/health` : `kafka: up`) et que les consommateurs `dossier.*` des relying parties ont rejoint leur groupe.
3. Lancer dans un conteneur `dossier-service` du déploiement (même image) : `npm run republier:dossiers -- --lot=100`. Lots plus petits pour lisser la charge de l'outbox.
4. Lire le rapport JSON (stdout) : `republies + modifiesEntreTemps.length + enEchec.length = dossiersExamines`. `modifiesEntreTemps` n'est pas un trou. **Code de sortie 1 ⇒ `enEchec` non vide** : relancer (idempotent). Interruption ⇒ reprendre avec `--apres=<dernierDossierId>` (journalisé à chaque lot).
5. Contrôler l'écoulement : plus aucune ligne `outbox_events` à l'état `PENDING` côté `dossier-service`, puis, côté relying party, plus aucun document `dossiers_dossier` sans `contributeursUserIds`.

## Notes

- Voir [[STORY-683]] (D-683-3).

## Progress Tracking

**Statut : `done` (2026-10-07).** prospera-dossier-service#39 rebase-mergée sur `dev` (`9df382b` feature, `f359baa` revue).

- **Dev** : `RepublicationDossiersService` (lots par `_id` croissant 1..1000, reprise `--apres`), `lireOptionsRepublication` (refus explicite de toute option invalide ou inconnue ; `--apres` sous forme canonique uniquement), `etatPublie` extrait de `DossiersService` (une seule liste blanche), champ `affectationRepublieeLe`.
- **Portes** : lint 0, build OK, couverture 99,47 / 94,86 / 98,6 / 99,58 (nouveaux fichiers 100 %), unitaires 1 785 / 1 786, e2e 351 verts. Le seul rouge est **préexistant sur `dev` et hors périmètre** : `registre-pays.coherence.spec.ts` confronte le miroir de dépôt `TG × DSF` (resté en `1.0`) au manifeste de `fiscal-service` (`1.2` depuis STORY-690) — à traiter en suite.
- **Mutations** : 7 sur la feature + 10 sur les correctifs de revue, toutes rouges par assertion (deux mutants non compilables ou équivalents refaits).
- **Vérif docker** (stack neuve, rejouée sur l'état final, `tmp/verif-docker-696/`) : **77 OK / 0 KO** — état « avant 683 » produit par de vrais messages Kafka sans affectation (U1 contributeur, U2 responsable non contributeur, U3 contributeur d'un autre dossier ⇒ 404) ; après republication : rapport exact, une ligne d'outbox par dossier toutes `SENT`, `version` et `updatedAt` inchangés, `affectationRepublieeLe` posé, aucun journal, aucun consumer group rejoint ; contributeur **et** responsable ⇒ 200, non affecté ⇒ 404 identique ; rejeu idempotent ; reprise `--apres` ; 5 options invalides ⇒ code 1, aucune écriture. **Course** (6 manches, republication pendant 8 PATCH d'affectation chacune) : **19 OK** — le read-model converge toujours sur l'état stocké ; la fenêtre de conflit n'a pas été atteinte (0 modifié entre-temps, 0 `409`) : la branche concurrente reste prouvée par les unitaires.
- **Revue de code** : 5 constats corrigés (`version` incrémentée, `updatedAt` réécrit, erreur transitoire comptée « modifiée entre-temps », rapport perdu en échec, taille de lot non gardée par le service) + 3 tests ajoutés ; ponytail : rien à retirer.
- **Revue de sécurité** : 0 constat.
- `docker compose` arrêté après vérification.
