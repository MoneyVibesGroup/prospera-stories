# STORY-621 : Adaptateur WhatsApp et statut d'approbation du modèle

Status: done

**Épic :** EPIC-063 — Passerelles tierces
**Service :** `notification-service`
**Points :** 5 · **Sprint :** S36
**Prérequis :** **STORY-620** (adaptateur SMS)
**Origine :** rail B, bloc B3 · AD-6, FR-N16.

---

## Le récit

En tant qu'**organisation cliente**, je veux relancer mes clients sur WhatsApp, afin d'atteindre le
canal qu'ils utilisent vraiment.

## Le fait

⛔ **WhatsApp n'envoie pas ce qu'on veut : il envoie un modèle APPROUVÉ par lui.** C'est ce que
FR-N16 nomme, et c'est le seul canal où le statut d'approbation d'un modèle est une donnée **du
fournisseur**, pas de nous. Un modèle non approuvé doit refuser **avant** l'envoi.

⚡ La fenêtre de conversation de 24 heures change la nature du message : hors fenêtre, seul un
modèle approuvé passe. Le modéliser comme une capacité, pas comme un cas particulier.

## Critères d'acceptation

- [x] AC-1 — Statut d'approbation par canal sur le modèle : non requis, en attente, approuvé,
      refusé.
- [x] AC-2 — ⛔ Un envoi WhatsApp sur modèle non approuvé **refuse devant l'appelant**.
- [x] AC-3 — Le statut se rafraîchit depuis le fournisseur, il ne se saisit pas.
- [x] AC-4 — Identifiants pris de la passerelle de l'organisation.

---

## Ce que la livraison a appris (2026-09-07)

**Branche :** `MNV-621`, empilée sur `MNV-620`.

### ⚡ La fenêtre de 24 heures n'a eu besoin d'AUCUN champ

Hors fenêtre, seul un modèle approuvé passe ; dans la fenêtre, tout passe. Or ce service n'a
**aucun état de conversation** — il ne sait pas si une fenêtre est ouverte, et il ne peut pas le
savoir sans lire les messages entrants (EPIC-064). Il est donc **toujours hors fenêtre**, et exiger
l'approbation toujours est **la seule lecture qui ne se trompe jamais du mauvais côté**. Un champ
`fenetreHeures` aurait modélisé un état qu'on ne peut pas observer.

### ⚡ La question se pose au CANAL d'abord, jamais au statut

Un modèle `EN_ATTENTE` part sans difficulté par e-mail : l'attente ne le concerne pas. Interroger le
seul statut aurait bloqué trois canaux pour une exigence qui n'appartient qu'au quatrième.

⛔ **Et `NON_REQUISE` ne passe PAS sur un canal qui exige — c'est le cas le plus dangereux, parce
qu'il est le DÉFAUT.** Un modèle créé avant que quiconque ait pensé à WhatsApp le porte, et le
laisser partir aurait fait rejeter le message par le fournisseur, **après facturation de la
tentative**, sans que le journal sache dire pourquoi.

### ⚡ Deux déclarations indépendantes, et une garde qui les fait se répondre

`approbationModeleRequise` vit dans un catalogue de capacités ; `consulterApprobation` est une
méthode optionnelle du port. Rien dans le langage ne les relie — et c'est précisément l'écart qui ne
se voit qu'en exploitation : un canal qui **exige** une approbation que personne ne **sait lire**
refuse tous ses envois, définitivement, sans aucun moyen de sortir de l'état. ⚠️ La réciproque
compte autant : savoir lire sans exiger fait passer des messages qu'on sait refusés d'avance.

⚠️ **Un test vérifie qu'un seul canal exige aujourd'hui** — sinon l'équivalence serait vraie entre
deux `false`, c'est-à-dire vraie sans rien prouver.

### ⛔ Le statut se RAFRAÎCHIT, il ne se saisit pas — et c'est structurel

Aucun argument, aucun champ de DTO ne porte de statut. Ce que l'appelant fournit est le **nom du
modèle chez le fournisseur** — une désignation, jamais un verdict. Un champ de formulaire aurait
fait déclarer « approuvé » à une organisation pressée.

⛔ **Deux espaces de noms, et les confondre casse au premier renommage.** Notre clé est en
kebab-case et choisie par l'organisation ; le nom approuvé est en snake_case et choisi par le
fournisseur. Un test vérifie qu'une de nos clés n'est **jamais** une référence valide — c'est ce qui
prouve que les deux espaces sont distincts.

### ⚠️ Un fournisseur injoignable ne marque RIEN

L'adaptateur **lève** ; il ne rend jamais `EN_ATTENTE` par défaut, ce qui aurait fait régresser un
modèle approuvé au premier hoquet de réseau. ⚡ En revanche, **« le fournisseur ne connaît pas ce
modèle » est une RÉPONSE, pas une panne** : c'est le cas d'un modèle jamais soumis, et il se soigne
en le soumettant.

⛔ **Un statut que nous ne reconnaissons pas n'est pas une approbation.** Le traiter comme tel aurait
fait partir un message sur la foi d'une chaîne arbitraire rendue par un tiers.

### ⚠️ Trois causes, trois remèdes, donc trois motifs

« Le fournisseur examine encore » s'attend ; « le fournisseur a refusé » se réécrit ; « jamais
soumis » se soumet. Les confondre aurait fait attendre indéfiniment un modèle que personne n'a
envoyé au fournisseur. Un test vérifie que les trois motifs sont **distincts**.

### ⚡ `presume`, jamais `confirme`

Le destinataire peut désactiver les accusés de lecture : « non lu » ne veut alors pas dire « pas
lu ». Déclarer `confirme` aurait fait relancer, au barreau WhatsApp, tous ceux qui ont simplement
coupé la fonction — c'est-à-dire les plus soucieux de leur vie privée.

### ⚠️ Un second point de terminaison, facultatif

Consulter l'approbation d'un modèle et remettre un message sont deux gestes chez le fournisseur ;
les confondre aurait fait interroger l'état d'un modèle sur l'adresse qui envoie. Son **absence**
dit que ce déploiement ne sait pas consulter — et le service le dit alors, au lieu de deviner.

### ⛔ Points ouverts légués

1. **Aucune pièce jointe sur WhatsApp**, et c'est un choix de portée : le protocole les transporte,
   mais cela demanderait un second contrat (téléversement, identifiant de média, durée de vie) que
   rien dans cette story ne décrit. Déclarer `true` sans l'implémenter aurait fait accepter une
   facture que la remise aurait perdue.
2. **Le tarif est à zéro**, même point ouvert qu'en STORY-620 — STORY-624 le corrige.
3. **La famille `MODELE_EN_ATTENTE_APPROBATION` de la console reste déclarée indisponible** : le
   statut existe désormais, mais l'inventaire des modèles en attente n'a pas d'écran. C'est une
   story de console, pas d'adaptateur.
4. **Aucune soumission de modèle au fournisseur** : ce service lit un statut, il ne dépose pas un
   modèle pour approbation. Le dépôt reste un geste manuel dans la console du fournisseur.
