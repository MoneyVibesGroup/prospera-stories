# Story DI-INT-0 : Integration Gate distributeur — **zéro fixture sur ce qui est livré**

Status: draft

**Epic :** DI-EPIC-000 — Socle distributeur
**Points :** 8 · **Sprint :** socle distributeur, vague 0 — **à caler en clôture de vague** · **App :** `prospera-distributeur`
**API :** `auth-service` (`:3001`) — direct-par-service
**Backend d'appui :** STORY-166, STORY-167
**Réf. plan :** `PLAN-DISTRIBUTEUR-PI-SPI-2026-08-02.md` §3-ter · miroir de `FE-INT-0` et `AP-INT-0`
**Dépendances :** **DI-01**, **DI-02**
**Maître Scrum (frontend) :** MightyRaven

---

## Convention Git

- Branche : `di-int-0`. Commits préfixés `DI-INT-0`.

---

## User Story

En tant qu'**équipe**,
je veux **prouver que le périmètre livré du distributeur parle au vrai backend, dans un vrai
navigateur**,
afin de **ne pas découvrir en fin d'epic que l'application tourne sur des contrats supposés**.

---

## Pourquoi cette story existe, et pourquoi elle est différente ici

Le programme s'est donné une règle après l'avoir payée :

> **Integration Gate en fin d'epic : brancher le vrai backend, remplacer les contrats supposés, zéro
> mock.**

Elle a été écrite parce que `FE-008/009/010` avaient été livrées **en miroir de contrats supposés**, et
que `FE-023` a découvert au gate qu'une URL présignée pointait sur `minio:9000` — **valide dans le
réseau Docker, invisible d'un navigateur**.

⚡ **Ici, le point de départ est plus dur qu'ailleurs.** L'app cabinet avait des contrats supposés ;
`prospera-distributeur` **n'avait aucun contrat** — 25 écrans, zéro appel réseau, données générées.
Ce gate ne remplace donc pas des mocks : il **vérifie que la réécriture a bien commencé par la
donnée** et non par l'écran.

---

## Périmètre

### 1 · Zéro fixture sur le périmètre livré

- Aucun écran de `DI-01`/`DI-02` n'importe `mock-seed.ts` ni un `generate-*.ts`
- Vérifié **par recherche dans le code**, pas par revue visuelle
- Les générateurs peuvent survivre dans un dossier de démonstration **clairement nommé** — mais aucun
  chemin de production n'y mène

### 2 · Types générés, pas écrits

Les types des réponses viennent de l'**OpenAPI des services**. Une divergence entre le type généré et
la réponse réelle est un **échec de gate**, pas un détail à corriger plus tard.

### 3 · ⚡ Vérification en navigateur réel

**Playwright, pas `curl`.** Trois choses ne se voient qu'ainsi :

| Ce qui échappe à `curl` | Précédent |
|---|---|
| Le **préflight CORS** | `STORY-109` — cinq services livrés sans CORS, blocage découvert en démo navigateur |
| Une **URL valide en interne, injoignable de l'extérieur** | `FE-023` / `STORY-011` — `MINIO_PUBLIC_ENDPOINT` |
| Un **cookie** ou un en-tête que le navigateur traite autrement | — |

### 4 · Le parcours d'entrée, de bout en bout

⚡ **Le critère qui compte** : le parcours que le PO décrit doit passer **en une seule séance**, sur
stack neuve :

```
Money Vibes crée l'organisation (AP)
   └─ crée son administrateur, lui attribue DIST_ADMIN (AP-17)
        └─ l'administrateur se connecte à prospera-distributeur (DI-01)
             └─ il renseigne son organisation (DI-02)
                  └─ il invite un membre et lui attribue un rôle
                       └─ ce membre se connecte et voit ce qui lui revient
```

### 5 · Ce que le gate consigne

- Les écarts trouvés entre contrat attendu et réponse réelle
- ⚡ **Les manques découverts chez le backend** → un ticket dans `tickets/`, jamais une correction
  silencieuse côté front

### Hors périmètre

Tout écran non livré par `DI-01`/`DI-02`. **Ce gate ne porte que sur le périmètre réellement livré** —
il ne préjuge pas des écrans à venir.

---

## Critères d'acceptation

- [ ] ⚡ **Aucun import de générateur** dans le chemin de production — prouvé par recherche.
- [ ] Types d'API **générés** ; toute divergence avec la réponse réelle est corrigée **avant** clôture.
- [ ] ⚡ Le **parcours d'entrée complet** passe en navigateur réel, sur stack neuve (`down -v`).
- [ ] Le préflight **CORS** est franchi sur chaque service appelé — vérifié en navigateur.
- [ ] Aucune URL de service en dur hors de `services.ts`.
- [ ] Les erreurs backend `{ message, code }` sont affichées telles quelles, jamais avalées.
- [ ] Un jeton expiré en cours de session est traité proprement — pas de page blanche.
- [ ] Les manques découverts côté backend font l'objet d'un **ticket**, pas d'un contournement.
- [ ] Le rapport de gate est consigné dans la story.

---

## Notes techniques

### La leçon à ne pas réapprendre

> **Une URL ne se vérifie qu'avec le client qui la consommera.**

C'est ce que `FE-023` a coûté. Elle vaut ici pour chaque service appelé — et vaudra encore pour le
lien de paiement (`PY-01`), qui est une URL générée côté serveur et ouverte par un tiers.

---

## Tasks / Subtasks

- [ ] Recherche de code : aucun import de générateur
- [ ] Génération des types + confrontation aux réponses réelles
- [ ] Scénario Playwright du parcours d'entrée
- [ ] Vérification CORS par service
- [ ] Rédaction des tickets pour les manques backend
- [ ] Rapport de gate

---

## Definition of Done

- [ ] Tous les critères vérifiés
- [ ] Parcours d'entrée **démontré en navigateur réel** sur stack neuve
- [ ] Tickets ouverts pour chaque manque backend
- [ ] 🏁 **Clôture de la vague 0** — le distributeur existe, son administrateur travaille
- [ ] Branche `di-int-0`, PR mergée

---

## Dev Agent Record

*(à remplir à l'implémentation)*
