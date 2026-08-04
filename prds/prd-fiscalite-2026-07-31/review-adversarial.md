# Revue adversariale — PRD Fiscalité v0.1

Angle : chercher ce qui casse le document, pas ce qui lui manque. Ton volontairement dur.

---

## A1 — « Ajouter une taxe = ajouter une donnée » n'est pas démontré, et c'est le pilier du périmètre

**critical**

Le PRD tient tout entier sur FR-F06→F10 : le catalogue d'obligations est dérivé du paquet fiscal, donc
« toutes les taxes » ne coûtent que de la donnée. C'est ce qui a permis de transformer une demande
ingérable (« toutes les taxes possibles ») en périmètre tenable. Sauf que la démonstration n'est jamais
faite, et le référentiel du projet contient déjà les contre-exemples :

- **Droits d'accises** — tarifs *spécifiques* au volume pour les produits pétroliers (Art. 241) et table
  *ad valorem* par produit (Art. 243 : bières 20 %, alcools 60 %, tabac 50 %). Deux modes de calcul
  incompatibles dans une même taxe.
- **TPU** — forfait par tranche en dessous de 30 M, puis déclaratif entre 30 et 60 M à 2 % ou 8 % selon
  la nature de l'activité, avec un minimum de perception de 20 000 F. Trois régimes de calcul, un
  aiguillage sur l'activité, un plancher.
- **RSH** — 3 %, 5 % ou 20 % selon la *régularité fiscale du prestataire*. L'assiette ne suffit pas : il
  faut un état d'un tiers.
- **Patente, foncière** — assises sur la valeur locative, pas sur un flux comptable.
- **Enregistrement** — par acte, sans périodicité.

Un modèle « assiette × taux × périodicité » n'exprime aucun de ces cas. Soit le paquet fiscal embarque un
langage de formules — c'est-à-dire un moteur de règles à écrire, à tester et à sécuriser, et ce n'est
plus « de la donnée » — soit il y a du code par famille de taxe, et alors la promesse FR-F09 (« sans
déploiement de code ») est fausse. Le PRD doit trancher, parce que tout son dimensionnement en dépend.

**Correctif :** poser explicitement des *familles* de calcul (proportionnelle, barème par tranches,
forfait, spécifique à l'unité, par acte, minimum de perception), dire lesquelles la v1 supporte, et
reconnaître qu'une taxe hors famille supportée exige du code.

---

## A2 — Le module promet « zéro dépôt hors délai » et ne dépose pas

**critical**

§3.2 acte que le dépôt reste manuel en v1. §9 fait de « zéro dépôt hors délai » la métrique principale.
Les deux ne peuvent pas être vrais ensemble. Un cabinet qui rate une échéance avec Prospera aura un
produit qui a tout bien fait — préparé, contrôlé, validé, alerté — et un chiffre qui dit qu'il a échoué.
On construit un indicateur qu'on ne pilote pas.

C'est le genre d'incohérence qui ne se voit pas dans un PRD et se paie en revue de lancement.

**Correctif :** métrique principale = ce que le produit contrôle (« obligation prête à déposer avant
l'échéance moins N jours »). Le dépôt effectif reste mesuré, en second, comme constat.

---

## A3 — Le social calculé produira des écrans vides

**high**

FR-F22 demande une base de rémunération par salarié et par période — salaires, primes, gratifications,
commissions, avantages en nature. Un cabinet possède déjà ces données : elles sont dans son outil de
paie, ou dans les tableurs du client. Lui demander de les ressaisir tous les mois dans Prospera pour
obtenir un montant CNSS qu'il sait déjà calculer, c'est le scénario type de la fonctionnalité qui n'est
jamais utilisée.

Le PRD choisit d'ailleurs le pire endroit de la fourchette : trop lourd pour être un simple champ de
saisie, trop léger pour remplacer un outil de paie.

**Correctif :** soit importer la base de rémunération (le PRD ne dit rien d'un import), soit se limiter
à l'option « calendrier et suivi » qui avait été proposée — le montant est saisi, l'échéance et la preuve
sont tenues. Le PO a explicitement demandé le calcul ; alors qu'il soit alimenté par import, pas par
ressaisie.

---

## A4 — Qui produit le fichier GUDEF : le Bilan ou la Fiscalité ?

**high**

§4 attribue à `fiscal-service` « le dépôt de la DSF et sa preuve » et laisse à `bilan-service` « la
production de la liasse, la validation figée, l'export ». Puis FR-F32 charge `fiscal-service` de produire
« le livrable de dépôt au format national exact ». Or le livrable de dépôt de la DSF **est** la liasse.
Deux services revendiquent le même artefact.

Ce n'est pas un détail d'implémentation : `bilan-service` a déjà livré EPIC-010/011, il sait produire la
liasse et l'exporter. Si `fiscal-service` la reproduit, on duplique ; s'il la consomme, alors FR-F32 doit
dire qu'il l'obtient de `bilan-service` et n'en produit que l'emballage.

**Correctif :** trancher dans §4 et reformuler FR-F32 en conséquence.

---

## A5 — Le modèle B repose sur un mandat dont on ignore la validité

**high**

Tout le positionnement — le cabinet dépose pour le client — suppose qu'un mandat autorise juridiquement
le cabinet à agir sur le portail. La question ouverte n°5 admet qu'on ne sait pas si un mandat sous seing
privé suffit ou si l'administration exige un enregistrement. Ce n'est pas une question ouverte de rang 5,
c'est une **condition de validité du produit**. Si la réponse est « l'administration n'admet que le
contribuable lui-même », le modèle B tombe, FR-F48→F52 deviennent décoratifs et le produit retombe sur le
modèle A que le PO a écarté.

**Correctif :** remonter au §11 comme risque de premier rang, avec le point de vérification qui le lève
(un texte, ou un mandat réel obtenu d'un cabinet).

---

## A6 — Le paquet fiscal a désormais trois consommateurs et deux propriétaires

**medium**

Le paquet est chargé par `balance-service` (STORY-078), consommé par le moteur fiscal (091→095), et
maintenant par le catalogue d'obligations de `fiscal-service` (FR-F06). Côté production, il est packagé
par `platform-catalog-service` et administré depuis l'admin-panel (D12). Le PRD ajoute FR-F57→F60 sans
dire qui arbitre une version, qui la publie, ni ce qui se passe pour les consommateurs quand elle change
en cours d'exercice.

Le projet a déjà rencontré cette classe de problème : le finding F-078-1 documente un paquet fiscal
embarqué dans l'artefact comptable, périmé de six rubriques et jamais lu. Multiplier les consommateurs
sans gouvernance, c'est rejouer ça en plus gros.

**Correctif :** une exigence de gouvernance — propriétaire unique de la publication, consommateurs
déclarés, règle de rattachement version ↔ exercice (FR-F60 l'amorce mais ne dit pas qui décide).

---

## A7 — Soixante exigences sans ordre, dans un programme qui compte au point près

**high** — recoupe le constat critique de la grille

Le tracker de ce projet arbitre à trois points près et documente ses dépassements sprint après sprint
(S10 40/34, S11 44/34, S18 42 nominal, S19 37/34). On lui livre un PRD de soixante exigences
fonctionnelles et quatorze non fonctionnelles, en bloc, sans lot ni séquence, avec pour seule indication
de trajectoire « v1 = tout ».

Il n'y a aucun moyen d'entrer dans ce document par le sprint-planning. Il sera découpé par quelqu'un
d'autre, arbitrairement, et le PRD n'aura pas servi à ce qu'un PRD sert.

**Correctif :** trois à cinq incréments nommés, ordonnés, avec pour chacun ce qu'il rend possible.

---

## A8 — Ce qui est bien, et qu'il ne faut pas casser en corrigeant

- La ligne de partage « calcul standardisable / conformité non » est juste, et elle est rare : la plupart
  des produits de ce type prétendent l'inverse.
- Le refus du stockage de secrets en v1 (NFR-F05) évite au projet d'ouvrir une surface de sécurité avant
  d'en avoir besoin. C'est la bonne décision au bon moment.
- Les frontières du §4 sont exactes, vérifiées contre le code livré, et pas seulement contre les
  trackers — le projet a été échaudé sur ce point.
- Le triplet calculé / déclaré / payé (FR-F19) est l'exigence la plus utile du document. Elle est banale
  à écrire et presque toujours oubliée.
