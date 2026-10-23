# STORY-709 : Les passerelles et les domaines d'envoi se revérifient d'eux-mêmes

Status: ready-for-dev

**Épic :** EPIC-054 — Permissions au catalogue et cloisonnement des passerelles
**Service :** `notification-service`
**Points :** 3 · **Sprint :** rail F, bloc F3
**Prérequis :** **STORY-614** (vérifier est une question), **STORY-615** (domaine attesté par le DNS)
**Origine :** rail F.

---

## Le récit

En tant qu'**organisation cliente**, je veux que mon domaine d'envoi ne se ferme pas un matin parce
que personne n'a cliqué sur « vérifier » depuis trente jours.

## Le fait

⛔ **Deux horloges, aucune main pour les remonter.**
- Un **domaine** cesse d'être vérifié trente jours après sa dernière preuve
  (`VALIDITE_VERIFICATION_JOURS`). Rien ne refait la preuve : au 31ᵉ jour, l'expéditeur de
  l'organisation se ferme et ses messages repartent sous le repli — sans que personne ne l'ait décidé.
- Une **passerelle** vérifiée le reste **pour toujours** : un compte révoqué chez le fournisseur
  continue d'être annoncé `VERIFIEE` jusqu'au premier envoi qui échoue.

## Critères d'acceptation

- [ ] AC-1 — Un travail de file planifié (patron STORY-586, clé fixe) revérifie chaque jour les
      domaines dont la dernière preuve a **plus de 20 jours** — avant l'échéance, jamais après.
- [ ] AC-2 — ⚡ Une revérification qui **trouve** la preuve repousse l'échéance ; une résolution DNS en
      **échec** n'efface pas une preuve antérieure (règle de STORY-615) ; une preuve **absente** laisse
      l'échéance courir.
- [ ] AC-3 — Le même travail revérifie les passerelles par la question de STORY-614 ; ⛔ une passerelle
      **injoignable** ne change pas d'état (`NON_VERIFIEE` sans date ne s'écrit pas sur une panne),
      une passerelle **refusée** passe `REFUSEE`.
- [ ] AC-4 — ⛔ La revérification n'envoie **aucun** message (STORY-614 : vérifier est une question,
      jamais un envoi).
- [ ] AC-5 — Une organisation en échec n'arrête pas les autres ; le compte rendu nomme les échecs.
