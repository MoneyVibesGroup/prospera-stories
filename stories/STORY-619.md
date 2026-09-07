# STORY-619 : Pièce jointe — capacité déclarée, borne, et refus lisible

Status: done

**Épic :** EPIC-055 — Modèles, rendu et formes par canal
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S35
**Prérequis :** **STORY-618** (la mise en page HTML)
**Origine :** revue d'architecture du 2026-09-06 · rail B, bloc B2 · FR-N20, AD-6.

---

## Le récit

En tant que **module de facturation**, je veux joindre une facture au message, afin que le client
n'ait pas à se connecter pour l'obtenir.

## Le fait

⚡ **La pièce jointe est une CAPACITÉ DE CANAL** (FR-N20), pas une option d'envoi. L'e-mail en
porte, le SMS n'en porte pas, et le demander au SMS doit **refuser devant l'appelant**, jamais
tronquer.

⛔ **Aucune pièce jointe ne porte de secret.** Une facture jointe est un document que le
destinataire a le droit de lire ; un relevé de compte d'un tiers ne l'est pas. Le contrôle est chez
l'appelant, et la story l'écrit.

## Critères d'acceptation

- [x] AC-1 — La capacité est **déclarée par l'adaptateur** ; le port la publie.
- [x] AC-2 — Un canal sans la capacité **refuse** avec un code nommé.
- [x] AC-3 — Bornes de taille et de type, refusées devant l'appelant.
- [x] AC-4 — Aucune pièce jointe n'est écrite dans le journal des envois, seulement son empreinte.

---

## Ce que la livraison a appris (2026-09-07)

**Branche :** `MNV-619`, empilée sur `MNV-618`.

### ⛔ Le type déclaré est une AFFIRMATION de l'appelant ; les octets sont un FAIT

Un `application/pdf` qui commence par `<script` est un fichier HTML déguisé, et c'est le client de
messagerie du destinataire qui tranchera — souvent en faveur du contenu. Contrôler la seule chaîne
annoncée aurait donc **validé exactement l'attaque que la liste blanche ferme**. Trois signatures
binaires (PDF, PNG, JPEG) ; et pour les deux types textuels, la signature est une **absence** :
aucun octet de contrôle hors tabulation et retours de ligne.

⚡ **La liste des types est BLANCHE, et le critère est ce que le type PERMET.** Pas de `text/html`
— c'est un document **exécutable** chez le destinataire, parti avec la réputation de notre relais.
Pas d'archive — c'est un contenu qu'on n'a **pas vu**, dont aucune signature ne dit ce qu'il porte.
Pas de format bureautique — il porte des macros.

### ⚡ La borne réelle n'est pas celle du relais, c'est celle de la PORTE

La capacité SMTP annonce cinq mégaoctets par pièce. Le corps de requête, lui, est plafonné à un
mégaoctet — et un dépassement de `body-parser` sort en **`500`**, avant qu'aucun code de refus
n'ait pu être prononcé. Une pièce de cinq mégaoctets aurait donc été « acceptée » par la capacité
publiée et refusée par un message qui ne ressemble à rien de ce que l'API annonce.

⛔ **Le plafond se DÉRIVE, il ne s'écrit pas** : le base64 gonfle d'un tiers, et un nombre écrit à
la main aurait dérivé le jour où quelqu'un change la taille du corps. ⚠️ Et c'est un `min`, jamais
un remplacement : le jour où une passerelle acceptera moins que la porte, c'est elle qui gagnera.

### ⚡ Le CONTENU va dans la file, l'EMPREINTE va dans le journal

Les deux ne vivent ni au même endroit ni le même temps. Redis est éphémère et se vide dès la
remise ; le journal dure **396 jours**. Y ranger une facture en aurait fait une base documentaire
que personne n'a demandée, que la purge devrait apprendre à vider, et qu'une lecture de journal
exposerait. L'empreinte répond à la seule question qu'on posera — *est-ce bien ce document-là qui
est parti ?* — et à aucune autre.

⛔ **Et aucun chemin de MASSE ne les porte.** `DemandeDEnfilementDeMasse` ne les redéclare pas :
une pièce de cinq mégaoctets multipliée par cinquante mille destinataires est une panne, pas une
fonctionnalité. C'est une **absence**, pas une garde.

### ⛔ Le refus a lieu devant l'appelant, et AVANT le figement

Plus loin sur la chaîne, le message est figé, l'`Envoi` est écrit et le travail est enfilé : le
refus ne reviendrait plus à celui qui peut corriger. Et figer **consomme la version** — refuser
après aurait fait payer un message qui ne part pas.

⚡ **Un seul code, et le motif dit laquelle des huit causes.** L'appelant corrige la même chose dans
tous les cas — sa demande — et huit codes lui auraient fait écrire huit branches identiques.
⚠️ **Toutes les anomalies sont rendues, pas la première** : corriger un fichier à la fois pour
découvrir le suivant fait cinq allers-retours.

### ⚡ Le nombre maximum et la taille unitaire ne se MULTIPLIENT pas

Dix pièces de cinq mégaoctets feraient cinquante mégaoctets, cinq fois ce que le relais accepte.
C'est le plafond du **message entier** qui tranche, et c'est lui qui mord le premier — la partie
HTML, la partie texte et les pièces comptent ensemble.

### ⛔ `Buffer.from(…, 'base64')` ignore silencieusement ce qu'il ne comprend pas

La leçon était déjà payée côté paiement (STORY-243), elle se repaie ici : un contenu à moitié
valide produirait un fichier tronqué, accepté, et illisible chez le destinataire. Le contrôle est
un **aller-retour** — ce qui se ré-encode à l'identique a été compris en entier.

### ⚠️ Le nom de fichier est une DONNÉE, pas un chemin

Une barre oblique, un `..` ou un octet nul dedans, et c'est le client de messagerie du destinataire
qui décide où le fichier atterrit.

### ⛔ Points ouverts légués

1. **La borne effective est d'environ 720 kilo-octets par pièce**, imposée par le corps de requête.
   Une facture ordinaire pèse entre 50 et 200 ko : le besoin est couvert, mais un document plus
   lourd exigera une autre porte — une **référence** vers `document-service` plutôt qu'un contenu
   en ligne. Décision PO à prendre, hors de cette story.
2. **Aucun contrôle de droit sur le document joint** : le service ne connaît ni le dossier, ni le
   mandat, ni la personne. Le contrôle est chez l'appelant, et la fiche le dit — mais rien ici ne
   le vérifie.
3. **Les pièces jointes ne sont pas rejouables** : `rejouer` reconstruit le message depuis les
   variables conservées, et les pièces n'y sont pas. Un rejeu part donc sans elles, en silence.
