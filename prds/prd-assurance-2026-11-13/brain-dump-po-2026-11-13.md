# Récit du PO — PRD Assurance (sinistres), 2026-11-13

*Texte du PO, remis en forme sans changer le sens. La compagnie n'est jamais nommée (« la compagnie ») ; le mémoire de MBA cité porte sur « une compagnie du même groupe au Sénégal ».*

## 1. Cadrage validé

- Client : une compagnie IARD en zone CIMA, au Togo, au stade du pré-contrat. Démarrage en **février 2027**. Jamais nommée dans le PRD.
- Les 14 gestionnaires de la démo (3 corporel, 5 matériel, 3 risques divers, 3 recours) sont un chiffre de **démo**.
- Hébergement chez la compagnie (serveur applicatif + NAS). **L'IA commune tourne en instance locale** : seuls des écarts anonymisés remontent par tunnel sécurisé ; aucune donnée médicale ne sort (confirmé).
- Prospera se branche **à côté** du logiciel de la compagnie (polices, primes, clients), il ne le remplace pas. Ce logiciel sera libre en janvier : **on ne spécule pas dessus**.
- **Le numéro de sinistre est détenu par le logiciel de la compagnie, pour un début.**
- Premier jour : **Prospera sert à consulter ET à déclarer**, et **tout le circuit** fonctionne, jusqu'au chèque, **avec l'IA**, sauf l'IA vocale.
- Reprise des archives : **par API, ou par fichier Excel ou JSON**.
- Mode d'écriture rapide.

## 2. Ce que la compagnie a dit

Il y a eu une vraie démo devant la compagnie. Elle a dit qu'**il manque des éléments, mais de débuter dessus** ; une **séance d'immersion** avec elle suivra pour parfaire certaines étapes et faire des ajouts.

La démo `retour-demo-SIN-2026-9002/` a été jouée **seul, par le PO, avec un robot Playwright**, les 20 et 21 septembre. Les questions de `99-retour-personnel.md` attribuées à « l'équipe sinistres » sont imaginées par le PO.

Ce que la compagnie a dit est connu de seconde main par trois documents :
- l'atelier avec le service sinistres, cité en tête de `SPEC_METIER.md` (il en reste les 6 constats du §1 ; le compte rendu n'est pas dans le dépôt) ;
- l'offre v4 : « Vous nous avez indiqué le déploiement prévu, en parallèle de ce projet, d'un nouveau logiciel métier » ;
- la proposition v2 : « Vos documents existent déjà sous forme numérique dans votre système actuel », avec une API.

## 3. Le circuit : 8 phases, 11 statuts, 4 sorties

```
1 Déclarer    DECLARE                       n° attribué tout de suite, doublon vérifié
2 Ouvrir      PIECES_ATTENDUES ─┐           police en vigueur, prime payée, garantie souscrite
              OUVERT ◄──────────┘           accusé de réception ; courtier et coassureurs informés
3 Attribuer   (OUVERT + gestionnaire)       le responsable désigne qui instruit
4 Instruire   EN_INSTRUCTION                pièces, responsabilité, missions d'expertise
                                            ou accord sur devis sous un seuil
5 Chiffrer    EVALUE                        barème, vétusté, franchise, plafond : le décompte
6 Décider     EN_VALIDATION → OFFRE_ENVOYEE validation selon les délégations, puis offre
                                            à l'assuré (au corporel : procès-verbal de transaction)
7 Payer       ORDRE_EMIS → CHEQUE_A_REMETTRE → REGLE
                                            la comptabilité émet, le guichet remet contre
                                            quittance signée et pièce d'identité
8 Clore       CLOTURE                       solde à zéro, motif écrit, versement aux archives
```

Sorties : REJETE · SANS_SUITE · LITIGE (offre refusée, contre-expertise) · FRAUDE_SUSPECTEE.
En parallèle : **le recours contre le tiers**, de l'ouverture jusqu'au remboursement.

Les règles qui tiennent tout le circuit : **celui qui décide ne paie pas** ; **chaque refus ou classement porte un motif** ; **chaque action est horodatée** ; **une évaluation déjà arrêtée n'est pas recalculée quand le barème change**.

## 4. Ce qui change par rapport à la démo (`src/lib/workflow.ts`, 15 statuts)

- **L'offre et l'accord de l'assuré deviennent une étape.** La démo passe de la validation à l'ordre de règlement ; l'offre n'existe que comme modèle de courrier. Dans la procédure du groupe, l'offre validée part à l'assuré sous 48 h, et on ne prépare le paiement qu'après son accord. S'il refuse, il demande une contre-expertise.
- **Le recours devient un suivi parallèle, plus un statut.** Dans la démo, passer en recours fait sortir le dossier du circuit. Dans la procédure, la lettre de mise en cause du tiers part dès l'ouverture, avec une relance tous les 15 jours, et on réclame le remboursement une fois l'assuré payé.
- **La validation se fait à plusieurs niveaux.** La démo a un seul seuil, 2 M FCFA. Dans la compagnie du groupe au Sénégal : validation à trois en dessous de 1 M FCFA, comité de quatre au-delà, visa du directeur opérationnel, et le DG seul pour un règlement à titre commercial. Il faut les délégations réelles de la compagnie.
- **Une voie « accord sur devis » sans expert** pour les petits dossiers matériels (Sénégal : dossier ≤ 300 000 FCFA, devis ≤ 200 000 FCFA). La démo envoie tout en mission d'expertise.
- **La SPEC est en retard sur le code.** Elle décrit 9 statuts et 2 sorties et une ouverture bloquée par les pièces. Le code ouvre « en attente de pièces » et a ajouté ORDRE_EMIS, SANS_SUITE, LITIGE et FRAUDE_SUSPECTEE. **C'est le code qui fait référence.**

## 5. Premier jour (version du PO, avant ses réponses finales)

Sur les données reprises de leur système :
- retrouver un dossier en moins de 5 secondes, par nom, police, numéro de sinistre, immatriculation ou numéro d'archivage ;
- répondre au client depuis la fiche : étape, pièces reçues et manquantes, montant évalué, déjà payé, reste à payer, dernière action ;
- joindre une pièce au bon dossier, scannée ou téléversée, avec un contrôle avant archivage ;
- tracer chaque consultation et chaque ajout, au nom de l'agent ;
- donner à chaque profil ses droits : accueil, gestionnaires par volet, responsable, numérisation, contrôle interne, administrateur ;
- resynchroniser régulièrement depuis leur système, avec un rapport de reprise (récupérés, rejetés, écarts).

**Réponses finales du PO :** Prospera sert à **consulter et déclarer** ; **tout le circuit** fonctionne au premier jour ; le numéro de sinistre est **détenu par leur logiciel** pour un début. « Analyse toi-même et complète pour qu'on finisse. Le but est de finaliser un vrai processus qui peut évoluer après, mais il faut d'abord qu'il soit présent, intégré et vraiment testé. »

## 6. Documents à lire

Dans le dépôt, en premier :
- `M0013MBA-ACG15.pdf` : mémoire de MBA de 2014, audit de la procédure d'indemnisation automobile d'une compagnie du même groupe au Sénégal. Chapitre V : la procédure réelle (validation sous 48 h, rapport d'expert sous 7 à 10 jours, paiement sous 72 h, relance du recours tous les 15 jours, seuils, chemises de couleur par branche). Chapitre VI : les défauts relevés (déclarations enregistrées 3-4 jours après réception, accusés de réception jamais envoyés, offres hors délai, provisions non mises à jour) — exactement ce que Prospera doit traiter. Limite : Sénégal 2014, à confirmer pour le Togo d'aujourd'hui.
- les commentaires de `workflow.ts` (la raison de chaque règle) ;
- `rejeu-2/README.md` (ce qui reste à faire) et le doc « Espace expert ».

Secondaires : `true.pdf` (règlement CIMA sur le FGA) ; `true.docx` (fiche de déclaration du FGA Sénégal) ; la convention d'expertise (tunisienne, modèle seulement) ; le constat et le rapport d'expertise `.docx` (exemples français fictifs, jeux de test) ; le tableau d'évaluation médico-légale (corporel).

À demander à la compagnie, dans l'ordre : manuel de procédures sinistres (le groupe en a un au Sénégal, réf. CI/PR/SNI/01) ; délégations et seuils de validation ; nom et API du logiciel métier actuel et futur ; liste des experts agréés ; barèmes et grilles de vétusté ; modèles de courriers et de quittances ; volumes (dossiers par an, stock en cours, archives) ; compte rendu de l'atelier.

Texte de référence : Code CIMA, livre II (délais d'offre et barème corporel). La démo en cite une partie dans `referentiel-togo.ts`.
