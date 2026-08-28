# STORY-560 : AD-13 est amendé — un coffre-fort de secrets de canal, adossé au mandat écrit du client

Status: ready-for-dev

**Épic :** EPIC-027 — Natures d'accès et habilitations graduées
**Service :** `fiscal-service` (`:3012`) — socle
**Points :** 8 · **Sprint :** S29
**Origine :** **décision PO du 2026-08-28** — le dépôt automatisé est retenu. Le coffre-fort passe
donc du « pas sur le chemin critique » au **prérequis**.
**Débloque :** **STORY-561** (le connecteur). Sans cette story, le connecteur n'a rien pour
s'authentifier.
**Réf. :** **AD-13** *(amendé ici)* · **NFR-F05** · **FR-F02** · **STORY-301** (attestation de
mandat, EPIC-043, S20) · addendum PRD fiscalité §coffre-fort

---

## ⛔ Cette story amende la colonne vertébrale — ce n'est pas une évolution de configuration

**AD-13, tel qu'il est écrit aujourd'hui :**

> **Rule:** en v1, aucun identifiant ni mot de passe de portail administratif n'entre dans le
> service, sous aucune forme, y compris en champ libre. **L'introduction d'un coffre-fort est un
> amendement de cette colonne vertébrale, pas une évolution de configuration.**

⇒ La spine **prévoyait ce jour** et exigeait qu'il soit acté comme tel. **C'est ce que fait cette
story** : AD-13 devient *« aucun secret n'entre hors du coffre-fort, et aucun ne sort en clair »*.

⚡ **AD-12, lui, n'a pas besoin d'être amendé** — il avait déjà tranché : *« le dépôt assisté et un
futur connecteur automatisé sont **deux implémentations du même port** »*. L'architecture attendait
le connecteur ; elle n'attendait pas les secrets.

## Ce que NFR-F05 exige, et qui n'est pas négociable

> Chiffrement fort, rotation, MFA, séparation des rôles, journalisation de chaque accès, **et sans
> que le collaborateur ait à connaître le secret**.

La dernière clause est la plus structurante : **le collaborateur du cabinet ne voit jamais le mot
de passe du client**. Elle interdit l'implémentation naïve (« un champ mot de passe dans la fiche
dossier ») et impose que le secret soit **déposé par son propriétaire** et **utilisé sans être
lu**.

## Le mandat : ce qui rend l'acte légitime

⛔ **Un connecteur qui agit avec les identifiants d'un client sans mandat écrit n'est pas un
produit, c'est un risque.** `FR-F57` / **STORY-301** ont déjà livré l'**attestation de mandat à la
création du dossier** — cette story s'y adosse plutôt que d'inventer un second consentement.

Le mandat doit être **spécifique** : « déposer en mon nom sur GUDEF » n'est pas couvert par une
lettre de mission générale. Il porte le canal, la portée, et la date.

## Périmètre

**Inclus**

- Un **coffre-fort dédié** : secrets chiffrés au repos avec une clé qui ne vit pas dans la base,
  scopés `{orgId, dossierId, canal}`, jamais globaux.
- **Le secret ne sort jamais en clair vers la couche applicative.** Le connecteur reçoit un
  **jeton d'usage à durée courte**, à usage unique, lié à un dépôt identifié. ⚡ C'est ce qui rend
  une fuite de logs ou de dump mémoire non exploitable.
- **Dépôt du secret par son propriétaire.** Le client saisit ses identifiants dans un formulaire
  qui écrit **directement** au coffre ; le collaborateur voit un état (« déposé », « expiré »,
  « révoqué »), jamais une valeur.
- **Révocation immédiate et souveraine.** Le client révoque : les secrets sont détruits, les
  dépôts en cours s'arrêtent, et le canal retombe sur le **dépôt assisté** (STORY-332/333). ⚡ La
  révocation ne casse jamais la capacité à déclarer — elle change seulement le chemin.
- **Rotation** : un secret porte une date d'expiration ; l'échéance approchant, elle est signalée
  **avant** qu'un dépôt échoue, pas après.
- **Journalisation de chaque accès** au journal d'audit existant (AD-10, AD-19) : qui, quand, pour
  quel dépôt, avec quel résultat. ⛔ **Jamais la valeur**, jamais un fragment.
- **Le mandat est vérifié à chaque usage**, pas à l'enregistrement. Un mandat expiré ou révoqué
  bloque l'usage même si le secret est valide.

**Hors périmètre**

- Le connecteur lui-même : **STORY-561**.
- Stocker un **facteur MFA**. ⛔ Interdit, et pas seulement par prudence : un second facteur qu'on
  stocke n'est plus un second facteur. Le traitement du MFA est un sujet du connecteur, et sa
  réponse y est un **relais vers l'humain**, jamais un contournement.
- Un coffre partagé entre organisations, ou un secret « du cabinet » utilisable sur plusieurs
  dossiers. L'isolation est absolue (NFR-F06).

## Critères d'acceptation

1. Un secret déposé n'est **jamais lisible** par une route, un log, un export ou une réponse
   d'erreur. Témoin : une recherche de la valeur dans les logs d'un dépôt complet ne la trouve pas.
2. Le collaborateur du cabinet peut **déclencher** un dépôt sans jamais pouvoir **lire** le secret.
3. Un jeton d'usage est **à usage unique** et expire ; le rejouer est refusé.
4. Une révocation détruit le secret, interrompt les dépôts en cours, et le canal **bascule sur le
   dépôt assisté** — témoin exécutable : déclarer reste possible après révocation.
5. Un mandat absent, expiré ou révoqué **refuse l'usage** avec un code publié, même avec un secret
   valide.
6. Chaque accès est journalisé avec son dépôt de rattachement ; **aucune entrée ne contient la
   valeur ni un fragment**.
7. L'expiration d'un secret est signalée **avant** l'échéance, avec le délai restant.
8. **Non-régression AD-13** : hors de ce coffre, aucun chemin n'accepte un identifiant de portail —
   y compris les champs libres, les notes de dossier et les pièces jointes. Une garde le vérifie.

## Notes

- ⚠️ **Cette story ouvre la surface de compromission que AD-13 protégeait.** C'est assumé et
  décidé ; ce qui ne l'est pas, c'est de l'ouvrir plus large que nécessaire. Chaque critère
  ci-dessus réduit la surface : scope étroit, jeton court, valeur jamais lue, révocation
  souveraine, journal sans secret.
- ⚡ **La revue de sécurité de cette story n'est pas optionnelle.** C'est le premier composant du
  produit qui détient des identifiants d'un tiers vers un système d'État.
- ⚠️ **Mettre à jour la spine et le tracker.** AD-13 est amendé, NFR-F05 passe de « aucun secret
  n'est stocké en v1 » à ses exigences de mise en œuvre. Un document d'architecture périmé
  **encode l'ancienne vérité et la garde active** — ce dépôt l'a déjà payé quatre fois.
