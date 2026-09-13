# STORY-499 : Membres et parts sociales — le sociétaire d'une mutuelle n'est pas un client

Status: in-progress

**Complexité :** high

**Épic :** EPIC-122 — Membres et comptes de dépôts
**Service :** `microfinance-service` + `dossier-service` *(publication de la devise — contrat `dossier.*`, 2 PR intégrées ensemble)*
**Points :** 10 *(réestimée de 5 le 2026-09-13 : deux agrégats, la devise sur deux dépôts, le remplacement des sondes du socle)* · **Sprint :** S20
**Origine :** découpage `epics-microfinance-2026-08-27.md`.

---

## Le fait

Dans une mutuelle d'épargne et de crédit, celui qui emprunte est **sociétaire**, pas client. La
distinction n'est pas de vocabulaire : elle porte **le capital social**. Les parts sociales
souscrites alimentent les fonds propres de l'institution, et leur remboursement les diminue.

⚡ Et c'est exactement là que le piège du référentiel se referme : en RCSFD, **`57` est le capital
social**, quand `57` est la Caisse en SYSCOHADA. Un module qui rangerait des parts sociales au
« 57 » d'un plan SYSCOHADA les présenterait en **disponibilités**.

## Requalification mesurée avant de brancher (2026-09-13)

| Affirmation | Verdict | Mesure |
|---|---|---|
| Un membre est rattaché à une **agence** (AC-1) | **FAUX — le concept n'existe nulle part** | aucun service n'écrit d'agence ; seule la spine de `reseau-service` la définit (agrégat `Agence`, topic `reseau.noeud.created`), service **sans code**, non planifié |
| Le compte d'une part sociale « vient du référentiel du dossier » (AC-5) | **PARTIEL** | le référentiel **valide** un compte (`exigerCompteDuPlan`), il n'en **désigne** aucun : aucun marqueur « parts sociales ». Plan RCSFD : `57` Capital social, `5711` Capital souscrit appelé, `573` Actionnaires, associés ou membres… ; **aucun** compte « parts à rembourser » ni dette envers un démissionnaire |
| Les parts sont des mouvements, jamais un solde (AC-2) | **VRAI, sans précédent de somme** | aucun `$sum` dans le dépôt ; meilleur modèle append-only : `decisions_axes` de `dossier-service` (on corrige en ajoutant) |
| L'unicité est portée par le dossier (AC-4) | **VRAI, patron existant** | index unique composé nommé (`INDEX_NIF_SOCIETE`) + détection `E11000` ; ⚠️ le précédent NIF **nomme** le doublon, un membre exige un refus **générique** |
| ⚠️ La devise (hors fiche) | **FAUX — non publiée** | `dossier-service` stocke la devise mais ne la publie dans aucun événement `dossier.*` ; et il met **XOF par défaut** à la création : une fois publiée, elle serait **toujours** présente, et le refus « montant sans devise » ne protégerait plus rien |
| ⚠️ Les données personnelles (hors fiche) | **`securite.md` n'en dit rien** | précédent applicable (`bilan-service`) : une donnée personnelle **n'entre jamais dans un journal append-only**, sinon elle n'est plus rectifiable |

### Décisions du 2026-09-13

- **D-499-A — l'agence est RETIRÉE de 499 (décision user).** Un emplacement inerte documenté, déclaré non
  livré, en attendant que `reseau-service` en devienne propriétaire. Un code saisi en texte libre serait
  devenu, de fait, la clé sur laquelle STORY-506 agrège : une faute de frappe y aurait créé une agence
  fantôme, avec une somme exacte sur une clé fausse.
- **D-499-B — la devise est EXPLICITE pour un dossier MICROFINANCE (décision user).** `dossier-service`
  exige une devise saisie à la création de ce type — plus de XOF implicite — et publie la devise dans
  `dossier.*`. Sans cela, AD-11 (« aucune constante XOF ») serait contournée en amont.
- **D-499-C — le numéro de sociétaire est SAISI par l'IMF (décision user)**, unique par dossier et garanti
  par un index : il reprend le registre existant de l'institution.
- **D-499-D — aucun compte n'est choisi dans 499.** AC-5 interdit de coder un compte, et 499 ne produit pas
  de balance : le choix appartient à l'adaptateur de balance (AD-5). Hook inerte documenté.
- **D-499-E — l'identité d'un membre vit sur sa fiche, jamais sur un mouvement** : un mouvement est
  append-only, une identité doit rester rectifiable.

### Consommateurs de `dossier.*` — mesurés

L'ajout de `devise` est **additif et sans risque** pour `balance-service`, `bilan-service` et
`document-service` : tous trois valident les seuls champs connus puis recopient un objet explicite — un
champ en plus est ignoré, sans rejet, **aucune PR chez eux**. `microfinance-service` est **déjà prêt** (hook
posé par STORY-497). ⇒ **2 PR** : `dossier-service` et `microfinance-service`.

## Critères d'acceptation

- [ ] AC-1 — Un membre : identité, date d'adhésion, statut (actif, radié, décédé), rattachement à
      une **agence**. Le membre appartient à un **dossier** (AD-6).
- [ ] AC-2 — Les **parts sociales** sont des **mouvements** (souscription, remboursement,
      annulation), jamais un solde qu'on édite — AD-1 appliqué au capital.
- [ ] AC-3 — Un membre radié ou décédé **conserve son historique** : ses crédits et ses dépôts
      restent lisibles et comptables. Une IMF ne supprime pas un membre, elle le clôt.
- [ ] AC-4 — L'unicité d'un membre est portée par un identifiant **du dossier**, pas global : deux
      IMF différentes peuvent avoir un membre du même nom, et ce ne sont pas les mêmes.
- [ ] AC-5 — ⚠️ **Aucun rattachement de compte codé ici** : le compte SYSCOHADA/RCSFD d'une part
      sociale vient du **référentiel du dossier** (AD-8), comme partout ailleurs.

## Progress Tracking

**Statut : `in-progress` — les deux volets livrés, revus et corrigés ; vérification docker en cours.**
PR `dossier-service` **#27** et PR `microfinance-service` **#3**, à intégrer **ensemble** (contrat d'événement).

### Volet `dossier-service` — la devise publiée, et explicite pour une IMF

- `DossierEtatV1` publie `devise` sur `dossier.created` et `dossier.updated`, **lue par son nom** : la leçon de
  STORY-496 (un spread de document Mongoose perd les chemins de schéma en silence) est appliquée et prouvée sur un
  **vrai document Mongoose**.
- **D-499-B** : un dossier `MICROFINANCE` sans devise ⇒ `400 DEVISE_REQUISE` ; hors devises tenues ⇒
  `400 DEVISE_NON_TENUE` (D-499-G). Les autres types gardent XOF par défaut, non-régression prouvée.
- **D-499-F** : le retrait de la devise est refusé pour tous les types (`$unset`, `null`, vide, `$rename`).
- ⚡ **Un test vacant démasqué par sa propre mutation** : le type `devise?: string | null` neutralisait la conversion
  implicite, si bien que le test « valeur non textuelle » ne mesurait rien. Retypé, la mutation rougit.
- **Revue : aucun constat.** Le point critique est vérifié **dans le code des quatre consommateurs** de `dossier.*` :
  aucun ne rejette la charge portant le champ en plus — pas de poison-pill.
- Portes, rejouées en session : **1 352 unitaires / 299 e2e**, couverture 99,49 / 94,75 / 98,02 / 99,52.

### Volet `microfinance-service` — membres et parts sociales

- **Membres** : numéro de sociétaire saisi (D-499-C), unique **par dossier**, doublon ⇒ 409 **générique** ;
  identité rectifiable, jamais sur un mouvement (D-499-E) ; clôture sans suppression (AC-3) ; réactivation d'un
  radié **non livrée** (D-499-L).
- **Parts** : mouvements append-only, solde **dérivé** jamais stocké, annulation en contre-mouvement, double
  annulation bloquée par **index unique** ; devise lue sur le dossier, jamais de repli (AD-11) ; membre radié ⇒ plus
  de souscription, remboursement permis (D-499-F).
- **Concurrence (D-499-J)** : chaque écriture commence par incrémenter un compteur sur la fiche du membre, **dans la
  transaction et avant toute lecture du solde** ; deux remboursements concurrents se sérialisent.
- **Agence (D-499-A)** et **compte comptable (D-499-D)** : emplacements inertes documentés, aucune donnée en base.

### Revue du volet microfinance — un bloquant, corrigé

- ⛔ **Aucune garde ne vérifiait le TYPE du dossier.** Une organisation habilitée pouvait créer membres et parts
  **dans son dossier d'entreprise**, « Mon cabinet » compris, avec le XOF implicite : **D-499-B était contournée
  exactement là où elle devait fermer le trou**. Pire, un dossier d'entreprise en JPY ou KWD aurait reçu des parts à
  l'échelle 2. Le test du socle qui prouvait ce refus avait disparu avec les sondes. **Corrigé** : un garde global
  résout le référentiel du dossier (`409 REFERENTIEL_DOSSIER_INDETERMINE`), et `portee-dossier.invariant.spec.ts`
  **interdit à un nouveau contrôleur de l'oublier**.
- **Un remboursement était comparé au solde total, pas au solde à sa date** : on pouvait rembourser en février des
  parts souscrites en juin, et le capital d'un exercice devenait négatif à sa clôture. **Corrigé** : le solde ne peut
  devenir négatif **à aucune date** (`409 SOLDE_PARTS_NEGATIF_A_UNE_DATE`), pour le remboursement et l'annulation.
  Les mouvements d'un même jour se **compensent** : une date sans heure ne dit rien de l'ordre dans la journée, et
  l'identifiant, généré hors transaction et réutilisé au rejeu, n'est pas croissant sous concurrence.
- Sécurité : aucune vulnérabilité (IDOR, données personnelles masquées dans pino, bornes du montant).
- Portes sur l'état final, rejouées en session : **1 154 unitaires / 77 suites**, **84 e2e** et 10 sautés (la suite
  Mongo), couverture 99,68 / 94,53 / 99,34 / 99,71.

### ⚠️ Deux points dits plutôt que tus

- **Le dépôt `microfinance-service` n'a AUCUNE CI** (rien sous `.github`), et la seule preuve de la concurrence sur
  Mongo réel (`parts-sociales.mongo.e2e-spec.ts`) est sautée sans `MONGO_INTEGRATION_URI`. Son saut est désormais
  **visible** dans la sortie (test sentinelle « NON EXÉCUTÉE ») et la commande est documentée — mais **une régression de
  la concurrence passerait toute suite automatique au vert**. Créer la CI est une décision d'infrastructure, hors
  story.
- **Un test a rendu 404 une seule fois** pendant les correctifs, sur une machine chargée. **Non reproduit** : cinq
  exécutions complètes de sa suite, 33/33 à chaque fois. Cause **non établie** — consigné comme non reproduit, pas
  comme résolu.

## Notes

- Voir [[STORY-497]] (socle), [[STORY-422]] (44 racines communes divergentes).
