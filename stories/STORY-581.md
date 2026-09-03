# STORY-581 : État lu / non lu, compteur et fil d'activité — le hook inerte de STORY-304 cesse de l'être

Status: ready-for-dev

**Épic :** EPIC-057 — Le canal in-app 🏁
**Service :** `notification-service`
**Points :** 2 · **Sprint :** S42
**Prérequis :** **STORY-580** (adaptateur in-app)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-12.

---

## Le fait

⚡ **Ceci débloque un hook qui dort depuis le 2026-08-20.** STORY-304 a tranché l'option (b) — fil
d'activité `GET /activite` réservé à l'admin, plus un compteur de non-lus — en notant explicitement
que « la notification poussée viendra quand le service existera ». Le service existe à partir d'ici.

## Critères d'acceptation

- [ ] AC-1 — L'état lu / non lu est **écrit par ce service**, et il fait passer l'`Envoi` de
      `delivre` à `lu` avec `niveauCertitude = confirmé`.
- [ ] AC-2 — Compteur de non-lus par utilisateur, et fil d'activité paginé.
- [ ] AC-3 — ⚠️ **Le désabonnement de masse ne s'applique pas à l'in-app** : ce sont des alertes
      applicatives, de nature transactionnelle (AD-12). Un test le prouve — un utilisateur désabonné
      d'une nature `MASSE` continue de recevoir sa cloche.
- [ ] AC-4 — ⚠️ **Ne jamais rendre un `userId` brut** : la console ne sait pas le résoudre (leçon
      STORY-294). Le fil rend un libellé résolu depuis le read-model d'identité.

## Notes

🏁 Clôt EPIC-057.
