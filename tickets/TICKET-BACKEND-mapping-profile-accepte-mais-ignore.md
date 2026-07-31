# TICKET backend — `mappingProfile` accepté mais ignoré sur `POST /balance/import/sage`

> ## ✅ RÉSOLU le 2026-07-30 par **STORY-088** — option A retenue
>
> `mappingProfile` (déclaré, jamais lu) est **remplacé** par **`profilImportId`** (`@IsMongoId`,
> réellement consommé) dans `src/modules/balance/sage/dto/import-sage.dto.ts`. Un **identifiant** et
> non un nom, avec la raison écrite dans le code : « le nom d'un profil est modifiable — un import
> référencé par nom cesserait de fonctionner à la première correction de libellé, et la trace d'audit
> portée par la balance ne désignerait plus rien de stable ».
>
> **Reste à faire côté front :** régénérer les types de `:3007` — porté par **FE-057**.
> Ce ticket est conservé pour la traçabilité ; il ne demande plus rien.
>
> *(Renommé et déplacé de `stories/TICKET-mappingProfile-accepte-mais-ignore.md` vers `tickets/`
> le 2026-07-31 — cf. la convention en tête de `tickets/`.)*

**Type :** correctif de contrat (dette d'API)
**Service :** `balance-service` (:3007)
**Route :** `POST /api/v1/balance/import/sage` (multipart) — adaptateur Sage, **STORY-086**
**Relève de :** **STORY-088** (profil d'import & mapping réutilisable) — soit elle consomme le champ, soit le champ est retiré
**Ouvert par :** FE-025 (écran d'import Sage), 2026-07-25
**Priorité :** Should — un champ accepté et ignoré est un piège pour tout appelant

---

## Le problème

`mappingProfile` est déclaré **à deux endroits** et lu **nulle part** :

1. dans le DTO `ImportSageDto` (propriété du corps multipart) ;
2. dans le décorateur Swagger de la route (`@ApiProperty`), donc **exposé dans l'OpenAPI** de `:3007` et présent dans les types générés côté front.

Vérification (balance-service@origin/dev, relevée à FE-024/FE-025) : les **seules** occurrences de `mappingProfile` dans le service sont ces deux déclarations. Aucun code de l'adaptateur Sage ne le lit ni ne s'en sert pour interpréter le fichier.

## Pourquoi c'est un problème

Un champ **accepté par le contrat mais sans effet** est la pire des interfaces : tout client (front, script d'intégration, autre service) qui l'envoie croit avoir paramétré quelque chose — sans aucune conséquence. C'est un mensonge de contrat, silencieux et durable.

Conséquence côté FE-025 : **aucune UI de mapping n'a été livrée**, et le front **n'envoie jamais** `mappingProfile` (`buildForm` l'omet volontairement). L'UI de mapping appartient à **FE-048** (adossée à STORY-088), pas à l'import Sage de base.

## Résolution attendue (l'une OU l'autre)

- **Option A — le consommer (STORY-088)** : `POST /balance/import/sage` lit `mappingProfile` et applique le mapping `colonne fichier → champ du contrat` avant normalisation. Le mapping ne dispense d'**aucun** contrôle (équilibre, doublons, format de compte restent appliqués — cf. STORY-088). Documenter la forme réelle du champ dans l'OpenAPI (aujourd'hui un `string` opaque).
- **Option B — le retirer** : supprimer `mappingProfile` du DTO **et** du Swagger tant que STORY-088 n'est pas livrée, pour que le contrat ne promette que ce qu'il tient. Le champ réapparaîtra, **typé et consommé**, avec STORY-088.

## Definition of Done

- [ ] Plus aucune occurrence « déclarée mais non lue » de `mappingProfile` dans `balance-service`.
- [ ] OpenAPI de `:3007` régénéré et cohérent avec le comportement réel.
- [ ] FE-048 (UI de mapping) débloquée le jour où l'option A est retenue et livrée.
