# Rail B — `notification-service` : les 20 prochaines stories

**Date :** 2026-09-06 · **Service unique :** `prospera-notification-service` · **Port :** 3008
**Total :** 80 points · **Rail exécutable seul**, sans rien attendre du rail A.

> Le module 1 est livré et les 71 exigences du PRD sont mappées. Ce rail porte donc **deux choses
> différentes** : les deux épics reportés du PRD (EPIC-063 passerelles tierces, EPIC-064 réponses
> entrantes), et **ce que la revue d'architecture du 2026-09-06 a trouvé** — un service multi-tenant
> sur le papier, **mono-expéditeur en exécution**.

---

## Bloc B1 — L'identité d'envoi de l'organisation · 21 pts

> ⛔ **Le trou central.** `configurations_passerelles` existe depuis STORY-572, mais le chemin
> d'envoi ne la lit **jamais** : l'adaptateur SMTP lit la configuration d'environnement, et le seul
> consommateur du service de passerelles est celui des accusés de réception. Aujourd'hui, l'e-mail
> d'une microfinance part **du relais Money Vibes, sous l'expéditeur Money Vibes**.

### 1 · STORY-604 🆕 — La passerelle de l'organisation est résolue à la remise

**Points :** 5 · **Fiche écrite :** `stories/STORY-604.md`

Le port reçoit la passerelle **en paramètre** ; la résolution part de l'organisation portée par le
travail ; le secret déchiffré n'entre jamais dans la charge persistée dans Redis.

### 2 · STORY-605 🆕 — Repli de plateforme nommé, et ce qu'il change pour le destinataire

**Points :** 3 · **Fiche écrite :** `stories/STORY-605.md` · **Prérequis :** 604

*Pas de configuration* et *configuration refusée* sont deux causes, donc deux codes, donc deux
remèdes. La seconde **échoue**, elle ne se replie pas.

### 3 · STORY-614 🆕 — Vérifier une passerelle avant de l'activer

**Récit :** en tant qu'**organisation cliente**, je veux savoir que ma passerelle fonctionne au
moment où je l'enregistre, afin de ne pas le découvrir sur le premier message d'un client.

⚡ **La vérification est une QUESTION, jamais un envoi.** Le patron est déjà écrit côté paiement
(STORY-244) : on interroge la capacité, on n'émet pas un message d'essai vers une adresse réelle. Un
message d'essai serait un envoi non demandé, non consenti et facturé.
⚡ **Savoir vérifier se DÉRIVE de la présence de la méthode** sur l'adaptateur ; un booléen à côté
mentirait. Une passerelle non vérifiable est `NON_VERIFIABLE`, et le dire est un **code**, pas un
échec.
⛔ Une passerelle **injoignable** ne marque rien : l'indisponibilité dit le moment, pas la validité.

- AC-1 — L'enregistrement d'une passerelle déclenche une vérification **synchrone et bornée**.
- AC-2 — La vérification **n'envoie aucun message** vers un destinataire réel. Garde de balayage.
- AC-3 — Trois issues distinctes : vérifiée, refusée par la passerelle, non vérifiable.
- AC-4 — Une passerelle non vérifiée **peut être enregistrée mais pas activée**.
- AC-5 — Le secret n'apparaît ni dans la réponse, ni dans le motif, ni dans le journal.

**Points :** 5 · **Prérequis :** 604

### 4 · STORY-615 🆕 — Le domaine d'expédition est vérifié, ou l'on n'usurpe pas

**Récit :** en tant qu'**exploitant**, je veux qu'une organisation ne puisse pas déclarer une adresse
d'expédition sur un domaine qu'elle ne contrôle pas, afin que la réputation du relais ne serve pas à
usurper une marque.

⛔ **Le champ `expediteur` est aujourd'hui du texte libre.** Rien n'empêche une organisation
d'écrire l'adresse d'une banque. Sur le relais de plateforme, ce message partirait **avec la
réputation de Prospera derrière lui**.
⚡ **La preuve vient du DNS, pas de nous.** Un enregistrement à publier, une valeur à retrouver : le
même geste que la preuve de révocation chez le fournisseur en STORY-249 — *ce qu'on ne contrôle pas,
on le fait attester par celui qui le contrôle.*
⚠️ Sur la **passerelle propre** d'une organisation, la contrainte tombe : elle envoie chez elle, avec
sa réputation. La vérification ne mord que sur le relais partagé.

- AC-1 — Une adresse d'expédition sur le relais **partagé** exige un domaine vérifié.
- AC-2 — La vérification est un contrôle DNS, rejouable, avec une date de dernier succès.
- AC-3 — Un domaine qui cesse d'être vérifié **ferme l'expéditeur**, il ne le laisse pas courir.
- AC-4 — L'organisation voit ce qu'elle doit publier, à l'octet près, et pourquoi.
- AC-5 — Une organisation sur **sa propre** passerelle n'est pas soumise au contrôle.

**Points :** 5 · **Prérequis :** 604, 605

### 5 · STORY-616 🆕 — La santé des canaux, par organisation

**Récit :** en tant qu'**organisation cliente**, je veux voir l'état de **mes** canaux, afin de
savoir que mes messages ne partent plus avant qu'un client ne me le dise.

⚡ **La santé s'observe et se publie, elle ne décide de rien** (leçon de STORY-249). Aucun envoi ne
consulte cet état pour choisir un canal.
⛔ **`/health` reste une question de PLATEFORME et le reste.** Elle est publique : un appel sortant
déclenché depuis là, avec la clé d'un client, serait déclenchable par n'importe qui. La santé par
organisation vit sur une route **authentifiée et cloisonnée**.

- AC-1 — Une route authentifiée rend l'état des canaux **de l'organisation du jeton**.
- AC-2 — ⛔ `/health` ne change pas et n'utilise aucun secret d'organisation. Garde.
- AC-3 — L'état distingue *non configuré*, *configuré et sain*, *configuré et refusé*.
- AC-4 — Aucun motif ne porte le texte rendu par la passerelle.

**Points :** 3 · **Prérequis :** 604, 614

---

## Bloc B2 — Les messages système et la marque · 16 pts

### 6 · STORY-611 🆕 — Les sept modèles de compte, livrés avec le code

**Points :** 5 · **Fiche écrite :** `stories/STORY-611.md` · ⛔ **Bloque STORY-610** (consolidation)

⚡ Ils doivent exister **avant que quiconque ait rien fait**, sinon la toute première inscription de
la plateforme n'a aucun message à envoyer.

### 7 · STORY-617 🆕 — La marque de l'organisation sur les modèles système

**Récit :** en tant qu'**organisation cliente**, je veux que les messages de compte portent mon nom,
mon logo et mes couleurs, afin que mes utilisateurs ne reçoivent pas un message de Prospera.

⚡ **Une organisation habille, elle ne supprime pas.** Un client qui pourrait retirer le message de
réinitialisation fermerait à ses propres utilisateurs le seul chemin de récupération d'un compte.
⚠️ **La marque est une donnée d'ORGANISATION, pas de modèle.** La ranger dans le modèle la ferait
recopier sept fois, et diverger à la première correction.

- AC-1 — Nom affiché, logo, couleur d'accent et pied de page, portés **une fois** par organisation.
- AC-2 — Un modèle système sans surcharge rend la marque **Prospera**, et le dit.
- AC-3 — ⛔ Aucune surcharge ne peut retirer un modèle système ni vider son appel à l'action.
- AC-4 — Le logo est servi depuis un emplacement contrôlé ; aucune URL arbitraire n'entre dans un
  message sortant.

**Points :** 3 · **Prérequis :** 611

### 8 · STORY-618 🆕 — Une mise en page HTML livrée avec le code, et son repli texte

**Récit :** en tant que **destinataire**, je veux un message lisible sur mon téléphone, afin de ne
pas recevoir un mur de texte brut d'un logiciel qui coûte 65 millions.

⛔ **L'adaptateur e-mail envoie du texte brut, et rien d'autre.** C'était juste tant qu'aucune mise
en page n'existait ; ça cesse de l'être le jour où le message porte un lien de paiement et une
marque.
⚡ **Le moteur reste celui du système**, réservé aux mises en page livrées avec le code (AD-8). Cette
story n'ouvre **pas** le moteur des modèles de base à du HTML : ce serait une seconde story, et une
surface d'injection.
⚠️ **Le repli texte n'est pas optionnel.** Une partie des destinataires lit en texte, et un message
sans partie texte tombe en indésirable.

- AC-1 — Une mise en page unique, livrée avec le code, alimentée par la marque de STORY-617.
- AC-2 — Chaque message porte **les deux parties**, HTML et texte, issues du même contenu.
- AC-3 — ⛔ Le contenu substitué est **échappé** ; un test l'éprouve avec une variable hostile.
- AC-4 — Rendu vérifié sur un client mobile étroit, largeur 320 points.

**Points :** 5 · **Prérequis :** 617

### 9 · STORY-619 🆕 — Pièce jointe : capacité déclarée, borne, et refus lisible

**Récit :** en tant que **module de facturation**, je veux joindre une facture au message, afin que
le client n'ait pas à se connecter pour l'obtenir.

⚡ **La pièce jointe est une CAPACITÉ DE CANAL** (FR-N20), pas une option d'envoi. L'e-mail en porte,
le SMS n'en porte pas, et le demander au SMS doit **refuser devant l'appelant**, jamais tronquer.
⛔ **Aucune pièce jointe ne porte de secret.** Une facture jointe est un document que le
destinataire a le droit de lire ; un relevé de compte d'un tiers ne l'est pas. Le contrôle est chez
l'appelant, et la story l'écrit.

- AC-1 — La capacité est **déclarée par l'adaptateur** ; le port la publie.
- AC-2 — Un canal sans la capacité **refuse** avec un code nommé.
- AC-3 — Bornes de taille et de type, refusées devant l'appelant.
- AC-4 — Aucune pièce jointe n'est écrite dans le journal des envois, seulement son empreinte.

**Points :** 3 · **Prérequis :** 618

---

## Bloc B3 — Les canaux qui coûtent · EPIC-063 · 21 pts

> **Déclencheur d'ordonnancement écrit :** la signature du premier contrat de passerelle.
> ⚡ **À lancer commercialement dès aujourd'hui, en parallèle du rail** : un compte WhatsApp Business
> vérifié et un agrégateur SMS régional se comptent en semaines de délai externe, et la promesse
> commerciale vend *« WhatsApp avec lien de paiement »* en première ligne du tableau des relances
> microfinance.

### 10 · STORY-620 🆕 — Adaptateur SMS derrière le port unique

⚡ **La preuve que le port d'AD-6 n'a fui nulle part** se refait ici, comme en STORY-580 pour
l'in-app : deux lignes de fabrique, et rien d'autre ne bouge.
⚠️ Le destinataire est un **contact**, donc le consentement et le désabonnement mordent, et le
numéro se normalise par le carnet, jamais à la main.

- AC-1 — L'adaptateur entre par la même fabrique que l'e-mail ; aucune exception n'apparaît.
- AC-2 — Identifiants pris de la passerelle de l'organisation (STORY-604), jamais de l'environnement.
- AC-3 — Accusé de remise rattaché par le webhook signé existant.
- AC-4 — Le numéro est masqué dans tout journal.

**Points :** 5 · **Prérequis :** 604, 614

### 11 · STORY-621 🆕 — Adaptateur WhatsApp et statut d'approbation du modèle

⛔ **WhatsApp n'envoie pas ce qu'on veut : il envoie un modèle APPROUVÉ par lui.** C'est ce que
FR-N16 nomme, et c'est le seul canal où le statut d'approbation d'un modèle est une donnée **du
fournisseur**, pas de nous. Un modèle non approuvé doit refuser **avant** l'envoi.
⚡ La fenêtre de conversation de 24 heures change la nature du message : hors fenêtre, seul un modèle
approuvé passe. Le modéliser comme une capacité, pas comme un cas particulier.

- AC-1 — Statut d'approbation par canal sur le modèle : non requis, en attente, approuvé, refusé.
- AC-2 — ⛔ Un envoi WhatsApp sur modèle non approuvé **refuse devant l'appelant**.
- AC-3 — Le statut se rafraîchit depuis le fournisseur, il ne se saisit pas.
- AC-4 — Identifiants pris de la passerelle de l'organisation.

**Points :** 5 · **Prérequis :** 620

### 12 · STORY-622 🆕 — Adaptateur push

⚠️ Le destinataire est un **jeton d'appareil**, pas une personne : il expire, il se révoque, et un
jeton mort n'est pas un échec d'envoi mais une **radiation du carnet**.

- AC-1 — Entrée par la même fabrique.
- AC-2 — Un jeton refusé par le fournisseur est **retiré du carnet**, et le retrait est tracé.
- AC-3 — Aucune donnée sensible dans la charge poussée ; le message ouvre l'écran, il ne le porte pas.

**Points :** 3 · **Prérequis :** 620

### 13 · STORY-623 🆕 — Chaîne de repli ordonnée, sur échec technique seulement

⛔ **Le repli se déclenche sur échec technique du canal, JAMAIS sur l'absence de lecture** (FR-N21).
Replier parce que le message n'a pas été lu ferait d'un client silencieux un client harcelé sur
quatre canaux, facturés quatre fois.
⚡ **Chaque tentative est un envoi à part entière** : son coût, son statut et son accusé sont
distincts. Une chaîne qui écraserait la trace de la tentative précédente rendrait la facture
inexplicable.

- AC-1 — La liste de repli est **ordonnée** et portée par la demande, pas par une préférence globale.
- AC-2 — ⛔ Un test prouve qu'un message **remis mais non lu** ne déclenche aucun repli.
- AC-3 — Chaque tentative laisse sa propre ligne de journal et son propre coût.
- AC-4 — Un canal indisponible pour **cette** organisation passe au suivant sans échouer la chaîne.

**Points :** 5 · **Prérequis :** 620, 621, 622

### 14 · STORY-624 🆕 — Segments SMS, alphabet non latin et coût annoncé avant l'envoi

⚡ **Le nombre de segments est une DONNÉE du texte, pas une estimation.** 160 caractères en alphabet
latin, **70 en UCS-2** dès qu'un caractère sort de l'alphabet — un seul « é » mal encodé triple la
facture d'une campagne (FR-N14).
⚠️ Le coût annoncé avant l'envoi et le coût **rapporté** par la passerelle sont deux nombres
différents, et c'est le second qui entre en comptabilité (patron déjà tenu : *le premier gagne par un
filtre*).

- AC-1 — Le calcul de segments est une fonction pure, éprouvée sur les deux alphabets.
- AC-2 — Le nombre de segments et le coût estimé sont annoncés **avant** l'exécution d'un envoi de masse.
- AC-3 — Le coût réel rapporté ne remplace jamais rétroactivement un coût déjà comptabilisé.

**Points :** 3 · **Prérequis :** 620

---

## Bloc B4 — La conversation dans les deux sens · EPIC-064 · 14 pts

> **Dépend du bloc B3 :** sans canal bidirectionnel, il n'existe aucune source de réponse.

### 15 · STORY-625 🆕 — Message entrant : réception signée et rattachement à certitude

⚡ **Le rattachement se fait par CERTITUDE, jamais par ressemblance.** Une réponse se rattache à
l'envoi qui l'a provoquée par une référence portée par le canal ; à défaut, elle est **rangée sans
être rattachée** — le patron exact de la notification orpheline de STORY-260.
⛔ La signature se vérifie **avant toute persistance**, et le corps brut est exigé.

- AC-1 — Surface publique **énumérée**, avec son propre plafond de débit (AR-13).
- AC-2 — Signature vérifiée sur les octets bruts ; une signature invalide **n'écrit rien**.
- AC-3 — Un rejeu n'est pas un fait : il abandonne la transaction.
- AC-4 — Une réponse non rattachable est **conservée**, jamais perdue.

**Points :** 5 · **Prérequis :** 621

### 16 · STORY-626 🆕 — La réponse est routée vers le module qui avait parlé

⚡ **Le contexte vient de l'envoi d'origine, pas du contenu du message.** Lire l'intention dans le
texte serait une devinette sur le chemin de l'argent : *« oui »* peut répondre à une promesse de
paiement comme à une campagne.
⚠️ **L'inbox du Studio social est un CONSOMMATEUR de ce flux, pas son propriétaire** (FR-N44).

- AC-1 — Le module destinataire est celui qui a demandé l'envoi d'origine.
- AC-2 — La réponse fait passer l'envoi d'origine au statut **répondu** (FR-N45).
- AC-3 — Aucun module ne lit la collection des messages entrants : il consomme.

**Points :** 3 · **Prérequis :** 625

### 17 · STORY-627 🆕 — Destination par défaut d'une réponse sans contexte

⚠️ « Sans contexte » et « contexte inconnu de nous » ne se lisent pas pareil, et la destination par
défaut est une **donnée d'organisation** (FR-N43), pas un réglage de plateforme.

- AC-1 — Chaque organisation déclare sa destination par défaut ; l'absence est un état explicite.
- AC-2 — Une réponse orientée par défaut le dit ; elle ne se présente pas comme rattachée.

**Points :** 3 · **Prérequis :** 626

### 18 · STORY-628 🆕 — Interception du « STOP »

⛔ **Sur un canal entrant, le refus arrive comme un MESSAGE, pas comme un clic sur un lien.** Le
désabonnement de EPIC-059 ne le voit pas. Un « STOP » non intercepté est une infraction, sur un
canal où l'opérateur l'impose.
⚡ Il est **opposable immédiatement**, y compris à un envoi de masse déjà en cours — la règle est
déjà écrite, il lui manque cette porte d'entrée.

- AC-1 — Le mot-clé est reconnu quelle que soit la casse et l'espacement, et il est **énuméré**, pas
  deviné par un motif large.
- AC-2 — L'entrée de consentement est écrite **avant** que l'accusé ne parte.
- AC-3 — Le refus suit la **personne**, pour tous les modules de l'organisation (FR-N49).
- AC-4 — ⛔ Il n'éteint **pas** le transactionnel : un code de vérification passe toujours.

**Points :** 3 · **Prérequis :** 625

---

## Bloc B5 — La cloche et la recette du rail · 8 pts

### 19 · STORY-612 🆕 — La cloche reçoit les faits d'abonnement

**Points :** 3 · **Fiche écrite :** `stories/STORY-612.md`

⚠️ La cloche existe et **un seul service y dépose**. Si chaque module invente son bandeau d'alerte,
il y aura des alertes dans quarante-cinq écrans et aucun endroit commun.

### 20 · STORY-629 🆕 — Recette de bout en bout du rail notification

**Récit :** en tant qu'**équipe**, je veux une recette qui traverse le service de la configuration
d'une passerelle jusqu'à l'accusé de réception, afin de savoir que le rail tient sans le rail A.

- AC-1 — Deux organisations, deux passerelles, deux expéditeurs différents sur la même route.
- AC-2 — Un message part, un accusé revient, le journal le montre.
- AC-3 — Une réponse entrante est rattachée et le statut d'origine passe à **répondu**.
- AC-4 — Un « STOP » ferme la masse et laisse passer le transactionnel.
- AC-5 — ⛔ Aucun code conditionnel `si production` sur ce chemin.

**Points :** 5 · 🏁 **Recette du rail B**

---

## Ce que le rail B ne peut pas prouver seul

| Question | Portée par |
|---|---|
| Un **lien de paiement** réel arrive au payeur | consolidation (STORY-261 + 608) |
| Le **premier** message d'un utilisateur porte la marque de son organisation | consolidation (STORY-610) |
| La cloche reçoit de **vrais** faits d'abonnement | rail A (STORY-277 → 282) |
