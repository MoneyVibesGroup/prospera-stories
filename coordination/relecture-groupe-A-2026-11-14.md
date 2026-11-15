# Relecture du groupe A : quatre stories fusionnées le 14/11 sans relecture humaine

> **Date :** 2026-11-15 · **Par :** groupe A · **Cadre :** `PLAN-4-SESSIONS-2026-11-14.md` §3.1
> **Méthode :** le code de `origin/dev` lu par quatre relecteurs indépendants. J'ai ensuite revérifié moi-même
> les constats qui comptent : le type des dates passées à l'audit, la regex des droits d'auth-service, et la
> migration de 563, rejouée sur une vraie base. « Vérifié » veut dire lu dans le code ou exécuté. « Supposé »
> veut dire raisonné sans exécution.
> **Résultat :** **aucun défaut bloquant dans le code livré.** Quatre défauts majeurs sont à corriger, chacun avec un
> porteur. Celui de 563 est déjà corrigé (fiscal #41).

| Story | Verdict | Correctif | Porteur |
|---|---|---|---|
| **STORY-299** journal d'audit chaîné | sain ; 2 majeurs | refus au démarrage sans jeu de répliques ; sérialisation fermée ; course et atomicité prouvées sur un vrai MongoDB | **STORY-904** (A) ; documenté dès maintenant par fiscal #41 |
| **STORY-300** droits fiscaux | sain ; le mode de compatibilité est le point faible | fin du mode (strict) ; invariant « toute route d'écriture est décorée » | **STORY-902** (A) |
| **STORY-365** borne du jeton | sain et sûr (aucune troncature) ; ne tient pas face aux verticales | contrôle à l'attribution, tests de connexion et de rafraîchissement (A) ; regex à tiret, codes trop longs, droits hors jeton (B) | **STORY-902** (A) ; **demande à B** (journal de A) |
| **STORY-563** deux redevables | sain ; migration jouée nulle part | migration **jouée** sur la pile de recette, **inscrite** au guide de mise en service | **fait** : fiscal #41 ; test de rejeu restant dans **STORY-904** |

---

## STORY-299 : journal d'audit chaîné (fiscal #22)

| Point | Constat | Gravité | Correctif |
|---|---|---|---|
| Sérialisation stable | Vérifié. `serialiserCanonique` trie les clés à chaque niveau (`src/domain/audit/chaine-audit.ts:68-99`). Elle refuse `NaN`, `Infinity` et `undefined`, et garde l'ordre des tableaux. Le test d'ordre des clés couvre l'objet imbriqué et le tableau. | ok | — |
| Types non JSON dans `contenu` | Vérifié. Une `Date` passe par la branche « objet ». `Object.keys(new Date())` vaut `[]`, donc elle devient `{}` : deux dates différentes donnent la même empreinte. Un `ObjectId` donne `{"buffer":…}`, qui dépend de la version de bson. **Défaut latent, pas actif** : toutes les dates passées aujourd'hui sont des chaînes ISO (`clotureLe`, `signeLe` sont typées `string`, `implantation.ts:139`, `redevable.ts:166`), et le type `ValeurCanonique` refuse une `Date` à la compilation. Seul un `as` ou un `any` la ferait entrer. | mineur | STORY-904 : n'admettre que les objets de prototype `Object.prototype` ou `null`, et rejeter `Date`, `ObjectId`, `Buffer`, `Map` et `Set`, tests à l'appui. |
| Index unique `(perimetre, seq)` | Vérifié. Il est posé par le provisionnement, de façon idempotente à chaque démarrage (`mongo/provisionner-comptes.mongosh.js:133-134`, nom `chaine_par_perimetre`). Un test vérifie que le script le contient. La base d'audit a `autoIndex: false`, ce qui est cohérent : le compte applicatif n'a que `find` et `insert`. Le validateur `$jsonSchema` est strict. | ok | — |
| Fourche sur collision | Vérifié en code. En cas de `WriteConflict`, `withTransaction` rejoue tout et relit le `seq` : on obtient n+1 puis n+2. Un doublon 11000 donne `AUDIT_CHAINE_CONCURRENTE`, en 409, transaction annulée. **Aucune fourche possible.** Mais ce n'est prouvé que sur des mocks : aucune course réelle n'a été jouée. | majeur (preuve) | STORY-904 : deux écritures simultanées sur le même périmètre, sur un vrai MongoDB ; on attend les `seq` 1 et 2, et aucun 500. |
| Audit, outbox et écriture dans une seule transaction | Vérifié pour tous les adaptateurs : dépôts, implantations, invitations, obligations, rattachements, redevables, rattachements de paquet. Tous passent la même `session`, et le journal utilise le même client, donc la transaction couvre les deux bases. Un échec de l'audit annule l'écriture et l'outbox. Aucune écriture métier non tracée n'a été trouvée. Une exception est voulue : un refus d'habilitation dont l'audit échoue part quand même en 403, et l'échec ne laisse qu'un log. | ok | — |
| Sans jeu de répliques | Vérifié. Le service **démarre quand même**. Seule la santé rougit (`src/health/indicators/mongo.health.ts:58-65`), puis chaque écriture échoue en 500 (supposé : « Transaction numbers are only allowed on a replica set member »). Rien ne s'écrit jamais hors transaction. L'exigence n'était écrite nulle part hors du code. | majeur | **Documenté** : fiscal #41, README, « Mise en service ». STORY-904 : refuser de démarrer si `hello.setName` est vide. |
| Tête de chaîne | Vérifié, et déclaré dans le code (`chaine-audit.ts:181-182`) : la suppression de la **dernière** entrée est indétectable. Seul le rôle find+insert du compte (STORY-295) l'empêche ; aucune ancre externe n'existe. | dette | Hors de ce lot : publier l'empreinte de tête par périmètre, par l'outbox ou un stockage immuable, quand la spine fiscale le décidera. Inscrit en dette dans le journal de A. |

## STORY-300 : droits fiscaux (fiscal #24)

| Point | Constat | Gravité | Correctif |
|---|---|---|---|
| Activation du mode de compatibilité | Vérifié. Le mode est câblé en dur, sans variable ni drapeau. Il s'active dès que le jeton ne porte **aucun** `fiscalite:*` (`src/common/rbac/droits-fiscalite.ts:61-71`). C'est le cas par défaut aujourd'hui, puisque auth-service n'en attribue aucun. | majeur | STORY-902 |
| Visibilité du mode | Vérifié. Le mode ne laisse aucune trace : pas de log au démarrage, pas de métrique, pas de marque dans l'audit. Un accès « par le rôle » ne se distingue pas d'un accès « par le droit ». | majeur | STORY-902 y met fin. D'ici là, il reste invisible, comme aujourd'hui. |
| Une perte de droits élargit-elle l'accès ? | Vérifié en code : la bascule est en tout ou rien. Un jeton qui perdrait **tous** ses `fiscalite:*` retomberait sur le rôle, ce qui donnerait tout à un `TENANT_ADMIN` restreint. **Ce n'est pas possible aujourd'hui** : la relecture de 365 établit qu'auth-service ne tronque jamais un jeton (il le refuse). | majeur latent | Le mode strict de STORY-902 le ferme. |
| Refus journalisé | Vérifié. Le refus est écrit dans la garde (`droits-fiscaux.guard.ts:60-79`) comme fait `HABILITATION_REFUSEE`, dans la chaîne `habilitation:<orgId>`, avec l'acteur, l'instant, le droit, la méthode et le gabarit de route. Le 403 part dans tous les cas. Sans `tenantId`, seul le 403 sort, sans trace. Les refus de `RolesGuard` (rôle absent) ne sont pas dans ce journal. | mineur | STORY-902 : ajouter `via` (jeton ou rôle) au fait d'audit. |
| Indépendance des droits | Vérifié. Aucune hiérarchie, aucun joker. `implique(a, b)` n'est vrai que si `a === b`. Les cinq natures d'accès sont déclaratives ; seule `HABILITATION_APPLICATIVE` est contrôlée. | ok | — |
| Routes sans droit | Vérifié. Toutes les routes d'écriture métier portent `@ExigeDroitFiscal`. Les écritures de l'espace déclarant (`moi/*`) sont libres, et c'est voulu. Les lectures n'exigent que le rôle, dont `GET /depots/:id/fichier`, qui renvoie le fichier déposé. Rien n'empêche un contrôleur neuf d'oublier le décorateur. | mineur | STORY-902 : un test d'invariant fait échouer toute méthode `POST`, `PUT`, `PATCH` ou `DELETE` sans décorateur et hors liste blanche. |
| Casse, code inconnu | Vérifié. Le préfixe est sensible à la casse. Un code `fiscalite:*` inconnu de ce service compte comme « droits portés » et coupe le mode de compatibilité : un administrateur se retrouve bloqué sans explication. | mineur | Le mode strict de STORY-902 le règle. |

## STORY-365 : borne du jeton (auth #36)

| Point | Constat | Gravité | Correctif |
|---|---|---|---|
| Connexion et rafraîchissement | Vérifié. Une seule règle, `exigerPermissionsDansLaBorne` puis `exigerJetonDansLaBorne` (`token.service.ts:68`, `:93`), pour les deux chemins (`issueSession`). **Aucune troncature** : la limite dépassée produit l'erreur `JETON_HORS_BORNE`, envoyée en HTTP 500. Au rafraîchissement, le refus arrive avant la rotation : la session reste, mais l'utilisateur est refusé à chaque renouvellement. | mineur (sûr) | STORY-902 : un 4xx nommé et un journal structuré (utilisateur, organisation, nombre de droits) plutôt qu'un 500. |
| Contrôle à l'attribution | Vérifié. **Aucun** : `MAX_PERMS_PAR_JETON` n'est lue qu'à l'émission. Les DTO de surcharge de rôle acceptent 50 droits (`@ArrayMaxSize(50)`), au-delà de la borne de 44. Un rôle composé ou une surcharge DELTA (STORY-167) font donc dépasser tous les membres du rôle, et la panne n'apparaît qu'à leur prochaine connexion. | **majeur** (bloquant le jour où les organisations composent leurs rôles) | STORY-902, qui touche déjà aux rôles du cabinet : vérifier l'union (rôle de plateforme + rôle de tenant résolu) à l'écriture et à l'attribution, ramener `ArrayMaxSize` à la borne, et renvoyer un 4xx. |
| Tests | Vérifié. Seul `issueTokens` est testé. Ni la connexion ni le rafraîchissement ne sont prouvés hors borne : pas de session créée à la connexion, session et jeton de rafraîchissement inchangés au rafraîchissement. | majeur | STORY-902 : deux tests. |
| Codes à tiret | Vérifié (et revérifié) : `TENANT_PERMISSION_FORMAT = /^[a-z]+:[a-z-]+:[a-z]+$/` (`src/common/rbac/tenant-permission.enum.ts:103`). Le tiret n'est admis que dans le **2e** segment. 56 des 347 codes des manifestes ont un tiret dans le 1er : `coeur-sfd`, `liaison-assureur`, `assureur-fictif`, `finance-transactions`, `conformite-bceao`… | majeur | **Demande à B** : STORY-938 (« droits à tiret ») doit élargir les **trois** segments, `^[a-z]+(-[a-z]+)*:[a-z]+(-[a-z]+)*:[a-z]+$`. |
| Codes de plus de 40 caractères | Vérifié. 5 codes des manifestes dépassent la borne : `approvisionnement:commande-fournisseur:consulter` (48), `…:suggerer` (47), `…:valider` (46), `finance-transactions:rapprochement:effectuer` (44), `finance-transactions:tresorerie:consulter` (41). | majeur | **Demande à B** (manifestes, STORY-935) : renommer ces codes, ou relever la borne de longueur et celle d'octets ensemble, sur une nouvelle mesure. |
| La borne face aux verticales | Mesuré : un jeton fait environ 909 + N × (L + 3) × 4/3 octets (909 octets fixes, N droits, L caractères par code). 44 droits de 40 caractères : 3 432 octets. Les manifestes déclarent **347** droits ; `sinistres` en porte 23 à lui seul, crédit et recouvrement 31 ensemble. Un DG à plusieurs modules dépasse 60 à 100 droits (supposé), ce qu'un cookie de 4 096 octets ne peut pas porter. | **majeur** | **Demande à B** : une décision d'architecture avant février. Je recommande que le jeton porte les **rôles et les modules**, et que les droits se résolvent par une lecture en cache (un read-model ou `/me/permissions`). Des droits groupés par module ne repoussent la limite que d'une verticale. |

## STORY-563 : deux redevables (fiscal #29 et #34)

| Point | Constat | Gravité | Correctif |
|---|---|---|---|
| Ce que fait la migration | Vérifié (`src/migrate-cle-obligation-redevable.ts:34-51`). Elle crée le nouvel index unique `cle_redevable_implantation_taxe_periode`, **puis** supprime l'ancien `cle_implantation_taxe_periode`. Aucune donnée n'est réécrite. Le nouvel index est plus fin que l'ancien : aucune donnée existante ne peut le violer. | ok | — |
| Idempotence | **Exécuté le 2026-11-15** sur le MongoDB de la pile de recette (`docker-compose.fiscal.yml`, image reconstruite depuis `dev`), à partir d'une base d'avant 563 : l'ancien index et une obligation sans `redevableId`. Premier passage : `ancienSupprime: true`. Second passage : `false`, code de sortie 0. Ensuite, une obligation de personne de même clé est acceptée, et un doublon de l'entreprise (`null` ≡ absent) est refusé (11000). | ok | — |
| Jouée nulle part | Vérifié. La migration n'apparaissait ni dans le Dockerfile, ni dans la recette, ni dans aucun document. Tant qu'elle n'est pas jouée, l'ancien index subsiste : la dérivation d'une obligation de personne de même taxe et de même période que l'entreprise échoue en E11000, et **toute la dérivation du dossier** est annulée, car elle tient dans une seule transaction. | majeur | **Fait** : jouée sur la pile de recette, et **inscrite** au README de fiscal-service, section « Mise en service » (fiscal #41) : commande, effets, contrôle. Il n'existe pas d'autre guide de mise en service. Sur des volumes neufs, il n'y a rien à migrer. |
| Idempotence de la dérivation (305) | Vérifié en code. La clé de l'upsert vaut `redevableId: null` pour l'entreprise, ce qui matche aussi les obligations d'avant 563 (champ absent). `redevableId` n'est jamais dans `$set`. Rejouer la dérivation donne `inchangees`. Ce n'est pas testé sur une obligation d'avant 563. | mineur | STORY-904 : « dériver deux fois avec une obligation d'avant 563 », sur un vrai MongoDB. |
| `null` = entreprise | Vérifié : cohérent à l'écriture, à la lecture et dans l'index. Les identifiants de personne sont des ObjectId, donc aucune collision avec `'entreprise'`. | ok | — |

---

## Ce qui en sort

- **STORY-904** (neuve, plage de A) : *le fiscal tient sur un vrai MongoDB*. Refus de démarrer sans jeu de répliques,
  sérialisation canonique fermée, course sur un même périmètre, atomicité audit + écriture, et rejeu de la
  dérivation sur une obligation d'avant 563, tout cela prouvé par une suite de conformité sur un vrai MongoDB. Elle se
  place **après STORY-314**, avant la relecture finale. La fiche s'écrira juste avant de la coder.
- **STORY-902** élargie : fin du mode de compatibilité (strict), fait d'audit marqué `via`, invariant des routes
  d'écriture, et dans auth-service la borne contrôlée à l'attribution, un 4xx au lieu du 500, et les tests de
  connexion et de rafraîchissement.
- **Demande à B** (journal de A) : codes à tiret dans les trois segments (STORY-938), cinq codes de plus de
  40 caractères (STORY-935), et une décision d'architecture « droits hors du jeton » avant février.
- **Dette** : l'ancre externe de la tête de chaîne d'audit (299).
