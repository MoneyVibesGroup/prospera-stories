# STORY-424 : Le compte de travail du cabinet (8 caractères) devient une donnée de premier rang, à côté du compte de plan

Status: review

**Épic :** EPIC-020 — Cahiers & rattachement (Atelier Balance)
**Service :** `balance-service` (`:3007`) — `modules/referentiel`, `modules/balance`, `modules/cahiers`
**Points :** 8 · **Sprint :** S20
**Origine :** **retour direct d'un expert-comptable**, transmis par le PO le **2026-08-26** : *« tous les comptes qui doivent être présents sur la plateforme doivent être sur 8 chiffres »*.

---

## ✅ ARBITRAGE PO DU 2026-08-26 — **VOIE B**

> **« Je prends la voie B. »**

**L'identité canonique d'une ligne de balance reste le compte de plan (≤ 6).** La liasse ne
bouge pas, `bilan-service` ne bouge pas, le contrat canonique (STORY-101) ne bouge pas.

**Ce qui change** : la plateforme cesse de *jeter* le compte du cabinet. Le compte à
**8 caractères** devient une donnée de premier rang — **accepté à la saisie**, **conservé**, et
**publié** à côté du compte de plan dont il dérive.

⚠️ **La voie B au sens strict (affichage seul) ne débloque pas FE-046** : sans acceptation à la
saisie, un comptable ne peut toujours pas écrire `44280002` dans une règle de rattachement ni
dans une catégorie de dépense. L'extension à la saisie faisait partie de la recommandation
présentée au PO avec la voie B ; elle est donc dans le périmètre. *(Si l'intention était
l'affichage seul, retirer les AC-3 et AC-4 et repasser à 5 points.)*

**Écartées :** la voie A (le compte de travail devient l'identité canonique) — trop invasive,
elle rouvre STORY-101 et `bilan-service` ; la voie C (`longueurCompteDetail: 8`) — **fausse** :
plus rien ne serait regroupé et la liasse recevrait des comptes que l'administration ne
reconnaît pas.

---

## Le fait, mesuré sur une balance cliente réelle

`Balance_des_comptes.pdf` — **ETS RELAXED**, Sage 100 Comptabilité i7 8.50, exercice 2023.

| relevé | valeur |
|---|---|
| comptes de la balance | **51** |
| comptes à **8 chiffres** | **51** — soit **100 %** |

Et « ramener au compte de plan » n'est pas neutre :

| ramené à 6 | comptes fondus | ce qui disparaît |
|---|---|---|
| `442800` | `44280001` **Droit d'enregistrement** + `44280002` **TH 2023** | deux impôts distincts, une seule ligne |
| `447800` | `44780000` + `44780001` + `44780002` | trois comptes, une seule ligne |

**5 comptes réduits à 2 sur une seule balance.**

---

## Ce qui est demandé

### ① Publier les comptes d'origine sur la ligne de balance

L'information **existe déjà** côté import Sage (`normalisation-comptes.ts`) : `Regroupement`
porte `compte`, `comptesSources` et `sourcesTotal`. Elle est rendue à l'appelant **au moment de
l'import**, puis perdue. Elle doit vivre **sur la ligne** :

```ts
// LigneBalanceApercuDto / la ligne canonique
@ApiProperty({ type: [String], description:
  'Comptes du plan de travail du cabinet (8 caractères) qui alimentent cette ligne. ' +
  'Vide quand le compte saisi est déjà un compte de plan.' })
comptesSources!: string[];
@ApiProperty({ description: 'Nombre exact de comptes sources, même si la liste est plafonnée.' })
sourcesTotal!: number;
```

⚠️ **Plafonner la liste, jamais le compteur** (patron déjà retenu par STORY-370) : une ligne
`411…` peut fondre des centaines d'auxiliaires ; `sourcesTotal` doit rester exact.

### ② Produire la même information sur le chemin **cahiers**

Aujourd'hui `comptesSources` n'existe que sur le chemin Sage. Une balance construite depuis les
cahiers doit porter le compte **tel que le comptable l'a saisi**, même quand il est ramené.

### ③ Accepter 8 caractères **à la saisie**

Les six portes gardées par `isCompteDeDetail` acceptent le compte du cabinet, **conservent le
compte saisi** et **dérivent** le compte de plan :

| porte | aujourd'hui | après |
|---|---|---|
| saisie de recette (`compteProduit`) | refus > 6 | accepté, `compteSaisi` conservé |
| saisie de dépense (`compteCharge`) | refus > 6 | idem |
| règle de rattachement (`surcharges`) | refus > 6 | idem |
| catégorie de dépense (`compteCharge`) | refus > 6 | idem |
| comptes de contrepartie | refus > 6 | idem |
| soumission de balance | refus > 6 | accepté, ramené + `comptesSources` |

⚠️ **La dérivation est celle qui existe déjà** — `normalisation-comptes.ts`, plus long préfixe
du plan. **Ne pas en écrire une seconde** : deux normalisations divergeraient, et l'écart ne se
verrait qu'à la liasse.

### ④ Ce qui ne change PAS, et il faut le tester

- Le **tag** et le **format** de la balance canonique (STORY-101) ;
- ce que reçoit `bilan-service` — la liasse continue de se déposer sur des comptes de plan ;
- l'invariant d'équilibre et les deux contrôles (STORY-147).

---

## Critères d'acceptation

1. `LigneBalanceApercuDto` publie `comptesSources` et `sourcesTotal`, sur les **trois**
   adaptateurs (cahiers, Sage, saisie directe).
2. Une balance importée dont deux comptes fondent rend les **deux** numéros d'origine sur la
   ligne — testé sur le cas réel `44280001` + `44280002` → `442800`.
3. Une recette saisie sur `70730000` est **acceptée**, et la ligne de balance produite porte
   `compte: '707300'` (ou le compte de plan dérivé) **et** `comptesSources: ['70730000']`.
4. Une règle de rattachement sur un compte à 8 caractères est **acceptée** et **s'applique** —
   c'est-à-dire que `estCompteDeDetail` cesse d'être la garde de saisie (elle reste celle de la
   **soumission au plan**).
5. `bilan-service` reçoit exactement ce qu'il recevait avant — testé par comparaison d'une
   balance produite avant/après.
6. Aucune seconde implémentation de la normalisation : un test d'architecture ou une revue le
   constate.
7. OpenAPI régénéré ; types du front régénérés.

---

## Notes

- ⚡ **La donnée décisive était déjà dans le dépôt** : `Balance_des_comptes.pdf` dormait à la
  racine de `MoneyVibes_Apps` et n'avait jamais été ouvert. Il a tranché la question de format
  en une commande. ⇒ **avant d'arbitrer un format métier, chercher un fichier client réel.**
- ⚠️ **Q3 reste ouverte et n'est pas bloquante** : `longueurCompteDetail` vit dans le
  **manifeste du service** alors que le commentaire de STORY-146 admet que sa place est dans
  **l'artefact**. Un cabinet à 8 et un autre à 6 sont deux paramétrages légitimes du même
  référentiel. À traiter quand un second cabinet le demandera, pas avant.
- Consommateur nommé : **FE-046**. Voir `stories/STORY-146.md`, `stories/STORY-172.md`,
  `stories/STORY-086.md`, `stories/STORY-370.md`, `stories/STORY-101.md`.

---

## Progress Tracking

**Statut : `review`** — développée le **2026-09-01**, branche `MNV-424` (`balance-service`),
3 commits : le livrable, les trous comblés par la passe de mutation, le trou trouvé par la
vérification docker.

### Ce que la conception a tranché, et pourquoi

**L'identité canonique reste le compte de plan** (voie B, arbitrage PO du 2026-08-26). Le compte à
8 caractères est **accepté à la saisie**, **conservé tel quel sur la ligne saisie**, et **ramené**
au plan à un seul endroit : l'**agrégation**. La ligne de balance publie ensuite les numéros
d'origine dans `comptesSources` / `sourcesTotal`.

⛔ **Ramener à la SAISIE aurait détruit l'information que la story existe pour conserver.** La ligne
de recette, de dépense, la règle de rattachement et la catégorie gardent le numéro que le comptable
a écrit ; c'est la balance — et elle seule — qui porte le compte de plan.

⚡ **Une seule dérivation, celle qui existait déjà** (AC-6). `ramenerAuPlan` et `estCompteDeTravail`
vivent dans `normalisation-comptes.ts`, à côté de `normaliserCompte` — la fonction que l'import Sage
applique depuis STORY-146. Aucune seconde implémentation : deux normalisations divergeraient, et
l'écart ne se verrait qu'à la liasse.

⚠️ **`estCompteDeTravail` est un sur-ensemble STRICT d'`isCompteDeDetail`** : un compte de plan se
ramène à lui-même, donc tout ce qui passait passe encore, y compris les têtes à deux caractères
(`12`, `13`) dont dépend l'affectation du résultat (STORY-087). Ce qui s'ouvre est exactement le
compte que le plan **sait ramener** — `74000000` (racine `74` non déclarée) reste refusé.

⛔ **Les gardes de saisie sont vérifiées sur le compte BRUT, avant dérivation.** `chiffresDeTete` ne
retient que les chiffres de tête : sans cette ligne, `601; DROP` se ramènerait à `601000`,
parfaitement déposable — la dérivation **blanchirait** une charge utile que STORY-146 avait fermée.

### La 6ᵉ porte : ce que la soumission de balance fait, et ce qu'elle ne fait PAS

**⚠️ Écart assumé avec la lettre du tableau ③, à valider par le PO.** La ligne « soumission de
balance → accepté, **ramené** » est implémentée comme : la soumission **accepte et scelle** les
comptes de travail à côté du compte de plan, sans réécrire `compte`.

**Pourquoi** : le checksum est **calculé par l'adaptateur** sur ce qu'il envoie et **recalculé par le
serveur** sur ce qu'il persiste. Un serveur qui réécrirait `compte` rendrait donc `400 Checksum
invalide` à **tout** client direct envoyant des comptes à 8 chiffres — la fonctionnalité serait
livrée **inerte**. La seule façon de la rendre vivante serait de sceller les lignes *soumises* plutôt
que les lignes *persistées*, c'est-à-dire d'affaiblir le seul contrôle d'intégrité du contrat pour un
cas qu'aucun AC ne demande.

⇒ Ce que la porte fait à la place, et qui est nouveau : **elle refuse tout `comptesSources` qui ne se
ramène pas au compte de sa ligne**. Sans ce contrôle, le champ serait une chaîne libre attachée à un
montant — un client pourrait attribuer « TH 2023 » au solde d'un tout autre compte, et l'écran le
lirait comme un fait établi par la plateforme. Même asymétrie que le CWE-345 relevé sur `sources` en
STORY-370, fermée par la même méthode.

⇒ **Le déblocage de FE-046 est entier** : les cinq portes que l'écran emprunte (recette, dépense,
règle, catégorie, contrepartie) acceptent le compte du cabinet, et les trois adaptateurs publient
`comptesSources` sur la ligne.

### Périmètre : ce qui n'a PAS bougé

- le **tag** et le **format** de la balance canonique (STORY-101) — `comptesSources` est **hors
  checksum**, `v2` inchangé, aucun `v3`, aucune migration ;
- ce que reçoit `bilan-service` : `balance.created` est **inchangé champ pour champ**, et **aucune
  ligne persistée ne porte un compte de plus de 6 caractères** (vérifié en docker) ;
- l'invariant d'équilibre et les deux contrôles de STORY-147 ;
- le **socle d'à-nouveaux** : `lignesReportees` **omet** délibérément les deux champs (les comptes de
  travail d'une ligne appartiennent à la balance de N-1, et `fusionnerParCompte` les propagerait
  sinon à chaque exercice suivant) ; `ANouveauxResponseDto` est inchangé ;
- le **semis** des catégories par défaut garde `isCompteDeDetail` : ce catalogue ne contient que des
  comptes de plan.

### ⚡⚡ Ce que la passe de MUTATION a trouvé — 3 assertions qui ne prouvaient rien

1. **`sourcesTotal: comptesSources.length`** dans `comptesDeTravailDe` — c'est-à-dire **plafonner le
   compteur**, ce que la story interdit explicitement — laissait **107 tests VERTS**. Le cas était
   gardé sur `normaliserEtRegrouper` (chemin **Sage**) et **nulle part** sur la fonction qu'emprunte
   le chemin des **cahiers**.
2. **Retirer `ramener` de `resoudreLibellesCategories` DANS LE SERVICE** laissait **65 tests VERTS** :
   la fonction pure était gardée, le **câblage** libre — l'angle mort exact de MNV-172. Le défaut
   laissé passer **annulait STORY-420** pour tout cabinet saisissant à 8 chiffres : table indexée sur
   `60510000`, ligne portant `605100`, jointure vide, et **tous** les libellés de catégorie de retour
   sur « Autres achats ».
3. **Comparer les comptes DÉRIVÉS au lieu des comptes BRUTS** dans le test de nommage de F-420-5
   laissait **51 tests VERTS** : mes deux catégories nommaient **chacune leur propre** compte, si bien
   que les deux comparaisons donnaient le même verdict. Seul le cas de la **surcharge à la ligne** les
   sépare.

Mutations passées et **toutes rouges** ensuite (17) : garde de saisie désarmée · compte de plan
listé comme source · compteur plafonné (×2) · `buildCanonique` non systématique · validateur sans
contrôle de dérivation · agrégation sans dérivation · câblage du libellé · fusion qui abandonne les
comptes de travail · nommage sur comptes dérivés · les **5 portes** revenues à `isCompteDeDetail` ·
`applicable` retombé sur `isCompteDeDetail` · `versLigne` sans repli · les deux invariants
liste/compteur du validateur · aperçu d'import servant des champs indéfinis.

### ⚡⚡ Ce que la VÉRIFICATION DOCKER a trouvé, qu'aucun test ne voyait

**L'aperçu d'import Sage ne publiait pas les deux champs.** `previewLines` est une **liste blanche**
projetée champ par champ : les valeurs étaient calculées par la normalisation, persistées en base,
servies par la balance et par l'aperçu des cahiers — et **absentes du seul écran où le comptable
relit ce qui va être écrit**. Aucune suite ne regardait le **contenu** d'une `previewLine` : les trois
occurrences de `previewLines` dans les tests valaient toutes `[]`. Et `regroupements` ne suffisait
pas : il dit la même chose **par compte** et **plafonné à 20**.

⚠️ Le premier test écrit pour combler ce trou posait `toHaveProperty('comptesSources')` — la mutation
« servir des champs **indéfinis** » restait **VERTE** (Jest voit la clé, pas la valeur). Le test
assert désormais la **valeur** fondue, plus une seconde ligne à `[]`/`0`.

⚠️ **Le hot-reload a menti** : après le correctif, `nest --watch` annonçait « Found 0 errors » en
servant toujours l'ancien code. Un `docker compose restart balance-service` a été nécessaire — le
piège documenté de [[hot-reload-ment-verif-docker]].

### Vérification docker — stack NEUVE (`down -v`), état FINAL

`docker compose up -d mongo kafka redis balance-service auth-service`, compte tenant créé via l'IdP,
read-models semés (`orgkycstatuses`, `orgbalanceentitlements`, `dossiers_dossier`, `axes_dossier`).

| Ce qui est prouvé | Résultat |
|---|---|
| **AC-3** — recette saisie sur `70730000` | `201`, `compteProduit: "70730000"` **conservé** |
| **AC-4** — règle de rattachement sur `70730009` | `200`, **`applicable: true`** |
| porte catégorie `60510000` · porte dépense · porte contrepartie `52100001` | `201` / `201` / `200` |
| borne — `74000000` (racine `74` non déclarée au plan) | `400 COMPTE_INCONNU` |
| **AC-3** — balance des cahiers | `707300` ← `["70730000","70730002"]`, `sourcesTotal: 2` |
| non-régression **STORY-420** | `605100` porte `libelleSource: CATEGORIE` + « Électricité CEET » |
| lignes sans compte de travail | `comptesSources: []`, `sourcesTotal: 0` — **servis, jamais absents** |
| **AC-2** — import Sage | `44280001` + `44280002` → `442800`, sur `previewLines` **et** `regroupements` |
| **persistance réelle** (`mongosh`) | 6 lignes ; **0** champ absent · **0** incohérence liste/compteur · **0** compte listé égal à celui de sa ligne · **0** compte > 6 caractères |
| **AC-5** — `balance.created` | payload **inchangé champ pour champ**, `checksumVersion: v2` |
| **atomicité** — `comptesSources` falsifié (`70100001` sur la ligne `601000`) | `400`, et **0 balance / 0 événement** écrits (1 → 1) |
| `comptesSources` contenant le compte de sa propre ligne | `400`, message explicite |
| `comptesSources` cohérent (`60100001` → `601000`) | le refus ne porte **plus** dessus (checksum) |

### Portes de qualité

Lint **0 warning** · build OK · **3 544** unitaires + **877** e2e verts · couverture
**99,14 / 92,35 / 98,65 / 99,24** (seuils 65/90/90/90).

### AC-7 — OpenAPI

Les deux champs sont déclarés sur `LigneView` (balance persistée), `LigneBalanceApercuDto` (aperçu
cahiers), `PreviewLineDto` (aperçu d'import) et `LigneBalanceDto` (soumission, **facultatifs**). Un
test de contrat e2e verrouille leur présence **et** leur caractère requis à la lecture : non déclaré,
un champ réellement rendu est **élagué** par tout client généré (leçon STORY-370). ⚠️ Les **types du
front** restent à régénérer côté FE-046 — hors périmètre de ce dépôt.
