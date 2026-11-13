# Addendum de la partie 3 (W4) — choix techniques écartés ou renvoyés hors du PRD

Ce fichier garde les choix techniques que le PRD ne décrit pas (le PRD décrit des capacités, pas une implémentation). Pour chaque point : ce qui est **proposé**, ce qui est **écarté**, et **pourquoi**. Tout est une proposition pour la spine ; rien n'engage l'architecture (plan, D18). Les points marqués `[À CADRER]` attendent les spines des modules `liaison-assureur` (M48 [proposition]), `assureur-fictif` et l'extension de `document-service`.

## A-1. Échange avec le logiciel de la compagnie (FR-194 à FR-201, annexe C)

- **Proposé.** Deux transports derrière un même contrat : (1) API interrogée par Prospera, (2) fichiers Excel ou JSON déposés ou relevés dans un emplacement partagé du réseau de la compagnie (dossier partagé ou transfert de fichiers sécurisé, au choix de la compagnie). Les fichiers sont des **lots** (identifiant, version du contrat, empreinte). Les envois sortants passent par une **file persistante** (principe d'une boîte d'envoi) : rien n'est perdu pendant une coupure, l'ordre est conservé, un envoi n'est marqué « accepté » que sur l'accusé du LC (C-12). L'idempotence repose sur la **clé d'origine** de chaque objet et sur l'identifiant de lot.
- **Écarté : un appel entrant du LC vers Prospera (webhook).** Il ouvre un port entrant chez la compagnie et oblige à exposer Prospera à un système inconnu. Prospera tire. `[ASSUMPTION: règle de la microfinance reprise ; si le LC futur pousse des événements, il les dépose dans l'emplacement partagé]`.
- **Écarté : lire ou écrire directement dans la base du LC.** Le PRD ne connaît ni sa base ni son schéma (il sera libre en janvier) ; une écriture directe contourne ses contrôles. Seule l'API ou le fichier est admise.
- **Écarté : un connecteur écrit pour un produit supposé.** Le PO a décidé de ne pas spéculer. Le connecteur du LC réel sera une **table de correspondance** de ses champs vers l'annexe C, écrite quand il sera connu.
- **Écarté : bloquer la déclaration tant que le LC n'a pas répondu.** Une coupure du LC arrêterait l'accueil. La référence `DEC-` est attribuée localement.
- **Écarté : attribuer le numéro de sinistre dans Prospera seul au premier jour.** Le PO a dit que le numéro est détenu par le LC « pour un début ». Le paramètre « qui attribue » garde la porte ouverte sans reprise du code.
- **À cadrer.** Authentification de l'API (jeton, certificat), format exact des fichiers Excel (une feuille par objet, types de colonnes), taille maximale d'un lot, encodage et séparateurs pour le CSV, durée de conservation des lots, supervision de la file d'envoi.

## A-2. Recherche unique (FR-150, FR-151, FR-155)

- **Proposé.** Un **index de recherche local** sur le serveur de la compagnie, alimenté à chaque écriture, avec normalisation (minuscules, sans accents ni ponctuation), repli par préfixe, et un champ par critère (nom, police, téléphone, immatriculation, numéro de sinistre, `DEC-`, numéro d'archivage). La recherche en langage naturel traduit la question en critères structurés puis interroge ce même index.
- **Écarté : un service de recherche hébergé hors du site.** Il ferait sortir des noms, téléphones et références de santé ; l'instance est locale (D1).
- **Écarté : une tolérance aux fautes par distance d'édition sur tout le mot au premier jour.** Elle ramène des faux résultats sur des noms proches. Le repli par préfixe de la démo suffit ; à revoir après les premières semaines `[ASSUMPTION]`.
- **Écarté : un moteur de recherche en langage naturel qui répond sans montrer ses critères.** Un résultat qu'on ne peut pas corriger n'est pas vérifiable (FR-155).
- **À cadrer.** Mise à jour de l'index pendant la reprise de masse (reconstruction par lots), mesure du 95e centile sur 50 000 dossiers et 1,5 million de pages, gestion des droits par volet dans l'index.

## A-3. Pièces, OCR, classement (FR-159 à FR-166)

- **Proposé.** L'OCR est un **service en file**, tourne dans l'instance de la compagnie, lit les images et les PDF scannés (rasterisation préalable des PDF sans couche texte), et range le texte lu **à côté** de la pièce. Le classement par l'IA commune est un autre traitement qui lit ce texte et l'image ; ses résultats arrivent comme **propositions** dans le registre de l'IA.
- **Rappel de la plateforme.** `document-service` est le service OCR existant ; il ne lit pas directement un PDF scanné et un consommateur peut mourir dans un conteneur « sain » (mémoire de la plateforme). Ces points se vérifient dans la spine de l'extension `[À CADRER]`.
- **Écarté : un OCR dans le navigateur.** C'est ce que fait la démo (couche texte des PDF, par un composant du navigateur) ; il ne lit pas un scan.
- **Écarté : un OCR ou un classement dans un service en nuage.** Les pièces de santé ne sortent pas de l'instance (D1, D13).
- **Écarté : un rattachement automatique sans confirmation humaine.** La démo rattache sur type reconnu ; le PRD exige le contrôle de FR-165 avant archivage.
- **À cadrer.** Moteur d'OCR retenu, langues (français ; noms locaux), temps par page, file d'attente en cas de lot de reprise, antivirus (fournisseur de la compagnie).

## A-4. Archives numériques et scellement (FR-167 à FR-176)

- **Proposé.** Numéro d'archivage par **séquence atomique** par année de clôture et par volet. Empreinte de scellement : empreinte d'un résumé ordonné (liste des empreintes de chaque pièce dans l'ordre du bordereau), par une fonction de hachage courante ; l'empreinte et la date sont enregistrées avec le dossier. Stockage des fichiers sur le **NAS** de la compagnie, monté par le serveur applicatif, un chemin dérivé de l'identifiant de pièce (jamais du nom du fichier).
- **Écarté : calculer le numéro en prenant le maximum existant plus un** (comme la démo). Deux versements simultanés peuvent recevoir le même numéro et la destruction rouvrirait un numéro.
- **Écarté au premier jour : l'horodatage par un prestataire qualifié et le stockage non réinscriptible matériel.** Ils sont des options pour les pièces à forte valeur probante. Le décret de 2018 sur les services de confiance (art. 3 : horodatage, archivage électronique) et ses référentiels existent ; leur application aux pièces de sinistre est à valider par le juriste (D21).
- **Écarté : un format propriétaire d'archive.** PDF/A pour la lisibilité sur 10 ans `[ASSUMPTION]`.
- **Écarté : un bouton de suppression de pièce.** La suppression passe par la décision visée de FR-175.
- **À cadrer.** Stratégie de sauvegarde du NAS (copie hors site de la compagnie, durée de rétention), restauration partielle, échelle de la vérification d'empreinte (une nuit par lots).

## A-5. Provisions, états, export comptable (FR-188 à FR-193)

- **Proposé.** La provision est un **journal de mouvements** ajoutés (jamais modifiés) ; l'état PSAP est une **vue calculée à la date d'arrêté** depuis les mouvements. Les cessions sont calculées au moment de chaque mouvement, avec le traité du millésime de survenance, et enregistrées avec lui. L'export comptable est produit par un modèle de correspondance nature vers compte.
- **Écarté : stocker un total de provision mis à jour.** Il perd l'historique que le Code CIMA suppose (dossier par dossier, avec révisions) et empêche l'état à une date passée.
- **Écarté : calculer l'IBNR dans Prospera.** Il relève d'une circulaire de la CRCA et de la direction technique ; Prospera fournit les données.
- **Écarté : produire l'état réglementaire officiel.** Le contenu des états est à préciser par le juriste (FR-192) ; Prospera fournit les données de base.
- **À cadrer.** Le plan de comptes de la compagnie, la périodicité des exports, le rapprochement avec `paiement`, les traités réels.

## A-6. Pilotage et contrôle interne (FR-206 à FR-213)

- **Proposé.** Des **projections** calculées à partir du journal et des tables du dossier, rafraîchies au plus toutes les 5 minutes `[ASSUMPTION]` ; l'affichage passe par `dashboard` (M28), qui ne contient aucune logique de calcul. Les règles du plan de contrôle sont des requêtes paramétrées, exécutées de nuit et à la demande.
- **Écarté : des chiffres générés par un tirage ou des constantes** (la démo en contient beaucoup) ; chaque test de FR-212 le vérifie.
- **Écarté : un modèle d'IA qui note un dossier sans règle visible.** La note distingue constats certains (règles) et probables (analyse).
- **À cadrer.** Granularité des tranches temporelles, droits par volet dans les projections, conservation des constats du contrôle.

## A-7. L'IA (FR-154, FR-155, FR-157, FR-164, FR-208, FR-209)

- **Proposé.** Chaque usage appelle l'**IA commune** (instance locale) par son contrat ; les 14 usages et les garde-fous sont ceux de D13. Le registre de l'IA reçoit une ligne par appel. Une capacité sans modèle installé retombe sur des règles explicables et l'affiche.
- **Écarté : un appel à un modèle externe.** Aucune donnée nominative ni médicale ne sort (D1) ; seuls des écarts anonymisés remontent par tunnel sécurisé.
- **Écarté : la voix.** Aucune dictée, transcription ni synthèse vocale ; le chatbot de l'assuré du deck est « bientôt » (D13).
- **Écarté : une décision automatique.** Aucune IA ne valide, refuse ni paie ; elle ne propose jamais de montant sur un préjudice corporel.

## A-8. Reprise et vie en parallèle (FR-214 à FR-219)

- **Proposé.** La reprise utilise le module M44 : adaptateur **fichiers** (Excel, CSV, JSON) au premier jour, adaptateur **API** avec le LC connu ; chaque cible expose un **point d'import idempotent** ; la resynchronisation nocturne rejoue le même chemin d'import avec les changements depuis la dernière nuit. Un dossier porte un indicateur « suivi » ou « tenu par Prospera » ; le passage à « tenu » se fait à la première action de dossier. Un écart sur un champ tenu par Prospera va dans la file des écarts du module `liaison-assureur`.
- **Écarté : le scan du stock papier comme voie de reprise.** Décision du PO ; le papier reste tenu avec sa cote.
- **Écarté : une écriture bidirectionnelle automatique entre Prospera et le LC pendant le parallèle.** Elle crée des conflits que personne ne voit. Le PRD choisit : le LC l'emporte sur les contrats, Prospera l'emporte sur le dossier qu'il tient, les écarts sont montrés.
- **Écarté : la règle « dernier écrit gagne ».** Elle écraserait en silence une décision motivée.
- **Écarté : une fusion automatique des doublons.** La fusion reste sous contrôle humain (PRD Reprise FR-12).
- **À cadrer.** Le chevauchement avec la marche en parallèle du PRD Reprise (FR-17) et avec le module Connecteurs (qui relève le logiciel du client en lecture seule) : une seule lecture nocturne du système de la compagnie doit nourrir à la fois la resynchronisation et le rapport d'écarts de la période `[À CADRER]` ; clés de rattachement fournies à la GED ; format de l'état « tenu par » dans le point d'import.

## A-9. Portail expert, droits et journal (FR-153, FR-158, FR-177 à FR-185)

- **Proposé.** Le portail est une **vue de la même application** pour le rôle `EXPE`, avec un périmètre **par mission** (la liste des pièces est choisie par le gestionnaire et liée à la mission) ; l'authentification à deux facteurs. Les droits par volet et par donnée de santé reposent sur des attributs du dossier, évalués côté serveur. Le journal est un **journal ajouté seulement**, avec une empreinte chaînée entre lignes pour détecter une altération `[ASSUMPTION]`.
- **Écarté : un portail séparé avec sa propre base.** Il dupliquerait les pièces et les décisions.
- **Écarté : l'envoi du dossier par e-mail ordinaire à un cabinet.** C'est le canal des fuites ; l'e-mail ne sert qu'à notifier qu'une mission attend.
- **Écarté : des droits contrôlés seulement dans le navigateur** (la démo) : tout contrôle d'accès est serveur (constat 1 de la démo).
- **À cadrer.** Comptes de cabinets (création, désactivation), expiration des liens, durée de visibilité d'une mission terminée.

## A-10. Le logiciel de compagnie fictif (FR-202 à FR-205)

- **Proposé.** Un service **séparé**, alimenté par des jeux de données **déterministes** (graine fixe, même résultat à chaque remise à zéro), qui parle le contrat de l'annexe C par API et par fichiers, avec des **réglages d'essai** (panne, refus, retard, changement de police). Il est déclaré dans le manifeste du module comme **réservé à l'espace d'essai** : le bilan d'installation d'un espace réel échoue s'il est présent.
- **Écarté : un mode « simulation » dans le code de Prospera.** Le fictif doit parler comme un vrai LC, par les mêmes transports, sinon la démonstration ne prouve rien.
- **Écarté : des données copiées d'un client réel.** Toutes les données du jeu sont fictives.
- **À cadrer.** Le poids du jeu de 25 000 contrats et 3 500 dossiers, les 104 vérifications du second rejeu de la démo à reprendre comme tests de recette sur le vrai serveur (D19), le moment où le jeu est livré par rapport au premier jour.
