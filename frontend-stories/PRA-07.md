# Story PRA-07 : Les bandeaux, `<Ecriture>`, les actions hors garde, `<ProtectionObjet>` et la marque d'essai

Status: ready-for-dev — **créée le 2026-11-24** (plan `coordination/PLAN-COQUE-EPIC-265-2026-11-24.md`).

**Epic :** EPIC-265 — Coque `prospera-app` · **Groupe :** C · **Semaine visée :** S5 · **Points :** 5
**Dépôt :** `prospera-app` (dossiers `src/coque/bandeaux/`, `src/coque/espace/`)
**Spine :** AD-7, AD-12, AD-15 (copie de `seuils-fraicheur@1`), AD-25
**Dépend de :** PRA-05 ; maquette des bandeaux validée en PRA-03. **Débloque :** PRA-09, PRA-10.

---

## User Story

**En tant qu'**utilisateur (ou administrateur, ou DG),
**je veux** voir le bon avertissement au bon moment (essai qui se termine, préavis, lecture seule, module suspendu…)
et ne jamais me voir offrir une écriture que l'état refuse,
**afin de** savoir ce qui se passe sans le deviner, et sans tomber sur un refus après avoir saisi.

## Périmètre

**DANS le périmètre :**

1. **Les bandeaux, rendus par la coque seule** (un module n'en rend jamais), selon la table d'AD-7 : compte à
   rebours de l'essai, essai terminé, préavis, lecture seule, module suspendu, installation en cours, santé dégradée,
   instance gelée, version figée, changement à venir, mise à jour annoncée (avec l'avertissement `AVEC_PERTE`),
   retour arrière en cours. Destinataires : « administrateurs » = détenteurs de `instance:bilan:consulter` ; « DG » =
   `utilisateur.estDG`. Dates au fuseau de l'organisation, « maintenant » de `useMaintenant()` (PRA-05).
2. **`<Ecriture code>`** : masque ou désactive l'action quand `peutEcrire` est faux. Toute action d'écriture porte en
   plus son droit nommé (`useDroit`).
3. **Les actions hors garde** : `actionsHorsGarde` du descripteur (export, état réglementaire) rendues par la coque,
   **jamais** sous `<Ecriture>`, dans le module quand il est ouvert (l'Administration les reprend en PRA-09).
4. **`<ProtectionObjet>`** (AD-25) : retire les actions d'écriture d'un objet `historique`, signale un
   `montantASaisir`, et, pour `autoriteExterieure` ou `mouvementsEnAttente`, retire la modification directe et
   affiche « en attente ». Le lien de `provenance` ouvre la ligne de la source tant que le lot existe.
5. **La marque d'essai** (AD-12) : en `ESSAI`, bandeau permanent, couleur de bordure, titre d'onglet `[ESSAI]`, sur
   chaque écran. Aucun écran, aucun habillage ne peut la retirer. Seul `src/coque/espace/` construit le lien vers
   l'autre espace (sa racine seulement, si `autreEspaceUrl` existe).
6. **La fraîcheur** : copie épinglée de `seuils-fraicheur@1` (`prospera-plateforme/contrats/seuils-fraicheur.json`)
   avec son test de comparaison, table de seuils **générée** depuis elle, et `<Fraicheur domaine>` qui ne rend rien
   tant que le module `connecteurs` n'est pas ouvert (Connecteurs est hors février).

**HORS périmètre :** l'Administration (PRA-09) ; la file d'envoi des connecteurs (après février).

## Critères d'acceptation

| # | Critère | Preuve |
|:--:|---|---|
| AC-1 | Pour chacun des neuf jeux de lecture (PRA-05), les bandeaux rendus et leurs destinataires sont ceux de la table d'AD-7 | Vitest (table jouée) |
| AC-2 | Un préavis n'est pas montré à un utilisateur qui n'est ni administrateur ni DG | Vitest |
| AC-3 | En `LECTURE_SEULE`, une action sous `<Ecriture>` est masquée ou désactivée ; l'export reste atteignable | Vitest + Playwright |
| AC-4 | Un objet `historique` n'offre aucune action d'écriture ; un `montantASaisir` est signalé | Testing Library |
| AC-5 | En `ESSAI`, la marque est présente sur la connexion, l'accueil et une page de module ; un habillage qui tente de la masquer échoue | Playwright |
| AC-6 | Le lien vers l'autre espace n'existe que si `autreEspaceUrl` est présent, et ne mène qu'à la racine | Vitest |
| AC-7 | Le test de copie de `seuils-fraicheur@1` rougit si la source change | Vitest |
| AC-8 | Les bandeaux sont conformes à la maquette et passent `axe` | Playwright + axe |

## Fini quand

AC-1 → AC-8 prouvés, PR fusionnée, fiche à `done`, journal de C à jour ; prévenir A (PRA-10 peut employer
`<Ecriture>`).
