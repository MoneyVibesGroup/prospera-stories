# STORY-724 : Renvoyer le lien de paiement

Status: done

**Épic :** EPIC-037 — demandes et liens de paiement (`paiement-service`)
**Service :** `prospera-paiement-service`
**Points :** 3 · **Prérequis :** STORY-608 (file de sortie), STORY-644 (route directe câblée)
**Origine :** point ouvert PO du 2026-09-06 (« le lien ne peut pas être renvoyé — seule l'émission le
rend ») · demande PO du 2026-10-30.
**Branche :** `MNV-724` depuis `origin/dev`

---

## Le récit

En tant que **gestionnaire d'une organisation**, je veux renvoyer le lien d'une demande à son payeur
quand il dit ne pas l'avoir reçu ou l'avoir perdu, afin de ne pas avoir à émettre une seconde demande
pour la même dette.

## Le fait

⛔ **Aujourd'hui, le lien part une fois.** L'émission enfile une ligne dans `envois_sortants`
(`_id` = la demande) ; le relais la remet, la passe `REMIS`, et plus rien ne la réarme. Un payeur qui
a supprimé le SMS n'a qu'un recours : que l'organisation **ré-émette** — un second jeton valide sur la
même dette, deux pages ouvertes dont une que personne ne suit.

⛔⛔ **Et un renvoi naïf serait avalé en silence.** La notification rend le MÊME envoi pour la même
clef d'idempotence (son AD-3). Réarmer la ligne sans changer la clef aurait produit un `200`, l'accusé
de l'envoi d'il y a trois jours, une ligne marquée `REMIS` — et aucun message.

## Critères d'acceptation

- **AC-1** — `POST /api/v1/demandes/:id/renvoi` (droit `paiement:demande:emettre`, gate de classe) réarme
  la remise du **même lien** au **même payeur** : ni nouveau jeton, ni nouvelle demande, ni nouvelle
  validité. Réponse `202` : `{ demandeId, renvoi, dejaEnFile }`.
- **AC-2** — la clef d'idempotence envoyée à la notification porte le **rang** de la remise :
  `lien-de-paiement-<id>` pour l'origine (inchangée), `lien-de-paiement-<id>-r<n>` pour le n-ième
  renvoi.
- **AC-3** — refus nommés, dans l'ordre des remèdes : `LIEN_NON_RENVOYABLE` (demande soldée, expirée,
  révoquée, échouée — ou date limite passée), `PAYEUR_INJOIGNABLE` (ni courriel ni téléphone),
  `RENVOIS_EPUISES` (trois renvois au plus).
- **AC-4** — un double clic ne fait pas partir deux messages : une remise déjà en attente rend
  `dejaEnFile: true` sans rien écrire ; le réarmement est conditionné dans le filtre (`statut ≠
  EN_ATTENTE`), jamais par une lecture préalable.
- **AC-5** — le geste est **tracé** sur la chaîne de la créance (`LIEN_RENVOYE`, auteur = l'utilisateur,
  rang du renvoi) ; la remise elle-même l'est ensuite par le relais (`LIEN_REMIS`). Rien n'est publié
  sur le bus (STORY-607).
- **AC-6** — la demande d'une autre organisation rend `404`, comme une demande qui n'existe pas.

## Ce qui a été construit

- `domain/envoi/renvoi-du-lien.ts` : la borne (`MAX_RENVOIS_DU_LIEN = 3`), les trois refus, la clef
  d'idempotence par rang (`cleIdempotenceDuLien`).
- `envois_sortants` gagne `renvois` (absent ⇒ lu `0` : les lignes d'avant la story sont exactement
  ce qu'elles sont). `FileDeSortie.etatDe` lit la remise (filtrée sur l'organisation) ;
  `FileDeSortie.reArmer` la réarme par un `findOneAndUpdate` **conditionné dans le filtre**
  (`statut ≠ EN_ATTENTE`, `renvois < 3`) : remet `tentatives` à 0, efface le dernier motif,
  incrémente `renvois`. Une demande sans ligne (émise avant STORY-608) reçoit sa **première**
  remise, au rang 0.
- Le relais du lien passe `ligne.renvois` dans le message ; l'adaptateur en tire la clef.
- `RenvoyerLeLien` (cas d'usage) : lit la demande (`404` sinon), contrôle, réarme dans une
  `EcritureDArgent`, trace `LIEN_RENVOYE` (auteur, rang, nom du payeur — jamais son téléphone).
  Une course perdue contre une autre main rend `dejaEnFile` et ne trace rien.
- `POST /api/v1/demandes/:id/renvoi`, droit `paiement:demande:emettre`, `202`. Le lien n'est pas
  rendu dans la réponse.

## Décisions prises en cours de route

1. **Réarmer la ligne existante plutôt qu'en créer une par renvoi** : la file reste unique par
   demande (sa clef primaire est la demande, STORY-608), et le relais n'a rien appris de nouveau.
2. **Le droit est celui d'émettre**, pas celui de révoquer : qui peut adresser une demande au payeur
   peut la lui redire ; révoquer est le geste inverse.
3. **Trois renvois**, une constante : un SMS coûte, et un payeur relancé dix fois cesse de lire. À
   rendre réglable par organisation le jour où le besoin s'exprime.
4. **La validité est relue à l'instant** : une demande `Envoyee` dont la date limite est passée n'est
   pas encore `Expiree` (la veille ne l'a pas vue), mais son lien ne s'ouvrira plus.

## Preuves

| Contrôle | Résultat |
|---|---|
| `paiement-service` — `npx jest` | 315 suites / **4 259 tests** (1 rouge au passage complet, corrigé : voir ci-dessous) |
| `paiement-service` — `npm run test:e2e -- --runInBand` | 27 suites / **339 tests** (dont 4 STORY-724 ; 7 rouges au passage complet, corrigés) |
| lint | 0 |

Ce qui a rougi au passage complet, à raison :
- `piste-opposable.invariant.spec.ts` (STORY-276) tient l'inventaire **fermé** des fichiers qui
  passent par `EcritureDArgent`. `renvoyer-le-lien.usecase.ts` y entre, nommé, avec sa raison : il
  ne déplace pas d'argent mais réarme ce qui porte la demande au payeur, sous trace (24/24).
- `money-vibes-franchit-le-gate.e2e-spec.ts` et `amorcage-money-vibes.e2e-spec.ts` montent
  `DemandesController` avec un double par dépendance : ils reçoivent un double de `RenvoyerLeLien`
  qui **refuse** s'il est sollicité, comme celui du QR (11/11). `file-de-sortie-notification` et
  `demandes` aussi ; le second éprouve la route (202, 409, 404, 403).

## Ce qui reste ouvert

- **Interface** : aucun bouton « Renvoyer » n'existe encore dans le frontend ; la route est prête.
- ✅ **Gate Docker joué le 2026-11-09** : voir la section suivante. Il a trouvé deux défauts.
- ✅ **Fusionnée sur `dev`** le 2026-10-30 (`21ef71f`), après `MNV-648` : le conflit attendu sur
  `notification-http.adapter.ts` a été résolu comme prévu (factorisation de 648, clef du lien de 724).

## ✅ Recette croisée du 2026-11-09 — et les deux défauts qu'elle a trouvés

`prospera-recette/paquets/recette-croisee/recette/renvoi-du-lien.recette.ts` (8 tests), sur la vraie pile,
volumes neufs. Le paiement réarme, son relais appelle la vraie notification, et le courriel arrive dans
Mailhog :
- AC-1, AC-2 : un vrai second courriel, avec le **même** lien, ni nouvelle demande ni nouvelle validité ;
- AC-4 : deux clics simultanés donnent deux `202`, un seul accepté, et aucun message de plus en 30 s ;
- AC-3 : le troisième renvoi passe, le quatrième rend `409 RENVOIS_EPUISES` et rien ne part. Un lien
  révoqué rend `LIEN_NON_RENVOYABLE`, un payeur sans canal `422 PAYEUR_INJOIGNABLE` ;
- AC-5 : `LIEN_RENVOYE` aux rangs 1, 2, 3 (auteur `UTILISATEUR`), `LIEN_REMIS` quatre fois, chaîne
  intacte, aucun jeton dans la preuve ;
- AC-6 : `404` pour la demande d'autrui comme pour une demande inconnue, `403` sans le droit.

**Défaut 1 — ⛔⛔ la remise n'était jamais marquée `REMIS`.** Le relais acquittait la ligne par
`{ _id: demande.id }`, une chaîne. Or `@Prop({ type: Types.ObjectId })` donne un chemin `Mixed` :
mongoose ne convertit pas, et la chaîne ne trouve rien. Mesuré sur la pile : 0 ligne trouvée par la
chaîne, 1 par l'`ObjectId`. Conséquences :
- la ligne restait `EN_ATTENTE`, et le relais la remettait à **chaque tour**. `LIEN_REMIS` s'écrivait
  toutes les 3 s sur la chaîne de la créance. La notification rendait le même envoi par sa clef : un
  seul courriel partait, ce qui masquait le défaut ;
- le renvoi répondait toujours `dejaEnFile: true, renvoi: 0` : **il n'a jamais fonctionné hors des
  unitaires** ;
- 50 lignes figées (la taille du lot) auraient bloqué les liens de toutes les demandes suivantes.

Les unitaires ne le voyaient pas, parce que le double de la file accepte n'importe quel filtre. Le test
lit maintenant le **vrai** schéma (`instance === 'Mixed'`) et exige un `ObjectId` dans le filtre.
Contre-preuve faite : avec le filtre en chaîne, le test rougit. Même famille de piège que
`organizationId` dans le catalogue.

**Défaut 2 — le double clic simultané rendait `409`.** Les deux transactions réarment la même ligne,
MongoDB en abandonne une (`WriteConflict`), et `EcritureDArgent` la rend en `409 ECRITURE_CONCURRENTE`,
« réessayez ». Le filtre `statut ≠ EN_ATTENTE` ne joue que pour un clic qui arrive **après** le commit
de l'autre. Le cas d'usage relit maintenant la ligne : si elle est `EN_ATTENTE`, il rend `dejaEnFile`.
Sinon, c'est le relais qui écrivait (remise acquittée) et le `409` reste vrai. Contre-preuve faite.

**Vérifié :** unitaires paiement 333 suites, 4 484 tests ; e2e `demandes`, `file-de-sortie-notification`,
`delegation-comptes` 50/50 ; recettes 75/75 sur volumes neufs (images depuis `origin/dev` et ces branches).
**Branches :** `MNV-651-reprise` du paiement (commit `MNV-724(envois)`), `MNV-724-729-recettes` de la
recette.
