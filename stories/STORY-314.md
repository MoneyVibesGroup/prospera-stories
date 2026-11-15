# STORY-314 : Familles hors périmètre — déclarables, non calculables

Status: done

**Épic :** EPIC-029, le moteur de familles de calcul. **Points :** 3. **Sprint :** 25.
**Service :** `fiscal-service`.
**FR :** FR-F14. **Décision :** AD-4 (une famille sans stratégie refuse, elle n'approxime jamais).
**Plage :** lot A, n° 8 (`PLAN-4-SESSIONS-2026-11-14.md` §3.3). Fiche écrite **avant** de coder (rituel §0.3).

## En tant que

**Expert-comptable**, je veux qu'une taxe que le moteur ne sait pas calculer apparaisse quand même à mon calendrier,
afin de ne pas l'oublier.

## Ce qui existe

- Le registre des familles **refuse** déjà, en le nommant, le calcul d'une famille hors v1 (`FAMILLE_NON_CALCULABLE` :
  `SPECIFIQUE_UNITE`, `PAR_ACTE`, `VALEUR_LOCATIVE`) ou d'une famille calculable sans stratégie enregistrée
  (`FAMILLE_SANS_STRATEGIE`).
- La dérivation crée déjà l'obligation, quelle que soit sa famille. Mais rien ne dit qu'il faudra **saisir** son
  montant, aucune route ne le reçoit, et nul ne mesure combien d'obligations en dépendent.

## Ce que la story livre

1. **À la dérivation**, chaque obligation porte :
   - **`montantASaisir`** : vrai si sa famille n'est pas calculable, ou si aucune stratégie n'est enregistrée pour
     elle. Faux pour une famille calculée, et pour une déclaration sans montant (`DECLARATIVE`) ;
   - **`refusCalcul`** : le code nommé, `FAMILLE_NON_CALCULABLE` ou `FAMILLE_SANS_STRATEGIE`, sinon `null`.

   Ce sont des champs dérivés, récrits à chaque dérivation. Le registre des familles enregistrées les décide : une
   stratégie ajoutée demain fait passer l'obligation en « calculée » à la dérivation suivante, sans migration.
2. **La saisie du montant** : `POST /api/v1/obligations/:id/montant` (`{ montant }`, entier ≥ 0 en unités de la
   devise), sous le droit `fiscalite:declaration:preparer`.
   - Elle n'est ouverte qu'à une obligation **à montant saisi** (`MONTANT_NON_SAISISSABLE` sinon : le moteur le
     calcule, ou la déclaration n'en a pas) et **active** (`OBLIGATION_DESACTIVEE`).
   - Le montant est un champ **humain** (`montantSaisi : { montant, par, le }`), que la re-dérivation ne touche jamais
     (AD-17). Une nouvelle saisie remplace la précédente, et chaque saisie est tracée au journal chaîné de
     l'obligation (`OBLIGATION_MONTANT_SAISI`).
   - Le **statut ne change pas** : l'obligation suit le même cycle que les autres. Elle peut être désactivée,
     réactivée et déclarée, avec `montantRetenu` = le montant saisi.
3. **La contre-métrique** : `GET /api/v1/obligations/indicateurs/montants?annee=AAAA`, sur tout le portefeuille de
   l'organisation (obligations actives). Elle rend le nombre d'obligations **à montant**, combien sont **à saisir**,
   combien sont **déjà saisies**, et la **part à saisir**. C'est la mesure de ce que le moteur ne calcule pas encore.

## Critères d'acceptation

- **AC-1** : une taxe d'une famille sans stratégie (hors v1, ou calculable non enregistrée) est dérivée. L'obligation
  existe et porte `montantASaisir: true` **et** un refus de calcul nommé. Une famille calculée porte `false` et
  `null`, et une déclaration sans montant aussi.
- **AC-2** : un montant saisi sur une telle obligation est enregistré, tracé et rendu en `montantRetenu`. Le statut
  ne change pas, une re-dérivation ne l'efface pas, et l'obligation reste désactivable et réactivable. La saisie est
  refusée sur une obligation calculée ou sans montant (409 `MONTANT_NON_SAISISSABLE`), sur une obligation désactivée
  (409 `OBLIGATION_DESACTIVEE`), et pour un montant invalide (400).
- **AC-3** : sur un portefeuille, la part à montant saisi est restituable. Exemple : 4 obligations à montant, dont 1
  à saisir ⇒ `partASaisir` = 0,25.

## Definition of Done

- [x] Tests unitaires, e2e, lint, build verts. La conformité sur un vrai MongoDB couvre : saisie, puis re-dérivation,
      montant intact.
- [x] Mutation-test : remettre le montant saisi parmi les champs dérivés (`$set`) fait rougir AC-2.
- [x] `docker compose up` (une route et un champ de schéma changent).

---

## Livraison (2026-11-15)

**PR :** MoneyVibesGroup/prospera-fiscal-service#45, fusionnée sur `dev` (`0fd32fc`), arbre identique à l'arbre
testé.

### Décisions (contestables ; règle de l'utilisateur : « appliquer ce que je recommande »)

- **D-314-1 : `montantASaisir` et `refusCalcul` sont DÉRIVÉS, décidés par les familles ENREGISTRÉES**
  (`RegistreFamilles.codesEnregistres`), et non par la seule liste de v1. Une stratégie ajoutée fait passer
  l'obligation en « calculée » à la dérivation suivante, sans migration.
- **D-314-2 : le montant saisi est un champ HUMAIN** (`$setOnInsert`), comme le statut et le responsable : aucune
  dérivation ne l'efface (AD-17). Une nouvelle saisie remplace la précédente, que le journal garde (`precedent`).
- **D-314-3 : la saisie ne change pas le statut.** « Suivre le cycle de vie normal », c'est rester une obligation comme
  les autres : désactivable, réactivable, déclarable, avec un `montantRetenu`.
- **D-314-4 : la contre-métrique porte sur tout le portefeuille de l'organisation**, d'où sa réservation à
  `TENANT_ADMIN` : un collaborateur au portefeuille restreint ne doit pas compter les dossiers des autres. Une
  déclaration sans montant (`DECLARATIVE`) n'entre pas dans le dénominateur.
- **D-314-5 : le montant d'une taxe de l'entreprise figure au journal en clair**, avec le précédent. Il n'est pas une
  donnée personnelle de tiers (AD-21 ne vise que la rémunération).

### Preuves

- Domaine (15 tests) : modes de montant ; dérivation sur le **vrai** paquet Togo 2026, avec la TVA rangée en famille
  hors v1 (12 obligations datées, toutes à saisir, refus nommé ; acompte d'IS et DSF non) ; sans stratégie
  `PROPORTIONNELLE` ⇒ `FAMILLE_SANS_STRATEGIE` ; saisie et refus ; contre-métrique 4/1 ⇒ 0,25, portefeuille vide ⇒ 0.
- e2e (4 nouveaux, obligations 38/38) :
  - dérivée et au calendrier ;
  - saisie : 1 250 000 retenu, statut `A_PREPARER`, re-dérivation sans effet sur le montant ;
  - refus : calculée (409), quatre montants invalides (400), `DEPOSER` seul (403), écartée (409) ;
  - indicateur : `TENANT_USER` refusé (403), sans année (400).
- Conformité sur un vrai MongoDB (3 nouveaux, **62/62**) :
  - saisie, puis re-dérivation : montant intact, statut inchangé ;
  - chaîne d'audit `OBLIGATION_DERIVEE` → `OBLIGATION_MONTANT_SAISI`, intacte ;
  - saisie refusée sur une obligation calculée, puis sur une obligation écartée ;
  - `actives` correctement filtrées.
- Unitaires **2363/2363**, e2e **191/191**, lint et build verts.
- **Mutation** : remettre `montantSaisi` parmi les champs `$set` fait rougir 2 tests de conformité et 1 unitaire.
- `docker compose up` (pile `grp-a`, image reconstruite) : `POST /api/obligations/:id/montant` et
  `GET /api/obligations/indicateurs/montants` montées, service démarré.

### Écarts

- L'écran du calendrier (D) n'affiche pas encore `montantASaisir`, `refusCalcul` ni `montantRetenu`. Le contrat est
  additif : rien ne casse, mais l'information n'est pas encore montrée.
