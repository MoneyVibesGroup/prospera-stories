# STORY-540 : Le dossier de validation de `cima-assurances` — ce qu'on soumet, à qui, et ce qu'on attend en retour

Status: ready-for-dev

**Épic :** EPIC-128 — Socle vertical CIMA
**Service :** *(hors code — livrable documentaire et artefact)* `assurance-service` / `referentiels/`
**Points :** 5 · **Sprint :** S20
**Origine :** décision PO du 2026-08-28 — *« prends `cima-assurances` comme validé ; dans le cas contraire, écris la story pour mettre cela en place, avec les informations dont tu as besoin »*.

---

## Pourquoi cette story existe

Le PO a décidé qu'on **avance** en considérant `cima-assurances` validé : le palier 2 démarre, et
[[STORY-519]] n'est plus suspendue. **C'est la bonne décision pour le développement.**

⛔ **Et elle ne peut pas remplacer la validation elle-même.** Une méthode de provisionnement est
validée par un **actuaire**, pas par un statut qu'on pose. Un artefact dont le `statut` dirait
« certifié » sans signature serait **la seule affirmation de ce programme qu'un régulateur pourrait
retenir contre son utilisateur**.

⇒ Cette story **met la validation en chantier en parallèle du développement**. Elle ne bloque rien.

## Ce qu'il faut soumettre — le dossier

| Pièce | Où elle est aujourd'hui | État |
|---|---|---|
| **Le plan de comptes** — liste de l'art. 431, 80 comptes à 2 chiffres, libellés verbatim | `cima-assurances-1.0.json`, `planDeComptes` | ✅ officiel |
| **Les 25 postes et la table de passage** — la structure Bilan / CR proposée | même artefact | ⚠️ **proposition à valider** |
| **Les 4 formules** — `CAT`, `CPT`, `RT`, `RN`, avec leurs opérandes signées | `tableDePassage` | ⚠️ **`RT` est incomplet et le dit** |
| **Les `racinesDeGestion`** — `['6','7','80','82','83','84','85','86']` | même artefact | ⛔ **classe 8 déclarée en bloc** ([[STORY-522]]) |
| **Les méthodes de provisionnement** retenues au palier 2 | [[STORY-517]] / [[STORY-519]] | ⚠️ à produire |

## Les questions à poser — et ce sont elles, le livrable

1. **Le découpage en 25 postes est-il celui de l'article 433**, ou une agrégation acceptable ? ⚠️ Le
   plan s'arrête à **2 chiffres** : un assureur réel tient des comptes à 4-6 chiffres, qui se
   rattacheront tous par préfixe **sans qu'aucune erreur ne soit détectable** ([[STORY-512]]).
2. **Quels postes de variation de provisions techniques** doivent entrer au compte de résultat, et
   dans quel ordre de cascade ? ([[STORY-518]])
3. **Où passe la frontière Vie / Non-Vie** dans le plan, compte par compte ? ([[STORY-521]])
4. **Quels comptes de la classe 8 sont des comptes de REGROUPEMENT** ? ⚡ La question la plus urgente :
   le repli générique y a déjà **doublé exactement la base imposable**, sans qu'aucun contrôle ne
   s'en aperçoive.
5. **Quelles méthodes de provisionnement** sont admises par la Commission Régionale de Contrôle des
   Assurances, et **lesquelles exigent une signature d'actuaire agréé** ?
6. **La cadence de règlement** collectée par [[STORY-516]] est-elle la bonne maille (par branche,
   par exercice de survenance) pour alimenter une PSAP ?

## Critères d'acceptation

- [ ] AC-1 — Le dossier ci-dessus est **constitué et versé au dépôt**, sous
      `referentiels/validation-cima/`, avec l'artefact, ses formules **écrites en clair** (pas en
      JSON) et les six questions.
- [ ] AC-2 — ⛔ **Le `statut` de l'artefact reste `a-valider-par-expert`** et continue d'être publié
      partout où il est servi. Il ne bascule à `certifie` que **le jour où quelqu'un signe**, et le
      nom du signataire entre au `_meta`.
- [ ] AC-3 — Un **registre des réserves** : chaque point que la validation infirme devient une story,
      et la story cite la réserve. ⚠️ Les provisions étant des **évaluations versionnées**
      (STORY-517), une méthode corrigée produit **une nouvelle version** — l'historique n'est jamais
      réécrit, et c'est ce que cette architecture protège.
- [ ] AC-4 — Le dossier nomme **ce que le produit ne demande PAS de valider** : le plan de comptes
      (officiel, verbatim) et l'architecture du moteur. On fait relire ce qui est une proposition,
      pas ce qui est une transcription.

## Notes

- Voir [[STORY-519]], [[STORY-517]], [[STORY-518]], [[STORY-521]], [[STORY-522]], [[STORY-512]].
