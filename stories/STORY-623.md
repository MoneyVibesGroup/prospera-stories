# STORY-623 : Chaîne de repli ordonnée, sur échec technique seulement

Status: done

**Épic :** EPIC-063 — Passerelles tierces
**Service :** `notification-service`
**Points :** 5 · **Sprint :** S36
**Prérequis :** **STORY-620**, **STORY-621**, **STORY-622**
**Origine :** rail B, bloc B3 · FR-N21, AD-5.

---

## Le récit

En tant qu'**organisation cliente**, je veux qu'un message qui ne passe pas sur un canal soit tenté
sur un autre, afin de ne pas perdre une relance parce qu'une passerelle est tombée.

## Le fait

⛔ **Le repli se déclenche sur échec technique du canal, JAMAIS sur l'absence de lecture** (FR-N21).
Replier parce que le message n'a pas été lu ferait d'un client silencieux un client harcelé sur
quatre canaux, facturés quatre fois.

⚡ **Chaque tentative est un envoi à part entière** : son coût, son statut et son accusé sont
distincts. Une chaîne qui écraserait la trace de la tentative précédente rendrait la facture
inexplicable.

## Critères d'acceptation

- [x] AC-1 — La liste de repli est **ordonnée** et portée par la demande, pas par une préférence
      globale.
- [x] AC-2 — ⛔ Un test prouve qu'un message **remis mais non lu** ne déclenche aucun repli.
- [x] AC-3 — Chaque tentative laisse sa propre ligne de journal et son propre coût.
- [x] AC-4 — Un canal indisponible pour **cette** organisation passe au suivant sans échouer la
      chaîne.

---

## Ce que la livraison a appris (2026-09-07)

**Branche :** `MNV-623`, empilée sur `MNV-622`.

### ⛔ AC-2 tient par la STRUCTURE, pas par une condition

`poursuivre` n'est appelée **que depuis le chemin d'échec** — le gestionnaire `failed` de la file,
après que l'échec a été écrit au journal. L'absence de lecture n'est pas un échec : elle n'a donc
**aucun chemin** vers cette méthode, et il n'existe nulle part une ligne à relire pour s'en assurer.

⚡ **Et la liste des codes qui replient est BLANCHE.** Le critère n'est pas « est-ce grave ? » mais
**« de qui cela parle-t-il ? »** : les quatre codes retenus parlent du **transport** — la passerelle
est tombée, le relais a refusé, le compte est mauvais, le jeton est mort. Aucun ne dit quoi que ce
soit de la **personne**, et c'est précisément pourquoi tenter un autre canal a un sens.

⛔ **Le désabonnement ne replie jamais.** Un destinataire qui a refusé un canal n'a pas refusé « ce
canal-ci » : replier sur un autre serait contourner sa décision avec l'outil qui existe précisément
pour la respecter. ⚠️ Et le consentement est **redemandé** pour le nouveau canal — on peut avoir
accepté l'e-mail et refusé le SMS.

### ⚡ La chaîne se CONSOMME, elle ne se recopie pas

Chaque tentative reçoit le **reste**, et le reste rétrécit. C'est ce qui garantit qu'une chaîne
s'arrête, même si toutes ses tentatives échouent. Repasser la chaîne entière aurait produit une
**boucle facturée**.

### ⛔ Un doublon est REFUSÉ, jamais dédoublonné en silence

Le corriger à la place de l'appelant lui aurait caché que sa liste ne dit pas ce qu'il croit — et
une chaîne est une **décision de coût**. Même raisonnement pour un repli égal au canal principal :
il ne serait tenté qu'après avoir échoué, c'est-à-dire jamais utilement.

⚠️ **L'ordre est conservé tel quel** : « SMS puis WhatsApp » et « WhatsApp puis SMS » ne coûtent pas
le même prix et n'ont pas la même chance d'aboutir. Trier aurait détruit la seule information que la
liste porte.

### ⚡ L'identité d'idempotence contient le CANAL — et c'est un double de test qui l'a révélé

Le double de figement rendait toujours `email` : chaque repli entrait donc en **collision
d'idempotence** avec la tentative d'origine, et aucun second `Envoi` n'était créé. Le défaut était
dans le test, mais ce qu'il a mis en lumière est structurel — deux tentatives de la même demande sur
deux canaux différents coexistent **parce que** l'index unique porte le canal. Un rejeu du même
repli, lui, se heurte, ce qui est exactement ce qu'on veut.

⚠️ **Un double de collection incomplet, pour la SEPTIÈME fois** : `findById` manquait.

### ⚡ Le repli passe par un PORT, et il vient APRÈS l'échec écrit

Décider s'il reste un canal, figer un modèle, écrire un `Envoi` et l'enfiler sont des gestes
**métier** : ils n'ont rien à faire dans une file. Et l'ordre compte — l'inverse aurait pu laisser
une tentative de repli dont l'origine n'est nulle part marquée comme échouée, c'est-à-dire une
facture avec deux envois dont un seul explique l'autre.

### ⚠️ AC-4 : un maillon inexploitable CONSOMME, il ne fait pas tomber la chaîne

Un canal sans passerelle pour cette organisation, un modèle absent dans cette langue : le maillon
est consommé, le suivant est tenté. Faire tomber la chaîne entière aurait puni le destinataire d'une
configuration incomplète.

### ⛔ Points ouverts légués

1. **Rien ne borne la durée totale d'une chaîne** : trois maillons qui échouent chacun après leurs
   réessais peuvent étaler un message sur plusieurs minutes. Aucun délai de garde n'est posé.
2. **Le coût annoncé de chaque tentative reste celui du barème du canal**, donc zéro sur SMS et
   WhatsApp tant que STORY-624 n'a pas sorti le barème du catalogue statique.
3. **Aucune vue « chaîne » dans le journal** : les tentatives sont liées par `repliDe`, mais rien ne
   les rassemble en une ligne. C'est une story de console.
