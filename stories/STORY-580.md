# STORY-580 : Adaptateur in-app — le destinataire est un utilisateur, jamais un contact miroir

Status: done

**Épic :** EPIC-057 — Le canal in-app
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S42
**Prérequis :** **STORY-577** (port de canal) · **STORY-579** (envoi unitaire)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-6, AD-12.

---

## Le fait

L'in-app est **le seul canal dont le destinataire est un utilisateur Prospera authentifié**. Il ne
passe pas par le carnet, il n'a pas de passerelle, et il n'a pas de contrat externe.

⛔ **Aucun `Contact` miroir.** En créer un « par uniformité » le ferait tomber sous la purge des 3 ans
et sous le désabonnement, et constituerait une **seconde source de vérité** de l'identité — qui
appartient à `auth-service`.

## Critères d'acceptation

- [x] AC-1 — L'in-app est un adaptateur `ChannelProvider` **comme les autres**, sans passerelle
      externe. Il déclare ses capacités en données, comme tout adaptateur (STORY-577).
- [x] AC-2 — Le `Destinataire` d'un `Envoi` in-app est un `Utilisateur` du read-model d'identité.
      Un envoi in-app vers un `Contact` est **refusé**.
- [x] AC-3 — ⛔ Test de mutation : **aucun chemin de code ne crée un `Contact` à partir d'un
      utilisateur**, et le carnet n'est jamais alimenté par `identity.*`. La garde de STORY-573 est
      rejouée ici, cette fois avec un adaptateur réel en face.
- [x] AC-4 — ⚡ La certitude de lecture est **`confirmé` par construction** : l'accusé n'est pas reçu
      d'un tiers, il est écrit par le service lui-même. Les capacités du canal l'annoncent.
- [x] AC-5 — Un envoi in-app ne consomme **aucune passerelle** et son coût est nul, avec sa devise
      quand même portée (`Cout` reste le type unique du domaine).

## Notes

- L'ordre de tirage du S42 place cet épic **en tête** : cinq points, aucune dépendance, et il
  débloque STORY-581 qui réveille un hook endormi depuis le 2026-08-20.

---

## Livraison — 2026-09-05, branche `MNV-580` sur `MNV-579`

1 501 tests unitaires (118 suites) + 95 e2e + 32 de conformité ; couverture
99,13 / 91,74 / 96,82 / 99,15.

**⚡ Le port d'AD-6 a tenu.** Le canal le plus différent des cinq est entré par la
même porte que l'e-mail : capacités en données, `remettre`, **deux lignes** au
module de composition. Aucune exception n'a été nécessaire dans le noyau.

**Ce qui a changé par rapport à la fiche, et pourquoi :**

- ⛔ **Un défaut de STORY-572 a été trouvé au passage, et il était silencieux.**
  `lireEnveloppe` exigeait un `orgId` de **tout** message entrant ; les topics
  `identity.user.*` n'en portent aucun. Le consommateur les rejetait tous,
  l'offset avançait, et le read-model restait vide derrière un simple
  avertissement. Trouvé **en publiant un vrai événement sur un vrai Kafka** —
  aucun test unitaire ne pouvait le voir, `collectCoverageFrom` excluant
  `*bootstrap*`. Un consommateur déclare désormais sa **clé de partition**.

- ⛔ **La garde de STORY-573, rejouée ici par AC-3, a rougi — et elle avait tort
  sur un point** : elle interdisait plus qu'AD-12, qui exige au contraire un
  read-model d'identité pour l'in-app. Elle a été **resserrée** sur la vraie
  frontière et **durcie** de deux contrôles, dont « aucune collection de personne
  ne porte un identifiant de canal ».

- ⚡ **`DemandeRemise` porte désormais l'organisation.** L'in-app écrit dans
  notre base : une cloche sans organisation serait lisible par la mauvaise.

**Écart assumé :** `luLe` est déclaré sur la cloche et **rien ne l'écrit**
(STORY-581), avec sa garde d'inertie — l'ajouter plus tard imposerait une
migration sur une collection peuplée.
