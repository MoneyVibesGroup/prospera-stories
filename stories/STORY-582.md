# STORY-582 : Consentement enregistré par personne, canal et nature — jamais déduit d'une absence de refus

Status: done

**Épic :** EPIC-059 — Consentement, désabonnement et droits des personnes
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S42
**Prérequis :** **STORY-571** (base protégée) · **STORY-573** (carnet)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-14, AD-1.

---

## Le fait

⛔ **Le consentement ne se déduit jamais de l'absence de refus.** Il est enregistré, daté et **sourcé**
(FR-N46).

⚡ **Deux défauts symétriques, et ils coûtent autant l'un que l'autre** : une promotion envoyée à qui
l'a refusée, et une mise en demeure bloquée par un désabonnement marketing.

## Critères d'acceptation

- [x] AC-1 — `Consentement` porte `(identifiantCanal, canal, nature)`, une date et une **source**.
      Vit dans `notification_service_preuves` (STORY-571).
- [x] AC-2 — ⚡ **Append-only** : un revirement est **une entrée de plus**, jamais un `update`.
      L'état courant est la **projection de la dernière entrée** par `(identifiantCanal, canal,
      nature)`. Test de mutation contre la vraie base.
- [x] AC-3 — ⚡ **Le refus suit la personne, pas le module** : le contact étant unique dans
      l'organisation (AD-11), un refus vaut pour **tous** ses modules (FR-N49).
- [x] AC-4 — ⛔ **Il n'éteint pas les messages transactionnels** (FR-N50, AD-1). Le régime naît du
      point d'entrée, jamais d'un paramètre. Un test envoie une mise en demeure à une personne
      désabonnée de la nature `MASSE` et vérifie qu'elle **part**.
- [x] AC-5 — Un envoi vers un destinataire refusé rend `DESTINATAIRE_DESABONNE`, code nommé et stable.

## Notes

- Le cloisonnement s'applique : le consentement d'une personne dans l'organisation A est invisible et
  sans effet dans l'organisation B (NFR-5).

---

## Journal de livraison — 2026-09-05

Livrée sur `MNV-582` (`prospera-notification-service`), branchée sur `dev`.
`npm test` : 1 582 verts · `npm run test:e2e` : 109 verts · lint et types propres.

### Ce que la story a réellement tranché

⚡ **La lecture rend TROIS états, pas deux.** `INCONNU` n'est ni `ACCORDE` ni
`REFUSE`. C'est la seule pièce qui empêche « elle n'a jamais refusé » de devenir
« elle a consenti » : un booléen absent vaut `false`, et `false` se lit « on peut
envoyer ». Le service reste en régime d'**opposition** — seul un refus enregistré
ferme la porte — mais le jour où FR-N47 exigera la preuve du consentement pour une
campagne, le registre répondra `INCONNU` au lieu de mentir.

⚡ **AC-4 tient à la CLÉ, pas à un contrôle.** Le registre est keyé par **nature de
message** (AD-14) et non par portée : un refus de masse est écrit sur la nature
`MASSE`, une mise en demeure lit la nature `TRANSACTIONNEL` et **ne peut pas le
trouver**. Ce n'est pas une règle qu'on applique, c'est un état hors d'atteinte.
La portée reste le vocabulaire de l'**acte** (« vos promotions » / « plus rien du
tout »), traduite une seule fois à l'écriture — un acte `GLOBAL` écrit les deux
natures, **dans une seule transaction**, parce qu'un acte à moitié posé laisserait
joignable par mise en demeure quelqu'un qui a demandé le silence complet.

⚡ **AC-3 tient à l'ABSENCE d'un champ.** La clé ne porte aucun `moduleAppelant` :
le refus suit la personne parce que rien n'a jamais su distinguer les modules
(FR-N49, AD-11). Une garde de schéma refuse ce quatrième champ.

⚠️ **Le tri de la projection porte DEUX champs.** `enregistreLe` vient de la
source : un revirement immédiat ou un import qui date toutes ses lignes du même
instant la partagent, et « la dernière entrée » serait alors indéterminée — le
service répondrait tantôt `ACCORDE`, tantôt `REFUSE`, sur la même donnée. L'`_id`
tranche.

⛔ **Un faux de test qui ignore `sort()` rend une projection append-only
INTESTABLE.** Le faux employé ailleurs dans ce service traite `sort()` comme un
maillon neutre et rend le **premier** document trouvé : il aurait fait passer au
vert une projection lisant la première entrée, c'est-à-dire bloquant à vie
quelqu'un qui est revenu. Le faux de cette story trie vraiment.

### Ce qui a bougé ailleurs

- Le schéma `Desabonnement` de STORY-579 **déclarait la forme que sa lecture
  exigeait** en attendant EPIC-059, et n'a jamais reçu un document. Il cède la
  place à `Consentement` — le nom du noyau (`vocabulaire.ts`), et la seule des deux
  entités qui puisse porter un **accord** et pas seulement un refus.
- `DESTINATAIRE_BLOQUE` devient `DESTINATAIRE_DESABONNE` (AC-5). Un blocage se
  subit et se corrige de notre côté ; un désabonnement se **décide** et ne se
  corrige pas. L'appelant doit savoir lequel des deux il tient, sans quoi un module
  de relance réessaie contre une volonté.
- L'exemption in-app d'AD-12, dérivée par STORY-581 sur les portées, est
  **transposée sur les natures** sans rien perdre : la cloche interroge toujours le
  registre transactionnel, donc un désabonnement de masse ne l'atteint pas — et un
  acte `GLOBAL` enregistré sur elle l'atteint toujours. L'exemption reste dérivée
  de `natureDuDestinataire`, jamais d'une liste de canaux.

### Points ouverts

- ⛔ **`test/consentements.conformite-spec.ts` est écrit et n'a PAS été exécuté** :
  il exige `mongo-notification`, et Docker était éteint. `npm run test:conformite`
  après `docker compose up -d mongo-notification`. C'est la preuve de mutation
  d'AC-2 contre le serveur ; tant qu'elle n'a pas tourné, l'append-only n'est
  éprouvé que contre un faux.
- ⚠️ **La collection `desabonnements` reste provisionnée et n'est plus écrite.**
  C'est à STORY-583 de dire si l'**acte** de désabonnement — jeton, horodatage,
  canal d'origine — y trouve son journal, ou si elle sort du provisionnement.
- ⚠️ **`notification.desabonnement.enregistre` n'est toujours pas publié.**
  L'inventaire des publieurs ne bouge pas ici : l'événement appartient à la surface
  qui enregistre l'acte (STORY-583), et FR-N48 en a besoin pour éteindre un envoi
  de masse déjà en cours (EPIC-061).
- ⚠️ **Aucune surface HTTP n'écrit un consentement.** Le registre est un service ;
  ouvrir ici une route « pour pouvoir tester » aurait créé la seule surface capable
  d'enregistrer un refus **au nom** de quelqu'un, sans qu'aucun droit ne la garde.
