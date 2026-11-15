# STORY-932 : Le contrat d'état publié

Status: done

**Complexité :** moyenne (un contrat lu par tout le programme ; aucune logique de service)

**Épic :** EPIC-142 (un contrat d'état publié stable, et un socle prêt pour le moteur)
**Dépôt :** `MoneyVibesGroup/prospera-platform-catalog-service`
**Plage :** groupe B, n° 3 du lot de B (`coordination/PLAN-4-SESSIONS-2026-11-14.md` §4).

---

## Pourquoi

La coque, l'app expert-comptable, l'app mobile et la garde de chaque module se construisent sur **un seul état
publié** (PRD moteur FR-34, spine du moteur AD-24). Le jalon du plan : **le contrat est figé et étiqueté au plus tard le
11/12**, et tout le reste du programme le lit. Le calcul et la vraie route arrivent avec STORY-936 ; la doublure de la
coque (spine de la coque AD-23) est générée depuis ces fichiers.

## Ce qui doit être vrai à la fin (plan §4, n° 3)

| Exigence | Fait |
|---|---|
| `contrat/etat-publie.openapi.json` et `contrat/matrice-etats.json`, versionnés | oui (`schemaEtatPublie: 1`, `versionMatrice: 1`), plus `contrat/schemas/etat-publie.changed.json` pour l'événement |
| Ajouts seulement une fois figés | oui : écrit dans l'OpenAPI, la matrice et le README ; étiquette `contrat-etat-publie-v1` posée à la fusion |
| Annoncé dans le journal de B | oui, section « ⚠ Contrats », avant la fusion |
| Relu par A avant d'être figé | oui : relecture indépendante (verdict « figeable après corrections bloquantes »), 4 bloquants corrigés ; verdict au journal de A |

## Ce qui a été livré

1. **`contrat/etat-publie.openapi.json`** (OpenAPI 3.0.3) : `GET /etat-publie/{organisationId}`, chemin public
   `/api/instance/v1`, chemin du service `/api/v1`. La lecture rend :
   - l'instance (espace, hébergement, gel, version figée, version de plateforme, heure de référence et son statut, fuseau,
     retour arrière en cours, mise à jour annoncée) ;
   - chaque module (code, libellé, état parmi neuf, dates affichées, faits du droit, version, `acquis`, `retourArriere`,
     interrupteurs, santé, raison de la suspension, droits déclarés) ;
   - l'appelant (`droitsEffectifs`, `estAdministrateur`, `estDG`) et l'accueil.

   Réponses : 401 ; 403 `ORGANISATION_HORS_JETON` ; 404 `ORGANISATION_INCONNUE` ; 503 `HORLOGE_INDISPONIBLE` (aucun instant
   connu au démarrage).
2. **`contrat/matrice-etats.json`** :
   - par état : la projection sur le droit au catalogue, les droits effectifs, le menu (visible, écriture, écran d'une URL
     saisie, export dans l'Administration, bandeau, date et destinataires) ;
   - la **garde** : 16 sortes de route × 4 identités (`UTILISATEUR`, `MOTEUR`, `REPRISE`, `CONNECTEURS`), une cellule
     `{ouvertA, refus}` par état, ou `{parEspace}` quand l'espace décide (Reprise et import en `EN_INSTALLATION`,
     rafraîchissement en `EN_SERVICE`) ;
   - les bandeaux transverses (santé, gel, version figée, changement à venir, mise à jour annoncée, retour arrière) ;
   - **33 cas de calcul** : entrée (espace, installation, droit, heure de référence, horloge du serveur) → état attendu.
3. **`contrat/schemas/etat-publie.changed.json`** (draft-07, fermé) : même définition d'un module que la route ;
   `eventId` (`<espace>:<instanceId>:` + clef), `numero` croissant, `epoque`, `versionMatrice` requis. Sujets du registre :
   `etat-publie.changed.essai-value` et `.reel-value` (`scripts/schemas/registre.mjs`, table `TOPICS_PAR_TITRE`).
4. **`src/contrat/etat-publie.contrat.spec.ts`** (26 tests) :
   - les mêmes neuf états partout ; une seule définition d'un module ;
   - menu ⇔ garde (FR-34) ; export ⇔ Administration ; droits effectifs ⇔ module visible (FR-35) ;
   - export ouvert partout sauf `NON_INSTALLE` (FR-43) ; `ABONNEMENT_EXPIRE` en `LECTURE_SEULE` seulement ;
   - chaque état atteint par un cas ; les cas obligatoires de l'addendum §A-2.

   Mutation : rendre `SUSPENDU` visible au menu fait rougir le test.
5. **README** du catalogue : section « Contrats publiés ».

## Décisions

- **D-932-1 — OpenAPI 3.0.3, pas 3.1.** Le sous-ensemble de schéma de la 3.0 reste proche de draft-07 (AD-26) ; la coque
  génère ses types par `openapi-typescript`, qui lit les deux.
- **D-932-2 — Un refus a deux codes.** `{MODULE}_NOT_ENTITLED` partout (C2), sauf `ABONNEMENT_EXPIRE` pour une écriture en
  `LECTURE_SEULE` (FR-43). Une identité qui n'est pas admise sur une sorte de route reçoit le refus de la cellule.
- **D-932-3 — Les cellules que les sources ne dictent pas, choisies fermées :**
  - `verification` n'est ouverte qu'en `EN_INSTALLATION` (C2) ;
  - `import` est ouvert au moteur et à la Reprise en `EN_INSTALLATION` du **réel** (rejeu du dossier), et au moteur seul en
    `EN_SERVICE` de l'**essai** (rafraîchissement, FR-10, AD-15) ;
  - `sante` est toujours ouverte au moteur (la santé ne ferme rien) ; `effacement` partout sauf `NON_INSTALLE` ;
  - `echange-en-attente` suit la lecture.
- **D-932-4 — Les combinaisons incohérentes ferment :**
  - `INSTALLE` sans droit donne `NON_INSTALLE`, avec un droit `REVOKED` `DESINSTALLE` ;
  - un droit qui porte `essai` dans le **réel** donne `NON_INSTALLE` ;
  - un terme `ECHEANCE` sans date donne `LECTURE_SEULE` (jamais `SUSPENDU` : un impayé ne suspend pas) ;
  - `ESSAI_TERMINE` tient au-delà d'`effacementLe` jusqu'à l'effacement effectif (l'export reste ouvert).
- **D-932-5 — `preavisJusquau` absent vaut `echeanceLe + 30 jours`** (droits écrits avant le moteur).
- **D-932-6 — `ORGANISATION_HORS_JETON` vaut aussi pour un membre** (claim `org`), pas seulement pour une identité de
  service.
- **D-932-7 — Schémas fermés pour le producteur, lecteurs tolérants.** Un champ hors contrat rougit le test du producteur ;
  un consommateur ignore ce qu'il ne connaît pas (C12, point 2) et lit un état inconnu comme `NON_INSTALLE`.

## Relecture avant figeage

Faite par un relecteur indépendant, sur les sources (PRD moteur §3.1, FR-34, FR-35, FR-43, addendum §A-2 ; C2, C8, C13 ;
spines du moteur et de la coque). Corrigé avant la fusion :

1. l'export dans l'Administration en `EN_INSTALLATION` (il contredisait la garde) ;
2. le motif d'un code de module, aligné sur celui du catalogue (`^[a-z][a-z0-9-]*$`) ;
3. le cas sans heure connue : 503 `HORLOGE_INDISPONIBLE` ;
4. la règle du calcul écrite en entier (essai dans le réel, combinaisons incohérentes).

Ajouté sur sa recommandation : `numero` et `versionMatrice` requis dans l'événement, la raison d'une suspension, les faits
du droit (`preavisJusquau`, `essai`), les bandeaux transverses, trois sortes de route (`sante`, `effacement`,
`echange-en-attente`) et cinq cas.

## Suite

- STORY-936 : le calcul qui rejoue les 33 cas et la vraie route.
- STORY-933 : les tâches BullMQ qui émettent `etat-publie.changed` à l'heure dite.
