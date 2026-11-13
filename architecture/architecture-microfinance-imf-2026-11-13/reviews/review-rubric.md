# Relecture de la spine Microfinance (IMF) — grille « Good-spine checklist » et réconciliation avec le PRD final

Date : 2026-11-13. Objet relu : `ARCHITECTURE-SPINE.md` (25 AD) et `.memlog.md`. Sources de réconciliation : PRD final `prd-mf-final.md` (§4 à §8, annexes A, C, D, addendum), spines parentes (moteur, paiement, assistant, Reprise, Connecteurs). Aucun appel réseau.

## Verdict

**La spine tient bien le fond du paradigme (le cœur fait foi, un écrivain par objet, ordre de décaissement à clé unique, calcul financier unique), mais elle n'est pas encore une base de construction sûre : le catalogue de contrats AD-9 supprime des noms dont le PRD dépend, les projections du cœur n'ont pas de propriétaire, l'IA s'appuie sur une citation fausse de la spine assistant, et une dizaine de points de divergence entre unités (relais, consentements, restauration, hors ligne, LBC/FT, chiffrement, plafond d'usure) sont tus ou différés.**

Décompte : 3 critiques, 9 élevés, 8 moyens, 7 faibles.

---

## Constats critiques

### C-1 — AD-2 / AD-1 / AD-7 : les projections du cœur n'ont aucun propriétaire

- **Problème.** AD-1 dit que tout ce qui vient du cœur est une « projection (valeur, `lueLe`, clé d'origine) ». AD-2 ne désigne **aucun écrivain** pour ces projections : la ligne `coeur-sfd` ne possède que « journal, file d'envoi, file des écarts, fraîcheur, rapprochement » et la phrase « aucun solde » ; `risque-par`, `credit`, `collecte`, `microfinance`, `recouvrement` « lisent (cœur) ». Résultat : chaque consommateur construira sa propre copie du prêt, de l'échéance officielle, des mouvements, de l'épargne, de la caisse du guichet, de la classe officielle. C'est exactement la divergence que la règle « un propriétaire par objet » devait empêcher (FR-161 : projection = encours officiel + mouvements postérieurs, égale au solde de contrôle au franc près ; cette somme est faite où ?). Le PRD, lui, est clair : le manifeste A.6 de `coeur-sfd` déclare `objetsDeReprise: client, pret, echeance, garantie, compte-epargne` ; donc `coeur-sfd` tient ces objets, et la Reprise (FR-196 à FR-198) les livre là. La spine ne le dit pas, et son « Deferred » renvoie le schéma de Reprise à plus tard.
- **Correction proposée (à coller dans la table d'AD-2, ligne `coeur-sfd`).**
  > `coeur-sfd` (coeur-sfd) | **seul écrivain des projections du cœur**, en ajout seul pour les mouvements : prêts, échéances officielles, mouvements de paiement, pénalités, classes officielles et provisions, comptes et mouvements d'épargne, caisse du guichet, balances, dépôts de garantie, agences et codes produit du cœur ; et du journal des échanges, de la file d'envoi, de la file des écarts, de la fraîcheur, du rapprochement trimestriel | dossiers accordés, ordres, remboursements saisis, agences, produits
  >
  > Les autres modules consomment les faits `coeur-sfd.*.changed@1` ou la route de lecture de `coeur-sfd` ; ils peuvent garder un **cache dérivé**, jamais une copie écrite comme vérité. La projection d'un solde (encours officiel + mouvements postérieurs, FR-161) est calculée **une fois**, dans `coeur-sfd`, et comparée à la valeur de contrôle du cœur. Les objets de Reprise `pret`, `echeance`, `garantie`, `compte-epargne`, `client` sont **ceux de `coeur-sfd`** : retirer l'entrée correspondante du « Deferred » et la placer dans AD-24 (point d'import avant la démo si la Reprise est dans février).

### C-2 — AD-9 : le catalogue « remplace » les C5 du PRD et en supprime ≥ 25 noms nécessaires

- **Problème.** AD-9 affirme « un nom absent ne se publie ni ne se consomme ». Or l'annexe C (27 objets) et les C5 de l'annexe A utilisent des noms que la spine n'a pas repris et n'a pas fusionnés dans un autre fait. Sans eux, des flux complets de l'annexe C n'ont plus de déclencheur ni de retour :
  - **Envois vers le cœur sans déclencheur** : plan d'étalement (`credit.plan-etalement.decide@1` / `recouvrement.plan-etalement.valide@1`), transfert au contentieux (`recouvrement.contentieux.transfere@1`), perte définitive décidée (`recouvrement.perte.decidee@1` ; la spine n'a que `risque-par.perte.proposee@1`, qui est une proposition), ouverture de compte d'épargne, annulation de collecte (`collecte.collecte.annulee@1`), remboursement saisi (`collecte.remboursement.saisi@1`), demande de gel LBC/FT (`microfinance.sanctions.gel-demande@1`), décaissement exécuté par `paiement` (`paiement.decaissement.execute@1` ; `paiement.virement.execute@1` dans A.1), agences (`reseau.agence.changed@1`).
  - **Lectures du cœur sans fait** : classe officielle et provisions (`coeur-sfd.classe-officielle.recue@1`, indispensable à FR-125 et FR-163), dépôt de garantie (`coeur-sfd.depot-garantie.changed@1`, garde de FR-66 « dépôt constaté par le cœur »), code produit (`coeur-sfd.produit.code@1`, FR-110), prêt soldé (`coeur-sfd.pret.solde-nul@1`, clôture FR-75), flux Mobile Money du client, création de client et ouverture de compte (`coeur-sfd.client.cree@1`, `coeur-sfd.compte-epargne.ouvert@1`), remise (`coeur-sfd.remise.changed@1`).
  - **Autres** : `collecte.collecte.confirmee/refusee`, `caisse.fonds.changed`, `caisse.alerte.changed`, `risque-par.alerte.ouverte/remontee`, `risque-par.prevision.calculee`, `conformite-bceao.separation.contournee` et `.parametre.changed`, `terrain.visite-instruction.cloturee`, `credit.visite.planifiee`, `recouvrement.credit.bloque/debloque`, `credit.decaissement.declare`.
  - La spine renomme aussi sans table de correspondance (`coeur-sfd.paiement.recu` + `penalite.recue` → `mouvement.recu` ; `ordre-decaissement.etat` → `confirme/rejete`).
- **Correction proposée.** Remplacer la phrase « le tableau ci-dessous remplace les C5 » par :
  > Le tableau ci-dessous est le catalogue **complet** des faits de ce périmètre ; il est établi en **parcourant les 27 objets de l'annexe C** (un objet cœur → Prospera = un fait `coeur-sfd.<objet>.changed@1` ou `.recu@1` ; un objet Prospera → cœur = un fait déclencheur nommé chez son décideur, consommé par `coeur-sfd`) et les 13 clauses C5 de l'annexe A. Une **table de correspondance** `nom du PRD → nom de la spine` est tenue dans `manifestes-a-produire.md`. Un nom absent du tableau ne se publie pas ; il s'ajoute par une PR qui amende ce tableau.
  Puis ajouter au tableau, au minimum : `credit.plan-etalement.decide@1` (ou `recouvrement.plan-etalement.valide@1`, un seul des deux), `recouvrement.contentieux.decide@1`, `recouvrement.perte.decidee@1`, `recouvrement.credit.bloque@1`/`.debloque@1`, `collecte.remboursement.saisi@1`, `collecte.collecte.annulee@1`, `collecte.collecte.confirmee@1`/`.refusee@1`, `microfinance.client.bloque@1` (voir E-7), `microfinance.gel.demande@1`, `coeur-sfd.classe-officielle.recue@1`, `coeur-sfd.depot-garantie.changed@1`, `coeur-sfd.produit.code@1`, `coeur-sfd.pret.solde@1`, `coeur-sfd.agence.changed@1`, `coeur-sfd.remise.changed@1`, `coeur-sfd.client.cree@1`, `coeur-sfd.compte-epargne.ouvert@1`, `paiement.decaissement.execute@1`, `conformite-bceao.parametre.changed@1`, `conformite-bceao.separation.contournee@1`, `risque-par.alerte.ouverte@1`/`.remontee@1`. Le fait de `paiement` doit aussi être nommé dans la phrase « faits des voisins consommés ici ».

### C-3 — AD-14 : citation fausse de la spine assistant, et une hypothèse qui contredit deux AD de cette même spine

- **Problème (citation).** AD-14 écrit « contrat de la spine de l'assistant (AD-1 : origine `REGLE` ou `MODELE`) ». La spine assistant AD-1 définit `origine: LANGAGE | REGLE`. **`MODELE` n'existe pas.** Un score issu d'un modèle statistique n'a donc aucune origine dans le contrat Proposition ; la promesse d'AD-14 « remplacées par des modèles **sans changer le contrat** » est fausse au niveau du contrat (et FR-8 exige que le mot « IA » ne s'affiche que pour un modèle : il faut un discriminant). Par ailleurs assistant AD-11 interdit d'enregistrer un calculateur de score qui ne restitue pas ses facteurs, ce qui exclut un modèle non explicable.
- **Problème (hypothèse `[ASSUMPTION]`).** Faire porter l'instance locale par `assistant-service` heurte : AD-7 (« aucune donnée métier n'est persistée » : or l'instance doit enregistrer les **écarts prédiction/réalité** et le journal des prédictions, addendum §5) ; AD-21 (modèle de production « auto-hébergé sur l'infrastructure Money Vibes » ; ici il tourne sur le serveur de l'IMF) ; AD-19 (cloisonnement par organisation **et par dossier comptable**, alors que l'IMF cloisonne par agence/portefeuille). AD-25 ne liste qu'« héberger les stratégies v0 », ce qui est très en dessous de ce qu'il faudrait amender. La conséquence est lourde : le score, la décision suggérée, le Copilot et FR-199 reposent tous sur ce point.
- **Correction proposée.** Remplacer la ligne de AD-14 « Rule » 1 par :
  > … au contrat de la spine de l'assistant (AD-1 : `origine: REGLE` pour les règles explicables v0 ; l'origine `MODELE` **n'existe pas encore** et fait l'objet d'un amendement AD-1 de l'assistant, avec version, date, données utilisées et facteurs). Tant que cet amendement n'est pas fusionné, toute capacité d'IA est servie en `REGLE` et l'écran dit « règle », jamais « IA » (FR-8).
  Remplacer l'`[ASSUMPTION]` par une décision à instruire, et étendre AD-25 :
  > `assistant-service` / IA commune : amender AD-1 (origine `MODELE`), AD-7 (le **journal des écarts** de l'instance locale est une donnée possédée, non métier : valeurs prédites/observées déjà anonymisées ou clés de dossier, durée de conservation), AD-19 (portée par agence et portefeuille au lieu du seul `dossierId`) et AD-21 (instance locale sur site : `LLM_BASE_URL` pointant l'hôte de l'IMF, modèle livré comme artefact signé par la ligne de version). **Tant que ces quatre amendements ne sont pas acceptés, l'IMF a une instance locale distincte, sous le même contrat de Proposition.**

---

## Constats élevés

### E-1 — AD-8 : « jamais sans clé » contredit le cas normal du paiement au guichet du cœur

- **Emplacement.** AD-8, Rule 2 : « sans clé, il ouvre une ligne de la file des écarts ».
- **Problème.** L'annexe C (« Reste dû »), FR-150, FR-161, FR-257 et l'amendement `paiement` du 13/11 exigent qu'un mouvement du cœur **sans paiement Prospera** (paiement fait au guichet du cœur) **réduise ou ferme la Créance** et invalide les liens ; c'est le critère de recette « un client ne peut pas payer deux fois ». Le cœur fictif en génère exprès (annexe C, « Mouvement de paiement »). Avec AD-8 tel qu'écrit, chaque paiement guichet devient un écart : la file explose et la Créance ne se ferme jamais.
- **Correction.** Remplacer la Rule 2 par :
  > `coeur-sfd` classe chaque mouvement du cœur : (a) il porte une clé d'origine Prospera (numéro de reçu, clé d'ordre) → il **confirme** le fait Prospera correspondant ; (b) il n'en porte pas et son canal n'est pas un canal Prospera → c'est un **mouvement d'origine cœur** : il s'applique à l'échéance par `(identifiant du prêt, numéro d'échéance)`, réduit ou ferme la Créance, sans écart ; (c) il devrait porter une clé (canal collecte, Mobile Money, remise) et n'en porte pas, ou la clé est inconnue → ligne de la file des écarts. Jamais un rapprochement « au plus proche » ; l'IA (FR-199) ne propose que les doublons probables et un humain applique.
  Et unifier les clés : la convention « `<code>:<objet>:<id>` » d'AD-8 et le « numéro de reçu » du PRD sont deux clés pour une collecte ; dire que le **numéro de reçu est la clé d'origine** d'une collecte, d'un remboursement saisi et d'une annulation de collecte.

### E-2 — AD-2 / AD-3 / AD-24 : le plafond d'usure et les paramètres réglementaires sont possédés par un module qui arrive après février

- **Problème.** AD-2 donne à `conformite-bceao` les « paramètres réglementaires datés » ; `produits-financiers` « lit » le plafond sans écrivain nommé. Or `produits-financiers` et `credit` sont ★ et leur C13 exige « plafond d'usure daté publié » ; `conformite-bceao` est après février (AD-24) et **aucune flèche de dépendance** ne lie `produits-financiers`/`credit` à lui (AD-3). Sans plafond, `usure-bloquante` et `produits-conformes` ne peuvent pas passer. De plus FR-189 fait contrôler **a posteriori tout le portefeuille** par `conformite-bceao`, ce qui exige un TEG : AD-11 ne cite pas `conformite-bceao` parmi les utilisateurs de la bibliothèque (risque d'un second calculateur de TEG, le défaut qu'AD-11 veut empêcher).
- **Correction.**
  > Les **paramètres réglementaires datés** (plafond d'usure par pays et catégorie, classes et barème de provision, seuils CENTIF, durées de conservation, périodicités) sont **possédés par `produits-financiers`** (seul écrivain de la table réglementaire, validée par le DG, FR-195) jusqu'à l'arrivée de `conformite-bceao`, puis lus par tous par `produits-financiers.parametre-reglementaire.changed@1`. `conformite-bceao` y ajoute le statut juridique (« vérifié par un juriste ») sans en être propriétaire. AD-11 : ajouter `conformite-bceao` aux utilisateurs de `prospera-plateforme/finance` (contrôle a posteriori, FR-189) ; un prêt dont le TEG ne peut être calculé est « TEG indéterminé ».
  Retirer `conformite-bceao.parametre.changed@1` du catalogue ou lui donner ce rôle, mais pas les deux.

### E-3 — Absence de toute décision sur le relais Money Vibes (FR-158, FR-258, FR-263, addendum §6)

- **Problème.** La spine ne cite le relais que comme destination d'AD-9 et comme lieu d'ancrage d'AD-17. Or c'est une **unité à construire** (file de notifications PI-SPI, FedaPay, WhatsApp ; page du lien de paiement ; jeton opaque, usage unique ; accusé après écriture ; purge à 7 jours ; rapprochement avec le relevé ; Money Vibes sous-traitant) et elle n'est dans aucune des quatre unités de la spine du moteur (AD-2). Plusieurs divergences en découlent : (1) la spine paiement AD-9 dit que la page de lien est **rendue par `paiement-service`** ; ici elle l'est par le relais, sans amendement ; (2) pour qu'une page affiche « déjà payé » ou le montant relu, le relais doit connaître l'état du lien : qui le pousse (l'instance appelle le relais en sortie, ce qui est permis, mais la spine ne le dit pas) ; (3) le PRD FR-263 dit « aucun nom, aucune donnée de client », l'addendum §6 dit « prénom et montant » ; (4) FR-268 parle d'un **miroir** de listes de sanctions, la spine d'AD-22 dit « le relais ».
- **Correction.** Ajouter une AD :
  > **AD-26 — Le relais Money Vibes** : une unité de la plateforme Money Vibes (service `relais-service`, une base à part, un propriétaire), seul écrivain de la file des événements entrants et des états de liens. L'instance **publie** vers lui (sortie 443 déclarée) l'état de chaque lien (jeton opaque, montant, expiration, usage unique, état), et **tire** les événements entrants ; elle n'acquitte qu'après écriture ; le relais n'acquitte le fournisseur qu'après écriture durable ; rejeu par `(fournisseur, identifiant d'événement)` ; purge à 7 jours (annexe D). Le lien ne porte **aucun** nom (alignement sur FR-263 ; corriger l'addendum). Un écart avec le relevé du fournisseur entre dans la file des écarts de `paiement`. La page de lien est servie par le relais, jamais par l'instance : amender la spine `paiement` AD-9 en conséquence (voir E-9). Les listes de sanctions passent par un **miroir distinct** du relais.

### E-4 — Consentements : deux registres, aucune règle d'application (FR-15, FR-132, FR-260)

- **Problème.** Le PRD a deux couches : le consentement du **client** par finalité (fiche, `microfinance`) et le consentement de l'**IMF** (registre de l'agent, DG, moteur AD-13, vocabulaire de finalités fermé, copie signée, niveau d'apprentissage choisi, niveau 2 fermé). La spine range les consentements dans `microfinance` (AD-2) et cite moteur AD-14 sans jamais dire comment le client se combine à l'IMF : qui filtre le lot d'écarts, qui purge à un retrait, d'où vient le vocabulaire des finalités (C11 de chaque module). Risque : deux modules d'IA écrits avec deux notions du « consentement en vigueur ».
- **Correction (nouvelle Rule d'AD-14).**
  > Un écart n'entre dans un lot d'export que si **les deux** conditions sont vraies à l'instant de la préparation : (1) le registre de l'agent couvre la finalité (moteur AD-13 ; vocabulaire = finalités des clauses C11, fermé et versionné avec les contrats) ; (2) le client concerné a un consentement « IA commune » en vigueur (`microfinance.consentement.changed@1`). L'instance locale consomme ce fait et **retire de sa file d'export** les écarts du client avant d'écrire un retrait. Les groupes de moins de 5 sont retirés (moteur AD-14). La reconnaissance vocale n'est activée que sous un consentement propre (FR-207, FR-260). Le niveau d'apprentissage choisi est un champ du registre de l'agent, jamais un paramètre de module. Test : un lot, un retrait, zéro ligne résiduelle.

### E-5 — Restauration et reprise après sinistre : AD-5 ne couvre que les ordres

- **Problème.** Le moteur définit la restauration comme une nouvelle `epoque` (Connecteurs AD-16, moteur AD-16 : RPO 1 h). La spine ne traite que les ordres de la dernière heure (AD-5). Elle ne dit rien sur : (a) AD-17 déclare « une tête qui recule est une anomalie du signal » — une restauration légitime fait reculer la tête ; l'alerte devient permanente ou le vrai trucage passe inaperçu ; (b) les **numéros de reçu** « sans trou par collecteur » (FR-135) et les plages d'appareil d'AD-19 : après restauration, un compteur restauré en arrière réémet des numéros déjà remis à des clients sur papier ; (c) les envois non acquittés de la file d'envoi (remboursements, remises, annulations) ; (d) la fenêtre « 60 minutes » est écrite en dur, alors que PRD FR-267 la fait égale au RPO (annexe D « fenêtre de rapprochement des ordres »).
- **Correction (nouvelle Rule d'AD-5, ou AD-27).**
  > Après une restauration (nouvelle `epoque`) : (1) la fenêtre de rapprochement est le paramètre d'annexe D, au moins égal au RPO, et couvre les **ordres, les envois de la file d'envoi et les remises** ; (2) `AD-17` : la tête d'une piste est publiée avec son `epoque` ; un recul avec **changement d'époque** n'est pas une anomalie, un recul **dans** l'époque en est une ; (3) l'allocation des numéros de reçu est croissante et non réutilisable : après restauration, la prochaine plage allouée démarre au-delà du maximum déclaré par les appareils à leur reconnexion ; tout numéro vu chez le client mais absent du serveur est un trou déclaré (FR-135) ; (4) les files d'export de l'IA sont vidées et reconstruites.

### E-6 — AD-19 : le hors ligne ne décide ni le point d'entrée de synchronisation, ni l'appareil perdu, ni l'heure

- **Problème.** Le diagramme envoie `TER --> IMF` seulement. Or une synchronisation mélange des objets de plusieurs services : collectes (`imf`), visites et missions de recouvrement (`terrain`, `recouvrement`), fiches (`microfinance`), brouillons (`credit`). FR-136 impose « collectes avant visites » et FR-204 « visites urgentes de recouvrement en premier ». Rien n'est dit sur : le point d'entrée (une route `/sync` par module ? un orchestrateur ?), l'échec partiel d'un lot, la clé d'idempotence par élément. **Appareil perdu** : FR-136 (« la file est envoyée avant l'effacement ») et FR-204 (« refuse toute synchronisation de cet appareil ») se contredisent, avec de l'argent liquide en jeu ; AD-19 reprend « appareil perdu » sans trancher. **Heure** : FR-136 range « l'heure de l'appareil » ; AD-19 ne dit pas qu'elle n'est jamais utilisée pour les contrôles (délai de 7 jours, ordre des écritures, fraîcheur).
- **Correction (à ajouter à AD-19).**
  > Chaque service reçoit ses éléments par **sa propre route** de synchronisation ; l'application les envoie dans l'ordre collectes, puis missions urgentes, puis le reste, chaque élément portant sa clé d'idempotence ; un échec n'invalide que l'élément. Le serveur **horodate à la réception** ; l'heure de l'appareil est conservée comme « heure déclarée » et ne sert à aucun contrôle de délai. Un appareil déclaré **perdu** : sa session est révoquée, la synchronisation de **ses collectes en file** est refusée par défaut mais **mise en quarantaine** (état `A_ARBITRER`, lisible du RA seul) : le RA décide d'en reprendre ou non le montant ; rien n'est ni perdu ni accepté en silence. Décision PO requise : **à valider** (FR-136 contre FR-204).

### E-7 — AD-22 contredit AD-9 : les faits exposent déjà une correspondance et une alerte CENTIF

- **Problème.** AD-22 : « aucune route ni aucun fait ne les expose à un autre rôle (pas même un compteur) ». AD-9 publie pourtant `microfinance.sanctions.correspondance@1` et `microfinance.alerte-centif.creee@1`. De plus la garde de décaissement de `credit` (FR-66 : « pas de blocage LBC/FT ») doit lire un état ; si elle lit la correspondance, le CC et le CPT apprennent qu'il existe un soupçon (le client « ne doit jamais être informé », FR-121). La procédure « correspondance confirmée » (3 étapes tracées, gel décidé par le DG, déclaration hors Prospera, délais paramétrés) n'a ni fait ni propriétaire.
- **Correction.**
  > Retirer `microfinance.sanctions.correspondance@1` et `microfinance.alerte-centif.creee@1` du catalogue **bus** (elles restent dans la collection protégée). Publier à la place `microfinance.client.bloque@1` / `microfinance.client.debloque@1` portant un **code neutre** `BLOCAGE_CONFORMITE` (sans motif, sans liste, sans score). Les gardes de `credit`, `collecte` et `coeur-sfd` lisent seulement ce fait. La demande de gel part au cœur par `microfinance.gel.demande@1` (consommé par `coeur-sfd` seul). `notification` ne reçoit jamais le motif. Test : un CC et un CPT ne trouvent la correspondance dans aucune route, aucun message, aucun journal d'accès autre que celui de l'AUD.

### E-8 — AD-18 / Deferred : le mécanisme de chiffrement par champ est renvoyé à une story alors qu'il impose des choix communs

- **Problème.** Quatre modules stockent des champs sensibles (`microfinance` : pièces, téléphones ; `credit` : GPS et photos de visite, cautions ; `collecte` : GPS, téléphones ; `caisse`), l'application terrain en garde sur le téléphone. Le chiffrement champ par champ **casse l'égalité et la recherche** : FR-116 (une personne, une fiche, pièce unique), FR-123 scénario (6) (même téléphone chez plusieurs clients), FR-121 (refiltrage de tout le fichier contre les listes). Il impose donc un **index aveugle** (empreinte déterministe à clé) et une **enveloppe commune** pour que les modules ne divergent pas. Autre effet non traité : un coffre qui exige **le DG et le DAF ensemble** bloque le démarrage des services après chaque redémarrage ou restauration ; le RTO de 4 h devient celui de ces deux personnes.
- **Correction.**
  > AD-18 fixe maintenant : bibliothèque commune `prospera-plateforme/champs-sensibles` (enveloppe : version de clé, nonce, texte chiffré), **index aveugle HMAC** pour les champs interrogeables par égalité (pièce, téléphone), clés de données **enveloppées** par une clé maîtresse du coffre ; le déverrouillage DG + DAF se fait **une fois** (scellement de la clé maîtresse en mémoire du service), avec une procédure de redémarrage documentée au manuel d'exploitation (FR-265) et mesurée dans le RTO. La rotation et le choix de la bibliothèque restent à la story de pointe.
  Ajouter au Deferred seulement : « bibliothèque et rotation ».

### E-9 — AD-6 / AD-25 : la spine paiement n'est pas amendée, alors que ses AD-2, AD-3 et AD-9 sont heurtés

- **Problème.** (a) paiement AD-2 : `montantOrigine` figé, un montant différent est une anomalie ; AD-3 : ledger append-only ; AD-18 : seul `montantImpute` bouge le solde. AD-6 de la spine IMF dit que le montant exigible « se recale sur la lecture du cœur » et que `paiement` applique les mouvements du cœur « comme composantes et réductions ». Sans règle, ce recalage soit réécrit le montant d'origine, soit se confond avec un encaissement. (b) paiement AD-9 (page de lien rendue par le service) contredit le relais (E-3). (c) paiement AD-11 refuse avec `SEPARATION_POUVOIRS_VIOLEE` ; AD-15 de la spine IMF impose `SEPARATION_DES_TACHES` y compris pour « saisie / validation d'un paiement » : deux codes, pour la même règle, sur la même ligne de paiement. (d) AD-25 ne liste aucun changement de la spine paiement.
- **Correction.**
  > AD-6 : le recalage est un **ajustement en ajout seul** `AJUSTEMENT_COEUR` (composante, signe, `lueLe`, clé d'origine du cœur) sur la Créance ; `montantOrigine` n'est jamais réécrit ; un ajustement n'est pas un encaissement et ne touche pas `montantImpute`. AD-15 : le code est `SEPARATION_DES_TACHES` partout dans ce périmètre, sauf là où `paiement` refuse lui-même (`SEPARATION_POUVOIRS_VIOLEE`) : la table des deux codes est donnée, et le front traite les deux comme une seule famille.
  AD-25, ajouter : « `paiement` (spine) : AD-2/AD-3 (source `ECHEANCE_DE_PRET`, ajustement du cœur, écart de rattachement par type de créance) ; AD-9 (page de lien servie par le relais pour une instance sur site) ; réservation du `Mobile Money sortant` ».

### E-10 — Licence à vie, gel et version figée : aucune règle ne dit comment arrive un correctif réglementaire

- **Problème.** AD-30 est cité avec « licence à vie : PRD FR-261 », mais aucune AD n'en tire de règle. Le PRD fixe : jamais de suspension (refusée par le poste central avec un code nommé), gel à J+30 qui ne bloque que les installations et mises à jour, version figée si la maintenance n'est pas payée, **correctifs réglementaires** (plafond d'usure, listes, textes BCEAO) livrés sous contrat, avant la date d'effet du texte. Le moteur ne connaît que le correctif de sécurité (AD-31 : CVSS ≥ 9 ou exploité ; « jamais de migration ») : un correctif réglementaire n'est pas « critique » ; une instance figée ou gelée ne le recevrait donc pas, et l'IMF continuerait à accorder au-dessus d'un nouveau plafond. La spine doit au moins dire quel chemin porte le paramètre réglementaire.
- **Correction (nouvelle AD ou Rule d'AD-21).**
  > Les paramètres réglementaires (E-2) sont **livrés comme des données signées de la ligne de version** (moteur AD-7), appliquées à l'essai puis validées par le DG (FR-195) ; ils ne portent aucune migration. Sur une instance gelée, ils passent **par fichier** ; sur une instance en version figée, l'absence de contrat de maintenance les bloque et le bandeau « paramètre réglementaire en retard : plafond en vigueur au [date] » s'affiche aux rôles de conformité et au DG. Demande d'amendement au moteur : AD-31 doit nommer le **correctif réglementaire** (jamais critique, jamais sans date d'effet) à côté du correctif de sécurité. Le refus de suspension d'une licence à vie est un **code nommé** de la centrale (`LICENCE_A_VIE_NON_SUSPENDABLE`), à déclarer dans AD-25.

---

## Constats moyens

### M-1 — AD-15 : liste incomplète des combinaisons interdites, et données manquantes pour les vérifier

- **Problème.** FR-82 interdit aussi : créateur du dossier = auteur de l'avis du CC ; instructeur = autorisateur du décaissement ; changement de bénéficiaire à deux personnes dont aucune n'a émis l'ordre (FR-64) ; membre du comité en conflit ; collecteur = contresignataire de sa remise (FR-138) ; déclarant d'un paiement Mobile Money = valideur (FR-140). De plus « à partir de la piste d'audit du dossier » ne suffit pas : le visiteur d'instruction vient de `terrain`, le créateur et le valideur de la fiche de `microfinance` ; `credit` ne peut vérifier que si ces identités sont portées par `terrain.visite.changed@1` et `microfinance.client.changed@1`.
- **Correction.** Remplacer la liste d'AD-15 par « **la table des combinaisons interdites** de FR-82, FR-6, FR-64, FR-138, FR-140, tenue comme **une donnée versionnée de `credit`**, un test par ligne » et ajouter : « Les faits `microfinance.client.changed@1` et `terrain.visite.changed@1` portent `creePar`, `valideePar`, `visitePar` (références d'acteur) pour que la vérification se fasse sans lire la base d'autrui. »

### M-2 — AD-17 : l'ancrage de la tête d'audit passe par « le relais », ce que le moteur n'a pas prévu

- **Problème.** Le signal hebdomadaire est un schéma fermé (moteur AD-9) ; un champ « tête de piste » doit y être déclaré, et le canal est celui de la centrale, pas du relais (« l'instance tire »). Addendum §4 laisse aussi « un dépôt choisi par l'IMF ». La fréquence réelle de dépôt (le signal est hebdomadaire) laisse sept jours d'exposition.
- **Correction.** « L'agent joint la tête de chaque piste à la **vérification quotidienne** (moteur AD-9) ; la centrale la garde ; le relais n'est pas concerné. Le champ est ajouté au schéma de `instance.indicateurs` (AD-25) ; il ne porte ni identité ni contenu. Un dépôt choisi par l'IMF est un complément, pas un substitut. »

### M-3 — FR-165 : le cœur coupé n'a ni règle ni liste de commandes suspendues

- **Problème.** La spine nomme `COEUR_INDISPONIBLE` et `DONNEES_DU_COEUR_ANCIENNES` mais ne dit pas quelles commandes sont suspendues (décaissement, lien de paiement, remise, annulation) ni lesquelles continuent (instruction, comité, relances sur la dernière échéance). Test cité : « cœur coupé 3 jours ».
- **Correction.** Ajouter à AD-1 : « Cœur indisponible (aucune lecture réussie depuis le double de la fraîcheur par défaut) : sont refusées avec `COEUR_INDISPONIBLE` les commandes qui **engagent de l'argent** — ordre de décaissement, lien de paiement, marquage « exécuté » — ; continuent l'instruction, le comité (le dossier atteint EN_GESTION), les relances sur la dernière échéance connue (sauf client « en attente du cœur »), la collecte hors ligne. L'envoi attend dans la file d'envoi, dans l'ordre. »

### M-4 — AD-7 : ordre et séquence des mouvements absents ; passage futur à Connecteurs non cadré

- **Problème.** L'addendum §1 fixe « mouvements d'un même prêt appliqués dans l'ordre de leur date d'effet, trou de séquence = ligne de la file, pas un blocage » ; FR-161 demande l'intégration d'un mouvement antidaté avec recalcul des jours de retard. AD-7 n'en dit rien. D'autre part `coeur-sfd` implémente « la file d'envoi acquittée (Connecteurs AD-8) » alors que `connecteurs-service` existe ailleurs, est hors février et exige un propriétaire par domaine (Connecteurs AD-3) ; à l'arrivée du vrai connecteur il y aurait deux files.
- **Correction.** Ajouter à AD-7 : « Les mouvements d'un prêt s'appliquent par date d'effet ; un antidaté déclenche le recalcul des jours de retard ; un trou de séquence ouvre une ligne d'écart, sans bloquer. `TransportCoeur` est **la couture** où se branche un adaptateur de Connecteurs (kit-cible) : la file d'envoi, la file des écarts et la fraîcheur restent dans `coeur-sfd` ; `domainesEchange` du manifeste A.6 est la liste des domaines qu'un propriétaire autre que Prospera peut prendre. »

### M-5 — AD-3 : une image, sept modules ; retour arrière et migrations par module non traités

- **Problème.** Le moteur promeut et revient en arrière **par image** (AD-11, AD-33). Avec un service de sept modules, la fenêtre de retour arrière est celle du module le plus contraint ; une migration non réversible de `credit` empêche le retour de `collecte`. Le PRD déclare `retourArriere: SANS_PERTE` par module (C12), ce qui ne tient que si chaque migration l'est réellement. L'interrupteur par module ne descend pas d'un étage.
- **Correction.** Ajouter à AD-3 : « La version d'image de `prospera-imf-service` est unique ; son `retourArriere` est le **plus restrictif** de ses modules ; une migration non `SANS_PERTE` d'un module bloque la promotion de toute l'image et est refusée en CI. Un module activé par interrupteur ne migre pas sans être activé. »

### M-6 — AD-4 / Conventions : groupe solidaire, comptage des statuts et statut inventé

- **Problème.** (a) AD-4 dit « 12 statuts + ANNULE et REFUSE » ; le PRD (FR-78) : douze statuts **dont REFUSE**, plus ANNULE ; le chemin nominal en compte onze. (b) Le sous-état de décaissement est **par membre** pour un groupe (FR-73) ; le groupe n'est CONFIRME que quand tous le sont : ni AD-4 ni AD-5 ne le disent. (c) La convention « Statuts » donne `EN_ATTENTE_COEUR` comme un nom du PRD : il n'y figure pas (0 occurrence) ; le PRD a DECLAREE / ENVOYEE / CONFIRMEE / REFUSEE (collecte) et « à envoyer, envoyé, en attente du cœur, confirmé, refusé » (remboursement). `EN_ATTENTE` est déjà l'état de validation du comptable pour le Mobile Money (FR-140).
- **Correction.** AD-4 : « douze statuts, REFUSE compris, plus ANNULE (table 1 de FR-78) ; sous-état par membre pour un dossier de groupe, le groupe n'est CONFIRME que quand tous le sont (FR-73). » AD-1 : remplacer `EN_ATTENTE_COEUR` par « l'état `ENVOYEE` d'un fait Prospera ; affichage « en attente du cœur » » et corriger la convention.

### M-7 — AD-5 : « un seul canal » contre la réémission par un autre canal

- **Problème.** FR-64 : un ordre rejeté se réémet avec la même clé « ou, après rapprochement, par un autre canal ». AD-5 : « un ordre a un seul canal ». La clé étant la même et le fournisseur différent, il faut dire quand c'est légal.
- **Correction.** « Le canal d'un ordre ne change que depuis À_ORDONNER, après un rapprochement qui a établi qu'aucune exécution n'a eu lieu ; la clé est inchangée ; le changement est une entrée d'audit à deux personnes. » Et remplacer « 60 minutes » par « la fenêtre de rapprochement (annexe D ; défaut 1 h, égale au RPO) ».

### M-8 — AD-14 : mise à jour de modèle, niveau d'apprentissage, essai

- **Problème.** La spine dit « mises à jour de modèle … par le même tunnel, signées, en calibration sœur ». Moteur AD-14 : « artefact signé de la ligne de version (AD-7), jamais autrement ». FR-260 / FR-262 : appliquée **dans l'espace d'essai avant promotion**, versionnée, retirable.
- **Correction.** « Le tunnel est le **transport** ; l'artefact est celui de la ligne de version, vérifié hors ligne (moteur AD-7), appliqué à l'essai, puis promu à la date choisie par l'IMF ; retirer un modèle repointe sur la calibration précédente (moteur AD-39). »

---

## Constats faibles

- **F-1** — AD-7 : « 29 objets » ; l'annexe C en liste 27 (compté ligne par ligne). Écrire « les objets de l'annexe C » sans nombre, ou 27.
- **F-2** — Inherited : « dédoublonnage par `eventId` (avec `epoque`) » est attribué à moteur AD-27 ; `epoque` vient de Connecteurs AD-16, pas d'AD-27. Citer les deux.
- **F-3** — Diagramme d'AD-3 : `credit` n'a pas de flèche vers `reseau` alors que C10 du PRD l'exige ; `prospera-terrain` ne parle qu'à `imf` alors que visites et recouvrement sont des modules partagés (voir E-6) ; `paiement`, `notification` et `terrain` ne figurent pas.
- **F-4** — Le PRD (FR-8, p. « L'IA propose ») renvoie à « spine microfinance, AD-12 » ; dans cette spine c'est AD-14 (AD-12 est la version figée). Corriger le renvoi du PRD, ou ajouter `AD-12` dans la ligne Binds d'AD-14 pour ne pas laisser un lien mort.
- **F-5** — AD-22 : « listes … par le relais » ; FR-268 : source ou **miroir tenu par Money Vibes** ; le relais est une file d'événements (voir E-3).
- **F-6** — Stack : le client Kafka est celui du moteur pour les nouveaux services ; `paiement` reste en `kafkajs` jusqu'à la version de plateforme 1.0 : dire que le catalogue AD-9 est consommé par les deux clients sans changer de schéma (JSON Schema Karapace), et que chaque fait d'AD-9 est enregistré dans Karapace avec un test de contrat joué des deux côtés (moteur AD-17).
- **F-7** — `.memlog.md` : il n'enregistre ni la comparaison avec les C5 du PRD (le tableau d'AD-9 en retire 25 noms) ni la décision sur le relais ; à compléter lors de la correction de C-2 et E-3.

---

## Exigences du PRD non tenues par la spine

| # | Exigence du PRD | Où | État dans la spine |
|---|---|---|---|
| 1 | Projection du solde = encours officiel + mouvements postérieurs, égale au solde de contrôle au franc près (FR-161) ; schéma et import des objets prêt, échéance, garantie, épargne par la Reprise (FR-196 à FR-198, A.6 `objetsDeReprise`) | §4.2, §6.5, §6.9 | Pas de propriétaire des projections ; Reprise différée sans point d'import dans AD-24 (C-1) |
| 2 | Toutes les lignes de l'annexe C (27 objets) ont un déclencheur et un retour : plan d'étalement, contentieux, perte, création de client, ouverture de compte d'épargne, dépôt de garantie, classe officielle, produit, agence, remise, annulation de collecte | annexe C, FR-152, FR-220, FR-221 | Noms absents d'AD-9 (C-2) |
| 3 | Mouvement du cœur sans paiement Prospera = ferme la Créance, pas un écart (FR-150, FR-257, amendement `paiement`) | §4.2, FR-257 | AD-8 l'interdit (E-1) |
| 4 | Plafond d'usure daté disponible dès la simulation (FR-10) ; contrôle a posteriori du portefeuille par un TEG unique (FR-189) ; paramètres réglementaires par pays (FR-195) | §4.8, §6.8 | Propriétaire non disponible en février, AD-11 sans `conformite-bceao` (E-2) |
| 5 | Relais Money Vibes : unité, file, accusé après écriture, rapprochement avec le relevé, sous-traitance, purge 7 jours, liens sans nom (FR-158, FR-258, FR-263) | §7.9 | Aucune AD ; contradiction avec paiement AD-9 (E-3, E-9) |
| 6 | Consentement du client par finalité **et** de l'IMF (FR-15, FR-132, FR-260) ; niveau d'apprentissage ; retrait qui arrête l'envoi ; reconnaissance vocale sous consentement propre | §4.10, §7.8 | AD-14 ne relie pas les deux registres (E-4) |
| 7 | Reprise après restauration : ordres, envois, remises, numéros de reçu sans trou, tête d'audit (FR-135, FR-267, NFR-4, NFR-6) | §6.3, §7.9 | Seuls les ordres sont traités (E-5) |
| 8 | Hors ligne : file d'appareil, appareil perdu, heure de l'appareil, ordre de synchronisation (FR-136, FR-204, NFR-8) | §6.3, §7.1 | Règles partielles dans AD-19 (E-6) |
| 9 | LBC/FT : secret au serveur, procédure « correspondance confirmée » en trois étapes, gel demandé et lu du cœur, client jamais informé (FR-121 à FR-123) | §6.2 | AD-22 contredit AD-9 ; pas de fait de gel (E-7) |
| 10 | Chiffrement par champ avec recherche par égalité (FR-116, FR-123(6), FR-121), clés ouvertes par DG + DAF (FR-5) | §4.4 | Différé à une story ; démarrage et RTO non traités (E-8) |
| 11 | Licence à vie, gel J+30, version figée, correctifs réglementaires sous contrat avant la date d'effet (FR-261, FR-262) ; refus de suspension avec code nommé | §7.9 | Cité, non décidé ; AD-31 du moteur ne connaît pas le correctif réglementaire (E-10) |
| 12 | Séparation des tâches complète (FR-82, FR-64 changement de bénéficiaire, FR-138 contresignature, FR-140) ; alertes d'audit | §4.4, §5.12 | Liste partielle ; données de vérification non portées (M-1) |
| 13 | Cœur indisponible : quelles décisions sont suspendues (FR-165) | §6.5 | Codes d'erreur sans règle (M-3) |
| 14 | Groupe solidaire : sous-état de décaissement par membre (FR-73) | §5.9 | Absent (M-6) |
| 15 | Image unique de sept modules et retour arrière en un clic (FR-262, C12) | §7.9 | Non traité (M-5) |
| 16 | Provenance (« règle » ou « modèle »), mot « IA » réservé au modèle (FR-8) ; mises à jour de modèle essayées à l'essai (FR-260, FR-262) | §4.6, §7.8 | `MODELE` n'existe pas dans le contrat parent ; essai non mentionné (C-3, M-8) |
| 17 | Ordre et séquence des mouvements ; antidatés ; trou de séquence (addendum §1, FR-161) | §6.5 | Absent d'AD-7 (M-4) |

## Vérification des citations d'AD parents

| Citation de la spine | Verdict |
|---|---|
| Moteur AD-9 (amendé) : 443 sortant vers noms déclarés, `destinationsSortantes`, aucun port entrant, gel 30 j | **Exact** (le texte parent contient l'amendement du 13/11). |
| Moteur AD-12 : `instance.journal` écrit par l'agent seul | **Exact** ; l'usage fait en AD-17 (tête sur `instance.indicateurs`, dépôt « relais ») n'est pas prévu : voir M-2. |
| Moteur AD-14 (niveaux, jeton d'export, préparation sur l'instance) et AD-39 (calibration sœur) | **Exact** ; mais la règle « modèle commun = artefact de la ligne de version, jamais autrement » est omise (M-8) et le registre des consentements d'AD-13 n'est pas cité (E-4). |
| Moteur AD-27 : client Confluent, Karapace, partition par `organisationId`, dédoublonnage `eventId` | **Exact** pour le client et le registre ; « avec `epoque` » vient de Connecteurs (F-2). |
| Moteur AD-30 : maintenance, version figée, N/N-1 | **Exact** ; aucune règle n'en est tirée (E-10). |
| Moteur AD-2, AD-10, AD-15, AD-16, AD-24, AD-17 | **Exacts** sur le sujet cité. |
| Paiement AD-2 (créance projetée par upsert) | **Exact** ; mais AD-6 de la spine IMF heurte `montantOrigine` figé (E-9). |
| Paiement AD-11 (séparation au niveau de l'acteur) | **Exact** ; code de refus différent (`SEPARATION_POUVOIRS_VIOLEE`) (E-9). |
| Paiement AD-1, AD-3, AD-8 | **Exacts** (aucune détention de fonds ; ledger append-only ; entiers d'unité mineure et devise). |
| Assistant AD-1 « origine `REGLE` ou `MODELE` » | **Faux** : la spine assistant écrit `LANGAGE | REGLE` (C-3). |
| Assistant AD-2 (décideur typé HUMAIN, REGLE, MANDAT) | **Exact**. |
| Assistant AD-11 (stratégies typées, facteurs obligatoires) | **Exact** ; implique qu'un modèle non explicable ne s'enregistre pas (C-3). |
| Assistant AD-21 (le fournisseur de modèle est un port) | **Exact** sur le port ; **inconciliable** avec « modèle de production auto-hébergé sur l'infrastructure Money Vibes » pour une instance sur site (C-3). |
| Reprise AD-3, AD-5, AD-13 ; Connecteurs AD-4, AD-5, AD-8, AD-13 | Numéros cohérents avec les titres lus (clé d'origine ; règles chez la cible ; réconciliation ; jamais un total ; identité ; file d'envoi ; concordance). |

## Autres points de la grille (sans constat)

- **Pile technique** : versions Node 24, NestJS 11, Mongoose 8, MongoDB 8.0, Confluent 1.11, Karapace 6.2, BullMQ 6.7 héritées du moteur ; mesure de `kafkajs 2.2.4` cohérente. Les deux lignes `[ASSUMPTION]` (Flutter, rendu PDF) sont acceptables car épinglées à une story de pointe.
- **Enveloppe d'exploitation** : décrite (déploiement, environnements, dimensionnement ×10, supervision). Manque seulement la supervision **locale** de l'échange avec le cœur, du tunnel de l'IA et de la licence que FR-265 demande lisible sans internet.
- **Ports 3406 à 3408** : sans collision avec les ports réservés du moteur (3401 à 3405).
