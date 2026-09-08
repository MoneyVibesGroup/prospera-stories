# STORY-625 : Message entrant — réception signée et rattachement à certitude

Status: done

**Épic :** EPIC-064 — La conversation dans les deux sens
**Service :** `notification-service`
**Points :** 5 · **Sprint :** S37
**Prérequis :** **STORY-621** (adaptateur WhatsApp)
**Origine :** rail B, bloc B4 · AD-10, AR-13.

---

## Le récit

En tant qu'**organisation cliente**, je veux recevoir les réponses de mes clients, afin qu'une
promesse de paiement ne se perde pas dans le téléphone d'un chargé de recouvrement.

## Le fait

⚡ **Le rattachement se fait par CERTITUDE, jamais par ressemblance.** Une réponse se rattache à
l'envoi qui l'a provoquée par une référence portée par le canal ; à défaut, elle est **rangée sans
être rattachée** — le patron exact de la notification orpheline de STORY-260.

⛔ La signature se vérifie **avant toute persistance**, et le corps brut est exigé.

## Critères d'acceptation

- [x] AC-1 — Surface publique **énumérée**, avec son propre plafond de débit (AR-13).
- [x] AC-2 — Signature vérifiée sur les octets bruts ; une signature invalide **n'écrit rien**.
- [x] AC-3 — Un rejeu n'est pas un fait : il abandonne la transaction.
- [x] AC-4 — Une réponse non rattachable est **conservée**, jamais perdue.

---

## Ce que la livraison a appris (2026-09-07)

**Branche :** `MNV-625`, empilée sur `MNV-624`.

### ⚡ Deux niveaux de rattachement, et `presume` n'en fait PAS partie

Sur un canal qui ne transporte pas de référence de conversation, la bonne réponse n'est pas
« probablement celui-ci » : c'est **aucun**. Nommer un niveau intermédiaire aurait invité le premier
appelant venu à s'en contenter — et **une présomption affichée finit toujours par être lue comme un
fait**. Le SMS est exactement ce cas : il reçoit des réponses, et il ne dit jamais à quoi elles
répondent.

⛔ **Aucune ressemblance n'entre dans la recherche.** Ni le numéro de l'émetteur, ni la date, ni la
proximité d'un envoi récent. « C'est le dernier message envoyé à ce numéro » est une devinette sur
le chemin de l'argent : *« oui »* répond à une promesse de paiement comme à une campagne, et deux
relances parties le même jour rendent la devinette indiscernable d'un tirage au sort.

⚡ **Et la capacité décide AVANT la base** : un canal sans référence de conversation ne rattachera
jamais rien, donc on ne va pas chercher une réponse qu'on refuserait d'employer.

### ⚡ Une LISTE de surfaces à corps brut, et non un second `app.use` recopié

Le parseur brut n'était monté que sur les webhooks. Un second montage écrit à la main aurait fini
par diverger du premier — sur le plafond, sur le type, ou simplement en étant **oublié** le jour
d'une troisième surface signée. Ce qui décide est désormais une **donnée**
(`PREFIXES_A_CORPS_BRUT`), et la garde de STORY-573 la lit.

⛔ **Le désabonnement n'y est pas** : sa surface est un `GET` inerte, sans signature, et lui donner
un parseur brut n'aurait servi qu'à lui retirer celui dont elle a besoin.

⚠️ **La garde a rougi trois fois de suite** en s'adaptant — elle vérifiait que le chemin nomme
`PREFIXE_WEBHOOKS`. Ce qu'elle vérifie n'a pas changé de nature : *le chemin se calcule, il ne
s'écrit pas*. Seule la troisième valeur vient d'une liste au lieu d'une constante unique.

### ⛔ Un préfixe à part, et pas une route de plus sous `webhooks`

Les deux surfaces reçoivent des octets signés du même fournisseur, mais l'une rapporte le **sort
d'un message que nous avons envoyé**, l'autre apporte un **message qu'un humain a écrit**. Les
confondre aurait fait dépendre du contenu du corps la question de savoir laquelle des deux parle.

⚡ **Le jeton, lui, est le MÊME.** Une passerelle a un jeton de webhook ; les deux surfaces se
distinguent par leur **chemin**, pas par leur secret. Demander deux jetons pour une seule passerelle
aurait doublé les chances d'une erreur de configuration sans rien protéger de plus.

### ⛔ Le rejeu est rendu inexprimable par la CLÉ PRIMAIRE

Un fournisseur qui réémet le même message — parce que notre réponse s'est perdue — ne doit pas
produire deux réponses. Un contrôle « existe-t-il déjà ? » suivi d'une écriture laisse une fenêtre ;
l'index unique n'en laisse aucune (STORY-256). Et le rejeu **abandonne la transaction** : ce n'est
pas une erreur à signaler au fournisseur, c'est le cas normal.

### ⚠️ L'émetteur n'est PAS normalisé par le carnet

Ce qui arrive est un **fait rapporté** : le normaliser à l'écriture ferait perdre ce que le
fournisseur a dit. Le rapprochement avec un contact viendra plus tard, et il partira de ce que nous
avons conservé.

### ⚠️ L'échéance d'une réponse suit celle de l'envoi qu'elle prolonge

Une réponse ne doit pas survivre à la conversation dont elle fait partie. Quand l'envoi est inconnu,
c'est la politique de journal de l'organisation qui décide.

### ⚡⚡ AD-17 disait « exactement deux » : il a fallu l'AMENDER, pas le contourner

Deux gardes à liste fermée ont rougi à la validation finale, et **aucune des deux ne se trompait**.

La première (`surfaces-publiques.spec.ts`) tenait l'inventaire d'AD-17, qui écrit noir sur blanc
« exactement **deux** préfixes sont exemptés de la validation JWT ». STORY-625 en ouvre un
troisième. ⚡ **Ce que la règle protège n'a jamais été le nombre, c'est l'énumération** : ce qui
serait dangereux, c'est qu'une surface s'ouvre sans que personne ne la voie. Elle a été vue. La
décision a donc été portée **dans la colonne vertébrale** — AD-17 passe à trois, avec la date, la
story et la raison — et non absorbée dans un test qu'on desserre.

⛔ **Le jour où le nombre devient l'invariant qu'on défend, l'énumération a cessé de servir** : on
contourne la liste au lieu de l'amender, et la première surface non déclarée passe. L'amendement
ajoute au passage une règle qui manquait : *les deux surfaces signées partagent le jeton de la
passerelle et se distinguent par leur CHEMIN, jamais par le contenu du corps*.

La seconde (`suppression-complete.spec.ts`) exige que toute collection portant un `organizationId`
soit **déclarée quelque part** — effacée, ou conservée avec sa raison. `messages_entrants` rejoint
les effacées. ⚡ **Et sa place tient à ce qu'elle n'est PAS une preuve** : ce qui prouve durablement
qu'un message est parti vit dans `audit_envois` (AD-14) ; ce qui est arrivé en retour est du métier,
et il suit la rétention du journal. C'est la quatrième story de ce bloc que cette garde rattrape,
et elle ne s'est pas encore trompée une seule fois.

### ⛔ Points ouverts légués

1. **Rien ne LIT les messages entrants** : la collection se remplit, aucune route ne la restitue.
   La boîte de réception est un consommateur du flux (FR-N44), pas ce module.
2. **L'envoi d'origine ne PROGRESSE pas** vers « répondu » : c'est STORY-626, et le modèle d'`Envoi`
   est importé ici en lecture seule pour que ce soit vrai par construction.
3. **`referenceExterne` sert de référence de conversation** : c'est la référence que la passerelle a
   rendue à la remise. Si un fournisseur en emploie une autre, l'adaptateur devra la rapporter.
