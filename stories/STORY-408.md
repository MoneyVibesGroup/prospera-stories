# STORY-408 : Le vocabulaire mobile money ne se paramètre qu'en se trompant d'abord

Status: ready-for-dev

**Épic :** EPIC-021 — Profils d'import & mapping réutilisable
**Service :** `balance-service` (`:3007`) — `modules/balance/imports`
**Points :** 3 · **Sprint :** S20
**Origine :** relevée le **2026-08-25** en dessinant l'écran de profil de relevé de **FE-049** —
en cherchant d'où l'écran pouvait bien tirer la liste des valeurs à classer.

---

## Le fait, relevé à la source

Un relevé de **banque** porte deux colonnes `débit` / `crédit` : l'heuristique du serveur les
trouve seule. Un export **TMoney / Flooz** porte un montant toujours positif et une colonne
« Type » — et le serveur exige alors, à juste titre, les **deux** listes de vocabulaire :

```ts
// mapping-releve.regles.ts — manquantsConventionC
// « Une seule liste suffirait techniquement […] C'est précisément ce qu'on refuse :
//   la valeur inattendue (« Frais », « Annulation », une casse nouvelle) tomberait
//   alors dans le sens par défaut et fausserait la trésorerie sans aucun signal. »
```

⛔ **Mais rien ne publie ces valeurs.** `POST /dossiers/{id}/imports/analyser` rend
`colonnesDetectees`, `mappingPropose`, `manquants`… et un `apercu` de **cinq lignes**. Les valeurs
distinctes de la colonne de sens ne figurent nulle part — et cinq lignes ne les contiennent pas.

---

## Ce que ça coûte, concrètement

Le comptable ne peut pas finir son profil en un passage. Le parcours réel est :

1. il classe ce que les 5 lignes d'aperçu montrent (« Dépôt », « Retrait ») ;
2. il importe en aperçu → **`SENS_INDETERMINE` sur « Paiement marchand »** ;
3. il rouvre le profil, ajoute la valeur, revient, réimporte ;
4. …et recommence à la valeur rare suivante (« Frais », « Annulation »).

⚠️ **Le comportement du serveur est SAIN** : la ligne est rejetée, jamais devinée. Ce n'est donc
pas un bug — c'est un **contrat incomplet** qui transforme un paramétrage de trente secondes en
va-et-vient, sur le canal le plus courant de la PME togolaise.

⚡ **Et le coût monte avec le volume** : chaque aller-retour rejoue l'analyse d'un fichier entier
pour découvrir **une** chaîne de caractères que le serveur a déjà lue.

---

## Périmètre

**Inclus**

- `AnalyseFichierResponseDto` publie, pour les colonnes **candidates au sens**, leurs **valeurs
  distinctes** — lues sur tout le fichier, pas sur l'aperçu.
- La liste est **plafonnée** et le dit (même discipline que `rejets` / `MAX_DIAGNOSTIC`) : une
  colonne mal désignée — un libellé, une référence — porterait autant de valeurs distinctes que de
  lignes. Le plafond n'est pas un confort : c'est la borne qui empêche l'analyse d'un fichier de
  50 Mo de rendre une réponse proportionnelle au fichier, sur un service **mutualisé entre
  tenants** (CWE-770, leçon STORY-089).
- Un **compte exact** de valeurs distinctes à côté de la liste tronquée : « 47 valeurs, 20
  affichées » se lit ; une liste tronquée en silence ferait croire le classement complet.
- Quelles colonnes sont « candidates » est **une décision à écrire** : toutes celles dont le
  nombre de valeurs distinctes reste sous le plafond est le critère le plus simple, et il
  désigne naturellement les colonnes de type sans les nommer.

**Hors périmètre**

- Deviner le sens d'une valeur. « Cash-in » est une entrée pour un humain, pas pour une
  heuristique — et une heuristique qui se tromperait ferait entrer une sortie en entrée à
  confiance haute. Le classement reste humain, c'est la matière qu'on lui donne.
- Le format des relevés eux-mêmes : aucun parser par opérateur, la règle de STORY-089 tient.

---

## Critères d'acceptation

1. L'analyse d'un export mobile money rend les valeurs distinctes de la colonne de type, avec leur
   compte exact.
2. La liste est plafonnée, et la réponse dit qu'elle l'est.
3. Un profil de convention C peut être **complété en un seul passage**, sans import préalable —
   c'est le critère qui dit que la story a servi à quelque chose.

---

## Notes

- ⚠️ **Le rejet reste le filet, il ne devient pas le chemin.** Même une fois cette story livrée,
  une valeur nouvelle apparaîtra un jour dans un export : `SENS_INDETERMINE` doit continuer
  d'exister, et FE-049 continue de l'afficher avec le geste qui le lève.
- FE-049 assume le va-et-vient à l'écran plutôt que de le masquer : le bandeau de l'aperçu dit que
  les valeurs rares se découvrent aux rejets, et renvoie au profil.
- Consommateur nommé : **FE-049**.
