# STORY-573 : Carnet de contacts : identifiant normalisé comme clé, dédoublonnage, destinataire polymorphe

Status: ready-for-dev

**Épic :** EPIC-054 — Socle `notification-service`, carnet de contacts et cloisonnement 🏁
**Service :** `notification-service` (nouveau)
**Points :** 5 · **Sprint :** S41
**Prérequis :** **STORY-571** (bases) · **STORY-572** (gate et cloisonnement)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-11, AD-12, AR-10.

---

## Le fait

Un numéro béninois normalisé en `+228` par une organisation togolaise multi-pays produit **soit deux
fiches pour une personne, soit une fusion à tort — et rien ne le signale**. C'est l'échec silencieux
que cette story ferme.

⚡ **La forme normalisée est la clé et elle est persistée ; la forme brute saisie est conservée à
côté.** Une mauvaise normalisation devient alors **diagnosticable et corrigeable** au lieu d'être
invisible.

⛔ **Aucun contact miroir pour un utilisateur Prospera.** Le destinataire est **polymorphe** :
`Contact` (carnet, canaux externes) ou `Utilisateur` (read-model d'identité, canal in-app
**uniquement**). En créer un « par uniformité » le ferait tomber sous la purge des 3 ans et sous le
désabonnement, et constituerait une **seconde source de vérité** de l'identité, qui appartient à
`auth-service`.

## Critères d'acceptation

- [ ] AC-1 — Un `Contact` porte le nom d'usage, un ou plusieurs identifiants de canal, la langue
      préférée et le consentement par nature de message. **Rien d'autre.**
- [ ] AC-2 — ⛔ **Aucune donnée métier ne peut entrer** : montant dû, solde, score, statut de dossier
      transitent comme **variables de message**. Un test de schéma refuse tout champ libre ou
      dictionnaire ouvert qui pourrait en recevoir — sans quoi le carnet dérive en second CRM.
- [ ] AC-3 — Normalisation en **fonction pure du domaine** : format international pour le téléphone,
      minuscules pour l'e-mail. L'indicatif par défaut vient du **pays de l'organisation** dans le
      read-model `identity.org`, et il est **surchargeable à l'import**.
- [ ] AC-4 — ⚡ **Les deux formes sont stockées** : `identifiantNormalise` (la clé, portant l'index
      unique `(orgId, canal, identifiantNormalise)`) et `identifiantBrut`. Le compte rendu d'import
      (FR-N08) montre **les deux, avant persistance**, avec créations, rapprochements, lignes
      rejetées et motif.
- [ ] AC-5 — Le dédoublonnage **s'arrête à la frontière de l'organisation** : deux organisations
      détenant le même numéro détiennent deux contacts distincts, sans lien ni visibilité mutuelle —
      **y compris à la recherche par identifiant** (FR-N07). Prouvé avec deux organisations réelles.
- [ ] AC-6 — L'inscription par un module est **idempotente** (clé = identifiant normalisé) et
      **n'écrase jamais un consentement**. Un contact porte la trace des modules inscripteurs, et la
      lecture filtre sur les modules souscrits par l'organisation.
- [ ] AC-7 — ⛔ AD-12 : **aucun chemin de code ne crée un `Contact` à partir d'un utilisateur**, et le
      carnet n'est **jamais** alimenté par `identity.*`. Un test de mutation le prouve.
- [ ] AC-8 — Un identifiant non normalisable est un **refus nommé** `IDENTIFIANT_NON_NORMALISABLE`,
      jamais un enregistrement silencieux de la forme brute.

## Notes

🏁 Clôt EPIC-054.
