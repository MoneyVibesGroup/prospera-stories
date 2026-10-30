# STORY-649 : Recette croisée — le distributeur est facturé pour ce qu'il consomme

Status: blocked

**Bloc :** Convergence E4 — les recettes croisées (`CONVERGENCE-RAILS-C-D-2026-09-08.md`, n° 13)
**Dépôt :** `prospera-recette` (`paquets/recette-croisee/recette/`) · **Points :** 5
**Services traversés :** les cinq — `auth-service` · `kyc-service` · `platform-catalog-service` ·
`notification-service` · `paiement-service`
**Prérequis :** STORY-632 ⛔ (son outillage) · STORY-639 ✅ · STORY-647 ✅ · STORY-706 ✅ ·
STORY-712 ✅ · **STORY-166/167 ⛔** · **une horloge de recette ⛔** · **le point de prix de 647 ⛔**
(voir « Ce qui bloque »)

---

## Le récit

En tant que **direction de Money Vibes**, je veux voir l'argent revenir **vers** Money Vibes sans que
Money Vibes n'ait touché celui du client, afin de savoir que les deux flux coexistent sans se
mélanger.

⚡⚡ **C'est la seule recette qui fasse tourner les deux flux en même temps, dans la même
organisation** — le seul état réel. STORY-631 montre Money Vibes qui encaisse ; STORY-632 montre le
distributeur qui encaisse ; celle-ci montre le distributeur **payeur** de Money Vibes et
**bénéficiaire** de ses clients, la même semaine.

## Le scénario, dans l'ordre

0. Le distributeur est accueilli et configuré comme en STORY-632 (raccordement, compte, passerelles).
1. Il envoie 200 SMS sous **sa** passerelle ; les accusés rapportent le coût réel.
2. La période se clôt ; l'arrêté est publié ; un accusé tardif arrive.
3. Le paiement transforme l'arrêté en créance au bénéfice de Money Vibes ; Money Vibes émet la
   demande et le lien part au distributeur.
4. Pendant ce temps, le distributeur encaisse une créance de son propre client.
5. Rien ne relie les deux créances.

## Critères d'acceptation

- [ ] AC-1 — Le distributeur envoie **200 SMS** sous **sa** passerelle (adaptateur `sms-http`). Les
      accusés de délivrance rapportent un coût réel : le **coût réel gagne sur l'estimé** (barème),
      et le **premier rapporté gagne** — un second accusé pour le même envoi ne change ni l'envoi ni
      le compteur. Mécanisme déjà en place : `accuses.service.ts` ne corrige que
      `cout.source: 'BAREME'`, et le compteur ne bouge que si l'envoi a bougé (STORY-597, 712).
- [ ] AC-2 — La période se clôt (`POST /api/v1/consommation/periodes/:periode/cloture`, ou la
      clôture planifiée de STORY-706) ; l'arrêté est **immuable** — une seconde clôture rend le même
      arrêté, marqué `dejaClose`, pas des totaux recalculés ; un **accusé tardif** est imputé à la
      période **suivante** et l'arrêté ne bouge pas (STORY-639, AC-2).
- [ ] AC-3 — Le fait `notification.consommation.arretee` fait naître chez le paiement une créance
      **au bénéfice de Money Vibes**, payeur = le distributeur, référence
      `ARRETE-<org>-<AAAA-MM>-<DEVISE>` (STORY-647) ; ⚡ **sans aucun droit humain** : le pont passe
      par Kafka. Money Vibes émet ensuite la demande — **le pont ne le fait pas**, c'est un geste de
      console (647) — et le lien arrive au distributeur dans Mailhog **sous l'identité d'envoi de
      Money Vibes**, jamais sous la passerelle du distributeur.
- [ ] AC-4 — Pendant ce temps, le distributeur encaisse une créance de son propre client, sur **son**
      compte (le scénario de STORY-632, réduit au paiement par lien).
- [ ] AC-5 — ⛔ Les deux flux ne se compensent **jamais** : ce qu'il doit à Money Vibes ne réduit
      pas ce que ses clients lui doivent, et l'inverse. La recette vérifie, par l'API, que les
      restants des deux créances sont **exactement** ceux de leurs propres encaissements, et
      qu'aucun encaissement, aucune affectation et aucune entrée de journal ne porte les
      identifiants des deux créances à la fois.
- [ ] AC-6 — ⛔ La consommation **n'a rien refusé** : aucun des 200 envois n'a été rejeté pour un
      motif de coût, de solde ou de quota (journal des envois), et la garde
      `notification-service/src/modules/consommation/aucune-facturation.spec.ts` est **verte sur le
      commit de l'image éprouvée**. ⚠️ **Formulation corrigée** : le plan disait « verte à la fin de
      la recette ». C'est une garde **statique** — elle balaie le code, pas l'exécution — donc elle
      ne peut pas changer de couleur pendant la recette. La recette en joue la contrepartie
      observable (aucun refus) et cite le commit sur lequel la garde passe.

## ⛔ Ce qui bloque — vérifié dans le code le 2026-10-30

| # | Blocage | Constat | AC touchés | Ce qui lève |
|---|---|---|---|---|
| 1 | **Aucun jeton réel ne porte `paiement:*` ni `notification:*`** | Armer la passerelle exige `notification:canal:administrer` ; la route de clôture et toute la surface de consommation exigent `notification:journal:consulter` ; émettre la demande, `paiement:demande:emettre` ; lire les créances aussi. Aucun de ces codes n'est au catalogue de l'IdP. | 1, 2, 3, 4, 5 | **STORY-166/167** |
| 2 | ⛔ **On ne clôt pas le mois qui court, et aucune horloge ne se règle** | La clôture refuse `409 PERIODE_NON_TERMINEE` (« on ne clôt pas un mois qui court »). La période est le mois calendaire, lu sur l'horloge système : aucune horloge injectable ni réglable par l'environnement dans `notification-service`. Les 200 SMS envoyés par la recette tombent dans le mois en cours, **que la recette ne peut donc pas clore** — ni par la route, ni par la planification de STORY-706, qui ne clôt que les mois révolus. | 2, 3, et 5 par voie de conséquence | **aucune story**. ⚠️ Décision PO : (a) une horloge de recette, réglable par l'environnement et **refusée en production**, à écrire dans `notification-service` — c'est un réglage, donc compatible avec AC-3 de STORY-646 ; (b) `libfaketime` dans la surcouche de recette, sans toucher au service ; (c) une recette en deux temps, à cheval sur une fin de mois. |
| 3 | ⛔ **Le montant attendu n'est pas tranché** | Point de prix **ouvert** depuis la livraison de 647 : l'arrêté est valorisé au barème de la passerelle **de l'organisation** (`tarifDe`). Pour un distributeur sur **sa** passerelle — exactement AC-1 — Money Vibes lui refacture ce qu'il paie déjà à son agrégateur. Écrire AC-3 aujourd'hui reviendrait à **asserter une double facturation**. | 3, 5 | **arbitrage PO** sur le prix d'un SMS envoyé sous la passerelle du client (frais de plateforme, zéro, ou le barème) |
| 4 | **L'outillage de STORY-632** | Accueil d'une organisation de plus, signature des notifications de fournisseur, membres multiples. | 0, 4 | **STORY-632** |

⚡ **Ce qui n'attend rien** : le pont arrêté → créance (AC-3, première moitié) ne demande aucun droit
humain, puisqu'il passe par Kafka. C'est aussi le seul pas de cette recette dont le prochain blocage
n'est pas l'IdP — c'est l'horloge.

⛔ **La voie écartée : un IdP de recette**, pour la même raison qu'en STORY-631 et 632.

## Ce que la recette devra savoir faire, et que le dépôt n'a pas encore

- **Un récepteur SMS de recette.** `sms-http` parle un contrat posé par Prospera (`POST` JSON, trois
  champs, une référence en retour), et le point de terminaison vient de la **passerelle de
  l'organisation**, jamais de l'environnement. La surcouche de recette peut donc lever un faux
  agrégateur, au même titre que Mailhog pour le courriel, qui répond aux 200 envois et **rappelle**
  la route d'accusé avec un coût réel. ⚠️ À vérifier au tirage : que la saisie de la passerelle
  accepte une adresse du réseau de recette (les gardes d'adresse sortante de STORY-711 visent la
  remise HTTP générique, pas `sms-http`, mais la validation de la saisie n'a pas été relue).
- **L'horloge**, selon l'arbitrage du blocage n° 2.

## Ce qui NE fait PAS partie de cette story

- La facturation de l'abonnement : **STORY-631**.
- L'impayé de la créance de consommation, la relance, la suspension : leurs stories propres.
- Toute facturation ou blocage **dans** `notification-service` : interdite au v1 (AD-16, FR-N63) —
  c'est l'objet d'AC-6.

## Notes

- Voir [[STORY-631]], [[STORY-632]], [[STORY-646]], [[STORY-647]] (le pont et son point de prix),
  [[STORY-639]] (la clôture), [[STORY-706]] (la clôture planifiée), [[STORY-712]] (un seul
  compteur), [[STORY-597]] (le coût réel), [[STORY-620]] (`sms-http`), [[STORY-711]],
  [[STORY-166]], [[STORY-167]].
