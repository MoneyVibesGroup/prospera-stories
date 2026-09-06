# STORY-605 : Repli de plateforme nommé, et ce que le repli change pour le destinataire

Status: todo

**Épic :** EPIC-054 — Permissions au catalogue et cloisonnement des passerelles
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S34
**Prérequis :** **STORY-604** (résolution de la passerelle à la remise)
**Origine :** revue d'architecture du 2026-09-06 · FR-N54, AD-6.

---

## Le récit

En tant qu'**exploitant de la plateforme**, je veux que « aucune passerelle configurée » et
« passerelle en panne » se distinguent, afin qu'un client dont la clé a expiré ne se mette pas à
envoyer sous la marque de Prospera sans le savoir.

## Le fait

⚡ **Deux causes qui ne se soignent pas pareil ne peuvent pas porter le même code.** C'est la leçon
de `STORY-603`, appliquée ici. *Pas de configuration* se soigne en configurant, et le repli sur le
relais de plateforme est alors un service rendu. *Configuration refusée par la passerelle* se soigne
en renouvelant une clé — et s'y replier en silence ferait partir, sous la marque de Money Vibes, les
messages d'une organisation qui croit envoyer sous la sienne.

⛔ **Un repli silencieux sur le chemin d'une identité d'envoi est une usurpation involontaire.**
Money Vibes se retrouverait à signer les relances de recouvrement d'une microfinance, avec sa
réputation d'expéditeur et son domaine.

⚡ **Le repli est un FAIT écrit, pas une déduction.** Le journal de l'envoi doit dire quelle identité
a servi. Sans cela, la seule façon de savoir sous quelle marque un message est parti serait de
relire la configuration **d'aujourd'hui** — c'est-à-dire de réécrire l'histoire à chaque changement.

## Critères d'acceptation

- [ ] AC-1 — **Absence de configuration** pour `(orgId, canal)` : la remise se fait par le relais de
      plateforme, et l'envoi porte l'identité effectivement utilisée dans son journal.
- [ ] AC-2 — ⛔ **Une passerelle configurée qui refuse l'authentification ÉCHOUE.** Elle ne se replie
      pas. Test explicite.
- [ ] AC-3 — Les deux situations portent **deux codes de refus distincts**, jamais fusionnés :
      l'un dit *rien n'est configuré*, l'autre dit *ce qui est configuré ne répond pas*.
- [ ] AC-4 — Aucun de ces deux codes ne transporte le secret ni le texte de la passerelle
      (rappel `STORY-577`) : le **code**, jamais le message du relais.
- [ ] AC-5 — La console de l'exploitant distingue les organisations qui **envoient sous la marque
      Prospera** de celles qui ont leur propre passerelle. C'est une lecture, aucune route
      d'écriture n'est ajoutée (borne de `STORY-597`).
- [ ] AC-6 — Le repli est **désactivable par organisation** : une organisation peut exiger que ses
      messages ne partent **jamais** sous une autre identité que la sienne, quitte à ne pas partir.

## Notes

⚠️ **Point à trancher par le PO :** le défaut. Repli actif pour tout le monde, ou repli à demander ?
La story livre les deux comportements ; c'est la valeur par défaut qui est une décision commerciale.
Recommandation : **repli actif** tant que la verticale cabinet est en SaaS pur, où Prospera **est**
l'expéditeur légitime.

⚠️ Cette story ne crée aucun canal et ne touche à aucun adaptateur : elle vit entre la résolution de
`STORY-604` et le journal.
