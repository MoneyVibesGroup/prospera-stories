# STORY-689 : Un dépôt transmis enregistre le paquet actif, pas la version qui a produit le fichier

Status: ready-for-dev

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service` (agrégat `depots`, STORY-538)
**Points :** 2 · **Complexité :** low · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** revue de code de STORY-680 (2026-10-01).

---

## Le fait

`depots.service.ts` (`transmettre`) relève la référence du paquet **actif** au moment de la transmission.
Depuis STORY-680, deux versions coexistent (`v1.0` archivée, `v1.1` active) : un livrable produit en v1.0 puis
transmis après le déploiement serait enregistré « 1.1 ». Le fichier porte pourtant sa version
(`PROSPERA format version …`).

## Critères d'acceptation

- [ ] AC-1 — La version enregistrée est celle inscrite dans le fichier transmis ; une version absente ou
      inconnue du manifeste ⇒ refus nommé.
- [ ] AC-2 — Les dépôts existants ne sont pas réécrits.

## Notes

- Voir [[STORY-538]], [[STORY-680]], [[STORY-682]].

## Progress Tracking

**Statut : `ready-for-dev` (2026-10-01).** Créée par la revue de STORY-680.
