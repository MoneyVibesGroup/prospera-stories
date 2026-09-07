# STORY-618 : Une mise en page HTML livrée avec le code, et son repli texte

Status: todo

**Épic :** EPIC-055 — Modèles, rendu et formes par canal
**Service :** `notification-service`
**Points :** 5 · **Sprint :** S35
**Prérequis :** **STORY-617** (la marque de l'organisation)
**Origine :** revue d'architecture du 2026-09-06 · rail B, bloc B2 · AD-8.

---

## Le récit

En tant que **destinataire**, je veux un message lisible sur mon téléphone, afin de ne pas recevoir
un mur de texte brut d'un logiciel qui coûte 65 millions.

## Le fait

⛔ **L'adaptateur e-mail envoie du texte brut, et rien d'autre.** C'était juste tant qu'aucune mise
en page n'existait ; ça cesse de l'être le jour où le message porte un lien de paiement et une
marque.

⚡ **Le moteur reste celui du système**, réservé aux mises en page livrées avec le code (AD-8).
Cette story n'ouvre **pas** le moteur des modèles de base à du HTML : ce serait une seconde story,
et une surface d'injection.

⚠️ **Le repli texte n'est pas optionnel.** Une partie des destinataires lit en texte, et un message
sans partie texte tombe en indésirable.

## Critères d'acceptation

- [ ] AC-1 — Une mise en page unique, livrée avec le code, alimentée par la marque de STORY-617.
- [ ] AC-2 — Chaque message porte **les deux parties**, HTML et texte, issues du même contenu.
- [ ] AC-3 — ⛔ Le contenu substitué est **échappé** ; un test l'éprouve avec une variable hostile.
- [ ] AC-4 — Rendu vérifié sur un client mobile étroit, largeur 320 points.

## Notes

⚠️ **La mise en page est une fonction PURE du domaine.** Elle ne lit ni base, ni configuration, ni
horloge : ce qui entre est un texte déjà rendu et une marque déjà résolue.
