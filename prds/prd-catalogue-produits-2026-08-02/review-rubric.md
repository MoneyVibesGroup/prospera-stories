# PRD Quality Review — Catalogue produits (`catalogue-produits-service`)

**Date :** 2026-08-02 · **Enjeu :** lancement · **Forme :** capacité métier, chain-top

## Verdict d'ensemble

La thèse — *un catalogue qui refuse plutôt qu'un catalogue qui décrit* — est empruntée au prototype
et bien tenue : le groupe G existe pour elle, et FR-C40 (un profil absent doit se voir) en est la
conséquence honnête. La mécanique d'unités est solide, y compris sur son piège silencieux
(FR-C10, versionnement des facteurs). **Deux absences graves cependant, et elles sautent aux yeux
précisément parce que les PRD voisins traitent le sujet** : un prix sans devise, et un prix sans
régime de taxe. Le PRD `paiement-service` couvre toute l'Afrique de l'Ouest avec des devises à
décimales différentes ; celui-ci écrit des prix hors de toute devise. Troisième point : Q3 est
déclarée ouverte alors que les FR ont déjà tranché — **c'est la troisième occurrence de ce motif
dans ce chantier**.

---

## 1. Decision-readiness — **strong**

§1.3 remonte une contradiction entre deux documents commerciaux et la tranche au lieu de la
contourner. Le hors-périmètre distingue « fournir l'information » de « décider du refus », ce qui
évite au module de promettre ce qu'il ne fait pas.

## 2. Substance over theater — **strong**

Aucun remplissage. FR-C10, FR-C20 et FR-C26 portent chacune un défaut réel et nommé.

### Constats
- **medium** — **SM-4 (« > 80 % d'articles au profil complet ») ne définit pas « complet ».** Un
  produit de première nécessité n'a pas de saisonnalité — mais `AUCUNE` est une valeur déclarée, donc
  un profil complet. La métrique est inexploitable tant que le mot n'est pas défini. *Fix :* définir
  « complet » = les quatre champs renseignés, `AUCUNE` comptant comme renseigné.

## 3. Strategic coherence — **strong**

Les incréments suivent la thèse : d'abord compter, puis valoriser, puis différencier. L'ordre est
justifié et le troisième incrément — celui qui porte les deux différenciateurs — est correctement
désigné comme le seul décalable.

## 4. Done-ness clarity — **thin**

### Constats
- **high** — ⚡ **Aucun prix ne porte de devise.** Le PRD `paiement-service` couvre **tous les pays
  d'Afrique de l'Ouest**, avec des devises à unités mineures différentes (XOF et GNF sans décimale,
  NGN et GHS à deux) et une exigence explicite de stockage en entier d'unité mineure. Le catalogue,
  lui, écrit des prix hors de toute devise. Un distributeur opérant au Togo et au Ghana ne peut pas
  tenir un catalogue. *Fix :* la devise est un attribut de la grille tarifaire ; mêmes règles
  d'exactitude monétaire que `paiement-service`.
- **high** — ⚡ **Aucun régime de taxe.** Prix hors taxes ou toutes taxes comprises ? Le taux de TVA
  applicable à l'article ? Sans cette information, la Facturation ne peut pas produire une facture
  conforme, et `balance-service` — qui traite déjà la TVA collectée et déductible — n'a pas de source.
  *Fix :* l'article porte son régime de taxe, la grille déclare si ses prix sont HT ou TTC.
- **medium** — **NFR-2 n'a pas de mécanisme.** Le PRD dit que l'historique est préservé, sans dire
  comment : est-ce l'engagement qui **stocke le facteur utilisé**, ou qui **référence une version**
  du conditionnement ? La différence décide de ce qui se passe quand la version est supprimée.
  *Fix :* l'engagement stocke le facteur, comme le tarif est stocké avec l'encaissement dans
  `paiement-service`.
- **medium** — **Aucune règle sur la dérivation de prix entre unités.** FR-C13 dit que le prix du
  carton n'est pas 20 fois celui de l'unité, donc il ne se déduit pas. Mais aucune FR ne l'**interdit**
  explicitement — un développeur pressé le déduira. *Fix :* l'interdire.
- **medium** — **Import (FR-C45/46) : ni clé de rapprochement, ni comportement en échec partiel.**
  Sur quoi rapproche-t-on une ligne d'import — la référence, le code-barres ? Et si la ligne 400 sur
  1 000 échoue, garde-t-on les 399 ? *Fix :* nommer la clé et le comportement.
- **medium** — **FR-C31 : la marge freelance se calcule contre quel prix société ?** Le prix société
  varie par grille, zone et volume. Sans précision, la marge affichée à l'indépendant est
  indéterminée.

## 5. Scope honesty — **thin**

### Constats
- **high** — ⚡ **Q3 est déclarée ouverte alors que les FR l'ont tranchée.** Q3 demande si les grilles
  par volume s'appliquent par ligne ou par commande, et renvoie au PRD Commande. Mais FR-C14 pose le
  « seuil de volume » comme condition de grille et FR-C23 prend la **quantité** en entrée de
  résolution : le PRD a donc décidé **par ligne**. **C'est la troisième occurrence de ce motif dans
  ce chantier** — après `GAP-balance-validation-etat` dans le dépôt et Q10 dans `paiement-service`.
  Une question ouverte pendant que d'autres parties supposent sa réponse est exactement ce que
  `open_contract_gaps` documente. *Fix :* acter « par ligne » et réduire Q3 à ce qui reste ouvert —
  les remises de pied de commande.

## 6. Downstream usability — **adequate**

Identifiants FR-C01→C52 contigus. Glossaire complet et distinctif (la définition de « fin de vie
commerciale » fait le travail à elle seule).

## 7. Shape fit — **adequate**

### Constats
- **medium** — **Un parcours utilisateur manquerait, et le PRD le désigne lui-même.** CM-1 parle du
  *« commercial qui doit expliquer un prix à son détaillant »*, et FR-C28 décrit un freelance qui
  négocie point de vente par point de vente. Ce sont deux moments humains concrets, et le second est
  le différenciateur du module. *Fix :* un parcours court sur le freelance qui fixe son prix.

---

## Notes mécaniques

- SM-4 : « profil complet » non défini (repris en §2).
- Q1 porte déjà ma recommandation dans la colonne statut — acceptable, mais c'est une réponse
  déguisée en question.
