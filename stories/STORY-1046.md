# STORY-1046 : la compagnie de démonstration — le jeu de l'assurance et les routes C13 du LC fictif

Status: in-progress

**Épic :** EPIC-204 (le logiciel de compagnie fictif, la compagnie de démonstration et la recette de la démo) ·
**Dépôts :** `prospera-assureur-fictif` (reçu de C au rituel de cette story), `prospera-plateforme` (dossier
`jeux-demonstration/assurance-compagnie-demo-reduite/`) · **Plage :** groupe D, n° 2 du lot 3
(`PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §4). Dépend de la passation de `prospera-assureur-fictif` par C (§5 du plan :
constatée par D au rituel de 1046).

## Pourquoi

STORY-953 (B) a publié le contrat du jeu de démonstration (`jeu-demonstration@1`) et la forme générique des routes C13
d'import et d'effacement (`contrats-instance-v1`) : l'essai d'un prospect s'ouvre avec le jeu de sa verticale, importé
module par module par la partie A, et se termine par un effacement chez chaque propriétaire, avec un certificat signé
(AD-38). STORY-987 (C) a écrit le générateur à graine fixe de la compagnie de démonstration et le chargement par le
LC fictif. Il manque le **jeu de l'assurance au format du contrat** et les **deux routes C13** du module qui le reçoit.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **Le jeu de l'assurance au format `jeu-demonstration@1`**, produit par le générateur de STORY-987 à la graine `20260115`, une part (module `assureur-fictif`), les neuf objets C-1 → C-9 dans l'ordre de dépendance ; le générateur se déclare dans `generateur` (nom, source à une étiquette, graine, paramètres) | `npm run jeu:verifier -- <dossier>` de la plateforme, sous Node 24, pour les deux tailles |
| AC-2 | **Même graine, mêmes octets** : l'empreinte du `jeu.json` de chaque taille (qui porte le sha256 de chaque fichier) est figée dans un test | tests ; deux écritures successives identiques |
| AC-3 | **Par le contrat** : chaque enregistrement est une ligne valide de l'annexe C ; **aucune donnée de santé** (aucun champ de santé du registre `classification-sante`), noms fictifs, la compagnie n'est jamais nommée | tests sur le jeu complet |
| AC-4 | **La route C13 d'import** `POST /api/v1/instance/assureur-fictif/{organisationId}/import` (`routesInstance.import`), au corps exact d'`import-c13-demande@1` et d'`import-c13-reponse@1` : idempotente (`IMPORTE`, puis `DEJA_IMPORTE`), un objet par lot, publié par lots du contrat d'échange (jamais d'écriture directe dans Prospera, AD-19) ; refus nommés | tests unitaires et e2e ; pile `grp-d` |
| AC-5 | **La route C13 d'effacement** `POST /api/v1/instance/assureur-fictif/{organisationId}/effacement`, au corps d'`effacement-c13-demande@1` et d'`effacement-c13-accuse@1` : tout ce que le LC fictif tient de l'organisation est effacé, puis accusé (`EFFACE`) ; **rejouée, `DEJA_EFFACE`** avec la même date ; une autre organisation est intacte | tests ; pile `grp-d` |
| AC-6 | **L'identité de service du moteur seule** passe sur ces routes (jeton de service d'`auth-service`, STORY-948) ; un jeton d'utilisateur, une autre organisation ou une autre identité sont refusés, et un jeton de service n'ouvre aucune autre route | tests e2e |
| AC-7 | Le service démarre : `docker compose -p grp-d up` sain, routes appelées pour de vrai avec le jeu réduit puis le jeu complet | pile `grp-d`, descendue avec ses volumes |

## Décisions retenues par défaut (contestables)

- **D-1046-1 — La passation de `prospera-assureur-fictif` est constatée par D** (plan §5) : au 2026-11-17, aucune PR
  ouverte, dernier commit sur `dev` `78ad10c` (16/11) ; C n'a pas écrit sa passation. C continue de jouer ses parcours
  contre le LC fictif et demande à D toute modification.
- **D-1046-2 — Le jeu de l'assurance est importé dans le LC fictif, pas dans Prospera.** Sa part unique est le module
  `assureur-fictif` : la partie A appelle sa route C13, le LC fictif publie les lignes par lots du contrat d'échange, et
  `liaison-assureur` les relève comme celles d'un vrai LC (AD-19 : « par le contrat, jamais par écriture directe »). Le
  manifeste déclarait déjà les deux routes (`routesInstance`).
- **D-1046-3 — Deux tailles, deux codes, le même générateur.** `assurance-compagnie-demo` (la taille de la démo, FR-15)
  et `assurance-compagnie-demo-reduite` (la taille réduite de STORY-987, même couverture des statuts, pour les preuves
  du moteur et les essais rapides). Le jeu complet pèse ~80 Mo (le fichier des garanties seul ~57 Mo, au-dessus du
  seuil d'alerte de GitHub) : il **n'est pas versionné**, il se **produit** à l'octet par
  `npm run jeu:ecrire -- <dossier> DEMO` dans `prospera-assureur-fictif`, et son empreinte est figée par un test. Le jeu
  réduit (~2 Mo) est versionné dans la plateforme.
- **D-1046-4 — Le dossier `jeux-demonstration/<code>/` d'un jeu de verticale est à son propriétaire.** Le README de B
  ne lui réserve que `jeux-demonstration/temoin/` et dit « les jeux des verticales viennent de leurs propriétaires » :
  D y ajoute `assurance-compagnie-demo-reduite/` (données seules, aucun `.ts`, aucun fichier de B). Information à B pour
  la ligne du tableau du README.
- **D-1046-5 — Le personnel et les quatre scénarios ne sont pas des parts du jeu.** Ce ne sont pas des objets du LC :
  ils entreront avec les modules qui les portent (rôles, circuit : EPIC-202, EPIC-205, chez C), par leur propre route
  C13. Les sinistres des scénarios `SIN-2026-9001` → `9004` sont déjà dans `sinistre-existant`.
- **D-1046-6 — Les routes C13 sont hors de la garde du module et n'admettent que l'identité `MOTEUR`** (contrat C2,
  patron du catalogue, STORY-948). Un jeton d'utilisateur : 403 `IDENTITE_DE_SERVICE_REQUISE` ; un jeton d'une autre
  organisation : 403 `ORGANISATION_HORS_JETON` ; un jeton de service sur toute autre route : 403
  `IDENTITE_DE_SERVICE_REFUSEE` ; une identité inconnue : 401 `JETON_DE_SERVICE_INVALIDE`. Pas de limite de débit par
  adresse sur ces routes : la partie A en appelle des centaines d'affilée pour le jeu complet.
- **D-1046-7 — L'import** : le corps est validé contre la copie à l'octet d'`import-c13-demande@1` (étiquette
  `contrats-instance-v1`) ; seuls les objets C-1 → C-9 s'importent (422 `OBJET_NON_IMPORTABLE`) ; chaque ligne est
  validée par l'annexe C, et une ligne fausse refuse le lot entier (422 `ENREGISTREMENT_INVALIDE`, avec son rang et le
  code de C.4). Idempotence par organisation et clef, avec l'empreinte du lot : même clef et même lot ⇒ `DEJA_IMPORTE` ;
  même clef et autre lot ⇒ 409 `IDEMPOTENCE_REUTILISEE`.
- **D-1046-8 — L'effacement** : tout ce que le LC fictif tient de l'organisation (objets, lots, journal des reçus,
  numéros, réglages, état clos, registre des imports C13, et les fichiers qu'il a écrits dans
  `<racine>/<organisation>/entree`). Le répertoire `sortie` est écrit par `liaison-assureur` et s'efface par son
  propriétaire. Le registre des effacements ne garde que l'organisation, la date et le décompte. Rejouée sur une
  organisation déjà effacée, la route rend `DEJA_EFFACE` avec le premier `effaceLe` ; si des données sont revenues
  entre-temps, elle les efface et accuse `EFFACE` à la nouvelle date. `effaceLe` est lu sur l'horloge de l'essai
  (AD-18).
- **D-1046-9 — Le générateur se déclare à l'étiquette `jeu-assurance-v1` de la plateforme**, posée par D sur le commit
  fusionné ; la copie de `prospera-assureur-fictif` reste à l'octet (sha256 `a2f3edbd…`).

## Ce qui a été livré

*(à la fin de la story)*
