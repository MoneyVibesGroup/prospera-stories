# Lot 7 du groupe A : la coque, la console de mise en service, les écrans cabinet de février

> **Date :** 2026-11-25 · **Statut :** **validé par l'utilisateur le 2026-11-25** (« oui je valide ce plan »), avec un
> ajout : la story « choisir la tenue de l'exercice » entre au lot 7 (§3). En vigueur à la fusion de ce document.
> **Consigne de l'utilisateur (25/11) :** « essayons de planifier le lot 7 du groupe A ».
> **Complète** `PLAN-LOT-7-2026-11-24.md`, qui ne couvre que C et D (« le lot 7 de A […] et celui de B restent à
> écrire »). **Le lot 7 de B reste à écrire.**
> **Sources :** `PLAN-LOT-6-2026-11-23.md` (amendements du 24/11, D-L6-4, D-L6-5), `PLAN-COQUE-EPIC-265-2026-11-24.md`,
> `frontend-sprint-status.yaml`, `sprint-status.yaml`, fiches `frontend-stories/AP-5x.md`, `FE-15x.md`.

---

## 0. Ce qui change le lot 6 de A avant d'écrire le lot 7

1. **La coque a des dates qui tombent dans le lot 6.** PRA-01 fini le **27/11**, PRA-05 le **04/12**, PRA-11 le
   **18/12** (plan de la coque, §2). Elle « s'ajoute au plan du lot en cours » et se prend quand la story en cours est
   finie. **Juste après FE-141, A prend donc PRA-01**, puis PRA-03 → PRA-04 → PRA-05.
2. **L'amendement D-L6-5 a mis 24 écrans au lot 6 de A** (lignes 0 à 12, après FE-141). Avec la coque, ils ne tiennent
   pas avant le 03/12. **Proposition :** le lot 6 de A se ferme sur FE-141, PRA-01, PRA-03, PRA-04, PRA-05 et la
   ligne 0 (remise à jour du tableau de suivi des écrans, documentation seule). Les lignes 1 à 8, qui sont pour
   février, passent au lot 7. Les lignes 9 à 12, qui sont pour après février, passent au lot 8.
3. **La console est débloquée.** Les relais du BFF sont livrés par B : STORY-1080 (installation), 1112 (essais), 1113
   (mise en service), 1114 (métier). Les fiches AP-55, AP-56, AP-57 et AP-59 disent encore `blocked` : à réancrer.

## 1. Le lot 7 de A : 22 stories, dans l'ordre (la 22e : l'écran de la tenue de l'exercice, §3)

| # | Story | Ce que voit l'utilisateur | Backend | Maquette | Quand |
|:--:|---|---|---|---|---|
| 1 | **PRA-06** | le registre, le menu, la garde unique, les écrans d'état de la coque | coque | — (technique) | S5 |
| 2 | **AP-57** | ouvrir et suivre l'essai d'un prospect (créer, prolonger, signer, jeu de démonstration, effacement) | 1112 ✅ | ✅ validée (#34) | **avant la démo du 15/01** |
| 3 | **AP-56** | mettre une organisation en service (naissance, répétition, mise en service, sorties de l'essai) | 1113 ✅ | ✅ validée (25/11, #35) | avant le 15/01 |
| 4 | **AP-55** | installer l'offre en un clic, reprendre un plan inachevé, l'état publié ; l'octroi par `PUT` retiré | 1080 ✅ | ✅ validée (#34) | février |
| 5 | **AP-59** | le métier de l'organisation, lu, filtré, changé en un geste | 1114 ✅ | ✅ validée (#34) | février |
| 6 | **PRA-10** | le module d'écran `reseau` | coque | ⏳ à faire | S6 |
| 7 | **PRA-11** | l'Integration Gate de la coque sur le vrai moteur | coque | — | **≤ 18/12** |
| 8 | **FE-150** | les suggestions « Repris de vos choix » dans les cahiers | 1098, 1099 ✅ | ✅ validée (#762) | février |
| 9 | **FE-038** | l'export PDF / Excel de la liasse | ✅ | ✅ validée (25/11) | février |
| 10 → 12 | **FE-081, FE-096, FE-095** | le dépôt et son accusé, le classeur e-DSF, le rejet | ✅ | ✅ validée (25/11) | février |
| 12 bis | **FE-112** | la liste des obligations fiscales du dossier (question 9 du paquet 2, validée le 25/11) | fiscal ✅ | ✅ validée (26/11) ; se code avant FE-081 | février |
| 13, 14 | **FE-040, FE-041** | le profil de la société, pré-rempli par la lecture des documents | ✅ | ✅ validées (26/11) | février |
| 15, 16 | **FE-097, FE-098** | le registre des immobilisations, le plan d'amortissement | 526 → 528 ✅ | ⏳ | février |
| 17 | **FE-084** | l'inventaire de clôture | 534, 535 ✅ | ⏳ | février |
| 18 → 20 | **FE-116, FE-117, FE-118** | la liquidation et la TPU relues, les déficits, le régime dérogatoire | ✅ | ⏳ | février |
| 21 | **FE-077** | l'export de l'état de rapprochement | STORY-1020 (C) | ⏳ | quand C l'a livrée |

**Maquettes d'abord, par paquets.** Comme au lot 6 : un paquet de 3 ou 4 écrans ajoutés au prototype, validés par
l'utilisateur, puis le code écran par écran. Premier paquet : AP-56 et PRA-10 (console et coque). Deuxième : FE-038,
FE-081, FE-096, FE-095. Troisième : FE-040, FE-041, FE-097, FE-098. Quatrième : FE-084, FE-116, FE-117, FE-118, FE-077.

**Remplaçantes** si une story bloque : AP-58 (packs et manifestes, `ready-for-dev`), AP-60 (rôle de plateforme),
AP-61 (annuaire en lot), FE-147 (export du portefeuille).

## 2. Ce qui n'entre pas au lot 7 de A, et pourquoi

- **Le financement** (écrans FE-142, FE-152 → 157, AP-50). Aucun backend n'est fait : STORY-1104 → 1111 sont
  `ready-for-dev` sans porteur, dans `prospera-bilan-service`, que tient D (D-L6-5) ; D passe le lot 7 sur le fiscal.
  AP-50 attend en plus le référentiel `exigences-bancaires-uemoa`. **Recommandation :** les huit stories backend vont à
  **Dev A, qui arrive le 04/12** (backend), avec une passation de `prospera-bilan-service` écrite par D ; les écrans
  suivent au lot 8 de A, à mesure que chaque route arrive. L'utilisateur a dit que le financement viendrait après.
- **Les écrans d'après février** (FE-032, 079, 033, 080, 092, 091, 035, 099, 100, 120) : lot 8.
- **AP-62** (renvoi KYC lu par le cabinet) : STORY-1103 est livrée, mais son AC-5 reste ouvert chez D ; à prendre
  quand D l'a fermé.

## 3. Ce qu'il faut créer

- **« Choisir la tenue de l'exercice »** (journal ou cahiers, définitif). Aucune story ni aucun écran ne la porte, et
  sans elle tout dépôt de facture répond `EXERCICE_NON_OUVERT`. **Décision de l'utilisateur (25/11) : au lot 7.**
  - **A écrit la fiche** en tête de son lot 7 (identifiant pris à l'écriture, au-dessus du plafond du tracker) et
    **code l'écran** (story n° 22 du lot 7 de A, maquette dans le premier paquet, avec AP-56 et PRA-10).
  - ~~C code le backend~~ **Rectifié le 25/11 par C : le backend existe déjà** (STORY-959, sur `dev`) :
    `POST /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/ouverture`, corps `{ tenue: 'CAHIERS' | 'JOURNAL' }`,
    droit `comptabilite:exercice:ouvrir` ; rejouer la même tenue rend 200 sans rien écrire, une autre rend
    409 `TENUE_EXCLUSIVE` ; l'exercice doit être OUVERT dans `dossier-service`. Lecture : `GET …/exercices/{id}/tenue`
    et `GET …/tenues`. Le `404 EXERCICE_NON_OUVERT` vient d'un exercice jamais ouvert par cette route. **Il ne manque
    que l'écran** (appel direct à `comptabilite-service`, comme FE-149) ; un manque de contrat trouvé en le branchant
    (droit absent d'un rôle du cabinet, champ, refus) s'écrit à C, qui le prend tôt.
- **Financement :** les stories backend 1104 → 1111 sont recommandées à Dev A (§2) ; la décision revient à
  l'utilisateur à l'arrivée de Dev A, le 04/12.

## 4. Docker et postes

A est seul sur le poste principal à partir de la fin du lot 6 de C (`PLAN-LOT-7-2026-11-24.md`, §2) : le verrou
`.verrou-docker` reste de règle, mais il n'y a plus d'attente. Gate réel en fin de story, pile `grp-a`, `down -v`
ensuite.

## 5. Gestes réservés à l'utilisateur

- ~~Valider ce plan.~~ Fait le 25/11.
- Valider chaque paquet de maquettes avant le code.
- Dire, à l'arrivée de Dev A (04/12), si les stories backend du financement (1104 → 1111) vont bien à lui.
