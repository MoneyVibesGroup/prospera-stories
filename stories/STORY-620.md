# STORY-620 : Adaptateur SMS derrière le port unique

Status: done

**Épic :** EPIC-063 — Passerelles tierces
**Service :** `notification-service`
**Points :** 5 · **Sprint :** S36
**Prérequis :** **STORY-604** (passerelle par organisation), **STORY-614** (vérification)
**Origine :** rail B, bloc B3 · AD-6, FR-N14, FR-N19, FR-N20.

---

## Le récit

En tant qu'**organisation cliente**, je veux joindre mes clients par SMS, afin d'atteindre ceux qui
n'ont ni adresse e-mail ni application installée.

## Le fait

⚡ **La preuve que le port d'AD-6 n'a fui nulle part** se refait ici, comme en STORY-580 pour
l'in-app : deux lignes de fabrique, et rien d'autre ne bouge.

⚠️ Le destinataire est un **contact**, donc le consentement et le désabonnement mordent, et le
numéro se normalise par le carnet, jamais à la main.

## Critères d'acceptation

- [x] AC-1 — L'adaptateur entre par la même fabrique que l'e-mail ; aucune exception n'apparaît.
- [x] AC-2 — Identifiants pris de la passerelle de l'organisation (STORY-604), jamais de
      l'environnement.
- [x] AC-3 — Accusé de remise rattaché par le webhook signé existant.
- [x] AC-4 — Le numéro est masqué dans tout journal.

---

## Ce que la livraison a appris (2026-09-07)

**Branche :** `MNV-620`, empilée sur `MNV-619`.

### ⚡ Ce que l'adaptateur parle est un CONTRAT QUE NOUS POSONS, pas le dialecte d'un fournisseur

Aucun contrat d'agrégateur n'est signé. Inventer le dialecte d'un fournisseur particulier aurait
créé une dépendance à un choix qui n'est pas fait. L'adaptateur pose donc **son** contrat — un
`POST` JSON, trois champs, une référence en retour — et le jour du premier contrat signé, deux
issues : l'agrégateur accepte ce contrat derrière une passerelle d'adaptation, ou il obtient son
propre adaptateur. **Les deux coûtent une classe ; aucune ne touche le noyau.**

⛔ **Trois champs, et pas un quatrième.** Ni l'organisation, ni la référence de modèle, ni
l'identifiant d'envoi : ce sont nos données de gestion, et un agrégateur qui les reçoit les
conserve.

### ⛔ `verifierIdentifiants` n'est PAS déclarée, et c'est une DÉCISION

Son absence dit `NON_VERIFIABLE` (STORY-614), qui est un statut **activable**. Inventer un point de
vérification serait affirmer une API qui n'existe pas : on ne peut pas interroger une capacité
qu'aucun contrat ne publie. Et un message d'essai vers un numéro réel serait un envoi non demandé,
non consenti et **facturé**.

⚡ **Le type lui-même le dit** : TypeScript refuse de nommer la méthode sur cette classe, et le test
doit passer par le port pour constater son absence — c'est exactement l'astuce de STORY-614, vue de
l'autre côté.

### ⛔ Zéro n'est PAS « gratuit » ici, c'est « non contracté » — et la différence coûte cher

Sur l'in-app, zéro est un **fait** : il n'y a pas de fournisseur. Sur le SMS, aucun barème n'est
publié, et **inventer un prix serait pire que ne pas en avoir** — une campagne annoncerait un
montant faux avec l'autorité d'un chiffre. Le remède est déjà nommé : le barème est une donnée du
**contrat du marchand**, pas une propriété du fournisseur (leçon de STORY-603 côté paiement), et il
quittera ce catalogue statique en **STORY-624**.

### ⚡ Un REFUS prouve que l'agrégateur répond

`401` et `403` disent que le **compte** est mauvais — une autre maladie, un autre remède : renouveler
une clé, ce que seule l'organisation peut faire. Seul le silence est une indisponibilité.
⚠️ **`429` est une indisponibilité, pas un refus** : le message est bon, c'est le moment qui ne
l'est pas, et la politique de reprise sait attendre. Le ranger avec les autres `4xx` aurait fait
abandonner définitivement un message qu'il suffisait de retenter.

### ⚠️ Le drapeau `bidirectionnel` est déclaré maintenant, et il n'ouvre RIEN

Il dit ce que le **protocole permet**, pas ce que le service sait faire. Le taire aurait obligé
EPIC-064 à modifier un catalogue de capacités pour livrer une surface entrante — c'est-à-dire à
changer la description d'un canal pour ajouter du code. ⛔ En revanche
`referenceConversationTransportee` est **faux** : un SMS entrant arrive avec un numéro et un texte,
rien d'autre, et le rattachement d'une réponse sera donc **présumé**, jamais certain.

### ⛔ Un SMS n'a pas d'objet, et un objet fourni est REFUSÉ

Le laisser passer l'aurait fait disparaître en silence, et l'appelant aurait cru l'avoir envoyé.

### ⚠️ Le plafond de délai de STORY-614 se repaie ici

Un réglage saisi par le client ne peut pas décider du temps que la plateforme attend : sans le
plafond de quinze secondes, une organisation ferait patienter dix minutes une requête synchrone et
occuperait un exécutant de remise d'autant.

### ⛔ Points ouverts légués

1. **Le tarif est à zéro et c'est faux** — corrigé en STORY-624, qui sort le barème du catalogue
   statique vers le contrat de l'organisation.
2. **Aucun contrat d'agrégateur n'est signé** : le contrat exposé est le nôtre, et la première
   signature dira s'il faut une passerelle d'adaptation ou un second adaptateur.
3. **Aucune recette contre un vrai agrégateur** : `fetch` est simulé. Ce qui est prouvé, c'est que
   l'adaptateur refuse ce qu'il doit refuser **avant** de parler à quiconque.
