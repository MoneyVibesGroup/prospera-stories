# États modèles CIMA (art. 433) — sources, gabarits et régime de dépôt

Fiche de référence pour [[STORY-523]] et les stories d'EPIC-134. Elle **source** les gabarits
officiels et le régime de dépôt : c'est ce que le jalon `format confirmé` exigeait avant toute
ligne de code — et, la voie A ayant fait du jalon *la story elle-même*, c'est le livrable.

> ⚠️ **Relevé le 2026-09-22** sur le texte du Code CIMA. Un texte réglementaire est republié sans
> préavis : un relecteur qui reprendrait le relevé doit **recomparer**, et non se fier à cette page.

---

## 1. Où la liste fait autorité — et ce n'est pas l'article 433

L'**article 433** publie les **modèles**. C'est l'**article 422** qui dit **ce qu'il faut
produire**, et c'est lui qui borne le périmètre déposable :

> « Outre les comptes prévus par ailleurs au plan comptable, notamment : le bilan établi selon le
> **compte 89** ; le compte d'exploitation générale établi selon le **compte 80** ; le compte
> général de pertes et profits établi selon le **compte 87** ; le compte des résultats en instance
> d'affectation établi selon le **compte 88**, les entreprises doivent établir chaque année les
> états suivants : C1, C4, C5, C9, C10, C10a, C10b, C10c, C10d, C11, C20, C21, C25,
> C25 Bis (tableaux A et B), C26, RA1, RA2. »

| Article | Ce qu'il impose | Combien |
|---|---|---|
| **422** | états **annuels** d'entreprise | 4 comptes (5 modèles) + 18 états |
| **422-1** | états de **surveillance complémentaire** — entreprises consolidantes ou combinantes de l'art. 434 | G1 à G5, G10 à G16 (12) |
| **422-2** | états **trimestriels** (T1, T2) et **semestriels** (bilan 89, compte 80, compte 87, C4 S, RS1, RS2) | 9 |
| **433** | les **modèles** de tout ce qui précède | 3 750 lignes utiles, 50 blocs |

⇒ **46 états au catalogue** `etats-cima@1.0`.

## 2. ⛔⛔ L'état C11 n'a aucun gabarit, et n'en aura jamais

> **Art. 433** — « **La présentation de l'état C11 est laissée à l'initiative de chaque
> entreprise.** »

C'est la **seule** occurrence de cette formule dans tout l'article : 2 lignes, là où le C4 en a 139
et le C10 en a 469.

Appliqué à la lettre, le jalon « aucune ligne de code avant d'avoir les gabarits officiels en
main » **bloquait pour toujours** sur cet état. Or le **contenu** du C11 est entièrement normé :

| Article | Ce qu'il fixe |
|---|---|
| **337-1** | éléments constitutifs de la marge de solvabilité |
| **337-2** | montant minimal — sociétés IARD |
| **337-3** | montant minimal — sociétés vie |
| **337-4** | cas des sociétés mixtes |

⇒ **La garde du jalon devient : *gabarit imposé **ou** norme de contenu identifiée*.** Un état à
forme libre n'est pas un état non spécifié. Le générateur refuse un `gabarit: LIBRE` qui ne nomme
aucun article de contenu.

## 3. Quatre formes de gabarit, et trois ne sont pas des manques

| Forme | Combien | Ce que c'est |
|---|---|---|
| `IMPOSE` | 37 | un modèle est publié et doit être suivi |
| `LIBRE` | 1 | le C11 — cf. §2 |
| `NARRATIF` | 5 | G5, G12, G13, G14, G15 : le Code demande une **description** (« les entreprises dressent la liste… », « décrivent sommairement… »), pas un tableau |
| `RENVOI` | 3 | les bilan/compte 80/compte 87 **semestriels** : l'art. 422-2 les impose sans republier de modèle, parce que c'est celui de l'annuel |

⚠️ Compter les `NARRATIF` et les `RENVOI` comme « gabarit absent » se trompe de forme — c'est
l'erreur qu'un relevé mécanique commet.

## 4. Applicabilité par agrément — et le sens de l'erreur

L'**art. 326 al. 3** interdit à une entreprise de pratiquer en même temps les opérations du 1°) et
du 2°) de l'**art. 300**. Quinze états sont donc réservés à un agrément.

| Réservé à | États |
|---|---|
| **Vie et capitalisation** | `COMPTE_80_VIE_CAPITALISATION`, `C1_VIE`, `C20`, `C21`, `G4`, `RS2_VIE` |
| **Toute nature (dommages)** | `COMPTE_80_TOUTE_NATURE`, `C1_DOMMAGES`, `C10`, `C10A`, `C10B`, `C10C`, `G3`, `T2`, `RS2_NON_VIE` |

⛔ **`TOUS` est le défaut, et toute restriction paie sa source.** Restreindre à tort **dispense**
l'assureur de produire un état qu'il doit : l'erreur ne se corrige pas d'elle-même, elle se
découvre au contrôle. Mesuré sur **C10d** — « synthèse des dossiers sinistres de grande ampleur non
clôturés » — que le voisinage avec C10a/C10b aurait classé dommages, alors que ses colonnes (zone
et année de survenance, victimes, évaluation globale) ne nomment ni branche ni catégorie. Il serait
sorti `NON_APPLICABLE` pour tout assureur vie.

Même raison côté agrément dérivé : `INDETERMINABLE`, `INCOMPATIBLE_ART_326` et
`REFERENTIEL_SANS_COMPTE_80` **n'exemptent de rien**. Dans le doute, l'état reste dû.

## 5. Le régime de dépôt — identique en doctrine à celui du SFD

> **Art. 425** — « Les entreprises **remettent au Ministre** en charge des assurances dans l'État
> membre, dans les **trente jours qui suivent la réunion de leur assemblée générale et au plus tard
> le 1er juin** de chaque année, un dossier relatif aux opérations effectuées au cours de l'exercice
> écoulé. Ce dossier est produit **en trois exemplaires**. Il est **certifié** par le président du
> Conseil d'Administration […] : *“le présent document, comprenant x feuillets numérotés, est
> certifié conforme aux écritures de l'entreprise et aux règles applicables à l'assurance, sous les
> sanctions prévues”*. […] Elles doivent adresser les mêmes documents dans les mêmes conditions à
> la **Commission de Contrôle des Assurances**. »

| | CIMA (art. 425) | SFD (art. 7, instr. n°030-02-2009) |
|---|---|---|
| Canal | papier certifié | papier signé |
| Format de fichier normé | **aucun** | **aucun** |
| Exemplaires | 3 (+ 5 pour le compte rendu de l'art. 424) | 5 / 2 / 2 selon destinataire |
| Échéance | 30 j. après l'AG, au plus tard le 1er juin | clôture + 6 mois |

⇒ **La « doctrine de dépôt unique » que Q1 réclamait n'est pas un choix produit : c'est une mesure,
faite deux fois.** `DEPOT_PHYSIQUE` dans les deux verticaux.

## 6. L'artefact

`etats-cima@1.0` — `sha256 93b41b2cc9f1720972917acc675d23d41ca84ccce0dc3f2908d27a546d382cc0`

- **Généré par** `bilan-service/scripts/referentiels/build-etats-cima.mjs` depuis
  `sources/etats-cima.json` (source de vérité des octets).
- **Recopié à l'octet** dans `assurance-service` — et **pas** dans `balance-service`, qui n'a aucun
  état de l'art. 433 à produire. L'exclusion est **mesurée** par
  `referentiel-assets-coherence.spec.ts`, jamais simplement affirmée.
- **Pont** : les cinq versions de `cima-assurances` y mènent. Le catalogue transcrit la loi, qui ne
  change pas avec la version du plan packagé ; ce qui change est ce que le produit en **produit**,
  et cela se **dérive** du paquet servi.

⚠️ **Le champ `lignes` est délibérément absent de `@1.0`.** La transcription ligne à ligne des
états est le **lot**, en stories dédiées : la publier vide aurait fait passer une structure creuse
pour une structure sourcée.

## 7. Ce que le produit publie, et ce qu'il ne publie pas

Le statut de chaque état est **dérivé** de ce que le moteur émet, jamais déclaré dans l'artefact.

| Statut | Aujourd'hui | Lesquels |
|---|---|---|
| `PRODUIT` (bilan-service) | 5 | bilan 89 (actif, passif), compte 80 ×2, compte 87 |
| `PRODUIT_AILLEURS` | 1 | **C10b**, par `assurance-service` ([[STORY-516]]) |
| `NON_PRODUIT` | 40 | nommés à l'écran avec leur code (AC-3) |

⚠️ **`PRODUIT` ne veut pas dire « complet ».** Le bilan servi compte **5 postes par côté** face à un
gabarit de **172 et 121 lignes**. Le catalogue publie les deux nombres — `postesPublies` et
`lignesGabarit` — **sans verdict de complétude** : un seuil arbitraire transformerait une mesure en
promesse. C'est à l'assureur de juger, pas au produit d'affirmer.
