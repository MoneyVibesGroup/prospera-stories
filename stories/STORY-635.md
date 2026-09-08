# STORY-635 : Rotation du secret d'une passerelle, sans interrompre les envois

Status: done

**Épic :** EPIC-054 — Permissions au catalogue et cloisonnement des passerelles
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S38
**Prérequis :** rail B (**STORY-604** résolution à la remise et révision, **STORY-605** refus de compte nommé)
**Origine :** rail D, bloc D1 · FR-N54, AD-6.

---

## Le récit

En tant qu'**organisation cliente**, je veux remplacer le secret de ma passerelle sans perdre les
messages en cours, afin de faire tourner mes clés sans choisir un jour creux.

## Le fait

⚡ **La révision de STORY-604 rend la rotation presque gratuite — presque.** Une écriture produit
une clef neuve, donc le cache **manque** au lieu de servir un secret périmé. Ce qui reste à écrire,
c'est la **fenêtre** : un travail déjà en file porte l'ancienne révision.

## Critères d'acceptation

- [x] AC-1 — Une organisation remplace son secret ; les envois **en cours de file** ne rougissent
      pas.
- [x] AC-2 — ⛔ L'ancien secret cesse d'être servi à une **date**, pas au premier succès du nouveau.
- [x] AC-3 — Le secret sortant n'apparaît nulle part : ni journal, ni `/health`, ni travail de file.

---

## Journal de livraison (2026-09-08) — branche `MNV-635`

**Livré :** `domain/passerelle/rotation-secret.ts`, sous-document `SecretsSortants`, la fenêtre à
l'enregistrement, le secret sortant propagé jusqu'à la remise, et le rattrapage. Lint, build et
suite unitaire au vert.

### ⛔ Le vrai défaut n'est pas la file, c'est le FOURNISSEUR

La formulation du rail dit « un travail déjà en file porte l'ancienne révision ». Vérifié dans le
code : c'est **faux depuis STORY-604** — la passerelle est résolue *à la remise*, donc un travail
qui attendait dans Redis repart avec le nouveau compte d'envoi, sans rien à reprendre.

Le défaut réel est ailleurs, et il est plus grave. **La rotation n'est pas instantanée chez le
fournisseur.** Le client génère une clé chez son relais, la colle chez nous, et il reste deux
fenêtres où l'un des deux secrets est faux — surtout celle, longue, où il a saisi la nouvelle clé
chez nous **avant** de l'activer chez lui. Pendant ce temps, chaque remise revient en
`PASSERELLE_REFUSEE`.

⛔⛔ **Et depuis STORY-634, ce n'est plus une gêne.** Un refus d'authentification est un refus
**métier** : il ne compte donc pas vers la quarantaine — et c'est juste. Mais chaque message
concerné échoue **définitivement**, sans repli et sans rejeu. Une rotation ratée un lundi matin perd
toutes les relances de la journée, et rien ne le signale avant la réclamation du client.

### ⛔⛔ AC-2 : « au premier succès du nouveau » ne se termine JAMAIS dans le seul cas qui compte

C'est l'arbitrage central. L'alternative évidente — retirer l'ancien secret dès que le nouveau
réussit une fois — semble plus propre qu'une durée. Elle est inutilisable : si le client n'a pas
encore activé la nouvelle clé chez son fournisseur, le nouveau secret n'a **aucun** succès, donc
l'ancien reste servi **indéfiniment**. On aurait écrit une rotation qui ne fait jamais tourner quoi
que ce soit, et laissé deux comptes d'envoi valides pour toujours — exactement ce qu'une rotation
existe pour éviter. C'est le piège déjà payé en STORY-614 : *sans durée, « cesse d'être vérifié »
n'arrive jamais.*

⚠️ Vingt-quatre heures, et la **borne haute est un choix de sécurité** : la rotation la plus
fréquente est celle d'une clé qu'on soupçonne compromise. Le test borne la durée des deux côtés.

### ⛔ L'ORDRE fait la rotation : le nouveau d'abord, l'ancien en rattrapage

Servir l'ancien secret en premier aurait rendu la nouvelle clé inutile jusqu'à la fin de la fenêtre.
Le nouveau est donc toujours essayé ; l'ancien n'intervient que sur un **refus de compte**, et une
seule fois. Rejouer une adresse invalide avec un autre mot de passe ne change rien et double le
coût ; rejouer une panne de relais non plus — la politique de reprise s'en occupe, et le second
essai partirait dans la même seconde contre le même relais muet.

⚠️ **Le second essai remplace les secrets ET la révision.** Garder celle du nouveau compte ferait
réutiliser le transport en cache construit avec le secret qu'on vient précisément de voir refuser :
le rattrapage échouerait sans jamais avoir essayé l'ancien.

⛔ **Et si le rattrapage échoue à son tour, c'est SON refus qui remonte** — remonter celui du
nouveau compte aurait fait chercher une clé expirée alors que les deux sont refusées, donc que le
problème est ailleurs.

### ⛔⛔ Une rotation n'a lieu que si le secret CHANGE VRAIMENT — et la comparaison porte sur le clair

Sans cette condition, un enregistrement qui ne touche que l'expéditeur ouvrirait une fenêtre de
vingt-quatre heures pour rien, et surtout la **renouvellerait** à chaque sauvegarde d'écran : un
client qui corrige trois fois son adresse d'expédition garderait un vieux secret servi pour
toujours, par une suite de gestes dont aucun n'est une rotation.

⚡ **Et la comparaison porte sur les valeurs déchiffrées.** AES-GCM tire un nonce aléatoire à chaque
appel : deux chiffrés du même secret ne se ressemblent pas. Comparer les octets aurait déclaré une
rotation à **chaque** écriture, y compris quand rien ne change. Un test le montre en comparant les
deux chiffrés successifs du même secret.

⚠️ La comparaison est à temps constant : un `===` s'arrête au premier octet différent, et le temps
de réponse dirait combien de caractères le nouveau secret partage avec le précédent.

### ⚠️ Deux écritures auraient rouvert la panne qu'on ferme

Le secret sortant est posé dans la **même** opération Mongo que le nouveau. Deux écritures auraient
laissé un instant où l'ancien est perdu et le nouveau pas encore actif chez le fournisseur —
c'est-à-dire précisément la fenêtre que cette story existe pour couvrir.

⚠️ Et l'absence de rotation **retire** le champ : une fenêtre expirée qui traînerait serait un second
compte d'envoi historisé sans raison.

### ⛔ AC-3 : la garde existante ne couvrait PAS `secretsSortants`

`aucun-secret-dans-le-travail.spec.ts` (STORY-604) refuse un champ `secrets` dans le travail BullMQ.
Son motif exige un `:` juste après le mot — or `secretsSortants:` ne le présente pas. **Une garde
qui « couvre déjà les secrets » n'aurait rien vu.** Le nom est ajouté à l'inventaire.

⚡ Pour `/health`, rien à ajouter : le secret sortant ne vient que de `resoudre()`, qui est
asynchrone, et la santé n'accepte que le type marqué produit par la méthode **synchrone** de
STORY-604. Il y est inexprimable, pas seulement absent.

### ⚠️ Une garde nouvelle, hors du domaine

Le rattrapage doit reconnaître le refus de compte sans importer un adaptateur — `purete-du-domaine`
l'interdit, et elle a raison. Le code est donc recopié dans le domaine, et
`code-de-refus-de-compte.spec.ts` tient les deux copies ensemble. Sans elle, un renommage casserait
le rattrapage **en silence** : aucun test ne rougirait, le second essai cesserait simplement d'avoir
lieu — et cela ne se verrait que sur une rotation, une fois par an et par client.

### ⚠️ Points ouverts

- Le rattrapage n'existe que pour l'e-mail en pratique : c'est le seul adaptateur qui émette
  aujourd'hui un refus de compte. Les autres canaux en hériteront sans une ligne, dès qu'ils
  nommeront ce refus (EPIC-063).
- Aucune surface ne dit au client qu'une fenêtre de rotation est ouverte. La santé par organisation
  serait l'endroit naturel ; ce n'était pas demandé.
- Aucune conformité Docker : le comportement de la fenêtre est prouvé par test.
