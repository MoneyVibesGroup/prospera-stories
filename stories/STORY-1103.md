# STORY-1103 : Renvoyer un dossier KYC pour correction — le cabinet est prévenu et lit le motif de chaque pièce

Status: ready-for-dev — **créée le 2026-11-19**, à la validation de la maquette d'AP-38. L'utilisateur a suivi la
recommandation de A : « suis ta recommandation ». Non slottée, à placer au prochain plan.

**Services :** `kyc-service` (principal) · le BFF `admin-panel-service` (relais) · le service qui envoie déjà les
e-mails KYC au cabinet (consommateur de `kyc.status.changed`, STORY-021 ; à confirmer au premier geste, D-1103-1)
**Points :** 5 · **Écran :** AP-62 (console) · **Maquette :** validée avec AP-38, Artifact de la console, version 9
(`docs/mockups/ap-02-organisations.html`, frontend-admin-panel #32)

---

## Pourquoi

Lu dans `kyc-service` (`origin/dev`, 2026-11-19), le renvoi d'une pièce pour correction est muet :

- `POST /admin/orgs/:orgId/kyc/documents/:documentId/reject` part **sans corps**. La pièce passe `REJECTED`, le
  dossier reste `UNDER_REVIEW`, et **aucun événement** n'est émis (`kyc-admin.service.ts`, `reviewDocument`).
- Le cabinet n'est donc **pas prévenu**. Il ne voit « rejetée » que s'il relit lui-même son statut
  (`GET /kyc/status`, champ `reviewStatus` de la pièce), et il ne lit **aucun motif**.
- Le seul motif qui arrive au cabinet est celui du rejet **global** (`POST …/kyc/reject`, `reason` ≤ 1 000), qui
  l'oblige à tout reprendre, pièces validées comprises.

Dans la console, l'opérateur tape un motif par pièce que personne ne lira. AP-38 corrige le cas du rejet global sans
backend. Le renvoi, lui, a besoin de cette story.

## Ce qui est attendu

1. **Un motif facultatif sur la marque d'une pièce.** La route de rejet d'une pièce accepte `{ motif?: string }` :
   - texte rogné, 500 caractères au plus, vide ⇒ absent ;
   - persisté sur la pièce ;
   - effacé si la pièce est ensuite approuvée ;
   - conservé dans l'historique quand une nouvelle version de la pièce la remplace.

   Il est exposé :
   - côté cabinet, dans `KycDocumentResponseDto` (`motifRenvoi`) ;
   - côté console, dans le détail admin du dossier.
2. **Un acte de renvoi au dossier**, distinct du rejet global.
   - **Route :** `POST /admin/orgs/:orgId/kyc/request-correction`. Permission `kyc:reject`, `If-Match` obligatoire,
     comme `reject`.
   - **Corps :** `{ message?: string }`, 1 000 caractères au plus. C'est « un mot pour le cabinet », facultatif.
   - **Préconditions :**
     - dossier `UNDER_REVIEW` ;
     - au moins une pièce `REJECTED`, sinon 409 `RENVOI_SANS_PIECE_A_CORRIGER` ;
     - conflit de décision traité comme pour `reject` (STORY-182).
   - **Effet recommandé :** le dossier passe en `PENDING_DOCUMENTS`. Il sort ainsi de la file KYC, puisqu'il attend
     le cabinet, et les pièces validées restent validées. Le re-dépôt des pièces renvoyées le repasse en
     `UNDER_REVIEW` par le chemin de soumission existant (`kyc-status.service`). À vérifier en premier (D-1103-2) :
     si ce chemin ne convient pas, garder `UNDER_REVIEW` avec un horodatage `correctionDemandeeLe`, et le dire dans
     l'annonce du contrat.
   - **Événement :** `kyc.correction.requested@1` est émis par l'outbox, dans la même transaction. Il porte
     `orgId`, `message` et `pieces[]` (`documentId`, type, `motifRenvoi`), ainsi que `demandeLe`.
3. **Le cabinet est prévenu** par e-mail. L'e-mail contient :
   - le mot de l'opérateur ;
   - une ligne `— <libellé de la pièce> : <motif>` par pièce renvoyée qui porte un motif ;
   - une pièce sans motif, nommée sans texte ;
   - le lien vers son espace.

   La composition est **la même** que l'aperçu de la console (maquette validée).
4. **Le journal du dossier** (`GET /kyc-admin/:orgId`) inscrit l'acte « Renvoi pour correction », avec le message et
   les lignes des pièces.
5. **Le BFF** relaie :
   - le corps de la marque de pièce ;
   - la nouvelle route ;
   - les nouveaux champs du détail.

## Critères d'acceptation

- **AC-1** : le contrat est **annoncé avant le code**, comme pour STORY-1080. L'annonce couvre :
  - les routes ;
  - le DTO ;
  - l'événement et son schéma ;
  - les codes de refus ;
  - la transition d'état retenue (D-1103-2).
- **AC-2** : une pièce rejetée avec motif le restitue, au cabinet comme à la console. Une pièce approuvée ensuite ne le
  restitue plus.
- **AC-3** : le renvoi refuse un dossier sans pièce rejetée (409 nommé), et un `If-Match` périmé (412 ou 409, comme
  `reject`).
- **AC-4** : le renvoi émet `kyc.correction.requested@1` une seule fois, dans la transaction. Un crash ne laisse ni
  événement sans état, ni état sans événement.
- **AC-5** : l'e-mail reçu par le cabinet contient exactement les lignes attendues. C'est vérifié dans mailhog, dans
  la recette.
- **AC-6** : le journal du dossier montre l'acte, son auteur, le message et les lignes.
- **AC-7** : aucune régression du rejet global. `reason` reste obligatoire, avec 1 000 caractères au plus.

## Décisions à prendre au premier geste

- **D-1103-1** : quel service envoie l'e-mail KYC au cabinet aujourd'hui ? Le consommateur de `kyc.status.changed`
  (STORY-021) est à relire. Recommandé : le même service ajoute `kyc.correction.requested`.
- **D-1103-2** : la transition de l'effet 2. Recommandé : `PENDING_DOCUMENTS`.

## Hors périmètre

- L'écran de la console : AP-62.
- Le rejet global avec motif composé : AP-38, sans backend.
- Un motif par pièce lisible du cabinet **dans son espace**, pièce par pièce : il suit naturellement l'AC-2. Son écran
  côté cabinet est à nommer au prochain tri.
