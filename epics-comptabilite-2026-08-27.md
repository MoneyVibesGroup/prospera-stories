---
stepsCompleted: [1]
inputDocuments:
  - prospera-stories/sprint-status.yaml (reserved_ranges + deferred_foundations, relevé le 2026-08-27)
  - prospera-stories/prototypes/prospera-prototype.html (panneau « Ce que l'Atelier ne fait pas », FE-073)
  - balance-service/src/modules/balance/types/balance-canonique.ts (SOURCES_BALANCE, fermée à trois)
  - prospera-stories/stories/STORY-422.md (arbitrage voie A du 2026-08-27)
---

# Comptabilité générale (`comptabilite-service`) — Découpage en épics

> **Décision PO du 2026-08-27 :** `comptabilite-service` cesse d'être une **fondation différée**.
> Journaux, grand livre, comptes de tiers et lettrage entrent au programme, **avec l'assistance IA
> comme partie du périmètre et non comme une couche ajoutée après**.

## Vue d'ensemble

**Série retenue : épics EPIC-111 → EPIC-120.** Dernier épic attribué au 2026-08-27 : **EPIC-110**
(socle multi-référentiel, pris le même jour). Les plages EPIC-044→053, EPIC-054→064, EPIC-065→074,
EPIC-075→084, EPIC-085→094 et EPIC-095→105 sont **RÉSERVÉES** — vérifié dans `reserved_ranges`.

**Aucun `story_id` n'est réservé ici** — attribution au slotting, comme la règle l'exige.

---

## Ce que ce module change à la nature du produit

Jusqu'ici, Prospera **justifie** : il reconstruit une balance à partir de pièces (un export, des
cahiers, une saisie) et la rend défendable ligne à ligne. Le panneau « Ce que l'Atelier ne fait pas »
le dit en toutes lettres, et c'est ce qui a permis de vendre le produit sans mentir.

Avec ce module, Prospera **enregistre**. Ce n'est pas un incrément : c'est un changement de
responsabilité. Une écriture comptable est un acte, pas une donnée.

### La conséquence d'architecture qui commande tout le reste

**Le grand livre devient la source, et la balance en devient une projection.** Aujourd'hui la balance
est produite par trois adaptateurs (`SOURCES_BALANCE`, énumération **fermée à trois**) ; demain elle
peut aussi être **dérivée du grand livre**, comme `stock-service` devient un quatrième adaptateur.

Et la règle « une balance n'est pas un journal » ne s'inverse pas pour autant : le module ne publie
pas ses écritures à `balance-service`, il publie **une balance**, au contrat canonique (STORY-101),
avec son `checksum` et son `origine`. Un dossier tenu au journal et un dossier tenu aux cahiers
produisent le **même objet** en aval — c'est ce qui laisse la liasse, le fiscal et le prévisionnel
inchangés.

### Ce que la loi impose, et qui n'est pas négociable

L'AUDCIF (SYSCOHADA révisé) impose l'**inaltérabilité** : écritures chronologiques, sans blanc ni
altération, numérotation continue. Une écriture validée **ne se modifie pas** — elle se
**contre-passe**. C'est le point où un module de comptabilité se distingue d'un formulaire : tout le
reste (ergonomie, IA, lettrage) se construit **au-dessus** de cet invariant, jamais à côté.

---

## Les épics

| Épic | Objet | Pourquoi ici |
|---|---|---|
| **EPIC-111** | **Socle** : service, entitlement, gate, cloisonnement par dossier **et par exercice**, résolution du référentiel **du dossier** (hérite de STORY-422) | 4ᵉ module d'affilée où le socle n'était pas compté dans son PRD ; il l'est ici dès le découpage |
| **EPIC-112** | **Journaux et pièces** : plan de journaux **déclaré par le référentiel** (achats, ventes, banque, caisse, OD, à-nouveaux), numérotation **continue et sans trou**, pièce justificative rattachée | Le plan de journaux n'est pas universel : il vient du paquet, comme le plan de comptes. Le coder en dur recréerait le défaut STORY-422 sur un autre objet |
| **EPIC-113** | **Écriture et brouillard** : saisie, **équilibre par pièce** (pas par journal ni par jour), contrôle d'exercice et de date, validation brouillard → définitif, **contre-passation** | L'équilibre par pièce est le seul contrôle qui attrape une imputation oubliée ; l'équilibre par journal la laisse passer |
| **EPIC-114** | **Grand livre et balance dérivée** : consultation par compte et par période, et publication d'une **balance canonique** — 5ᵉ `origine` du hub | Le livrable aval n'est pas « des écritures », c'est **une balance**. Même correction que celle imposée à `stock-service` |
| **EPIC-115** | **Comptes de tiers auxiliaires** : clients, fournisseurs, salariés ; rattachement au **compte collectif** ; **balance âgée** | Le collectif et l'auxiliaire doivent concorder **par construction**, jamais par rapprochement périodique |
| **EPIC-116** | **Lettrage** : manuel, automatique (montant, référence, date), **partiel**, délettrage, **écarts de règlement** | C'est ce qu'un utilisateur de Sage cherche en premier, et ce que FE-049 lui refuse aujourd'hui explicitement (`ecritureCreee: false`) |
| **EPIC-117** | **Assistance à l'imputation et au lettrage** (moteur : `assistant-service`) : proposition de compte, de journal, de contrepartie, d'appariement — avec **alternatives rendues à l'humain** | Doctrine déjà éprouvée par `suggest-comptes` (STORY-139) : une suggestion en échec **ne bloque jamais la saisie** (DO-1) |
| **EPIC-118** | **Détection d'anomalies sur le journal** (moteur : `assistant-service`) : doublons, ruptures de séquence, sauts de date, comptes inhabituels pour un tiers, montants aberrants | La valeur d'un modèle sur un journal n'est pas de saisir plus vite, c'est de **voir ce qui ne se voit pas à l'œil** sur 40 000 lignes |
| **EPIC-119** | **Clôture** : centralisation, **à-nouveaux dérivés du grand livre**, réouverture tracée, exercice clos inaltérable | La reprise d'à-nouveaux existe déjà (STORY-087 / FE-047) et sa forme est bonne — elle change de **source**, pas de geste |
| **EPIC-120** | **Piste d'audit et fichier des écritures** : séquentialité **prouvée**, export du journal général, horodatage, identité de l'auteur | Sans preuve de séquentialité, l'inaltérabilité est une affirmation, pas une garantie |

---

## Quatre décisions à rendre avant le premier point de développement

1. **Q1 — Le grand livre remplace-t-il les cahiers, ou coexiste-t-il avec eux ?** Un dossier peut-il
   être tenu aux cahiers **et** au journal ? Si oui, deux sources produisent deux balances pour un
   même exercice, et il faut dire laquelle fait foi.
   **Recommandation : exclusivité par exercice**, choisie au dossier, avec bascule possible d'un
   exercice à l'autre. Deux sources concurrentes sur un même exercice ouvrent la porte au double
   comptage — la même faute que le RSL compté à la fois en charge et en crédit d'impôt, que la
   maquette rend déjà visible.
2. **Q2 — L'inaltérabilité s'applique-t-elle au brouillard ?** Non par principe (un brouillard se
   corrige), mais il faut alors une **frontière visible** entre les deux mondes — et un dossier qui
   reste en brouillard toute l'année n'est pas tenu. À quelle échéance le brouillard est-il forcé au
   définitif ?
3. **✅ Q3bis — TRANCHÉE PAR LE PO LE 2026-08-27 : le moteur d'assistance est `assistant-service`.**
   EPIC-117 et EPIC-118 appartiennent à ce module pour leur **surface** (les objets comptables :
   écritures, journaux, tiers, lettrage) et **consomment `assistant-service`** pour leur moteur.
   `ia-service` reste différé et **ne sera pas** un second moteur : deux moteurs d'assistance sur
   les mêmes objets divergeraient en silence — c'est le patron de l'union de types dupliquée
   relevée à FE-050, à l'échelle d'un service.
4. **Q3 — Que devient l'IA quand elle a tort ?** Une imputation proposée par la machine puis validée
   par un humain engage **l'humain**. La piste d'audit doit distinguer « proposé par la machine » de
   « choisi par l'utilisateur », sinon aucune revue n'est possible après coup — et c'est précisément
   ce qu'un contrôle fiscal demandera.
5. **Q4 — Quel dépôt, et à quel rang de séquence ?** `comptabilite-service` n'existe pas. Quatre
   modules réservés en août (`reseau`, `catalogue-produits`, `stock`, `pdv`) n'ont toujours **aucun
   code** ; ajouter un cinquième service non écrit à un programme déjà engagé à 617 points sur 34 de
   capacité est une décision de **séquence**, pas de découpage.

---

## Ce que ce module NE fait pas, et qui doit rester dit

- Il ne fait **pas** la paie. La base de rémunération est déjà cadrée ailleurs (EPIC-034).
- Il ne fait **pas** la facturation client. Une facture émise est un document commercial ; l'écriture
  qu'elle produit est ici, la facture est ailleurs.
- Il ne remplace **pas** l'Atelier. Un cabinet qui reçoit un export Sage n'a aucune raison de
  ressaisir des écritures : les deux chemins restent ouverts, et c'est Q1 qui en fixe la frontière.
