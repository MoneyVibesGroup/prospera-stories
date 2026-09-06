# STORY-593 : Préparation, prévisualisation sur échantillon, retenus et écartés avec leur motif

Status: done

**Épic :** EPIC-061 — Envoi de masse : listes, lots avec reprise et garde-fous
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S43
**Prérequis :** **STORY-592** (instantané et curseur) · **STORY-574** (segments)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-13.

**Livrée le 2026-09-06** — branche `MNV-593` de `prospera-notification-service`, sur `origin/dev`.
2 044 tests unitaires (168 suites) + 172 e2e ; lint et types propres.

---

## Le fait

⚡ **Les trois temps sont distincts et l'objet préparé est réutilisable** : préparer, prévisualiser sur
un échantillon, exécuter (FR-N29).

⚡ **Les écartés sont écrits eux aussi**, avec leur motif nommé. Le compte rendu préalable devient
alors une simple **agrégation**, sans machinerie supplémentaire.

## Critères d'acceptation

- [x] AC-1 — Préparation, prévisualisation sur échantillon et exécution sont **trois actes distincts**.
      L'objet préparé est **réutilisable**.
- [x] AC-2 — Les destinataires écartés sont **persistés** avec leur motif nommé : `DESABONNE`,
      `CANAL_ABSENT`, `IDENTIFIANT_INVALIDE`.
- [x] AC-3 — Le compte rendu préalable (FR-N31) rend **retenus, écartés et pourquoi, nombre de
      segments et coût estimé** — par simple agrégation sur ce qui est déjà écrit.
- [x] AC-4 — Le nombre de segments et le coût estimé viennent de la **fonction pure** de STORY-574 :
      annonçables **avant** le choix du canal.
- [x] AC-5 — Un envoi de masse est **interruptible en cours d'exécution**, avec **état exact au moment
      de l'arrêt** (FR-N32) — conséquence directe du curseur, aucun mécanisme dédié.
- [x] AC-6 — La prévisualisation emprunte le chemin de rendu **qui ne peut pas produire d'`Envoi`**
      (STORY-575 AC-4) : aucun quota, aucun coût, aucune ligne au journal.

## Notes

- Le coût estimé est **étiqueté comme estimation**. Le coût réel est figé à l'envoi (STORY-595) et
  porte sa `sourceCout`.

---

## Ce que la livraison a appris

### ⚡ Les écartés sont ÉCRITS, pas seulement comptés

C'est la décision qui rend tout le reste simple. Retenus et écartés vivent dans la **même
collection**, chacun avec son motif : le compte rendu préalable devient un `$group`, sans second
passage et sans qu'un chiffre puisse diverger de la liste qui l'explique. Une collection séparée
aurait obligé à tenir **deux comptes d'accord** — et le jour de l'écart, personne n'aurait su lequel
avait raison.

⛔ **Trois motifs parce que trois gestes** : `CANAL_ABSENT` se corrige en complétant le carnet,
`IDENTIFIANT_INVALIDE` en rectifiant la fiche, `DESABONNE` ne se corrige pas du tout. Un compte rendu
qui ne dit que « 412 écartés » oblige l'organisation à deviner lesquels.

⚠️ **Un écart n'est pas un échec** : un `Envoi` `echoue` a été tenté, un écarté ne l'a **jamais** été.
Les mêler ferait apparaître au journal des envois qui n'ont jamais existé — et payer un coût jamais
engagé. ⚡ Et l'exécution ne lit **que les retenus** : compter les écartés comme non servis ferait
échouer la preuve d'AC-3 sur des gens que rien n'aurait pu servir.

### ⛔ Le consentement est interrogé DEUX fois, et ce n'est pas une redondance

Ici à la préparation, pour le compte rendu ; et **à l'instant de la remise** pour l'opposabilité
(STORY-594, FR-N48). ⚠️ Sur la nature **`MASSE`**, jamais `TRANSACTIONNEL` : un refus de masse ne doit
pas éteindre une mise en demeure (STORY-582).

### ⛔ AC-6 — la prévisualisation ne peut pas produire d'`Envoi`

Elle passe par `rendreEssai`, **jamais** par `figerPourEnvoi` : le second marque la version comme
utilisée, donc la rend immuable — prévisualiser aurait figé un modèle que son rédacteur croyait encore
modifiable, sans qu'il l'ait demandé. ⚡ Et la résolution passe par `resoudre`, qui ne fige rien non
plus : c'est ce qui permet de partir de la **clé fonctionnelle** plutôt que d'un identifiant de modèle
que l'appelant n'a pas.

### ⚡ AC-4 — segments et coût viennent de la fonction pure

Sur le texte rendu par le chemin d'essai : annonçables **avant** le choix du canal, sans qu'aucun
`Envoi` n'existe. ⚠️ Le coût est **étiqueté comme estimation**, et le mot est dans le nom du champ :
rendre le devis et la facture sous le même nom aurait fait comparer l'un à l'autre.

### ⚡ AC-5 — l'interruption est une conséquence du curseur

Aucun mécanisme dédié : suspendre pose un état que l'exécution relit **entre deux lots**, et le curseur
porte déjà la position exacte. ⛔ La suspension ne coupe **jamais** un lot au milieu — le lot en cours
va au bout, puis l'exécution s'arrête. ⚠️ L'état est relu de la **base**, jamais du document en
mémoire : la demande vient d'une autre requête HTTP, sur un autre processus.

## ⛔ Points ouverts après 593

1. **Aucune conformité Docker** (héritée de 592).
2. **Rien ne borne encore le lancement** : plafond, fenêtre horaire et validation préalable
   appartiennent à STORY-594. `POST /:id/executer` dépose donc le travail sans autre condition que le
   droit d'exécuter.
3. **La prévisualisation ne remet à personne** : FR-N15 prévoit un destinataire d'essai, qui reste à
   moitié livré depuis STORY-577.
