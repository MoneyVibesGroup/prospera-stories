### 5.8 Payer : de l'ordre de règlement à la remise

Cette section couvre la phase 7 du circuit : `ORDRE_EMIS`, `CHEQUE_A_REMETTRE`, `REGLE`. Elle suit la règle du PO : **celui qui décide ne paie pas**. Le service sinistres décide et émet l'ordre de règlement ; la comptabilité (`CPT`) émet le règlement ; le guichet (`ACC` ou `CPT`) le remet contre quittance signée. La comptabilité officielle reste hors de Prospera (§5.8, FR-103). Les moyens électroniques passent par le module partagé `paiement` (§7). La validation et l'offre sont décrites au §5.7 ; ici, on part d'un montant validé et d'une offre envoyée.

Deux mots à ne pas confondre dans cette section : l'**ordre de règlement** est la décision écrite de payer (il est « émis » par le service sinistres, statut `ORDRE_EMIS`) ; le **règlement** est le paiement lui-même (chèque, virement, Mobile Money), exécuté par la comptabilité ou par `paiement`.

#### FR-90 : L'ordre de règlement naît de l'accord enregistré, jamais sans

Le serveur ne crée un ordre de règlement d'indemnité qu'à l'enregistrement de l'**accord** de l'assuré ou de la victime (décision D6). L'accord est enregistré par le gestionnaire (`GEST`) ou le responsable (`RESP`), avec la pièce qui le prouve : offre signée, ou procès-verbal de transaction au corporel. Cet enregistrement déclenche la transition `OFFRE_ENVOYEE → ORDRE_EMIS` (§5.13, transition 14). Deux natures de règlement échappent à l'accord de l'assuré, car leur bénéficiaire n'est pas l'assuré : les **honoraires d'expert** (ils naissent du visa des honoraires, par `RESP` ou `CPT`, FR-91) et le règlement **à titre commercial** (il naît de la décision du `DG`, §5.7). Un acompte et une offre provisionnelle suivent la règle de l'indemnité : ils sont proposés par une offre, et leur accord est enregistré [ASSUMPTION: un acompte passe par une offre d'acompte avec accord enregistré ; à confirmer à la séance d'immersion].

**Conséquences (testables) :**
- Créer un ordre de règlement d'indemnité sur un dossier dont l'accord n'est pas enregistré est refusé avec le code `ACCORD_ENREGISTRE`.
- L'accord enregistré porte : la pièce jointe (obligatoire), la date de l'accord, l'auteur de l'enregistrement, le montant accepté. Sans pièce, l'enregistrement est refusé (`ACCORD_ENREGISTRE`).
- Le montant de l'ordre est égal au montant accepté ; il ne peut pas dépasser le montant validé (§5.7). Un ordre de montant supérieur est refusé (`MONTANT_VALIDE`).
- Au corporel, une dénonciation de la transaction reçue dans les 15 jours qui suivent sa conclusion (Code CIMA, art. 235, SÛR) est enregistrée sur le dossier ; tant que l'ordre n'est pas exécuté, elle l'annule (statut `ANNULE`, motif tracé) et le dossier repasse en `EN_INSTRUCTION`.
- Un ordre d'honoraires sans visa des honoraires est refusé (`HONORAIRES_NON_VISES`) ; le visa ne peut pas dépasser le montant facturé, et exige un motif au-delà de la lettre de mission (démo, §5.5).
- Le règlement à titre commercial sans décision du `DG` enregistrée est refusé (`DELEGATION_DG`).
- Chaque création d'ordre écrit une ligne d'audit : auteur, rôle, date et heure, montant, pièce d'accord, version des paramètres.

#### FR-91 : Un dossier peut porter plusieurs règlements

Un dossier peut avoir **plusieurs règlements** (décision D11) : un acompte, une offre provisionnelle puis une offre définitive, plusieurs bénéficiaires (victime, ayants droit, garage, représentant), les honoraires d'expert. Chaque règlement a sa nature (`INDEMNITE`, `ACOMPTE`, `PROVISIONNEL`, `HONORAIRES`, `COMMERCIAL`), son bénéficiaire, son montant, son moyen, son **état** (FR-92) et sa **quittance**. Le serveur tient en permanence trois montants du dossier : le montant **validé**, le montant **payé** (somme des règlements `PAYE`), le **reste à payer** (validé moins payé ; jamais négatif). Ces montants ne se confondent jamais avec l'évalué, le proposé (l'offre) ni la provision (vocabulaire du PRD, §3).

**Conséquences (testables) :**
- La somme des règlements d'indemnité non annulés d'un dossier ne dépasse jamais le montant validé : un règlement qui le ferait dépasser est refusé (`MONTANT_VALIDE`).
- Les honoraires se suivent à part : ils n'entrent ni dans le reste à payer de l'indemnité ni dans le calcul de la délégation de l'assuré, mais figurent dans le coût du dossier.
- Une quittance par règlement ; un règlement annulé garde sa quittance en état `ANNULEE` (jamais supprimée).
- Au corporel, le règlement est libellé exclusivement au nom de la victime ou des ayants droit, même en présence d'un conseil (Code CIMA, art. 232, SÛR) : un règlement corporel dont le bénéficiaire n'est ni la victime ni un ayant droit enregistré est refusé (`BENEFICIAIRE_CONFORME`).
- Quand le bénéficiaire est un mineur ou un incapable, le serveur exige l'enregistrement de l'avis au juge des tutelles ou au conseil de famille au moins 15 jours avant le paiement (Code CIMA, art. 234, SÛR), faute de quoi l'émission est refusée (`AVIS_TUTELLE`).
- Un dossier avec acompte payé et reste à payer positif garde son statut `ORDRE_EMIS` ou `CHEQUE_A_REMETTRE` selon FR-92 ; il n'est jamais `REGLE` tant que le reste à payer n'est pas zéro.

#### FR-92 : États du règlement, états de la quittance, statut du dossier

Chaque règlement suit une machine à états, et sa quittance une autre (décision D11). Le statut du dossier en découle : il n'est jamais saisi à la main.

| État du règlement | Sens | Ce qui le fait naître |
|---|---|---|
| `A_PAYER` | l'ordre est émis, la comptabilité ne l'a pas encore pris | création de l'ordre |
| `EN_COURS` | chèque émis non remis, ou paiement électronique lancé | émission par `CPT` |
| `PARTIEL` | une partie de la somme est payée (paiement électronique partiel, ou remise en plusieurs fois) | confirmation partielle |
| `PAYE` | remis au bénéficiaire (chèque, espèces) ou confirmé par `paiement` (virement, Mobile Money) | remise ou confirmation |
| `ECHEC` | le paiement électronique est refusé, ou une anomalie est signalée | rejet ou signalement |

| État de la quittance | Sens |
|---|---|
| `PRETE` | générée avec l'ordre, prête à éditer |
| `EDITEE` | imprimée ou mise à disposition du bénéficiaire |
| `SIGNEE` | signée par le bénéficiaire (FR-96) |
| `REMISE` | le règlement a été remis ou confirmé contre cette quittance |
| `ENCAISSEE` | l'encaissement est confirmé (rapprochement bancaire, `paiement`) |
| `ANNULEE` | annulée avant remise [ASSUMPTION: état repris de la démo, à ajouter aux cinq états de D11] |

Statut du dossier dérivé : `ORDRE_EMIS` tant qu'au moins un règlement est `A_PAYER` ou `ECHEC` ; `CHEQUE_A_REMETTRE` quand tous les règlements sont émis et qu'au moins un chèque attend sa remise ; `REGLE` quand tous les règlements sont `PAYE` et que le reste à payer de l'indemnité validée est **zéro**.

**Conséquences (testables) :**
- Un dossier avec deux règlements dont un seul est `PAYE` n'est pas `REGLE`.
- Une remise sur un dossier déjà plus avancé (acompte, règlement partiel) ne change que la quittance et l'état du règlement, pas le statut du dossier.
- Le passage `ORDRE_EMIS → REGLE` sans chèque (virement, Mobile Money) n'a lieu qu'à la confirmation de `paiement` (transition 18) ; il est refusé tant que la quittance n'est pas `SIGNEE` (`QUITTANCE_SIGNEE`).
- Un règlement `ECHEC` reste visible dans la file de la comptabilité avec la cause du refus ; le dossier ne passe pas en `REGLE`.
- Après un règlement provisionnel payé et un reste à payer nul sur le montant validé, le dossier passe en `REGLE` ; il peut ensuite repasser en `EN_INSTRUCTION` pour l'offre définitive (transition 23).
- Aucun écran ne permet de changer à la main l'état d'un règlement ou le statut du dossier ; seuls les gestes de ce chapitre les font évoluer.

#### FR-93 : La comptabilité émet le règlement, et seule la comptabilité

L'émission du règlement (le chèque, l'ordre de virement, l'ordre Mobile Money) est faite par `CPT` seul. Le service sinistres, le responsable, la direction et le contrôle interne **voient** les ordres et les règlements, ils ne les émettent pas (séparation SEP-02 de la démo : aucune sortie de trésorerie sans l'intervention d'un comptable qui n'a pas décidé). Un gestionnaire qui a instruit ou validé le dossier ne peut pas non plus enregistrer l'émission, même s'il détient aussi le rôle `CPT` (cumul de rôles, SEP-01 et SEP-02).

**Conséquences (testables) :**
- Une demande d'émission par un autre rôle que `CPT` est refusée (`DROIT_INSUFFISANT`).
- Une demande d'émission par un utilisateur qui a instruit, évalué, validé ou enregistré l'accord du dossier est refusée (`SEPARATION_DES_TACHES`) ; la tentative est tracée.
- L'émission est refusée si un signal de fraude `BLOQUE` n'est pas écarté (`AUCUN_SIGNAL_BLOQUANT`, §5.12).
- L'émission est refusée si l'un des contrôles de FR-100 est en alerte non levée (`CONTROLE_LBC_FT`).
- L'écran de la comptabilité présente les ordres à traiter par ancienneté et par échéance de FR-102 ; chaque ligne montre le bénéficiaire, le montant, le moyen demandé et les alertes.
- Chaque émission écrit une ligne d'audit : auteur, date et heure, moyen, montant, référence du chèque ou de l'ordre électronique.

#### FR-94 : Le règlement par chèque

Pour un chèque, `CPT` saisit la **banque**, le **numéro du chèque** et le **montant**. Si la compagnie utilise un gabarit, Prospera **imprime la lettre-chèque** sur ce gabarit (nom du bénéficiaire, montant en chiffres et en lettres, référence du dossier) ; sinon le chèque est rempli à la main et seul son numéro est saisi. Le chèque passe alors `CHEQUE_A_REMETTRE` (transition 17) et attend la remise du FR-97. Le gabarit est un paramètre de la compagnie ; Prospera n'en invente aucun [ASSUMPTION: la compagnie fournit son gabarit de lettre-chèque ; à défaut, remplissage manuel].

**Conséquences (testables) :**
- Une émission de chèque sans numéro, sans banque ou sans montant est refusée avec le code `ORDRE_COMPLET`, et le message nomme le champ manquant.
- Un numéro de chèque déjà utilisé pour la même banque est refusé (`NUMERO_DEJA_UTILISE`) ; Prospera signale tout trou dans la suite des numéros saisis pour une banque (alerte à la comptabilité, non bloquante).
- Le nom imprimé est celui du bénéficiaire enregistré sur le règlement ; il n'est pas modifiable à l'impression.
- Le montant du chèque est égal au montant du règlement ; un écart est refusé (`MONTANT_VALIDE`).
- La lettre-chèque imprimée est versée au dossier comme pièce, avec son numéro.
- Aucun chèque n'est émis à l'ordre d'un garage ou d'un conseil au corporel (art. 232, FR-91).

#### FR-95 : Le règlement par virement, PI-SPI ou Mobile Money

Les moyens électroniques sont **exécutés par le module `paiement`** (§7) : virement bancaire, PI-SPI, et Mobile Money (T-Money, Flooz ; les opérateurs sont paramétrables par pays). `CPT` déclenche le paiement depuis l'ordre ; `paiement` l'exécute, le rapproche et renvoie sa confirmation à Prospera. Sur confirmation, le règlement passe `PAYE` et, s'il est le dernier, le dossier passe `REGLE` (transition 18). Il n'y a pas de remise au guichet pour ces moyens : la quittance est signée **avant** le paiement (FR-96).

**Conséquences (testables) :**
- Le lancement d'un paiement électronique est refusé tant que la quittance n'est pas `SIGNEE` (`QUITTANCE_SIGNEE`).
- Le lancement est refusé si les coordonnées du bénéficiaire (RIB, numéro Mobile Money) ne sont pas **vérifiées** : numéro de compte au nom du bénéficiaire, ou numéro Mobile Money dont l'identité du porteur correspond au bénéficiaire (`COORDONNEES_VERIFIEES`).
- Chaque demande à `paiement` porte une référence unique (la référence du règlement) : un même règlement relancé deux fois ne paie qu'une fois.
- Un refus de `paiement` passe le règlement `ECHEC` avec le motif reçu ; `CPT` peut relancer après correction des coordonnées, avec motif.
- Le rapprochement bancaire des virements et du Mobile Money se fait dans `paiement` ; un écart de rapprochement de plus de 60 jours alerte la comptabilité (paramètre ; décision D16).
- Si `paiement` est indisponible, l'ordre reste `A_PAYER` ; aucun statut n'est avancé sans confirmation.

#### FR-96 : La quittance, signée avant tout paiement électronique

Chaque règlement a sa **quittance**, numérotée. Elle porte : le numéro, le dossier, le bénéficiaire, son téléphone, le montant en chiffres et en lettres, le moyen, la banque et le numéro de chèque s'il y a lieu, les dates d'édition et de signature, la référence de la transaction pour un paiement électronique, l'auteur de l'émission. Au corporel, le texte rappelle que le règlement vaut exécution de la transaction (le droit de dénonciation est déjà purgé, FR-90). La signature est **manuscrite** : au guichet, ou sur la quittance imprimée, signée puis scannée ou photographiée et retournée par l'assuré. L'**acceptation électronique par code à usage unique** est une option, activable seulement après validation juridique de la valeur de la signature électronique (loi 2017-007 non lue ; revue juridique obligatoire, D21).

**Conséquences (testables) :**
- Une quittance `SIGNEE` sans pièce de signature jointe (scan ou photo) est refusée (`QUITTANCE_SIGNEE`).
- L'acceptation électronique est indisponible tant que le paramètre n'est pas activé par l'administrateur sur décision du `DG` ; si elle est activée, le code à usage unique est envoyé au numéro enregistré du bénéficiaire, valable 10 minutes [ASSUMPTION: durée de validité du code], et la preuve (date, numéro, résultat) est versée à la quittance.
- Une quittance ne passe `REMISE` qu'avec le geste de remise (FR-97) ou la confirmation de `paiement` (FR-95).
- Une quittance `ANNULEE` ne peut plus être signée ni remise ; sa ré-émission crée une nouvelle quittance, numérotée.
- La quittance signée est versée au dossier et figure au bordereau de versement aux archives (§6.2).

#### FR-97 : La remise du chèque au guichet

À la remise, `ACC` (ou `CPT`) enregistre : l'**identité** de la personne qui retire et le **numéro de sa pièce d'identité**, et la **quittance signée** (FR-96). Le champ « retiré par » n'est jamais pré-rempli (constat de la démo). Si le retirant n'est pas le bénéficiaire (procuration, représentant légal, avocat), la pièce de pouvoir est jointe et le lien est saisi. La remise fait passer le règlement `PAYE` et, s'il est le dernier, le dossier `REGLE` (transition 20).

**Conséquences (testables) :**
- Une remise sans identité du retirant est refusée (`IDENTITE_RETIRANT`) ; une remise avec un nom mais sans numéro de pièce d'identité l'est aussi.
- Une remise sans quittance signée est refusée (`QUITTANCE_SIGNEE`).
- Une remise à une personne autre que le bénéficiaire sans pièce de pouvoir est refusée (`POUVOIR_REQUIS`) ; au corporel, le chèque reste libellé au nom de la victime ou des ayants droit (art. 232).
- La remise est refusée si un signal de fraude `BLOQUE` n'est pas écarté (`AUCUN_SIGNAL_BLOQUANT`) ; le chèque est alors mis en attente et `CPT` est alerté.
- La remise est tracée : retirant, numéro de pièce, accusé signé (oui ou non), observation, auteur, date et heure. La copie de la pièce d'identité est conservée 10 ans au moins (LBC/FT, règlement CIMA n° 0004/CIMA/PCMA/PCE/SG/08, art. 13, SÛR).
- Un gestionnaire du dossier qui n'a pas le rôle `ACC` ou `CPT` ne peut pas enregistrer la remise (`DROIT_INSUFFISANT`).

#### FR-98 : Les espèces sont plafonnées

Le règlement en espèces est un moyen exceptionnel, plafonné à **500 000 FCFA** par règlement et par bénéficiaire (paramètre ; valeur de la démo) [ASSUMPTION: la loi togolaise ne fixe aucun plafond trouvé pour les assureurs ; à valider par le juriste, D21]. Au-delà, le moyen doit être traçable (chèque, virement, Mobile Money).

**Conséquences (testables) :**
- Un règlement en espèces supérieur au plafond est refusé avec le code `PLAFOND_ESPECES`.
- Plusieurs règlements en espèces au même bénéficiaire dont le cumul sur 30 jours dépasse le plafond sont refusés au même code (anti-fractionnement).
- Chaque règlement en espèces demande le consentement écrit du bénéficiaire sur la quittance, l'identité et le numéro de pièce d'identité ; l'opération est inscrite au journal des paiements de sinistres de FR-100.
- Le plafond est un paramètre versionné ; changer sa valeur n'affecte pas les règlements déjà émis.

#### FR-99 : La comptabilité peut rejeter l'ordre

Quand `CPT` constate une anomalie comptable (bénéficiaire mal orthographié, montant incohérent avec la décision, coordonnées manifestement fausses, doublon), il **rejette l'ordre** avec un motif écrit. Le dossier repasse en `EN_VALIDATION` (transition 19), et la décision de payer doit être reprise par le circuit de validation (§5.7).

**Conséquences (testables) :**
- Un rejet sans motif d'au moins 10 caractères est refusé (`MOTIF_ECRIT`).
- Un rejet n'est possible que sur un règlement `A_PAYER` ou `ECHEC` ; sur un règlement `PAYE`, il est refusé (`ETAT_REGLEMENT`).
- Le rejet annule les règlements non payés du dossier et leurs quittances (`ANNULEE`), sans toucher aux règlements déjà `PAYE`.
- L'accord de l'assuré n'est pas perdu : la nouvelle validation s'appuie sur l'accord enregistré tant que le montant validé ne dépasse pas le montant accepté ; si la nouvelle validation fixe un montant différent, une nouvelle offre est requise et le dossier suit `EN_VALIDATION → OFFRE_ENVOYEE`.
- Le gestionnaire et le responsable reçoivent une notification avec le motif (§5.15).

#### FR-100 : Les contrôles LBC/FT avant paiement

Avant toute émission (FR-93), le serveur exécute les contrôles de lutte contre le blanchiment et le financement du terrorisme issus de la démo et du cadre CIMA : (1) **bénéficiaire vérifié** : identité et pièce d'identité du bénéficiaire en dossier ; (2) **coordonnées bancaires modifiées** dans les 5 jours qui précèdent le paiement : alerte ; (3) **doublon de règlement** : même bénéficiaire, même montant, sur 30 jours ; (4) **concentration d'émission** : un même utilisateur `CPT` émet plus de 60 % du volume sur la période ; (5) **bénéficiaire différent de la victime** sans mandat enregistré ; (6) **cumul par bénéficiaire** supérieur au seuil national LBC/FT [ASSUMPTION: seuil national non lu, paramètre vide donc alerte inactive tant qu'il n'est pas saisi ; D21]. Les contrôles 1, 3 et 5 **bloquent** ; les contrôles 2, 4 et 6 **alertent** le responsable LBC et le contrôle interne, et exigent une levée motivée avant l'émission (sauf 4, qui alerte seulement). Un journal des **paiements de sinistres** (bénéficiaire réel, moyen, origine, destination, cumul par client) est tenu et exportable pour le responsable LBC, conservé 10 ans au moins (règlement CIMA n° 0004, art. 4.5 et 13, SÛR). Le mécanisme de déclaration de soupçon relève du responsable LBC de la compagnie ; Prospera conserve l'alerte et la trace de sa suite [ASSUMPTION: la déclaration de soupçon se fait hors Prospera ; à confirmer].

**Conséquences (testables) :**
- Une émission vers un bénéficiaire dont l'identité n'est pas vérifiée est refusée (`BENEFICIAIRE_VERIFIE`).
- Une émission qui reproduit un règlement du même bénéficiaire, au même montant, dans les 30 jours est refusée (`DOUBLON_REGLEMENT`) ; une dérogation motivée du responsable est possible et tracée.
- Un changement de RIB ou de numéro Mobile Money enregistré dans les 5 jours avant l'émission déclenche une alerte au contrôle interne et exige la levée motivée de `RESP` ; sans levée, l'émission est refusée (`COORDONNEES_VERIFIEES`).
- Une émission dont le bénéficiaire n'est ni l'assuré, ni la victime, ni l'ayant droit, ni un expert, ni un garage mandaté, sans mandat enregistré, est refusée (`BENEFICIAIRE_CONFORME`).
- La part de volume de `CPT` en émissions est calculée par semaine ; au-dessus de 60 %, l'alerte apparaît dans la file du contrôle interne (`AUD`).
- Le journal des paiements de sinistres s'exporte (bénéficiaire, moyen, montant, date, cumul) pour une période, sans donner accès aux données médicales.

#### FR-101 : Le chèque non retiré se relance puis s'expose

Un chèque `CHEQUE_A_REMETTRE` non retiré se suit par son ancienneté depuis l'émission : au-delà de **7 jours**, c'est un oubli à relancer (liste d'appels du guichet) ; au-delà de **21 jours**, c'est une circulation longue signalée à la comptabilité ; au-delà de **30 jours**, c'est une **exposition** (somme due, non retirée) montrée au responsable et au contrôle interne. `ACC` relance l'assuré par appel, SMS, e-mail ou WhatsApp, avec trace du canal et du résultat (§5.14, FR-143).

**Conséquences (testables) :**
- Au 8e jour sans remise, le chèque entre dans la liste d'appels du guichet avec le nom du bénéficiaire et son téléphone ; au 22e, il entre dans l'alerte de circulation longue ; au 31e, il entre dans l'état des expositions.
- `CPT` peut **annuler** un chèque non retiré et **ré-émettre** : la quittance passe `ANNULEE`, une nouvelle quittance est créée, le dossier repasse `ORDRE_EMIS` (transition 21), avec motif obligatoire (`MOTIF_ECRIT`).
- Un chèque annulé ne peut plus être remis ; le numéro annulé reste visible dans la série de la banque.
- L'exposition apparaît dans l'état pour la comptabilité (FR-103) avec le compte d'attente concerné, sans écriture passée par Prospera.
- Le bénéficiaire qui ne retire jamais son chèque n'est pas relancé indéfiniment : après 3 relances sans effet, une proposition d'arbitrage (annulation, versement par un autre moyen, classement) est faite au responsable (§5.14, FR-143).

#### FR-102 : Le paiement sous 72 heures après l'accord

La cible interne de la compagnie est de payer **dans les 72 heures qui suivent l'accord** (procédure du groupe, mémoire de 2014, reprise comme valeur par défaut ; paramètre). Le point de départ est l'accord enregistré ; le point d'arrêt est le dernier règlement `PAYE`. Au **corporel automobile**, la loi ajoute ses propres délais : le paiement des sommes convenues se fait dans le mois qui suit l'expiration du délai de dénonciation de 15 jours (Code CIMA, art. 235 et 236, SÛR), et le retard produit de plein droit un intérêt de **5 % par mois** de retard sur le montant de l'indemnité (art. 236, SÛR ; la base de calcul est à faire valider par le juriste, D21). Pour ce régime, le point de départ de la cible interne est la fin du délai de dénonciation [ASSUMPTION: la compagnie n'émet pas avant la fin du délai de dénonciation de 15 jours au corporel ; à valider par le juriste].

**Conséquences (testables) :**
- Le dossier affiche, pour chaque règlement : la date limite interne, la date limite légale s'il y a lieu, le temps restant (négatif si dépassé), et la nature (légale, interne) de l'échéance (§5.14).
- Une alerte jaune apparaît à 48 heures de la cible interne, une alerte rouge au dépassement, dans la file de `CPT` et celle de `RESP`.
- Au corporel automobile, le dépassement du délai légal affiche la pénalité cumulée (5 % de l'indemnité par mois de retard, base paramétrable) et exige, pour la réduire ou l'annuler, un motif « circonstances non imputables à l'assureur » enregistré par `RESP` (art. 233, SÛR).
- Un dossier dont la dénonciation est ouverte n'a pas d'échéance légale de paiement avant sa fin ; la date de fin est calculée depuis la date de conclusion de la transaction.
- Les échéances légales ne sont pas modifiables par la compagnie ; la cible de 72 heures l'est.

#### FR-103 : L'état et l'export pour la comptabilité

La comptabilité officielle reste hors de Prospera (décision D16). Prospera produit un **état** et un **export** des règlements émis et remis, des honoraires d'expert, des provisions du dossier (partie 3, module `assurance`), des recours encaissés (FR-117) et des cessions. Le format suit le contrat d'échange (annexe C). L'état distingue : les règlements remis, les chèques émis non retirés (comptes d'attente), les règlements annulés à ré-émettre, les honoraires visés. La démo mettait en regard un plan de comptes CIMA ; ce plan est celui de la compagnie, il n'est jamais fixé dans Prospera [ASSUMPTION: les comptes sont saisis par la compagnie ; Prospera exporte des natures d'opération, la compagnie les affecte à ses comptes].

**Conséquences (testables) :**
- L'export d'une période liste, pour chaque mouvement : date, dossier, numéro de sinistre officiel, nature (indemnité, acompte, honoraires, recours encaissé), bénéficiaire, moyen, montant, référence du chèque ou de la transaction, statut, auteur.
- Un règlement remis apparaît une seule fois dans l'export de sa période ; un règlement annulé apparaît avec son annulation en mouvement inverse.
- Le total de l'export d'une période est égal à la somme des règlements `PAYE` de cette période ; un test de recette le vérifie sur le jeu de démonstration.
- L'export est disponible en fichier (Excel, JSON) ou par échange avec le logiciel de la compagnie (annexe C), dans les deux cas avec la date et l'heure de génération.
- L'état et l'export sont réservés à `CPT`, `RESP`, `DG`, `DT` et `AUD` ; `ACC` n'y a pas accès.
- Prospera n'affiche aucun solde bancaire : la position en banque appartient à la comptabilité de la compagnie.

### 5.9 Clore : solde à zéro, motif écrit, archives

Cette section couvre la phase 8 : `CLOTURE`. La clôture ferme le dossier sinistre ; elle ne ferme pas le recours, qui continue seul (§5.10). Le dossier clos reste consultable ; il se rouvre par un geste tracé.

#### FR-104 : Les conditions de clôture

Le gestionnaire (`GEST`) ou le responsable (`RESP`) clôture un dossier `REGLE` avec un **motif écrit**. Le serveur vérifie que : le reste à payer de l'indemnité validée est **zéro** (`SOLDE_APURE`) ; tous les règlements, honoraires compris, sont `PAYE` ou annulés (`REGLEMENT_REMIS`) ; aucune mission d'expertise n'est ouverte ; aucune offre définitive n'est attendue (cas du règlement provisionnel, FR-92) ; la question du **recours** est tranchée : un recours est ouvert, ou une décision écrite « aucun tiers en cause » est enregistrée (FR-108).

**Conséquences (testables) :**
- Une clôture avec un reste à payer supérieur à zéro est refusée (`SOLDE_APURE`).
- Une clôture avec un règlement non remis, ou une quittance `PRETE`, `EDITEE` ou `SIGNEE` non remise, est refusée (`REGLEMENT_REMIS`).
- Une clôture sans motif d'au moins 10 caractères est refusée (`MOTIF_ECRIT`).
- Une clôture avec une mission d'expertise ouverte est refusée (`EXPERTISE_VALIDEE`) ; une mission `ANNULEE` ne bloque pas.
- Une clôture d'un dossier dont la question du recours n'est pas tranchée est refusée (`RECOURS_QUALIFIE`).
- Une clôture par un utilisateur qui n'est ni `GEST`, `GREC` ni `RESP` est refusée (`DROIT_INSUFFISANT`).
- Un dossier `REJETE` ou `SANS_SUITE` n'a pas de transition vers `CLOTURE` : ce sont des sorties à part entière (§5.11).

#### FR-105 : Les effets de la clôture

À la clôture, le serveur : fixe la **date de clôture** ; ramène la **provision du dossier** à zéro, avec une ligne d'historique de provision (avant, après, motif « dossier clos ») ; inscrit le dossier dans la file « à verser aux archives » de l'archiviste (`ARCH`), avec une date limite de versement de **75 jours** après la clôture (paramètre, démo) ; démarre l'horloge de **conservation** (décision D17 : durées par nature en paramètres, 10 ans au moins, Code CIMA art. 404, SÛR) ; envoie au logiciel de la compagnie (LC) le statut « clos » et les montants définitifs, selon le contrat d'échange (annexe C) ; informe l'assuré, et le courtier le cas échéant (§5.15). Le **versement aux archives** (numéro d'archivage, bordereau, scellement) est décrit au §6.2 : il relève de `ARCH`, jamais du gestionnaire.

**Conséquences (testables) :**
- Après la clôture, la provision du dossier est zéro et l'état des provisions ne compte plus le dossier au titre des sinistres à payer ; l'historique de provision garde toutes les lignes.
- Le dossier clos apparaît dans la file de `ARCH` le jour même ; sa date limite de versement est affichée, et un dépassement alerte `RESP`.
- Un gestionnaire qui tente de verser le dossier aux archives obtient le refus `DROIT_INSUFFISANT` avec le message « Le versement relève de l'archiviste ».
- Le dossier clos reste consultable en lecture par tous les rôles qui y avaient accès, et toute lecture est journalisée.
- La date de clôture ne se modifie pas ; seule une réouverture (FR-107) la remplace, l'ancienne date restant dans l'historique.

#### FR-106 : Le recours continue seul quand le dossier est clos

Un dossier clos peut avoir un recours **encore actif** (décision D10). Le dossier montre alors un bandeau « Dossier clos, recours en cours » avec le statut du recours. Le recours a sa propre machine et sa propre clôture (FR-112) ; il reste suivi par `GREC` ; il n'empêche ni la clôture du dossier ni son versement aux archives.

**Conséquences (testables) :**
- Un dossier `CLOTURE` avec un recours `NEGOCIATION` affiche les deux états côte à côte, et la corbeille de `GREC` continue de le montrer.
- Clôturer le dossier ne modifie ni les échéances du recours, ni ses relances, ni sa prescription.
- Les pièces ajoutées au recours après le versement du dossier aux archives sont conservées dans un **bordereau complémentaire** rattaché au même numéro d'archivage [ASSUMPTION: bordereau complémentaire pour les pièces tardives du recours ; à confirmer avec l'archiviste].
- Un encaissement de recours sur un dossier clos est possible ; il n'altère pas le solde du dossier sinistre (reste à payer, provision).
- Un recours `RECUPERE` ou `ABANDONNE` ne rouvre pas le dossier.

#### FR-107 : La réouverture d'un dossier clos

Le responsable (`RESP`), le directeur général (`DG`) ou le directeur technique (`DT`) peut **rouvrir** un dossier `CLOTURE` avec un motif écrit (nouvelle pièce, aggravation, contestation, erreur). Le dossier repasse `EN_INSTRUCTION` (transition 39). La réouverture est un type d'action du journal, `REOUVERTURE`.

**Conséquences (testables) :**
- Une réouverture par un autre rôle est refusée (`DROIT_INSUFFISANT`) ; sans motif, elle est refusée (`MOTIF_ECRIT`).
- À la réouverture : la date de clôture est effacée et conservée dans l'historique ; le dossier retrouve son gestionnaire s'il est encore en fonction, sinon il est à réattribuer ; la **provision** est reposée par le gestionnaire avec motif (la provision zéro ne reste pas) ; le délai interne d'instruction repart d'un nouveau point de départ daté, sans effacer l'ancien.
- Les échéances légales du corporel (§5.14) ne repartent pas de zéro : le calcul reste celui du dossier initial, avec une alerte au responsable si l'échéance est dépassée.
- Si le dossier a été versé aux archives, la réouverture crée une demande de sortie de la chemise papier à `ARCH`, avec restitution sous 15 jours (§6.2) ; l'image numérique scellée reste consultable.
- Les règlements `PAYE` restent intacts ; un nouveau règlement suit tout le chapitre §5.8.

### 5.10 Le recours : un suivi parallèle

Dans la démo, passer en recours faisait sortir le dossier du circuit. Désormais (décision D10), le recours est un **suivi parallèle** : il naît dès l'ouverture si un tiers est en cause, vit sa propre vie et se clôt seul. Le dossier sinistre et le recours ont chacun leur machine. Le rôle `GREC` (gestionnaire recours) mène le recours ; `RESP` peut tout ce que `GREC` peut ; `DG`, `DT` et `AUD` lisent.

#### FR-108 : Le recours naît dès l'ouverture quand un tiers est en cause

À l'ouverture du dossier (§5.2), si un **tiers est en cause** (un autre véhicule, un autre assuré, un responsable identifié), le serveur crée le **recours** dans le statut `A_QUALIFIER`, le rattache au dossier et l'attribue au pôle recours (`GREC`). Un dossier peut porter **plusieurs recours**, un par tiers ou assureur débiteur [ASSUMPTION: la démo n'en porte qu'un par dossier ; un accident à plusieurs véhicules en demande plusieurs]. Un gestionnaire peut aussi le créer plus tard, dès qu'un tiers apparaît (rapport de police, rapport de responsabilité). Si l'instruction conclut qu'aucun tiers n'est en cause, le gestionnaire enregistre la décision « aucun tiers en cause » avec motif ; elle lève la condition de clôture du FR-104.

**Conséquences (testables) :**
- À l'ouverture d'un dossier avec un tiers déclaré, un recours `A_QUALIFIER` existe sans aucun geste du gestionnaire, avec la date de naissance, le débiteur présumé et la responsabilité déclarée.
- Un recours sans action depuis plus de 30 jours est signalé à `GREC` et à `RESP` (paramètre).
- Un recours `A_QUALIFIER` depuis plus de 60 jours est signalé comme « nouveau recours non traité » (paramètre, démo).
- Créer un recours ne change ni le statut du dossier ni son volet : le dossier reste sur son volet (corporel, matériel, risques divers), et la lettre du FR-109 part en parallèle.
- La décision « aucun tiers en cause » sans motif est refusée (`MOTIF_ECRIT`) ; elle est visible de `AUD`.
- Un dossier dont la responsabilité est requalifiée sur rapport d'expertise (§5.5) met à jour le recours : part du tiers, fondement.

#### FR-109 : La lettre de mise en cause part dès l'ouverture

Dès l'ouverture, une **lettre de mise en cause** est préparée pour le tiers ou son assureur : elle l'informe du sinistre, de la référence du dossier, de la mise en cause de sa responsabilité et de la réserve des droits de la compagnie. Le courrier est rédigé sur un modèle, relu, signé par `GREC` et envoyé ; sa preuve d'envoi est versée au dossier. Les pièces probantes (procès-verbal, constat, rapport de police) sont transmises progressivement, avec une copie conservée avant tout envoi (recommandation de l'audit de 2014).

**Conséquences (testables) :**
- Un recours créé avec un débiteur identifié génère une lettre de mise en cause en statut `A_PREPARER` dans la file de `GREC`, le jour de sa création.
- La lettre ne peut pas partir sans relecture et signature d'un humain ; un envoi automatique est impossible.
- Si le débiteur n'est pas encore identifié, la lettre reste `A_PREPARER` et la ligne « identifier le tiers » de la checklist (FR-112) est ouverte.
- Chaque envoi enregistre : canal (courrier avec accusé, e-mail, huissier, remise en main propre), preuve d'envoi, preuve de réception quand elle existe.
- La lettre porte la référence de déclaration, le numéro de sinistre officiel s'il est connu, et le nom de `GREC` (art. 242 : nom du gestionnaire en correspondance, SÛR, pour le corporel automobile).
- Une lettre non envoyée dans les 5 jours ouvrés après l'ouverture est signalée au responsable [ASSUMPTION: 5 jours ouvrés ; la procédure du groupe dit « dès l'ouverture » sans chiffre].

#### FR-110 : Le recours se relance tous les 15 jours

Tant que le débiteur n'a pas répondu, puis jusqu'au recouvrement, le recours est **relancé tous les 15 jours** (paramètre ; procédure du groupe, mémoire de 2014). Le point de départ est l'envoi de la lettre de mise en cause, puis de chaque relance ; le point d'arrêt est la réponse du débiteur, puis, pour le second cycle, l'encaissement complet.

**Conséquences (testables) :**
- Quinze jours après l'envoi d'une lettre sans réponse, le recours entre dans la liste « à relancer » de `GREC`.
- Une relance enregistrée (canal, date, texte) remet le compteur à zéro ; un recours non relancé depuis plus de 15 jours reste dans la liste.
- Après 3 relances sans effet, le serveur propose un arbitrage (mise en demeure, négociation, abandon) plutôt qu'une relance de plus (§5.14, FR-143).
- Le compteur de relances et la date de la dernière relance figurent sur la fiche du recours et dans l'état hebdomadaire des recours par débiteur.
- L'intervalle de 15 jours est un paramètre de la compagnie ; changer sa valeur recalcule les échéances en cours sans en effacer l'historique.

#### FR-111 : La réclamation du remboursement part après le paiement de l'assuré (subrogation)

La réclamation du **remboursement** ne part qu'**après le paiement de l'assuré** : la compagnie est alors subrogée dans les droits de la personne qu'elle a indemnisée (Code CIMA, art. 271, SÛR). Le recours passe de `PRET_A_ENGAGER` à `RECLAMATION_ENVOYEE` quand la condition `PAIEMENT_ASSURE` est remplie : au moins un règlement d'indemnité du dossier est `PAYE`. La réclamation porte sur la somme effectivement payée, pas sur la somme validée. Le délai interne de réclamation est de **30 jours** après le paiement de l'assuré (paramètre, démo).

**Conséquences (testables) :**
- Une réclamation de remboursement avant tout paiement est refusée avec le code `PAIEMENT_ASSURE`.
- Le montant réclamé ne dépasse pas la somme des règlements `PAYE` de l'indemnité multipliée par la part du tiers (FR-113) ; un montant supérieur est refusé (`MONTANT_RECLAME`).
- Trente jours après le dernier règlement `PAYE`, un recours encore sans réclamation envoyée est signalé à `GREC` et `RESP`.
- Quand l'assuré est payé en plusieurs fois, une réclamation complémentaire peut suivre chaque règlement, sur la même créance.
- Quand le débiteur est inconnu ou non assuré, la qualification enregistre « auteur inconnu » ou « auteur non assuré » : si un fonds de garantie automobile existe et est activé (paramètre par pays), le serveur ouvre l'échéancier du fonds (procès-verbal transmis dans les 60 jours de l'accident, déclaration dans les 3 mois de la réclamation, Code CIMA art. 606 et 608, SÛR) ; sinon la règle de l'art. 274 s'applique (part supportée par les autres assureurs à parts égales). Au Togo, l'existence du fonds n'est pas confirmée [ASSUMPTION: fonds de garantie automobile désactivé par défaut ; D21].

#### FR-112 : La machine du recours

Le recours a sa propre machine, reprise de la démo et complétée. Un recours porte une **checklist** (identifier le tiers, identifier son assureur, vérifier les garanties, réunir les pièces, calculer le montant, préparer la demande, programmer la relance) où chaque ligne indique fait ou non fait, date, auteur et origine.

| # | Depuis → vers | Libellé | Rôle(s) | Conditions | Motif |
|---|---|---|---|---|---|
| R1 | `A_QUALIFIER → PIECES_A_REUNIR` | Le tiers est connu, il manque des pièces | GREC, RESP | `TIERS_IDENTIFIE` | non |
| R2 | `A_QUALIFIER → MONTANT_A_CALCULER` | Tiers connu et pièce probante au dossier | GREC, RESP | `TIERS_IDENTIFIE`, `PIECE_PROBANTE` | non |
| R3 | `PIECES_A_REUNIR → MONTANT_A_CALCULER` | Pièce probante reçue | GREC, RESP | `PIECE_PROBANTE` | non |
| R4 | `MONTANT_A_CALCULER → A_VALIDER` | Créance établie | GREC | `CREANCE_ETABLIE` | non |
| R5 | `A_VALIDER → PRET_A_ENGAGER` | Montant validé | RESP | `MONTANT_VALIDE`, `SEPARATION_DES_TACHES` | non |
| R6 | `A_VALIDER → MONTANT_A_CALCULER` | Renvoi pour recalcul | RESP | — | oui |
| R7 | `PRET_A_ENGAGER → RECLAMATION_ENVOYEE` | Envoi de la réclamation (mise en demeure) | GREC | `PAIEMENT_ASSURE`, mise en demeure `A_ENVOYER` | non |
| R8 | `RECLAMATION_ENVOYEE → NEGOCIATION` | Le débiteur répond, on négocie | GREC | réponse enregistrée | non |
| R9 | `NEGOCIATION → ACCORD` | Accord conclu | GREC, RESP | `ACCORD_CONCLU` | non |
| R10 | `RECLAMATION_ENVOYEE`, `NEGOCIATION → CONTENTIEUX` | Engager le contentieux | RESP | — | oui |
| R11 | `CONTENTIEUX → ACCORD` | Transaction ou décision exécutoire | GREC, RESP | `ACCORD_CONCLU` | non |
| R12 | `NEGOCIATION → EN_ARBITRAGE` | Saisir l'arbitrage entre assureurs | RESP | débiteur de type assureur, `ARBITRAGE_APPLICABLE` | oui |
| R13 | `EN_ARBITRAGE → ACCORD` | Sentence rendue et acceptée | GREC, RESP | sentence versée | non |
| R14 | `ACCORD → RECUPERE` | Tout est encaissé | GREC | `TOUT_RAPPROCHE` | non |
| R15 | tout statut non terminal `→ ABANDONNE` | Abandonner le recours | RESP, sur proposition de GREC | issue de clôture choisie | oui |

`RECUPERE` et `ABANDONNE` sont terminaux. L'état `EN_ARBITRAGE` (R12, R13) et la possibilité d'abandonner depuis les premiers états (R15 élargie) sont des ajouts à la démo [ASSUMPTION: la démo n'abandonne que depuis RECLAMATION_ENVOYEE, NEGOCIATION et CONTENTIEUX, et n'a pas d'arbitrage].

**Conséquences (testables) :**
- Toute transition hors de ce tableau est refusée (`TRANSITION_INCONNUE`) ; toute transition dont une condition n'est pas remplie est refusée avec le nom de la condition.
- `GREC` ne valide pas sa propre créance : R5 par le même utilisateur que R4 est refusée (`SEPARATION_DES_TACHES`).
- Chaque clôture de recours (R14, R15) porte une **issue** parmi `RECUPERATION_INTEGRALE`, `ACCORD_EXECUTE`, `DECISION_DEFINITIVE`, `POURSUITE_IMPOSSIBLE`, `AUTRE`, un motif, et les pièces de clôture.
- Un abandon (R15) est proposé par `GREC` et décidé par `RESP` ; l'abandon décidé par la personne qui l'a proposée est refusé (`SEPARATION_DES_TACHES`).
- Aucun recours non terminal n'est sans issue : un test de recette parcourt la table et prouve que chaque statut non terminal a au moins une sortie.
- Chaque transition est tracée (auteur, rôle, date et heure, avant, après, motif).

#### FR-113 : La créance et ses trois montants

Chaque recours porte une **créance**, numérotée, avec trois montants qui ne se confondent jamais : le montant **réclamé** (ce que la compagnie demande), le montant **accepté** (ce que le débiteur reconnaît), le montant **encaissé** (ce qui est reçu et rapproché). La créance a ses états : `A_ETABLIR`, `ETABLIE`, `RECLAMEE`, `CONTESTEE`, `PARTIELLEMENT_RECUPEREE`, `SOLDEE`, `ABANDONNEE`. Le montant réclamé se calcule ainsi : somme des règlements d'indemnité `PAYE` du dossier, multipliée par la **part du tiers** arrêtée (responsabilité du dossier, requalifiée sur rapport d'expertise). Pour les accidents entre véhicules assurés, la part est celle du **barème de responsabilité** annexé au Livre II du Code CIMA (art. 274, SÛR), dont les tables sont à saisir (D21) ; quand la responsabilité est indéterminable, le partage par parts égales ou la règle de l'art. 275 s'applique `[à vérifier par le juriste]`. Les honoraires d'expert sont ajoutés à la base seulement si le paramètre l'autorise [ASSUMPTION: honoraires non inclus par défaut].

**Conséquences (testables) :**
- Une part du tiers égale à 70 % sur 445 500 FCFA payés donne un montant réclamé de 311 850 FCFA (chiffre de la démo, rejoué en recette).
- Une responsabilité `PARTAGEE` sans part chiffrée du tiers ne se réclame pas : la condition `RESPONSABILITE_TIERS` refuse le passage en `MONTANT_A_CALCULER` tant que la part n'est pas saisie.
- Le montant accepté ne peut pas dépasser le montant réclamé sans motif ; le montant encaissé ne peut pas dépasser le montant accepté (`MONTANT_ENCAISSE`).
- Les intérêts entre assureurs (taux de l'escompte à compter du mois qui suit la demande, art. 277, SÛR) sont affichés à part, avec la date de la demande comme point de départ ; ils ne sont jamais fondus dans le montant réclamé.
- La créance garde l'historique de ses montants (avant, après, motif, auteur).
- Une créance de plus de 90 jours non soldée est signalée comme « créance ancienne » (paramètre).

#### FR-114 : La mise en demeure

La **mise en demeure** a sa propre machine : `A_PREPARER → A_VALIDER → A_ENVOYER → ENVOYEE → RECEPTION_CONFIRMEE → REPONSE_RECUE | SANS_REPONSE`. Elle cite la subrogation, le montant réclamé, le délai accordé (30 jours par défaut), les pièces jointes (procès-verbal, rapport d'expertise, quittance d'indemnisation) et la voie contentieuse à défaut. Elle est rédigée avec l'aide de l'IA commune (FR-120), validée par `RESP`, signée, puis envoyée par un mode qui laisse une preuve : courrier avec accusé, e-mail, huissier, remise en main propre. Les effets d'une mise en demeure ou d'une reconnaissance de dette sur le cours de la prescription sont affichés comme **à vérifier** par le juriste (FR-118).

**Conséquences (testables) :**
- Une mise en demeure `A_ENVOYER` ne peut passer `ENVOYEE` sans mode d'envoi ni preuve d'envoi ; sans preuve de réception, elle ne passe pas `RECEPTION_CONFIRMEE`.
- La validation par l'utilisateur qui l'a rédigée est refusée (`SEPARATION_DES_TACHES`) : `GREC` rédige, `RESP` valide.
- À l'échéance du délai accordé sans paiement, la mise en demeure passe `SANS_REPONSE` et le recours entre dans la liste d'arbitrage de `RESP` (négociation, contentieux, arbitrage, abandon).
- Le texte généré par l'IA n'est jamais envoyé sans la relecture et la signature d'un humain ; le brouillon est conservé avec la version finale.
- Un paiement partiel reçu avant l'échéance est enregistré sur la mise en demeure (montant payé) et sur la créance.

#### FR-115 : La négociation

La **négociation** consigne les offres et contre-offres (émetteur `TIERS` ou `COMPAGNIE`, montant, commentaire, date). Elle a ses états : `EN_COURS`, `ACCORD_TROUVE`, `ECHEC`, `SUSPENDUE`. Elle s'appuie sur l'analyse de l'offre adverse du FR-120. L'accord conclu (R9) fixe le montant accepté de la créance.

**Conséquences (testables) :**
- Une offre du tiers saisie fait apparaître l'écart à la somme réclamée, en pourcentage et en FCFA.
- Un accord ne peut être enregistré (`ACCORD_CONCLU`) qu'avec la pièce de l'accord jointe et le montant accepté ; il est refusé sinon.
- `ECHEC` ouvre une proposition d'arbitrage à `RESP` ; `SUSPENDUE` demande un motif et une date de reprise.
- Un accord qui abandonne une partie de la créance au-delà d'un seuil de perte exige la validation de `DG` ou `DT` [ASSUMPTION: seuil de perte à obtenir de la compagnie ; paramètre vide, validation de RESP seule tant qu'il n'est pas saisi].
- L'historique complet des offres reste lisible sur la fiche, jamais écrasé.

#### FR-116 : Le contentieux

Le **contentieux** a sa machine : `A_ENGAGER → ENGAGE → EN_ATTENTE_DECISION → DECISION_RENDUE → TRANSACTION_A_EXECUTER → CLOS`. Il porte la nature du litige (responsabilité, montant, refus de garantie, tiers non assuré, autre), le conseil, la juridiction, la référence de la procédure et une **provision pour risque**. Il s'engage par la transition R10, décidée par `RESP` avec motif. Les honoraires du conseil sont des règlements de nature `HONORAIRES` (FR-91).

**Conséquences (testables) :**
- Engager un contentieux sans motif est refusé (`MOTIF_ECRIT`).
- Chaque étape enregistre sa date, son auteur et la pièce correspondante (assignation, jugement, transaction).
- La provision pour risque est tracée dans l'historique de provision du recours (catégorie `CONTENTIEUX`, partie 3).
- Un jugement enregistré avec un montant propose le montant accepté de la créance, à valider par `GREC`.
- Un contentieux clos sans exécution de la décision garde le recours ouvert jusqu'à encaissement ou abandon motivé.

#### FR-117 : Les encaissements se rapprochent avant d'être imputés

Un **encaissement de recours** est reçu (virement, chèque, espèces, compensation entre assureurs), déclaré par `CPT` avec sa référence bancaire et son justificatif, puis **rapproché** (`A_RAPPROCHER → RAPPROCHE | ECART`). Il n'est **imputé** à une créance qu'après la validation de son rapprochement ; il peut en solder plusieurs. Le rapprochement passe par `paiement` quand le relevé y est disponible, sinon il est confirmé à la main avec justificatif [ASSUMPTION: rapprochement des encaissements de recours dans `paiement` quand le relevé est importé, sinon confirmation manuelle ; à préciser avec le module]. Les recours encaissés alimentent l'export de la comptabilité (FR-103).

**Conséquences (testables) :**
- Un encaissement non rapproché n'augmente pas le montant encaissé de la créance.
- Un encaissement imputé à plusieurs créances garde ses affectations (créance, montant, recours) ; la somme des affectations est égale au montant de l'encaissement (`AFFECTATION_EQUILIBREE`).
- Un encaissement en `ECART` bloque le passage `ACCORD → RECUPERE` (`TOUT_RAPPROCHE`).
- La validation d'un encaissement est faite par un utilisateur qui ne l'a pas déclaré (`SEPARATION_DES_TACHES`).
- L'export comptable d'une période contient les recours encaissés (nature `RECOURS_ENCAISSE`), avec le numéro de sinistre officiel et la référence bancaire.
- Un encaissement de recours ne modifie ni le reste à payer ni la provision du dossier sinistre : la provision se tient brute, les recours à recevoir faisant l'objet d'une évaluation distincte (Code CIMA art. 334-12, SÛR).

#### FR-118 : La prescription, un terme à vérifier

Le recours affiche un **terme de prescription indicatif** : la date du sinistre plus 730 jours (« prescription biennale », paramètre), avec la mention « à vérifier » et une **alerte à 90 jours** du terme. Le serveur ne déclare jamais un recours « prescrit » ni « non prescrit » : il affiche le terme et les actes enregistrés (mise en demeure, reconnaissance de dette). Les textes lus du Code CIMA donnent une prescription de 2 ans pour l'action dérivant du contrat d'assurance (art. 28, SÛR) et de 5 ans pour l'action en responsabilité extra-contractuelle du Livre II (art. 256, SÛR) ; le recours d'un assureur subrogé relève de l'un ou de l'autre selon son fondement. Le terme applicable à chaque fondement est donc **un point de revue juridique** (D21), et le paramètre garde la valeur prudente la plus courte [ASSUMPTION: 730 jours par défaut, valeur de la démo et la plus prudente].

**Conséquences (testables) :**
- Un recours dont le sinistre date de plus de 640 jours, sans réclamation envoyée, figure en alerte rouge (90 jours avant le terme indicatif).
- Le terme se calcule sur la date de survenance du dossier ; il se recalcule si le fondement du recours change (contractuel, légal, conventionnel, autre) quand une valeur est paramétrée par fondement.
- Une mise en demeure `RECEPTION_CONFIRMEE` est enregistrée comme acte, avec sa date ; elle ne modifie pas le terme affiché tant que le juriste n'a pas validé son effet.
- L'écran affiche toujours « terme indicatif, à vérifier » à côté de la date.
- La liste des recours dont le terme approche s'exporte (référence, débiteur, créance, terme, jours restants).

#### FR-119 : L'arbitrage entre assureurs et les conventions, en paramètre

Les conflits nés des recours entre assureurs sont, selon le Code CIMA (art. 276, SÛR), **obligatoirement soumis à la Commission nationale d'arbitrage** : trois assureurs étrangers au litige, sentence dans le mois de la saisine ; les intérêts courent au taux de l'escompte à compter du mois qui suit la demande (art. 277, SÛR). Le champ de ces articles est l'indemnisation des victimes d'un véhicule terrestre à moteur ; la mise en place de la commission au Togo n'est pas confirmée [ASSUMPTION: arbitrage activé pour les recours entre assureurs automobiles, par un paramètre ; à vérifier auprès de l'association des assureurs ; D21]. Les **conventions de place** (indemnisation directe de type IDA, forfait inter-compagnies) ne sont pas supposées : aucune convention togolaise n'a été trouvée. Elles sont des **paramètres** : convention active ou non, forfait, délai de règlement entre compagnies, bordereau de recours. Le forfait de la démo (350 000 FCFA) est une valeur d'exemple, inactive par défaut.

**Conséquences (testables) :**
- Avec la convention désactivée (défaut), aucun forfait n'est appliqué au montant réclamé ; avec elle activée, le forfait s'applique aux dossiers éligibles selon la règle d'éligibilité saisie par la compagnie.
- La saisine de l'arbitrage (R12) enregistre la date de saisine, le motif et les pièces ; une alerte à un mois de la saisine rappelle la sentence attendue.
- Si l'arbitrage n'est pas activé, R12 est refusée (`ARBITRAGE_APPLICABLE`).
- Le mode d'**indemnisation directe** (la compagnie paie son propre assuré puis recourt contre l'adverse) est un réglage de convention : il ne change ni les règlements de l'assuré ni la machine du dossier.
- Un changement de paramètre de convention est tracé (ancienne valeur, nouvelle valeur, auteur, validateur, date) et n'affecte que les recours créés après lui.

#### FR-120 : L'IA du recours (usage n° 12)

L'IA commune (instance locale, partie 4) assiste le pôle recours sur deux tâches : (1) **évaluer l'offre de l'assureur adverse** ; (2) **rédiger la mise en demeure**. Pour (1), l'entrée est la créance, l'offre reçue, la responsabilité arrêtée et les pièces du dossier ; la sortie est l'écart au réclamé, une appréciation (accord rapide, négociable, à maintenir), les arguments tirés du dossier (responsabilité, expertise, vétusté) et, pour un recours qui ne se rattache pas à un dommage corporel, une **contre-proposition indicative** avec la chance d'accord. Pour (2), l'entrée est la créance et les pièces à joindre ; la sortie est le texte de la mise en demeure, avec la subrogation, le montant, le délai et les pièces. Le destinataire est `GREC`, qui édite, valide et envoie. Garde-fous : l'IA ne décide ni n'envoie rien ; chaque affirmation renvoie à sa pièce ; l'acceptation, la modification ou le rejet de la suggestion sont inscrits au **registre de l'IA** (niveau `ANALYSE` ou `RECOMMANDATION`, statut `PROPOSEE`, `ACCEPTEE`, `MODIFIEE`, `REJETEE`) ; si l'IA est coupée, tout le circuit passe ; tant qu'aucun modèle n'existe, la capacité est servie par les règles explicables de la démo et le dit. Elle est servie par l'IA commune.

Les règles de la démo sont les valeurs par défaut : écart à l'offre de 15 % ou moins, accord rapide ; de 15 à 35 %, négociable ; au-delà, maintenir et préparer le contentieux ; contre-proposition égale au plus grand de trois nombres (offre augmentée de 15 %, moyenne de l'offre et du réclamé, 80 % du réclamé). Ces seuils sont des paramètres.

**Conséquences (testables) :**
- Pour une créance de 311 850 FCFA et une offre de 250 000 FCFA, l'écart affiché est de 61 850 FCFA (environ 19,8 %), l'appréciation est « négociable », et la contre-proposition suit la formule des trois nombres, sans dépasser le montant réclamé.
- Sur un recours rattaché à un dossier corporel, aucune contre-proposition chiffrée n'est proposée ; l'analyse et les arguments restent fournis [ASSUMPTION: garde-fou du PO sur le corporel étendu au recours ; à confirmer].
- Un brouillon de mise en demeure généré n'est jamais envoyé : l'envoi demande la relecture, la validation de `RESP` et la signature.
- Chaque suggestion porte ses sources (pièce, créance, offre), consultables ; une suggestion sans source n'est pas affichée.
- Le registre de l'IA contient, pour chaque suggestion : entrée, sortie, confiance, sources, niveau, statut, auteur de la décision.
- Aucune donnée nominative ni médicale ne sort de l'instance locale ; les pièces médicales d'un dossier corporel ne sont pas lues par cette fonction.

### 5.11 Les sorties : refus, sans suite, litige, fraude suspectée

Le circuit nominal a quatre sorties : `REJETE`, `SANS_SUITE`, `LITIGE`, `FRAUDE_SUSPECTEE`. Chacune porte un **motif écrit** (règle du PO : chaque refus ou classement a un motif). `REJETE` et `SANS_SUITE` sont terminales mais se rouvrent (FR-126) ; `LITIGE` et `FRAUDE_SUSPECTEE` ont une issue qui renvoie le dossier à l'instruction ou au refus.

#### FR-121 : Le refus de prise en charge (`REJETE`) est motivé et opposable

Un dossier est refusé quand la garantie ne couvre pas le sinistre, que le contrat n'est pas valable, que l'assuré est déchu, ou qu'une fraude est confirmée. La décision de refus est prise par le responsable (`RESP`), le directeur général (`DG`) ou le directeur technique (`DT`), depuis `DECLARE`, `EN_INSTRUCTION`, `EN_VALIDATION`, ou depuis `FRAUDE_SUSPECTEE` (FR-133). Elle s'appuie sur une **décision de garantie** `REFUS_DE_GARANTIE` enregistrée (décision D4) quand le refus est un refus de garantie, avec son motif et la clause ou la condition de la police opposée (lue dans la projection du logiciel de la compagnie). Le refus est **opposable** : il est notifié par un courrier motivé (FR-122) dont la date d'envoi et la preuve sont conservées. La déchéance n'est jamais automatique : une déclaration tardive donne une réserve et un motif, le responsable décide (décision D15).

**Conséquences (testables) :**
- Un refus sans motif d'au moins 10 caractères est refusé (`MOTIF_ECRIT`) ; un refus par un rôle autre que `RESP`, `DG` ou `DT` est refusé (`DROIT_INSUFFISANT`).
- Un refus de garantie sans décision de garantie `REFUS_DE_GARANTIE` enregistrée est refusé (`DECISION_GARANTIE`).
- Au passage `REJETE`, le reste à payer et la provision du dossier passent à zéro, avec une ligne d'historique de provision (motif « refus »).
- La décision de refus par un utilisateur qui a instruit le dossier est refusée (`SEPARATION_DES_TACHES`) : le gestionnaire propose, le responsable décide.
- Un dossier `REJETE` sans courrier de refus envoyé après 2 jours ouvrés est signalé au responsable [ASSUMPTION: 2 jours ouvrés ; la procédure du groupe parle de 48 heures pour la décision et 72 heures pour l'information de l'assuré].
- Un refus de garantie sur un dossier **corporel automobile** ne supprime pas les obligations légales : l'assureur qui invoque une exception de garantie doit tout de même respecter les art. 231 à 236 « pour le compte de qui il appartiendra » (Code CIMA, art. 237, SÛR) ; le dossier garde donc ses échéances d'offre en alerte (§5.14), et, si un fonds de garantie automobile est activé, l'alerte « déclaration au fonds sous 3 mois de la réclamation » (art. 608, SÛR) `[à vérifier par le juriste : traitement du dossier refusé au corporel]`.
- Un recours ouvert sur un dossier refusé, sans aucun règlement `PAYE`, est proposé à l'abandon au responsable (FR-112, R15) ; il n'est jamais abandonné automatiquement.

#### FR-122 : Le courrier de refus est rédigé par l'IA, relu et signé (usage n° 11)

Le courrier de refus est un **brouillon rédigé par l'IA commune** (usage n° 11), relu et signé par un humain avant tout envoi. L'entrée est la décision de refus, son motif, la garantie visée et la clause de la police opposée ; la sortie est un projet de courrier : exposé des faits, motif, clause, voie de contestation (« une réclamation écrite accompagnée de tout élément nouveau », texte de la démo), nom du gestionnaire et référence du dossier. Le destinataire du brouillon est le signataire (`RESP`, ou `DG` ou `DT` pour un enjeu supérieur au seuil de délégation du responsable, §5.7). Garde-fous : l'IA ne signe ni n'envoie ; chaque motif cité renvoie à sa pièce ou à sa clause ; le brouillon et la version signée sont conservés tous deux ; la suggestion est inscrite au registre de l'IA (niveau `RECOMMANDATION`, statut `PROPOSEE`, `ACCEPTEE`, `MODIFIEE` ou `REJETEE`) ; si l'IA est coupée, un modèle de courrier à compléter prend sa place. Elle est servie par l'IA commune. Aucun article de loi n'est cité dans le courrier sans qu'il figure au référentiel juridique validé de la compagnie (D21).

**Conséquences (testables) :**
- Un courrier de refus passe `A_IMPRIMER` ou `ENVOYE` seulement après la signature de `RESP`, `DG` ou `DT` ; un courrier non signé reste `BROUILLON`.
- Le courrier mentionne la voie de contestation ; un modèle sans cette mention est refusé à la validation du modèle (`MENTION_OBLIGATOIRE`).
- Sur un dossier corporel automobile, le courrier porte le nom du gestionnaire du dossier (art. 242, SÛR).
- Le registre de l'IA contient l'entrée, la sortie, la confiance, les sources, le niveau, le statut et l'auteur de la décision ; un test de recette rejoue un refus avec chaque statut.
- Aucune donnée médicale n'est lue par la fonction de rédaction ; si le refus s'appuie sur une pièce médicale, le motif est écrit par un humain habilité (`MED`, `RESP`, `DG`, `DT`).
- Le courrier part par un canal qui laisse une preuve (courrier avec accusé, remise en main propre, e-mail avec accusé) ; le canal et la preuve sont enregistrés.

#### FR-123 : Le classement sans suite quand l'assuré est injoignable

Un dossier est classé **sans suite** (`SANS_SUITE`) quand l'assuré (ou la victime) est injoignable après les relances réglementées du FR-143 : au moins 3 relances sans effet, par au moins deux canaux, et 15 jours sans réponse après la dernière [ASSUMPTION: 15 jours après la dernière relance, d'après le texte de la 3e relance de la démo]. Le classement se fait depuis `PIECES_ATTENDUES`, `EN_INSTRUCTION` ou `OFFRE_ENVOYEE`, par `GEST` ou `RESP`, avec motif. Un dernier courrier de classement est envoyé à la dernière adresse connue. Au corporel automobile, où l'offre est due « indépendamment de la réclamation de la victime » (Code CIMA, art. 231, SÛR), le classement sans suite exige la décision de `DG` ou `DT` et n'efface pas les échéances légales [ASSUMPTION: classement sans suite d'un dossier corporel réservé à la direction ; à valider par le juriste].

**Conséquences (testables) :**
- Un classement avec moins de 3 relances enregistrées, ou avec 3 relances sur un seul canal, est refusé (`RELANCES_EPUISEES`).
- Un classement sans motif est refusé (`MOTIF_ECRIT`).
- Un classement sans suite d'un dossier corporel automobile par `GEST` ou `RESP` est refusé (`DECISION_DIRECTION`).
- Au classement, la provision du dossier passe à zéro avec motif ; les échéances internes s'arrêtent ; les échéances légales du corporel restent affichées en alerte au responsable.
- Un dossier classé sans suite n'entre pas dans la file « à verser aux archives » avant 30 jours [ASSUMPTION: délai de grâce de 30 jours avant versement, pour laisser l'assuré se manifester].
- Le classement est tracé : relances enregistrées (canal, date, résultat), motif, signataire, courrier de classement.

#### FR-124 : Le litige quand l'offre est refusée ou contestée

Un dossier passe en **litige** (`LITIGE`) quand l'assuré refuse l'offre (avec contre-expertise demandée), quand il conteste l'évaluation, ou quand un désaccord de fond oppose les parties. Le passage est décidé par `RESP`, `DG` ou `DT`, depuis `EVALUE`, `EN_VALIDATION` ou `OFFRE_ENVOYEE`, avec motif. En litige, le responsable ou la direction peut **ordonner une contre-expertise** (au sens interne de la compagnie, §5.5) ; le litige se **résout** par un retour à `EN_INSTRUCTION` avec un motif de résolution (rapport retenu, accord trouvé sur le principe, nouvelle évaluation). Une **contre-proposition** de l'assuré à l'offre n'est pas un litige : le dossier revient en `EN_INSTRUCTION` avec motif (§5.7).

**Conséquences (testables) :**
- Un passage en litige sans motif est refusé (`MOTIF_ECRIT`) ; par un rôle autre que `RESP`, `DG` ou `DT`, il est refusé (`DROIT_INSUFFISANT`).
- Un litige est résolu par une transition `LITIGE → EN_INSTRUCTION` avec motif ; sans motif, elle est refusée.
- Un dossier en litige ne peut pas recevoir d'ordre de règlement ni de nouvelle offre tant qu'il n'est pas revenu en `EN_INSTRUCTION` (`ACCORD_ENREGISTRE`, `TRANSITION_INCONNUE`).
- À l'entrée en litige, la provision est revue avec motif ; un écart de 2 000 000 FCFA ou plus attend le responsable (paramètre, §6).
- Les échéances légales du corporel continuent de courir pendant le litige ; les suspensions et prorogations légales (expert commun, +1 mois, art. 252 et 252 bis, SÛR) se saisissent à la main et se tracent (§5.14).
- Au corporel automobile, le litige ne peut être porté en justice avant l'expiration du délai d'offre de l'art. 231 (art. 239, SÛR) : le dossier l'affiche.
- Les honoraires d'un conseil mandaté par la compagnie pour le litige sont des règlements de nature `HONORAIRES` (FR-91).

#### FR-125 : La fraude suspectée suspend le paiement sans le dire à l'assuré

Un dossier passe `FRAUDE_SUSPECTEE` quand un humain **signale** une suspicion de fraude : `GEST`, `GREC`, `RESP`, `DG`, `DT` ou `AUD`, avec motif, depuis `EN_INSTRUCTION`, `EVALUE`, `EN_VALIDATION`, `OFFRE_ENVOYEE`, `ORDRE_EMIS` ou `CHEQUE_A_REMETTRE` (la démo n'offrait que les deux premiers [ASSUMPTION: extension aux états de paiement, car une suspicion peut naître à tout moment]). Dans cet état, aucun geste de paiement n'est possible. Le dossier sort par l'écartement de la suspicion (retour `EN_INSTRUCTION`) ou par la confirmation (passage `REJETE`), décrits aux FR-129 et FR-133. La suspicion n'est **jamais révélée** à l'assuré ni au courtier : les écrans et les messages qui leur sont destinés disent « dossier en cours d'instruction ».

**Conséquences (testables) :**
- Un signalement sans motif est refusé (`MOTIF_ECRIT`).
- Depuis `CHEQUE_A_REMETTRE`, le signalement suspend la remise ; la comptabilité reçoit une alerte pour décider d'une opposition sur le chèque, et la quittance passe `ANNULEE` si l'opposition est faite.
- Dans l'état `FRAUDE_SUSPECTEE`, une demande d'émission, de remise ou de paiement est refusée (`AUCUN_SIGNAL_BLOQUANT`) ; l'accord de l'assuré, s'il est reçu, est enregistré mais ne crée pas d'ordre.
- La vue de l'assuré, le message de suivi, et toute notification externe n'emploient aucun mot qui évoque la fraude ; un test lit chaque modèle de message sortant.
- Les échéances légales du corporel continuent de courir ; elles sont affichées en alerte au responsable et à `AUD`.
- L'accès au contenu de la revue est réservé à `RESP`, `DG`, `DT` et `AUD` ; les autres rôles voient seulement « suspendu ».

#### FR-126 : La réouverture des sorties

Les dossiers `REJETE` et `SANS_SUITE` peuvent être **rouverts** par `RESP`, `DG` ou `DT`, avec motif écrit : sur contestation de l'assuré après un refus (transition 40), ou parce que l'assuré se manifeste après un classement sans suite (transition 41, ajout à la démo [ASSUMPTION: la démo ne rouvre pas SANS_SUITE]). Le dossier repasse `EN_INSTRUCTION`. Les contestations sont des réclamations (§6.1) rattachées au dossier.

**Conséquences (testables) :**
- Une réouverture sans motif est refusée (`MOTIF_ECRIT`) ; par un autre rôle, elle est refusée (`DROIT_INSUFFISANT`).
- Une réouverture d'un dossier refusé pour garantie exige une nouvelle décision de garantie motivée avant toute évaluation (`GARANTIE_ENGAGEABLE`).
- À la réouverture, la provision est reposée par le gestionnaire avec motif ; le délai interne d'instruction repart d'un nouveau point de départ daté.
- Le courrier de refus initial reste au dossier ; la réouverture crée un courrier d'accusé à l'assuré (§5.15).
- Si le dossier avait été versé aux archives, la sortie de la chemise suit les mêmes règles qu'à FR-107.
- Chaque réouverture figure dans le journal avec son motif ; un dossier rouvert plus de deux fois est signalé à `AUD` [ASSUMPTION: alerte à la 3e ouverture].

### 5.12 La fraude : un score qui ouvre une revue humaine

La détection de fraude est un **filet**, pas un juge. Le serveur calcule un score à partir de signaux ; le score **ouvre une revue humaine** et, à son niveau le plus haut, **suspend** l'ordre et le paiement ; aucune décision n'est automatique (« un signal n'est pas une accusation »).

#### FR-127 : Les signaux et leurs poids

Neuf signaux sont calculés sur chaque dossier, avec les poids de la démo comme valeurs par défaut. Chaque signal et chaque poids est un **paramètre** de la compagnie ; la compagnie peut en ajouter ou en retirer.

| Signal | Se déclenche quand | Poids |
|---|---|---|
| `CONTRAT_NON_ACTIF` | la police n'est pas en vigueur à la date du sinistre | 40 |
| `SINISTRE_PRECOCE` | le sinistre survient 0 à 30 jours après la prise d'effet | 30 |
| `INCOHERENCE_DATES` | la déclaration précède le sinistre, ou le sinistre précède la prise d'effet | 30 |
| `SINISTRES_REPETES` | 3 sinistres ou plus sur la même police | 25 |
| `MONTANT_ATYPIQUE` | l'évaluation dépasse 4 fois le coût moyen de la branche | 20 |
| `VEHICULE_RECURRENT` | 3 dossiers ou plus sur la même immatriculation | 20 |
| `BENEFICIAIRE_MULTIPLE` | 3 dossiers ou plus pour le même nom de bénéficiaire | 15 |
| `TELEPHONE_PARTAGE` | 3 assurés ou plus sur le même numéro de téléphone | 15 |
| `DECLARATION_TARDIVE` | déclaration plus de 45 jours après le sinistre | 10 |

**Conséquences (testables) :**
- Chaque signal a un code, un libellé, un détail chiffré (« 4 sinistres sur la police en 18 mois »), un poids et la source qui le fonde (police, journal, portefeuille).
- Les signaux sont recalculés à la déclaration, à chaque événement qui les touche (évaluation, nouveau bénéficiaire, nouvelle pièce) et chaque nuit sur les dossiers vivants ; chaque calcul garde sa date.
- Un test de recette change chaque poids et chaque seuil de signal (3 sinistres, 4 fois, 45 jours) et vérifie l'effet sur le score.
- Un signal ajouté par la compagnie apparaît dans le score, la revue et l'explication sans changement de code.
- Un signal calculé à partir d'un contrat non lisible (logiciel de la compagnie indisponible) est marqué « non calculé » et non « absent ».

#### FR-128 : Le score est plafonné à 100 et se lit en quatre niveaux

Le **score** d'un dossier est la somme des poids des signaux présents, **plafonnée à 100**. Il se lit en quatre niveaux : `NORMAL` (moins de 20), `ATTENTION` (20 et plus), `SUSPECT` (45 et plus), `BLOQUE` (70 et plus). Les seuils sont des paramètres. À partir de `SUSPECT`, une **revue** est ouverte (FR-129) ; à `BLOQUE`, l'ordre et le paiement sont suspendus (FR-130) [ASSUMPTION: la démo ne dit pas à partir de quel niveau la revue s'ouvre ; SUSPECT par recommandation].

**Conséquences (testables) :**
- Des signaux de poids 40, 30 et 30 donnent un score de 100, pas 100 plus 0 : le plafond s'applique ; un test le vérifie.
- Un score de 44 est `ATTENTION`, un score de 45 est `SUSPECT`, un score de 69 est `SUSPECT`, un score de 70 est `BLOQUE`.
- Le niveau et le score sont visibles du gestionnaire, du responsable, de la direction et du contrôle interne ; l'assuré et le courtier ne les voient jamais.
- L'écran explique le score : la contribution de chaque signal, la date du calcul, l'historique des scores du dossier.
- Un dossier `NORMAL` ou `ATTENTION` n'ouvre pas de revue ; le niveau `ATTENTION` s'affiche en bandeau discret sur la fiche.

#### FR-129 : La revue humaine est obligatoire et motivée

La revue de fraude suit `NON_REVU → EN_REVUE → ECARTE | CONFIRME`. Un dossier `SUSPECT` ou `BLOQUE` entre en `NON_REVU` dans la file du contrôle interne. Un relecteur (`AUD`, `RESP`, `DG` ou `DT`) **prend** la revue (`EN_REVUE`), puis conclut : **écarter** (`RESP`, `DG`, `DT`, `AUD`) ou **confirmer** (`DG`, `DT`, `AUD`, FR-133), avec une **conclusion écrite**. Le relecteur n'est jamais le gestionnaire du dossier [ASSUMPTION: séparation du relecteur et du gestionnaire].

**Conséquences (testables) :**
- Une conclusion sans texte est refusée (`MOTIF_ECRIT`).
- Une conclusion par le gestionnaire ou le gestionnaire recours du dossier est refusée (`SEPARATION_DES_TACHES`).
- Une confirmation par `RESP` est refusée (`DROIT_INSUFFISANT`) ; un écartement par `GEST` l'est aussi.
- Un dossier `BLOQUE` non revu depuis plus de 3 jours ouvrés est signalé au responsable et à `AUD` [ASSUMPTION: 3 jours ouvrés].
- Une revue `ECARTE` garde ses signaux visibles, avec la conclusion et l'auteur ; elle ne les supprime pas. Un nouvel événement qui change le score d'un niveau ouvre une nouvelle revue.
- Chaque changement d'état de la revue est tracé (auteur, rôle, date et heure, conclusion).

#### FR-130 : Un dossier BLOQUE non écarté suspend l'ordre et le paiement

Tant qu'un dossier `BLOQUE` n'a pas une revue `ECARTE`, le serveur refuse : la validation et l'envoi de l'offre (transition 10), l'enregistrement de l'accord qui crée l'ordre (14), l'émission du règlement (17, 18) et la remise ou la confirmation du paiement (20). L'instruction (pièces, expertise, évaluation) continue. Le blocage ne se contourne ni par un écran ni par un cumul de rôles.

**Conséquences (testables) :**
- Chacune des transitions 10, 14, 17, 18 et 20 d'un dossier `BLOQUE` non écarté est refusée avec le code `AUCUN_SIGNAL_BLOQUANT` et le message « Dossier suspendu par le contrôle interne ».
- La levée du blocage n'est possible que par une revue `ECARTE` ; ni `RESP`, ni `DG` ne peuvent forcer une transition sans elle.
- Le gestionnaire voit « dossier suspendu » sans voir le détail de la revue ; la comptabilité voit l'ordre suspendu et sa raison générique.
- Un dossier devenu `BLOQUE` après l'émission d'un chèque suspend la remise, sans annuler le chèque (FR-125).
- Un indicateur « paiements faits sur un dossier `SUSPECT` ou `BLOQUE` non revu » est calculé pour `AUD` (FR-131) ; sa valeur cible est zéro.

#### FR-131 : La priorisation des revues

Le contrôle interne ne peut pas tout revoir : la file de revue est **ordonnée**. Les dossiers où de l'**argent a déjà été versé** passent d'abord ; puis l'**exposition** (montant évalué, validé ou à payer) ; puis le **score**. La file se lit aussi par **ancienneté** de la revue ouverte : jusqu'à 7 jours, 8 à 30 jours, 31 à 90 jours, plus de 90 jours (paramètres). Deux indicateurs sont affichés : les « paiements sans revue » et le taux de prise en charge des revues.

**Conséquences (testables) :**
- Un dossier avec un règlement `PAYE` et un score de 50 passe avant un dossier sans paiement et un score de 90.
- À argent versé égal, le dossier de plus forte exposition passe avant ; à exposition égale, le plus fort score passe avant.
- Les tranches d'ancienneté sont des paramètres ; un test les change et vérifie le classement.
- Le taux de prise en charge est le nombre de revues `EN_REVUE`, `ECARTE` ou `CONFIRME` divisé par le nombre de revues ouvertes ; il se calcule sur une période choisie.
- `AUD` et `RESP` voient la file ; `GEST` ne voit que le signalement « suspendu » de ses dossiers.

#### FR-132 : Le graphe des liens par l'IA (usage n° 10)

L'IA commune (instance locale) construit pour chaque dossier un **graphe de liens** avec les autres dossiers du portefeuille sur une fenêtre de 12 mois (paramètre). Les entités rapprochées sont : **mêmes témoins**, **mêmes garages** (dont les devis dépassent de plus de 20 % la moyenne du marché, paramètre), **mêmes photos** (empreinte visuelle identique ou proche), **mêmes téléphones**, ainsi que le même véhicule, la même victime sur plusieurs contrats, et le même bénéficiaire ou le même compte de paiement [ASSUMPTION: bénéficiaire et compte de paiement ajoutés aux entités de la démo]. La sortie est un graphe de dossiers liés avec, pour chaque lien, l'entité commune, un score de lien et la **source** (pièces, journal, portefeuille). Le destinataire est le contrôle interne et le relecteur. Garde-fous : un lien n'est qu'un indice ; le graphe ne modifie pas le score (FR-128) tant que la compagnie n'a pas fixé de poids [ASSUMPTION: les liens nourrissent la revue, pas le score] ; l'IA ne décide rien ; chaque lien est inscrit au registre de l'IA (niveau `ANALYSE`) ; aucune donnée nominative ni médicale ne sort de l'instance locale ; si l'IA est coupée, les liens exacts (téléphone, immatriculation, compte de paiement) restent servis par des règles explicables, et la comparaison de photos est « indisponible » [ASSUMPTION: la démo simulait l'empreinte de photo ; sans modèle de vision, seule l'identité exacte du fichier est comparée].

**Conséquences (testables) :**
- Deux dossiers qui partagent un numéro de téléphone, une immatriculation ou un compte de paiement sont reliés dans le graphe, avec l'entité commune et un lien vers chaque dossier.
- Un lien sans source (pièce ou donnée) n'est pas affiché.
- Un garage dont les devis dépassent de plus de 20 % la moyenne du marché sur au moins 5 dossiers est signalé comme entité partagée [ASSUMPTION: 5 dossiers minimum ; la démo fixe 20 % mais pas le nombre minimum].
- Un test rejoue un réseau de trois dossiers (même téléphone, même garage, même photo) et vérifie que le graphe les relie, que le score n'est pas modifié, et que le registre de l'IA contient les trois liens.
- Le graphe n'est lisible que par `AUD`, `RESP`, `DG`, `DT` et le relecteur de la revue en cours ; chaque consultation est journalisée.
- Le graphe ne contient aucun champ de santé.

#### FR-133 : La confirmation de la fraude par la direction ou le contrôle interne

La **confirmation** de la fraude est réservée à `DG`, `DT` et `AUD`, avec une conclusion écrite. Elle fait passer le dossier de `FRAUDE_SUSPECTEE` à `REJETE` (transition 38), avec un courrier de refus rédigé et signé comme au FR-122. L'écartement (transition 37) renvoie le dossier en `EN_INSTRUCTION`. La fraude confirmée est un motif de conservation longue du dossier (§6.2, décision D17).

**Conséquences (testables) :**
- Une confirmation par `RESP`, `GEST` ou `GREC` est refusée (`DROIT_INSUFFISANT`).
- Une confirmation sans conclusion écrite est refusée (`MOTIF_ECRIT`).
- À la confirmation, le dossier est conservé comme dossier de fraude (conservation longue), sa provision passe à zéro, et le responsable de la lutte contre le blanchiment est alerté pour décider d'une déclaration de soupçon (règlement CIMA n° 0004, art. 14 et 15, SÛR) ; Prospera n'envoie aucune déclaration lui-même.
- Si de l'argent a déjà été versé, le dossier porte une alerte « indu à examiner » pour `RESP` et `DG` ; Prospera n'ouvre pas de créance sur l'assuré [ASSUMPTION: la récupération d'un indu est hors périmètre du premier jour ; à traiter à la séance d'immersion].
- Le refus qui suit la confirmation ne mentionne pas la fraude ; il emploie le motif retenu par la direction, dans les termes du FR-125.
- Un écartement garde la conclusion et ne supprime ni le score ni les signaux ; un nouveau signal du même type n'ouvre pas de revue tant que le score n'a pas changé de niveau.

### 5.13 La machine à états complète du dossier

Cette section rassemble la **machine à états du dossier sinistre** : les 11 statuts, les 4 sorties, toutes les transitions, les conditions qui les gardent et les rôles qui les déclenchent. Elle réécrit les 31 transitions de la démo sur les 11 statuts du circuit de référence (décision D5), avec les changements de l'offre et de l'accord (D6), du recours en parallèle (D10) et des règlements multiples (D11). Les sections 5.2 à 5.12 décrivent le contenu de chaque geste ; cette section est la **table de vérité** que le serveur applique. En cas d'écart entre une phrase d'une autre section et cette table, la table fait foi.

#### FR-134 : Les statuts du dossier

Le dossier est toujours dans **un seul** statut. Onze statuts forment le circuit nominal, quatre sorties s'y ajoutent. Un statut est dit **terminal** quand il n'a pas d'autre sortie que la réouverture.

| Statut | Phase | Sens | Terminal |
|---|---|---|---|
| `DECLARE` | 1 Déclarer | la déclaration est enregistrée, la référence de déclaration est attribuée, le doublon est contrôlé | non |
| `PIECES_ATTENDUES` | 2 Ouvrir | le dossier existe, il manque au moins une pièce obligatoire ; l'assuré est relancé | non |
| `OUVERT` | 2 Ouvrir, 3 Attribuer | recevabilité contrôlée, pièces complètes ; le responsable désigne qui instruit | non |
| `EN_INSTRUCTION` | 4 Instruire | un gestionnaire instruit : pièces, responsabilité, missions d'expertise ou accord sur devis | non |
| `EVALUE` | 5 Chiffrer | le décompte est arrêté (dommage, vétusté, franchise, plafond, règle proportionnelle) | non |
| `EN_VALIDATION` | 6 Décider | la décision attend les signatures de la délégation | non |
| `OFFRE_ENVOYEE` | 6 Décider | l'offre validée est partie chez l'assuré ; on attend son accord | non |
| `ORDRE_EMIS` | 7 Payer | l'accord est enregistré, l'ordre de règlement est émis, la comptabilité n'a pas fini | non |
| `CHEQUE_A_REMETTRE` | 7 Payer | le chèque est émis et attend sa remise au guichet | non |
| `REGLE` | 7 Payer | tous les règlements sont remis ou confirmés, le reste à payer est zéro | non |
| `CLOTURE` | 8 Clore | le dossier est clos, le recours éventuel continue seul | oui (rouvrable) |
| `REJETE` | sortie | refus de prise en charge motivé et notifié | oui (rouvrable) |
| `SANS_SUITE` | sortie | classé : assuré injoignable après relances | oui (rouvrable) |
| `LITIGE` | sortie | offre refusée, contre-expertise, désaccord de fond | non |
| `FRAUDE_SUSPECTEE` | sortie | suspicion signalée par un humain, paiement suspendu | non |

La phase 3 « Attribuer » n'est pas un statut : c'est `OUVERT` avec un gestionnaire désigné (§5.3). Le recours n'est plus un statut du dossier (§5.10).

**Conséquences (testables) :**
- Un dossier a toujours un et un seul statut parmi les quinze ; une valeur inconnue est refusée (`STATUT_INCONNU`).
- Le statut du dossier ne se modifie jamais par une écriture directe : seules les transitions du FR-135 le changent.
- Les statuts `ORDRE_EMIS`, `CHEQUE_A_REMETTRE` et `REGLE` sont dérivés des règlements (§5.8, FR-92) ; une transition vers l'un d'eux est refusée si l'état des règlements ne le justifie pas.
- Les anciens statuts de la démo se retrouvent par correspondance : `PIECES_INCOMPLETES` devient `PIECES_ATTENDUES`, `EN_ETUDE` devient `EN_INSTRUCTION`, `VALIDATION` devient `EN_VALIDATION`, `OFFRE_ENVOYEE` est nouveau, `RECOURS` disparaît.
- Un test de recette vérifie la correspondance sur le jeu de démonstration repris (~3 500 dossiers) : aucun dossier sans statut valide.

#### FR-135 : Les transitions

Voici **toutes** les transitions autorisées. Les rôles sont ceux du PRD (§2) ; « comité » est l'instance de la matrice de délégation, pas un rôle (§5.7). Une transition absente du tableau est interdite.

| # | Depuis → vers | Libellé | Rôle(s) | Conditions | Motif obligatoire |
|---|---|---|---|---|---|
| 1 | `DECLARE → OUVERT` | Ouvrir et orienter vers le volet | ACC, GEST, GREC, RESP | `CONTRAT_VERIFIE`, `PIECES_COMPLETES` | non |
| 2 | `DECLARE → PIECES_ATTENDUES` | Ouvrir en attente de pièces | ACC, GEST, GREC, RESP | `CONTRAT_VERIFIE` | non |
| 3 | `PIECES_ATTENDUES → OUVERT` | Reprendre le circuit : pièces reçues | ACC, GEST, GREC, RESP | `PIECES_COMPLETES` | non |
| 4 | `DECLARE → REJETE` | Refuser : sinistre non garanti | RESP, DG, DT | `DECISION_GARANTIE` | oui |
| 5 | `OUVERT → EN_INSTRUCTION` | Prendre le dossier en instruction | GEST, GREC, RESP | `DOSSIER_AFFECTE` | non |
| 6 | `EN_INSTRUCTION → PIECES_ATTENDUES` | Demander des pièces complémentaires | GEST, GREC, RESP | — | non |
| 7 | `EN_INSTRUCTION → EVALUE` | Enregistrer l'évaluation au décompte | GEST, GREC, RESP | `PIECES_COMPLETES`, `EXPERTISE_VALIDEE`, `GARANTIE_ENGAGEABLE`, `MONTANT_EVALUE` | non (oui si le montant diffère du chiffrage validé) |
| 8 | `EVALUE → EN_VALIDATION` | Envoyer en validation | GEST, GREC, RESP | `MONTANT_EVALUE` | non |
| 9 | `EVALUE → EN_INSTRUCTION` | Reprendre l'instruction avant validation | GEST, GREC, RESP | — | oui |
| 10 | `EN_VALIDATION → OFFRE_ENVOYEE` | Valider selon la délégation et envoyer l'offre | validation : RESP, comité, DT, DG selon §5.7 ; envoi : GEST, RESP | `VALIDATION_ACQUISE`, `SEPARATION_DES_TACHES`, `COMPLEMENT_EXPERT_RECU`, `AUCUN_SIGNAL_BLOQUANT` | oui |
| 11 | `EN_VALIDATION → EN_INSTRUCTION` | Renvoyer en instruction : réévaluation demandée | RESP, comité, DT, DG | — | oui |
| 12 | `EN_VALIDATION → PIECES_ATTENDUES` | Demander des pièces avant validation | RESP, comité, DT, DG | — | oui |
| 13 | `EN_VALIDATION → REJETE` | Refuser la prise en charge | RESP, DG, DT | `DECISION_GARANTIE` | oui |
| 14 | `OFFRE_ENVOYEE → ORDRE_EMIS` | Enregistrer l'accord et émettre l'ordre de règlement | GEST, RESP | `ACCORD_ENREGISTRE`, `MONTANT_VALIDE`, `AUCUN_SIGNAL_BLOQUANT` | non |
| 15 | `OFFRE_ENVOYEE → EN_INSTRUCTION` | Reprendre : contre-proposition de l'assuré | GEST, RESP | contre-proposition enregistrée | oui |
| 16 | `OFFRE_ENVOYEE → LITIGE` | Constater le refus de l'offre | RESP, DG, DT | refus enregistré | oui |
| 17 | `ORDRE_EMIS → CHEQUE_A_REMETTRE` | Émettre le règlement : chèque | CPT | `ORDRE_COMPLET`, `CONTROLE_LBC_FT`, `AUCUN_SIGNAL_BLOQUANT`, `SEPARATION_DES_TACHES` | non |
| 18 | `ORDRE_EMIS → REGLE` | Constater le paiement électronique | CPT lance, `paiement` confirme | `QUITTANCE_SIGNEE`, `COORDONNEES_VERIFIEES`, `CONTROLE_LBC_FT`, `AUCUN_SIGNAL_BLOQUANT` | non |
| 19 | `ORDRE_EMIS → EN_VALIDATION` | Rejeter l'ordre : anomalie comptable | CPT | — | oui |
| 20 | `CHEQUE_A_REMETTRE → REGLE` | Constater la remise au bénéficiaire | ACC, CPT | `REGLEMENT_EMIS`, `IDENTITE_RETIRANT`, `QUITTANCE_SIGNEE`, `AUCUN_SIGNAL_BLOQUANT` | non |
| 21 | `CHEQUE_A_REMETTRE → ORDRE_EMIS` | Annuler le chèque non retiré et ré-émettre | CPT | — | oui |
| 22 | `REGLE → CLOTURE` | Clôturer après règlement | GEST, GREC, RESP | `REGLEMENT_REMIS`, `SOLDE_APURE`, `RECOURS_QUALIFIE` | oui |
| 23 | `REGLE → EN_INSTRUCTION` | Reprendre après règlement provisionnel | GEST, RESP | règlement provisionnel remis, consolidation attendue | oui |
| 24 | `EN_INSTRUCTION → REJETE` | Notifier un refus de prise en charge | RESP, DG, DT | `DECISION_GARANTIE` | oui |
| 25 | `EN_INSTRUCTION → SANS_SUITE` | Classer sans suite | GEST, RESP (DG ou DT au corporel automobile) | `RELANCES_EPUISEES` | oui |
| 26 | `PIECES_ATTENDUES → SANS_SUITE` | Classer sans suite : assuré injoignable | GEST, RESP (DG ou DT au corporel automobile) | `RELANCES_EPUISEES` | oui |
| 27 | `OFFRE_ENVOYEE → SANS_SUITE` | Classer sans suite : offre sans réponse | GEST, RESP (DG ou DT au corporel automobile) | `RELANCES_EPUISEES`, offre sans réponse depuis 30 jours | oui |
| 28 | `EVALUE → LITIGE` | Constater un litige | RESP, DG, DT | — | oui |
| 29 | `EN_VALIDATION → LITIGE` | Constater un litige | RESP, DG, DT | — | oui |
| 30 | `LITIGE → EN_INSTRUCTION` | Litige résolu : reprendre l'instruction | RESP, DG, DT | — | oui |
| 31 | `EN_INSTRUCTION → FRAUDE_SUSPECTEE` | Signaler une suspicion de fraude | GEST, GREC, RESP, DG, DT, AUD | — | oui |
| 32 | `EVALUE → FRAUDE_SUSPECTEE` | Signaler une suspicion de fraude | idem | — | oui |
| 33 | `EN_VALIDATION → FRAUDE_SUSPECTEE` | Signaler une suspicion de fraude | idem | — | oui |
| 34 | `OFFRE_ENVOYEE → FRAUDE_SUSPECTEE` | Signaler une suspicion de fraude | idem | — | oui |
| 35 | `ORDRE_EMIS → FRAUDE_SUSPECTEE` | Signaler une suspicion de fraude | idem | — | oui |
| 36 | `CHEQUE_A_REMETTRE → FRAUDE_SUSPECTEE` | Signaler une suspicion de fraude | idem | — | oui |
| 37 | `FRAUDE_SUSPECTEE → EN_INSTRUCTION` | Écarter la suspicion et reprendre | RESP, DG, DT, AUD | revue `ECARTE` | oui |
| 38 | `FRAUDE_SUSPECTEE → REJETE` | Confirmer la fraude et refuser | DG, DT, AUD | revue `CONFIRME` | oui |
| 39 | `CLOTURE → EN_INSTRUCTION` | Rouvrir le dossier | RESP, DG, DT | — | oui |
| 40 | `REJETE → EN_INSTRUCTION` | Rouvrir sur contestation | RESP, DG, DT | — | oui |
| 41 | `SANS_SUITE → EN_INSTRUCTION` | Rouvrir : l'assuré se manifeste | RESP, DG, DT | — | oui |

**Correspondance avec les 31 transitions de la démo.** Reprises à l'identique, sur les nouveaux noms de statuts : 1 à 8 de la démo (devenues 1 à 8), 10 à 12 (devenues 11, 12, 13), 15 (devenue 20), 17 à 19 (devenues 24, 25, 26), 22 et 23 (devenues 28, 29), 24 et 25 (devenues 31, 32), 26 à 28 (devenues 37, 38, 30), 30 et 31 (devenues 39, 40). Remaniées : la transition 9 de la démo (valider et émettre l'ordre) est **scindée** en deux, valider et envoyer l'offre (10), puis enregistrer l'accord et émettre l'ordre (14), sur la décision D6 ; la 13 de la démo (émettre quittance et chèque) devient 17 ; la 14 (rejet de l'ordre) devient 19 ; la 16 (clôture) devient 22 avec la condition `RECOURS_QUALIFIE`. **Supprimées** : les 20, 21 et 29 de la démo (passage au recours), le recours étant désormais un suivi parallèle (D10). **Nouvelles** : 9, 15, 16, 18, 21, 23, 27, 33 à 36 et 41 [ASSUMPTION: 9, 21, 23, 27, 33 à 36 et 41 sont des ajouts de rédaction pour qu'aucun état n'ait de cul-de-sac et que le paiement puisse être arrêté ; 15, 16 et 18 découlent de D6 et D11].

**Conséquences (testables) :**
- Le tableau contient 41 lignes ; un test de recette les énumère et vérifie, pour chacune, un cas réussi et un cas refusé par condition.
- Toute transition demandée hors du tableau est refusée avec le code `TRANSITION_INCONNUE` ; la réponse nomme le statut courant et les transitions possibles pour le rôle.
- Une transition demandée par un rôle absent de sa ligne est refusée (`DROIT_INSUFFISANT`), même si le même utilisateur a un autre rôle qui y serait autorisé et qu'il n'agit pas sous celui-ci.
- Une transition marquée « motif obligatoire » sans motif de 10 caractères au moins est refusée (`MOTIF_ECRIT`).
- Un dossier `OUVERT` jugé non garanti passe par `EN_INSTRUCTION` avant d'être refusé : le refus depuis `OUVERT` n'existe pas, car personne n'a encore la charge du dossier [ASSUMPTION: refus d'un dossier non attribué non prévu ; à confirmer à la séance d'immersion].
- Les transitions 14, 17, 18 et 20 sont refusées si le montant de l'ordre n'est pas celui de l'accord (`MONTANT_VALIDE`).

#### FR-136 : Les conditions nommées et leur texte

Chaque condition a un **code** et un **texte** que le serveur renvoie tel quel à l'utilisateur ; le **code de refus** est le nom de la condition non remplie. Le texte reprend ceux de la démo et les complète. Les écrans affichent aussi les actions **fermées** avec ce texte (« vous ne pouvez pas évaluer parce qu'il manque le rapport de police »).

| Code | Texte opposé à l'utilisateur | Définition |
|---|---|---|
| `PIECES_COMPLETES` | Toutes les pièces obligatoires doivent être reçues. | aucune pièce obligatoire au statut « attendue » |
| `CONTRAT_VERIFIE` | La police doit être en vigueur à la date du sinistre. | police en vigueur et date du sinistre entre prise d'effet et échéance, d'après la dernière lecture du logiciel de la compagnie (date affichée) |
| `GARANTIE_ENGAGEABLE` | La garantie doit être acquise, ou une décision motivée enregistrée. | garantie acquise, ou décision `GARANTIE_ACQUISE`, `SOUS_RESERVE` ; un `REFUS_DE_GARANTIE` la ferme (jamais sautée, D4) |
| `DECISION_GARANTIE` | Une décision de garantie motivée est requise. | décision `REFUS_DE_GARANTIE` enregistrée avec motif |
| `DOSSIER_AFFECTE` | Le dossier doit avoir été attribué à un gestionnaire par l'encadrement. | gestionnaire désigné par `RESP` ; l'accueil n'attribue jamais |
| `EXPERTISE_VALIDEE` | Toute expertise ouverte doit avoir rendu son rapport et être validée. | toutes les missions non annulées sont validées ou arbitrées |
| `COMPLEMENT_EXPERT_RECU` | Un complément demandé à l'expert n'est pas revenu. | aucun complément en attente, sauf passage outre du `RESP` avec motif (D15) |
| `MONTANT_EVALUE` | Saisissez le montant arrêté au décompte. | montant évalué supérieur à zéro |
| `VALIDATION_ACQUISE` | La validation exigée par la délégation n'est pas complète. | signatures du niveau requis par le cumul des montants validés du dossier (§5.7) |
| `MONTANT_VALIDE` | Le montant dépasse le montant validé. | montant du règlement ou de l'ordre inférieur ou égal au validé |
| `SEPARATION_DES_TACHES` | Celui qui instruit ne valide pas ; celui qui décide ne paie pas. | l'utilisateur n'a pas exercé une fonction incompatible sur ce dossier (SEP-01, SEP-02) |
| `AUCUN_SIGNAL_BLOQUANT` | Dossier suspendu par le contrôle interne. | aucun dossier de fraude `BLOQUE` sans revue `ECARTE` |
| `ACCORD_ENREGISTRE` | L'accord de l'assuré n'est pas enregistré. | accord rattaché avec sa pièce et son montant (§5.8, FR-90) |
| `ORDRE_COMPLET` | Indiquez la banque, le numéro du chèque et le montant. | champs obligatoires du moyen de règlement saisis |
| `QUITTANCE_SIGNEE` | La quittance doit être signée. | quittance `SIGNEE` avec pièce de signature |
| `COORDONNEES_VERIFIEES` | Les coordonnées de paiement ne sont pas vérifiées. | compte ou numéro Mobile Money vérifié au nom du bénéficiaire, sans changement récent non levé |
| `CONTROLE_LBC_FT` | Un contrôle de lutte contre le blanchiment est en alerte. | aucune alerte du FR-100 non levée |
| `IDENTITE_RETIRANT` | Indiquez l'identité et le numéro de pièce d'identité de la personne qui retire le chèque. | identité et numéro de pièce saisis |
| `REGLEMENT_EMIS` | Le règlement doit avoir été émis. | au moins une quittance émise |
| `REGLEMENT_REMIS` | Le règlement doit avoir été remis. | tous les règlements remis ou annulés |
| `SOLDE_APURE` | Il reste une somme à payer. | reste à payer inférieur ou égal à zéro |
| `RECOURS_QUALIFIE` | La question du recours doit être tranchée. | un recours ouvert, ou la décision « aucun tiers en cause » enregistrée |
| `RELANCES_EPUISEES` | Les relances prévues n'ont pas toutes été faites. | au moins 3 relances sans effet, sur 2 canaux, puis 15 jours (§5.11) |
| `DECISION_DIRECTION` | Cette décision relève de la direction. | décision de `DG` ou `DT` |
| `MOTIF_ECRIT` | Un motif écrit d'au moins 10 caractères est obligatoire. | motif présent, 10 caractères au moins |
| `DROIT_INSUFFISANT` | Cette action est réservée à d'autres rôles. | le rôle exercé n'est pas dans la ligne de la table |
| `TRANSITION_INCONNUE` | Cette étape n'est pas possible depuis le statut actuel. | transition absente de la table |
| `ETAT_PERIME` | Le dossier a changé depuis votre lecture ; rechargez. | la version lue n'est plus la version courante |

Les conditions du recours (`TIERS_IDENTIFIE`, `PIECE_PROBANTE`, `CREANCE_ETABLIE`, `PAIEMENT_ASSURE`, `RESPONSABILITE_TIERS`, `ACCORD_CONCLU`, `TOUT_RAPPROCHE`, `ARBITRAGE_APPLICABLE`) ont leur définition au §5.10.

**Conséquences (testables) :**
- Chaque refus renvoie le code de la condition, son texte, et le nom du champ ou de la pièce qui manque quand il y en a un.
- Les textes se règlent par l'administrateur et se valident par le responsable ; un code ne change jamais de sens.
- Un test de recette provoque chaque refus du tableau sur le dossier de démonstration `SIN-2026-9002` et vérifie le code et le texte.
- Les codes sont stables d'une version à l'autre ; ils ne contiennent aucun nom de personne ni de compagnie.

#### FR-137 : Un écran ne peut pas forcer ce que le serveur refuse

Toutes les règles de la table sont appliquées **par le serveur**, à chaque demande, indépendamment de ce que l'écran propose. Le serveur revérifie le rôle, la table, les conditions, le motif et la version du dossier au moment de l'application (« un écran ne doit pas pouvoir forcer ce que le circuit refuse »). Les droits viennent de la **matrice d'accès** de l'annexe B, lue par le serveur et par les écrans. Les trois **séparations de fonctions** de la démo sont reprises : **SEP-01** (l'instructeur ne valide pas son propre dossier), **SEP-02** (aucune sortie de trésorerie sans comptable distinct du décideur), **SEP-03** (la délégation se mesure sur le cumul des montants validés du dossier, anti-fractionnement, §5.7). Le rôle `ADMIN` ne lit aucune donnée métier et ne déclenche aucune transition.

**Conséquences (testables) :**
- Un appel direct à l'interface du serveur pour une transition interdite est refusé avec le même code que l'écran.
- Deux demandes simultanées sur le même dossier : la seconde, lue avant la première, est refusée (`ETAT_PERIME`) ; aucune n'est appliquée deux fois.
- Une demande rejouée (même identifiant de demande) n'applique la transition qu'une fois.
- Un utilisateur avec deux rôles agit sous l'un ou l'autre, nommé à chaque demande ; la séparation des fonctions se mesure sur la personne, pas sur le rôle.
- La tentative de violation d'une séparation est refusée et inscrite au journal, visible de `AUD` (`SEPARATION_DES_TACHES`).
- Un montant cumulé validé qui franchit un seuil de délégation par fractionnement est refusé au niveau inférieur, avec le code `VALIDATION_ACQUISE`.

#### FR-138 : La piste d'audit de chaque transition

Chaque transition réussie **et chaque refus** écrit une ligne d'audit, non modifiable : dossier, statut avant, statut après, numéro de transition, utilisateur, rôle exercé, **date et heure** du serveur, motif, liste des conditions évaluées et leur résultat, version des paramètres appliqués, numéro de sinistre officiel et référence de déclaration. Les valeurs avant et après de tout champ sensible (montant, provision, bénéficiaire, gestionnaire) sont conservées. Les lectures de données de santé sont journalisées (D14). Le journal est conservé au moins 10 ans (Code CIMA, art. 404, SÛR) ; il ne peut ni être supprimé ni recevoir d'insertion rétroactive (principe de l'art. 407, SÛR pour la comptabilité informatisée, transposé `[à valider par le juriste]`).

**Conséquences (testables) :**
- Chaque transition du tableau, jouée dans un test, écrit exactement une ligne d'audit de succès ; chaque refus écrit une ligne de refus avec son code.
- Aucun écran, API ni administrateur ne supprime ni ne modifie une ligne d'audit ; un test tente les deux et échoue.
- Le journal d'un dossier se consulte par ordre de temps, se filtre par type d'action et par utilisateur, et s'exporte pour `AUD` (périmètre, période).
- La date et l'heure sont celles du serveur, jamais celles du poste.
- Une transition faite pour le compte d'une délégation (le comité, le visa) porte la liste des signataires et leur rôle.

#### FR-139 : Aucun état non terminal sans issue

Le graphe des transitions est **vérifié automatiquement** : chaque statut non terminal a au moins une sortie, chaque statut est atteignable depuis `DECLARE`, et il existe un chemin nominal de `DECLARE` à `CLOTURE`. Les statuts et les transitions sont **fixes** ; la compagnie règle les seuils, les délégations, les délais et les droits par rôle, dans la limite des séparations de fonctions, mais ne crée pas de statut [ASSUMPTION: statuts et transitions non paramétrables par la compagnie au premier jour ; à confirmer à la séance d'immersion].

**Conséquences (testables) :**
- Un test calcule, pour chaque statut non terminal (`DECLARE`, `PIECES_ATTENDUES`, `OUVERT`, `EN_INSTRUCTION`, `EVALUE`, `EN_VALIDATION`, `OFFRE_ENVOYEE`, `ORDRE_EMIS`, `CHEQUE_A_REMETTRE`, `REGLE`, `LITIGE`, `FRAUDE_SUSPECTEE`), ses transitions de sortie et échoue s'il y en a zéro.
- Un test calcule l'ensemble des statuts atteignables depuis `DECLARE` et échoue s'il manque l'un des quinze.
- Le chemin nominal `DECLARE → PIECES_ATTENDUES → OUVERT → EN_INSTRUCTION → EVALUE → EN_VALIDATION → OFFRE_ENVOYEE → ORDRE_EMIS → CHEQUE_A_REMETTRE → REGLE → CLOTURE` (transitions 2, 3, 5, 7, 8, 10, 14, 17, 20, 22) est rejoué par la recette sur le dossier de démonstration `SIN-2026-9002`, rôle après rôle, de la déclaration à l'archive (D19).
- Les trois autres scénarios de démonstration (`SIN-2026-9001`, `9003`, `9004`) sont rejoués de même ; les 104 vérifications du second rejeu de la démo sont reprises comme tests de recette sur le serveur réel.
- Un statut ne peut pas être ajouté ou retiré sans changer le tableau et ses tests ; une modification de table passe la revue du PO.

### 5.14 Délais, échéances, alertes et relances

Les délais de la démo n'avaient ni point de départ ni point d'arrêt écrits (constat de la SPEC). Cette section les écrit. Elle sépare trois natures d'échéance : **réglementaire** (le Code CIMA, non modifiable par la compagnie), **interne** (paramètre de la compagnie), **suivi** (surveillance d'une attente). Une échéance qui n'a pas ses deux bornes n'existe pas dans Prospera.

#### FR-140 : Toute échéance a une nature, un départ, un arrêt, une valeur de paramètre

Chaque échéance affichée sur un dossier porte : son **nom**, sa **nature** (réglementaire, interne, suivi), son **point de départ** (un événement daté du dossier), son **point d'arrêt** (un événement daté), sa **durée**, les **jours restants** (négatifs si dépassés), sa **source** (article du Code, paramètre de la compagnie, procédure) et sa **conséquence** au dépassement. Un dossier est jugé selon le **référentiel en vigueur à sa date de survenance** (décision D7) : un changement de paramètre ou de texte ne modifie pas les échéances d'un dossier déjà ouvert. Les délais du matériel et des autres branches ne sont pas fixés par le Code CIMA : ils sont contractuels ou internes, **paramétrés par produit**. Les échéances réglementaires sont des alertes, jamais modifiables par la compagnie ; une alerte est émise **45 jours** avant l'échéance réglementaire et à **85 %** du délai écoulé pour les échéances internes (valeurs de la démo, paramètres).

**Conséquences (testables) :**
- Une échéance sans point de départ ou sans point d'arrêt est refusée à la création du référentiel (`ECHEANCE_INCOMPLETE`) ; un test parcourt le référentiel et vérifie les deux bornes.
- Un dossier ouvert garde ses échéances quand l'administrateur change un paramètre ; un dossier ouvert après le changement applique la nouvelle valeur ; le paramètre et sa version sont visibles sur l'échéance.
- Une échéance réglementaire ne peut pas être modifiée par l'écran de paramétrage ; la tentative est refusée (`ECHEANCE_REGLEMENTAIRE`).
- Une échéance dépassée affiche son retard en jours et sa conséquence ; une échéance arrêtée affiche la date d'arrêt et reste lisible dans l'historique.
- Le délai en mois se calcule en mois civils à partir de la date de départ ; la règle de comptage (mois commencé ou révolu, jour férié) est un point de revue du juriste `[à vérifier par le juriste]`.
- Les suspensions et prorogations légales sont des événements saisis avec leur article, leur date de début, leur date de fin et le motif ; elles décalent l'échéance concernée sans l'effacer.

#### FR-141 : Les échéances réglementaires du corporel automobile

Le Code CIMA fixe des délais pour **l'indemnisation des victimes d'atteintes à la personne causées par un véhicule terrestre à moteur** ; il n'en fixe pas pour les dommages aux seuls biens (art. 231, dernier alinéa, SÛR). Ces échéances s'appliquent au volet corporel automobile ; leur texte à jour est un point de revue juridique (D21).

| Échéance | Point de départ | Point d'arrêt | Durée | Source | Conséquence |
|---|---|---|---|---|---|
| Offre d'indemnité | date de l'accident | offre envoyée (transition 10) | 12 mois | Code CIMA art. 231 (SÛR) | sanction administrative possible ; pénalité 5 % par mois |
| Offre en cas de décès | date du décès | offre aux ayants droit envoyée | 8 mois | art. 231 et 265-266 (SÛR) | idem |
| Offre provisionnelle | date de l'accident | offre provisionnelle envoyée | si la consolidation n'est pas connue à 6 mois | art. 231 al. 5 (SÛR) | l'offre définitive suit |
| Offre définitive après consolidation | date où l'assureur est informé de la consolidation | offre définitive envoyée | 6 mois | art. 231 al. 5 (SÛR) | idem |
| Réponse à la demande motivée de la victime | réception de la demande | réponse envoyée | 30 jours | art. 231 al. 7 (SÛR) | alerte au responsable |
| Dénonciation de la transaction | conclusion de la transaction | expiration du délai | 15 jours | art. 235 (SÛR) | la victime peut dénoncer ; paiement attendu après |
| Paiement des sommes convenues | fin du délai de dénonciation | dernier règlement `PAYE` | 1 mois | art. 235 (SÛR) | intérêt de 5 % par mois (art. 236, SÛR) |
| Pénalité d'offre tardive | échéance de l'offre dépassée | offre envoyée | 5 % par mois de retard | art. 233 (SÛR) | calcul affiché ; réduction motivée par `RESP` |

À ces échéances s'ajoutent les **suspensions et prorogations** que le dossier doit pouvoir tracer : assureur non avisé de l'accident dans le mois (art. 247) ; décès de la victime plus d'un mois après l'accident (art. 248, délai prorogé du temps écoulé) ; pièces demandées non reçues dans les 6 semaines (art. 249 et 250) ; réponse incomplète, nouvelle demande dans le mois (art. 251) ; refus d'examen médical ou contestation du médecin, expert commun, un mois de plus (art. 252 et 252 bis) ; victime résidant à l'étranger, un mois de plus (art. 253) ; tous SÛR. Quand un **fonds de garantie automobile** est activé pour le pays (FR-111), s'ajoutent : transmission du procès-verbal dans les 60 jours (art. 606), déclaration au fonds dans les 3 mois de la réclamation (art. 608), notification d'une transaction avec un responsable non assuré dans le mois (art. 605), tous SÛR. L'arbitrage entre assureurs (sentence dans le mois de la saisine, art. 276, SÛR) suit les recours (FR-119). La **base de calcul** de la pénalité de 5 % (indemnité totale, solde ou montant offert) est un point de revue du juriste.

**Conséquences (testables) :**
- Un dossier corporel automobile ouvert affiche, dès l'ouverture, la date limite de l'offre : accident plus 12 mois, ou décès plus 8 mois pour un décès.
- Un dossier corporel dont la consolidation n'est pas connue à 6 mois de l'accident reçoit une alerte « offre provisionnelle possible » ; l'information de consolidation enregistrée ouvre l'échéance de l'offre définitive à 6 mois.
- Un dossier dont l'offre légale est dépassée affiche la pénalité cumulée (5 % de l'indemnité par mois de retard) et le motif de réduction éventuel saisi par `RESP`.
- Une suspension saisie avec son article, ses dates et son motif décale l'échéance ; sans article, elle est refusée (`SUSPENSION_NON_MOTIVEE`).
- Les échéances ne s'appliquent pas à un dossier matériel ou de risques divers ; un test vérifie qu'un dossier de dommages aux biens n'affiche aucune échéance de ce tableau.
- Un dossier jugé sous une version antérieure du référentiel garde ses échéances d'origine (sinistre survenu avant la date d'effet de la nouvelle version).

#### FR-142 : Les échéances internes, le matériel et les autres branches

Les échéances **internes** de la compagnie sont des paramètres : leurs valeurs par défaut viennent de la démo et du mémoire d'audit de 2014 (procédure d'une compagnie du groupe au Sénégal, à confirmer pour le Togo). Les délais d'**offre** et de **règlement** par volet de la démo sont conservés comme délais internes ; au corporel automobile, la loi (FR-141) prime.

| Échéance | Point de départ | Point d'arrêt | Défaut | Conséquence |
|---|---|---|---|---|
| Accusé de réception | déclaration enregistrée | dossier ouvert (transition 1 ou 2) | 10 jours | alerte au responsable |
| Numéro de sinistre officiel | déclaration envoyée au logiciel de la compagnie | numéro reçu ou saisi | 1 jour ouvré | alerte au responsable (D3) |
| Offre (interne, par volet) | dossier complet (dernière pièce obligatoire reçue) | offre envoyée (transition 10) | corporel 90 j, matériel 60 j, autres 75 j | alerte jaune à 85 %, rouge au dépassement |
| Offre validée envoyée | dernière signature de la délégation | offre envoyée | 48 heures | alerte au gestionnaire et au responsable |
| Offre sans réponse (relance) | offre envoyée | réponse enregistrée | 15 jours | relance de l'assuré |
| Offre sans réponse (alerte) | offre envoyée | réponse enregistrée | 30 jours | alerte au responsable ; proposition de classement sans suite |
| Paiement (cible) | accord enregistré | dernier règlement `PAYE` | 72 heures | alerte comptabilité et responsable (§5.8, FR-102) |
| Règlement (limite interne) | accord enregistré | dernier règlement `PAYE` | corporel 45 j, matériel 30 j, autres 30 j | alerte rouge |
| Délai de traitement (SLA) par volet | déclaration enregistrée | statut `REGLE`, `REJETE` ou `SANS_SUITE` | corporel 45 j, matériel 21 j, risques divers 30 j, recours 90 j | indicateur et alerte |
| Chèque non retiré | émission du chèque | remise ou annulation | relance 7 j, circulation longue 21 j, exposition 30 j | liste d'appels, alerte, état (§5.8, FR-101) |
| Versement aux archives | clôture | versement | 75 jours | alerte au responsable (§5.9) |
| Relance du recours | envoi de la lettre ou de la dernière relance | réponse du débiteur | 15 jours | liste « à relancer » (§5.10) |
| Prescription du recours | date du sinistre | recours terminé | 730 jours, alerte à 90 j | alerte, terme à vérifier (FR-118) |
| Rapport d'expert | mission acceptée, éléments transmis | rapport reçu | selon le domaine (§5.5) | alerte au gestionnaire |

**Conséquences (testables) :**
- Le délai de traitement du volet recours (90 jours) se compte depuis la déclaration, comme les autres volets [ASSUMPTION: la SPEC ne définit ni départ ni arrêt du délai cible ; départ à la déclaration, arrêt à REGLE, REJETE ou SANS_SUITE].
- Chaque ligne du tableau est un paramètre de la compagnie, versionné et daté ; un test change chaque valeur et vérifie les jours restants d'un dossier ouvert après le changement.
- L'échéance « offre (interne) » s'arrête à l'envoi de l'offre, non à l'évaluation comme dans la démo ; un test le vérifie.
- Une échéance interne dépassée change la couleur du dossier dans les files et alimente l'indicateur « hors délai » du pilotage.
- Au matériel, un dossier ne montre aucune échéance réglementaire ; il montre ses échéances internes et, si le produit le fixe, son délai contractuel (paramétré par produit).
- La cible de 10 jours entre évaluation et paiement de la démo n'est plus reprise : elle est remplacée par la cible de 72 heures après accord.

#### FR-143 : Les relances : 5 jours entre deux, 3 sans effet, puis un arbitrage

Une **relance** est un message à un interlocuteur qui doit agir : l'assuré (pièces, accord), un cabinet d'expertise (rapport), un tiers (recours), la comptabilité (paiement). Elle est enregistrée avec son **canal** (appel, SMS, e-mail, WhatsApp, courrier), son destinataire, sa date, son texte, son résultat. **Cinq jours** séparent deux relances d'un même interlocuteur sur le même sujet ; au bout de **trois relances sans effet** (ni réponse, ni pièce reçue), le serveur ne propose plus une relance de plus : il propose un **arbitrage** au responsable (classement sans suite, appel du responsable, courrier recommandé, désignation d'un autre cabinet, mise en demeure). Le recours suit son propre rythme de 15 jours (FR-110). La rédaction des relances est assistée par l'IA commune (usage n° 4, §5.2) ; l'agent envoie lui-même et trace.

**Conséquences (testables) :**
- Une deuxième relance au même interlocuteur sur le même sujet avant 5 jours est refusée (`RELANCE_TROP_PROCHE`) ; une dérogation motivée de `RESP` est possible.
- Après 3 relances sans effet, le dossier affiche « arbitrage proposé » avec les choix ; il n'offre plus le bouton « relancer ».
- Une relance sans canal, sans destinataire ou sans date est refusée (`RELANCE_INCOMPLETE`).
- Au corporel automobile, la relance de l'assuré porte les mentions de la correspondance exigées par le Code (nom du gestionnaire, rappel des conséquences d'un défaut de réponse, art. 242, SÛR) ; un modèle qui les omet est refusé à sa validation.
- Le compte des relances et leur résultat alimentent la condition `RELANCES_EPUISEES` du classement sans suite (§5.11).
- L'envoi réel de la relance passe par le module `notification` ; une relance « envoyée » sans accusé de transmission du module est marquée « à confirmer ».

#### FR-144 : Les dossiers muets se détectent à 8, 15 et 30 jours

Un dossier non terminal **sans action** depuis 8 jours est « à surveiller », depuis 15 jours « à relancer », depuis 30 jours « muet ». Le point de départ est la dernière **action d'écriture** du dossier (transition, pièce reçue, relance, note, décision) ; une simple **consultation** ne compte pas [ASSUMPTION: la consultation n'interrompt pas le silence, pour qu'elle ne masque pas l'inactivité]. Le point d'arrêt est l'action suivante. Un agent sans trace d'écriture depuis 10 jours est signalé à son responsable et à `AUD`.

**Conséquences (testables) :**
- Un dossier `EN_INSTRUCTION` sans action pendant 8 jours entre dans la liste « à surveiller » du gestionnaire ; à 15 jours, dans la file du responsable ; à 30 jours, il est « muet » et notifié à `RESP`, `DT` et `AUD`.
- Un dossier `CLOTURE`, `REJETE` ou `SANS_SUITE` n'est jamais muet ; un dossier en attente d'un tiers (assuré, cabinet) est compté muet seulement si la relance de 5 jours (FR-143) n'a pas été faite.
- Les seuils 8, 15 et 30 sont des paramètres ; un test les change.
- La liste des dossiers muets s'exporte avec le gestionnaire, le statut, la date de la dernière action et le tiers attendu.
- Un agent dont aucune action d'écriture n'est tracée depuis 10 jours ouvrés apparaît dans la liste de `AUD` avec son nombre de dossiers en charge.

#### FR-145 : Les pièces bloquantes, et les vues des échéances

Une **pièce bloquante** est une pièce obligatoire qui empêche une transition (l'évaluation, l'envoi de l'offre, l'émission du règlement : un relevé d'identité bancaire illisible bloque le virement, le certificat médical final bloque l'offre au corporel, le procès-verbal fonde le montant). Une pièce bloquante en attente depuis plus de **30 jours** est une alerte au gestionnaire et au responsable, avec proposition de classement sans suite après les relances du FR-143. Le gestionnaire dispose de deux vues : **mes délais** (dossiers groupés par ce qu'il reste avant le terme, la cause, le porteur, le geste à faire) et **mes attentes** (dossiers groupés par tiers attendu : assuré, cabinet d'expertise, comptabilité, responsable).

**Conséquences (testables) :**
- Une pièce obligatoire en attente depuis 31 jours, sur un dossier non terminal, figure dans l'alerte « pièces bloquantes » avec le nom de la pièce, la transition qu'elle bloque et le nombre de relances faites.
- La vue « mes délais » classe un dossier selon son échéance la plus proche, réglementaire ou interne, et affiche la cause du retard et la personne qui détient le geste suivant.
- La vue « mes attentes » regroupe par tiers attendu ; un dossier attendu de deux tiers apparaît dans deux groupes.
- Les deux vues sont filtrées par rôle : `GEST` voit ses dossiers, `RESP` ceux de son service, `GREC` ceux de son pôle ; aucune donnée médicale n'y est lisible par `ACC`.
- Une pièce bloquante > 30 jours est comptée dans l'indicateur de pilotage (§6) ; le seuil de 30 jours est un paramètre.

### 5.15 Les notifications et les écrans du circuit

Les notifications sont envoyées par le module partagé `notification` (partie 4) ; les écrans sont ceux de chaque rôle. Les deux obéissent à une règle : **chacun voit ce qu'il doit faire maintenant**, et rien de ce que son rôle n'a pas le droit de lire.

#### FR-146 : Les notifications du circuit

Le circuit émet les notifications suivantes. Le canal par défaut est indiqué ; il se règle par événement dans le module `notification`. Les canaux sont : **cloche** (dans l'application), **e-mail**, **SMS**, **WhatsApp**, **courrier** (papier, avec preuve). Le canal choisi par l'assuré à la déclaration est le canal de ses notifications ; à défaut, le SMS [ASSUMPTION: canal par défaut de l'assuré = SMS].

| Événement | Destinataire | Canal |
|---|---|---|
| Déclaration enregistrée (référence `DEC-`) | assuré ; courtier | SMS, e-mail ou WhatsApp |
| Numéro de sinistre officiel reçu | gestionnaire ; assuré (information) | cloche ; SMS |
| Dossier sans numéro officiel depuis plus de 1 jour ouvré | `RESP` | cloche, e-mail |
| Pièces attendues (relance) | assuré | SMS, e-mail, WhatsApp, courrier |
| Dossier ouvert (accusé de réception) | assuré ; courtier ; coassureurs | e-mail, courrier |
| Dossier attribué à un gestionnaire | gestionnaire | cloche |
| Mission d'expertise désignée | cabinet d'expertise (portail) ou expert interne | portail, e-mail |
| Rapport d'expertise reçu ou complément demandé | gestionnaire | cloche |
| Dossier envoyé en validation | signataires de la délégation | cloche, file de validation |
| Validation complète, offre à envoyer sous 48 h | gestionnaire ; `RESP` en alerte à 24 h [ASSUMPTION: alerte à mi-délai des 48 h] | cloche |
| Offre envoyée | assuré | courrier, e-mail |
| Offre sans réponse à 15 jours | assuré | SMS, e-mail, WhatsApp |
| Offre sans réponse à 30 jours | `RESP` | cloche, e-mail |
| Accord enregistré, ordre de règlement émis | `CPT` ; gestionnaire | cloche, file de la comptabilité |
| Ordre rejeté par la comptabilité | gestionnaire ; `RESP` | cloche, e-mail |
| Chèque prêt à remettre | assuré ; `ACC` (liste d'appels) | SMS, WhatsApp |
| Quittance à signer (virement, Mobile Money) | assuré | SMS, e-mail, WhatsApp |
| Paiement confirmé | assuré ; gestionnaire | SMS ; cloche |
| Paiement en échec | `CPT` ; gestionnaire | cloche, e-mail |
| Chèque non retiré à 7, 21, 30 jours | `ACC` ; `CPT` ; `RESP` et `AUD` à 30 jours | cloche |
| Dossier clos | assuré ; courtier ; `ARCH` (dossier à verser) | e-mail, courrier ; cloche |
| Refus de prise en charge | assuré ; gestionnaire | courrier signé |
| Classement sans suite | assuré (dernier courrier) ; gestionnaire | courrier |
| Litige constaté | `RESP` ; `DG` ; `DT` ; assuré (accusé) | cloche ; courrier |
| Suspicion de fraude signalée, revue ouverte, dossier bloqué | `AUD` ; `RESP` ; `DG` ; `DT` (jamais l'assuré ni le courtier) | cloche |
| Recours créé, relance due, prescription à 90 jours | `GREC` ; `RESP` | cloche |
| Mise en demeure sans réponse, encaissement à rapprocher | `RESP` ; `CPT` | cloche |
| Échéance réglementaire à 45 jours, ou dépassée | gestionnaire ; `RESP` ; `DT` | cloche, e-mail |
| Dossier à surveiller (8 jours), à relancer (15 jours), muet (30 jours) | gestionnaire ; `RESP` ; `RESP`, `DT` et `AUD` | cloche |
| Dossier rouvert | gestionnaire ; `ARCH` (sortie de chemise) | cloche |

**Conséquences (testables) :**
- Chaque ligne du tableau est jouée en recette sur un dossier de démonstration : l'événement se produit, la notification part, au bon destinataire, par le bon canal.
- Aucune notification à l'assuré ou au courtier ne contient le mot « fraude », une donnée médicale ni un montant d'indemnité ; un test lit tous les modèles sortants. Un message d'offre dit qu'un courrier est disponible.
- Une notification externe n'est jamais envoyée sans le canal et le numéro enregistrés pour l'assuré ; sinon elle est refusée (`CANAL_ABSENT`) et le dossier entre dans la liste « à contacter autrement ».
- Une notification de relance suit l'intervalle de 5 jours (FR-143) ; une notification de courrier garde sa preuve d'envoi.
- Le module `notification` renvoie l'accusé de transmission ; Prospera l'inscrit au journal du dossier.
- Un destinataire désactivé (rôle retiré) ne reçoit plus la notification ; elle bascule vers `RESP`.

#### FR-147 : La corbeille du gestionnaire et la file du responsable

**Corbeille du gestionnaire (`GEST`).** Le gestionnaire, rattaché à un volet (corporel, matériel, risques divers), voit : **mes dossiers en charge** (corbeille personnelle) ; la **corbeille de service** de son volet (tous les dossiers actifs, sans distinction d'agent : absence, reprise) ; **mes délais** et **mes attentes** (FR-145) ; les dossiers à instruire, les pièces à réclamer, les expertises à suivre, les devis à contrôler, les évaluations à arrêter, les offres sans réponse, les règlements en échec. Chaque ligne montre : numéro de sinistre officiel (ou référence de déclaration), assuré, statut, échéance la plus proche, dernière action. Sur chaque dossier, les gestes **ouverts** s'affichent, et les gestes **fermés** s'affichent aussi avec leur motif de blocage (FR-136).

**File du responsable (`RESP`).** Le responsable voit : les dossiers **à attribuer** (statut `OUVERT` sans gestionnaire) et la charge de chaque gestionnaire ; les dossiers **à valider** à son niveau de délégation ; les **blocages** et les **litiges** ; les dossiers **hors délai** ; les dossiers **muets** ; les **offres sans réponse** à 30 jours ; les **honoraires à viser** ; les **provisions** à revoir ; les **recours** à arbitrer ; les **règlements** qui dépassent leur échéance ; les dossiers sans numéro officiel. Il réattribue un dossier avec motif.

**Conséquences (testables) :**
- Un gestionnaire ne voit dans sa corbeille personnelle que ses dossiers ; dans la corbeille de service, que les dossiers actifs de son volet ; il n'ouvre pas un dossier d'un autre volet (`DROIT_INSUFFISANT`).
- Un gestionnaire corporel est le seul, avec `MED`, `RESP`, `DG` et `DT` pour une décision, à lire les pièces de santé ; chaque lecture est journalisée.
- Une action fermée s'affiche avec son motif en clair, « réservée à : responsable, direction » ou « le dossier doit avoir été attribué à un gestionnaire » ; elle n'est pas masquée.
- Le responsable attribue un dossier `OUVERT` à un gestionnaire avec un motif obligatoire ; une réattribution sans motif est refusée (`MOTIF_ECRIT`) ; un responsable ne s'attribue pas un dossier qu'il doit valider seul.
- La file du responsable trie par échéance la plus proche, puis par ancienneté ; un test vérifie l'ordre sur le jeu de démonstration.
- La recherche d'un dossier depuis ces files donne un résultat en moins de 5 secondes au 95e centile (§8, décision D20) [ASSUMPTION: volume de dimensionnement de D20].

#### FR-148 : La file de validation, la file de la comptabilité, le guichet de remise

**File de validation (`RESP`, comité, `DT`, `DG`).** Elle liste les dossiers `EN_VALIDATION` selon la délégation du signataire : à son niveau (≤ 1 000 000 FCFA pour `RESP`, comité pour les montants supérieurs, visa de `DT`, règlements à titre commercial pour `DG`, §5.7). Pour chaque dossier, une **fiche de décision** préparée résume : pièces, expertises, décompte, comparables, délai, déclaration tardive, franchise, signaux de fraude, part du tiers et recours à engager ; le motif de la décision est obligatoire. Le cumul des montants validés du dossier est visible (anti-fractionnement).

**File de la comptabilité (`CPT`).** Elle liste : les **ordres à traiter** (`A_PAYER`), les **chèques à remettre** et leur ancienneté, les **règlements en échec**, les **rapprochements** à faire (chèques, virements, Mobile Money, encaissements de recours), les **honoraires à payer**, les écarts de rapprochement de plus de 60 jours, les alertes de contrôle LBC/FT (FR-100) et l'**état et l'export** du FR-103. Chaque ligne montre le bénéficiaire, le montant, le moyen, l'échéance (FR-102).

**Guichet de remise (`ACC`, `CPT`).** Le guichet offre une **recherche permanente** (nom, téléphone, numéro de sinistre, numéro de police, immatriculation, numéro d'archivage) et quatre files : **à traiter**, **pièces à réclamer**, **chèques à retirer**, **mes déclarations**. Les gestes sur la ligne : recevoir une pièce, tracer un appel (canal et commentaire), remettre le chèque (identité du retirant, numéro de pièce, quittance signée), faire signer une quittance. Un compte de la journée résume : déclarations, pièces prises, appels tracés, chèques remis. L'accueil voit qu'une pièce médicale est reçue, jamais son contenu (D14).

**Conséquences (testables) :**
- Un signataire ne voit dans sa file de validation que les dossiers de son niveau de délégation ; il ne signe pas au-delà (`VALIDATION_ACQUISE`).
- La fiche de décision affiche un point de vigilance pour chacune des règles suivantes quand elle s'applique : hors délai, déclaration tardive, franchise, plafond, exclusions à écarter, complément d'expert non revenu.
- Une validation sans motif est refusée (`MOTIF_ECRIT`) ; le bouton de confirmation est inactif tant que le motif est vide.
- La file de la comptabilité n'affiche aucune donnée de santé ; le bénéficiaire, le montant et le moyen suffisent.
- Le guichet ne propose le geste « remettre le chèque » que pour un chèque `CHEQUE_A_REMETTRE` ; il l'indique fermé, avec le motif, pour un virement ou un paiement mobile.
- Le champ « retiré par » du guichet est vide à l'ouverture du geste (FR-97) ; un test le vérifie.
- Le compte de la journée se calcule depuis le journal, sans ressaisie.

#### FR-149 : Les files du pôle recours et du contrôle interne

**Pôle recours (`GREC`).** Le gestionnaire recours voit : **mes recours** ; les **nouveaux recours** (`A_QUALIFIER`) ; les recours **à relancer** (15 jours) ; les **mises en demeure** à préparer, à envoyer, sans réponse ; les **créances** (anciennes, contestées) ; les **négociations** (offres et contre-offres) ; les **contentieux** ; les **encaissements** à rapprocher ; les recours dont la **prescription** approche ; les recours à ouvrir (avec export de la sélection). Il lit les dossiers sinistres liés à ses recours, même clos.

**Contrôle interne (`AUD`).** Le contrôle interne voit : la **file de revue de fraude** (FR-129, FR-131) ; le **graphe des liens** (FR-132) ; le **plan de contrôle** : séparation des fonctions (SEP-01, SEP-02, SEP-03), décaissements, traçabilité, dossier ; la **piste d'audit** (FR-138) ; les **modifications sensibles** ; les paiements sur dossier `SUSPECT` ou `BLOQUE` non revu ; les concentrations d'émission (FR-100). Il lit presque tout, n'écrit que ses conclusions de revue et ses constats.

**Conséquences (testables) :**
- Un `GREC` ne voit pas les pièces de santé ; il voit la créance, les pièces probantes (procès-verbal, constat, rapport de police) et les règlements.
- `AUD` ne peut déclencher aucune transition du circuit autre que le signalement, l'écartement ou la confirmation de fraude ; toute autre tentative est refusée (`DROIT_INSUFFISANT`).
- La file de revue de fraude est ordonnée comme au FR-131 ; un test le vérifie.
- Le plan de contrôle affiche, pour chaque séparation de fonctions, la population testée, les écarts constatés et leur gravité (critique, majeure) ; un écart peut être justifié ou corrigé avec un texte, jamais supprimé.
- Un export de la piste d'audit est produit (périmètre, période, utilisateur) ; le bouton « export » de la démo, sans effet, est remplacé par un traitement réel.
- Les files du pôle recours se vident à mesure que les recours se terminent ; un recours `RECUPERE` ou `ABANDONNE` quitte les files actives et reste consultable.

### Écarts avec la démo relevés

Cette liste réunit les écarts entre le code de la démo et le PRD, pour les sections 5.8 à 5.15. Elle sert de liste de reprise pour l'équipe de réalisation.

1. **L'offre et l'accord deviennent une étape** (D6) : la démo passait de la validation à l'ordre de règlement ; le PRD ajoute `OFFRE_ENVOYEE` et exige l'accord enregistré avant tout ordre (FR-90, transitions 10 et 14).
2. **Le recours devient un suivi parallèle** (D10) : trois transitions de la démo (vers `RECOURS`, et la clôture du recours par le dossier) disparaissent ; le recours naît à l'ouverture et a sa machine (FR-108, FR-112).
3. **La validation a plusieurs niveaux** (D8) : le seuil unique de 2 000 000 FCFA de la démo est remplacé par une matrice de délégation (§5.7) ; l'ordre de règlement n'est plus une chaîne INSTRUCTION, RESPONSABLE, COMPTABILITE, DIRECTION générée : il naît de l'accord.
4. **Un dossier a plusieurs règlements** (D11) : la démo n'avait qu'une quittance par ordre et un statut lié au chèque (`CHEQUE_A_REMETTRE`) ; le PRD donne un état au règlement, un état à la quittance, et le dossier devient `REGLE` à reste à payer zéro (FR-91, FR-92).
5. **Le paiement électronique est réel et passe par `paiement`** : la démo ne faisait aucun paiement (virement, T-Money, Flooz n'étaient que des valeurs) ; la quittance est signée avant le paiement électronique (FR-95, FR-96).
6. **Les gabarits manquent dans la démo** : ni gabarit de chèque ni de quittance ; la banque était pré-remplie et le comptable ne saisissait rien. Le PRD fait saisir banque, numéro et montant (FR-94).
7. **Contrôles de paiement** : repris de la démo (5 jours, 30 jours, 60 %, plafond d'espèces) et complétés du libellé au nom de la victime au corporel (art. 232), de l'avis de tutelle pour les mineurs (art. 234) et du blocage du bénéficiaire non conforme (FR-100).
8. **La fraude étend son blocage** : la démo bloquait la validation et l'émission ; le PRD bloque aussi l'envoi de l'offre, l'accord, la remise et le paiement, et étend le signalement aux états de paiement (FR-125, FR-130, transitions 33 à 36).
9. **La revue de fraude et l'empreinte de photo étaient simulées** : le PRD les rend réelles ; sans modèle de vision, la comparaison de photos est « indisponible » (FR-132).
10. **`SANS_SUITE` se rouvre** : la démo le tenait pour terminal sans issue ; le PRD ajoute la réouverture (transition 41) et exige la décision de la direction au corporel automobile (FR-123).
11. **La clôture exige la qualification du recours et une provision à zéro** : nouveauté (FR-104, FR-105) ; le dossier clos peut avoir un recours actif (FR-106).
12. **Les délais sont séparés** (D7) : la démo mélangeait un délai d'offre corporelle de 90 jours depuis le dossier complet et « 365 jours depuis la survenance » ; le PRD sépare la loi (12 mois, 8 mois, 6 mois, 30 jours, 15 jours, 5 % par mois) et le délai interne, et note que l'offre s'arrête à son envoi (non à l'évaluation) et que le règlement se compte depuis l'accord.
13. **La source des délais de la démo** (un règlement daté de 2026, versionné « 2026.2 ») n'est pas vérifiée : elle n'est pas citée ; le PRD cite le Code CIMA aux seuls articles lus.
14. **La prescription du recours est un terme à vérifier** : la démo affichait 730 jours (« art. 28 ») ; le PRD garde ce terme comme valeur prudente et signale que l'action de l'assureur subrogé peut relever d'un délai de 5 ans (art. 256) selon son fondement (FR-118).
15. **Le recours gagne un arbitrage et plusieurs débiteurs** : `EN_ARBITRAGE` est ajouté (art. 276), un dossier peut avoir plusieurs recours, l'abandon est possible depuis les premiers états (FR-108, FR-112, FR-119).
16. **La contre-proposition de recours par règles** garde la formule de la démo mais n'est jamais chiffrée sur un dossier corporel (FR-120).
17. **Les courriers** : la démo les générait sans en créer ; le PRD crée un courrier avec statut, preuve, signature, version du brouillon (FR-122).
18. **L'export d'audit** : le bouton « Export piste d'audit » de la démo n'avait pas de traitement ; le PRD exige un export réel (FR-138, FR-149).
19. **Des transitions ajoutées pour fermer les culs-de-sac** : 9, 21, 23, 27, 33 à 36 et 41 (FR-135).
20. **Les chiffres non repris** : la cible de 10 jours entre évaluation et paiement, remplacée par 72 heures après l'accord ; le forfait de convention de 350 000 FCFA, désormais inactif par défaut ; le tableau de pilotage de direction (§6.7).
