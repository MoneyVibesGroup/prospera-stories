# STORY-681 : Un accusé consigné dans fiscal-service ne marque pas la liasse déposée — la propagation `ACCEPTEE` → `DEPOSE`

Status: ready-for-dev

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service` (producteur, **outbox à créer**) + `bilan-service` (consommateur) — contrat d'événement = **2 dépôts**
**Points :** 8 · **Sprint :** S20 · **Complexité :** high · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** clôture de STORY-538 (2026-09-25) — **décision user** : la propagation y était un hook inerte.

---

## Le fait, mesuré

STORY-538 porte le cycle `TRANSMISE → ACCEPTEE | REJETEE` dans `fiscal-service` ; `bilan-service` porte
depuis STORY-446 l'état `DEPOSE` (dépôt **constaté**, `depots[]`, `liasse.etat.change` en `DEPOSEE`,
relu par `dossier-service` pour le portefeuille). **Rien ne relie les deux** : un accusé consigné dans
fiscal-service laisse la liasse `VALIDE`, et le portefeuille dit « figée ».

⚡ La vérification docker de 538 l'a montré de bout en bout : la chaîne publie
`ACCUSE_NON_REPORTE_SUR_LA_LIASSE`, et la divergence ne se résorbe que par un `POST …/deposer` saisi à la
main dans bilan-service — le même fait, saisi deux fois.

⚠️ `fiscal-service` n'a **aucune outbox** : l'architecture (§ *Contrats d'événements produits*) la prévoit
(`fiscal.declaration.deposee`), aucune story ne l'a posée.

## Critères d'acceptation

- [ ] AC-1 — Outbox transactionnelle dans `fiscal-service` (patron STORY-099) : l'événement s'écrit dans
      la **même** écriture que la transition `ACCEPTEE`, jamais après le commit.
- [ ] AC-2 — Contrat : **état absolu** (le dépôt accepté : version, empreinte, date et numéro d'accusé,
      canal), `eventId`, `schemaVersion` — jamais un delta.
- [ ] AC-3 — `bilan-service` consomme de façon **idempotente** (`ProcessedEvent`) et pose `DEPOSE` avec
      les faits du dépôt ; ⚠️ le signataire exigé par STORY-446 n'est pas porté par fiscal-service :
      trancher (champ facultatif côté bilan, ou saisie à l'accusé) **avant** le code.
- [ ] AC-4 — Un rejet **ne** publie **pas** `DEPOSE` ; une liasse déjà `DEPOSE` ne se réécrit pas.
- [ ] AC-5 — La divergence publiée par `GET /depots` disparaît sans saisie manuelle — prouvé en docker.

## Notes

- Voir [[STORY-538]] (D-538-6, hook inerte), [[STORY-446]], [[STORY-453]].
- ⚠️ Démarrage dégradé (invariant 4) : voir [[STORY-684]] — un consommateur qui crashe au boot ne se
  relance pas tout seul dans `dossier-service`.

## Progress Tracking

**Statut : `ready-for-dev` (2026-09-25).** Créée par la clôture de STORY-538.
