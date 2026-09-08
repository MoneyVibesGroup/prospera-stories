# STORY-574 : Modèle de message versionné et multilingue, figé sur l'envoi

Status: done  ✅ 2026-09-04 — branche `MNV-574` sur `origin/dev` de `prospera-notification-service`

**Épic :** EPIC-055 — Modèles versionnés, multilingues, et un rendu qui n'exécute rien
**Service :** `notification-service` (nouveau)
**Points :** 5 · **Sprint :** S41
**Prérequis :** **STORY-572** (gate — le droit « rédiger un modèle »)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-9, AR-11.

---

## Le fait

⚡ **La langue est un attribut du couple (modèle, canal), jamais du seul modèle.** Une langue à
caractères non latins bascule le SMS en **UCS-2** : **70 caractères par segment au lieu de 160** — ce
qui change le **coût** et le **point de troncature**. Porter la langue sur le modèle seul rend le
calcul de segments juste sur un canal et faux sur l'autre, sans que rien ne casse.

⚡ **Figement.** La résolution a lieu **à la préparation de l'`Envoi`** et la version résolue est
figée sur lui. Une publication ultérieure ne touche aucun envoi déjà préparé — sinon le journal se
réécrit a posteriori.

## Critères d'acceptation

- [x] AC-1 — Un `Modele` porte une clé, un canal, une langue, un objet (si le canal en a un) et un
      corps à variables **déclarées et typées**.
- [x] AC-2 — Les versions sont **immuables une fois utilisées** : modifier **crée une version**, n'en
      réécrit jamais une. Un test de mutation prouve qu'un `update` sur une version employée échoue.
- [x] AC-3 — ⚡ La langue est portée par le couple `(modèle, canal)`. Un test couvre le cas qui le
      justifie : le **même modèle**, en français et dans une langue non latine, sur le canal SMS,
      donne **deux comptes de segments différents**.
- [x] AC-4 — AR-11 : le calcul de segments **GSM-7 / UCS-2** est une **fonction pure du domaine**,
      testable sans infrastructure, et **annonçable avant le choix du canal** (FR-N14).
- [x] AC-5 — ⚡ **Figement** : `modele@version` est écrit sur l'`Envoi` à sa préparation. Publier une
      nouvelle version **ne modifie aucun envoi déjà préparé** — prouvé par un test qui prépare,
      publie, puis relit.
- [x] AC-6 — FR-N13 : **ajouter une langue est une donnée, pas un développement.** Un test l'atteste
      en ajoutant une troisième langue sans toucher au code — sinon la troisième arrivera par une
      énumération en dur.

## Notes

- `Cout` n'est pas introduit ici : cette story produit le **nombre de segments**, le tarif et la
  devise viennent des capacités du canal (STORY-577) et le montant est figé sur l'`Envoi`
  (STORY-579).

---

## Ce que la livraison a appris (2026-09-04)

**⛔ AC-2 : la garde d'immutabilité N'EST PAS un rôle MongoDB, et c'est un écart à connaître.**
STORY-571 a rendu les preuves ineffaçables par un rôle privé d'`update` et de `remove` — le
mécanisme le plus solide du service. Il est **indisponible ici** : les versions vivent dans la base
**métier**, en `readWrite`, parce qu'une version doit pouvoir être *créée* et un modèle *publié*, et
parce qu'une seconde base empêcherait la transaction que STORY-579 devra ouvrir pour écrire l'`Envoi`
et son marquage d'usage ensemble. La garde est donc posée **au schéma Mongoose**, pas dans le
service : elle vaut pour tout code à venir, y compris un correctif d'exploitation ou une migration.
Seul `utiliseeLe` est mutable, sous condition `utiliseeLe: null` — donc monotone.

**⚠️ La garde va plus loin que la lettre d'AC-2, délibérément.** FR-N10 dit « immuables une fois
**utilisées** » ; la garde refuse aussi la modification d'un brouillon jamais servi. La règle
« rédiger, c'est ajouter » n'a alors **aucune exception à retenir**, et un brouillon corrigé trois
fois laisse trois versions dont deux ne seront jamais publiées — ce qui ne coûte que du stockage.

**⚠️ Conséquence : `updatedAt` est désactivé sur `versions_modele`.** Un champ que Mongoose écrit
tout seul à chaque mise à jour aurait obligé à ouvrir dans la garde une brèche permanente, assez
large pour laisser passer le reste.

**⚡ Publier ne touche pas la version : c'est un pointeur sur le MODÈLE qui se déplace.** Republier
un numéro antérieur devient un retour en arrière propre, pas une restauration — et la version reste
un document que rien ne réécrit.

**⚡ Deux pièges de segmentation, payés et tenus par test :**
- Un caractère de la **table d'extension** GSM (euro, accolades, crochets, tilde, barre verticale,
  antislash) coûte **deux septets** — un gabarit à variables en aligne toujours.
- Il **ne se coupe pas** entre deux segments : `ceil(unites / 153)` annonce **2** segments là où le
  réseau en émet **3** (cas `152 « a » + « € » + 152 « a »`). L'écart ne se lit que sur la facture.

**⚡ AC-6 tient par une ABSENCE, pas par une liste.** L'encodage se déduit des **caractères** du
texte, jamais d'une table de langues : une table `{ ar: UCS-2 }` aurait donné un coût juste pour les
langues inscrites et faux d'un facteur deux pour toutes les autres, sans lever une seule exception —
et fausse aussi sur un texte français portant un caractère collé d'un traitement de texte. Une garde
de présence refuse toute énumération de codes de langue et tout `enum` / `IsIn` sur le champ.

**⚡ AD-8 est tenu à l'ÉCRITURE, pas à la lecture.** Toute occurrence de gabarit qui n'est pas
exactement un nom de variable déclaré est refusée en `422`. Le scanner **cherche ce qu'il doit
refuser** : une expression régulière « bien formée » aurait trouvé les occurrences correctes et
**ignoré silencieusement** les autres — donc les aurait stockées. Neuf **noms réservés** du prototype
(`constructor`, `this`, `toString`…) sont refusés à la déclaration : les dire inoffensifs « parce que
le rendu substituera depuis une liste fermée » aurait été une promesse sur du code qui n'existe pas
encore.

**⛔ `figerPourEnvoi` est livré, éprouvé, et n'a AUCUN appelant.** L'`Envoi` arrive avec STORY-579.
Une garde d'inertie le rend vérifiable (leçon STORY-173) et **échouera** le jour où STORY-579
branchera le premier appelant — c'est le rappel voulu. En attendant,
`GET /api/v1/modeles/resolution` rend exactement ce qui serait figé, sans rien marquer.

**⚠️ La résolution en chaîne appartient à STORY-576, mais le schéma est déjà prêt.**
`organizationId` est **nullable dès maintenant** — la place du socle plateforme — parce que le rendre
nullable après coup imposerait de reprendre un index unique sur une collection peuplée.

**Vérification :** 950 tests unitaires (82 suites) + 56 e2e ; couverture 99,6 / 93,3 / 98,6 / 99,6,
seuils du moule tenus ; `npm run lint` et `npm run build` verts.
