# STORY-618 : Une mise en page HTML livrée avec le code, et son repli texte

Status: done

**Épic :** EPIC-055 — Modèles, rendu et formes par canal
**Service :** `notification-service`
**Points :** 5 · **Sprint :** S35
**Prérequis :** **STORY-617** (la marque de l'organisation)
**Origine :** revue d'architecture du 2026-09-06 · rail B, bloc B2 · AD-8.

---

## Le récit

En tant que **destinataire**, je veux un message lisible sur mon téléphone, afin de ne pas recevoir
un mur de texte brut d'un logiciel qui coûte 65 millions.

## Le fait

⛔ **L'adaptateur e-mail envoie du texte brut, et rien d'autre.** C'était juste tant qu'aucune mise
en page n'existait ; ça cesse de l'être le jour où le message porte un lien de paiement et une
marque.

⚡ **Le moteur reste celui du système**, réservé aux mises en page livrées avec le code (AD-8).
Cette story n'ouvre **pas** le moteur des modèles de base à du HTML : ce serait une seconde story,
et une surface d'injection.

⚠️ **Le repli texte n'est pas optionnel.** Une partie des destinataires lit en texte, et un message
sans partie texte tombe en indésirable.

## Critères d'acceptation

- [x] AC-1 — Une mise en page unique, livrée avec le code, alimentée par la marque de STORY-617.
- [x] AC-2 — Chaque message porte **les deux parties**, HTML et texte, issues du même contenu.
- [x] AC-3 — ⛔ Le contenu substitué est **échappé** ; un test l'éprouve avec une variable hostile.
- [x] AC-4 — Rendu vérifié sur un client mobile étroit, largeur 320 points.

## Notes

⚠️ **La mise en page est une fonction PURE du domaine.** Elle ne lit ni base, ni configuration, ni
horloge : ce qui entre est un texte déjà rendu et une marque déjà résolue.

---

## Ce que la livraison a appris (2026-09-07)

**Branche :** `MNV-618`, empilée sur `MNV-617`.

### ⚡ La mise en page se fait au FIGEMENT, jamais à la remise

Elle se nourrit de la marque, et la marque est résolue à cet instant précis. La refaire dans
l'adaptateur l'aurait fait dépendre de la configuration du jour où le travail sort de la file — et
les deux parties d'un même message auraient cessé de dire la même chose. **L'adaptateur transporte,
il ne rédige pas** (AD-8) : il reçoit `corpsHtml` et le pose à côté de `text`.

### ⛔ Une seule fonction produit les DEUX parties

Deux fonctions auraient divergé au premier correctif : le lecteur en texte aurait reçu l'ancien
message, et personne ne s'en serait aperçu — c'est précisément le lecteur qu'on ne voit jamais.
⚠️ Et `text` est **toujours** là, `html` seulement s'il existe : remplacer l'un par l'autre aurait
échangé une lisibilité contre une distribution, un message sans partie texte tombant en indésirable.

### ⛔ La liste des schémas cliquables est BLANCHE, jamais noire

Interdire `javascript:` aurait laissé passer `data:`, `vbscript:` et le prochain que personne n'a
encore nommé. Ce qui n'est pas `http` ou `https` n'est pas un lien : le texte reste du texte,
échappé, et le destinataire le voit tel quel.

⚠️ **La ponctuation finale n'appartient pas au lien.** « Ouvrez `https://exemple.tg/a.` » se
termine par un point de phrase : le coller à l'adresse produit un lien mort — et c'est le seul lien
du message. ⚠️ **L'adresse est répétée en clair sous le bouton** : un bouton dont le texte ne dit
pas où il mène est la forme exacte d'un hameçonnage, et c'est aussi le seul recours du destinataire
dont le client n'affiche pas les boutons.

### ⛔ L'esperluette s'échappe la PREMIÈRE

L'échapper en dernier transformerait le `&` de `&lt;` déjà produit en `&amp;lt;`, et le message
afficherait ses propres entités. Cinq caractères, apostrophe comprise : échapper les deux quotes
coûte le même prix et retire la question pour le jour où quelqu'un écrira un attribut entre
apostrophes.

⚠️ **Le TEXTE, lui, n'est pas échappé** — il n'a aucun interpréteur derrière lui, et l'échapper
ferait lire « `&lt;script&gt;` » au destinataire.

### ⚡ AC-4 tient à une ABSENCE de largeur fixe

`width="600"` est la forme que tous les gabarits d'e-mail recopient, et elle force un défilement
horizontal sur la moitié des téléphones. Ici : `max-width` sur le conteneur, `width:100%` sur les
tables, `max-width:100%` sur l'image, et un test qui **énumère tous les attributs `width`** pour
vérifier qu'aucun ne vaut autre chose que `100%`. ⚠️ Un second test refuse toute largeur CSS fixe.

### ⚠️ Le critère qui décide du HTML est la FORME du canal, jamais son nom

Une table `Record<NomCanal, boolean>`, pas un `if` : l'arrivée du SMS, de WhatsApp et du push
ajoutera trois lignes et rien d'autre. ⛔ Et une garde d'AD-6 refuse de toute façon de comparer un
nom de canal à un littéral hors des adaptateurs — la leçon est déjà payée en STORY-616.

### ⚠️ Un double de collection incomplet, pour la sixième fois

Le double du service de marque ne connaissait pas `adresseLogo` : huit tests d'un service
parfaitement juste sont tombés sur un `TypeError`. ⚡ Au passage, l'appel a été ramené de **deux à
un** — interroger deux fois pour tester puis pour employer laisse la porte ouverte à deux réponses
différentes.

### ⛔ Points ouverts légués

1. **AC-4 est tenu par des invariants de structure, pas par un œil humain** : aucune capture n'a
   été prise sur un client mobile réel. Ce qui est prouvé, c'est qu'aucune largeur fixe ne peut
   forcer un défilement.
2. **La partie HTML compte dans le plafond de taille**, mais aucun plafond propre ne la borne :
   un corps de 40 000 caractères produit un HTML plus lourd, et c'est le plafond de rédaction
   d'`email` (50 000) qui l'arrête indirectement.
3. **Le moteur des modèles de base reste fermé au HTML**, comme la fiche le demandait. Une
   organisation ne peut pas écrire sa propre mise en page.
