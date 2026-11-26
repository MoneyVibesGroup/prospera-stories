# STORY-1139 : les repères des seize indicateurs de l'analyse financière, sourcés et modifiables (Q-D-14)

Status: in-progress

**Plan :** `coordination/PLAN-LOT-7-2026-11-24.md` §4 bis (amendement du 26/11), n° **5b** · **Dépôt :**
`prospera-bilan-service` (tenu par D jusqu'au prochain plan ; `origin/dev` au départ : `65eecdc`, STORY-1138) · **Plage :**
groupe D, `STORY-1139 → 1141` (réservées le 26/11 ; 1139 s'en détache en entrée propre) · **Dépend de :** STORY-1076 ✅
(les trois repères BCEAO, D-1076-1 → 8), STORY-1077 ✅ (l'alerte, Q-D-16 : lecture stricte, inchangée ici).
**Sources :** réponse de l'utilisateur du 25/11 à **Q-D-14** (journal de D, « Questions ») : « chercher sur le web les seuils
des seize autres indicateurs, modifiables ensuite. Chaque seuil trouvé porte sa source ; un seuil introuvable reste sans
repère ; les seuils doivent pouvoir être modifiés après coup, sans version neuve du moteur, et la modification doit être
tracée. » ; `stories/STORY-1076.md` (D-1076-1 : un repère n'entre que sur **la même formule** ; D-1076-8 : la capacité de
remboursement par l'EBE) ; `stories/STORY-552.md` (les 19 indicateurs, leurs formules) ; `stories/STORY-553.md` (le
contenant `seuils`, la garde de packaging). **Code relu** (`origin/dev` `65eecdc`) : `bilan/analyse/` (`analyse.regles.ts` :
les formules ; `analyse.seuils.ts` : l'appréciation ; `analyse.service.ts`, `analyse.controller.ts`, `analyse.types.ts`),
`referentiel/seuils-vocabulaire.json`, `scripts/referentiels/gardes-analyse.mjs` (bornes contiguës, ordre selon `sens`),
`mapping-override/` (le patron d'une surcharge par dossier, tracée), `common/database/dossier-scoped.repository.ts`,
`instance-c13/plan-d-effacement.ts` et `plan-d-export.ts`, `dossier-scope.invariant.spec.ts`,
`analyse.agnosticisme.spec.ts`.
**Rituel (2026-11-26) :** aucune demande neuve à D chez A et B ; **← C : `cnss.collecte` servie** (STORY-317 : balance #171
`44be0c1`, copie fiscal #69 `8f6b1ba`) — notée au journal ; 319 et 325 de C non fusionnées (C fait 318) : D reste sur
5b → 5d. `bilan-service` : aucune PR ouverte, `origin/dev` `65eecdc`, deux brouillons non suivis connus (`cr-map.txt`,
`cr-postes.txt`), laissés.

## « Fini quand » (plan)

« Chaque seuil trouvé sur le web porte sa source citable ; un seuil introuvable reste « aucun repère déclaré » ; les
seuils se modifient après coup sans nouvelle version du moteur, et chaque modification est tracée (qui, quand, avant,
après, source). »

**Tenu ainsi (D-1139-1) :** la recherche (ci-dessous, faite le 2026-11-26) ne trouve **aucune** source qui fixe une norme
sur la même formule que l'un des seize indicateurs : les seize gardent « aucun repère déclaré », chacun avec sa raison
écrite. Aucun chiffre n'est inventé ni transposé. Les repères deviennent **modifiables par dossier**, sans livraison : le
cabinet (`TENANT_ADMIN`) déclare, retire ou rend au paquet le repère d'un indicateur, avec sa source et son motif, et
chaque changement entre dans un **journal append-only** (qui, quand, avant, après, source, nature, motif). L'analyse
applique le repère du dossier à la place de celui du paquet, et dit d'où vient celui qu'elle applique.

## La recherche des sources (2026-11-26)

**Règle (D-1076-1, reprise) :** un repère ne vaut que si sa source porte une norme **sur la même formule** que
l'indicateur publié (`analyse.regles.ts`). Ordre des sources : BCEAO / Commission bancaire UMOA / BOAD, OHADA-SYSCOHADA,
INSEED ou administrations de l'UEMOA, puis guides reconnus (« repère d'usage, non réglementaire »). Seul ce qui a été lu
sur la page est cité ; aucune valeur de mémoire.

### Sources lues

| # | Source | Émetteur, date | Lu (2026-11-26) | Ce qu'elle fixe |
|---|---|---|---|---|
| S1 | « Procédure relative à la révision des modalités de mise en œuvre du dispositif des accords de classement pour les entreprises non financières », annexe de l'avis sur le dispositif des accords de classement — `https://www.bceao.int/sites/default/files/inline-files/ANNEXE_Avis%20sur%20le%20dispositif%20des%20accords%20de%20classement.pdf` | BCEAO, mars 2020 | en entier (texte extrait du PDF, 20 pages) | **Quatre ratios de décision seulement** : « L'analyse du risque s'effectue sur la base de l'appréciation des quatre ratios de décision, à savoir le ratio de liquidité générale, le ratio de capacité de remboursement, le ratio du taux de marge nette (rentabilité) et le ratio d'autonomie financière » (§ II.2, p. 15-16 ; les « autres critères » sont les incidents de la Centrale des incidents de paiement et le défaut sur le crédit). Pour le système minimal de trésorerie, le résultat net est « l'unique ratio de décision » (§ I, p. 3). Aucun autre ratio chiffré. Les trois qui portent sur nos formules sont déjà au paquet (STORY-1076) ; la capacité de remboursement porte sur la CAFG (D-1076-8). |
| S2 | « Guide d'application du SYSCOHADA » — `https://www.ohada.com/uploads/actualite/3504/Guide-d-application-du-SYSCOHADA.pdf` | OHADA (ohada.com) | par recherche dans le texte extrait (19 045 lignes) | **Aucun ratio d'analyse financière** (ni « ratio », ni fonds de roulement normé, ni BFR). La section « Délais de règlement » (chap. 4, section 5) traite de l'escompte de règlement, sans délai maximum. |
| S3 | « Qu'est-ce que le ratio d'endettement et comment le maîtriser ? » — `https://www.lesclesdelabanque.com/entreprise/ratio-endettement/` | Les clés de la banque (site pédagogique de la profession bancaire française, logos AFB / FBF), 21/01/2026 | la page | La norme « Ratio inférieur à 1 : un indicateur de solidité » est donnée pour **le** ratio d'endettement de la page, dont la formule est « Total des dettes / Total de l'actif ». La variante « Dettes financières / Capitaux propres » est listée **sans norme propre**. « Dette / EBITDA » : « norme généralement entre 2 et 4 ans », selon le secteur, sans dire quelle dette (brute ou nette). |
| S4 | « Le ratio de liquidité : un indicateur clé pour la santé financière de votre entreprise » — `https://www.lesclesdelabanque.com/entreprise/ratio-liquidite/` | Les clés de la banque, 10/09/2025 | la page | Trois formules (générale, réduite : (actif court terme − stocks) / passif court terme, immédiate : trésorerie / passif court terme), puis des seuils (« inférieur à 1 », « entre 1 et 2 », « supérieur à 2,5 ») sous « Comment interpréter ces ratios ? », **sans dire auquel des trois** ils s'appliquent ; aucun repère propre à la réduite ni à l'immédiate. |
| S5 | « Comment calculer le Besoin en Fonds de Roulement (BFR) pour gérer ma trésorerie ? » — `https://www.lesclesdelabanque.com/entreprise/fonds-de-roulement/` ; « Fonds de roulement (FR) et Besoin en fonds de roulement (BFR) … » — `https://www.lesclesdelabanque.com/entreprise/besoin-fonds-roulement/` | Les clés de la banque, 11/02/2026 et 14/11/2025 | les pages | BFR positif, nul (« équilibre idéal »), négatif : trois **situations**, aucune norme ; « FR négatif » décrit sans formule du fonds de roulement net global ni seuil. |
| S6 | « Le délai clients » — `https://www.lesclesdelabanque.com/entreprise/le-delai-clients/` ; « Délais de paiement de mes clients professionnels … » — `https://www.lesclesdelabanque.com/entreprise/delais-de-paiement/` | Les clés de la banque, 06/06/2017 et 24/08/2026 | les pages | Formule « (Créances clients TTC / Chiffre d'affaires TTC) x 360 » ; les délais de 30, 45 fin de mois et 60 jours sont **la loi française** sur les délais de paiement contractuels, pas une norme du ratio. |

**Recherches sans texte citable** (moteur de recherche, 2026-11-26) : un texte de l'UEMOA sur les délais de paiement entre
entreprises (aucun ; la directive n° 08/2002/CM/UEMOA porte sur la bancarisation) ; un délai de paiement fixé par l'Acte
uniforme OHADA relatif au droit commercial général (non trouvé) ; des ratios sectoriels de la Centrale des bilans de
l'UMOA (aucune publication par secteur trouvée) ; les critères chiffrés du dispositif de soutien au financement des
PME/PMI de la BCEAO (aucun texte lu ne chiffre un ratio) ; une norme de fonds de roulement ou de trésorerie nette dans un
texte de la zone (aucune ; les guides français se contredisent : certains disent le FR « toujours positif », d'autres
non).

### Le tableau des seize

Nature : aucune ligne n'est retenue ; « Valeur, sens » est donc vide partout. Date de consultation : 2026-11-26.

| Indicateur (formule publiée) | Repère | Raison |
|---|---|---|
| `ENDETTEMENT` — dettes financières / capitaux propres | aucun repère déclaré | S3 rattache « inférieur à 1 » à total des dettes / total de l'actif ; la variante financière n'a pas de norme propre. Rien dans S1, S2. |
| `CAPACITE_REMBOURSEMENT` — dettes financières / EBE, en années | aucun repère déclaré | S1 : ≤ 4 sur dettes financières / **CAFG** (D-1076-8). S3 : « dette / EBITDA, 2 à 4 ans selon le secteur » : une fourchette, une dette non précisée (brute ou nette). |
| `LIQUIDITE_REDUITE` — (actif circulant − stocks + trésorerie-actif) / (passif circulant + trésorerie-passif) | aucun repère déclaré | S4 : seuils non attribués à un ratio ; les appliquer à la réduite serait choisir à la place de la source. |
| `LIQUIDITE_IMMEDIATE` — trésorerie-actif / (passif circulant + trésorerie-passif) | aucun repère déclaré | Idem S4 ; aucun repère propre. |
| `TAUX_MARGE_COMMERCIALE` — marge commerciale / ventes de marchandises × 100 | aucun repère déclaré | Aucune source ; grandeur propre au secteur. |
| `TAUX_VALEUR_AJOUTEE` — valeur ajoutée / chiffre d'affaires × 100 | aucun repère déclaré | Aucune source ; grandeur propre au secteur. |
| `TAUX_EBE` — EBE / chiffre d'affaires × 100 | aucun repère déclaré | Aucune source ; grandeur propre au secteur. |
| `ROE` — résultat / capitaux propres × 100 | aucun repère déclaré | Aucune source chiffrée. |
| `ROA` — résultat / total de l'actif × 100 | aucun repère déclaré | Aucune source chiffrée. |
| `BFR` — actif circulant − passif circulant | aucun repère déclaré | S5 : trois situations décrites, aucune norme (un BFR négatif est normal dans certains métiers). |
| `FRNG` — capitaux propres + dettes financières et ressources assimilées − actif immobilisé | aucun repère déclaré | S5 sans formule ni seuil ; les guides se contredisent sur le signe. |
| `TRESORERIE_NETTE` — trésorerie-actif − trésorerie-passif | aucun repère déclaré | Aucune norme écrite (S5 la définit comme FRNG − BFR, sans seuil). |
| `DIO` — stocks / achats consommés × jours | aucun repère déclaré | Aucune source ; grandeur propre au secteur. |
| `DSO` — créances clients / chiffre d'affaires (HT) × jours | aucun repère déclaré | S6 : autre formule (CA TTC, 360 jours) ; les 60 jours sont un délai contractuel de la loi française. Aucun texte de l'UEMOA ni de l'OHADA trouvé. |
| `DPO` — dettes fournisseurs / achats × jours | aucun repère déclaré | Idem S6. |
| `CYCLE_EXPLOITATION` — DIO + DSO − DPO | aucun repère déclaré | Ses composantes n'en ont pas. |

Les trois repères de STORY-1076 (`POIDS_CAPITAUX_PROPRES` ≥ 20 %, `LIQUIDITE_GENERALE` ≥ 1, `MARGE_NETTE` ≥ 0, BCEAO,
S1) restent au paquet, inchangés.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|---|---|---|
| AC-1 | Le contrat est annoncé avant le code (« ⚠ Contrats » du journal de D) : trois routes, une collection (plans C13), deux champs de `seuilApplique` | PR de docs d'annonce, fusionnée avant le code |
| AC-2 | `PUT …/analyse/reperes/{indicateur}` (`TENANT_ADMIN` seul) déclare un repère (`DECLARE` : `sens`, `bornes`, `source`, `nature` exigés), le retire (`SANS_REPERE`) ou le rend au paquet (`PAQUET`), avec un `motif` toujours exigé ; les bornes passent les règles de la garde de packaging (contiguës, toute la droite, niveaux connus et ordonnés selon `sens`) — sinon `422 REPERE_INVALIDE`, rien d'écrit | unitaires de la validation (pure) ; service ; e2e |
| AC-3 | Chaque changement est **une entrée append-only** : organisation, dossier, indicateur, version (1, 2, …), `par`, `le`, `avant` (l'entrée précédente, `null` pour la première : le paquet), `apres`, `source`, `nature`, `motif` ; aucune route ne modifie ni n'efface une entrée | spec du dépôt ; e2e (`GET …/journal`) |
| AC-4 | Deux changements concurrents sur la même version : **un seul** passe, l'autre `409 REPERE_CONCURRENT` (index unique sur la version) ; une `versionAttendue` périmée ⇒ `409` ; un changement qui ne change rien ⇒ `422 REPERE_INCHANGE` | service ; e2e (vrai MongoDB en mémoire) |
| AC-5 | L'analyse (`GET …/analyse`, `POST …/analyse/dry-run`) applique le repère du dossier : `DECLARE` ⇒ verdict contre ses bornes, `seuilApplique.origine: 'DOSSIER'`, `repereDossier { version, nature, modifieLe }` ; `SANS_REPERE` ⇒ `AUCUN_REPERE_DECLARE` même si le paquet en porte un ; `PAQUET` ou rien ⇒ le paquet, `origine: 'PAQUET'`, `repereDossier: null` ; N et N-1 jugés par le même repère | `analyse.seuils.spec.ts` ; service ; e2e |
| AC-6 | Portée : le repère d'un dossier ne touche aucun autre dossier ni aucune autre organisation ; un `TENANT_USER` lit, ne modifie pas (`403`) ; le gate et l'état publié s'appliquent (écriture refusée en lecture seule) | e2e |
| AC-7 | Les seize indicateurs restent « aucun repère déclaré » au paquet ; les trois repères BCEAO sont inchangés ; aucun paquet ne bouge (empreintes identiques) | specs reprises (`analyse.seuils-livres`) ; `git status` |
| AC-8 | C13 : la collection est au plan d'effacement (par `tenantId`) et au plan d'export ; les invariants le prouvent | `plan-d-effacement.invariant`, `plan-d-export.invariant`, `export-c13` |

## Contrat (annoncé avant le code)

Toutes les routes sont nichées sous le dossier (`@RequiresDossierScope`), gardées `@RequiresBilanAccess` (e-mail vérifié,
KYC, droit `bilan` ; état publié : une écriture est refusée en lecture seule), sous `/api/v1`.

- **`GET /dossiers/{dossierId}/bilan/analyse/reperes`** — `TENANT_ADMIN` | `TENANT_USER`. 200
  `{ reperes: RepereDossier[] }`, les 19 indicateurs dans l'ordre de publication :

```
RepereDossier {
  indicateur: CodeIndicateur,
  version: number,                      // 0 : jamais modifié pour ce dossier
  statut: 'PAQUET' | 'DECLARE' | 'SANS_REPERE',
  sens: 'PLUS_HAUT_MIEUX' | 'PLUS_BAS_MIEUX' | null,     // DECLARE seulement
  bornes: { niveau, min, max }[] | null,                  // DECLARE seulement, dans l'unité de l'indicateur
  source: string | null,
  nature: 'REGLEMENTAIRE' | 'CONTRACTUEL' | 'USAGE' | 'AVIS_PROFESSIONNEL' | null,
  motif: string | null,
  modifiePar: string | null,            // identifiant de l'utilisateur
  modifieLe: string | null              // ISO 8601
}
```

- **`GET /dossiers/{dossierId}/bilan/analyse/reperes/{indicateur}/journal`** — `TENANT_ADMIN` | `TENANT_USER`. 200
  `{ indicateur, entrees: EntreeJournalRepere[] }`, de la plus récente à la plus ancienne :
  `{ version, par, le, motif, source, nature, avant: ContenuRepere | null, apres: ContenuRepere }`, où
  `ContenuRepere = { statut, sens, bornes, source, nature }`. `400 INDICATEUR_INCONNU`.
- **`PUT /dossiers/{dossierId}/bilan/analyse/reperes/{indicateur}`** — **`TENANT_ADMIN` seul**. Corps fermé
  `{ versionAttendue (entier ≥ 0), statut, sens?, bornes?, source?, nature?, motif (1 → 500) }` : `DECLARE` exige `sens`,
  `bornes` (2 → 4 intervalles), `source` (1 → 1 000) et `nature` ; `SANS_REPERE` et `PAQUET` refusent `sens` et `bornes`
  (`source` et `nature` facultatives). 200 `RepereDossier` (l'état neuf). Refus : `400` validation (`{ message: string[] }`),
  `400 INDICATEUR_INCONNU`, `403` (rôle, gate, état publié), `404` dossier, `409 REPERE_CONCURRENT`
  (`versionAttendue` ≠ version courante, ou course perdue), `422 REPERE_INVALIDE` (bornes : `details.raison`),
  `422 REPERE_INCHANGE`.
- **Réponse d'analyse** (`GET …/bilan/analyse`, `POST …/analyse/dry-run`) : `indicateurs[].seuilApplique` gagne
  **`origine: 'PAQUET' | 'DOSSIER'`** et **`repereDossier: { version, nature, modifieLe } | null`** (`null` quand
  `origine: 'PAQUET'`). Pour `DOSSIER` : `source` est celle du dossier, `secteurRetenu` vaut `TOUS`, `referentiel` reste le
  paquet de l'analyse. Ajout seul : aucun champ, aucune valeur existante ne change ni ne disparaît.
- **Collection neuve `reperes_analyse`** (append-only ; index unique `{ tenantId, dossierId, indicateur, version }`) : au
  **plan d'effacement** (par `tenantId`) et au **plan d'export C13** (objet `reperes-analyse`). Aucune migration
  (collection neuve, `dossierId` posé à l'écriture). Aucun droit neuf (rôles seuls, comme tout le module) : rien à demander
  à B. Aucun topic, aucun paquet.

## Décisions retenues par défaut (contestables)

- **D-1139-1 — « Fini quand »** : ci-dessus. Zéro repère trouvé sur la même formule ; les seize gardent « aucun repère
  déclaré », raison par raison. Le mécanisme de modification est la part livrée.
- **D-1139-2 — Un repère d'usage français n'est pas importé quand la source ne l'attache pas à notre formule** (S3, S4) :
  la règle de D-1076-1 vaut aussi pour les guides. Un repère porté par une page qui ne dit pas à quel ratio il s'applique
  colorerait un chiffre sans fondement. Le cabinet peut le déclarer sur un dossier, sous sa responsabilité, avec
  `nature: 'USAGE'` et la source.
- **D-1139-3 — Les repères deviennent une donnée du dossier, pas du code.** Trois formes pesées : (a) le paquet révisé en
  place (D-1076-2) : c'est une livraison du moteur, et une recopie chez C ; refusé par la consigne. (b) un registre de la
  plateforme (`PLATFORM_ADMIN`) : AD-1 (« le poste central ne pousse rien ») le laisserait sans effet sur une instance sur
  site, et `PLATFORM_ADMIN` n'a pas d'organisation (le gate du bilan le refuse). (c) **retenue** : une surcharge **par
  dossier**, au patron des surcharges de mapping (STORY-058 : la donnée packagée n'est jamais modifiée, la surcharge
  l'emporte, tracée) et du rattachement D8 (toutes les collections du bilan sont par dossier, `DossierScopedRepository`) :
  la portée d'un collaborateur est respectée, les sources que Q-D-14 nommait (exigences écrites d'une banque, avis d'un
  expert-comptable) sont celles d'un dossier, et les plans C13 la suivent.
- **D-1139-4 — Le journal est la donnée** : une seule collection append-only ; l'état d'un indicateur est sa **dernière
  version**. L'index unique `(organisation, dossier, indicateur, version)` sert de verrou optimiste : l'écriture est une
  seule insertion, atomique, donc aucune modification ne peut exister sans sa trace, ni l'inverse (deux collections
  « état » et « journal » laisseraient une fenêtre entre deux écritures). Rien n'est jamais mis à jour ni effacé hors
  C13.
- **D-1139-5 — `avant` est l'entrée précédente du dossier**, ou `null` à la première (« le paquet de chaque liasse ») :
  le repère du paquet dépend du référentiel de **chaque** liasse (un jeu par exercice, son tampon), il n'y a donc pas
  « un » repère de paquet par dossier à recopier.
- **D-1139-6 — Trois statuts** : `DECLARE` (un repère du dossier), `SANS_REPERE` (aucun, même si le paquet en porte un —
  le cabinet peut écarter un repère qu'il juge inadapté, en le disant) et `PAQUET` (retour au paquet, sans effacer
  l'histoire). Un changement qui ne change rien est refusé (`REPERE_INCHANGE`) : le journal ne porte que des faits.
- **D-1139-7 — `TENANT_ADMIN` seul modifie** (comme la validation d'une surcharge, STORY-058) : changer un repère change
  les verdicts qu'une banque lira. `TENANT_USER` lit l'état et le journal.
- **D-1139-8 — Les bornes suivent les règles de la garde de packaging** (`gardes-analyse.mjs`), réécrites en TypeScript
  dans une fonction pure et éprouvées sur les mêmes cas : intervalles `[min, max)` contigus, toute la droite couverte, deux
  à quatre niveaux distincts du vocabulaire, ordonnés selon `sens`. Elles s'expriment dans l'unité de l'indicateur
  (pourcentage × 100 déjà appliqué, ratio, années, jours, montant en unités mineures).
- **D-1139-9 — Le repère du dossier vaut pour tous ses exercices, N et N-1, et pour les versions figées relues** : comme un
  repère du paquet (D-1076-2), il apprécie une valeur au moment de la lecture, il ne fait pas partie de la liasse. Aucun
  champ du jeu ni du snapshot ne change.
- **D-1139-10 — Pas de secteur dans un repère de dossier** : le dossier a un seul code NAEMA ; `secteurRetenu` vaut `TOUS`.
- **D-1139-11 — Un journal à part, pas `audit_events`** : le contexte de la piste d'audit est plat (chaînes et nombres) et
  ne porte pas un avant / après structuré ; un type d'audit neuf changerait l'énumération publiée de `GET …/bilan/audit`.
  Le journal des repères a sa route, sous le même dossier.
- **D-1139-12 — Aucun droit neuf, aucune demande à B** : le module ne connaît que les rôles (aucun droit fin `bilan:*`).

## Q-D-23 (au PO, choix par défaut appliqué)

1. **Le grain** : un repère par dossier (défaut). Un repère pour tous les dossiers d'un cabinet demanderait une route
   hors dossier (exception nommée à l'invariant de portée) et une règle de priorité entre les deux.
2. **Les repères d'usage écartés** (S3, S4 : « inférieur à 1 » pour l'endettement, « 1 à 2 » pour la liquidité) : **non
   importés** (défaut, D-1139-2). Les accepter tels quels changerait le paquet (une livraison) ou demanderait un registre de
   la plateforme.
3. Q-D-14 point 2 (une capacité de remboursement à la formule BCEAO, sur la CAFG) reste ouverte, défaut inchangé.
