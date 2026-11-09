# STORY-651 : Le journal à deux acteurs — un acte délégué se lit chez le client, et il nomme Money Vibes

Status: done

**Épic :** EPIC-025 — Fondation RBAC (catalogue de permissions, rôles, portée)
**Service :** `paiement-service` + `notification-service` (+ patron repris par tout service recevant un contrôleur d'administration)
**Points :** 5 · **Sprint :** ⚠️ **NON SLOTTÉE** — le S32 proposé le 2026-09-05 a été **clôturé** (27/27) avant l’intégration de cette fiche. Elle se tire avec STORY-650, qu’elle conditionne. ⚠️ **RENUMÉROTÉE DEUX FOIS le 2026-09-08** (ex-STORY-600, puis brièvement 632) : la branche locale `r1-rbac-tenant` n’était pas poussée, et le cadrage PI-SPI du 2026-09-05 a repris 599 et 600 en ne balayant que les branches distantes. Le tracker de `main` demandait cette renumérotation. ⚠️ La plage **631 → 649** est ensuite revenue au plan de convergence des rails C et D (document du 2026-09-08) : ces deux fiches se posent donc au-delà, en 650 et 651.
**Prérequis :** **STORY-650** (les contrôleurs d'administration)
**Origine :** arbitrage PO du 2026-09-04, Q2 : *« le client doit le voir dans son journal, c'est important pour la traçabilité »*.

---

## Le fait

STORY-650 ouvre la délégation. **Sans cette story-ci, elle est inacceptable** — et le défaut ne
serait pas l'absence de trace, mais une trace **qui se lit de travers**.

Un journal qui écrit *« passerelle e-mail modifiée le 4 septembre à 14 h 12 »* dans le journal du
cabinet Diallo est **exact et trompeur** : le cabinet lira que c'est lui. Il cherchera qui, chez lui,
a touché à sa configuration. Il ne le trouvera pas.

⚡ **C'est la même famille de défaut que « la phrase juste et vide »** déjà payée deux fois dans ce
programme (FE-050, STORY-556) : rien n'est faux, et l'information n'y est pas.

⛔ **Et une piste d'audit qui se lit de travers ne vaut rien en litige** — c'est-à-dire exactement
le jour où elle sert.

## Critères d'acceptation

- [ ] AC-1 — Toute entrée produite par un acte délégué porte **DEUX acteurs**, distinctement :
      l'**organisation pour laquelle** l'acte a été fait, et l'**opérateur plateforme qui l'a fait**
      (identité + rôle plateforme). ⛔ Un seul champ « auteur » ne suffit pas : c'est précisément le
      champ que le lecteur interprétera comme « quelqu'un de chez moi ».
- [ ] AC-2 — ⛔ **Le VERBE diffère.** Un acte délégué ne se journalise pas avec le même libellé qu'un
      acte du client. *« Passerelle e-mail modifiée **par Money Vibes (support)** »*, pas
      *« Passerelle e-mail modifiée »*. Un test compare les deux chemins et **échoue s'ils
      produisent la même entrée**.
- [ ] AC-3 — L'entrée est écrite dans le journal de **l'organisation cible**, lisible par elle
      **sans aucune permission supplémentaire**. ⚡ Une trace que le client ne peut pas lire ne
      remplit pas l'arbitrage : elle protège Money Vibes, pas le client.
- [ ] AC-4 — ⛔ **L'entrée est écrite dans la MÊME transaction que l'acte**, pas après. Sinon il
      existe un état — court, réel, et exactement celui qu'on cherchera après coup — où l'acte a eu
      lieu et la trace n'existe pas. `paiement-service` a déjà le mécanisme : l'outbox
      transactionnelle et le journal chaîné de **STORY-240**. Le reprendre, ne pas en écrire un second.
- [ ] AC-5 — L'entrée porte **les permissions effectives de l'opérateur au moment de l'acte**, pas
      son nom de rôle. ⚡ Avec le socle + surcharge de STORY-166/167, **un même nom de rôle ne donne
      pas les mêmes droits d'une organisation à l'autre** : journaliser « support » ne dirait pas ce
      que la personne pouvait faire, et rendrait la piste invérifiable rétroactivement.
- [ ] AC-6 — ⚠️ **Rien n'est masqué au client, y compris l'identité de l'opérateur.** Si l'on juge
      qu'un nom de salarié Money Vibes ne doit pas apparaître, alors c'est l'arbitrage Q2 qu'il faut
      rouvrir — pas la trace qu'il faut affaiblir. **À trancher avant le développement, pas pendant.**
- [ ] AC-7 — **Non-régression** : un acte fait par le client lui-même produit **exactement** l'entrée
      qu'il produisait avant. Un e2e sur un acte non délégué en est le témoin — sinon on aura
      renuméroté tout le journal existant pour servir un cas minoritaire.

## Ce qui sera facile à rater

1. ⛔ **Écrire la trace côté console.** Elle vivrait dans `admin-panel`, donc chez Money Vibes, donc
      **invisible du client** — ce qui rate l'objet de la story tout en donnant l'impression de
      l'avoir traitée.
2. ⚠️ **La notification.** Tracer n'est pas prévenir. Faut-il **notifier** le client qu'un opérateur
      est intervenu ? `notification-service` saurait le faire. ✅ **Tranchée par le PO le 2026-11-09 :
      oui, en cloche ET par e-mail, au fondateur** (voir la livraison du point 2 ci-dessous).
3. ⚠️ **Le patron doit être réutilisable.** Trois services au moins recevront des contrôleurs
      d'administration. Écrire la trace deux fois, c'est garantir qu'elles divergeront.

## Notes

- Voir [[STORY-650]], [[STORY-240]] (journal chaîné + outbox), [[STORY-166]], [[STORY-167]],
  [[AP-24]] (la console lit déjà un journal d'audit), [[AP-13]].

---

## ✅ Livraison du 2026-11-08 — avec STORY-650, paiement ET notification

**AC-6 tranché avant le développement (PO, 2026-11-08) : rien n'est masqué au client.**

| AC | paiement-service | notification-service |
|---|---|---|
| AC-1 deux acteurs | nouvel auteur `OPERATEUR_PLATEFORME` au journal chaîné : `utilisateurId`, `organisationOperatrice` (Money Vibes), `pourOrganisation` (vérifiée égale à l'`orgId` de l'entrée), `roles`, `permissions` | même objet `operateur` dans chaque intervention |
| AC-2 verbe distinct | code suffixé `_PAR_MONEY_VIBES` (ex. `COMPTE_ENCAISSEMENT_DECLARE_PAR_MONEY_VIBES`) ; un test compare les deux chemins | code suffixé (imposé par le schéma) + libellé « … par Money Vibes » |
| AC-3 lisible par le client | entrée dans SA chaîne, lue par `GET /journal/chaines/:cle` sous `paiement:journal:consulter` | `GET /v1/interventions` sous `notification:journal:consulter`, le droit qui ouvre déjà son journal d'envois |
| AC-4 même transaction | `EcritureDArgent` (outbox + journal de STORY-240), aucun second mécanisme | `connection.transaction` ; la transaction implicite de Mongoose (`transactionAsyncLocalStorage`) fait rejoindre la transaction aux écritures du cas d'usage ; refus explicite si elle est inactive |
| AC-5 permissions effectives | copie des `perms` du jeton à l'instant de l'acte, couverte par l'empreinte | copie des `perms` du jeton |
| AC-7 non-régression | chemin du client : auteur `UTILISATEUR` identique (`toEqual`) | actes du client : aucune entrée, comme avant |

**Facile à rater — tenu :** la trace est écrite **dans le service**, chez le client, jamais côté
console. Le patron est le même dans les deux services (auteur, suffixe, porte, liste blanche) ; le
prochain service à recevoir un contrôleur d'administration le recopie.

**Point 2 (notifier le client) :** pas fait dans cette livraison, voir ci-dessous.

**Conservation :** `interventions_plateforme` est en ajout seul (hooks Mongoose) et déclarée
**conservée** à la suppression d'une organisation, à côté de `rapports_purge` : l'effacer
supprimerait la preuve de l'intervention avec la donnée qu'elle a touchée.

---

## ✅ Point 2 — prévenir le client (2026-11-09) : fusionné, recette jouée

**Arbitrages PO du 2026-11-09 :**
1. **Cloche ET e-mail**, au **fondateur** de l'organisation.
2. **Paiement et notification ensemble**, sans fiche séparée (même consigne que 650/651).
3. **AD-12 est amendé** : la notification tient l'adresse des membres, pour les seuls messages système
   qui leur sont adressés. Voir le spine de la notification, AD-12.

| | paiement-service | notification-service |
|---|---|---|
| Déclencheur | `JournalAudit.consigner`, pour tout auteur `OPERATEUR_PLATEFORME` : aucun cas d'usage n'a à s'en souvenir | `JournalDesInterventions.executer`, après la trace |
| Même transaction | file `signalements_sortants`, même session que l'entrée | file `signalements_intervention`, même transaction que la trace |
| Une ligne | par canal : la cloche et l'e-mail réussissent ou échouent séparément | idem |
| Remise | relais (jumeau des cloches), route directe | relais, porte interne d'`EnvoisService`, bornée aux messages à un membre |
| Destinataire | `fondateurUserId` (STORY-726), jamais une adresse | `fondateurUserId`, nouveau dans `org_profils` (`createdByUserId`) |

**Le message** (`intervention-money-vibes`, in-app + e-mail, fr/en) porte la phrase et l'instant. Il ne
porte ni l'opérateur, ni le compte, ni la passerelle : il renvoie au journal, qui les nomme (AC-6). Un
e-mail sort de Prospera, et il n'a pas à emporter ce que le journal garde.

**Trou fermé en cours de route :** la route d'un utilisateur ne refusait que les secrets. Un membre
aurait pu annoncer à son fondateur une intervention de Money Vibes qui n'a jamais eu lieu. Une clé
adressée à un membre n'entre plus que par l'appel de service ou la porte interne.

**Limites connues :**
- **Les utilisateurs déjà projetés n'ont pas d'adresse**, tant qu'aucun `identity.user.*` ne repasse :
  leur e-mail est refusé (`MEMBRE_SANS_ADRESSE`) puis abandonné après 5 tentatives. La cloche part quand
  même.
- **Les organisations déjà projetées n'ont pas de fondateur côté notification** : les signalements de la
  notification sont écartés (`SANS_FONDATEUR`). Côté paiement, la même limite existe pour une
  organisation projetée avant STORY-726.
- ⚠️ **Rejouer les topics ne rattrape pas ces deux manques** : `ProjectionTransactionnelle` écarte un
  événement déjà traité par ce consommateur. Sur une base existante, il faudra un rattrapage dédié
  (à décider). Une pile neuve n'est pas concernée.
- ~~**Un refus s'abandonne vite**~~ ✅ **levée le 2026-11-09** (voir « Reprise » plus bas) : un refus
  fait désormais attendre la ligne, et une adresse projetée dans les ~26 h sert encore au signalement.
- **Le destinataire est le fondateur seul**, pas tous les administrateurs. Un fondateur parti de
  l'organisation n'est plus joignable : le signalement échoue, et personne d'autre n'est prévenu.
- **La langue du message est le français.** Les phrases d'actes sont rédigées en français par les
  appelants, et ni le paiement ni la notification ne connaissent la langue du fondateur.

**Vérifié :** unitaires paiement 332/332 suites (4 472 tests, 1 ignoré), notification 273/273 suites
(3 777 tests), `tsc` et lint propres.
**Joué le 2026-11-09 :** `delegation.recette.ts` 18/18 sur la vraie pile (cloche et e-mail réels, usurpation
refusée), conformité notification 9/9 sur vrai Mongo (atomicité du signalement comprise), e2e délégation du
paiement 11/11.

**Branches :** `MNV-651` — notification PR #80 et paiement PR #112, fusionnées.

### Le rattrapage d'une base existante — ⛔ SUPPRIMÉ le 2026-11-09 (décision PO)

Deux commandes (`rattrapage-identite`, `rattrapage-fondateur`) lisaient `auth-service` pour compléter
les read-models d'une base projetée avant la story. **Elles sont supprimées, et rien ne les remplace.**

**Pourquoi.** Les événements d'`auth-service` portent déjà l'adresse (`identity.user.*`) et le fondateur
(`createdByUserId`), et les deux services les projettent. Sur une base neuve, rien ne manque : la partie
« le fondateur est PRÉVENU » de `delegation.recette.ts` passe sur volumes neufs sans aucun rattrapage. Les
commandes ne servaient qu'aux bases d'avant 651/726, et rien n'est en production : ces bases ne vivent que
sur les postes de dev, et **se recréent à neuf**.

Une version intermédiaire lançait le rattrapage à chaque démarrage du service. Elle a été écartée avant
fusion : un service ne lit plus la base d'un autre (`AUTH_MONGODB_URI_LECTURE` n'est plus lue nulle part),
et l'invariant de l'écriture d'argent du paiement (« aucun `setTimeout` hors de la relance Kafka ») la
refusait d'ailleurs.

⚠️ **Le jour où il y aura une production** et qu'une projection gagnera un champ, la question du
rattrapage se reposera. Elle se tranchera alors, pas avant.

**Branches :** `MNV-651-sans-rattrapage` dans notification, paiement et `prospera-recette`.

**🏁 Rejoué depuis `dev` après fusion (2026-11-09, soir)** — notification `695bd2c`, paiement `0dcde70`, recette `762ec69`, neuf images reconstruites, volumes neufs (projet `recettedev651`) :
- recettes croisées **70/70** sur 7 suites (les 75 de l'après-midi, moins les 5 du rattrapage supprimé) ;
- unitaires : notification 273 suites / 3 780 tests, paiement 334 suites / 4 489 tests ; lint et `tsc` propres ;
- conformité sur vrai Mongo : paiement 30/30, notification 58/58 (les 4 tests Mailhog joués contre un relais jetable : la surcouche de recette ne republie pas le SMTP 1025).

### Reprise du 2026-11-09 — un e-mail refusé attend l'adresse

**Le défaut.** Un refus du message (`MEMBRE_SANS_ADRESSE` côté notification, `REFUSEE` côté paiement)
consommait une tentative à chaque tour du relais, toutes les 2 ou 3 s. Les 5 tentatives partaient en une
dizaine de secondes, puis la ligne passait `ECHEC_DEFINITIF` sans reprise. Une adresse arrivée juste
après, par Kafka, ne servait plus. La cloche partait, l'e-mail se perdait.

**Le correctif, dans les deux services.** Chaque refus pose `prochaineTentativeLe` : 1 min, 15 min, 2 h,
puis 24 h, soit environ 26 h entre le premier essai et l'abandon. Le relais ne relit que les lignes
échues. Une panne du tuyau ne compte toujours rien et se retente au tour suivant. Une remise réussie
efface le motif et l'attente. Les lignes déjà en base n'ont pas le champ : elles partent au tour
suivant, comme avant.

Au passage, côté paiement : la remise écrivait `dernierMotif: undefined` dans le `$set`, que mongoose
retire. Le dernier refus restait donc sur une ligne remise. C'est maintenant un `$unset`.

**Recette** (`delegation.recette.ts`, +2) : l'adresse du fondateur est retirée, la cloche part, l'e-mail
est refusé **une seule fois** et la ligne attend (contrôlé en base dans les deux services). L'adresse
est ensuite rendue à l'identique (une projection en retard), et l'e-mail repart dans les deux services (`REMIS`,
2 tentatives, ni motif ni attente).

**Branches :** `MNV-651-reprise` dans notification et dans paiement, `MNV-724-729-recettes` dans
`prospera-recette`.
