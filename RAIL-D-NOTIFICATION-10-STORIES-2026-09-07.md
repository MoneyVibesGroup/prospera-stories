# Rail D — `notification-service` : les 10 stories qui le rendent exploitable chez le client

**Date :** 2026-09-07 · **Service unique :** `prospera-notification-service` · **Branche d'intégration :** `dev`
**Total :** 40 points · **Identifiants : STORY-633 → STORY-642** (à réserver dans `sprint-status.yaml`).

> ⚠️ **Le rail D est le premier découpage de ce service qui sorte du PRD.** EPIC-054 → 064 sont
> **toutes** couvertes après le rail B : le service fait tout ce que le PRD du 2026-08-04 demandait.
> Ce que le rail D porte, ce n'est pas le reste du périmètre — c'est ce que le **code lui-même**
> désigne comme absent, et ce qu'une microfinance découvrira le premier mois de production.

---

## Les quatre manques, tous vérifiés dans le code le 2026-09-07

| Manque | Où le code le dit |
|---|---|
| Un rebond dur ou une plainte n'a **aucun consommateur** | `src/domain/envoi/statut-envoi.ts` : « un rejet différé, une plainte — est un **fait nouveau** […] il produira son **propre objet** ». Cet objet n'existe pas. |
| Rien ne **décide** quand une passerelle est en panne | `sante-canaux.service.ts` publie l'état ; STORY-616 dit explicitement qu'elle *ne décide de rien*. Personne ne prend le relais. |
| Il n'existe **aucun envoi différé** | Zéro occurrence de programmation dans `envois/` et `envois-de-masse/`. Tout part immédiatement, dans le fuseau du serveur. |
| La consommation est **mesurée mais jamais arrêtée** | `consommation/aucune-facturation.spec.ts` : « le modèle de coût est complet pour que la facturation s'y branche **sans reprise de données**, PAS pour qu'elle existe ». Il manque la clôture de période. |

---

## Bloc D1 — Ce que la production renvoie · 13 pts

### 1 · STORY-633 🆕 — Rebond dur, plainte, et la liste de suppression de l'organisation

**Points :** 5 · **Prérequis :** rail B (615, 616)

**Récit :** en tant que **microfinance**, je veux qu'une adresse morte cesse d'être réessayée, afin
que mon domaine vérifié ne soit pas brûlé par mes propres envois.

⛔ **C'est le seul manque du rail qui coûte un actif qu'on ne rachète pas.** STORY-615 fait attester
le domaine d'expédition par le DNS ; un taux de plaintes élevé le fait déclasser par les
destinataires, et la vérification technique reste verte pendant que plus rien n'arrive.

⚡ **Un rebond dur et un rebond mou ne se traitent pas pareil, et la passerelle ne les nomme pas
pareil non plus.** La qualification est faite **chez nous**, sur une table de correspondance par
adaptateur, jamais sur le texte libre du fournisseur.

- AC-1 — Un rebond **dur** ou une plainte crée une entrée de suppression **portée par
  l'organisation**, pas par la plateforme : deux organisations écrivant à la même personne ne
  partagent pas leur liste.
- AC-2 — ⛔ Elle ne réécrit **aucun** `Envoi` passé. Conformément à `statut-envoi.ts`, c'est un
  **fait nouveau** avec son propre objet — un `delivre` reste `delivre`.
- AC-3 — Un envoi vers une adresse supprimée sort en **`ecarte`**, avec son motif ; il ne part pas,
  et il n'est pas compté comme un échec technique.
- AC-4 — Un rebond **mou** ne supprime rien : il incrémente, et le seuil est **déclaré**, pas deviné.
- AC-5 — Une suppression se lève **explicitement**, par une action tracée avec son auteur.
- AC-6 — ⛔ Elle n'éteint **pas** le transactionnel de la même façon que le consentement : une
  adresse supprimée pour rebond dur bloque **tout**, y compris un code de vérification — parce que
  l'adresse n'existe pas. Le refus le dit ainsi, et ne se confond pas avec un désabonnement.

### 2 · STORY-634 🆕 — La passerelle en échec passe en quarantaine, et quelqu'un décide

**Points :** 5 · **Prérequis :** 633

**Récit :** en tant qu'**exploitant**, je veux qu'une passerelle en panne cesse d'être appelée, afin
qu'une file ne se vide pas contre un mur.

⚡ **STORY-616 publie la santé et ne décide de rien — c'est écrit, et c'est juste.** La décision est
un autre objet, et ce découplage est ce qui empêche une sonde de couper un canal sain. La
quarantaine se déclenche sur des **remises réellement échouées**, jamais sur une sonde.

- AC-1 — N échecs techniques consécutifs sur la passerelle **d'une organisation** la mettent en
  quarantaine ; le compteur est par organisation × canal, jamais global.
- AC-2 — En quarantaine, la remise emprunte le **repli de plateforme nommé** de STORY-605 quand
  l'organisation l'autorise, et **échoue en le disant** quand elle ne l'autorise pas.
- AC-3 — ⛔ Un refus **métier** (adresse invalide, modèle non approuvé) n'incrémente **rien** :
  la quarantaine mesure la panne, pas la mauvaise demande. Même critère que la chaîne de repli de
  STORY-623 — *sur échec technique seulement*.
- AC-4 — La sortie de quarantaine passe par la **vérification** de STORY-614, pas par un délai.
- AC-5 — L'entrée et la sortie sont des faits tracés, visibles dans `/health` par organisation.

### 3 · STORY-635 🆕 — Rotation du secret d'une passerelle, sans interrompre les envois

**Points :** 3 · **Prérequis :** rail B (604)

⚡ **La révision de STORY-604 rend la rotation presque gratuite — presque.** Une écriture produit
une clef neuve, donc le cache **manque** au lieu de servir un secret périmé. Ce qui reste à écrire,
c'est la **fenêtre** : un travail déjà en file porte l'ancienne révision.

- AC-1 — Une organisation remplace son secret ; les envois **en cours de file** ne rougissent pas.
- AC-2 — ⛔ L'ancien secret cesse d'être servi à une **date**, pas au premier succès du nouveau.
  Sans durée, « l'ancien est retiré » n'arrive jamais — le piège déjà payé en STORY-614.
- AC-3 — Le secret sortant n'apparaît nulle part : ni journal, ni `/health`, ni travail de file.
  La garde de STORY-604 (type marqué + méthode synchrone) le rend **inexprimable**, pas seulement absent.

---

## Bloc D2 — Le temps · 9 pts

### 4 · STORY-636 🆕 — Fenêtre d'envoi et fuseau de l'organisation

**Points :** 3

⛔ **Aujourd'hui tout part dans le fuseau du serveur.** Un rappel d'échéance envoyé à 3 h du matin
chez le destinataire est une infraction sur certains canaux et une désinscription sur tous.

- AC-1 — La fenêtre et le fuseau sont des données **d'organisation**, comme la destination par
  défaut de STORY-627 ; l'absence est un état explicite, pas un défaut silencieux.
- AC-2 — ⛔ Elle est opposable **au masse seulement**. Un code de vérification part à 3 h — même
  frontière que l'AC-4 de STORY-628 sur le « STOP ».
- AC-3 — Un envoi retenu par la fenêtre le **dit** dans son statut ; il n'est ni `echoue` ni
  `ecarte`, il n'est pas encore parti.
- AC-4 — Le fuseau retenu est celui de l'organisation émettrice, et le choix est **écrit** :
  celui du destinataire n'est pas connu de façon fiable, et le déduire de l'indicatif serait faux.

### 5 · STORY-637 🆕 — Envoi programmé, annulable tant qu'il n'est pas parti

**Points :** 3 · **Prérequis :** 636

- AC-1 — Un envoi peut porter une date de remise ; il occupe une place en file **sans consommer** de
  passerelle avant l'heure.
- AC-2 — Il s'annule tant qu'il n'est pas remis ; après remise, l'annulation est **refusée**, pas
  ignorée — et le refus nomme la remise.
- AC-3 — Le point de non-retour est **observable** : l'appelant peut savoir s'il lui reste la main.
- AC-4 — ⛔ Un envoi programmé traverse le consentement et la suppression **à la remise**, jamais à
  la demande. Même règle que la passerelle de STORY-604 : ce qui est vrai à la commande ne l'est plus
  au départ.

### 6 · STORY-638 🆕 — Attestation d'envoi : l'extrait opposable du journal

**Points :** 3

**Récit :** en tant que **microfinance**, je veux prouver qu'un avis d'échéance est parti, afin de
le porter devant un client ou un régulateur.

⚡ **Le journal `audit_envois` est déjà append-only et sur une base au rôle restreint.** Il ne
manque que la **sortie** : un extrait borné, daté, qui cite ce qui a été observé et **rien d'autre**.

- AC-1 — L'attestation porte : destinataire, canal, modèle et version **figée**, horodatages des
  statuts observés, et l'identité d'expédition retenue.
- AC-2 — ⛔ Elle ne porte **pas** le contenu rendu au-delà de l'horloge des variables d'AD-15 : une
  attestation demandée après 90 jours dit *« contenu purgé »*, elle ne l'invente pas.
- AC-3 — Un statut jamais observé se lit **« non observé »**, jamais « non délivré ».
  `NON_VERIFIABLE` n'est pas `NON_VERIFIEE` — la leçon de STORY-614, sur un autre objet.
- AC-4 — La demande d'attestation est elle-même un fait tracé, avec son demandeur.

---

## Bloc D3 — Ce que l'organisation voit et reçoit · 13 pts

### 7 · STORY-639 🆕 — La période de consommation se clôt et devient immuable

**Points :** 5 · **Prérequis :** rail B (596)

⛔ **C'est la story qui rend la facturation possible sans la faire** — et la garde
`aucune-facturation.spec.ts` doit rester **verte** à la fin.

⚡ **Un compteur qui bouge encore n'est pas facturable.** Aujourd'hui la période vient de
`prepareLe` et le compteur se maintient dans la transaction du fait ; un accusé tardif peut donc
changer le passé. La clôture est ce qui fige.

- AC-1 — Une période close porte un **arrêté** : totaux par canal et par devise, **jamais additionnés
  entre devises**.
- AC-2 — Un fait arrivant après la clôture tombe dans la période **suivante**, avec sa date d'origine
  conservée. ⛔ Il ne rouvre rien.
- AC-3 — La clôture est **idempotente** et rejouable : deux appels produisent un seul arrêté.
- AC-4 — L'arrêté cite la **révision de barème** qui l'a produit ; le coût réel rapporté par la
  passerelle gagne sur l'estimé, et le **premier** rapporté gagne — la règle de STORY-624.
- AC-5 — ⛔ Aucun solde lu, aucun quota comparé, aucun envoi refusé parce qu'il coûte. La garde
  balaie tout le service et **reste verte**.

### 8 · STORY-640 🆕 — La console de l'organisation : son journal, sans route d'écriture

**Points :** 3 · **Prérequis :** 638, 639

⚡ **La borne d'une console n'est pas une liste d'actions autorisées, c'est un module SANS route
d'écriture.** La leçon de STORY-598, appliquée cette fois au public **client** et non à l'opérateur
plateforme.

- AC-1 — Une organisation voit ses envois, ses statuts, ses coûts arrêtés, ses suppressions et
  l'état de ses passerelles.
- AC-2 — ⛔ Le module ne déclare **aucun** verbe d'écriture. Une garde de balayage cherche des
  **formes exécutables**, pas des mots — une description Swagger est une chaîne, donc du code.
- AC-3 — Le gate d'organisation passe **avant** le contrôleur, et le critère n'est jamais un nom de
  rôle. Deux publics, deux gardes, jamais superposées.
- AC-4 — « Rien à afficher » et « pas encore mesuré » ne se lisent pas pareil.

### 9 · STORY-641 🆕 — Les faits d'envoi remis chez l'organisation, signés et rejouables

**Points :** 5 · **Prérequis :** 634

**Récit :** en tant que **distributeur**, je veux recevoir dans **mon** système ce que Prospera a
envoyé pour moi, afin de ne pas avoir à venir le lire chez vous.

⚠️ **C'est un appel sortant vers une adresse que le client déclare — donc une surface de
falsification et une surface de fuite.** Les deux se ferment dans la même story ou dans aucune.

- AC-1 — L'organisation déclare une adresse de remise ; elle est **vérifiée** avant d'être active,
  par le même mécanisme que STORY-614 (une question posée, pas une case cochée).
- AC-2 — Chaque remise est **signée** ; le secret de signature suit la rotation de STORY-635.
- AC-3 — ⛔ Le fait remis ne porte **ni contenu rendu, ni variable, ni jeton** — seulement
  l'identifiant, le canal, le statut et l'horodatage. Le contenu se lit sur la console, authentifié.
- AC-4 — Une adresse injoignable entre en **quarantaine** par la règle de STORY-634 ; elle
  n'immobilise aucune file d'envoi.
- AC-5 — Le rejeu **recopie** le fait, il ne le résout pas — la règle de STORY-597.

---

## Bloc D4 — La recette du rail · 5 pts

### 10 · STORY-642 🆕 — Recette du rail D, de la panne jusqu'à l'arrêté

**Points :** 5 · 🏁 **Recette du rail D**

**Récit :** en tant qu'**équipe**, je veux une recette qui traverse une panne de passerelle, une
adresse morte, un envoi différé et une clôture de période, afin de savoir que le service tient un
mois de production sans le rail C.

- AC-1 — Une passerelle tombe, la quarantaine s'ouvre, le repli nommé prend, la vérification la rouvre.
- AC-2 — Une adresse rebondit dur ; le second envoi sort en `ecarte` et **le premier reste `delivre`**.
- AC-3 — Un envoi programmé hors fenêtre attend, part à l'heure, et un code de vérification le double.
- AC-4 — Un accusé arrive **après** la clôture et tombe dans la période suivante, sans rouvrir l'arrêté.
- AC-5 — Un fait est remis chez l'organisation, signé, sans contenu ; le rejeu recopie.
- AC-6 — ⛔ Aucun code conditionnel `si production` sur ce chemin, et
  `aucune-facturation.spec.ts` est **verte**.

---

## Ce que le rail D ne peut pas prouver seul

| Question | Portée par |
|---|---|
| Un arrêté de consommation devient une **créance** | convergence (STORY-643) |
| Un **encaissement réel** fait partir un reçu | convergence (STORY-644) |
| Un distributeur est **facturé** pour ce qu'il consomme | convergence (STORY-645) |

---

## Ordre de tirage

```
633 ──► 634 ──► 641
   │       └──► 642
635 ─────────────┘
636 ──► 637 ─────┘
638 ──┐
639 ──┴──► 640 ──► 642
```
