# STORY-470 : Un collaborateur crée et modifie seul un jeu d'hypothèses — aucun second regard, alors que la table de passage et la liasse en exigent un

Status: in_progress

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


---

## Décision PO — 2026-09-07 : ARBITRAGE RENDU → modèle **(a)**

> Arbitrage demandé au démarrage du code, comme la fiche l'exigeait, et rendu par le PO :
> **(a) édition ouverte à tous + verrouillage d'un jeu par l'administrateur.**

Motifs retenus : c'est le patron **« proposer ≠ valider »** déjà en place sur les deux écrans
voisins (table de passage, liasse), et l'issue qu'il suppose — **dupliquer plutôt que
modifier** — existe côté serveur depuis **STORY-466**, clôturée le 2026-09-07. Le modèle (b),
plus brutal, aurait retiré au collaborateur le droit de **proposer** un scénario, ce que
l'écran FE-035 est fait pour permettre.

## Progress Tracking

**Statut : in_progress** — ouvert le 2026-09-07, branche `MNV-470`.

### ⚡ Ce que la lecture du code a démenti, AVANT d'écrire

La fiche date du 2026-08-27. Trois stories clôturées depuis en ont livré une partie :

| Critère | État réel au 2026-09-07 |
|---|---|
| **AC-3** — suppression et rebasage réservés à l'administrateur | **DÉJÀ LIVRÉ.** `@Roles(TENANT_ADMIN)` + `@CodeRefusRole('SUPPRESSION_RESERVEE_ADMIN')` depuis STORY-464, et `REBASAGE_RESERVE_ADMIN` depuis STORY-465. Rien à écrire. |
| **AC-4** — l'écran affiche la phrase et le responsable, il ne grise pas | **Le mécanisme back existe** depuis STORY-447 : `@CodeRefusRole` nomme le refus de rôle, sans quoi un 403 de rôle est indiscernable d'un 403 de gate. Reste à le poser sur l'acte neuf. Le rendu de l'écran est du ressort de FE-035. |
| **AC-2** — la seule issue est la duplication | **L'issue existe** : `POST …/:id/dupliquer`, STORY-466, clôturée le 2026-09-07 — la veille de cet arbitrage. Sans elle, verrouiller aurait été un cul-de-sac. |

**Le périmètre réel de cette story est donc AC-1 + AC-2 : l'acte de verrouillage et la garde
qu'il pose.**

### Décisions de conception

- **D-470-1 — Le verrouillage refuse ce qui change les CHIFFRES, pas ce qui change le nom.**
  Deux chemins les changent : `PUT :id` (les paramètres) et `POST :id/rebaser` (la base, donc
  les chiffres de départ). Les deux refusent. `PATCH :id` (renommer) reste ouvert : corriger
  une faute de frappe dans un nom ne remet aucun chiffre en cause, et STORY-464 a précisément
  ouvert ce geste parce qu'un nom saisi à la main restait confisqué. Garde posée sur **les
  deux** chemins, jamais un seul (famille STORY-445).
- **D-470-2 — Pas de déverrouillage.** L'AC-2 est explicite : « la seule issue est la
  duplication — jamais la modification silencieuse ». Une route de déverrouillage rendrait le
  verrou décoratif : il suffirait de le retirer pour éditer, et le geste ne protégerait plus
  rien. Dupliquer laisse l'original intact et **trace l'origine** (`duplicateDe`), ce qu'un
  déverrouillage ne fait pas.
- **D-470-3 — Verrouiller est IDEMPOTENT** : re-verrouiller un jeu déjà verrouillé rend
  **200** sans rien réécrire, et conserve l'auteur et la date d'origine. Rendre 409 ferait
  échouer un double-clic sur un acte qui a déjà produit exactement l'état demandé — et
  écraser la date effacerait qui a réellement engagé le jeu.
- **D-470-4 — La suppression n'est PAS refusée sur un jeu verrouillé.** Hors périmètre : la
  fiche parle d'**édition**, et STORY-464 garde déjà ce chemin par le rôle administrateur
  **et** par le refus `HYPOTHESES_EXPORTEES` dès qu'un export a eu lieu. Verrouiller n'est pas
  archiver.
- **D-470-5 — Le verrou publie QUI l'a posé, résolu en nom.** L'AC-4 exige que l'écran
  affiche « le responsable », pas un bouton grisé : il lui faut donc une personne à nommer.
  L'identité est résolue à la lecture via `AuteursRepository`, comme l'historique des versions
  depuis STORY-471 — jamais stockée en double.
- **D-470-6 — Pas de motif de verrouillage.** La fiche n'en demande pas, et la ligne d'audit
  `HYPOTHESES_VERROUILLE` livrée ici dit déjà **qui** et **quand**. Ajouter une saisie libre
  publiée sans que la fiche la cadre serait un débordement.
