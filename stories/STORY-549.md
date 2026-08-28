# STORY-549 : Deux cartes sans code, quatre codes sans carte — le registre de modules du cabinet entre au catalogue

Status: ready-for-dev

**Épic :** EPIC-007 — Catalogue de modules et packs verticaux
**Service :** `platform-catalog-service` (`:3006`) + `frontend-admin-panel` (packs)
**Points :** 8 · **Sprint :** S20
**Prérequis :** ⛔ **STORY-366** (le catalogue de modules est semé, et un pack ne peut plus référencer un module inconnu) — `not_started`
**Origine :** revue de l'écran **« Vos modules »** (FE-014) demandée par le PO le 2026-08-28, faite **contre le registre réel** et non contre les épics.

---

## Le fait, mesuré dans le code

L'accueil affiche **quatre** modules. Le pack `cabinet` en octroie **cinq**. **Deux seulement se
recouvrent.**

| Carte de l'accueil | Code registre client | `href` | Dans le pack `cabinet` ? |
|---|---|---|---|
| Bilan & états financiers | `bilan` | `/bilan` ✅ | ✅ |
| Atelier de balance | `balance` | `/atelier` ✅ | ⛔ **absent** |
| Conseil fiscal | `conseil` | ⛔ **aucun** | ⛔ **inconnu du catalogue** |
| Déclarations fiscales | `declarations` | ⛔ **aucun** | ⛔ **inconnu du catalogue** |

`packs.seed-data.ts` : `modules: ['bilan', 'fiscalite', 'equipe', 'support-client', 'dashboard']`.

⇒ **Le décalage joue dans les deux sens : deux cartes sans code, quatre codes sans carte.**

## ⛔ Ce que ça produit aujourd'hui, et qui est plus grave qu'un module manquant

1. **« Abonnement requis » sur Déclarations fiscales est FAUX.** Le module n'est pas au pack :
   **souscrire une formule n'ouvrira rien**. On oriente le client vers un achat qui ne changera pas
   son écran. ⚡ C'est pire que « non activé », qui au moins n'appelle pas à payer.
2. **« Nous contacter » sur Conseil fiscal mène à une impasse** que le support ne peut pas résoudre :
   il n'y a **aucun code à octroyer**.
3. **La carte Atelier dit vrai aujourd'hui et deviendra fausse.** Elle affiche « Vérification
   requise » (KYC) ; l'ordre serveur étant e-mail → KYC → entitlement, **elle basculera sur « Non
   activé » dès le KYC approuvé**, et le cabinet ne comprendra pas ce qu'il a fait de mal.

⚡ **Ce n'est pas un oubli isolé : c'est le patron « valide contre une liste qu'il ne publie pas »**
— 6ᵉ occurrence après STORY-394, 397, 414, 488 — appliqué cette fois **à l'objet le plus visible du
produit, celui qui porte les boutons d'achat**.

## ✅ Arbitrage PO du 2026-08-28 : **DEUX modules fiscaux, pas un**

`conseil` et `declarations` restent **deux modules distincts**, parce qu'ils **se vendent
différemment** : les déclarations sont une **obligation** (tout cabinet en a besoin), le conseil est
un **service à valeur ajoutée** qui se facture plus cher. Un seul `fiscalite` empêcherait de vendre
l'un sans l'autre.

## Critères d'acceptation

- [ ] AC-1 — Les modules `balance`, `conseil` et `declarations` **existent au catalogue**, avec leur
      libellé, leur description et leurs `referentielFamilies`.
- [ ] AC-2 — Le pack `cabinet` porte `balance`, `conseil` et `declarations`. ⚠️ La **source de vérité
      est double** — `packs.seed-data.ts` **et** `vertical-packs.ts` côté console, comparés par
      `packs.seed-data.spec.ts`. **Les deux changent, ou aucun** : un seed qui diverge du front
      change en silence ce que reçoit une organisation provisionnée.
- [ ] AC-3 — ⛔ **`fiscalite` sort du pack `cabinet`**, remplacé par les deux. Le module **reste au
      catalogue** (statut retiré) : le supprimer révoquerait des octrois existants. Les organisations
      déjà porteuses de `fiscalite` sont **inventoriées et migrées explicitement**, jamais
      silencieusement.
- [ ] AC-4 — ⚠️ **Ajouter un module à un pack n'octroie RIEN rétroactivement.** Les organisations
      déjà provisionnées ne recevront ni `balance`, ni `conseil`, ni `declarations`. ⇒ Une
      **procédure de rattrapage** est livrée avec la story, et son exécution est **tracée**. Sans
      elle, le gap ne se referme que pour les nouveaux clients — c'est-à-dire pas du tout.
- [ ] AC-5 — Une route publie **la liste des codes de module du catalogue**. C'est elle que la garde
      de **FE-085** interroge. ⇒ **La 6ᵉ occurrence du patron se ferme par une route, pas par une
      relecture.**
- [ ] AC-6 — Vérification **en docker sur stack neuve** : provisionner une organisation `cabinet`
      doit rendre les cinq modules attendus, et `GET /catalog/entitlements/{orgId}` doit les
      publier. ⚠️ C'est exactement la vérification qui a ouvert ce gap le 2026-08-11 (provisioning à
      `422`) — elle doit le déclarer clos.

## ⚠️ Un point ouvert, nommé et non tranché

`equipe`, `support-client` et `dashboard` sont au pack et **ne sont lus par aucun service
applicatif** — seulement par la console et ses fixtures. Ce ne sont pas des **modules facturables**,
ce sont des **fonctionnalités du socle**. Les laisser au pack les fait ressembler à des
entitlements, et le client paie pour des cartes qu'il ne verra jamais.

**Recommandation : les sortir du pack.** Mais c'est une décision d'**offre**, pas de code —
elle appartient au PO et sort du périmètre de cette story.

## Notes

- Voir [[STORY-366]] (le prérequis), [[FE-085]] (l'écran et la garde), [[FE-014]].
