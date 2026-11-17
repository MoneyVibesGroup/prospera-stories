# STORY-1045 : `vocabulaires/` et `contrats/distributeur/` dans la plateforme

Status: in-progress

**Épic :** EPIC-222 · **Dépôt :** `prospera-plateforme` (dossiers `vocabulaires/` et `contrats/distributeur/`, tenus par
D) · **Plage :** groupe D, n° 1 du lot 3 (`PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §4). Solde **D-1042-3** (le reste de
STORY-1042). Ne dépend de rien.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **Le vocabulaire est une donnée** (spine distributeur AD-15) : `vocabulaires/<verticale>.json` pour `distributeur`, `imf` et `assurance`, une clé par ligne des tableaux « Vocabulaire par verticale » du PRD distributeur (§6.1 → §6.8), plus les codes de refus neutres du noyau (`refus.CREDIT_BLOQUE`…) ; « sans objet » s'écrit `null` | schéma draft-07 fermé ; chaque verticale a exactement les clés de `noyau.json` ; valeurs relevées dans le test |
| AC-2 | **Changer le tableau d'une organisation ne change que les libellés** : même module, même refus, même code, deux tableaux (deux verticales, ou une surcharge de l'organisation) | test : la sortie sans ses libellés est identique, les libellés diffèrent |
| AC-3 | **Un libellé qui manque se voit** : clé inconnue, notion « sans objet », surcharge invalide, vocabulaire incomplet : refus nommés | tests |
| AC-4 | **Le catalogue des faits d'AD-20** : `contrats/distributeur/catalogue-faits.json` (chaque fait du tableau, les faits communs, les exceptions nommées par AD-20 et les faits fixés par la spine de l'IA commune), son schéma draft-07 fermé | Ajv ; décomptes écrits dans le test ; aucun doublon ; graphie |
| AC-5 | **Un fait absent du catalogue ne passe pas** : la garde `verifierFaitsDuModule` refuse `FAIT_HORS_CATALOGUE`, `PUBLIEUR_NON_ADMIS`, `CONSOMMATEUR_NON_ADMIS` (famille freelance d'AD-31, faits de décision lus par `dashboard` seul), `GRAPHIE_INVALIDE` ; ce qu'une autre spine fixe est rendu à part, pas refusé | tests ; garde jouée sur les manifestes actuels |
| AC-6 | **Joués par les scripts racines** de la plateforme | `npm test` et `npm run typecheck` racines sous Node 24 ; `test/scripts-racines.test.ts` vert |

## Décisions retenues par défaut (contestables)

- **D-1045-1 — Aucun fichier de B n'est touché.** Le `test` et le `typecheck` racines lisent déjà `vocabulaires/` et
  `contrats/distributeur/` depuis STORY-941 (plateforme #6) ; la forme suivie est celle de `series/` (`src/`, `test/`,
  `package.json` sans dépendance, `tsconfig.json` qui étend la racine).
- **D-1045-2 — Une clé par ligne de tableau, par module.** Les tableaux du PRD-D §6 ne s'accordent pas d'un module à
  l'autre (« Zone » vaut « zone de collecte » au terrain de l'IMF et « agence » à ses équipes) : chaque ligne garde sa
  clé (`terrain.zone`, `equipe.zone`), aucune fusion. `noyau.json` porte le terme neutre et la section source de chaque
  clé.
- **D-1045-3 — Une valeur est la liste des termes de la cellule, le premier est le libellé** ; les parenthèses qui
  expliquent ou portent un paramètre (tranches de la balance âgée, « hors module », « une amorce ») sont retirées ;
  « sans objet » s'écrit `null`. La ligne « Source de créance » (`FACTURE`, `ECHEANCE_DE_PRET`, `PRIME`) n'est pas
  reprise : ce sont des codes, pas des libellés.
- **D-1045-4 — Les colonnes IMF et assurance sont transcrites du PRD-D**, qui les donne comme propositions à valider
  par les PRD microfinance et assurance. Écart connu : le PRD microfinance (§3) écrit « client » avant « membre » pour
  le tiers. Une correction se demande à D, qui la publie en `vocabulaires-v1.x`.
- **D-1045-5 — Les libellés des refus neutres** (`CREDIT_BLOQUE`, `PLAFOND_CREDIT_DEPASSE`, `DISPONIBILITE_INCONNUE`)
  reprennent les lignes « Blocage du crédit » et « Plafond de crédit » ; `DISPONIBILITE_INCONNUE` est « sans objet »
  hors du distributeur (pas de stock).
- **D-1045-6 — Une organisation surcharge un libellé**, pas une clé : clé inconnue (`CLE_INCONNUE`), notion « sans
  objet » (`NOTION_SANS_OBJET`) et texte vide ou de plus de 80 caractères (`SURCHARGE_INVALIDE`) sont refusés.
- **D-1045-7 — Le catalogue d'AD-20 juge les domaines du distributeur**, pas ceux des autres spines. Un nom dont le
  domaine est un module du tableau doit y être ; un nom de `catalogue`, `reseau` ou `notification` est fixé par leur
  manifeste (AD-20 : « faits de leurs manifestes ») ; un nom d'un autre domaine (`identity`, `kyc`, `ia`, `credit`,
  `coeur-sfd`…) est fixé par sa spine : la garde le **rend à part** (`fixesAilleurs`), sans le refuser.
- **D-1045-8 — Les faits de la spine de l'IA commune entrent au catalogue** (`*.realite.constatee@1`, lu par `ia`
  seul), bien qu'AD-20 ne nomme que les spines du moteur, de la microfinance et de l'assurance : l'amendement du
  2026-11-14 les a mis dans les manifestes.
- **D-1045-9 — Deux bibliothèques d'un fichier, sans import**, copiées à l'octet par chaque service avec leurs
  données, aux étiquettes `vocabulaires-v1` et `contrats-distributeur-v1` (patron de `series-v1`) ; l'empreinte est
  gardée chez le consommateur. Les services du distributeur les copieront avec leur première story qui affiche un
  libellé ou publie un fait.
- **D-1045-10 — Les schémas des charges de faits ne sont pas écrits ici** : chacun vient avec la story qui publie le
  fait (AD-27), sous `contrats/distributeur/<module>/`. Les contrats OpenAPI du terrain (`contrats/openapi/`, AD-14)
  attendent les routes de synchronisation (EPIC-233) ; ce dossier n'est pas à D au README : il se demandera à B.
- **D-1045-11 — Les écarts des manifestes actuels avec le catalogue sont relevés, pas corrigés** : AD-20 « complète
  et corrige les C5 des manifestes » par la série de PR d'AD-27 ; chaque module les corrige avec sa story.

## Preuves

À écrire à la fin.
