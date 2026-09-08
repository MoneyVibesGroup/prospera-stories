# STORY-581 : État lu / non lu, compteur et fil d'activité — le hook inerte de STORY-304 cesse de l'être

Status: done

**Épic :** EPIC-057 — Le canal in-app 🏁
**Service :** `notification-service`
**Points :** 2 · **Sprint :** S42
**Prérequis :** **STORY-580** (adaptateur in-app)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-12.

---

## Le fait

⚡ **Ceci débloque un hook qui dort depuis le 2026-08-20.** STORY-304 a tranché l'option (b) — fil
d'activité `GET /activite` réservé à l'admin, plus un compteur de non-lus — en notant explicitement
que « la notification poussée viendra quand le service existera ». Le service existe à partir d'ici.

## Critères d'acceptation

- [x] AC-1 — L'état lu / non lu est **écrit par ce service**, et il fait passer l'`Envoi` de
      `delivre` à `lu` avec `niveauCertitude = confirmé`.
- [x] AC-2 — Compteur de non-lus par utilisateur, et fil d'activité paginé.
- [x] AC-3 — ⚠️ **Le désabonnement de masse ne s'applique pas à l'in-app** : ce sont des alertes
      applicatives, de nature transactionnelle (AD-12). Un test le prouve — un utilisateur désabonné
      d'une nature `MASSE` continue de recevoir sa cloche.
- [x] AC-4 — ⚠️ **Ne jamais rendre un `userId` brut** : la console ne sait pas le résoudre (leçon
      STORY-294). Le fil rend un libellé résolu depuis le read-model d'identité.

## Notes

🏁 Clôt EPIC-057.


---

## Livraison — 2026-09-05, branche `MNV-581` sur `MNV-580`

1 556 tests unitaires (123 suites) + 106 e2e ; couverture 99,18 / 91,84 / 96,81 / 99,20.
Trois surfaces : `GET /cloche` et `GET /cloche/compteur` (ma boîte), `POST /cloche/:id/lu`
(l'ouverture), `GET /activite` (le fil de l'organisation, derrière
`notification:journal:consulter`).

**⚡ Ouvrir une cloche est une OBSERVATION, exactement comme un accusé de passerelle.**
C'est la décision qui tient toute la story : la lecture passe par `projeterStatut`
— `max(états observés)` — et non par un `$set` direct. Sans elle, ouvrir une cloche
dont l'`Envoi` a échoué l'aurait **ressuscité** : `echoue` est un état absorbant
(STORY-579), et un `$set` ne le sait pas. La certitude, elle, est **lue du
catalogue du canal** (`CAPACITES_IN_APP`), jamais écrite en dur — AD-5 s'applique
au canal qui observe lui-même comme à celui qui se fait rapporter.

**⚡ L'exemption d'AD-12 se DÉRIVE, elle ne se liste pas.** Écrire « sauf l'in-app »
aurait été une liste de noms de canaux dans le noyau, à retrouver au sixième canal.
La vraie raison est structurelle : le registre de consentement est keyé sur un
**identifiant de canal normalisé** (AD-11), et un utilisateur d'IdP n'en a pas. Le
désabonnement de masse ne s'applique pas à la cloche parce qu'il **n'a rien à quoi
s'appliquer**. `porteesOpposables(nature, canal)` porte cette dérivation, elle est
appelée à **chaque** demande, et c'est elle qui tiendra la règle le jour où
l'exécution d'un `EnvoiDeMasse` (EPIC-061) l'appellera avec `MASSE` — plutôt que le
jour où quelqu'un se souviendra de l'exception.

**Ce qui a changé par rapport à la fiche, et pourquoi :**

- ⚠️ **AC-1 dit « de `delivre` à `lu` » ; l'`Envoi` d'une cloche est en fait à
  `envoye`.** Aucun émetteur d'accusé de délivrance n'existe pour un canal **sans
  passerelle** — la capacité reste déclarée parce que le catalogue décrit le CANAL,
  pas l'état d'avancement du code (convention de STORY-577). AD-4 admet
  explicitement `envoye → lu` et corrige FR-N36 sur ce point précis. La projection
  couvre les deux départs, et les deux sont testés.

- ⚡ **Le fil est ADMIN, la boîte ne l'est pas — et c'est ce qui donne son sens à
  AC-4.** Les trois routes de la cloche ne portent **aucun droit** : exiger l'un des
  cinq de FR-N53 aurait fait de la boîte de réception une fonction
  d'administrateur, c'est-à-dire un canal que son destinataire ne pourrait pas
  ouvrir. Le fil, lui, montre les cloches **des autres** : c'est là qu'un `userId`
  brut serait sorti, et c'est là qu'AC-4 mord.

- ⛔ **Le fil ne montre NI objet NI corps.** Il répond à « à qui avons-nous parlé,
  et l'ont-ils lu » — la question de D12 — jamais à « qu'avons-nous dit ». Une
  administratrice qui lirait dans ce fil les alertes de ses collaborateurs ouvrirait
  leur boîte, et la cloche cesserait d'être un canal pour devenir une surveillance.
  Le journal des envois tient la même ligne pour la même raison (AD-15).

- ⚡ **Troisième publieur `notification.*`, et le premier dont le fait n'est pas
  rapporté par un tiers.** L'inventaire de STORY-579 l'a exigé explicitement, en
  revue : `cloche.service.ts` publie `notification.envoi.lu` **dans la transaction**
  qui marque la lecture. Le contrat existant convenait sans modification.

- ⚠️ **`PORTEES_DESABONNEMENT` a quitté le schéma pour le domaine.** Ce sont deux
  régimes de consentement, pas deux valeurs d'une colonne — et la règle ne pouvait
  pas importer Mongoose pour connaître son propre vocabulaire.

- ⚠️ **La garde d'inertie de STORY-580 sur `luLe` a été SUPPRIMÉE, pas assouplie.**
  Elle a fait son travail : elle avait un écrivain à trouver, il existe. Ce qui reste
  testé est ce qui reste vrai — **l'adaptateur** ne pose jamais `luLe`, sans quoi une
  cloche naîtrait lue.

- ⛔ **`@Type(() => Boolean)` était un piège, et il ne se voyait pas.**
  `Boolean('false')` vaut `true` : `?nonLusSeulement=false` aurait filtré comme
  `=true`, et l'écran aurait affiché une boîte vide sans qu'aucune erreur ne sorte.
  La conversion est explicite et n'accepte que les deux mots que le client peut
  écrire ; tout autre est **refusé**, jamais interprété.

**Écarts assumés :**

- ⛔ **Rien ne produit `delivre` sur l'in-app**, alors que `accuseDelivrance` est
  déclaré. C'est cohérent avec la convention du catalogue et sans effet sur AC-1,
  mais un `Envoi` in-app ne verra jamais cet état tant qu'EPIC-063/064 n'auront pas
  décidé si une remise sans passerelle vaut délivrance.
- ⚠️ **Aucun test de conformité sur infrastructure réelle** : les deux collections
  vivent sur la **même** connexion Mongoose, donc le piège du `MongoClient` de
  STORY-579 ne se pose pas ici, et l'index partiel des non-lus est créé par Mongoose.
- ⛔ **La branche est posée sur `MNV-580`, non fusionnée** — un `rebase --onto`
  suivra sa fusion, comme pour STORY-580 sur `MNV-579`.
