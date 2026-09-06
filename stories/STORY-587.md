# STORY-587 : Fin de relation — export puis suppression complète à 90 jours, et le §9.3 du PRD est amendé

Status: done

**Épic :** EPIC-062 — Rétention, purge et fin de relation 🏁
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S42
**Prérequis :** **STORY-586** (purge tracée)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-15, AR-20.

**Livrée le 2026-09-06** — branche `MNV-587` de `prospera-notification-service`, sur `origin/dev`.
1 922 tests unitaires (159 suites) + 147 e2e ; couverture 98,66 / 91,31 / 95,31 / 98,74.

---

## Le fait

À la résiliation : export du carnet et du journal **mis à disposition**, puis **suppression complète à
90 jours**. Aucune donnée d'un client résilié ne survit ni ne sert à un autre.

⛔ **Cette story porte aussi un correctif de document, pas seulement du code (AR-20).** Le **§9.3 du
PRD est faux** : il affirme que ne pas conserver le rendu évite de dupliquer les variables sensibles
au journal — alors que FR-N35 **les journalise explicitement**. `{montantDu, nom}` est aussi personnel
que le texte rendu. L'horloge des variables (STORY-586) rend l'affirmation vraie **au bout de 90
jours** ; le texte, lui, reste à amender.

## Critères d'acceptation

- [x] AC-1 — À la résiliation, un export du carnet et du journal est **mis à disposition** de
      l'organisation, dans un format lisible et complet.
- [x] AC-2 — **Suppression complète à 90 jours** (FR-N67), tracée comme toute purge (STORY-586 AC-5).
- [x] AC-3 — La preuve de désabonnement **survit** à la suppression (FR-N68, AD-14).
- [x] AC-4 — ⛔ AR-20 : le **§9.3 du PRD est amendé** dans
      `prds/prd-notification-service-2026-08-02/prd.md`, et l'amendement dit ce qui est vrai.

## Notes

🏁 Clôt EPIC-062.

---

## Ce que la livraison a appris

### ⛔ Une résiliation n'est pas une suspension

Première fois que ce service a besoin de la nuance. Le gate ne la fait pas — `SUSPENDED` et `REVOKED`
refusent tous les deux l'accès — et l'énumération note elle-même que « la nuance appartient au
catalogue, qui sait la restaurer ». Ici elle est décisive : `SUSPENDED` est un droit **gelé** (impayé,
litige) que le catalogue peut rendre, et effacer les données d'un client au bout de quatre-vingt-dix
jours d'impayé serait une destruction dont personne n'a pris la décision. **Seul `REVOKED` déclenche
l'horloge.**

### ⛔ Rien n'est matérialisé, et c'est la décision centrale de la story

Produire un fichier d'export au moment de la résiliation aurait créé une **copie de tout ce qu'on
s'apprête à effacer**, rangée quelque part sans horloge : la donnée aurait survécu à sa propre
suppression, sous un autre nom, et il aurait fallu lui inventer une seconde politique de
conservation.

L'export est donc **servi à la demande** depuis les données vivantes. Il ne duplique rien — il devient
simplement **vide** le jour où il n'y a plus rien, ce qui est exactement la date annoncée.

⚠️ **Paginé par `_id` croissant, jamais par date** : plusieurs documents portent le même horodatage, et
un curseur de date sauterait ou répéterait des lignes — un export « complet » qui ne l'est pas, sans
que rien ne le dise. Et le curseur n'est rendu **que si la page est pleine**, sinon l'appelant boucle
une fois de trop sur une page vide.

### ⛔ Le gate refusait l'export à celui à qui il est promis

AD-15 promet un export « mis à disposition » à l'organisation résiliée — qui **perd son entitlement à
l'instant même**. Sans exemption, la promesse aurait été inatteignable, et le défaut ne se serait vu
qu'au premier client résilié, c'est-à-dire au pire moment : celui où l'on n'a plus rien à offrir pour
se rattraper.

`@ToleresResiliation()` est cette exemption, et elle est **aussi étroite que la promesse qui la
justifie** : elle ne lève que la condition d'entitlement, uniquement pour `REVOKED`, et seulement sur
la route qui la porte. L'adresse vérifiée et le KYC restent exigés.

⚠️ **La fenêtre de quatre-vingt-dix jours ne se garde pas, elle se constate.** Au terme, la suppression
a eu lieu : la route répond toujours, elle ne rend plus rien. Un contrôle de date en plus aurait créé
une seconde vérité sur la date de fin — et le jour où les deux auraient divergé, l'organisation se
serait vu refuser un export que la base pouvait encore servir.

### ⛔ « Aucune donnée ne survit » se tient par une liste QUI NE PEUT PAS OUBLIER

Une énumération écrite à la main vieillit en silence : la collection ajoutée par la story suivante
reste hors de la suppression, sans qu'aucun test ne casse — jusqu'au jour où un client résilié demande
pourquoi ses données sont encore là. La garde balaie **tous** les schémas et exige que chacun de ceux
qui portent un `organizationId` soit **déclaré** : effacé, ou conservé **avec sa raison**. Pas de
troisième case.

| conservée | raison |
| --- | --- |
| `consentements`, `audit_envois`, `actes_droits` | base de **preuves** — le serveur refuse la suppression au compte du service (AC-3) |
| `rapports_purge` | la trace de la suppression : l'emporter effacerait le reçu avec le colis |
| `org_entitlements` | porte la **révocation** qui justifie la suppression — l'effacer supprimerait la raison avec l'effet |

⚠️ `utilisateurs` n'a pas d'`organizationId`, et ce n'est pas un oubli de schéma : un utilisateur
n'**appartient** pas à une organisation, il en est **membre** (AD-12), et peut l'être de plusieurs.
L'effacer à la résiliation de l'une le retirerait des autres. Ce qui disparaît est le **lien**,
`org_membres`.

### ⚡ La date de résiliation ne se stocke pas, elle se lit

`survenuLe` du read-model d'entitlement porte l'instant de l'événement qui a produit le statut
courant ; tant que celui-ci reste `REVOKED`, c'est l'instant de la révocation. Un champ `resilieeLe`
posé à part aurait été une **seconde vérité**, qu'une réactivation aurait laissée derrière elle — et
l'organisation revenue aurait vu ses données disparaître à la date d'une résiliation qu'elle a
annulée.

⚠️ **Le délai de quatre-vingt-dix jours n'est pas au catalogue des plafonds** (STORY-585). Une
organisation ne règle pas le délai au terme duquel on efface ses propres données : ce délai la
protège, il ne la sert pas, et le rendre configurable laisserait un client demander zéro jour puis
reprocher la perte.

### ⚡ Le registre de consentement est DANS l'export

AC-3 dit que la preuve du refus survit **chez nous**. Mais après la suppression, l'organisation n'a
plus aucun accès : sans cette section, la pièce qui prouve qu'elle avait le droit de se taire
survivrait partout **sauf chez celui à qui elle est opposable**. « Complet » veut dire cela. Elle sort
par `ConsentementsService`, jamais par une lecture directe — une seconde porte sur la base de preuves
aurait défait ce que STORY-582 et STORY-584 ont construit.

### ⚠️ Une garde de STORY-572 a rougi, et elle avait raison

Le faux de `Reflector` du test du gate répondait `mockReturnValue(valeur)` — donc **la même chose à
toutes les clés de métadonnée**. Le jour où la tolérance de résiliation est apparue, il a répondu
`true` pour elle aussi, et le test « refuse un entitlement révoqué » est passé au rouge en découvrant
qu'il mesurait un faux plutôt qu'un guard. *Un double qui ignore son argument accorde d'avance tout ce
qu'on lui demandera demain.*

### ⛔ AC-4 — ce que l'amendement du §9.3 dit

Le texte affirmait que ne pas conserver le rendu suffisait à ce que « les variables sensibles ne se
retrouvent pas dupliquées dans le journal ». L'amendement dit ce qui est vrai : **les variables sont
journalisées** (FR-N35), et c'est leur **horloge propre de quatre-vingt-dix jours** qui borne
l'exposition — donc l'affirmation devient vraie *au bout de quatre-vingt-dix jours, pas avant*. Il
ajoute la conséquence à dire : la fenêtre de rejeu manuel est bornée par la même horloge.

## ⛔ Points ouverts après 587

1. **Aucune conformité Docker** (héritée de STORY-586) : la suppression complète ouvre une transaction
   sur quinze collections, et la preuve qu'elles commitent ensemble appartient à un vrai réplica set.
2. **Aucun droit ne garde l'export ni le compte rendu** — 7ᵉ surface, rappel de la décision ouverte
   depuis STORY-573. ⚠️ Celle-ci est plus sensible que les autres : l'export rend **tout** le carnet
   et **tout** le journal d'une organisation à n'importe lequel de ses membres.
3. **La suppression ne publie aucun événement.** Un module amont qui détiendrait encore une référence
   vers un contact effacé ne l'apprendra pas. Hors périmètre de FR-N67, à surveiller à l'arrivée
   d'EPIC-061.
4. **AC-6 de STORY-586 reste à amender** dans la spine et la fiche (le compte de maintenance).
