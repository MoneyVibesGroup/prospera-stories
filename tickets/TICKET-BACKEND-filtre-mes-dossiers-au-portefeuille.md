# TICKET BACKEND — le portefeuille n'a aucun filtre « Mes dossiers » pour un administrateur

**Cible :** `BACKEND` — `dossier-service` (`GET /api/v1/dossiers`)
**Ouvert par :** **FE-059a** à l'intégration (2026-08-18)
**Consommateur frontend nommé :** **FE-071** *(nommé en même temps, pour ne pas rejouer l'orphelinat
de STORY-144 : une story backend livrée ne déclenche rien tant qu'une story frontend ne la nomme pas)*
**État :** ⛔ **OUVERT — et il demande un arbitrage PO avant tout code**

---

## Le constat

La maquette **FE-D00**, validée par le PO, porte un sélecteur à deux positions :

```html
<div class="states-demo" role="tablist" aria-label="Visibilité" id="dcScopeSeg">
  <button data-dc-scope="all"  data-admin-only>Tous les dossiers</button>
  <button data-dc-scope="mine">Mes dossiers</button>
</div>
```

avec, juste dessous, la note qui en donne la raison :

> 👑 Vous êtes **administratrice** : vous voyez les dossiers de tous vos collaborateurs. Un
> collaborateur ne voit que les siens.

**`GET /api/v1/dossiers` n'accepte aucun paramètre** — vérifié dans l'OpenAPI réel du service au
2026-08-18 : `"parameters": []`. FE-059a a donc livré la page **sans ce sélecteur**, et l'a écrit
dans le code plutôt que de le simuler.

## Pourquoi FE-059a ne l'a pas fait côté client

Parce que ce serait faux **demain**, et invérifiable **aujourd'hui** :

1. L'AC de FE-059a interdit explicitement « tout filtrage côté client qui simulerait une portée ».
2. Et surtout : **D16 impose la pagination serveur** (STORY-359). Dès qu'elle arrive, un filtre
   « Mes dossiers » appliqué côté client ne filtrerait plus que **la page courante** — un admin
   verrait « 3 de mes dossiers » sur la page 1 en en ayant 12. C'est **exactement** le défaut que la
   maquette proscrit pour les compteurs : « un collaborateur qui lirait 5 dossiers alors qu'il n'en
   voit que 2 conclurait qu'on lui en cache ».

⇒ Le filtre doit être **servi**, ou ne pas exister.

## ⚠️ Ce que ce ticket N'EST PAS — à lire avant d'arbitrer

**Ce n'est pas une demande de paramètre de portée.** Le bloc **K** du ticket dossier verrouille :

> « La portée doit être **dérivée du jeton**, jamais d'un paramètre de requête. »

et le bloc **B**, étendu par **D11** :

> « le dossier `estLeCabinet` n'est **ni affectable, ni visible** d'un collaborateur — la règle vit
> dans **la requête de portée**, jamais dans l'affichage. »

Ces deux décisions restent intactes, et ce ticket ne les rouvre pas. Ce qui est demandé est
**orthogonal** : un **filtre de confort**, à l'intérieur de ce que le jeton autorise déjà.

| | portée (verrouillée) | filtre demandé ici |
|---|---|---|
| décidée par | le **jeton**, côté serveur | **l'utilisateur**, dans l'écran |
| ce qu'elle protège | l'accès — un dossier hors périmètre rend **404** | rien : tout est déjà autorisé |
| pour un `TENANT_USER` | il ne reçoit **que** ses affectations | **sans objet** — « tous » = « les miens » |
| pour un `TENANT_ADMIN` | il reçoit **tout** le portefeuille actif | choisit de n'afficher **que** ceux dont il est responsable/contributeur |

**Corollaire à ne pas manquer :** le sélecteur est `data-admin-only` dans la maquette, et ce n'est pas
cosmétique. Le proposer à un collaborateur **promettrait une vue « Tous les dossiers » qu'il n'a pas
le droit d'obtenir** — l'écran annoncerait un refus au lieu de ne rien annoncer.

## Ce qui est demandé

Un paramètre de **filtre** sur `GET /api/v1/dossiers`, appliqué **après** la portée du jeton, jamais à
sa place. Par exemple `?affectation=moi`, servi ainsi :

- `TENANT_ADMIN` → restreint aux dossiers dont il est `responsableUserId` **ou** dans
  `contributeursUserIds` ;
- `TENANT_USER` → **sans effet** (sa portée est déjà celle-là) — et surtout **pas une erreur** : un
  écran qui enverrait le paramètre pour tout le monde ne doit pas casser ;
- absent → comportement actuel, inchangé.

⚡ **À traiter AVEC STORY-359, pas après.** Elle porte déjà pagination, tri et recherche serveur sur
cette même route : ajouter le filtre ensuite obligerait à retoucher la même signature deux fois, et
laisserait entre-temps un écran qui ne peut pas l'implémenter honnêtement.

## Arbitrage PO demandé

| # | Question | Pourquoi elle bloque |
|:--:|---|---|
| **Q1** | Le filtre « Mes dossiers » est-il **maintenu** au produit, ou **retiré de la maquette** ? | S'il est retiré, ce ticket se ferme sans code et FE-071 disparaît. La maquette est validée : seul le PO peut la corriger. |
| **Q2** | S'il est maintenu : « mes dossiers » = **responsable uniquement**, ou **responsable + contributeur** ? | Les deux se défendent. « Responsable » est ce dont je réponds ; « + contributeur » est ce sur quoi je travaille. Le second est cohérent avec la portée d'un `TENANT_USER`, qui inclut déjà les deux. |
| **Q3** | Le choix doit-il **survivre au rechargement** (URL ou préférence) ? | Un filtre qui se réinitialise à chaque navigation se lit comme un bug ; le porter dans l'URL a un coût côté FE-062 (qui met déjà le dossier actif dans l'URL). |

**Recommandation :** maintenir (Q1), **responsable + contributeur** (Q2) — c'est la définition que le
serveur applique déjà pour un collaborateur, en réutiliser une seconde évite deux notions de
« mes dossiers » dans le même produit — et **porter le choix dans l'URL** (Q3), pour qu'un lien
partagé montre la même chose à son auteur.

## Impact tant que c'est ouvert

Aucun blocage : le portefeuille est livré et utilisable. Un administrateur de cabinet voit
l'intégralité de son portefeuille actif et dispose de la **recherche** pour retrouver un dossier
précis. Ce qui manque est le **tri rapide « ce dont je réponds »**, sur un cabinet à plusieurs
collaborateurs.
