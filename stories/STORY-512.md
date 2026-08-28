# STORY-512 : Le plan CIMA packagé s'arrête à 2 chiffres — la question du niveau de détail n'a jamais été posée

Status: ready-for-dev

**Épic :** EPIC-128 — Socle vertical CIMA
**Service :** `assurance-service` + `bilan-service` / `balance-service` (référentiel)
**Points :** 8 · **Sprint :** S20
**Origine :** revue de l'artefact, 2026-08-27 — **AD-11** de la spine.

---

## Le fait

`cima-assurances@1.0` porte **80 comptes, tous à 2 chiffres** : c'est la liste de l'article 431,
verbatim, et c'est exactement ce que l'amorce annonçait. Le rattachement résolvant par **plus long
préfixe**, tout fonctionne : un compte `3012` d'un assureur tombe sur la racine `30`.

⚠️ **Et c'est le problème.** Tout marche, rien ne refuse — et **la liasse n'a aucun détail** : les
25 postes agrègent 80 racines, là où SYSCOHADA en a 163 pour 174 comptes et le SFD 31 pour 372.
Un assureur réel tient des comptes à 4, 5 ou 6 chiffres ; ils se rattacheront tous, sans qu'aucune
erreur ne soit possible **ni détectable**.

⚡ **Le SFD a payé cette question deux fois** — STORY-172 (les comptes de paramétrage échappaient au
niveau de détail) puis STORY-368 (l'artefact était **tronqué à 156 comptes sur 372**, et personne ne
le voyait). **CIMA ne l'a jamais posée.**

## Critères d'acceptation

- [ ] AC-1 — Un `longueurCompteDetail` est **déclaré** pour `cima-assurances`, comme il l'est pour
      les autres référentiels — et il est **sourcé**, pas choisi.
- [ ] AC-2 — Le comportement sur un compte plus long que la profondeur du plan est **testé et
      documenté** : accepté par rattachement de préfixe, ou refusé. ⛔ Le laisser implicite reproduit
      exactement l'angle mort de STORY-172.
- [ ] AC-3 — ⚠️ **Vérifier que les 80 comptes sont bien la liste complète de l'article 431**, en
      recoupant contre la source officielle — pas contre l'artefact. C'est précisément le contrôle
      qui a révélé la troncature du SFD.
- [ ] AC-4 — La byte-identité de l'artefact entre `balance-service` et `bilan-service` est **gardée**
      (règle AD-6/STORY-368), et la garde **prouve qu'elle détecte** (test de mutation).
- [ ] AC-5 — Si le plan doit être enrichi au-delà de l'article 431, l'enrichissement est **une story
      séparée avec son sourcing** : on ne complète pas un plan comptable par analogie.

## Notes

- Voir [[STORY-172]], [[STORY-368]], [[STORY-488]], spine AD-11.
