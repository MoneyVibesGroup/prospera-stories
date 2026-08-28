# STORY-549 : Deux cartes sans code, quatre codes sans carte — le registre de modules du cabinet entre au catalogue

Status: ready-for-dev

**Épic :** EPIC-007 — Catalogue de modules et packs verticaux
**Service :** `platform-catalog-service` (`:3006`) + `frontend-admin-panel` (packs)
**Points :** 13 · **Sprint :** S20 — *8 → 13 le 2026-08-28 : le PO tranche aussi la sortie des fonctionnalités de socle, et elle touche **deux packs**, pas un*
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

## Second arbitrage PO du 2026-08-28 : les fonctionnalites de socle SORTENT des packs

`equipe`, `support-client` et `dashboard` **ne sont lus par aucun service applicatif** — verifie :
seules la console et ses fixtures les connaissent. Ce ne sont pas des **modules facturables**, ce
sont des **fonctionnalites du socle**. Les laisser au pack les fait ressembler a des entitlements,
et le client paie pour des cartes qu'il ne verra jamais.

⇒ **Ils sortent.** Et l'effet depasse le cabinet :

| Pack | Aujourd'hui | Apres |
|---|---|---|
| `cabinet` | `bilan`, `fiscalite`, `equipe`, `support-client`, `dashboard` | `bilan`, **`balance`**, **`conseil`**, **`declarations`** |
| `assurance-cima` | `bilan`, `finance-transactions`, **`support-client`**, **`dashboard`** | `bilan`, `finance-transactions` |
| `distributeur` · `imf-sfd` | *(n'en portent aucun)* | inchanges |

⚡ **Pourquoi cette sortie est groupee avec l'ajout et non fichee a part** — meme artefact
(`packs.seed-data.ts`), meme transcription independante (`packs.front-snapshot.ts`), meme spec de
comparaison, meme migration, **et une seule procedure de rattrapage**. Les separer couterait deux
migrations et deux verifications docker de la meme table. C'est le raisonnement de STORY-368,
applique ici.

⚠️ **Mais les deux moities n'ont PAS le meme profil de risque, et les AC les separent** : ajouter un
module ne peut rien casser ; **en retirer un touche des organisations deja provisionnees**.

### Ce que la sortie ajoute aux criteres d'acceptation

- [ ] AC-7 — `equipe`, `support-client` et `dashboard` sortent de **tous les packs** — `cabinet`
      **et** `assurance-cima`. ⚠️ Ne pas se limiter au pack de l'ecran qui a ouvert le sujet : la
      meme erreur de conception vit dans un second pack.
- [ ] AC-8 — ⛔ **Ils RESTENT au catalogue**, en statut non octroyable — comme `fiscalite` (AC-3).
      Les supprimer revoquerait des octrois existants, et **une revocation silencieuse est le seul
      geste de cette story qui puisse retirer une capacite a un client en production**.
- [ ] AC-9 — Les organisations **deja porteuses** de ces entitlements sont **inventoriees et
      listees**. ⛔ **Aucune revocation automatique** : le rattrapage d'AC-4 *ajoute*, il ne retire
      pas. Retirer se decide organisation par organisation, ou pas du tout.
- [ ] AC-10 — Un test verifie qu'**aucun service applicatif** ne lit ces trois codes — c'est ce qui
      rend la sortie sure, et c'est la seule preuve qui vaille. S'il en trouve un, **la sortie
      s'arrete et le fait est remonte** : la decision reposait sur cette absence.

## Notes

- Voir [[STORY-366]] (le prérequis), [[FE-085]] (l'écran et la garde), [[FE-014]].
