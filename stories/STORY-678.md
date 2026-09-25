# STORY-678 : Un Bilan imprimé déséquilibré se valide — aucun contrôle ne regarde la cascade des sous-totaux

Status: ready-for-dev

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

- [ ] AC-1 — Une cascade incohérente (`coherenceSousTotaux.coherent === false`) lève une anomalie
      **nommée** (nouveau contrôle, ou `EQUILIBRE_BILAN` enrichi — à trancher), qui cite les grands
      totaux et l'écart.
- [ ] AC-2 — Sa **catégorie dépend du statut de maturité du paquet** (`meta.statut`, STORY-491) :
      bloquante pour un paquet réglementaire, informative pour une AMORCE — déclaré, jamais un code
      de référentiel dans le moteur (P7).
- [ ] AC-3 — Sur la balance de la vérification docker de 676 : `@2.1` lève l'anomalie, `@2.2` non.
- [ ] AC-4 — ⚠️ **Effet sur les liasses `@2.1` en cours** : mesurer combien de liasses non figées
      deviendraient invalidables, et le dire au PO **avant** le merge (l'issue normale est leur
      passage en `@2.2`, STORY-677).
- [ ] AC-5 — Mutation : neutraliser la lecture de `coherent` fait rougir AC-1/AC-3.

## Notes

- Voir [[STORY-676]], [[STORY-677]], [[STORY-531]], [[STORY-491]], [[STORY-112]].

## Progress Tracking

**Statut : `ready-for-dev` (2026-09-25).** Créée par la clôture de STORY-676.
