# STORY-607 : Arbitrage AD-2 — aucun topic ne transporte un lien à usage unique

Status: todo

**Épic :** EPIC-037 — Créance, demande, lien et encaissement
**Services :** `paiement-service` **et** `notification-service` *(story de contrat)*
**Points :** 2 · **Sprint :** S34
**Prérequis :** aucun — **bloque STORY-261**
**Origine :** revue d'architecture du 2026-09-06 · AD-2 (`notification`), FR-P17, AD-17 (`paiement`).

---

## Le récit

En tant qu'**architecte**, je veux que les deux services disent la même chose sur le chemin que
prend un lien de paiement, afin que `STORY-261` soit implémentable.

## Le fait

⛔ **Deux contrats se contredisent, et l'un des deux est déjà du code livré.**

- `STORY-261` prévoit de publier `paiement.demande.emise` **pour que la notification envoie le
  lien**.
- `notification-service` l'interdit : sa liste `EVENEMENTS_DECLENCHEURS` est **fermée** et ne
  contient aucun topic `paiement.*`, et son AD-2 discrimine les deux chemins d'entrée **par le
  contenu** — *tout ce qui transporte un lien à usage unique ou un code entre par appel direct,
  jamais par le bus.*

⚡ **Ouvrir la liste serait le mauvais remède, et le commentaire du code le dit déjà.** Une règle de
déclenchement appartient à une **organisation** ; laisser abonner une règle à un topic arbitraire
permettrait un jour de brancher un envoi sur un topic porteur de secret, et le discriminant d'AD-2
cesserait d'être **vérifiable en revue**. La liste fermée n'est pas une commodité, c'est le contrôle.

⚡ **L'événement n'est pas supprimé, il est amaigri.** `paiement.demande.emise` reste utile à la
comptabilité, à la relance et au pilotage. Ce qu'il perd, c'est ce qu'il n'avait pas le droit de
porter : le jeton et l'URL.

⚠️ **Le jeton vaut 256 bits d'entropie et c'est tout ce qui protège la page.** Un topic Kafka est lu
par des consommateurs qu'on n'a pas écrits, conservé selon une rétention qu'on n'a pas choisie, et
rejouable. Un jeton qui y passe est un jeton dont on ne contrôle plus la durée de vie.

## Critères d'acceptation

- [ ] AC-1 — ⛔ `paiement.demande.emise` **ne porte ni jeton, ni URL de lien, ni QR**. Test sur la
      charge publiée.
- [ ] AC-2 — Une **garde de balayage** vérifie qu'aucune charge d'événement sortant de
      `paiement-service` ne contient le préfixe public du lien. La garde cherche une **forme
      exécutable**, pas un mot dans un commentaire (leçon de `STORY-595`).
- [ ] AC-3 — `EVENEMENTS_DECLENCHEURS` **reste fermée et inchangée**. Un test de présence le fige et
      rappelle pourquoi.
- [ ] AC-4 — L'envoi du lien au payeur se fait par **appel direct** à `notification-service`. La
      décision est écrite dans les deux découpages, `epics-paiement` et `epics-notification`.
- [ ] AC-5 — L'AC-2 historique de `STORY-261` reste vrai et vérifié : **il n'existe aucun envoi
      direct au payeur depuis `paiement-service`** — ni SMS, ni e-mail, ni WhatsApp. L'organe de
      parole reste unique. *Appeler la notification n'est pas parler au payeur.*

## Notes

⚡ **La même règle s'applique à `auth-service`** et c'est ce qui décide de la forme de `STORY-610` :
un code de vérification et un lien de réinitialisation sont exactement ce qu'AD-2 refuse de mettre
sur le bus. La délégation des sept e-mails se fera donc **par appel**, pas par événement — malgré
l'inversion de dépendance que cela crée. `STORY-610` porte ce risque et le borne.

⚠️ Cette story ne livre presque pas de code. Elle livre **deux gardes et une décision écrite**.
C'est le prix pour que `STORY-261` ne soit pas implémentée deux fois.
