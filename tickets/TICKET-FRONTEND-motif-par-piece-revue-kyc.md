# TICKET frontend : la console perd sans bruit le motif saisi pièce par pièce dans la revue KYC

**Type :** perte de donnée silencieuse. L'opérateur croit avoir expliqué un rejet ; le cabinet ne le lit jamais.
**Dépôt :** `frontend-admin-panel` (console `:3110`). **Tenu par :** groupe D (`PLAN-4-SESSIONS-2026-11-14.md` §2).
**Découvert par :** STORY-176 (BFF #32, console #29), 2026-11-14.
**Ouvert par :** groupe A, 2026-11-15 (`PLAN-4-SESSIONS-2026-11-14.md` §3.2).
**Devient :** **AP-38** (lot de D, §6, n° 12), que D inscrit à son tracker (`frontend-sprint-status.yaml`).
**Priorité :** Should. Rien ne casse, mais l'information que l'opérateur a saisie n'arrive pas.
**Statut :** ouvert.

---

## Le problème

Dans la revue KYC, l'opérateur marque chaque pièce (`ok` ou rejet) et peut saisir **un motif par pièce**. Or, depuis
STORY-128, `kyc-service` n'a **aucun champ** pour ce motif : la marque d'une pièce
(`POST /admin/orgs/:orgId/kyc/documents/:documentId/approve|reject`, via le BFF depuis STORY-176) part **sans corps**.
Le motif ne vit que sur le **dossier** : `POST /admin/orgs/:orgId/kyc/reject`, champ `reason`, obligatoire, au plus
**1 000** caractères (`kyc-service`, `src/modules/kyc/dto/reject-kyc.dto.ts`). C'est ce motif qui est persisté
(`rejectionReason`), inscrit au journal du dossier et envoyé au cabinet dans l'e-mail de rejet.

Jusqu'à STORY-176, la console envoyait le motif par pièce dans le corps, où l'amont l'ignorait, et un test affirmait
qu'il « voyageait ». STORY-176 a retiré le corps et inversé le test. Depuis, le motif par pièce **reste local à
l'écran** (`src/features/kyc/api/kyc-client.ts`, commentaire de `poserMarques`) : il est saisi, puis perdu.

## Ce qui est attendu (choix de A, à contester par D ou par le PO)

**Aucun changement de backend.** La console **reporte** les motifs par pièce dans le motif du dossier, qui existe déjà
et arrive au cabinet :

1. Quand l'opérateur rejette le dossier, ou le renvoie pour correction, le motif envoyé (`reason`) est **composé** de
   son motif général, puis d'une ligne par pièce rejetée qui porte un motif, sous la forme
   `— <libellé de la pièce> : <motif>`. L'opérateur **voit** ce texte composé avant d'envoyer : aucun ajout caché.
2. Si le texte composé dépasse **1 000** caractères, la console le dit et refuse l'envoi **avant** l'appel. Elle ne
   tronque rien.
3. Approuver un dossier ne garde aucun motif par pièce, puisqu'une approbation n'a pas de motif. Si une pièce marquée
   en rejet porte un motif, la console le signale avant l'approbation.
4. Le libellé du champ par pièce dit ce qu'il devient : « repris dans le motif du dossier ».
5. Tests :
   - le motif composé est exactement celui envoyé au BFF ;
   - la borne de 1 000 caractères est respectée ;
   - une pièce sans motif n'ajoute pas de ligne.

   Plus un e2e : le motif d'une pièce rejetée se relit dans le journal du dossier (`GET /kyc-admin/:orgId`).

**Pourquoi pas un champ par pièce dans `kyc-service`.** STORY-128 a voulu que le motif vive sur le dossier : c'est
lui que lit l'e-mail au cabinet, et c'est lui que porte le journal. Un champ par pièce toucherait trois dépôts
(`kyc-service`, le BFF, la console) pour une information que le motif du dossier porte déjà. Si le PO veut un jour un
motif **par pièce** visible du cabinet (dans son espace, pièce par pièce), ce sera une story de A dans `kyc-service`,
et ce ticket ne la bloque pas.

## Réponse attendue

Dans le journal de D : `← A (date) : AP-38, PR #…`. A passe alors sa demande à « servie ».
