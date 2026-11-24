# TICKET backend : un prospect entre dans son essai, mais n'y ouvre aucun module — le jeu ne s'y charge pas, rien ne les y installe, et leurs gardes y exigent un KYC

**Type :** chemin manquant (plusieurs dépôts). Le prospect entre dans l'essai (suite de STORY-1112) ; il n'y voit rien.
**Dépôts :** `platform-catalog-service` et `prospera-admin-panel-service` (B) ; `prospera-balance-service` (C) ;
`prospera-bilan-service` (D, D-L6-5) ; `prospera-dossier-service` (B, prêté à D pour STORY-1073) ; la recette (B).
**Découvert par :** STORY-1116 (D-1116-1), en répondant à la question laissée par STORY-1115 (« faut-il lever `balance`
et `bilan` dans l'espace d'essai de la pile ? »). Constaté **au code** de `origin/dev` le 2026-11-24 ; non joué sur pile.
**Ouvert par :** groupe B, 2026-11-24.
**Bloque :** la démo du 15/01 (« chaque client testable par le prospect ») **avec des données** : un prospect entre dans
son essai, invite ses collègues, se connecte « en tant que » un compte du jeu — puis tout module lui rend 403.
**Ne bloque pas :** STORY-1116 (sa ligne : « cinq essais ouverts en parallèle, aucun ne voit les données d'un autre »),
jouée à blanc comme 1115.
**Priorité :** Must avant la démo du 15/01. **À placer par la session de groupe** (plusieurs groupes).

---

## Le problème (trois manques, chacun constaté)

1. **Le jeu d'un métier n'est pas chargé par le catalogue de l'essai de la pile.** L'image du catalogue ne porte que le
   jeu témoin (`Dockerfile` : `COPY contrat/copies/jeux-demonstration`, qui ne contient que `temoin/`) ; les jeux des
   verticales « se montent à côté » (`JEUX_DEMONSTRATION_DIR`). Le profil de recette n'admet aucun volume (garde
   STORY-646, AC-3). Un ordre d'ouverture d'un cabinet avec son jeu rend donc 422 `JEU_DEMONSTRATION_ABSENT` dans la
   pile. *En déploiement* : à prévoir de même (un montage, ou les jeux copiés dans l'image).
2. **Rien n'installe un module dans l'espace d'essai.** L'ouverture d'un essai crée l'essai, ses avis, son effacement,
   invite son administrateur, importe le jeu — elle n'installe rien. Or l'état publié d'un module y vaut
   `NON_INSTALLE` tant que le moteur ne l'a pas installé **dans cet espace** (`calculerEtat` : axe 2 avant l'essai) ; et
   le BFF ne relaie l'offre et les installations qu'au catalogue du réel (`InstallationProxyService` →
   `CatalogServiceClient`, D-1113-1). La console ne peut donc pas installer `balance` et `bilan` dans l'essai d'un
   prospect. (Le catalogue sait installer dans l'essai : `plans.service.ts` pose l'espace servi.)
3. **Les gardes des modules exigent un KYC `APPROVED`, quel que soit l'espace.** `balance-service`
   (`@RequiresBalanceAccess` : e-mail vérifié, KYC `APPROVED` du read-model local, état publié) et `bilan-service`
   (`requires-bilan-access`, même règle) n'ont aucune branche pour l'espace d'essai ; l'espace d'essai n'a pas de KYC
   (ni service, ni `kyc.status.changed` sur son Kafka). Un prospect y reçoit 403 `KYC_NOT_APPROVED` même module
   installé. `dossier-service` : à vérifier de même.

## Ce qui est attendu (à trancher par le PO ou l'architecte, choix par défaut proposé)

- (1) **B** : la pile de recette charge les jeux des verticales dans le catalogue de l'essai (une exception nommée à la
  garde du profil : un montage en lecture seule de `prospera-plateforme/jeux-demonstration`, réglage et non état), ou
  le catalogue copie les jeux publiés dans son image ; **défaut proposé : la copie dans l'image** (comme le témoin), ce
  qui sert aussi le déploiement.
- (2) **B** : l'ouverture d'un essai installe, dans l'espace d'essai, les modules du métier que le jeu nomme (le moteur,
  ses vérifications), **ou** le BFF relaie l'offre et les installations au catalogue de l'essai (`?espace=ESSAI`) pour
  que la console les lance ; **défaut proposé : l'ouverture installe** (« en un geste », comme D-1112-4 choisit le jeu).
- (3) **C (balance), D (bilan), dossier** : dans l'espace d'essai, la garde ne lit pas le KYC (AD-15 : un prospect
  n'a pas de KYC ; l'essai est déjà borné par son état publié `ESSAI_PROSPECT` et son effacement) ; **défaut proposé :
  `INSTANCE_ESPACE=ESSAI` ⇒ le palier KYC est sauté, l'état publié décide seul** — décision d'architecture (AD-15,
  NFR-A01), à confirmer avant le code.
- Puis **B** : la recette lève `dossier`, `balance` et `bilan` dans l'espace d'essai et prouve qu'un prospect y lit son
  jeu, et lui seul (la suite de `cinq-essais`). Mesure de mémoire à refaire alors (trois services de plus sur 8 Go).

## Suivi

- 2026-11-24 — ouvert par STORY-1116 (D-1116-1) ; demande écrite au journal de B (« Demandes aux autres groupes »).
