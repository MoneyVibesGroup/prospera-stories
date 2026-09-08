# STORY-615 : Le domaine d'expédition est vérifié, ou l'on n'usurpe pas

Status: done

**Épic :** EPIC-054 — Permissions au catalogue et cloisonnement des passerelles
**Service :** `notification-service`
**Points :** 5 · **Sprint :** S44
**Prérequis :** **STORY-604** (résolution à la remise), **STORY-605** (repli de plateforme nommé)
**Origine :** revue d'architecture du 2026-09-06 · rail B, bloc B1 · FR-N54, AD-6.

---

## Le récit

En tant qu'**exploitant**, je veux qu'une organisation ne puisse pas déclarer une adresse
d'expédition sur un domaine qu'elle ne contrôle pas, afin que la réputation du relais ne serve pas à
usurper une marque.

## Le fait

⛔ **Le champ `expediteur` est du texte libre.** Rien n'empêche une organisation d'y écrire l'adresse
d'une banque. Sur le **relais partagé**, ce message partirait avec la réputation de Prospera derrière
lui — et c'est cette réputation-là qui se perd d'un coup, pour tous les clients à la fois.

⚡ **La preuve vient du DNS, pas de nous.** Un enregistrement à publier, une valeur à retrouver : le
même geste que la preuve de révocation chez le fournisseur en `paiement-service` STORY-249 — *ce
qu'on ne contrôle pas, on le fait attester par celui qui le contrôle.*

⚠️ **Sur la passerelle propre d'une organisation, la contrainte tombe.** Elle envoie chez elle, avec
sa réputation, sur son relais : nous ne prêtons rien. La vérification ne mord que sur le relais
**partagé**.

⚡ **Une organisation doit pouvoir emprunter le relais SANS emprunter la marque.** C'est le cas que
la story ouvre : une configuration qui porte un expéditeur mais aucun point de terminaison dit
« portez mon message, sous mon adresse ». Jusqu'ici ce cas était refusé pour *canal non configuré* —
c'est-à-dire que la seule façon d'envoyer sous sa propre adresse était d'avoir son propre relais.

⛔ **« Cesse d'être vérifié » n'arrive jamais si la vérification n'a pas de durée.** Un domaine
attesté une fois le resterait pour toujours, y compris après sa revente.

## Critères d'acceptation

- [x] AC-1 — Une adresse d'expédition sur le relais **partagé** exige un domaine vérifié.
- [x] AC-2 — La vérification est un contrôle **DNS**, rejouable, avec une date de dernier succès.
- [x] AC-3 — Un domaine qui cesse d'être vérifié **ferme l'expéditeur**, il ne le laisse pas
      courir — et il ne se remplace pas en silence par l'adresse de Prospera.
- [x] AC-4 — L'organisation voit ce qu'elle doit publier, **à l'octet près**, et pourquoi.
- [x] AC-5 — Une organisation sur **sa propre** passerelle n'est pas soumise au contrôle.

## Notes

⚠️ **Le contrôle DNS ne se refait PAS à chaque remise.** Chaque message dépendrait alors d'un
serveur DNS tiers, et une résolution lente ferait pendre une file entière. La remise lit une **date
de dernier succès** ; le contrôle est un acte à part.

⚠️ **L'identité d'envoi (STORY-604) ne change pas de sens ici.** Elle dit **quel relais a porté le
message** — c'est de cela que dépend la réputation de la plateforme. Ce que le destinataire voit est
l'`expediteur`, et les deux ne se déduisent pas l'un de l'autre.

---

## Journal de livraison (2026-09-06) — branche `MNV-615`

**Livré :** 2 436 tests unitaires (195 suites), e2e complet, lint et build au vert.

### ⚡ La story a d'abord OUVERT un cas, avant de le contraindre

Jusqu'ici, la seule façon d'envoyer sous sa propre adresse était **d'avoir son propre relais** :
une configuration sans point de terminaison était refusée pour *canal non configuré*. Le cas que
la fiche gouverne — « portez mon message, sous mon adresse » — n'existait donc pas encore. Il
existe maintenant, et il est **conditionné** dès sa naissance : c'est plus sûr que d'ouvrir
d'abord et de contraindre ensuite.

### ⚡ C'est la présence d'un POINT DE TERMINAISON qui sépare les deux mondes

`reglages.hote` renseigné ⇒ passerelle propre, **aucun contrôle** (AC-5) : l'organisation envoie
chez elle, avec sa réputation, nous ne prêtons rien. Vide ⇒ relais partagé, et l'adresse
affichée doit être attestée. Un drapeau `utiliseLeRelaisPartage` aurait pu mentir ; la présence
d'un hôte, non.

### ⚠️ L'identité d'envoi ne change PAS de sens — et c'était la tentation

Un message porté par le relais de Prospera sous l'adresse d'un client aurait pu réclamer une
troisième valeur d'`IDENTITES_ENVOI`. Il n'en a pas eu besoin : **l'identité dit quel relais a
porté le message**, c'est-à-dire de quoi dépend la réputation engagée, et c'est exactement la
question que se pose l'exploitant. Ce que le destinataire voit est l'`expediteur`. Le port le
disait déjà en toutes lettres depuis STORY-577 ; il a suffi de le croire.

### ⛔ Le domaine non vérifié FERME l'expéditeur, il ne le remplace pas

Substituer l'adresse de Prospera aurait été un changement d'identité silencieux — exactement ce
que STORY-605 refuse dans l'autre sens. `DOMAINE_NON_VERIFIE`, en `REGLE_METIER` : aucune
attente ne répare un domaine non attesté, et le rejouer cinq fois ne ferait que retarder la
mauvaise nouvelle.

### ⛔⛔ Le piège le plus coûteux : une virgule dans l'expéditeur

`awa@exemple.tg, victime@ailleurs.tg` est un en-tête à **deux adresses**. La première version
lisait la dernière arobase, attestait `ailleurs.tg`, et **laissait partir un message sous
`exemple.tg`** — c'est-à-dire l'usurpation exacte que la story existe pour fermer, réintroduite
par la fonction censée la fermer. C'est le test qui l'a trouvée, pas la relecture.

⚡ Remède : espaces, virgules, points-virgules et chevrons sont refusés **dans la partie
adresse**. Ce sont précisément les caractères qui séparent deux adresses dans un en-tête — ils
n'ont rien à faire dans une seule.

### ⚡ Trois décisions sur la preuve, et chacune ferme un contournement

1. **Comparaison EXACTE, sur la valeur entière.** Chercher le jeton « à l'intérieur » d'un
   enregistrement aurait vérifié un domaine tiers qui recopie notre TXT pour le citer.
2. **Les fragments sont recollés.** Le DNS découpe une chaîne TXT au-delà de 255 octets et le
   résolveur les rend séparés : comparer morceau par morceau aurait fait échouer une preuve
   valide dès qu'elle est longue.
3. **Un sous-domaine dédié**, jamais le TXT racine — qui porte déjà SPF, DMARC et les preuves de
   trois autres fournisseurs. Un client qui le remplacerait pour nous répondre casserait sa
   messagerie.

### ⛔ Sans DURÉE, « cesse d'être vérifié » n'arrive jamais

Un `verifie: true` stocké aurait été un **acquis** ; une date est un **constat**, et un constat
se périme (30 jours). Sans cela, un domaine attesté une fois le resterait après sa revente —
c'est-à-dire au moment précis où quelqu'un d'autre en prend le contrôle.

⚡ Corollaire : **un échec de résolution n'efface pas un succès antérieur.** Le DNS peut ne pas
répondre pour mille raisons étrangères au domaine ; effacer le constat sur une panne fermerait
l'expéditeur d'un client dont tout est en ordre. On date la **tentative**, et c'est l'âge du
constat qui le périme — lui seul.

### ⚠️ Le contrôle DNS ne se refait PAS à chaque remise

Chaque message dépendrait alors d'un serveur DNS tiers, et une résolution lente ferait pendre
une file entière. La remise lit une **date déjà constatée** ; `estVerifie` n'ouvre aucune
résolution, et un test le vérifie.

### ⚡ Deux organisations peuvent revendiquer le même domaine

Un groupe et sa filiale. L'unicité porte sur le **couple**, et chacune publie **son** jeton : un
index unique sur le domaine seul aurait fait de la première revendication un droit d'exclusivité
sur un nom qui ne nous appartient pas.

### ⚠️ Le jeton est posé à l'INSERTION, et ne bouge plus

Le régénérer à chaque revendication ferait cesser une vérification déjà publiée — sans erreur, et
sans que le client comprenne pourquoi sa preuve « ne marche plus ». Même règle que le jeton de
webhook de STORY-579.

### ⛔ Le piège de l'ordre des routes, deuxième fois

`/passerelles/domaines` serait entré dans `@Get(':canal')`, comme `/passerelles/politique` en
STORY-605. Il s'est représenté à l'identique dans la même session, sur le même contrôleur. Test
e2e posé, comme pour la politique.

### ⚠️ Et la garde de suppression a réclamé une décision, pour la troisième fois

`domaines_expedition` est effacée à la résiliation. ⚡ Ce qui subsiste chez le client, c'est
l'enregistrement TXT qu'il a publié dans **son** DNS : nous ne pouvons ni ne devons le retirer —
il est chez lui, et c'est bien tout l'intérêt de la preuve.

### Ce que la story ne fait pas

- ⚠️ **Aucune re-vérification automatique** : le constat se périme au bout de 30 jours et
  l'expéditeur se ferme, mais rien ne prévient avant. Un rappel serait une story à part.
- ⚠️ **Ni SPF ni DKIM** : prouver le contrôle d'un domaine n'est pas configurer sa délivrabilité.
  Un message parti du relais partagé sous l'adresse d'un client reste soumis à la politique SPF
  de ce client, et c'est à lui de nous y autoriser.
- ⚠️ **La santé par organisation reste à faire** : c'est **STORY-616**.
