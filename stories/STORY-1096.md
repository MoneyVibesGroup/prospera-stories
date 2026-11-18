# STORY-1096 : Importer le plan comptable de Sage 100 — au cabinet ou à un client, aperçu puis enregistrement

Status: ready-for-dev — **créée le 2026-11-18** à la demande de l'utilisateur. Non slottée : à placer au prochain plan.

**Service :** `prospera-comptabilite-service` (tenu par B au lot 4) · **Points :** 8
**Dépend de :** STORY-1094 (modèle du cabinet), STORY-1095 (plan du dossier)

---

## Pourquoi

Un cabinet qui quitte Sage 100 a déjà saisi son plan des centaines de fois. Le ressaisir compte par compte est la
raison même pour laquelle il hésite. Sage 100 exporte sa liste de comptes (copie vers Excel, « Fichier › Exporter »
en format paramétrable ; la forme exacte dépend de la version). L'utilisateur l'a demandé le 2026-11-18 : « ou bien
importer celui de Sage ».

## Ce qui est attendu

1. **Une route d'import en deux temps**, sur le patron déjà connu du produit (import Sage des balances) :
   - un **aperçu** (`dryRun`) qui n'écrit rien ;
   - un **enregistrement**, qui rejoue exactement l'aperçu.
   La cible est le **modèle du cabinet** ou le **plan d'un dossier**.
2. **Formats** :
   - CSV ou XLSX tels qu'exportés de Sage 100 : numéro, intitulé, et le type de compte quand il est présent ;
   - les colonnes se désignent par un **profil d'import** (même mécanisme que les balances), pour les exports non
     standard ;
   - les journaux s'importent par le même fichier s'il les porte, ou par un second fichier.
3. **Rattachement** : chaque compte lu est rattaché à la **racine du référentiel** de la cible par le préfixe le plus
   long :
   - un compte **égal** à une racine est **déjà connu** et n'est pas recréé ;
   - un compte **sans racine** est une **anomalie nommée**, jamais importée en silence ;
   - un compte **déjà présent** (même numéro) est signalé, et jamais écrasé.
4. **L'aperçu** dit, en nombres et en liste :
   - ce qui sera créé ;
   - ce qui est déjà connu ;
   - ce qui est en anomalie, avec la raison et la racine la plus proche.
   L'enregistrement ne crée que ce que l'aperçu annonçait. Si le plan a changé entre-temps, il le refuse (`409`).
5. **Idempotence** : réimporter le même fichier ne crée rien de plus.
6. **Audit** : l'import est un seul acte (fichier, empreinte, nombre de créations, auteur), au journal du cabinet ou
   du dossier selon la cible.

## Critères d'acceptation

- **AC-1** : l'aperçu n'écrit rien, et l'enregistrement crée exactement ce qu'il annonçait.
- **AC-2** : aucun compte sans racine n'est importé ; chacun figure dans les anomalies, avec sa raison.
- **AC-3** : réimporter le même fichier ne crée rien.
- **AC-4** : un vrai export de Sage 100, fourni par un cabinet, sert de cas de test, avec ses données anonymisées
  (geste de l'utilisateur : fournir le fichier).
