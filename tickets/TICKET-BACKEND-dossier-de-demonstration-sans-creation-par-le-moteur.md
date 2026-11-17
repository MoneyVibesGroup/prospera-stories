# TICKET-BACKEND — le dossier de démonstration n'existe que dans balance : `dossier-service` n'offre aucune création appelable par le moteur

**Cible :** `dossier-service` (tenu par A), puis le jeu `cabinet-demo-togo` (STORY-927)
**Ouvert par :** STORY-928 (A, 2026-11-17), décision D-928-3
**Priorité :** Must avant que la démonstration du cabinet montre un bilan (EPIC-147, essai prospect, 15/01/2027) ; sans effet sur l'import et l'effacement
**État :** 🟡 ouvert

---

## Le constat

Le jeu `cabinet-demo-togo` ne porte aucun identifiant de dossier (`dossierRef`, la clef du dossier dans le jeu). Pour importer sa balance, `balance-service`
a besoin d'un `dossierId` connu de ses projections (`dossiers_dossier`, `axes_dossier`) : le `DossierScopeGuard`, le référentiel du dossier et
l'ingestion ne s'en passent pas.

`dossier-service` ne sait créer un dossier que pour un **membre du cabinet** (jeton d'utilisateur, `POST /api/v1/dossiers`) ; aucune route ne l'admet pour
l'identité de service `MOTEUR` (STORY-948). STORY-928 ne code pas dans `dossier-service` : l'import de `profil-societe` pose donc lui-même, dans balance,
un `dossierId` **dérivé** (sha256 de l'organisation et de `dossierRef`) et les trois projections qui en dépendent.

## Ce que ça laisse de côté

1. **La console et le BFF ne voient pas le dossier de démonstration** : il n'est pas dans `dossier-service`.
2. **`bilan-service` ne le connaît pas** : ses projections (`dossiers_dossier`, `exercices_dossier`…) viennent des événements `dossier.created` et
   `dossier.exercice.ouvert`, que personne n'a publiés. Valider la balance de démonstration envoie `balance.created` à un bilan qui ne sait pas de quel dossier il s'agit.
3. **Aucune fiche de dossier, aucune complétude, aucune portée** (`responsableUserId`, contributeurs) pour ce dossier.

## Ce qu'il faut

- Une route (ou une part du jeu) par laquelle `dossier-service` crée le dossier de démonstration pour l'identité `MOTEUR`, limitée à l'organisation du jeton et à l'espace
  d'essai (même garde que STORY-928 : `INSTANCE_ESPACE=ESSAI`, `JEU_DEMONSTRATION` seulement), avec une clef stable (`dossierRef`), idempotente, qui publie `dossier.created`,
  `dossier.axes.decides` (`SN`/`REEL`) et l'ouverture des exercices 2024 et 2025 ; effacement par la même route C13 que les autres modules (`dossier` n'est pas un
  module commercial : le moteur ne l'appelle pas aujourd'hui, c'est à décider avec B).
- Alors `balance-service` retrouve ce dossier par `dossierRef` au lieu de le dériver ; la dérivation de STORY-928 (`sha256`) devient le repli à retirer.

## À décider avec B (propriétaire du moteur et du contrat du jeu)

Soit une part `dossier` dans le jeu (un module sans manifeste, comme le jeu l'a écarté en D-927-2), soit la création par `dossier-service` à l'ouverture de l'essai,
avant l'import. Recommandation : la seconde, parce que le dossier est du socle (D-927-2) et que l'essai a déjà une organisation à son ouverture.
