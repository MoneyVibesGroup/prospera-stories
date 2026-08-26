# STORY-424 : Le plan de travail d'un cabinet fait 8 caractères — le service en accepte 6, et ramener n'est pas neutre

Status: needs-po-decision

**Épic :** EPIC-020 — Cahiers & rattachement (Atelier Balance)
**Service :** `balance-service` (`:3007`) — `modules/referentiel`, `modules/balance/sage`
**Points :** — *(à chiffrer après arbitrage)* · **Sprint :** S20
**Origine :** **retour direct d'un expert-comptable**, transmis par le PO le **2026-08-26** à la revue de la maquette FE-046 : *« tous les comptes qui doivent être présents sur la plateforme doivent être sur 8 chiffres »*.

---

## Le fait, mesuré sur une balance cliente réelle

Fichier : `Balance_des_comptes.pdf` — **ETS RELAXED**, Sage 100 Comptabilité i7 8.50, exercice
01/01/23 → 31/12/23, balance complète.

| relevé | valeur |
|---|---|
| comptes de la balance | **51** |
| comptes à **8 chiffres** | **51** — soit **100 %** |
| classes présentes | 1, 2, 3, 4, 5, 6, 7 |

Extrait : `10300000 CAPITAL PERSONNEL`, `41110000 CLIENTS`, `44280001 DROIT D'ENREGISTREMENT`,
`44280002 TH 2023`, `44490000 ETAT CREDIT DE TVA A REPORTER`.

**Le plan de travail du cabinet fait 8 caractères. Sans exception.**

---

## Ce que le service en fait aujourd'hui

```ts
// referentiel-registry.ts — manifeste
'syscohada-revise@2.1', { …, longueurCompteDetail: 6 }

// referentiel-loader.service.ts — estCompteDeDetail
if (!estCompteRattachable(racines, compte)) return false;
if (longueurDetail === undefined) return true;
return normalise.length <= longueurDetail && /^\d+$/.test(normalise);
```

⇒ **Tout compte à 8 caractères est refusé.** Et le message du validateur l'assume :

> *« Compte « X » inconnu du plan … **Un compte du logiciel de saisie (8 chiffres, compte
> auxiliaire) doit être ramené à son compte de plan.** »*

C'est une **décision** (STORY-146/172), pas un oubli : la liasse se dépose sur des comptes de
plan, et l'administration ne connaît pas `44280002`.

---

## ⛔ Mais « ramener » perd de l'information, et c'est mesurable

La normalisation de l'import Sage ramène puis **regroupe les homonymes**
(`normalisation-comptes.ts`). Appliquée au fichier ci-dessus :

| ramené à 6 | comptes fondus | ce qui disparaît |
|---|---|---|
| `442800` | `44280001` **Droit d'enregistrement** + `44280002` **TH 2023** | deux impôts distincts deviennent une ligne |
| `447800` | `44780000` + `44780001` + `44780002` | trois comptes deviennent une ligne |

**5 comptes réduits à 2 sur une seule balance.** Le regroupement est *tracé* (`Regroupement`,
`sourcesTotal`) — donc honnête — mais le comptable perd la ventilation qu'il a lui-même
construite, et il ne la retrouvera nulle part dans le produit.

---

## Les deux besoins, et ils ne sont pas le même

| | compte de **travail** | compte de **plan** |
|---|---|---|
| forme | 8 caractères (`44280002`) | ≤ 6 (`442800`) |
| sert à | tenir, contrôler, expliquer au client | **déposer la liasse** |
| qui l'exige | le cabinet | l'administration |

Le produit n'en garde **qu'un**, et c'est le second. ⇒ **La bonne réponse n'est pas de faire
passer `longueurCompteDetail` à 8** — ça casserait la projection vers la liasse. C'est de
**porter les deux**.

⚡ **Et l'amorce existe déjà** : `SourceLigneBalance` / `Regroupement.comptesSources` conservent
la provenance côté import Sage. L'information n'est pas à créer, elle est à **rendre**, et à
étendre au chemin cahiers.

---

## Ce qui doit être tranché (PO + architecture)

**Q1 — Quel compte est l'identité d'une ligne ?**

- **Voie A** — le compte de travail (8) devient l'identité, le compte de plan est une
  **projection** calculée au moment de la liasse. Le plus juste métier ; c'est un changement du
  **contrat canonique** (STORY-101) et il touche `bilan-service`.
- **Voie B** — l'identité reste le compte de plan, mais la ligne **porte** ses comptes d'origine
  (`comptesSources`, déjà présent côté Sage) et **l'écran les affiche**. Moins invasif ; le
  cabinet voit son plan sans que la liasse bouge.
- **Voie C** — porter `longueurCompteDetail` à **8** pour SYSCOHADA. Le plus simple, et
  probablement **faux** : plus rien ne serait regroupé, et la liasse recevrait des comptes que
  l'administration ne reconnaît pas.

**Q2 — Le chemin cahiers doit-il aussi accepter 8 caractères ?** Aujourd'hui la saisie d'une
recette, une règle de rattachement et un compte de contrepartie sont tous validés par
`isCompteDeDetail` ⇒ un cabinet ne peut pas y écrire son propre plan. ⚠️ **C'est ce qui rend
l'écran FE-046 inutilisable en l'état** pour un cabinet équipé.

**Q3 — Le référentiel doit-il déclarer sa longueur, ou l'organisation la sienne ?**
`longueurCompteDetail` vit dans le **manifeste** du service, et le commentaire de STORY-146
admet déjà que sa place est **dans l'artefact**. Un cabinet à 8 et un autre à 6 sont deux
paramétrages légitimes du même référentiel.

---

## Ce qui est FAIT en attendant

La maquette **FE-046** affiche désormais **tous ses comptes à 8 caractères** — la cible — et
porte en tête un encart qui **annonce le refus actuel**, avec le chiffrage ci-dessus.
⛔ **Aucune ligne de code frontend ne doit être écrite sur la saisie de compte avant
l'arbitrage** : les trois voies ne donnent ni le même champ, ni la même validation.

---

## Notes

- ⚠️ **Ne pas traiter cette story comme « un paramètre à changer »** : `longueurCompteDetail`
  est lu par `estCompteDeDetail`, qui garde **la saisie de recette, la saisie de dépense, la
  règle de rattachement, le compte de contrepartie, le compte de trésorerie et la soumission de
  balance**. Six portes, un seul chiffre.
- Voir [[FE-046]], `stories/STORY-146.md`, `stories/STORY-172.md`, `stories/STORY-086.md`
  (import Sage & normalisation), `stories/STORY-101.md` (contrat canonique).
