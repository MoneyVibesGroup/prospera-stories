# TICKET-BACKEND — `ValeurIndicateurDto` existe deux fois dans bilan-service : l'OpenAPI des indicateurs de dette est faux

> **Ouvert le 2026-11-24 par le groupe A (FE-140).** À prendre par le groupe qui tient `bilan-service` (B, ou la
> session qui reprend STORY-1084). Aucun correctif n'a été fait côté backend par A.

## Constat

Deux classes se nomment `ValeurIndicateurDto` dans `bilan-service` :

- l'analyse financière (STORY-552) : `valeur`, `numerateur`, `denominateur`, `motif`, `verdict`, `motifVerdict` ;
- les indicateurs de dette (STORY-1084, `financement/dto/emprunt-response.dto.ts`) : `rang`, `exercice`, `statut`,
  `valeur`, `motif`.

Swagger range les schémas par nom de classe : il n'en garde **qu'un**. Dans l'OpenAPI vivant de `:3004`
(`GET /api/docs-json`), `IndicateurDetteDto.valeurs` référence `ValeurIndicateurDto` **dans la forme de l'analyse**.
Le type généré pour `GET /dossiers/{id}/financements/{id}/indicateurs` est donc faux : il n'a ni `rang`, ni
`exercice`, ni `statut`.

Le serveur, lui, rend la bonne forme (constat du gate de FE-140, réponse réelle).

## Effet côté front

`gen:api`, `tsc` et le build sont verts, et le type est faux : l'écran ne peut pas se fier au type généré.
FE-140 déclare à la main `ValeurIndicateurDette` (`src/features/financement/api/financement.ts`), avec renvoi à ce ticket.

## Correctif demandé (sans changer le contrat servi)

Renommer l'une des deux classes (par exemple `ValeurIndicateurDetteDto` pour la dette) ou fixer son nom Swagger par
`@ApiExtraModels` / `@ApiSchema({ name })`. Aucun champ, aucune route ne change : ce n'est pas un `@2`.
Test à ajouter : un garde sur l'OpenAPI qui échoue si deux classes portent le même nom de schéma.

## Après le correctif

A régénère `bilan.ts` (`npm run gen:api -- bilan`) et retire `ValeurIndicateurDette` de FE-140.
