# STORY-611 : Les sept modèles de compte, livrés avec le code

Status: todo

**Épic :** EPIC-055 — Modèles, rendu et formes par canal
**Service :** `notification-service`
**Points :** 5 · **Sprint :** S35
**Prérequis :** **STORY-604** (passerelle par organisation)
**Origine :** revue d'architecture du 2026-09-06 · AD-8, FR-N24. **Bloque STORY-610.**

---

## Le récit

En tant que **nouvel utilisateur**, je veux recevoir un message de vérification même si mon
organisation n'a jamais rien configuré, afin de pouvoir simplement créer mon compte.

## Le fait

⚡ **Un modèle de compte n'est pas un modèle d'organisation, et la différence est une question
d'ANTÉRIORITÉ.** Les modèles ordinaires sont écrits par une organisation, dans sa base, après son
inscription. Ces sept-là doivent exister **avant que quiconque ait rien fait** — sinon la toute
première inscription de la plateforme n'a aucun message à envoyer. Ils sont donc **livrés avec le
code**, comme la page de désabonnement de `STORY-583` et pour la même raison.

⛔ **Une organisation peut habiller ces messages, jamais les supprimer.** Un client qui pourrait
retirer le message de réinitialisation de mot de passe fermerait à ses propres utilisateurs le seul
chemin de récupération d'un compte. La surcharge porte sur la **marque et le libellé**, pas sur
l'existence.

⚡ **La nature naît du point d'entrée.** Ces sept messages sont transactionnels parce qu'ils entrent
par le cas d'usage transactionnel, pas parce qu'un champ le dit. `nature-jamais-en-entree.spec.ts`
tient déjà cette règle, et elle vaut ici plus qu'ailleurs : un code de vérification rangé en masse
partirait derrière une campagne de cinquante mille destinataires.

⚠️ **Les textes ne se réécrivent pas de mémoire.** Ils existent en Handlebars dans `auth-service` et
sont en production. Les transcrire mot pour mot est le seul moyen de ne pas changer le contenu d'un
message légal en changeant son transport.

## Critères d'acceptation

- [ ] AC-1 — **Sept modèles système** existent, livrés avec le code et **versionnés** : vérification,
      invitation, confirmation de changement d'adresse, alerte de changement, alerte d'adresse déjà
      prise, réinitialisation, confirmation de réinitialisation.
- [ ] AC-2 — Ils sont disponibles pour **toute** organisation **sans écriture préalable**, y compris
      pour une organisation créée à la seconde précédente.
- [ ] AC-3 — ⛔ Une organisation peut **surcharger la marque et le libellé**, elle ne peut pas
      **retirer** un modèle système. Test de refus explicite.
- [ ] AC-4 — La nature est **transactionnelle par construction** ; aucun corps d'entrée ne la porte,
      et le désabonnement ne les atteint pas.
- [ ] AC-5 — Le rendu est prouvé sur les **deux canaux servis** aujourd'hui, e-mail et in-app, avec
      la forme propre à chacun (`forme-par-canal.ts`).
- [ ] AC-6 — Les textes sont **transcrits** des gabarits Handlebars d'`auth-service`, et un test
      compare les variables attendues de chaque modèle à celles que l'appelant fournira.
- [ ] AC-7 — ⛔ Un modèle système dont une variable manque **refuse le rendu** au lieu de laisser
      passer un marqueur non substitué. *Un `{{lien}}` affiché tel quel dans un e-mail de
      réinitialisation est un compte perdu.*

## Notes

⚠️ **Le moteur de gabarits.** AD-8 réserve le moteur système aux mises en page livrées avec le code,
distinct de celui des modèles de base. Ces sept modèles relèvent du **système**. Ne pas ouvrir le
moteur de base à du HTML à cette occasion : ce serait une seconde story, non demandée.

⚡ Livrée avant `STORY-610`, cette story est **inerte et sans risque** : les modèles existent, rien ne
les appelle encore.
