# Les 20 prochaines stories — `paiement-service` × `notification-service`

**Date :** 2026-09-06 · **Objectif de fin de série :** une recette de bout en bout où **un cabinet
paie son abonnement à Money Vibes**, et où **un distributeur ou une microfinance configure ses
propres clés de fournisseur et encaisse pour lui-même**.

---

## 1. Le scénario que ces 20 stories rendent jouable

1. Money Vibes déclare son compte d'encaissement et **ses propres clés FedaPay**. *(le socle existe)*
2. Money Vibes ouvre un abonnement pour un cabinet : périodicité, montant, échéance.
3. L'échéance **est une créance**, une demande est émise, un lien est créé. *(le socle existe)*
4. **Le lien part au cabinet par e-mail**, sous l'identité d'envoi de Money Vibes.
5. Le cabinet paie sur la page publique, via FedaPay. *(le socle existe)*
6. La notification signée du fournisseur crée l'encaissement. *(le socle existe)*
7. `paiement.abonnement.echeance.encaissee` part, **le catalogue prolonge le droit d'usage**.
8. En parallèle, un distributeur déclare **ses** clés, **son** compte, **sa** passerelle d'envoi, et
   encaisse une collecte — par lien, ou en espèces déclarées puis validées par un second rôle.

Les étapes 4 et 7 sont les deux seules qui n'existent pas. Tout le reste est livré ou écrit.

---

## 2. Trois constats qui changent l'ordre

### 2.1 ⛔ STORY-261 est **irrecevable en l'état** — deux contrats se contredisent

`STORY-261` fait publier `paiement.demande.emise` sur le bus pour que `notification-service` envoie
le lien. Or ce service **l'interdit** :

- sa liste `EVENEMENTS_DECLENCHEURS` est **fermée** et ne contient aucun topic `paiement.*` ;
- son AD-2 discrimine les deux chemins d'entrée **par le contenu** : *ce qui transporte un lien à
  usage unique ou un code entre par appel direct, jamais par le bus.*

Ouvrir la liste serait le mauvais remède : il permettrait un jour à une règle d'organisation de
brancher un envoi sur un topic porteur de secret, et le discriminant d'AD-2 cesserait d'être
vérifiable en revue. **L'événement reste, mais il ne porte plus le lien ; l'envoi se fait par appel
direct.** C'est `STORY-607`, et elle passe **avant** `STORY-261`.

### 2.2 ⚡ Le blocage du cas C n'est pas là où on le croit

Le gate d'accès au paiement est *fail-closed* sur deux read-models : KYC `APPROVED` **et**
entitlement paiement `ACTIVE`. `STORY-289` a fait de Money Vibes une organisation, mais **aucune de
ces deux projections ne la connaît**. Money Vibes ne peut donc rien encaisser pour elle-même.

En revanche **le cabinet payeur n'a besoin d'aucun droit** : il paie sur la surface publique du lien,
qui n'est pas authentifiée. Le mur est du côté du bénéficiaire, pas du payeur. C'est `STORY-606`.

### 2.3 ⚡ Le modèle commercial n'a aucun organe qui l'applique

La grille vend une licence annuelle par bundle **plus une maintenance mensuelle à partir de l'année
2**. L'entitlement du catalogue n'a **pas d'échéance** : un droit octroyé ne s'éteint que si
quelqu'un pense à le révoquer, et seulement si le réseau est là. C'est `STORY-609`, et elle est la
seule story de cette série qui ne sert pas la démonstration mais **le revenu**.

---

## 3. Les 20 stories, dans l'ordre d'exécution

Les identifiants **604 → 612 sont neufs** ; le dernier numéro pris toutes branches confondues était
`603`. Les autres sont **déjà écrites** dans les découpages et n'ont pas encore de fiche.

### Bloc A — L'identité d'envoi et l'amorçage · 13 pts

| # | Story | Service | Titre | Pts |
|:-:|---|---|---|:-:|
| 1 | **STORY-604** 🆕 | `notification` | La passerelle de l'organisation est résolue **à la remise** | 5 |
| 2 | **STORY-605** 🆕 | `notification` | Repli de plateforme **nommé**, et ce qu'il change pour le destinataire | 3 |
| 3 | **STORY-606** 🆕 | `paiement` | L'organisation Money Vibes franchit **son propre** gate | 3 |
| 4 | **STORY-607** 🆕 | `paiement` + `notification` | Arbitrage AD-2 : **aucun topic ne transporte un lien à usage unique** | 2 |

> **Démontrable en fin de bloc :** deux organisations envoient un e-mail depuis la même route, sous
> deux expéditeurs différents ; et Money Vibes émet une demande sur son propre compte.

### Bloc B — Le lien atteint le payeur · 13 pts

| # | Story | Service | Titre | Pts |
|:-:|---|---|---|:-:|
| 5 | **STORY-608** 🆕 | `paiement` | Client d'envoi et **file de sortie** vers `notification-service` | 3 |
| 6 | STORY-261 | `paiement` | Émission du lien via `notification-service` — *AC-2 à réécrire* | 5 |
| 7 | STORY-259 | `paiement` | Paiement partiel, restants nommés et trop-perçu | 5 |

> **Démontrable en fin de bloc :** une demande émise part au payeur par e-mail, sans qu'aucun jeton
> ne soit passé par le bus ni écrit dans un journal. 🏁 **EPIC-037 fermée** si `STORY-255` suit.

### Bloc C — L'abonnement et le droit d'usage · 23 pts

| # | Story | Service | Titre | Pts |
|:-:|---|---|---|:-:|
| 8 | STORY-277 | `paiement` | Abonnement : contrat, périodicité, échéance | 5 |
| 9 | STORY-278 | `paiement` | Échéance encaissée : publication vers le catalogue | 3 |
| 10 | STORY-279 | `catalogue` | `platform-catalog-service` consomme `paiement.abonnement.*` | 5 |
| 11 | **STORY-609** 🆕 | `catalogue` | L'entitlement porte une **échéance**, et le renouvellement **prolonge** | 5 |
| 12 | STORY-280 | `paiement` | Impayé, suspension et préavis | 5 |

> **Démontrable en fin de bloc :** payer ouvre les droits, ne pas payer les ferme, et **le silence
> les ferme aussi**. C'est la fin de la décision C8, ouverte depuis `STORY-034`.

### Bloc D — L'argent qui n'arrive pas par le lien · 14 pts

| # | Story | Service | Titre | Pts |
|:-:|---|---|---|:-:|
| 13 | STORY-282 | `paiement` | Rétablissement automatique après régularisation | 3 |
| 14 | STORY-262 | `paiement` | Déclaration manuelle d'encaissement | 5 |
| 15 | STORY-263 | `paiement` | Validation d'un encaissement déclaré, **rôle distinct** | 3 |
| 16 | STORY-281 | `paiement` | Période de grâce bornée, datée et motivée | 3 |

> ⚡ **Ce bloc n'est pas optionnel pour le cas Money Vibes.** Une licence à 65 000 000 FCFA et une
> maintenance à 3 500 000 FCFA par mois **ne passent par aucun lien mobile money** : elles arrivent
> par virement, donc par le chemin *déclaré puis validé*. Pour Money Vibes, ce chemin est le
> **principal**, pas l'exception.

### Bloc E — Les messages de compte et la recette · 21 pts

| # | Story | Service | Titre | Pts |
|:-:|---|---|---|:-:|
| 17 | **STORY-610** 🆕 | `auth` | Les **sept** e-mails de compte passent par `notification-service` | 8 |
| 18 | **STORY-611** 🆕 | `notification` | Les sept **modèles système**, livrés avec le code | 5 |
| 19 | **STORY-612** 🆕 | `notification` | La **cloche** reçoit les faits d'abonnement | 3 |
| 20 | STORY-288 | `paiement` | Recette de bout en bout en sandbox | 5 |

> **Démontrable en fin de série :** l'inscription d'un utilisateur, la vérification de son adresse,
> l'ouverture de son abonnement, l'arrivée du lien, le paiement, l'ouverture des droits et l'alerte
> d'échéance suivante — **tous** sous l'identité d'envoi de l'organisation concernée.

**Total : 84 points.** À 34 points de capacité, trois sprints : S34, S35, S36.

---

## 4. Ce qui est délibérément **hors** de ces 20

| Sujet | Pourquoi pas maintenant |
|---|---|
| **SMS, WhatsApp, push** (EPIC-063) | Bloqué par un **délai externe**, pas par du code. Un compte WhatsApp Business vérifié et un agrégateur SMS régional se comptent en semaines. ⚡ **À lancer commercialement dès aujourd'hui, en parallèle** : c'est le chemin critique du bundle Terrain & Collecte, qui vend « WhatsApp avec lien de paiement » en première ligne. |
| **Jeton de licence hors ligne** | Exige une clé de signature et une décision d'exploitation sur les instances installées chez le client. Nommé dans `STORY-609`, reporté. |
| **STORY-255** (simulateur de fractionnement) | 3 pts de confort, aucun effet sur la recette. À tirer pour fermer EPIC-037. |
| **STORY-264** (délai de validation, écart) | Suit naturellement 262-263, mais n'est sur le chemin d'aucune démonstration. |
| **Décaissement / paiement fournisseur** | ⛔ **N'existe dans aucun périmètre.** Le NFR-1b interdit toute notion de reversement. C'est un PRD à écrire, pas une story à tirer. |

---

## 5. Points à arbitrer par le PO avant le bloc A

1. **`STORY-261` est modifiée**, pas seulement ordonnancée : son AC-2 (« l'organe de parole est
   unique ») reste vrai, mais son AC-1 devient « l'événement ne porte pas le lien ». À valider.
2. **Le repli d'identité d'envoi.** Une organisation sans passerelle configurée envoie-t-elle sous la
   marque Prospera, ou n'envoie-t-elle pas ? `STORY-605` propose le repli **visible**. À trancher.
3. **L'identité d'envoi d'une inscription sans organisation.** Une personne peut s'inscrire avant
   toute organisation. `STORY-610` propose Money Vibes. À confirmer.
4. **Le relais local d'`auth-service`** reste-t-il en repli une version, ou est-il retiré tout de
   suite ? `STORY-610` propose de le garder derrière un interrupteur nommé.
5. **`STORY-609` change un contrat lu par tous les verticaux.** L'échéance sur l'entitlement doit
   être annoncée aux équipes bilan, fiscalité et dossier avant d'être livrée.
