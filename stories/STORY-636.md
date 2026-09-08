# STORY-636 : Fenêtre d'envoi et fuseau de l'organisation

Status: done

**Épic :** EPIC-061 — Envoi de masse : listes, lots avec reprise et garde-fous
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S39
**Prérequis :** **STORY-594** (garde-fous : plafond, fenêtre, validation)
**Origine :** rail D, bloc D2 · FR-N33, AD-13.

---

## Le récit

En tant que **microfinance**, je veux que mes rappels partent aux heures ouvrables **de chez moi**,
afin de ne pas réveiller mes clients ni brûler mes canaux.

## Le fait

⛔ **Aujourd'hui tout part dans le fuseau du serveur.** Un rappel d'échéance envoyé à 3 h du matin
chez le destinataire est une infraction sur certains canaux et une désinscription sur tous.

## Critères d'acceptation

- [x] AC-1 — La fenêtre et le fuseau sont des données **d'organisation** ; l'absence est un état
      explicite, pas un défaut silencieux.
- [x] AC-2 — ⛔ Elle est opposable **au masse seulement**. Un code de vérification part à 3 h.
- [x] AC-3 — Un envoi retenu par la fenêtre le **dit** ; il n'est ni `echoue` ni `ecarte`.
- [x] AC-4 — Le fuseau retenu est celui de l'organisation émettrice, et le choix est **écrit**.

---

## Journal de livraison (2026-09-08) — branche `MNV-636`

**Livré :** `domain/envoi-de-masse/fuseau-organisation.ts`, le champ `fuseau` des garde-fous, la
date de réouverture sur l'envoi de masse, deux gardes. Lint, build et suite unitaire au vert.

### 🏁 Cette story ferme l'ASSOMPTION A4, nommée par STORY-594 et jamais levée

La fiche de 594 le disait en toutes lettres : *« la fenêtre 8 h – 20 h d'un client à UTC+1
s'appliquerait de 9 h à 21 h chez lui, sans qu'aucune erreur ne le dise »*. C'est le pire mode de
panne d'un garde-fou : **il fonctionne, il ne lève rien, et il protège au mauvais moment.** Un test
le montre en donnant deux verdicts opposés au **même instant** pour la même fenêtre, à Lomé et à
Paris.

### ⛔⛔ Un décalage FIXE n'est pas une réponse — et c'est ce qu'on écrirait spontanément

`UTC+1` écrit en nombre d'heures se trompe **deux fois par an** partout où l'heure d'été existe. Un
envoi de nuit partirait une heure trop tôt pendant six mois, et personne ne relierait jamais le
changement d'heure aux plaintes de destinataires. Le fuseau est donc un **identifiant IANA** résolu
par `Intl`, qui connaît les règles saisonnières. Le test le prouve en lisant la même heure UTC en
juillet et en décembre à Paris : 23 h puis 22 h.

⚡ Corollaire : `fuseauConnu('UTC+1')` rend **`false`**. La forme qu'on écrirait est refusée à
l'écriture, avec son propre code.

### ⚡ `hourCycle: 'h23'` est obligatoire, et l'oublier est invisible

Le défaut d'`Intl` rend **`24`** pour minuit dans plusieurs locales. Une fenêtre `0 → 8` aurait alors
laissé passer minuit-une comme « 24 h », donc **hors fenêtre, une heure par nuit**, sans jamais
lever.

### ⛔ Le fuseau se contrôle À L'ÉCRITURE

Un identifiant inconnu accepté en base ferait lever `Intl` **au milieu d'un lot de cinquante
mille** — c'est-à-dire suspendrait une campagne pour une faute de frappe faite trois mois plus tôt,
avec une erreur que personne ne saurait rattacher au réglage. Le refus ne recopie pas la valeur
saisie : elle vient du client, et un refus qui la recopie la fait entrer dans les journaux.

### ⚡ AC-1 — l'absence est explicite, et c'est le patron de `paysRetenu` (STORY-573)

Un défaut silencieux et un choix explicite produisent la **même valeur**. Seul `fuseauSuppose` les
distingue — et c'est précisément son absence qui a rendu A4 invisible pendant deux stories. Le
fuseau est donc **toujours rendu**, même quand aucune fenêtre n'est posée : une organisation qui en
posera une demain doit voir, aujourd'hui, ce qui serait supposé pour elle.

⚠️ Les documents écrits avant cette story ne sont **pas réécrits** : une reprise de données
changerait le moment où les fenêtres de tout le monde s'appliquent, en silence. Ils sont lus sous
`UTC` — le comportement exact d'hier — et le disent.

### ⛔ AC-2 tient par une ABSENCE D'IMPORT, pas par une condition

Aucun module transactionnel ne connaît `GardeFousService` ni `dansLaFenetre` : la question *« et si
on l'appliquait aussi aux transactionnels ? »* n'a aucun endroit où se poser. Un
`if (nature === 'MASSE')` aurait été juste, et se serait fait retirer un jour par quelqu'un qui le
croyait redondant. La garde balaie quatre dossiers et porte sa **contre-preuve** : le module de
masse, lui, doit porter la fenêtre.

### ⛔ AC-4 — déduire le fuseau de l'indicatif aurait été FAUX, pas seulement approximatif

Un numéro togolais appartient couramment à quelqu'un qui vit ailleurs, et une adresse e-mail ne dit
rien du tout. Une déduction aurait produit un garde-fou qui se trompe **silencieusement** sur une
fraction des destinataires — pire que de ne pas en avoir, puisqu'on croirait la règle tenue. La
garde vérifie que les trois fichiers du chemin du fuseau ne référencent ni `destinataireRef`, ni
`indicatif`, ni la normalisation d'identifiant — **des formes exécutables**, parce que le
raisonnement lui-même est écrit dans leurs commentaires.

### ⚡ AC-3 — sans DATE, « l'envoi reprendra » est une phrase invérifiable

L'appelant voyait un envoi suspendu sans savoir s'il repartirait dans dix minutes ou dans onze
heures, et la seule façon de le découvrir était d'attendre. `reprisePrevueLe` est ce qui distingue
« pas encore parti » de « en panne ». Elle est **absente** pour un plafond atteint : celui-là ne se
rouvre pas à une heure connue, et annoncer une date aurait promis une reprise qui n'arrive pas.

⛔⛔ **Et le calcul de cette date porte deux pièges.** Une arithmétique de décalage se trompe la nuit
du changement d'heure — la seule nuit où personne ne vérifiera ; on avance donc **d'heure en heure**
en redemandant à `Intl`. Et le retrait des minutes porte sur les **minutes locales** : l'Inde est à
+05:30, le Népal à +05:45, et un arrondi sur l'horloge UTC y tomberait dans l'heure locale
**précédente** — donc annoncerait une réouverture avant qu'elle n'ait lieu, et l'envoi repartirait
pour être suspendu aussitôt.

### ⚠️ Le double de collection ignorait `$unset` — 6e occurrence

Le test « un plafond atteint efface la date d'avant » a rougi pour la bonne raison : le double de
`garde-fous-execution.spec.ts` appliquait `$set` et ignorait `$unset`. Un double qui ne se comporte
pas comme Mongo laisse passer exactement le défaut qu'on teste — ici, une date de réouverture
héritée d'une suspension précédente, qui promet une reprise qui n'aura pas lieu.

### ⚠️ Points ouverts

- Un **quatrième** code de garde-fou (`FUSEAU_INCONNU`), parce qu'il appelle un quatrième geste :
  corriger l'identifiant. Ni attendre, ni faire valider, ni réduire le volume.
- La fenêtre reste évaluée **par lot**, comme en STORY-594 : un envoi commencé à 19 h 58 se suspend
  au lot suivant, il ne traverse pas la nuit.
- Aucune conformité Docker : le comportement d'`Intl` est prouvé par test, sur des fuseaux réels.
