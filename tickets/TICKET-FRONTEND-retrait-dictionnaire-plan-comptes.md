# TICKET frontend — retirer le dictionnaire `libellé → compte` codé en dur de FE-026

> ## ➡️ REPRIS le 2026-07-31 par la story **FE-056**
>
> Ce ticket avait été écrit côté backend parce que le dépôt frontend **n'était pas dans le workspace**
> au moment de STORY-139. Il l'est. Son contenu — résolution attendue et DoD — est intégralement
> repris dans `frontend-stories/FE-056.md`, qui est **slottée au sprint 7 frontend** et donc visible
> du sprint-planning, ce qu'un fichier de ticket n'était pas.
>
> **Source de vérité = FE-056.** Ce fichier est conservé pour la traçabilité de l'origine.
>
> *(Renommé et déplacé de `stories/TICKET-fe-026-retrait-dictionnaire-client.md` vers `tickets/`
> le 2026-07-31 — cf. la convention en tête de `tickets/`.)*

**Type :** dette de contrat (duplication de connaissance métier côté client)
**Dépôt :** `prospera-frontend-expert-comptable` (**absent du workspace `PROSPERA/`** — d'où ce ticket plutôt qu'un commit)
**Fichier :** `src/features/atelier/config/plan-comptes.ts` (annoté « INTÉRIMAIRE »)
**Débloqué par :** **STORY-139** — `POST /api/v1/balances/suggest-comptes` (`balance-service`, :3007)
**Ouvert par :** STORY-139, 2026-07-29
**Priorité :** Should — le front n'est pas cassé, il est simplement **faux hors SYSCOHADA**

---

## Le problème

FE-026 (saisie manuelle de balance) propose le compte à partir du libellé saisi via un **dictionnaire codé côté client**. Ce dictionnaire :

1. **duplique** une connaissance qui appartient aux paquets référentiels versionnés (STORY-056 SYSCOHADA, STORY-057 SFD-BCEAO) ;
2. est **mono-référentiel de fait** : il ignore que le même libellé mappe un compte différent selon le référentiel actif de l'organisation (« Charges de personnel » → `66` en SYSCOHADA révisé, `64` en SFD-BCEAO) — une organisation de microfinance reçoit donc des propositions **fausses** ;
3. ne connaît **aucune** surcharge d'organisation (`surcharges_rattachement`), alors que la règle écrite par le cabinet doit primer ;
4. ne porte **aucune traçabilité** : impossible de dire sur quelle version de plan une proposition a été faite.

Le serveur restait seul juge du compte (validateur `^[0-9A-Za-z]{3,20}$` puis contrôle contre le plan), donc rien d'invalide n'entrait en base — mais l'aide à la saisie induisait l'utilisateur en erreur.

## Ce que STORY-139 met à disposition

`POST /api/v1/balances/suggest-comptes` — gardé (`@RequiresBalanceAccess`, `TENANT_ADMIN`/`TENANT_USER`), **batch**, ordre d'entrée préservé, chaque élément ré-émettant le `libelle` soumis.

- résolution **pilotée par le référentiel actif de l'org** (aucun paramètre de référentiel à passer) ;
- **surcharge de l'organisation prioritaire** sur le plan ;
- `origine` ∈ `SURCHARGE | EXACT | APPROCHANT | AUCUN`, `score`, `motif` — de quoi afficher une proposition **forte** autrement qu'une proposition **approchée** ;
- `compte: null` quand rien ne correspond (« à préciser »), et `alternatives[]` quand plusieurs comptes se disputent le libellé sans départage possible : **c'est à l'utilisateur de trancher**, jamais au système ;
- `referentiel { code, version }` + `checksum` + `stamp` dans l'enveloppe.

Contrat complet dans le Swagger de `:3007` (`/api/docs`, tag `suggestion`).

## Resolution attendue

- [ ] Supprimer `src/features/atelier/config/plan-comptes.ts` et toutes ses importations.
- [ ] Brancher la saisie sur `POST /balances/suggest-comptes` (appel groupé sur les libellés saisis, pas un appel par ligne).
- [ ] Distinguer visuellement `EXACT`/`SURCHARGE` d'`APPROCHANT`, et rendre `AUCUN` explicite (« à préciser ») plutôt que de pré-remplir un compte.
- [ ] Rendre `alternatives[]` sous forme de choix quand il est présent.
- [ ] Integration Gate rejoué sur une organisation **SFD-BCEAO** — c'est le cas que le dictionnaire client traitait faux.

## Definition of Done

- [ ] Plus aucun mapping `libellé → compte` codé dans le dépôt frontend.
- [ ] La proposition de compte est correcte pour une organisation non-SYSCOHADA.
- [ ] Aucune proposition n'est affichée comme certaine alors qu'elle est approchée.
