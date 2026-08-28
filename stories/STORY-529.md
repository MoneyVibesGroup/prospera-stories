# STORY-529 : Un cabinet ne peut pas créer une deuxième société — `POST /profil-societe` répond 409, et personne n'a jamais ouvert de story

Status: ready-for-dev

**Épic :** EPIC-136 — Multi-société et périmètre de groupe
**Service :** `balance-service` (`profil-societe`) + `dossier-service`
**Points :** 13 · **Sprint :** S20
**Origine :** §6.3 de `analyse-scalabilite-multireferentiel-2026-08-27.md` ; manque nommé dans la maquette depuis longtemps, **jamais fiché**.

---

## Le fait

Trois constats, vérifiés dans le code et non déduits des stories :

1. **`POST /profil-societe` répond `409 PROFIL_SOCIETE_DEJA_EXISTANT`** — index unique sur `orgId`.
   Une organisation ne peut porter qu'**une seule** société.
2. **Il n'y a pas de `societeId` sur la balance.**
3. **Zéro occurrence de « consolidation »** dans tout le produit.

Le `dc-note` de la maquette porte ces trois manques **depuis des mois**, en toutes lettres. ⚡ **Et
aucun n'a jamais eu de story** — c'est le cas le plus net du patron « un manque documenté finit par
se lire comme un manque traité ».

⚠️ Or l'unité de travail est le **dossier** depuis EPIC-043, et un dossier est censé être une
société. Le profil société, lui, est resté keyé sur l'**organisation** : c'est la même
désynchronisation que STORY-422 (le plan) et STORY-533 (l'habilitation), sur un troisième objet.

## Pourquoi c'est structurel

« Gros distributeur » veut presque toujours dire **groupe** : N sociétés, N points de vente, N
patentes, N NIF. Aujourd'hui il faudrait **N organisations** — donc N abonnements, N KYC, N
portefeuilles — pour tenir un groupe que le cabinet voit comme un client.

## Critères d'acceptation

- [ ] AC-1 — Le profil société est keyé sur le **dossier**, pas sur l'organisation. `POST` accepte
      une N-ième société pour une même organisation.
- [ ] AC-2 — La balance porte un **`societeId`** (ou le `dossierId` en tient lieu, si le cadrage
      conclut qu'un dossier = une société — **à trancher explicitement, pas par défaut**).
- [ ] AC-3 — ⚠️ **Migration : chaque profil société existant est rattaché à son dossier**, sans perte
      et sans invalider les balances déjà produites. C'est l'AC le plus délicat.
- [ ] AC-4 — Non-régression : un cabinet à une seule société ne voit **aucun changement**.
- [ ] AC-5 — ⛔ **La consolidation N'EST PAS dans cette story** et est nommée comme telle : elle
      dépend de STORY-530. Livrer le multi-société sans le dire ferait attendre une consolidation
      qui n'arrive pas.

## Notes

- Voir [[STORY-530]], [[STORY-531]], [[STORY-422]], [[STORY-533]] (la même désynchronisation, ailleurs).
