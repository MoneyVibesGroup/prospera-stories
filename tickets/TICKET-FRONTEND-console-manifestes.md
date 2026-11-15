# TICKET FRONTEND — Les écrans de la console pour les manifestes (EPIC-143)

**De :** groupe B (moteur), STORY-939 — **pour :** groupe D (console, `frontend-admin-panel`, ids `AP-`)
**Date :** 2026-11-15
**Source :** EPIC-143, « Écrans » : le catalogue des modules commerciaux, la fiche d'un manifeste avec ses
dépendances et **leur raison**, les refus affichés par leur nom, la table de l'offre au menu.

## Ce qui existe côté serveur (fusionné sur `dev`)

| Besoin de l'écran | Où le lire |
|---|---|
| Le manifeste d'une version | `GET /api/v1/catalog/modules` (catalogue) : chaque version porte `manifeste` (STORY-934) ; contrat `platform-catalog-service/contrat/manifeste-module.schema.json` |
| Publier une version avec son manifeste | `POST /api/v1/catalog/admin/modules/:code/versions`, champ `manifeste` |
| Les refus nommés à la publication (422, avec `details`) | `MANIFESTE_INVALIDE`, `MANIFESTE_OBJET_HORS_MODULE`, `MANIFESTE_ARGENT_SANS_CONTROLE`, `AVEC_PERTE_INTERDIT_PLATEFORME`, `MANIFESTE_DEPENDANCE_MINEURE`, `MANIFESTE_CYCLE` (le chemin du cycle) |
| L'offre résolue : dépendances ajoutées et leur raison, modules non vendables | `GET /api/v1/offres/resolution?modules=a,b` (paiement, surface plateforme) ; réponse `{ modules: [{ code, ajoutePar: { code, raison } \| null }], inconnus }` |
| Le refus à la vente | `POST /api/v1/abonnements` : 422 `MODULE_NON_VENDABLE` avec `modules` |
| Les refus d'installation et de désinstallation | `MODULE_DEPENDANCE_MANQUANTE` (`manquants` avec raison), `MODULE_REQUIS_PAR` (`requisPar`) — résolveur pur, branché par EPIC-144 |

## Ce qui est demandé (à découper en AP-)

1. **Catalogue des modules commerciaux** : la liste des 46 modules et de leurs versions, chacune avec son statut et la
   présence de son manifeste.
2. **Fiche d'un manifeste** :
   - dépendances dures **et leur raison** ;
   - dépendances optionnelles (`enrichiPar`) ;
   - droits ;
   - faits publiés et consommés ;
   - vérifications (critère chiffré) ;
   - `retourArriere` ;
   - interrupteurs.
3. **Les refus par leur nom**, jamais un « erreur 422 » : le code et son `details` (le chemin d'un cycle, la
   dépendance ajoutée en mineure).
4. **Choisir l'offre** : la console appelle `GET /offres/resolution`, montre ce qui est ajouté et pourquoi, et nomme ce
   qui n'est pas vendable (FR-37 : « visible dans l'offre, ni installable ni vendable »). ⚡ La console et paiement
   résolvent **à l'identique** : la console ne recalcule pas, elle affiche la résolution.
5. **La table de l'offre au menu** (FR-37) : elle arrive avec EPIC-144 ; l'écran peut attendre.

## Règles

- Les types des réponses se génèrent depuis l'OpenAPI des services, jamais à la main (spine de la coque, AD-15).
- Maquette d'abord (`prototypes/prospera-prototype.html`), puis l'Integration Gate sur le vrai backend.
