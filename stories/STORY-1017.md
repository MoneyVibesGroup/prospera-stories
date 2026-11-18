# STORY-1017 : la déclaration rapide, la fiche pré-remplie depuis le texte d'un message WhatsApp ou d'un e-mail

Status: in-progress

**Complexité :** moyenne (une extraction par règles explicables, un registre de l'IA sur deux bancs, un port de lecture des polices, deux routes)

**Épic :** EPIC-206 (la déclaration) pour la fiche, EPIC-217 (l'IA commune, usage n°1) pour la proposition et son registre
**Dépôt :** `prospera-sinistres-service` (module `sinistres`, dossier `declaration-rapide/`)
**Porteur :** groupe C, n° 3 du lot 4 (`coordination/PLAN-4-SESSIONS-LOT-4-2026-11-18.md` §5). Sans Docker pour cette
session (le poste est tenu par FE-069) : la preuve Node 24 sur MongoDB réel est un script prêt, à jouer au retour de Docker.
Ancrage : FR-34 (le vocal est hors périmètre), FR-35 (déclaration assistée, usage n°1), FR-12 (registre de l'IA), AD-10
(`PropositionPort`, `origine: REGLE | MODELE | LANGAGE`, la décision humaine est écrite par le module consommateur) ;
`extract-code-demo.md` (`extraireDeclaration`, `DeclarationIA`).

---

## Pourquoi

Un assuré ou un courtier écrit sa déclaration sur WhatsApp ou par e-mail. Aujourd'hui l'accueil la ressaisit. FR-35
demande que l'agent puisse **pré-remplir la fiche** depuis le texte, en voyant pour chaque champ **d'où il vient** et
**avec quelle confiance**, et que rien ne soit enregistré tant qu'il n'a pas agi. Aucun modèle n'est installé : la
capacité est servie par des **règles explicables** (mots-clés, formats de numéros, dates relatives), comme la démo, et
l'écran ne dit pas « IA ». Un vocal n'est jamais lu : il est rangé comme pièce.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | ⛔ **Chaque champ proposé porte sa valeur, sa confiance (0 à 1) et l'extrait du message d'où il vient**, plus la règle qui l'a posé (explicable) ; le numéro de police, l'immatriculation et le téléphone sont lus par leur format ; le type et la gravité par mots-clés ; la date par « aujourd'hui », « hier », « avant-hier », un jour de semaine ou une date écrite | tests purs (valeurs écrites dans le test) |
| AC-2 | ⛔ **Un numéro de police connu donne la police** (confiance 0,97, extrait) ; **un numéro inconnu du LC ne donne jamais de police** : une question et une alerte `POLICE_INCONNUE`, aucun champ `police`. Un voisin non installé ou injoignable ne change pas la lecture : le champ est proposé « non vérifié » (alerte `POLICE_NON_VERIFIEE`) | tests du service (port mémoire) ; mutation : le refus de la police inconnue neutralisé ⇒ rouge |
| AC-3 | ⛔ **Un type incertain n'est jamais inventé** : aucun mot-clé, ou deux types à égalité, ⇒ aucun champ `typeSinistre`, une alerte `TYPE_INCERTAIN` et une question | tests purs |
| AC-4 | **Questions et alertes** : la liste des questions à poser (police, type, date, lieu manquants) et des alertes (police inconnue, type incertain, date future écartée) | tests purs |
| AC-5 | ⛔ **Rien n'est créé sans l'agent** : proposer écrit une ligne du registre au statut `PROPOSEE` et **aucun dossier** ; `ACCEPTEE` ou `MODIFIEE` pose un **brouillon** de déclaration dans la ligne (jamais un dossier, jamais une référence `DEC-`) ; `REJETEE` n'en pose pas ; une proposition décidée ne se redécide pas (409) | tests du service (compteur de dossiers inchangé) |
| AC-6 | **Un vocal n'est jamais lu** : une entrée `AUDIO` (ou sans texte) n'appelle ni l'extraction ni le registre et répond `lu: false`, `action: RANGER_COMME_PIECE` | test du service |
| AC-7 | **Le registre de l'IA garde chaque usage** : entrée, sortie, confiance, sources, niveau `EXTRACTION`, origine `REGLE`, statut `PROPOSEE`, `ACCEPTEE`, `MODIFIEE` ou `REJETEE`, auteur et instant de la décision ; sur le banc mémoire **et** sur MongoDB réel (relu après écriture) | tests du service sur les deux bancs |
| AC-8 | **Qui agit** : les rôles de la déclaration (`ACC`, `GEST`, `GREC`, `RESP`), le rôle exercé porté par le jeton ; une proposition d'une autre organisation est introuvable | tests du service ; e2e |
| AC-9 | **Les paramètres sont figés** : mots-clés, confiances et seuil dans `declaration-rapide-2026.1.json`, empreinte sha256 testée ; aucun chiffre de confiance dans le code | test d'empreinte |
| AC-10 | **Le contrat de routes** : deux écritures (`POST`), aucune lecture, donc rien à ajouter aux `routesLectureSeule` du manifeste | invariant de routes |

## Décisions retenues par défaut (contestables)

- **D-1017-1 — Le brouillon vit dans la ligne du registre, pas dans un dossier.** « Appliquer crée un brouillon » : la
  ligne décidée porte `brouillon` (le formulaire de FR-34 et la date de survenance), au même format que `POST …/dossiers`.
  L'agent le relit et le soumet par la route de déclaration existante ; c'est elle qui attribue `DEC-` et contrôle le
  doublon. Aucune collection de brouillons n'est ajoutée.
- **D-1017-2 — Une ligne du registre par usage, écrite par `sinistres`** (AD-10 : la décision humaine est écrite par le
  module consommateur). Collection `sinistres_ia_registre`. Le texte du message y est gardé (c'est l'« entrée » de FR-12),
  dans la base de l'organisation ; aucune donnée de santé n'est demandée par les règles.
- **D-1017-3 — Deux champs de mots, pas de regex dans le paramètre.** Le paramètre liste des mots et des confiances ; les
  formats (numéro de police, plaque, téléphone) sont dans le code, car ce sont des formats, pas des chiffres métier.
  Les confiances reprennent la démo : police par numéro 0,97, immatriculation 0,92, téléphone 0,85 ; types 0,9 (corporel,
  incendie), 0,88 (vol), 0,86 (dégâts des eaux), 0,84 (transport), 0,82 (collision), 0,75 (matériel), 0,7 (RC) ; sous 0,6
  un type n'est pas proposé (`TYPE_INCERTAIN`).
- **D-1017-4 — La police se lit par son numéro seul.** `assurance` n'expose que `GET …/polices/{numero}` ; il n'y a pas
  de recherche par immatriculation ou téléphone (index de recherche, AD-24, à venir). Une plaque ou un téléphone sans numéro
  de police sont proposés comme champs et donnent la question « retrouver la police » : jamais une police devinée. Le port
  lit `ASSURANCE_URL` ; absent ⇒ `NON_INSTALLE` ; injoignable ⇒ `INJOIGNABLE` (comme la recevabilité, D-1001-1).
- **D-1017-5 — Le vocal est refusé à l'entrée, sans trace au registre.** Il n'y a pas eu d'usage de l'IA à consigner ;
  l'écran propose de ranger le fichier comme pièce (hors story : le dépôt de la pièce par `ged`).
- **D-1017-6 — Les dates sont des jours (`AAAA-MM-JJ`)**, calculées sur l'instant de réception (`recueLe`, défaut :
  maintenant) ; une date postérieure à la réception est écartée avec l'alerte `DATE_FUTURE`, jamais corrigée.
- **D-1017-7 — « Pas de blessé » n'est pas un blessé.** Les négations (« pas de blessé », « aucun blessé », « sans
  blessé ») sont retirées avant la recherche des mots-clés et posent la gravité `LEGER` avec leur extrait.
- **D-1017-8 — Lecture du registre : écart nommé.** Une route de lecture (AUD, RESP, FR-12) ajouterait une ligne aux
  `routesLectureSeule` du manifeste, donc une PR de manifeste dans `prospera-stories` ; elle n'est pas dans cette story.
  Le fait `sinistres.ia.decision.enregistree@1` (C5) attend aussi l'IA commune.
- **D-1017-9 — L'extracteur est derrière un port** (`ExtracteurDeDeclaration`) : les règles sont l'implémentation
  `origine: REGLE` ; l'IA commune (`MODELE`) la remplacera sans changer le registre ni les routes. Si elle est coupée, la
  saisie à la main reste inchangée (rien n'en dépend).

## Hors story

- L'écran « Déclarer » et le bouton de l'assistant (`prospera-app`) ; le dépôt du vocal comme pièce (`ged`).
- La réception automatique du message (`notification.reponse.recue@1`) ; l'adresse ou le numéro d'origine est saisi.
- La lecture du registre, l'envoi du fait de décision, la recherche de police par plaque ou téléphone (D-1017-4, -8).

## Preuves attendues (règles des groupes)

Tests purs et de service (bancs mémoire et MongoDB réel), mutation d'un AC clé (AC-2), e2e HTTP, lint, build ; Node 24
(étage `verification`). Docker : non pour le code (aucune dépendance neuve) ; la vérification Node 24 attend le retour du poste.

## Ce qui a été livré

*(à remplir à la fusion)*
