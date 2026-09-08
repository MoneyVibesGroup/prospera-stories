# STORY-632 : Le journal à deux acteurs — un acte délégué se lit chez le client, et il nomme Money Vibes

Status: ready-for-dev

**Épic :** EPIC-025 — Fondation RBAC (catalogue de permissions, rôles, portée)
**Service :** `paiement-service` + `notification-service` (+ patron repris par tout service recevant un contrôleur d'administration)
**Points :** 5 · **Sprint :** ⚠️ **NON SLOTTÉE** — le S32 proposé le 2026-09-05 a été **clôturé** (27/27) avant l’intégration de cette fiche. Elle se tire avec STORY-631, qu’elle conditionne. ⚠️ **RENUMÉROTÉE le 2026-09-08** (ex-STORY-600) : la branche locale `r1-rbac-tenant` n’était pas poussée, et le cadrage PI-SPI du 2026-09-05 a repris 599 et 600 en ne balayant que les branches distantes. Le tracker de `main` demandait cette renumérotation.
**Prérequis :** **STORY-631** (les contrôleurs d'administration)
**Origine :** arbitrage PO du 2026-09-04, Q2 : *« le client doit le voir dans son journal, c'est important pour la traçabilité »*.

---

## Le fait

STORY-631 ouvre la délégation. **Sans cette story-ci, elle est inacceptable** — et le défaut ne
serait pas l'absence de trace, mais une trace **qui se lit de travers**.

Un journal qui écrit *« passerelle e-mail modifiée le 4 septembre à 14 h 12 »* dans le journal du
cabinet Diallo est **exact et trompeur** : le cabinet lira que c'est lui. Il cherchera qui, chez lui,
a touché à sa configuration. Il ne le trouvera pas.

⚡ **C'est la même famille de défaut que « la phrase juste et vide »** déjà payée deux fois dans ce
programme (FE-050, STORY-556) : rien n'est faux, et l'information n'y est pas.

⛔ **Et une piste d'audit qui se lit de travers ne vaut rien en litige** — c'est-à-dire exactement
le jour où elle sert.

## Critères d'acceptation

- [ ] AC-1 — Toute entrée produite par un acte délégué porte **DEUX acteurs**, distinctement :
      l'**organisation pour laquelle** l'acte a été fait, et l'**opérateur plateforme qui l'a fait**
      (identité + rôle plateforme). ⛔ Un seul champ « auteur » ne suffit pas : c'est précisément le
      champ que le lecteur interprétera comme « quelqu'un de chez moi ».
- [ ] AC-2 — ⛔ **Le VERBE diffère.** Un acte délégué ne se journalise pas avec le même libellé qu'un
      acte du client. *« Passerelle e-mail modifiée **par Money Vibes (support)** »*, pas
      *« Passerelle e-mail modifiée »*. Un test compare les deux chemins et **échoue s'ils
      produisent la même entrée**.
- [ ] AC-3 — L'entrée est écrite dans le journal de **l'organisation cible**, lisible par elle
      **sans aucune permission supplémentaire**. ⚡ Une trace que le client ne peut pas lire ne
      remplit pas l'arbitrage : elle protège Money Vibes, pas le client.
- [ ] AC-4 — ⛔ **L'entrée est écrite dans la MÊME transaction que l'acte**, pas après. Sinon il
      existe un état — court, réel, et exactement celui qu'on cherchera après coup — où l'acte a eu
      lieu et la trace n'existe pas. `paiement-service` a déjà le mécanisme : l'outbox
      transactionnelle et le journal chaîné de **STORY-240**. Le reprendre, ne pas en écrire un second.
- [ ] AC-5 — L'entrée porte **les permissions effectives de l'opérateur au moment de l'acte**, pas
      son nom de rôle. ⚡ Avec le socle + surcharge de STORY-166/167, **un même nom de rôle ne donne
      pas les mêmes droits d'une organisation à l'autre** : journaliser « support » ne dirait pas ce
      que la personne pouvait faire, et rendrait la piste invérifiable rétroactivement.
- [ ] AC-6 — ⚠️ **Rien n'est masqué au client, y compris l'identité de l'opérateur.** Si l'on juge
      qu'un nom de salarié Money Vibes ne doit pas apparaître, alors c'est l'arbitrage Q2 qu'il faut
      rouvrir — pas la trace qu'il faut affaiblir. **À trancher avant le développement, pas pendant.**
- [ ] AC-7 — **Non-régression** : un acte fait par le client lui-même produit **exactement** l'entrée
      qu'il produisait avant. Un e2e sur un acte non délégué en est le témoin — sinon on aura
      renuméroté tout le journal existant pour servir un cas minoritaire.

## Ce qui sera facile à rater

1. ⛔ **Écrire la trace côté console.** Elle vivrait dans `admin-panel`, donc chez Money Vibes, donc
      **invisible du client** — ce qui rate l'objet de la story tout en donnant l'impression de
      l'avoir traitée.
2. ⚠️ **La notification.** Tracer n'est pas prévenir. Faut-il **notifier** le client qu'un opérateur
      est intervenu ? `notification-service` saurait le faire. **Question ouverte, à trancher au
      sprint-planning** — pas à décider en écrivant l'écran.
3. ⚠️ **Le patron doit être réutilisable.** Trois services au moins recevront des contrôleurs
      d'administration. Écrire la trace deux fois, c'est garantir qu'elles divergeront.

## Notes

- Voir [[STORY-631]], [[STORY-240]] (journal chaîné + outbox), [[STORY-166]], [[STORY-167]],
  [[AP-24]] (la console lit déjà un journal d'audit), [[AP-13]].
