---
title: "Addendum — PRD Prospera Microfinance"
status: final
created: 2026-11-13
updated: 2026-11-13
---

# Addendum — PRD Prospera Microfinance

Ce document range ce que le PRD renvoie hors de lui : choix techniques, pistes de mécanisme, options écartées. **Il ne crée aucune exigence.** Les exigences sont dans `prd.md` ; l'architecture (spine) tranchera les mécanismes. Chaque entrée dit d'où vient le renvoi.

## 1. L'échange avec le cœur (§6.5, annexe C)

- **Transports.** Deux modes, au choix de ce que le cœur sait faire : API interrogée par Prospera, ou fichiers déposés par le cœur et tirés par Prospera plusieurs fois par jour. Prospera tire toujours ; aucun port entrant chez l'IMF (décision A10).
- **Enveloppe.** Chaque message porte : identifiant unique, objet, sens, clé d'origine (identifiant de l'objet dans le système qui l'a créé), version, date d'effet, empreinte. Un message rejoué avec le même identifiant est sans effet (idempotence).
- **Ordre et séquence.** Les mouvements d'un même prêt sont appliqués dans l'ordre de leur date d'effet ; un trou de séquence ouvre une ligne de la file des écarts au lieu de bloquer le flux. Piste : réutiliser les clés et séquences de la spine Connecteurs (AD-5, AD-8).
- **Formats.** Pour les fichiers : CSV en UTF-8 avec en-tête, un fichier par objet et par lot, et un manifeste du lot (nombre de lignes, empreinte). Pour l'API : JSON. Le schéma de chaque objet de l'annexe C est versionné.
- **Cœur fictif.** Il expose les deux modes, pour que la démo montre l'un et l'autre.

## 2. La reprise du portefeuille (§6.9)

- **Schéma des objets microfinance.** La spine Reprise ne le déclare pas encore : client, groupe, prêt, échéance, garantie, caution, compte d'épargne. Il est à écrire avec le manifeste de `credit`, `microfinance` et `coeur-sfd`.
- **Règles reprises.** Les règles de classement, de provision et de PAR de `prospera-microfinance-service` (paquet comptable SFD, non installé chez l'IMF) peuvent être reprises comme bibliothèque de calcul dans `risque-par`, sans reprendre la tenue des crédits.
- **Point de coupure.** Daté par l'IMF à la mise en service : avant, l'import ; après, l'échange permanent.

## 3. Le calcul du TEG (FR-10, §6.1)

- **Méthode figée par le PRD** : le taux de la période *i* résout `montant accordé − frais retenus = Σ (échéance_k + assurance_k) / (1 + i)^k`, puis TEG = *i* × nombre de périodes par an. Résolution numérique (dichotomie ou Newton) jusqu'à 10⁻⁸.
- **Contrôle au pire cas** à la publication d'un produit : durée la plus courte, frais les plus élevés, assurance obligatoire comprise.
- **Jeu d'essai de référence** (annuité constante, 500 000 FCFA, sans assurance) :

| Taux mensuel | Frais | 3 mois | 6 mois | 12 mois | 24 mois |
|---|---|---|---|---|---|
| 1,00 % | 0 % | 12,0 % | 12,0 % | 12,0 % | 12,0 % |
| 1,00 % | 1 % | 18,1 % | 15,5 % | 13,9 % | 13,0 % |
| 1,00 % | 2 % | 24,4 % | 19,1 % | 15,9 % | 14,0 % |
| 1,25 % | 0 % | 15,0 % | 15,0 % | 15,0 % | 15,0 % |
| 1,25 % | 1 % | 21,2 % | 18,5 % | 16,9 % | 16,0 % |
| 1,25 % | 2 % | 27,4 % | 22,1 % | 18,9 % | 17,1 % |
| 1,50 % | 0 % | 18,0 % | 18,0 % | 18,0 % | 18,0 % |
| 1,50 % | 1 % | 24,2 % | 21,6 % | 19,9 % | 19,0 % |
| 1,50 % | 2 % | 30,4 % | 25,2 % | 21,9 % | 20,1 % |

- **À faire valider par un juriste** : la méthode « proportionnelle » (et non composée), l'inclusion de l'assurance obligatoire, l'exclusion des frais de tenue de compte (§12.3 du PRD).

## 4. L'intégrité du journal (FR-9)

- **Chaînage** : chaque entrée porte l'empreinte de la précédente ; une entrée modifiée casse la chaîne.
- **Ancrage externe** : l'empreinte de tête est déposée à intervalle régulier hors du serveur de l'IMF (relais Money Vibes ou dépôt choisi par l'IMF), pour qu'une modification directe en base soit détectable.
- **Chiffrement des champs sensibles** (pièces d'identité, téléphones, positions) avec des clés tenues hors du compte d'administration système ; piste : coffre de clés de l'IMF, accès par le DG ou le DAF.

## 5. L'IA commune en instance locale (FR-8, §7.8)

- **Instance locale** chez l'IMF : modèles, Copilot, journal des prédictions et de leurs écarts.
- **Tunnel sécurisé sortant** vers l'IA commune : envoi des écarts anonymisés pour l'apprentissage ; réception des mises à jour de modèle, signées et versionnées, avec retour arrière.
- **Anonymisation** : retrait des identifiants directs, généralisation des zones et des montants ; contrôle avant envoi qu'aucune donnée nominative ne part.

## 6. Le relais Money Vibes (§7.9)

- Il reçoit les notifications de PI-SPI, de FedaPay et de WhatsApp et sert la page du lien de paiement, puisque l'IMF n'ouvre aucun port entrant.
- Livraison au serveur de l'IMF avec accusé de réception après écriture durable ; rejeu dans une fenêtre ; rapprochement périodique avec le relevé du fournisseur.
- Contenu minimal : jeton opaque, prénom et montant, durée de vie courte, usage unique. Money Vibes y est sous-traitant de l'IMF.

## 7. Le décaissement électronique (§5.8, FR-256)

- La clé d'idempotence de l'ordre est transmise au fournisseur et n'est jamais régénérée.
- Un ordre sans réponse passe à l'état INCONNU : on interroge le fournisseur avant toute réémission.
- Au redémarrage ou après une restauration, les ordres de la dernière heure sont rapprochés avec le fournisseur.
