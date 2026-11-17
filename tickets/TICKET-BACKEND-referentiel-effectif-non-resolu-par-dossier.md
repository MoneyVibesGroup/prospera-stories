# TICKET-BACKEND — le **référentiel effectif** n'est résolu qu'au niveau du CABINET, alors qu'il dérive du DOSSIER

**Cible :** `balance-service` (:3007) — route `GET /api/v1/referentiels/actifs`
**Ouvert par :** **FE-061** (barry thierno alhassane, 2026-08-19) — constat d'**intégration**
**Priorité :** Should — la fiche de dossier livre le référentiel **sans ses versions**, faute de pouvoir les résoudre honnêtement
**État :** ✅ **FERMÉ le 2026-11-17** — **STORY-925** (balance-service #154, dev `055b423`) ; la route sœur existait déjà depuis **STORY-422** (`GET /dossiers/{dossierId}/referentiels/actifs`, versions comprises) et **STORY-906** y avait ajouté `tag` ; 925 ajoute `dossierId` et `referentielComptable` au corps (la portée déclarée) et éprouve les vérifications de reprise (deux dossiers d'un même cabinet ENTREPRISE/MICROFINANCE ⇒ paquets différents ; archivé lisible ; hors portée 404). Écart assumé : la famille est déduite du paquet servi (D-925-1), pas du seul `typeEntite`. Suite côté écran : FE-061 peut afficher les versions (types à régénérer).

---

## Le constat

Deux services répondent à « quel référentiel s'applique ? », et **ils ne parlent
pas de la même chose** :

| Route | Portée | Ce qu'elle rend |
|---|---|---|
| `GET /dossiers/{id}` (`:3009`) | **dossier** | `referentielComptable` — la **famille** (`SYSCOHADA` \| `SFD-BCEAO` \| `CIMA`), dérivée de `typeEntite` (D7, STORY-304) |
| `GET /referentiels/actifs` (`:3007`) | **organisation** | le paramétrage **versionné et checksumé** : plan de comptes, règles, paquet fiscal |

La famille est décidée **par dossier**. Les versions sont servies **par
organisation**. Il n'existe donc, aujourd'hui, **aucune façon de répondre à
« quelle version du plan de comptes s'applique à CE client ? »**.

## Pourquoi ça compte

Un cabinet tient des clients de **types différents** — c'est le cas nominal, pas
un cas limite : une entreprise (`SYSCOHADA`), une microfinance (`SFD-BCEAO`),
une compagnie d'assurance (`CIMA`). Leur famille de référentiel diffère **par
construction**, puisqu'elle dérive de `typeEntite`.

Afficher le paramétrage de l'organisation sur la fiche d'un dossier produirait
donc, dans ce cas nominal, **un écran plausible et faux** : la microfinance
afficherait les versions du référentiel de l'entreprise, sans qu'aucune erreur
ne le signale.

C'est **exactement** le mode de défaut que STORY-303 vient de fermer sur les
2 axes — `GET /dossiers/{id}` rendait `SN` pendant que
`GET /dossiers/{id}/axes` et le calcul appliquaient `SMT` — et le
réintroduire par l'affichage aurait annulé le bénéfice de ce retrait.

## Ce que FE-061 a fait en attendant

La fiche **nomme** le référentiel (`SYSCOHADA`) et **dit qu'il dérive du type
d'entité**, mais **n'affiche aucune version, aucun checksum, aucun compte de
plan** — alors que sa fiche de story les demandait explicitement (« plan de
comptes, table de passage, gabarit de liasse, paquet fiscal, avec leurs
versions »). Une note d'écran l'énonce : ces versions sont servies au niveau du
cabinet, pas du dossier.

⚠️ **FE-063 avait déjà rencontré cette route et refusé de la re-scoper**, à
raison : elle est aussi la **sonde d'autorité** du gate de l'Atelier
(`@RequiresBalanceAccess`), et la scoper ferait re-tester l'accès au module à
chaque bascule de dossier. Le ticket ne demande donc **pas** de déplacer cette
route.

## Ce qui est demandé

Une résolution **par dossier**, sans toucher à la sonde existante. Deux formes
possibles, à trancher côté backend :

1. **Une route sœur** `GET /dossiers/{dossierId}/referentiels/actifs`, qui
   résout le paquet à partir du `typeEntite` **du dossier** et rend la même
   forme que l'actuelle (libellé, version, checksum, compteurs, paquet fiscal).
   `GET /referentiels/actifs` reste inchangée et garde son rôle de sonde.
2. **Un paramètre** `?dossierId=` sur la route existante, ce qui mélangerait la
   sonde d'autorité et la lecture métier — moins souhaitable pour cette raison.

Dans les deux cas, la réponse doit **déclarer la portée qu'elle a servie**
(`dossierId` ET `referentielComptable` dans le corps) : c'est la leçon du ticket
`balance-ne-declare-pas-son-dossier` — une réponse qui ne déclare pas sa portée
est invérifiable par son client.

## Vérification à la reprise

- Deux dossiers du **même cabinet** avec des `typeEntite` différents
  (`ENTREPRISE` et `MICROFINANCE`) rendent des paquets **différents**, et le
  corps de chaque réponse porte le `dossierId` demandé.
- Un dossier **archivé** reste lisible (D9).
- Un dossier hors portée rend **404**, jamais 403.
