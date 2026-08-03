# STORY-167 : **Rôles personnalisés** — le distributeur compose les siens, Money Vibes les voit

**Epic :** EPIC-025 — RBAC plateforme *(extension)*
**Réf. code livré :** **STORY-140** (catalogue de permissions) · **STORY-166** (jeu système distributeur)
**Dépend de :** STORY-166
**Débloque :** `DI-02` (l'administrateur crée ses rôles) · `AP-17` (la console les voit)
**Priorité :** Must Have
**Story Points :** 8
**Complexité :** medium-high — **la gouvernance est plus difficile que le modèle**
**Statut :** À faire
**Assigné à :** null
**Créée le :** 2026-08-02
**Sprint :** **30** — **socle distributeur, vague 0**  *(slotté le 2026-08-03 ; décalé de 9 sprints le même jour — le module fiscalité passe devant, cf. `reserved_sprints`)*
**Service :** `auth-service` (`:3001`)
**Couvre :** demande PO du 2026-08-02

---

## Contexte

Demande du PO :

> *« Prends en compte qu'un distributeur peut créer des rôles qui sont spécifiques à son activité […]
> Money Vibes doit avoir accès aux rôles par défaut — les 14 personas — **mais aussi à ceux qui
> seront créés par le distributeur**. »*

Deux exigences, et la seconde est celle qui compte : **la console voit les rôles que l'organisation
s'est créés**. Sans elle, Money Vibes accompagne un client dont elle ne comprend plus
l'organisation — et le support devient impossible.

### Pourquoi c'est nécessaire et pas confortable

Le catalogue commercial décrit **14 personas**. Aucun distributeur réel n'a exactement ces
quatorze-là : l'un fusionne DAF et Comptable, l'autre sépare le recouvrement en deux, un troisième a
un « responsable grands comptes » qui n'existe nulle part. **Un jeu de rôles figé oblige chaque
client à se tordre**, ou à donner à quelqu'un plus de droits qu'il n'en faut. C'est ainsi qu'on
obtient des organisations où tout le monde est administrateur.

---

## User Story

**En tant qu'**administrateur d'un distributeur,
**je veux** composer des rôles qui correspondent à mon organisation réelle,
**afin de** ne pas devoir choisir entre un rôle trop large et un rôle qui ne sert à rien.

**En tant que** support Money Vibes,
**je veux** voir les rôles qu'un client s'est créés et ce qu'ils contiennent,
**afin de** pouvoir l'aider quand il m'appelle.

---

## Périmètre

### A. Composer un rôle

Un **rôle personnalisé** est une composition nommée de permissions **choisies dans le catalogue
existant** (`STORY-140`). Il porte : un libellé, une description, une liste de permissions,
l'organisation propriétaire.

⚡ **Aucune permission nouvelle ne se crée ici.** Le catalogue de permissions reste **la propriété de
la plateforme** : une organisation compose, elle n'invente pas. Sinon deux clients auraient deux
vocabulaires, et aucun contrôle ne serait comparable.

### B. Ce qu'un rôle personnalisé ne peut pas faire

| Interdit | Pourquoi |
|---|---|
| Contenir une permission que **l'organisation ne détient pas** *(module non souscrit)* | On ne délègue pas un droit qu'on n'a pas |
| Être créé par quelqu'un qui **ne détient pas lui-même** les permissions qu'il y met | ⚡ Même principe que le mandat de l'assistant IA (`FR-IA36c`) et la portée d'accès (`FR-R36`) : **nul ne délègue au-delà de ce qu'il détient** |
| Porter le même nom qu'un rôle système | Confusion au support |
| Être modifié pour **contourner la séparation des pouvoirs** sans que ce soit dit | Voir §D |

### C. Coexistence système / personnalisé

| | Rôle **système** | Rôle **personnalisé** |
|---|---|---|
| Propriétaire | Prospera | L'organisation |
| Modifiable par le client | ❌ | ✅ |
| Visible de la console | ✅ | ✅ ⚡ |
| Évolue avec le produit | ✅ automatiquement | ❌ figé jusqu'à modification |

⚠️ **La contrepartie de la personnalisation, à écrire dans le produit :** un rôle personnalisé
**n'hérite pas** des permissions ajoutées à un module plus tard. Un client qui personnalise devra
revenir. L'écran doit le dire au moment de la création, pas le laisser découvrir.

### D. La séparation des pouvoirs — signalée, pas interdite

Un distributeur de trois personnes **doit** pouvoir cumuler `declarer`, `valider` et `annuler` — sinon
il ne peut pas travailler.

**Le système ne l'interdit pas ; il le rend visible :**

- À la création du rôle, un **avertissement explicite** nomme le cumul et sa conséquence
- Le rôle porte un **marqueur de cumul** restitué à la console
- Le contrôle **sur la personne** de `STORY-156`/`STORY-158` **continue de s'appliquer** : même avec
  un rôle cumulant, personne ne valide sa propre déclaration

> ⚡ **C'est la distinction qui rend le dispositif utilisable :** on n'empêche pas une petite
> structure de fonctionner, on empêche une personne d'être seule sur un circuit d'argent.

### E. Ce que la console voit

`GET` des rôles d'une organisation : système **et** personnalisés, avec leurs permissions, leur
marqueur de cumul, leur auteur et leur date.

⚠️ **En lecture seule.** Money Vibes voit pour accompagner ; elle ne modifie pas les rôles d'un
client — ce serait agir dans son organisation sans lui.

---

## Critères d'acceptation

1. Une organisation crée un rôle personnalisé en composant des permissions **du catalogue existant** ;
   aucune permission nouvelle n'est créable.
2. Un rôle contenant une permission d'un **module non souscrit** est refusé, avec le module nommé.
3. ⚡ Un utilisateur ne peut pas créer un rôle contenant une permission **qu'il ne détient pas
   lui-même**.
4. Un rôle personnalisé portant le nom d'un rôle système est refusé.
5. Les rôles système **ne sont pas modifiables** par l'organisation.
6. ⚡ Un rôle cumulant `declarer` + `valider` (ou + `annuler`) est **accepté**, avec un **avertissement
   explicite** et un **marqueur de cumul** persisté.
7. ⚡ Le contrôle **sur la personne** reste actif : un utilisateur porteur d'un rôle cumulant **ne
   valide pas sa propre déclaration** — non-régression de `STORY-156` AC 7.
8. ⚡ La console (`PLATFORM_ADMIN`) obtient les rôles **système et personnalisés** d'une organisation,
   avec leurs permissions, en **lecture seule**.
9. Supprimer un rôle porté par des utilisateurs est **refusé**, avec la liste des porteurs.
10. Toute création, modification et suppression de rôle est **journalisée**.
11. Un rôle personnalisé **n'acquiert pas** automatiquement les permissions ajoutées ultérieurement à
    un module ; ce comportement est **documenté dans la réponse d'API**, pas seulement dans un guide.
12. Isolation : une organisation ne voit jamais les rôles d'une autre.

---

## Notes techniques

### Pourquoi la console est en lecture seule

Modifier les rôles d'un client depuis la console reviendrait à agir dans son organisation en son nom.
Le support en a besoin **pour comprendre**, pas pour faire. Si un jour l'intervention devient
nécessaire, elle passera par une demande tracée du client — pas par un accès silencieux.

### Le marqueur de cumul (AC 6)

Ce n'est pas un avertissement d'interface : c'est une **donnée persistée**, restituée à la console et
exploitable en audit. Un avertissement affiché une fois à la création disparaît ; un marqueur reste.

---

## Risques & mitigation

| Risque | Mitigation |
|---|---|
| Un client se crée un rôle « super-admin » cumulant tout | **AC 6** : accepté mais marqué ; **AC 7** : le contrôle sur la personne tient quand même |
| Un utilisateur s'octroie des droits qu'il n'a pas via un rôle | **AC 3** |
| Le support ne comprend plus l'organisation d'un client | **AC 8** : la console voit tout, en lecture |
| Un rôle personnalisé se périme sans que le client le sache | **AC 11** : documenté dans la réponse d'API |

---

## Definition of Done

- [ ] Les 12 critères vérifiés
- [ ] `lint` 0 · couverture ≥ 90 %
- [ ] **Vérification docker** : création d'un rôle, refus sur module non souscrit, refus d'escalade de
      droits, cumul marqué, contrôle sur la personne toujours actif, lecture console
- [ ] Revue de sécurité : escalade de privilèges par composition de rôle
- [ ] Branche `MNV-167`, PR rebase-mergée sur `dev`

---

## Progress Tracking

*(à remplir à l'implémentation)*
