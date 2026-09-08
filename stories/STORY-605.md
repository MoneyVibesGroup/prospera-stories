# STORY-605 : Repli de plateforme nommé, et ce que le repli change pour le destinataire

Status: done

**Épic :** EPIC-054 — Permissions au catalogue et cloisonnement des passerelles
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S34
**Prérequis :** **STORY-604** (résolution de la passerelle à la remise)
**Origine :** revue d'architecture du 2026-09-06 · FR-N54, AD-6.

---

## Le récit

En tant qu'**exploitant de la plateforme**, je veux que « aucune passerelle configurée » et
« passerelle en panne » se distinguent, afin qu'un client dont la clé a expiré ne se mette pas à
envoyer sous la marque de Prospera sans le savoir.

## Le fait

⚡ **Deux causes qui ne se soignent pas pareil ne peuvent pas porter le même code.** C'est la leçon
de `STORY-603`, appliquée ici. *Pas de configuration* se soigne en configurant, et le repli sur le
relais de plateforme est alors un service rendu. *Configuration refusée par la passerelle* se soigne
en renouvelant une clé — et s'y replier en silence ferait partir, sous la marque de Money Vibes, les
messages d'une organisation qui croit envoyer sous la sienne.

⛔ **Un repli silencieux sur le chemin d'une identité d'envoi est une usurpation involontaire.**
Money Vibes se retrouverait à signer les relances de recouvrement d'une microfinance, avec sa
réputation d'expéditeur et son domaine.

⚡ **Le repli est un FAIT écrit, pas une déduction.** Le journal de l'envoi doit dire quelle identité
a servi. Sans cela, la seule façon de savoir sous quelle marque un message est parti serait de
relire la configuration **d'aujourd'hui** — c'est-à-dire de réécrire l'histoire à chaque changement.

## Critères d'acceptation

- [x] AC-1 — **Absence de configuration** pour `(orgId, canal)` : la remise se fait par le relais de
      plateforme, et l'envoi porte l'identité effectivement utilisée dans son journal.
- [x] AC-2 — ⛔ **Une passerelle configurée qui refuse l'authentification ÉCHOUE.** Elle ne se replie
      pas. Test explicite.
- [x] AC-3 — Les deux situations portent **deux codes de refus distincts**, jamais fusionnés :
      l'un dit *rien n'est configuré*, l'autre dit *ce qui est configuré ne répond pas*.
- [x] AC-4 — Aucun de ces deux codes ne transporte le secret ni le texte de la passerelle
      (rappel `STORY-577`) : le **code**, jamais le message du relais.
- [x] AC-5 — La console de l'exploitant distingue les organisations qui **envoient sous la marque
      Prospera** de celles qui ont leur propre passerelle. C'est une lecture, aucune route
      d'écriture n'est ajoutée (borne de `STORY-597`).
- [x] AC-6 — Le repli est **désactivable par organisation** : une organisation peut exiger que ses
      messages ne partent **jamais** sous une autre identité que la sienne, quitte à ne pas partir.

## Notes

⚠️ **Point à trancher par le PO :** le défaut. Repli actif pour tout le monde, ou repli à demander ?
La story livre les deux comportements ; c'est la valeur par défaut qui est une décision commerciale.
Recommandation : **repli actif** tant que la verticale cabinet est en SaaS pur, où Prospera **est**
l'expéditeur légitime.

⚠️ Cette story ne crée aucun canal et ne touche à aucun adaptateur : elle vit entre la résolution de
`STORY-604` et le journal.


---

## Journal de livraison (2026-09-06) — branche `MNV-605`

**Livré :** 2 365 tests unitaires (191 suites), e2e complet, lint et build au vert.

### ⚡ Trois refus, trois remèdes — et c'est le nombre de remèdes qui a décidé du nombre de codes

| Situation | Code | Ce qu'on fait pour la réparer |
| --- | --- | --- |
| Aucune passerelle, repli **refusé** par l'organisation | `PASSERELLE_NON_CONFIGUREE` | en configurer une |
| Passerelle enregistrée mais **désactivée** | `PASSERELLE_DESACTIVEE` | la réactiver |
| Passerelle configurée, **authentification refusée** | `PASSERELLE_REFUSEE` | renouveler une clé |

La leçon de `paiement-service` STORY-603, appliquée telle quelle : *deux causes qui ne se
soignent pas pareil ne peuvent pas porter le même code*. Le troisième cas était le plus
masqué — une authentification refusée arrivait jusqu'ici en `REMISE_REFUSEE`, c'est-à-dire
« le relais a refusé **ce message** ». On aurait cherché une erreur de contenu pendant qu'une
clé expirée bloquait **tous** les envois du client.

### ⛔ AC-2 tenait déjà par la STRUCTURE — la story lui a donné un nom

Il n'existe aucun chemin de retour en arrière après la résolution : l'exécutant résout, puis
remet. Un échec de remise **remonte**, il ne se replie pas. La story n'a donc pas eu à
empêcher un repli ; elle a eu à rendre le refus **lisible**. ⚡ *Quand un invariant est déjà
tenu par la forme du code, ce qui reste à livrer est la façon de le dire.*

### ⚡ La politique de repli est de portée ORGANISATION, et pas `(orgId, canal)`

C'est le seul détail de modélisation qui pouvait tuer la story en silence. Le réglage décide
de ce qui se passe **quand aucune passerelle n'est configurée** : le ranger sur la
configuration de canal l'aurait rendu **inexprimable exactement dans le cas qu'il gouverne**.
Une organisation qui n'a jamais configuré le SMS n'a aucune ligne où écrire « et surtout,
n'envoyez pas de SMS sous votre marque ».

### ⚡ Le défaut vit dans l'ABSENCE de document

`repliPlateformeAutorise: true` recopié à la création de chaque organisation aurait figé une
décision **commerciale** au jour de l'inscription : changer le défaut de la plateforme
n'aurait alors plus rien changé pour personne. D'où aussi `explicite` dans la restitution —
« personne n'a rien dit » et « l'organisation a choisi » se soignent différemment, la
première invitant à poser la question au client.

⚡ Corollaire gratuit : l'effacement de la politique à la résiliation est **sans conséquence**.
Une organisation résiliée puis recréée retrouve le défaut de la plateforme, pas une décision
fantôme prise par quelqu'un d'autre.

### ⚠️ Une garde existante a réclamé une DÉCISION, comme elle l'avait déjà fait en STORY-597

`suppression-complete` (STORY-587) : toute collection portant un `organizationId` est effacée
à la résiliation **ou** conservée avec sa raison. Pas de troisième case. `politiques_identite_envoi`
est effacée.

### ⛔ AC-5 s'est heurté à l'invariant de STORY-597, et c'est l'invariant qui a gagné

`VuePlateformeService` **n'a aucun modèle opérationnel injecté** — c'est ce qui rend la
question « et si on relevait le filtre d'organisation ? » sans endroit où se poser. Répondre
« qui envoie sous la marque Prospera ? » en lisant `configurations_passerelles` lui aurait
rendu cet endroit.

⚡ **Le remède est meilleur que ce que la fiche demandait** : la ventilation se compte sur des
**faits**, pas sur la configuration du jour. Une organisation qui vient de brancher sa
passerelle a encore un mois d'envois partis sous notre marque, et c'est cela qu'un exploitant
doit voir. La configuration dit ce qui *arrivera* ; les compteurs disent ce qui *est parti*.

⚡ **Une sous-carte `parIdentite`, jamais une dimension de la CLÉ.** Ajouter `identiteEnvoi` à
l'index unique des compteurs aurait dédoublé toutes les cases et changé le sens des agrégats
de STORY-596, sur une collection déjà peuplée. `parStatut` avait déjà tranché la question :
une ventilation **secondaire** vit dans la ligne.

⛔ **Et la vue rend un COMPTE d'organisations, jamais leur liste** — borne de STORY-597 :
rendre *lesquelles* transformerait une mesure commerciale en cartographie de la clientèle.
Savoir **qui** est une question de locataire ; elle se pose dans la console du locataire.

### ⛔⛔ Deux pièges qu'aucun test de comportement n'aurait vus

1. **`$group` n'accepte que des accumulateurs PLATS.** La forme naturelle
   `{ organisationsParIdentite: { PLATEFORME: { $sum: … } } }` lève « unknown group operator »
   **à l'exécution** — et les tests unitaires de ce service parlent à un double de collection
   qui n'interprète aucun pipeline. ⚡ *Un pipeline d'agrégation éprouvé contre un double n'est
   pas éprouvé.* Remède : les comptes sortent à plat (`organisations_<IDENTITE>`), la carte se
   réassemble en JavaScript, et un test vérifie **structurellement** que chaque accumulateur du
   `$group` est un opérateur unique préfixé de `$`.
2. **Une route littérale déclarée APRÈS une route paramétrée est morte.**
   `GET /passerelles/politique` serait entré dans `@Get(':canal')` et se serait fait refuser en
   `CANAL_INCONNU`, avec un `400` que rien n'explique. L'ordre de déclaration est la seule chose
   qui la rend atteignable ; un test e2e le vérifie, parce que la faute se réintroduit au
   premier réordonnancement de fichier.

### ⚠️ Et un troisième, plus discret

Les accumulateurs sont **dérivés de `IDENTITES_ENVOI`**, jamais recopiés. Deux littéraux
écrits à la main auraient rendu la console muette sur une troisième identité ajoutée au port —
sans erreur, sans test rouge, avec des nombres qui restent plausibles.

### Ce que la story ne fait pas

- ⛔ **Rien ne vérifie qu'une passerelle enregistrée fonctionne** : `PASSERELLE_REFUSEE` se
  découvre encore sur le premier message d'un client. C'est **STORY-614**.
- ⚠️ **L'expéditeur déclaré n'est toujours pas vérifié** : sur le relais partagé, une
  organisation peut encore écrire l'adresse d'une banque. C'est **STORY-615**.
- ⚠️ **La ventilation par identité démarre vide** : aucune reprise n'est prévue, et elle
  exigerait de relire la collection des envois — c'est-à-dire d'écrire une fois le chemin que
  STORY-597 ferme.
