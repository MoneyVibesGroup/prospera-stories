# STORY-594 : Garde-fous : plafond par période, fenêtre horaire et validation par un rôle habilité

Status: done

**Épic :** EPIC-061 — Envoi de masse : listes, lots avec reprise et garde-fous 🏁
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S43
**Prérequis :** **STORY-593** (préparation) · ⛔ **STORY-582** (registre de consentement, S42)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-13.

---

## Le fait

⚡ **Le plafond et la fenêtre s'évaluent par lot.** Un envoi qui atteint le bord de la fenêtre
**suspend** et reprend à l'ouverture suivante — conséquence directe du curseur, **aucun mécanisme
dédié**.

⛔ **Cette story porte FR-N48, et c'est la raison de l'ordre des sprints.** Le consentement est
vérifié **deux fois** : à la préparation pour le compte rendu, et **à l'instant de la remise** pour
l'opposabilité. C'est la seule façon qu'un désabonnement éteigne un envoi **déjà en cours
d'exécution**. Sans EPIC-059 (S42), la seconde vérification n'a rien à interroger.

**Livrée le 2026-09-06** — branche `MNV-594` de `prospera-notification-service`, sur `origin/dev`.
2 095 tests unitaires (173 suites) + 180 e2e ; lint et types propres. 🏁 **EPIC-061 close à 14/14.**

## Critères d'acceptation

- [x] AC-1 — Plafond d'envois par période et **fenêtre horaire autorisée**, par organisation (FR-N33),
      évalués **par lot**.
- [x] AC-2 — Un envoi qui atteint le bord de la fenêtre **suspend** et **reprend** à l'ouverture
      suivante, sans perdre ni doubler personne.
- [x] AC-3 — ⛔ **FR-N48 prouvé en conditions réelles** : désabonner une personne **pendant**
      l'exécution d'un envoi de masse qui la contient, et vérifier qu'elle **ne reçoit pas**. La
      vérification a lieu à l'instant de la remise, pas seulement à la préparation.
- [x] AC-4 — La validation préalable par un rôle habilité (FR-N34), **activable par organisation**,
      bloque le passage de `prepare` à l'exécution — **jamais un lot au milieu**. Erreur nommée
      `VALIDATION_REQUISE`.
- [x] AC-5 — Un dépassement de plafond rend `PLAFOND_ENVOI_ATTEINT` ; un envoi hors fenêtre rend
      `HORS_FENETRE_AUTORISEE`. Codes nommés et stables.
- [x] AC-6 — ⚠️ La fenêtre horaire se calcule dans le fuseau **déclaré de l'organisation** —
      *[ASSUMPTION A4 : UTC+0 pour le Togo]*, à revoir au premier client hors fuseau.

## Notes

🏁 Clôt EPIC-061.

---

## Ce que la livraison a appris

### ⛔⛔ Une DÉCISION se vérifie à l'entrée, une CONDITION se réévalue à chaque lot

C'est le partage qui organise toute la story, et il ne va pas de soi.

La **validation préalable** (AC-4) est une décision : quelqu'un d'habilité a approuvé cet envoi. Elle
se vérifie **au lancement, une seule fois**. La réévaluer entre deux lots laisserait la moitié d'une
campagne partie et l'autre non parce que quelqu'un a retiré son approbation à mi-course — un état que
**personne n'a choisi** et que rien ne rattrape.

Le **plafond** et la **fenêtre** (AC-1) sont des conditions d'environnement : le volume, l'heure. Elles
changent pendant que l'envoi court, donc elles se réévaluent **avant chaque lot**. ⚡ Les évaluer une
seule fois au lancement aurait laissé un envoi de cinquante mille destinataires **traverser la nuit
entière** parce qu'il avait commencé à 19 h 58.

⚡ **AC-2 ne coûte aucun mécanisme** : atteindre le bord pose l'état `suspendu`, et le curseur de
STORY-592 porte déjà la position exacte. Troisième story d'affilée où le curseur paie ce qu'on croyait
devoir construire.

### ⚡ Une fenêtre qui enjambe minuit n'est pas un intervalle vide

`20 → 8` est la nuit. Écrit `heure >= debut && heure < fin`, le contrôle aurait refusé **toutes** les
heures pour cette fenêtre : l'envoi de nuit se serait suspendu à chaque lot, indéfiniment, et **rien
n'aurait dit pourquoi**.

⚠️ **`debut === fin` veut dire « toute la journée »**, jamais « aucune heure » — l'inverse aurait fait
d'une saisie neutre un blocage total, le pire défaut possible pour un réglage qu'on n'a pas encore
compris.

### ⚡ Le plafond est une fenêtre GLISSANTE, jamais un calendrier

Un plafond « par mois calendaire » se réinitialise le 1er à minuit : une organisation qui l'épuise le
31 recommence le lendemain, et deux campagnes séparées de vingt-quatre heures **doublent** le volume
qu'il existe pour borner.

⚠️ Il ne compte que la nature `MASSE` : compter les transactionnels aurait fait rater une relance de
facture parce qu'une campagne promotionnelle avait rempli le quota. ⚡ Et la **fenêtre est évaluée
avant le plafond** — l'heure ne coûte aucune lecture, le plafond en coûte une, et c'est une lecture
**par lot**.

### ⚠️ Aucun garde-fou par défaut, et le PUT REMPLACE

Ces réglages protègent l'organisation d'elle-même, ils ne protègent pas le service : les activer par
défaut aurait bloqué le premier envoi de masse du premier client, sans qu'il ait rien demandé.

Un réglage omis est **retiré**. Le laisser inchangé aurait rendu impossible d'enlever une fenêtre — et
une organisation qui ne peut plus retirer un garde-fou finit par le contourner.

### ⛔⛔ Celui qui exécute ne peut pas lever sa propre contrainte

Les garde-fous **et** `POST /:id/valider` sont gardés par `notification:envoi-de-masse:valider`, sur un
contrôleur dont la classe entière exige pourtant « exécuter ».

⚡ **La garde de séparation lit les métadonnées, pas le texte.** Le droit effectif d'une route dépend
d'une règle de résolution — le décorateur de méthode gagne sur celui de classe. Une garde qui aurait
cherché le nom du droit dans le fichier l'aurait trouvé et serait passée au vert **même si la
résolution rendait l'autre droit** : elle aurait prouvé que le mot est écrit, jamais qu'il s'applique.

### ⛔ AC-3 / FR-N48 — le consentement relu à l'instant de la remise

C'est la seule façon qu'un désabonnement enregistré **pendant** l'exécution éteigne un envoi déjà en
cours. Un refus écrit `statut: ecarte`, `motif: DESTINATAIRE_DESABONNE` — **premier écrivain** de cet
état, que STORY-579 avait déclaré sans en avoir aucun. Jamais `echoue` : rien n'a été tenté.

⚠️ **`motifSuspension` est distinct de `motif`.** Un écart concerne **une** personne et ne se répare
pas tout seul ; une suspension concerne **tout** l'envoi et se lève d'elle-même. Les mêler aurait fait
proposer « rejouer » là où il n'y avait qu'à attendre.

## ⛔ Points ouverts après 594

1. **Aucune conformité Docker** — AC-3 est prouvé par test, jamais contre un vrai Redis/Mongo.
2. **AC-6 tient sous l'assumption A4** : la fenêtre d'un client à UTC+1 s'appliquerait de 9 h à 21 h
   chez lui, sans qu'aucune erreur ne le dise. À revoir au premier client hors fuseau.
3. **Le droit `valider` n'est dans aucun catalogue IdP**, comme les cinq autres : personne ne peut
   encore se le voir attribuer, donc la séparation d'AD-18 est prête mais inapplicable en production.
