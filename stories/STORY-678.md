# STORY-678 : Un Bilan imprimé déséquilibré se valide — aucun contrôle ne regarde la cascade des sous-totaux

Status: done

**Épic :** EPIC-010 — Référentiels & table de passage
**Service :** `bilan-service` — contrôles de cohérence de la liasse
**Points :** 3 · **Sprint :** S20 · **Complexité :** medium · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** vérification docker de STORY-676 (2026-09-25).

---

## Le fait, mesuré

Sur une liasse `syscohada-revise@2.1` (le paquet servi aujourd'hui à toutes les organisations), par
les API réelles : le Bilan **publié** porte `BZ` = 26 900 000 face à `DZ` = 75 900 000 — l'actif
immobilisé `AZ` n'y additionne que `AP` (défaut corrigé en `@2.2` par STORY-676, `@2.1` restant figé).
Le contrôle **bloquant** `EQUILIBRE_BILAN` répond **`OK`, écart 0**, et la liasse **se valide**.

## Pourquoi

`controleEquilibre` (`controles-coherence-production.service.ts`) tranche sur l'identité **directe**
de 059 (`equilibreN` : Σ comptes d'actif = Σ comptes de passif + résultat), qui est juste. La cascade
des sous-totaux — ce que l'imprimé et l'export montrent — est tracée dans
`bilan.coherenceSousTotaux.coherent`, mais **délibérément** exclue du verdict : « une cascade
incomplète relève de la complétude du référentiel (AMORCE) ». **Aucun autre contrôle ne la lit.**

⇒ Le contrôle vérifie ce qui n'est pas imprimé, et laisse passer ce qui l'est. C'est la famille de
STORY-531 : un contrôle qui ne peut pas échouer sur le défaut qu'on croit qu'il garde.

## Critères d'acceptation

- [x] AC-1 — Une cascade incohérente (`coherenceSousTotaux.coherent === false`) lève une anomalie
      **nommée** (nouveau contrôle, ou `EQUILIBRE_BILAN` enrichi — à trancher), qui cite les grands
      totaux et l'écart.
- [x] AC-2 — Sa **catégorie dépend du statut de maturité du paquet** (`meta.statut`, STORY-491) :
      bloquante pour un paquet réglementaire, informative pour une AMORCE — déclaré, jamais un code
      de référentiel dans le moteur (P7).
- [x] AC-3 — Sur la balance de la vérification docker de 676 : `@2.1` lève l'anomalie, `@2.2` non.
- [x] AC-4 — ⚠️ **Effet sur les liasses `@2.1` en cours** : mesurer combien de liasses non figées
      deviendraient invalidables, et le dire au PO **avant** le merge (l'issue normale est leur
      passage en `@2.2`, STORY-677).
- [x] AC-5 — Mutation : neutraliser la lecture de `coherent` fait rougir AC-1/AC-3.

## Notes

- Voir [[STORY-676]], [[STORY-677]], [[STORY-531]], [[STORY-491]], [[STORY-112]].

## Progress Tracking

**Statut : `done` (2026-09-30).** `prospera-bilan-service#154` rebase-mergée sur `dev` (branche supprimée).

**Livré** — contrôle `CASCADE_SOUS_TOTAUX` (`controles-coherence-production.service.ts`) : lit
`bilan.coherenceSousTotaux` (aucune seconde agrégation), cite `BZ`/`totalActifN`/`DZ`/`totalPassifResultatN`
et l'écart (actif s'il en a un, sinon passif). Catégorie **déclarée par le paquet** : `amorce` ⇒
`INFORMATIF`, tout autre statut, **absent compris** ⇒ `BLOQUANT` (fail-closed). `NON_APPLICABLE` sans
grands totaux (`sfd-bceao@1.0`). AC-1 tranché : **nouveau contrôle** plutôt qu'`EQUILIBRE_BILAN` enrichi
(sa catégorie varie par paquet, celle d'`EQUILIBRE_BILAN` non). `bilan-engine@1.23.0`.

**Mesure préalable (artefacts réels, balance couvrant tout le plan)** : cascade incohérente sur
`syscohada-revise@2.1` **et `zone-franche-togo@1.0`** ; cohérente sur `@2.2`, `smt-togo@1.0`,
`sfd-bceao@2.0` ; les `cima-*` sont `amorce`. `zone-franche-togo` n'est pas dans les
`referentielFamilies` du module `bilan` : défaut latent, non exposé.

**Portes** — lint 0 · build · 10 774 unitaires / 2 522 e2e · couverture 99,39 / 96,97 / 99,58 / 99,5.
Les e2e servent désormais `@2.2` par défaut (`@2.1` gardé pour les cas de SA note 3 ; le cas registre
qui fige passe en note `3A`).

**Mutations (AC-5)** — toutes rouges par assertion : lecture de `coherent` neutralisée (5 échecs) ;
`amorce` ignoré (1) ; statut absent ⇒ informatif (6) ; catégorie toujours `INFORMATIF` (6).

**Vérif docker** (stack neuve, `tmp/verif-docker-678-679/`, 56 OK / 0 KO, balance de la vérif 676) :
A (`@2.2`) — `CASCADE_SOUS_TOTAUX` OK, `valider` 200, +1 `snapshots_liasse`, snapshot en base à 9
contrôles, moteur `1.23.0`. B (`@2.1`) — `EQUILIBRE_BILAN` OK, `CASCADE_SOUS_TOTAUX` ANOMALIE
BLOQUANT écart −49 000 000, éléments `BZ` 26 900 000 / `DZ` 75 900 000 ; `valider` → 422
`LIASSE_NON_VALIDABLE` nommant **la seule** cascade ; compteurs `bilan_service` et document du jeu
inchangés, aucun snapshot.

**AC-4** — base de dev : un seul jeu `BROUILLON` `@2.1` (celui de la vérif). Prod non accessible d'ici :
`db.jeux_etats.countDocuments({statut: 'BROUILLON', 'referentiel.version': '2.1'})` sur `bilan_service`.
**PO consulté le 2026-09-30 avant le merge : « merger, bloquant ».** Issue des liasses concernées :
passage de l'organisation en `@2.2` (STORY-677). Les liasses figées ne bougent pas (servies depuis
leur snapshot).

**Revue de code** — 2 constats non bloquants, corrigés dans un commit dédié : texte Swagger
`HYPOTHESE_BALANCE` (6 routes dry-run) qui affirmait une liasse « validable » ; en-têtes d'e2e qui
annonçaient `@2.1`. **Revue de sécurité** — 0 constat (`meta.statut` vient de l'artefact vérifié par
checksum ; aucune surcharge n'atteint `role` ni `meta`).

⚠️ **Hors périmètre, à suivre** : la console front qui énumère les codes de contrôle doit connaître
`CASCADE_SOUS_TOTAUX` (le contrat le publie dans l'enum `CodeControle`).

— Historique — **Statut : `in_progress` (2026-09-30).** Branches `MNV-678` (bilan-service + docs), lancée avec STORY-679.

— Historique — `ready-for-dev` (2026-09-25) : créée par la clôture de STORY-676.
