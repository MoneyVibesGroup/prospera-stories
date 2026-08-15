# STORY-370 : L'import cesse de fondre deux banques en une — la provenance d'un auxiliaire survit à la normalisation

Status: not_started

**Epic :** EPIC-017 — Socle balance-service + contrat de balance canonique
**Points :** 5 · **Sprint :** 20 (backend) · **Service :** `balance-service` (`:3007`)
**Gap repris :** `GAP-auxiliaires-fusionnes-a-l-import`
**Décision :** **AD-5** de `architecture-balance-service-2026-08-15` — *la normalisation ne détruit
jamais une distinction qu'elle ne sait pas reconstituer*
**Origine :** défaut **créé par STORY-146**, **confirmé** par la vérification docker de STORY-172

---

## Le constat

La normalisation d'import ramène tout auxiliaire au compte de plan : **`5211BOA0` ET `5211ECO1`
deviennent tous deux `521100`** (tête `5211`, complétée par des zéros), puis sont **fusionnés en une
seule ligne** de balance.

⇒ **La balance ne distingue plus les deux banques.**

## Pourquoi ce n'est pas un bug de normalisation

⚠️ **La normalisation est une fonction du SEUL numéro de compte.** Elle **ne peut pas savoir** que deux
auxiliaires d'un même collectif désignent **deux comptes bancaires réels et distincts**. Elle fait
exactement ce qu'on lui a demandé.

Le regroupement **est signalé** — `comptesReecritsSansRegroupement`, avertissements d'import — mais
⛔ **l'information de provenance n'est pas conservée dans la ligne produite**. C'est là qu'est le
défaut : pas dans le calcul, dans **ce qui est jeté**.

## ⚡ La conséquence, et pourquoi aucun avertissement ne peut la rattraper

Le rapprochement bancaire ne peut **pas** restituer une position par banque : **l'information n'existe
plus dans la donnée**.

> ⛔ **Et le garde-fou existant est aveugle sur ce cas précis.** STORY-172 publie un avertissement dès
> que l'appariement retient **plusieurs** lignes. Ici, il en retient **UNE** — `nbComptesApparies = 1`
> — sur un solde pourtant **CUMULÉ**. **Donc aucun avertissement n'est possible.**

⇒ **Un cabinet à deux banques voit le solde des deux présenté comme celui d'une seule, face au relevé
d'une seule.**

⚠️ Le défaut est **antérieur à STORY-172**, qui **ne l'aggrave pas** : avant elle, ces comptes ne
s'appariaient **à rien du tout**.

## ⛔ Ce qu'il ne faut surtout pas faire

**Ne PAS corriger dans l'appariement.** *Deviner une ventilation que personne n'a déclarée serait pire
que le silence* — le rapprochement produirait des positions par banque **fabriquées**, et elles
seraient crédibles.

⇒ **La correction est côté IMPORT**, là où l'information existe encore.

## Ce que la story livre — deux voies, à trancher à l'ouverture

| Voie | Ce qu'elle fait | Ce qu'elle coûte |
| --- | --- | --- |
| **A — conserver la provenance** | La ligne de balance garde les auxiliaires qui l'ont produite ; le rapprochement **ventile** | Le contrat de ligne s'enrichit ⇒ checksum et consommateurs à vérifier |
| **B — refuser de fondre** | ⛔ Refus de fusionner deux auxiliaires rattachés à des **comptes de trésorerie déclarés distincts** | Aucun changement de contrat ; mais un import légitime peut être bloqué et demande une déclaration préalable |

⚡ **Les deux sont acceptables ; ce qui ne l'est pas est de fondre en silence.** La voie retenue est
écrite **dans la story avant de coder**, pas déduite du diff.

## Critères d'acceptation

- **Étant donné** un import portant `5211BOA0` et `5211ECO1`, tous deux rattachés à des **comptes de
  trésorerie déclarés distincts** **quand** l'import s'exécute **alors** ⛔ **les deux soldes ne sont
  jamais présentés comme un seul, sans trace** — soit la provenance survit (A), soit l'import refuse
  (B).
- **Étant donné** un rapprochement sur ce cas **quand** il s'exécute **alors** il **ne présente pas un
  solde cumulé comme celui d'une seule banque**.
- **Étant donné** deux auxiliaires d'un même collectif **qui ne désignent aucun compte de trésorerie
  déclaré** **quand** l'import s'exécute **alors** le comportement actuel est **inchangé** — ⛔ la story
  ne durcit pas le cas ordinaire.
- ⛔ **Étant donné** l'appariement **quand** on lit son code **alors** **aucune ventilation n'y est
  devinée** : la correction reste côté import.
- **Étant donné** un import ancien rejoué **quand** il passe **alors** son résultat est **explicable** :
  ce qui change est **annoncé**, jamais découvert dans une balance.

## Ce que cette story ne fait PAS

- ⛔ Elle ne revient pas sur la normalisation elle-même (STORY-146), qui reste **juste** pour tous les
  comptes non auxiliaires.
- ⛔ Elle ne touche pas au niveau de détail ni aux prédicats de compte (STORY-146/172, fermés).
- ⛔ Elle n'invente **aucune** règle de ventilation.

## Definition of Done

- [ ] Le cas **deux banques** est couvert par un test **qui échoue sur la version actuelle**.
- [ ] La voie retenue (A ou B) est **écrite dans la story** avant l'implémentation, avec son motif.
- [ ] Le rapprochement **ne peut plus** présenter un solde cumulé comme celui d'un seul compte.
- [ ] **Non-régression** : un import sans auxiliaire de trésorerie produit **exactement** la même
      balance qu'aujourd'hui.
- [ ] `GAP-auxiliaires-fusionnes-a-l-import` passe à **fermé**.
