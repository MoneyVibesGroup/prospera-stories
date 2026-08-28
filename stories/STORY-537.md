# STORY-537 : Le fichier e-DSF Togo — le premier pays, et le jalon `format confirmé` est la story

Status: ready-for-dev

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service` + `bilan-service`
**Points :** 13 · **Sprint :** S20
**Prérequis :** **STORY-536** (le contrat de paquet de dépôt)
**Bloquée par :** ✅ **DÉBLOQUÉE le 2026-08-28.** Le seul motif était *« le gabarit officiel e-DSF de
l'OTR n'est pas au dépôt »* — le PO a fourni une **DSF définitive réelle** :
`1000745307_2025_Definitif (1).xlsx`, dossier PMS, NIF 1000745307, exercice 2025, **92 feuilles**.

> ### ⚡ Ce que la pièce réelle apporte, mesuré le 2026-08-28
>
> | Constat | Conséquence |
> |---|---|
> | **92 feuilles**, dont **44 de notes** (1→35 avec les A/B/C/bis) | le gabarit existe, case par case |
> | `syscohada-revise@2.1` ne déclare que **11 notes** | ⛔ **STORY-559 est le préalable** — sans elle, 33 feuilles sortent vides |
> | Feuilles hors états : page de garde, fiche conditions, **fiche dépôt**, NAEMA, table des codes, identification 1 & 2, dirigeants, P64→P86, listes clients/fournisseurs | sources hors `bilan-service` — `dossier-service` et balance ventilée |
> | Feuille **« Balance (Optionnel) »** | le dépôt accepte la balance en pièce jointe ⇒ **STORY-555** la produit, **STORY-557** lui donne ses colonnes |
> | Les 2 dernières feuilles rendent **8 contrôles** `VRAI`/`FAUX` ; sur cette pièce le 1ᵉʳ est **`FAUX`** *(Actif 3 060 000 / Passif 0)* | `bilan-service` en produit **4** : ⛔ **l'écart se publie, il ne se comble pas en silence**, et le visa se rend **avant** remise |
>
> ⚠️ **Le classeur note ce qu'on y dépose.** Un produit qui le remplit hérite de son barème.
>
> *(Mesures issues de STORY-558, ouverte par erreur le même jour puis `superseded` — elle
> réinventait le périmètre de cette fiche.)*
**Origine :** arbitrage PO du 2026-08-28 — voie A.

---

## Le fait

C'est la première application concrète de la voie A : produire le fichier que le cabinet dépose à
l'**OTR**. Le produit a déjà tout ce qui précède — la liasse calculée, ses contrôles, sa version
figée, son empreinte.

⛔ **Et il n'a pas la seule chose qui compte ici : le gabarit officiel.** Tant qu'il n'est pas au
dépôt, sourcé et daté, il n'y a **rien à développer et rien à chiffrer honnêtement** — les 13 points
sont une borne, pas une estimation.

## ⚠️ Pourquoi le jalon `format confirmé` n'est pas une formalité, sur CE sujet précisément

Le programme a produit deux erreurs de ce type, et **les deux étaient plausibles** — donc invisibles
à la relecture :

| Erreur | Ce qui était écrit | Ce qui est vrai |
|---|---|---|
| Acomptes d'IS | posés en **trimestriel** (`30-04`…) | `31-01 / 31-05 / 31-07 / 31-10` |
| Retenue sur loyers | **10 %** | **8,75 %** |

⇒ **Une case de formulaire décalée est de la même famille, en pire** : elle passe tous les contrôles
internes du produit — la liasse est juste, l'équilibre tient, l'empreinte est bonne — et elle est
**rejetée au guichet**, ou pire, **acceptée avec des montants dans les mauvaises cases**.

## Critères d'acceptation

- [ ] AC-1 — Le **gabarit officiel de l'OTR** est versé au dépôt, avec sa référence et sa date, et
      packagé selon STORY-536. **C'est l'AC-0 de fait : rien ne commence avant.**
- [ ] AC-2 — Le fichier est généré **depuis une version FIGÉE** de la liasse, jamais depuis un
      brouillon ni depuis un recalcul. ⚠️ `JeuEtatsService.consulter()` recalcule aujourd'hui quel
      que soit le statut (**STORY-449**) : lire la liasse par `GET …/versions/:version`, jamais par
      `GET /etats/:id`.
- [ ] AC-3 — Chaque case du fichier est **traçable jusqu'au poste de liasse** qui l'a alimentée. Un
      dépôt qu'on ne peut pas expliquer case par case n'est pas défendable devant un contrôle.
- [ ] AC-4 — Le fichier porte l'**identité du déclarant** et du **signataire** (nom, n° d'inscription
      à l'ordre) — reprise de FE-081, et **STORY-441** reste le blocage réel : aucune route ne
      résout aujourd'hui un `userId` en nom.
- [ ] AC-5 — ⛔ **Les contrôles bloquants de la liasse sont rejoués avant génération** : on ne
      produit pas un fichier de dépôt depuis une liasse en anomalie. Y compris **STORY-426** (deux
      résultats coexistant), qui est précisément le contrôle nº 2 de l'OTR.
- [ ] AC-6 — La **durée de l'exercice** (STORY-532) est portée : la DSF a sa colonne, et un premier
      exercice de 18 mois est le cas normal d'une entreprise qui démarre.
- [ ] AC-7 — Un jeu de test complet est déposé au dépôt : une liasse connue → le fichier attendu,
      **octet pour octet**. C'est la seule non-régression qui tienne sur un format administratif.

## Notes

- Voir [[STORY-536]], [[STORY-538]], [[STORY-449]], [[STORY-441]], [[STORY-426]], [[STORY-532]], [[FE-081]].
