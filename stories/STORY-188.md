# STORY-188 : **L'activité de revue par opérateur** — un verdict a un auteur, une équipe a une charge

**Epic :** EPIC-003 — Chaîne KYC
**Réf. :** **AP-07** *(dashboard : « nb en attente, dernières décisions »)* · **AP-08** *(écran Équipe)* · maquette AP-06 *(panneau Équipe et tableau de bord agent)* · **STORY-013** *(revue admin)* · **STORY-128** *(verdict par pièce)* · **STORY-186** *(agrégats plateforme — le consommateur)*
**Découverte par :** revue de la maquette AP-06 confrontée au contrat généré, 2026-08-04
**Priorité :** Could Have
**Story Points :** 3
**Statut :** À faire
**Créée le :** 2026-08-04
**Sprint :** 21
**Service :** `kyc-service` (`:3002`) — 1 dépôt, 1 branche, 1 PR
**Branche :** `MNV-188`

---

## Le constat

La maquette porte un écran **Équipe** et un **tableau de bord par opérateur** qui affichent, pour
chaque relecteur : dossiers traités aujourd'hui · cette semaine · approuvés · à compléter · rejetés ·
brouillons en cours · date d'entrée dans le rôle.

**Aucun de ces nombres n'existe.** `kyc-service` porte bien `reviewedBy` et `reviewedAt` **sur le
dossier** — mais rien ne les agrège, et aucune route ne les interroge par opérateur.

⚠️ **Et une partie de ces chiffres n'est pas seulement non agrégée : elle n'est pas stockée.**
Le `reviewedBy` du dossier ne survit pas à une seconde décision *(il est écrasé)*, et **les
verdicts par pièce n'ont pas d'auteur du tout** — c'est précisément ce que STORY-176 §incrément 1
ajoute. Sans lui, « qui a traité 12 dossiers » est une question sans donnée.

---

## Pourquoi ça compte plus qu'un joli tableau

**Une file de travail sans mesure de charge ne se pilote pas.** Trois faits que personne ne peut
établir aujourd'hui :

1. **Un opérateur est-il en surcharge ?** La file est commune ; rien ne dit qui l'absorbe.
2. **Un opérateur nouvellement nommé a-t-il commencé ?** La maquette prévoit un écran d'accueil
   distinct pour un agent à zéro décision *(« Bienvenue, votre rôle vient d'être activé »)* — il
   suppose qu'on sache qu'il est à zéro.
3. **Qui a tranché ce dossier ?** Question d'audit, pas de confort. Un refus KYC est une décision
   opposable au client ; elle doit avoir un auteur retrouvable, y compris après une resoumission.

> ⚡ **La donnée est déjà produite, elle n'est simplement pas conservée ni lisible.** Ce n'est pas
> une story d'analytique — c'est une story de **traçabilité**, dont le sous-produit se met dans un
> tableau.

---

## Périmètre

### 1. Rendre l'auteur durable

- **`reviewedBy` sur chaque verdict de pièce** — ⚠️ livré par **STORY-176 §incrément 1**, pas ici.
  Cette story **en dépend** ; elle ne le refait pas.
- **Un enregistrement par décision**, plutôt qu'un champ écrasé sur le dossier :
  `{ orgId, submissionAttempt?, decision, decidedBy, decidedAt, scope: "FILE" | "DOCUMENT", documentId? }`.

⚡ **C'est la même donnée que l'historique de STORY-183**, lue par l'autre bout : 183 la lit
*par dossier* pour raconter une resoumission, 188 la lit *par opérateur* pour mesurer une charge.
**⇒ Un seul journal, deux index.** Si 183 est tirée d'abord, cette story se réduit à l'agrégat ; si
c'est l'inverse, 183 hérite du journal. **Ne pas créer deux stockages** — ce serait la quatrième
occurrence du motif « une garde posée à un endroit et pas à l'autre » que ce dépôt documente déjà.

### 2. `GET /api/v1/admin/kyc/reviewers/activity?from=&to=`

```jsonc
{
  "from": "2027-04-06", "to": "2027-04-13",
  "reviewers": [
    { "reviewerId": "…", "email": "m.traore@moneyvibes.io",
      "decisions": { "approved": 34, "incomplete": 11, "rejected": 2 }, "total": 47,
      "lastDecisionAt": "2027-04-13T09:02:11Z" }
  ]
}
```

- **Fenêtre obligatoire** *(`from`/`to`)*, plafonnée à **92 jours**. Sans borne, la route finirait par
  balayer tout l'historique pour alimenter une tuile — et deviendrait la requête la plus chère du
  service.
- **`incomplete`** apparaît **si STORY-185 est livrée** ; sinon la clé est absente *(objet de
  comptage, pas enum figé — même règle qu'en STORY-186)*.
- ⚡ **Aucun libellé, aucun nom d'affichage.** `kyc-service` ne connaît pas les opérateurs, il
  connaît des identifiants. La **jointure avec `/admin/users`** appartient au BFF — même patron que
  STORY-142 *(index inverse)* → STORY-143 *(proxy + résolution des noms)*. Renvoyer un `email` reste
  acceptable **s'il est déjà porté par le token** ; inventer un annuaire ici ne l'est pas.

### 3. Autorisation

Permission **`org:read`** — c'est une lecture de supervision. ⚠️ **Pas de permission neuve**
*(catalogue figé, D15)*.

⚠️ **Point à trancher explicitement, et à écrire :** un opérateur voit-il l'activité de ses
collègues, ou seulement la sienne ? La maquette montre l'équipe **à l'admin** et le seul tableau
personnel **à l'agent**. ⇒ Proposition : `org:read` donne l'équipe entière, et l'écran d'un agent se
filtre côté client sur son propre identifiant. **Un filtre d'écran n'est pas une sécurité** — si le
PO veut que l'activité d'autrui soit fermée, c'est une garde serveur et il faut le dire ici.

### Hors périmètre

- **Les brouillons de marques non soumises** *(« 2 brouillons en cours »)*. Ils n'existent nulle part
  et leur persistance est **un autre sujet, plus lourd** : sauvegarder un travail en cours engage un
  cycle de vie *(péremption, reprise par un tiers, conflit)*. La maquette va jusqu'à décrire ce qui
  arrive aux brouillons d'un agent qu'on retire — c'est une story à part entière, à ouvrir si le PO
  la veut, pas un champ à glisser ici.
- **Le temps de traitement moyen, les objectifs, le classement des opérateurs.** Mesurer une charge
  n'est pas noter des gens ; le second usage demande un cadrage qui n'a pas eu lieu.
- **La jointure des noms** — BFF, cf. §2.

---

## Critères d'acceptation

1. Chaque décision *(dossier **et** pièce)* est enregistrée avec son auteur et son horodatage, et
   **survit** à une décision ultérieure sur le même dossier.
2. `GET /admin/kyc/reviewers/activity` renvoie les compteurs par opérateur sur la fenêtre demandée.
3. Une fenêtre absente ou > 92 jours répond **400** — pas une réponse tronquée en silence.
4. Un opérateur **sans aucune décision** sur la fenêtre apparaît avec des compteurs à **0**, il n'est
   pas absent de la réponse ⚡ *(c'est ce qui permet à l'écran de distinguer « n'a rien fait » de
   « n'existe pas », et de rendre l'accueil du nouvel arrivant)*.
5. **403** sans `org:read`.
6. Les décisions **antérieures** à la story ne sont pas inventées : elles apparaissent sans auteur
   plutôt qu'attribuées par défaut ⚠️ **une attribution fausse est pire qu'une absence** dans une
   donnée d'audit.
7. Aucune régression sur `reviewedBy` / `reviewedAt` du dossier — ils restent servis.

---

## Definition of Done

- [ ] Les 7 critères vérifiés · `lint` 0 · couverture ≥ 90 %
- [ ] ⚡ **Le journal est partagé avec STORY-183**, pas dupliqué — vérifié en revue de code, et écrit
      dans celle des deux qui est tirée en second
- [ ] **Vérification docker** : deux opérateurs tranchent des dossiers, les compteurs **concordent**
      avec le décompte direct
- [ ] Arbitrage « voir l'activité d'autrui » tranché et **consigné** dans AP-08
- [ ] Branche `MNV-188`, PR rebase-mergée sur `dev`

---

## Lié

- **STORY-176** *(§incrément 1)* — ⛔ **prérequis strict** : sans `reviewedBy` sur les verdicts de
  pièce, l'agrégat ne peut compter que les décisions de dossier, soit une fraction du travail réel.
- **STORY-183** *(historique)* — même journal, autre index. **Se tirent ensemble ou se cèdent le
  stockage.**
- **STORY-185** *(`INCOMPLETE`)* — ajoute la troisième issue au décompte ; sans elle, un dossier
  « à compléter » n'est compté **nulle part**.
- **STORY-186** *(agrégats plateforme)* — le consommateur : c'est le BFF qui joindra ces compteurs à
  l'annuaire des opérateurs pour l'écran Équipe.
