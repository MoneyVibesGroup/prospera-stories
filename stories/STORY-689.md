# STORY-689 : Un dépôt transmis enregistre le paquet actif, pas la version qui a produit le fichier

Status: done

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service` (agrégat `depots`, STORY-538)
**Points :** 2 · **Complexité :** low · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** revue de code de STORY-680 (2026-10-01).

---

## Le fait

`depots.service.ts` (`transmettre`) relève la référence du paquet **actif** au moment de la transmission.
Depuis STORY-680, deux versions coexistent (`v1.0` archivée, `v1.1` active) : un livrable produit en v1.0 puis
transmis après le déploiement serait enregistré « 1.1 ». Le fichier porte pourtant sa version
(`PROSPERA format version …`).

## Critères d'acceptation

- [x] AC-1 — La version enregistrée est celle inscrite dans le fichier transmis ; une version absente ou
      inconnue du manifeste ⇒ refus nommé.
- [x] AC-2 — Les dépôts existants ne sont pas réécrits.

## Cadrage (2026-10-07)

Mesuré dans le code : le livrable inscrit quatre propriétés de document (`docProps/custom.xml`) —
`PROSPERA format pays|etat|version|checksum` (`proprietesDuLivrable`, STORY-537). Le manifeste garde la
v1.0 (`actif: false`) à côté de la v1.1.

| # | Décision |
|---|---|
| D-689-A | La référence enregistrée est relue dans les **quatre** propriétés du fichier, puis retrouvée au manifeste sous **cette version** (active ou archivée) : `referenceFormat` = la référence du paquet publié, jamais celle du paquet actif. |
| D-689-B | Propriété absente ou vide ⇒ `422 VERSION_FORMAT_ABSENTE` (`details.propriete` nomme la première manquante). Version non publiée, empreinte divergente, ou pays/état ≠ ceux de la chaîne ⇒ `422 VERSION_FORMAT_INCONNUE`. Aucune valeur du fichier n'est recopiée dans la réponse. |
| D-689-C | Un fichier qui n'est pas un classeur lisible ⇒ refus `CLASSEUR_*` existants (STORY-537) — il ne porte pas de version. |
| D-689-D | Lecture **bornée** sur la boucle d'événements : seules `_rels/.rels` et la partie de propriétés sont décompressées, chacune ≤ 1 Mio (`LIMITE_PETITE_PARTIE`), XXE refusée, balayage linéaire ; les feuilles ne sont jamais ouvertes. Contrôle de **format** : avant la portée et les amonts. |
| D-689-E | Le **canal** reste celui du paquet **actif** (STORY-538 AC-6) : voie de transmission d'aujourd'hui, pas une propriété du fichier. Un couple sans paquet actif reste refusé (`PAQUET_DEPOT_NON_PUBLIE`). |
| D-689-F | Garde de manifeste : la même version publiée deux fois (même archivée) ⇒ `PAQUET_DEPOT_AMBIGU` — un dépôt doit nommer UN paquet. |
| D-689-G | AC-2 : aucune migration, aucun chemin de relecture ne recalcule `referenceFormat` ; le schéma Mongo est inchangé. |

**Hors périmètre** : contrôler les propriétés `PROSPERA liasse …` du fichier contre la version transmise
(dossier, jeu, version, empreinte) — autre garde, autre story si le besoin est confirmé.

## Notes

- Voir [[STORY-538]], [[STORY-680]], [[STORY-682]].

## Progress Tracking

**Statut : `done` (2026-10-07).** `prospera-fiscal-service#15` rebase-mergée sur `dev`
(`347a415` feature + `a2a53eb` revue).

- **Livré** : port `LecteurProprietesDocument` + adaptateur `LecteurProprietesXlsx` (lecture bornée de
  `_rels/.rels` et de la partie de propriétés, ≤ 1 Mio chacune, XXE refusée, feuilles jamais ouvertes) ;
  `formatDeclareParLeFichier` / `verifierFormatConnu` (domaine) ; `RegistrePaquetsDepot.trouverVersion`
  (active ou archivée, re-hachée) ; garde de manifeste « même version deux fois » ; Swagger 422 à jour.
- **Portes** : lint 0 · build OK · 1 661 unitaires · 123 e2e · couverture 99,3 / 96,53 / 99,05 / 99,65.
- **Mutations** : 16/16 rouges (dont le bug d'origine `paquet.reference`, l'ordre du contrôle, trim, chaque
  comparaison pays/état/version/empreinte, `trouverVersion` limité à l'actif, doublon de manifeste, nom
  dupliqué, XXE, bornes, décompression de toutes les parties, relation absente, balise non fermée) + 2 sur
  les correctifs de revue.
- **Revue de code** (opus + 3 lentilles ECC + ponytail) : 0 bloquant ; 3 constats corrigés — propriétés du
  format écrites en dérivant de l'inventaire (un champ ajouté ne peut plus être lu sans être écrit),
  assertion « rien du fichier recopié » sur chaque champ divergent, e2e d'une propriété réellement absente ;
  message `VERSION_FORMAT_ABSENTE` reformulé (ne promet plus une provenance non signée). Écartés (< 80) :
  CDATA / `<op:property>` / OOXML Strict (refus au mauvais code, aucun tableur courant ne les écrit) ;
  type distinct « format déclaré » (aucun bug actif) ; ponytail « recomparer pays/état publiés » (garde gardée).
- **Revue de sécurité** (opus) : 0 constat ; coût mesuré sur fichiers forgés linéaire, ≤ 250 ms/requête à 15 Mo.
- **Vérif docker** (stack neuve, `tmp/verif-docker-689/`) : 114 verdicts OK, 0 KO. Livrable RÉEL produit
  en v1.1 ⇒ dépôt 1.1 en base ; même classeur aux propriétés v1.0 (checksum du manifeste) retransmis après
  rejet ⇒ dépôt **1.0** en base, canal `TELESERVICE`, le 1er dépôt inchangé ; propriété retirée / 9.9 /
  empreinte v1.1 sous 1.0 / texte brut ⇒ 422 nommés, 0 dépôt, 0 objet MinIO ; dépôt légué 0.1 relu tel
  quel, document identique ; objets du bucket = clés des dépôts.
- **Suite possible** (hors périmètre, signalée par la revue) : comparer les propriétés `PROSPERA liasse …`
  du fichier à la version transmise.
- 2026-10-07 — branches `MNV-689` ouvertes, cadrage fait (7 décisions).

- 2026-10-01 — créée par la revue de STORY-680 (`ready-for-dev`).
