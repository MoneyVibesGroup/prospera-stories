# Récit du PO — PRD Prospera Microfinance (2026-11-13)

*Texte du PO, reçu dans la conversation du 2026-11-13. Ses réponses aux points ouverts du §7 sont rangées sous chaque point, marquées **PO :**. Rien n'est reformulé, sauf l'orthographe.*

Réponse à la question « un seul récit pour les deux (microfinance et assurance), ou d'abord la microfinance ? » — **PO : on débute par celui de microfinance.**

Précision du PO (même jour) : **`prospera-microfinance-service` est le paquet de comptabilité pour les SFD.**

---

## 1. Le client

**Qui.** Une grande institution de microfinance (IMF), avec beaucoup d'agences, dans un pays de la zone BCEAO. On en est au pré-contrat : elle ne doit pas être nommée dans le PRD (écrire « l'IMF »).

**Quand.** Démarrage en février 2027, en même temps que les autres clients Prospera.

**Où.** Sur ses propres serveurs, pas chez Money Vibes. Le PRD doit donc couvrir :
- l'installation chez le client ;
- les mises à jour livrées à distance ;
- les sauvegardes ;
- l'accès des agences au serveur central ;
- l'exploitation par une équipe informatique qui n'est pas la nôtre.

## 2. La place de Prospera dans leur système

Prospera ne remplace pas leur logiciel actuel, qui garde les comptes et la comptabilité officielle. Prospera se branche à côté, surtout pour le crédit et le pilotage.

Conséquence directe : le PRD doit décrire les échanges avec ce logiciel. Au minimum :
- ce que Prospera en reçoit : clients, prêts, paiements ;
- ce que Prospera lui renvoie : dossiers accordés, décaissements à exécuter.

Le logiciel existant n'est pas encore connu. Le PRD doit donc définir ces échanges sans dépendre d'un produit précis.

## 3. Ce qui doit marcher le premier jour

- Toute la plateforme doit fonctionner, avec le crédit comme priorité absolue, détaillé de bout en bout.
- La comptabilité n'est pas une priorité. Tout le reste l'est.
- La reprise des prêts en cours se fera, mais la décision est reportée. Le PRD doit prévoir un import du portefeuille existant, qu'on ajustera à la présentation.
- Le backend existant ne compte pas (celui que le front appelle sur localhost:3001). C'est précisément le backend qu'il faut construire. Le PRD décrit des capacités, sans partir de cette API.

## 4. Le processus crédit, de bout en bout

Les rôles qui reviennent :

| Sigle | Rôle |
|---|---|
| CC | Chargé de crédit |
| ROC | Responsable des opérations de crédit, niveau réseau |
| RA | Responsable d'agence |
| GP | Gestionnaire de portefeuille, qui suit le prêt après le décaissement |
| DG | Directeur général |
| DAF | Directeur administratif et financier |
| — | Agent terrain, commercial, analyste risque, auditeur |

Les étapes se suivent en 7 phases.

**1. Prospection et fiche client**
- Le commercial ou l'agent terrain crée le prospect.
- La fiche client regroupe l'identité, l'activité, les photos et la position GPS.
- Le KYC est validé, et le client reçoit un score.
- Le client peut faire partie d'un groupe solidaire (crédit de groupe).

**2. Demande de crédit**
- L'agent choisit le client et un produit de crédit dans le catalogue : montant, durée, objet.
- Le montant doit rester dans les limites du produit, et le client doit y être éligible (score minimum, ancienneté minimum).
- Une simulation affiche l'échéancier prévu : mensualités, intérêts, frais, TAEG.
- Le dossier est créé au statut SOUMIS, et le CC est prévenu.

**3. Constitution du dossier**
- Le CC liste les pièces manquantes, puis l'agent les envoie.
- Le CC enregistre les cautions : au moins 2 au-dessus d'un seuil.
- Une fois le dossier complet, il passe à DOSSIER_COMPLET et le score est recalculé.

**4. Instruction par le CC**
- Le CC planifie les visites au domicile et sur le lieu d'activité : au moins 2 au-dessus de 500 000 FCFA dans la démo. Chaque visite exige photo et GPS.
- Le CC lit le rapport d'analyse (grille des 5C), le score et les alertes, puis remplit une checklist d'instruction, complète à 100 %.
- L'IA propose une décision : approuver, approuver un montant réduit, demander des garanties, ou refuser. Le CC peut s'en écarter s'il le justifie.
- Le CC rend un avis favorable ou défavorable. S'il est favorable, le dossier passe chez le ROC.

**5. Décision du ROC**

Le ROC lit le rapport, qui contient une proposition de montant, de taux et de durée. Il a trois choix :
- il approuve : il fixe montant, taux et durée, désigne le GP, et le dossier passe à EN_COMITE_CREDIT ;
- il refuse : le dossier passe à REFUSE et l'agent est prévenu ;
- il demande des garanties : le dossier revient au stade documents.

Règle impérative : l'accord du ROC ne crée pas d'échéancier.

**6. Comité de crédit et décaissement**
- Le quorum est le ROC plus un membre de la direction (DG ou RA).
- Si la décision est favorable, les conditions finales sont figées : montant, taux, durée, mensualité, frais, TAEG, date de la première échéance, GP, notes du comité.
- C'est le comité seul qui génère l'échéancier. Le dossier passe alors à EN_GESTION.
- Le décaissement se fait en espèces au guichet (autorisé seulement par le comptable ou le DAF), par Mobile Money ou par virement.
- Le client, le GP, l'agent et le responsable commercial sont prévenus.

**7. Suivi du prêt, retards et recouvrement**

*Remboursements.* Ils arrivent en espèces, au guichet, par collecte terrain ou par Mobile Money. Un paiement Mobile Money reste « en attente » jusqu'à ce que le comptable le valide. Il est ensuite rattaché automatiquement à l'échéance correspondante (écart inférieur à 1 %).

*Relances automatiques, avec escalade :*

| Moment | Action |
|---|---|
| J-3 | Message préventif WhatsApp, avec lien de paiement |
| J+1 à J+3 | Rappel courtois, puis SMS |
| J+7 | Relance ferme et mission terrain ; alerte au ROC si le risque est élevé |
| Promesse non tenue | Nouvelle relance ; escalade si le client récidive |
| J+90 | Passage au contentieux |

*Promesses de paiement.* Le GP les enregistre, et les relances sont suspendues jusqu'à la date promise.

*Recouvrement.* Le ROC voit le réseau trié par PAR (portefeuille à risque) et descend agence par agence jusqu'au dossier. Il définit une stratégie et assigne des agents de recouvrement par zone.
- Actions possibles : appel, visite au domicile ou sur l'activité, plan d'étalement, mise en demeure, saisie de garantie, transfert au contentieux.
- Chaque action est tracée, avec son résultat.
- Statuts du recouvrement : EN_RETARD → EN_RECOUVREMENT → PLAN_ETALEMENT / REGULARISE / BLOQUE → CONTENTIEUX_JUDICIAIRE / PERTE_DEFINITIVE. Seul le ROC peut bloquer ou débloquer un dossier, avec un motif obligatoire.

*Fiche mauvais payeur.* Elle contient l'historique des paiements, les retards passés, les promesses, les actions menées, le score de recouvrement et les garanties.

*Clôture du prêt.* Le prêt passe à CLOTURE, puis le client peut repartir sur un nouveau cycle de crédit.

**Les statuts du dossier, dans l'ordre :**
SOUMIS → RDV_PROGRAMME → EN_ATTENTE_DOCUMENTS → DOSSIER_COMPLET → VISITES_PLANIFIEES → EN_ANALYSE → VALIDE_CHARGE → EN_ANALYSE_ROC → EN_COMITE_CREDIT → EN_GESTION → CLOTURE, et REFUSE à tout moment.

Chaque changement de statut est horodaté. On sait qui a fait quoi, et quand.

## 5. Le reste de la plateforme, aussi au jour 1

- **Pilotage.** Un tableau de bord par rôle, environ 10 rôles en tout. Le DG peut descendre réseau → secteur → agent → client. Alertes, et Copilot IA.
- **Droits d'accès.** Chacun ne voit que son périmètre : le DG tout le réseau, le RA son agence, le GP son portefeuille, l'agent sa zone.
- **Terrain.** Visites géolocalisées et mode hors ligne, avec synchronisation au retour du réseau.
- **Caisse et Mobile Money.** Les trois canaux (collecte terrain, guichet, Mobile Money) et la clôture de caisse quotidienne, avec alerte en cas d'écart.
- **Épargne et catalogue de produits.** Produits de crédit et d'épargne, avec un historique des versions : un dossier en cours garde ses conditions d'origine.
- **Conformité BCEAO et audit.** Reporting réglementaire avec export PDF, séparation des responsabilités, traçabilité.
- **Équipes et réseau d'agences, marketing.** Objectifs et performance par agence et par agent, acquisition de clients, chatbot WhatsApp.
- **Comptabilité : non prioritaire.** Au mieux, un export des écritures vers leur logiciel.

## 6. Les sources

- `prospera-web` : le front de démo qui définit le produit, avec environ 30 modules. Le crédit seul compte 23 écrans dans `credit/`.
- `docs/prospera_microfinance.md` : le discours produit et les 5 promesses (baisse du PAR, productivité terrain, encaissements 100 % numériques, pilotage en temps réel, conformité BCEAO).
- Les cahiers des charges par bundle, dans `docs/` : crédit (la source du §4) ; terrain et collecte ; risque et conformité ; croissance et opérations.
- `BCEAO_SFD_PROSPERA_JUIN_2026_20260531.html` : un exemple de rapport BCEAO.

## 7. Les points que le PRD doit trancher ou garder ouverts

**Qui fait foi pour l'argent ?** Si leur logiciel garde les comptes, les décaissements et les remboursements y sont probablement saisis. Prospera doit alors les recevoir, sinon l'échéancier, le PAR et les relances seront faux. Même question pour l'épargne et la caisse, qui existent dans le front mais feraient doublon avec leur logiciel. C'est la question la plus structurante du PRD.
> **PO :** ce qui fait foi, c'est leur logiciel. Mais nous, on va créer un truc fictif à intégrer pour la démo, pour qu'ils comprennent. Pour la partie démo du client, on va mettre en place le bon connecteur, mais pas pour maintenant.

**Le taux d'usure.** Le produit d'exemple du front affiche 2,5 % par mois et un TAEG de 36,4 %. Le taux d'usure des institutions de microfinance (SFD) en zone UEMOA est, sauf erreur, de 24 % par an. À faire vérifier par un juriste. Le PRD doit prévoir un plafond réglementaire paramétrable.
> **PO :** exactement, et c'est 24 % par an.

**Les seuils sont ceux de la démo.** 500 000 FCFA, 2 cautions, quorum, délais de relance : tout cela doit être paramétrable par l'IMF.
> **PO :** exactement.

**Les opérateurs Mobile Money.** Le front est réglé sur Flooz et Mixx, donc sur le Togo. Il faut confirmer le pays et les opérateurs.
> **PO :** oui, c'est par pays et par opérateur, et même avec les banques, grâce à PI-SPI.

**La taille.** Nombre d'agences, d'utilisateurs, de prêts actifs : inconnu. Ces chiffres dimensionnent les serveurs et les objectifs de performance.
> **PO :** ça, c'est eux qui gèrent. Nous, on fait un truc pour leur démo ; après, ils vont s'adapter.

**La reprise du portefeuille.** Format et logiciel de départ : décision reportée.
