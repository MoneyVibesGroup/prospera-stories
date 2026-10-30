# STORY-647 : L'arrêté de consommation devient une créance

Status: review

**Bloc :** Convergence E3 — le pont entre les deux rails (`CONVERGENCE-RAILS-C-D-2026-09-08.md`)
**Services :** `prospera-notification-service` → `prospera-paiement-service`
**Points :** 5 · **Prérequis :** STORY-639 (arrêté), STORY-706 (clôture automatique), STORY-251 (matérialisation), STORY-277 (créance au bénéfice de Money Vibes), STORY-644
**Branches :** `MNV-647` sur les deux dépôts, depuis `origin/dev`

---

## Le récit

En tant que **Money Vibes**, je veux facturer à une organisation les messages qu'elle a consommés,
afin que le canal qui coûte de l'argent en rapporte.

## Ce qui débloquait la story

La clôture est automatique depuis STORY-706 : chaque mois terminé produit un arrêté sans geste
humain. Il ne manquait que le pont : l'arrêté n'était annoncé nulle part, et le paiement ne savait
rien en faire.

⚡⚡ **La facturation apparaît sans casser la garde qui l'interdit.** `aucune-facturation.spec.ts`
balaie tout `notification-service` et reste **verte** : la notification **publie un arrêté**, le
paiement **matérialise une créance**. Rien côté notification ne sait qu'une créance existe.

## Critères d'acceptation — verdicts

- **AC-1 ✅** — `ClotureService.clore` pose l'arrêté **et** enfile
  `notification.consommation.arretee` **dans la même transaction** (`poserEtAnnoncer`). Clé de
  partition = organisation ; charge = `periode`, `closePar`, les **totaux par canal × devise** avec
  leur `revisionBareme`. Schéma publié : `contracts/notification/notification.consommation.arretee.schema.json`.
  Sixième publieur de l'inventaire (`inventaire-publication.spec.ts`), avec sa justification.
  - L'`eventId` est **dérivé** (`<org>:<période>:consommation-arretee`) : un arrêté n'a qu'une vie,
    son annonce n'a qu'un identifiant.
  - Un **rejeu** de clôture (index dupliqué) rend l'arrêté d'origine et **ne republie rien**.
  - Une annonce qui échoue **emporte l'arrêté** : la période reste ouverte, la clôture suivante la
    reprend. Le double de transaction du spec annule ce qu'il a écrit, comme Mongo.
- **AC-2 ✅** — `paiement-service` consomme le topic (`ConsommationArreteeConsumer`, groupe
  `paiement-consommation`) et passe par **`MaterialiserLaCreance`**, l'upsert de STORY-251, sans une
  ligne nouvelle sur la créance. Référence = `ARRETE-<org>-<AAAA-MM>-<DEVISE>` : l'organisation et
  la période **sont** l'identifiant de l'arrêté (son index unique côté notification). Un rejeu
  retombe sur la même clef et rend la créance existante, qui ne republie rien.
- **AC-3 ✅** — L'`orgId` de la créance est celui de **Money Vibes** (`PorteDeLaPlateforme`) ;
  l'organisation consommatrice est le **payeur** (nom projeté par le read-model d'identité).
- **AC-4 ✅** — Une créance **par devise**, aucune conversion. Une ligne dont la révision vaut
  `aucun-bareme-contracte` ne se facture pas. Une devise inconnue du référentiel est **refusée et
  nommée** (`refusees`), jamais convertie, et n'empêche pas les autres devises.
- **AC-5 ✅** — `aucun-appel-au-paiement.spec.ts` (notification) : aucun import d'un paquet du
  paiement, aucune adresse `paiement-service:<port>`, aucune variable `PAIEMENT_*_URL|JETON`, aucune
  route `/api/v1/creances|encaissements|…`. Les deux mentions légitimes (le paiement **appelle** la
  notification, un modèle s'appelle `lien-de-paiement`) ne la font pas rougir ; contre-preuve incluse.
- **AC-6 ✅** — Une devise dont le total facturable est nul ne produit aucune créance ; un arrêté
  sans rien à facturer est compté `RIEN_A_FACTURER`.

## Décisions prises en cours de route

1. **Le montant = le coût figé dans l'arrêté**, devise par devise (arbitrage PO du 2026-10-30, « comme
   la fiche »). ⚠️ **Point de politique de prix à revoir** : ce coût est calculé au barème de la
   passerelle **de l'organisation** (`tarifDe` ne lit que ses réglages). Un distributeur qui envoie
   par sa propre passerelle la paie déjà ; la créance lui refacture ce même coût. Le jour où Money
   Vibes aura un barème de revente, c'est `dusDeLArrete` qui change, et lui seul.
2. **La plateforme ne se facture pas elle-même** : un arrêté de Money Vibes ne produit rien.
3. **Un déploiement sans organisation plateforme ne facture rien** (`PLATEFORME_NON_DECLAREE`) —
   aucun repli inventé, même règle qu'à la veille des échéances.
4. **Une organisation non projetée est facturée sans payeur nommé**, plutôt que pas du tout : aucun
   humain n'attend la réponse, refuser reviendrait à perdre une dette ou à rejouer sans fin. La
   référence porte l'identifiant de l'organisation.
5. **Échéance = clôture + 30 jours** (`DELAI_DE_REGLEMENT_JOURS`), convention écrite comme telle.
   Elle n'a d'effet que sur l'affichage : aucun travail ne suspend quoi que ce soit sur elle.
6. **Un arrêté illisible est ignoré, jamais rejoué**, et **une seule ligne abîmée rend tout l'arrêté
   illisible** : facturer les lignes lisibles produirait une créance plus petite que la dette, et la
   clef refuserait ensuite la bonne. Une panne de base remonte, et le message est relu.
7. **Le pont n'émet ni demande ni lien** : la créance existe ; le geste suivant appartient à la
   console, comme pour toute créance.

## Gardes qui ont rougi, et pourquoi elles avaient raison

- `organisation-plateforme.invariant.spec.ts` (STORY-601) a rougi sur le motif
  `SANS_ORGANISATION_PLATEFORME` : il contient le nom de la variable que la garde traque. Renommé
  `PLATEFORME_NON_DECLAREE` plutôt que d'élargir l'inventaire.
- `consommateurs-supervises.invariant.spec.ts` recense désormais **4** consommateurs.

## Preuves

| Contrôle | Résultat |
|---|---|
| `notification-service` — `npx jest` | 264 suites / **3 583 tests** |
| `notification-service` — `npm run test:e2e -- --runInBand` | 18 suites / **264 tests** |
| `paiement-service` — `npx jest` | 316 suites / **4 264 tests** — 2 rouges au premier passage, voir ci-dessous |
| `paiement-service` — `npm run test:e2e -- --runInBand` | 27 suites / **335 tests** |
| lint (deux dépôts) | 0 |

Les deux rouges du premier passage complet du paiement : la garde de vocabulaire de STORY-245
(« règlement » est proscrit, la spine dit « encaissement ») — `echeanceDeReglement` renommé
`echeanceDePaiement` ; et `supervision-consommateur.util.spec.ts` (AC-3, relance après 1 s), qui
dépend du temps et tournait pendant que la suite de la notification chargeait la machine. Relancées
seules, les deux passent (88/88).

## Ce qui reste ouvert

- La recette **inter-services** (un arrêté réel qui fait naître une créance réelle dans la pile)
  appartient à **STORY-649** ; les tests de conformité contre un vrai Mongo exigent la pile Docker,
  réservée à l'Integration Gate.
- La politique de prix (point 1 ci-dessus).
