# STORY-1106 : Les garanties saisies par le cabinet, leur décote et la couverture retenue

Status: ready-for-dev — **créée le 2026-11-21** à la demande de l'utilisateur, après validation de la maquette de FE-140
(PR #741). Non slottée : à placer au prochain plan.

**Service :** `prospera-bilan-service`, module `financement` · **Points :** 5
**Dépend de :** STORY-1083 (livrée), STORY-1104 (le montant demandé, le pro forma du gage, le contrat des documents).
AP-50 porte les décotes par défaut ; sans lui, la table de repli de D-1106-3 s'applique.
**Débloque :** STORY-1086 (les garanties retenues dans la synthèse), STORY-1109 (note et plan d'affaires), FE-154.
**Écran :** FE-154 (étape 5 « Les garanties »).
**Suite :** STORY-1110.

---

## Pourquoi

STORY-1083 a laissé un champ texte libre `garanties`. Une banque ne retient pas la valeur qu'on lui déclare : elle applique une
**décote** (un camion vaut 60 % de sa valeur de pro forma pour elle, une hypothèque 70 %) et juge la **couverture** du prêt
sur cette valeur retenue. Le cabinet doit donc saisir les garanties **une à une**, voir la couverture déclarée et la couverture
retenue, et fournir la pièce qui justifie chacune.

**Décision de l'utilisateur (20-21/11) :** les garanties sont **saisies par le cabinet**, jamais prédéfinies ; la suggestion du
gage (le matériel financé) n'est **jamais ajoutée d'office**.

## Ce qui est attendu

1. **Des garanties structurées**, 20 au plus, saisies, modifiées, retirées par le cabinet.
2. **Pour chacune** : type, garant ou bien, description, valeur déclarée (ou pourcentage de couverture pour un fonds de
   garantie), **décote** de la banque (proposée selon le type, modifiable), **valeur retenue**, pièce justificative.
3. **Les deux couvertures** : déclarée et retenue, en pourcentage du prêt demandé.
4. **Une suggestion**, jamais appliquée seule : le matériel financé comme gage.

## Décisions retenues par défaut (contestables)

- **D-1106-1 — Une garantie** : `id`, `type` ∈ `HYPOTHEQUE`, `GAGE_MATERIEL`, `NANTISSEMENT_FONDS`, `CAUTION`,
  `DEPOT_A_TERME`, `FONDS_GARANTIE`, `ASSURANCE_DELEGATION`, `AUTRE` ; `garant` (2 à 200, le nom du garant ou du bien) ;
  `description` (3 à 500) ; `valeurDeclaree` (entier FCFA ≥ 0) ; `pourcentageCouverture` (0 à 100, **seulement** pour
  `FONDS_GARANTIE`) ; `patrimoineDeclare` (entier, **seulement** pour `CAUTION`) ; `decotePct` (0 à 100, une décimale) ;
  `decoteSurchargee` (booléen) ; `valeurRetenue` (calculée) ; `document` (la pièce justificative, contrat de STORY-1104
  D-1104-9, `cible = GARANTIE`, facultative à la saisie, attendue par STORY-1085).
- **D-1106-2 — Les calculs** (arithmétique entière, demi vers le haut, NFR-3).
  - `valeurRetenue` = `valeurDeclaree` × (100 − `decotePct`) ÷ 100, arrondie au franc.
  - Un `FONDS_GARANTIE` n'a pas de valeur saisie : `valeurDeclaree` = `pourcentageCouverture` × montant demandé ÷ 100. Référence :
    ANPGF, couverture 50 % du prêt de 25 000 000 ⇒ valeur 12 500 000, décote 0 %.
  - Une `ASSURANCE_DELEGATION` a `valeurDeclaree` = 0 : elle **ne s'ajoute pas à la couverture** (elle protège la banque, elle ne
    la couvre pas) ; elle reste dans la liste et dans le dossier.
  - **Couverture déclarée** = Σ `valeurDeclaree` ÷ montant demandé × 100 ; **couverture retenue** = Σ `valeurRetenue` ÷ montant
    demandé × 100 (une décimale). Le montant demandé est celui du dossier (STORY-1104) : un changement du montant recalcule la
    couverture et le pourcentage du fonds de garantie ; ils sont **figés** avec le dossier à `PRET`.
  - **Valeur de référence (maquette)**, prêt de 25 000 000 :

    | Garantie | Déclarée | Décote | Retenue |
    |---|---:|---:|---:|
    | Gage du camion Toyota Dyna (pro forma CFAO Motors Togo) | 31 250 000 | 40 % | 18 750 000 |
    | Caution personnelle et solidaire de Komlan Kossi | 25 000 000 | 28 % | 18 000 000 |
    | Fonds de garantie ANPGF (50 % du prêt) | 12 500 000 | 0 % | 12 500 000 |
    | Assurance décès-invalidité du gérant | 0 | 0 % | 0 |
    | Assurance du camion (tous risques) | 0 | 0 % | 0 |
    | **Total** | **68 750 000** | | **49 250 000** |

    ⇒ couverture **déclarée 275 %**, couverture **retenue 197 %**. La retenue est celle qui compte.
- **D-1106-3 — Les décotes par défaut** (valeurs de démonstration, **à confirmer avec les banques**) : hypothèque 30 %, gage de
  matériel 40 %, nantissement du fonds de commerce 50 %, dépôt à terme nanti 0 %, fonds de garantie 0 % (sur sa quote-part),
  assurance 0 %, autre 30 %. **Caution** : la décote suit le patrimoine déclaré de la caution :
  décote = 100 − (`patrimoineDeclare` × 100 ÷ `valeurDeclaree`), au plus 100 et au moins 0, une décimale ; référence : patrimoine
  18 000 000 pour une caution de 25 000 000 ⇒ **28 %** (retenue 18 000 000). Sans patrimoine déclaré : 30 %.
  Source : le référentiel `exigences-bancaires-uemoa` (AP-50, `garanties.decotes`) ; **table de repli** dans le code si le
  référentiel ne la porte pas encore. Le cabinet peut **surcharger** la décote (`decoteSurchargee = true`, la valeur saisie
  prime), par exemple quand la banque lui a donné la sienne.
- **D-1106-4 — Les pièces attendues par type** (nom proposé à l'écran, non bloquant ici ; STORY-1085 les compte parmi les
  exigences) : hypothèque, titre foncier ; gage, carte grise ou facture pro forma ; nantissement du fonds, acte de nantissement ;
  caution, acte de caution ; dépôt à terme, contrat de dépôt à terme ; fonds de garantie, convention du fonds ; assurance, police
  d'assurance. Le dépôt et l'aperçu suivent le contrat de STORY-1104 (D-1104-9) : **bouton de téléversement réel** et « Voir ».
- **D-1106-5 — La suggestion de gage.** `GET /garanties/suggestions` rend, pour un dossier d'investissement ou de crédit-bail, le
  matériel financé : `{ type: GAGE_MATERIEL, garant: <raison sociale>, description: <matériel du pro forma>, valeurDeclaree:
  <TTC du pro forma>, decotePct: 40, document: <le pro forma> }` (référence 31 250 000). **Rien n'est ajouté tant que le cabinet
  n'a pas cliqué** : la suggestion passe par un `POST /garanties` ordinaire.
- **D-1106-6 — Les routes** (sous `/api/v1/dossiers/{dossierId}/financements/{financementId}`, mêmes gardes, portée et droits que
  1083 ; écriture en `BROUILLON` seulement, sinon 409 `DOSSIER_FINANCEMENT_NON_MODIFIABLE`) :

  | Route | Droit | Effet |
  |---|---|---|
  | `GET /garanties` | consulter | les garanties, les deux couvertures, les avertissements |
  | `POST /garanties` | préparer | ajoute une garantie (201) ; 21e : 422 `GARANTIES_TROP_NOMBREUSES` |
  | `PUT /garanties/{garantieId}` | préparer | remplace une garantie |
  | `DELETE /garanties/{garantieId}` | préparer | retire une garantie (204) |
  | `GET /garanties/types` | consulter | les types, leur décote par défaut et leur pièce attendue |
  | `GET /garanties/suggestions` | consulter | D-1106-5 |

- **D-1106-7 — Refus** : 404 `GARANTIE_INTROUVABLE`, 422 `GARANTIE_TYPE_INCONNU`, 422 `VALEUR_OU_POURCENTAGE_REQUIS` (ni l'un ni
  l'autre selon le type), 422 `POURCENTAGE_HORS_TYPE` (pourcentage sur un autre type que le fonds de garantie), 422
  `PATRIMOINE_HORS_TYPE`, 422 `DECOTE_INVALIDE`, 409 `CONFLIT_CONCURRENT`.
  **Avertissements non bloquants** dans la réponse : `COUVERTURE_SOUS_REPERE` (repère par défaut : plus de 100 % de couverture
  retenue pour une société établie, **150 % ou davantage** pour une jeune société, profil de STORY-1105 ; le référentiel AP-50 les
  porte ensuite), `GARANTIE_SANS_PIECE`.
- **D-1106-8 — Le champ texte `garanties` de 1083 est remplacé.** Les dossiers existants gardent leur texte en lecture seule
  (`garantiesTexteHerite`, affiché comme une note) ; l'écriture de `garanties` est refusée 400 `CHAMP_REMPLACE`
  (`details.parGaranties`). Aucune conversion automatique du texte en garanties : il ne dit ni valeur ni décote.
- **D-1106-9 — Piste d'audit** : `FINANCEMENT_MODIFIE` avec `garantie` et `geste` (`AJOUT`, `REMPLACEMENT`, `RETRAIT`), comme
  D-1084-14. Le manifeste M49 passe en 0.3.0 avec les deux lectures neuves en lecture seule. Effacement C13 : rien de neuf (les
  garanties vivent dans `dossiers_financement`).

## Critères d'acceptation

- **AC-1** : le tableau de référence de D-1106-2 est reproduit au franc : couverture déclarée **275 %**, retenue **197 %**,
  valeur retenue totale **49 250 000**, écrites en dur dans le test ; la caution à patrimoine 18 000 000 donne la décote 28 %.
- **AC-2** : une assurance avec délégation ne change pas la couverture ; un fonds de garantie à 50 % suit le montant demandé
  (le montant change, la valeur change) ; une décote surchargée prime, et le retour à la valeur par défaut est possible.
- **AC-3** : rien n'est jamais ajouté sans appel du cabinet : `GET /garanties/suggestions` ne modifie rien (mutation :
  l'ajout automatique rougit le test).
- **AC-4 (upload)** : la pièce d'une garantie se téléverse (vrai fichier, contrat D-1104-9), se **voit** en aperçu dans
  l'application avant tout téléchargement, se remplace en gardant l'ancienne dans l'historique.
- **AC-5** : l'écriture est refusée hors `BROUILLON` ; 21 garanties refusées ; chaque refus nommé de D-1106-7 est éprouvé.
- **AC-6** : le texte hérité d'un dossier existant se lit, et ne s'écrit plus ; droits et portée comme 1083 ; contrat publié, typé
  dans l'OpenAPI, annoncé dans « ⚠ Contrats » avant le code.

## Hors périmètre

- Les décotes réellement pratiquées par chaque banque (AP-50 les recevra, relues par une banque avant la première vente).
- La commission de l'ANPGF et ses conditions : à préciser (valeur de démonstration dans la maquette).
- L'inscription ou la constitution de la garantie (acte, inscription au registre) : le cabinet ne la fait pas ; elle apparaît comme
  condition préalable au décaissement (STORY-1108).
