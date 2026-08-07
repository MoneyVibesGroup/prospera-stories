# TICKET-BACKEND — le **tag de référentiel** exigé à la soumission n'est exposé par aucune route

**Cible :** `balance-service` (:3007)
**Ouvert par :** **FE-056** (barry thierno alhassane, 2026-08-07) — constat d'**intégration**, pas de maquette
**Priorité :** Should — le front s'en sort avec un sélecteur, mais au prix exact de ce que FE-056 vient de retirer
**État :** ⛔ ouvert

---

## Le constat

`POST /balances` exige un **tag** :

```ts
// balance/types/balance-canonique.ts
export const REFERENTIELS_BALANCE = ['SN', 'SMT', 'SFD-BCEAO'] as const;
// submit-balance.dto.ts
@ApiProperty({ enum: REFERENTIELS_BALANCE, example: 'SN' })
referentiel!: ReferentielBalance;
```

Or **aucune route ne dit au client quel tag correspond à son organisation** :

| Route | Ce qu'elle rend | Exploitable pour le tag ? |
|---|---|---|
| `POST /balances/suggest-comptes` | `referentiel { code: 'syscohada-revise', version: '2.1' }` | ❌ c'est le **code de paquet**, pas le tag |
| `GET /referentiels/actifs` | `referentiel` **non typé** dans l'OpenAPI (`Record<string, never>`) | ❌ inexploitable — écart déjà relevé par FE-024 |

Le pont `PONT_TAG` (`referentiel-registry.ts`) traduit **tag → code**. Il n'a **pas de réciproque
exposée**, et le client n'a donc aucun moyen honnête de remplir un champ que le contrat rend
obligatoire.

## Pourquoi ça compte précisément ici

FE-056 vient de **supprimer** du navigateur la table qui associait un référentiel à des comptes. Faire
déduire au client que `syscohada-revise` ⇒ `SN` **recréerait une table du même genre** — plus petite,
mais de même nature : une connaissance de paramétrage codée côté client, qui se périmera le jour où un
référentiel sera ajouté (voir le ticket CIMA, `TICKET-BACKEND-referentiels-attribuables-mais-non-servis.md`).

**C'est pourquoi FE-056 a gardé un sélecteur de tag** plutôt que de deviner. Il ne pilote plus aucune
proposition — l'écran affiche à côté le référentiel **réellement appliqué**, celui de l'enveloppe — mais
il reste une **question posée à l'utilisateur à laquelle le serveur connaît déjà la réponse**.

⚠️ Conséquence concrète : rien n'empêche aujourd'hui un comptable d'une IMF de soumettre sa balance
avec le tag `SN`. Le serveur l'accepte — le tag est validé par `@IsIn`, pas confronté à l'entitlement de
l'organisation.

## Résolution attendue (au choix, à trancher côté backend)

1. **Exposer le tag** là où le client le lit déjà — dans l'enveloppe de `suggest-comptes` et/ou dans
   `GET /referentiels/actifs`, correctement **typé** dans l'OpenAPI (l'écart `Record<string, never>` de
   FE-024 est à corriger dans les deux cas) ; **ou**
2. **Le déduire côté serveur à la soumission** : `referentiel` devient optionnel et, absent, est résolu
   depuis l'entitlement de l'organisation — ce qui supprime la question au lieu d'y répondre ; **ou**
3. **Refuser un tag incohérent** avec l'entitlement (422 nommant le tag attendu) — le minimum si le
   champ reste à la charge du client.

L'option 2 est la plus proche de l'esprit de STORY-139 : *le référentiel appartient au serveur*.

## Traces

- `frontend-stories/FE-056.md` § « Deux constats d'intégration »
- `src/features/atelier/api/types.ts` — le commentaire de `ReferentielCode` porte le même constat au
  point exact où un développeur serait tenté d'écrire la table
