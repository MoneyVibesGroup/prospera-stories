# STORY-484 : Une projection n'est ni figée, ni horodatée, ni tracée — alors qu'elle est remise à un tiers

Status: in_progress

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 5 · **Complexité :** medium · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-036** (projection 3 ans, trésorerie 12 mois, scénarios comparés), 2026-08-27.
Relevé par la checklist posée en FE-034 puis étendue en FE-035 : pour tout objet qu'un cabinet REMET À UN TIERS, demander « qui a le droit » ET « qui le saura ».

---

## Le fait

`ProjectionController` et `ComparaisonController` sont en **lecture pure** : rien n'est écrit, rien
n'est journalisé. C'est un bon choix d'architecture — une projection est une **dérivation**, il n'y a
rien à stocker donc rien à invalider — et il rend la projection **rejouable** grâce au triplet
`(snapshotId, versionHypothesesId, modeleVersion)` et au paramètre `?versionHypotheses=`.

**Rejouable n'est pas retrouvable.** Le produit ne sait pas dire :

- **qui** a sorti le prévisionnel remis à la banque (`AuditType` ne compte aucun acte de projection,
  et les contrôleurs n'injectent pas `AuditService`) ;
- **quand** il a été produit (la réponse ne porte aucune date) ;
- **lequel** a été remis, s'il y en a eu plusieurs.

Le contraste est frappant avec la **liasse** dont ce prévisionnel découle : elle porte un journal
complet, des versions figées et une piste d'audit (FE-034). Le document qui en dérive — celui qui sort
du cabinet — n'en porte aucun.

⚠️ Même famille que **STORY-471** (aucune piste d'audit sur les hypothèses), objet différent : ici
c'est l'acte de **restitution** qui n'est pas tracé.

## Critères d'acceptation

- [ ] AC-1 — La réponse porte `produitLe` (horodatage serveur) et `produitPar` (identifiant de
      l'appelant). Une date posée par le client serait une date qu'il choisit.
- [ ] AC-2 — Un `AuditType.PROJECTION_CONSULTEE` est journalisé par appel, avec le triplet de
      reproductibilité — c'est ce triplet, et non la réponse, qui permet de rejouer.
- [ ] AC-3 — Le rôle : `@Roles(TENANT_ADMIN, TENANT_USER)` sur les deux contrôleurs. **Arbitrage PO
      requis**, même arbitrage que **STORY-470** : un prévisionnel remis à un tiers engage le cabinet.
      À trancher **avant** la première ligne de code, le rôle changeant la forme de l'écran.
- [ ] AC-4 — Aucune écriture métier n'est introduite : la projection reste une dérivation. Le journal
      est un effet de bord d'observabilité, pas un agrégat.

## Conséquences ailleurs

- Si le PO veut un prévisionnel **opposable** (figé, versionné, exportable tel quel), c'est une autre
  story — et elle appartient à **FE-038** (export). Celle-ci se limite à savoir **qui a produit quoi,
  et quand**.

---

## Arbitrages de cadrage (2026-09-09, avant la première ligne)

### D-484-1 — AC-3 est DÉJÀ satisfait, et on ne le « livre » donc pas

`projection.controller.ts:52` et `comparaison.controller.ts:42` portent **exactement**
`@Roles(Role.TENANT_ADMIN, Role.TENANT_USER)`, plus `@RequiresBilanAccess()` et
`@RequiresDossierScope()`. Le critère décrit **l'état courant** : il n'y a rien à écrire.

⛔ **L'arbitrage PO qu'il appelle reste donc OUVERT, et cette story ne le tranche pas.** Restreindre
la restitution à `TENANT_ADMIN` serait un **rétrécissement de droit** qui change la forme de l'écran —
exactement ce que la fiche dit devoir être décidé avant de coder. Le faire ici, sans décision, serait
déborder du périmètre dans le sens le plus coûteux : casser l'usage d'un `TENANT_USER` qui sort
aujourd'hui légitimement un prévisionnel.

⇒ AC-3 est **coché comme constaté**, avec la mesure qui le prouve, et la question de la restriction
est renvoyée au PO. Si la réponse est « TENANT_ADMIN seul », c'est une story d'une ligne.

### D-484-2 — TROIS routes, pas deux contrôleurs

La fiche parle des « deux contrôleurs ». Ce qui compte pour AC-1 et AC-2, ce sont les **routes** :

| route | contrôleur |
|---|---|
| `GET …/hypotheses/:id/projection` | `ProjectionController` |
| `GET …/hypotheses/:id/projection-mensuelle` | `ProjectionController` |
| `GET …/previsionnel/comparaison` | `ComparaisonController` |

⛔ Compter les contrôleurs plutôt que les routes est **précisément** la façon dont ce dépôt a produit
quatre fois le même défaut — une garde posée sur un seul des chemins (STORY-445, STORY-457,
STORY-483). Les trois routes sont tracées, et un test **énumère les routes** plutôt que de les nommer
une par une.

### D-484-3 — une SEULE implémentation, injectée, jamais recopiée trois fois

`RestitutionService` porte l'unique geste : horodater, journaliser, rendre le couple. Les trois
handlers l'appellent, ils ne le réimplémentent pas. C'est ce qui rend le test d'énumération capable de
prouver quelque chose : si une route l'oublie, elle n'a **rien** au lieu d'avoir une variante.

### D-484-4 — `journaliser`, jamais `journaliserDansTransaction`

Le module expose les deux, et le choix est un **arbitrage de sécurité déjà rendu** (STORY-454) :
`journaliser` **avale** ses erreurs, `journaliserDansTransaction` les **propage**. La règle qui les
départage est écrite dans le dépôt : la seconde est réservée aux actes **destructeurs**, dont la ligne
de journal est la **seule trace attribuée**.

Ici l'acte est une **lecture**. Une restitution non journalisée est une perte de confort ; une
restitution **refusée** parce que `audit_events` est indisponible serait une panne fabriquée sur un
document qu'un cabinet doit pouvoir sortir. ⇒ `journaliser`, doublé du filet `try/catch` du patron
`ExportService.tracer` — « aucune évolution de l'audit ne pourra transformer une restitution réussie
en erreur ».

C'est aussi ce qui satisfait **AC-4** : le journal est un effet de bord d'observabilité, il ne peut
ni écrire un agrégat, ni faire échouer la dérivation.

### D-484-5 — `produitLe` est une DATE SERVEUR, `produitPar` l'identifiant du JWT

`new Date().toISOString()` côté serveur, et `user.userId` **résolu du jeton**, jamais d'un champ du
corps ou d'un paramètre. AC-1 le dit : « une date posée par le client serait une date qu'il choisit ».
La même phrase vaut pour l'auteur — c'est la règle d'anti-répudiation déjà appliquée aux hypothèses
(STORY-471, « du JWT, jamais du corps »).

⚠️ **`produitPar` est un IDENTIFIANT, pas un nom.** Résoudre le nom de la personne est un autre geste,
avec son propre read-model et ses propres pièges (STORY-382, STORY-441). La fiche demande
« l'identifiant de l'appelant » : c'est ce qui est servi, et la description du contrat le dit.

### D-484-6 — la cible du journal est le JEU D'HYPOTHÈSES

`AuditCible` exige `{ collection, id }` et une projection **n'a aucun document**. Le même problème
s'est posé en STORY-454 pour une suppression. La cible naturelle est le **jeu d'hypothèses** dont la
projection dérive : c'est l'objet que l'utilisateur nomme, et celui sur lequel le journal se relit.

Pour la **comparaison**, qui porte 2 à 5 jeux, la cible est le **premier** identifiant — celui que la
réponse désigne déjà comme la **référence** des écarts — et le contexte porte la liste complète.

### Hors périmètre, nommé

- **Un prévisionnel opposable** (figé, versionné, exportable tel quel) : la fiche le renvoie
  elle-même à FE-038.
- **La restriction du rôle à `TENANT_ADMIN`** : arbitrage PO non rendu, cf. D-484-1.
- **La résolution du nom de la personne** derrière `produitPar` : autre read-model, autre story.
- **`EXPORT_EFFECTUE`** : l'export du prévisionnel est **déjà** journalisé, cette story ne le touche
  pas. Un même prévisionnel sorti puis exporté produira deux lignes, de deux types différents — c'est
  la lecture voulue, ce sont deux actes.
