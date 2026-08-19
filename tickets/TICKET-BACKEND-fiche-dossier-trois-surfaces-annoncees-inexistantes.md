# TICKET-BACKEND — trois surfaces que la fiche du dossier annonce et que `dossier-service` **n'expose pas**

**Cible :** `dossier-service` (:3009)
**Ouvert par :** **FE-061** (barry thierno alhassane, 2026-08-19) — constat d'**intégration**, vérifié sur l'OpenAPI **vivant** puis dans le contrôleur sur `origin/dev`
**Priorité :** Should — FE-061 est livrée **sans** ces trois volets ; ils ne bloquent pas la fiche, ils la privent de sa moitié « travail »
**État :** ⛔ ouvert

---

## Le constat

`GET :3009/api/docs-json` sert **10 chemins**, et les voici tous :

```
/api/v1/health
/api/v1/dossiers                                       GET · POST
/api/v1/dossiers/{id}                                  GET
/api/v1/dossiers/{id}/affectation                      PATCH
/api/v1/dossiers/{id}/archiver                         POST
/api/v1/dossiers/{id}/reactiver                        POST
/api/v1/dossiers/{dossierId}/axes                      GET · POST
/api/v1/dossiers/{dossierId}/exercices                 GET · POST
/api/v1/dossiers/{dossierId}/exercices/{exId}/clore    POST
/api/v1/dossiers/{dossierId}/exercices/{exId}/rouvrir  POST
```

La fiche de FE-061 en annonçait **trois de plus**. Aucune n'existe :

### 1. `PATCH /dossiers/{id}` — la modification de l'identité

**N'existe pas.** L'onglet Identité de FE-061 est donc livré **en lecture
seule**, alors que sa fiche décrivait une modification avec verrou optimiste.

⚠️ **Et `PATCH /profil-societe` de `balance-service` n'est pas le remplaçant** :
il est *org-keyed*. L'y brancher câblerait l'identité d'une société sur une
ORGANISATION — c'est-à-dire « une org = une société », précisément l'invariant
que le bloc EPIC-043 démonte, et l'arbitrage PO qu'attendent FE-040/041/042.

### 2. `GET /dossiers/{id}/completude` — ce qui manque pour aller à la DSF

**N'existe pas.** (Déjà relevé au réancrage de FE-060, jamais tracé en ticket.)
Le seul `/completude` servi par la plateforme est
`GET :3007/api/v1/profil-societe/completude` — **org-keyed** lui aussi. Le
brancher sur la fiche aurait affiché la complétude **du cabinet** sur l'écran
d'un client.

### 3. Le **bandeau d'attestation de mandat** (date, heure, auteur)

**Non servi en lecture.** `AttestationMandatDto` est un DTO **d'écriture** : D2
en fait une **ligne de journal** horodatée et attribuée, et
`DossierResponseDto` ne publie rien de tel. C'est le même défaut que celui déjà
tracé pour le journal du dossier (STORY-360 → FE-068) : **une écriture sans
lecture ne se signale nulle part**.

## Pourquoi ces trois-là vont ensemble

Elles répondent toutes à la même question — *« ce dossier est-il en état de
produire une DSF, et sur quelle base ? »* — et elles partagent la même cause :
la donnée est **écrite** dans `dossier-service`, mais **relue** nulle part, ou
relue depuis une route qui parle du cabinet.

## Ce qui est demandé

| # | Surface | Forme attendue |
|---|---|---|
| 1 | `PATCH /dossiers/{id}` | Champs d'identité modifiables (D12 : droit **large**, encadré par la traçabilité, **pas** par une liste de champs interdits). Verrou optimiste : soit `If-Match` sur `version`, soit le `409 CONFLIT_CONCURRENT` déjà en place — **mais alors le dire au contrat**, parce que la fiche de story supposait un `412` que le service ne produit pas. |
| 2 | `GET /dossiers/{id}/completude` | Ce qui manque à **ce dossier** pour la DSF. ⚠️ **Une lecture, jamais une garde** : elle ne doit pas empêcher d'ouvrir l'Atelier — la saisie progressive est un choix produit (STORY-079). |
| 3 | Attestation de mandat en lecture | Soit sur `DossierResponseDto` (date, auteur, qualité du signataire, référence), soit via la route de journal de STORY-360. La seconde est préférable : c'est déjà une ligne de journal. |

## Vérification à la reprise

- Un dossier **archivé** refuse le `PATCH` avec `409 DOSSIER_ARCHIVE` (D9) — la
  seule écriture qu'il accepte reste `reactiver`.
- Un dossier hors portée rend **404**, jamais 403, sur les trois surfaces.
- La complétude d'un dossier **sans NIF** le dit, et n'empêche rien.
