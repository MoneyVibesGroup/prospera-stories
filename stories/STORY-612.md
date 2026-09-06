# STORY-612 : La cloche reçoit les faits d'abonnement

Status: todo

**Épic :** EPIC-057 — Canal in-app et fil d'activité
**Service :** `notification-service` *(déclenché par `paiement-service`)*
**Points :** 3 · **Sprint :** S36
**Prérequis :** **STORY-280** (impayé, suspension, préavis), **STORY-581** (fil d'activité)
**Origine :** revue d'architecture du 2026-09-06 · FR-P48, AD-12.

---

## Le récit

En tant que **dirigeant d'une organisation cliente**, je veux voir dans ma cloche que mon abonnement
arrive à échéance, afin de ne pas découvrir la suspension en ouvrant l'application un matin.

## Le fait

⚡ **La cloche existe et un seul service y dépose.** `STORY-581` a réveillé la route de
`dossier-service`, avec son compteur de non-lus. Depuis, aucun autre module n'y publie. Si chaque
module invente son propre bandeau d'alerte, il y aura des alertes dans quarante-cinq écrans et aucun
endroit commun — ce que la cloche existait précisément pour empêcher.

⚡ **L'abonnement est le meilleur premier client de cette cloche**, parce que son fait est daté
d'avance : une échéance se voit venir. Un préavis in-app coûte un dépôt et évite une suspension
subie.

⛔ **La cloche ne porte pas le lien de paiement.** Un lien à usage unique déposé dans un fil consulté
par tous les membres habilités serait un jeton partagé. Elle porte le **fait** et **renvoie à
l'écran des échéances**, où le lien s'obtient sous le contrôle du gate.

⚡ **Une organisation suspendue voit encore sa cloche.** C'est le seul canal qui lui reste pour
apprendre comment se rétablir. Fermer la cloche avec le module ferait du remède un privilège de
ceux qui n'en ont pas besoin.

⚠️ **Le dépôt passe par la porte commune.** L'in-app est un canal comme un autre depuis `STORY-580` :
deux lignes de fabrique et rien d'autre. Ajouter ici une route d'écriture spéciale rouvrirait ce que
cette story avait fermé.

## Critères d'acceptation

- [ ] AC-1 — Quatre faits déposent une cloche à l'organisation concernée : **échéance proche**,
      **impayé constaté**, **suspension**, **rétablissement**.
- [ ] AC-2 — Le dépôt emprunte **la même porte que tout envoi**, sans route d'écriture nouvelle et
      sans accès direct à la collection des messages in-app.
- [ ] AC-3 — ⛔ Aucune cloche ne contient de **lien à usage unique** ni de jeton. Test sur le corps
      déposé.
- [ ] AC-4 — Une organisation **suspendue** reçoit et lit ses cloches. Test explicite sur ce cas.
- [ ] AC-5 — Le préavis de suspension est déposé **avant** la suspension, et l'ordre est vérifié par
      le test, pas supposé (exigence de `STORY-280`).
- [ ] AC-6 — Le compteur de non-lus du fil d'activité intègre ces cloches sans changement de contrat
      pour les consommateurs existants.
- [ ] AC-7 — La cloche est **transactionnelle par le point d'entrée**, et un désabonnement de masse
      ne l'éteint pas.

## Notes

⚠️ **Le déclenchement.** Contrairement au lien de paiement, ces faits **ne portent aucun secret** :
ils peuvent donc légitimement passer par le bus. Mais `EVENEMENTS_DECLENCHEURS` reste **fermée** et
ne contient aucun topic `paiement.*` — l'ouvrir demanderait de justifier chaque nouveau topic devant
le discriminant d'AD-2. ⚡ **Point à trancher :** ouvrir la liste aux topics d'abonnement, qui ne
portent que des faits, ou passer par le même appel direct que `STORY-608`. Recommandation : **appel
direct**, pour garder une seule règle à défendre en revue.

⚠️ Le destinataire est un **utilisateur**, pas un contact — l'in-app est le seul canal dans ce cas
(`destinataire.ts`). Choisir *qui* dans l'organisation reçoit l'alerte est une question de règle, pas
de canal : par défaut, tous les membres habilités à voir la facturation.
