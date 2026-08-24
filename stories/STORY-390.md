# STORY-390 : L'analyse ne dit pas avec quel séparateur ni quel encodage elle a lu le fichier

**Epic :** EPIC-021 — Import & migration Sage (profils d'import)
**Réf. :** écart remonté par **FE-048** *(profil d'import & mapping réutilisable)*, 2026-08-24 — prolonge **STORY-088**
**Priorité :** Should Have
**Story Points :** 2
**Statut :** not_started
**Complexité :** low
**Sprint :** 20
**Service :** `balance-service` (`:3007`)

---

## Le constat

`POST /dossiers/{id}/imports/analyser` **auto-détecte** le séparateur d'un CSV (`;`, `,`, tab) et
lit en `utf-8` sauf mention contraire. C'est le bon défaut.

Mais la réponse ne dit pas ce qui a été retenu :

```ts
// AnalyseFichierResponseDto — ce qui est publié
colonnesDetectees, ligneEntete, ligneDebutDonnees, apercu, cible,
mappingPropose, manquants, signature, profilReconnu, formatFichier
//  ↑ ni `separateur`, ni `encodage`
```

Or `CreerProfilImportDto` les **accepte** — et le profil est censé rejouer la lecture que l'analyse
vient de faire.

## Pourquoi c'est un vrai trou, et pas une coquetterie

Le client n'a que deux façons de remplir ces deux champs, et **aucune n'est correcte** :

- **recopier ce qu'il a imposé** — ne marche que s'il a imposé quelque chose. Dans le cas nominal
  (auto-détection), il n'a rien à recopier ;
- **deviner** — poser `;` « parce que c'est fréquent au Togo ». Le profil figerait alors un choix
  que personne n'a fait, et qui peut différer de celui que le serveur a réellement employé.

`FE-048` a donc retenu la seule option honnête : **ne rien poser quand rien n'a été imposé**, et
laisser le serveur re-détecter à l'import. C'est cohérent tant que la détection est déterministe et
que le fichier ne change pas.

⚠️ **Et c'est exactement là que ça casse.** La signature de reconnaissance automatique est calculée
sur les en-têtes **tels qu'ils ont été lus**. STORY-088 le documente déjà comme un piège payé
(« un latin1 lu en utf-8 fige une signature abîmée »), et la parade retenue était de rendre
`separateur`/`encodage` paramétrables **dès `/analyser`**. La parade est bonne — elle est
simplement **à moitié posée** : on peut imposer les réglages, on ne peut pas savoir lesquels ont
servi.

Conséquence concrète, sur un export dont le séparateur varie d'un mois sur l'autre (cas réel : un
logiciel qui bascule `;` → `,` selon la locale du poste qui exporte) :

1. janvier — analyse auto-détectée en `;`, signature `S1`, profil enregistré **sans séparateur** ;
2. février — même fichier logique, exporté en `,`. Auto-détection en `,`, en-têtes identiques mais
   lus comme **une seule colonne** si les guillemets diffèrent ⇒ signature `S2 ≠ S1` ;
3. le profil n'est **pas reconnu**. Il est actif, intact, correctement mappé — et invisible.

Le comptable n'a aucun moyen de comprendre pourquoi : ni l'écran ni la réponse ne mentionnent le
séparateur, puisqu'il n'est jamais rendu.

## Ce qui est demandé

Ajouter les deux champs **effectivement retenus** à la réponse d'analyse :

```ts
// AnalyseFichierResponseDto
@ApiPropertyOptional({ enum: SEPARATEURS_CSV, description: 'Séparateur retenu (imposé ou auto-détecté). Absent pour un XLSX.' })
separateur?: SeparateurCsv;

@ApiProperty({ enum: ENCODAGES, description: 'Encodage retenu pour la lecture.' })
encodage!: Encodage;
```

Ils existent déjà dans `ProfilParserService` au moment où il lit le fichier : il s'agit de les
faire remonter, pas de les calculer.

⚠️ **`separateur` reste facultatif** : un XLSX n'en a pas. Le rendre obligatoire obligerait à
inventer une valeur pour la moitié des fichiers.

## Critères d'acceptation

1. `POST …/imports/analyser` sur un **CSV** renvoie le `separateur` réellement employé, qu'il ait
   été imposé ou auto-détecté.
2. La même route sur un **XLSX** omet `separateur` et renvoie `encodage`.
3. Un profil créé en recopiant ces deux champs, puis employé à l'import du **même fichier**, est
   reconnu par signature (test e2e de bout en bout).
4. Le contrat est publié en énumération dans `/api/docs-json` (pas en `string` libre).

## Effet côté frontend, une fois livrée

`ProfilMappingForm` cesse de recevoir les réglages par sa prop `reglages` — un contournement dont le
commentaire nomme déjà ce ticket — et les relit dans la réponse, comme il le fait déjà pour
`ligneEntete` et `ligneDebutDonnees`. Le profil enregistré porte alors **toujours** la façon exacte
dont son fichier d'exemple a été lu.
