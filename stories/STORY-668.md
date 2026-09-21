# STORY-668 : L'ordre de paiement — il part du compte de l'organisation, validé par un second rôle

Status: review

**Épic :** EPIC-036 — Fournisseurs de paiement interchangeables et simultanés
**Service :** `paiement-service`
**Points :** 8 · **Sprint :** ⚠️ **NON SLOTTÉE** — `PLAN-PI-SPI-CAS-D-USAGE-2026-09-15`, phase B
**Prérequis :** **STORY-666** (le raccordement par organisation), **STORY-661** (l'adresse confirmée
par l'annuaire), **STORY-669** (relever les paiements) — et ⛔ **l'amendement du PRD**
**Origine :** le parcours « Règlement fournisseurs » du catalogue PI-SPI, demandé par le PO le
2026-09-15 pour les distributeurs.

✅ **DÉBLOQUÉE PAR LE PO LE 2026-09-21.** Elle était bloquée par une décision, pas par du code : le PRD
ne couvrait que l'encaissement, et ordonner un paiement sortant touche NFR-1. L'amendement est
**validé et appliqué** (`prds/prd-paiement-service-2026-08-02/amendement-2026-09-21-ordres-de-paiement.md`,
FR-P65→P69, NFR-1d, R8). Trois décisions : (1) on code, **en bac à sable** — la confirmation
juridique reste un préalable de la PRODUCTION ; (2) les deux rôles réemploient la paire de droits de
FR-P60 ; (3) des envois réels de **100 XOF au plus** sont autorisés pour mesurer le contrat.

⚠️ **Le titre du plan disait « Régler un fournisseur ».** Le mot « règlement » est proscrit par la
garde du port (convention de la spine : le PRD ne le dit jamais), et `payout`/`reversement` le sont
par la garde NFR-1b. La story parle donc d'**ordre de paiement** : ce service ne reverse rien — il
n'a rien reçu.

---

## Le fait — mesuré sur le bac à sable le 2026-09-21, sans envoyer un franc

- `POST /paiements-envoyes` (portée `paiement.write`) existe. Champs exigés, dans l'ordre où l'API
  les réclame (elle ne nomme qu'une erreur par réponse) : `txId`, `payeurAlias`, `payeAlias`,
  `montant`, `confirmation`.
- ⚡ **Le bénéficiaire est un SHID** (« must be a valid SHID ») : une adresse de paiement du schéma,
  celle-là même que [[STORY-661]] sait faire confirmer par l'annuaire. **Ni IBAN, ni numéro de
  compte** dans cette version.
- ⚡ **`confirmation` est obligatoire** : le schéma connaît un envoi en deux temps. À mesurer : ce
  que rend `confirmation: true`, et si le second temps est un appel distinct.
- `GET /paiements-envoyes` existe (vide) : un ordre exécuté se **relèvera** comme un paiement reçu
  ([[STORY-669]]), et c'est par là que son issue se constatera si aucun webhook ne la porte.
### ⚡⚡ Puis mesuré AVEC de l'argent du bac à sable (50 et 10 XOF, autorisés par le PO)

- `confirmation: false` → `200 {txId, end2endId, statut: "ENVOYE", payeNom, payePays}` ; quatre
  secondes plus tard la liste le montre `IRREVOCABLE` (`categorie: "733"`), et la position du compte
  a baissé **du montant exact** (1 000 001 025 → 1 000 000 975).
- `confirmation: true` → `statut: "INITIE"`, **aucun franc ne bouge** ; le second temps du schéma
  est `PUT /paiements-envoyes/{txId}/confirmations`. **Non utilisé** : nos deux rôles sont les
  nôtres, et l'ordre part en un temps, à la validation.
- ⛔⛔ **LE MÊME `txId` REPOSTÉ REND `HTTP 200`** — avec `statut: "REJETE"`, `statutRaison: "DU03"`
  et un **nouvel** `end2endId`. Le schéma protège donc lui-même du double envoi. Mais **deux
  lectures naïves sont fausses** : qui lit le code HTTP croit l'ordre parti ; qui lit ce rejet le
  croit **échoué**, alors qu'il est exécuté.
- ⛔⛔ **`GET /paiements-envoyes/{txId}` REND LA DERNIÈRE TENTATIVE** (`REJETE/DU03`), **pas celle
  qui est partie.** Seule la liste `GET /paiements-envoyes?txId=` montre les deux. **L'issue se lit
  dans la liste, et `IRREVOCABLE` gagne sur tout** ; `DU03` n'est jamais une issue, c'est l'écho
  d'un rejeu.

⚡ **C'est cette mesure qui a durci FR-P68.** Le texte validé disait « un échec laisse l'ordre
rejouable par une nouvelle validation ». Rejouer sous un **nouvel** identifiant ferait partir
l'argent deux fois ; rejouer sous le **même** rend un `DU03` qu'on lirait comme un échec. Un ordre
rejeté est donc **terminal** : on en prépare un autre, à deux.

## Critères d'acceptation

- [x] AC-1 — Une organisation **prépare** un ordre : bénéficiaire (adresse de paiement **confirmée
      par l'annuaire** avant d'être rangée), montant, motif, compte payeur **dont elle est
      titulaire**, vérifié, chez un fournisseur qui **sait** ordonner. Un ordre préparé ne part pas.
- [x] AC-2 — ⛔⛔ **Un SECOND rôle valide, et jamais la même personne.** Deux droits distincts ; et
      quels que soient ses droits, l'auteur de la préparation ne peut pas valider **son** ordre. Le
      contrôle est dans le filtre de l'écriture, pas dans un `if` qui le précède.
- [x] AC-3 — ⛔⛔ **Un ordre part UNE fois.** `txId` = l'identifiant de l'ordre ; la transition
      « validé → transmis » est **dans le filtre** ; aucun renvoi automatique, aucune reprise après
      panne qui ne passe par une nouvelle validation. Un ordre envoyé deux fois est de l'argent parti
      deux fois — et FR-P49 interdit à ce service de le faire revenir.
- [x] AC-4 — L'ordre part **sous le raccordement de l'organisation**, depuis **son** compte. Aucun
      repli. ⛔ **Par absence d'injection** : le chemin qui transmet ne peut pas lire la
      configuration de la plateforme.
- [x] AC-5 — L'issue (exécuté, rejeté) vient **du fournisseur**, jamais d'une supposition : elle se
      lit dans la **liste** par identifiant, où l'exécution **gagne sur tout** et où un rejet pour
      doublon n'est **jamais** une issue. ⛔ **Un ordre rejeté est terminal.** Une transmission dont
      l'issue est inconnue (panne au milieu) **se consulte** ; si le schéma ne connaît rien, l'ordre
      redevient **à valider** — par un humain, jamais par une reprise automatique.
- [x] AC-6 — ⛔ **Aucune imputation.** Un ordre n'éteint aucune créance de l'organisation et ne crée
      aucun encaissement : il sort du périmètre d'AD-3/AD-4. Il se trace (deux auteurs), il ne se
      supprime pas, il s'annule tant qu'il n'est pas parti.
- [x] AC-7 — La garde NFR-1b passe **sans exception ajoutée** : ni `payout`, ni `reversement`, ni
      `solde`. Si elle rougit, c'est le code qui se range.
- [x] AC-8 — Recette **réelle** : un ordre préparé par un rôle, validé par un autre, exécuté sur le
      bac à sable, et **constaté chez le schéma** parmi ses paiements envoyés. ⚠️ *Reformulé à la
      livraison* : la fiche disait « relevé ». Faire entrer les paiements **envoyés** dans le relevé
      de [[STORY-669]] (des lignes `SORTANT`) est un travail à part — la cascade de rapprochement
      ne confronte que des entrées — et il est porté en point ouvert plutôt que fait à moitié.

## Livraison (2026-09-21 — branche `MNV-668`, commit `15865a8`, empilée sur `MNV-669`)

**Suites :** 3 814 unitaires (278 suites), 322 e2e, lint 0, `tsc` 0. **Recette RÉELLE sur le bac à
sable, par le vrai conteneur : 17/17.** ⚠️ Dernière exécution unitaire complète : 3 812 / 3 813 —
la seule rouge était la garde de STORY-260 (voir plus bas), précisée puis rejouée avec ses voisines.

### ⚡⚡ AC-8 — la mesure, avec 25 francs

| Ce qui a été mesuré | Résultat |
| --- | --- |
| Alice prépare 25 XOF | `201 PREPARE` ; le **nom** du bénéficiaire vient de l'annuaire du schéma ; la position n'a pas bougé |
| Bénéficiaire inconnu de l'annuaire | `422 ADRESSE_INCONNUE_DU_SCHEMA` — aucun ordre |
| Alice valide **son** ordre | `422 ORDRE_VALIDATION_PAR_LE_PREPARATEUR` ; rien ne part |
| Une autre organisation le valide | `404` |
| **Bob valide** | `200 TRANSMIS`, transaction `ETGD999…` ; les deux auteurs sont rendus, distincts |
| Nouvelles, cinq secondes après | `EXECUTE` |
| Position du compte | **1 000 000 975 → 1 000 000 950 : −25, exactement** |
| Seconde validation | `422 ORDRE_PAS_DANS_LE_BON_ETAT` |
| ⛔⛔ **Le même identifiant RENVOYÉ AU VRAI SCHÉMA** (fixture : l'ordre remis `PREPARE` dans Mongo) | l'ordre est lu **`EXECUTE`**, avec la transaction **d'origine** — et **pas un franc de plus n'est parti** |
| Ordre préparé puis annulé | `ANNULE` ; sa validation est refusée |
| Organisation sans raccordement | `422 RACCORDEMENT_FOURNISSEUR_ABSENT` — aucun repli |

⚡ **L'avant-dernière ligne est la story.** Le schéma a répondu `200` + `REJETE/DU03` à ce renvoi ;
l'adaptateur n'a cru ni le `200` ni le rejet, il est allé lire la **liste**, et y a trouvé
l'exécution. La chaîne d'audit de l'ordre porte ses six maillons — préparé par l'une, validé par
l'autre, issue du fournisseur — et le rejeu de la fixture y est resté lisible.

### Ce qui a été construit

- `POST /v1/ordres-de-paiement` (préparer), `POST …/:id/validation`, `POST …/:id/nouvelles`,
  `POST …/:id/annulation`, `GET` liste et détail. Ni `PUT`, ni `PATCH`, ni `DELETE`.
- Domaine `ordre-de-paiement.ts` : six états, `etatApresLIssue` — la table **entière** énumérée en
  test (6 états × 4 issues). Collection `ordres_de_paiement`, `_id` = la référence donnée au schéma.
- Port : `transmettreUnOrdre?` et `demanderDesNouvellesDUnOrdre?` (avec `suivre`) ; le registre ne
  dit « sait transmettre » que si **les deux** existent — transmettre sans pouvoir demander des
  nouvelles, c'est engager un ordre dont on ne lèvera jamais l'incertitude.
- `ordre-api-business.ts` — **pur**, prouvé sur les corps mesurés : un doublon ne dit rien, une
  exécution gagne sur tout, le filtre du participant est revérifié, une situation inconnue est
  « en cours » et jamais « refusée ».
- Chaîne d'audit `ORDRE_DE_PAIEMENT`, clef = l'identifiant de l'ordre. Ni le nom du bénéficiaire ni
  le motif n'entrent au journal (il ne s'efface pas).

### Ce que la story a tranché, et qu'il ne faut pas refaire

- ⚡⚡ **UN ORDRE PART ZÉRO OU UNE FOIS, PAR TROIS MÉCANISMES.** (1) `PREPARE → EN_TRANSMISSION`
  est **dans le filtre**, avec `$ne` sur l'auteur de la préparation : deux validations simultanées,
  une seule engage — et FR-P66 tient au même endroit. (2) **L'engagement est écrit et COMMIS avant
  l'appel** : l'inverse perdrait la trace d'un ordre parti si l'écriture échouait. (3) Rien ne
  renvoie d'office : après une panne, on **demande des nouvelles**.
- ⛔⛔ **`REJETE` EST TERMINAL** — FR-P68 durci **après** validation du PO, par la mesure. Rejouer
  sous un nouvel identifiant ferait partir l'argent deux fois ; sous le même, le rejet pour doublon
  se lirait comme un échec.
- ⚡ **`INCONNU` ne rétrograde qu'un ordre `EN_TRANSMISSION`** (jamais un `TRANSMIS`), et il efface
  la validation : personne n'a approuvé l'envoi qui viendra. L'histoire reste au journal.
- ⚡ **Le deux-temps du schéma (`confirmation: true`) n'est PAS utilisé** : nos deux rôles sont les
  nôtres, et un ordre laissé `INITIE` chez lui serait un ordre que personne, chez nous, ne sait finir.
- ⚡ **AC-4 et AC-6 par l'ABSENCE** : quatre dépendances injectées, et une garde d'imports sur les
  trois dossiers — ni configuration (aucun repli possible, NFR-1d), ni encaissements, ni créances.
- ⚡ Droits de FR-P60 réemployés (décision PO) — coût nommé dans le contrôleur.

### Pièges payés

- ⛔⛔ **Le test a attrapé un vrai défaut du premier jet** : dans la liste, « en cours » était une
  liste fermée (`ENVOYE`, `INITIE`) ; une situation que le schéma ajouterait tombait en `INCONNU`,
  donc « jamais arrivé », donc **à revalider**. « En cours » est désormais *tout ce qui n'est ni
  exécuté ni rejeté*.
- ⛔ **La garde de STORY-260 a rougi, et elle n'avait pas tort — elle était imprécise.** Elle cherche
  la FORME `$set: { etat }` pour garantir qu'un seul fichier écrit l'état d'une *demande* ; une forme
  ne sait pas de quelle collection elle parle. Renommer le champ l'aurait maquillée : elle est
  **précisée** — deux écrivains, chacun le sien, et la preuve que le registre des ordres ne connaît
  aucune demande.
- ⛔ `eslint --fix` a retiré un `as Document` qu'il jugeait inutile, et `tsc` a rougi derrière :
  typer la variable plutôt que l'expression.
- ⚠️ Les jetons de l'IdP de recette durent deux heures ; la recette de 668 a exigé un **troisième**
  jeton (un second utilisateur de la même organisation).

### ⚠️ Points ouverts pour le PO

1. ⛔ **LA PRODUCTION EST FERMÉE** tant que le point juridique du §10 du PRD n'est pas levé
   (initiation de paiement pour compte de tiers en UEMOA). Rien dans le code ne l'empêche : c'est
   une décision de mise en service.
2. **Les paiements ENVOYÉS n'entrent pas au relevé** ([[STORY-669]]) : la position du compte ne se
   recoupe donc plus avec le seul relevé des entrées dès qu'un ordre est exécuté. Story à écrire
   (id ≥ 674) : des lignes `SORTANT`, et ce que la cascade en fait.
3. **Aucun webhook n'a été mesuré pour un envoi.** L'issue vient de la liste, sur demande. Si le
   schéma notifie l'exécution, l'écouter rendrait `nouvelles` inutile dans le cas nominal.
4. **Les droits** : à reprendre quand le catalogue saura créer un droit de tenant
   (`paiement:ordre:preparer` / `:valider`).
5. **Aucun plafond par ordre ni par jour.** Le second regard est la seule barrière — un plafond
   d'organisation serait une décision de produit, pas un réglage.
6. Un ordre `INITIE` de 10 XOF est resté chez le schéma (sonde du deux-temps) : il expirera.

## Tranché par le PO le 2026-09-21

1. ✅ **Le périmètre est ouvert, et on code maintenant** — bac à sable seulement ; la confirmation
   juridique est un préalable de la **production**, écrit au §10 du PRD.
2. ✅ **Les droits de FR-P60 sont réemployés** : `paiement:demande:emettre` prépare (et annule),
   `paiement:encaissement:valider` valide (et consulte). ⚠️ Coût nommé : le nom du droit ne dit plus
   exactement ce qu'il ouvre — à reprendre quand le catalogue saura créer un droit de tenant.
3. ✅ **Envois réels autorisés : 100 XOF au plus**, vers l'adresse du payeur de test.
4. **IBAN / numéro de compte** : hors de cet amendement (le bac à sable exige un SHID).

## Notes

- Voir l'amendement validé (`amendement-2026-09-21-ordres-de-paiement.md`, même dossier que le PRD), [[STORY-666]], [[STORY-661]],
  [[STORY-669]], [[STORY-242]] (NFR-1b et sa garde), [[STORY-290]] (la séparation des pouvoirs, et
  la transition dans le filtre).
