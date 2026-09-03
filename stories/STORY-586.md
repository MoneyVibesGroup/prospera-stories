# STORY-586 : Deux horloges, purge tracée et agrégats anonymes à 13 mois

Status: ready-for-dev

**Épic :** EPIC-062 — Rétention, purge et fin de relation
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S42
**Prérequis :** **STORY-585** (plafonds) · **STORY-579** AC-9 (squelette et variables séparés)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-15, AD-18.

---

## Le fait

⚡ **Deux horloges, et c'est cette story qui consomme l'AC-9 de STORY-579.** Le journal détaillé vit
**13 mois** puis devient des agrégats anonymes ; les **variables** vivent **90 jours** puis sont
retirées, laissant le squelette : destinataire, `modele@version`, canal, statut, coût.

Si le schéma de STORY-579 avait mélangé les deux, cette story exigerait une **migration**.

## Critères d'acceptation

- [ ] AC-1 — À **90 jours**, les variables sont retirées de l'`Envoi`. Le squelette reste.
- [ ] AC-2 — À **13 mois**, le journal détaillé est remplacé par des **agrégats anonymes** —
      compteurs par envoi de masse, canal et période (FR-N66).
- [ ] AC-3 — ⚡ **Les accusés suivent le journal** (13 mois) et n'ont **pas d'horloge propre** : un
      accusé sans l'`Envoi` qu'il qualifie ne prouve rien et ne s'interprète plus.
- [ ] AC-4 — ⚠️ **Conséquence à dire, pas à subir** : la fenêtre de **rejeu manuel** d'un envoi échoué
      (FR-N40) est donc **bornée à 90 jours**, et STORY-598 doit l'annoncer dans la console.
- [ ] AC-5 — Chaque exécution de purge écrit son **compte rendu consultable** — volume, catégorie,
      échéance appliquée (FR-N65). *Une purge qui ne laisse pas de trace n'est pas vérifiable.*
- [ ] AC-6 — ⛔ La purge est un **travail BullMQ à clé idempotente** (AD-18). Aucun `setInterval`,
      aucune minuterie applicative. La purge s'exécute avec le **second compte de maintenance**
      (STORY-571 AC-4), pas avec le compte applicatif.
- [ ] AC-7 — La purge **préserve** la preuve de consentement et de désabonnement au-delà de la donnée
      qu'elle protège (FR-N68).

## Notes

- Le **rendu figé n'est jamais conservé** (AD-15). Cette story ne le purge pas : elle vérifie qu'il
  n'existe pas.
