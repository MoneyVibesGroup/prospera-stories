# Ticket backend — `sinistres` consomme la portée réseau et passe la suite de conformité (C-1004)

**Ouvert le :** 2026-11-16 · **Par :** groupe D, STORY-1037 (EPIC-050)
**Pour :** groupe C, **STORY-1004** (les portées par volet et l'accès par dossier) · **Service :** `prospera-sinistres-service`
**Sévérité :** haute — c'est le défaut le plus coûteux du programme, et il est **silencieux** : une portée absente qui
ouvre tout ne se voit pas en test fonctionnel (spine `reseau`, AD-6).

---

## Ce qui est livré par `reseau-service` (16/11, avant le jalon du 27/11)

- **Le fait `reseau.portee.changed@1`** (STORY-1036, reseau-service#7). Contrat :
  `reseau-service/contrat/schemas/reseau.portee.changed.json`, enregistré dans Karapace sur
  `reseau.portee.changed-value` en BACKWARD. Annonce complète : journal de D, section « ⚠ Contrats ».
- **La suite de conformité** (STORY-1037, reseau-service#8) : `paquets/conformite-portee-reseau/src/index.ts`, à
  l'étiquette **`conformite-portee-reseau-v1`** (commit 91b7f63), sha256
  **`f27799758591688e283c10e7bee04ea8ca7f3edb8c37dcd135f59e2b0851a15c`** (fins de ligne LF).
- **Le registre des consommateurs conformes** : `PUT /api/v1/instance/reseau/conformite/consommateurs/sinistres`
  (`PLATFORM_ADMIN`), corps `{ versionDeLaSuite: '1.0.0', reference, resultats: [{ cas, ok }] }`. Seul un passage des
  six cas verts, de la version courante, y entre.

## Ce que `sinistres` doit faire (proposition de D ; C décide de la forme)

1. **Consommer le topic** `reseau.portee.changed` (client de Confluent : créer le topic avant de s'abonner,
   `metadataMaxAge: 10_000`, groupe `sinistres-service.portee-reseau`), et tenir un **read-model** par clé
   `(organisationId, userId)` : garder le fait de plus haute `revision`, écarter un fait illisible.
2. **Filtrer chaque lecture au serveur** par ce read-model, en échec fermé :
   - aucun fait, un fait `RETIREE`, ou `lecture.noeuds: []` ⇒ **zéro** dossier ;
   - `lecture.totale: true` ⇒ tous les dossiers **de l'organisation**, jamais d'une autre ;
   - sinon, les dossiers dont le nœud (agence, zone) est dans `lecture.noeuds` ;
   - les écritures filtrent par `ecriture` (toujours contenue dans `lecture`) ;
   - un dossier hors portée rend « introuvable », comme un dossier inexistant (spine distributeur : jamais un 403
     révélateur).
3. **Copier la suite à l'octet** (`git -c core.autocrlf=false show conformite-portee-reseau-v1:paquets/conformite-portee-reseau/src/index.ts`),
   noter son empreinte dans une garde, et l'exécuter dans la CI de `sinistres` avec un adaptateur sur le **vrai**
   read-model et le **vrai** filtre (`reinitialiser`, `semer`, `appliquer`, `lire`) :

   ```ts
   it.each(CAS_DE_CONFORMITE.map((c) => [c.code, c]))('%s', async (_code, cas) => {
     expect(await jouerUnCas(cas, adaptateurSinistres)).toEqual({ ok: true, cas: cas.code });
   });
   ```
4. **S'inscrire au registre** après un passage vert (le moteur lit le registre par la vérification
   `consommateurs-conformes` ; un module installé absent du registre est un écart ouvert, SM-3).

## Ce qui n'est pas à faire

- Appeler `reseau-service` pour filtrer : il n'est **jamais** sur le chemin de lecture d'un consommateur (AD-9).
- Lire la portée dans le jeton : elle n'y est pas (AD-5).
