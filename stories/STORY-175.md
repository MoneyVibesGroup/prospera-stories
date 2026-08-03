# STORY-175 : Filtrer les organisations par **statut KYC** — le filtre principal de la console n'a pas de serveur

**Epic :** EPIC-025 — RBAC plateforme
**Réf. :** ticket §C · **AP-02** · ⚠️ **déjà relevé le 2026-07-21, jamais formulé en demande**
**Priorité :** Must Have
**Story Points :** 2
**Statut :** À faire
**Créée le :** 2026-08-04
**Sprint :** 21
**Service :** `auth-service` (`:3001`) + relais `prospera-admin-panel-service` (`:3010`)

---

## Le constat

`ListOrgsQueryDto` porte `status` — qui vaut `ACTIVE | SUSPENDED`, c'est-à-dire le statut
d'**identité**. La liste enrichit pourtant chaque ligne d'un `kycStatus`, et **le filtre principal
de l'écran AP-02 porte sur le KYC** : « montre-moi les dossiers en attente de revue » est la
première chose qu'un opérateur demande le matin.

**Pourquoi le front ne peut pas s'en sortir seul.** Filtrer côté client casse la pagination : on ne
peut pas paginer sur une colonne qu'on filtre **après** avoir reçu la page. `total` deviendrait faux
et la page 2 sauterait des lignes. La console n'envoie donc **aucun** filtre KYC aujourd'hui — et
son test le vérifie explicitement, pour que personne ne « répare » ça côté front.

> ⚠️ Cet écart avait été relevé le 2026-07-21 lors de l'audit d'AP-03, puis **jamais transformé en
> demande**. Il a coûté une seconde découverte.

---

## Périmètre

- `ListOrgsQueryDto` reçoit `kycStatus`, aux valeurs du contrat KYC réel :
  `PENDING_DOCUMENTS | UNDER_REVIEW | APPROVED | REJECTED`.
- Il **se combine** avec `status` (identité), `q` et `ids` — les filtres sont orthogonaux.
- `total` reflète le filtre appliqué : c'est tout l'objet de la story.
- Le BFF relaie le paramètre sans le réinterpréter.

---

## Critères d'acceptation

1. `?kycStatus=UNDER_REVIEW` ne renvoie que les organisations dans cet état.
2. ⚡ `total` correspond au **nombre filtré**, et la page 2 ne saute aucune ligne — vérifié sur un
   jeu dépassant une page.
3. Se combine avec `status`, `q` et `ids` sans que l'un annule l'autre.
4. Une valeur inconnue est refusée avec `{ message, code }` — jamais ignorée en silence : un filtre
   ignoré rend une liste **complète** qui a l'air filtrée.
5. Absent ⇒ comportement inchangé (non-régression).
6. Le BFF expose le paramètre et le transmet tel quel.

---

## Definition of Done

- [ ] Les 6 critères vérifiés · `lint` 0 · couverture ≥ 90 %
- [ ] **Vérification docker** sur un jeu multi-pages
- [ ] ⚡ La console est rebranchée : `fetchOrgs` renvoie le filtre, et son test « n'envoie AUCUN
      filtre kycStatus » est **inversé** — c'est le signal que la dette est soldée
- [ ] Branche `MNV-175`, PR rebase-mergée sur `dev`
