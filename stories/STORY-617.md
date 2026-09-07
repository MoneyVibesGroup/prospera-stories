# STORY-617 : La marque de l'organisation sur les modèles système

Status: todo

**Épic :** EPIC-055 — Modèles, rendu et formes par canal
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S35
**Prérequis :** **STORY-611** (les sept modèles système)
**Origine :** revue d'architecture du 2026-09-06 · rail B, bloc B2 · FR-N24, AD-8.

---

## Le récit

En tant qu'**organisation cliente**, je veux que les messages de compte portent mon nom, mon logo
et mes couleurs, afin que mes utilisateurs ne reçoivent pas un message de Prospera.

## Le fait

⚡ **Une organisation habille, elle ne supprime pas.** Un client qui pourrait retirer le message de
réinitialisation fermerait à ses propres utilisateurs le seul chemin de récupération d'un compte.
La surcharge porte sur la **marque et le libellé**, jamais sur l'existence — et c'est ce qui permet
de la confier au client sans réserve.

⚠️ **La marque est une donnée d'ORGANISATION, pas de modèle.** La ranger dans le modèle la ferait
recopier dix-huit fois — une par texte du socle — et diverger à la première correction. Une
organisation change de logo une fois ; elle ne relit pas dix-huit gabarits.

⛔ **Aucune URL arbitraire n'entre dans un message sortant.** Une adresse déposée par un client
dans un e-mail signé de notre relais est trois choses à la fois : un traqueur qui apprend au client
l'ouverture d'un message que le destinataire croyait privé, un mouchard d'adresse IP, et — sur un
lien qui change après coup — une image que nous n'avons jamais vue partant sous notre réputation.
Le logo entre donc par une **référence**, et c'est le service qui compose l'adresse.

## Critères d'acceptation

- [ ] AC-1 — Nom affiché, logo, couleur d'accent et pied de page, portés **une fois** par
      organisation.
- [ ] AC-2 — Un modèle système sans surcharge rend la marque **Prospera**, et le dit.
- [ ] AC-3 — ⛔ Aucune surcharge ne peut retirer un modèle système ni vider son appel à l'action.
- [ ] AC-4 — Le logo est servi depuis un emplacement contrôlé ; aucune URL arbitraire n'entre dans
      un message sortant.

## Notes

⚠️ **Cette story n'ouvre pas le HTML.** La mise en page est STORY-618 ; ici, la marque entre dans le
texte par deux variables réservées et par ce que le figement en dit à son appelant.
