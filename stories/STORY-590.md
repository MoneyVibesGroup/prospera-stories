# STORY-590 : Les trois services cessent d'envoyer — SM-1 = 0, mesuré et non affirmé

Status: ready-for-dev

**Épic :** EPIC-058 — Le service devient l'organe de parole unique 🏁
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S42
**Prérequis :** **STORY-588** (consumers) · **STORY-589** (chemin direct) ⛔ C8
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-2.

---

## Le fait

⛔ **C'est le motif d'existence du module, et son critère de sortie est un nombre.**

`auth-service`, `kyc-service` et `expert-comptable` perdent **tout** code d'envoi : plus de
`nodemailer`, plus de `.hbs` sur disque, plus de sujet en dur, plus de `MAIL_QUEUE`.

## Critères d'acceptation

- [ ] AC-1 — Les messages sortants des trois services sont **migrés** vers `notification-service`
      (FR-N27), chacun sous une clé de modèle du socle.
- [ ] AC-2 — ⚡ **`SM-1 = 0` se mesure par recherche de `nodemailer` et `createTransport` dans les
      trois services** — pas par relecture, pas par déclaration. **La mesure est l'AC, et elle tourne
      en CI.**
- [ ] AC-3 — Les gabarits `.hbs` disparaissent du disque des trois services. Leur contenu vit
      désormais comme **modèles socle** (`orgId = null`, STORY-576).
- [ ] AC-4 — Chaque message migré est **prouvé de bout en bout** contre Mailhog : le texte reçu après
      migration est celui d'avant.
- [ ] AC-5 — Aucune régression du parcours d'inscription : l'AC-4 de STORY-589 (indisponibilité sans
      échec d'inscription) est rejoué **avec les trois services réels**.

## Notes

🏁 Clôt EPIC-058 et le **bloc 2**.

⚠️ **Cette story touche trois dépôts en plus du sien.** Elle se compte en 3 points sur le périmètre
notification, mais son coût réel inclut **trois PR de retrait**. Leçon STORY-434 : une story qui
touche deux dépôts se mesure **avant** de coder.
