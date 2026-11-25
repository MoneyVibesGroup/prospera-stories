# Journal du groupe A (poste principal)

> Écrit par le groupe A seulement. Lot 1 : `PLAN-4-SESSIONS-2026-11-14.md` §3 (terminé). **Lot 2 :**
> `PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §2 (STORY-905 → 919), **terminé le 2026-11-16**. **Lot 3 :** `PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §2 (STORY-920 → 929), **terminé le 2026-11-17**. **Lot 4 :** `PLAN-4-SESSIONS-LOT-4-2026-11-18.md` §2 — FE-069 ✅ (18/11), puis FE-034 et AP-38.

## État

### Lot 6 du groupe A (2026-11-24) — FE-140 ✅, FE-149 ✅, FE-141 ✅, PRA-01 ✅, PRA-02 ✅

- ✅ **PRA-01 DONE (25/11)** : `MoneyVibesGroup/prospera-app` **#1** (`dev` `8d19099`), docs (cette PR). Premier commit du dépôt (`main` `63a1fbb`), `dev` posée par défaut, code sur `pra-01` : arbre du Structural Seed (README d'une ligne par dossier vide), kit `src/coque/ui/` (shadcn + `<Liste>`, `<EtatVide>`, `<ErreurApi>`, `<Confirmer>`), `registre.ts` et `descripteur.ts` typés, `/accueil` sur :3200, règles qui rougissent (`boundaries/dependencies`, imports d'interface hors kit, `Date.now()`, `dangerouslySetInnerHTML`, anti-verticale), budget 138 293 → 152 123 octets gzip, CI Node 24 verte. tsc 0, lint 0, Vitest 23/23, build vert, huit mutations rouges (fiche, « Livraison »). **Non prouvé** : le rouge du budget n'est pas rejoué dans la CI GitHub (prouvé en local). **Écarts** : versions de l'app expert-comptable (Next 16.2.10, React 19.2.4), en retrait de la Stack de la spine ; protection de `main` impossible (403, dépôt privé sur offre gratuite) ; `src/modules/instance/` non créé (à C, PRA-09) ; dossiers de C = un README « Squelette ».
- ✅ **PRA-02 DONE (25/11)** : le profil `coque` (Traefik 3.7.0 sur :8080), `prospera-app` **#2** (`dev` `90db6d4`), docs (cette PR). **Passation C → A** : la story est passée de C à A le 25/11, avec l'accord de la session C (PRA-03 en dépend, PRA-05 doit finir le 04/12). **C ne prend rien du lot 7 pour l'instant, PRA-07, 08 et 09 comprises : c'est l'utilisateur qui décidera.** Le compose racine n'est suivi par aucun dépôt : le profil vit dans `prospera-app/infra/compose.coque.yml` + `infra/traefik/dynamique.yml` (décision de l'utilisateur), superposé au compose racine sans le modifier (`docker compose config` identique avant/après). AC-1 → AC-6 prouvés sur `grp-a` (deux mutations rouges). **Non prouvé** : AC-2 avec un jeton valide (401 seulement). **Écarts** : fichier à part et non `docker-compose.yml` ; `/api/reseau/v1/module` n'existe pas (preuve par `/health`) ; `reseau-service` absent du compose racine. Voir « Livraison » de `frontend-stories/PRA-02.md`.
- **Suite** : **PRA-03** (session, configuration d'exécution, sécurité ; dépend aussi de PRA-02, côté C). Voir « Ce que PRA-03 doit savoir » dans `frontend-stories/PRA-01.md`.

- ✅ **FE-141 DONE (25/11)** : prospera-frontend-expert-comptable **#60** (`64c5ecb` + `8ca3acd` sur `dev`), docs (cette PR). Bilan › Analyse : 19 indicateurs en quatre familles, N et N-1 du serveur, **verdicts du serveur seuls** (STORY-1076 : `POIDS_CAPITAUX_PROPRES`, `LIQUIDITE_GENERALE`, `MARGE_NETTE` sourcés BCEAO, BON et RISQUE ; les 16 autres « Aucun repère » en une phrase), ligne qui s'ouvre (formule, postes, repère et source), incalculable avec son motif traduit, non applicable, bloc « Si le prêt est accordé » **sans verdict** (D-141-3). Preuves : tsc, eslint, vitest 1 825/1 832 (7 délais de 5 s hors story, rejoués 30/30), build, e2e simulés 6/6, **gate réel vert** sur `grp-a` (bilan-service construit depuis `origin/dev` `e4cee3e` : BON sourcé, « Aucun repère », « Délai de rotation des stocks » incalculable, montant en francs, dette) et **gate FE-069 rejoué vert**. Écart à la maquette écrit dans la fiche : ses repères « exemple » ne sont pas repris. Pile `down -v`, verrou rendu, session C prévenue.
- **Suite** : lot 6 de A restant : AP-55, AP-57, AP-59 (console) ; FE-150 quand STORY-1099 sera sur `dev`.

- ✅ **FE-149 DONE (24/11)** : prospera-frontend-expert-comptable **#59** (`620b9bd` + `47f190c` sur `dev`), docs (cette PR). Atelier › Factures : déposer (vrai téléversement, « Voir » avant l'envoi), relire (champs modifiables, **écriture éditable dans son tableau**, **aperçu `POST …/apercu` à chaque modification après 400 ms**, aucun recalcul local), inscrire au brouillard, brouillard et journaux, valider avec confirmation, renvoi SMT. Preuves : tsc, eslint, vitest, build, e2e simulés 3/3 (+ suite 288/289, le rouge est `atelier-saisie`, regex d'URL antérieure), **gate réel vert** (deux vraies images lues par l'OCR, Q-209 ligne à ligne, déséquilibre dit par le serveur, validation AC-000001/2, étanchéité, zéro CORS) sur comptabilite construit depuis `origin/dev` **`979ed53`** ; **gate FE-069 rejoué vert**. Autres services de la pile : images `grp-a` existantes (écart écrit dans la fiche). Décisions D-149-1 à 6 dans la fiche. **Pile `down -v`, verrou rendu, session C prévenue.**
- **Écart nommé (D-149-1)** : comptabilite refuse tout dépôt tant que l'exercice n'est pas ouvert à la comptabilité (`EXERCICE_NON_OUVERT`) ; le choix de la tenue (JOURNAL ou CAHIERS, définitif) n'a aucun écran : le gate l'ouvre par l'API. **Story à écrire : « Choisir la tenue de l'exercice »** (maquette d'abord).
- **Suite** : **FE-150** quand STORY-1099 sera fusionnée sur `dev`, sinon **FE-141**.

- ✅ **FE-140 DONE (24/11)** : prospera-frontend-expert-comptable **#58** (`eb542a3` sur `dev`), docs (cette PR). L'onglet « Financement » (module ouvert), la liste, la création pré-remplie (objet + montant), l'étape « Les chiffres » (emprunts, échéancier, indicateurs de dette), les états et droits, les versions, les refus de 1083/1084 dits en métier ; les six autres étapes grisées « bientôt » (D-140-1). Preuves : vitest 1 768 verts, e2e simulés, **gate réel vert sur `grp-a`** (financement 1/1, FE-069 1/1) ; valeur de référence lue au franc (658 346 / 658 339 / 6 600 601). Décisions D-140-1 à 8 dans la fiche.
- **Écart backend → B (24/11) — ouverte** : `ValeurIndicateurDto` existe deux fois dans bilan-service, l'OpenAPI des indicateurs de dette est faux ; `tickets/TICKET-BACKEND-financement-schema-valeur-indicateur.md`. Aucun correctif fait par A.
- **Constats pour la suite** : (1) aucune route ne liste les banques : FE-152 attend STORY-1105 / AP-50 (D-140-2) ; (2) « Remis » ne sait pas s'il y a un dossier figé avant STORY-1086 : à masquer dans FE-142 (D-140-4) ; (3) `bilan.ts` committé avait dérivé du service (régénération large, tsc vert).
- **Suite** : **FE-149** (les factures deviennent des écritures) quand sa maquette sera validée ; puis FE-150, FE-141, AP-55, AP-57, AP-59.
- **Docker** : pile `grp-a` construite à partir des images du 19/11 (`up --no-build`) car le poste était saturé (9 `npm ci` en parallèle : >1 h, fetchs à 600 s) ; ces images contiennent 1083/1084 (bilan et auth postérieurs aux commits du 18/11) ; `down -v` fait, verrou rendu, session C prévenue.

### Pièges du 24/11 (FE-149)

- **`npm ci` échoue** (« Missing: @emnapi/core@1.11.3 from lock file ») : le verrou du front est désynchronisé depuis #56. `npm install --no-save` installe sans toucher au verrou (aucune jonction, un seul `node_modules`).
- **`.env.local` sans `NEXT_PUBLIC_COMPTABILITE_URL`** : la valeur est inlinée au build ; sans elle, tout appel à comptabilite échoue en « Le geste n'a pas abouti » sans autre trace. Rebâtir après l'avoir posée.
- **L'IdP doit stamper `comptabilite-service` dans l'`aud`** (`AUTH_AUDIENCE` de l'auth-service) ; le compose racine ne le fait pas : surcouche `gate-fe149.yml`. Le service se branche sur le Kafka RACINE (l'état publié du module y arrive).
- **L'exercice doit être ouvert à la comptabilité** (`POST …/exercices/{e}/ouverture {tenue}`) avant tout dépôt : sinon 404 `EXERCICE_NON_OUVERT`. La sonde `GET …/lots` répond 200 avant.
- **Tesseract ne lit pas un PDF** : le gate rend de vraies factures en PNG dans le navigateur (texte au format du parseur : `FACTURE N°`, `FOURNISSEUR :`, `NIF :`, `DATE DE FACTURE :`, `MONTANT HT :`, `TVA (18%) :`, `TOTAL TTC :`). L'OCR a lu les deux factures sans erreur.
- **Deux gates à la suite** épuisent les 5 connexions par minute de l'IdP : attendre 100 s entre les deux.
- **Une classe de schéma homonyme** (`PropositionDto` du lettrage et des factures) a été disambiguée côté service : la génération de types donne bien celle des factures.
- **Testing Library replie les espaces fines insécables** des montants : comparer avec `/117\s000/`.
- **Docker Desktop** : `docker_data.vhdx` resté attaché après un compactage ⇒ « unable to start » (geste de l'utilisateur, administrateur).
- **Poste** : un seul `npm install`, un seul build d'image ; `vitest` en parallèle d'un build donne des délais de 5 s (rejouer les fichiers seuls).

### Pièges du 25/11 (FE-141)

- **`git archive` sous Windows convertit les fins de ligne** (`core.autocrlf=true`) : l'asset `syscohada-revise-2.3.json` change de sha256 (122 767 octets au lieu de 117 871) et bilan-service répond **502 « Référentiel non intègre (checksum invalide) »** à la création d'une liasse. Archiver avec `git -c core.autocrlf=false archive`.
- **Prettier sur un dossier entier** (`prettier --write src/features/bilan`) réécrit des dizaines de fichiers existants : le cibler fichier par fichier.
- **Deux `playwright test` en même temps dans le même dossier** se bloquent sur `.next/lock` (le second échoue sur « next build still in progress ») : un seul à la fois, `rm -rf .next` après un arrêt brutal.
- **`getByText('Exercice précédent')` est insensible à la casse et prend les sous-chaînes** : « Comparé à l'exercice précédent » le trouve ; utiliser `{ exact: true }`.
- **Montants de la liasse** : unités mineures, lues en francs par `formatMontantMineur` (÷ 100) ; sans cela l'écran affiche 100 fois trop.
- **Gate** : la balance « validée » met quelques secondes à être lue par bilan-service (« La balance n'est pas validée » passager : rejouer le geste) ; une demande de prêt par l'API exige `exerciceReference` ; pour un incalculable, une balance sans achat (délais des stocks et des fournisseurs : « rien à diviser »).
- **`npm run build` + `vitest` complet en parallèle** : 7 tests de 4 fichiers sans rapport dépassent 5 s ; rejouer ces fichiers seuls.

### Pièges du 24/11 (FE-140)

- **Poste saturé** : RAM ~1 Go libre, disque C: plein à 100 % en fin de story (« No space left on device » sur un `git rebase`). Ne jamais lancer plusieurs builds d'images en parallèle ; ne pas dupliquer `node_modules` (copie de 400 paquets : >1 h sous charge). Mailhog et la console MinIO : surcouche `ports: !override` (8025 est tenu par Herd) et `GATE_MAILHOG_URL=http://localhost:18025`.
- **Docker Desktop a redémarré en cours de gate** (ECONNRESET) : les conteneurs d'infra sont sortis en 255 ; `up -d --no-build` de la même commande les relève.
- **Testing Library replie les espaces insécables** : comparer les montants avec `{ normalizer: (t) => t }`.
- **Un composant « Avis » qui ignore ses props** a masqué un `data-testid` jusqu'au gate : étaler `...reste`.
- `gh pr merge` peut planter par manque de mémoire (« cannot allocate memory ») après avoir fusionné : vérifier par `gh api …/pulls/<n> --jq .merged`.


### Des factures aux écritures, et la liasse face aux déclarations (2026-11-23) — session du groupe C

Consigne de l'utilisateur du 23/11 à la session du groupe C (`moneyvibes-apps-dc`) : coder **STORY-1097, puis 1098, puis
1099, puis 1101**, une à la fois ; contrat annoncé avant le code ; PR fusionnées (`gh pr merge --rebase`, code sur `dev`,
docs sur `main`) avant la suivante ; noté ici. Ne pas toucher `prospera-frontend-expert-comptable` ni
`platform-catalog-service` (tenus par la session A) ; verrou Docker demandé à la session A et rendu dès le gate fini ;
tout changement du manifeste `comptabilite` signalé à la session A, qui le recopie au catalogue.

- ✅ **STORY-1097 DONE (23/11)** : comptabilite-service **#17** (`cd737dd` sur `dev`), contrat stories **#751**.
  Unitaires Node 24 994 (+3 ignorés), mutation 10/10 sur les règles, `test:socle` 319 verts (suite `factures`), gate
  de câblage sur `grp-c` vert (healthy, routes neuves 401, OpenAPI), verrou Docker rendu (pris à A le 23/11 après
  FE-148). Manifeste `comptabilite` **0.3.0** (2 routes de lecture), dans les deux copies : **→ A, recopie au
  catalogue** (ci-dessous). Décisions D-1097-1 → 14 dans la fiche.
- ✅ **STORY-1098 DONE (23/11)** : comptabilite-service **#18** (`6e4132b` sur `dev`), contrat stories **#755**.
  Unitaires Node 24 1001 (+3 ignorés), mutation 5/5, `test:socle` 331/331 (suite `memoire`), gate `grp-c` vert.
  Manifeste `comptabilite` **0.4.0**. **Verrou Docker** : la session A était injoignable (47 disparue ; b4 et 9c ne
  sont pas A ; 88 muet) ; l'utilisateur a autorisé de prendre le verrou sur un poste libre ; rendu après le gate.
  **Catalogue** : l'utilisateur a demandé à la session C de recopier elle-même le manifeste 0.4.0 au catalogue cette
  fois (la 0.3.0 n'y a jamais été semée : on passe de 0.2.0 à 0.4.0).
- 🟡 **STORY-1099** (mémoire des choix dans les cahiers, `balance-service`) : contrat annoncé le 23/11 (« ⚠ Contrats »
  et la fiche). Code sur la branche `MNV-1099`.
- ⚠️ STORY-1101 n'est pas encore sur `main` : sa fiche est dans la PR #730, ouverte. Il faudra la fusionner avant
  d'y arriver.

### Le plan comptable propre (2026-11-21 → 23) — STORY-1094 ✅, 1095 ✅, 1096 ✅, FE-148 ✅

- ✅ **STORY-1094 DONE (21/11)** : comptabilite-service **#13** (`a98ec56` sur `dev`), contrat stories **#745**. Unitaires 889/889 (Node 24), `test:socle` 273/273 (29 neufs), mutation 18/18, gate de câblage grp-a vert (healthy, routes neuves 401), verrou Docker rendu. Décisions D-1094-1 → 8 dans la fiche (plan publié = donnée générée ; `TENANT_ADMIN` sans droit neuf ; classe 9 saisissable ; `BQ1` accepté par les écritures). Demande à B : recopier le manifeste au catalogue.
- ✅ **STORY-1096 DONE (21/11), AC-4 à rejouer sur un export réel** : comptabilite-service **#15** (`2f358dc` sur `dev`), contrat stories **#749**. Unitaires 938, `test:socle` 308/308 (19 neufs), mutation 10/10 + 5/5 au socle, gate de câblage grp-a vert, verrou rendu. Décisions D-1096-1 → 8 dans la fiche (collectifs non recréés ; un compte du plan est « déjà connu » ; aperçu puis enregistrement par version et empreinte ; un acte `PLAN_IMPORTE`). **Reste à l'utilisateur** : fournir un vrai export Sage 100 anonymisé pour rejouer l'AC-4 (surtout les mots des journaux et l'encodage). FE-148 (l'écran) peut brancher les trois stories.
- ✅ **STORY-1095 DONE (21/11)** : comptabilite-service **#14** (`0d93c5d` sur `dev`), contrat stories **#746**. Unitaires 910 (Node 24), `test:socle` 289/289 (16 neufs), mutation 10/10 (+3 au socle), gate de câblage grp-a vert, verrou rendu. Décisions D-1095-1 → 7 dans la fiche (responsable lu chez dossier-service ; `@AutoriseParLeService` ; famille du dossier ; archivé en lecture seule ; masque réservé aux comptes du modèle).
- **Suite** : STORY-1096 (import du plan de Sage 100, aperçu puis enregistrement) — dépend d'un vrai export fourni par l'utilisateur pour AC-4 ; FE-148 (l'écran) est dessiné par une autre session.
- ✅ **FE-148 DONE (23/11)** : prospera-frontend-expert-comptable **#57**. comptabilite-service branché au front (préfixe `/compta` retiré, `NEXT_PUBLIC_COMPTABILITE_URL`, types générés, 53 chemins). **Gate réel vert deux fois** (`e2e/gate/plan-comptable.spec.ts` : import Sage 13 créés, réimport sans effet, héritage, refus sans racine corrigé en un clic, masque, étanchéité A/B, collaborateur en lecture seule, zéro CORS) et gate FE-069 rejoué vert après le déplacement des gestes communs (`e2e/gate/ecran.ts`). Pile `grp-a` depuis `origin/dev` de 10 services, `down -v`, verrou rendu à la session C. Décisions D-148-1 → 8 dans la fiche. **Écarts** : aucune réactivation d'un compte ou d'un journal désactivé (désactivation sans retour, l'écran le dit) ; `ResultatDImportDto` typé faiblement dans l'OpenAPI ; manifeste `comptabilite` passé en **0.2.0** (« ⚠ Contrats »). Manifeste 0.2.0 fusionné dans les trois exemplaires : prospera-stories #752 (`c00c5bb`), comptabilite-service #16 (`41d0dbc`), catalogue #64 (`8b4c84c`, recopie depuis `c00c5bb`, garde verte, 473 tests). **Lot 5 de A clos**, sauf l'AC-4 de 1096 sur un vrai export (geste de l'utilisateur).

### Le parcours réel du dossier de financement (2026-11-21) — fiches écrites, PR de docs à présenter à l'utilisateur

- **Source** : la maquette de FE-140, **validée par l'utilisateur le 21/11** (PR #741, « identique à ce qui se passe dans la vraie
  vie pour un expert-comptable »). Chaque bloc de la maquette dit en note ce que le backend sert (1083, 1084) et ce qui vient.
  Ces notes sont devenues des stories.
- **Décisions de l'utilisateur (20-21/11), inscrites comme telles dans les fiches** : pas de consentement BIC ; pièces selon le
  **profil** (société établie, jeune société) et la **relation** avec chaque banque (déjà client à compte mouvementé, nouveau
  client) ; pro forma **obligatoire et bloquant** pour un matériel, **TTC** ; garanties **saisies** par le cabinet ; plan de
  trésorerie mensuel **exigé** pour une jeune société ; plan d'affaires et note **pré-remplis, en Word, redéposés** ; textes
  **sans IA** (option IA à décider par l'utilisateur : PRD assistant IA, FR-IA07 et FR-IA09) ; **partout où c'est déposer, un
  vrai téléversement ; tout fichier déposé ou généré se voit dans l'application avant tout téléchargement** (21/11).
- **Écrit (docs seulement, aucun code)** : STORY-1104 → 1111 (`stories/`), FE-152 → 157 (`frontend-stories/`) ; amendées « le 21/11 » :
  STORY-1085 et 1086 (**elles n'avaient pas de fiche : l'amendement est dans leur bloc de `epics-services-cabinet-2026-11-18.md`**),
  AP-50 (idem), FE-140 (portée), FE-142 (redécoupée, 5 → 3 pts), PRD §4.1 (FR-1b, 1c, 1d, 1e, 5b, 6b, amendements de FR-1, FR-2,
  FR-5, FR-17) ; table de couverture des épics.
- **Ids** : STORY-1104 → 1111 et FE-152 → 157 vérifiés libres sur toutes les branches distantes et dans les PR ouvertes (#730 tient
  1101 → 1102). `story_id_high_water_mark` : **STORY-1111**. Non slottées.
- **Le contrat commun du dépôt et de l'aperçu** (STORY-1104, D-1104-9) : un seul chemin pour tout fichier (`POST …/documents`,
  `GET …/apercu`, `GET …/fichier`), réutilisé par 1085, 1086, 1106, 1107, 1108, 1109, 1110. **Rien n'est livré** : il faut d'abord la demande
  à C ci-dessous.
- **Écarts avec la maquette, à corriger au prochain passage sur le prototype** : (1) « +150 % du CA 2025 » doit se lire « 150 % du CA
  2025 » (24 000 000 sur 16 000 000) ; (2) les brouillons chiffrés du projet (24 000 000 / 32 000 000 / 34 000 000 ; 55 % ; 3 000 000 /
  4 200 000 / 4 400 000) sont des valeurs de démonstration : le serveur n'invente aucun chiffre (STORY-1111, D-1111-1) ; (3) deux
  jeux de chiffres coexistent dans les tableaux de la maquette (couverture 1,92 / 1,62 / 1,65 pour la projection « Avec le camion
  (version 2) » déjà dessinée, 1,76 / 1,56 / 1,65 pour celle créée depuis l'historique) : **la référence des stories est le second**.
- **Nommé, sans fiche, pour plus tard** : le **lien de dépôt** envoyé au client pour qu'il téléverse lui-même ses pièces ; la **mission
  facturable du montage de dossier** (module missions, EPIC-268) ; la **lecture OCR du pro forma** ; les **alertes d'expiration** des
  pièces (pro forma, attestations OTR et CNSS) ; les documents à générer que la maquette montre et que 1109 ne couvre pas (déclaration
  de patrimoine de la caution, modèle de CV du promoteur, formulaires d'ouverture de compte et de connaissance client de la banque,
  bilan d'ouverture d'une jeune société) ; l'**enregistrement de l'emprunt décaissé** comme dette existante des dossiers suivants.
- **Ordre de réalisation proposé** (dépendances : AP-50 avant 1085 ; 1104 avant 1106, 1110 et 1111 ; 1105 avant 1107 ; 1085 avant 1086) :

  | # | Story | Points | Dépend de | Écran qui la sert |
  |:--:|---|:--:|---|---|
  | 1 | AP-50 amendée (référentiel étendu) | 8 (+3) | — | console |
  | 2 | STORY-1104 le projet financé et le contrat des documents | 5 | demande à C (dépôt, aperçu) | FE-152 |
  | 3 | STORY-1105 plusieurs banques, relation, profil | 5 | 1083 | FE-152 |
  | 4 | STORY-1106 les garanties | 5 | 1104 | FE-154 |
  | 5 | STORY-1110 la trésorerie mensuelle | 5 | 1104, 1084 | FE-157 |
  | 6 | STORY-1111 les aides à la décision | 13 | 1104, 1084, 071 | FE-157 |
  | 7 | STORY-1085 amendée (exigences par profil et relation) | 8 (+3) | AP-50, 1104, 1105 ; lit 1109, 1110, 1111 | FE-153 |
  | 8 | STORY-1109 les documents générés | 13 | 1104, 1105, 1106, 1110, 1111 ; demande à C (rendu) | FE-156 |
  | 9 | STORY-1086 amendée (un dossier par banque, synthèse) | 13 (+5) | 1085, 1106, 1109, 1110, 1111 | FE-142 (3 pts) |
  | 10 | STORY-1107 le suivi banque par banque | 8 | 1105, 1086 | FE-155 |
  | 11 | STORY-1108 conditions et décaissement | 3 | 1107 | FE-155 |

  Écrans : FE-140 (5, liste et chiffres) d'abord ; FE-152 (5) après 1104 et 1105 ; FE-154 (3) après 1106 ; FE-157 (8) après 1110 et 1111 ;
  FE-153 (8) après 1085 ; FE-156 (8) après 1109 ; FE-142 (3) après 1086 ; FE-155 (8) après 1108.
  **Points écrits ou ajoutés ce 21/11 : 106** (8 stories neuves 57 + 6 écrans neufs 40 + amendements : AP-50 +3, 1085 +3, 1086 +5,
  FE-142 −2). **Reste à construire pour le parcours complet : 134** (backend 86 : 57 neuves + AP-50 8 + 1085 8 + 1086 13 ; écrans 48 :
  40 neufs + FE-140 5 + FE-142 3). Estimation de A, à relire au prochain plan.

### Lot 4 (ordre validé le 2026-11-18) — en attente du plan

- **Réponses de l'utilisateur (2026-11-18)** à l'analyse des journaux des lots 1 à 3 :
  1. **Ordre du lot 4 de A, validé** : STORY-1080 d'abord, puis les demandes ouvertes de B et de D (ci-dessous).
     Identifiants réservés au tracker : **STORY-1080 → 1082** (au-delà de la plage de D, 1030 → 1079).
  2. **FE-069** : l'utilisateur s'en charge (porteur, date). A n'y touche pas sans consigne.
  3. **D-923-1 renversée** : le relais BFF `PATCH /dossiers/{id}` s'ouvre au **collaborateur**, comme le plan du
     lot 3 le disait ⇒ **STORY-1081**.
  4. **D-928-3 remplacée** : le dossier de démonstration se crée dans `dossier-service`, par une route appelable par le
     moteur ⇒ **STORY-1082** (ferme le ticket `dossier-de-demonstration-sans-creation-par-le-moteur`).
  5. **Confirmés** : D-926-2 (balances anciennes `NON_ENREGISTREE`, sans migration), D-926-6 (route de provenance
     sous `/balance/`), STORY-300 (tout membre du cabinet lit le fichier déposé).
  6. **Gestes réservés, vérifiés le 2026-11-18** : « Rebase and merge » seul sur les 32 dépôts dont le compte voit les
     réglages (dont `prospera-plateforme`, `reseau-service`, les cinq du distributeur, `centrale-service`,
     `agent-instance`, `prospera-comptabilite-service`, les trois de C). Réglage invisible (compte en lecture seule) :
     `prospera-frontend-admin-panel` (ancien ; la console vit dans `frontend-admin-panel`), `prospera-platform-config`,
     `prospera-infra`, `moneyvibeswebsite`. **Node 24 toujours absent du poste principal** (nvm : 25.2.1 seule ;
     Laragon : 22) : les `*.module.spec.ts` restent rouges en local (`bindings`).
- **Ordre du lot 4 de A** (identifiants des points 4 et 5 : au plan du lot 4) :
  1. **STORY-1080** : les six routes `…/verifications/…` de balance et de bilan (`verification-installation@1`) ;
     `INSTALLATION_SERVICES` au catalogue de la recette ; `cabinet-moteur` installe par `POST /installations` (le
     test D-929-1 s'inverse) ; ensuite seulement, D peut retirer le `PUT` de la console.
  2. **STORY-1081** : relais BFF ouvert au collaborateur ; au rituel, vérifier le 409 de version muet (D12) côté
     `dossier-service`.
  3. **STORY-1082** : création du dossier de démonstration par le moteur (identité `MOTEUR`, espace d'essai) ; l'import
     C13 de balance le résout au lieu de le dériver ; la balance validée de la démo arrive à bilan.
  4. **Demandes de B** : (a) `comptabilite-service` dans le défaut d'`INGESTION_SOURCE_SYSTEMS` de balance (absent de
     `dev` `98078b0`, vérifié le 18/11) ; (b) la comptabilité dans la recette (audience de l'IdP, service au compose) ;
     (c) relecture de `kit-cible` 1.0.1 (D4 → D8 restent ouverts) ; (d) client admin Kafka gardé dans `/health` et
     `renouveler()` sans attendre la fermeture (balance, bilan, fiscal, dossier, kyc).
  5. **Demande de D** : la recette de la démo assurance dans `prospera-recette`, quand C aura le parcours
     `SIN-2026-9002`.

- **2026-11-18 (suite)** : **Node 24 installé** sur le poste principal (nvm, `24.22.3`, à côté de `25.2.1` qui reste
  active : `nvm use 24.22.3` pour basculer, ou `C:\Users\thier\CONFIG~1\herd\bin\nvm\v24.22.3\node.exe` pour une
  suite). **Point 6** : le texte de la loi 2011-018 et l'avis du fiscaliste ne viendront pas de sitôt ; on avance
  sans (D-901-5 et les lectures de 568 restent telles qu'appliquées). Réponses de l'utilisateur aux questions de B, C
  et D : « Demandes aux autres groupes » ; STORY-973, 974 (B), 1015 → 1017 (C) et 1060 (D) réservées au tracker.

- **2026-11-18 (services du cabinet)** : sur demande de l'utilisateur, **PRD court** `prds/prd-services-cabinet-2026-11-18/`
  (financement bancaire, archives du client, missions et facturation, paie ; FR-1 → FR-25 ; relu, corrigé) et **épics**
  `epics-services-cabinet-2026-11-18.md` : EPIC-266 → 269, **cinq lots de quatre** (F1, F2, G1, M1, P1) :
  STORY-1083 → 1092, écrans FE-140 → 145, console AP-50 → 53. **Consigne de l'utilisateur : les lots sont désormais de
  quatre stories.** Le lot 4 de A (1080, 1081, 1082 + l'habilitation de `comptabilite-service` demandée par B) en fait
  quatre. ⚠️ La paie entre dans Prospera (renverse FR-F28, D-SC-10). Gestes réservés : créer
  `prospera-cabinet-service` et `prospera-paie-service` avant M1 et P1.

### Lot 4 (proposé le 2026-11-18) — `PLAN-4-SESSIONS-LOT-4-2026-11-18.md`

- **Consigne de l'utilisateur (18/11)** : le backend de A (1080 → 1084, 1093) est fait par **B, sur l'autre poste** ;
  A, avec l'utilisateur, fait les **écrans** : FE-069 (en cours, tenue par l'utilisateur), puis **FE-034** et **AP-38**
  (console tenue par A pour ce lot). L'ordre de lot 4 écrit plus bas (« Lot 4 (ordre validé le 2026-11-18) ») est
  **remplacé** par ce plan : ses stories passent à B.
- **Passation à B (D-L4-1), à la fusion du plan** : balance, bilan, dossier, `admin-panel-service` (BFF),
  `prospera-recette`. Derniers commits sur `dev` : balance `98078b0`, bilan `1651d33`, dossier `768a4aa`, BFF `18a9893`,
  recette `f7944dc` (vérifiés le 18/11). **B lit d'abord « Pièges rencontrés » ci-dessous.**
- **2026-11-18 (après-midi) — consigne de l'utilisateur** : « on débute par FE-069, celui qui refait tout ce qui est
  cassé au niveau du cabinet » ; maquettes de FE-034 et d'AP-38 arrêtées (rien de commité, worktrees retirés). Docker
  pris en exclusivité le temps de régénérer les types, puis rendu à C ; le code du front s'est fait sans Docker ; le
  verrou a été repris à C (fin de sa vérification de 1015) pour le seul gate final, puis rendu.
- ~~1. **FE-069**~~ ✅ **DONE (2026-11-18)** — prospera-frontend-expert-comptable **#54** (dev `6796601`). Types
  régénérés depuis origin/dev du 18/11 ; A1 → A13 et B1 → B25 traités ; tsc 65 → 0 ; Vitest 148 fichiers ; e2e simulés
  verts (7 rouges sur dev corrigés, 1 instable) ; **gate sur la vraie pile vert** (`npm run e2e:gate`, étanchéité A/B sur
  les quatre services, CORS, collaborateur). Restes nommés dans la fiche : migration STORY-356 sur données anciennes,
  AC-8 clavier, relecture des réserves de FE-059 → 068.
- **Suite du lot** : ~~FE-034 maquette~~ ✅ **validée par l'utilisateur le 2026-11-19** (prospera-stories #703 ; prototype cabinet
  réaligné sur TOUT le livré en cinq passes, version 17 ; décisions de A : Ets Kossi au régime réel partout, écart du TFT
  905 000 gardé, paquet `syscohada-revise@2.3`). **Code de FE-034 non lancé** (consigne de l'utilisateur). Puis AP-38
  (maquette console à valider).
- **2026-11-19 — consigne de l'utilisateur** : code de FE-034 lancé (sous-session, sans Docker d'abord) ; pour la
  console, « tout tester comme FE-069 avant d'ajouter AP-38 » ⇒ **AP-54** (gate de la console) créée et lancée ; AP-38
  (maquette arrêtée avant toute écriture) reprendra après AP-54.
- ✅ **2026-11-19 (soir)** : **FE-034 DONE** (prospera-frontend-expert-comptable #55, `dev` `a257ebc`, gate vert 8,6 min) ;
  **AP-54 code fusionné** (frontend-admin-panel #30, `dev` `50d9101`, gate console 69/69). Un seul passage Docker pour les
  deux (pile `grp-a`, images depuis `git archive origin/dev` du 19/11), puis `down -v` et verrou rendu. Restent pour AP-54 :
  tri du bloc C et prototype console ; puis AP-38. Ticket : `TICKET-BACKEND-liasse-rouverte-version-null.md`.
- **2026-11-19 (nuit) — AP-54, AC-4 FAIT : le bloc C est trié** (sous-session, PR docs `docs-ap-54-tri-c`). 7 stories neuves, non slottées, à placer au prochain plan : **AP-55** (offre et installation, état publié ; remplace l'octroi par `PUT`, **bloquée jusqu'à STORY-1080**), **AP-56** (mise en service, sorties d'essai), **AP-57** (essai du prospect), **AP-58** (packs et manifestes, `ready-for-dev`), **AP-59** (métier de l'organisation), **AP-60** (rôle plateforme d'un membre), **AP-61** (annuaire : actions en lot et filtre propriétaire). Réancrées : AP-17 et AP-34 (rôles de tenant, `blocked` à tort, STORY-166/167 sont `done`), AP-21 (`kycStatus` désormais servi). C10 : sans écran de console, voulu (routes du moteur). ⛔ Le BFF `admin-panel` ne relaie pas `mises-en-service`, `sorties-essai`, `naissances`, `essais`, `etat-publie` ni `vertical` : relais à demander au groupe qui le tient (aucune story backend réservée). Reste pour AP-54 : AC-5, le prototype de la console.
- **2026-11-20 — AP-54 DONE, maquette AP-38 VALIDÉE.**
  - Prototype de la console aligné (frontend-admin-panel #31) et republié en force sur son Artifact, avec l'accord de
    l'utilisateur (version 8). La version en ligne était le prototype de `dev`, plus l'enveloppe de publication.
  - Maquette AP-38 (#32, Artifact version 9) validée. Portée : rejet global seul (fiche `frontend-stories/AP-38.md`).
  - Constat : le « renvoi pour correction » n'envoie aucun motif et ne prévient pas le cabinet. D'où **STORY-1103**
    (`kyc-service`, BFF, e-mail ; non slottée, porteur à désigner au rituel) et **AP-62** (écran, bloquée).
  - Suite de A : code d'AP-38, puis FE-146.
- **2026-11-20 — AP-38 DONE** (frontend-admin-panel #33). Gate sur la vraie pile vert ; le gate de la console doit lever `document-service` (OCR) pour `kyc-chain`. Verrou Docker rendu, pile `down -v`. Suite de A : FE-146.
- **2026-11-20 — Lot 5 planifié** (`coordination/PLAN-LOT-5-2026-11-20.md`, consigne de l'utilisateur : 4 stories, expert-comptable seul, backend et écrans) : FE-140, STORY-1086, FE-141, STORY-1094 (remplaçante FE-147). 1085/FE-142 au lot 6 avec AP-50.
- 🏁 **2026-11-20 — FE-146 DONE (#56), LOT 4 DE A CLOS.** Bilan du lot :
  - FE-069 (#54), FE-034 (#55), AP-54 (#30, #31, tri C #732), AP-38 (#33), FE-146 (#56) : toutes avec un gate réel vert.
  - Créées en route, non slottées : FE-146 → 151, STORY-1094 → 1100, AP-55 → 62, STORY-1103.
  - Tickets laissés à B : liasse rouverte relue avec `version` null ; projection des remboursements non plafonnés.
  - Le prototype cabinet a une NOUVELLE adresse (`claude.ai/artifact/9iBJj5jTd1552uNPpZDJiL`) ; la console reste `7rbu7npMzRV9QE45CZsjJZ`.
  - Suite : revue UX du prototype (interrupteur « Notes de conception » d'abord), puis lot 5 (FE-140).
- **2026-11-21 — Financement : maquette refaite et validée, stories écrites ; lot 5 revu.**
  - Maquette du dossier de prêt, parcours réel UEMOA en 7 étapes : validée (#741), téléversement réel et aperçus (#743).
  - Stories : STORY-1104 → 1111, FE-152 → 157 ; 1085, 1086, AP-50, FE-140, FE-142 amendées ; PRD FR-1b → 6b (#742). Reste 134 pts.
  - Réponses de l'utilisateur : fichiers PDF/JPG/PNG/Word/Excel (+ CSV) 20 Mo ; chiffres du projet saisis par le cabinet ;
    générer → figer → prêt ; valeurs de démonstration configurables par banque (AP-50) ; autres documents plus tard.
  - Consigne : « le financement après ; progresser sur le projet ». **Lot 5 revu** (`PLAN-LOT-5-2026-11-20.md`) : le plan
    comptable propre de bout en bout, STORY-1094 → 1096 + FE-148 (maquette d'abord), 29 pts ; remplaçante FE-147.
- **Ticket ouvert pour le groupe qui tient bilan-service** : `tickets/TICKET-BACKEND-projection-remboursements-non-plafonnes.md`.
- ⏰ **À REPRENDRE EN FIN DE CHANTIER (consigne de l'utilisateur, 2026-11-19)** : `revue-ux-prototype-cabinet-2026-11-19.md`.
  Le prototype est utilisable sur le fond, mais pas facile : trop d'écrit, notes de conception mêlées à l'écran, jargon
  technique, 13 onglets dans l'Atelier. Recommandations : interrupteur « Notes de conception », passe « langage métier »,
  tableau de bord « à faire », onglets regroupés, test avec de vrais experts-comptables. Aucune story créée à ce stade.
- **FE-146 créée (2026-11-18, demande de l'utilisateur)** : le message de l'Atelier pendant la propagation des axes (409 SYSTEME_COMPTABLE_INDETERMINE juste après la décision). Front seul, 3 pts, quatrième story du lot 4 de A, après AP-38.
- **Comptabilité propre et export des clients (2026-11-18, demande de l'utilisateur)** : STORY-1094 (plan propre du
  cabinet), 1095 (plan propre d'un client), 1096 (import du plan comptable de Sage 100) dans `comptabilite-service`
  (tenu par B) ; écrans FE-147 (exporter la liste des clients, CSV ou Excel) et FE-148 (plan propre à l'écran). Règle
  retenue : un compte propre est une subdivision d'une racine du référentiel, pour que la liasse reste juste.
  Toutes non slottées : à placer au prochain plan.
- **Des factures aux écritures (2026-11-18, demande de l'utilisateur)** : STORY-1097 (facture → écriture proposée en
  partie double, achats et ventes, système normal), 1098 (mémoire des choix du cabinet pour les écritures), 1099
  (mémoire des choix pour les cahiers) ; écrans FE-149 (factures en écritures) et FE-150 (suggestions reprises).
  Jamais d'écriture sans relecture ; la proposition dit toujours sa source. Non slottées.
- **Cloisonnement par cabinet et archives (2026-11-18, demande de l'utilisateur)** : STORY-1097 → 1099 et FE-150
  amendées. Toute mémoire appartient au cabinet ; le même client suivi par deux cabinets ne partage rien (test à deux
  cabinets obligatoire). STORY-1100 (document-service, ged) : la mémoire de classement des archives, et les factures
  comptabilisées versées au fonds du client ; écran FE-151. Non slottées.
- **Passation** : `prospera-frontend-expert-comptable` reste tenu par A pour le lot 4 (FE-034) ; dernier commit sur
  `dev` : `6796601`.

### Lot 3 (depuis le 2026-11-17) — l'état courant

- ✅ **LOT 3 DE A TERMINÉ (2026-11-17) — en attente du plan suivant.** 920 → 929 : dix stories, toutes DONE le jour même.
- ~~10. **STORY-929**~~ ✅ **DONE (2026-11-17)** — prospera-recette **#25** (dev `f7944dc`). **Recette croisée complète, jouée une fois sur pile neuve : 10 suites sur 10, 134 tests sur 134, 1 044 s** (`grp-a`, volumes neufs, `RECETTE_ESPACE=ESSAI`, images des onze services construites depuis `origin/dev` par `git archive`, fiscal en surcouche, `down -v` ensuite : plus rien de `grp-a`, verrou rendu) ; **3 essais avant** (deux assertions fausses de ma recette, puis deux `ECONNRESET` sur un poste à 691 Mo libres, remède : `docker desktop restart`). **D-929-1 (b)** : le cabinet **reste installé par le `PUT`** de la console : `POST /installations` exige que chaque vérification du manifeste réponde VERT, et ni balance ni bilan ne servent leurs six routes `…/verifications/…` ; ce sont de petites routes chez A mais une story de service, que la règle de légèreté interdit ici. Rien n'est bloqué chez B. La recette **éprouve** le moteur : `POST /installations` de `conseil` s'arrête `EN_ATTENTE`, première vérification `NON_EXECUTEE`, module fermé (ce test s'inverse quand les routes existent). Ticket `verifications-de-balance-et-de-bilan-non-servies`, **story nommée STORY-1080** (id proposé, max réservé 1079). **Parcours ajoutés à `cabinet-moteur`** : complétude du dossier (924) ; relais BFF `PATCH /dossiers/{id}` **contre le vrai `dossier-service`** (succès, puis `409 CONFLIT_CONCURRENT` relayé, `message` = le code, rien d'écrit) (923) ; C13 (928) dans l'espace d'essai : jeton du moteur d'`auth-service`, import de `cabinet-demo-togo` (`IMPORTE`, rejeu `DEJA_IMPORTE`, utilisateur 403, sans jeton 401, `bilan` 422 `OBJET_INCONNU`), effacement `EFFACE` puis `DEJA_EFFACE` sur balance et bilan ; l'habilitation de référentiel vient de l'installation (le `PUT` pose le référentiel), rien posé à la main. **D-929-2** : l'espace est un réglage de la pile, `RECETTE_ESPACE` (défaut `REEL`), posé sur **tous** les services qui lisent l'état publié (catalogue, notification, paiement, balance, bilan, dossier, fiscal), pas sur balance et bilan seuls : un service ne lit que le topic de son espace. **D-929-3** : images construites depuis des extractions `git archive origin/dev`, pas depuis les checkouts (ils sont sur d'autres branches et appartiennent à d'autres sessions). Fiche : `stories/STORY-929.md`.
- **Bilan du lot 3 de A (920 → 929)** — *Livré* : MinIO à la norme (920) ; 5e origine `comptabilite` du hub (921) ; code mort de la double lecture retiré (922) ; relais BFF `PATCH /dossiers/{id}` (923) ; complétude du dossier (924) ; référentiel effectif par dossier, déclaré (925) ; provenance de chaque ligne de balance, FE-075 débloquée (926) ; jeu `cabinet-demo-togo` (927) ; routes C13 d'import et d'effacement (928) ; clôture et recette complète 134/134 (929). *Ouvert* : (1) **STORY-1080**, les six routes de vérification de balance et de bilan (puis `PUT` hors de la recette) ; (2) le **dossier de démonstration** n'existe que dans balance (ticket `dossier-de-demonstration-sans-creation-par-le-moteur`) : valider la balance de démonstration et la voir dans bilan reste à faire ; (3) `refuseeEnLectureSeule` sans appelant (dette 922) ; (4) relais BFF de la complétude, à la demande de l'écran (924) ; (5) la console doit migrer vers les routes d'installation (lot de D) ; (6) `ajv` 8 au premier niveau du lock (928). *Décisions contestables à rappeler au PO* : **D-923-1** (relais BFF réservé à `TENANT_ADMIN`, un collaborateur simple a 403 tant que D12 n'a pas son 409 muet) et **D-923-2** (refus relayés par code seulement, liste fermée de 11, jamais le texte amont) ; **D-924-1** (`dirigeants` bloquant seulement si la forme juridique en exige un) ; **D-925-1** (`referentielComptable` déduite du paquet servi, `SN`/`SMT` ⇒ SYSCOHADA) ; **D-926-2** (balances déjà stockées : `NON_ENREGISTREE`, pas de migration) et **D-926-6** (route sous `/balance/`, pas `/balances/`) ; **D-927-3** (le jeu suit les formats des services, pas un format neuf) ; **D-928-3** (dossier de démonstration dérivé et projeté dans balance seul) ; **D-929-1** (le `PUT` reste) et **D-929-2** (espace de la pile en un réglage ; `ESSAI` pour toute la pile de la recette de démonstration, jamais par défaut).
- **→ B (2026-11-17) : rien à changer chez toi pour 929.** Le moteur fait ce qu'il doit : un plan refuse d'ouvrir un module dont les vérifications ne répondent pas, et la recette le prouve. Information : le catalogue de la recette n'a pas `INSTALLATION_SERVICES` (voulu : sinon le `PUT` n'est plus « différé » et échoue) ; il devra le recevoir au moment de STORY-1080. — information.
- **→ D (2026-11-17) : la console ne doit pas retirer le `PUT` des droits avant STORY-1080** (installation par le moteur impossible pour balance et bilan sans les vérifications). — information.
- **Pièges (929)** : (1) `INSTANCE_ESPACE=ESSAI` sur balance et bilan seuls casse l'état publié (topic de l'espace) : poser l'espace sur tout ce qui garde. (2) Onze `npm ci` en parallèle ont fait tomber le moteur Docker (500 sur toute l'API) : `COMPOSE_PARALLEL_LIMIT=2`, puis `docker desktop restart`. (3) `ECONNRESET` sur `localhost` à 691 Mo libres : les services sont `healthy`, le poste est saturé ; rendre la mémoire avant la recette de preuve. (4) Les étapes `VERIFIER` qui suivent la première en échec restent `A_FAIRE`. (5) Le `message` d'un refus relayé par le BFF est le code, pas un texte absent. (6) Un heredoc de plus de 150 lignes a échoué en bloc : outil d'écriture.
- **Pour la suite** : à l'arrivée de Dev A (04/12) ou au plan suivant, STORY-1080 en premier (elle débloque la mise en service par le moteur) ; la recette est prête (RECETTE_ESPACE, garde du profil, test D-929-1 à inverser).
- ~~9. **STORY-928**~~ ✅ **DONE (2026-11-17)** — balance #156 (dev `98078b0`), bilan #179 (dev `1651d33`). Les routes C13 d'import et d'effacement des deux services, aux corps exacts de `contrats/instance/` (`contrats-instance-v1`, copies à l'octet gardées par empreinte, validées par `ajv ^8.20.0`). **Garde** : identité de service `MOTEUR` seule (jeton d'`auth-service`, STORY-948, limité à l'organisation du chemin ; un jeton de service n'ouvre aucune autre route) ; **espace d'essai seulement** (`INSTANCE_ESPACE=ESSAI`, sinon 403 `ESPACE_REEL_REFUSE`) ; import limité à `JEU_DEMONSTRATION`, effacement au motif `FIN_ESSAI`. **balance** importe `profil-societe` puis `balance` (BROUILLON, par `submitInSession`, le chemin unique du hub) ; **bilan** n'a aucun objet (tout objet 422 `OBJET_INCONNU`). **Effacement complet** par un plan de 40 (balance) et 22 (bilan) collections, gardé par un test qui lit les schémas réels ; `audit_events` effacée, copies d'identité effacées si l'organisation est leur seule appartenance ; idempotent (`EFFACE` puis `DEJA_EFFACE`, même date). **Dossier de démonstration** : `dossierId` dérivé (sha256) et projeté dans balance seul faute de création appelable dans `dossier-service` (D-928-3, ticket `dossier-de-demonstration-sans-creation-par-le-moteur`). Tests : 19 e2e par service, mutations rouges, **preuve Docker `grp-a` de bout en bout verte (29 contrôles)**. **D-918-4 soldée pour l'import et l'effacement** (restent `verifications/…`, `sante`, `export`, `migrer`). **Suite : STORY-929.**
- **Pour STORY-929** (fiche 928, « Pour STORY-929 ») : (1) les `verifications/…` des manifestes de balance et de bilan ne sont pas servies : la recette `cabinet-moteur` ne peut pas passer à `POST /installations` sans elles, à vérifier au rituel ; (2) `INSTANCE_ESPACE=ESSAI` à poser sur balance et bilan dans la recette, sinon 403 ; (3) jeton du moteur par `POST /api/v1/interne/jetons-de-service` ; (4) l'import de `balance` exige l'habilitation de référentiel (`orgbalanceentitlements`).
- **Pièges (928)** : (1) **`ajv` 8 remplace la 6 au premier niveau du lock** (eslint et webpack gardent la leur imbriquée) : prévoir ce remous au prochain `npm install`. (2) Trois invariants existants lisent tout `src/` : `lecture-profil-par-dossier` (allowlist du profil, 5 → 7), `axes-lecture-unique` (une variable nommée `profil` lue en `.systemeComptable` rougit : la renommer), `dossier-scope.invariant` (le `@Controller` doit porter un chemin LITTÉRAL, pas un gabarit ; compte de contrôleurs de bilan 27 → 28). (3) `Schema.get('collection')` ne rend rien pour un schéma sans `collection` explicite : le nom par défaut est `mongoose.pluralize()(NomDeLaClasse)` (`orgkycstatuses`, `orgbalanceentitlements`). (4) Un `@Prop({ type: Types.ObjectId })` peut ranger une chaîne : le filtre d'effacement cherche l'identifiant sous les DEUX formes. (5) Preuve Docker : un `mongosh --eval` passé par `docker exec` sous Windows perd ses guillemets : `execFileSync('docker', [..., 'sh', '-c', 'mongosh --quiet <base> --eval "$(cat)"'], { input })` ; un témoin laissé par une preuve précédente (index unique de `balances`) fait échouer la suivante : le nettoyer au début. (6) Le compose racine + la surcouche de recette ne posent pas `INSTANCE_ESPACE` : surcouche temporaire hors dépôt pour la preuve. (7) Un `jest` complet lancé avec un `( … ) &` dans la même commande ne laisse aucune sortie : le lancer seul, en arrière-plan de l'outil.
- ~~8. **STORY-927**~~ ✅ **DONE (2026-11-17)** — plateforme #25 (dev `e958bd6`), **données seules** : `jeux-demonstration/cabinet-demo-togo/` (`cabinet-demo-togo@1.0.0`, verticale `CABINET`, graine `20270115`). Une part, le module `balance` : `profil-societe` (1 enregistrement, client fictif « DÉMO NÉGOCE TOGO SARL », NIF/RCCM/CNSS préfixés `DEMO`) puis `balance` (2 enregistrements : exercices 2024 et 2025, 36 lignes chacun, quatre colonnes, équilibrées, sceau v2 de balance-service, ouverture 2025 = clôture 2024 après affectation). `generateur/generer.mjs` (sans dépendance) : même graine, mêmes octets. `npm run jeu:verifier` conforme (3 enregistrements), aussi depuis un `git archive` sans conversion ; jeu témoin de B toujours conforme ; aucun script, contrat, README ni `package.json` de B touché. **`bilan` hors jeu** (D-927-1) : il ne stocke rien à importer, ses états se calculent de la balance validée ; fiscal, consolidation, conseil, ged… sans route C13 en février (`SANS_ROUTE`). Docker non requis. **Suite : STORY-928.**
- **Pour STORY-928** (fiche 927, « Pour STORY-928 ») : importer `profil-societe` avant `balance` ; **`dossierRef` → `dossierId`** à résoudre par l'import (le jeu ne porte aucun identifiant de dossier ; si `dossier-service` n'a pas de création appelable par le moteur, ticket) ; la balance importée est un `balance.submitted` (checksum inchangé), à l'état `BROUILLON` : la démonstration la valide pour que le bilan la reçoive ; la route d'import de `bilan` n'a aucun objet ; l'effacement efface tout, `DEJA_EFFACE` au rejeu.
- **Pièges (927)** : (1) **un nombre de compte n'est pas une classe** : `compte >= 600` prenait `2844` (amortissements) pour une charge, le report à nouveau de 2025 perdait les amortissements et la banque d'ouverture devenait négative ; la classe est le premier chiffre. (2) **Un worktree n'a pas de `node_modules`** : une jonction vers le checkout principal suffit pour `jeu:verifier` (Ajv) mais casse les espaces de travail `@prospera/*` (`npm test` racine rougit en `Cannot find package '@prospera/garde-etat-publie'`) : artefact de la jonction, hors sujet (le dossier n'est pas ramassé par les scripts racines) ; la jonction n'est pas versionnée. (3) Le générateur de barrels de l'éditeur a réécrit `bibliotheques/kit-cible/src/index.ts` et `paquets/point-de-decision/src/index.ts` dans le worktree : `git checkout --` avant le commit, jamais `git add -A`. (4) Il n'existe aucun schéma d'objet pour balance ni bilan (`contrats/objets/` vide, `objetsDeReprise: []`) : le format du jeu est celui des services, écrit dans la fiche (D-927-3). (5) Les sorties de `node` relatives à `/tmp` de Git Bash partent dans `C:	mp` : passer des chemins absolus Windows (`C:/…`) aux scripts Node.
- ~~7. **STORY-926**~~ ✅ **DONE (2026-11-17)** — balance #155 (dev `6df0ce6`). Chaque ligne de balance servie porte **`provenance`** (`CAHIERS` | `FICHIER` | `DIRECTE` | `DERIVEE` | `NON_ENREGISTREE`), dérivée à la lecture de la balance (hors sceau, aucun checksum ne bouge) ; marqueur interne `Balance.adaptateur` posé par le chemin cahiers (le seul qui écrivait `source: ocr` sans rien d'autre) ; route **`GET /dossiers/{id}/balance/{balanceId}/lignes/{compte}/provenance`** : transactions des cahiers du compte (même ventilation rejouée), `pieceId`/`lotId`, totaux, **écart signé** avec la ligne, `409 PROVENANCE_NON_OUVRABLE` / `404`. Balances anciennes : `NON_ENREGISTREE` (valeur nommée, pas de migration : D-926-2). Relu d'abord : STORY-391/392 livrées depuis août ; le ticket ne manquait que la nature de la provenance et la route. e2e agregation 41/41, openapi 223/223, 22 unitaires neufs, mutations rouges x3 sur l'assertion. **Docker non requis** (verrou non pris). Contrat annoncé avant la fusion (#607). Ticket `ligne-de-balance-sans-provenance` **fermé**. **Suite : STORY-927.**
- **→ D (2026-11-17) : FE-075 débloquée par STORY-926 (balance #155, dev `6df0ce6`).** Le contrat existe : `provenance` sur chaque ligne de `GET …/balances/{id}` (enum `ProvenanceLigne`, facultatif ; `NON_ENREGISTREE` ≠ « aucune pièce » : l'écran nomme la raison, il n'ouvre pas de tiroir vide) et `GET /dossiers/{dossierId}/balance/{id}/lignes/{compte}/provenance` pour la balance `CAHIERS` (lignes avec `pieceId`/`lotId` ; ouvrir l'image par `GET /dossiers/{id}/pieces?pieceId=…`, STORY-392 ; `ecart` signé à afficher face au solde, jamais absorbé). Types : `npm run gen:api` depuis balance-service (:3007). ⚠️ Le BFF ne relaie pas ces routes à ce jour (relais à nommer par A si l'écran en a besoin). Je n'ai pas modifié la fiche FE-075 ni le tracker frontend (propriété de D) : la mention `blocked` et la dépendance au ticket sont à lever par D au réancrage (le DoD de la fiche demande de réancrer sur l'OpenAPI vivant). — information.
- **Pièges (926)** : (1) relire le code AVANT la fiche, encore : l'amont (391/392) était livré, et la vraie lacune était que le chemin cahiers n'enregistre pas sa nature (`source: ocr` ambigu), donc impossible à reconstituer pour l'ancien. (2) Le préfixe d'un contrôleur ne se surcharge pas : une route sous `/balances/` demandait un contrôleur neuf déclaré au module (donc Docker) ; placée sous `/balance/` dans `AgregationController` (D-926-6). (3) Les fichiers sont mélangés LF/CRLF (`git diff --stat` identique avec et sans `--ignore-cr-at-eol`) : scripts de remplacement qui détectent et restituent la fin de ligne ; le lint `--fix` avec `endOfLine: auto` reformate sans changer les fins de ligne. (4) `/tmp` de Git Bash n'est pas celui du Python de Windows : passer les chemins en argument. (5) Les `*.module.spec.ts` échouent en `Cannot find module 'bindings'` sous Node v25 (préexistant, prouvé en mettant la story de côté). (6) Un long heredoc avec apostrophes échoue en bloc : écrire le script avec l'outil d'écriture.
- ~~6. **STORY-925**~~ ✅ **DONE (2026-11-17)** — balance #154 (dev `055b423`). `GET /api/v1/dossiers/{dossierId}/referentiels/actifs` rend désormais **`dossierId`** et **`referentielComptable`** (`SYSCOHADA` | `SFD-BCEAO` | `CIMA`, déduite du paquet servi ; `SN`/`SMT` ⇒ SYSCOHADA) : ajouts seuls. La route était **déjà par dossier depuis STORY-422** (versions, empreinte, tampon, paquet fiscal) et 906 y avait mis `tag` : le ticket (19/08) était périmé sur l'essentiel ; le reste était la portée déclarée. e2e : deux dossiers d'un même cabinet (SN / SFD-BCEAO) ⇒ paquets et familles différents, archivé lisible, autre cabinet et inconnu 404, sans cadre ⇒ 409 nommé, formes d'origine intactes. Mutations rouges ×2 sur l'assertion. e2e referentiel + openapi-contract 275/275, unitaires referentiel 470/470, tsc et lint propres. **Docker non requis** (verrou non pris). Contrat annoncé avant la fusion (#602). Ticket `referentiel-effectif-non-resolu-par-dossier` **fermé**. **Suite : STORY-926.**
- **→ D (2026-11-17) : FE-061 peut afficher les versions du référentiel du dossier** : `GET /api/v1/dossiers/{id}/referentiels/actifs` est servie par balance-service (:3007) ; le BFF ne la relaie pas à ce jour (à vérifier côté écran, relais à nommer par A si besoin). Champs : `referentiel {code, version}`, `checksum`, `stamp`, `libelle`, `planCount`, `fiscal`, `tag`, et neufs `dossierId` (à comparer au dossier ouvert) et `referentielComptable`. Types : `npm run gen:api`. ⚠️ `referentielComptable` de cette route (paquet réellement servi) peut différer de celui de `GET /dossiers/{id}` (dérivé du seul `typeEntite`) quand le dossier porte une décision d'axes explicite : l'écran affiche celui de la route des versions, c'est ce qui valide les comptes. — information.
- **Pièges (925)** : (1) relire le code AVANT la fiche : un ticket d'août décrivait une route déjà déplacée par 422 ; la story s'est réduite à deux champs. (2) Un test unitaire qui compare le corps entier (`toEqual`) rougit sur tout ajout : réaligner l'attendu en dur, jamais en relisant la constante. (3) Les fichiers de test sont en LF et les sources en CRLF selon les cas : écrire les scripts de remplacement en lisant `
` dans le fichier ; `git diff --stat` avec et sans `--ignore-cr-at-eol` identiques. (4) Une mutation qui casse la compilation donne « 0 test » : viser une valeur, pas un identifiant.
- ~~5. **STORY-924**~~ ✅ **DONE (2026-11-17)** — dossier-service #55 (dev `768a4aa`). `GET /api/v1/dossiers/{id}/completude` (tout membre dans la portée ; 404 hors portée ; archivé lisible ; lecture pure). Bloquants/optionnels de STORY-079 (`nif` devient `nifSociete`), `dirigeants` bloquant seulement si la forme l'exige (D-924-1). Unitaires 49/49, e2e 157/157, deux mutations rouges sur l'assertion, lint propre. Docker non requis (une route de plus, rien d'autre). Ticket « trois surfaces » **fermé**. Contrat annoncé avant la fusion (PR docs #598). **Suite : STORY-925.**
- **→ D (2026-11-17) : la complétude du dossier est servie par `dossier-service`, mais le BFF ne la relaie pas encore.** L'onglet de la fiche dossier ne peut pas l'appeler depuis la console avant une story de relais BFF en lecture (modèle : STORY-923). Champs rendus : identifiants machine (`nifSociete`, `rccm`, `dirigeants`…), c'est l'écran qui les libelle. — information ; relais BFF à nommer par A si l'écran le demande.
- **Pièges (924)** : (1) un `jest` lancé en tâche de fond dans la même commande que `tsc` peut rendre une sortie vide : relancer séparément. (2) Le test e2e ne peut pas éprouver « SARL sans dirigeant » : la création le refuse déjà (`DIRIGEANT_REQUIS`) ; c'est le unitaire qui porte la mutation. (3) Un heredoc de bash contenant plusieurs blocs `EOF` et des apostrophes a échoué en bloc sans rien écrire : passer par l'outil d'écriture.
- ~~4. **STORY-923**~~ ✅ **DONE (2026-11-17)** — admin-panel #36 (dev `18a9893`). `PATCH /api/v1/dossiers/{id}` relayé par le BFF (`TENANT_ADMIN`, `DossierServiceClient`, `DOSSIER_SERVICE_URL` facultative) ; version dans le corps (pas d'`If-Match`) ; refus relayés par code HTTP + code (liste fermée de 11), **sans texte** ; OpenAPI du BFF à jour. Unitaires 43/43 (533), e2e 13/13 (232), 2 mutations rouges sur l'assertion. `docker compose up` admin-panel (grp-a, `--no-deps`) healthy, route mappée ; pile retirée, verrou rendu. **Suite : STORY-924.**
- **→ D (2026-11-17) : la route est disponible pour l'écran de la fiche dossier** (onglet Identité) : `PATCH /api/v1/dossiers/{id}` sur le BFF (:3010), corps `ModifierIdentiteDossierDto` (`version` lue au `GET`, `null` retire un champ facultatif). Sur `409` lire `code` (`CONFLIT_CONCURRENT` = recharger et rejouer ; `DOSSIER_ARCHIVE`, `DOSSIER_NIF_DEJA_UTILISE`…) : **le BFF ne fournit aucun texte**, l'écran écrit le sien. Types : `npm run gen:api` depuis l'OpenAPI du BFF. Réservé `TENANT_ADMIN` (un collaborateur simple a 403 : D12 demande d'abord un 409 muet côté dossier-service). — information.
- **Pièges (923)** : (1) le BFF n'avait AUCUN relais de `dossier-service` : le « motif des routes de dossier déjà relayées » du brief n'existait pas ; le motif suivi est celui des proxys d'écriture (`UpstreamClient.patch`, `rethrowUpstreamError`). (2) Règle du BFF (STORY-378) : jamais de corps amont relayé : on garde statut + code d'une liste fermée, le champ `message` porte le code (le filtre en exige un). Un 400 de `class-validator` sans code rend un 400 générique. (3) `forbidNonWhitelisted` global : les champs d'identité sont déclarés `@Allow()` sans type (aucune conversion implicite). (4) Les fichiers du dépôt sont en CRLF : les scripts de remplacement doivent le respecter ; les heredocs > ~180 lignes n'écrivent rien (outil d'écriture).
- ~~3. **STORY-922**~~ ✅ **DONE (2026-11-17)** — balance #153 (dev `e67034a`), bilan #178 (dev `557d402`), fiscal #53 (dev `4ee8ed7`). `decisionAncienne`, `memeDecision`, `libelle` et `DroitLu` retirés de `double-lecture.ts` (aucun appelant : code, tests, autres dépôts) ; `decisionPubliee` et `EtatPublieLu` gardés ; trois copies identiques (comparées par `diff`). Aucun champ de contrat touché (les `libelle` du paquet fiscal et des balances sont d'autres symboles). tsc, lint, read-models : balance 26/26 suites (336 tests), fiscal 14/14 (179, `-w 2`), bilan 32/34 : les 2 échecs (`read-models.module.graphe.spec.ts` : `Cannot find module 'bindings'` ; `dossier-scope.invariant.spec.ts`) sont **préexistants**, identiques sur `origin/dev` (stash de la seule modification, mêmes deux fichiers). Docker non requis. **Suite : STORY-923.**
- **Piège (922)** : le Node du poste est v25 ; `bindings` (client Kafka natif de Confluent) casse les suites qui chargent le module de lecture de bilan (ne touche pas les dépendances ; elles se jouent sous Node 24 dans l'étage `verification`). `dossier-scope.invariant.spec.ts` (bilan) met 270 s en parallèle complet et échoue aussi sur `dev`. Dette nouvelle : `refuseeEnLectureSeule` (`lecture-seule.ts`) n'a plus d'appelant hors de son spec, dans les trois dépôts ; à retirer avec son spec au prochain passage sur ces gardes.
- ~~2. **STORY-921**~~ ✅ **DONE (2026-11-17)** — balance #152 (dev `9dfd60e`). Origine `comptabilite` dans `ORIGINES_BALANCE`, publiable par ingestion directe ; mutations rouges sur l'assertion ; e2e OpenAPI 221/221 ; Docker non requis. **Suite : STORY-922.**
- **→ B (2026-11-17) : l'origine `comptabilite` est disponible pour B-967** (dev `9dfd60e`, balance-service). Forme attendue de la balance sur `balance.submitted` v1 : `balance.source = "direct"`, `balance.origine = "comptabilite"`, `dossierId` requis, `exercice`, `version` ≥ 1 (lignée propre à l'origine), `lignes` aux QUATRE colonnes de montant en unités mineures entières (SANS `aNouveau*`), `checksum` = SHA-256 de `{ exercice, source, referentiel, version, lignes triées par compte }` (voir `INTEGRATION.md` §1 ter), `referentiel` facultatif : omis, le hub le résout depuis le dossier, mais le sceau porte quand même ce tag. `sourceSystem` à faire ajouter à l'allowlist `INGESTION_SOURCE_SYSTEMS`. Balance GÉNÉRALE (pas une contribution partielle) : le hub chaîne le socle d'à-nouveaux de l'exercice, donc n'envoyer que les mouvements de l'exercice. Retours : `balance.created` ou `balance.rejected` (codes stables). — ouverte jusqu'à B-967.
- **Piège (921)** : le plan parlait de « 4 origines, la 5e `comptabilite` » ; le code a 3 sources (`sage`, `direct`, `ocr`) et 5 origines (`A_NOUVEAUX`…`INVENTAIRE`). Lecture retenue : `comptabilite` est une ORIGINE (6e symbole de `ORIGINES_BALANCE`, la 2e publiable), sur `source: direct` (D-921-1) ; contestable par B si elle attendait une source.
- ~~1. **STORY-920**~~ ✅ **DONE (2026-11-17)** — recette #24 (dev `68ef348`) ; compose racine du poste principal modifié en
  place (non versionné). Image `cgr.dev/chainguard/minio:latest`, `user: '0'` ; garde du profil réalignée (18/18,
  mutation rouge) ; pile neuve `grp-a` : recette `zone-franche` 5/5, `mc ls` voit les artefacts dans MinIO. Pile
  descendue avec ses volumes, verrou rendu. **Suite : STORY-921.**
- **Piège (920)** : l'image de Chainguard est distroless (ni `curl` ni `mc`) : pas de healthcheck `CMD` possible, MinIO
  reste en `depends_on: service_started` comme avant. Le client est `cgr.dev/chainguard/minio-client:latest-dev`
  (`--entrypoint sh`, sur le réseau de la pile). Un `docker compose down` sans le fichier fiscal laisse
  `fiscal-service` et `mongo-fiscal` : les passer tous les `-f` du `up`, ou `docker rm -f -v`.
- **Piège (920)** : le générateur de barrels de l'éditeur recrée des `index.ts` entre deux commandes : purger
  (`git ls-files --others`) dans la MÊME commande que le build.

### Lot 2 (depuis le 2026-11-16) — l'état courant

- **Consigne de l'utilisateur (2026-11-16)** : « prends le groupe A pour le terminer, celui du lot 2 » : STORY-905 →
  919 dans l'ordre du §2, sans s'arrêter ; remplaçante du §2 si une story attend B (917, 918 attendent B-945 ; 919
  attend B-949). C tourne sur le même poste : verrou `MoneyVibes_Apps\.verrou-docker`, piles `grp-a-…`.
- ~~1. **STORY-905**~~ ✅ **DONE (2026-11-16)** — balance #145 (dev `4a2abec`), bilan #173 (dev `663063d`). La garde
  d'accès lit `@LectureSeule()` ; `ROUTES_SANS_ECRITURE` déclarée (4 routes balance, 8 bilan) et balayée sur tous les
  contrôleurs ; 4 mutations rouges ; pile `grp-a-905` : dry-run en 200 avec un droit échu (témoin dev : 403).
- ~~2. **STORY-906**~~ ✅ **DONE (2026-11-16)** — balance #146 (dev `921b333`). `dossierId` publié ; `tag` servi par
  `…/referentiels/actifs` ; `409 REFERENTIEL_CONTRADICTOIRE` (`details`) ; import Sage au tag du dossier. Pile
  `grp-a-906` : SFD ⇒ `SN` refusé, `SFD-BCEAO` 201 ; témoin dev : `SN` accepté.
- ~~3. **STORY-907**~~ ✅ **DONE (2026-11-16)** — balance #147 (dev `7a885bb`), dossier #48 (dev `249b2ed`), fiscal #47
  (dev `8487497`). Paquet `togo@2026` régénéré (sha256 **`e8e94c84…`**, était `17d66e23…`) : `TPU`, `TPU_ACOMPTE`, `RSH`
  au catalogue ; conformité fiscal 65/65 (rs-fiscal) ; recette `zone-franche` 5/5 sur les branches. Le test TPU
  « CA 18 M » réaligné. ⚠️ **La procédure de publication du paquet (plus bas) cite encore `17d66e23…`** : l'empreinte
  à publier est désormais `e8e94c84…` (mise à jour ici).
- ~~4. **STORY-908**~~ ✅ **DONE (2026-11-16)** — balance #148 (dev `985e8d1`), bilan #174 (dev `982c2db`). Node 24,
  client de Confluent ; deux défauts du patron de 950 trouvés et corrigés (relance sur consommateur neuf ; `/health`
  borné à 5 s) — **demande à B et C** ci-dessous. Recettes `zone-franche` + `atelier-balance` **56/56 depuis `dev`**
  (valent aussi pour 907).
- ~~5. **STORY-909**~~ ✅ **DONE (2026-11-16)** — fiscal #48 (dev `a552d77`). Node 24, client de Confluent, les deux
  correctifs de 908 ; conformité 65/65 sous Node 24 ; pile : topic neuf vu en 6,6 s, `/health` 503 en 6,8 s sans Kafka,
  200 en 16 s au retour. Recette depuis `dev` jouée au gate de 910 (qui recette la même pile).
- ✅ **Relecture de `kit-cible` 1.0.0 (demande de B)** : `coordination/relecture-kit-cible-1.0.0-groupe-A.md`. Verdict :
  **1.0.1 nécessaire** (D1 bloquant : une clé en double dans un lot perd une ligne en silence ; D2 messages hors
  contrat ; D3 montants requis non appliqués ; trous de la suite : cloisonnement, atomicité, `controles`).
- ~~6. **STORY-910**~~ ✅ **DONE (2026-11-16)** — dossier #49 (dev `2e7e0dc`), kyc #28 (dev `d4932c6`). Node 24 : 113/113 et
  50/50 suites ; pile : topic neuf vu en 3,2 s par dossier, `/health` 503 en 3,1 s sans Kafka, 200 en 8 s au retour.
- ~~7. **STORY-911**~~ ✅ **DONE (2026-11-16)** — BFF #34 (dev `84120a5`), recette #21 (dev `979ec45`). BFF sous Node 24
  (41/41), coupe-circuit de 903 rejoué (20/20 en 200) ; piles de recette sur **MongoDB 8.0** ; garde du profil de
  recette réalignée (rouge sur `dev` depuis 933/938). **Recettes `pile` + `zone-franche` + `atelier-balance` : 63/63
  depuis `dev` sur MongoDB 8.0.38** — valent pour 909, 910 et 912.
- ~~8. **STORY-912**~~ ✅ **DONE (2026-11-16)** — balance #149 (dev `390775c`), bilan #175 (dev `d2e900b`). Garde partagée en
  double lecture ; pile : `LECTURE_SEULE` publié ferme l'écriture en 0,1-4,6 s, un rejeu ancien ne rouvre rien.
- ~~9. **STORY-913**~~ ✅ **DONE (2026-11-16)** — fiscal #49 (dev `6d424cc`), dossier #50 (dev `45f8ecd`). Garde
  partagée en double lecture dans fiscal et dossier.
- ~~10. **STORY-914**~~ ✅ **DONE (2026-11-16)** — balance #150, bilan #176, fiscal #50, dossier #51. Préavis de 30 j,
  horloge injectée, liste blanche d'export et d'états (FR-43) tenue par un invariant.
- ~~11. **STORY-915**~~ ✅ **DONE (2026-11-16)** — dossier #52. `axesDetermines` par ligne du portefeuille ; ticket fermé.
- ~~12. **STORY-916**~~ ✅ **DONE (2026-11-16)** — dossier #53. `PATCH /dossiers/{id}` journalisé ;
  `?type=MANDAT_ATTESTE` ; ticket « trois surfaces » : 1 et 3 fermées, **2 (complétude) ouverte**.
- ~~13. **STORY-917**~~ ✅ **DONE (2026-11-16)** — recette #22, BFF #35. Recettes sur le point de décision ; la console
  relaie les routes d'installation du moteur. Recettes depuis `dev` 87/87.
- ~~14. **STORY-918**~~ ✅ **DONE (2026-11-16)** — balance #151 (dev `e282c22`), bilan #177 (dev `68c6de8`), fiscal #52 (dev `a587b88`),
  dossier #54 (dev `d6dfac5`), recette #23 (dev `58ebabd`). Les gardes décident par l'état publié seul, **inconnu ⇒
  refus** ; mutation (ancienne garde rebranchée) rouge ×4 ; recettes sur pile neuve **91/91**, dont la nouvelle
  `cabinet-moteur` (inconnu refusé, installé par le moteur ouvert, `SUSPENDU` garde l'export). Deux défauts de recette
  corrigés au passage (`abonnement` dépendait de l'ordre ; `cabinet-moteur` sans axes).
- ~~15. **STORY-919**~~ ✅ **DONE (2026-11-16)** — fiscal #51. `/moi/droits` en double lecture dans la garde fiscale ;
  la décision reste celle du jeton.
- **Lot 2 de A terminé.** À l'ordre de la mise en service : `migrate:reamorcage-moteur` du catalogue (945) **avant** les
  images de 918 (D-918-3), sinon un cabinet installé avant le moteur est refusé.
- **Pièges (918)** : (1) une recette ne doit rien attendre d'une autre : sur une pile **neuve** (`down -v`), `abonnement`
  rendait 422 parce que `sfd-bceao@2.0` n'était déclaré que par `referentiel-par-dossier` ; une pile réutilisée cachait
  le défaut (917 « verte seule »). Rejouer les recettes sur une pile neuve avant de fusionner. (2) `zone-franche` lève
  fiscal-service en cours de passage : sur ce poste saturé, des appels voisins prennent `ECONNRESET` ; seule, sur la
  même pile, elle passe. (3) Un passage jest complet dans une image, sur un poste chargé, laisse des échecs de minutage :
  relancer **par chemin de fichier**, jamais par `-t` (qui charge toutes les suites).
- **Pièges (910-912)** : (1) l'éditeur régénère des `index.ts` dans **toutes** les copies, y compris celles de B, et
  casse les builds Docker depuis la copie de travail ⇒ construire les images depuis `git archive origin/dev`, et pour
  une recette, une surcouche qui remplace chaque `build` par ces images (`build: !reset null` + `image:`) ; ne jamais
  `git add -A` (un commit a embarqué 31 `index.ts`, retirés avant de pousser) ; (2) le DNS de Docker vers
  `auth.docker.io` tombe par moments : la directive `# syntax` échoue ⇒ `DOCKER_BUILDKIT=0` ; (3) un `sed` sur
  `production$` a changé `ENV NODE_ENV=production` en `production.` (BFF en boucle de redémarrage, corrigé).
- **Piège (913-916)** : `git archive` applique `core.autocrlf` du poste : l'archive d'une branche porte des CRLF
  et les empreintes des artefacts embarqués tombent (paquet fiscal `15de8f3e…` au lieu de `e8e94c84…`, 1 419 échecs
  sur bilan). **Toujours `git -c core.autocrlf=false archive`.** Contrôler par `sha256sum`, pas par `grep -c $''`
  (un JSON d'une ligne n'en montre aucun).
- **Piège (913-916)** : le DNS de la VM Docker est retombé (`registry.npmjs.org` introuvable) : un `npm ci` non
  caché échoue au build ; attendre, ou réutiliser une couche en cache.
- **Piège (909)** : le build de fiscal vérifie l'empreinte de ses artefacts (`paquets-depot/assets`,
  `completude-depot/assets`) ; une copie de travail Windows les a en CRLF ⇒ `PAQUET_DEPOT_INTEGRITE` au `nest build`.
  Réextraire en LF (`rm` puis `git -c core.autocrlf=false checkout --`) avant une image construite depuis la copie.
- **Piège (906)** : le `docker-compose.override.yml` racine monte le dépôt et lance `start:dev` ; une preuve sur
  image se lève avec `docker compose -f docker-compose.yml`. Le générateur de « barrels » de l'éditeur recrée des
  `index.ts` pendant la session : les purger avant chaque build.
- **Docker** : aucune pile de A ne tourne (piles de 918 descendues avec leurs volumes, verrou rendu). Deux conteneurs arrêtés d'une
  session précédente restent : `grp-a-kafka-1`, `grp-a-karapace-1`.

### Lot 1 (14 → 15/11), archivé

- **2026-11-14 (soir)** : journal ouvert. Prochaine étape : la relecture de STORY-299, 300, 365 et 563 (§3.1).
- **2026-11-14 (soir)** : STORY-569 livrée (fiscal #39, notification #86) ; elle sort du lot, remplacée par STORY-345.
  Le lot se termine par la relecture de tout ce qu'ont fait les quatre groupes (§3.4).
- Déjà fusionné le 14/11 par les deux sessions de la journée : STORY-178, 177, 175, 174, 365, 176, 100, 563, 567, 568
  (et 293 clôturée) ; STORY-299, 298, 300, 362, 305 → 312.
- **2026-11-15** : **STORY-901 DONE** (balance #143, dossier #47, fiscal #40, recette #16 ; docs #479, #482, #483).
- **2026-11-15** : **relecture §3.1 faite** (299, 300, 365, 563) →
  `coordination/relecture-groupe-A-2026-11-14.md`. Aucun bloquant dans le code livré. La migration de 563 est
  **jouée** sur la pile de recette et **inscrite** au README de fiscal-service (« Mise en service », **fiscal #41**,
  fusionnée).
- **Machine** : poste principal (Windows). **Docker** : aucune pile ne tourne. `recette100` est arrêtée (conteneurs conservés), `grp-a` descendue avec ses
  volumes.
- **Consigne de l'utilisateur (2026-11-15)** : A termine son lot, **puis fait le lot de B** (§4, B n'a pas démarré),
  puis finit par la story du seed du catalogue (`fiscal-tg-*` octroyables pour `declarations`, voir « Questions »).
  Les stories s'enchaînent **sans s'arrêter** (la consigne d'un `/clear` après chaque story est annulée). **Ce
  journal reste la mémoire du lot** si le contexte d'une session est résumé.
- **Lot de A, ordre à jour** :
  1. ~~relecture §3.1~~ ;
  2. ~~restes §3.2~~ : ticket pour D écrit, procédure écrite (voir « Procédures »), question 300 retenue par
     défaut ; STORY-903 nommée (fiche juste avant de la coder) ; la partie bloquée de 901 (texte de la loi 2011-018 :
     un scan sans texte) est consignée dans sa fiche (D-901-5) ;
  3. ~~STORY-901~~ ;
  4. ~~STORY-345~~ : **fiscal #42** (base de rémunération versionnée, D-345-1 → 5) ;
  5. ~~STORY-902~~ : **auth #37**, puis **fiscal #43** (rôles du cabinet, rôle par défaut du vertical, fin de la
     compatibilité) ;
  6. ~~STORY-903~~ : **admin-panel #33** (coupe-circuit du catalogue, fan-out borné) ;
  7. ~~STORY-313~~ : **fiscal #44** (aiguillage, état daté d'un tiers) ;
  8. ~~STORY-314~~ : **fiscal #45** (montant à saisir, contre-métrique) ;
  9. ~~STORY-904~~ : **fiscal #46** (garde du jeu de répliques, sérialisation fermée, conformité) ;
  10. ~~relecture finale §3.4~~ : `coordination/relecture-finale-groupe-A.md`.
- 🏁 **LOT DE A TERMINÉ (2026-11-15).** Docker éteint ; passations écrites (notification `8916ee4`, auth `456035f`) ;
  relecture finale livrée. **Suite (consigne de l'utilisateur) : le lot de B** (§4, STORY-930 → 939), tenu par cette
  session, qui écrit désormais aussi dans `journal-groupe-B.md`. **Puis** la story du seed du catalogue. La relecture
  finale sera **rejouée** à la fin du lot de B.
- **STORY-904 réservée par A** (fiche à écrire juste avant de la coder) : *le fiscal tient sur un vrai MongoDB*.
  Elle couvre :
  - le refus de démarrer sans jeu de répliques ;
  - la sérialisation canonique fermée (`Date`, `ObjectId` et `Buffer` refusés) ;
  - une course sur un même périmètre d'audit ;
  - l'atomicité de l'audit et de l'écriture ;
  - le rejeu de la dérivation sur une obligation d'avant 563.

  Le tout est prouvé par `test:conformite`.
- **STORY-902 élargie** par la relecture :
  - côté fiscal : fin du mode de compatibilité (mode strict), fait d'audit marqué `via` (jeton ou rôle), test
    d'invariant « toute route d'écriture est décorée » ;
  - côté auth-service : la borne du jeton contrôlée **à l'attribution** d'un rôle ou d'une surcharge
    (`@ArrayMaxSize(50)` ramené à 44), un 4xx nommé au lieu du 500 `JETON_HORS_BORNE`, et des tests de connexion et
    de rafraîchissement hors borne.

## Dépôts tenus

`prospera-balance-service`, `prospera-bilan-service`, `prospera-dossier-service`,
`prospera-kyc-service`, `prospera-admin-panel-service`, `prospera-recette`. Plus ni `prospera-notification-service`
ni `prospera-auth-service` : tous deux sont cédés à B (voir Passations).

## Passations

- **2026-11-24 : `prospera-fiscal-service` rendu à C**, dernier commit sur `dev` : **`0596fc4`** (STORY-328 fusionnée, #57). A n'y touche plus ; détail dans « Lot 6 » ci-dessous (ligne « Passation A → C »).
- **2026-11-14 : `prospera-notification-service` cédé à B**, dernier commit sur `dev` : `8916ee4`
  (STORY-569 livrée). A n'y touche plus.
- **2026-11-15 : `prospera-auth-service` cédé à B**, dernier commit sur `dev` : **`456035f`** (STORY-902 fusionnée).
  A n'y touche plus. À reprendre par B :
  - STORY-938, droits à tiret dans les trois segments (demande ci-dessous) ;
  - la console, qui affiche « sans rôle métier » pour un membre qui reçoit le rôle par défaut. L'API
    d'administration rend le `tenantRole` stocké, pas le rôle effectif (écart de STORY-902).
- **2026-11-14 (nuit) : FE-069 remise à D** (sur demande de l'utilisateur), branche **`fe-069`** poussée
  dans `prospera-frontend-expert-comptable`, commit **`4148d65`**, sans PR. A ne touche plus ce dépôt.
- **2026-11-15 : FE-069 et `prospera-frontend-expert-comptable` REVIENNENT à A** (décision de l'utilisateur : « le
  travail a été remis au groupe D, qui n'a pas démarré ; il faut que quelqu'un la reprenne cette semaine »). Le
  journal de D dit « lot pas encore commencé » ; aucun commit de D sur `fe-069` (tête `4148d65`, la mienne). A tient
  le dépôt **jusqu'à la fusion de FE-069**, puis le rend à D par une ligne ici. D garde `frontend-admin-panel` et
  `prototypes/`. Amendement : `PLAN-4-SESSIONS-2026-11-14.md` §2 et §6.

## Demandes aux autres groupes

- **→ A (2026-11-23), remplacée** : la session C recopie elle-même la **0.4.0** (consigne de l'utilisateur). Pour
  mémoire, la demande d'origine : recopier le manifeste `comptabilite` **0.3.0** au catalogue
  (`copies.json`). Source : `manifestes/comptabilite.manifest.ts` (cette PR), identique à l'octet près à
  `src/module.manifest.ts` de comptabilite-service sur `dev` (`cd737dd`). Seul ajout depuis 0.2.0 : deux routes de
  lecture, `GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/factures/lots` et `…/factures/lots/{lotId}`.

- **→ B (2026-11-21) : recopier le manifeste `comptabilite` dans le catalogue** — STORY-1094 ajoute quatre routes de lecture à `routesLectureSeule` de `manifestes/comptabilite.manifest.ts` (stories, `main`) et à la copie du service ; `copies.json` du catalogue est à regénérer (`manifestes:garde`) à la prochaine passe. Version du manifeste inchangée. — **ouverte**
- **→ B (2026-11-19) : relais du BFF `admin-panel-service` pour la console** (tri du bloc C d'AP-54, prospera-stories #732).
  La console ne peut afficher ces fonctions que si le BFF les relaie :
  - `mises-en-service`, `sorties-essai`, `naissances` (AP-56) ;
  - `essais` : prolonger, signer, jeu de démo, effacement (AP-57) ;
  - `etat-publie` d'une organisation (AP-55) ;
  - le champ `vertical` dans `/admin/orgs` (AP-59).
  Les relais `/offre` et `/installations` existent déjà. Aucun id de story backend n'est réservé par A : B le prend dans
  sa plage. Pas urgent : AP-55 → AP-59 sont non slottées, et AP-55 attend de toute façon STORY-1080.

- **→ C (2026-11-18, suite) : deux réponses de plus** — **ouverte** (à lire au rituel).
  - **Le vocal : tranché, texte seulement.** STORY-1017 (déclaration rapide) pré-remplit la fiche depuis le **texte** d'un
    message WhatsApp ou d'un e-mail ; un vocal reçu est rangé comme pièce, non lu (FR-35, D13). Le vocal reste « bientôt ».
  - **FR-73 corrigé** (PRD assurance, 2026-11-18) et **STORY-1018 écrite pour toi** (`stories/STORY-1018.md`, prête) :
    arrêter l'évaluation à l'indemnité proposée (700 000) ne doit plus exiger de motif ; `jugerLArret` ne compare
    aujourd'hui qu'au décompte au franc (702 000), et le refus ne cite que `calcule`.

- **→ B (2026-11-18) : réponses de l'utilisateur à tes questions au PO** — **ouverte** (à lire au rituel de ta
  prochaine story ; A ne les recopie pas dans ton journal).
  - **D-961-1 renversée** : un plan SMT **propre**, comme l'AUDCIF le prévoit (journal de trésorerie : recettes et
    dépenses), au lieu des six journaux du système normal ⇒ **STORY-973**, réservée pour toi.
  - **D-951-8** : la story de l'invitation au réel **doit exister avant février** ⇒ **STORY-974**, réservée pour toi,
    à mettre en tête de ton prochain lot (route d'invitation pour l'identité de service du moteur dans auth, AD-15).
  - **D-972-6 et D-972-9 : oui aux deux.** Les quatre modules sans routes C13 (`facturation`, `approvisionnement`,
    `entrepot`, `conquete-objectifs`) restent hors de l'offre d'essai jusqu'à leurs routes ; les comptes du bureau
    prennent tes clés et rôles par défaut (`AKOSSIWA`, `MENSAH`, `YAWA`, `AYITE` ; `COM-nn`), avec l'ajout facultatif
    `comptes` à `jeu-demonstration@1` (toi) et le fichier des comptes du jeu (D).
  - **Ta question à A (970)** : rouvrir N quand N+1 est OUVERT ? **Non**, rien ne change chez A.
  - Sans réponse de l'utilisateur, **restent retenus par défaut** : D-960-10 (manifeste `automatisations` réaligné sur
    l'annexe B), D-960-12 (aucun rôle par défaut au distributeur), D-955-2 (ni NestJS ni MongoDB ni Kafka au premier
    incrément de l'agent et de la centrale), l'ADR « droits hors du jeton » (938).

- **→ C (2026-11-18) : réponses de l'utilisateur à tes questions au PO** — **ouverte** (à lire au rituel).
  - **Q de 1002 (`sinistres.declaration.enregistree@1`) : oui, ta proposition, avant la démo** ⇒ **STORY-1015**, avec
    `sinistres.garantie.decidee@1`.
  - **La déclaration rapide** ⇒ **STORY-1017** (FR-34, FR-35, EPIC-206, EPIC-217). L'utilisateur veut une page de
    déclaration rapide, avec la fiche pré-remplie depuis un message WhatsApp, comme l'écran « Déclaration assistée » de
    la démo (`prospera-font-end/prospera-assurance`, `src/components/ia/DeclarationIA.tsx`, page `/dossiers/nouveau`).
    ⚠️ **Le vocal** : la démo a un bouton « Importer un vocal » (transcription factice) ; le PRD l'écarte (FR-35, D13 :
    un vocal reçu est rangé comme pièce, non lu). Question reposée à l'utilisateur le 18/11 ; en attendant, FR-35 tient.
  - **D-1010-4 (702 000 ou 700 000), tranchée selon les règles** (R8 des arbitrages, FR-73, H-060) : le décompte
    s'affiche au franc, ligne à ligne (780 000 − 78 000 = **702 000**) ; l'**indemnité proposée** (un montant calculé
    par le système, le repère) est arrondie au multiple de 5 000 le plus proche : **700 000** ; le **montant arrêté**
    par le gestionnaire reste au franc et n'est jamais pré-rempli (FR-75). C'est ce que 1010 rend déjà
    (`indemniteCalculee`, `reperePropose`) : l'écran montre les deux, nommés. À corriger dans le PRD : FR-73 appelle
    702 000 « un repère déjà arrondi », c'est faux. Le pas de 5 000 reste un paramètre (`arrondi_indemnite_fcfa`).
  - **D-1013 : oui**, l'arrêt de l'évaluation propose la provision (motif `EVALUATION`, FR-76) ⇒ **STORY-1016**.
  - **Gardés** : D-981-1/2 (`compta-cima` éteinte par défaut), D-980-3 (pas de KYC dans la garde de `sinistres`),
    D-983-8 (liste des champs de santé : éprouvée par un test au déploiement).
  - **Grille de vétusté de la compagnie** (D-1012) : pas de sitôt ; la grille indicative de la démo (H-059) reste.

- **→ D (2026-11-18) : réponses de l'utilisateur à Q-D-1 → Q-D-10** — **ouverte** (à lire au rituel).
  - **Confirmées** : Q-D-1 (KYC exigé partout), Q-D-2 (une personne sur plusieurs branches), Q-D-3 (racine =
    `TENANT_ADMIN`), Q-D-4 (encours certain : protège contre la fraude), Q-D-5 (droit propre
    `commande:parametres:modifier`), Q-D-6 (seul le message du numéro officiel est facultatif), Q-D-7 (la recette lit
    par rôle ; vérifier que « SAREX » est bien fictif), Q-D-8 (`VERT`, C-10 `SANS_OBJET` ; l'utilisateur cherche des
    documents générables pour le jeu), Q-D-10 (la série démarre à 0 sans reprise).
  - **Q-D-9 renversée** : un **calendrier propre à chaque organisation** (jours travaillés, jours fériés), dès
    maintenant, paramètre C6 lu par le plan de journée et par la résolution à l'import ⇒ **STORY-1060**, réservée pour
    toi.
  - **Mise en service (Q-D-10)** : pour un client qui quitte Sage (le distributeur de février), la reprise du dernier
    numéro de facture (`facturation.suite-numerotation@1`) se pose **avant sa première facture** : à inscrire à ta
    liste de mise en service.
  - **D-972-9 (de B)** : le fichier des comptes du bureau dans ton jeu est à faire, voir la réponse à B ci-dessus.

- **→ C (2026-11-17, information) : le compose racine et le profil de recette de A portent désormais MinIO de Chainguard**
  (`cgr.dev/chainguard/minio:latest`, `user: '0'`), STORY-920, recette #24. Vos piles MinIO sur ce poste (`grp-c-…`,
  `document-service` 995 → 997) n'ont plus besoin d'une image en cache ; un compose de pile à vous qui définit son propre
  `minio` prend la même image et le même `user`. Rien à rejouer côté A.

- **→ B et C (2026-11-16, STORY-908) : deux défauts du patron de supervision de 950, à vérifier chez vous.**
  Trouvés sur la pile de 908 (balance, bilan), corrigés chez A (balance #148, bilan #174) :
  1. **une relance ne peut pas réussir** : la supervision rappelle `connect()` sur **le même** consommateur ; le client de
     Confluent (1.11, `_consumer.js` : `state !== INIT` ⇒ « Connect has already been called elsewhere ») le refuse
     toujours. Un service démarré **sans Kafka** relance alors indéfiniment, même Kafka revenu (constaté : relance n°17
     en échec). Correctif : un consommateur neuf à chaque relance (`renouveler()` dans
     `supervision-consommateur.util.ts` de balance) ; test « chaque relance prend un consommateur NEUF » ;
  2. **`/health` attend ~30 s un broker absent** : `admin.connect()` n'est pas borné. Correctif : contrôle borné à 5 s
     (`DELAI_SANTE_KAFKA_MS`, `kafka.health.ts`).
  Services où le même code tourne (relevé sur `origin/dev`, non éprouvé par A) : **B** notification, paiement,
  catalogue ; **C** sinistres, assurance, document-service, liaison-assureur, assureur-fictif. Preuve à rejouer :
  arrêter Kafka, redémarrer le service, relancer Kafka, attendre `/health` 200.

- **→ B (2026-11-15) : le rôle métier effectif dans la liste des membres** —
  `tickets/TICKET-BACKEND-role-metier-absent-de-la-reponse-des-membres.md`. Bloque **FE-115** (février). C'est le même
  écart que la console « sans rôle métier » de la passation d'auth ci-dessus, vu côté cabinet.
- **→ D (2026-11-15) : nouveau point de départ.** FE-069 revient à A (voir « Passations »). D commence par **AP-38**
  (console) et par les **maquettes** des stories de février, dans l'ordre de `tri-frontend-fevrier-2026-11-15.md`
  §4.1 ; il reprend le dépôt du cabinet à la fusion de FE-069. Les fiches FE-112 → FE-125 sont écrites par A ; la
  plage libre de D devient **FE-126 → FE-139**.
- ~~**À D — reprendre FE-069 sur la branche `fe-069`**~~ *(close le 2026-11-15 : FE-069 revient à A ; le détail
  ci-dessous reste juste et sert à A)* (plan, ligne FE-069 du lot de D : « D la reprend où elle en est »).
  - **À lire d'abord** : la section « Recensement des écarts frontend ↔ backend (2026-11-14) » de la fiche
    `frontend-stories/FE-069.md` (#480) — ruptures A1→A3, écarts de schéma B1→B17, routes sans écran C1→C17,
    et le découpage proposé au PO (A+B dans FE-069, C en stories nommées — **pas encore validé**).
  - **État de la branche** : typecheck **rouge à dessein** — les types sont régénérés depuis la pile `recette100`
    (8/8 services, `origin/dev` du 14/11) et font remonter les écarts B. A1/A2 sont faits dans le code
    (`referentiels/actifs` et `tresorerie/*` sous `/dossiers/{id}/`, clés de cache sous `["dossier", id, …]`) ;
    restent `tresorerie.test.ts`, `scope-dossier.guard.test.ts`, les stubs e2e (A3), puis B.
  - **Le gate e2e** : `npx playwright test -c playwright.gate.config.ts` (`e2e/gate/`, aucune interception).
    `pile.ts` amorce un cabinet réel par API (inscription, lien Mailhog, KYC approuvé, modules, collaborateur).
    Vert jusqu'à la création du dossier par l'assistant ; bute ensuite sur A1 (Atelier fermé, faux « KYC non
    approuvé »). Le serveur `next start -p 3100` est **réutilisé** s'il tourne : le relancer après tout changement.
  - **La pile** : `recette100` tourne, **`expert-comptable` ajouté** (worktree `_wt-r100-expert-comptable`,
    surcouche avec `NODE_ENV: production`, sinon crash `pino-pretty`).

- **→ B (2026-11-15) : borne du jeton face aux verticales** (relecture de STORY-365) — **ouverte**.
  1. **STORY-938** : la regex des droits d'auth-service
     (`TENANT_PERMISSION_FORMAT = /^[a-z]+:[a-z-]+:[a-z]+$/`) refuse le tiret dans le 1er segment, ce qui écarte
     **56 des 347** codes des manifestes (`coeur-sfd`, `liaison-assureur`, `assureur-fictif`,
     `finance-transactions`…). Il faut élargir les trois segments : `^[a-z]+(-[a-z]+)*:[a-z]+(-[a-z]+)*:[a-z]+$`.
  2. **STORY-935** : cinq codes dépassent la borne de 40 caractères. Ce sont les trois
     `approvisionnement:commande-fournisseur:*` (48, 47, 46), `finance-transactions:rapprochement:effectuer` (44) et
     `finance-transactions:tresorerie:consulter` (41). Les renommer, ou relever la borne de longueur et celle
     d'octets ensemble, sur une nouvelle mesure.
  3. **Décision d'architecture avant février** : la borne de 44 droits et 3 584 octets ne tient pas face aux
     verticales. Les manifestes déclarent 347 droits ; `sinistres` en porte 23 à lui seul ; un DG à plusieurs
     modules dépasse 60 à 100 droits. A recommande que le jeton porte les rôles et les modules, et que les droits se
     résolvent par une lecture en cache (un read-model ou `/me/permissions`).

  Détail : `coordination/relecture-groupe-A-2026-11-14.md`, section STORY-365.

- **→ D (2026-11-15) : le motif saisi pièce par pièce dans la revue KYC est perdu sans bruit** (reste de STORY-176)
  — **ouverte**. Le ticket est `tickets/TICKET-FRONTEND-motif-par-piece-revue-kyc.md`, et il devient **AP-38** (lot de
  D, n° 12).
  - Choix de A : **aucun changement de backend**. La console reporte les motifs par pièce dans le motif du dossier
    (`reason`, au plus 1 000 caractères), qui est déjà persisté, journalisé et envoyé au cabinet.
  - L'opérateur voit le texte composé avant d'envoyer, et un dépassement est refusé sans troncature.
  - D inscrit AP-38 à son tracker.

- **→ B (2026-11-17) : le jeu du cabinet est dans `jeux-demonstration/cabinet-demo-togo/`** — ~~à faire par B~~ **servie par B (2026-11-17)** : plateforme #26 (`dev` `3407408`), étiquette `jeu-cabinet-v1` posée sur `e958bd6`. A a ajouté ce dossier (données seules, plateforme #25, `dev` `e958bd6`), sur la phrase du README « les jeux des verticales viennent de leurs propriétaires ». (1) La ligne du tableau « Qui écrit dans quel dossier » : `jeux-demonstration/cabinet-demo-togo/` → groupe A. (2) **L'étiquette `jeu-cabinet-v1`** : `generateur.source` du `jeu.json` la nomme (`prospera-plateforme@jeu-cabinet-v1:jeux-demonstration/cabinet-demo-togo/generateur/generer.mjs`) ; je n'en crée pas dans votre dépôt (D l'a fait pour `jeu-assurance-v1` ; si vous préférez qu'A le fasse, le dire ici). (3) Pour le catalogue : le dossier du jeu porte aussi `generateur/` (le vérificateur l'ignore) ; à `JEUX_DEMONSTRATION_DIR`, copier le dossier entier ou seulement `jeu.json` et `balance/`. Le jeu seul se rejoue : `node jeux-demonstration/cabinet-demo-togo/generateur/generer.mjs <dossier>` (même graine, mêmes empreintes). Les routes C13 de balance et de bilan viennent en STORY-928.

- **→ C (24/11) : édition libre des lignes d'une écriture de facture** (FE-149, validée par l'utilisateur) : voir la section « Lot 6 » ci-dessus et le ticket `TICKET-BACKEND-comptabilite-ecriture-de-facture-modifiable-ligne-a-ligne` — ~~ouverte~~ **servie par comptabilite #19 (`979ed53`)** : `corrections.lignes`, `ECRITURE_DESEQUILIBREE`, `POST …/apercu`, branchés par FE-149 (#59) ; ticket clos.

## Réponses aux demandes reçues

- **← B (2026-11-16) routes C13 du cabinet : servies** (2026-11-17, STORY-928, balance #156 `98078b0`, bilan #179 `1651d33`) : `POST /api/v1/instance/{balance|bilan}/{organisationId}/import` et `/effacement`, aux corps de `contrats-instance-v1`, sous l'identité `MOTEUR`, espace d'essai seulement (`INSTANCE_ESPACE=ESSAI`). Le jeu `cabinet-demo-togo` s'importe dans l'ordre (`profil-societe`, `balance`) et s'efface complètement (preuve Docker de bout en bout). Pour B : l'import de `bilan` n'a aucun objet (la part `bilan` du jeu n'existe pas, D-927-1) ; le dossier de démonstration n'est matérialisé que dans balance (ticket `dossier-de-demonstration-sans-creation-par-le-moteur`, à décider avec toi).
- **← B (2026-11-16) jeu de démonstration : jeu du cabinet livré** — chemin `jeux-demonstration/cabinet-demo-togo/` (prospera-plateforme), code `cabinet-demo-togo`, version `1.0.0`, verticale `CABINET`, PR plateforme **#25**, `dev` **`e958bd6`** ; `npm run jeu:verifier` conforme. Une part, le module `balance` (`profil-societe`, `balance`), 3 enregistrements ; `bilan` sans objet (D-927-1). **Routes C13 d'import et d'effacement à suivre en STORY-928** (balance, bilan). — **servie** pour le jeu, ouverte pour les routes.
- **← B (2026-11-17) : le lot 3 de A** — `PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §2 : **dix stories légères, STORY-920
  → 929** (sept sans Docker, une seule recette complète, en 929). **B-967 attend A-921** (la 5e origine
  `comptabilite` du hub de balance).
- **← B (2026-11-17) : MinIO passe à `cgr.dev/chainguard/minio:latest`, avec `user: '0'`** — **servie par PR
  prospera-recette #24 (dev `68ef348`), STORY-920** : (1) compose racine du poste principal basculé en place ; (2) service
  `minio` de `docker-compose.recette.yml` en image Chainguard + `user: '0'`, garde du profil réalignée ; (3) recette
  `zone-franche` 5/5 sur pile neuve (artefacts fiscaux écrits dans MinIO, relus par `mc`). Pas de healthcheck (image
  distroless, comme avant). Ancien texte de la demande : **à faire par
  A : c'est STORY-920 du lot 3**. Norme décidée par l'utilisateur (`REGLES-DES-GROUPES.md` §1.6) : `minio/minio` a été retiré de Docker Hub,
  `quay.io` refuse le pull anonyme. Trois gestes : (1) le `docker-compose.yml` racine du poste principal ; (2) le
  service `minio` de `prospera-recette/docker-compose.recette.yml` ; (3) une recette qui écrit dans MinIO, rejouée sur
  pile neuve. Détail et preuve : journal de B, « Demandes aux autres groupes ».

- **← B (2026-11-15) : relecture du contrat d'état publié avant figeage (STORY-932, plan §7)** — **faite**. Relecture
  indépendante sur les sources (PRD moteur §3.1, FR-34, FR-35, FR-43, addendum §A-2 ; C2, C8, C13 ; spines du moteur et
  de la coque). Verdict : **figeable après 4 corrections bloquantes**, toutes faites avant la fusion (export dans
  l'Administration en `EN_INSTALLATION`, motif d'un code de module, 503 sans heure connue, règle du calcul écrite en
  entier). Le détail et les ajouts retenus : `stories/STORY-932.md`, « Relecture avant figeage ».
- **← B (2026-11-15) : relecture de la matrice et de la route de STORY-936** — **sans objet de contrat** : ni la matrice
  ni la route n'ont changé depuis l'étiquette `contrat-etat-publie-v1`. Leur conformité est prouvée par les 33 cas
  rejoués par le calcul et par la réponse réelle de la route, validée contre le schéma figé (`stories/STORY-936.md`,
  D-936-5).

- **← B (2026-11-16) : 945 fusionnée, recettes croisées rouges sur `dev`** — **traitée par STORY-917** (branche
  `story-917` de `prospera-recette`) : `balance` avant `bilan` dans les trois recettes, `reseau` avant
  `microfinance` ; abonnement (631, 280, 728) : acquis à l'offre puis installation par le moteur, droit
  `moteur:<plan>` ; 727 : package et vertical n'ouvrent plus rien. **Aussi corrigé** : le test du package qui
  évolue (l. 729-757, source `pack:…`), que la liste ne citait pas. **Close** : 917 fusionnée (recette #22),
  recettes depuis `dev` 87/87.
- **← B (2026-11-16) : `/moi/droits` servi pour A-919** — **close** : STORY-919 fusionnée (fiscal #51).

## ⚠ Contrats

- **2026-11-24 (STORY-328, session A), AVANT le code** : `prospera-fiscal-service` ajoute **les anomalies d'une obligation** (gravité, ce qui bloque, levée motivée). **Ajouts seuls** ; aucun droit neuf (`valider` lève une bloquante, `preparer` accuse un avertissement) ; aucun événement Kafka ; manifeste `declarations` et catalogue d'auth inchangés. Détail : `stories/STORY-328.md`, « Contrat annoncé avant le code » et D-328-1 à 12.
  - **Champ neuf, jamais `null`**, sur la réponse de l'obligation : `anomalies` (liste de `{ code, gravite: BLOQUANTE | AVERTISSEMENT, etat: OUVERTE | LEVEE, origine: CALCULEE | SIGNALEE, explication, action, bloque: EtatCycle[], bloqueLaProchaine, levable, droitLevee, details, levee: { motif, par, le } | null }`). **→ D (FE-081)** : types à régénérer ; griser l'étape quand `bloqueLaProchaine`, `explication` et `action` tels quels, `levee.motif` au dossier de contrôle.
  - **Routes neuves** : `POST /api/v1/obligations/{id}/anomalies/{code}/levee` (corps `{ motif }`, 200 : l'obligation) ; `GET /api/v1/exercices/{exerciceId}/obligations/anomalies` (`?redevableId=`, `?etat=OUVERTE|LEVEE`).
  - **Comportement ajouté** : toute transition vers un état qu'une anomalie `BLOQUANTE` ouverte refuse répond `409 ANOMALIE_BLOQUANTE` (`VALIDEE` : `BASE_PROVISOIRE` ; `CLOTUREE` : `DECLARE_ABSENT_AU_DEPOT`, `ECART_SANS_MOTIF`). `MOTIF_ECART_REQUIS` (322) répond toujours le premier à `VALIDEE`. **Refus neufs** : `MOTIF_DE_LEVEE_REQUIS`, `MOTIF_INVALIDE`, `ANOMALIE_INTROUVABLE`, `ANOMALIE_BLOQUANTE`, `ANOMALIE_NON_LEVABLE`, `ANOMALIE_DEJA_LEVEE`. Actes du journal chaîné : `OBLIGATION_ANOMALIE_LEVEE`, `OBLIGATION_ANOMALIE_SIGNALEE`, `OBLIGATION_ANOMALIE_RETIREE`.
  - **→ C (STORY-326, STORY-1101)** : pose ton code au catalogue (`domain/obligations/anomalies.ts`), signale par `RegistreObligations.signalerAnomalie` / `retirerAnomalie` (aucune route), déclare `bloque` pour refuser l'étape voulue (1101 : `A_DEPOSER` sur l'obligation de dépôt de la liasse). Refus et levée sont déjà là.

- **2026-11-24 (STORY-322, session A), AVANT le code** : `prospera-fiscal-service` ajoute **le triplet calculé / déclaré / payé** d'une obligation. **Ajouts seuls** ; aucun droit neuf (`preparer`) ; aucun événement Kafka ; manifeste `declarations` inchangé ; rien d'écrit ni de lu chez `balance-service`. Détail : `stories/STORY-322.md`, « Contrat annoncé avant le code » et D-322-1 à 10.
  - **Champ neuf, jamais `null`**, sur la réponse de l'obligation : `triplet` (`calcule` : `{ montant, origine: MOTEUR | SAISI_CABINET | null, indisponible: SANS_MONTANT | MONTANT_A_SAISIR | CALCUL_DELEGUE_NON_DISPONIBLE | null, message, source }` ; `declare` : `{ montant, motifEcart, calculeRetenu, fige, par, le }` ou `null` ; `paye` : `{ montant, motifEcart, par, le }` ou `null` ; `ecarts` : `{ declareMoinsCalcule, payeMoinsDeclare, motifRequis }`). **→ D (FE-081)** : types à régénérer.
  - **Routes neuves** : `POST /api/v1/obligations/{id}/montant-declare` et `…/montant-paye` (corps `{ montant, motifEcart? }`, droit `preparer`, 200 : l'obligation) ; `GET /api/v1/exercices/{exerciceId}/obligations/ecarts` (lecture).
  - **Comportement ajouté** : `POST …/transition` vers `VALIDEE` refuse `409 MOTIF_ECART_REQUIS` (déclaré ≠ calculé sans motif) et fige le calculé quand un déclaré existe. **Refus neufs** : `MONTANT_DECLARE_FIGE`, `MONTANT_DECLARE_ABSENT`, `MONTANT_DECLARE_NON_ENREGISTRABLE`, `PAIEMENT_NON_ENREGISTRABLE`, `MOTIF_ECART_REQUIS`, `MONTANT_INVALIDE`, `MOTIF_INVALIDE`. **Journal chaîné** : actes `OBLIGATION_MONTANT_DECLARE`, `OBLIGATION_MONTANT_PAYE`, `OBLIGATION_CALCULE_FIGE`. **→ C (STORY-1101)** : le déclaré se lit sur `Obligation.montantDeclare` (`RegistreObligations`).

- **2026-11-24 (STORY-320, session A), AVANT le code** : `prospera-fiscal-service` alimente **les bases fiscales depuis la balance** et nomme ce qui manque (V3). **Ajouts seuls** ; aucun droit neuf (`preparer` suffit : manifeste `declarations` et catalogue d'auth inchangés) ; aucun événement Kafka ; rien d'écrit chez `balance-service` (lecture de `GET /api/v1/dossiers/{dossierId}/balances`, jeton de l'appelant). Détail : `stories/STORY-320.md`, « Contrat annoncé avant le code » et D-320-1 à 15.
  - **Champ neuf, facultatif**, sur la réponse de l'obligation : `basesFiscales` (`null` ou `{ statut: ALIMENTEES | PROVISOIRES | BLOQUEES, constateLe, source: { balanceId, version, etat: VALIDEE | BROUILLON, statutPreuve, checksum, devise, exercice, origine, valideeLe } | null, manque: { code, message } | null }`). **→ D (FE-081)** : types à régénérer ; afficher la mention « Brouillon » et le statut de preuve quand `PROVISOIRES`, le `manque.message` tel quel quand `BLOQUEES`. `statut` du cycle ne change jamais par ce constat.
  - **Route neuve** : `POST /api/v1/obligations/{id}/bases` (droit `preparer`, 200 : l'obligation ; états `A_PREPARER` et `EN_PREPARATION` seulement) pour revérifier après avoir validé la balance. **Comportement ajouté** : `POST …/transition` vers `EN_PREPARATION` alimente les bases dans la même transaction ; **nouveau refus `409 BASES_FISCALES_BLOQUEES`** (`{ manque: { code, message } }`), le blocage étant écrit pour le calendrier. Refus `409 BASES_NON_ACTUALISABLES` ; amont : `503 SERVICE_AMONT_INDISPONIBLE` (rien d'écrit), `502 BALANCE_AMONT_INVALIDE`.
  - **Manques nommés** : `BALANCE_ABSENTE`, `BALANCE_REJETEE`, `BALANCE_DESEQUILIBREE`, `BALANCE_NON_LISIBLE`. Journal chaîné : acte `OBLIGATION_BASES_CONSTATEES`. Configuration : `BALANCE_SERVICE_URL` (défaut `http://balance-service:3007`).
  - **Amendé à la livraison (24/11)** : `basesFiscales.source.origine` est RETIRÉ du contrat (jamais publié) — AD-14 : fiscal ne lit pas l'origine d'une balance.

- **2026-11-24 (STORY-323, session A), AVANT le code** : `prospera-fiscal-service` ajoute **le cycle de vie de l'obligation** (onze états) et **le visa de l'associé** (V6). **Ajouts seuls** ; aucun droit neuf (les trois droits `fiscalite:declaration:*` suffisent : manifeste `declarations` et catalogue d'auth inchangés) ; aucun événement Kafka. Détail : `stories/STORY-323.md`, « Contrat annoncé avant le code » et D-323-1 à 12.
  - **Route** : `POST /api/v1/obligations/{id}/transition`, corps `{ vers }` (un des onze états : `A_PREPARER`, `EN_PREPARATION`, `A_CONTROLER`, `A_VALIDER`, `VALIDEE`, `A_DEPOSER`, `DEPOSEE`, `ACCUSE_RECU`, `A_PAYER`, `PAYEE`, `CLOTUREE`) ; 200 = l'obligation. Cycle strictement séquentiel ; pas de retour en arrière (STORY-325). Le droit dépend de la cible (associé : `valider` pour le contrôle, le visa et la clôture ; `deposer` pour déposer et consigner l'accusé ; `preparer` pour le reste).
  - **Champs neufs, facultatifs**, sur la réponse de l'obligation : `visa` (`{ par, nom, le }` ou `null`), `prochainEtat`, `droitRequis`. `statut` garde son nom et sa place. **→ D (FE-081, écrans du dépôt)** : types à régénérer ; griser le bouton selon `droitRequis`.
  - **Refus** : 403 `DROIT_FISCAL_REFUSE` (journalisé), 404 `OBLIGATION_INTROUVABLE`, 409 `TRANSITION_NON_PREVUE`, `VISA_REQUIS`, `OBLIGATION_DESACTIVEE`, `OBLIGATION_BLOQUEE`, `TRANSITION_CONCURRENTE`.
  - **Réconciliation avec `depots` (538)** : `depots` ne change pas d'un octet (états `TRANSMISE`/`ACCEPTEE`/`REJETEE`, `lireObligation`, `fiscal.declaration.deposee`). Le `statut` de l'objet `Obligation` est l'état du CABINET ; la lecture de `depots` est l'état de la chaîne d'UN dépôt de liasse. Correspondance écrite et éprouvée : `A_DEPOSER`→`A_DEPOSER`, `TRANSMISE`→`DEPOSEE`, `ACCEPTEE`→`ACCUSE_RECU`, `REJETEE_A_RETRANSMETTRE`→`A_DEPOSER`. La liaison automatique est à 333/334.

- **2026-11-23 (STORY-1099, session du groupe C), AVANT le code** : `prospera-balance-service` ajoute **la mémoire des choix dans les cahiers**. **Ajouts seuls** ; aucun événement ; manifeste `balance` inchangé. Détail : `stories/STORY-1099.md`.
  - **Lecture d'un lot OCR** : chaque ligne pré-proposée gagne un champ **facultatif** `suggestion` (`categorieId`, `categorieLibelle`, `compteCharge`, `compteProduit`, `source` : `MEMOIRE_DOSSIER` | `MEMOIRE_CABINET`). **→ D (FE-150)** : types à régénérer ; un client qui ignore le champ ne change rien.
  - **Routes neuves** : `GET /api/v1/dossiers/{dossierId}/cahiers/memoire-des-choix` (+ `/suggestion`), `DELETE …/{memoireId}` ; `GET /api/v1/cahiers/memoire-des-choix`, `DELETE …/{memoireId}` (`TENANT_ADMIN`), `GET /api/v1/cahiers/memoire-des-choix/actes`. Refus 404 `MEMOIRE_INTROUVABLE`.
  - **Apprentissage** à l'application d'un lot (`…/appliquer`), au dossier et au cabinet ; collections `memoires_des_choix_cahiers`, `actes_memoire_cahiers`.

- **2026-11-23 (STORY-1098, session du groupe C), AVANT le code** : `prospera-comptabilite-service` ajoute **la mémoire des choix du cabinet**. **Ajouts seuls** ; aucun droit neuf ; aucun événement. Détail : `stories/STORY-1098.md`, « Contrat annoncé avant le code ».
  - **Mémoire** à deux étages, clé `NIF` puis `NOM` puis `LIBELLE`, toujours sous l'organisation du jeton : le **dossier** apprend à l'inscription d'une facture (1097), le **cabinet** à la validation de l'écriture ; un brouillard abandonné désapprend. La proposition de 1097 la lit (dossier, puis cabinet, puis compte par défaut du tiers), avec la source `MEMOIRE_DOSSIER` | `MEMOIRE_CABINET`.
  - **Routes** : `GET /api/v1/dossiers/{dossierId}/memoire-des-choix`, `DELETE …/memoire-des-choix/{memoireId}` (saisir) ; `GET /api/v1/cabinet/memoire-des-choix`, `DELETE …/{memoireId}` (`TENANT_ADMIN`), `GET /api/v1/cabinet/memoire-des-choix/actes`. Refus 404 `MEMOIRE_INTROUVABLE`. Acte `MEMOIRE_OUBLIEE` en ajout seul.
  - **Correction de 1097** : l'abandon d'un brouillard né d'une facture rend la pièce de nouveau inscriptible.
  - **Données** : `memoires_des_choix`, `actes_de_la_memoire` au plan C13. **Manifeste** `comptabilite` **0.4.0** (3 routes de lecture) : **→ session A**, recopie au catalogue après la fusion du code.

- **2026-11-23 (FE-148, session A) : le manifeste `comptabilite` passe de 0.1.0 à 0.2.0.** Il avait gagné les 8 routes de lecture du plan comptable propre (STORY-1094, 1095) en restant en 0.1.0 ; or une version publiée ne change pas (STORY-934) : le semis du catalogue ignore une copie différente pour une version déjà semée. Changé à l'identique dans `manifestes/comptabilite.manifest.ts` (ici), `src/module.manifest.ts` de comptabilite-service (branche `MNV-1095-manifeste-0.2.0`) et la copie du catalogue (`copies.json`, catalogue #64, recopiée depuis `c00c5bb`). **Règle pour la suite** : toute route ajoutée au manifeste monte sa version ; les 2 routes de STORY-1097 iront en **0.3.0** (convenu avec la session C).
- **2026-11-23 (STORY-1097, session du groupe C), AVANT le code** : `prospera-comptabilite-service` ajoute **des factures à l'écriture proposée** (achats et ventes, système normal). **Ajouts seuls** ; aucun droit neuf ; aucun événement neuf. Détail complet : `stories/STORY-1097.md`, « Contrat annoncé avant le code ».
  - **Routes** sous `/api/v1/dossiers/{dossierId}/exercices/{exerciceId}/factures/lots` : `POST /` (multipart `fichiers` 1 à 50, PDF/JPEG/PNG 10 Mo, `sens` ACHAT|VENTE, `avoir`, `devise` ; 202 ; chaque fichier déposé chez `document-service` en type `FACTURE`, `correlationId` = lot, jeton du membre ; **aucune écriture**), `GET /`, `GET /{lotId}` (lecture des pièces chez `document-service`, proposition recalculée, signaux nommés), `POST /{lotId}/inscrire` (`{ pieces: [{ pieceId, corrections? }] }` ⇒ un brouillard par pièce par la saisie existante, résultat par pièce). Saisie et inscription : `comptabilite:ecriture:saisir` ; lectures : tout membre dont la portée couvre le dossier.
  - **Refus** : 409 `FACTURES_RESERVEES_AU_SYSTEME_NORMAL` (`details.renvoi: "cahiers"` au SMT), 404 `LOT_INTROUVABLE`, 422 `LOT_TROP_GRAND`, `FICHIER_TROP_VOLUMINEUX`, `FORMAT_NON_PRIS_EN_CHARGE`, 400 `FICHIER_ABSENT`, `SENS_REQUIS`, 503 `DOCUMENTS_INDISPONIBLES` ; par pièce : `PIECE_INCONNUE_DU_LOT`, `DEJA_INSCRITE`, `PIECE_NON_INSCRIPTIBLE`, `INSCRIPTION_EN_COURS` et les refus de la saisie.
  - **Tiers** : `POST /api/v1/dossiers/{dossierId}/tiers` accepte deux champs facultatifs, `nif` et `compteParDefaut`, servis par la vue du tiers.
  - **Données** : `comptes-de-facturation@1` (SN : 4452, 443, 401, 411) ; collection `lots_de_factures` au plan d'effacement C13.
  - **Manifeste** : `routesLectureSeule` reçoit `GET …/factures/lots` et `GET …/factures/lots/{lotId}`. **→ session A** : à recopier au catalogue (`copies.json`) après la fusion du code.

- **2026-11-21 (STORY-1096), AVANT la fusion du code** : `prospera-comptabilite-service` ajoute l'**import du plan comptable de Sage 100**, en deux temps (aperçu, puis enregistrement). **Ajouts seuls** ; aucun droit neuf ; manifeste inchangé (routes d'écriture).
  - **Routes** : `POST /api/v1/cabinet/plan-comptable/import` (cible : le modèle du cabinet ; `TENANT_ADMIN`) et `POST /api/v1/dossiers/{dossierId}/plan-comptable/import` (cible : le plan du dossier ; `TENANT_ADMIN` ou responsable du dossier ; dossier archivé : 409 `DOSSIER_ARCHIVE`). Corps `multipart/form-data` : `fichier` (CSV ou XLSX, 5 Mo au plus), `journaux` (facultatif, second fichier), `profil` et `profilJournaux` (facultatifs, JSON `{ numero, libelle, type, collectif, separateur }` / `{ code, libelle, type, compte }` : les NOMS d'en-tête des colonnes). Requête : `dryRun` (défaut `true` : l'aperçu n'écrit rien) ; `dryRun=false` exige `versionDuPlan` et `empreinteApercu` rendus par l'aperçu.
  - **Réponse 200** : `{ cible, dryRun, fichier: { nom, empreinte, lignes }, versionDuPlan, empreinteApercu, comptes: { aCreer[], dejaConnus[], dejaPresents[], anomalies[], tiersIgnores[] }, journaux: { aCreer[], dejaPresents[], anomalies[] }, compteurs, enregistre?: { versionDuPlan, comptesCrees, journauxCrees } }`. `dejaConnus` : le compte EST un compte du plan publié ; `dejaPresents` : même numéro déjà au modèle ou au dossier, jamais écrasé ; `anomalies` : `{ ligne, numero, raison, racineLaPlusProche? }` (`SANS_RACINE`, `NUMERO_INVALIDE`, `LIBELLE_ABSENT`, `LIBELLE_TROP_LONG`, `DOUBLON_DANS_LE_FICHIER`, `PORTE_PAR_UN_DOSSIER`) ; `tiersIgnores` : lignes de type Tiers ou à collectif (décision FE-148 n° 4). L'enregistrement ne crée que ce que l'aperçu annonçait.
  - **Refus nommés** : 400 `FICHIER_ABSENT`, `APERCU_REQUIS` ; 415 `FORMAT_NON_PRIS_EN_CHARGE` ; 422 `FICHIER_ILLISIBLE`, `COLONNE_INTROUVABLE` (`details.colonne`), `FICHIER_TROP_VOLUMINEUX` (plus de 5 000 lignes) ; 409 `PLAN_CHANGE_DEPUIS_L_APERCU`, `APERCU_DIFFERENT`, `DOSSIER_ARCHIVE` ; 403 `TENANT_ADMIN_REQUIS` / `RESPONSABLE_OU_ADMINISTRATEUR_REQUIS`.
  - **Audit** : un seul acte `PLAN_IMPORTE` (fichier, empreinte SHA-256, comptes et journaux créés, auteur) à `actes_du_modele` ou `actes_du_dossier`, et UNE version du plan avancée ; un import qui ne crée rien n'écrit rien. Aucune collection neuve.
- **2026-11-21 (STORY-1095), AVANT la fusion du code** : `prospera-comptabilite-service` ajoute le **plan propre d'un dossier**, qui **s'ajoute** au modèle du cabinet (jamais copié). **Ajouts seuls**.
  - **Routes** sous `/api/v1/dossiers/{dossierId}/plan-comptable` : `GET /comptes`, `POST /comptes` `{ numero, libelle }` → 201, `PATCH /comptes/{numero}` `{ libelle }`, `POST /comptes/{numero}/desactivation`, `DELETE /comptes/{numero}` → 204 ; mêmes gestes pour `/journaux` (`{ code, libelle, type, compteDeTresorerie? }`) ; **masquer** un compte du modèle du cabinet pour ce dossier seul : `GET /masques`, `POST /masques` `{ numero }` → 201 (rejouable), `DELETE /masques/{numero}` → 204 ; `GET /actes` : le **journal du dossier** (acte, objet, auteur, date, version du plan du dossier). Les racines d'un compte du dossier se calculent sur les référentiels de la famille du dossier (SYSCOHADA : SN et SMT).
  - **Droits** : lecture : tout membre dont la portée couvre le dossier (contributeurs compris) ; écriture : le `TENANT_ADMIN` du cabinet **ou le responsable du dossier** (`responsableUserId` lu chez dossier-service), sinon 403 `RESPONSABLE_OU_ADMINISTRATEUR_REQUIS` ; dossier archivé : 409 `DOSSIER_ARCHIVE` (écriture seulement). Aucun droit de tenant neuf.
  - **Plan servi** (`GET …/exercices/{e}/plan-comptable`, ajout) : ordre référentiel, puis cabinet, puis dossier ; `origine` reçoit la valeur **`DOSSIER`** ; chaque compte porte `masque` (booléen) ; un compte masqué n'est plus servi par défaut (`?etat=tous` le rend avec `masque: true`).
  - **Refus nommés** : 409 `COMPTE_DU_MODELE_DU_CABINET` / `JOURNAL_DU_MODELE_DU_CABINET` (`details` : l'élément existant et son libellé), 409 `COMPTE_DEJA_DU_DOSSIER` / `JOURNAL_DEJA_DU_DOSSIER`, 404 `COMPTE_DU_DOSSIER_INTROUVABLE` / `JOURNAL_DU_DOSSIER_INTROUVABLE`, 409 `COMPTE_MOUVEMENTE` / `JOURNAL_MOUVEMENTE` (dans ce dossier), 409 `MASQUE_REFUSE_COMPTE_MOUVEMENTE`, 422 `COMPTE_MASQUE` à la saisie. Côté cabinet : créer un compte ou un journal que l'un de ses dossiers porte déjà rend 409 `COMPTE_DEJA_AU_DOSSIER` / `JOURNAL_DEJA_AU_DOSSIER`.
  - **Données** : collections `comptes_du_dossier`, `journaux_du_dossier`, `masques_du_dossier`, `plans_du_dossier` (version), `actes_du_dossier` (ajout seul), au plan d'effacement C13.
  - **Manifeste** : quatre routes de lecture ajoutées à `routesLectureSeule` (comptes, journaux, masques et actes du dossier).
- **2026-11-21 (STORY-1094), AVANT la fusion du code** : `prospera-comptabilite-service` (tenu par B, codé par A sur demande de l'utilisateur) ajoute le **plan comptable propre du cabinet**. **Ajouts seuls**, aucun renommage ; manifeste `comptabilite` 0.1.0 inchangé en version (4 routes de lecture ajoutées à `routesLectureSeule`, aucun droit de tenant neuf).
  - **Routes du cabinet** (organisation du jeton, jamais du chemin), sous `/api/v1/cabinet/plan-comptable` : `GET /comptes` (`?referentiel=SN|SMT|SFD-BCEAO|CIMA`, `?etat=actifs|tous`, défaut `actifs`), `POST /comptes` `{ numero, libelle }` → 201, `PATCH /comptes/{numero}` `{ libelle }`, `POST /comptes/{numero}/desactivation`, `DELETE /comptes/{numero}` → 204 ; mêmes quatre gestes pour `/journaux` (`{ code, libelle, type: ACHATS|VENTES|TRESORERIE|OD, compteDeTresorerie? }`, `PATCH` : `{ libelle, compteDeTresorerie? }`), et `GET /actes` (le journal d'audit : acte, objet, auteur, date, version du modèle). Lecture : tout membre du cabinet (portée de la garde du module). **Écriture : le seul rôle `TENANT_ADMIN`** (403 `TENANT_ADMIN_REQUIS`) ; aucun droit `comptabilite:*` neuf (D-1094-3).
  - **Vue** `CompteDuCabinet` : `{ numero, libelle, classe, racines: { <referentiel>: <racine> }, collectif: { <referentiel>: <categorie> }, actif, creeLe, creePar, modifieLe, modifiePar, version }` ; la nature (classe, collectif) est **héritée** de la racine, jamais saisie ; `sens` n'est pas servi (le plan publié n'en porte pas, D-1094-2). `JournalDuCabinet` : `{ code, libelle, type, compteDeTresorerie?, actif, … }`. Le modèle porte une **version** (`versionDuModele`) qui avance à chaque écriture.
  - **Route du dossier** : `GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/plan-comptable` (`?etat=actifs|tous`, `?prefixe=`) → `{ dossierId, exerciceId, referentiel, versionDuModele, comptes[], journaux[] }`, chaque élément avec son **`origine`** (`REFERENTIEL` | `CABINET`) ; un dossier ne reçoit que les comptes propres dont le **référentiel porte la racine** (un dossier CIMA ne reçoit pas une subdivision de racine SYSCOHADA absente de son plan).
  - **Refus nommés** : 422 `COMPTE_SANS_RACINE` (`details.racineLaPlusProche`), 409 `COMPTE_DU_REFERENTIEL`, 409 `COMPTE_DEJA_PROPRE`, 404 `COMPTE_PROPRE_INTROUVABLE`, 409 `COMPTE_MOUVEMENTE` (suppression d'un compte mouvementé : il se désactive), 409 `JOURNAL_DU_REFERENTIEL`, 409 `JOURNAL_DEJA_PROPRE`, 404 `JOURNAL_PROPRE_INTROUVABLE`, 409 `JOURNAL_MOUVEMENTE`, 422 `COMPTE_DE_TRESORERIE_INVALIDE`, 403 `TENANT_ADMIN_REQUIS`. **Aux écritures** (`POST …/ecritures`, correction, validation) : 422 `COMPTE_INCONNU` (classe absente du plan), 422 `COMPTE_SANS_RACINE`, 422 `COMPTE_DESACTIVE`, 409 `JOURNAL_DESACTIVE` ; un journal propre actif est accepté comme un journal du plan arrêté, numéroté de la même façon.
  - **Règle de la liasse** : un compte propre est une subdivision d'une racine du plan publié ; le service continue de publier la balance au hub **compte par compte**, et `balance-service` rattache par préfixe (`isCompteValide`) : la balance et la liasse agrégées à la racine sont identiques (AC-2, éprouvé).
  - **Données** : `plan-publie@1` (les numéros du plan de chaque référentiel, extraits des paquets publiés de `balance-service` : SN `syscohada-revise@2.3`, SMT `smt-togo@1.0`, SFD-BCEAO `sfd-bceao@2.0`, CIMA `cima-assurances@7.0`), donnée du service comme `plans-de-journaux@1`. Collections neuves : `comptes_du_cabinet`, `journaux_du_cabinet`, `modeles_du_cabinet`, `actes_du_modele` (ajout seul), toutes au plan d'effacement C13.
  - **Fiche** : `stories/STORY-1094.md` ; décisions D-1094-1 → 6 inscrites à sa clôture.
- **2026-11-17 (STORY-928), AVANT la fusion du code** : `balance-service` et `bilan-service` servent leurs routes C13 (déclarées aux manifestes, `routesInstance`), aux corps **exacts** de `prospera-plateforme/contrats/instance/` (`contrats-instance-v1`) : `POST /api/v1/instance/balance/{organisationId}/import` et `POST /api/v1/instance/bilan/{organisationId}/import` (`import-c13-demande@1` → `import-c13-reponse@1` : `IMPORTE`, puis `DEJA_IMPORTE` au rejeu ; objets servis : `balance` = `profil-societe` puis `balance` ; `bilan` = aucun objet, tout objet rend 422 `OBJET_INCONNU`, D-927-1), et `POST /api/v1/instance/{balance|bilan}/{organisationId}/effacement` (`effacement-c13-demande@1` → `effacement-c13-accuse@1` : `EFFACE`, puis `DEJA_EFFACE`). **Ajouts seuls**, aucune route existante modifiée ; les deux services acceptent désormais un jeton de SERVICE (claims `identite`, `organisationId`, STORY-948) mais seulement sur ces routes (`@AdmetIdentitesDeService('MOTEUR')`, partout ailleurs 403 `IDENTITE_DE_SERVICE_REFUSEE`). Garde : identité `MOTEUR` seule, `organisationId` du jeton = celui du chemin (403 `ORGANISATION_HORS_JETON`), **espace d'essai seulement** (`INSTANCE_ESPACE=ESSAI`, sinon 403 `ESPACE_REEL_REFUSE`), import limité à `source = JEU_DEMONSTRATION`, effacement limité au motif `FIN_ESSAI`. Refus nommés 422 : `OBJET_INCONNU`, `SCHEMA_NON_CONFORME`, `SOURCE_NON_SERVIE`, `MOTIF_NON_SERVI`, `DOSSIER_DE_DEMONSTRATION_INCONNU`, `BALANCE_REFUSEE`. **→ B** (catalogue, STORY-953) : rien à changer chez toi, tu appelles ces chemins avec le jeton du moteur ; le dossier de démonstration n'est matérialisé que dans balance (D-928-3, ticket à venir). Fiche : `stories/STORY-928.md`. Code : balance-service et bilan-service, branches `MNV-928`.
- **2026-11-17 (STORY-926), AVANT la fusion du code** : `balance-service` ajoute (ajouts seuls, rien de renommé) : (1) un champ facultatif **`provenance`** sur chaque ligne de `BalanceResponseDto.lignes` (`GET /api/v1/dossiers/{dossierId}/balances` et `…/balances/{id}`), enum nommée `ProvenanceLigne` = `CAHIERS` | `FICHIER` | `DIRECTE` | `DERIVEE` | `NON_ENREGISTREE` (dérivé à la lecture, hors sceau, aucun checksum ne bouge ; `NON_ENREGISTREE` = balances d'avant la story, **pas** « aucune pièce ») ; (2) une route **`GET /api/v1/dossiers/{dossierId}/balance/{id}/lignes/{compte}/provenance`** (OpenAPI `ProvenanceCompteResponseDto` : `lignes[]` {transactionId, sens, date, libelle, montantDebit, montantCredit, niveauPreuve, pieceId?, lotId?}, `totaux`, `balance`, `ecart` signé {…, nul}, `nonVentilees`) ; `409 PROVENANCE_NON_OUVRABLE` (`details.provenance`) si la balance ne vient pas des cahiers, `404` balance d'un autre dossier / compte absent (`COMPTE_ABSENT_DE_LA_BALANCE`). Pour D (FE-075) : types à régénérer (`npm run gen:api`) ; le BFF ne relaie pas la route. Fiche : `stories/STORY-926.md`. Code : balance-service MNV-926.
- **2026-11-17 (STORY-925), AVANT la fusion du code** : `balance-service` ajoute deux champs à la réponse de `GET /api/v1/dossiers/{dossierId}/referentiels/actifs` (OpenAPI `ReferentielDiagnosticDto`) : **`dossierId`** (hex, toujours servi, égal à celui de l'URL) et **`referentielComptable`** (`SYSCOHADA` | `SFD-BCEAO` | `CIMA`, facultatif, déduit du paquet réellement servi ; enum `FamilleReferentielComptable`). **Ajouts seuls** : aucun champ renommé ni retiré, `tag`, `referentiel`, `checksum`, `stamp` inchangés. Pour D (FE-061 : fiche dossier, versions du plan de comptes) : types à régénérer (`npm run gen:api`) ; la route est par dossier depuis STORY-422, les versions y sont déjà.

- **2026-11-17 (STORY-924), AVANT la fusion du code** : `dossier-service` ajoute **`GET /api/v1/dossiers/{id}/completude`** (tout membre du cabinet, dans la portée du jeton ; hors portée ou autre cabinet : 404). Réponse `{ dossierId, version, complet, pretPourDsf, champsManquants[], champsBloquantsManquants[], champsOptionnelsManquants[] }` ; noms de champs = identifiants machine (`nifSociete`, `rccm`, `adresse`, `dirigeants`…), aucun texte. **Ajout seul** : une route et un DTO nouveaux, aucun renommage. Lecture pure, jamais une garde. Fiche : `stories/STORY-924.md`. Le BFF ne la relaie pas encore (suite à prévoir). Code : dossier-service MNV-924.
- **2026-11-17 (STORY-923), AVANT la fusion du code** : le BFF de la console (`admin-panel`) ajoute **`PATCH /api/v1/dossiers/{id}`** (`TENANT_ADMIN`, relais vers `dossier-service`), publié dans son OpenAPI (`/api/docs-json`, schéma `ModifierIdentiteDossierDto`, `version` exigée + seize champs d'identité). **Ajout seul**, aucun renommage. Refus relayés par code HTTP + code applicatif (liste fermée de 11 : `CONFLIT_CONCURRENT`, `DOSSIER_ARCHIVE`, `DOSSIER_INTROUVABLE`, `DOSSIER_NIF_DEJA_UTILISE`, `IDENTITE_VIDE`, `DIRIGEANT_REQUIS`, `ABONNEMENT_EXPIRE`, `EMAIL_NOT_VERIFIED`, `KYC_NOT_APPROVED`, `ORGANISATION_REQUISE`, `PORTEUR_NON_IDENTIFIABLE`), **sans texte** (`message` = le code). Code : admin-panel#36. Fiche : `stories/STORY-923.md`.
- **2026-11-17 (STORY-921), AVANT la fusion du code** : `balance.submitted` v1, champ `origine` : l'énumération reçoit `comptabilite` (**ajout seul**, facultatif, aucun renommage). Publiée par `balance-service` (`docs/schemas/balance.submitted.v1.schema.json`, `INTEGRATION.md`, OpenAPI `OrigineBalance`). Pas de registre Avro/Karapace dans ce service : aucune compatibilité de registre à vérifier ; un émetteur existant ne change rien. `source` reste `direct`. La balance `comptabilite` est une balance GÉNÉRALE (complète, base fiscale, gel de la saisie), référentiel facultatif (résolu depuis le dossier), `origine` hors sceau. **→ B** : fusionné, dev `9dfd60e` (balance-service#152).

## Front cabinet : revérification et tri du 2026-11-15

- **Demande de l'utilisateur** : remettre le front à niveau sans rien ajouter (FE-069, blocs A et B) ; transformer le
  bloc C en stories nommées et les trier pour février ; « vérifier tout avant », la logique ayant beaucoup changé
  (type de société, paquet fiscal…), en lisant les stories livrées sur la période.
- **Fait** : relecture du backend du 15/11 contre `origin/fe-069`, sur les ≈ 200 stories livrées depuis le 27/08 ;
  FE-069 étendue (A1 → A13, B1 → B25, 13 pts) ; 14 fiches neuves **FE-112 → FE-125** ; 23 fiches d'août réancrées ;
  FE-042 remplacée par FE-118 ; tracker frontend à jour (185 stories). Document de référence :
  **`tri-frontend-fevrier-2026-11-15.md`**.
- **Mes recommandations, appliquées** (règle de l'utilisateur, contestables après coup) — classées sans consigne
  explicite du PO : en février, FE-034 (cycle de la liasse, prérequis du dépôt), FE-038 (export de la liasse),
  FE-096 et FE-095 (classeur e-DSF, rejet), FE-118 (zone franche) ; après février, FE-119 (espace déclarant, aucune
  app pour le porter) et tout ce que le PO n'a pas nommé (§4.2 du tri, marqué ◆).
- **STORY-905, nommée par A** (fiche juste avant de la coder ; dépôts de A : balance, bilan) : *une simulation est une
  lecture*. Un abonnement échu met le service en lecture seule, mais `refuseeEnLectureSeule` juge sur la méthode HTTP
  (`bilan-service`, `read-models/guards/lecture-seule.ts` ; même patron dans balance) : les `POST …/dry-run` sont
  refusés en `403 ABONNEMENT_EXPIRE` alors qu'ils n'écrivent rien. Vu par le relevé du front (FE-069 A10).

- **→ C (2026-11-21) : `document-service` pour le dossier de financement** (STORY-1104 D-1104-9 et STORY-1109 D-1109-7), sans urgence
  avant que le lot soit slotté :
  1. un **dépôt rattaché au dossier client** (multipart, flux, `POST /dossiers/{dossierId}/pieces` à prolonger) avec types PDF, JPG,
     PNG, DOCX, XLSX et **20 Mo** au plus (à confirmer), refus nommés (`FORMAT_NON_ACCEPTE`, `FICHIER_TROP_VOLUMINEUX`,
     `FICHIER_ILLISIBLE`), aucun fichier à moitié rangé si l'envoi est coupé ;
  2. un **aperçu** : PDF et images tels quels, **DOCX et XLSX convertis en PDF**, URL signée de courte durée ;
  3. un **rendu** DOCX et PDF d'un contenu structuré (sections, blocs, tableaux) pour les documents générés.
  Aucun id de story n'est réservé par A : C le prend dans sa plage.

## Lot 6 (2026-11-24)

- ✅ **STORY-328 DONE (24/11)** : prospera-fiscal-service **#57** (`0596fc4` sur `dev`), docs (cette PR) ; contrat annoncé avant le code (#830). Les anomalies d'une obligation sont CALCULÉES à la lecture (`BASE_PROVISOIRE` bloque le visa, `ECART_SANS_MOTIF` le visa et la clôture sans se lever, `DECLARE_ABSENT_AU_DEPOT` la clôture, `CALCULE_A_SAISIR` avertit) ; une bloquante ouverte refuse l'étape (`409 ANOMALIE_BLOQUANTE`, après `MOTIF_ECART_REQUIS`) ; `POST /obligations/{id}/anomalies/{code}/levee` exige un motif (400 `MOTIF_DE_LEVEE_REQUIS`), le droit de la gravité (`valider` / `preparer`), journalise l'empreinte du motif et vaut pour le fait vu (il change : l'anomalie se rouvre) ; `GET /exercices/{id}/obligations/anomalies` nourrit le dossier de contrôle ; couture `signalerAnomalie` / `retirerAnomalie` pour 326 et 1101. Aucun droit neuf, aucun événement, manifeste inchangé. Preuves : Node 24 182 suites / 2 563 tests ; `test:conformite` 15/92 sur `mongo:7` en jeu de répliques ; e2e 3 nouveaux ; 16 mutations unitaires et 5 sur Mongo rouges sur l'assertion ; `docker compose up` sain, routes neuves en 401 ; pile `grp-a` `down -v`, verrou rendu (attendu 2 h : C le tenait pour 1100). **Non prouvé** : aucun appel de bout en bout avec un vrai jeton (le gate n'a pas d'auth-service) ; aucun code SIGNALEE n'existe encore au catalogue.
- **🏁 Passation A → C (24/11) : `prospera-fiscal-service` rendu à C ; C enchaîne 326 → 1101 → 315 → 316.** Dernier commit de A sur `dev` : **`0596fc4`** (STORY-328). A n'y touche plus. À savoir : (1) 326 et 1101 posent leur code au catalogue d'anomalies et signalent par `AnomaliesObligationsService` (voir `stories/STORY-328.md`, « Livraison ») ; (2) le déclaré se lit sur `Obligation.montantDeclare.montant` (`RegistreObligations.duDossier`), une période sans déclaré est NOMMÉE, jamais zéro ; (3) 321 (calcul par obligation au moteur de `balance-service`) n'est PAS faite : `triplet.calcule.indisponible = CALCUL_DELEGUE_NON_DISPONIBLE` ; (4) 333 et 334 (lier l'obligation à la chaîne d'un dépôt) NON faites : la correspondance est écrite dans `etatDuCycleSelonLeDepot` ; (5) le tracker fiscal 315 → 350 reste périmé en partie (333, 334, 335 couvertes par 537 → 539 et 688 → 691) ; (6) pièges du fiscal ci-dessous (« Pièges rencontrés », STORY-328) ; le worktree d'un dépôt se lance avec `core.autocrlf=false`, `test:conformite` sur un `mongo:7` jetable en jeu de répliques.
- **Suite de A : FE-141** (l'analyse financière à l'écran ; maquette validée ; attend les seuils de STORY-1076, D) puis les écrans du plan §3 (FE-150 débloquée par 1099).
- ✅ **STORY-322 DONE (24/11)** : prospera-fiscal-service **#56** (`990256a` sur `dev`), docs (cette PR) ; contrat annoncé avant le code (#818). `triplet` sur toute obligation (calculé lu : moteur, sinon montant saisi, sinon indisponible NOMMÉ ; déclaré et payé : deux champs humains, tracés avec leur précédent dans la même transaction), `POST /obligations/{id}/montant-declare` et `…/montant-paye`, `GET /exercices/{id}/obligations/ecarts`. Le visa refuse un écart sans motif (409 `MOTIF_ECART_REQUIS`) et fige le calculé. **321 NON faite (D-322-1)** : le moteur de `balance-service` est par dossier et par exercice, pas par obligation ; recommandation non bloquante pour 321 : un calcul PAR OBLIGATION côté `balance-service` (taxe, période, redevable → montant et détail). Aucun droit neuf, aucun événement, manifeste inchangé. Preuves : Node 24 180 suites / 2 510 tests ; `test:conformite` 14/82 sur `mongo:7` ; e2e 52/52 ; 5 mutations unitaires et 2 sur Mongo rouges sur l'assertion ; `docker compose up` sain, routes neuves en 401 ; pile `grp-a` `down -v`, verrou rendu. **Non prouvé** : aucun appel à `balance-service` (rien n'en a été ajouté).
- **Suite : STORY-328** (anomalies : gravité, blocage, levée motivée), puis passation du dépôt fiscal à C. À savoir : `triplet.ecarts.motifRequis`, `triplet.declare === null` à partir de `DEPOSEE`, `basesFiscales.statut = PROVISOIRES` (anomalie `BASE_PROVISOIRE` laissée par 320). STORY-1101 (C) lit `Obligation.montantDeclare`.
- ✅ **STORY-320 DONE (24/11)** : prospera-fiscal-service **#55** (`da3acd3` sur `dev`), docs (cette PR) ; contrat annoncé avant le code (#784). **321 n'était pas nécessaire** : « alimenter » = lier l'obligation à la balance de l'exercice, le calcul reste à `balance-service`. La prise en charge `A_PREPARER → EN_PREPARATION` lit les balances du dossier (jeton de l'appelant) : validée ⇒ `ALIMENTEES`, brouillon ⇒ `PROVISOIRES` (statut de preuve porté), sinon `409 BASES_FISCALES_BLOQUEES` avec le manque nommé (`BALANCE_ABSENTE`, `BALANCE_REJETEE`, `BALANCE_DESEQUILIBREE`, `BALANCE_NON_LISIBLE`) et le blocage écrit pour le calendrier ; `POST /obligations/{id}/bases` revérifie. Aucun droit neuf, aucun événement. **Amendement du contrat** : le champ `source.origine` annoncé n'a jamais été publié (la garde AD-14 interdit de lire l'origine d'une balance). Preuves : Node 24 178 suites / 2 487 tests ; `test:conformite` 13/77 sur `mongo:7` ; e2e 48/48 ; 11 mutations unitaires et 3 sur Mongo rouges sur l'assertion ; `docker compose up` sain, routes neuves en 401 ; pile `grp-a` `down -v`, verrou rendu. **Non prouvé** : lecture contre un `balance-service` réel (HTTP seul, adaptateur éprouvé contre le contrat lu dans `BalanceResponseDto`).
- **→ C (24/11) : la balance de référence d'un exercice** — **ouverte, non bloquante pour 322** : fiscal ne peut pas lire l'origine d'une balance (AD-14) et retient la plus haute version validée qui couvre l'exercice ; un socle `A_NOUVEAUX` ou une provision de version plus haute pourrait être retenu à tort. Demande : un filtre ou une route de `balance-service` qui rend LA balance de référence de l'exercice (celle de son moteur fiscal), et, si possible, un résumé sans les lignes (la liste rend les lignes de chaque balance).
- **Suite : STORY-322** (triplet calculé / déclaré / payé), puis 328. Point d'ancrage : `basesFiscales.source` dit sur quelle balance le calculé est produit ; `montantAttendu` reste `null` tant que 321 n'existe pas ; `montantSaisi` existe (314).
- *(ancien suivi)* 🟡 **STORY-320 en cours (24/11)** (n° 6 de A, chaîne 323 ✅ → 320 → 322 → 328) : fiche `stories/STORY-320.md` et contrat annoncé (« ⚠ Contrats ») avant le code. Code : `prospera-fiscal-service`, branche `MNV-320`, worktree `_wt-a-fiscal-320`. Décision d'ensemble : **321 n'est pas nécessaire** — « alimenter » = lier l'obligation à la balance (référence, état, statut de preuve), le calcul reste à `balance-service`. Point d'ancrage : la prise en charge `A_PREPARER → EN_PREPARATION`. Aucune demande à C ; recommandation non bloquante : une lecture résumée des balances par exercice (la liste rend les lignes).
- ✅ **STORY-323 DONE (24/11)** : prospera-fiscal-service **#54** (`cb672c5` sur `dev`), docs (cette PR) ; contrat annoncé avant le code (#775). `POST /api/v1/obligations/{id}/transition`, onze états strictement séquentiels, droit selon la cible (`preparer` / `valider` / `deposer`, aucun droit neuf : manifeste `declarations` et catalogue d'auth inchangés), visa de l'associé (nom copié de `identity_users`, date) exigé pour « À déposer », refus de droit journalisé, comparaison-échange, état et audit dans la même transaction. `depots` (538) inchangé ; correspondance écrite dans `etatDuCycleSelonLeDepot`. Preuves : suite entière sur Node 24 (175 suites, 2 433 tests), `test:conformite` 12/12 (70 tests) sur `mongo:7` en jeu de répliques, e2e `obligations` 41/41, 8 mutations rouges sur l'assertion, `docker compose up` sain et routes neuves en 401. Tracker : 323 `done` ; 333 et 334 NON réalignées (ce qui reste est nommé en commentaire : liaison de l'obligation au dépôt, retour en arrière). Version du tracker (7.2.0) inchangée : aucune entrée de la ligne ne l'a bougée depuis août.
- **Docker** : verrou pris puis rendu (pile `grp-a`, `down -v`, fichier supprimé). Gate sans auth-service : sain, 401 sur les routes neuves ; surcouche `ports: !reset []` sur minio (9001 pris) ; build depuis `git archive` du commit, volumes `mongo/` de l'archive (LF).
- **Suite : STORY-320** (bases fiscales alimentées par la balance validée, blocage motivé V3). Point d'ancrage : la prise en charge `A_PREPARER → EN_PREPARATION` ; le calendrier d'un dossier se lit déjà avec `blocage` (563) ; ne rien ressaisir.
- *(ancien suivi)* **2026-11-24 — STORY-323 en cours** (n° 5 de A, chaîne fiscale 323 → 320 → 322 → 328). Fiche écrite et contrat annoncé (ci-dessus, « ⚠ Contrats ») avant le code. Code : `prospera-fiscal-service`, branche `MNV-323`. Le manifeste du module est `declarations`, pas `fiscalite` : aucun droit neuf, donc rien à recopier au catalogue (pas de demande à B).

- **2026-11-24 — Maquettes de la console AP-57, AP-55, AP-59 publiées, EN ATTENTE DE VALIDATION.** Prototype console
  (`frontend-admin-panel/docs/mockups/ap-02-organisations.html`), PR **#34** (`lot6-maquettes-console`, non fusionnée).
  L'Artifact console du lot 4 (`7rbu7npMzRV9QE45CZsjJZ`) est introuvable (bascule de compte) : **nouvelle URL
  `https://claude.ai/artifact/4DyGogjGKen824fHcgViAy`**.
  - AP-57 : écran « Essais » (5 essais, une action par ligne, « Ouvrir un essai » avec le jeu coché d'avance).
  - AP-55 : section « Offre et mise en service » de la fiche (offre du métier pré-cochée, « Installer N modules », « Reprendre »).
  - AP-59 : colonne et filtre « Métier », « Changer de métier » sur la fiche.
- → B (24/11) : **STORY-1112** : relayer `POST /essais`, `GET /essais/{org}`, `POST …/prolongation`, `…/signature`,
  `…/jeu-demonstration`, `POST/GET …/effacement` (corps et codes de refus du catalogue, tels quels), **et ajouter une
  liste des essais** (`GET /admin/essais` : le catalogue ne sert que la lecture par organisation) ; recommandé aussi :
  `POST /admin/essais` qui enchaîne la naissance du prospect (`POST /naissances`) puis l'ouverture, avec le jeu choisi
  par le BFF selon le métier (le catalogue attend un code et une version de jeu, sans route pour les lister) — ouverte.
- → B (24/11) : **STORY-1114** : `vertical` (code du service) dans `GET /admin/orgs`, `GET /admin/orgs/{id}` et un filtre
  `vertical` sur la liste ; relais de `GET /admin/verticaux` et `PATCH /admin/organizations/{id}/vertical` (corps `vertical`,
  `reason` facultatif ; refus `VERTICAL_ROLES_INCOMPATIBLES` 409 et `VERTICAL_INCONNU` 400 transmis avec leur code) — ouverte.
- → B (24/11) : **AP-55** : relayer `GET /etat-publie/{org}` (aujourd'hui sans relais BFF) en lecture pour `org:read` ; les
  relais d'offre et d'installation existent déjà — ouverte.
- Questions posées à l'utilisateur pour la validation, avec la réponse par défaut :
  1. Créer le prospect dans le même geste que l'essai (nom + métier + courriel) ? Défaut : oui (AC-1 le demande).
  2. « Prêt à signer » n'existe pas côté serveur : « Signer » est proposé en principal quand l'essai est terminé ou en dernière semaine déjà prolongé, sinon dans « Détails ». OK ? Défaut : oui.
  3. « Signer » en un clic sans confirmation, « Effacer » avec confirmation ? Défaut : oui.
  4. Retirer « Activer un vertical » de la fiche (remplacé par l'offre) et garder « + Octroyer » jusqu'à la fusion de 1080 ? Défaut : oui.
  5. Mots courts des métiers (Cabinet, Distributeur, Microfinance, Assurance) au lieu des libellés du service ? Défaut : oui, table de l'écran ; « Plateforme » n'est pas proposé au changement.
  6. Les autres écrans (tableau de bord, assistant) gardent Distribution/Finance jusqu'à AP-58 ? Défaut : oui.
- ✅ **2026-11-24 — Les trois maquettes sont VALIDÉES par l'utilisateur**, avec les six réponses par défaut retenues : AP-57 et
  AP-59 d'abord, puis AP-55 une fois corrigée sa visibilité (Artifact version 2). Dans la version 1, la section était au fond de
  la fiche, sous le KYC. Elle est maintenant sous l'identité de la fiche, et « Installer l'offre » est une action de ligne de
  l'annuaire, du menu ⋮ et de l'écran Essais. PR #34 fusionnée. Code : AP-55 après STORY-1080, AP-57 après 1112, AP-59 après
  1114, toutes trois du groupe B.

- **2026-11-24 — Maquettes du cabinet FE-149, FE-150, FE-141 publiées, VALIDÉES PAR L'UTILISATEUR LE 24/11.** Prototype cabinet
  (`prototypes/prospera-prototype.html`), branche `lot6-maquettes-cabinet`. L'Artifact cabinet `9iBJj5jTd1552uNPpZDJiL` est
  illisible depuis ce compte (bascule de compte) : **nouvelle URL `https://claude.ai/artifact/FEn4wbM4pYPJYJ3uqLoBgp`**, version 1.
  - FE-149 : Atelier › « Factures » : déposer (vrai téléversement), lecture, relecture avec un seul bouton « Inscrire les 3 factures
    cochées », brouillard et journaux (valider, abandonner), renvoi des dossiers SMT vers les cahiers, refus nommés.
  - FE-150 : la marque « Repris de vos choix » (mémoire du dossier, du cabinet, compte par défaut, modifié, écarté) dans la relecture
    des factures et des cahiers ; « Choix mémorisés » en onglet du dossier et page du profil du cabinet, oublier avec confirmation.
  - FE-141 : Bilan › « Analyse » : 19 indicateurs calculés sur la liasse du prototype (assertés), lignes qui s'ouvrent, repères,
    incalculables, non applicable, et bloc des indicateurs de dette. Fiche FE-141 écrite.
  - **Écart backend à décider (FE-141)** : les paquets publiés `syscohada-revise@2.2` et `@2.3` ne déclarent AUCUN seuil
    (STORY-553 contenant seul) : aujourd'hui tous les verdicts sont « aucun repère déclaré ». La maquette dessine le verdict avec
    trois repères d'exemple, marqués. Peupler les repères est une story de sourcing (non écrite).
- ✅ **2026-11-24 — FE-149, FE-150 et FE-141 sont VALIDÉES par l'utilisateur**, avec les 7 réponses par défaut retenues ci-dessous,
  **sauf un ajout sur FE-149** : « me donner la possibilité de modifier directement » la facture à corriger. Rendu : tous les champs
  lus se modifient sur place, et l'écriture proposée se modifie directement dans son tableau (compte, débit, crédit, ajouter, supprimer,
  total et équilibre en direct, « Modifié par vous »). Artifact mis à jour (même URL). Statuts : FE-149 et FE-141 `ready-for-dev`,
  FE-150 `blocked` (attend STORY-1099).
- → C (24/11) : **l'édition libre des lignes d'une écriture de facture n'est pas servie** : `POST …/factures/lots/{lotId}/inscrire`
  n'accepte en correction que les montants, `compte`, `tiersId`, `journal`, `tva`, `compteDeTva`, `avoir`, `libelle`, `devise`, `dateEcriture`,
  `numeroFacture` ; les lignes sont dérivées (D-1097-8). Demande : `lignes[]` en correction, avec les contrôles de la saisie du brouillard
  (équilibre, comptes du plan propre, deux lignes au moins), et préciser que `inscrire` lève les signaux réparés par une correction. Ticket :
  `tickets/TICKET-BACKEND-comptabilite-ecriture-de-facture-modifiable-ligne-a-ligne.md` (GAP dans `sprint-status.yaml`) — ouverte.
- Questions posées à l'utilisateur pour la validation, avec la réponse par défaut :
  1. FE-141 : montrer les verdicts avec des repères d'exemple (marqués) tant que le référentiel n'en déclare aucun ? Défaut : oui ; le banc d'essai montre l'état réel.
  2. FE-149 : « Inscrire les 3 factures cochées » ne coche d'avance que les factures sans aucun avertissement ? Défaut : oui.
  3. FE-149 : l'onglet s'appelle « Factures » et le brouillard est une vue de cet onglet ? Défaut : oui.
  4. FE-149 : pièce illisible = « Redéposer une photo » seulement (pas de saisie à la main, absente du contrat) ? Défaut : oui.
  5. FE-150 : « Choix mémorisés » en onglet du dossier, page du profil du cabinet (lisible par tous, oubli réservé à l'administrateur) ? Défaut : oui.
  6. FE-150 : cahiers et écritures partagent le même écran de gestion de la mémoire ? Défaut : oui.
  7. FE-141 : pas de variation N / N-1 à l'écran (on ne recalcule jamais) ? Défaut : oui.

- **2026-11-24 — Le lot 6 de A change (consigne de l'utilisateur).** FE-150, AP-55, AP-57, AP-59 sortent du lot (lot 7) ;
  A prend la chaîne fiscale **323 → 320 → 322 → 328** (plan amendé, §3 et §4). Ordre : FE-149 → 323 → 320 → 322 → 328 →
  FE-141. Le financement reste après (l'utilisateur).
- **Passation (24/11) : C → A, `prospera-fiscal-service`**, accord de la session C (aucun travail en cours chez elle) ; A le
  rend à C à la fusion de 328 (ligne de passation ici). C prend 326 juste avant 1101, puis 315, 316.
- ⚠ Constat de la recherche du 24/11 : STORY-1101 dépend de 322, 326 et 328, qui n'existaient pas ; le tracker fiscal est
  périmé (315 → 350 `not_started` alors que 333, 334 et une partie de 335 sont couverts par 537 → 539, 688 → 691) ;
  `prospera-dossier-service` n'a plus rien d'ouvert pour le cabinet. Ids libres à partir de **STORY-1117**.
- → B (24/11) : deux résultats faux de `bilan-service` visibles à la démo du 15/01 : projection qui rembourse plus que la
  dette (`TICKET-BACKEND-projection-remboursements-non-plafonnes.md`, accepté par l'utilisateur le 19/11) et liasse
  rouverte lue avec `version: null` (`TICKET-BACKEND-liasse-rouverte-version-null.md`) ; à placer après 1080 — ouverte.

## Questions à l'utilisateur ou au PO

- **Parcours réel du dossier de financement (2026-11-21), avec le choix retenu par défaut** (aucune ne bloque l'écriture des fiches) :
  1. **Types de fichier et taille** : PDF, JPG, PNG, DOCX, XLSX, **20 Mo** par fichier (D-1104-9). Défaut : ceux-là.
  2. **Brouillons chiffrés du projet** (CA du camion, marge, charges) : la maquette en montre ; le serveur n'invente aucun chiffre et
     les tire d'un « modèle de projet » du référentiel AP-50 quand il existe (D-1111-1). Défaut : saisie par le cabinet, sinon rien.
  3. **Ordre générer, figer, marquer prêt** (celui de la maquette) : il amende l'AC-5 de 1086 (« générer exige `PRET` ») ; figer
     exige les exigences bloquantes remplies, et une modification après le figement périme la version (1086, AC-7). Défaut : l'ordre de la maquette.
  4. **Valeurs de démonstration à faire confirmer par une banque avant la première vente** : taux indicatif 12 %, assurance 0,30 % par
     an, décotes par défaut (30, 40, 50, 0, 28 %), repères d'apport et de couverture, seuils de crédibilité. Défaut : celles des fiches.
  5. **Les documents que la maquette montre et que 1109 ne couvre pas** (déclaration de patrimoine, modèle de CV, formulaires de la
     banque, bilan d'ouverture) : fiches maintenant ou plus tard ? Défaut : plus tard (nommés).

- **Réponses du 2026-11-18** : voir « État », lot 4 (D-923-1 renversée ; D-928-3 remplacée par STORY-1082 ; D-926-2,
  D-926-6 et la lecture du fichier déposé de 300 confirmées). **Restent retenues par défaut, sans réponse** : D-923-2,
  D-924-1, D-925-1, D-927-3, D-929-1, D-929-2 ; la question de B (970) « rouvrir N quand N+1 est OUVERT » (défaut :
  rien ne change chez A). **Pièces attendues de l'utilisateur, pas de sitôt (18/11 : on avance sans)** : le texte de la loi 2011-018 (901) ; l'avis d'un
  fiscaliste sur les deux lectures de 568.

- **STORY-300** : le mode de compatibilité par rôle des droits fiscaux (TENANT_ADMIN = tout, TENANT_USER = préparer)
  reste-t-il, et jusqu'à quand ? **Retenu par défaut (2026-11-15)**, selon la règle de l'utilisateur : « appliquer ce
  que A recommande, contestable après coup ».
  - Le mode reste jusqu'à la fusion de STORY-902, qui y met fin : un jeton sans droit fiscal est alors refusé.
    ✅ **Fait le 2026-11-15** : auth #37, puis fiscal #43.
  - STORY-902 attribue d'abord les droits `fiscalite:*` aux rôles du cabinet existants, pour que personne ne perde
    l'accès.
  - STORY-902 garde donc sa place (n° 5 du lot), sans attendre 313 et 314.
- **STORY-300, lecture du fichier déposé** : `GET /depots/:id/fichier` et `/audit` n'exigent que le rôle. Tout membre
  du cabinet lit donc le fichier déposé. **Retenu par défaut : on garde**, conformément à la règle d'or de 300 (la
  lecture suit le rôle). Si le PO veut un droit `fiscalite:declaration:lire`, il le dit.
- ✅ **Production : le seed du catalogue** — **réglée par STORY-940** (catalogue #49, recette #20 ; semis
  corrigé, migration pour les bases existantes, contournement de la recette retiré). Constat d'origine (STORY-901) : Le catalogue n'autorise aucun paquet `fiscal-tg-*`
  pour le module `declarations`, puisque `fiscalite` est retiré de l'offre. L'octroi échoue donc en
  `422 REFERENTIEL_INCOMPATIBLE`, et fiscal-service ne recevrait aucun paquet en production. La recette contourne
  par `PATCH /admin/modules/declarations`. **Demandée par l'utilisateur le 2026-11-15** : à faire **après le lot de
  B**, dans `prospera-platform-catalog-service` (dépôt de B) : corriger le seed, puis retirer le contournement de la
  recette.

## Dette relevée

- **Lot 2 (918, 2026-11-16)** :
  1. **Ingestion de balance** : le service d'ingestion autorise encore l'organisation par `OrgBalanceEntitlement` (identité
     de service, que la garde partagée ne modélise pas : `identite: 'UTILISATEUR'` seulement). À reprendre quand la
     matrice aura une identité de service (D-918-5).
  2. ~~**`double-lecture.ts`** (balance, bilan, fiscal) : `decisionAncienne`, `memeDecision`, `libelle` ne servent plus
     depuis 918 ; copies identiques laissées en place, à retirer ensemble.~~ **Faite par STORY-922 (2026-11-17).**
  3. **Recette `cabinet-moteur`** : installe par le `PUT` de la console (plan `CONSOLE_PUT`) — **éprouvée et écrite par STORY-929 (D-929-1) ; reste ouverte, portée par STORY-1080** ; passer à
     `POST /installations` quand balance et bilan serviront leurs routes de vérification (C13, D-918-4). **Import et effacement servis par STORY-928 (2026-11-17) ; restent les `verifications/…`** (STORY-929).
  4. ~~**BFF** : `PATCH /dossiers/{id}` (916) n'est pas relayé pour le collaborateur ; le 409 de version doit rester muet
     côté écran.~~ **Faite par STORY-923 (2026-11-17).** Reste : la console doit migrer vers les routes d'installation (lot de D).
  5. ~~**Fiche dossier, surface 2 (complétude)** : ouverte.~~ **Faite par STORY-924 (2026-11-17)**, ticket « trois surfaces » fermé. Reste le relais BFF de la complétude, à la demande de l'écran.

- **Mise en service des invitations (569)** : poser `JETONS_DE_SERVICE` dans fiscal-service, `NOTIFICATION_*` et
  `ESPACE_DECLARANT_URL` (fiche 569). Écrit jusqu'ici dans la relecture finale seulement.

- **Audit fiscal (299)** : la suppression de la **dernière** entrée d'une chaîne est indétectable. Seul le rôle
  find+insert du compte l'empêche. L'ancre externe (empreinte de tête publiée) sera à décider avec la spine fiscale.

## Procédures

### Publier le paquet fiscal Togo 2026 au catalogue, à la mise en service (geste d'administration)

Le paquet a été modifié quatre fois le 14/11 (305, 307, 308, 901). En production, **aucun** paquet `fiscal-tg-*` n'a
jamais été publié, puisque le seed ne les autorise pas : on publie donc la version `2026.1` **une fois**, avec les
octets de `balance-service` du tag déployé.

**Qui :** un administrateur de la plateforme (`PLATFORM_ADMIN`), avec son jeton, contre `platform-catalog-service`.

1. **Prendre les octets.** Le fichier se lit dans le tag de `balance-service` effectivement déployé, extrait en **LF**
   (`git -c core.autocrlf=false show <tag>:<chemin>`), et non dans un checkout Windows. Empreintes au 2026-11-15
   (`origin/dev`) :

   | Code, version | Fichier (`balance-service/src/modules/referentiel/assets/`) | sha256 |
   |---|---|---|
   | `fiscal-tg-entreprise@2026.1` | `paquet-fiscal-togo-2026.json` | `e8e94c846227e9429b4e7e641bc7ea0c8364f774616359d22ce0970f97df0dc6` (STORY-907) |
   | `fiscal-tg-entreprise-zone-franche@2026.1` | `paquet-fiscal-togo-zonefranche-2026.json` | `da92a432ed175189d46a71f2c526579194cb9b250f04e017b2d31c380f360f74` |

   L'empreinte calculée doit être celle qu'épinglent `balance-service` et `prospera-dossier-service`. Sinon, on
   s'arrête : les copies ont divergé.
2. **Publier chaque paquet** :
   `POST /admin/referentiels/<code>/<version>/artifact` (multipart : `file`, `expectedChecksum=sha256:<empreinte>`).
   Le catalogue écrit l'objet, puis crée la version `ACTIVE`. Un **409** veut dire que `(code, version)` est déjà
   pris : une version publiée ne se réécrit jamais.
3. **Ouvrir le module.** Depuis STORY-940, le semis du catalogue donne à `declarations` les deux familles
   `fiscal-tg-*`. Sur une base semée **avant** 940, on joue une fois la migration du catalogue :
   `npm run migrate:familles-fiscales` (ou `node dist/migrations/familles-fiscales-de-declarations.js` dans l'image).
   Elle ajoute seulement, et nomme les paquets pas encore déposés au registre. Plus de `PATCH` à la main.
4. **Octroyer** à chaque cabinet abonné :
   `PUT /entitlements/<organisationId>/declarations`, corps `{ "versionCode": "1.0", "status": "ACTIVE", "referentiels": [{ "code": "fiscal-tg-entreprise", "version": "2026.1" }, …] }`.
   Un utilisateur du cabinet ne voit les droits qu'après le **renouvellement** de son jeton.
5. **Contrôler.** fiscal-service sert le paquet d'un exercice (`GET …/exercices/:exerciceId/paquet-fiscal`) avec la
   même empreinte ;
   `balance-service` applique le même artefact.

**Toute modification ultérieure du paquet** passe par une **nouvelle version** (`2026.2`…), publiée par les étapes 1
à 4. L'ancienne passe ensuite en `DEPRECATED` (`PATCH /admin/referentiels/<code>/<version>`). Elle ne passe **pas** en
`RETIRED` tant que des exercices y sont rattachés : le catalogue cesse alors de la servir et de l'octroyer.

## Pièges rencontrés

- **PRA-02 (prospera-app, 25/11)** : (1) l'entrée interne `traefik` écoute par défaut sur :8080 : avec `web` sur :8080 le conteneur plante (« address already in use ») ; la déplacer (`TRAEFIK_ENTRYPOINTS_TRAEFIK_ADDRESS=:8082`) et passer la même adresse à `traefik healthcheck`, qui n'a pas la config du conteneur. (2) Compose résout les chemins relatifs depuis le dossier du PREMIER `-f` : un montage `./traefik/…` d'un fichier superposé pointe à côté du compose racine ; variable `COQUE_INFRA` en chemin absolu. (3) `localhost` se résout en `::1` où `wslrelay` réinitialise la connexion alors que `127.0.0.1:8080` répond ; `curl -4`. (4) `TRUSTED_PROXIES=uniquelocal` est refusé en production par `reseau-service` : un CIDR. (5) `docker compose up --build <services>` reconstruit TOUS les services nommés (auth, catalogue) : sans `--build` si l'image existe déjà. (6) VS Code recrée des `index.ts` barrels dans `src/` et `outils/fixtures-lint/` d'un worktree ouvert : `git status` et `git clean` avant chaque commit, `git add infra` seulement. (7) Un `sed -i` sur un fichier monté en liaison crée un nouvel inode que le conteneur ne voit pas : écrire par `cat > fichier` puis `docker restart`.
- **PRA-01 (prospera-app, 25/11)** : (1) un verrou `package-lock.json` écrit sous Windows manque `@emnapi/core` et `@emnapi/runtime` : `npm ci` rouge sous Linux (« Missing: @emnapi/runtime from lock file ») alors que `npm ci --dry-run` passe en local ; deux devDependencies explicites suivies de `npm install --package-lock-only` règlent le cas. (2) `no-restricted-imports` en `group` est un motif de type gitignore : `sonner` attrape aussi le fichier `@/coque/ui/sonner` ; utiliser `regex` ancrée. (3) `eslint-plugin-boundaries` 7.4.4 : `policies` + `from: { element: { type } }` ; la forme `rules` / `from.type` de la doc v6 ne dit rien ; il classe depuis `process.cwd()` (variable `ESLINT_PLUGIN_BOUNDARIES_ROOT_PATH` pour un test sur fixtures) ; l'option `mode` est dépréciée. (4) Le barrel `@/coque/ui` importé dans le layout coûte 99 Ko gzip (237 212 contre 138 293) : le client ne découpe pas un `export *` de modules `"use client"`. (5) `src/test/setup.ts` doit tolérer l'environnement `node` (`typeof window`) pour les tests d'outillage. (6) Les heredocs bash qui contiennent des `\\` ou plus de ~50 lignes de JS/Markdown échouent (« unexpected EOF ») : écrire le fichier avec l'outil d'écriture. (7) `gh pr edit` échoue (jeton sans `read:org`) : `gh api -X PATCH repos/…/pulls/N -F body=@fichier`. (8) Git Bash convertit `origin/dev:.github/…` en chemin Windows : `MSYS_NO_PATHCONV=1` devant `git show`. (9) Sur ce poste chargé, ESLint met 15 à 60 s par appel : lancer les mutations en arrière-plan et attendre.

- **2026-11-25 — Une suite non rejouée après le dernier commit a laissé `dev` rouge (STORY-328).** Le test du cycle de 323
  (`DECLARE_ABSENT_AU_DEPOT`) est resté rouge sur `dev` du fiscal depuis la fusion de 328 ; C l'a corrigé avec STORY-1117
  (fiscal #58 `b2efaa7`). Règle : la suite unitaire **complète** se rejoue sur le dernier commit avant la fusion, jamais la
  seule suite corrigée ; « non prouvé » ne suffit pas pour fusionner.
- **STORY-328 (fiscal)** : (1) un `$setOnInsert` d'upsert est GARDÉ par un test qui énumère les champs humains (`mongo-registre-obligations.spec.ts`) : un champ humain neuf rougit cette suite, c'est voulu ; (2) `Object.prototype.hasOwnProperty` pour chercher un code dans le catalogue (un `catalogue['constructor']` répond sinon) ; (3) un test de comparaison-échange qui change DEUX choses à la fois (le fait et l'état) ne prouve ni l'un ni l'autre : la mutation « ignorer l'état lu » a survécu jusqu'à ce que l'état soit éprouvé SEUL ; (4) l'ordre des vérifications fait le contrat : le motif d'écart (322) répond avant la porte des anomalies, le droit avant les gardes ; (5) Git Bash : `MSYS_NO_PATHCONV=1` casse `git -C /c/...` et `tar -C` ; le poser SEUL devant la commande `docker run` qui monte un chemin Windows ou un `--entrypoint` ; (6) un `mongo:7` jetable pour `test:conformite` : `--entrypoint bash`, `demarrer-mongo-fiscal.sh` monté depuis l'archive en LF, `MONGO_HOTE_ANNONCE=127.0.0.1:27017`, port `127.0.0.1:27020` ; (7) le verrou Docker de C a tenu plus de 2 h (1100) : prévoir de coder les preuves non-Docker (mutations, e2e) pendant l'attente ; (8) `Date.now() < 0` rend une mutation inerte sans casser la compilation (import ou paramètre resté utilisé) ; un script de mutation relit chaque fichier à l'identique après coup (`git status`).
- **STORY-322 (24/11)** : (1) un DTO dont la propriété est typée par une classe définie PLUS BAS dans le fichier plante au chargement (`Cannot access 'X' before initialization`, métadonnée de décorateur) : définir les classes filles AVANT la classe mère. (2) Docker Desktop s'est arrêté en pleine suite Mongo (`EUNKNOWN`, tout rouge `ECONNREFUSED`) : vérifier `docker ps` avant d'interpréter un rouge, relancer Docker Desktop. (3) Une mutation `cond ? a : b` écrite `Date.now() < 0 ? 0 : cond ? …` reste INERTE (précédence) ; une mutation qui laisse une variable inutilisée casse la compilation : toujours vérifier que le rouge vient de l'assertion. (4) Prettier réécrit les conditions sur plusieurs lignes : le motif d'un script de mutation doit se relire sur le fichier formaté. (5) Un script Python lancé par `subprocess` sous Windows doit lire en `encoding='utf-8'`, et un `finally` doit restaurer le fichier muté. (6) Les `heredoc` de plus de ~180 lignes n'écrivent rien : utiliser l'outil d'écriture.
- **STORY-320 (24/11)** : (1) la garde `garde-agnosticisme-balance.spec.ts` (AD-14) refuse toute valeur d'origine de balance dans `src/` : `A_NOUVEAUX`, `PROVISIONS_FISCALES`… même pour les EXCLURE. (2) `RefusMetier` n'a pas de `getStatus()` : tester `code` et `nature` (le 409 est posé à la frontière). (3) Les scripts Python écrits par heredoc dans l'outil Bash cassent sur les apostrophes : écrire le script avec l'outil d'écriture. (4) Les sources du worktree sont en CRLF (autocrlf) : un remplacement multi-lignes doit normaliser les fins de ligne. (5) `mongo:7` en jeu de répliques : `demarrer-mongo-fiscal.sh` avec `MONGO_HOTE_ANNONCE=127.0.0.1:27017` et le port 27020 publié suffit à `test:conformite` (identifiants `fiscal_app_dev`). (6) Mutation qui devient une erreur de compilation (import ou paramètre inutilisé) : la rendre inerte par `Date.now() < 0` plutôt que `false`. (7) Le consommateur Kafka du service réessaie « Unknown topic or partition » sur une pile sans les topics `identity.*` : le service reste sain (déjà vu en 323).
- **STORY-323 (fiscal)** : (1) le manifeste du module est `declarations`, pas `fiscalite` ; (2) `domain/` ne peut pas importer `common/rbac` (garde de pureté) : les droits vivent en `application/` ; (3) un `ajouter(session)` du journal d'audit non transactionnel passe un test « l'audit échoue ⇒ l'état est annulé » ; il faut écrire l'audit PUIS échouer, pour voir qu'il est annulé avec l'état ; (4) sur Node 25 les suites qui chargent le client Kafka échouent (`Cannot find module 'bindings'`) : jouer la suite entière dans l'étage `verification` (Node 24) ; (5) le worktree CRLF casse les `assets/*.json` et `test/fixtures/*.json` hachés et les scripts `mongo/` (conteneur Mongo « $'\r' command not found ») : les réécrire en LF (un `rm mongo/*` est refusé par le poste) ; (6) `heredoc` Python : les `\n` et les antiquotes se perdent, écrire le script dans un fichier ; (7) un worktree se branche sur `node_modules` du checkout principal par une jonction (même `package-lock.json`).

- **(STORY-1097, groupe C)** Jest résout `./x` vers `x.json` AVANT `x.ts` (`moduleFileExtensions: js, json, ts`) :
  une donnée `comptes-de-facturation.json` à côté de `comptes-de-facturation.ts` rend un module VIDE en test (tsc ne
  voit rien). Nommer la donnée autrement (`…-declares.json`).
- **(STORY-1097)** Deux jobs Docker lourds en même temps (unitaires dans un conteneur, `test:socle` dans un autre) font
  rougir les tests de CONCURRENCE du socle (503 des doublures à 800 ms : clôture, grand livre, numérotation). Rejoués
  seuls : verts. Ne jamais les lancer ensemble.
- **(STORY-1097)** Dans les suites du socle, `jeton(...)` fabrique un jeton NEUF à chaque appel : pour comparer le
  jeton relayé à document-service, garder celui qu'on a envoyé.
- **(STORY-1097)** `module.manifest.spec.ts` compare au checkout LOCAL `MoneyVibes_Apps/prospera-stories`, souvent sur
  une autre branche : comparer plutôt à `git show origin/main:manifestes/comptabilite.manifest.ts`.
- **(STORY-1097)** Le générateur de barrels de l'IDE recrée `src/index.ts` et `src/<module>/index.ts` à chaque fichier
  neuf : les retirer avant chaque `tsc`, test et commit (`git status --short`).

- **Gate front sur la vraie pile (FE-069, 18/11)** :
  - les courriels de l'IdP passent par `notification-service` : sans lui, le courriel de vérification n'arrive jamais
    (« Échec de remise du job send-verification-email : TypeError » dans auth) ;
  - au catalogue, `bilan` exige `balance` (`422 MODULE_DEPENDANCE_MANQUANTE` si on octroie dans l'autre ordre) ;
  - `expert-comptable` plante sans `NODE_ENV: production` (`pino-pretty`) ;
  - les axes du dossier arrivent à balance par Kafka : réessayer l'analyse d'import quelques secondes ;
  - les images ont été construites depuis `git -c core.autocrlf=false archive origin/dev` dans le scratchpad, avec une
    surcouche `build.context` : aucun checkout d'un autre groupe n'est touché.
- **Vitest** se lance depuis `C:\…` en majuscule (PowerShell `Set-Location`) ; depuis Git Bash, « no tests ».
- Un `\b` écrit par un script Python dans une chaîne non brute devient un caractère de contrôle (0x08) : la regex
  compile et ne reconnaît plus rien. Écrire les regex par l'outil d'édition, ou en chaîne brute.

- **`bilan-service` aussi** : ses 72 JSON sortent en CRLF sous `core.autocrlf=true` ; son image refuse alors ses
  référentiels (« checksum invalide », 502 à la remise de `balance.created`). Il faut ré-extraire en LF
  (`git -c core.autocrlf=false checkout --`) AVANT de construire l'image.

- **Une suite qui ne COMPILE pas n'apparaît pas dans un filtre `grep "●.*›"`** : « Tests: 47 passed » venait des
  AUTRES suites. Il faut toujours lire `Test Suites: … failed` et lancer le fichier seul.

- **Un témoin « avant la correction » fait par `git switch dev` est FAUX** : le switch emporte les modifications
  non commitées, et `compose up --build` peut même ne pas recréer le conteneur (« Running »). Il faut mettre de côté
  (`git stash push -u`), puis `up --build --force-recreate`, et vérifier dans l'image que le code neuf est absent.
- **Un test qui compare à la constante qu'il teste ne mord pas** : la mutation de la borne du fan-out l'a montré. La
  valeur attendue s'écrit dans le test.

- **Deux sessions « groupe A » sur le même poste (2026-11-15)**. La même consigne a été donnée à deux sessions,
  qui ont codé STORY-345 dans le **même checkout** et se sont écrasé les fichiers. L'utilisateur a tranché : **une
  seule session porte le lot** (`moneyvibes-apps-32`). Avant d'écrire dans un dépôt partagé du poste : `git status`,
  et si des fichiers qu'on n'a pas écrits apparaissent, `ListAgents`, puis s'arrêter.
- `@Prop` de `@nestjs/mongoose` sur un champ typé par une **union** (`'A' | 'B'`) fait échouer le **chargement du
  module** (« Cannot determine a type »). `tsc` ne le voit pas ; l'invariant `app.module` et `docker compose up` le
  voient. Il faut toujours `type: String` avec un `enum`.

- La recette de `prospera-recette` fait `up` **sans** `--build` : reconstruire à la main l'image du service modifié.
- `prospera-fiscal-service` : `test:conformite` exige un MongoDB en jeu de répliques ; un `mongo:7` jetable lancé avec
  `mongo/demarrer-mongo-fiscal.sh` (scripts en LF), `-p 127.0.0.1:27020:27017`, `MONGO_HOTE_ANNONCE=localhost:27017`.
- La suite unitaire du fiscal est instable en parallèle complet : `-w 2`.
- Scripts `mongo/` de fiscal-service en CRLF sur Windows : le conteneur `mongo-fiscal` ne démarre pas. Faire
  `git -c core.autocrlf=false checkout -- mongo/`.
- Jouer une commande de fiscal-service sans lever toute la pile :
  `docker compose -p grp-a -f docker-compose.yml -f prospera-recette/docker-compose.recette.yml -f prospera-recette/docker-compose.fiscal.yml --profile fiscal run --rm --no-deps fiscal-service node dist/<script>.js`
  (après `up -d --no-deps mongo-fiscal`).
