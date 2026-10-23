# STORY-710 : SPF et DKIM du domaine d'envoi — prouver que le courriel arrivera

Status: ready-for-dev

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

- [ ] AC-1 — Pour un domaine revendiqué, le service dit **ce qu'il faut publier** : le mécanisme SPF à
      ajouter (`include:` du relais servi) et le nom + la valeur DKIM attendus pour le sélecteur
      configuré de la passerelle.
- [ ] AC-2 — ⚡ L'état SPF a **trois** réponses : `CONFORME` (le relais est autorisé), `NON_CONFORME`
      (SPF publié mais sans le relais, ou `-all` avant lui), `ABSENT`. ⛔ Deux enregistrements SPF sur
      le même nom sont `NON_CONFORME` (RFC 7208 : erreur permanente).
- [ ] AC-3 — L'état DKIM a trois réponses : `CONFORME` (la clé publiée est celle attendue),
      `NON_CONFORME`, `ABSENT` ; ⛔ une passerelle qui ne signe pas rend `NON_APPLICABLE`, jamais
      `ABSENT`.
- [ ] AC-4 — ⛔ L'échec d'une résolution n'écrit **rien** (même règle que la preuve de propriété).
- [ ] AC-5 — ⚠️ Ces états **informent**, ils ne ferment pas l'expéditeur : c'est la propriété qui
      décide (STORY-615). Les fermer serait une décision PO, tracée comme telle.
- [ ] AC-6 — La revérification de STORY-709 rafraîchit aussi ces deux états.
