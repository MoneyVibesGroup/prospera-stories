# STORY-470 : Un collaborateur crée et modifie seul un jeu d'hypothèses — aucun second regard, alors que la table de passage et la liasse en exigent un

Status: ready-for-dev

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 3 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé par la passe expert-comptable sur l'écran FE-035 fini, en le mettant à côté de ses deux voisins.

---

## Le fait

`JeuHypothesesController` garde toutes ses routes par
`@Roles(Role.TENANT_ADMIN, Role.TENANT_USER)` — création **et** édition comprises. Et il n'existe
**aucun geste de validation** d'un jeu d'hypothèses.

Mis à côté des deux écrans voisins, le contraste est net :

| Objet | Proposer | Engager |
|---|---|---|
| Surcharge de mapping (table de passage) | `TENANT_USER` | **valider/rejeter** : `TENANT_ADMIN` |
| Liasse | recalcul : tous | **valider** : acte explicite, tracé, versionné |
| **Jeu d'hypothèses** | tous | **rien — l'édition EST l'engagement** |

Or un prévisionnel est un document **remis à un tiers** : une banque, un investisseur, un bailleur. Il
engage le cabinet autant qu'une liasse. Aujourd'hui, la croissance d'un plan déjà remis peut passer de
5 à 15 % sans qu'aucun responsable ne l'apprenne — et, faute de piste d'audit (**STORY-471**), sans que
personne ne puisse même le constater après coup.

## Critères d'acceptation

- [ ] AC-1 — Arbitrage PO d'abord, sur **deux** modèles possibles :
      **(a)** édition ouverte à tous + **verrouillage** d'un jeu par l'administrateur (« ce jeu a servi
      à un dossier bancaire ») ; **(b)** édition réservée au `TENANT_ADMIN`.
      La (a) est cohérente avec le patron « proposer ≠ valider » du module ; la (b) est plus simple et
      plus brutale.
- [ ] AC-2 — Un jeu **verrouillé** refuse l'édition en `409` avec un code nommé, et la seule issue est
      la **duplication** (**STORY-466**) — jamais la modification silencieuse.
- [ ] AC-3 — La suppression (**STORY-464**) et le rebasage (**STORY-465**) sont réservés à
      l'administrateur dans les deux modèles.
- [ ] AC-4 — L'écran ne **grise** pas un bouton interdit : il affiche la phrase et le responsable — la
      règle déjà posée par la table de passage.

## Conséquences ailleurs

- À trancher **avant** FE-035 (implémentation) : le rôle change la forme de l'écran, pas seulement un
  attribut `disabled`.

## Décision PO — 2026-08-27 : ARBITRAGE REPORTÉ

> *« Story 470, vu que pour le moment on ne code pas, je valide la maquette. »*

L'arbitrage entre **(a)** édition ouverte + verrouillage par l'administrateur et **(b)** édition
réservée au `TENANT_ADMIN` **n'est pas rendu**. Il est **reporté au démarrage de l'implémentation de
FE-035**, la maquette étant validée en l'état.

⚠️ **Ce que le report ne change pas.** La contrainte reste entière : le rôle détermine la **forme** de
l'écran — dans le modèle (a) l'écran porte un état « verrouillé » et un refus `409` à rendre, dans le
modèle (b) il porte un sélecteur de rôle et une phrase de redirection, comme la table de passage.
Ce n'est pas un attribut `disabled` qu'on ajoutera à la fin. **L'arbitrage redevient bloquant au
premier jour de code**, et la maquette validée ne le préempte pas : elle montre l'écran **sans**
distinction de rôle, ce qui correspond au contrat **actuel** — pas à une décision.
