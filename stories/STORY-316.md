# STORY-316 : Les échéances viennent du paquet — y compris le 30 avril des sociétés

Status: in-progress — **écrite le 2026-11-25** par la session du groupe C (lot 6), juste avant de la coder ; contrat
annoncé ci-dessous avant le code (STORY-315 est fusionnée).

**Epic :** EPIC-030 · **Points :** 5 · **FR :** FR-F18 · **NFR :** NFR-F04
**Services :** `prospera-fiscal-service` (la dérivation) ; `balance-service` (la source du paquet fiscal).
**Après :** STORY-305 et 307 (les échéances déjà dérivées du paquet), STORY-315.

## Histoire

En tant qu'**expert-comptable**, je veux que les dates limites viennent de la réglementation et non du code, afin qu'un
changement de loi de finances ne demande aucune livraison.

## Critères d'acceptation

1. **Étant donné** une société au réel **quand** ses acomptes sont générés **alors** leurs échéances tombent aux quatre
   dates du paquet (31/01, 31/05, 31/07, 31/10).
2. **Étant donné** une entreprise individuelle, une société, puis une banque **quand** l'échéance de dépôt annuel est
   calculée **alors** elle vaut respectivement 31/03, 30/04 et 31/05, toutes trois lues du paquet.
3. **Étant donné** le code du service **quand** on y cherche une date d'échéance en dur **alors** on n'en trouve aucune.

## Ce que le code porte déjà (lu sur `origin/dev`, fiscal `0d353c2`, balance-service `8fbdf6e`)

- La dérivation (STORY-305, 307) lit déjà toutes ses dates dans le paquet : périodique (le jour du mois suivant),
  dates fixes (les quatre acomptes, `acomptesProvisionnels.echeances`), annuelle (`depot.echeances`). L'AC-1 tient.
- Le 31/03 (entreprise individuelle au TPU déclaratif, `REGIME_SYNTHETIQUE`) et le 31/05 (assurance et banque,
  `TYPE_ENTITE_ASSURANCE`) sont servis.
- **Le 30/04 des sociétés ne l'est pas** : l'échéance est publiée au paquet en `NON_CONSTATABLE`, parce qu'aucune donnée
  lue ne distinguait une société d'une entreprise individuelle au réel. La DSF d'une société au réel rend aujourd'hui
  `ECHEANCE_NON_CONSTATABLE`.
- La donnée existe : `GET /api/v1/dossiers/{id}` de `dossier-service` rend la `formeJuridique` (`SA`, `SARL`, `SAS`,
  `SUARL`, `EI`, `AUTRE`) de tout dossier, et le fiscal lit déjà ce dossier.

## Contrat annoncé avant le code (2026-11-25)

**Ajouts seuls**, sauf le mode de constatation d'une échéance du paquet, qui devient constatable.

### Le paquet dit quelles formes juridiques sont des sociétés

- Dans la source du paquet Togo 2026, l'échéance `societe` de `depot.echeances` passe de `NON_CONSTATABLE` à
  **`FORME_JURIDIQUE`** et gagne **`formesJuridiques: ["SA", "SARL", "SAS", "SUARL"]`** ; sa note le dit.
- L'entrée `DSF` du réel (`ENTREPRISE`) du catalogue lit sa date sur cette échéance, et gagne la condition **`formeJuridique:
  { ref: "depot.echeances", filtre: { modeConstatation: "FORME_JURIDIQUE" }, champ: "formesJuridiques" }`** : la date ne
  s'applique qu'aux formes listées. Le schéma et la règle R9 du validateur l'acceptent ; les artefacts se régénèrent, et
  l'empreinte change.

### La dérivation lit la forme juridique

- Le fiscal lit la `formeJuridique` du dossier dans `GET /api/v1/dossiers/{id}` (jeton de l'appelant), au moment de
  dériver. Une entrée qui porte la condition :
  - forme dans la liste ⇒ la date du paquet (30/04 pour Togo 2026) ;
  - forme hors de la liste (`EI`, `AUTRE`) ⇒ `ECHEANCE_NON_CONSTATABLE`, détail `FORME_JURIDIQUE_HORS_LISTE` (une
    entreprise individuelle au réel n'a pas de date publiée au paquet ; jamais celle des sociétés) ;
  - forme illisible ou dossier muet ⇒ `ECHEANCE_NON_CONSTATABLE`, détail `FORME_JURIDIQUE_INCONNUE`. Jamais une date par
    défaut.

### Aucune date en dur

- Un test de garde parcourt `src/` (hors tests et hors commentaires) et refuse toute date `JJ-MM` ou `JJ/MM` écrite dans
  le code. Ce qu'il trouve aujourd'hui est corrigé ou justifié dans la livraison.

### Décisions prises au contrat (contestables)

- **D-316-1** : la forme juridique se lit à la dérivation par HTTP (le dossier est déjà lu), pas dans la réplique des
  dossiers : `dossier-service` ne la publie sur ses événements que pour le dossier propre du cabinet (STORY-1073).
- **D-316-2** : la liste des sociétés est une donnée du paquet, pas du code : un pays qui classe autrement ses formes
  juridiques le dira dans son paquet.
- **D-316-3** : « une banque » de l'AC-2 est le type d'entité `ASSURANCE` (« assurance / banque » au paquet) : il n'y a
  pas de type d'entité `BANQUE`. Une IMF (`MICROFINANCE`) reste `DATE_LIMITE_INDETERMINABLE`, comme le paquet le veut.
- **D-316-4** : une entreprise individuelle **au réel** reste sans date : le 31/03 du paquet est celle du TPU
  déclaratif (régime synthétique). Nommé pour être confirmé par un fiscaliste.
