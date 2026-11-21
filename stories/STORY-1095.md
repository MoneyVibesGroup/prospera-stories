# STORY-1095 : Le plan comptable propre d'un client — ce que le dossier ajoute au modèle du cabinet

Status: done — **livrée le 2026-11-21** (comptabilite-service #14, `0d93c5d` sur `dev` ; contrat annoncé stories #746). Créée le 2026-11-18 à la demande de l'utilisateur. Non slottée.

**Service :** `prospera-comptabilite-service` (tenu par B au lot 4) · **Points :** 5 · **Dépend de :** STORY-1094

---

## Pourquoi

Le modèle du cabinet (STORY-1094) couvre ce que tous ses clients partagent. Mais un client a **ses** banques, **ses**
caisses et parfois un journal à lui (« CAI2 Boutique Bè »). L'utilisateur l'a demandé le 2026-11-18 : la comptabilité
propre se fait « en fonction du cabinet, **par client aussi** ».

## Ce qui est attendu

1. Un **plan propre du dossier**, qui **s'ajoute** au modèle du cabinet. Il ne le remplace pas et ne le copie pas.
   Il porte des comptes propres et des journaux propres, avec la même règle de racine que STORY-1094.
2. **Ordre de lecture** : référentiel publié, puis modèle du cabinet, puis plan du dossier. La réponse dit, pour chaque
   compte et chaque journal, **d'où il vient** (`REFERENTIEL`, `CABINET` ou `DOSSIER`).
3. Un compte ou un journal du dossier ne peut pas porter le numéro ou le code d'un élément du modèle du cabinet
   (`409` qui nomme l'élément existant). Le dossier peut en revanche **masquer**, pour lui seul, un compte du modèle
   qu'il n'utilise pas, s'il n'est pas mouvementé dans ce dossier.
4. **Droits** : l'administrateur du cabinet, et le responsable du dossier, écrivent. Les contributeurs du dossier
   lisent. Toute écriture est inscrite au **journal du dossier** (nouvel acte, publié au contrat).
5. Un dossier **archivé** se lit et ne s'écrit plus (`409 DOSSIER_ARCHIVE`, comme ailleurs).

## Critères d'acceptation

- **AC-1** : le plan servi pour un dossier est l'union, dans l'ordre ci-dessus, avec l'origine de chaque élément.
- **AC-2** : aucun élément du dossier n'apparaît dans un autre dossier du même cabinet (étanchéité, comme au gate
  FE-069).
- **AC-3** : un compte du modèle masqué dans un dossier n'est plus proposé à la saisie de ce dossier, et reste
  proposé dans les autres.
- **AC-4** : chaque écriture sur le plan du dossier est un acte du journal du dossier, avec son auteur.

---

## Livraison (2026-11-21, groupe A)

**Routes** (contrat dans le journal du groupe A, « ⚠ Contrats ») : `/api/v1/dossiers/{d}/plan-comptable/{comptes,journaux,masques,actes}` ; le plan servi (`GET …/exercices/{e}/plan-comptable`, STORY-1094) gagne l'origine `DOSSIER`, le champ `masque` et `versionDuPlanDuDossier`.

**Preuves** : unitaires 910 passés (Node 24, 62 suites), `test:socle` 289/289 (13 suites, dont 16 neufs), mutation 10/10 rouges en unitaire et 3/3 de cloisonnement et de mouvement rouges au socle, lint, tsc ; gate de câblage `docker compose up` du service (grp-a) : healthy, routes neuves 401 sans jeton.

**AC** : AC-1 (union dans l'ordre, origine de chaque élément), AC-2 (aucun élément du dossier A dans le dossier B : plan servi, liste, saisie), AC-3 (compte du modèle masqué non proposé et refusé à la saisie du dossier, proposé et saisissable dans l'autre), AC-4 (chaque écriture est un acte du journal du dossier avec son auteur, versions consécutives, un geste refusé n'en laisse aucun).

**Décisions** (prises par A, contestables) :
- **D-1095-1** : « le responsable du dossier » = `responsableUserId` lu chez dossier-service (`GET /dossiers/{id}`), jamais dans la requête. Écrivent : `TENANT_ADMIN` ou ce responsable ; les contributeurs lisent. La garde laisse passer les écritures marquées `@AutoriseParLeService` (elle ne connaît pas le responsable) et le service refuse avant tout acte (403 `RESPONSABLE_OU_ADMINISTRATEUR_REQUIS`). Aucun droit de tenant neuf.
- **D-1095-2** : un dossier archivé (`statut: ARCHIVE` chez dossier-service) se lit, et toute écriture rend 409 `DOSSIER_ARCHIVE`, même pour l'administrateur ; l'habilitation est jugée avant l'archivage.
- **D-1095-3** : les racines d'un compte du dossier se calculent sur les référentiels de la **famille** du dossier (SYSCOHADA : SN et SMT), car le plan du dossier vaut pour tous ses exercices et le système comptable se décide par exercice ; le plan servi n'en retient que celles du référentiel de l'exercice.
- **D-1095-4** : le dossier ne redéfinit pas le modèle : 409 `COMPTE_DU_MODELE_DU_CABINET` / `JOURNAL_DU_MODELE_DU_CABINET` (avec `libelleExistant`, `actifExistant`, même désactivé) ; réciproquement le cabinet ne crée pas au modèle ce qu'un de ses dossiers porte (409 `COMPTE_DEJA_AU_DOSSIER` / `JOURNAL_DEJA_AU_DOSSIER`), pour qu'un numéro n'ait jamais deux sens dans un dossier.
- **D-1095-5** : seul un compte du **modèle** se masque (404 `COMPTE_PROPRE_INTROUVABLE` sinon ; un compte du dossier se désactive ou se supprime) ; masquer refuse un compte mouvementé dans ce dossier (409), et se rejoue sans nouvel acte. Un compte masqué reste un compte du modèle : la saisie le refuse (422 `COMPTE_MASQUE`) mais l'historique reste lisible. Le masque ne vaut que pour les comptes, pas les journaux (la fiche ne le demande pas).
- **D-1095-6** : « journal du dossier » = collection `actes_du_dossier` du service (ajout seul), pas la piste d'audit chaînée par exercice, qui est par exercice ; la version du plan du dossier avance à chaque geste effectif.
- **D-1095-7** : un journal propre du dossier est numéroté comme un journal du plan ; il est cherché avant le modèle, et un plan de trésorerie (SMT) n'admet que ses journaux de type `TRESORERIE`.
- **Ouvert** : le catalogue doit recopier le manifeste (quatre routes de lecture de plus, demande à B, journal de A) ; STORY-1096 (import du plan de Sage) peut écrire dans le modèle du cabinet comme dans le plan du dossier par ces mêmes services.
