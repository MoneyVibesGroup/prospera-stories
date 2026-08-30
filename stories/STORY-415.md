# STORY-415 : Les codes de retraitement sont publiés NUS — dix-sept cases de liasse sans un seul libellé

Status: done

**Épic :** EPIC-023 — Fiscalité (résultat fiscal, liquidation, TVA, provisions, TPU)
**Service :** **le paquet fiscal `TG@YYYY`** (STORY-078) — **aucune ligne de code applicatif**
**Points :** 3 · **Sprint :** S20
**Origine :** relevée le **2026-08-26** en construisant la maquette **FE-050**, en confrontant
`CodesRetraitement` au paquet fiscal du projet (`referentiels/paquet-fiscal-togo-2026.json`).

---

## Le fait, relevé à la source

Le paquet publie **dix-sept codes de la liasse** — douze réintégrations, cinq déductions :

```json
"resultatFiscal": {
  "reintegrations_codes": ["10","11","12","15","20","25","30","40","45","50","60","80"],
  "deductions_codes":     ["90","95","100","120","125"]
}
```

**Et rien d'autre.** Pas un libellé. Le résolveur du service le dit sans détour :

```ts
// fiscal.regles.ts — `togo@2026` publie 12 + 5 codes SANS libellés :
// `libelles` sort donc vide, et c'est le contrat, pas un bug.
const libelles: Record<string, string> = {};
for (const cle of ['reintegrations_libelles', 'deductions_libelles']) { … }
```

⚡ **Les deux clés que le résolveur cherche existent déjà dans le code et n'existent
pas dans la donnée.** Le mécanisme est en place, complet, testé — il lit un objet
`code → libellé` **additif**, absent aujourd'hui. Cette story ne demande donc **aucune
ligne de code applicatif** : elle demande de **remplir** ce que le service sait déjà lire.

---

## Ce que ça coûte, concrètement

`PosteRetraitementResponseDto.libelle` est optionnel, et sort donc **toujours absent**.
Sur l'écran « Résultat fiscal » (FE-050), la grille de la liasse affiche dix-sept lignes
dont la seule identité est un **nombre** : `10`, `11`, `12`, `15`, `20`…

- **À la lecture** — le comptable qui reprend un dossier ne peut pas vérifier qu'un
  montant est dans la bonne case sans ouvrir la liasse GUIDEF papier à côté.
- **À la saisie** — il doit choisir une case parmi dix-sept nombres. Le serveur validera
  que le code **existe** (`CODE_RETRAITEMENT_INCONNU`) et que le **sens** est le bon
  (`SENS_INCOHERENT`), donc un code de réintégration saisi en déduction est refusé.
  ⛔ **Mais aucune garde n'existe contre le code ADMIS ET FAUX** : `45` au lieu de `40`
  passe les trois refus, entre dans l'assiette pour le bon montant, et **alimente la
  mauvaise case de la liasse**. Le résultat fiscal reste juste ; sa **ventilation** ne
  l'est plus, et rien en aval ne bouge. C'est le mode de panne de STORY-414, transposé.
- **Au dépôt** — la DSF est déposée case par case. Une ventilation fausse ne se voit
  qu'au contrôle.

⛔ **Et le contournement n'existe pas.** Nommer `20` « Amendes et pénalités » dans
l'écran ou dans le service serait **écrire du fiscal en dur** — ce que NFR-A06 interdit,
et ce qui deviendrait faux au premier code que la loi de finances déplace. Le commentaire
du type le dit déjà mot pour mot. **Le seul endroit juste est le paquet.**

⚠️ **Ce que l'écran fait en attendant, et pourquoi ce n'est pas suffisant.** FE-050
affiche, à la place du libellé, ce que le contrat porte réellement : la **justification**
écrite par le comptable (postes manuels), le **motif** de non-déductibilité (postes
agrégés), le **type de taxe** (registre). C'est honnête et c'est utile — mais cela ne
nomme la case que **pour les cases déjà alimentées**. Les douze cases vides restent
douze nombres.

---

## Périmètre

**Inclus**

- Ajouter `reintegrations_libelles` et `deductions_libelles` au paquet `TG@2026` —
  `code → libellé`, **transcrits des feuilles « Résultat fiscal » et « Détail
  réintégrations / déductions » de la liasse**, sources OTR à l'appui.
- Un libellé **par code réellement publié**, et rien de plus : une clé qui ne
  correspondrait à aucun code de `reintegrations_codes` serait un libellé orphelin.
- Recalculer le **checksum** du paquet et le faire remonter par les artefacts
  (`_meta`), puisque `paquetFiscal.checksum` est publié à chaque calcul.

**Hors périmètre**

- **Toute modification du service.** Le résolveur lit déjà les deux clés ; le DTO porte
  déjà `libelle?`. Si un développeur se retrouve à toucher `fiscal.regles.ts`, c'est que
  la story a été mal comprise.
- **Deviner la correspondance `motif → code`** (`CHARGE_NON_JUSTIFIEE` → quel code ?).
  C'est une **autre** donnée du paquet, absente elle aussi, et elle n'est pas nommer un
  code : elle est en **choisir un**. À ficher séparément si le PO le veut.
- Les codes eux-mêmes : ils sont publiés, validés, et cette story n'y touche pas.

---

## Critères d'acceptation

1. `GET /dossiers/{id}/fiscal/resultat-fiscal` rend un `libelle` **sur chaque poste
   codé** de `postesDsf`, pour un dossier dont le paquet est `TG@2026`.
2. Un paquet qui ne publie **aucun** libellé continue de fonctionner : `libelle` reste
   absent, aucun poste n'est perdu, aucun libellé n'est inventé — le comportement
   d'aujourd'hui reste le comportement de repli.
3. La liste des libellés est **exactement** indexée sur les codes publiés : un test
   vérifie qu'aucune clé de `*_libelles` ne désigne un code absent de `*_codes`, et
   nomme les codes restés sans libellé plutôt que de les taire.
4. Chaque libellé porte sa **référence de source** dans le paquet (feuille de liasse ou
   article), au même titre que les autres rubriques transcrites.

---

## Notes

- ⚠️ **Cette story est une story de DONNÉE.** Elle est petite en code et lourde en
  vérification : chaque libellé est une affirmation fiscale, et un libellé faux est
  **pire** qu'un libellé absent — il fait ranger un montant dans une case avec
  confiance. Elle demande la même prudence que la transcription du barème CNSS.
- ⚠️ Le paquet porte déjà une réserve générale à lever (`aFaire`) et son `statut`
  précise « reste la VALIDATION par un expert-comptable/fiscaliste togolais avant mise
  en production ». Les libellés de liasse entrent dans ce même périmètre de validation.
- **Voisine de STORY-397** (« les codes sont validés mais jamais publiés ») sans se
  confondre avec elle : 397 demande de **publier la liste**, 415 demande de la rendre
  **lisible**. ⚡ Et l'une n'attend pas l'autre — cf. l'amendement porté à STORY-397 le
  2026-08-26 : `postesDsf` publie déjà la grille complète, codes **et sens**, à qui
  appelle `GET /resultat-fiscal`.
- Consommateur nommé : **FE-050**.

---

## Progress Tracking

**Statut : `done`** — clôturée le **2026-08-30**. PR **#70** (`balance-service`) et **#20**
(`dossier-service`) rebase-mergées **ensemble** sur `dev`, branches supprimées.

### ⚡ La prémisse « zéro ligne de code applicatif » était FAUSSE — à moitié

La story affirmait que le mécanisme existait « complet et testé », et qu'un développeur qui
toucherait `fiscal.regles.ts` aurait mal compris. La transcription faite, la **vérification docker**
a montré l'inverse sur la seule ligne qui portait un montant :

```
ALIMENTÉE > 25 | 1 200 000 | MANUEL | libelle: ABSENT
codés sans libellé : ['25']
```

Seize cases **vides** sortaient nommées, et la case **remplie** sortait en numéro nu. La cause est
d'une ligne : `construireTableauDsf` posait le libellé sur le poste **de remplacement**
(`alimente ?? { code, libelle, … }`), donc **jamais** sur un poste réellement alimenté — or un
retraitement manuel est projeté par `versPosteManuel`, qui n'a **pas** accès aux codes du paquet et
n'en porte donc aucun. AC-1 exige « un `libelle` **sur chaque poste codé** » : le correctif est
dans le périmètre, la note « hors périmètre » reposait sur une lecture du code qui ne tenait pas.

⛔ **Et aucun unitaire ne pouvait le voir** : tous construisaient la grille **vide**
(`construireTableauDsf([], CODES_TOGO)`). C'est le mode de panne le plus coûteux de ce dépôt — un
test vert sur le cas qui n'arrive jamais.

### Conception

| Décision | Ce qu'elle tranche |
|---|---|
| **D-415-1** | Les 17 libellés sont **repris à l'identique** des postes `RESULTAT_FISCAL` de `syscohada-revise@2.1` — seule transcription de la liasse GUIDEF du projet. Typographie comprise (`exédentaires`, `sociéts`, doubles espaces) : corriger la liasse dans une **copie** aurait fait diverger deux artefacts sans que rien ne le signale. |
| **D-415-2** | La divergence est **interdite par un test**, pas par une convention : `referentiel-assets-coherence.spec.ts` compare les deux artefacts **au caractère près**. Une correction faite un jour côté `bilan-service` fera **rougir** la suite ici tant que le paquet ne l'aura pas suivie. |
| **D-415-3** | AC-4 (« chaque libellé porte sa source ») est tenu **au niveau de la table** (`reintegrations_libelles_source`, `deductions_libelles_source`), « au même titre que les autres rubriques transcrites » — qui portent toutes **une** source de rubrique. Une source **par libellé** aurait exigé un objet par code, que le résolveur (qui n'accepte que des chaînes) ne sait pas lire : ce serait le changement de code que la story écarte. |
| **D-415-4** | `construireTableauDsf` nomme la case **alimentée** aussi, sans jamais **écraser** un libellé déjà porté par le poste. |

### Implémentation

| Fichier | Ce qui change |
|---|---|
| `scripts/referentiels/sources/paquet-fiscal-togo-2026.json` | `reintegrations_libelles` (12) + `deductions_libelles` (5) + leurs deux sources — **23 lignes**, aucune autre touchée |
| `src/modules/referentiel/assets/…` + `paquet-fiscal-registry.ts` | artefact reconstruit, empreinte `fcf5bcf4…` (ex-`478c4753…`) |
| `fiscal.regles.ts` | **le correctif** : la case alimentée porte son nom (D-415-4) + commentaire de contrat remis à jour |
| `types/fiscal.ts`, `dto/fiscal-response.dto.ts`, `referentiel.service.ts` | quatre affirmations devenues **fausses** (« `togo@2026` n'en publie aucun ») corrigées — dont **une description Swagger**, donc du contrat publié |
| `referentiel-assets-coherence.spec.ts` | 3 tests **sur les vrais octets** : les 17 nommés · aucun orphelin + source · identité avec le référentiel |
| `fiscal.regles.spec.ts` | le test de non-régression de la case alimentée ; le test `togo@2026 ne publie AUCUN libellé` **renommé** — il serait resté vert en affirmant le contraire de la vérité |
| `test/referentiel.e2e-spec.ts` | l'assertion « la clé `libelle` est absente » **inversée** : c'est le livrable |
| `dossier-service` (2ᵉ dépôt) | artefact recopié + empreinte épinglée reportée (garde de byte-identité) |

### Portes DoD

**balance-service** : lint 0 warning · build OK · **3 247** unitaires · **817** e2e · couverture
**99,14 / 92,06 / 98,65 / 99,25**.
**dossier-service** : lint 0 · build OK · **1 126** unitaires · **255** e2e · couverture
99,28 / 93,83 / 96,68 / 99,30.

### Passe de mutation — 4 mutations, 4 rouges **par assertion**

| Mutation (donnée valide, jamais une erreur de compilation) | Effet |
|---|---|
| le libellé du code `45` disparaît du paquet | rouge, et le test **nomme** `45` (AC-3) |
| un libellé orphelin `999` est ajouté | rouge sur le test des **octets bruts**. ⚡ Le test qui passe par le résolveur, lui, reste **vert** : celui-ci **écarte** les orphelins — un contrôle d'orphelins écrit à travers lui aurait été **vacant** |
| un libellé est **reformulé** (`exédentaires` → `excédentaires`) | rouge sur la seule identité inter-artefacts — les deux autres restent verts : les trois tests gardent bien trois choses différentes |
| le correctif D-415-4 est retiré (retour au `?? {…}`) | rouge : la case alimentée reperd son nom |

### Vérification docker — sur la stack réelle, et c'est elle qui a trouvé le défaut

Les deux conteneurs portent le **même** sha256 (`fcf5bcf4…`). Côté `dossier-service`, la garde de
byte-identité est **paresseuse** : elle ne s'exécute pas au boot. Elle a donc été déclenchée
explicitement dans le conteneur — `chargerPaquetEmbarque('TG')` rend le paquet (donc sha conforme)
et `echeancesDuPaquet('TG')` rend toujours `["31-01","31-05","31-07","31-10"]` : mise à niveau
d'**octets**, comportement **inchangé**.

Côté `balance-service`, sur un dossier réel (`SOCIETE VERIF 415 SA`, balance 2026, un retraitement
manuel code `25` de 1 200 000) :

| Surface | Avant | Après |
|---|---|---|
| `GET /referentiels/actifs` | `478c4753…` | **`fcf5bcf4…`** |
| `GET /referentiels/reintegrations` | 12 codes **nus** | 12 codes **nommés** |
| `GET …/fiscal/resultat-fiscal` → `postesDsf` | 17 cases sans libellé | **17 cases nommées**, `codés sans libellé : []` |

⚠️ **Le hot-reload a menti une fois de plus** : `Found 0 errors` affiché, `dist` recompilé avec le
correctif, et la réponse HTTP **inchangée** — le process servait encore l'ancien module. Un
`docker compose restart balance-service` a été nécessaire pour que la vérification dise la vérité.

### ⛔ Deux constats relevés, hors périmètre, à ficher si le PO le veut

1. ⚡ **Le code `10` n'est pas une réintégration.** Le paquet le publie dans
   `reintegrations_codes`, et la liasse le nomme **« BENEFICE NET COMPTABLE ou PERTE NETTE
   COMPTABLE »** — c'est la **ligne de départ** du calcul, pas un retraitement. La transcription
   ne crée pas le défaut : elle le **rend visible**. Aujourd'hui `sensDuCode('10')` vaut
   `REINTEGRATION`, donc une saisie manuelle sur la case `10` est **acceptée** et s'ajoute à
   l'assiette. La story écarte explicitement les codes eux-mêmes (« ils sont publiés, validés, et
   cette story n'y touche pas ») — le constat est donc **posé, pas corrigé**.
2. **Le libellé d'une case de liasse est désormais publié par DEUX artefacts** du même service :
   le paquet fiscal (`pays × année`) et le référentiel comptable (postes `RESULTAT_FISCAL`, d'où
   il est transcrit) — alors que D-078-1 range les libellés de la grille de **liquidation** du
   côté du référentiel. Deux mécanismes pour un même besoin. La duplication est **rendue sûre**
   par D-415-2, elle n'est pas **résolue** : trancher demande une story d'architecture.

---

## Progress Tracking — clôture

**Statut : `done`** — implémentée, validée, vérifiée sur stack docker, revue (**4 constats, 4
corrigés**), revue de sécurité (**0 vulnérabilité**, confiance ≥ 80). PR **#70**
(`balance-service`, 3 commits) et **#20** (`dossier-service`, 2 commits) rebase-mergées
**ensemble** — un artefact gardé par byte-identité ne se merge pas d'un seul côté.

Les 4 critères d'acceptation sont tenus : **AC-1** (les 17 postes codés de `postesDsf` nommés, et
depuis la revue **`reintegrations`/`deductions` aussi**), **AC-2** (paquet muet ⇒ repli intact,
aucun libellé inventé), **AC-3** (aucun orphelin, et les codes nus sont **nommés** par le test, pas
comptés), **AC-4** (chaque table porte sa source, et le test garde **sa** page, pas le mot
« GUIDEF »).

### Revue de code — 4 constats, 4 corrigés (commits `ab3a856` / `d958566`)

| Constat | Ce qu'il valait |
|---|---|
| **F-415-1 — bloquant** | le libellé s'arrêtait à `postesDsf` : la **même case** sortait anonyme dans `reintegrations`/`deductions` de la **même réponse**, et la liste mélangeait postes nommés (cahiers) et numéros nus (saisies manuelles) — la différence tenant à leur seule **origine**. Le libellé est désormais posé **à la naissance** du poste. ⛔ `GET …/fiscal/retraitements` n'en reçoit volontairement aucun : lui faire résoudre le paquet ferait **refuser** une année non packagée là où la liste répondait — une régression pour un libellé. |
| **F-415-2** | l'exemple Swagger associait le code `20` au libellé du code `25`. Inoffensif tant que le paquet ne publiait rien, **contrevérité** depuis : un intégrateur câblant son écran sur l'exemple range une provision sous « amende », au moment même où la story existe pour que la case soit nommée juste. |
| **F-415-3** | deux commentaires de `dossier-service` annonçaient un échec **au boot** que la garde ne produit pas : elle est **paresseuse**. Une empreinte non reportée laisse le service démarrer et `/health` répondre `up`. « Le service démarre » ne prouve rien — c'est pourquoi la vérification docker a dû la déclencher explicitement. |
| **F-415-4** | le contrôle d'AC-4 n'exigeait que le mot « GUIDEF » : une source de déductions citant la **page des réintégrations** restait verte. |

Deux mutations de plus, deux rouges par assertion (le poste manuel reperd son libellé ; la source
des déductions cite la page 59) — **6 mutations au total sur la story, 6 rouges**.

### Revue de sécurité — 0 vulnérabilité

| Piste instruite | Pourquoi elle ne tient pas |
|---|---|
| Pollution de prototype par les clés du paquet (`libelles[code] = valeur`) | `JSON.parse` crée bien `__proto__` en propriété propre, mais la garde `typeof valeur === 'string'` rend l'affectation **no-op** (le setter de `Object.prototype` ignore les primitives). Et la clé devrait figurer dans les listes de codes, donc dans l'artefact **épinglé par sha256**. |
| Libellé faux ⇒ montant rangé dans la mauvaise case | aucun regroupement ni aucune imputation ne se fait par **libellé** : l'appariement est par `code`, le signe par `sens`. Le libellé est décoratif au sens strict du calcul. |
| Garde sha256 contournable / temps constant | rejet **avant tout parse et sans mise en cache** des deux côtés. Comparaison à temps constant sans objet : ce n'est pas un secret mais l'empreinte d'un fichier local, sans oracle ni canal de timing. |
| Fuite par message d'erreur | l'`Error` nu de `dossier-service` (nom de fichier + les deux sha) est normalisé en `500` générique par `AllExceptionsFilter` ; côté `balance-service`, `502 « Paramétrage non intègre »` sans attendu/obtenu. |
| Élargissement de surface de lecture | les 17 libellés sont du **texte de loi**, identique pour tous les tenants et déjà publié par le référentiel comptable. Routes inchangées, `orgId` du JWT, `dossierId` du scope gardé. |
| Traversée de chemin sur `readFileSync(join(__dirname,'assets',…))` | le nom de fichier est une **constante** du `Map` littéral, jamais dérivé du `pays`. Aucun `ServeStatic` : les artefacts ne sont pas servis en HTTP. |

⚠️ **Réserve nommée, non retenue** : la garde de byte-identité de `dossier-service` étant
paresseuse, un déploiement où l'artefact n'aurait pas été recopié casse le portefeuille en 500 à
chaque requête (rien n'est mis en cache sur ce chemin d'échec) — défaut de **disponibilité en état
de déploiement déjà cassé**, préexistant, non déclenchable par un attaquant. Ici les octets sont
conformes.
