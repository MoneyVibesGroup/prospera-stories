# Addendum W1 : choix techniques renvoyés hors du PRD

- Contrat de proposition : schéma unique versionné ; immuabilité par chaînage de condensats ; expiration par travail BullMQ idempotent, jamais calculée à la lecture (reprise de l'assistant AD-1).
- Décideur typé HUMAIN | REGLE | MANDAT, aucune valeur SYSTEME (assistant AD-2). Mandat : compteur transactionnel réservé / confirmé / libéré (AD-6).
- Catalogue des types d'action versionné, défaut = engageant et irréversible (AD-4) ; contrôle de mode rejoué à l'exécution (AD-5).
- Registre à deux horloges : base séparée append-only (AD-16) ; trace opposable longue, contexte brut purgé court (IA-P10).
- Hors portée = 404, jamais 403 (AD-20) ; isolation par organisationId du jeton.
- Filtre « montant interdit » : liste blanche par volet appliquée côté serveur ET par écran ; code d'erreur nommé (à fixer en spine).
- Explication d'un score : facteurs issus du modèle décisionnaire lui-même (Shapley ou poids de règle), jamais d'un modèle de substitution ; codes de motifs.
- Équité : tests d'impact disparate avant déploiement, suivi mensuel par sous-groupe ; liste fermée de variables par client.
- Frameworks d'apprentissage fédéré / confidentialité différentielle : hors v1 (recherche : TFF inactif, Flower DP « preview », FLARE plus complet) ; versions figées en spine, pas en PRD.
- Registre de modèles à alias champion / challenger ; retour arrière = déplacement d'alias (recherche MLOps) ; ordre imposé hors ligne, ombre, canari, général, portes écrites avant l'essai.
- Passerelle de langage : masquage par motif et par champ, journal de chaque envoi, zéro rétention contractuelle ; modèle choisi par tâche, version figée par client.
- Le niveau « haut risque » du règlement européen est une référence ; numérotation des points de l'annexe à citer sur le texte officiel (non lu).
