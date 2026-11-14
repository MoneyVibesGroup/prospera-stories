# STORY-365 : Le RBAC s'étend au périmètre tenant — `perms[]` cesse d'être vide, et sa croissance est bornée

Status: done

**Epic :** EPIC-025 — RBAC plateforme (D15)
**Points :** 8 · **Sprint :** 21 (backend) · **Service :** `auth-service` (`:3001`)
**Décision :** **AD-P15** — `architecture-prospera-ecosystem-2026-07-04.md` v1.5. ⚡ **Amende D15.**
**Origine :** **arbitrage PO du 2026-08-15**, à l'occasion du PRD Catalogue produits — puis nommée
par **trois spines** : `reseau-service`, `catalogue-produits-service`, `stock-service`
**Dépendances :** aucune. ⚡ **Elle en débloque trois.**

---

## Pourquoi cette story existe

Le catalogue de permissions est **intégralement plateforme**. Le code le dit sans ambiguïté
([auth.service.ts:400](auth-service/src/modules/auth/auth.service.ts#L400)) :

> ```
> // Les permissions ne viennent QUE du rôle plateforme : les rôles TENANT ne
> // sont pas touchés par le RBAC (périmètre plateforme, D15) → `perms: []`.
> ```

Et `permission.enum.ts` le confirme : `org:`, `kyc:`, `entitlement:`, `user:`, `role:`, `catalog:`,
`project:`, `referentiel:` — **pas un seul droit métier de tenant**.

**Trois PRD d'affilée ont buté dessus, sans le savoir.**

| Module | Exigence | Ce qu'elle supposait |
| --- | --- | --- |
| `reseau-service` | `FR-R28b` | « en extension du `perms[]` déjà livré (STORY-140) » — ⛔ il est **vide** pour un superviseur d'agence IMF |
| `catalogue-produits-service` | `FR-C48` | Des droits de tenant sur les grilles et les promotions |
| `stock-service` | `FR-S61`, `FR-S62` | Six droits d'exploitation + **configurer la valorisation**, droit distinct et restreint |

> ⚡ **Ce n'était pas une erreur de rédaction répétée trois fois.** C'est un besoin structurel du
> vertical Distributeur : *« ce collaborateur gère les promotions, pas les articles »*, *« celui-là
> saisit des mouvements mais ne valide pas un ajustement »*. Commande, Facturation et PDV auront le
> même besoin.

## Le moment, et pourquoi c'est maintenant

⚠️ **La story est créée maintenant et slottée au S21 ; elle n'est pas tirable avant.** Aucun des trois
modules n'existe dans le dépôt.

**Mais sa conception ne s'améliorera plus.** Les trois vocabulaires sont énumérés aujourd'hui, et
c'est le seul instant où l'on peut les regarder **ensemble** pour fixer la borne. Créée plus tard,
chaque module aurait déjà déclaré ses droits de son côté, et la borne serait posée **après** les faits
qu'elle doit borner — c'est-à-dire jamais.

## Ce que la story livre

- **Les droits de tenant entrent au catalogue de permissions**, et `perms[]` cesse d'être vide pour
  eux. ⚡ **Un seul mécanisme d'autorisation pour toute la plateforme** — pas un second système à côté.
- **Une borne chiffrée sur `perms[]`**, et ce qui se passe quand on l'atteint. Le jeton voyage à
  **chaque requête**, dans un cookie httpOnly dont le budget est de 4 Ko.
- **Le discriminant écrit dans le code**, pas seulement dans un document.

## Le discriminant, à faire tenir par le code

`AD-P15` semble contredire `AD-5` de `reseau-service`, qui a **refusé** de mettre la portée dans le
jeton. Il ne la contredit pas :

| Va dans le jeton | Ne va pas dans le jeton |
| --- | --- |
| **Vocabulaire fermé et borné** — une liste d'**actes** connus à l'avance | **Ensemble ouvert** — une liste d'**identifiants de données** qui croît avec le client |
| Taille prévisible, indépendante du client | 500 nœuds ne tiennent pas dans 4 Ko |
| Révocation tolérable au renouvellement | Révocation devant être immédiate (fail-closed) |

> **Ce n'est pas « état tiers ou pas » qui décide** — un rôle change aussi par action tierce, et
> `roles[]` est dans le jeton depuis le premier jour. **C'est BORNÉ ou NON BORNÉ.**

⛔ **Le jour où un droit devient une liste d'identifiants, il quitte le jeton et passe en read-model.**
C'est ce qui est arrivé à la portée réseau. La règle existe pour que ce soit tranché **sur ce
critère**, et pas au cas par cas par le module suivant.

## Critères d'acceptation

- **Étant donné** un utilisateur de tenant portant un rôle métier **quand** il obtient un jeton
  **alors** `perms[]` porte les droits de ce rôle — et **n'est plus vide**.
- **Étant donné** un utilisateur de tenant **sans** rôle métier **quand** il obtient un jeton **alors**
  `perms[]` est vide et **rien ne change** par rapport à l'état antérieur. ⚡ L'extension est
  **additive** : `perms[]` valant `[]` pour tout tenant aujourd'hui, aucun porteur existant ne peut
  régresser.
- **Étant donné** le modèle en place — *`PERMISSION = CODE`, `RÔLE = DONNÉE`* — **quand** un droit de
  tenant est défini **alors** il est **un code** dans `permission.enum.ts`, attaché à un rôle de la
  collection `roles`. ⛔ **Aucun second modèle d'autorisation** n'est créé à côté.
- **Étant donné** la borne fixée **quand** un jeton la dépasserait **alors** l'émission **échoue de
  façon nommée**, avec un code machine stable — ⛔ **jamais un jeton tronqué**, qui produirait un refus
  d'accès inexplicable et intermittent.
- ⛔ **Étant donné** un droit dont la valeur serait une **liste d'identifiants de données** **quand**
  on tente de l'ajouter au catalogue **alors** c'est **refusé** : un test rend la règle exécutable, pas
  seulement écrite.
- **Étant donné** un rôle plateforme **quand** il obtient un jeton **alors** son comportement est
  **inchangé**. Les deux périmètres coexistent ; ils ne fusionnent pas.
- **Étant donné** les trois modules consommateurs **quand** ils seront construits **alors** ils
  trouvent un **espace de nommage documenté** et une règle d'ajout — la story nomme ses consommateurs,
  elle n'est pas livrée à vide.

## Ce que cette story ne fait PAS

- ⛔ Elle **n'implémente aucun droit métier des trois modules**. Elle ouvre le mécanisme et pose la
  règle ; chaque module déclare ses droits dans son propre épic (`EPIC-074` catalogue, `EPIC-082` et
  `EPIC-084` stock, et l'épic correspondant de `reseau-service`).
- ⛔ Elle ne touche **pas** à la portée réseau, qui voyage par **read-model** et **jamais par le
  jeton** (`AD-5` de `reseau-service`). Confondre les deux est exactement ce que le discriminant existe
  pour empêcher.
- ⛔ Elle ne rouvre pas D15 sur le fond : le périmètre plateforme reste ce qu'il est. Elle **ajoute**
  un périmètre tenant à côté.

## Definition of Done

- [x] Un utilisateur de tenant porteur d'un rôle métier reçoit un `perms[]` **non vide**.
- [x] **Test de non-régression sur l'existant** : tout porteur sans rôle métier reçoit exactement ce
      qu'il recevait avant.
- [x] La **borne est chiffrée**, appliquée, et son dépassement produit un **échec nommé**.
- [x] ⚡ **Test du discriminant** : tenter d'enregistrer un droit non borné fait **virer un test au
      rouge**. Sans lui, la règle centrale de la story n'est tenue par rien.
- [x] L'espace de nommage des droits tenant est documenté, avec sa règle d'ajout.
- [x] ⚠️ **`AD-P15` est mise à jour** dans `architecture-prospera-ecosystem-2026-07-04.md` : la borne y
      est **écrite en clair**, puisque c'est le document dont toutes les spines héritent.

---

## Suivi — 2026-11-14 (requalifiée, fusionnée sur `dev`)

**PR :** MoneyVibesGroup/prospera-auth-service#36.

### Requalification (plan du 14/11 : « 166 et 167 ont avancé sur le même terrain »)

Déjà livré par **STORY-166/167**, et donc pas refait ici : catalogue des droits de tenant
(13 codes, fichier distinct du catalogue plateforme) ; `perms[]` = union des deux portées ;
membre sans rôle métier toujours à `[]` ; format fermé `<module>:<objet>:<acte>` et **test du
discriminant** (identifiants, jokers et casse refusés) ; rôles plateforme inchangés.

**Ce que 365 seule portait, et qu'elle livre : la borne.**

| Constante | Valeur | D'où |
|---|---|---|
| `MAX_JETON_OCTETS` | 3 584 | cookie httpOnly de 4 096 octets, moins 512 pour le nom et la marge |
| `MAX_PERMS_PAR_JETON` | **44** | mesuré : ~909 octets à vide, ~57 par permission de 40 caractères |
| `MAX_LONGUEUR_CODE_PERMISSION` | 40 | hypothèse de la mesure, testée sur les deux catalogues |

- `issueTokens` vérifie le **nombre** avant la signature et la **taille** après : au-delà,
  `JETON_HORS_BORNE` (500 nommé), jamais un jeton tronqué.
- ⚡ La mesure est rejouée par un test qui **signe un vrai jeton RS256** au pire cas. C'est ce test
  qui a fait descendre la borne de 48 à 44 : l'estimation initiale portait sur des codes de 37
  caractères, et 48 codes de 40 caractères font 3 662 octets.
- Croissance bornée : un test rougit si l'union des deux catalogues (aujourd'hui 17 + 13 = 30)
  dépasse 44, ou si un code dépasse 40 caractères.
- Règle d'ajout de l'espace de nommage tenant écrite en tête de `tenant-permission.enum.ts`.
- **AD-P15** porte désormais la borne en clair (architecture programme, v1.12).

### Preuves

Unitaires 1 236/1 237 (le seul échec, bcrypt sous charge, est vert rejoué seul). Docker :
administrateur plateforme 17 permissions (1 418 octets) ; membre sans rôle métier `perms: []` ;
membre `DIST_ADMIN` 6 permissions (1 236 octets).
