# STORY-1100 : Les archives du client apprennent la façon de classer du cabinet — et reçoivent les factures comptabilisées

Status: ready-for-dev — **créée le 2026-11-18** à la demande de l'utilisateur (« côté archive, c'est important aussi
d'avoir cela »). Non slottée : à placer au prochain plan.

**Service :** `document-service` (module `ged`) · **Points :** 5
**Dépend de :** STORY-1087 (la GED s'ouvre au cabinet), STORY-1088 (retrouver une pièce), STORY-1097 (factures en
écritures) · **Écran :** FE-151

---

## Pourquoi

L'archiviste d'un cabinet indexe chaque pièce versée au fonds d'un client : nature, exercice, tiers, date, montant,
référence (STORY-1087, AC-3). Il refait chaque mois le même classement pour les mêmes émetteurs : les factures de la
CEET, les relevés de la banque, les avis d'imposition. Comme pour les écritures (STORY-1098), le cabinet veut que son
**propre** classement lui soit **suggéré et pré-rempli**, modifiable, et **jamais montré à un autre cabinet**.

## Ce qui est attendu

1. **Retenir chaque indexation validée**, pour une clé :
   - la clé : le **cabinet** (toujours), puis l'émetteur de la pièce (NIF lu, sinon nom normalisé), puis le type de
     pièce lu (facture, relevé, avis…) ;
   - ce qui est retenu : la nature du plan de classement (y compris les natures ajoutées par le cabinet), le tiers, la
     durée de conservation si elle a été changée, la boîte ou cote habituelle quand le papier est rangé, avec la date et
     l'auteur.

   Le dernier choix validé remplace l'ancien.
2. **Pré-remplir** l'indexation d'une nouvelle pièce, avec sa **source** (« Repris de votre classement du 12/03,
   pièce … »). On lit la mémoire du **fonds de ce client**, puis celle **du cabinet**, puis rien. L'archiviste garde ou
   change ; **ce qu'il valide devient la mémoire**.
3. **Les factures comptabilisées rejoignent les archives.** Une facture inscrite au brouillard par STORY-1097 apparaît
   dans le fonds d'archives du client, avec sa référence et son empreinte, liée à l'original (patron de STORY-1087,
   AC-5). Elle est **pré-indexée depuis l'écriture** : tiers, date, montant, numéro, exercice, nature « facture d'achat »
   ou « de vente ». Il n'y a donc **pas de seconde saisie**.
4. **Consulter et oublier** une mémoire de classement (journalisé). Une nature retirée du plan de classement n'est
   jamais reproposée.
5. **Natures sensibles** (STORY-1087, AC-7) : la mémoire ne retient **que** la nature et le classement, jamais le texte
   lu.

## ⛔ Cloisonnement par cabinet (exigence de l'utilisateur, 2026-11-18)

- Mémoire, suggestions et natures propres appartiennent à **l'organisation du cabinet**. Aucune mémoire n'est
  partagée entre cabinets, et rien n'est indexé par le seul NIF.
- **Le même client suivi par deux cabinets** : l'archiviste de B ne reçoit **rien** du classement de A, et ne voit
  aucune pièce du fonds de A.

## Critères d'acceptation

- **AC-1** : la deuxième pièce du même émetteur, dans le même fonds, est pré-indexée comme la première, avec sa source.
- **AC-2** : un classement corrigé remplace la mémoire ; la pièce suivante propose le nouveau classement.
- **AC-3** : une facture inscrite au brouillard (STORY-1097) apparaît dans le fonds du client, pré-indexée, sans
  seconde saisie, et reliée à son écriture.
- **AC-4** : deux cabinets suivent le même client (même NIF) ; B ne reçoit aucune suggestion ni aucune pièce de A
  (test à deux cabinets, sur la vraie pile).
- **AC-5** : une mémoire oubliée n'est plus proposée, et l'oubli est journalisé.
