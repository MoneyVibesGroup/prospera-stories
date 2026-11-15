# STORY-313 : Aiguillage, y compris sur l'état d'un tiers

Status: done

**Épic :** EPIC-029, le moteur de familles de calcul. **Points :** 5. **Sprint :** 25.
**Service :** `fiscal-service`, domaine seul (`domain/familles`).
**FR :** FR-F12, FR-F13. **Décisions :** AD-3 (ordre du pipeline), AD-4 (refus plutôt qu'approximation).
**Plage :** lot A, n° 7 (`PLAN-4-SESSIONS-2026-11-14.md` §3.3).

> ⚠️ **Écart au rituel §0.3** : cette fiche a été écrite **à la livraison**, et non juste avant de coder. La source
> était le document d'épics (`epics-fiscalite-2026-08-03.md`, STORY-313) et le code de STORY-312, qui déclarait
> `AIGUILLAGE` sans pouvoir l'exécuter. Ses critères d'acceptation sont ceux du document d'épics.

## En tant que

**Expert-comptable**, je veux que le taux applicable se déduise du critère prévu par la loi, afin de ne pas choisir à
la main entre plusieurs taux.

## Critères d'acceptation (document d'épics)

- **AC-1** : une taxe unique déclarative. Quand l'activité est commerciale, le taux retenu est 2 % ; quand elle est de
  services, il est de 8 %.
- **AC-2** : une retenue dont le taux dépend de la régularité fiscale du prestataire. Quand ce critère n'est pas saisi
  **et daté**, l'obligation est bloquée avec son motif, et aucun taux par défaut n'est appliqué.
- **AC-3** : le critère saisi et daté. Quand le calcul s'exécute, le taux correspondant est retenu et figure au détail
  de calcul.

## Livraison (2026-11-15)

**PR :** MoneyVibesGroup/prospera-fiscal-service#44, fusionnée sur `dev` (`7b93ddd`), arbre identique à l'arbre
testé.

### La déclaration au paquet

```json
{ "type": "AIGUILLAGE", "critere": "etatDuTiers", "exigeConstat": true,
  "correspondance": { "ATTESTATION_DE_REGULARITE": "avecAttestationRegulariteFiscale",
                      "NIF_SEUL": "avecNIF", "AUCUN": "autres" } }
```

- **`critere`** : le nom de l'**entrée de calcul** qui porte le critère (`natureActivite`, `etatDuTiers`).
- **`correspondance`** (facultative) : elle relie une valeur du critère à une clé des taux par nature. Sans elle, la
  valeur **est** la clé.
- **`exigeConstat`** : l'état d'un tiers se **constate**. L'entrée `<critère>ConstateLe` (une date réelle,
  `AAAA-MM-JJ`) est alors exigée.

### Décisions (contestables ; règle de l'utilisateur : « appliquer ce que je recommande »)

- **D-313-1 : le critère est une entrée de calcul**, pas un champ lu par le moteur dans le dossier. Le moteur reste
  pur (AD-1). L'appelant, c'est-à-dire la liquidation, lit le critère là où il est saisi : la nature d'activité du
  dossier, l'état constaté du tiers.
- **D-313-2 : la date du constat est une entrée sœur**, `<critère>ConstateLe`. Les entrées de calcul sont un
  dictionnaire plat (`nombre | chaîne`) ; un objet imbriqué aurait changé ce contrat pour tous.
- **D-313-3 : avec une correspondance, seules les branches atteignables se valident comme taux.** La TPU range son
  minimum annuel (20 000 F) **dans** sa table `taux` (Art. 130-134 CGI). Ce n'est pas un taux, et la famille ne le
  recevra jamais. Il se lit par `MINIMUM_PERCEPTION`, à la même référence. Sans correspondance, toute la table est
  atteignable, donc toute la table se valide. Cela évite de toucher au paquet (trois dépôts à réépingler).
- **D-313-4 : `MODIFICATEUR_SANS_STRATEGIE` est retiré** de la liste des refus : aucun modificateur n'en est plus
  dépourvu.

### Preuves

- Sur les **vraies** sections du paquet Togo 2026, référencées telles quelles :
  - TPU (`regimesImposition.synthetique_entreprenant_tpu.composantes.declaratif.taux`) :
    - commerce, 1 000 000 ⇒ **20 000** ; services ⇒ **80 000** ;
    - avec le minimum : commerce, 500 000 ⇒ **20 000** (le minimum), services ⇒ **40 000** ;
  - RSH (`retenuesSource.retenuePrestationsResidents_RSH.tauxSelonBeneficiaire`), 500 000 : attestation ⇒
    **15 000**, NIF seul ⇒ **25 000**, aucun ⇒ **100 000**, chacun constaté le 2026-03-15.
- Refus :
  - critère absent ou vide ⇒ `CRITERE_D_AIGUILLAGE_ABSENT` ;
  - date absente, au format `15/03/2026` ou `2026-02-30` ⇒ `CRITERE_D_AIGUILLAGE_NON_DATE` ;
  - valeur inconnue ⇒ `CRITERE_D_AIGUILLAGE_HORS_CORRESPONDANCE`, avec les valeurs attendues.
- Au chargement, sont refusés : un aiguillage sur un taux unique, une branche sans taux, un critère mal nommé, une
  correspondance vide, un `exigeConstat` non booléen.
- L'**ordre de déclaration** ne change ni le montant ni les étapes (AD-3).
- Unitaires **2347/2347**, e2e **187/187**, lint et build verts.
- **Mutations** : un taux par défaut quand le critère manque fait rougir **2** tests ; un constat non exigé en fait
  rougir **4**.

### Écarts, à porter ailleurs

- **Le catalogue d'obligations du paquet ne porte encore ni la TPU déclarative ni la RSH.** Le moteur sait les
  calculer, mais aucune obligation ne les dérive. Les y ajouter est une modification du paquet (balance-service, copie
  à l'octet chez dossier-service et dans les fixtures de fiscal-service). Elle reste à slotter.
- **Où se saisit l'état constaté d'un tiers ?** Aucun registre des tiers n'existe dans fiscal-service. La liquidation
  devra le lire quelque part ; c'est la question à trancher avec la story qui branchera le moteur sur les obligations.
- **La TCA** (`tauxParNature`) refuse toujours son calcul (`TAUX_A_AIGUILLER`) : elle n'a pas encore d'aiguillage
  déclaré au paquet.
