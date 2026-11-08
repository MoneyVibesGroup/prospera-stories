# STORY-649 : Recette croisée — le distributeur est facturé pour ce qu'il consomme

Status: done

**Bloc :** Convergence E4 — les recettes croisées (`CONVERGENCE-RAILS-C-D-2026-09-08.md`, n° 13)
**Dépôt :** `prospera-recette` (`paquets/recette-croisee/recette/facturation.recette.ts`) · **Points :** 5
**Services traversés :** les cinq — `auth-service` · `kyc-service` · `platform-catalog-service` ·
`notification-service` · `paiement-service`
**Prérequis :** STORY-632 ✅ · STORY-639 ✅ · STORY-647 ✅ · STORY-706 ✅ · STORY-712 ✅ ·
STORY-166/167 ✅ · horloge de recette ✅ (cette story) · point de prix de 647 ✅ (arbitrage PO)
**Livrée le 2026-11-08** : recette **35/35** sur volumes neufs (projet `recette649`). Les 7 étapes de
649 s'ajoutent aux 28 de 631/632/pile, qui restent vertes. Images construites depuis les branches
`MNV-649` (notification, paiement) et depuis `origin/dev` (auth, kyc, catalogue).

---

## ⚡⚡ Arbitrages PO du 2026-11-08 — ils changent ce que la recette prouve

1. **L'horloge de recette** (blocage n° 2) : une avance réglable par l'environnement dans
   `notification-service` (`RECETTE_HORLOGE_AVANCE_JOURS`, de 0 à 400 jours). Le démarrage la
   **refuse sous `NODE_ENV=production`**. Les options libfaketime et recette à cheval sur une fin de
   mois ont été écartées.
2. **Le prix d'un SMS envoyé sous la passerelle du client est ZÉRO** (blocage n° 3) : « zéro,
   assumé ». Le PO a confirmé ce choix après qu'on lui a présenté la conséquence vérifiée dans le
   code. Tous les tarifs de catalogue valent 0 et le seul relais de la plateforme est le courriel
   (il n'y a **aucun relais SMS ni WhatsApp**). Tout coût non nul vient donc de la passerelle
   **propre** du client. **Aujourd'hui, Money Vibes ne facture aucune consommation** et le pont de
   647 ne crée aucune créance tant que la plateforme ne porte pas de message tarifé.

⇒ AC-3 et AC-5 sont **réécrits** : l'arrêté est publié, le paiement le **lit**, et **aucune**
créance ne naît. Une absence ne prouve rien à elle seule, c'est pourquoi la recette en donne un
**témoin positif**.

## Le récit

En tant que **direction de Money Vibes**, je veux voir les deux flux coexister dans la même
organisation sans se mélanger : le distributeur **consomme** (sous sa propre passerelle) et
**encaisse** (pour lui-même), et rien ne relie les deux.

## Critères d'acceptation

- [x] AC-1 — Le distributeur envoie **200 SMS** sous **sa** passerelle (`sms-http` → faux
      agrégateur de la recette, expéditeur `DISTRIB`, sa clé). Le coût annoncé est le **barème
      contracté** (200 × 15). Les accusés rapportent le coût réel (12), qui **gagne** sur l'estimé
      (`source: REEL`). Un second accusé pour le même envoi (coût 99) ne change ni l'envoi ni le
      compteur.
- [x] AC-2 — La période se clôt (`POST …/periodes/:periode/cloture`). L'arrêté est **immuable** :
      la seconde clôture rend le même, avec `dejaClose`. Le mois que l'avance rend courant est refusé
      (`409 PERIODE_NON_TERMINEE`). L'**accusé tardif** du 200ᵉ SMS (coût 20, arrivé après la
      clôture) est imputé à la période **suivante**, qui le marque (`periodesReportees`), et
      l'arrêté ne bouge pas.
- [x] AC-3 — *(réécrit, « zéro, assumé »)* `notification.consommation.arretee` part sur le bus avec
      la ventilation (`sms` : 200 envois, **2 403 XOF**, `{ ORGANISATION: 2403, PLATEFORME: 0 }`).
      Le paiement le **lit**, ce dont témoigne son journal : `arrêté de consommation sans dû`
      (orgId, période). **Aucune** créance de Money Vibes ne porte cet arrêté (`404` sur
      `<MV>|CONSOMMATION_MESSAGES|ARRETE-<org>-<AAAA-MM>-XOF`, et absent de la liste).
- [x] AC-4 — Pendant ce temps, le distributeur encaisse une créance de son propre client sur
      **son** compte : raccordement, compte PI-SPI, routage, barème, demande, puis notification
      signée du fournisseur pour 80 000.
- [x] AC-5 — *(réécrit)* Les deux flux ne se compensent **jamais**. La créance du client rend
      exactement ses propres encaissements (confirmé 80 000, restant 0), et rien chez Money Vibes ne
      vise le distributeur pour sa consommation : il n'existe donc rien qui puisse être compensé.
- [x] AC-6 — Aucun des 200 envois n'est refusé (200 × `200`, 0 échoué). La garde
      `aucune-facturation.spec.ts` est verte sur le commit de l'image éprouvée : notification
      `MNV-649` `33ccedd`, suite unitaire de 3 682 tests. C'est une garde **statique** : la recette
      en joue la contrepartie observable.

## Ce que la story a dû écrire — trois défauts et deux arbitrages

### `notification-service` — branche `MNV-649` (3 commits sur `origin/dev` `ab6dcf5`)

1. **`03aa5f6` — ⛔⛔ défaut : aucun SMS ne pouvait partir sous la passerelle d'un client.**
   - La résolution ne reconnaissait une passerelle propre qu'à son `hote` (SMTP).
   - Les adaptateurs HTTP (SMS, WhatsApp, push) déclarent le leur sous `pointDeTerminaison` : la
     passerelle SMS du client tombait donc sur le relais partagé, dont la garde de domaine refusait
     l'expéditeur « DISTRIB » (`DOMAINE_NON_VERIFIE`).
   - Aucun test ne résolvait un canal autre que le courriel. Le correctif est un vocabulaire
     (`REGLAGES_POINT_DE_TERMINAISON`) et non une comparaison de canal (AD-6), gardé par
     `point-de-terminaison-declare.spec.ts`. Une mutation qui rétablit `hote` seul fait rougir la
     preuve.
2. **`aa998b1` — défaut latent : `staging` aurait chargé `pino-pretty`**, absent de l'image
   `runtime`, d'où un redémarrage en boucle (le piège de kyc et du catalogue). Les journaux sont
   désormais lisibles seulement en `development` et `test`, JSON ailleurs.
3. **`33ccedd` — l'horloge des périodes et la ventilation par identité.**
   - `HorlogeDesPeriodes` : **une** horloge pour la clôture (route et planifiée) et pour
     l'imputation d'un fait tardif. C'est l'invariant de STORY-639 : deux horloges feraient tomber
     un fait dans un arrêté posé. Elle **ne date aucun fait** (`closeLe` et `prepareLe` restent
     réels).
   - Une garde vérifie qu'aucun de ces décideurs ne relit l'heure du système.
   - `coutParIdentite` sur le compteur est maintenu à la remise (coût annoncé) puis à l'accusé
     (écart réel). L'arrêté et son annonce portent `coutMineurParIdentite`, avec les deux clés
     toujours écrites et un vocabulaire fermé ; le contrat JSON est mis à jour.
   - ⛔ La notification ne décide pas de ce qui se facture (`aucune-facturation`) : elle publie un
     **fait**.

Résultats : 3 682 tests unitaires, 275 e2e et lint à 0. Les 54 tests de conformité exigent
l'infrastructure Docker et n'ont pas tourné hors gate ; la recette sur la vraie pile en couvre le
chemin.

### `paiement-service` — branche `MNV-649` (`d9713e0` sur `origin/dev` `4153dfa`)

- `dusDeLArrete` ne facture que `coutMineurParIdentite.PLATEFORME`. La règle du barème de 647
  (AC-4) tient sur cette part.
- `lireArrete` **exige** la ventilation. Son absence rend l'arrêté illisible : elle ne se lit jamais
  « tout à la plateforme » (ce serait la double facturation) ni « rien » (ce serait une dette
  perdue).
- « Lu, rien à facturer » se **journalise** : c'est le témoin d'AC-3.
- Résultats : 4 392 tests unitaires et 340 e2e.

### `prospera-recette` — branche `MNV-649` (`6067876` sur `origin/dev` `2baa281`)

- `src/agregateur-sms.ts` : un faux agrégateur **dans le processus de la recette**, qui parle le
  contrat de `sms-http` (sonde `OPTIONS`, `{ destinataire, expediteur, texte }`, référence en retour,
  accusés signés HMAC). C'est la recette qui décide quand il rappelle.
- La surcouche ajoute deux réglages à notification (`NODE_ENV: staging`,
  `RECETTE_HORLOGE_AVANCE_JOURS: '31'`) et `extra_hosts: host.docker.internal:host-gateway`. La
  garde du profil les fige. Aucun volume ni état en base n'y entre (AC-3 de 646).
- La recette absorbe les `429` de notification (100 requêtes par minute et par adresse) en
  relisant `retry-after` : c'est le comportement voulu du service.

## ⛔ Points ouverts, à arbitrer

1. **Le pont de 647 ne facture rien aujourd'hui** : c'est la conséquence assumée. Il reprendra du
   sens le jour où la plateforme portera un message tarifé (un relais SMS de Money Vibes, ou un
   barème sur le relais courriel partagé).
2. **Un envoi jamais remis n'est sous aucune identité**, donc il n'est facturé à personne. Ce n'est
   pas un cas de la recette.
3. **Un compteur antérieur à 649 n'a pas de ventilation** : il est lu à zéro. Sans conséquence tant
   que la production est fermée (§10, STORY-668), mais à garder en tête au premier déploiement.
4. Le message de la console client (« la période en cours ») lit encore l'heure système. C'est
   cosmétique, et cela ne concerne que la recette.

## Ordre de fusion

notification `MNV-649` → paiement `MNV-649` → recette `MNV-649` (sur **dev**) → docs. Le paiement
refuse un arrêté sans ventilation : le déployer **avant** notification rendrait les arrêtés
illisibles, donc non facturés. Au vu du point 1, ce n'est pas une perte.

## Ce qui NE fait PAS partie de cette story

- La facturation de l'abonnement : **STORY-631**.
- L'impayé de la créance de consommation, la relance, la suspension : leurs stories propres.
- Un relais SMS de la plateforme.
- Toute facturation ou tout blocage **dans** `notification-service` : c'est interdit au v1 (AD-16,
  FR-N63).

## Notes

- Constat du 2026-10-30 (fiche « bloquée ») : les droits sont levés par 166, 167 et 632.
  L'outillage de 632 est réutilisé (`Accueil`, `fournisseur.ts`).
- Voir [[STORY-631]], [[STORY-632]], [[STORY-646]], [[STORY-647]], [[STORY-639]], [[STORY-706]],
  [[STORY-712]], [[STORY-597]], [[STORY-620]], [[STORY-604]], [[STORY-615]].
