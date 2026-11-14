# Arbitrages sur les relectures de la spine de l'IA commune (2026-11-13)

Pris par l'assembleur sur délégation du PO. Ils font foi pour la correction. Sources : `reviews/review-adversarial.md` (C-1 → C-7, H-…) et `reviews/review-rubric.md`. Replier aussi dans la spine les arbitrages du `.memlog.md` (centrale :3418, faits `ia.prediction.enregistree@1` et `<module>.realite.constatee@1`, N0 en données et ONNX, `llama-server`, échantillon aveugle).

## Relecture adversariale (toutes les Rules proposées sont retenues)

- **C-1** `ia` est le **seul écrivain** du statut d'une proposition ; la décision humaine arrive comme une commande qui porte `decideLe` ; une décision datée avant `expireLe` corrige l'expiration.
- **C-2** Une seule proposition par demande (clé d'idempotence `demandeId`, capacité, objet) : le chemin synchrone et le chemin asynchrone rendent **la même** proposition ; l'écart est enregistré une fois par proposition.
- **C-3** « Qui avait raison » : **source unique de l'horizon = le pack de secteur** (la fiche de capacité y renvoie) ; la réalité porte `definitive` ; le classement est calculé **une seule fois, sur l'instance**, par `ia` ; seules les réalités définitives sont exportées ; la centrale ne reclasse jamais ; « l'autre niveau » en ombre est défini (la proposition en ombre est enregistrée, jamais montrée).
- **C-4** Tout artefact qui peut changer une proposition (modèle, pack, gabarit, jeu de référence, calibration) porte une **classe d'effet signée**, vérifiée par l'agent ; tout ce qui change une proposition passe par le plan de promotion et la **date du DSI** ; la calibration nocturne ne s'active que dans une **fenêtre autorisée par le DSI** et dans ses bornes ; un correctif d'urgence ne peut que **couper ou revenir**, il est signé par Money Vibes et jamais auto-déclaré.
- **C-5** Un seul agrégat d'exécution, un seul compteur de mandat, un seul propriétaire : **`assistant`**. `automatisations` ne possède que ses règles et ses déclencheurs ; il **demande** une exécution à `assistant` ; un seul jeu de faits d'exécution.
- **C-6** Un type d'action « autonomisable » est vérifié contre la **liste des objets interdits** (crédit, garantie, sinistre, paiement, refus, blocage) ; une étiquette posée par une règle ne peut **jamais** déclencher un blocage (un blocage vient d'un humain ou d'une règle métier déclarée par le client).
- **C-7** L'identité d'une capacité est **`(secteur, code, majeure)` partout** : demande, proposition, prédiction, écart, cache ; un artefact par secteur ; une famille transverse est publiée en artefacts distincts par secteur consommateur.
- **H-3** Les attributs d'équité suivent un chemin propre : consentis, stockés à part, **jamais une entrée de modèle**, utilisés seulement pour la mesure (voir K-2).
- **H-5** La valeur retenue d'un écart d'extraction ne sort jamais : seul l'indicateur juste / faux / corrigé sort.
- **H-7** Un pack de secteur ne contient **aucun code** : gabarits et formules dans un langage déclaratif fermé (liste finie d'opérations), vérifié à l'installation.
- Les autres constats HAUTE et MOYENNE s'appliquent s'ils ne contredisent pas ces arbitrages.

## Relecture selon la grille

- **K-1** La validité d'un modèle se vérifie **une seule fois, à l'installation** ; un modèle installé sert **indéfiniment** (licence à vie, gel) ; il ne tombe que par **révocation** ou par le **fichier d'urgence**.
- **K-2** Une classe d'export **« agrégats de mesure »** : calculée sur l'instance, comptages par sous-groupe avec effectif minimal `k`, finalité consentie ; c'est elle qui alimente la porte d'équité de la centrale.
- **Amendements du moteur** à compléter (et à lister dans l'AD de synthèse) : AD-9 (signal fermé de l'IA), AD-12 (types du journal), AD-13 (finalité « apprentissage commun » et « agrégats de mesure »), AD-14 (le **niveau « apprentissage » est un niveau à part**, distinct de 0-3, avec un **manifeste approuvé une fois au contrat** — écrit comme amendement explicite), AD-22 (cible de la ligne de modèles, date du DSI), AD-28, AD-37 (commande de retour arrière d'un modèle).
- **En ligne** : modèle de langage **ouvert hébergé chez Money Vibes** par défaut (souveraineté, AD-21 de l'assistant) ; fournisseur externe seulement avec l'accord du client, par la passerelle.
- **Centrale** : exploitée sur l'infrastructure de Money Vibes ; sauvegarde du registre de modèles et des fiches de composition ; supervision par le moteur (AD-40) ; l'API de réception est écrite en **NestJS** (une seule implémentation de la vérification des clés) ; l'entraînement est en Python, à part.
- **Préparateur en ligne** : propriétaire `ia`.
- **Compose** : `llama-server` est un service du projet Compose de l'instance (moteur AD-10), pas un projet à part.
- Corriger « exactement sept » ; les amendements des spines sœurs (faits `prediction`/`realite` dans les manifestes des quatre logiciels) sont des actions listées, à porter aux manifestes.
