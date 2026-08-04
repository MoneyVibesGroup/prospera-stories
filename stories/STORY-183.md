# STORY-183 : Un dossier KYC n'a **ni historique de décisions ni timeline** — une resoumission se relit intégralement

**Epic :** EPIC-003 — KYC (`kyc-service`)
**Réf. :** ticket §E · **AP-03** *(historique)* · **AP-02** *(timeline de la fiche)* · **STORY-128** *(verdict par pièce, déjà daté)*
**Découverte par :** AP-INT-1 — écart nº4 d'AP-INT-0
**Priorité :** Should Have
**Story Points :** 3
**Statut :** À faire
**Créée le :** 2026-08-04
**Sprint :** 20
**Service :** `kyc-service` (`:3002`)

---

## Le constat

`GET /admin/kyc/:orgId` ne porte **aucune décision passée**. Côté console, deux écrans en vivent :

- `KycFile.history` vaut **toujours** `[]` — l'écran d'historique existe et n'affiche jamais rien ;
- la carte « Revue KYC » de la fiche détail affiche une **timeline vide en permanence**
  *(`orgs-client.ts` : `events: []`, avec le commentaire « aucune timeline amont, vide, jamais
  inventée »)*.

**Conséquence :** à la resoumission, l'agent **ne voit pas ce qui avait été reproché**. Il relit donc
le dossier entier au lieu de vérifier une correction — c'est-à-dire exactement le travail que la
resoumission était censée éviter. Le cabinet attend d'autant plus longtemps, et pour un motif que
personne ne peut plus citer.

> ⚡ **Le motif est le seul élément qui rend une resoumission lisible.** Sans lui, « soumission 2 »
> n'est pas une information : c'est un compteur. Un agent qui lit « tentative 2/2 » sans savoir ce
> qui a échoué à la tentative 1 est dans une situation *pire* que s'il n'en savait rien — il sait
> qu'il lui manque quelque chose.

## Ce qui existe déjà et qu'il suffit d'exposer

`STORY-128` a livré le **statut et la date de revue par pièce** (`reviewStatus`, `reviewedAt`), et
les rejets portent déjà un motif. La matière d'un historique est donc **en partie là** ; ce qui
manque, c'est de la **conserver au fil des soumissions** et de la servir.

⚠️ À vérifier au lancement : les pièces `SUPERSEDED` conservent-elles leur verdict et leur motif
après resoumission, ou sont-elles écrasées ? La réponse change le périmètre — reconstituer un
historique perdu n'est pas l'exposer.

---

## Périmètre

- Les **décisions passées du dossier** servies sur le détail admin : date, auteur, verdict, **motif**.
- Les événements de la chaîne KYC exposés pour la **timeline** de la fiche détail : soumission,
  passage en revue, décision.
- ⚠️ **Ne rien inventer rétroactivement.** Les dossiers déjà tranchés n'ont peut-être pas de quoi
  reconstituer leur historique : un historique vide sur un dossier ancien est **honnête**, un
  historique reconstruit à partir de `updatedAt` ne l'est pas.

### Hors périmètre

Le journal d'audit complet du service *(qui a consulté quelle pièce, quand)*. C'est une exigence de
conformité distincte, avec sa propre rétention.

---

## Critères d'acceptation

1. `GET /admin/kyc/:orgId` porte les décisions passées, de la plus ancienne à la plus récente.
2. Chaque entrée porte **date, auteur, verdict et motif** — un rejet sans motif est le cas qui rend
   l'historique inutile.
3. Un dossier jamais tranché renvoie une liste **vide**, pas une entrée fabriquée.
4. Une resoumission **conserve** l'historique de la soumission précédente.
5. Les dossiers antérieurs à cette story ne portent pas d'historique reconstitué.
6. ⚡ **Preuve navigateur depuis `:3110`** : sur un dossier resoumis, l'écran de revue affiche le
   motif du refus précédent, et la fiche détail affiche une timeline non vide.

---

## Definition of Done

- [ ] Les 6 critères vérifiés · `lint` 0 · couverture ≥ 90 %
- [ ] Question du sort des pièces `SUPERSEDED` **tranchée et écrite** dans la story
- [ ] ⚠️ À tirer **avec `STORY-184`** *(référence et n° de tentative)* : livrer « tentative 2 » sans
      dire ce qui s'est passé à la tentative 1 pose la question sans y répondre
- [ ] Le jeu de données semé par `STORY-180` est **étendu** à un dossier resoumis — sinon ce
      comportement redevient invérifiable
- [ ] Branche `MNV-183`, PR rebase-mergée sur `dev`
