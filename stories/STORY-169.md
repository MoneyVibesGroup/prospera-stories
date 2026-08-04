> # ⛔ STORY REMPLACÉE — NE PAS IMPLÉMENTER
>
> **Remplacée le 2026-08-03** (décision PO) par le re-découpage du Module 2 : **STORY-290**.
>
> Cette story appartenait au découpage `EPIC-004 (rescopé)` (18 stories, 104 pts). Le découpage en
> vigueur est **EPIC-035 → EPIC-042 / STORY-237 → STORY-290** (54 stories, 196 pts), sprints 31→38.
> Le contenu ci-dessous **reste une bonne source de contexte métier** — c'est pour cela qu'il n'est pas
> supprimé — mais **son périmètre, son estimation et son sprint ne font plus foi**.
>
> 📄 Découpage en vigueur : [`epics-paiement-2026-08-03.md`](../epics-paiement-2026-08-03.md)
> 📐 Architecture : [`ARCHITECTURE-SPINE.md`](../architecture/architecture-paiement-service-2026-08-03/ARCHITECTURE-SPINE.md) (AD-1 → AD-18)
> 🗂️ Motif détaillé : `superseded_stories` dans [`sprint-status.yaml`](../sprint-status.yaml)

---

# STORY-169 : Créance saisie manuellement — le chaînon en attendant Facturation

**Epic :** EPIC-004 — `paiement-service` (PI-SPI & encaissement)
**Réf. PRD :** [`prds/prd-paiement-service-2026-08-02/prd.md`](../prds/prd-paiement-service-2026-08-02/prd.md) §6 FR-P13, FR-P13b · assumption **A2**
**Réf. plan :** `PLAN-DISTRIBUTEUR-PI-SPI-2026-08-02.md` §3 — **chemin A**, retenu par le PO
**Dépend de :** STORY-153 *(la créance projetée et la demande)*
**Débloque :** `DI-04` *(créances côté distributeur)*
**Priorité :** Must Have — **dans le bloc PI-SPI distributeur**
**Story Points :** 5
**Statut :** ⛔ **superseded (2026-08-03)** — remplacée par STORY-290
**Assigné à :** null
**Créée le :** 2026-08-02
**Sprint :** ~~aucun~~ — retirée des sprints le 2026-08-03 (elle occupait le S31→S34)
**Service :** `paiement-service` (`:3005`)

---

## Pourquoi elle existe

PI-SPI **encaisse** une créance ; il ne la crée pas. L'appelant naturel est **Facturation (#17)** —
qui n'existe pas, n'a pas de PRD, et est en position 17 sur 29.

Sans elle, l'écran distributeur « déclarer un paiement en espèces » porte sur **un objet qui n'existe
pas**.

**Chemin A retenu** (décision PO) : la créance est **saisie à la main** en attendant Facturation. Ce
n'est pas une dette technique — c'est la réalité de distributeurs qui facturent sur papier et suivent
sur cahier aujourd'hui. Le contrat `FR-P13` est **déjà conçu pour cela** : il n'exige rien de Facturation.

---

## Périmètre pressenti

- Création d'une créance projetée par un utilisateur habilité : référence, montant, devise, échéance,
  libellé, payeur
- La **référence reste libre** — c'est souvent un numéro de facture papier
- Liste, recherche, clôture manuelle
- ⚡ Une créance saisie porte **la trace de sa saisie manuelle** : quand Facturation arrivera, il faudra
  savoir lesquelles ont été créées à la main pour ne pas les dupliquer
- ⚡ **Aucune reprise à prévoir** : le contrat de créance projetée est le même, quelle que soit
  l'origine. Facturation deviendra **un second émetteur**, pas un remplacement

---

## Bloqueur

| Ce qui bloque | Levée |
|---|---|
| Bloc **PI-SPI distributeur** différé (décision PO) | Ouverture du bloc |
| `STORY-153` non livrée | Livraison de l'incrément 1 |

---

## Progress Tracking

*(story différée — à détailler à l'ouverture du bloc)*
