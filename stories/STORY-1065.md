# STORY-1065 : la facture juste (3) — les mentions légales de chaque facture (liste de travail jusqu'à A-1), son PDF figé et son lien public d'envoi

Status: in-progress

**Épic :** EPIC-230 (la facturation : la facture juste, l'avoir, la proforma et le lien public) ; FR-44, FR-46, FR-47
(le lien seulement), NFR-10 · **Dépôt :** `prospera-ventes-service` (module `facturation`) ; aucun contrat partagé de
`prospera-plateforme` · **Plage :** groupe D, n° 1 du lot 6 (`PLAN-LOT-6-2026-11-23.md` §6), première story de D au lot 6.
**Dépend de :** STORY-1059 et STORY-1061 (la facture juste (1) et (2), `ventes` `dev` 1c1e944 → 68b293c), STORY-1062
(`COMMANDE_ANNULEE`, `dev` f49f3a6), livrées. **Suivante :** STORY-1066 (l'avoir, `ventes`).

**Sources :** l'ordre de D-1061-12 (fiche 1061 : « (1) les mentions légales (FR-44, liste de travail jusqu'à A-1 : un
paramètre ; une mention manquante bloque l'émission `MENTION_OBLIGATOIRE_MANQUANTE`), le PDF déterministe et son
empreinte (FR-46, AD-6 : asynchrone, `PDF_EN_ATTENTE`), le lien public et l'envoi (FR-47, AD-33, `notification`) ») ;
plan du lot 6 §6, ligne 1 (« fini quand : une facture émise a son PDF et son lien ») ; PRD distributeur FR-44, FR-46,
FR-47, NFR-7, NFR-8, NFR-10, D-13, A-1, R-3 ; spine distributeur AD-6 (« le PDF est rendu de façon asynchrone (état
`PDF_EN_ATTENTE`), déterministe, stocké avec son empreinte SHA-256 portée par la facture, conservé 10 ans »), AD-12,
AD-21, AD-23, AD-30 (« un numéro ou un PDF n'est remis qu'après l'acquittement de l'écriture »), **AD-33** (« le lien est
signé (jeton opaque de 128 bits, stocké haché), donne un seul document, expire à 7 jours (paramètre), est révocable, ne
demande aucun compte ; servi par `facturation` seul, avec limitation de débit ; chaque ouverture est journalisée ; test
d'énumération »), pile (« rendu serveur Node déterministe, polices embarquées, empreinte conservée ; bibliothèque
épinglée à la story de pointe de `facturation`, sans navigateur sans tête ») ; manifeste `facturation` (M09 : droits
`facturation:facture:consulter` « factures, PDF », `facturation:facture:emettre` « l'envoyer au client » ; route
`…/factures/{factureId}/pdf` « PDF figé, jamais régénéré ») ; code d'`auth-service` (`identity.org.*` : nom, pays,
logo ; ni NIF, ni RCCM, ni capital) et de `kyc-service` (aucune donnée déclarée dans ses faits) ; `bilan-service` et
`balance-service` (pdfkit 0.19.1, déjà employé par le projet).

## Le découpage : ce que cette story prend, et pourquoi

« Fini quand : une facture émise a son PDF et son lien ». Trois sujets, dans cet ordre, parce que chacun suppose le
précédent :

1. **Les mentions légales** (FR-44) : sans elles, le PDF n'aurait rien d'une facture. La liste est **une liste de
   travail** jusqu'à la validation de l'expert-comptable du client (A-1, D-13) : un paramètre, que le DAF corrige sans
   développement.
2. **Le PDF figé** (FR-46, AD-6) : rendu par le serveur, après l'émission, déterministe, stocké avec son empreinte.
3. **Le lien public** (AD-33) : un jeton opaque qui donne ce PDF, et lui seul, sans compte, pour un temps.

**N'entre pas dans cette story** (D-1065-14) : l'envoi par `notification` (le message WhatsApp, le statut `ENVOYE` /
`ECHEC` sur la facture) ; le brouillon et son filigrane (ils naissent avec la facture par livraison, AD-6) ; le PDF de
l'avoir et de la proforma ; le lien de paiement.

## Où en est-on (pour une reprise après interruption)

- [x] Rituel : plan du lot 6, règles, journaux de A, B, C, D (aucune demande neuve à D pour le distributeur ; la
  passation de C vise 1068), fiches 1059 → 1064, épic, spine, PRD, manifeste, table d'accès d'`auth`.
- [ ] Annonce « ⚠ Contrats » fusionnée avant le code (prospera-stories, PR de cette fiche) ; manifeste amendé (C7).
- [ ] `ventes` : PR fusionnée en rebase.
- [ ] Verrou Docker : pris, rendu ; aucun conteneur, volume ni réseau `grp-d`.
- [ ] PR de docs finale.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **Les paramètres de la facture** (`facturation_parametres`, AD-12) : `GET /api/v1/facturation/parametres` (un droit du module) rend la version courante (la première, posée à la première lecture : la liste de FR-44 entière, une fiche de l'émetteur vide, 7 jours, 10 ans) ; `PUT` (`facturation:parametres:modifier`) ajoute la version suivante, tracée, sur la version lue (`PARAMETRES_VERSION_PERIMEE`), valeurs vérifiées (`PARAMETRES_INVALIDES`, `details.erreurs`) | unitaires ; MongoDB réel (HTTP) ; pile |
| AC-2 | **Une mention manquante bloque l'émission** : 409 `MENTION_OBLIGATOIRE_MANQUANTE`, `details.manquantes` (code, fiche, identifiant) ; jugée dans la transaction du numéro : **aucun numéro consommé** ; seules les mentions de la liste de travail sont exigées ; fiche du client ou d'un article absente : échec fermé | unitaires ; MongoDB réel ; pile |
| AC-3 | **Les mentions sont figées sur la facture** (`mentions`, `parametresVersion`) : émetteur, client, désignation de chaque ligne, pénalités, escompte, conservation ; un paramètre changé ensuite ne change ni la facture ni son PDF | MongoDB réel |
| AC-4 | **Le PDF naît après l'émission, sans la retarder** : la facture émise rend `pdf.etat = EN_ATTENTE` ; le PDF est produit hors de la réponse, puis par un balayage (redémarrage) ; stocké (`facturation_pdfs`, écriture majoritaire) **avant** que la facture passe `PRODUIT` avec son empreinte SHA-256 et sa taille | unitaires ; MongoDB réel ; pile |
| AC-5 | **Le PDF est déterministe et complet** : même facture ⇒ mêmes octets (autre jour, autre heure, autre processus) ; A4, polices embarquées, pied « numéro — page n / N » ; il porte les mentions de FR-44 (« Facture », émetteur, client, numéro, dates, échéance, références de commande et de bons, lignes, total HT, TVA par taux, TTC, conditions de règlement, pénalités, escompte, zone « Signature et cachet ») | unitaires ; pile (texte extrait du PDF servi) |
| AC-6 | **Le PDF se télécharge** : `GET /api/v1/facturation/factures/{id}/pdf` (`facturation:facture:consulter`) rend les octets stockés (`application/pdf`, empreinte en en-tête) ; 409 `PDF_EN_ATTENTE` (`Retry-After`) ; 409 `PDF_INDISPONIBLE` (facture émise avant 1065) ; hors portée ou inconnue : 404 `FACTURE_INCONNUE` ; octets qui ne répondent plus à l'empreinte : 500 `PDF_ALTERE`, jamais servis | MongoDB réel (HTTP) ; pile |
| AC-7 | **Le lien public se crée et se révoque** : `POST …/factures/{id}/liens` (`facturation:facture:emettre`, `Idempotency-Key`) rend l'adresse **une seule fois** (jeton de 128 bits, stocké haché) ; rejeu : le même lien, sans le jeton ; expiration figée à la création (paramètre, 7 jours) ; `GET …/liens` (consulter) ne rend jamais ni jeton ni empreinte ; `POST …/liens/{lienId}/revocation` (émettre) ; chaque geste est tracé | unitaires ; MongoDB réel (HTTP) ; pile |
| AC-8 | **Le lien sert un seul document, sans compte** : `GET /api/v1/facturation/liens-publics/{jeton}` (route publique) rend le PDF de sa facture ; jeton inconnu ou mal formé : la même 404 `LIEN_INCONNU` ; 410 `LIEN_EXPIRE`, 410 `LIEN_REVOQUE` ; 503 `PDF_EN_ATTENTE` ; **chaque ouverture est tracée** (piste, compteur) ; **limitation de débit** (429) ; test d'énumération | MongoDB réel (HTTP) ; pile |
| AC-9 | Chaque route déclare son droit, la route publique son exemption (invariant) ; polices et licence figées par leurs empreintes ; Node 24 (`verification`) : tsc, lint des fichiers touchés, build, unitaires, e2e, intégration ; mutations rouges sur l'assertion ; `docker compose up` sain (module Nest et dépendance changés, §1.5) ; rejoué depuis `origin/dev` | « Preuves » |

## Décisions retenues par défaut (contestables)

- **D-1065-1 — La tranche : les mentions, le PDF, le lien.** Voir « Le découpage ». L'envoi par `notification` est un
  geste de plus sur le même lien (D-1065-14) ; le plan du lot 6 le place hors de « fini quand ».
- **D-1065-2 — La fiche de l'émetteur est un paramètre de `facturation`**, faute de propriétaire : aucune fiche de
  l'organisation ne porte aujourd'hui sa raison sociale légale, sa forme, son capital, son siège, son NIF, son RCCM, son
  régime ni ses coordonnées de paiement (`identity.org.*` d'`auth` : nom, pays, logo ; `kyc` ne publie aucune donnée
  déclarée). FR-44 dit « lu de la fiche de l'Organisation (jamais en dur) » : la fiche est **saisie par le DAF** dans les
  paramètres versionnés du module (AD-12), jamais codée. Le jour où un propriétaire la publie, `facturation` la lira et
  ce paramètre ne servira plus qu'à ce qu'elle ne porte pas : **Q-D-12** au PO.
- **D-1065-3 — La liste de travail est un paramètre** (`mentionsExigees`, D-13, A-1) : un sous-ensemble d'un catalogue
  fermé de quatorze codes (`EMETTEUR_RAISON_SOCIALE`, `EMETTEUR_FORME_JURIDIQUE`, `EMETTEUR_CAPITAL`,
  `EMETTEUR_ADRESSE`, `EMETTEUR_NIF`, `EMETTEUR_RCCM`, `EMETTEUR_REGIME_FISCAL`, `EMETTEUR_COORDONNEES_DE_PAIEMENT` (un
  RIB ou un compte Mobile Money), `CLIENT_NOM`, `CLIENT_ADRESSE`, `CLIENT_NIF` (exigé d'un client assujetti, ou dont on
  ne sait pas s'il l'est), `LIGNE_DESIGNATION`, `PENALITES_DE_RETARD`, `CONDITIONS_D_ESCOMPTE`). Par défaut : **les
  quatorze**. Retirer une mention (le capital d'une entreprise individuelle) ne demande aucun développement ; en ajouter
  une que le PDF ne sait pas imprimer en demande un. Les mentions que la facture porte par construction (numéro, dates,
  échéance, commande, bons, lignes, totaux, TVA par taux, conditions de règlement tirées du délai, devise) ne sont pas
  au catalogue : elles ne peuvent pas manquer.
- **D-1065-4 — Le client et les articles se lisent dans deux projections**, comme la condition de règlement (D-1059-5) :
  `facturation_clients_lus` (nom, adresse, NIF, assujetti ; future projection de `pdv.point-de-vente.changed@1`) et
  `facturation_articles_lus` (désignation, référence ; future projection du fait d'article de `catalogue`), remplies par
  personne aujourd'hui (`pdv` et `catalogue` ne sont pas codés). **Échec fermé** : une fiche absente, ce sont des
  mentions manquantes, jamais une désignation inventée (l'`articleId` reste la référence imprimée si la fiche n'en donne
  pas).
- **D-1065-5 — Le refus se juge dans la transaction du numéro** : paramètres, client et articles sont lus avec la
  session de `emettreDansUneTransaction` ; une mention manquante lève avant toute écriture, la transaction est annulée et
  **aucun numéro n'est consommé** (FR-43 : un brouillon abandonné ne crée aucun trou). 409 `MENTION_OBLIGATOIRE_MANQUANTE`,
  `details.manquantes : [{ code, fiche: ORGANISATION | POINT_DE_VENTE | ARTICLE | PARAMETRES, id }]` : l'écran nomme la
  fiche à compléter. La facture `BROUILLON` liée à une livraison (AD-6, chemin du consommateur) vient avec la facture par
  livraison ; ici, le geste est direct et l'utilisateur voit le refus.
- **D-1065-6 — Les mentions sont figées sur la facture** (`mentions` : la version des paramètres, la fiche de
  l'émetteur, celle du client, la désignation et la référence de chaque ligne, les pénalités, l'escompte, la durée de
  conservation) : le PDF se rend **des seules données de la facture**, des années plus tard, quoi qu'il advienne des
  fiches. La facture reste figée (AD-6) : seuls son ouverture de Créance et l'état de son PDF évoluent.
- **D-1065-7 — Le PDF est asynchrone, stocké dans MongoDB, vérifié à chaque lecture.** La facture naît `pdf.etat =
  EN_ATTENTE` dans la transaction du numéro ; le PDF est produit juste après la réponse (sans l'attendre : NFR-7), puis
  par un balayage périodique (`FACTURATION_PDF_INTERVALLE_MS`, 2 s ; une panne ou un redémarrage ne le perd pas) ; cinq
  échecs le passent `ECHEC` (motif). Les octets vont dans `facturation_pdfs` (un document par facture, index unique,
  écriture majoritaire et journalisée, AD-30) **avant** que la facture passe `PRODUIT` (empreinte SHA-256, taille, date).
  Deux producteurs concurrents rendent les mêmes octets : l'index en garde un, l'autre compare l'empreinte (un écart est
  un défaut, `PDF_NON_DETERMINISTE`, jamais un écrasement). Pas de MinIO : aucune dépendance d'infrastructure neuve, un
  PDF de facture tient en quelques dizaines de Ko. Conservation : `conserverJusquAu` = émission + 10 ans (paramètre,
  NFR-10) ; aucune purge n'est codée (aucune ne serait due avant 2036).
- **D-1065-8 — Le rendu : pdfkit 0.19.1 épinglé, Liberation Sans embarquée.** pdfkit est déjà la bibliothèque de
  `bilan-service` et `balance-service` (même version) ; il rend sans navigateur. Les polices (Liberation Sans normale et
  grasse, licence SIL OFL 1.1) sont copiées dans le dépôt avec leur licence et figées par leurs empreintes : les
  polices standard du PDF ne sont pas embarquées, et une police du système changerait le fichier d'un poste à l'autre.
  Déterministe par construction : dates du document = instant d'émission, identifiant du fichier dérivé de ces dates,
  aucune lecture de l'horloge ni d'aléa ; A4 ; pied « FAC-… — page n / N » sur chaque page ; libellés en français,
  montants « 344 560 F », dates jj/mm/aaaa (NFR-8), heure de Lomé (UTC). Le vocabulaire par verticale (AD-15) ne
  s'applique pas : `facturation` est propre au distributeur.
- **D-1065-9 — La route du PDF** est celle du manifeste, sous le préfixe du module : `GET
  /api/v1/facturation/factures/{factureId}/pdf` (`facturation:facture:consulter`), les octets stockés, jamais un rendu à
  la volée (« PDF figé, jamais régénéré ») ; `Content-Disposition: attachment; filename="<numéro>.pdf"`, `ETag` et
  `X-Empreinte-Sha256`. Hors portée : la même 404 `FACTURE_INCONNUE` que la lecture (AD-23 « un objet hors portée rend
  introuvable » prime sur le nom `FACTURE_HORS_PERIMETRE` du PRD, comme en 1059). Une facture émise avant cette story
  n'a ni mentions ni PDF : 409 `PDF_INDISPONIBLE` (aucune n'existe hors des piles de recette).
- **D-1065-10 — Le lien public** (AD-33) : un jeton de 128 bits (`randomBytes(16)`, base64url, 22 caractères), dont
  seule l'empreinte SHA-256 est gardée (index unique) ; l'adresse (`FACTURATION_LIENS_BASE_URL` + `/<jeton>`) n'est rendue
  **qu'une fois**, à la création. Le rejeu par la même `Idempotency-Key` rend le même lien **sans** l'adresse (`url:
  null`) : le jeton n'existe plus nulle part ; qui l'a perdu révoque et en crée un autre. Une facture peut avoir
  plusieurs liens ; un lien ne donne que sa facture. Durée figée à la création (`dureeDuLienJours`, 7 par défaut, 1 à
  30). Créer et révoquer : `facturation:facture:emettre` sur la portée d'écriture ; lister : `facturation:facture:consulter`
  (jamais ni jeton ni empreinte).
- **D-1065-11 — La route publique** : `GET /api/v1/facturation/liens-publics/{jeton}`, `@Public()`, sans garde de
  module ni de droit, **exemptée par un statut neuf de l'invariant des routes** (« route publique d'AD-33 » : GET
  seulement, un seul contrôleur, celui de `facturation`). Jeton mal formé ou inconnu : **la même 404 `LIEN_INCONNU`**
  (même corps, aucune lecture de la base pour un jeton mal formé) ; expiré ou révoqué : 410 `LIEN_EXPIRE`,
  `LIEN_REVOQUE` (celui qui tient un jeton valide apprend seulement qu'il a vécu) ; PDF pas encore produit : 503
  `PDF_EN_ATTENTE` (`Retry-After`). Réponse `inline`, `Cache-Control: no-store`, `X-Robots-Tag: noindex`,
  `Referrer-Policy: no-referrer`. Débit : 30 ouvertures par minute et par adresse (garde de débit du service). L'état
  publié du module n'est pas relu : l'expiration et la révocation sont les contrôles d'AD-33 ; la désinstallation
  effacera les liens avec les routes C13 de `facturation`.
- **D-1065-12 — Chaque ouverture est tracée, sans donnée personnelle** : dans une transaction, le compteur du lien
  (`ouvertures`, `derniereOuvertureLe`) et une ligne de la piste du module (`OUVERTURE_DU_LIEN`, acteur `LIEN_PUBLIC`,
  le lien, la facture, le rang de l'ouverture) ; une ouverture refusée d'un lien connu aussi (`OUVERTURE_REFUSEE`,
  motif). Aucune adresse IP ni agent n'est gardé : la finalité n'est pas établie. Création et révocation sont tracées
  (`CREATION_DU_LIEN`, `REVOCATION_DU_LIEN`).
- **D-1065-13 — Un droit neuf, aucun fait neuf.** `facturation:parametres:modifier` (C7 ; hors de l'annexe B.2, comme
  `commande:parametres:modifier` et `terrain:parametres:modifier`) ; rôle par défaut proposé : **DAF** (la fiche légale
  et les coordonnées de paiement), **→ B** (catalogue de tenant d'`auth`, hors du jeton). Jusque-là, `PUT` répond 403 à
  tous (échec fermé ; aucun écran ne l'appelle) et l'émission refuse `MENTION_OBLIGATOIRE_MANQUANTE` tant que la fiche
  de l'émetteur est vide. Aucun fait ne change : `facturation.facture.emise@1` ne porte ni mention ni PDF.
- **D-1065-14 — Ce qui reste (la facture juste (4) et suivantes)**, dans l'ordre conseillé : (1) **l'avoir** (STORY-1066 :
  `AV-`, son PDF « Avoir » avec la référence de la facture) ; (2) **l'envoi par `notification`** : le geste « envoyer »
  crée un lien et remet le message à `notification` (route de service des messages porteurs d'un secret, `propos`
  `facture.lien` au périmètre de `ventes`), WhatsApp puis repli SMS, e-mail avec le PDF joint ; statut `ENVOYE` /
  `ECHEC` (raison, date, auteur) sur la facture ; « non installé » sans `notification` ; essai : FR-23 ; (3) la facture
  par livraison, le brouillon lié à la livraison et son filigrane « BROUILLON — sans valeur » ; (4) la liste des
  factures et les balances ; (5) les routes C13 de `facturation` (dont l'effacement des liens et la conservation des
  pièces, NFR-10) ; la proforma et son PDF ; le lien de paiement (FR-47) ; l'image de signature et de cachet.

## Contrat annoncé avant le code

Annoncé dans le journal de D, « ⚠ Contrats », avant la fusion du code (cette PR). **Ajouts seuls** ; aucun fait ne
change ; un droit neuf au manifeste `facturation` (C7).

- **Routes neuves** (préfixe `/api/v1/facturation`) : `GET /parametres`, `PUT /parametres` (corps `{ versionAttendue,
  valeurs, motif }`) ; `GET /factures/{factureId}/pdf` ; `POST /factures/{factureId}/liens` (`Idempotency-Key`), `GET
  /factures/{factureId}/liens`, `POST /factures/{factureId}/liens/{lienId}/revocation` ; **`GET
  /liens-publics/{jeton}`, publique**.
- **Routes changées** (ajouts) : `POST /factures` peut refuser 409 `MENTION_OBLIGATOIRE_MANQUANTE` ; la facture rendue
  gagne `mentions`, `parametresVersion`, `pdf { etat, empreinteSha256, octets, produitLe }`.
- **Collections neuves** : `facturation_parametres`, `facturation_clients_lus`, `facturation_articles_lus`,
  `facturation_pdfs`, `facturation_liens_publics`.
- **Configuration** : `FACTURATION_LIENS_BASE_URL` (l'adresse publique des liens, derrière la passerelle),
  `FACTURATION_PDF_INTERVALLE_MS`.
- **Dépendance** : `pdfkit` 0.19.1 (épinglée).
