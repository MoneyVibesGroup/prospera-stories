# STORY-606 : L'organisation Money Vibes franchit son propre gate

Status: todo

**Épic :** EPIC-041 — Abonnements Prospera et entitlements par événement
**Service :** `paiement-service`
**Points :** 3 · **Sprint :** S34
**Prérequis :** **STORY-289** (Money Vibes est une organisation), **STORY-239** (read-models du gate)
**Origine :** revue d'architecture du 2026-09-06 · AD-16, FR-P43, NFR-1c.

---

## Le récit

En tant que **Money Vibes**, je veux pouvoir émettre une demande de paiement sur mon propre compte
d'encaissement, afin d'encaisser l'abonnement d'un cabinet.

## Le fait

⛔ **Money Vibes est une organisation, et elle est refusée par son propre gate.** `PaiementAccessGuard`
exige, dans l'ordre : adresse vérifiée, KYC `APPROVED`, entitlement paiement `ACTIVE`. Les deux
derniers sont lus dans des read-models alimentés par `kyc.status.changed` et `entitlement.changed`.
**Aucun de ces événements n'a jamais parlé de l'organisation de plateforme.** Et le gate est
*fail-closed* : un read-model absent refuse. Le cas C est donc mécaniquement impossible aujourd'hui,
alors que `STORY-289` avait retiré le dernier obstacle **de conception**.

⚡ **Le mur n'est pas du côté du payeur.** Le cabinet qui paie n'a besoin d'**aucun droit** : la page
du lien est publique et non authentifiée. Trois stories s'étaient déjà trompées de mur sur ce
service ; celle-ci nomme le bon.

⛔ **La solution n'est PAS une exception dans le guard.** Une branche « si c'est Money Vibes, laisse
passer » ferait du seul contrôle d'accès au chemin de l'argent un contrôle à trou nommé — et le trou
porterait une variable d'environnement. Money Vibes doit franchir le gate **comme tout le monde**,
c'est-à-dire **avoir un KYC approuvé et un droit d'usage actif**, projetés par les mêmes événements.

⚠️ **Amorçage, pas dérogation.** Si l'IdP et `kyc-service` ne savent pas encore produire ces
événements pour l'organisation de plateforme, la story livre un **chemin d'amorçage rejouable et
tracé**, jamais une écriture manuelle en base.

## Critères d'acceptation

- [ ] AC-1 — Money Vibes possède un `OrgKycStatut` à `APPROVED` et un `OrgPaiementEntitlement` à
      `ACTIVE`, **écrits par les consommateurs d'événements existants**, pas par un script à part.
- [ ] AC-2 — ⛔ **Aucune branche conditionnelle sur l'identité de Money Vibes n'existe dans le
      gate.** Garde de balayage : le nom de la variable d'environnement de l'organisation de
      plateforme n'apparaît dans aucun fichier de `src/modules/read-models/guards`.
- [ ] AC-3 — Le chemin d'amorçage est **rejouable** : le relancer deux fois ne produit ni doublon ni
      régression d'état.
- [ ] AC-4 — Un test de bout en bout montre Money Vibes **émettant une demande** sur son propre
      compte d'encaissement, et le même test montre qu'une organisation sans droit est refusée.
- [ ] AC-5 — ⚡ Un test montre qu'un **payeur non authentifié** consulte et paie la page du lien sans
      qu'aucun droit ne lui soit demandé. C'est ce qui fige la lecture correcte du gate.
- [ ] AC-6 — La création du compte d'encaissement de Money Vibes est **tracée avec la même origine de
      saisie** que celle d'un client (`ADMINISTRATION_PROSPERA`), sans champ nouveau.

## Notes

⚠️ **Dépendance possible hors service.** Si `kyc-service` refuse d'approuver une organisation qui
n'a déposé aucun document, l'amorçage devient une story chez lui. À vérifier **avant** de tirer
celle-ci — c'est le seul risque de la fiche.

⚡ Cette story rend `STORY-277` réellement exécutable ; sans elle, l'abonnement s'écrit mais ne
s'encaisse pas.
