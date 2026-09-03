# STORY-580 : Adaptateur in-app — le destinataire est un utilisateur, jamais un contact miroir

Status: ready-for-dev

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

- [ ] AC-1 — L'in-app est un adaptateur `ChannelProvider` **comme les autres**, sans passerelle
      externe. Il déclare ses capacités en données, comme tout adaptateur (STORY-577).
- [ ] AC-2 — Le `Destinataire` d'un `Envoi` in-app est un `Utilisateur` du read-model d'identité.
      Un envoi in-app vers un `Contact` est **refusé**.
- [ ] AC-3 — ⛔ Test de mutation : **aucun chemin de code ne crée un `Contact` à partir d'un
      utilisateur**, et le carnet n'est jamais alimenté par `identity.*`. La garde de STORY-573 est
      rejouée ici, cette fois avec un adaptateur réel en face.
- [ ] AC-4 — ⚡ La certitude de lecture est **`confirmé` par construction** : l'accusé n'est pas reçu
      d'un tiers, il est écrit par le service lui-même. Les capacités du canal l'annoncent.
- [ ] AC-5 — Un envoi in-app ne consomme **aucune passerelle** et son coût est nul, avec sa devise
      quand même portée (`Cout` reste le type unique du domaine).

## Notes

- L'ordre de tirage du S42 place cet épic **en tête** : cinq points, aucune dépendance, et il
  débloque STORY-581 qui réveille un hook endormi depuis le 2026-08-20.
