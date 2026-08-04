> # ⛔ STORY REMPLACÉE — NE PAS IMPLÉMENTER
>
> **Remplacée le 2026-08-03** (décision PO) par le re-découpage du Module 2 : **STORY-251, STORY-252, STORY-253**.
>
> Cette story appartenait au découpage `EPIC-004 (rescopé)` (18 stories, 104 pts). Le découpage en
> vigueur est **EPIC-035 → EPIC-042 / STORY-237 → STORY-290** (54 stories, 196 pts), sprints 31→38.
> Le contenu ci-dessous **reste une bonne source de contexte métier** — c'est pour cela qu'il n'est pas
> supprimé — mais **son périmètre, son estimation et son sprint ne font plus foi**.
>
> 📄 Découpage en vigueur : [`epics-paiement-2026-08-03.md`](../epics-paiement-2026-08-03.md)
> 📐 Architecture : [`ARCHITECTURE-SPINE.md`](../architecture/architecture-paiement-service-2026-08-03/ARCHITECTURE-SPINE.md) (AD-1 → AD-18)
> 🗂️ Motif détaillé : `superseded_stories` dans [`sprint-status.yaml`](../sprint-status.yaml)

---

# STORY-153 : Créance projetée, demande de paiement et **lien public** — la seule surface que voit un détaillant

**Epic :** EPIC-004 — `paiement-service` (PI-SPI & encaissement)
**Réf. PRD :** [`prds/prd-paiement-service-2026-08-02/prd.md`](../prds/prd-paiement-service-2026-08-02/prd.md) §3 **UJ-1 (Kossi)** · §6 groupe C (FR-P13→P18) · §7 **NFR-8**
**Réf. code livré :** **STORY-150/151/152** · **STORY-011** (URL présignée MinIO — ⚠️ voir *piège connu* §E) · `notification-service` FR-N17 (le lien est **transmis** par lui, jamais par ce service)
**Dépend de :** STORY-152 (routage), STORY-151 (bénéficiaire)
**Débloque :** STORY-154 (il faut une demande pour l'encaisser)
**Priorité :** Must Have
**Story Points :** 8
**Complexité :** medium-high — **la moitié de la valeur est dans une page web publique**, pas dans l'API
**Statut :** ⛔ **superseded (2026-08-03)** — remplacée par STORY-251, STORY-252, STORY-253
**Assigné à :** null
**Créée le :** 2026-08-02
**Sprint :** ~~aucun~~ — retirée des sprints le 2026-08-03 (elle occupait le S31→S34)
**Service :** `paiement-service` (`:3005`)
**Couvre :** FR-P13, FR-P13b, FR-P14 → FR-P18 · NFR-8

---

## Contexte

C'est la story qui produit **la seule surface publique de tout Prospera** : la page qu'ouvre un
détaillant qui n'a aucun compte, sur un téléphone d'entrée de gamme, en 3G. L'adoption du module s'y
joue entièrement — `CM-2` du PRD mesure précisément les liens émis et jamais ouverts.

### Le statut de la créance — tranché, ne pas rouvrir

Le PRD a d'abord déclaré la créance « référence externe opaque », puis écrit des exigences qui
supposaient que le service en détient le solde. **La contradiction a été relevée et tranchée** :

> Le service détient une **créance projetée** — référence externe, montant d'origine, devise,
> échéance, libellé, fournis par le module appelant. **Il n'émet pas la facture ; il maintient le
> solde encaissé.** Facturation (#17) reste propriétaire de la facture ; ce module est propriétaire
> de **ce qui a été payé dessus**.

Au v1, **Facturation n'existe pas** : le module appelant fournit ces informations et en répond
*(assumption A2 du PRD)*.

---

## User Story

**En tant que** détaillant qui doit de l'argent à son distributeur,
**je veux** ouvrir un lien sur mon téléphone et voir clairement combien je dois, à qui, et ce que
ça va me coûter,
**afin de** payer sans me déplacer et sans mauvaise surprise.

---

## Périmètre

### A. La créance projetée

| Champ | Note |
|---|---|
| Référence externe | Fournie par l'appelant, **stable** |
| Montant d'origine | `Montant` (entier d'unité mineure + devise) |
| Échéance, libellé | Affichés au payeur |
| Module appelant | **Toujours enregistré** — le journal sait qui a parlé |

**Plusieurs demandes peuvent viser la même créance** (relance, fractionnement) — c'est le cas nominal,
pas l'exception.

### B. La demande de paiement

Se rattache à une créance projetée et porte : montant, payeur, **bénéficiaire** (compte
d'encaissement, STORY-151), durée de validité, identité de l'appelant.

**États et transitions autorisées** (FR-P21) :

```
créée → envoyée → partiellement payée → soldée
   ↘ expirée   ↘ révoquée   ↘ échouée
```

`soldée` est atteignable depuis `partiellement payée`. **Aucun retour arrière.**

⚠️ **Aucune demande ne progresse sur la seule foi de l'appelant** (FR-P22) : le passage à un état payé
exige la confirmation du fournisseur (STORY-154) ou une déclaration validée (STORY-156).

### C. Le lien public — `NFR-8`

Consultable **sans compte Prospera**. Il affiche :

1. **Qui** est payé (le bénéficiaire, nommé)
2. **Pour quoi** (libellé de la créance, référence)
3. **Combien** : montant dû · **frais** · **total à payer**
4. Les méthodes réellement disponibles (capacités du fournisseur, STORY-152)

**Contraintes non négociables :**

- S'ouvre sur un navigateur mobile d'entrée de gamme, sur réseau lent
- **En cas de coupure réseau au milieu du paiement, le payeur doit toujours savoir s'il a payé ou non.**
  Un écran ambigu à ce moment précis produit un double paiement ou un abandon
- Aucune donnée du distributeur n'y transparaît au-delà de ce que le payeur doit connaître

### D. Validité, QR, révocation

| # | Règle |
|---|---|
| **FR-P15** | Durée de validité — **défaut 30 jours**, paramétrable par organisation, **plafond 90 jours**. Expiré, le lien le dit clairement et offre le moyen d'en demander un nouveau |
| **FR-P16** | Disponible en **QR** — le commercial en tournée le présente ; le payeur n'a pas besoin de recevoir un message |
| **FR-P18** | **Révocable** avant paiement par un rôle habilité |

### E. Le lien est transmis par `notification-service`, jamais par ce service

`FR-P17` : ce module **ne parle jamais directement au payeur**. Il produit le lien ; l'organe de
parole est unique.

> ⚠️ **Piège connu, déjà payé une fois.** `STORY-011` a produit des URL présignées valides à
> l'intérieur du réseau Docker et **invisibles depuis un navigateur** (`MINIO_PUBLIC_ENDPOINT` non
> câblé, trouvé au gate d'intégration FE-023). Le lien de paiement a **exactement la même nature** :
> une URL générée côté serveur, consommée par un client externe. **La leçon retenue : une URL ne se
> vérifie qu'avec le client qui la consommera.** AC 9 l'impose.

### F. Hors périmètre

L'encaissement lui-même, les frais réellement appliqués, le webhook (STORY-154). Ici on **présente**
et on **attend**.

---

## Critères d'acceptation

1. Une demande référence une créance projetée ; **plusieurs demandes** sur la même créance sont possibles.
2. La création d'une demande **sans bénéficiaire actif** est refusée (`409 { code: 'COMPTE_NON_ACTIF' }`).
3. Le lien s'ouvre **sans authentification** et affiche bénéficiaire, motif, montant dû, frais, total.
4. Les méthodes proposées sont **celles que le fournisseur déclare** pour ce couple `pays × devise`,
   jamais une liste fixe.
5. Un lien expiré affiche un message explicite **et** le moyen d'en demander un nouveau — il n'affiche
   ni erreur technique ni page blanche.
6. Le QR encode le même lien et mène à la même page.
7. Une demande révoquée n'encaisse plus ; le lien le dit.
8. Les transitions interdites sont refusées : `soldée → envoyée`, `révoquée → payée`, tout retour arrière.
9. ⚡ **Vérification en navigateur réel** (Playwright), pas en `curl` : la page s'ouvre depuis
   l'extérieur du réseau Docker, sur un profil mobile bas de gamme et réseau ralenti.
10. ⚡ **Coupure réseau simulée** pendant le parcours : la page affiche un état **non ambigu** —
    « payé », « non payé », ou « en cours de vérification ». **Jamais** un écran dont on ne peut pas
    conclure.
11. Aucune information du distributeur au-delà du nécessaire n'apparaît dans la page ni dans sa source.
12. La durée de validité par défaut est de **30 jours** ; une valeur au-delà de **90** est refusée.

---

## Notes techniques

### Le lien doit être imprévisible

L'identifiant public d'une demande ne doit pas être devinable ni énumérable : il donne accès à un
montant dû et à l'identité d'un commerce. Même exigence d'anti-énumération que `STORY-033`.

### Ce que « non ambigu » veut dire (AC 10)

Trois états seulement, et jamais autre chose : **payé** · **non payé** · **en cours de vérification,
ne payez pas deux fois**. Le troisième est celui qu'on oublie d'écrire, et c'est celui qui évite le
double paiement.

---

## Risques & mitigation

| Risque | Mitigation |
|---|---|
| ⚡ Le lien fonctionne en `curl` et pas dans un navigateur (piège `STORY-011`) | **AC 9** : vérification en navigateur réel, hors réseau Docker |
| Une coupure réseau laisse le payeur dans le doute → double paiement | **AC 10** : trois états, jamais d'ambiguïté |
| L'identifiant du lien est énumérable | Identifiant imprévisible + anti-énumération |
| Le lien affiche une liste de méthodes fixe qui ne correspond pas au fournisseur | **AC 4** : lu des capacités |
| La page est lourde et inutilisable sur un téléphone modeste | **NFR-8 + AC 9** avec profil contraint |

---

## Definition of Done

- [ ] Les 12 critères d'acceptation vérifiés
- [ ] `lint` 0 · couverture ≥ 90 %
- [ ] **Vérification docker obligatoire** + **vérification navigateur réel** (Playwright, profil
      mobile bas de gamme, réseau ralenti, depuis l'extérieur du réseau Docker)
- [ ] Revue de sécurité : anti-énumération, aucune fuite d'information du distributeur
- [ ] Branche `MNV-153`, PR rebase-mergée sur `dev`

---

## Progress Tracking

*(à remplir à l'implémentation)*
