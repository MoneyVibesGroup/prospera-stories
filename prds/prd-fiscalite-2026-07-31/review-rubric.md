# Revue qualité PRD — Fiscalité (Prospera)

Grille : `bmad-prd/assets/prd-validation-checklist.md` · PRD : `prd.md` v0.1 · 2026-07-31

## Verdict d'ensemble

Le PRD a une thèse réelle et défendable — « le calcul est standardisable, la conformité ne l'est
pas » — et ses fonctionnalités la servent. Les frontières avec l'existant sont exactes et vérifiées, les
risques sont écrits sans complaisance, les contre-métriques existent. Ce qui ne tient pas, c'est le
**contrat entre l'ambition et la v1** : soixante exigences, toutes les taxes, le social calculé et une
piste d'audit complète sont annoncés comme un seul lot, sans découpage ni ordre, dans un programme dont
l'Atelier Balance entier pesait 25 stories. Deux affirmations porteuses ne sont par ailleurs pas
démontrées : que toute taxe s'exprime en donnée, et que la métrique principale soit atteignable par un
dépôt qui reste manuel.

---

## 1. Décision-prête — adéquat

Les décisions sont posées comme des décisions, pas enfouies : le tableau des quatre niveaux (§3.1), le
choix du dépôt assisté avec son motif (§3.2), la séparation des deux chaînes (§3.3), les personas
verrouillés (§5). Les arbitrages nomment ce qui a été abandonné — §3.2 dit explicitement pourquoi
l'automatisation est écartée, §11 assume que le multi-pays ne sera pas prouvé. Les questions ouvertes
sont réellement ouvertes, aucune ne porte sa réponse dans la phrase suivante.

Deux dérobades cependant. §12 constate que l'implantation fiscale « aggrave un dépassement de capacité
déjà signalé (37 pts pour 34) » et s'arrête là : le PRD nomme le problème et laisse la coupe à quelqu'un
d'autre. Et surtout, aucune phrase du document ne dit dans quel ordre construire ses soixante exigences.

### Constats

- **critical** — v1 non découpée et non crédible (§10, §7) — La v1 contient les douze groupes
  d'exigences, soit l'intégralité du module. Aucun lot, aucun ordre, aucune indication de volume, alors
  que le PRD s'adresse à un programme qui suit ses points au sprint près. *Correctif :* découper la v1
  en incréments livrables ordonnés (par exemple : socle dossier+implantation+catalogue → calendrier+
  workflow → dépôt assisté+preuve → règlement → social), et dire lequel constitue le premier jalon
  vendable.
- **medium** — §12 constate le dépassement du Sprint 19 sans recommander de coupe — *Correctif :* nommer
  ce qui saute, comme le tracker le fait déjà ailleurs (« décaler STORY-094 et 095 au S20 »).

---

## 2. Substance contre décor — adéquat

Les quatre personas travaillent : le collaborateur et l'expert-comptable portent FR-F27, l'admin de
cabinet porte FR-F01 et FR-F48, l'admin plateforme porte FR-F57. Aucun n'est là pour faire nombre. La
vision n'est pas interchangeable — elle nomme un objet précis (l'obligation traçable) et un renoncement
précis (ne pas se battre sur le calcul). Les NFR de conformité (NFR-F01 à F04) sont spécifiques au
produit et non recopiés.

Une exception nette côté NFR : **NFR-F13** demande que le calendrier se charge « sans dégradation
perceptible ». C'est l'adjectif que la grille demande de traquer, et il est d'autant plus gênant que le
calendrier est la surface principale du module.

### Constats

- **medium** — NFR-F13 sans borne chiffrée (§8, Exploitation) — *Correctif :* poser un seuil réel, du
  type « portefeuille de 500 dossiers × 12 obligations, premier rendu sous 2 s, filtrage sous 500 ms ».
- **medium** — NFR-F10 conserve une durée « à confirmer » sans valeur ni fourchette — *Correctif :*
  poser une valeur par défaut opposable (la prescription togolaise) quitte à la corriger.

---

## 3. Cohérence stratégique — adéquat

Il y a une thèse, elle est énoncée au §2, et la hiérarchie des fonctionnalités la suit : la preuve
(§7.9) est traitée avec plus de soin que le calcul (§7.4, quatre exigences dont deux de délégation).
Les métriques valident la thèse plutôt que l'activité, et les contre-métriques sont réelles — « anomalies
levées sans correction » est une contre-métrique honnête, elle mesure le contournement des garde-fous
que le PRD lui-même installe.

Deux ruptures. D'abord la métrique principale : **« zéro dépôt hors délai » n'est pas contrôlable par la
v1**, puisque le dépôt reste manuel (§3.2). Le produit peut préparer à temps et alerter ; il ne peut pas
déposer. Mesurer le module sur un résultat dont il ne détient pas le dernier maillon, c'est se condamner
à un chiffre qu'on ne pourra ni tenir ni expliquer. Ensuite, **le social calculé (§7.5) ne sert aucune
partie de la thèse** : il n'améliore ni la standardisation du calcul ni la preuve. Il est là parce qu'il
a été demandé, ce qui est légitime, mais il n'est pas priorisé comme un ajout — il est fondu dans la v1
au même rang que la piste d'audit.

### Constats

- **critical** — La métrique principale n'est pas atteignable par le périmètre v1 (§9 vs §3.2) —
  *Correctif :* soit scinder en deux mesures (« préparée et validée avant l'échéance − 3 jours », que le
  produit contrôle, et « déposée avant l'échéance », qu'il constate), soit assumer que la métrique
  principale ne devient tenable qu'avec les connecteurs.
- **medium** — Le social calculé n'est rattaché à aucun objectif du §2 et n'est pas séquencé comme une
  extension — *Correctif :* soit lui donner sa propre justification de valeur, soit le sortir du premier
  incrément.

---

## 4. Clarté du « fini » — mince

C'est la dimension la plus faible, et c'est celle sur laquelle la création de stories va s'appuyer le
plus fort.

La majorité des exigences portent une conséquence testable — FR-F19 (trois montants distincts, écart
motivé), FR-F31 (obligation clôturée immuable), FR-F34 (pas d'accusé, pas d'état « Accusé reçu ») sont
directement vérifiables. Mais trois exigences centrales reposent sur des artefacts que le projet ne
possède pas, et une quatrième sur une liaison de données qui n'existe pas.

**FR-F32** demande de produire « le livrable de dépôt au format national exact attendu par le canal ».
Personne dans le projet n'a ce format : aucune pièce réelle n'a été fournie, le gabarit GUDEF n'est pas
confirmé, aucun formulaire de télédéclaration n'a été analysé. On ne peut pas écrire de critère
d'acceptation là-dessus. **FR-F33** (« guide le dépôt pas à pas ») décrit un parcours entier en une
phrase. **FR-F45** promet de chiffrer les pièces manquantes derrière un montant — cela suppose une
liaison entre une écriture comptable et un document, or `document-service` gère aujourd'hui la date et le
statut *par pièce* (STORY-128) sans rattachement à une ligne d'écriture. L'exigence est écrite comme si
la donnée existait.

Enfin **FR-F53** demande des contrôles de cohérence sans tolérance : la TVA déclarée n'égalera jamais
exactement le chiffre d'affaires comptabilisé × 18 %.

### Constats

- **high** — FR-F32/F33/F34 dépendent de formats et de gabarits que le projet ne possède pas (§7.7) —
  *Correctif :* conditionner explicitement ces exigences à l'obtention des pièces (question ouverte 4) et
  poser un jalon « format confirmé » avant tout engagement de sprint.
- **high** — FR-F45 suppose une liaison pièce ↔ écriture inexistante (§7.9) — *Correctif :* soit ajouter
  l'exigence de cette liaison, soit rabattre FR-F45 sur ce qui est faisable (rapprocher des totaux, pas
  des factures individuelles).
- **medium** — FR-F53 : contrôles de cohérence sans tolérance chiffrée (§7.11) — *Correctif :* définir
  la tolérance comme donnée du paquet fiscal, à l'image de `TOLERANCE_EQUILIBRE` déjà en place sur la
  balance.
- **low** — Aucune section de critères d'acceptation. Atténué : la convention du dépôt veut que les
  stories les portent.

---

## 5. Honnêteté du périmètre — mince

Les non-objectifs sont explicites et bien placés (§3.4), les risques ne sont pas édulcorés, et le PRD
va jusqu'à inscrire comme risque n°1 une conséquence d'une décision du PO lui-même. C'est le bon
réflexe.

Le problème est ailleurs : **le PRD n'étiquette presque rien comme hypothèse alors qu'il en contient
beaucoup.** Deux marques `[HYPOTHÈSE]` seulement, sur la base de rémunération et la durée de
conservation. Or FR-F15 (reports d'échéance), FR-F36 (gestion des rejets), FR-F42 (estimation des
pénalités), FR-F54 (continuité inter-périodes), FR-F49 (les cinq natures d'accès appliquées au Togo) ne
proviennent d'aucune source confirmée — ce sont des inférences raisonnables présentées comme des
décisions acquises. Il n'y a pas non plus d'index des hypothèses en fin de document.

### Constats

- **high** — Sous-étiquetage des hypothèses (§7 passim) — Au moins cinq exigences inférées sont écrites
  au même niveau d'assurance que les décisions du PO. *Correctif :* marquer `[HYPOTHÈSE]` et ajouter un
  index en fin de PRD, avec pour chacune ce qui la confirmerait.
- **medium** — Le mandat (FR-F48→F52) est traité comme une fonctionnalité alors que sa validité
  juridique est une question ouverte (n°5) — Or le modèle B, donc le positionnement, en dépend
  entièrement. *Correctif :* le remonter dans §11 comme risque de premier rang.

---

## 6. Utilisabilité en aval — mince

Les identifiants sont propres : FR-F01→F60 et NFR-F01→F14 contigus, sans trou ni doublon. Les renvois
vers l'existant (STORY-078, 079, 080, 101, 128, 136, 137, 146, 147) sont exacts et vérifiés. Chaque
section se tient seule.

Mais il n'y a **pas de glossaire**, et un flottement de vocabulaire porte précisément sur l'objet central
du modèle. §6.3 définit l'obligation comme « une implantation × une taxe × une période ». FR-F26 fait
suivre un cycle de vie à l'obligation. Puis FR-F30 parle d'une « déclaration rectificative rattachée à
l'obligation d'origine », et FR-F19 distingue montant calculé, déclaré et payé. Une obligation est-elle
la *chose à faire* (récurrente, dérivée du catalogue) ou l'*instance déclarée* (avec ses versions et ses
montants) ? Le PRD utilise le mot dans les deux sens. La création de stories butera dessus dès la
première.

Aucun parcours utilisateur n'est décrit. Pour un module de type « spécification de capacités » c'est
défendable — sauf pour le dépôt assisté, qui est **le** différenciateur de la v1 et qui est par nature un
parcours guidé multi-étapes, résumé ici en une exigence.

### Constats

- **high** — « Obligation » et « déclaration » ne sont pas distinguées (§6.3, FR-F26, FR-F30, FR-F19) —
  *Correctif :* nommer les deux objets et leur relation (une obligation engendre N déclarations
  versionnées ; le cycle de vie porte sur la déclaration), puis reprendre les exigences concernées.
- **high** — Le dépôt assisté est un parcours spécifié comme une exigence unique (FR-F33) — *Correctif :*
  décrire le parcours de bout en bout avec un protagoniste nommé, ou renvoyer explicitement à une spéc UX
  et le dire.
- **medium** — Pas de glossaire (obligation, déclaration, implantation, canal, livrable de dépôt, accusé,
  paquet fiscal, mandat).

---

## 7. Adéquation de forme — adéquat

La forme est cohérente avec le produit : brownfield, en tête de chaîne, à dominante réglementaire, donc
spécification de capacités plutôt que parcours. Les références au code existant sont exactes — c'est un
point fort réel, la plupart des PRD brownfield se trompent ici.

La grille demande, pour un produit de conformité, que les contraintes réglementaires soient traçables.
FR-F07 (base légale par obligation) et FR-F46 (retraitement adossé au texte) le portent au niveau du
produit, ce qui est le bon niveau. En revanche les contraintes que le PRD cite lui-même — majorations
30/40/80 %, échéances de dépôt 31/03, 30/04, 31/05, acomptes aux quatre dates — apparaissent en prose
au §1 et §7.3 sans qu'aucune exigence ne s'y rattache nommément.

### Constats

- **low** — Les échéances et majorations citées en prose ne sont rattachées à aucune exigence nommée —
  *Correctif :* les traiter comme données du paquet et le dire dans FR-F13.

---

## Notes mécaniques

- « GUDEF » est employé uniformément dans le PRD. La correction reste à propager dans le reste de
  `prospera-stories/` et dans `referentiels/` (§12 le note).
- Identifiants contigus et uniques : FR-F01→F60, NFR-F01→F14. Aucun renvoi cassé.
- Pas d'index des hypothèses alors que le document en contient (voir dimension 5).
- Pas de glossaire.
- Aucun parcours utilisateur, donc aucun protagoniste nommé — assumé par la forme, sauf pour le dépôt
  assisté.
- Le titre du §7.8 (« Règlement de l'impôt ») applique bien la désambiguïsation demandée face au module
  paiement du Sprint 20.
