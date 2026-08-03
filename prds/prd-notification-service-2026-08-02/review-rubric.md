# PRD Quality Review — Canaux & notifications (`notification-service`)

**Date :** 2026-08-02 · **Enjeu calibré :** lancement · **Forme :** capacité de plateforme, chain-top
(alimente UX → architecture → stories)

## Verdict d'ensemble

Le PRD tient sur ses deux idées fortes — la séparation transactionnel/campagne et la vérité du statut
de lecture — et elles sont argumentées, pas décorées. Le périmètre est tranché avec des frontières
nommées plutôt que suggérées. **Ce qui est à risque est en aval** : 63 FR sans découpage v1/v2, sans
métriques de succès et sans section de dépendances, c'est un document qu'un développeur ne peut pas
transformer en sprint sans deviner. Et une contradiction franche subsiste sur le canal in-app, listé
à la fois hors périmètre et comme exigence.

---

## 1. Decision-readiness — **strong**

Les décisions sont posées comme telles, avec ce qui a été abandonné. Le tableau exécution / intention /
décision (§3.1) tranche une frontière que la plupart des PRD laissent floue. Le risque R1 (passerelle
WhatsApp non officielle) est nommé, accepté, daté et attribué — pas dissous dans un « à surveiller ».
NFR-1b engage un renoncement réel : on s'interdit de déclencher une escalade sur « non lu », alors que
c'est le réflexe naturel du produit.

### Constats
- **low** — Les questions ouvertes Q6/Q7 sont réellement ouvertes (§6), pas rhétoriques. Rien à
  reprendre.

## 2. Substance over theater — **strong**

Aucune persona décorative — le PRD s'en abstient délibérément et le justifie (le module n'a pas
d'utilisateur direct). Les NFR portent des seuils produit (70 vs 160 caractères, 13 mois, 90 jours),
pas des adjectifs. La Vision (§2) ne pourrait pas être recopiée dans un autre PRD : « l'unique organe
de parole » engage une exclusivité vérifiable, dont FR-N27 est la conséquence opposable.

### Constats
- **medium** — **FR-N20 n'est pas une exigence sur ce service.** « Les surfaces appelantes lisent ces
  capacités au lieu de les supposer » décrit le comportement attendu *des autres*. La partie
  opposable ici est que le service *publie* ses capacités. *Fix :* reformuler côté service, déplacer
  l'attente vers les appelants comme note.

## 3. Strategic coherence — **adequate**

La thèse existe et est tenue : centraliser l'exécution pour que l'intention et la décision restent
chez les métiers. Les FR en découlent presque toutes.

### Constats
- **high** — **Aucune métrique de succès.** Le PRD ne dit nulle part comment on saura que le module
  a réussi. Pour un enjeu « lancement », c'est une absence structurelle : sans elle, la seule mesure
  disponible sera « les FR sont codées ». *Fix :* ajouter une section Métriques avec au moins une
  contre-métrique (le risque d'un module d'envoi est d'envoyer *plus*, pas mieux).
- **medium** — **La thèse « exécution seule » est fragilisée par le groupe E.** Listes, planification,
  validation et garde-fous sont des attributs de campagne, donc d'intention. La frontière §3.1 tient
  encore, mais elle est plus mince que le document ne le laisse croire. *Fix :* l'assumer explicitement
  — le module porte la *mécanique* de campagne, Marketing porte le *ciblage et la mesure*.

## 4. Done-ness clarity — **thin**

C'est la dimension la plus faible, et celle sur laquelle le découpage en stories va s'appuyer le plus.

### Constats
- **high** — **Aucun découpage v1 / ultérieur pour 63 FR.** Le plan de sprint prévoit 2 sprints
  (S23-S24) ; le PRD ne dit pas ce qui tombe dans le premier. Le découpage en stories devra donc
  l'inventer. *Fix :* marquer chaque groupe A→J avec son incrément.
- **medium** — **FR-N30 : « La reprise est vérifiable »** ne dit pas par quoi. *Fix :* nommer la
  condition observable (interrompre à mi-lot, reprendre, prouver 0 perdu / 0 doublon).
- **medium** — **FR-N55 « Console d'exploitation »** n'a aucune borne : quatre mots pour ce qui est
  un écran entier. *Fix :* soit énumérer les actions, soit la sortir du périmètre v1.
- **low** — FR-N36 énumère les statuts mais pas les transitions autorisées. Une machine d'états
  explicite éviterait le « lu » avant « délivré ».

## 5. Scope honesty — **thin**

### Constats
- **critical** — **Contradiction franche sur le canal in-app.** §3.3 le range **hors périmètre**
  (« à trancher — voir §6 ») alors que FR-N18 le liste comme canal du v1 et FR-N19 lui consacre une
  exigence entière. Q4 a pourtant été tranchée. Un lecteur qui s'arrête au périmètre conclut l'inverse
  du lecteur qui lit les FR. *Fix :* retirer la ligne de §3.3 et ajouter in-app aux listes.
- **medium** — **In-app manque dans deux listes** : §2 propriété 3 (« WhatsApp, SMS, e-mail et push »)
  et §3.2 (mêmes quatre). Même cause que ci-dessus.
- **medium** — **Aucun tag `[ASSUMPTION]`** alors que le PRD infère plusieurs choses non confirmées :
  que Marketing/Relance/Support existeront sous cette forme, que les événements `paiement.*` seront
  publiés, que le module Équipe fournira la notion d'équipe de FR-N60. *Fix :* taguer et indexer.
- **medium** — **FR-N24 suppose des topics inexistants.** `paiement.*` n'existe pas : `paiement-service`
  n'est pas construit. Dépendance avant non signalée. *Fix :* marquer les topics disponibles vs
  attendus.
- **medium** — **Aucune section Dépendances.** Ce que le module exige pour démarrer (bus Kafka,
  identité, catalogue de permissions S18, `admin-panel`) et ce qui manque (passerelles, notion
  d'équipe) n'est écrit nulle part.

## 6. Downstream usability — **adequate**

Identifiants FR-N01→N63 contigus, uniques, sans trou. Les renvois internes résolvent
(NFR-1b, FR-N07, FR-N26, §8). Chaque groupe se lit isolément.

### Constats
- **medium** — **Dérive de vocabulaire « campagne » / « envoi de masse ».** §1.3 dit « Campagne /
  masse », §4E dit « Envoi de masse », FR-N39 filtre par « campagne », §3.3 attribue « ROI de campagne »
  à Marketing. Le lecteur ne sait pas si *campagne* est un objet de ce module. *Fix :* glossaire, et
  un seul terme pour l'objet.
- **medium** — **Aucun glossaire** alors que le PRD introduit huit noms de domaine (contact,
  identifiant de canal, modèle, liste, envoi, accusé, consentement, nature de message).

## 7. Shape fit — **strong**

La forme « spécification de capacité » est la bonne : pas de parcours utilisateur, pas de personas,
des FR groupées par capacité. Le refus explicite des UJ est justifié dans l'atelier (aucun utilisateur
direct). Cohérent avec un module consommé par d'autres services.

---

## Notes mécaniques

- **Ordre des sections cassé** : §8 (Conservation) est placée **avant** §7 (Risques).
- En-tête périmé : « §1 à §3 validées en atelier. §4+ en cours. » alors que §4→§8 sont rédigées.
- Pas d'index des assumptions (aucune n'est taguée).
- Aucun NFR de performance : ni latence d'un envoi transactionnel, ni débit d'un envoi de masse,
  alors que §NFR-2 pose que le volume est inconnu.
- FR-N33 (fenêtre horaire) ne dit pas dans quel fuseau — sans objet au Togo, à trancher si l'UEMOA
  s'étend au-delà d'UTC+0.
