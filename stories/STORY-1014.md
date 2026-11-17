# STORY-1014 : le référentiel des experts, et l'agrément échu

Status: done

**Complexité :** moyenne (un module neuf dans le service : paramètre figé, fonctions pures, registre sur deux bancs, huit routes)

**Épic :** EPIC-208 (les experts et les missions)
**Dépôt :** `prospera-sinistres-service` (module `expertises`, gate `EXPERTISES_NOT_ENTITLED`) ; manifeste `expertises` dans `prospera-stories`
**Plage :** groupe C, n° 5 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §5) ; ne dépend d'aucune autre story.
Ancrage : FR-177, FR-178 ; annexe A, C3 du module `expertises` (« référentiel des experts et cabinets, agrément et sa date
de fin, mode d'honoraires, capacité, état ») ; `extract-code-demo.md` (type `Expert`).

---

## Pourquoi

Aucune mission d'expertise n'existe encore (la machine d'états FR-61 est une remplaçante du plan). Avant de pouvoir
désigner qui que ce soit, la compagnie doit avoir **la liste des experts et des cabinets qu'elle peut mandater**, avec
la date de fin de leur agrément, et le système doit **refuser** (pas déconseiller) de désigner un expert dont
l'agrément est échu (FR-178). Cette story pose le référentiel, l'agrément daté et son historique, et le jugement de
désignation que la future désignation appellera.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **Experts et cabinets** : une fiche porte genre (expert ou cabinet), nature (interne ou externe), nom, cabinet, domaines (liste paramétrée), zones, téléphone, e-mail, qualification, mode d'honoraires, tarif de référence, délai annoncé, capacité, état actif avec motif, et **l'agrément daté** (numéro, dernier jour, pièce) ; un interne n'a pas d'agrément et ne facture pas | tests du service sur les deux bancs ; paramètre figé par empreinte |
| AC-2 | ⛔ **Un expert à agrément échu n'est pas désignable** : le jugement `exigerDesignable` et la route `POST …/controle-de-designation` rendent 409 `AGREMENT_ECHU` « Agrément échu le AAAA-MM-JJ » (date en détail) ; aussi `AGREMENT_ABSENT`, `EXPERT_INACTIF`, `DOMAINE_NON_COUVERT` ; le dernier jour de validité est encore désignable | tests purs, service (deux bancs), e2e par HTTP ; mutation : la branche « échu » neutralisée fait rougir 4 tests sur leur assertion |
| AC-3 | **L'historique des agréments est gardé** : prolonger exige la pièce justificative et une date qui suit l'actuelle (et pas dans le passé) ; l'agrément précédent reste lisible, la pose est tracée (qui, quand, motif) | tests du service sur les deux bancs (relu après écriture) |
| AC-4 | **Un expert ne se supprime pas** : désactivé (ou réactivé) avec un motif d'au moins 10 caractères, il reste dans la liste et dans l'historique, avec la suite de ses changements d'état ; il n'existe aucune route de suppression | tests ; invariant de routes |
| AC-5 | **Qui voit, qui écrit** : `RESP` et `DT` seuls créent, modifient, désactivent, prolongent (FR-177) ; `DG` et `AUD` lisent tout ; `GEST` ne voit que les experts désignables (les autres lui sont introuvables) ; le rôle exercé doit être porté par le jeton ; verrou optimiste (une fiche modifiée entre-temps : 409) ; cloisonné par organisation | tests ; e2e |
| AC-6 | **Alerte à 60 jours** : l'état de l'agrément (`VALIDE`, `A_RENOUVELER` à 60 jours ou moins, `ECHU`, `ABSENT`, `SANS_OBJET`) se lit dans la liste ; **l'envoi** de l'alerte au `RESP` attend le fait `expertises.agrement.echu@1` et EPIC-220 | test |
| AC-7 | **Manifeste** : toute route de lecture est déclarée en `routesLectureSeule`, aucune écriture ne l'est ; le manifeste est la copie à l'octet de la source amendée (`prospera-stories` 50883fa, PR #630), empreinte mise à jour | invariant de routes ; `pile-du-moteur.invariant.spec.ts` |

## Décisions retenues par défaut (contestables)

- **D-1014-1 — Un seul référentiel, un champ `genre` (`EXPERT` ou `CABINET`).** Le PRD parle de « fiche » pour les deux
  et la démo n'a qu'un type `Expert` ; un cabinet est une fiche de genre `CABINET`, un expert rattaché à un cabinet porte
  son nom dans `cabinet` (texte libre). Possédé par `expertises` (collection `expertises_experts`), jamais par `sinistres`.
  Les garages, prestataires et assureurs adverses de FR-177 ne sont pas dans cette story (écart nommé).
- **D-1014-2 — Un externe sans agrément daté n'est pas désignable (`AGREMENT_ABSENT`).** FR-178 : l'agrément d'un externe
  a une date de fin ; sans date, on ne sait pas qu'il est valide : échec fermé. Un interne n'a pas d'agrément
  (`SANS_OBJET`) et se désigne.
- **D-1014-3 — La date de fin est le dernier jour de validité.** Désignable jusqu'à minuit UTC de ce jour inclus, échu
  le lendemain (« échu le 2027-06-30 » est dit pour le jour où il est jugé échu : la date affichée est la date de fin).
  Les dates sont des jours (`AAAA-MM-JJ`), jamais des instants.
- **D-1014-4 — Un agrément qui échoit après la désignation ne touche pas une mission en cours** (FR-178) : seul le
  jugement fait à la désignation lit l'agrément ; il n'y a rien à défaire sur une mission, il ne la relit jamais.
- **D-1014-5 — Règles de fiche.** Au moins un domaine, tous dans la liste paramétrée (les huit de la démo) ; un interne
  est au mode `SALARIE` (il ne facture pas, FR-179) et un externe ne l'est pas ; tarif, délai, capacité positifs ; zones
  en texte libre (`reseau` est facultatif, annexe C4). La **qualification** (diplôme, inscription, années) est
  enregistrée ; son **contrôle** (art. 272 du Code CIMA) est renvoyé au juriste (D21), comme le dit FR-177.
- **D-1014-6 — Comment on prouve « non désignable » sans mission.** Deux exposés du même jugement pur
  (`jugerLaDesignation`) : (a) `ExpertsService.exigerDesignable(organisation, expert, domaine?, jour?)`, exporté par le
  module, que la désignation de la machine FR-61 appellera avant d'écrire ; (b) `POST /api/v1/expertises/experts/{id}/controle-de-designation`
  (`GEST`, `RESP`, `DT`), sans effet, qui rend 200 ou le refus nommé sur le fil. Le jugement est aussi porté par chaque ligne
  de la liste (`designation.designable`, `designation.refus`), et `?designablePour=<domaine>` ne rend que les désignables.
  Le refus est un **409** (« l'état de l'expert interdit l'acte »).
- **D-1014-7 — Le gestionnaire ne voit que les désignables** (FR-177) : sa liste est filtrée, la fiche d'un non
  désignable lui est introuvable (404), sans historique. `DG`, `AUD`, `RESP`, `DT` lisent tout, historiques compris.
  Le droit se lit dans le jeton par le **rôle exercé**, comme les registres de 1002 ; les droits fins `expertises:*` du
  manifeste (`expertises:expert:gerer`, `expertises:agrement:prolonger`…) restent à poser (même écart que D-993-9).
- **D-1014-8 — Prolonger.** Pièce justificative **obligatoire** (à la création, facultative : liste de départ de la
  compagnie, FR-177) ; la nouvelle date suit l'actuelle et n'est pas dans le passé ; le numéro est repris de l'agrément
  en vigueur s'il n'est pas redonné ; l'agrément en vigueur est le dernier posé, les autres restent dans
  `historiqueDesAgrements`. Un interne n'a rien à prolonger (409 `AGREMENT_SANS_OBJET`). Un expert désactivé peut voir
  son agrément prolongé.
- **D-1014-9 — Paramètre figé `experts-2026.1.json`** (domaines, genres, natures, modes d'honoraires, alerte à 60 jours
  = H-143, longueur minimale du motif = 10), empreinte sha256 testée ; la liste des domaines est un paramètre, comme le
  veut FR-177.
- **D-1014-10 — Manifeste amendé (source, PR #630).** `GET /api/v1/expertises/experts/{expertId}` est ajouté aux
  `routesLectureSeule` ; la liste `GET …/experts` y était déjà (« proposition »), figée avec ses filtres.

## Ce qui a été livré

**2026-11-17** — `prospera-stories` **#630** (manifeste, `main` 50883fa) puis `prospera-sinistres-service` **#19**
(`dev` 3a6964e, un commit rejoué), fusionnées en « Rebase and merge » :

- `src/modules/expertises/experts/` : `experts.ts` (pur : paramètre, `lireLAgrement`, `jugerLaDesignation`,
  `problemesDeLaFiche`, vues), `experts-2026.1.json`, `registre-des-experts.ts` (port, banc mémoire, Mongo : collection
  `expertises_experts`, `SchemaTypes.ObjectId`, verrou optimiste par `replaceOne` sur la version lue),
  `experts.service.ts`, `experts.controller.ts` ; le module exporte `ExpertsService`.
- **Routes** (toutes derrière `EXPERTISES_NOT_ENTITLED`) : `POST /experts`, `PUT /experts/{id}`, `POST /experts/{id}/desactivation`,
  `…/reactivation`, `…/agrement`, `…/controle-de-designation` ; `GET /experts` (filtres `actif`, `designablePour`) et
  `GET /experts/{id}` (déclarées en lecture seule). Refus : `DROIT_INSUFFISANT` (403), `EXPERT_INVALIDE`,
  `PROLONGATION_INVALIDE` (400), `EXPERT_INTROUVABLE` (404), `EXPERT_MODIFIE_ENTRE_TEMPS`, `ETAT_INCHANGE`,
  `AGREMENT_SANS_OBJET`, `AGREMENT_ECHU`, `AGREMENT_ABSENT`, `EXPERT_INACTIF`, `DOMAINE_NON_COUVERT` (409).
- `src/modules/expertises/module.manifest.ts` : copie à l'octet de `prospera-stories` 50883fa ; `sources-des-manifestes.ts`
  met à jour le commit et le sha256 (`7a7bf27b…`).
- **Tests** : 29 purs (`experts.spec.ts`), 14 du service sur les deux bancs (mémoire, MongoDB réel), 2 de l'invariant de
  routes, 5 e2e par HTTP (garde du module, agrément échu → 409 sur le fil puis prolongation, 403/400, lecture seule).
  Mutation : la branche « agrément échu » neutralisée fait rougir 4 tests sur leur assertion.
- **Node 24** (étage `verification`, image construite depuis `git archive`, MongoDB réel en jeu de répliques) : lint 0,
  1056 unitaires (53 suites + 1 sautée : la suite Redis), 24 e2e, build 0. **Rejouée depuis `dev`** (export d'`origin/dev`
  3a6964e, arbre identique à la branche) : mêmes chiffres, du premier coup.
- **Pas de pile** (règle de légèreté du lot 3 : « Docker : non ») : le seul câblage neuf est un modèle Mongoose et un
  fournisseur de plus dans `ExpertisesModule` ; le graphe d'injection (`app.module.injection.spec.ts`) et les invariants
  de câblage passent. ⚠️ Écart nommé : aucun `docker compose up` du service n'a été joué pour cette story.

**Reste**
- **La désignation d'une mission** (machine d'états FR-61) : elle appellera `exigerDesignable` ; la liste de désignation
  classée et la désignation « hors classement » avec motif (FR-178, FR-62) viennent avec elle.
- **L'alerte à 60 jours envoyée au `RESP`** : le fait `expertises.agrement.echu@1` (contrat au manifeste, schéma à écrire
  dans `prospera-plateforme`) et l'envoi par `notification` (EPIC-220, D) ; ici, seulement l'état `A_RENOUVELER`.
- **Les garages, prestataires et assureurs adverses** de FR-177 (analyse de devis, recours, graphe de fraude).
- **Les droits fins `expertises:*`** (PR `auth-service`), le **contrôle des qualifications** (art. 272, juriste) et
  l'**import** de la liste de départ de la compagnie (objet de reprise `expertises.expert@1`, spine de la Reprise).
