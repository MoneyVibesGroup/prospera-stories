# Addendum — partie W2 (§5.0 à §5.7, FR-30 à FR-89)

Ce document range ce que le PRD renvoie hors de lui : choix techniques, pistes de mécanisme, options écartées. **Il ne crée aucune exigence.** Les exigences sont dans la partie 2 du PRD ; l'architecture (spine du module `sinistres`) tranchera les mécanismes. Chaque entrée dit d'où vient le renvoi.

## 1. La machine d'états du dossier (FR-30, FR-31, FR-33)

- **Retenu comme piste :** une table de transitions en données (depuis, vers, droit, conditions, motif obligatoire), lue par un seul moteur côté serveur ; l'écran l'interroge pour afficher les actions fermées et leur raison. Le test « aucune impasse » parcourt la table.
- **Écarté :** règles écrites dans l'interface (la démo les avait dans le navigateur, contournables) ; une machine par écran.
- **Journal :** ajout seul (aucune mise à jour, aucune suppression), une ligne par transition et par action ; piste d'une chaîne de hachage pour détecter une altération. Écarté : journal modifiable par `ADMIN`.

## 2. Numéros et références (FR-36, FR-37, FR-38)

- **Référence `DEC-` :** séquence atomique par année, générée au serveur ; un trou doit être détectable (contrôle de séquence). Écarté : numéro généré côté client ou par l'agent.
- **Numéro officiel :** le logiciel de la compagnie (LC) l'attribue ; le dossier attend le retour. Pistes pour le retour : appel direct si une interface existe ; sinon dépôt d'un fichier de déclarations (Excel ou JSON) et lecture d'un fichier de retour, avec **idempotence par la référence `DEC-`**. Écarté au premier jour : numéro provisoire « officiel » généré par Prospera (risque de collision avec la séquence du LC), sauf basculement du paramètre.
- **Doublon :** clé de comparaison normalisée (immatriculation sans espaces ni tirets, police, date, victime) ; correspondance déterministe d'abord. Écarté : correspondance floue sur les noms au premier jour (trop de faux positifs sur des noms courts ou répandus) ; piste pour plus tard.

## 3. Le moteur de décompte et ses référentiels (FR-69 à FR-75)

- **Référentiel versionné à date d'effet** : barème, SMIG, grilles de vétusté, tables du corporel, catalogue de prix ; un dossier est calculé avec la version en vigueur à sa **date de survenance**. Une évaluation arrêtée stocke **une copie des valeurs utilisées** (et non une simple référence), pour que rien ne bouge si le référentiel change. Écarté : constantes dans le code ; référence seule à la version (fragile si la version est corrigée).
- **Tables du corporel :** saisie **double** (deux saisisseurs indépendants, comparaison automatique, arbitrage) à partir des images du PDF officiel, puis jeux d'essai chiffrés. Écarté : reconnaissance optique des tableaux comme voie de saisie (risque d'erreur silencieuse sur des chiffres réglementaires).
- **Arrondi :** appliqué en fin de chaîne, une seule fois ; les étapes intermédiaires gardent leur précision. À régler dans la spine.
- **Ordre franchise / règle proportionnelle :** à trancher avec la compagnie ; le moteur doit permettre de changer l'ordre sans nouvelle version (étapes déclarées en données).

## 4. Les délais et le chronomètre réglementaire (FR-85, FR-48)

- **Moteur d'échéances** : chaque échéance a un point de départ, un point d'arrêt, des **suspensions** (cause, début, fin) et une nature (`REGLEMENTAIRE`, `INTERNE`, `SUIVI`). Le calcul se refait à chaque événement du dossier. Calendrier des jours ouvrés du Togo (jours fériés) à saisir comme référentiel ; convention de calcul des mois (même quantième ; dernier jour du mois si le quantième manque) à faire valider.
- **Pénalité de 5 % par mois :** base de calcul (indemnité totale, montant de l'offre, partie en retard) à faire trancher par le juriste ; le moteur doit pouvoir changer la base sans nouvelle version. Piste : une provision de risque de pénalité mise à jour chaque mois.
- **Écarté :** délais légaux modifiables par l'administrateur (ils relèvent du Code, pas du paramétrage de la compagnie).

## 5. L'IA des sections 5.1 à 5.7 (FR-35, FR-47, FR-53, FR-56, FR-58, FR-60, FR-64, FR-65, FR-74, FR-83)

- **Instance locale** de l'IA commune chez la compagnie ; aucune donnée nominative ni médicale n'en sort ; seuls des écarts anonymisés remontent par le tunnel sécurisé.
- **Repli par règles explicables** pour chaque usage tant qu'un modèle n'est pas installé ; l'interface ne dit pas « IA » dans ce cas.
- **Stabilité :** l'analyse d'un dossier est mise en cache avec la version du dossier ; elle ne change pas tant que le dossier ne change pas (défaut de la démo : tirage au sort à chaque rendu, corrigé).
- **Empreinte de photo** (photo réutilisée) : empreinte perceptuelle calculée en local, comparée aux empreintes du portefeuille ; la démo la simule. Écarté : envoi des images à un service externe.
- **Registre de l'IA :** ajout seul ; une ligne par proposition et par décision de l'agent.
- **Voix :** écartée au premier jour (aucune transcription d'appel, aucune dictée, aucune synthèse). Piste future : reconnaissance vocale locale, hors de ce PRD.
- **Rédaction de l'offre :** contrôle automatique « tous les chiffres du texte existent dans le décompte » avant signature ; mentions légales en blocs verrouillés non modifiables par le modèle. Écarté : génération libre sans verrou sur les mentions.
- **Catalogue de prix des pièces :** à construire pendant la reprise des archives (devis historiques) ; les fourchettes de la démo ne sont pas des références.

## 6. Messageries et canaux de déclaration (FR-34, FR-35, FR-84)

- **WhatsApp :** compte professionnel officiel de la compagnie (interface officielle) ; la réception alimente la file de l'accueil. Écarté : passerelles non officielles (risque de coupure et de conformité).
- **E-mail :** boîte dédiée aux déclarations, lue par le service ; les pièces jointes sont proposées à l'accueil, jamais rattachées seules.
- **SMS :** avis de départ d'une offre ou d'un courrier ; jamais de donnée de santé dans un SMS.

## 7. Comité, délégations, séparation des tâches (FR-78 à FR-81)

- **Matrice de délégation** en données, avec date d'effet ; la décision d'un dossier garde la ligne de la matrice appliquée (copie), comme pour le référentiel.
- **Séparation des tâches :** contrôle sur la **personne**, pas sur le rôle (un utilisateur qui cumule deux rôles ne peut pas tenir deux fonctions incompatibles sur le même dossier).
- **Procès-verbal de séance :** généré, imprimé, signé à la main, **numérisé et rangé** au dossier. Écarté au premier jour : signature électronique du procès-verbal (la valeur probante de la copie et de la signature électroniques n'est pas vérifiée : loi 2017-007 non lue ; à faire examiner par le juriste).
- **Vote en séance :** saisi par le secrétaire de séance sur un poste, avec nom et vote de chaque membre ; écarté : vote à distance par lien (hors besoin exprimé).

## 8. Offre, accord, transaction (FR-82 à FR-89)

- **Courrier :** gabarit de la compagnie en publipostage, pièce PDF archivée ; la signature de l'agent est manuscrite et l'original est scanné, ou apposée selon le choix de la compagnie. Écarté : signature électronique avancée au premier jour (même raison que ci-dessus).
- **Mineurs et incapables :** pièce d'autorisation exigée avant l'ordre ; modèle de suivi de l'avis au juge à 15 jours à construire avec le juriste.
- **Offres successives :** chaque offre est un objet distinct, versionné ; la contre-proposition y est liée. Écarté : modification d'une offre envoyée.

## 9. Données de santé (FR-63, FR-70)

- **Cloisonnement :** les champs et pièces médicales dans un espace séparé, lisibles seulement des rôles autorisés, avec journal de lecture ; chiffrement dédié des champs de santé. Écarté : stockage dans le même espace que les données de gestion avec simple masquage à l'écran.
- La loi 2019-014 (consentement écrit, autorité de protection) est à faire revoir par le juriste avant la mise en service.

## 10. Expertise (FR-58 à FR-68)

- **Règles dures dans l'action** (contre-expertise jamais au cabinet initial ni au panel interne ; classement et règle sont deux choses) : le classement des experts est une aide, la règle est un refus du serveur.
- **Orientation :** règles déterministes explicables d'abord ; un modèle apprend ensuite sur l'historique, sans jamais créer de mission.
- **Complétude d'un rapport :** grille de points par domaine en données (un domaine ajouté sans nouvelle version) ; contrôle de forme seulement.
- **Honoraires :** les cinq montants d'une mission sont des objets distincts reliés aux règlements (§5.8) ; honoraires au prorata de l'indemnité écartés (indépendance de l'expert).
