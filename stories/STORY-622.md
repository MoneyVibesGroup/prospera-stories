# STORY-622 : Adaptateur push et jeton radié

Status: done

**Épic :** EPIC-063 — Passerelles tierces
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S36
**Prérequis :** **STORY-620** (adaptateur SMS)
**Origine :** rail B, bloc B3 · AD-6, AD-11, FR-N19.

---

## Le récit

En tant qu'**utilisateur d'une application mobile**, je veux être averti sans ouvrir l'application,
afin de ne pas manquer une échéance.

## Le fait

⚠️ Le destinataire est un **jeton d'appareil**, pas une personne : il expire, il se révoque, et un
jeton mort n'est pas un échec d'envoi mais une **radiation du carnet**.

## Critères d'acceptation

- [x] AC-1 — Entrée par la même fabrique.
- [x] AC-2 — Un jeton refusé par le fournisseur est **retiré du carnet**, et le retrait est tracé.
- [x] AC-3 — Aucune donnée sensible dans la charge poussée ; le message ouvre l'écran, il ne le
      porte pas.

---

## Ce que la livraison a appris (2026-09-07)

**Branche :** `MNV-622`, empilée sur `MNV-621`.

### ⛔ AC-3 tient à une ABSENCE : le corps rendu ne quitte pas le service

Une notification s'affiche sur un écran verrouillé, dans un bus, par-dessus l'épaule de n'importe
qui. Le corps rendu — qui porte des montants, des noms, parfois un solde — **ne part pas**. Ce qui
part est l'**objet**, écrit pour être lu de loin et borné à cent vingt caractères par
`FORME_PAR_CANAL`. Un test énumère les clés de la charge : **deux, et aucune ne porte le message**.

⚡ **Conséquence assumée : l'objet devient REQUIS sur ce canal.** Sur les autres, un objet manquant
fait un message maladroit ; ici, il fait une notification **vide**, puisque le corps ne part pas.

### ⛔ Un jeton mort n'est pas un échec de remise — les deux se soignent à l'opposé

Un échec se **rejoue** ; une radiation s'**arrête définitivement**. Les confondre aurait fait
retenter quinze fois un jeton que le service a déjà enterré, et facturer les quinze essais de
réseau. Le refus est donc `TRANSITION_INTERDITE` — non rejouable — pour que la file s'arrête du
premier coup.

⚡ **Deux statuts, et c'est une convention partagée** : `404` quand le jeton n'a jamais existé, `410`
quand il a existé et n'existe plus. Les deux disent la même chose au carnet.

### ⛔ Radier n'est PAS oublier

« Retiré du carnet » veut dire *ne peut plus servir*, pas *n'a jamais existé*. Effacer la ligne
aurait supprimé la seule réponse à la question qu'on posera vraiment — **« pourquoi ce client ne
reçoit plus rien ? »** — et l'aurait rendue indiscernable d'un contact jamais inscrit. L'identifiant
reste donc en place, **daté et motivé**.

⚡ **Et c'est le filtre `radieLe: null` qui rend l'acte idempotent** : la seconde radiation ne trouve
rien à modifier, ne réécrit donc pas la date du premier constat, et ne trace pas deux fois. Le même
travail peut échouer plusieurs fois avant d'abandonner.

### ⚡ La radiation passe par un PORT, jamais par le carnet

L'exécutant de remise vit dans les adaptateurs ; le carnet est un module métier. Lui faire appeler
`CarnetService` aurait fait dépendre la file de la **forme d'un contact** — alors que ce qu'elle
sait est bien plus petit : *ce couple (canal, identifiant) vient d'être déclaré mort par celui qui
le sert*. C'est le seul chemin par lequel une remise touche le carnet.

⚡ **Et la radiation a lieu sur le refus TYPÉ, pas sur son message.** Plus loin,
`classerErreurDeRemise` a transformé le refus en `UnrecoverableError` et le code n'est plus qu'une
chaîne : lire un texte pour décider d'écrire dans le carnet aurait fait dépendre une écriture d'un
message.

⛔ **Un carnet indisponible ne change pas la nature de l'échec de remise**, qui est l'information
utile : le refus d'origine remonte quoi qu'il arrive.

### ⚡ Ici, zéro est un FAIT — et c'est ce qui le distingue du SMS

Aucun fournisseur de push ne facture la notification ; le coût est celui du terminal et de son
réseau, pas le nôtre. Sur le SMS, zéro voulait dire « non contracté » et c'était un mensonge en
attente ; ici, c'est vrai.

### ⛔ Aucun accusé de lecture, et la raison n'est pas technique

Un service de push sait dire qu'il a remis la notification à l'appareil ; il ne sait pas dire que
quelqu'un l'a regardée. Ce que l'application pourrait rapporter — « l'écran s'est ouvert » — n'est
pas une lecture du message : c'est un geste dans une **autre application que la nôtre**, et
l'appeler « lu » aurait fait dépendre notre certitude du code d'un client.

### ⚠️ Deux gardes à LISTE FERMÉE ont rougi, et c'est ce qu'on leur demande

L'inventaire des adaptateurs de canal (STORY-604) et celui des champs d'un identifiant de contact
(STORY-573). Une liste ouverte les aurait accueillis en silence — y compris un adaptateur qui va
chercher ses identifiants tout seul, ou un champ qu'on ajoute sans y penser.

### ⛔ Points ouverts légués

1. **Rien n'indique QUEL écran ouvrir** : la demande d'envoi ne porte pas de destination
   applicative. La notification affiche son objet et ouvre l'application ; la navigation profonde
   demandera un champ, et donc une décision.
2. **Les lectures du carnet n'excluent pas encore les identifiants radiés** : le champ est écrit et
   tracé, mais `rechercher` et `lister` les rendent toujours. La conséquence est visible, pas
   dangereuse — un envoi vers un jeton radié échouera à nouveau et se radiera à nouveau, sans
   effet. Le filtrage est une story de carnet.
3. **Aucun renouvellement de jeton** : ce service constate la mort d'un jeton, il n'en reçoit pas
   de nouveau. C'est l'application mobile qui réinscrit, par le carnet.
