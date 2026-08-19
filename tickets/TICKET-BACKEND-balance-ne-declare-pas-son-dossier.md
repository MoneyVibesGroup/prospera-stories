# TICKET-BACKEND — une balance servie ne **déclare pas** le dossier auquel elle appartient

**Cible :** `balance-service` (:3007)
**Ouvert par :** **FE-063** (barry thierno alhassane, 2026-08-19) — constat d'**intégration**, pas de maquette
**Priorité :** Should — le front n'est pas bloqué, mais il perd toute possibilité de **vérifier** ce qu'il affiche
**État :** ⛔ ouvert

---

## Le constat

STORY-236 a rendu le `dossierId` **obligatoire en entrée** : les 22 contrôleurs
de donnée de dossier vivent sous `/dossiers/:dossierId/…`, le `DossierScopeGuard`
le valide, le résout et le pose sur les écritures.

En **sortie**, il n'apparaît nulle part. Relevé sur l'OpenAPI réel du 2026-08-19 :

```ts
BalanceResponseDto: {
  id, orgId, exercice, source, referentiel, version, horodatage,
  checksum, checksumVersion, lignes, sommaire, statutPreuve,
  annotationRisque?, etat, horodatageValidation?
}
// ⇒ `orgId` est déclaré. `dossierId` ne l'est pas.
```

L'asymétrie est le sujet : **`orgId` — la portée qui n'est plus l'unité de
travail — est publié ; `dossierId` — celle qui l'est devenue — ne l'est pas.**

## Pourquoi ça compte, et pourquoi ce n'est pas cosmétique

Le front ne peut **pas** recouper qu'une balance reçue appartient bien au dossier
ouvert. **La seule chose qui rattache une réponse à un dossier est l'URL qui l'a
demandée** — c'est-à-dire une propriété de la requête, pas une propriété de la
donnée.

Concrètement, ces trois situations sont **indiscernables** pour un client :

1. la réponse vient du bon dossier ;
2. la réponse vient d'un autre dossier (proxy, cache, stub de test mal ancré,
   régression de routage) ;
3. la réponse est un agrégat tous-dossiers-confondus.

Or c'est **exactement** le risque nº2 du ticket
`dossier-client-entite-de-premier-rang` : « les écrans affichent silencieusement
le mauvais dossier » — un défaut qui ne lève **aucune** erreur.

⚠️ **Et le cas n'est pas théorique : FE-063 l'a rencontré dans son propre
outillage.** Le stub e2e de `dossier-service` interceptait `**/api/v1/dossiers**`
— un motif de chemin, sans origine — et depuis STORY-236, `balance-service` sert
toute sa surface sous ce même chemin. Le stub répondait **une liste de dossiers à
une demande de balances**, en `200`, avec un JSON valide. Aucun contrôle côté
client ne pouvait le détecter : il n'y a rien dans le corps à confronter.

## Ce que ça coûte au front aujourd'hui

FE-063 a dû faire de la **construction d'URL** le point de contrôle unique — une
garde statique (`scope-dossier.guard.test.ts`) qui lit les sources et refuse tout
chemin de donnée de dossier écrit hors de `cheminDossier()`. C'est une bonne
garde et elle reste utile, mais elle protège l'**émission** de la requête ; elle
ne peut rien dire de ce qui **revient**.

Un `dossierId` en sortie permettrait la vérification que le front ne peut pas
faire : ignorer (ou signaler) toute balance dont le dossier ne correspond pas à
celui affiché — une défense en profondeur alignée sur le principe déjà retenu
pour l'`orgId`.

## Demande

1. **Publier `dossierId` sur `BalanceResponseDto`** (et, par cohérence, sur les
   DTO de réponse des autres familles re-scopées : `imports`, `cahiers/*`,
   `rejets`, `rapprochement`…). Le champ existe déjà en base — STORY-236 le pose
   sur les écritures et l'a rendu `required` au schéma sur 7 collections.
2. ⚠️ **Ne PAS l'inclure dans le checksum.** Le sceau ne couvre que le contenu
   métier (`balance.checksum.ts`) ; l'y ajouter ferait diverger le recalcul
   serveur et refuserait en `400` **toute** balance soumise par un adaptateur.
   Le publier en **sortie** n'est pas le sceller.
3. Préciser au passage le cas de `balance.submitted` (adaptateur externe du hub
   D13) : STORY-236 le laisse « point ouvert ». Une balance arrivée par cet
   événement portera-t-elle un `dossierId` — et lequel ?

## Contexte

- Découvert en écrivant la garde de l'AC-1 de FE-063 : la question « peut-on
  vérifier après coup ? » s'est posée, et la réponse est non.
- Rapproché de `TICKET-BACKEND-objets-imbriques-non-types-dans-l-openapi.md`
  (même dépôt, même famille : ce que le serveur sait et ne publie pas).
