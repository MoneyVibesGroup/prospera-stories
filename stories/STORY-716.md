# STORY-716 : Santé du raccordement, par organisation — éprouvé à la demande et périodiquement

Status: done

**Épic :** EPIC-036 — Fournisseurs de paiement interchangeables et simultanés
**Service :** `paiement-service`
**Points :** 3 · **Rail :** E2 (RAIL-E-PAIEMENT-11-STORIES-2026-10-23)
**Prérequis :** [[STORY-666]] (le raccordement est une donnée d'organisation)
**Modèle :** [[STORY-616]] (`notification-service`, revérification périodique d'une passerelle)

---

## User story

En tant qu'**administrateur des comptes d'une organisation**,
je veux **savoir si mon raccordement au schéma marche encore, et pourquoi il ne marche plus**,
afin de **le réparer avant que la première demande de la journée soit refusée devant un payeur**.

## Le fait

[[STORY-666]] scelle un raccordement à sa déclaration **sans appeler personne**. Un secret faux, une
clé d'API révoquée, un client désactivé ne se découvraient qu'à la première demande poussée —
refusée — ou au premier relevé.

⛔⛔ **Et le refus, quand il arrivait, mentait.** Mesuré au bac à sable le 2026-10-23 : un secret faux
ou un client inconnu rendent **`400 {"error":"invalid_client"}`** au serveur d'autorisation. La règle
générale du client — « un `400`, c'est notre corps qui est faux » ([[STORY-653]]) — en faisait un
`APPEL_NON_CONFORME` : l'organisation apprenait un défaut de NOTRE service, à corriger par une
livraison, alors que le remède était chez elle.

| Mesure (bac à sable, 2026-10-23) | Réponse |
|---|---|
| Identifiants justes | `200`, jeton |
| Secret faux | `400 {"error":"invalid_client","error_description":"invalid_client_secret"}` |
| Client inconnu | `400 {"error":"invalid_client"}` |
| Clé d'API fausse, jeton juste | `403 {"message":"Forbidden"}` |
| Code participant faux dans le chemin | `200` — ⚠️ le simulateur ne le contrôle pas |

## Critères d'acceptation

- [x] AC-1 — **Une épreuve, deux preuves, deux motifs** : un jeton sous les identifiants de
      l'organisation prouve le couple identifiant / secret ; une lecture que seule la clé d'API
      autorise prouve la clé. `IDENTIFIANTS_REFUSES` et `CLE_API_REFUSEE` nomment deux remèdes.
- [x] AC-2 — ⛔ **Un fournisseur injoignable ne marque rien** : ni réussite, ni refus ; l'état rendu
      est celui d'avant, signalé `injoignable`.
- [x] AC-3 — ⚡ **L'état se dérive, il ne se range pas** : on range des faits datés (dernière
      épreuve, réussite, refus, motif) ; `NON_EPROUVABLE`, `NON_EPROUVE`, `SAIN`, `EN_ECHEC`,
      `PERIME` se lisent à l'instant. Sans durée, « cesse d'être vérifié » n'arrive jamais : une
      réussite fait foi 24 heures.
- [x] AC-4 — ⛔ **Un échec n'efface pas une réussite, il la suit** : c'est l'ordre des deux dates qui
      décide ; une épreuve ancienne arrivée en retard ne fait pas reculer l'histoire (`$max`).
- [x] AC-5 — **De nouveaux identifiants n'ont rien prouvé** : toute redéclaration remet la santé à
      zéro, et une épreuve de l'ancienne déclaration ne touche pas la nouvelle.
- [x] AC-6 — **À la demande et périodiquement** : `POST /v1/raccordements/:f/epreuves` éprouve
      maintenant ; une veille éprouve ce qui ne l'a pas été depuis une période (6 h par défaut).
      `GET` et `PUT` rendent l'état.
- [x] AC-7 — ⛔ **`invalid_client` est un refus des identifiants, partout** — pas seulement dans
      l'épreuve : tout appel sous un raccordement révoqué le dit désormais.
- [x] AC-8 — Recette **réelle** : les trois verdicts contre le bac à sable.

## Ce que cette story ne fait pas

- Elle **ne prouve pas le participant** : le simulateur ne contrôle pas le code du chemin.
- Elle **n'audite pas** une épreuve : elle constate, elle ne décide de rien ; la déclaration reste
  l'acte audité.
- Elle **ne prévient personne** : un raccordement `EN_ECHEC` se lit, il ne déclenche encore aucune
  notification.

## Livraison — 2026-10-23

**Code :** `prospera-paiement-service`, branche `MNV-716` (`32cae3d` + `e2e4b20`), basée sur
`origin/dev` (`3709b3b`). 4 092 tests unitaires (302 suites), 58 e2e (raccordements, notifications,
relevés), lint 0. **Recette réelle :** 14 prouvés — dont les 3 verdicts de l'épreuve —, 1 bloqué
nommé (l'écart de [[STORY-674]]), 0 échec.

- **Port** : `eprouverLeRaccordement?` (sa présence est la capacité), déléguée par l'enveloppe
  d'observation — absente de l'enveloppe, la capacité disparaissait à l'exécution (leçon de 664).
- **PI-SPI** : `obtenirJeton` puis `GET /comptes?size=1` ; `refuserSiIdentifiantsRefuses` lit
  `invalid_client` avant la règle générale du `400`.
- **Persistance** : quatre champs sur le raccordement, `$max` et filtre sur `declareLe` ; `deposer`
  les `$unset`.
- **Domaine** : `sante-du-raccordement.ts` (état dérivé). **Application** :
  `EprouverLesRaccordements`, `VeilleDesRaccordements` (`RACCORDEMENT_VEILLE_INTERVAL_MS`,
  `RACCORDEMENT_EPREUVE_PERIODE_MS`, `RACCORDEMENT_VEILLE_BATCH_SIZE`).

### Leçons

- ⛔ **La garde de la santé des FOURNISSEURS cherche la forme `.sante(`** : une méthode homonyme,
  qui parlait d'un autre objet, l'a fait rougir. Le geste a été renommé (`etatSansEprouver`) —
  deux notions qui partagent un mot finissent par se confondre.
- ⛔ **Le premier commit est parti avant la lecture de l'e2e** : le module de test listait ses
  providers à la main. Corrigé dans un second commit, qui le dit.
- ⚡ Un double de collection qui ignore `$unset` aurait rendu verte une remise à zéro qui n'a jamais
  lieu : la spec de santé a son propre double, qui lève sur tout opérateur non simulé.

### Points ouverts

1. Montrer l'état des raccordements dans la console d'exploitation ([[STORY-286]]).
2. Prévenir l'organisation quand son raccordement passe `EN_ECHEC` (notification-service).
