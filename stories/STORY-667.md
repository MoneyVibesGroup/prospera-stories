# STORY-667 : Le QR imprimé d'un point de vente — le paiement spontané trouve sa créance

Status: in-progress

**Épic :** EPIC-036 — Fournisseurs de paiement interchangeables et simultanés
**Service :** `paiement-service`
**Points :** 3 · **Sprint :** ⚠️ **NON SLOTTÉE** — `PLAN-PI-SPI-CAS-D-USAGE-2026-09-15`, phase B
**Prérequis :** **STORY-664** (le QR qu'on présente, et la mesure « la référence traverse »),
**STORY-666** (le raccordement par organisation), **STORY-271** (les encaissements en attente
d'affectation)
**Origine :** le parcours « QR Code imprimé réutilisable » du catalogue PI-SPI. Un distributeur colle
une affiche à son comptoir ; le client scanne, saisit le montant, paie. **Aucune demande n'existe** :
c'est le seul parcours du plan où l'argent arrive avant que le service sache pourquoi.

---

## Le fait

Le service sait déjà ranger un paiement sans demande : il devient un **encaissement en attente
d'affectation** ([[STORY-271]], FR-P39) — ni rejeté, ni rattaché d'office. Et il sait déjà former un
QR du schéma ([[STORY-655]]) et le présenter ([[STORY-664]]). Il manquerait donc « juste » un QR
**statique** : canal `000`, pas de montant, une référence qui dit d'où vient l'argent.

⛔⛔ **CE « JUSTE » AVALERAIT LE DEUXIÈME CLIENT DE LA JOURNÉE, EN SILENCE.** STORY-664 a mesuré que
le schéma **reprend le champ de référence du QR comme `txId`** du `PAIEMENT_RECU`, et STORY-665 que
l'événement ne porte **aucun `end2endId`**. La clef d'unicité d'un événement se dérive donc de
`PAIEMENT_RECU:<txId>`. Sur un QR dynamique, c'est une chance : la référence est la demande, le
rapprochement est automatique. Sur un QR **réutilisable**, c'est un piège : **tous** les paiements
d'une affiche reviennent avec le **même** `txId`, donc la **même** clef — le premier est rangé, et
chacun des suivants est écarté comme un **rejeu**, avec un `204`, sans une ligne d'erreur. Les deux
barrières d'idempotence de STORY-257 feraient exactement leur travail, contre nous.

⚡ **Ce qui distingue deux paiements d'une même affiche, c'est l'instant.** L'événement d'un paiement
par QR porte `evDate` (mesuré en STORY-664, là où une demande poussée n'en porte pas). Une
re-livraison du même événement porte le même instant ; deux clients, deux instants. La clef d'un
paiement spontané de point de vente se dérive donc de la référence **et** de l'instant — et
**seulement** là : une demande garde sa clef, celle que la consultation de [[STORY-670]] sait
recomposer.

⚠️ **« Trouve sa créance » ne veut pas dire « se rattache tout seul ».** FR-P39 l'interdit, et il a
raison : un montant égal n'est pas une preuve. Ce que le point de vente apporte est la
**provenance** : l'encaissement en attente dit **à quel comptoir** l'argent est arrivé, la liste se
filtre par point de vente, et la personne qui affecte sait où chercher la créance. Le geste
d'affectation, son motif obligatoire et son auteur restent ceux de STORY-271.

## Critères d'acceptation

- [ ] AC-1 — Une organisation déclare un **point de vente** : un libellé et le compte d'encaissement
      qui reçoit. Droit `paiement:compte:administrer` (il gouverne « où l'argent d'une organisation
      arrive », FR-P59 — une affiche **publie** cette destination), gate d'AD-16, trace au journal
      chaîné. Le compte doit être à elle, ouvert chez un fournisseur qui **sait** former un QR
      réutilisable, et **vérifié**.
- [ ] AC-2 — `GET /v1/points-de-vente/:id/qr-interoperable` rend la charge utile et son dessin :
      canal **statique**, **aucun montant** (le payeur le saisit), et pour référence **l'identifiant
      du point de vente**. Méthode **facultative** du port : son absence ferme le canal, elle ne
      l'ajourne pas. Le participant du raccordement et celui du compte doivent concorder
      ([[STORY-666]], AC-6) ; une organisation sans raccordement n'imprime rien.
- [ ] AC-3 — ⛔⛔ **DEUX PAIEMENTS SUR LA MÊME AFFICHE SONT DEUX ENCAISSEMENTS.** Quand la référence
      d'un `PAIEMENT_RECU` désigne un point de vente, la clef d'unicité porte **aussi l'instant** de
      l'événement : le second client n'est pas un rejeu. La **re-livraison** du même événement, elle,
      reste écartée (même instant, même clef). ⚠️ La clef d'une **demande** ne change pas.
- [ ] AC-4 — ⛔ **Sans instant, on ne devine pas.** Un événement de point de vente qui ne porte aucune
      date ne peut pas être distingué du précédent : le premier est rangé comme aujourd'hui, et la
      collision est **journalisée en erreur** avec sa cause — « rejeu ou second paiement,
      indiscernable » — jamais avalée en `debug`.
- [ ] AC-5 — L'encaissement en attente **porte son point de vente** : la liste de STORY-271 le rend
      et se **filtre** par lui. **Aucun rattachement d'office** (FR-P39) : l'affectation reste le
      geste de STORY-271, motif et auteur compris.
- [ ] AC-6 — La référence d'une **autre** organisation ne désigne rien : le point de vente se cherche
      **dans l'organisation du compte qui a reçu la notification** (AD-16), et un paiement dont la
      référence ne désigne ni demande ni point de vente reste l'orphelin simple qu'il était.
- [ ] AC-7 — **MESURE réelle** sur le bac à sable : un QR statique scanné et payé **deux fois**. Ce
      que porte `txId`, si `evDate` est présent, et si les deux paiements produisent deux
      encaissements en attente sous le même point de vente. La story ne suppose pas, elle mesure.

## Ce que cette story ne fait pas

- Elle **ne rattache rien d'office** et ne propose aucune créance : FR-P39.
- Elle **ne ferme pas** un point de vente. Une affiche imprimée ne se rappelle pas : l'adresse
  qu'elle porte reste payable, et l'argent qui y arrive doit continuer de dire d'où il vient. Fermer
  ne pourrait être que cosmétique — ce sera un écran ([[STORY-286]]), pas une règle.
- Elle **ne touche pas** à la clef d'un paiement de **demande**. Un QR dynamique scanné **deux
  fois** a le même défaut de naissance (même `txId`) ; le remède appartient à l'unification des
  clefs nommée par [[STORY-665]] (id ≥ 673), et il est porté ici comme point ouvert.
- Elle **n'ouvre aucun écran** et n'imprime aucune affiche : elle rend un SVG.

## Notes

- Voir [[STORY-655]] (la charge utile, les trois canaux), [[STORY-664]] (la mesure : la référence
  du QR revient comme `txId`, avec `evDate`), [[STORY-665]] (aucun `end2endId` sur le webhook),
  [[STORY-666]] (le raccordement), [[STORY-271]] (l'attente d'affectation), [[STORY-257]] (les deux
  barrières d'idempotence).
