# STORY-916 : `PATCH /dossiers/{id}` journalisé, et l'attestation de mandat lisible

Status: in-progress

**Complexité :** moyenne (une route d'écriture sur un patron existant, un filtre de lecture)

**Ticket :** `tickets/TICKET-BACKEND-fiche-dossier-trois-surfaces.md` (ouvert par FE-061), surfaces 1 et 3
**Service :** `dossier-service`
**Plage :** groupe A, n° 12 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §2). Sans dépendance.
Fiche écrite **avant** de coder.

---

## Pourquoi

L'onglet Identité de la fiche du dossier (FE-061) est livré en lecture seule : `dossier-service` n'a aucune route qui
modifie l'identité d'un dossier. Et l'attestation de mandat (D2) est écrite comme une ligne de journal
`MANDAT_ATTESTE`, que le journal rend bien, mais noyée dans l'historique paginé : le bandeau « mandat attesté le …
par … » ne peut pas la demander seule.

## Ce que la story livre

1. **`PATCH /api/v1/dossiers/{id}`** — modifie l'identité : `raisonSociale`, `sigle`, `formeJuridique`,
   `nifSociete`, `rccm`, `numeroCnss`, `dateCreation`, `objetSocial`, `codeNaema`, `secteur`, `capitalSocial`,
   `adresse`, `email`, `telephone`, `dirigeants`, `actionnaires` (mêmes validations qu'à la création). `null` retire
   un champ facultatif. Le corps porte la **`version`** lue (verrou optimiste **au contrat**) : une version périmée
   rend **`409 CONFLIT_CONCURRENT`** — pas de `412`.
   - L'acte est journalisé : **`IDENTITE_MODIFIEE`**, avec les instantanés `avant`/`apres` des champs modifiables,
     l'auteur et l'heure serveur, dans la même transaction que l'écriture et l'événement `dossier.updated`.
   - Un corps qui ne change rien rend `200` sans entrée ni nouvelle version.
2. **`GET /api/v1/dossiers/{dossierId}/journal?type=MANDAT_ATTESTE`** — un filtre par type d'acte sur la route du
   journal (STORY-360) : la ligne d'attestation, avec sa date et son heure (`le`), son auteur **nommé**,
   `qualiteSignataire`, `reference`, le texte attesté et sa version.

## Décisions

- **D-916-1 — Réservé à `TENANT_ADMIN`.** Le `409 DOSSIER_NIF_DEJA_UTILISE` nomme le dossier en conflit : ouvert à
  un collaborateur, il nommerait un dossier hors de sa portée (avertissement de D14 dans le service). L'ouverture
  aux collaborateurs (D12) demandera un `409` muet pour eux : suite à tracer.
- **D-916-2 — Champs immuables : `typeEntite` (Q3), `pays` (D10, il porte le registre et le référentiel),
  `devise`.** Les axes (`systemeComptable`, `regimeFiscal`) se décident par `POST /axes` (STORY-303).
- **D-916-3 — L'attestation passe par le journal, pas par `DossierResponseDto`** (préférence du ticket) : c'est déjà
  une ligne de journal, avec l'auteur nommé à la lecture.
- **D-916-4 — Hors story :** `GET /dossiers/{id}/completude` (surface 2 du ticket), qui reste ouverte.

## Critères d'acceptation

- **AC-1** : `PATCH` modifie l'identité, incrémente `version`, et écrit une ligne `IDENTITE_MODIFIEE` (avant/après,
  auteur, heure).
- **AC-2** : version périmée ⇒ `409 CONFLIT_CONCURRENT`, rien n'est écrit.
- **AC-3** : dossier archivé ⇒ `409 DOSSIER_ARCHIVE` ; hors portée ⇒ `404` ; `TENANT_USER` ⇒ `403`.
- **AC-4** : un NIF déjà porté par un autre dossier du cabinet ⇒ `409 DOSSIER_NIF_DEJA_UTILISE`.
- **AC-5** : `raisonSociale` ou `formeJuridique` à `null` ⇒ `400` ; une forme qui exige un dirigeant sans dirigeant ⇒
  `400 DIRIGEANT_REQUIS`.
- **AC-6** : la recherche du portefeuille suit le nouveau nom et le nouveau sigle (`rechercheNormalisee`).
- **AC-7** : `?type=MANDAT_ATTESTE` rend la seule ligne d'attestation ; un type inconnu ⇒ `400`.

## Definition of Done

- [ ] Unitaires et e2e (Node 24, étage `verification`), lint, `tsc` verts.
- [ ] Pile réelle : `PATCH` puis journal relus sur MongoDB 8.0 ; version périmée ⇒ 409.
- [ ] PR code et docs fusionnées ; ticket mis à jour (surfaces 1 et 3 fermées, 2 ouverte).
