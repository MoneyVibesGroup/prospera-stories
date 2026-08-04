# STORY-184 : Un dossier KYC n'a **ni référence communicable ni numéro de soumission**

**Epic :** EPIC-003 — KYC (`kyc-service`)
**Réf. :** ticket §F · **AP-03** · **STORY-183** *(historique — préalable de sens)*
**Découverte par :** AP-INT-1 — écarts nº2 et nº3 d'AP-INT-0
**Priorité :** Could Have — ⚠️ **ne se livre pas seule** *(cf. §Dépendance)*
**Story Points :** 2
**Statut :** À faire
**Créée le :** 2026-08-04
**Sprint :** 20
**Service :** `kyc-service` (`:3002`)

---

## Le constat

Le dossier ne porte **ni référence** ni **compteur de soumission**. La console rend donc :

- `ref: dto.orgId` — l'écran affiche `507f1f77bcf86cd799439011 · 507f1f77bcf86cd799439011`,
  redondant mais **vrai** *(une référence inventée aurait été pire, et le front l'a écrit tel quel)* ;
- `attempt: 1, total: 1` **codés en dur** — la mention « soumission n sur N » est donc neutralisée à
  l'affichage, ce qui la fait disparaître au lieu de mentir.

**Conséquence :** il n'y a **rien à communiquer au cabinet**. « Votre dossier **KYC-2088** » est une
phrase de support ; « votre dossier **507f1f77bcf86cd799439011** » n'en est pas une — un identifiant
technique opaque n'est pas dictable au téléphone, pas recopiable sans faute, et il **désigne
l'organisation, pas le dossier**, donc il ne distingue même pas deux soumissions successives.

> ⚡ Le filigrane de la visionneuse porte `file.ref` : chaque page consultée est donc estampillée
> avec un identifiant d'organisation à la place d'une référence de dossier. La trace existe, elle
> désigne juste le mauvais objet.

---

## Dépendance — pourquoi elle ne se livre pas seule

Un **numéro de soumission** n'a de sens qu'avec un **historique** *(`STORY-183`)*. Livrer
« soumission 2 sur 2 » sans pouvoir dire ce qui s'est passé à la soumission 1, c'est **poser la
question sans y répondre** : l'agent apprend qu'il lui manque une information, et rien de plus.

⇒ **À tirer avec `STORY-183`, ou pas du tout.**

---

## Périmètre

- Une **référence de dossier** stable, communicable et **distincte de l'`orgId`** : lisible à voix
  haute, recopiable sans ambiguïté. ⚠️ Le format est à trancher au lancement — le front affiche
  aujourd'hui ce que le service donne, il n'impose rien.
- Un **compteur de soumissions** : le rang de la soumission courante et leur nombre total.
- ⚠️ La référence doit être **stable dans le temps** : c'est ce qui est écrit dans un e-mail au
  cabinet et dans le filigrane d'une pièce consultée. Une référence recalculée cesserait de désigner
  ce qu'elle a désigné.

### Hors périmètre

Toute recherche **par référence** *(« ouvrir le dossier KYC-2088 »)*. C'est un service utile et une
autre story — celle-ci fait exister la référence, pas encore l'index.

---

## Critères d'acceptation

1. `GET /admin/kyc/:orgId` porte une référence de dossier **distincte de l'`orgId`**.
2. La référence est **stable** : deux lectures à des mois d'écart renvoient la même.
3. Le rang et le total de soumission sont servis et cohérents avec l'historique de `STORY-183`.
4. Les dossiers **existants** reçoivent une référence — ⚠️ à trancher : rétroactive ou à la prochaine
   soumission. Un dossier sans référence dans une console qui en affiche une est un cas à décider,
   pas à découvrir.
5. ⚡ **Preuve navigateur depuis `:3110`** : l'en-tête de la revue affiche la référence **et** la
   mention « soumission n sur N » — cette dernière n'apparaît que si `N > 1`, ce qui exige un dossier
   resoumis dans le jeu de données.

---

## Definition of Done

- [ ] Les 5 critères vérifiés · `lint` 0 · couverture ≥ 90 %
- [ ] Format de référence **tranché et écrit**, avec la règle de stabilité
- [ ] ⚡ Tirée **avec `STORY-183`** — livrée seule, elle affiche un compteur sans le récit
- [ ] Côté console : `ref` cesse de recevoir l'`orgId`, `attempt`/`total` cessent d'être codés en dur
- [ ] Branche `MNV-184`, PR rebase-mergée sur `dev`
