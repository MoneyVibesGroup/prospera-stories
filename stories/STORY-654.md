# STORY-654 : La recette d'appel réel — une garde sur le contrat d'un tiers, et elle sait dire ce qu'elle n'a PAS prouvé

Status: done

**Épic :** EPIC-036 — Fournisseurs de paiement interchangeables et simultanés
**Service :** `paiement-service`
**Points :** 3 · **Sprint :** ⚠️ **NON SLOTTÉE** — elle se tire avec le déblocage du bac à sable, qu'elle instrumente.
**Prérequis :** **STORY-600** (l'adaptateur), **STORY-652** (la clé d'API), **STORY-653** (le corps de la demande)
**Origine :** deux défauts consécutifs — la clé d'API absente, puis la date limite facultative — que **3 268 tests unitaires et 252 recettes de bout en bout n'ont pas vus**, et qu'un seul appel réel a montrés.

---

## Le fait

STORY-652 et STORY-653 ont chacune corrigé un défaut que **rien dans le dépôt ne pouvait
attraper**. La raison est structurelle et elle ne se répare pas en ajoutant des tests :

⛔⛔ **AUCUN DOUBLE NE CONNAÎT LE CONTRAT D'UN TIERS.** Un `jest.fn()` accepte ce qu'on lui donne et
rend ce qu'on lui dit de rendre. Il atteste que notre code fait ce que nous croyons — jamais que ce
que nous croyons est vrai. Les deux défauts vivaient exactement dans cet écart : un en-tête absent,
un champ rendu facultatif. **Les deux suites étaient vertes, et elles avaient raison de l'être.**

⚡ **La preuve manquante n'est pas une assertion, c'est un APPEL.** Et un appel ne peut pas rejoindre
`npm test` : il dépend d'un tiers joignable, d'identifiants qui ne sont pas versionnés, et d'un bac
à sable qui tombe. Le mettre dans la chaîne d'intégration la rendrait rouge un matin sans que rien
n'ait changé chez nous — et elle serait désactivée le jour même. C'est la même leçon que le fichier
de mesures de la recette UJ1, écrite un cran plus haut.

⚡⚡ **CE QUI REND CETTE RECETTE UTILE N'EST PAS QU'ELLE PASSE, C'EST QU'ELLE SÉPARE TROIS ISSUES.**
Une recette qui rend « vert / rouge » face à un tiers défaillant ment dans les deux sens : rouge
quand le bac à sable tombe, vert quand elle n'a rien pu essayer. Il en faut **trois** :

| Issue | Ce qu'elle dit | Ce qu'on en fait |
| --- | --- | --- |
| **PROUVÉ** | le tiers a répondu ce que notre code attendait | rien |
| **BLOQUÉ** | le tiers ne permet pas d'essayer, pour une raison NOMMÉE | on relance le tiers |
| **ÉCHEC** | le tiers a répondu, et notre code s'est trompé | on livre un correctif |

Seul **ÉCHEC** fait sortir la recette en erreur. ⛔ **Sans cette séparation, l'état d'aujourd'hui —
un compte que le simulateur liste mais ne résout pas — rendrait la recette rouge en permanence, et
elle cesserait d'être lue avant d'avoir servi une seule fois.**

## Critères d'acceptation

- [x] AC-1 — La recette exerce les routes de l'API Business **par le code du service**, pas par des
      appels écrits pour l'occasion : l'obtention du jeton, la recherche d'une adresse de paiement et
      la demande de paiement passent par l'adaptateur et son module client. ⚡ Une recette qui
      refait les appels à la main prouve que le schéma marche, jamais que **notre** code le parle.
- [x] AC-2 — Elle rend **trois** issues par étape, et ne sort en erreur que sur **ÉCHEC**. Un blocage
      est **nommé** : la route, le statut, et la raison telle que le tiers l'a dite.
- [x] AC-3 — ⛔ **Elle ne rejoint AUCUNE suite lancée par `npm test`.** Ni le nom du fichier ni son
      emplacement ne doivent correspondre aux trois `testRegex` du dépôt, et un contrôle le vérifie
      plutôt que de l'espérer.
- [x] AC-4 — Elle prend ses identifiants de **l'environnement**, avec repli sur le fichier non
      versionné de la racine. ⛔ Aucun secret n'est écrit dans le dépôt ni imprimé par la recette —
      pas même tronqué : un secret partiellement imprimé reste un secret réduit.
- [x] AC-5 — Les étapes qui **fabriquent le décor** — lister les comptes, créer une adresse de
      paiement — sont marquées comme telles et séparées des étapes qui **éprouvent le service**. ⚡
      Ce service ne crée jamais d'alias : c'est un acte de l'organisation chez son participant, et le
      confondre avec une capacité du produit ferait écrire une route qui n'a pas lieu d'être.
- [x] AC-6 — ⚠️ **Elle DIT ce qu'elle n'a pas prouvé.** Le rapport final énumère les chemins qui
      restent sans témoin — la notification signée, le chiffrement mutuel, la traversée réelle du
      coffre — plutôt que de laisser un « tout est vert » les recouvrir.
- [x] AC-7 — ⛔ **Elle n'efface rien.** Une adresse de paiement supprimée ne se restaure pas : la
      recette réutilise ce qui existe et ne crée que ce qui manque. Une recette qui nettoie derrière
      elle détruirait, à chaque exécution, la seule chose coûteuse à obtenir.

## Ce qui sera facile à rater

1. ⛔⛔ **La brancher sur `npm test` « pour qu'elle soit vraiment lancée ».** Elle deviendrait la
      raison pour laquelle la chaîne est rouge un matin, et serait retirée dans l'heure.
2. ⛔ **Refaire les appels en `curl` ou en `fetch` dans la recette.** On prouverait le schéma, pas
      l'adaptateur — c'est-à-dire exactement l'inverse de ce qu'on cherche.
3. ⚠️ **Confondre « le tiers a refusé » et « nous nous sommes trompés ».** C'est la distinction que
      STORY-653 a déjà payée dans le code, avec un cinquième code d'échec. La recette la reprend.
4. ⛔ **Supprimer les alias créés à la fin.** Un SHID supprimé ne revient pas, et la valeur d'une
      recette réelle tient à ce qu'elle puisse être rejouée demain.
5. ⚠️ **Faire croire que le coffre est traversé.** La recette prête l'adresse par un double, parce
      que le vrai coffre exige Mongo et une clé maîtresse. C'est une limite, elle doit être écrite
      dans le rapport et non déduite par le lecteur.

## Ce qui reste ouvert

- ⛔ **Le bac à sable ne résout pas le compte qu'il liste** (STORY-653) : `POST
      /v1/comptes/transactions` accepte `44511072980305975922`, tandis que `GET /v1/comptes/{numero}`
      et `POST /v1/comptes/{numero}/alias` rendent `404`. Tant que cela dure, la recette s'arrête au
      décor et **le dit** — c'est précisément ce pour quoi elle est écrite.
- ⚠️ **La notification signée reste sans témoin.** C'est la seule chose qui fasse avancer une demande
      sur ce canal (AD-4) : un encaissement réussi sans elle est invisible pour toujours. L'éprouver
      demande une adresse joignable depuis l'extérieur, donc une autre story.

## Notes

- Voir [[STORY-600]], [[STORY-652]], [[STORY-653]], [[STORY-249]] (la santé n'est pas une sonde, et
  ne peut pas le devenir), [[STORY-243]] (le coffre).

## Livraison

🏁 **Livrée le 2026-09-09**, branche `MNV-654`. Lancement :
`npm run recette:pi-spi`. ⚡ **AC-3 est vérifiée plutôt qu'espérée** :
`jest --listTests` sur les **trois** configurations ne ramasse pas le fichier.

État mesuré à la livraison : **3 prouvés, 1 bloqué, 0 échec**, sortie `0`.
Les trois preuves sont le raccordement complet, le jeton délivré avec les
portées préfixées, et les comptes exposés par le participant. Le blocage est le
défaut de STORY-653 : `/comptes` liste désormais **deux** comptes
(`44511072980305975922` et `79170907164669761026`, ouvert le jour même) et
**aucun des deux** n'est résolu par `/comptes/{numero}` ni par la route d'alias.

⚡ **Le second compte a changé la valeur du rapport** : la recette essaie
désormais TOUS les comptes et nomme chacun avec sa raison de refus. La
différence entre « un compte ne marche pas » et « aucun ne marche » est
exactement ce que le participant a besoin de lire.

## Ce que la première adresse réelle a changé (2026-09-09, même jour)

Une adresse de paiement réelle a été fournie. L'annuaire la résout — nom, pays,
catégorie — et **le chemin nominal de la vérification d'un compte est prouvé
contre le schéma pour la première fois** : jusque-là il n'avait jamais vu qu'un
`404`. La lecture du client, la comparaison du pays et le retour de l'empreinte
ont tourné pour de vrai.

⛔⛔ **MAIS LE BÉNÉFICIAIRE DOIT ÊTRE À NOUS, ET L'ANNUAIRE NE SUFFIT PAS À LE
DIRE.** Une adresse peut exister au répertoire sans être celle de notre client
business : le schéma refuse alors la demande par un `404` qui **nomme le
business**. Les deux rôles ne se remplacent donc pas —
`PI_SPI_ALIAS_ENCAISSEMENT` doit être à nous, `PI_SPI_ALIAS_PAYEUR` à un tiers
enrôlé — et la recette les distingue plutôt que de produire un échec qui
ressemblerait à un défaut de notre code.

⚡ **Une adresse fournie court-circuite le décor, délibérément.** Le décor n'est
pas ce que la recette éprouve : il n'existe que pour amener une adresse. Exiger
de la fabriquer quand le participant ne résout pas ses propres comptes
laisserait **un défaut extérieur décider de ce que nous savons de notre code**.

État : **5 prouvés, 1 bloqué, 0 échec**. Il ne manque qu'une adresse de paiement
sur l'un de NOS comptes — ce que la résolution des comptes bloque encore.
