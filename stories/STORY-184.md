# STORY-184 : Un dossier KYC n'a **ni référence communicable ni numéro de soumission**

**Epic :** EPIC-003 — KYC (`kyc-service`)
**Réf. :** ticket §F · **AP-03** · **STORY-183** *(historique — préalable de sens)*
**Découverte par :** AP-INT-1 — écarts nº2 et nº3 d'AP-INT-0
**Priorité :** Could Have — ⚠️ **ne se livre pas seule** *(cf. §Dépendance)*
**Story Points :** 2
**Statut :** done
**Complexité :** medium
**Créée le :** 2026-08-04
**Sprint :** 20
**Service :** `kyc-service` (`:3002`) — + `admin-panel` (relais BFF) + `frontend-admin-panel` (`:3110`, console)

---

## Le constat

Le dossier ne porte **ni référence** ni **compteur de soumission**. La console rend donc :

- `ref: dto.orgId` — l'écran affiche `507f1f77bcf86cd799439011 · 507f1f77bcf86cd799439011`,
  redondant mais **vrai** *(une référence inventée aurait été pire, et le front l'a écrit tel quel)* ;
- `attempt: 1, total: 1` **codés en dur** — la mention « soumission n sur N » est donc neutralisée à
  l'affichage, ce qui la fait disparaître au lieu de mentir.

**Conséquence :** il n'y a **rien à communiquer au cabinet**. « Votre dossier **KYC-2088** » est une
phrase de support ; « votre dossier **507f1f77bcf86cd799439011** » n'en est pas une — un identifiant
technique opaque n'est pas dictable au téléphone, pas recopiable sans faute, et il **désigne
l'organisation, pas le dossier**, donc il ne distingue même pas deux soumissions successives.

> ⚡ Le filigrane de la visionneuse porte `file.ref` : chaque page consultée est donc estampillée
> avec un identifiant d'organisation à la place d'une référence de dossier. La trace existe, elle
> désigne juste le mauvais objet.

---

## Dépendance — pourquoi elle ne se livre pas seule

Un **numéro de soumission** n'a de sens qu'avec un **historique** *(`STORY-183`)*. Livrer
« soumission 2 sur 2 » sans pouvoir dire ce qui s'est passé à la soumission 1, c'est **poser la
question sans y répondre** : l'agent apprend qu'il lui manque une information, et rien de plus.

⇒ **À tirer avec `STORY-183`, ou pas du tout.**

---

## Périmètre

- Une **référence de dossier** stable, communicable et **distincte de l'`orgId`** : lisible à voix
  haute, recopiable sans ambiguïté. ⚠️ Le format est à trancher au lancement — le front affiche
  aujourd'hui ce que le service donne, il n'impose rien.
- Un **compteur de soumissions** : le rang de la soumission courante et leur nombre total.
- ⚠️ La référence doit être **stable dans le temps** : c'est ce qui est écrit dans un e-mail au
  cabinet et dans le filigrane d'une pièce consultée. Une référence recalculée cesserait de désigner
  ce qu'elle a désigné.

### Hors périmètre

Toute recherche **par référence** *(« ouvrir le dossier KYC-2088 »)*. C'est un service utile et une
autre story — celle-ci fait exister la référence, pas encore l'index.

Le **filigrane** de la visionneuse : il porte déjà `file.ref`, donc il cesse d'estampiller un `orgId`
**par ricochet**, sans qu'une ligne du composant change. Rien d'autre n'y est touché.

L'**historique par tentative** côté console (`KycFile.history`, toujours `[]`) : `STORY-183` sert bien
`decisions`, mais leur câblage à l'écran est le reliquat front de **183**, pas de celle-ci.

---

## Critères d'acceptation

1. `GET /admin/kyc/:orgId` porte une référence de dossier **distincte de l'`orgId`**.
2. La référence est **stable** : deux lectures à des mois d'écart renvoient la même.
3. Le rang et le total de soumission sont servis et cohérents avec l'historique de `STORY-183`.
4. Les dossiers **existants** reçoivent une référence — ⚠️ à trancher : rétroactive ou à la prochaine
   soumission. Un dossier sans référence dans une console qui en affiche une est un cas à décider,
   pas à découvrir.
5. ⚡ **Preuve navigateur depuis `:3110`** : l'en-tête de la revue affiche la référence **et** la
   mention « soumission n sur N » — cette dernière n'apparaît que si `N > 1`, ce qui exige un dossier
   resoumis dans le jeu de données.

---

---

## Arbitrages rendus au lancement (2026-08-11)

Les deux points que la story laissait ouverts sont **tranchés**, plus un troisième qu'ils ont fait
apparaître.

### ① Format — `KYC-2088`, séquentiel, **persisté**

`KYC-` suivi d'un entier **zéro-comblé sur 4 chiffres** (`KYC-0001`, et `KYC-10000` le jour venu, sans
tronquer). Alloué par un **compteur atomique** en base (`kyc_counters`, `$inc` sous la session de la
transaction qui crée le dossier), index **unique** sur la référence — c'est l'index qui est le vrai
filet, pas le compteur.

**Pourquoi séquentiel et non dérivé de l'`orgId`.** La story exige une référence *stable dans le
temps* : « une référence recalculée cesserait de désigner ce qu'elle a désigné ». Une chaîne dérivée
par fonction pure de l'`orgId` **paraît** stable — elle ne l'est que tant que personne ne touche à la
fonction, et le jour où on y touche, tous les e-mails déjà envoyés désignent autre chose. La stabilité
est donc obtenue par **stockage**, pas par algorithme : écrite une fois, jamais recalculée, jamais
réécrite.

⚠️ **Ce que ce choix coûte, et pourquoi c'est acceptable :** une référence séquentielle laisse deviner
le volume de dossiers. Elle n'ouvre **aucun** vecteur d'accès — la recherche par référence est hors
périmètre, toute lecture reste adressée par `orgId` issu d'un claim JWT signé — et le format est celui
de la maquette validée, le plus dictable au téléphone. Le format à 4 chiffres n'est pas une limite :
le compteur déborde en 5 chiffres sans que rien ne casse.

⚠️ Le `2088` de la maquette est une **valeur de fixture**, pas une amorce : le compteur part à 1.

### ② Dossiers existants — **attribution rétroactive au démarrage**

Un service idempotent parcourt au boot les profils **sans** référence et leur en attribue une, par
ordre de création. Les deux autres options ont été écartées :

- « à la prochaine soumission » laisse un trou dans une console qui affiche une colonne référence — et
  un dossier **approuvé** ne resoumettra jamais : son trou serait définitif ;
- « paresseuse à la lecture » fait **écrire** un `GET`, avec la concurrence à gérer sur le chemin de
  lecture, pour le même résultat.

⚡ **Conséquence d'ordonnancement, qui est ce qui rend le contrat tenable :** les hooks
`OnApplicationBootstrap` s'achèvent **avant** que le service accepte des connexions. Après le boot,
tout profil porte donc une référence ; ceux créés ensuite la reçoivent **à la création**. C'est cette
double garantie — et elle seule — qui autorise à publier `reference` comme un champ **requis** du
contrat plutôt qu'optionnel. Un champ optionnel aurait obligé la console à garder son repli sur
l'`orgId`, c'est-à-dire à conserver le défaut.

⚠️ La logique de rattrapage vit dans un service **testé et nommé sans `bootstrap`** :
`collectCoverageFrom` exclut tout fichier dont le nom contient ce mot — l'angle mort qui a caché les
trois bugs du round-trip Kafka (STORY-076/108).

### ③ Un seul nombre de soumission, pas deux

L'AC-3 demande « le rang de la soumission courante **et** leur nombre total ». Or les deux sont
**structurellement égaux** : un dossier n'expose jamais qu'un cycle, le **courant**, qui est toujours
le dernier — `APPROVED` est terminal, et seul un rejet autorise une re-soumission. Publier deux champs
toujours identiques inviterait à les faire diverger un jour ; le contrat porte donc **un** entier,
`nombreSoumissions`, et la console rend « soumission n sur n » à partir de lui.

**Il n'est pas dérivé du journal à la lecture**, bien que `STORY-183` l'y rende possible : la file de
revue (`GET /admin/kyc`) liste des profils **sans** lire leur journal, et servir le compteur depuis
deux sources donnerait deux écrans qui se contredisent. Le compteur est donc **persisté sur le profil,
incrémenté par le même `findOneAndUpdate` conditionnel que la transition** — donc dans la même
transaction que l'entrée de journal, et jamais par un acteur qui perd la course.

### Portée réelle : 3 dépôts

`kyc-service` (le champ, son allocation, son rattrapage) · `admin-panel` (sans description au contrat
du BFF, le champ **n'existe pas** pour la console, qui dérive ses types de son OpenAPI) ·
`frontend-admin-panel` (l'écran — présent dans l'espace de travail, contrairement à `STORY-183`, donc
l'AC-5 est cette fois **prouvable**).

La **file de revue** reçoit les deux champs au même titre que le détail : sans cela, la même
organisation afficherait `KYC-0007` sur sa fiche et son `orgId` dans la file — une incohérence que la
story *introduirait* au lieu de la corriger.

Aucun contrat d'**événement Kafka** ne bouge : `kyc.status.changed` ne transporte que le statut.

---

## Definition of Done

- [x] Les 5 critères vérifiés · `lint` 0 · couverture `kyc-service` 95,51 / 93,44 / 95,98 / 95,36 ·
      `admin-panel` 99,67 / 92,80 / 100 / 99,64
- [x] Format de référence **tranché et écrit**, avec la règle de stabilité *(cf. §Arbitrages)*
- [x] ⚡ Tirée **après `STORY-183`** (`done` le 08/08) — l'ordre inverse aurait posé la question sans
      y répondre
- [x] Côté console : `ref` reçoit la référence, `attempt`/`total` le compteur réel — sur la **fiche**
      comme sur la **file**
- [x] Branche `MNV-184`, PR rebase-mergées sur `dev` —
      [kyc#17](https://github.com/MoneyVibesGroup/prospera-kyc-service/pull/17) ·
      [admin-panel#18](https://github.com/MoneyVibesGroup/prospera-admin-panel-service/pull/18),
      branches supprimées
- [ ] ⛔ **`frontend-admin-panel` : commit prêt, PR IMPOSSIBLE** — le compte
      `vivianMoneyVibesGroupes` n'a que le droit `pull` sur
      `MoneyVibesGroup/frontend-admin-panel` (`push: false`, vérifié par l'API GitHub), et le second
      compte de la machine n'y a aucun accès. Le travail est committé sur la branche locale
      `MNV-184` (`1ff5ad3`) et attend une ouverture de droits. **Rien n'est perdu, rien n'est
      poussé.**

---

## Progress Tracking

### ⚡ Un défaut RÉEL trouvé par la vérification docker, invisible aux 447 unitaires

Le rattrapage attribuait bien les **références**, et **jamais** les compteurs :

```
Rattrapage STORY-184 : 2 référence(s) attribuée(s), 0 compteur(s) initialisé(s).
```

`nombreSoumissions` porte `default: 0` au schéma, et **Mongoose applique les valeurs par défaut à
l'hydratation** : sur un document lu sans `.lean()`, le champ vaut `0` alors qu'il est **absent en
base**. La branche d'initialisation était donc **morte**, et un dossier ancien annonçait « 0
soumission » quand son `submittedAt` prouve le contraire — exactement ce que le plancher existait
pour empêcher.

Aucun unitaire ne pouvait le voir : un double rend des objets **nus**, sans valeurs par défaut.
Corrigé par `.lean()`, puis **gardé structurellement** — le double du test n'expose plus `exec` que
derrière `.lean()`, si bien que retirer l'appel fait échouer les 9 tests du fichier.

### Vérification docker (stack neuve `down -v` — mongo/kafka/redis/minio/mailhog + auth, kyc, admin-panel)

`/api/v1/health` : `mongodb: up`, `kafka: up`.

**Cycle réel** sur une organisation fraîchement inscrite (`6a7b03a9ea348b3af6fdb367`) :

| Acte | Observé en base (`mongosh kyc_service`) |
|---|---|
| Dépôt du RCCM (création du profil) | `reference: KYC-0002`, `nombreSoumissions: 0`, séquence `1 → 2` |
| Dépôt du CFE (1ʳᵉ soumission) | `n = 1`, journal `[SOUMISSION]`, **séquence inchangée (2)** — aucun numéro brûlé par le second dépôt |
| Rejet motivé par l'admin | `n = 1` **inchangé** (une décision n'est pas une soumission), référence inchangée |
| Re-dépôt du RCCM (re-soumission) | `n = 2`, journal `[SOUMISSION, DECISION, RESOUMISSION]` ⇒ **compteur = décompte du journal**, référence toujours `KYC-0002` |

**Rattrapage** — deux profils fabriqués sans référence ni compteur, puis redémarrage :

| Dossier | Résultat |
|---|---|
| `…ff01` — `APPROVED`, `submittedAt` de juin, journal vide | `KYC-0003`, `nombreSoumissions: 1` (**plancher** : publier 0 contredirait sa date de soumission) |
| `…ff02` — jamais soumis | `KYC-0004`, `nombreSoumissions: 0` (0 est ici la vérité) |

**Idempotence** — second redémarrage : **aucune** ligne de rattrapage, séquence figée à 4, les
quatre références inchangées.

**Index unique partiel**, vérifié en écrivant directement en base : un doublon de référence est
refusé (`E11000`), et deux profils **sans** référence coexistent — sans le filtre `$type: 'string'`,
l'index refuserait le second et rendrait le rattrapage impossible.

**Chaîne complète** : `GET /admin/kyc/:orgId` et `GET /admin/kyc` (`:3002`), puis
`GET /admin/kyc-reviews` et `GET /admin/orgs/:orgId` (BFF `:3010`) servent tous `KYC-0002` / `2`.

**AC-5 — preuve navigateur (`:3110`), cette fois faite** *(contrairement à `STORY-183`, le dépôt front
est dans l'espace de travail)* : e2e Playwright « 4 bis » contre le stack réel — l'en-tête de revue
affiche la **référence**, l'`orgId` n'y est **plus visible**, et la mention « soumission 2/2 »
apparaît sur le dossier re-soumis (choisi dans la file par `nombreSoumissions > 1`, jamais codé en
dur).

### Mutation-testing — 10 mutations, 10 rouges

Chacune vérifiée **compilante** (une mutation rouge par erreur de compilation ne prouve rien) :
référence absente à la création · référence écrite ≠ référence allouée · numéro brûlé alors que le
profil existe · `$inc` jamais posé · séquence figée (`$inc: 0`) · une décision comptée comme une
soumission · rattrapage sur les profils **déjà** référencés · plancher `submittedAt` neutralisé ·
rattrapage sans garde à l'écriture · référence du détail retombant sur l'`orgId`.

### ⛔ Constat hors périmètre — la console ne peut plus trancher un dossier

Relevé en lançant l'e2e navigateur, **antérieur à cette branche** : `submitDecision` / `rejectFile`
n'envoient pas d'en-tête `If-Match`, rendu **obligatoire** par `STORY-182` côté amont. Toute décision
prise depuis la console retourne donc **`428 PRECONDITION_REQUISE`** — vérifié au curl sur le BFF,
sur du code que cette story ne touche pas. L'étape 5 de `kyc-chain.spec.ts` échoue pour cette raison
seule.

⇒ **Story de suivi à ouvrir** : la console doit lire l'`etag` déjà servi dans le corps du détail et
le rejouer en `If-Match`. Non corrigé ici — c'est un autre livrable, et le corriger au passage
masquerait qu'il n'a jamais eu de test à lui.
