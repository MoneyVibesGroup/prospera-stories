# STORY-652 : La clé d'API du participant — un jeton valide ne suffit pas, et la santé ne le dira jamais

Status: ready-for-dev

**Épic :** EPIC-036 — Fournisseurs de paiement interchangeables et simultanés
**Service :** `paiement-service`
**Points :** 2 · **Sprint :** ⚠️ **NON SLOTTÉE** — elle se tire avec le premier essai réel du raccordement PI-SPI, qu'elle conditionne.
**Prérequis :** **STORY-600** (l'adaptateur du schéma), **STORY-243** (le coffre et le type `Secret`), **STORY-249** (l'indicateur de santé des fournisseurs)
**Origine :** sonde du bac à sable de l'API-Business le **2026-09-09**, après configuration complète du raccordement. Aucune documentation ne l'annonçait dans les fiches ; c'est la réponse du schéma qui l'a dit.

---

## Le fait

L'adaptateur de STORY-600 authentifie ses appels sortants par un **jeton OAuth2 seul**. Le schéma
en exige **deux** : le jeton **et** une clé d'API, délivrée à l'enrôlement du client business, à
côté de l'identifiant et du secret.

⛔⛔ **Ce ne sont pas deux façons de dire la même chose, et trois réponses mesurées le prouvent
ensemble :**

| Ce qu'on envoie | Ce que le schéma répond |
| --- | --- |
| rien du tout | `401` `application/problem+json`, « Autorisations insuffisantes » |
| un jeton valide, sans clé | `403` `{"message":"Forbidden"}` |
| — | la réponse CORS annonce `Authorization` **et** `X-Api-Key` |

Le `401` vient de l'**application**, le `403` de la **passerelle** : l'autorisateur passe avant le
contrôle de clé, et chacun refuse pour son propre motif. Un jeton parfaitement valide, portant les
deux bonnes portées, ne franchit pas la seconde porte.

⚠️⚠️ **ET `/health` ANNONCE LE FOURNISSEUR DISPONIBLE.** C'est le vrai coût de cette story. Le
raccordement configuré aujourd'hui rend `fournisseurs: SAIN`, `API_BUSINESS DISPONIBLE`, conteneur
`healthy` — alors qu'aucun appel ne peut aboutir. L'indicateur de STORY-249 est une **mémoire** de
ce que les appels ont appris, et il ne peut pas devenir une sonde : `/health` est publique, donc
toute sonde qu'on y placerait serait un appel sortant déclenchable par n'importe qui. **Le défaut
attend donc le premier vrai encaissement pour se montrer**, et il se montrera devant l'organisation
qui émet sa créance.

## Critères d'acceptation

- [ ] AC-1 — La clé est un **réglage du RACCORDEMENT**, jamais de l'organisation : même durée de
      vie, même portée et même provenance que l'origine, l'URL des jetons et l'identifiant client —
      tous délivrés par le même enrôlement, auprès du même participant. Elle rejoint donc les
      **manques de configuration** : sans elle, `API_BUSINESS` est déclaré **INDISPONIBLE**, et
      `/health` le dit. ⛔ Seul le **nom** du réglage sort dans la réponse, jamais sa valeur : cette
      route est publique (STORY-249).
- [ ] AC-2 — **Tout appel vers l'origine du participant** porte la clé dans `X-Api-Key`, à côté du
      `Authorization: Bearer`. Les **deux** points de terminaison sont concernés — la recherche
      d'une adresse de paiement et la demande de paiement — et un test l'atteste sur chacun. ⚠️ Un
      test qui n'en couvrirait qu'un laisserait la vérification d'un compte échouer en `403`, donc
      un compte réputé **non vérifiable** pour une raison qui n'a rien à voir avec lui.
- [ ] AC-3 — ⛔⛔ **La clé n'atteint JAMAIS le serveur d'autorisation, et cela tient par une ABSENCE
      D'INJECTION, pas par une garde de mots.** Ce sont deux hôtes distincts : l'un est exposé par
      le participant, l'autre est le serveur d'autorisation. La fonction qui demande le jeton reçoit
      un type qui **ne porte aucun champ de clé** — elle n'a donc rien avec quoi la divulguer, et
      aucune relecture n'est nécessaire pour s'en convaincre. Un test lit les en-têtes de la requête
      de jeton et **échoue si `X-Api-Key` y apparaît**.
- [ ] AC-4 — La clé est un `Secret` **dès sa lecture** : elle ne s'imprime ni dans un journal, ni
      dans une trace d'erreur, ni sous `util.inspect`, ni dans aucune sérialisation (STORY-243).
      Une garde de balayage cherche sa **valeur** dans toute sortie du service, avec une
      contre-preuve sur contenu fabriqué qui prouve qu'elle sait encore rougir.
- [ ] AC-5 — ⚠️ **La story ne prétend PAS détecter une clé FAUSSE.** Une clé absente rend le
      fournisseur indisponible ; une clé erronée reste invisible jusqu'au premier appel réel, et
      c'est une conséquence assumée de STORY-249, pas un oubli. Le message d'échec correspondant
      **nomme la clé comme remède possible** au lieu de rendre un refus muet.
- [ ] AC-6 — **Non-régression** : l'adaptateur FedaPay est inchangé, et le code de l'adaptateur du
      schéma ne porte **aucune condition d'environnement** — la garde de STORY-246 s'applique sans
      être assouplie.

## Ce qui sera facile à rater

1. ⛔⛔ **Aller chercher la clé dans l'environnement depuis le module client.** C'est la leçon de
      STORY-604 payée ailleurs : *tant qu'un adaptateur sait chercher ses identifiants tout seul,
      aucun test ne peut prouver vers qui il les envoie*. Elle se **reçoit en paramètre**, comme le
      jeton, et le module qui parle au réseau ne lit aucune configuration.
2. ⛔ **La glisser dans l'en-tête d'autorisation ou dans l'URL.** Une URL se retrouve dans les
      journaux d'accès de tout ce qui est sur le chemin — c'est déjà la raison pour laquelle les
      identifiants du jeton voyagent dans le corps.
3. ⚠️ **Croire que `/health` attrapera l'oubli.** Il attrape l'**absence** du réglage, jamais son
      contenu. Voir AC-5.
4. ⛔ **Oublier le chemin de base dans l'origine.** L'adaptateur concatène `<origine>/alias/{…}` :
      sans le segment de version, la requête n'atteint **aucune route** et la passerelle répond à la
      place de l'application, par un `403` qui parle de **signature AWS** — un message qui n'évoque
      ni le chemin ni l'authentification attendue, et qui envoie chercher au mauvais endroit. C'est
      un réglage, pas du code, mais c'est le premier mur qu'on rencontre.
5. ⚠️ **Compter la clé parmi les secrets d'organisation.** Elle n'en est pas un : elle ne désigne
      aucune destination et n'ouvre aucun compte. La sceller en base, dans le coffre de STORY-243,
      serait la ranger avec des données qui n'ont ni sa portée ni son cycle de vie.

## Ce que la story ne fait pas

- ⛔ **Le chiffrement mutuel de production.** Le bac à sable expose un point d'entrée qui le
      **désactive** — ce que l'hôte du simulateur annonce dans son nom — et le jeton obtenu le
      confirme : sa revendication de confirmation par certificat est **vide**, il n'est lié à aucun
      certificat. La production l'exigera, avec un certificat délivré par l'autorité de la banque
      centrale et des jetons liés à ce certificat : le dernier critère de STORY-600 le nomme déjà
      comme **déclencheur du passage en production**. C'est un développement distinct — l'appel part
      aujourd'hui par un `fetch` sans agent TLS — et il n'a pas sa place dans une story de deux
      points.

## Notes

- Voir [[STORY-600]] (l'adaptateur), [[STORY-599]] (la destination en triplet), [[STORY-243]] (le
  coffre et le type `Secret`), [[STORY-246]] (la clé de l'organisation, jamais de la plateforme, et
  la garde anti-condition d'environnement), [[STORY-249]] (l'indicateur de santé qui n'est pas une
  sonde), [[STORY-603]] (une donnée ne peut rien autoriser).
- ⚠️ **STORY-599 à STORY-603 n'ont aucune fiche dans `stories/`** : elles ne vivent que dans
  `epics-paiement-2026-08-03.md`, alors que le code livré les cite. Constaté le 2026-09-09, hors
  périmètre de cette story, mais à trancher — un identifiant sans fiche ne se relit pas.
