# STORY-710 : SPF et DKIM du domaine d'envoi — prouver que le courriel arrivera

Status: done

**Épic :** EPIC-054 — Permissions au catalogue et cloisonnement des passerelles
**Service :** `notification-service`
**Points :** 5 · **Sprint :** rail F, bloc F3
**Prérequis :** **STORY-615** (domaine attesté par le DNS), **STORY-709** (revérification)
**Origine :** rail F.

---

## Le récit

En tant qu'**organisation cliente**, je veux savoir, avant ma première campagne, si les messages
envoyés sous mon domaine seront acceptés par les boîtes de réception — et quoi publier sinon.

## Le fait

⛔ **Prouver qu'on contrôle un domaine ne garantit pas que le courriel arrive.** STORY-615 atteste la
**propriété** (un TXT `_prospera-verification`). Mais un domaine dont le SPF n'autorise pas le relais
qui envoie, ou qui ne publie pas la clé DKIM de la signature, voit ses messages classés indésirables ou
rejetés par DMARC — et l'organisation l'apprend par ses clients.

⚡ **Une question au DNS, comme STORY-615, et du domaine pur pour la règle** : ce que doit contenir
l'enregistrement est une fonction sans E/S ; aller le chercher est le travail de l'adaptateur.

## Critères d'acceptation

- [x] AC-1 — Pour un domaine revendiqué, le service dit **ce qu'il faut publier** : le mécanisme SPF à
      ajouter (`include:` du relais servi) et le nom + la valeur DKIM attendus pour le sélecteur
      configuré de la passerelle.
- [x] AC-2 — ⚡ L'état SPF a **trois** réponses : `CONFORME` (le relais est autorisé), `NON_CONFORME`
      (SPF publié mais sans le relais, ou `-all` avant lui), `ABSENT`. ⛔ Deux enregistrements SPF sur
      le même nom sont `NON_CONFORME` (RFC 7208 : erreur permanente).
- [x] AC-3 — L'état DKIM a trois réponses : `CONFORME` (la clé publiée est celle attendue),
      `NON_CONFORME`, `ABSENT` ; ⛔ une passerelle qui ne signe pas rend `NON_APPLICABLE`, jamais
      `ABSENT`.
- [x] AC-4 — ⛔ L'échec d'une résolution n'écrit **rien** (même règle que la preuve de propriété).
- [x] AC-5 — ⚠️ Ces états **informent**, ils ne ferment pas l'expéditeur : c'est la propriété qui
      décide (STORY-615). Les fermer serait une décision PO, tracée comme telle.
- [x] AC-6 — La revérification de STORY-709 rafraîchit aussi ces deux états.

---

## Livré le 2026-10-23 — branche `MNV-710` (`prospera-notification-service`, sur `origin/dev`)

`npm test` 3 448/3 448 (259 suites) · `npm run test:e2e` 248/248 · lint 0 · build vert.
⚡ Partie empilée sur `MNV-709` (AC-6 branche sa revérification) ; 709 fusionnée dans `dev` sous
`208e9ab`, la branche a été **rebasée sur `origin/dev`** (git a sauté l'ancienne copie `ee5b4a6`) :
**1 commit, 13 fichiers, fusion sans conflit**. L'arbre a changé (il porte aussi 708, fusionnée
entre-temps) : les deux suites ont été **rejouées** sur la branche rebasée.

- **Domaine pur** (`domain/passerelle/delivrabilite.ts`), quatre états — `CONFORME`, `NON_CONFORME`,
  `ABSENT` et `NON_APPLICABLE` (la passerelle ne déclare rien : le confondre avec `ABSENT` ferait publier
  un enregistrement que rien n'utilise).
  - SPF : comparaison sur le **terme entier** (`include:spf.relais.tg.attaquant.tg` ne passe pas), le
    mécanisme doit précéder `all` ; deux enregistrements SPF (RFC 7208) ou un `+all` ⇒ `NON_CONFORME`.
  - DKIM : un `p=` vide est une clé **révoquée** ⇒ `NON_CONFORME`, pas `ABSENT` ; avec la clé attendue,
    comparaison exacte ; sans, la présence suffit.
- **Ce qu'on attend vient des réglages publics de la passerelle e-mail** (`spf`, `dkimSelecteur`,
  `dkimClePublique`) — jamais d'un secret. Ce qu'il faut publier est rendu à l'octet près (AC-1).
- `DelivrabiliteService`, **à part de `DomainesService`** : la preuve de propriété, qui ouvre ou ferme
  l'expéditeur, ne dépend pas d'une configuration de passerelle.
- ⚡ **AC-4 : le port DNS lève quelle que soit la cause** ; ici il fallait distinguer. `ENODATA` et
  `ENOTFOUND` sont des **réponses** du DNS (⇒ `ABSENT`) ; un délai ou un `SERVFAIL` n'écrivent **rien** —
  le constat précédent est rendu avec `rafraichi: false`, et sans constat antérieur aucun n'est inventé.
- AC-5 : `estVerifie` est inchangé — ces états informent.
- Route `POST /passerelles/domaines/:domaine/delivrabilite` ; le constat apparaît au DTO du domaine ; la
  revérification quotidienne le rafraîchit (un échec y est nommé `domaine:delivrabilite` et ne fait pas
  compter la preuve comme ratée).
- ⛔ **Le montage e2e du gate n'avait pas le nouveau service** — la suite unitaire construit le
  contrôleur à la main et ne pouvait pas le voir (le piège des 66 e2e morts du rail B). Ajouté.

⛔ **Ouvert** : aucune conformité contre un vrai DNS ; DMARC n'est pas constaté.
