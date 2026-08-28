# STORY-537 : Le fichier e-DSF Togo — le premier pays, et le jalon `format confirmé` est la story

Status: blocked

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service` + `bilan-service`
**Points :** 13 · **Sprint :** S20
**Prérequis :** **STORY-536** (le contrat de paquet de dépôt)
**Bloquée par :** ⛔ **le gabarit officiel e-DSF de l'OTR n'est pas au dépôt.** C'est le seul blocage, et il n'est pas technique.
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
