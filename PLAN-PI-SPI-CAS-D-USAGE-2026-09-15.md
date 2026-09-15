# Plan PI-SPI — les cas d'usage du projet, et ce qui manque pour les rendre testables

**Date :** 2026-09-15 · **Service :** `paiement-service` · **Stories réservées :** STORY-661 → STORY-669

**Objectif fixé par le PO (2026-09-15)** : que toute la partie paiement soit testable avec PI-SPI,
**d'abord** pour que les cabinets paient Money Vibes, **ensuite** pour que les distributeurs
règlent leurs fournisseurs et que leurs commerciaux encaissent, **en facilitant le rapprochement
bancaire** tout du long.

**Source des cas d'usage :** le catalogue du portail développeur PI-SPI (dix parcours), confronté au
PRD `prds/prd-paiement-service-2026-08-02/prd.md` et au code de `origin/dev` au commit `1532315`.

---

## 1. Ce que l'inventaire a établi

⛔⛔ **RIEN NE DÉCLENCHE UN PAIEMENT, POUR AUCUN FOURNISSEUR.** L'émission d'une demande
(`EmettreLaDemande`) matérialise la créance, fige le routage et les tarifs par méthode, et produit
un lien. La page publique ne sait qu'afficher (`GET :jeton`). La méthode `initier` du port n'est
appelée par **aucun** cas d'usage — seulement relayée par le décorateur d'observation. Les stories de
page publique `PY-00` → `PY-03` sont toutes `blocked`, et aucune ne prévoit l'appel au fournisseur.

⛔⛔ **LE RACCORDEMENT PI-SPI EST UNIQUE POUR LA PLATEFORME.** Il vient de variables d'environnement,
alors que FedaPay utilise une clé marchande **scellée par organisation**. Pour un cabinet qui paie
Money Vibes, c'est exactement juste : c'est le raccordement de Money Vibes. Pour un distributeur,
chaque appel partirait avec les identifiants de Money Vibes — le schéma refuse d'ailleurs une demande
dont le bénéficiaire n'appartient pas au client business qui appelle. **Un raccordement par
organisation est le préalable de tout le volet distributeur**, et c'est NFR-1 qui l'impose, pas une
préférence.

⚡ **L'ADRESSE DE PAIEMENT DU PAYEUR N'EST STOCKÉE NULLE PART.** Le port la prévoit
(`ContactPayeur.adresseDePaiement`), mais ni la créance ni la demande ne la portent : le payeur a un
nom, un téléphone et un courriel. Aucune demande PI-SPI ne peut donc partir de données réelles.

⚡ **UNE ÉCHÉANCE D'ABONNEMENT CRÉE UNE CRÉANCE, SANS DEMANDE.** `genererLEcheance` matérialise la
créance de Money Vibes sur le cabinet, puis s'arrête : le cabinet n'a rien avec quoi payer.

⚠️ **LE PRD COUVRE L'ENCAISSEMENT, PAS L'ENVOI DE PAIEMENTS.** Ses 64 exigences ne mentionnent ni
règlement de fournisseurs ni versement de salaires, et FR-P49 exclut tout remboursement. Régler un
fournisseur est une **extension de périmètre**, que le PO a demandée : elle exige un amendement du
PRD, et reste compatible avec NFR-1 **à la seule condition** que l'ordre parte des identifiants de
l'organisation, depuis son propre compte — jamais d'un compte de Money Vibes.

## 2. Les dix parcours du catalogue, confrontés au projet

| Parcours PI-SPI | Pour qui dans le projet | État aujourd'hui | Story |
| --- | --- | --- | --- |
| Facturation avec délai de paiement | cabinet → Money Vibes ; distributeur → client | adaptateur prêt, émission non câblée | 661, 662 |
| Facturation récurrente flexible | cabinet → Money Vibes (abonnements) | créance produite, aucune demande | 663 |
| QR Code unique pour chaque paiement | lien de paiement, tournée | QR construit (655), exposé nulle part | 664 |
| Réconciliation automatique | tous | webhooks signés (660) et rapprochement (270) livrés | 665 |
| Demande de paiement instantanée | commercial en tournée | même mécanisme que 662 | 662, 666 |
| E-commerce et boutiques en ligne | — | même mécanisme que 662 ; aucun site marchand dans le projet | 662 |
| QR Code imprimé réutilisable | point de vente du distributeur | QR construit (655), aucun paiement spontané relié | 666, 667 |
| Règlement fournisseurs | distributeur → ses fournisseurs | **hors PRD** | 666, 668 |
| Suivi de trésorerie en temps réel | rapprochement bancaire | relevé importé par fichier (269) | 669 |
| Versement des salaires en masse | — | **non demandé**, écarté | — |

## 3. Les stories, dans l'ordre

### Phase A — les cabinets paient Money Vibes *(raccordement de la plateforme, testable maintenant)*

| Story | Titre | Pts | Prérequis |
| --- | --- | --- | --- |
| **STORY-661** | L'adresse de paiement du payeur — un moyen de paiement, pas un profil | 3 | 600, 290 |
| **STORY-662** | La demande part dans l'application du payeur — l'émission appelle enfin le fournisseur | 5 | 661, 653 |
| **STORY-663** | L'échéance d'abonnement émet sa demande — la facturation récurrente | 3 | 662 |
| **STORY-664** | Le QR dynamique d'une demande — la référence qui rapproche toute seule | 3 | 655 |
| **STORY-665** | Le secret de notification après la déclaration, et deux secrets pendant la bascule | 5 | 660 |

- **661** tient la règle du domaine « aucun profil de payeur » : l'adresse de paiement est un **canal
  de paiement**, au même titre que le téléphone qui sert à envoyer le lien, et un SHID ne porte
  aucune donnée personnelle. Elle est **confirmée** par l'annuaire (nom et pays) avant d'être rangée,
  comme le guide d'enrôlement l'exige.
- **662** est la pièce centrale : sans elle, aucun parcours de facturation n'existe. Un échec du
  fournisseur laisse la demande **ouverte** et réacheminable (FR-P12), jamais annulée.
- **664** tranche l'arbitrage laissé ouvert par STORY-655 : le QR **dynamique** porte la référence
  de la demande dans son champ de référence, ce qui rend le rapprochement automatique au
  `PAIEMENT_RECU`. Le QR du paiement à distance reste écarté : ce QR-là se **présente**, au comptoir
  ou sur une facture.
- **665** lève un défaut qui existe déjà, FedaPay compris : sans lui, aucun compte ne peut recevoir
  le secret que le schéma ne rend qu'après la création du webhook.

### Phase B — les distributeurs *(exige un raccordement par organisation)*

| Story | Titre | Pts | Prérequis |
| --- | --- | --- | --- |
| **STORY-666** | Le raccordement PI-SPI par organisation — Money Vibes n'appelle jamais pour autrui | 8 | 243, 652 |
| **STORY-667** | Le QR imprimé d'un point de vente — le paiement spontané trouve sa créance | 3 | 664, 666, 271 |
| **STORY-668** | Régler un fournisseur — l'ordre part du compte de l'organisation, validé par un second rôle | 8 | 666, **amendement PRD** |

- **666** scelle au coffre, par organisation, l'identifiant client, le secret, la clé d'API et le
  code du participant — le même patron que la clé marchande FedaPay (STORY-243). Le raccordement de
  la plateforme ne sert plus que Money Vibes.
- **668** est **bloquée par l'amendement du PRD** : deux exigences à écrire (ordonner un paiement
  sortant ; séparer celui qui le prépare de celui qui le valide, comme FR-P60 le fait pour
  l'encaissement), et une décision sur le parcours par IBAN ou par numéro de compte que le schéma
  ajoute en 1.4.

### Phase C — le rapprochement bancaire *(en fil conducteur)*

| Story | Titre | Pts | Prérequis |
| --- | --- | --- | --- |
| **STORY-669** | La trésorerie par l'API du participant — le relevé n'est plus un fichier qu'on dépose | 5 | 269, 666 |

- ⛔ **Bloquée par le simulateur** tant qu'il ne résout pas les comptes qu'il liste (STORY-653).

## 4. Ce qui reste bloqué hors du dépôt

- ⛔ **Aucun alias sur nos comptes.** `GET /v1/comptes` liste deux comptes que `GET
  /v1/comptes/{numero}` et la création d'alias ne résolvent pas, alors que le transfert intra-comptes
  les accepte. Tant que ce défaut du simulateur dure, **aucune demande ne peut être acceptée de bout
  en bout**, même en phase A : le bénéficiaire doit être une adresse de notre client business. Le
  rapport à envoyer au support tient en une phrase (voir STORY-653).
- ⚠️ **Le mTLS** de la route de rappel et des appels de production : développement réel, hors de
  ce plan.

## 5. Hors périmètre, et pourquoi

- **Versement des salaires en masse** : non demandé par le PO, et aucun module du projet ne porte de
  paie.
- **Paiement par IBAN ou numéro de compte** : variante de l'envoi de paiement, à trancher dans
  l'amendement qui débloquera STORY-668.
