# STORY-293 : console — le pack **Finance** attribue `sfd-bceao@1.3`, une version que **personne ne sert**

**Epic :** EPIC-025 — RBAC plateforme & console
**Réf. architecture :** **AP-06** (assistant de provisioning, packs verticaux) · **STORY-149** (dépôt de paquet référentiel) · **STORY-078** (registre `balance-service`) · **STORY-120/122** (paquets `bilan-service`)
**Priorité :** Should Have
**Story Points :** 2
**Complexité :** low — mais **elle porte un arbitrage**, pas seulement une valeur
**Statut :** ready-for-dev
**Assigné à :** —
**Créée le :** 2026-08-07
**Sprint :** 20
**Service :** `frontend-admin-panel` (console) — ⚠️ **cible frontend**, tracée ici parce que l'arbitrage est backend
**Branche :** `MNV-293`
**Origine :** `tickets/TICKET-BACKEND-referentiels-attribuables-mais-non-servis.md` ③ — ouvert par la maquette **FE-056**

---

## Le défaut

```ts
// frontend-admin-panel/src/features/provisioning/config/vertical-packs.ts:76
Finance: { …, referentiel: { code: "sfd-bceao", version: "1.3" }, … }
```

**`sfd-bceao@1.3` n'existe nulle part** :

| Où | Ce qui y est |
|---|---|
| `balance-service` (manifeste) | `sfd-bceao@2.0` |
| `bilan-service` (assets) | `sfd-bceao-1.0.json`, `sfd-bceao-2.0.json` |
| `platform-catalog-service` | **aucune version en dur** — les paquets sont **déposés à l'exécution** (STORY-149) |
| `referentiel-version.schema.ts:10` | `sfd-bceao@1.3` … **en exemple de documentation** |

Tout indique que la valeur a été reprise de l'**exemple du schéma** plutôt que d'un paquet réel.

## Ce que ça produit — et ce que ça ne produit pas

⚠️ **Le garde-fou de `plan.ts` a fonctionné.** L'assistant ne fait pas confiance au pack : il le
**confronte au catalogue réel** et bloque la ligne avec `reason: "referentiel-missing"` quand la version
n'y est pas. **Il n'y a donc pas de panne en production** — et c'est pour ça que cette story est
*Should*, pas *Must*.

Restent deux issues, dont aucune n'est acceptable durablement :

1. le catalogue ne publie pas `1.3` ⇒ **le vertical Finance n'est pas provisionnable du tout**, et
   l'écran l'annonce comme une offre ;
2. un opérateur dépose `1.3` pour débloquer l'assistant ⇒ l'organisation reçoit un code que
   `balance-service` **ne sait pas charger** ⇒ `500 REFERENTIEL_UNAVAILABLE` à la première balance.
   La console aurait alors *provisionné* une organisation *cassée*.

## L'arbitrage à rendre — et c'est le vrai objet de la story

**Quelle version de SFD fait foi pour un octroi ?** Trois réponses défendables :

- **`2.0`** — ce que servent `balance-service` et `bilan-service` aujourd'hui. Réponse la plus simple, et
  probablement la bonne.
- **`1.0`** — l'artefact plus ancien encore présent côté `bilan-service`. À écarter sauf raison métier.
- **« pas de version en dur »** — le pack ne fige plus qu'un **code**, et l'assistant retient la
  **dernière version publiée et utilisable** du catalogue. C'est la réponse structurelle : elle supprime
  la classe entière de défaut au lieu de corriger une occurrence. Elle demande de trancher ce qu'est
  « la dernière utilisable » (statut `PUBLISHED`, pas `RETIRED`) et de l'afficher à l'écran, puisque
  l'opérateur doit savoir ce qu'il attribue.

⚠️ **Une version épinglée n'est pas un défaut en soi** — épingler protège d'un changement de plan
subi. Le défaut, c'est d'épingler une version **qui n'existe pas**. La story doit donc dire laquelle des
deux logiques le produit veut, pas seulement remplacer `1.3` par `2.0`.

---

## Périmètre

1. Trancher l'arbitrage ci-dessus (décision consignée dans la story).
2. Appliquer la décision au pack **Finance**, et **vérifier les trois autres packs** au passage :
   `syscohada-revise@2.1` (Distribution, Expertise comptable) et `cima-assurances@1.0` (Assurance) —
   confronter chacun à ce que les services servent réellement.
3. **Empêcher la récidive** : un test qui échoue si un pack déclare un couple `code@version` absent du
   jeu de référence. Aujourd'hui, rien n'empêche d'écrire une version inventée dans ce fichier.
4. Le message de blocage de l'assistant doit **nommer la version attendue et ce qui est publié** —
   « référentiel manquant » ne dit pas à l'opérateur ce qu'il doit déposer.

### Hors périmètre

- **Publier un paquet au catalogue** — c'est un geste d'exploitation (STORY-149), pas de code.
- **`cima-assurances@1.0` côté balance** — c'est **STORY-292**.
- La logique de dépôt/immutabilité des artefacts (déjà livrée).

---

## Critères d'acceptation

1. Le pack Finance n'attribue plus une version que personne ne sert ; la décision est **écrite** dans le
   fichier, avec sa raison.
2. Les **quatre** packs sont confrontés à ce que servent les services ; tout écart restant est **nommé**
   (commentaire + gap), jamais laissé muet.
3. Un test échoue si un pack déclare un couple `code@version` hors du jeu de référence — la protection
   est **mécanique**, pas une relecture.
4. Le blocage de l'assistant nomme **la version attendue** et **ce que le catalogue publie**.
5. Provisionner une organisation Finance de bout en bout aboutit à un entitlement dont le référentiel
   **se charge** côté `balance-service` (⚠️ dépend de la version retenue — à vérifier en réel, pas sur la
   foi de la config).
6. `lint` · `typecheck` · `build` · tests verts.

## Liens

- Ticket d'origine : `tickets/TICKET-BACKEND-referentiels-attribuables-mais-non-servis.md` ③
- `GAP-version-sfd-console-vs-services` (`sprint-status.yaml` → `open_contract_gaps`)
- **STORY-292** — même famille de défaut : ce que la console attribue doit être ce que les services
  savent charger. 292 étend le service, 293 corrige l'attribution.
