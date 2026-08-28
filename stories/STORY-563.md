# STORY-563 : Un dossier porte deux redevables — l'entreprise et le dirigeant, chacun avec son NIF, ses obligations et son calendrier

Status: ready-for-dev

**Épic :** EPIC-030 — Calendrier et responsabilité
**Service :** `fiscal-service` (`:3012`) — domaine, `application/remuneration`
**Points :** 13 · **Sprint :** S30
**Origine :** **décision PO du 2026-08-28** — *« pour la déclaration des impôts cela se passe sur
deux volets : la société a un NIF mais le dirigeant aussi a son NIF […] la société paie en se
connectant à dimana avec le NIF de la société pour payer les taxes, mais aussi le dirigeant paie en
passant par dimana pour payer ses taxes »*.
**Amende :** ⛔ **AD-21** *(« aucun identifiant national n'entre ici »)*
**Réf. :** **AD-20** (`typeBeneficiaire : SALARIE | DIRIGEANT | ASSOCIE`, FR-F79) · **FR-F80**
(régime non déterminable ⇒ obligation bloquée) · **STORY-301** (attestation de mandat)

---

## Le fait

Tout le modèle repose aujourd'hui sur une équation implicite : **`dossier` = `entreprise` =
`redevable`**. Une obligation appartient au dossier, un calendrier appartient au dossier, un
livrable est déposé pour le dossier.

⚡ **La réalité togolaise en porte deux.** L'entreprise a son NIF et paie ses taxes ; **le dirigeant
a le sien** et paie les siennes. Ce sont deux redevables distincts, deux séries d'obligations, deux
échéanciers, et deux dépôts — mais **un seul cabinet, un seul dossier de travail, et souvent une
seule personne qui fait les deux**.

⛔ **Sans cette story, le second volet n'existe pas** : il n'y a pas de place où poser un NIF de
personne physique, donc pas d'obligation à son nom, donc rien à déclarer ni à payer pour lui.

## ⛔ Ce que cette story amende dans la colonne vertébrale

**AD-21**, tel qu'il est écrit :

> **Rule:** **minimisation** — le service ne stocke que ce qui sert à déclarer. **Aucun identifiant
> national**, aucune coordonnée, aucune donnée de contrat n'entre ici : ce sont des données de
> **paie**.

⇒ La règle était juste **pour son objet** : une base de rémunération n'a pas besoin du NIF d'un
salarié pour alimenter une déclaration d'entreprise. Elle devient fausse dès qu'une **personne
physique devient elle-même redevable** — on ne peut pas déclarer pour quelqu'un sans son
identifiant fiscal.

⚡ **L'amendement est étroit, et il doit le rester.** AD-21 devient :

> Aucun identifiant national n'entre au service **au titre de la rémunération**. Un identifiant
> fiscal n'entre que pour une personne **constituée en redevable**, avec son mandat, et il ne
> descend jamais dans `LigneDeRemuneration`.

⇒ **Un salarié reste sans NIF dans le produit.** Seul le dirigeant — parce qu'il déclare — en a un.
La minimisation d'AD-21 est préservée là où elle protège quelqu'un qui n'a aucun compte et aucun
moyen de savoir que la donnée existe.

## Périmètre

**Inclus**

- Un agrégat **`Redevable`**, rattaché au dossier, portant : sa **nature** (`ENTREPRISE` |
  `PERSONNE_PHYSIQUE`), son **identifiant fiscal**, et son **mandat** (STORY-301).
- Un dossier a **exactement un** redevable `ENTREPRISE` et **zéro ou plusieurs**
  `PERSONNE_PHYSIQUE`. ⚠️ Plusieurs : un dossier peut compter deux co-gérants.
- **L'obligation appartient à un redevable, plus au dossier.** C'est le changement structurant :
  `Obligation`, `Declaration`, `Echeance` et le journal se scopent sur `redevableId`.
- Le **lien avec la rémunération** : une `LigneDeRemuneration` de `typeBeneficiaire = DIRIGEANT`
  **peut** désigner un redevable personne physique. ⛔ **Le lien va dans ce sens et pas l'inverse :**
  le redevable ne descend jamais dans la ligne de paie, et une ligne `SALARIE` ne peut jamais
  désigner de redevable.
- **Le calendrier se dédouble** : les obligations de l'entreprise et celles du dirigeant ont leurs
  propres échéances, servies par le même moteur (EPIC-030), jamais mélangées à l'affichage.
- **Le mandat est distinct par redevable.** Le mandat de l'entreprise ne couvre pas le dirigeant :
  ce sont deux personnes juridiques, et deux consentements.

**Hors périmètre**

- Le calcul de l'impôt de la personne physique : **STORY-564** (le barème IRPP manque au paquet).
- Le paiement : **STORY-565**.
- ⬆️ **AMENDÉ le 2026-08-28 — le compte EST désormais au périmètre, mais dans une autre fiche.**
  Cette ligne disait *« il est sujet de données, pas utilisateur »* ; le PO a rouvert exactement ce
  point le même jour : *« un salarié peut créer un compte juste pour la partie déclaration fiscale,
  de même qu'un dirigeant, mais aussi le cabinet peut créer un compte uniquement pour la
  déclaration »*. ⇒ **STORY-567** porte les trois portes d'entrée et le rattachement dirigeant ↔
  société. Cette fiche garde le `Redevable` ; elle ne donne toujours pas d'accès.
- Les **associés** (`typeBeneficiaire = ASSOCIE`). Le PO a dit *« pour un début »* : le dirigeant
  d'abord. Le modèle les accueille sans travail supplémentaire.

## Critères d'acceptation

1. Un dossier sans redevable personne physique fonctionne **exactement comme avant** — témoin de
   non-régression sur l'ensemble des obligations d'entreprise existantes.
2. Une obligation est toujours rattachée à **un** redevable ; aucune obligation orpheline ne peut
   être créée.
3. Le calendrier rend les échéances **séparées par redevable**, jamais fusionnées.
4. Un identifiant fiscal de personne physique ne peut être enregistré **que** sur un `Redevable`.
   ⛔ Une garde vérifie qu'aucun chemin ne le fait descendre dans `LigneDeRemuneration` — c'est
   l'amendement d'AD-21, et il doit être exécutable.
5. Une ligne de rémunération `SALARIE` **ne peut pas** désigner de redevable : refus explicite.
6. Un mandat manquant pour un redevable personne physique **bloque ses obligations** au sens de
   `FR-F25`, en nommant ce qui manque — patron `FR-F80`, déjà en place.
7. L'isolation entre organisations et dossiers reste absolue (NFR-F06) : un redevable est toujours
   dérivé du jeton et du dossier, jamais du corps de la requête.
8. Le journal d'audit trace le redevable concerné **sans recopier son identifiant fiscal**
   (règle AD-21 sur le journal, conservée).

## Notes

- ⚡ **Le vrai coût de cette story n'est pas le modèle, c'est le scope.** `redevableId` doit
  traverser les obligations, les déclarations, les échéances, les livrables et le journal. C'est
  large, mécanique, et c'est **exactement le moment de le faire** — le faire après le connecteur
  de paiement demanderait de reprendre le canal aussi.
- ⚠️ **Le dirigeant n'est pas un « petit dossier ».** Tentant de créer un second dossier pour lui :
  ce serait un dossier sans comptabilité, sans balance et sans liasse, qui ferait échouer la moitié
  des gardes du produit. Le redevable est le bon niveau.
- ⚡ **Ce que ça change pour le cabinet, dit simplement** : aujourd'hui il tient l'entreprise dans
  Prospera et le dirigeant dans un tableur. Après, les deux échéanciers sont au même endroit — et
  c'est **l'oubli de l'IRPP du gérant** que ça supprime, pas des clics.
