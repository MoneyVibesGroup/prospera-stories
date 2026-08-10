# STORY-362 : Implantations multiples — un dossier peut être imposé dans plusieurs pays

**Epic :** EPIC-028 — Implantations multiples et catalogue d'obligations dérivé *(recadré le 2026-08-09)*
**Réf. :** **STORY-302** *(dont cette story reprend le volet abandonné à la scission)* · ticket `TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` — décision **D10** · `architecture-fiscal-service-2026-08-03.md` **AD-7**
**Priorité :** Should Have
**Story Points :** 5
**Statut :** 📋 À faire
**Complexité :** medium
**Créée le :** 2026-08-09
**Sprint :** 24
**Service :** `fiscal-service`

---

## Le constat

STORY-302 portait deux choses qui n'ont ni le même moment ni le même propriétaire :

1. **le type d'entité et le pays d'un dossier** — dont dépendent le référentiel comptable, le gabarit
   de liasse et le paquet fiscal, donc **la balance et le bilan**, donc tout le produit ;
2. **la capacité d'un dossier à porter N implantations** — un client imposé au Togo *et* au Bénin.

La première est un **préalable** : sans elle, aucune balance ne peut être calculée sur le bon plan de
comptes. Elle est partie au socle (**STORY-302 réancrée**, EPIC-043, sprint 20), avec **D10 : un seul
pays en v1**.

La seconde est un **enrichissement**, et elle reste ici. Cette story est ce qui empêche la scission
d'être une perte : sans elle, le multi-implantation aurait disparu du plan sans que personne ne s'en
aperçoive — le défaut que ce dépôt a déjà documenté trois fois sous le nom d'« orpheline ».

---

## User Story

En tant que **collaborateur de cabinet**,
je veux **déclarer plusieurs implantations pour un même client**,
afin que **chaque contexte national ait son identité fiscale et ses obligations propres**.

---

## Ce que la story livre

- **`Implantation`** rattachée au dossier : `dossierId`, `pays`, `typeEntite`, `identifiantFiscal`,
  `regimes { comptable, fiscal }`, `actif`. Unique sur `(orgId, pays, identifiantFiscal)`.
- **L'implantation *est* l'entité comptable** (AD-7) : chaque implantation porte ses propres
  obligations, sans mélange entre pays.
- **Promotion sans migration** : le dossier mono-pays du socle **devient** sa première implantation.
  La clé `(dossier, pays)` posée par STORY-302 réancrée a été choisie pour ça — la bascule est une
  lecture, pas une reprise de données.
- **Clôture d'implantation** pour cessation d'activité : les obligations passées **demeurent
  intactes** et restent consultables ; seule la dérivation future s'arrête.
- **Refus d'un secret de portail** : aucun champ du modèle n'accepte un identifiant ou un mot de passe
  d'accès à un portail administratif. C'est un critère, pas une recommandation — un test échoue si un
  tel champ apparaît au schéma.

## Hors périmètre

- Le **type d'entité et le pays du dossier** → **STORY-302** *(EPIC-043, sprint 20)*, déjà livrés
  quand cette story démarre.
- La **résolution référentiel + paquet** depuis le type d'entité → **STORY-304** *(EPIC-043)*. Ici on
  la **réutilise** par implantation, on ne la réécrit pas.
- Les **régimes** proposés puis confirmés → **STORY-303** *(EPIC-043)*, datée par exercice. Le volet
  « par implantation » consomme cette mécanique.
- La **dérivation du catalogue** d'obligations → **STORY-305**, qui consomme cette story.

---

## Acceptance Criteria

- [ ] Un dossier peut porter **N implantations**, chacune avec pays, type d'entité, identifiant fiscal
      et régimes propres.
- [ ] Deux implantations du même dossier dans **deux pays** : chacune porte ses propres obligations,
      **sans mélange** — vérifié sur un dossier Togo + Bénin.
- [ ] Le dossier mono-pays existant **devient** sa première implantation sans reprise de données ni
      interruption : ses balances et liasses restent rattachées.
- [ ] Une implantation **clôturée** conserve son historique d'obligations intact ; aucune dérivation
      nouvelle ne s'y produit.
- [ ] Tenter d'enregistrer un **secret d'accès à un portail** → refusé : aucun champ du modèle ne
      l'accepte. *(Test au schéma.)*
- [ ] `(orgId, pays, identifiantFiscal)` est **unique** — le même numéro fiscal ne peut pas exister
      deux fois dans la même organisation et le même pays.
- [ ] Une implantation sur un dossier **archivé** → **409 `DOSSIER_ARCHIVE`** (règle héritée de
      STORY-353).

---

## Notes techniques

- Le schéma `Implantation` de `architecture-fiscal-service-2026-08-03.md:302-309` est repris tel quel,
  à une correction près : son `dossierId` n'est **plus** « un regroupement local au service » mais
  **l'identifiant du dossier servi par `dossier-service`**, lu depuis le read-model. C'est
  précisément le point que le ticket a fait bouger.
- La résolution référentiel + paquet devient **par implantation** : la fonction de STORY-304 est
  appelée avec le type d'entité de l'implantation, jamais redéveloppée.

---

## Dépendances

**Prérequises :** **STORY-301**, **STORY-302**, **STORY-304** *(EPIC-043, sprint 20)* ·
**STORY-361** *(scaffold `fiscal-service`)*.
**Débloque :** **STORY-305** *(dérivation du catalogue)* · **STORY-307** *(taxes sectorielles)*.

---

## Definition of Done

- [ ] Lint 0 · build OK · couverture ≥ seuils.
- [ ] e2e : deux implantations dans deux pays sans mélange, promotion du mono-pays, clôture qui
      préserve l'historique, unicité, refus du secret de portail, 409 sur dossier archivé.
- [ ] Vérification docker sur un dossier réellement multi-pays.
- [ ] `/code-review`.

---

## Story Points Breakdown

- Modèle `Implantation` + unicité + rattachement au read-model `Dossier` : 1,5 pt
- Promotion du dossier mono-pays en première implantation : 1 pt
- Clôture préservant l'historique : 1 pt
- Réutilisation de la résolution référentiel/paquet par implantation : 1 pt
- Tests + vérification docker multi-pays : 0,5 pt
- **Total : 5 points**
