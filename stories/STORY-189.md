# STORY-189 : Le **verdict d'intégrité** d'un référentiel remonte au catalogue — sinon l'AC 3 d'AP-04 est indémontrable

**Epic :** EPIC-024 — Catalogue & entitlements
**Réf. :** **AP-04** *(registre des référentiels — **AC 3**)* · **AP-05** *(`isReferentielUsable` exclut un paquet compromis du sélecteur)* · **AP-06** *(le pack Finance est présenté comme inactivable pour cette raison)* · **STORY-038** *(`ReferentielPackage` : pointeur + checksum)* · **STORY-149** *(dépôt d'un paquet, sha256 calculé côté serveur)* · `architecture-catalog-service-2026-07-07.md`
**Découverte par :** revue de la maquette AP-06 confrontée au contrat généré, 2026-08-04
**Priorité :** Should Have
**Story Points :** 5
**Statut :** À faire
**Créée le :** 2026-08-04
**Sprint :** 21
**Service :** `platform-catalog-service` (`:3003`) — 1 dépôt, 1 branche, 1 PR
**Branche :** `MNV-189`

---

## ⚠️ Story créée sur une **contestation assumée** du tri des tickets

Les deux tickets de l'Integration Gate ont rangé `verified` parmi les **« inventions du front »**,
au même titre que `registrationId`, `memberSince` ou `targets`, avec ce motif — juste dans son
principe :

> *« Elles ne redeviendront des demandes backend que si le PO décide que la fiche doit les porter.
> Ce n'est pas à un Integration Gate d'en décider — un gate constate des écarts, il n'arbitre pas
> le produit. »*

**Le raisonnement est bon, la classification ne l'est pas** — et la différence est vérifiable, pas
affaire d'opinion :

- `registrationId` et `memberSince` sont apparus **dans une maquette**. Aucun critère d'acceptation
  ne les demande.
- **`verified` est demandé par un AC écrit et validé** : *AP-04, AC 3 — « CRUD Versions de
  référentiel + **checksum** visible ; **un référentiel non intègre est signalé** »*. Et un second
  écran s'y adosse déjà : AP-05 exclut un paquet `compromised` de son sélecteur d'octroi.

⇒ Ce n'est donc pas un champ à arbitrer, c'est **un AC sans amont**. **Décision PO du 2026-08-04 :
l'AC est conservé, et cette story lui donne sa source.** Sprint 21.

---

## Le constat

`ReferentielVersionResponseDto` porte `artifactUri`, `checksum`, `status`, `deprecationDate` — et
**aucun verdict**. Le catalogue sait ce que le paquet **devrait** être ; il ne sait pas si quelqu'un
a jamais vérifié qu'il l'est.

Le front en a tiré la seule lecture honnête possible *(`features/catalog/integrity.ts`)* :

```ts
export type IntegrityState = "verified" | "compromised" | "unverified";

export function integrityOf(ref: ReferentielVersion): IntegrityState {
  if (!ref.verified) return "unverified";     // ⚠️ toujours ce cas, aujourd'hui
  return ref.verified.ok ? "verified" : "compromised";
}
```

**`ref.verified` est câblé à `null` en permanence.** Trois états sont implémentés, testés, rendus à
l'écran — **un seul est atteignable**. « Non intègre » ne s'affichera jamais, quelle que soit la
réalité du paquet.

## Pourquoi ce n'est pas un détail d'affichage

**La vérification a bien lieu — elle a lieu ailleurs, et ne revient pas.** `bilan-service` télécharge
le paquet au chargement et refuse un hash qui ne correspond pas. Le catalogue, lui, ne l'apprend
jamais.

**Conséquence, dans l'ordre où elle se produit :**

1. Un paquet est corrompu ou remplacé au registre. Le catalogue continue de le présenter comme
   normal — **rien ne le distingue d'un paquet sain**.
2. Un admin l'octroie à une organisation. Le geste réussit : `PUT /catalog/entitlements` ne vérifie
   rien, il n'en a pas les moyens.
3. **L'échec se produit chez le client**, à l'ouverture du module, sous la forme d'un refus de
   chargement — **loin du geste qui l'a causé, et sans lien visible avec lui**.

> ⚡ C'est le scénario que la vigilance d'AP-05 nomme mot pour mot : *« un référentiel au checksum
> non conforme n'est pas octroyable — le sélecteur doit l'exclure, sinon l'octroi échouera chez le
> client au chargement du paquet, c'est-à-dire **loin d'ici, et sans lien visible avec ce geste** »*.
> La garde a été écrite côté front. Elle n'a **rien à lire**.

**Et un troisième écran en dépend déjà :** la maquette AP-06 présente le pack Finance comme
**inactivable** parce que `sfd-bceao@1.3` serait à l'empreinte non conforme. C'est un état que le
système, aujourd'hui, **ne sait pas produire** — la démonstration repose sur une donnée fabriquée.

---

## Périmètre

### 1. Le verdict, porté par le catalogue

Sur `ReferentielVersion` :

```jsonc
"verification": {
  "ok": false,
  "at": "2027-04-10T08:12:03Z",
  "by": "bilan-service",
  "expected": "sha256:9f2a…",
  "got": "sha256:1c4b…"      // renseigné UNIQUEMENT quand ok = false
}
```

⚡ **Nullable, et le rester.** `null` = *jamais chargé* — ce n'est **ni** une réussite **ni** un
échec, et c'est le point le plus facile à rater : traiter l'absence de preuve comme un feu vert
serait le vrai piège, la traiter comme un défaut bloquerait tout paquet neuf. Le front a déjà tranché
dans le bon sens *(`unverified` reste octroyable, seul `compromised` sort du sélecteur)* ; le contrat
doit lui permettre de le faire.

⚠️ **`got` n'est renseigné qu'en cas d'échec.** Publier le hash lu d'un paquet sain n'apprend rien et
duplique `checksum`.

### 2. `POST /api/v1/catalog/referentiels/:code/:version/verification`

La route par laquelle un consommateur **rapporte** ce qu'il a constaté.

- **Corps :** `{ ok, at, by, got? }`.
- **Idempotence de dernière écriture** : le dernier rapport gagne. On garde **l'état courant**, pas
  un journal — un référentiel a un état d'intégrité, pas une carrière.
- **Autorisation : machine-à-machine.** ⚠️ **Ce n'est pas une route d'opérateur** : aucune permission
  du catalogue D15 ne convient, et il ne faut **pas** en inventer une 13ᵉ. Deux options à trancher au
  lancement — jeton de service, ou consommation d'un événement plutôt qu'un appel. ⚡ **Choisir
  l'option événement si le bus le permet** : un service qui *rapporte* n'a pas à connaître l'URL de
  celui qui *enregistre*.
- ⚠️ **Le catalogue ne vérifie jamais lui-même.** Il n'a ni le paquet, ni le droit de le télécharger,
  ni la logique de chargement. Il **enregistre un verdict rendu ailleurs** — c'est la ligne de
  partage posée par l'architecture, et la déplacer ferait du catalogue un second `bilan-service`.

### 3. Ce que `bilan-service` doit émettre

⛔ **Hors de ce dépôt — à ouvrir en story `bilan-service`, et à tracer ici.** Cette story livre
**le réceptacle** ; sans l'émetteur, `verification` restera `null`, c'est-à-dire exactement
l'état d'aujourd'hui avec un champ en plus.

> ⚡ **C'est le risque nº 1 de cette story, et il a un précédent nommé dans ce dépôt** :
> `GAP-balance-validation-etat` — trois stories qui se déléguaient l'une à l'autre, chacune
> cohérente seule, l'ensemble refermé sur lui-même sans que personne le voie. **La délégation
> ci-dessus doit être vérifiée dans `bilan-service` au moment où on l'écrit**, pas supposée.

### 4. Point de rencontre avec STORY-149

STORY-149 *(S20)* fait calculer le sha256 **côté serveur au dépôt**. C'est **une garantie d'origine**
— le paquet déposé est bien celui qu'on décrit. Ce n'est **pas** la même chose qu'une garantie de
**permanence** : un artefact peut être remplacé au registre après son enregistrement.

⇒ Les deux sont complémentaires : 149 verrouille l'entrée, 189 surveille la durée. ⚠️ **Ne pas les
confondre** — livrer 149 et croire l'intégrité réglée serait l'erreur exacte que cette story existe
pour éviter.

### Hors périmètre

- **Vérifier depuis le catalogue** *(télécharger l'artefact et recalculer)* — cf. §2, ligne de partage.
- **Une politique de re-vérification périodique.** Quand re-vérifier est une décision d'exploitation,
  pas de contrat. Le champ la rend **possible** ; il ne l'impose pas.
- **Bloquer l'octroi côté serveur** sur un paquet `compromised`. Tentant, et prématuré : tant que
  `bilan-service` n'émet pas, le verdict serait `null` partout et la garde inerte. ⚡ **À rouvrir une
  fois l'émetteur livré** — c'est là qu'elle devient une vraie garantie, et non plus une politique
  d'écran de plus.

---

## Critères d'acceptation

1. `ReferentielVersionResponseDto` porte `verification`, **nullable**, avec `ok`, `at`, `by` et
   `got?`.
2. `POST …/verification` enregistre un verdict et le rend visible à la lecture suivante.
3. Un second rapport **écrase** le premier ; aucun journal n'est constitué.
4. `got` est refusé *(400)* quand `ok` est `true` — un hash lu sur un paquet sain n'a pas de sens.
5. **404** sur un couple `code/version` inconnu ; **401/403** pour un appelant non autorisé.
6. Les référentiels existants restent à `verification: null` — **aucune migration ne fabrique un
   verdict** ⚠️ inventer « vérifié » sur une base d'anciens paquets ferait exactement la fausse
   garantie que cette story combat.
7. ⚡ Vérification côté console : `integrityOf()` renvoie les **trois** états selon la donnée servie —
   c'est la seule preuve que l'AC 3 d'AP-04 est enfin démontrable.
8. Non-régression : `checksum` et `artifactUri` conservent leur sémantique ; aucun champ renommé.

---

## Definition of Done

- [ ] Les 8 critères vérifiés · `lint` 0 · couverture ≥ 90 %
- [ ] **Vérification docker** : rapporter `ok: false` sur un référentiel, puis constater qu'il
      **sort du sélecteur d'octroi** de la console *(AP-05, `isReferentielUsable`)*
- [ ] ⚡ **La délégation à `bilan-service` est VÉRIFIÉE dans son code et ouverte en story** — pas
      seulement mentionnée ici. Sans ça, cette story livre un champ que personne ne remplit, et le
      motif `GAP-balance-validation-etat` se reproduit une quatrième fois
- [ ] ⚡ **AP-04 AC 3 devient démontrable** et le front retire sa note « `verified` : le catalogue ne
      stocke pas le verdict — toujours `null` » — c'est le signal que la dette est soldée
- [ ] Branche `MNV-189`, PR rebase-mergée sur `dev`

---

## Lié

- **STORY-149** *(S20)* — garantie d'**origine** ; celle-ci est la garantie de **permanence**. Cf. §4.
- **STORY-187** *(provisioning groupé)* — c'est ce verdict qui rend une ligne `skipped` **justifiable**
  plutôt qu'arbitraire, et qui fait tenir le scénario « pack Finance inactivable » de la maquette AP-06.
- **STORY-148** *(familles de référentiels, `draft`)* — même écran, autre manque : 148 dit *quel*
  référentiel un module accepte, 189 dit *si* ce référentiel est chargeable.
