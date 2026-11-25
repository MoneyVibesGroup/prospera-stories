# STORY-1078 : les contrôles d'intégrité de la liasse — FRNG = BFR + trésorerie nette, caisse créditrice, amortissements > brut, perte de change sans provision ; le rapprochement par l'empreinte de la balance, reporté

Status: done

**Plan :** `coordination/PLAN-LOT-6-2026-11-23.md` §6, amendement du 2026-11-24 (soir, D-L6-5), n° 10 · **Dépôt :**
`prospera-bilan-service` (repris de B, passation constatée par STORY-1076 : `7b53ff5` ; `origin/dev` au départ :
`9fed378`, STORY-1077) · **Plage :** groupe D (1074 → 1078 réservées au lot 6 amendé) · **Débloque :** quatre signaux
d'intégrité que FE-141 (A) peut afficher à côté des indicateurs ; « un contrôle gratuit qui protège tous les ratios »
(référentiel).
**Sources :** `analyse-pack-25-livres-2026-11-23.md` §7.2 (« les quatre contrôles d'intégrité […] : une story, même
endroit » que l'alerte de 1077) ; `referentiels/controles-balance-ohada.json` (contrôles `IDENTITE_FRNG_BFR_TRESORERIE`,
`CAISSE_CREDITRICE`, `AMORTISSEMENTS_SUPERIEURS_AU_BRUT`, `ECART_CONVERSION_SANS_PROVISION`, `statut: amorce`) ;
`stories/STORY-552.md` (les indicateurs FRNG, BFR, TRESORERIE_NETTE, l'invariant P7), `STORY-1076.md` et
`STORY-1077.md` (patron : règle en donnée sourcée du paquet, révision en place, garde de packaging) ; **textes officiels
relus le 2026-11-25** (ci-dessous). Code d'`origin/dev` (`9fed378`) : `src/modules/bilan/analyse/`,
`src/modules/bilan/etats/bilan.types.ts`, `src/modules/bilan/jeu-etats/`, `scripts/referentiels/`.
**Ne touche pas :** `prospera-balance-service` (C, D-L6-5) : la recopie à l'octet des paquets SYSCOHADA y est demandée à C
(ticket de 1076, mis à jour).

## « Fini quand » (plan)

« Les quatre contrôles sortent, chacun sourcé ; le rapprochement par l'empreinte quand 1022 est livrée (sinon reporté et
écrit). »

**Tenu ainsi (D-1078-1) :** la réponse d'analyse (`GET …/bilan/analyse`, `POST …/analyse/dry-run`) porte un bloc neuf
`controlesIntegrite` : les quatre contrôles, toujours dans le même ordre, chacun avec son statut, les montants qu'il
compare, les comptes ou postes en cause, son message et **ses sources** (texte, citation, adresse) lues du paquet. Un
contrôle que le paquet ne déclare pas (avec sa source) sort `NON_APPLICABLE` : un contrôle non sourcé n'entre pas.
**Le rapprochement par l'empreinte est reporté (D-1078-10)** : STORY-1022 (C) n'est pas livrée.

## Les textes (relus à la source le 2026-11-25)

Le référentiel cite des livres du pack (11, 12) : ils ne sont pas versionnés, le livre 12 est le modèle de 1998. Chaque
contrôle est donc rattaché aux **textes officiels du SYSCOHADA révisé** :

- **AUDCIF** — Acte uniforme relatif au droit comptable et à l'information financière, adopté à Brazzaville le 26
  janvier 2017, publié au Journal officiel de l'OHADA (numéro spécial) du 15 février 2017 (avis de publication :
  `https://www.ohada.com/actualite/3349/publication-du-nouvel-acte-uniforme-relatif-au-droit-comptable-et-a-linformation-financiere-audcif.html`).
  Texte lu en entier (copie intégrale hébergée par naturaljustice.org, sha256 `339732ae…`).
- **Guide d'application du SYSCOHADA révisé**, publié par ohada.com
  (`https://www.ohada.com/uploads/actualite/3504/Guide-d-application-du-SYSCOHADA.pdf`, sha256 `25c24c8b…`), lu par
  recherche.

| Contrôle | Texte | Ce qu'il dit (verbatim, extrait) |
|---|---|---|
| FRNG = BFR + TN | Guide, **Note 34** « Fiche de synthèse des principaux indicateurs financiers », p. 393 | « = FONDS DE ROULEMENT (1) » ; « BESOIN DE FINANCEMENT GLOBAL (4) = (2) + (3) » ; « TRESORERIE NETTE (5) = (1) - (4) » ; « CONTRÔLE : TRESORERIE NETTE = (TRESORERIE - ACTIF) - (TRESORERIE - PASSIF) » ; note b) « Les écarts de conversion doivent être éliminés afin de ramener les créances et les dettes concernées à leur valeur initiale » |
| (idem) | Guide, Bilan, « 2.3. Aménagements », p. 329 | « les écarts de conversion (comptes 478 et 479) sont placés au pied du Bilan, et non pas dans la masse des éléments circulants, en raison de leur caractère probable seulement » |
| Caisse créditrice | Guide, « 2.1. Règlement en espèces », p. 46 | « au débit d'un compte 57 Caisse, en cas d'entrée ou de recette, – à son crédit, en cas de sortie ou de dépense » ; « Si l'entité tient plusieurs caisses, le compte principal est subdivisé, par succursale ou par bureau » |
| Amortissements > brut | AUDCIF **45** | « Le montant amortissable du bien s'entend de la différence entre le coût d'entrée d'un actif et sa valeur résiduelle prévisionnelle » |
| (idem) | AUDCIF **46** | « L'actif doit être déprécié lorsque la valeur nette comptable est supérieure à la valeur actuelle » |
| (idem) | AUDCIF **47** | « Les amortissements et les dépréciations sont inscrits distinctement à l'actif en diminution de la valeur brute des biens et des créances correspondants pour donner leur valeur comptable nette » |
| (idem, comptes) | Guide, amortissements, p. 78 ; dépréciations, p. 81 | « La diminution de valeur est enregistrée au crédit d'un compte 281 à 284 s'il s'agit d'une immobilisation incorporelle ou corporelle » ; « les dépréciations correspondantes sont enregistrées au crédit des comptes 291 à 297 Dépréciations d'actif immobilisé, qui présenteront un solde créditeur et figureront à l'actif du bilan, en soustraction, au même titre que les amortissements » |
| Perte de change sans provision | AUDCIF **54** | « Ces différences sont inscrites directement au bilan dans des comptes d'écarts de conversion à l'actif, pertes probables ou du passif, gains latents. Les gains latents n'interviennent pas dans la formation du résultat. Les pertes probables entraînent la constitution d'une provision pour pertes de change. » |
| (idem, exceptions) | AUDCIF **56**, **57** | 56 : la perte d'un emprunt ou d'un prêt à plus d'un an « doit être étalé[e] sur la durée restant à courir » ; 57 : en position globale de change, « le montant de la dotation à la provision pour pertes de change est limité à l'excédent des pertes probables sur les gains latents » |
| (idem, comptes) | AUDCIF **48** ; Guide p. 84-85 | 48 : à plus d'un an, provisions « à inscrire au passif du bilan dans la rubrique : dettes financières » ; à court terme, « inscrites au passif dans la rubrique : passif-circulant » ; Guide : « 19 Provisions pour risques et charges, Ce compte est subdivisé par nature de risque (191 à 194 […]) », « 499 Provisions pour risques à court terme (Tiers) », « 599 Provisions pour risques à caractère financier » ; p. 207 : « 194 Provisions pour pertes de change » |
| (idem, couverture) | Guide, application 90, p. 210 | « 4788 Écarts de conversion – Actif, différences compensées par couverture de change » |

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|---|---|---|
| AC-1 | Le contrat est annoncé avant la fusion du code (« ⚠ Contrats » du journal de D) : bloc `controlesIntegrite`, bloc de paquet, empreintes des quatre paquets, recopie demandée à C | PR de docs d'annonce, fusionnée avant le code |
| AC-2 | Les quatre paquets SYSCOHADA révisé (`@2.1`, `@2.2`, `@2.3`, `zone-franche-togo@1.0`) portent le bloc `controlesIntegrite` (les quatre contrôles, leurs paramètres, au moins une source chacun : texte, citation, adresse) ; la garde de packaging refuse un code inconnu ou en double, un paramètre manquant ou en trop, une racine de compte mal formée, une exclusion hors de ses racines, un groupe d'immobilisations sans libellé ou dont une racine en couvre une autre, une source sans texte, sans citation ou sans adresse | spec de la garde (node fils), unitaires du référentiel |
| AC-3 | Hors de ce bloc, chaque artefact est identique à l'octet à celui de 1077 ; la liasse produite ne change pas ; SMT, SFD, CIMA se chargent et rendent les quatre contrôles `NON_APPLICABLE` | comparaison JSON (bloc retiré) ; unitaires |
| AC-4 | Identité : FRNG − (BFR + trésorerie nette + écart de conversion-actif − écart de conversion-passif) = 0 en entiers ⇒ `OK`, sinon `ANOMALIE` avec l'écart ; bilan déséquilibré ⇒ `INDETERMINE` (`BILAN_DESEQUILIBRE`) ; un terme indéterminé ⇒ `INDETERMINE` avec le motif de l'indicateur | spec pure (valeurs écrites dans le test) |
| AC-5 | Caisse : chaque compte des racines déclarées, lignes cumulées, de solde créditeur ⇒ `ANOMALIE`, comptes nommés avec leur solde ; aucun ⇒ `OK` | spec pure |
| AC-6 | Amortissements : chaque groupe d'immobilisations déclaré (21 face à 281 et 291 … 27 face à 297) dont les amortissements et dépréciations (solde créditeur net) dépassent la valeur brute (solde débiteur net) ⇒ `ANOMALIE`, groupe nommé avec son brut, ses amortissements et l'excédent ; égalité ⇒ `OK` ; un groupe ne couvre pas l'excédent d'un autre | spec pure, vrais paquets |
| AC-7 | Perte de change : écart de conversion-actif (racines moins exclusions) > 0 et aucune provision (racines déclarées) ⇒ `ANOMALIE` ; une provision, ou aucun écart, ⇒ `OK` ; montants publiés ; un écart compensé par couverture (exclu) ne déclenche pas | spec pure |
| AC-8 | Les soldes lus sont ceux de la liasse servie : soldes du jeu (brouillon ou validé), de la version demandée, ou du corps du `dry-run` | spec du service |
| AC-9 | Bout en bout (vrai HTTP, artefacts embarqués) : une liasse saine rend les quatre `OK` ; une balance avec une caisse créditrice, un matériel amorti au-delà de son brut et un écart non provisionné rend trois `ANOMALIE`, décrites exactement par le contrat OpenAPI | e2e `bilan-analyse`, `openapi-contract` |

## Décisions retenues par défaut (contestables)

- **D-1078-1 — Où.** Dans la **réponse d'analyse**, à côté de l'alerte de 1077 (analyse du pack §7.2 : « même endroit »),
  et **non** dans la batterie des contrôles de cohérence de la liasse (`CODES_CONTROLE`) : ce sont des **signaux** pour
  le cabinet, jamais un blocage de la validation ; les mettre dans la batterie changerait `valide`, le gate de dépôt et
  le contenu figé des versions. Le contrôle informe, il ne décide pas.
- **D-1078-2 — Les sources sont les textes officiels** (AUDCIF 2017, Guide d'application), pas les livres du pack. Le
  référentiel reste cité comme l'origine du catalogue.
- **D-1078-3 — L'identité élimine les écarts de conversion** (Note 34, note b ; Guide p. 329) : les masses
  `ECART_CONVERSION_ACTIF` et `ECART_CONVERSION_PASSIF` du paquet sont hors du BFR publié (STORY-552) ; sans elles,
  l'identité rougirait sur toute liasse saine portant un écart. Formule : `écart = FRNG − (BFR + TN + ECA − ECP)`, en
  entiers, **sans tolérance** (les montants sont des entiers d'unités mineures : une tolérance ne cacherait qu'une
  erreur). Si le bilan lui-même est déséquilibré (`controle.equilibreN` faux), l'identité n'a pas de lecture propre :
  `INDETERMINE`, `BILAN_DESEQUILIBRE` (la batterie le dit déjà par `EQUILIBRE_BILAN`). Ainsi, un écart non nul désigne
  exactement un poste rangé dans aucune masse, ou dans deux.
- **D-1078-4 — La caisse se lit sur les soldes de la balance**, compte par compte (la liasse fond la caisse et les
  banques dans un poste), lignes d'un même compte cumulées comme le moteur le fait ; les racines (`57`) sont **déclarées
  par le paquet**, jamais écrites dans le code (P7). Plusieurs caisses (sous-comptes) se jugent chacune.
- **D-1078-5 — Les amortissements se lisent sur les soldes de la balance, groupe d'immobilisations par groupe** :
  amortissements et dépréciations (solde créditeur net des comptes `281`…`284`, `291`…`297`) face à la valeur brute
  (solde débiteur net de `21`…`27`), chaque groupe à part ; les sept groupes et leurs comptes sont **déclarés par le
  paquet** (Guide p. 78, 81 ; libellés du plan de comptes du paquet). Dépréciations comprises (AUDCIF 46-47 : la valeur
  nette ne descend pas sous zéro) ; les groupes 25 à 27 n'ont que des dépréciations. **Écartée (relevé au code)** : la
  lecture sur la liasse, colonne « Amort./Dépréc. » face au « Brut » — les tables de passage SYSCOHADA embarquées ne
  rattachent **aucun** compte `28` ni `29` à un poste (la « convention miroir » est hors périmètre du moteur, tech-spec
  B8) : la colonne ne porterait que les crédits des comptes bruts, et un amortissement en trop ne s'y verrait jamais.
  Limite écrite : deux sous-comptes d'un même groupe qui se compensent ne se voient pas.
  **Constat (sans correctif ici)** : pour la même raison, une balance réelle qui porte des amortissements sort de la
  liasse **déséquilibrée** (comptes `28`/`29` non affectés, `COMPTES_NON_AFFECTES` de la batterie) tant qu'une
  surcharge de rattachement ne les place pas : l'identité du fonds de roulement y rend alors `INDETERMINE`
  (`BILAN_DESEQUILIBRE`), honnêtement. La « convention miroir » reste écartée depuis STORY-059 (P7).
  **Constat vérifié le 2026-11-25 (moteur réel, quatre paquets)** : balance équilibrée `2441` D 1 000 000, `28441`
  C 400 000, `101` C 800 000, `5711` D 200 000 ⇒ `AM` brut 1 000 000, amort. **0**, net 1 000 000 ; actif 1 200 000,
  passif 800 000, `ecartN` **400 000**, `equilibreN` false, `comptesNonMappes` `["28441"]` (même défaut sur `smt-togo@1.0`) ;
  avec une surcharge `RACINE 2844 → BILAN_ACTIF|AM` (STORY-400) : 1 000 000 / 400 000 / 600 000, équilibré. Ticket
  `tickets/TICKET-BACKEND-bilan-amortissements-non-rattaches.md` (Must avant un client réel ; non corrigé ici).
- **D-1078-6 — La perte de change se lit sur les soldes** : écart de conversion-actif = solde débiteur net des comptes
  `478` **hors `4788`** (différences compensées par couverture de change, qui n'appellent pas de provision) ; provisions
  = solde créditeur net des comptes `194`, `499`, `599` (AUDCIF 48 ; Guide p. 84-85). `ANOMALIE` si l'écart est positif
  et qu'aucune provision n'existe ; les deux montants sont publiés. Le contrôle ne juge pas une provision **partielle** :
  l'étalement (art. 56) et la position globale de change (art. 57) la rendent légitime ; le message les nomme.
- **D-1078-7 — Les règles sont des DONNÉES sourcées du paquet** (doctrine de D-1076-2, D-1077-5) : bloc
  `controlesIntegrite` (les contrôles déclarés, leurs paramètres — racines, exclusions, groupes —, leurs sources :
  texte, citation, adresse), **révision en place** des quatre paquets SYSCOHADA révisé, liasse inchangée ; garde de
  packaging `gardes-controles-integrite.mjs` (vocabulaire JSON partagé avec le TypeScript). SMT, SFD-BCEAO, CIMA : sans
  bloc, `NON_APPLICABLE` (`PAQUET_SANS_CONTROLE`).
- **D-1078-8 — La colonne N seule** (comme D-1077-9) : la liasse soumise ; N-1 n'est pas jugée.
- **D-1078-9 — Les soldes lus** : ceux du jeu pour la liasse servie (un brouillon est produit de ces soldes ; un jeu
  validé ne peut plus en changer, ils sont ceux de sa dernière version figée), ceux de la version figée quand `version`
  est demandée, ceux du corps du `dry-run`.
- **D-1078-10 — Le rapprochement de la liasse avec sa balance par l'empreinte des soldes est REPORTÉ.** Constat du
  2026-11-25 : STORY-1022 (C) n'est pas livrée — aucune fiche, `prospera-balance-service` `origin/dev` = `8b154df` sans
  `soldesChecksum`, aucune PR ouverte, journal de C muet. La demande à C reste ouverte (« Demandes aux autres groupes »
  du journal de D). Ce qu'il faudra le jour où 1022 sera livrée : lire l'empreinte publiée par la balance (contrat de
  1022), la recalculer sur les soldes du jeu **avec le même algorithme et sa version** (jamais un algorithme local,
  piège de `balanceChecksum`, STORY-147/381), et publier le constat à côté des quatre contrôles.
- **D-1078-11 — La recopie dans `balance-service` est demandée à C** (D-L6-5) : ticket de 1076 mis à jour avec les
  empreintes de 1078 ; `balance-service` ne lit pas le bloc.

## Contrat annoncé avant le code

Voir « ⚠ Contrats » du journal de D (entrée STORY-1078).

## Preuves

**Livré :** prospera-bilan-service#188, fusionnée en rebase le 2026-11-25 (`head` `8bebeb5`, rejoué sur `dev` en
**`d2c65c6`**, arbre identique) ; annonce « ⚠ Contrats » prospera-stories #865 (`main` d206f38) avant le code.

- **Suite unitaire complète sous Node 24 sur `8bebeb5`** (étage `verification`, image construite depuis
  `git -c core.autocrlf=false archive`, `Dockerfile.local` sans la ligne `# syntax`, sous le verrou) : **353/353 suites, 12 344 tests verts (5 ignorés), 722 s**,
  en `-w 4 --workerIdleMemoryLimit=700MB`. Paquets vérifiés en LF dans l'image (aucun CR) ; empreintes égales à celles
  du registre : `@2.1` `a2da57d7…`, `@2.2` `65c9c9a9…`, `@2.3` `39bb9f99…`, zone franche `70c87a37…`.
- **Spec neuve `controles-integrite.spec.ts`** (valeurs écrites dans le test, vrais paquets) : **25/25** (AC-4 → AC-7 ;
  égalité au franc, groupes qui ne se compensent pas, `4788` exclu, provision partielle non jugée).
- **Garde de packaging `gardes-controles-integrite.mjs`** (spec en `node` fils) : **21/21** (AC-2 : chaque refus).
- **Service d'analyse** (soldes du jeu, de la version, du `dry-run`, AC-8) : **25/25**.
- **e2e** `bilan-analyse` + `openapi-contract` (vrai HTTP, artefacts embarqués, AC-9) : **594/594** — liasse saine,
  quatre `OK` ; balance à caisse créditrice, matériel amorti au-delà du brut et écart non provisionné, trois `ANOMALIE`
  décrites exactement par le contrat.
- **Mutations sur la logique neuve : 22/22 rouges.** Lint 0 (fichiers touchés), build OK. Sans `docker compose up`
  (aucun module, dépendance ni Dockerfile ne change).
- **AC-3** : hors du bloc `controlesIntegrite`, chaque artefact est égal à l'octet à celui de 1077 ; SMT, SFD, CIMA
  rendent les quatre contrôles `NON_APPLICABLE`.
- **Constat D-1078-5 vérifié** (cas chiffré ci-dessus) : ticket `tickets/TICKET-BACKEND-bilan-amortissements-non-rattaches.md`.
