# Relecture adversariale — spine Assurance (chaîne sinistres)

Cible : `ARCHITECTURE-SPINE.md` (draft 2026-11-13), lue en entier (le PRD de 965 Ko n'a pas été relu en entier : les trous ci-dessous sont déduits de la spine ; les FR cités sont ceux que la spine cite).

**Verdict : la spine tient bien les frontières de propriété sur le papier, mais deux équipes qui la suivent à la lettre peuvent encore payer un ordre deux fois, produire deux numéros de sinistre, faire sortir de la donnée de santé par un chemin non listé et laisser la Reprise écraser une action faite dans Prospera ; 7 trous critiques sont à fermer avant les stories.**

Décompte : CRITIQUE 7, HAUTE 11, MOYENNE 7.

Format : paire (A = unité 1, B = unité 2), scénario, AD à créer ou resserrer, texte de la Rule proposé.

---

## CRITIQUE

### CR-1 — `reglementId` « stable » mais jamais défini : un même paiement dû, deux ordres, deux clés d'idempotence
- **Paire** : A = dev de `sinistres` (ordre, transition 14) ; B = dev de `paiement` (clé d'idempotence = `reglementId`).
- **Scénario** : A génère `reglementId` à l'enregistrement de l'ordre (UUID). Cas 1 : restauration (AD-20) : l'ordre `reglementId=X` a été reçu et payé par `paiement`, la base de `sinistres` revient avant ; la gestionnaire ré-enregistre l'accord, A génère `Y`, `paiement` ne voit aucun doublon (clé différente) ; le doublon « même bénéficiaire, même sinistre, 30 jours » est évalué… par qui ? A le fait avant émission sur sa propre base (qui a perdu X), B ne le fait pas (AD-5 dit « avant émission » sans nommer le service). Cas 2 : chèque annulé en opposition puis chèque de remplacement : nouvel ordre ou même `reglementId` ? Les deux lectures sont conformes à AD-5. Cas 3 : dossier repris avec `reglement-historique` (écrit dans `sinistres`, absent du registre de `paiement`) : le reste à payer et le contrôle de doublon ignorent ce qui a été payé avant Prospera.
- **AD à créer : AD-5 resserré + nouvel AD-22 « Identité d'un ordre »**.
- **Rule proposée** :
  - `reglementId` est **dérivé de façon déterministe** : `sha256(organisationId | dossierId | accordId | nature | rang)` ; jamais tiré au sort ; ré-enregistrer le même accord redonne le même `reglementId`. Un remplacement de chèque porte le **même** `reglementId` plus un `rangTentative` incrémenté ; il n'est accepté par `paiement` que si le rang précédent est `CHEQUE_EN_OPPOSITION` ou `ECHEC` confirmé.
  - Le **contrôle de doublon** est évalué par `paiement` (seul à voir tous les règlements), à la réception de l'ordre, sur sa propre table ; `sinistres` ne fait qu'un contrôle d'avertissement qui ne vaut pas garde.
  - Le registre de `paiement` reçoit aussi les règlements historiques repris (objet `reglement-historique`, état `PAYE`, marque `HISTORIQUE`, non rejouable) ; le « reste à payer » de `sinistres` se calcule sur les faits de `paiement` **et** ces historiques ; un dossier repris sans l'historique complet est « reste à payer non fiable » et **ne peut pas libérer d'ordre**.

### CR-2 — Les honoraires d'expertise ont deux chemins vers `paiement`
- **Paire** : A = `expertises` (publie `expertises.honoraires.vises@1`, diagramme : `E → P`) ; B = `sinistres` (« seul écrivain de l'ordre », nature `HONORAIRES`, AD-5 : « les honoraires naissent du visa de RESP donné par `expertises` »).
- **Scénario** : A, lisant le tableau d'AD-2 (`paiement` lit « honoraires visés d'`expertises` »), fait créer le règlement chez `paiement` à partir du fait `honoraires.vises`, avec un `reglementId` choisi par `expertises`. B, lisant AD-5, crée l'ordre `HONORAIRES` en consommant le même fait, avec son propre `reglementId` et ses références d'acteur (`ordonnePar`). `paiement` reçoit deux ordres pour la même note : deux paiements. De plus le cumul interdit (AD-7) ne peut pas s'appliquer à l'ordre de A : `expertises` ne porte pas `ordonnePar`.
- **AD à resserrer : AD-2 et AD-5.**
- **Rule proposée** : « Il n'existe qu'un chemin vers `paiement` : un ordre publié par `sinistres`. `expertises` ne publie jamais vers `paiement` ; `paiement` ne consomme aucun fait d'`expertises`. `sinistres` crée l'ordre `HONORAIRES` en consommant `expertises.honoraires.vises@1`, `reglementId` dérivé de `(noteId, rang)` (CR-1), avec `ordonnePar` = le visa de `RESP`. Retirer la flèche `E → P` du diagramme et la colonne « honoraires visés » de la ligne `paiement` d'AD-2. »

### CR-3 — Le numéro officiel a quatre écrivains possibles
- **Paire** : A = `sinistres` (dossier, `DEC-`, paramètre `attributeur`, consomme `numero-sinistre.attribue`) ; B = `liaison-assureur` (« seul écrivain du numéro officiel et de la voie ») ; C = point d'import de `sinistres` pour l'objet `sinistre` repris (clé d'origine = numéro du LC) ; D = `liaison-assureur.sinistre-existant.recu@1` (nuit).
- **Scénario** : le dossier de `sinistres` a un champ « numéro officiel » (il doit l'afficher et le chercher) : A le recopie du fait ; une recherche par numéro lit la copie de A, une alerte « sans numéro » lit la base de B : deux sources. Si `attributeur = PROSPERA`, qui génère `PRO-SIN-AAAA-NNNN` ? A (il tient les compteurs) ou B (il écrit le numéro officiel) ? Les deux le font, chacun à la lettre. Un dossier repris porte son numéro d'origine via le point d'import (C) **et** via `sinistre-existant.recu` (D) : B voit « numéro déjà attribué » (`NUMERO_OFFICIEL_DEJA_ATTRIBUE`) et ouvre un écart pour chaque dossier repris. Le contrôle d'unicité « contre les numéros du LC au basculement » est refusé par B en cas de conflit mais le basculement est un paramètre de A.
- **AD à resserrer : AD-6 (+ AD-14).**
- **Rule proposée** :
  - « `sinistres` ne stocke **aucun** numéro officiel : le champ affiché est une **projection** `(valeur, lueLe, cleOrigineLC)` posée par le seul consommateur de `liaison-assureur.numero-sinistre.attribue@1`, jamais par une commande. Recherche et alerte lisent cette projection ou la route de lecture de `liaison-assureur`.
  - Le numéro `PRO-SIN-…` est généré par `liaison-assureur` (compteur propre, `epoque` d'AD-20), sur demande `liaison-assureur.numero.demande@1` de `sinistres` ; le paramètre `attributeur` est un paramètre **de `liaison-assureur`**, lu par `sinistres` seulement pour l'affichage.
  - Pour un dossier repris, le numéro d'origine arrive **uniquement** par `sinistre-existant.recu` (liaison) ; l'objet `sinistre` du point d'import de `sinistres` **ne porte pas** de numéro officiel ; `liaison-assureur` le rattache en `voie = REPRISE` sans écart. »

### CR-4 — La classification « santé » n'a pas de registre commun ni de couverture des copies
- **Paire** : A = dev de `sinistres` (classe ses champs « santé ») ; B = dev de `ged` / `assurance` / `reprise` / `notification`.
- **Scénario** : AD-8 dit « un test de contrat inspecte chaque schéma Karapace et refuse s'il porte un champ classé santé » mais ne dit **qui tient la liste des champs classés** : A classe `lesionsDeclarees` et pas `natureDuVolet=CORPOREL`, `tauxIPP`, `montantCorporel` ; B (`assurance`) met `volet` et la provision corporelle dans `assurance.provision.changed@1` ; le test passe des deux côtés. Autres chemins non couverts : (1) la **piste d'audit** `<code>_audit` (AD-17) stocke « état avant et après » et un **motif libre de 10 caractères ou plus** : les champs de santé y sont copiés en clair, lisibles de `DG`/`RESP`/`AUD` sans l'accès par dossier d'AD-8 ; (2) les **rapports de lot et tables de correspondance** de `reprise` contiennent des lignes sources (pièces médicales, diagnostics) alors que `reprise` n'est pas dans les écrits d'AD-8 ; (3) les **journaux applicatifs**, traces d'erreur et files mortes (poison-pill Kafka, AD-9) conservent le corps du message ; (4) le **texte lu par OCR** est stocké en clair « en plus » de l'image (AD-9) alors que « une pièce de santé est chiffrée avant écriture » ; (5) l'**export d'états** (CRCA, `etat-sinistres`) agrège par volet corporel ; (6) un fait `type: DOCUMENT_MEDICAL` avec `pieceId` + dossier + date révèle déjà qu'un assuré a un document médical (ce que AD-8 admet pour `ACC` mais pas pour le bus).
- **AD à resserrer : AD-8, AD-17 ; créer un registre dans `prospera-plateforme/contrats/assurance/classification-sante.json`.**
- **Rule proposée** :
  - « Il existe **un registre unique, versionné et épinglé au build** (`classification-sante`) listant chaque champ de chaque schéma (API, fait, audit, export, journal) avec `SANTE | NON_SANTE | INDUCTIBLE_SANTE` (ex. volet corporel combiné à un montant ou un taux). Tout schéma enregistré doit référencer ce registre ; un champ absent du registre refuse le schéma (CI). Le test de contrat des faits vérifie aussi `INDUCTIBLE_SANTE` : refus d'un fait portant volet corporel **et** un montant, un taux ou une garantie corporelle.
  - La piste d'audit enregistre, pour un champ `SANTE`, `valeurAvant/valeurApres = <chiffré>` ou `<masqué>` ; le motif est un **code d'une liste fermée** + texte libre **chiffré** pour les actes sur une pièce ou un champ de santé, lisible sous `sante:lire` seulement.
  - Les corps de message sont **masqués** dans journaux applicatifs, files mortes et rapports de lot de `reprise` (la ligne est renvoyée par numéro de ligne et code d'erreur, jamais par valeur) ; le texte OCR d'une pièce `SANTE` est chiffré comme la pièce.
  - Les états et exports par volet corporel sont produits sans ventilation individuelle (seuil de 5, comme l'IA). »

### CR-5 — Reprise, prise en main et rejeu de la nuit : trois chemins d'écriture sur un dossier, dont deux hors machine à états
- **Paire** : A = dev du point d'import `sinistre` (module `sinistres`, AD-14) ; B = dev de `liaison-assureur` (rejeu nocturne, `sinistre-existant.recu`) et dev de la machine d'AD-4.
- **Scénario** : la Reprise est rejouée (lot de correction, « lots rejoués dans l'espace réel » pour le feu vert) après qu'une gestionnaire a pris en main le dossier et fait avancer le statut (transition `PIECES_ATTENDUES → EN_INSTRUCTION`). Le point d'import (A) applique le schéma d'objet de la cible : « les règles métier restent chez la cible » mais **aucune règle ne dit** que l'import d'un dossier « tenu par Prospera » devient un écart. A, conforme, réécrit statut, montants, dates d'origine ; AD-4 (« seul `sinistres` change le statut, par une commande ») est lu par A comme couvrant l'import (c'est `sinistres` qui écrit). Parallèlement B traite `sinistre-existant.recu` : écart dans la file de `liaison-assureur`, pas dans l'import. Deux sources pour le même statut (table de correspondance de la Reprise vs table de correspondance des états du LC, AD-2 les attribue à deux propriétaires) ; la provision reprise est écrite par `assurance` (point d'import `police`/voisins) pendant que `sinistres` propose une provision révisée : le rejeu écrase.
- **AD à resserrer : AD-14, AD-4, AD-13.**
- **Rule proposée** : « Le point d'import d'un module est une **commande** de ce module, passant par les mêmes gardes. Pour un dossier `tenuParProspera`, tout import sur ce dossier (reprise, rejeu nocturne, resynchronisation) est **refusé champ par champ** : les valeurs divergentes vont dans la file des écarts de `liaison-assureur` (un seul endroit), jamais appliquées ; `sinistres` expose `tenuParProspera` par fait `sinistres.dossier.attribue@1`. Un dossier « suivi depuis la source » reçoit les imports sans passer par la machine, statut `SUIVI_SOURCE` distinct des onze. Un seul table de correspondance des états (celle de `liaison-assureur`) sert la Reprise et la nuit. Un import ne crée ni ne modifie jamais un mouvement de provision déjà posé par un humain : `assurance` pose les provisions reprises avec `origine = REPRISE` et motif `REPRISE`, et un rejeu n'ajoute un mouvement que si aucun mouvement `origine = HUMAIN` n'existe sur le dossier. »

### CR-6 — Un ordre déjà libéré n'est arrêté par aucun fait (litige de source, police périmée, dénonciation, restauration)
- **Paire** : A = `sinistres` (pose `libere`, évalue « litige de source » et « police à relire ») ; B = `paiement` (« refuse tout ordre non libéré », ne calcule aucun délai).
- **Scénario** : le vendredi, A libère l'ordre (`libere@1`) ; B met l'ordre en file BullMQ (virement) avec reprise après `INCONNU`. Le lundi, `liaison-assureur.ecart.ouvert@1` ou une dénonciation arrive. A bloque « les ordres du dossier » : mais l'ordre est déjà chez B, et le catalogue n'a que `reglement.annule@1` pour « ordre non remis » (flou si `EN_COURS`). B, conforme à AD-5, exécute. De même AD-1 exige « revérification de la police sur une projection assez fraîche **à l'émission** » : l'émission est faite par B, qui ne lit pas les polices. Et AD-20 : l'état « restauration en cours : aucune émission » est un état d'instance : B l'applique-t-il aux ordres déjà reçus ? Rien ne le dit.
- **AD à resserrer : AD-5, AD-1, AD-13, AD-20.**
- **Rule proposée** :
  - « Un ordre libéré porte `valideJusqua` (horodatage, paramètre `reglement.validite_liberation`, défaut 24 h) et `etatGardes` = `{policeRevue: lueLe, litige: false, suspension: false}`. `paiement` n'émet que si `maintenant < valideJusqua` ; au-delà, retour à `A_LIBERER` (fait `paiement.reglement.changed@1`). `sinistres` publie `sinistres.reglement.suspendu@1` / `.repris@1` (absolu, avec `versionDossier`) dès qu'un écart s'ouvre, qu'une dénonciation arrive, qu'une police devient « à relire » ou qu'une restauration est signalée ; `paiement` refuse d'**émettre** (pas seulement de recevoir) un ordre suspendu et ne passe pas en `PAYE` un ordre `EN_COURS` annulé : il le met en `INCONNU` pour rapprochement. La revérification de police est faite par `sinistres` à la libération et par `paiement` par la **validité** ci-dessus (pas de lecture de police). »

### CR-7 — Un ordre n'est pas déclaré immuable après libération
- **Paire** : A = `sinistres` (écrit l'ordre, « décision, bénéficiaire, montant, nature, marque libéré ») ; B = `paiement` (a déjà reçu l'ordre).
- **Scénario** : A modifie le bénéficiaire ou le RIB sur un ordre libéré (correction d'une saisie, fraude interne), republie `reglement.ordonne@1` avec le même `reglementId` et un autre bénéficiaire. B, idempotent sur `reglementId`, ignore (« même clé, rien à faire ») ou, pire, applique le dernier. Argent versé au mauvais bénéficiaire ou ordre rejoué avec un autre montant. `reglement.ordonne@1` n'a pas d'empreinte de contenu.
- **AD à resserrer : AD-5, AD-13 (patron).**
- **Rule proposée** : « Un ordre est un fait immuable : `reglement.ordonne@1` porte `empreinteOrdre = sha256(bénéficiaire, coordonnées de paiement, montant, devise, nature, moyen)`. Après réception, toute différence de contenu avec la même clé est **`ORDRE_MODIFIE_REFUSE`** (écart côté `paiement`, alerte `RESP`) ; une correction est une **annulation** puis un nouvel ordre de rang supérieur (CR-1), soumis au second contrôle. Les coordonnées de paiement ne sont jamais modifiables sur un bénéficiaire ayant un ordre non terminal, et un changement de coordonnées déclenche une revalidation par une seconde personne. »

---

## HAUTE

### HA-1 — Faits absolus (`.changed`) sans version d'état : l'ancien écrase le nouveau
- **Paire** : A = `paiement` (`paiement.reglement.changed@1`) ; B = `sinistres` (dérive `ORDRE_EMIS/REGLE`) ; idem `sinistres.dossier.changed`, `assurance.police.changed`.
- **Scénario** : partition par `organisationId` (AD-27) mais deux topics différents ; une relance, un rejeu de DLQ ou une restauration livre `PAYE` après `ECHEC` ; B écrit « dernier arrivé » ; le statut dérivé recule.
- **Rule (AD-16)** : « Tout fait `.changed` porte `versionEtat` (entier croissant par objet, écrit par son propriétaire) et `emisLe` ; le consommateur ignore un fait de `versionEtat` ≤ celle qu'il détient et demande l'état courant par la route de lecture si la version saute. Un état terminal (`PAYE`, `REGLE`, `CLOTURE`) ne se quitte que par un fait d'annulation ou de réouverture nommé. »

### HA-2 — Un paramètre, plusieurs lecteurs, plusieurs dates
- **Paire** : A = `sinistres` (version « à l'ouverture » pour l'interne, SEP-03) ; B = `paiement` (`reglement.second_controle_seuil` dans ses propres paramètres) ; C = `assurance` (« seuil glissant » de provision, copie de lecture « périmée ») ; D = `liaison-assureur` (fraîcheur).
- **Scénario** : AD-12 dit « versions par organisation » et `<code>_parametres` est **un document par module** : le seuil du second contrôle est dans `paiement` (lu à l'exécution), son pendant d'ouverture dans `sinistres` (lu à l'ouverture, 2 ans plus tôt) ; l'ordre passe chez A sans second `DG` et B l'exige, ou l'inverse. La « périmée » = double de la fraîcheur est calculée par chacun avec son paramètre.
- **Rule (AD-12)** : « Chaque paramètre a **un seul module propriétaire** (tableau annexe D → module) ; les autres le reçoivent **dans le fait** qui le met en jeu (ex. `seuilSecondControleApplique`, `parametresVersion` dans `reglement.ordonne@1`), jamais en le relisant. Pour les seuils d'argent (second contrôle, SEP-03, provision glissante, plafond d'espèces) : version **en vigueur à la date de l'acte** (validation de l'accord), pas celle de l'ouverture ; l'ouverture ne vaut que pour les délais internes. `lueLe` et « périmée » sont calculés par `liaison-assureur` seul et publiés dans `fraicheur.changed@1`. »

### HA-3 — Le rapport d'expertise a deux propriétaires
- **Paire** : A = `expertises` (« rapports et versions ») ; B = `ged` (« pièces et versions, fichier immuable »).
- **Scénario** : A stocke le fichier du rapport reçu du relais dans sa base avec versions ; B reçoit le même rapport comme pièce du dossier (la gestionnaire doit l'y voir) : deux numérotations de versions, deux empreintes, un complément remplace une version chez l'un et ajoute une version chez l'autre. Le fichier du rapport corporel (santé) est chiffré par l'un seulement.
- **Rule (AD-2)** : « Le **fichier** d'un rapport, d'une note d'honoraires ou d'une pièce de mission est une pièce de `ged` ; `expertises` ne garde que la **métadonnée** (`pieceId`, `versionPiece`, statut de mission). `expertises` dépose par route de `ged` et référence l'identifiant. »

### HA-4 — La portée de `reseau` n'est appliquée que par `sinistres`
- **Paire** : A = `sinistres` (dépend de `reseau`, filtre les dossiers) ; B = `ged` / `assurance` / `expertises` (pas de dépendance à `reseau`, AD-3).
- **Scénario** : un courtier hors portée appelle `GET /ged/pieces/:id` ou `/assurance/provisions?dossierId=` : B, conforme (il lit « dossiers et statuts » de `sinistres`, pas les portées), sert. La coque ne calcule pas les droits.
- **Rule (nouvel AD-23)** : « Tout service qui sert des données rattachées à un dossier applique la **portée** reçue dans le jeton (claims de portée émis par `auth-service` à partir de `reseau`) ou la refuse ; un test de contrat par route paramétrée par `dossierId` ou `pieceId` vérifie le refus hors portée. Aucun service ne sert une donnée de dossier sur le seul identifiant. »

### HA-5 — L'accès par dossier aux données de santé (DG/DT) n'arrive pas chez `ged`
- **Paire** : A = `sinistres` (ouvre l'accès « à la validation ») ; B = `ged` (applique `sante:lire` « par le propriétaire »).
- **Scénario** : AD-8 : capacités lues dans le jeton, « DG et DT par un accès par dossier » ; le jeton est émis avant l'ouverture ; aucun fait du catalogue (AD-16) ne transporte l'octroi `acces-sante.ouvert` : B refuse toujours (ou, pour s'en sortir, B ajoute son propre octroi).
- **Rule (AD-8/16)** : « L'accès par dossier est un objet de `sinistres` ; il est publié par `sinistres.acces-sante.accorde@1` / `.retire@1` (dossier, bénéficiaire, motif, échéance, sans contenu) et consommé par `ged`, `expertises`, `assurance`, qui le gardent en table locale de lecture. Durée limitée, retrait à la sortie de l'étape. »

### HA-6 — Dossier rouvert, pièce ajoutée, dossier scellé ou versé
- **Paire** : A = `sinistres` (`dossier.rouvert@1`, dépôt de pièces) ; B = `ged` (scellement « toute modification postérieure échoue », fonds « ne reçoit que du terminé », numéro `ARC-` jamais réutilisé).
- **Scénario** : après versement et `ARC-2027-CORP-00012`, une réouverture ; la pièce nouvelle est refusée par B (scellé) ou B ouvre une « reconstitution `/R1` » dont A ne sait rien.
- **Rule (AD-9)** : « Une réouverture publie `sinistres.dossier.rouvert@1` ; `ged` ouvre un **volume complémentaire** `ARC-…/C1` rattaché au scellé d'origine (le scellé d'origine reste valide) ; `sinistres` ne passe pas `CLOS` tant que `ged.dossier.verse@1` du volume courant n'est pas reçu. »

### HA-7 — Le LC est informé de l'argent sur quel fait ?
- **Paire** : A = `liaison-assureur` (consomme les faits de décision de `sinistres` et d'`assurance`, pas ceux de `paiement`) ; B = `sinistres` (statut dérivé).
- **Scénario** : A envoie le règlement au LC sur `reglement.ordonne@1` (rien d'autre n'est consommable) : le LC enregistre « payé » pour un ordre qui échouera (`ECHEC`, `INCONNU`). Autre dev : envoie sur `REGLE`, le LC a déjà payé de son côté (C-? règlement), double paiement. « Annulation = fait inverse » : qui le publie ?
- **Rule (AD-13/16)** : « Un règlement n'est envoyé au LC que sur `paiement.reglement.changed@1` à l'état `PAYE` (ou `PARTIEL`), converti par `liaison-assureur` en fait daté d'argent ; l'état `ECHEC` après un `PAYE` publié produit le fait inverse ; `liaison-assureur` ajoute `paiement.reglement.changed@1` à ses consommations (AD-16) ; l'ordre `ordonne` n'est envoyé au LC que comme fait « décision d'indemnité » distinct, jamais comme règlement. »

### HA-8 — Provision : clôture contre validation, et deux évaluateurs du seuil
- **Paire** : A = `sinistres` (SEP-03 « la même règle vaut pour la provision », clôture) ; B = `assurance` (seuil glissant, `a-valider`).
- **Scénario** : A clôture le dossier, publie la révision à zéro (motif « clôture ») ; la révision dépasse le seuil cumulé évalué par B, attend `RESP` ; le dossier est `CLOS` avec une provision non nulle. Deux cumuls (SEP-03 en A sur « montants acceptés et ordonnés » ; seuil glissant en B) donnent des verdicts différents sur la même révision.
- **Rule (AD-11)** : « La révision à zéro de clôture est exemptée du seuil glissant et sa validation par `RESP` est portée par la transition de clôture (déjà sous contrôle) ; `assurance` n'évalue **que** le seuil glissant ; SEP-03 reste à `sinistres` et s'applique aux montants d'argent, pas aux mouvements de provision (retirer la phrase « la même règle vaut pour la provision » d'AD-7). `sinistres` n'affiche comme « provision en vigueur » que le dernier `assurance.provision.changed@1` effectif. »

### HA-9 — Recours encaissé : entrée d'argent sans registre
- **Paire** : A = `sinistres` (recours, `recours.encaisse@1`) ; B = `assurance` (cession, « à réclamer ») / `paiement` (sortants seulement).
- **Scénario** : l'encaissement est saisi dans `sinistres` (propriétaire du recours) ; `assurance` le consomme pour la cession ; l'export comptable le reprend : un encaissement saisi deux fois (relevé + saisie) ou un remboursement coassureur compté comme recours.
- **Rule (AD-2/AD-11)** : « Un encaissement (recours, remboursement de coassureur ou de réassureur) est un fait `sinistres.recours.encaisse@1` / `assurance.coassurance.reglee@1`, de clé `(recoursId, rang)` ; il se rapproche d'un relevé, jamais d'une saisie libre ; l'export ne l'émet qu'une fois par clé. »

### HA-10 — Arrondis de répartition : cession, coassurance et totaux « au franc près »
- **Paire** : A = `assurance` (cession, coassurance, PSAP brut/cédé/net) ; B = `sinistres`/`paiement` (montants en multiples de 5 000 ou au franc, AD-18).
- **Scénario** : 100 000 francs répartis 33,33 / 33,33 / 33,34 % : A arrondit chaque ligne au franc, B au multiple de 5 000 ; « total = somme des dossiers au franc près » faux d'un franc ; l'apériteur règle une part que les coassureurs remboursent différemment.
- **Rule (AD-18)** : « Une répartition (cession, coassurance, taxes) arrondit chaque part **au franc** et attribue le reste (la différence) à la ligne de plus grande part (ou à l'apériteur) ; le multiple de 5 000 ne s'applique qu'à un montant que le système **propose** à un humain, jamais à une part calculée ; la somme des parts est égale au total par construction (test de propriété). »

### HA-11 — Compteurs sans trou : concurrence et multi-instance
- **Paire** : A = `sinistres` (`DEC-`, `QUITT-`), B = `paiement` (chèques), C = `ged` (`ARC-`).
- **Scénario** : chaque dev tient son compteur différemment (`$inc` sur un document, lecture-puis-écriture, séquence en mémoire) ; deux requêtes concurrentes ou un échec de transaction produisent un doublon ou un trou non consigné ; l'« exercice » change à minuit (fuseau ?).
- **Rule (AD-6/AD-20)** : « Tout compteur est un document `compteurs_<code>` `{cle, exercice, valeur}` incrémenté par `findOneAndUpdate({$inc})` **dans la même transaction** que l'objet numéroté ; l'exercice se juge dans le fuseau de la compagnie par le port `Horloge` ; un trou (transaction annulée) est consigné par le même code dans la même transaction. Le contrôle de séquence est un test partagé. »

---

## MOYENNE

### MO-1 — Clé d'idempotence d'une commande : portée et durée non fixées
- A = `sinistres` (cléIdempotence dans la commande) ; B = front/BFF qui rejoue. Rule (AD-4) : « La clé se conserve **sans limite** tant que le dossier existe (collection indexée `(dossierId, cléIdempotence)`) ; une même clé avec un autre contenu = `CLE_REUTILISEE` ; l'effet d'un rejeu est la réponse d'origine. »

### MO-2 — Un fait spécifique et le `.changed` du même acte
- A = `sinistres` publie `dossier.changed@1` et `dossier.cloture@1` pour la même transition ; B = `ged` consomme `dossier.cloture`, C = `assurance` consomme `dossier.changed` : ordre et version divergent. Rule (AD-16) : « Les deux faits sont écrits dans la même transaction avec la même `versionDossier` ; le fait spécifique n'est qu'un **dérivé** ; aucun consommateur n'agit sur un fait spécifique sans comparer sa `versionDossier` à celle du `.changed` ».

### MO-3 — Clé de rejeu du portail : `(missionId, version)` sans type d'acte
- A = `expertises` (acte « accusé de réception », version 1) ; B = relais (acte « rapport », version 1) : la clé est la même, le second acte est ignoré comme rejeu. Rule (AD-15) : « clé = `(missionId, typeActe, rang)` ; `rang` incrémental côté relais ; un acte de contenu différent sous la même clé est rejeté `ACTE_CONFLICTUEL`. »

### MO-4 — Changement de volet et Propositions de l'IA déjà émises
- A = `sinistres` (`portee.volet.changed@1`) ; B = `ged`/IA (garde « aucun montant corporel » par volet, lue à l'émission). Un dossier matériel devenu corporel garde des propositions chiffrées affichables. Rule (AD-10) : « Un changement de volet vers `corporel` invalide (statut `PERIMEE`, masquée) toute Proposition portant un montant ou comparable ; le volet est dans la demande, jamais lu d'un cache de plus de 0 minute (relu au moment de l'affichage). »

### MO-4bis — Les règles v0 de l'IA ne portent pas le seuil de leur paramètre
- A = module consommateur (passe un seuil), B = IA commune (utilise le sien par défaut) : `parametresVersion` absent ou différent. Rule (AD-10) : « La Proposition n'est valide que si `parametresVersion` = celle de la demande ; sinon refusée par le consommateur. » (à regrouper avec MO-4)

### MO-5 — `sinistres` seul, `attributeur = LC` et `liaison-assureur` non installé
- A = `sinistres` installé seul (AD-1 : liaison n'est pas une dépendance dure) ; la règle « dossier sans numéro > 1 jour ouvré alerte RESP » n'a aucun émetteur (c'est `liaison-assureur.sans-numero.alerte@1`) : alerte jamais levée, dossiers sans numéro officiel pour toujours. Rule (AD-6) : « Sans `liaison-assureur`, `attributeur` est forcé à `PROSPERA` et l'installation de `sinistres` refuse `attributeur = LC` (`LIAISON_REQUISE`). »

### MO-6 — Collisions avec l'existant de `prospera-assurance-service`
- A = module existant `provisions` / `etat-sinistres` (kafkajs, topics et groupes de consommateurs hérités) ; B = nouveau module `assurance` (client Confluent). Mêmes noms de topics ou groupes (`provision.*`, `sinistre.*`), deux consommateurs sur un fait pour deux effets. Rule (AD-3) : « Les topics et groupes de consommateurs du nouveau module sont préfixés `assurance.` d'AD-16 et jamais ceux de l'existant ; le module existant ne s'abonne à aucun fait d'AD-16 (test de liste d'abonnements). »

### MO-7 — Point de départ d'un délai légal : envoi, remise ou réception ?
- A = `sinistres` (offre envoyée, date de l'envoi) ; B = `notification` (`envoi.delivre@1`, consommé par A). Le délai de 15 jours de l'offre part à l'envoi chez A, à la remise chez B. Rule (AD-18) : « Le point de départ de chaque délai est déclaré dans le tableau de l'annexe D (`ENVOI | REMISE | RECEPTION`) ; la date de remise est celle de `notification.envoi.delivre@1` ou, à défaut, la saisie nominative de l'agent (courrier papier). »
