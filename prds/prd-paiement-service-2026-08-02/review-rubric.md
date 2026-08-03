# PRD Quality Review — PI-SPI & encaissement (`paiement-service`)

**Date :** 2026-08-02 · **Enjeu :** lancement · **Forme :** capacité de plateforme, chain-top

## Verdict d'ensemble

Le PRD est porté par un invariant juridique fort (NFR-1) traduit en contraintes de modèle de données
et mesuré par SM-1 — c'est rare et c'est ce qui rend le document utile. Le groupe F (paiement hors
Prospera) est le bon choix de conception et il est argumenté. **Ce qui ne tient pas, c'est le statut
de la créance** : le PRD la déclare référence externe opaque, puis écrit une dizaine d'exigences qui
supposent que le service en détient le solde. Deuxième angle mort : l'interaction entre les frais à
la charge du payeur et le paiement partiel n'est traitée nulle part, alors que les deux sont des
décisions explicites du PO.

---

## 1. Decision-readiness — **strong**

NFR-1 engage un renoncement réel et le rend vérifiable (SM-1 à zéro, absence de solde détenu dans le
modèle). FR-P49 assume de ne pas rembourser plutôt que de promettre un demi-remboursement. Q9 (C8)
est signalée bloquante et rattachée à l'incrément qu'elle bloque, au lieu d'être posée en fin de
document.

### Constats
- **medium** — **FR-P46 (période de grâce)** dit *« attribuée par un rôle habilité »* sans dire sur
  quel critère ni pour quelle durée. Q11 renvoie à une décision commerciale, mais l'exigence n'a
  aucune borne : une grâce sans durée maximale est une suspension jamais appliquée. *Fix :* borner la
  durée, même par défaut.

## 2. Substance over theater — **adequate**

Pas de persona décorative. Les NFR portent des contraintes produit réelles (unité mineure, append-only,
sandbox complet).

### Constats
- **medium** — **NFR-7 : seuils inventés.** « P95 < 2 s / 5 s / 1 s » ne dérive d'aucune source, ni
  d'un usage observé, ni d'une contrainte de fournisseur. Plausibles, mais présentés comme acquis.
  *Fix :* les marquer comme cibles proposées à confirmer.
- **low** — **SM-2 n'a pas de cible** (« mesurée, non ciblée au v1 »). C'est un indicateur, pas une
  métrique de succès. *Fix :* le nommer indicateur.

## 3. Strategic coherence — **strong**

La thèse est nette et tenue : orchestrer sans détenir, constater autant que déclencher. Les incréments
suivent la thèse — l'incrément 2 est celui qui tient la promesse commerciale, pas le plus facile.

## 4. Done-ness clarity — **thin**

### Constats
- **high** — **FR-P38 : le rapprochement automatique n'a pas de clé.** Une ligne pour le cœur de SM-3
  (« écart 0 après rapprochement »). Rapproche-t-on sur la référence du fournisseur, sur le couple
  montant + date, sur un identifiant de demande porté au libellé ? Le choix décide du taux de
  rapprochement réel. *Fix :* nommer la clé primaire de rapprochement et la stratégie de repli.
- **high** — **FR-P12 : réacheminement vers un autre fournisseur, automatique ou manuel ?** Non dit.
  Un réacheminement automatique d'une demande déjà envoyée au payeur crée un risque direct de **double
  encaissement** — précisément ce que NFR-3 interdit. *Fix :* trancher, et si automatique, exiger la
  révocation prouvée de la demande précédente.
- **medium** — **FR-P04 : deux mécanismes de vérification proposés, aucun choisi** (« appel au
  fournisseur, ou transaction de vérification de montant symbolique »). Ce ne sont pas des variantes :
  l'un est gratuit, l'autre coûte de l'argent et suppose un débit. *Fix :* choisir.
- **medium** — **Délais paramétrables sans valeur par défaut** : FR-P34 (délai de validation d'un
  encaissement déclaré), FR-P15 (validité d'un lien). Le PRD `notification-service` donne des défauts
  pour toutes ses durées ; celui-ci n'en donne aucun. *Fix :* aligner.
- **medium** — **NFR-3 n'a pas de condition observable.** « Au plus un encaissement » est l'invariant
  le plus coûteux du module et rien ne dit comment on le prouve. *Fix :* nommer le test (rejouer N
  fois la même notification, prouver un seul encaissement).

## 5. Scope honesty — **broken**

### Constats
- **critical** — **Le statut de la créance est contradictoire.** L'assumption A2 et Q10 la déclarent
  *« référence externe opaque fournie par l'appelant »*, mais **FR-P37** restitue *« montant d'origine,
  encaissements, solde restant »*, **FR-P50** dit *« la créance retrouve son solde »*, et tout le
  groupe F rattache des encaissements à une créance. Un objet opaque n'a ni montant d'origine ni solde.
  Le PRD a donc **déjà tranché Q10 dans ses FR tout en la présentant comme ouverte** — c'est le motif
  exact des trois `open_contract_gaps` du dépôt : une question déclarée déléguée alors que d'autres
  parties ont supposé sa réponse. *Fix :* déclarer que le service détient une **projection de créance**
  (référence, montant d'origine, devise, échéance, libellé) dont il maintient le solde encaissé, et
  réduire Q10 à la seule question qui reste : qui fait autorité en cas de divergence de montant.
- **high** — **Frais × paiement partiel : non traité.** FR-P23 met les frais à la charge du payeur ;
  FR-P25 autorise le paiement partiel. Trois règlements partiels = **trois fois les frais**, payés
  par le détaillant. C'est une conséquence économique directe de deux décisions explicites du PO, et
  elle n'apparaît nulle part — alors que CM-2 surveille précisément la désaffection du lien.
  *Fix :* exiger l'affichage du surcoût de fractionnement et poser la question commerciale.

## 6. Downstream usability — **adequate**

Identifiants FR-P01→P63 contigus et uniques. Glossaire présent. Renvois internes résolvent.

### Constats
- **low** — Dérive **« encaissement » / « règlement »** : FR-P27 parle de « règlements successifs »,
  terme absent du glossaire. *Fix :* un seul mot.

## 7. Shape fit — **adequate**

Forme « spécification de capacité » justifiée pour un service consommé par d'autres modules.

### Constats
- **medium** — **Un parcours utilisateur manque, et un seul.** Ce module a une surface publique réelle :
  le **lien de paiement**, ouvert par un détaillant qui n'a aucun compte Prospera, souvent sur un
  téléphone modeste, avec du réseau incertain, à qui l'on demande de payer des frais qu'il n'attendait
  pas. C'est l'endroit exact où l'adoption se gagne ou se perd — et CM-2 le mesure. Le PRD n'en dit
  rien. *Fix :* un parcours avec protagoniste nommé, du message reçu au paiement partiel.

---

## Notes mécaniques

- NFR-7 : seuils non sourcés (repris en §2).
- Aucune valeur par défaut pour deux durées paramétrables (repris en §4).
- Les incréments sont estimés (~34 / ~34 / ~26) sans découpage en stories — normal à ce stade,
  mais l'estimation de `notification-service` s'était révélée basse de 50 % au découpage réel.
