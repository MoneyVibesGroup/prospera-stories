# STORY-1077 : le contrôle « capitaux propres < ½ capital » et son échéance légale — à côté de l'analyse financière

Status: in-progress

**Plan :** `coordination/PLAN-LOT-6-2026-11-23.md` §6, amendement du 2026-11-24 (soir, D-L6-5), n° 9 · **Dépôt :**
`prospera-bilan-service` (repris de B, passation constatée par STORY-1076 : `7b53ff5`) · **Plage :** groupe D (1074 → 1078
réservées au lot 6 amendé) · **Débloque :** l'alerte juridique que FE-141 (A) peut afficher à côté des indicateurs ; la
« première question d'un banquier » (dossier de prêt, analyse du pack §3).
**Sources :** `analyse-pack-25-livres-2026-11-23.md` §3 (« les trois apports les plus rentables », n° 1) et §7.1 ;
`referentiels/controles-balance-ohada.json` (contrôle `CP_INFERIEURS_MOITIE_CAPITAL`, `statut: amorce`) ;
`stories/STORY-552.md` (l'analyse financière, ses marqueurs, l'invariant P7) ; `stories/STORY-1076.md` (révision en place
d'un paquet, D-1076-2) ; `stories/STORY-1073.md` (D-1073-2 : la forme juridique n'est publiée que pour le dossier propre) ;
**texte officiel de l'AUSCGIE révisé**, relu le 2026-11-25 (ci-dessous). Code d'`origin/dev` (`e4cee3e`) :
`src/modules/bilan/analyse/`, `src/modules/read-models/` (dossier), `scripts/referentiels/`.
**Ne touche pas :** `prospera-dossier-service` (rendu à B à la fin de 1073) ; `prospera-balance-service` (C, D-L6-5).

## « Fini quand » (plan)

« Le contrôle sort de la liasse produite, avec l'échéance de la décision des associés. »

**Tenu ainsi (D-1077-1) :** la réponse d'analyse (`GET …/bilan/analyse`, `POST …/analyse/dry-run`) porte un bloc neuf
`alerteCapitauxPropres`, calculé sur la liasse **servie** (la même que les indicateurs) et la forme juridique du dossier ;
quand l'alerte est atteinte et la forme connue, il publie les trois échéances de la loi (approbation des comptes, décision
des associés, régularisation), datées quand la date de clôture (et, pour la décision, la date d'approbation) est connue.
Chaque règle et chaque délai viennent du **paquet**, sourcés article par article ; aucun n'est écrit dans le code.

## Le texte de la loi (relu à la source le 2026-11-25)

**Acte uniforme révisé relatif au droit des sociétés commerciales et du groupement d'intérêt économique (AUSCGIE)**,
adopté le 30 janvier 2014 à Ouagadougou, publié au Journal officiel de l'OHADA (numéro spécial) du 4 février 2014, en
vigueur le 5 mai 2014. Texte lu en entier par recherche dans l'édition intégrale d'ohada.com
(`http://www.ohada.com/actes-uniformes-revises/1299/acte-uniforme-revise-relatif-au-droit-des-societes-commerciales-et-du-groupement-d-interet-economique.html`,
209 pages, copie FAOLEX `https://faolex.fao.org/docs/pdf/oha195728.pdf`, sha256 `98da85ff…`) ; publication au JO
confirmée par la note du cabinet Lazareff Le Bars reprise par ohada.com.

| Article | Page | Ce qu'il dit (verbatim, extrait) |
|---|---|---|
| 140 | 29 | SA, SAS et, le cas échéant, SARL : l'assemblée statuant sur les états financiers de synthèse « doit obligatoirement se tenir dans les six (6) mois de la clôture de l'exercice ». |
| 348 | 75 | SARL : « L'assemblée générale ordinaire annuelle se réunit dans les six (6) mois de la clôture de l'exercice. Les gérants peuvent demander une prorogation de ce délai à la juridiction compétente statuant sur requête. » |
| 548 | 118 | SA : l'AGO « est réunie au moins une (1) fois par an, dans les six (6) mois de la clôture de l'exercice, sous réserve de la prorogation de ce délai par décision de justice ». |
| 309 | 66 | La SARL « peut être instituée par une personne physique ou morale, ou entre deux ou plusieurs personnes ». |
| 334 | 72 | SARL : « S'il n'y a qu'un associé unique, il prend seul les décisions de la compétence de l'assemblée. » |
| **371** | 81 | « Si, du fait des pertes constatées dans les états financiers de synthèse, les capitaux propres de la société deviennent inférieurs à la moitié du capital social, le gérant ou, le cas échéant, le commissaire aux comptes, doit dans les quatre (4) mois qui suivent l'approbation des comptes ayant fait apparaître cette perte, consulter les associés sur l'opportunité de prononcer la dissolution anticipée de la société. » |
| **372** | 81 | « Si la dissolution est écartée, la société est tenue, dans les deux (2) ans qui suivent la date de clôture de l'exercice déficitaire, de reconstituer ses capitaux propres jusqu'à ce que ceux-ci soient à la hauteur de la moitié au moins du capital social. À défaut, elle doit réduire son capital d'un montant au moins égal à celui des pertes qui n'ont pu être imputées sur les réserves, à la condition que cette réduction de capital n'ait pas pour effet de réduire le capital à un montant inférieur à celui du capital légal. » |
| **373** | 81 | À défaut de décision, ou si la reconstitution n'est pas intervenue dans les délais, « tout intéressé peut demander à la juridiction compétente de prononcer la dissolution de la société » ; « L'action est éteinte lorsque cette cause de dissolution a cessé d'exister au jour où la juridiction compétente statue sur le fond. » |
| **664** | 140 | « Si, du fait de pertes constatées dans les états financiers de synthèse, les capitaux propres de la société deviennent inférieurs à la moitié du capital social, le conseil d'administration ou l'administrateur général, selon le cas, est tenu, dans les quatre (4) mois qui suivent l'approbation des comptes ayant fait apparaître cette perte, de convoquer l'assemblée générale extraordinaire à l'effet de décider si la dissolution anticipée de la société a lieu. » |
| **665** | 141 | « Si la dissolution n'est pas prononcée, la société est tenue, au plus tard à la clôture du deuxième exercice suivant celui au cours duquel la constatation des pertes est intervenue, de réduire son capital, d'un montant au moins égal à celui des pertes qui n'ont pu être imputées sur les réserves si, dans ce délai, les capitaux propres n'ont pas été reconstitués à concurrence d'une valeur au moins égale à la moitié du capital social. » |
| 666 | 141 | La décision de l'AGE « est déposée au registre du commerce et du crédit mobilier » et « publiée dans un journal d'annonces légales ». |
| 667 | 141 | À défaut de réunion ou de délibération valable, ou si l'article 665 n'est pas appliqué, « tout intéressé peut demander en justice la dissolution de la société ». |
| 668 | 141 | La juridiction « peut accorder à la [société un délai] maximal de six (6) mois pour régulariser la situation ». |
| 669 | 141 | « Les dispositions des articles 664 à 668 ci-dessus ne sont pas applicables aux sociétés en redressement judiciaire ou en liquidation de biens. » |
| **853-3** | 192 | SAS : « les règles concernant les sociétés anonymes, à l'exception des articles 387 alinéa 1er, 414 à 561, 690, 751 à 753 ci-dessus, sont applicables à la société par actions simplifiée » ; les attributions du conseil « sont exercées par le président ». |

**Écart relevé dans `controles-balance-ohada.json`** : il renvoie la SAS à « art. 853-1 et suivants » sans article ; le
renvoi aux règles de la SA est l'**article 853-3**, qui n'exclut pas 664 à 669. Les deux « à vérifier » du référentiel
(SUARL → SARL ; SAS → SA) sont **confirmés** par 309/334 et 853-3.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|---|---|---|
| AC-1 | Le contrat est annoncé avant la fusion du code (« ⚠ Contrats » du journal de D) : bloc `alerteCapitauxPropres` de la réponse d'analyse, paramètre `dateApprobation`, champ `formeJuridique` lu de `dossier.*`, empreintes des quatre paquets, demande à B, recopie demandée à C | PR de docs d'annonce, fusionnée avant le code |
| AC-2 | Les quatre paquets SYSCOHADA révisé (`@2.1`, `@2.2`, `@2.3`, `zone-franche-togo@1.0`) portent le marqueur `capitauxPropresStricts` (`CAPITAL` sur le capital, `COMPOSANTE` sur les sept autres postes des capitaux propres, ni les subventions d'investissement ni les provisions réglementées) et le bloc `alerteCapitauxPropres` (fraction ½, deux régimes, délais, articles et citations) ; la garde de packaging refuse un bloc sans marqueur, un marqueur sans bloc, un délai ou une citation manquants, une forme dans deux régimes | spec du générateur (node fils), unitaires du référentiel |
| AC-3 | Hors de ces ajouts, chaque artefact est identique à l'octet à celui d'avant ; la liasse produite ne change pas ; les paquets sans bloc (SMT, SFD, CIMA) se chargent et rendent l'alerte `NON_APPLICABLE` | comparaison JSON (ajouts retirés) ; unitaires |
| AC-4 | Capitaux propres stricts < ½ capital ⇒ `ATTEINTE` ; = ½ capital ⇒ `NON_ATTEINTE` (la loi dit « inférieurs ») ; comparaison exacte en entiers ; le capital nul ou négatif ⇒ `INDETERMINEE` ; la variante « capitaux propres et ressources assimilées » publiée à côté avec son propre constat | spec pure (valeurs écrites dans le test) |
| AC-5 | Forme `SARL`/`SUARL` ⇒ régime 371-373 ; `SA`/`SAS` ⇒ régime 664-669 (853-3 nommé pour la SAS) ; `EI` ⇒ `NON_APPLICABLE` ; `AUTRE` ou inconnue ⇒ constat chiffré, **sans échéance**, motif nommé | spec pure |
| AC-6 | Échéances : approbation = clôture + 6 mois ; décision = approbation + 4 mois (datée si `dateApprobation` est fournie, sinon date « si l'approbation a lieu au terme légal ») ; régularisation SARL = clôture + 2 ans, SA non datée (règle publiée) ; mois ajoutés au quantième, ramenés au dernier jour du mois | spec pure (bornes de mois, années bissextiles) |
| AC-7 | `dateApprobation` (AAAA-MM-JJ, calendaire) refusée en 400 si elle n'est pas postérieure à la clôture (`APPROBATION_AVANT_CLOTURE`) ou malformée | e2e HTTP |
| AC-8 | Le read-model `dossiers_dossier` projette `formeJuridique` (état absolu : absente ⇒ `null`) ; une valeur mal typée ne fait pas écarter le message | unitaires du read-model |
| AC-9 | Bout en bout (vrai HTTP, artefacts embarqués) : une liasse de SARL en perte sert `ATTEINTE` et ses échéances ; un dossier client sans forme publiée sert le constat sans échéance | e2e `bilan-analyse` |

## Décisions retenues par défaut (contestables)

- **D-1077-1 — « Fini quand »** : ci-dessus. Le contrôle vit **dans la réponse d'analyse** (à côté de STORY-552, analyse
  du pack §7.1) et non dans la batterie de contrôles de cohérence de la liasse : il lit une donnée **du dossier** (la
  forme) et des dates, que la liasse figée ne porte pas ; le figer avec elle changerait l'octet de la liasse produite.
- **D-1077-2 — La forme juridique se lit par l'événement du dossier, jamais par une route.** `DossierEtatV1` porte déjà
  `formeJuridique` (facultatif, STORY-1073) ; `bilan-service` le projette dans son read-model `dossiers_dossier` comme
  `codeNaema` (STORY-553). Aujourd'hui `dossier-service` ne le publie que pour le **dossier propre** (D-1073-2) : un
  dossier client sort `formeJuridique.statut: INCONNUE`, et l'alerte rend son **constat chiffré sans échéance** (choix du
  référentiel pour une forme indéterminée). **Demande à B** (dossier-service lui est rendu) : publier `formeJuridique` sur
  les dossiers clients aussi — la même fonction, ajout facultatif, `schemaVersion` inchangé, puis
  `npm run republier:dossiers` (STORY-696) ; rien à changer côté bilan ce jour-là. **Écartée : la lecture par route**
  (`GET /api/v1/dossiers/{id}` avec le jeton de l'appelant, que `prospera-fiscal-service` fait) : `bilan-service` n'a
  aucune lecture HTTP de `dossier-service` (il n'appelle qu'auth, pour le financement) ; l'ajouter créerait une
  dépendance synchrone, une configuration et une seconde source pour un fait que le read-model reçoit déjà.
- **D-1077-3 — Le capital et les capitaux propres sortent de la liasse, désignés par un MARQUEUR du paquet (P7).** Marqueur
  neuf de la table de passage `capitauxPropresStricts` : `CAPITAL` sur le capital (`CA`), `COMPOSANTE` sur `CB`, `CD`,
  `CE`, `CF`, `CG`, `CH`, `CJ` ; ni `CL` (subventions d'investissement) ni `CM` (provisions réglementées). Les capitaux
  propres stricts = postes marqués + le résultat encore porté par le compte de résultat (même agrégat que
  `POIDS_CAPITAUX_PROPRES`, STORY-552) ; la variante large = la masse `CAPITAUX_PROPRES` (le poste `CP`, « capitaux
  propres et ressources assimilées ») + ce même résultat. **Révision en place** des quatre paquets (doctrine de D-1076-2) :
  marqueur et bloc additifs, la liasse produite ne change pas d'un octet ; l'empreinte de chaque paquet change.
- **D-1077-4 — L'alerte se juge sur la variante STRICTE** (sans `CL` ni `CM`, choix par défaut du référentiel : elle se
  déclenche plus tôt ; un faux positif expliqué coûte moins qu'une échéance légale manquée), et publie à côté la variante
  large avec son propre constat (`atteinteSurRessourcesAssimilees`). Le message dit laquelle déclenche. **Q-D-16** à
  l'expert / au PO : quelle définition la doctrine OHADA retient pour 371 et 664.
- **D-1077-5 — La règle est une DONNÉE sourcée du paquet**, comme les seuils (STORY-553/1076) : bloc
  `alerteCapitauxPropres` (fraction, deux régimes par forme, délais, articles, citations verbatim, URL). Un paquet sans le
  bloc rend l'alerte `NON_APPLICABLE` (`PAQUET_SANS_ALERTE`) : SMT, SFD-BCEAO, CIMA aujourd'hui (leurs passifs n'isolent
  pas le capital de la même façon ; à porter par une révision de ces paquets si un cabinet en a l'usage).
- **D-1077-6 — Les régimes** : `SARL`, `SUARL` → 371 à 373 (la SUARL est une SARL à associé unique : 309, 334) ; `SA`,
  `SAS` → 664 à 669 (853-3 pour la SAS, le président exerçant les attributions du conseil) ; `EI` → `NON_APPLICABLE`
  (`FORME_SANS_CAPITAL`) ; `AUTRE` (dont SNC, SCS, GIE, que l'énumération du dossier ne distingue pas) → constat sans
  échéance (`FORME_SANS_REGIME`). L'exclusion de 669 (redressement judiciaire, liquidation des biens) est publiée avec le
  régime : Prospera ne connaît pas l'état de procédure collective du client.
- **D-1077-7 — Les trois échéances.** (1) **Approbation des comptes** : clôture + 6 mois (140, 348, 548 ; prorogation
  judiciaire possible, dite). (2) **Décision** (consultation des associés, 371 ; convocation de l'AGE, 664) : approbation
  + 4 mois — datée quand `dateApprobation` est fournie ; sinon `dateLimite: null` et `dateSiApprobationAuTerme` =
  (clôture + 6 mois) + 4 mois, la date à tenir **si** les comptes sont approuvés le dernier jour du délai légal (jamais
  présentée comme la date limite : une approbation plus tôt l'avance). (3) **Régularisation** : SARL, clôture + 2 ans
  (372) ; SA, « à la clôture du deuxième exercice suivant celui » de la constatation (665) — non datée (le calendrier des
  exercices suivants n'est pas connu), la règle est publiée.
- **D-1077-8 — Le calcul des dates** : un délai en mois s'ajoute au **quantième**, ramené au dernier jour du mois quand il
  n'existe pas (31/08 + 4 mois = 31/12 ; 31/10 + 4 mois = 28/02 ou 29/02) ; dates en `AAAA-MM-JJ`, en UTC, sans heure.
- **D-1077-9 — La colonne N seule.** La loi vise les comptes de l'exercice soumis à l'approbation ; N-1 n'est pas jugée.
  Une liasse dont la clôture n'est pas connue (dry-run sans `exerciceN`, jeu non daté) rend le constat et des échéances
  sans date (`motifDate: CLOTURE_INCONNUE`), sauf la décision quand `dateApprobation` est fournie.
- **D-1077-10 — Comparaison exacte** : atteinte ⇔ `dénominateur × capitaux propres < numérateur × capital` (fraction du
  paquet, ½), en entiers ; à égalité, `NON_ATTEINTE` (« inférieurs »). Capital nul ou négatif ⇒ `INDETERMINEE`
  (`DENOMINATEUR_NUL` / `DENOMINATEUR_NEGATIF`, vocabulaire des indicateurs) ; une indétermination des postes (résultat
  non affecté, montant hors bornes) ⇒ `INDETERMINEE` avec le motif de l'analyse.
- **D-1077-11 — `dateApprobation` est un paramètre facultatif** (requête du `GET`, corps du `dry-run`) : la date de
  l'assemblée n'est portée par aucun service. Calendaire (`AAAA-MM-JJ`, garde de STORY-395), et **postérieure à la
  clôture** quand celle-ci est connue (sinon `400 APPROBATION_AVANT_CLOTURE`). Elle n'est ni stockée ni publiée ailleurs.
- **D-1077-12 — Le read-model lit `formeJuridique` sans écarter le message** : une chaîne non vide est projetée telle
  quelle (une forme future que le paquet ne connaît pas tombe en `FORME_SANS_REGIME`) ; absente ou mal typée ⇒ `null`
  (état absolu : jamais la valeur d'un message antérieur). Écarter le message entier perdrait aussi l'affectation et le
  statut qu'il porte (raisonnement de D-683-3).
- **D-1077-13 — La recopie dans `balance-service` est demandée à C** (D-L6-5), dans le ticket de 1076 mis à jour : C recopie
  la version de 1077 (qui contient celle de 1076). `balance-service` ne lit ni le marqueur ni le bloc.

## Q-D-16 (à l'expert / au PO, choix par défaut appliqué)

**Les capitaux propres de 371 et 664 comprennent-ils les subventions d'investissement (`CL`) et les provisions
réglementées (`CM`) ?** Le SYSCOHADA révisé les range dans « capitaux propres et ressources assimilées » (`CP`). **Défaut
(D-1077-4)** : l'alerte se juge sans eux (lecture stricte, plus prudente), la lecture large est publiée à côté avec son
propre constat. Si la doctrine retient la lecture large : poser `COMPOSANTE` sur `CL` et `CM` par une révision du paquet,
rien à changer dans le code.

## Contrat annoncé avant le code

Voir « ⚠ Contrats » du journal de D (entrée STORY-1077).

## Preuves

*(à écrire à la fin)* — dont la **dette de preuve de 1076** (suite unitaire complète de `bilan-service` sous Node 24 sur
`origin/dev` `e4cee3e`, avant le code de cette story).
