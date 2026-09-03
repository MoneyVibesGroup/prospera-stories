# STORY-577 : Port de canal et adaptateur e-mail — aucun canal n'est un prérequis de démarrage

Status: ready-for-dev

**Épic :** EPIC-056 — Le premier message part : port de canal, e-mail, journal et accusés
**Service :** `notification-service` (nouveau)
**Points :** 5 · **Sprint :** S41
**Prérequis :** **STORY-570** (scaffold et santé à deux niveaux)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-6, AR-17.

---

## Le fait

⚡ **Les capacités sont des données, pas du code appelant** : longueur maximale et encodages, pièces
jointes, accusé de délivrance, accusé de lecture **et son niveau de certitude**, bidirectionnalité,
référence de conversation transportée ou non, exigence d'approbation de modèle, barème de tarif,
devise. Un appelant **interroge** ce qu'un canal sait faire au lieu de le supposer — c'est ce qui
permettra d'ajouter SMS et WhatsApp (EPIC-063, reporté) **sans toucher au noyau**.

⚡ **Cette story est livrable sans aucun contrat externe**, et c'est ce qui fait du bloc 1 le bon
découpage à tirer : `nodemailer@6.9.16` est **déjà au dépôt** — exactement la dépendance que ce
service **reprend** à `auth-service` en soldant la dette — et **Mailhog est déjà au `docker-compose`
racine**.

## Critères d'acceptation

- [ ] AC-1 — Un **seul port `ChannelProvider`**. Aucun nom de passerelle n'apparaît dans un type du
      domaine.
- [ ] AC-2 — Chaque adaptateur **déclare ses capacités en données**, et FR-N20 les publie. Un test
      lit les capacités du canal e-mail et vérifie qu'elles annoncent l'accusé de lecture comme
      **indisponible** — SMTP n'en rend pas.
- [ ] AC-3 — Adaptateur e-mail sur `nodemailer`, prouvé de bout en bout **contre Mailhog** en Docker :
      un message part, il est reçu, son objet et son corps sont ceux du modèle rendu.
- [ ] AC-4 — ⛔ **Aucun `si production` dans le code** : le passage du bac à sable à la production est
      une **configuration**. Test de présence.
- [ ] AC-5 — ⚡ **L'absence d'une passerelle dégrade le canal, jamais le service** (AD-6, AR-17). Le
      service **démarre** sans configuration SMTP valide, l'état de santé dit « canal e-mail
      indisponible », et une demande d'envoi sur ce canal rend `CANAL_INDISPONIBLE`.
- [ ] AC-6 — Le registre des capacités est interrogeable **avant** de choisir un canal, pour que le
      coût et le nombre de segments (STORY-574) soient annonçables à l'appelant.

## Notes

- Le canal in-app est un adaptateur comme les autres et **appartient à EPIC-057**, hors bloc 1. Il
  est le seul dont la certitude de lecture est `confirmé` par construction : son accusé n'est pas
  reçu d'un tiers, il est écrit par le service lui-même.
