# STORY-561 : Le connecteur de dépôt automatisé — un adaptateur de plus derrière le port AD-12, déclaré par pays, et qui retombe sur l'assisté quand il n'est pas déclaré

Status: ready-for-dev

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service` (`:3012`) — adaptateur de canal
**Points :** 13 · **Sprint :** S29
**Origine :** **décision PO du 2026-08-28** — *« on va le faire avec un système d'automatisation…
le but est, pour chaque pays, si on remplit les liens sur lesquels on va déposer et récupérer ou
suivre le parcours pour la déclaration, on doit pouvoir le faire avec une automatisation ; mais si
elle n'est pas enregistrée, alors on garde la structure actuelle. »*
**Prérequis :** **STORY-560** (coffre-fort + mandat) · **STORY-330** (port de canal) ·
**STORY-331** (canal décrit comme donnée) · **STORY-558** (gabarit du livrable)
**Réf. :** **AD-12** · PRD fiscalité §3.2 *(la réserve qui est ici levée)*

---

## La décision, et ce qu'elle change exactement

Le PRD fiscalité §3.2 posait la réserve :

> Aucun des portails de la zone n'expose d'API publique documentée. Un dépôt « automatisé »
> signifierait piloter un navigateur sur un système tiers avec les identifiants d'un client —
> fragile et exposé du point de vue des conditions d'utilisation.

⇒ **Le PO lève la réserve et retient le connecteur.** Les deux risques ne disparaissent pas pour
autant : ils deviennent des **exigences de conception**, portées par les critères d'acceptation
ci-dessous — la fragilité par le repli, l'exposition par le mandat de **STORY-560**.

⚡⚡ **Et l'architecture n'a pas à changer.** **AD-12** l'avait écrit avant qu'on le demande :

> Le dépôt assisté et un futur connecteur automatisé sont **deux implémentations du même port**.
> […] Le port est **asynchrone par nature**. Déposer rend un identifiant de dépôt ; l'accusé arrive
> comme un **fait séparé**. […] **un connecteur automatisé produira simplement ce fait
> immédiatement.**

⇒ **Cette story n'ouvre pas un chemin parallèle : elle branche un second adaptateur là où un seul
était branché.** C'est ce qui rend le repli gratuit.

## Le repli, qui est le cœur de la demande

> *« si elle n'est pas enregistrée, alors on garde la structure actuelle »*

**Le connecteur est une propriété déclarée du canal, pas un mode du produit.**

| État du canal pour un pays | Chemin emprunté |
|---|---|
| Aucun connecteur déclaré | **Dépôt assisté** — STORY-332 (guidage) + STORY-333 (accusé saisi) |
| Connecteur déclaré, secrets absents ou mandat manquant | **Dépôt assisté**, avec la raison affichée |
| Connecteur déclaré et utilisable | **Dépôt automatisé**, accusé récupéré (STORY-562) |
| Connecteur déclaré mais **en échec** | **Dépôt assisté**, avec le point d'arrêt atteint |

⛔ **Il n'existe aucun état où déclarer devient impossible.** C'est la propriété qui décide de tout
le reste : le connecteur est un **accélérateur**, jamais un point de passage obligé.

## Ce que « remplir les liens » veut dire, en donnée

Le connecteur prolonge **STORY-331** — *« décrire un nouveau canal sans livrer de code »* — avec un
bloc `automatisation`, dans le paquet **pays**, versionné et checksummé :

- l'**adresse** du portail et de ses écrans (dépôt, suivi, accusé) ;
- le **parcours** — la suite ordonnée d'étapes, chacune nommant ce qu'elle attend et ce qu'elle
  produit ;
- la **correspondance champ ↔ donnée**, adressée par code de poste, jamais par coordonnée en dur ;
- les **marqueurs de fin** : à quoi se reconnaît un dépôt accepté, un rejet, une session expirée ;
- le **point de reprise humaine** : l'étape où le connecteur s'arrête et rend la main.

⇒ **Un second pays ne coûte que ce bloc.** Aucun nom de portail, aucune adresse, aucun sélecteur
n'entre dans le code — c'est déjà la règle d'AD-12 pour le domaine, étendue ici à l'adaptateur.

## Périmètre

**Inclus**

- L'adaptateur de canal automatisé, derrière le port de **STORY-330**, sélectionné par la présence
  du bloc `automatisation` au paquet.
- **Le MFA n'est jamais contourné.** Quand le portail demande un second facteur, le connecteur
  **s'arrête et rend la main** à l'humain, sur l'étape exacte, sans perdre l'avancement. ⛔ Aucun
  facteur n'est stocké, deviné ou rejoué (STORY-560, hors périmètre du coffre par décision).
- **Idempotence.** Un dépôt engagé porte un identifiant ; un rejeu ne dépose jamais deux fois. ⚠️
  Un double dépôt à l'administration n'est pas une gêne technique — c'est une déclaration en
  double, avec ses conséquences.
- **Détection de dérive.** Le parcours déclaré ne correspond plus au portail → le connecteur
  **s'arrête, le dit, et bascule sur l'assisté**. ⛔ Il ne devine jamais l'écran suivant : un
  connecteur qui improvise sur un système d'État est le scénario à interdire.
- **Journalisation intégrale** au journal d'audit (AD-10/AD-19) : chaque étape, son horodatage,
  son issue. Le cabinet doit pouvoir reconstituer ce que le produit a fait **en son nom**.
- **Rythme respectueux** : un délai déclaré entre actions, un plafond de tentatives, pas de
  reprise en boucle sur un échec.
- Le **conditions d'utilisation du portail** portées comme **donnée du paquet** — texte et date de
  relevé — et affichées au cabinet **avant** l'activation du connecteur pour ce pays. ⚡ C'est le
  seul traitement honnête du risque juridique : le produit ne tranche pas à la place du cabinet,
  il l'informe et enregistre son choix.

**Hors périmètre**

- Le suivi du parcours après dépôt et la récupération de l'accusé : **STORY-562**.
- Déclarer un connecteur pour un pays autre que le Togo. Le mécanisme le permet ; l'instancier
  demande le parcours réel, relevé sur le portail.
- Toute forme de contournement d'un contrôle anti-robot. ⛔ **Si le portail en pose un, le
  connecteur s'arrête et rend la main** — c'est un point de reprise humaine de plus, pas un
  problème à résoudre.

## Critères d'acceptation

1. **Aucun connecteur déclaré → le dépôt assisté fonctionne à l'identique.** Témoin de
   non-régression sur STORY-332/333, exécuté sans le bloc `automatisation`.
2. Connecteur déclaré mais secrets absents, mandat manquant ou expiré → **repli assisté**, avec la
   raison nommée à l'écran.
3. Échec en cours de parcours → **repli assisté à l'étape atteinte**, l'avancement conservé.
   ⛔ Jamais un échec muet, jamais une reprise depuis le début sans le dire.
4. Demande de MFA → arrêt et **passation à l'humain**, sur l'étape exacte.
5. Rejeu d'un dépôt déjà engagé → **aucun second dépôt**, l'identifiant existant est rendu.
6. Le domaine reste **agnostique** : aucun nom de pays, de portail, d'adresse ni de sélecteur dans
   le code ; une recherche le prouve (garde AD-12 déjà en place, étendue à l'adaptateur).
7. Un parcours déclaré incomplet → refus **nommant l'étape et le champ manquants** (patron 331).
8. Le journal d'audit permet de reconstituer un dépôt automatisé **de bout en bout**, sans jamais
   contenir de secret.
9. Les conditions d'utilisation du pays sont **affichées et acceptées** avant la première
   activation ; l'acceptation est datée et attribuée.

## Notes

- ⚡ **Ce que le repli achète vraiment.** Un connecteur casse le jour où le portail change une
  page — c'est certain, pas probable. Un produit qui n'a que le chemin automatisé tombe ce jour-là
  avec toutes ses échéances. Un produit qui retombe sur l'assisté **perd de la vitesse, jamais la
  capacité de déclarer**. La demande du PO — *« si elle n'est pas enregistrée, on garde la
  structure actuelle »* — décrit exactement cette propriété.
- ⚠️ **La fragilité se mesure.** Le taux de dépôts qui retombent sur l'assisté est l'indicateur de
  santé du connecteur, et il doit être visible du cabinet — pas seulement de l'équipe.
- ⛔ **Le produit ne détient toujours pas le dernier maillon.** Même automatisé, le dépôt dépend
  d'un système tiers dont il ne maîtrise ni la disponibilité ni les évolutions. Le PRD en tirait
  une conséquence sur la façon de mesurer le succès (§10) : elle **reste vraie**.
