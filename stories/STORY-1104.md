# STORY-1104 : Le projet financé — pro forma, frais annexes, apport, montant demandé calculé, et le contrat des documents du dossier

Status: ready-for-dev — **créée le 2026-11-21** à la demande de l'utilisateur, après validation de la maquette de FE-140
(PR #741). Non slottée : à placer au prochain plan.

**Service :** `prospera-bilan-service`, module `financement` (`document-service` pour le stockage des fichiers, demande à C)
· **Points :** 5
**Dépend de :** STORY-1083 et STORY-1084 (livrées).
**Débloque :** STORY-1105, 1106, 1110, 1111 (le coût, l'apport et la date d'acquisition), STORY-1085 (la pièce « pro forma »,
le contrat des documents), FE-152.
**Écran :** FE-152 (étape 1 « Le projet » de l'onglet Financement).
**Suite :** STORY-1105.

---

## Pourquoi

Aujourd'hui le dossier de financement porte un `objet` et un `montant` saisis à la main (STORY-1083). Dans la vraie vie, un
expert-comptable monte le projet à partir d'une **facture pro forma** du fournisseur : le matériel, le prix, la date, la
durée de validité. La banque finance le **TTC** et refuse un pro forma périmé. Le client met un **apport** ; la banque
prête le reste.

**Décisions de l'utilisateur (20-21/11), reprises telles quelles :**
- le pro forma est **obligatoire et bloquant** pour un achat de matériel (investissement, crédit-bail) ; sans objet pour un
  crédit de trésorerie ;
- le montant est **TTC**, retenu partout (coût, montant demandé, gage, investissement du plan) ;
- **partout où c'est déposer, ce sont des boutons d'upload** (sélecteur de fichier et glisser-déposer) ; **tout ce qui est
  généré, et tout fichier déposé, se voit dans l'application avant tout téléchargement** (« Voir »).

Cette story pose donc le projet, **et le contrat des documents du dossier** (dépôt, aperçu, historique) que toutes les
autres stories du parcours réutilisent : il n'existe qu'un seul chemin de dépôt et un seul « Voir ».

## Ce qui est attendu

1. **Les pro forma** du dossier (liste de 10 au plus) : matériel, fournisseur, numéro, date d'émission, date de validité,
   montants, pièce jointe (un fichier déposé).
2. **Les frais annexes** facultatifs (carte grise, assurance de la 1re année, mise en route), cochés ou non.
3. **La date d'acquisition prévue** et **l'apport** du client (montant ou pourcentage du coût).
4. **Le coût du projet** et **le montant demandé**, calculés ; le montant demandé reste modifiable.
5. **Le prêt demandé proposé d'office comme premier emprunt** (STORY-1084), relié au projet.
6. **Le contrat des documents du dossier** : un fichier déposé ou généré se téléverse, se liste, se **voit** et se télécharge
   par les mêmes routes, quelle que soit la pièce à laquelle il se rattache.

## Décisions retenues par défaut (contestables)

- **D-1104-1 — Le projet est un sous-objet du dossier**, archivé avec sa version (D-1083-10). Champs, mêmes conventions que
  1083/1084 (entiers FCFA, aucun flottant, NFR-3) :
  `projet: { proformas[], fraisAnnexes[], dateAcquisition, apport: { montant, pourcentage, saisie }, besoinTresorerie,
  cout, montantCalcule, montantSource }`. Le champ existant `montant` (1083, D-1083-14) **reste le montant demandé** : il
  prend `montantCalcule` tant que `montantSource = CALCULE`, et la valeur envoyée quand le cabinet le modifie
  (`montantSource = SAISI`, `PATCH /{id}` existant). `montantCalcule` est toujours publié, pour montrer l'écart.
  Un dossier créé avant cette story garde son `montant` en `SAISI` et un `projet` vide.
- **D-1104-2 — Un pro forma** : `id` (24 hexadécimaux), `materiel` (3 à 200), `fournisseur` (2 à 200), `numero` (1 à 60),
  `dateEmission`, `dateValidite` (AAAA-MM-JJ, `dateValidite` ≥ `dateEmission`), `tauxTvaPct` (défaut 18), `montantTtc`
  (entier FCFA, 1 → 10¹²), `montantHt`, `montantTva`, `document` (référence D-1104-9, obligatoire).
  **Le TTC est le montant lu sur la pièce ; HT et TVA se déduisent** : HT = TTC × 100 ÷ (100 + taux), arrondi au franc
  (demi vers le haut) ; TVA = TTC − HT. Si le cabinet envoie aussi le HT, l'écart avec le HT calculé ne dépasse pas
  1 FCFA, sinon 422 `PROFORMA_MONTANTS_INCOHERENTS`.
  **Valeur de référence** : PF-2026-0142, CFAO Motors Togo, camion de livraison Toyota Dyna, émis le 05/02/2026, valable
  jusqu'au 06/04/2026 : TTC **31 250 000** ⇒ HT **26 483 051**, TVA **4 766 949** (26 483 051 + 4 766 949 = 31 250 000).
- **D-1104-3 — La validité d'un pro forma.** Il est `EXPIRE` quand `dateValidite` est antérieure à la date du jour, sinon
  `VALIDE` ; le statut est calculé à la lecture, jamais rangé. Un pro forma expiré **bloque** : refus `PROFORMA_EXPIRE`
  au passage `PRET` et à la remise d'une banque (STORY-1107), avec le numéro du pro forma en `details`. Référence : PF-2025-0987
  du 05/11/2025, valable jusqu'au 05/01/2026, est `EXPIRE` le 21/11/2026. L'écran propose « Demander un pro forma à jour »
  (message prêt, STORY-1085).
- **D-1104-4 — Frais annexes** : `id`, `libelle` (3 à 200), `montant` (entier FCFA), `inclus` (booléen, **faux par
  défaut** pour garder le cas de référence). Valeurs de la maquette : carte grise et immatriculation 625 000, assurance
  de la 1re année 1 100 000, mise en route (carburant, formation du chauffeur) 400 000. Les trois cochés ajoutent
  2 125 000 au coût.
- **D-1104-5 — Le coût, l'apport, le montant demandé.**
  - `cout` = somme des `montantTtc` des pro forma (expirés compris : ils bloquent, ils ne changent pas le chiffre) + somme
    des frais `inclus`. Pour un crédit de **trésorerie**, `cout` = `besoinTresorerie` (entier saisi) et la liste des pro forma
    reste vide.
  - `apport.saisie` vaut `MONTANT` ou `POURCENTAGE`, selon ce que le cabinet a saisi en dernier ; l'autre valeur se
    déduit (pourcentage à une décimale, demi vers le haut). **Défaut : 20 %.** Si la saisie est un pourcentage, le montant
    suit le coût ; si c'est un montant, il reste.
  - `montantCalcule` = `cout` − `apport.montant`. Apport supérieur ou égal au coût : 422 `APPORT_SUPERIEUR_AU_COUT`.
  - **Valeur de référence** : coût **31 250 000** TTC − apport **6 250 000** (20 %) = **25 000 000** demandés. Avec les trois
    frais cochés : coût 33 375 000, apport 20 % = 6 675 000, demandés 26 700 000. Avec un second pro forma « Bâche et
    hayon », Carrosserie Moderne, PF-2026-0031, 1 180 000 TTC : coût 32 430 000, apport 6 486 000, demandés 25 944 000.
  - **Repères d'apport, non bloquants** (avertissement `APPORT_SOUS_REPERE` dans la réponse) : 20 à 30 % du coût pour une
    société établie, 30 à 40 % pour une jeune société (le profil vient de STORY-1105). Valeurs par défaut ; le référentiel
    AP-50 les porte ensuite.
- **D-1104-6 — Obligation du pro forma selon le type** (`type` de 1083) :
  `INVESTISSEMENT` et `CREDIT_BAIL` : au moins un pro forma `VALIDE` avec sa pièce, sinon `PRET` est refusé
  `409 PROJET_INCOMPLET` (`details.manques` : `PROFORMA_ABSENT`, `PROFORMA_EXPIRE`, `PROFORMA_SANS_PIECE`, `DATE_ACQUISITION_ABSENTE`) ;
  `TRESORERIE` : pro forma sans objet (un pro forma envoyé est refusé 422 `PROFORMA_SANS_OBJET`) et `besoinTresorerie`
  obligatoire. Le contrôle s'ajoute à la ligne `BROUILLON` → `PRET` de 1083, avec celui de STORY-1085.
- **D-1104-7 — La date d'acquisition** : `dateAcquisition` (AAAA-MM-JJ). Par défaut, le 1er du mois qui suit la création
  (`dateAcquisitionParDefaut: true` tant que le cabinet ne l'a pas posée). Elle donne la date de début de l'emprunt
  `DEMANDE`, et le premier des 12 mois de la trésorerie mensuelle (STORY-1110). Référence : **01/04/2026**.
- **D-1104-8 — Le prêt demandé, premier emprunt.** `POST /{id}/emprunts/depuis-projet` (préparer, brouillon) crée, ou met à
  jour, l'unique emprunt `nature = DEMANDE` : `capital` = `montant`, `dureeMois` et `differeMois` du dossier, `dateDebut` =
  `dateAcquisition`, `periodicite = MENSUELLE`, `mode = ECHEANCES_CONSTANTES`, `tauxAnnuelPct` = taux indicatif **12 %** (valeur
  de la maquette ; le référentiel AP-50 la porte ensuite en `parametres.tauxIndicatifPct`, à confirmer avec les banques).
  Champ neuf de l'emprunt (ajout seul à 1084) : `lieAuProjet` (vrai à la création). Tant qu'il est vrai, un changement du
  projet met l'emprunt à jour ; dès que le cabinet le modifie par `PUT …/emprunts/{id}`, il passe à faux et le projet n'y
  touche plus. **Référence** : 25 000 000, 12 %, 48 mois ⇒ mensualité 658 346, dernière 658 339, intérêts 6 600 601, total
  31 600 601 (STORY-1084, inchangé).
- **D-1104-9 — Le contrat des documents du dossier (commun à tout le parcours).** Un *document* est un fichier rangé par
  `document-service`, rattaché au dossier client et à sa cible. Objet publié :
  `{ id, cible, cibleId, origine, nom, mime, taille, version, deposePar, deposeLe, remplaceId, statut }` où `cible` ∈
  `PROFORMA`, `GARANTIE`, `PIECE_EXIGENCE`, `CONDITION`, `REPONSE_BANQUE`, `DOCUMENT_GENERE`, `DOSSIER_BANQUE` ;
  `origine` ∈ `DEPOSE`, `GENERE`, `MODIFIE` ; `statut` ∈ `COURANT`, `REMPLACE`. Routes, sous `/{financementId}` :

  | Route | Droit | Effet |
  |---|---|---|
  | `POST /documents` (multipart : `fichier`, `cible`, `cibleId`) | préparer | téléverse ; l'ancien document de la même cible passe `REMPLACE` (jamais effacé) |
  | `GET /documents?cible=&cibleId=` | consulter | la liste, historique compris, du plus récent au plus ancien |
  | `GET /documents/{documentId}/apercu` | consulter | de quoi afficher le document dans l'application : `{ mode, url, pages }`, `url` signée à courte durée |
  | `GET /documents/{documentId}/fichier` | consulter | le fichier tel qu'il a été déposé ou généré (octets identiques) |

  **Téléversement réel** (exigence de l'utilisateur) : un sélecteur de fichier **et** le glisser-déposer côté écran ; le
  serveur reçoit le fichier en flux et le range dans `document-service` (route de dépôt rattachée au dossier client :
  `POST /dossiers/{dossierId}/pieces`, à prolonger si besoin, **demande à C** inscrite au journal). Types acceptés : PDF,
  JPG, PNG, DOCX, XLSX (**à confirmer**). Taille maximale : **20 Mo** par fichier (**à confirmer**). Un envoi interrompu
  (annulation, coupure) ne laisse **aucun fichier à moitié rangé** : la pièce ne passe « Fournie » qu'à la fin complète.
  Refus nommés : 415 `FORMAT_NON_ACCEPTE` (`details.acceptes`), 413 `FICHIER_TROP_VOLUMINEUX` (`details.maxOctets`), 422
  `FICHIER_ILLISIBLE` (vide, PDF ou Office corrompu), 404 `CIBLE_INTROUVABLE`, 409 `DOSSIER_FINANCEMENT_NON_MODIFIABLE`
  (le dépôt ne s'ouvre qu'en `BROUILLON`, sauf les cibles de suivi `REPONSE_BANQUE`, `CONDITION`, STORY-1107/1108).
  **L'aperçu** : PDF et images sont rendus tels quels ; DOCX et XLSX sont convertis en PDF par `document-service` (le fichier
  d'origine reste celui du téléchargement). Un fichier que l'aperçu ne sait pas rendre : 422 `APERCU_INDISPONIBLE`, et
  l'écran propose le téléchargement. **Tout document généré par une story du parcours est un document de ce contrat**
  (`origine = GENERE`) : il a donc un aperçu avant tout téléchargement.
  Pas de nouveau droit : déposer = `preparer`, voir et télécharger = `consulter`.
- **D-1104-10 — Les routes du projet** (même contrôleur, mêmes gardes et même portée que 1083, `FINANCEMENT_NOT_ENTITLED` si
  le module n'est pas ouvert), `BROUILLON` seulement pour l'écriture (sinon 409 `DOSSIER_FINANCEMENT_NON_MODIFIABLE`) :

  | Route | Droit | Effet |
  |---|---|---|
  | `GET /projet` | consulter | le projet, ses calculs et ses avertissements |
  | `PUT /projet` | préparer | `dateAcquisition`, `apport`, `besoinTresorerie`, cases des frais annexes |
  | `POST /projet/proformas` | préparer | ajoute un pro forma (201) ; 11e : 422 `PROFORMAS_TROP_NOMBREUX` |
  | `PUT /projet/proformas/{proformaId}` | préparer | remplace un pro forma |
  | `DELETE /projet/proformas/{proformaId}` | préparer | retire un pro forma (204) |
  | `POST /projet/frais-annexes`, `PUT` et `DELETE …/{id}` | préparer | idem pour les frais |
  | `POST /emprunts/depuis-projet` | préparer | D-1104-8 |

  Refus : 404 `PROFORMA_INTROUVABLE`, `FRAIS_ANNEXE_INTROUVABLE`, 422 `PROFORMA_MONTANTS_INCOHERENTS`,
  `APPORT_SUPERIEUR_AU_COUT`, `PROFORMA_SANS_OBJET`, 409 `CONFLIT_CONCURRENT`. Piste d'audit : `FINANCEMENT_MODIFIE` avec
  `projet` et `geste` (D-1084-14). Le manifeste M49 passe en 0.3.0 : `GET /projet`, `GET /documents`, `GET …/apercu` et
  `GET …/fichier` entrent dans `routesLectureSeule`.
- **D-1104-11 — Effacement C13 :** les documents rangés par `document-service` suivent le plan d'effacement de ce service ;
  la collection des références de documents du dossier (`documents_financement`, champ `tenantId`) entre dans le plan de
  bilan (l'invariant 928 l'exige).

## Critères d'acceptation

- **AC-1** : valeur de référence au franc : PF-2026-0142 ⇒ HT 26 483 051, TVA 4 766 949, TTC 31 250 000 ; coût 31 250 000,
  apport 6 250 000 (20 %), demandé 25 000 000 ; les trois variantes de D-1104-5 (frais cochés, deux pro forma). Les valeurs
  sont écrites en dur dans le test.
- **AC-2** : un pro forma expiré refuse `PRET` avec `PROFORMA_EXPIRE` ; un dossier de trésorerie n'exige aucun pro forma ;
  un dossier d'investissement sans pro forma refuse `PRET` avec `PROFORMA_ABSENT` ; mutation sur chaque cas.
- **AC-3** : `montantSource` : tant qu'il est `CALCULE`, changer un pro forma ou l'apport change `montant` ; une fois `SAISI`,
  `montant` ne bouge plus et `montantCalcule` montre l'écart.
- **AC-4 (upload)** : le dépôt est un vrai téléversement multipart rangé par `document-service`, rattaché au dossier client
  et à sa cible ; les trois refus (`FORMAT_NON_ACCEPTE`, `FICHIER_TROP_VOLUMINEUX`, `FICHIER_ILLISIBLE`) sont éprouvés avec un
  vrai fichier ; un envoi coupé en cours de route ne laisse rien ; remplacer garde l'ancien document dans l'historique.
- **AC-5 (voir)** : `…/apercu` répond pour un PDF, une image, un DOCX et un XLSX (les deux derniers par conversion) ;
  `…/fichier` rend les octets déposés ; un document hors du dossier client demandé : 404.
- **AC-6** : le prêt demandé est proposé d'office : `POST …/emprunts/depuis-projet` rend l'emprunt de référence (658 346 /
  658 339 / 6 600 601), idempotent (deux appels, un seul emprunt) ; modifié à la main, il n'est plus touché par le projet.
- **AC-7** : droits et portée comme 1083 (un collaborateur prépare et consulte) ; contrat publié, typé dans l'OpenAPI, annoncé
  dans « ⚠ Contrats » du journal du groupe qui tient le service, **avant** le code.

## Hors périmètre

- La lecture automatique (OCR) du pro forma : nommée, sans fiche (journal de A).
- Le lien de dépôt envoyé au client pour qu'il téléverse lui-même ses pièces : nommé, sans fiche.
- Les alertes d'expiration (pro forma, attestations) envoyées avant l'échéance : nommées, sans fiche.
- Les banques (STORY-1105), les garanties (1106), les pièces exigées (1085).
- Le seuil d'apport par banque (AP-50).
