# STORY-489 : Le contrat canonique de balance ne porte aucune devise — le « ×100 » est une convention XOF que rien ne déclare

Status: ready-for-dev

**Épic :** EPIC-107 — Devise, unités et arrondis (socle d'internationalisation)
**Service :** `balance-service` (`:3007`) — `types/balance-canonique.ts` · `bilan-service` (consommateur)
**Points :** 8 · **Sprint :** S20
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
