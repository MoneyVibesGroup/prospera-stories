# Relecture de `kit-cible` 1.0.0 par le groupe A

> **Date :** 2026-11-16 · **Demandée par :** B (journal de B, « → A : relire `kit-cible` 1.0.0 avant le 04/12 ») ·
> **Objet :** étiquette `kit-cible-v1.0.0` de `prospera-plateforme` (`789a11a`, STORY-947).
> **Méthode :** lecture du code et des contrats ; tests du kit rejoués hors dépôt (`git archive` de l'étiquette) :
> **102/102 verts** sous Node 25 (le groupe de conformité MongoDB est sauté faute de `KIT_CIBLE_MONGO_URL` : l'adaptateur
> `mongodb.ts` n'a **pas** été exécuté par A) ; distribution compilée avec les options de `balance-service` : 0 erreur ;
> une sonde jetable en mémoire a reproduit D1, D2 et D8. D1 a ensuite été relu dans le code par A.

## Verdict

**Une 1.0.1 est nécessaire, modeste.** La mécanique centrale est saine (SIMULER = le même code qu'APPLIQUER dans une
transaction annulée ; ordre garde → taille → enveloppe → schéma → validation ; contrats embarqués) et la distribution se
copie sans heurt dans un service NestJS 11 / Node 24. Trois défauts de correction et quelques trous de la suite de
conformité touchent exactement ce que `pdv` devra prouver.

## Défauts à corriger en 1.0.1 (dans le kit, par B)

- **D1 — une clé d'origine en double dans un même lot perd une ligne en silence (bloquant).** `src/cible.ts:310-316`
  (clé d'idempotence = lot, version, objet, clé ; `lireResultat` avant tout) et `:416` (`ecrireResultat`). Deux
  lignes de même `cleOrigine`, champs différents : SIMULER rend `[CREE, MODIFIE]` ; APPLIQUER rend `[CREE, CREE]`, la
  2ᵉ ligne retrouve le résultat de la 1ʳᵉ (écrit dans la même transaction) et n'est **jamais** écrite. La Reprise
  croit avoir livré deux états, la cible n'en garde qu'un. Correctif attendu : un refus nommé (ligne en double) ou une
  règle écrite (la dernière l'emporte), le même en SIMULER et en APPLIQUER.
- **D2 — messages de refus hors contrat.** `cible.ts:135`, `:191`, `:232` : `texteDesErreurs` n'est pas plafonné
  (Ajv en `allErrors`) ; 500 objets de régime invalide donnent un `message` de ~32 000 caractères, le contrat
  `refus-reprise` en impose 1 024. Même chose pour la `raison` d'un `juger` de module (`:376`, contrat : 512).
- **D3 — `montantsRequis` et `etats` sont déclarés mais jamais appliqués par le kit** (`schema-objet.ts:27`, `:84`,
  aucun usage dans `cible.ts`). « Jamais de zéro » (FR-7) repose sur le `juger` de chaque module ; le témoin l'écrit à la
  main, la suite publiée ne l'exige pas : un `pdv` qui oublie ce `juger` passe la conformité.

## Trous de la suite de conformité publiée (à ajouter en 1.0.1)

- **Cloisonnement par organisation** (`conformite.ts:301-315`) : APPLIQUER du même `lotId` chez B après A, référence
  de B vers un objet de A, alias de A repris chez B, `lireFiche` et `saisirMontant` de B sur une fiche de A. Un raccord
  Mongo qui oublierait `organisationId` dans un filtre ne ferait rougir aucun cas.
- **Atomicité** : un objet du lot qui lève ⇒ rien d'écrit (ni version du lot, ni clés). Non testé.
- **`rattacherA`, `REFUSE_PAR_LA_CIBLE`, `REQUALIFIE`, régime non admis, majeure différente, `OBJET_INCONNU`, 1 Mio**
  : couverts par les tests du témoin, **pas** par la suite que `pdv` jouera.
- **Route `controles`** : ni `LOT_TROP_GROS` à 501 clés, ni enveloppe non conforme, ni « n'écrit rien ».
- **`saisirMontant`** : `OBJET_HISTORIQUE`, `FICHE_INCONNUE`, valeur hors schéma, champ non marqué ; et D3.
- **SIMULER n'écrit rien** n'est vérifié que par l'index des clés (`:220`) : une fiche, une version de lot ou une trace
  écrites sans clé passeraient.

## À vérifier sur un vrai MongoDB avant que `pdv` ne s'appuie sur la concurrence

- **D4** — deux APPLIQUER simultanés du même lot : `mongodb.ts:107-115` ne rejoue que sur `TransientTransactionError` ;
  une collision d'index unique signalée en `E11000` donnerait un 500 au lieu d'un rejeu idempotent. Le test
  `test/mongodb.test.ts:55-65` accepte n'importe quelle erreur comme « refus ». Le rejeu rejoue aussi les crochets du
  module (`juger`, `appliquer`) : ils doivent être sans effet hors session.

## À noter (sans gravité immédiate)

- D5 `saisirMontant` ne type pas sa demande à l'exécution (le DTO du service doit valider) ; D6 la version de lot vaut
  par `lotId`, pas par objet (à confirmer avec la spine si un lot porte plusieurs objets) ; D7 un même
  `(lotId, versionLot)` rejoué avec un autre contenu rend le résultat stocké sans comparer (conforme à AD-4, non
  testé) ; D8 `provenance.lotId` non confronté à `lotId`, clé d'origine non NFC acceptée.
- **Copie dans un service** : ajouter `ajv ^8.20` aux dépendances ; `mongodb` n'est importé que pour ses types ;
  exclure `src/vendor` du lint (`--max-warnings 0`) et de la couverture ; la suite de conformité part dans le `dist`
  (inerte tant qu'on ne l'importe pas) ; la copie de `garde-etat-publie.ts` du kit (sha `239ebe7c…`) n'est **pas**
  celle épinglée dans paiement (`a830c449…`) : deux copies différentes si un service a déjà la garde ; copier avec
  `git -c core.autocrlf=false show` sous Windows.
