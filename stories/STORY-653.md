# STORY-653 : Le corps de la demande de paiement — un commentaire qui doutait n'est pas une garde, et le refus nommait le contrat du voisin

Status: done

**Épic :** EPIC-036 — Fournisseurs de paiement interchangeables et simultanés
**Service :** `paiement-service`
**Points :** 3 · **Sprint :** ⚠️ **NON SLOTTÉE** — elle débloque le premier encaissement réel sur le schéma.
**Prérequis :** **STORY-600** (l'adaptateur), **STORY-652** (la clé d'API, sans laquelle aucun appel n'atteignait la couche métier)
**Origine :** essai réel contre le simulateur de la BCEAO le **2026-09-09**, une fois la clé d'API posée. Le premier appel qui franchit les deux portes est celui qui a montré le défaut.

---

## Le fait

`POST /demandes-paiements` refusait le corps que l'adaptateur envoie. Tant que la clé d'API
manquait, la passerelle refusait avant l'application : **le défaut était caché derrière un autre
défaut.**

⛔⛔ **ET STORY-600 LE SAVAIT.** Son code portait, en toutes lettres, ce commentaire :

> ⚠️ **`montant` : nom à confirmer sur le bac à sable.** Les deux points de terminaison frères — la
> demande en masse et le paiement envoyé — le nomment ainsi ; les filtres de la liste parlent, eux,
> de `montantAchat` et de `montantRetrait`. La page de la demande unitaire n'expose pas son corps.

Un doute honnête, écrit à l'endroit exact où il se poserait. Et il est resté un **commentaire**.
⚡ **Un commentaire qui doute ne rougit jamais** : ni les 3 265 tests unitaires ni les 252 recettes
de bout en bout ne pouvaient le trancher, parce que tous parlent à un double qui accepte ce qu'on
lui donne. **Seul un appel réel est une garde sur le contrat d'un tiers.**

⚡⚡ **LE REFUS DU SCHÉMA NOMMAIT LES CHAMPS DU CONTRAT VOISIN, ET C'EST LE VRAI PIÈGE.** Le point de
terminaison valide en `anyOf` sur plusieurs formes. Une erreur sous `anyOf` énumère les exigences
**non satisfaites de chaque branche**, donc elle décrit **plusieurs contrats à la fois**. Le premier
refus réclamait `montantAchat`, `montantRetrait`, `debitDiffere` et `dateLimitePaiement` — et trois
de ces quatre champs n'ont **rien à faire** dans notre corps. Lu comme un contrat unique, il
conduisait tout droit à réécrire le corps sur la mauvaise branche, c'est-à-dire à transformer une
demande de paiement de facture en achat par carte. **La lecture juste se fait par soustraction** :
on fixe une hypothèse, on rejoue, et on regarde quelles exigences **disparaissent**.

⚡⚡ **ET LE DÉFAUT N'ÉTAIT PAS CELUI QUE LE COMMENTAIRE CRAIGNAIT.** `montant` était le bon nom, et
`categorie: '401'` la bonne valeur. Le contrat réel, établi en faisant varier une seule chose à la
fois, est une **exclusion mutuelle** :

| `categorie` | `dateLimitePaiement` | verdict du schéma |
| --- | --- | --- |
| `401` — facture | **présente** | valide |
| `401` | absente | refusé |
| `500`, `521` | absente | valide |
| `500`, `521` | présente | refusé |

⛔ **La date limite était donc FACULTATIVE dans notre code, et obligatoire dans le contrat.** Une
créance sans date de validité produisait un corps qui ne satisfaisait aucune branche. Le canal
fonctionnait exactement pour les créances qui portent un terme, et échouait pour les autres — le
genre de défaut qui se découvre en production, sur la moitié des cas.

⚠️ **Un second piège, de la même famille : `motif` est FACULTATIF, mais en dessous de deux
caractères il invalide la requête ENTIÈRE.** Un champ dont l'absence est acceptée et dont une valeur
courte fait échouer l'encaissement. On l'omet plutôt que de le laisser tout casser.

## Critères d'acceptation

- [x] AC-1 — La fin de validité est **obligatoire** dans le corps, et son absence est refusée
      **avant tout appel sortant**, devant l'organisation qui peut corriger — même forme et même
      raison que l'adresse du payeur (STORY-600). ⛔ **Aucun terme par défaut n'est inventé** : une
      date fabriquée par l'adaptateur deviendrait la promesse faite au payeur, décidée par un code
      qui ne sait rien de la créance.
- [x] AC-2 — Un libellé plus court que la longueur minimale du schéma est **omis**, jamais tronqué
      ni complété, et il ne fait **pas** échouer l'encaissement. Deux tests bornent la règle de part
      et d'autre du seuil.
- [x] AC-3 — ⛔⛔ **UN `400` SUR NOTRE PROPRE CORPS N'EST PAS UN REFUS MÉTIER.** Jusqu'ici tout
      statut non favorable devenait `FOURNISSEUR_A_REFUSE`, dont le message envoie l'exploitant
      chercher une cause **chez le payeur ou chez le participant**. Or un `400` de validation dit que
      **notre requête est malformée** : le seul remède est une livraison. Cinquième code,
      `APPEL_NON_CONFORME`, qui **ne se réessaie pas** et qui laisse le fournisseur **disponible** —
      un schéma capable d'énumérer nos champs fautifs est un schéma joignable, dont le jeton et la
      clé ont été acceptés.
- [x] AC-4 — L'échec nomme les **champs cités** par le schéma, et **rien de leurs valeurs** : le
      corps porte l'alias, qui **est** le secret scellé du compte (STORY-243). Un corps illisible
      lève quand même l'échec — le diagnostic est un bonus, jamais une condition.
- [x] AC-5 — **Non-régression** : la garde anti-condition d'environnement de STORY-246 s'applique
      sans être assouplie, et l'adaptateur FedaPay est inchangé.

## Ce qui sera facile à rater

1. ⛔⛔ **Réécrire le corps sur la branche `montantAchat` / `montantRetrait` / `debitDiffere`.**
      C'est ce que le premier message d'erreur suggère, et c'est faux : ces champs décrivent un
      achat ou un retrait d'espèces, pas la demande de paiement d'une facture.
2. ⛔ **Inventer une date limite quand la créance n'en a pas.** Elle deviendrait la promesse faite
      au payeur. Le refus est la seule réponse honnête, et il se pose devant celui qui peut corriger.
3. ⚠️ **Croire qu'un test de plus aurait suffi.** Aucun double ne connaît le contrat d'un tiers. Ce
      qui manquait n'était pas une assertion, c'était **un appel**.
4. ⛔ **Faire remonter le corps du refus dans le journal pour « pouvoir déboguer ».** Le corps porte
      l'alias, secret scellé du compte. On consigne les **noms** de champs, jamais leurs valeurs.
5. ⚠️ **Traiter le `400` comme réessayable.** Une requête malformée le restera à l'identique : la
      rejouer occupe le participant et retarde le remède.

## Ce qui reste ouvert

- ⛔⛔ **LE BAC À SABLE N'EST PAS PROVISIONNÉ, ET CE N'EST PAS UN DÉFAUT DE CODE.** La route de
      création d'alias est `POST /comptes/{numero}/alias` avec `{"type":"SHID"}` (documentation
      reçue le 2026-09-09). Elle **existe et fonctionne** sur notre hôte : un `type` inconnu y rend
      un `400` en nommant `/type`. Mais **le compte que `GET /comptes` nous rend est inconnu du
      service des alias** : `404 « Le compte 44511072980305975922 n'existe pas »`, avec un jeton
      portant TOUTES les portées, sur le même hôte et à la seconde près. Le même `404` répond pour
      le compte d'exemple de la documentation. **Deux services du même hôte ne voient donc pas le
      même référentiel de comptes**, et aucune route ne permet d'en déclarer un : ni `POST /comptes`,
      ni `/clients`, ni `/participants`, ni `/business` n'existent. Le déblocage appartient au
      participant, pas à ce dépôt.
      ⚠️ **L'hôte de la documentation, lui, exige le mTLS** : `sandbox.api.pi-bceao.com` ferme la
      connexion sans certificat client. C'est bien `no-mtls.piz.simulateurs.pi-bceao.com` qu'il faut
      utiliser — et c'est aussi la preuve que le mTLS de production est un développement réel, pas
      une case à cocher.
      En l'état, le corps corrigé franchit la validation du schéma et échoue proprement sur
      `Alias … non trouvé` — ce qui prouve la FORME, pas le bout en bout.
- ⚠️ **Aucun cas d'usage ne construit encore de demande d'initiation** : le port existe, les
      adaptateurs l'implémentent, et rien ne l'appelle. Le refus d'AC-1 est donc aujourd'hui une
      garde sans appelant — elle protège la story qui câblera l'émission.

## Notes

- Voir [[STORY-600]] (l'adaptateur et le doute qu'il portait), [[STORY-652]] (la clé d'API),
  [[STORY-243]] (l'alias est le secret scellé du compte), [[STORY-246]] (ce qui sort d'un échec de
  fournisseur), [[STORY-249]] (la santé lit ces codes), [[STORY-599]] (la destination en triplet).
- ⚡ **Fait glané à l'essai réel** : `GET /comptes` rend le compte du client business enrôlé —
  numéro, type, date d'ouverture, statut. C'est la source du `numeroDeCompte` de la destination, et
  elle évite de le saisir à la main.
- ⚡ **Trois gardes ont rougi et avaient raison**, dont celle de la santé qui annonçait mot pour mot
  ce qui allait arriver : *« sans cette assertion, un cinquième code ajouté demain tomberait dans
  indisponible par défaut sans que personne ne l'ait décidé »*. Une quatrième s'est **corrigée** :
  elle affirmait qu'une requête malformée « demande une correction, **donc** a refusé », et son
  propre libellé portait la contradiction.
