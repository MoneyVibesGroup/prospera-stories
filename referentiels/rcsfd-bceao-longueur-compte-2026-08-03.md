# Plan de comptes RCSFD (BCEAO / UMOA) — longueur du niveau de détail

> Extrait sauvegardé le 2026-08-03 pour STORY-172. **Source primaire** :
> *Référentiel comptable spécifique des Systèmes Financiers Décentralisés de l'UMOA*,
> Commission Bancaire de l'UMOA — <https://www.cb-umoa.org/sites/default/files/2022-05/R%C3%A9f%C3%A9rentiel%20comptable%20sp%C3%A9cifique%20des%20SFD_1.pdf>
> (201 pages ; le **plan de comptes** occupe les pages 29 à 42 du PDF).

## Règle de codification, citée littéralement

> « Le premier chiffre du compte représente le numéro attribué à la classe à laquelle il appartient. »
> « Les autres chiffres constitués de gauche à droite décrivent de façon plus détaillée la nature des opérations. »
> « L'ensemble des comptes ainsi codifiés constitue le plan de comptes dont l'adoption par les établissements
> assujettis est rendue obligatoire dans les conditions définies par la Banque Centrale. »

⚠️ Le référentiel **ne fixe nulle part une longueur maximale en toutes lettres**. La longueur du niveau de
détail se **constate** sur le plan lui-même — c'est ce que fait le relevé ci-dessous, et c'est la raison pour
laquelle STORY-146 avait laissé `sfd-bceao@2.0` sans déclaration : la donnée n'était pas sourcée.

## Relevé exhaustif des longueurs (plan officiel, p. 29-42)

**372 comptes** extraits (`pypdf`, motif `^(\d{2,8})\s*[-–]\s*libellé`) :

| Longueur | Nombre de comptes | Exemples |
|---|---|---|
| **2** chiffres | 48 | `10` VALEURS EN CAISSE · `11` COMPTES ORDINAIRES CHEZ LES INSTITUTIO |
| **3** chiffres | 130 | `101` Billets et monnaies · `113` Centre des Chèques postaux |
| **4** chiffres | 178 | `1011` Billets et monnaies émis par la BCEAO · `1131` Centre des Chèques postaux |
| **5** chiffres | 14 | `20227` Créances rattachées · `25116` Dettes rattachées |
| **6** chiffres | 2 | `602511` Intérêts sur comptes ordinaires crédit · `602512` Intérêts sur comptes ordinaires sur li |

➡️ **Longueur maximale constatée : 6 chiffres**, portée par les deux seuls comptes de ce niveau :
`602511` (Intérêts sur comptes ordinaires créditeurs) et `602512` (Intérêts sur comptes ordinaires sur
livrets créditeurs). Même valeur que SYSCOHADA révisé, mais **pour une raison propre et vérifiée**, pas par
analogie.

## ✅ Constat annexe : notre artefact embarqué était TRONQUÉ — **fermé le 2026-08-17 (STORY-368)**

> **Fermeture.** L'artefact porte désormais les **372 comptes**, dans les deux dépôts et avec les
> **mêmes octets** (`8b7b29d8…`). L'extraction a été **rejouée à l'identique** sur le PDF officiel
> (`pypdf`, motif `^(\d{2,8})\s*[-–]\s*libellé` sur les pages 29-42, continuations de libellé
> recollées, lignes de titre en capitales écartées) et rend exactement la répartition relevée
> ci-dessus — **48 / 130 / 178 / 14 / 2**. Les 156 libellés déjà présents ont été conservés **à
> l'octet** (l'ordre du sous-ensemble commun est identique, ce qui confirme que c'est bien la même
> extraction, poursuivie). Ni `postes` ni `tableDePassage` n'ont bougé ⇒ **la liasse produite est
> inchangée**, seul le plan s'enrichit.

Constat d'origine, conservé : `balance-service/src/modules/referentiel/assets/sfd-bceao-2.0.json` ne
portait que **156 comptes** (48 × 2 chiffres + 108 × 3), là où le plan officiel en compte **372** et
descend jusqu'à 6 chiffres. Les niveaux 4, 5 et 6 étaient **absents de l'artefact**.

**Conséquence vérifiée — et rassurante** : la reconnaissance étant faite **par préfixe**
(`estCompteRattachable`), tous les comptes officiels détaillés restent rattachables à une racine que
l'artefact déclare — contrôlé sur `602511`, `602512`, `20227`, `25116`, `25316`, `1011`, `1131` : **tous OUI**.
Déclarer `longueurCompteDetail: 6` pour `sfd-bceao@2.0` **ne refuse donc aucun compte officiel**, et refuse
bien un compte à 8 chiffres d'un logiciel de saisie.

~~L'enrichissement de l'artefact aux 372 comptes reste un sujet distinct~~ — **fait par STORY-368**
(2026-08-17), via le `build.mjs` de `bilan-service`, source de vérité unique des octets (décision
D-078-2, donc 2 dépôts et 2 nouveaux checksums : `sfd-bceao@1.0` → `c2e075a2…`, `sfd-bceao@2.0` →
`8b7b29d8…`).
