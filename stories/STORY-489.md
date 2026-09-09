# STORY-489 : Le contrat canonique de balance ne porte aucune devise — le « ×100 » est une convention XOF que rien ne déclare

Status: in_progress

**Épic :** EPIC-107 — Devise, unités et arrondis (socle d'internationalisation)
**Service :** `balance-service` (`:3007`) — `types/balance-canonique.ts` · `bilan-service` (consommateur)
**Points :** 8 · **Complexité :** high · **Sprint :** S20
**Origine :** revue **expert-comptable** de la maquette cumulative, 2026-08-27, demandée par le PO — *« on débute avec l'UEMOA mais le but est de toucher la CEDEAO, l'Afrique de l'Est et l'Europe, voire l'Amérique »*.

---

## ⚡ Pourquoi cette story est datée, et pourquoi elle passe devant les autres

Le contrat canonique est un **contrat de pièces immuables**. Chaque balance validée porte un
`checksum` SHA-256 recalculé et comparé par le serveur, et chaque liasse figée cite la balance qui
l'a produite. Tant qu'il n'y a **qu'un pays et qu'une monnaie en production**, ajouter la devise est
un ajout de champ. **Après**, c'est une réinterprétation rétroactive de tous les montants déjà figés
— c'est-à-dire une migration de pièces opposables, opération qu'aucun cabinet n'acceptera de subir
en cours d'exercice.

**Le coût de cette story double à chaque pays ouvert. C'est la seule du lot dont c'est vrai.**

## Le fait

Le contrat déclare : *« Montants en **unités mineures XOF** (entiers, ×100), équilibre en
arithmétique entière (tolérance < 100). »* La devise est donc **implicite, unique et non déclarée** :

1. **Le ×100 n'est pas la sous-unité du XOF.** Le franc CFA a un exposant ISO 4217 de **0** : le
   centime ne circule pas et n'a pas de valeur comptable. Le produit a donc inventé deux décimales,
   ce qui est un choix d'arithmétique défendable — mais il l'a nommé « unités mineures XOF », ce qui
   est faux, et c'est ce nom qui sera lu par le premier intégrateur.
2. **La tolérance change de sens à chaque monnaie.** « Tolérance < 100 unités mineures » vaut
   « moins d'1 franc » sous la convention actuelle. Sur une monnaie à exposant 2 réel (NGN, GHS,
   KES, EUR), elle vaudrait « moins d'1 naira / cedi / shilling / euro » — cent fois plus permissif
   qu'annoncé. Sur une monnaie à exposant 0 (GNF, RWF, UGX), « moins de 100 unités ». **Le seuil
   d'équilibre d'un bilan deviendrait dépendant du pays, sans que personne ne l'ait décidé.**
3. **Rien ne distingue deux balances de monnaies différentes.** Deux dossiers, deux pays, deux
   monnaies : les montants sont comparables, additionnables et agrégeables par erreur, et aucun
   contrôle ne peut s'en apercevoir — c'est le même mode de panne que STORY-422 (tout passe, tout
   est faux), transposé aux nombres.

⚠️ Et ce n'est pas seulement une question d'expansion : **une entreprise togolaise qui importe
facture en EUR ou en USD**. La devise n'est pas un attribut de pays, c'est un attribut d'opération.

## Critères d'acceptation

- [ ] AC-1 — `SubmitBalanceDto` porte `devise` (**code ISO 4217 alphabétique**, 3 lettres, validé
      contre une liste fermée servie par le registre) et l'`exposant` **est dérivé du registre**,
      jamais envoyé par le client. Un client qui choisirait son exposant choisirait la valeur des
      montants qu'il envoie.
- [ ] AC-2 — L'exposant appliqué est **publié dans l'enveloppe de réponse** avec le code devise :
      un montant entier sans son exposant n'est pas un montant, c'est une suite de chiffres.
- [ ] AC-3 — La **tolérance d'équilibre est exprimée en unités de la devise** (« 1 unité
      monétaire »), pas en unités mineures constantes. Elle vaut donc `10^exposant` unités mineures
      et se recalcule par devise. ⛔ Test de mutation : figer la tolérance à 100 doit virer au rouge
      sur une devise d'exposant 0.
- [ ] AC-4 — **Toutes les balances existantes reçoivent `devise: 'XOF'` et l'exposant de la
      convention actuelle** par projection, sans réécrire un seul montant et **sans invalider un
      seul checksum**. ⚠️ C'est l'AC le plus délicat : si le checksum couvre le corps sérialisé, la
      migration doit ajouter le champ **hors** du périmètre de l'empreinte, ou republier l'empreinte
      avec sa date de recalcul. **À trancher avec l'architecture avant de coder**, et à écrire dans
      la story avant de la fermer.
- [ ] AC-5 — Une balance dont la `devise` diverge de celle du **dossier** est refusée
      (`400 DEVISE_INCOHERENTE`), en nommant les deux. On ne devine pas laquelle est la bonne.
- [ ] AC-6 — La documentation du contrat cesse d'écrire « unités mineures XOF » et écrit la règle
      générale. Le mot « XOF » ne doit plus apparaître **dans aucun type ni aucune constante** du
      contrat canonique — vérifié par un test de présence, pas par relecture.

## Conséquences ailleurs

- **STORY-490** propage la devise en aval (liasse, prévisionnel, fiscal, export).
- Le frontend cesse d'écrire « F CFA » en dur : **FE-082**. ⚠️ 60 occurrences dans le seul prototype.
- ⚠️ Le paquet fiscal porte des **montants** (seuils, planchers, barèmes : plafond TPU 60 M, MFP,
  tranches d'IRPP). Ces montants sont **par pays et par devise** ; STORY-493 les cadre.

## Notes

- ISO 4217 est la seule source d'exposant admissible — ne pas la coder à la main par pays.
- Voir [[STORY-101]] (contrat canonique), [[STORY-492]] (registre des pays), [[FE-082]].

---

## Requalification (2026-09-09, avant la première ligne)

La fiche est **exacte** : rien de son sujet n'est livré. `devise` n'existe ni au `SubmitBalanceDto`
ni au schéma Mongo, `exposant` n'existe nulle part dans les deux dépôts, et `TOLERANCE_EQUILIBRE`
est une constante littérale à `100`. Vérifié fichier par fichier.

Deux points seulement doivent être **verrouillés ici**, parce qu'ils changent le coût de la story.

### R-489-1 — l'arbitrage d'AC-4 est DÉJÀ TRANCHÉ par le code

AC-4 demande de décider « avec l'architecture » si ajouter `devise` invalide les checksums. La
réponse est dans `balance.checksum.ts` : le sceau n'est **pas** l'empreinte du corps sérialisé,
c'est une **forme canonique à liste blanche** qui ne retient que `exercice`, `source`,
`referentiel`, `version` et `lignes[]`.

⇒ un champ posé **au niveau de l'enveloppe** n'entre pas dans le sceau : **aucun checksum existant
n'est invalidé, aucune migration, aucun `v3`**. C'est le chemin déjà pris trois fois (STORY-370,
STORY-420, STORY-424), documenté dans ce même fichier.

⚠️ **La contrepartie doit être dite** : un champ hors sceau est **altérable au repos** sans que
l'empreinte le détecte. Le fichier porte déjà ce raisonnement pour `sources`. Pour `devise`, le
risque est borné par AC-5 — la divergence avec la devise du **dossier** est refusée à l'écriture,
donc une altération se détecte à la relecture métier, pas par le sceau.

### R-489-2 — le périmètre est MONO-DÉPÔT

L'en-tête de la fiche annonce `bilan-service (consommateur)`. Mesuré : **zéro occurrence** de
`devise` dans tout `bilan-service/src`, specs comprises. Le consommateur n'a rien à adapter tant
que la devise ne **franchit pas la frontière**, et l'y faire franchir c'est ajouter un champ à
`BalanceCreatedEventV1` — donc producteur **et** consommateur, deux dépôts, deux PR.

⇒ **c'est exactement l'objet de STORY-490**, que la propre section « Conséquences ailleurs » de
cette fiche différait. La story reste donc **sur `balance-service` seul**, et l'événement ne bouge
pas.

### R-489-3 — la dépendance à STORY-492 n'est pas bloquante

AC-1 exige une liste fermée « servie par le registre ». STORY-492 (registre des pays) est
`ready-for-dev`. Mais la liste fermée **existe déjà localement** : `DEVISES_ISO`, livrée par
STORY-409 deux jours **après** la rédaction de cette fiche. Coder contre elle puis la faire dériver
du registre quand 492 arrivera est le traitement déjà appliqué à `longueurCompteDetail`.

---

## Arbitrages de cadrage

### D-489-1 — ⚡⚡ `exposant` est l'échelle RÉELLEMENT APPLIQUÉE, et l'écart à l'ISO est PUBLIÉ

C'est la décision centrale, et elle demande de nommer précisément le défaut.

Le produit stocke tous les montants **multipliés par 100**. Pour l'euro ou le naira, dont l'exposant
ISO 4217 vaut 2, cette échelle **est** la sous-unité officielle. Pour le franc CFA, dont l'exposant
ISO vaut **0**, elle ne l'est pas : le produit a inventé deux décimales — un choix d'arithmétique
défendable, qu'il a **mal nommé**.

⛔ **Deux corrections sont possibles et une seule est acceptable.**

| | Ce qu'elle ferait | Verdict |
|---|---|---|
| déclarer `exposant: 0` pour XOF | rendrait les montants stockés **cent fois trop grands** : toutes les pièces figées se reliraient faux | ⛔ **interdite par AC-4** — « sans réécrire un seul montant » |
| déclarer l'échelle **appliquée** et publier son écart à l'ISO | les montants gardent leur sens, et le nom cesse de mentir | ✅ retenue |

⇒ `exposant` est l'échelle appliquée, servie par le registre, **jamais envoyée par le client**
(AC-1). Le contrat **déclare explicitement**, pour XOF, que cette échelle diverge de l'ISO 4217 et
pourquoi. C'est ce que la fiche réclame : le défaut n'était pas le ×100, c'était son **nom**.

⚠️ Ce que cette story ne fait **pas** : ramener XOF à son exposant ISO. Ce serait une réécriture de
pièces opposables, et elle relève d'une décision produit, pas d'une story de contrat.

### D-489-2 — la tolérance devient une FONCTION de l'exposant, gardée sur la fonction

`TOLERANCE_EQUILIBRE = 100` est remplacée par `toleranceEquilibre(exposant) = 10 ** exposant`,
c'est-à-dire **une unité monétaire**, quelle que soit la devise.

⚠️ **À exposant 2, elle vaut 100 : les trois sites d'appel rendent exactement ce qu'ils rendaient**,
et aucune balance existante ne change de verdict d'équilibre.

⛔ **La mutation d'AC-3 porte sur la FONCTION, pas sur une devise inventée.** Le registre ne déclare
aujourd'hui aucune devise d'exposant 0 — en fabriquer une pour rendre le test possible serait de la
spéculation, et un `it` sur une valeur que le produit ne sert pas est une garde vacante déguisée.
La fonction, elle, est éprouvée à 0, 2 et 3 : figer son résultat à `100` la fait rougir à 0.

### D-489-3 — `DEVISES_SUPPORTEES` reste à `['XOF']`, et c'est le point

Le registre connaît six codes ISO ; le produit n'en **sert** qu'un. Cette story livre le **socle**
— déclarer, publier, comparer — pas l'ouverture commerciale. Élargir `DEVISES_SUPPORTEES` sans
paquet fiscal, sans plan de comptes et sans référentiel pour ces monnaies produirait des balances
qu'aucune liasse ne peut consommer, c'est-à-dire le défaut de STORY-438.

### D-489-4 — AC-4 par PROJECTION à la lecture, jamais par écriture

Les balances existantes ne portent pas le champ. Elles le reçoivent **à la lecture**
(`devise: 'XOF'`, exposant de la convention), sans qu'une seule écriture ne les touche.

⚠️ Le repli est **nommé dans le contrat**, jamais silencieux : une balance antérieure à cette story
est reconnaissable, et un intégrateur doit pouvoir la distinguer d'une balance qui a **déclaré** sa
devise.

### D-489-5 — AC-6 se garde par un test de PRÉSENCE, pas par une relecture

Le mot `XOF` doit disparaître des **types et constantes** du contrat canonique. Un test balaie les
fichiers du contrat et échoue si le littéral y réapparaît.

⛔ **Le balayage ne peut pas viser tout le dépôt** : `XOF` reste parfaitement légitime dans le
registre des devises, dans le profil société, dans les paquets fiscaux et dans les messages de
refus. Le viser partout rendrait le test intenable et il serait désactivé à la première gêne — le
sort de toutes les gardes trop larges.

### Hors périmètre, nommé

- **La propagation en aval** (liasse, prévisionnel, fiscal, export) : STORY-490.
- **Le contrat d'événement `BalanceCreatedEventV1`** : il ne bouge pas, cf. R-489-2.
- **Les montants du paquet fiscal par devise** : STORY-493.
- **Les opérations en devise étrangère** et leur conversion : STORY-495, qui se tire après 490.
- **Le front** et ses « F CFA » en dur : FE-082.
