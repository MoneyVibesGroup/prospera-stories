# STORY-520 : La réassurance se modélise à la cession — pas en correction finale

Status: ready-for-dev

**Épic :** EPIC-132 — Réassurance
**Service :** `assurance-service`
**Points :** 13 · **Sprint :** S20
**Origine :** découpage `epics-assurance-2026-08-27.md`, **AD-4** de la spine.

---

## Le fait

La réassurance est **omniprésente** dans le plan CIMA, et l'artefact packagé le montre à moitié :

- `CA2` existe à l'actif — *« Part des cessionnaires et rétrocessionnaires dans les provisions
  techniques »* ;
- `RP3` existe en produit — *« Commissions et participations reçues des réassureurs »* ;
- ⛔ **et il n'y a RIEN au compte de résultat pour les primes cédées ni pour la part des réassureurs
  dans les sinistres.**

⇒ Le résultat technique actuel est un **résultat brut de réassurance**, présenté sans le dire. Pour
un assureur qui cède 40 % de son portefeuille, l'écart n'est pas une nuance : c'est presque la
moitié du compte.

⚡ **AD-4 est une décision d'ordre, pas de contenu :** la réassurance traverse primes, sinistres,
provisions et commissions. La modéliser **à la cession** — c'est-à-dire au moment où l'affaire est
cédée — coûte une story ; l'ajouter après en correction oblige à reprendre les quatre.

## Critères d'acceptation

- [ ] AC-1 — Un **traité** de réassurance : type (quote-part, excédent de plein, excédent de
      sinistre), taux ou plein de conservation, commissions, période, réassureurs et leurs parts.
- [ ] AC-2 — Les **primes cédées** sont dérivées des quittances selon le traité, et entrent au
      compte de résultat comme **charge de cession** — nouveau poste, nouvelle version du paquet.
- [ ] AC-3 — La **part des réassureurs dans les sinistres** est dérivée des sinistres selon le
      traité, et entre en **atténuation** — nouveau poste également.
- [ ] AC-4 — ⛔ **Aucune compensation.** Brut et cédé sont publiés séparément partout : au bilan
      (`CP3` brut / `CA2` part des cessionnaires), au compte de résultat, et dans chaque provision
      (STORY-517 AC-5). Une présentation nette est une **présentation**, jamais un stockage.
- [ ] AC-5 — `RT` intègre les postes de cession (STORY-518), et un test compare le résultat
      **brut** et **net de réassurance** : les deux doivent différer sur un jeu avec traité, et être
      **égaux** sur un jeu sans traité.
- [ ] AC-6 — La **rétrocession** est nommée et **exclue** du périmètre, plutôt que passée sous
      silence : le plan la mentionne (`CA2`), le module ne la traite pas dans cette story.

## Notes

- Voir [[STORY-513]], [[STORY-515]], [[STORY-517]], [[STORY-518]], spine AD-4.
