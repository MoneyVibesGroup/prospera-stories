# Revue croisée des 7 PRD — 2026-08-02

**Périmètre :** `notification-service` · `paiement-service` · `assistant-service` ·
Catalogue produits · Stock · Points de vente · Réseau, agences & zones
**Total :** 426 exigences fonctionnelles, 45 NFR, 21 incréments (~618 points)

Cette revue ne relit pas chaque PRD — chacun l'a été contre la rubrique qualité. Elle cherche
**ce qu'aucune lecture isolée ne peut voir** : les patrons appliqués ici et oubliés là, les renvois
qui ne résolvent pas, et les décisions prises tard qui n'ont pas été répercutées en arrière.

---

## Verdict

Les sept documents forment un ensemble cohérent : mêmes invariants, même façon de nommer les
frontières, mêmes contre-métriques honnêtes. **Les trois défauts trouvés viennent tous de la même
cause — l'ordre de rédaction.** Une décision prise à l'atelier 2 n'a pas été répercutée dans le PRD
de l'atelier 1, et un patron devenu standard à l'atelier 5 manquait dans les deux premiers. Aucun
n'était visible en relisant un document seul. Tous sont corrigés.

---

## 1. ⚡ Le motif monétaire n'était pas tenu partout — 2 occurrences restantes

La décision de couvrir **toute l'Afrique de l'Ouest** avec des devises à unités mineures différentes
a été prise à l'**atelier 2** (PI-SPI). Les PRD écrits **avant** ne l'ont jamais reçue :

| PRD | Montants manipulés | Devise | Corrigé par |
|---|---|:--:|---|
| **notification-service** *(atelier 1)* | coût unitaire d'envoi, tarif de passerelle, modèle de coût (FR-N57, N59, N62, N63) | ❌ absente | **FR-N57b/c** |
| **assistant-service** *(atelier 3)* | plafond de mandat (FR-IA36b) | ❌ absente | **FR-IA36e** |
| paiement-service | — | ✅ | — |
| Catalogue · Stock · PDV · Réseau | — | ✅ | corrigés à leur propre relecture |

**Six occurrences au total dans la série.** Le motif est toujours le même : un montant écrit comme un
nombre. La conséquence aussi : **le XOF n'a pas de décimale**, donc un montant traité à deux
décimales par défaut est faux d'un facteur 100 **sur le marché principal**.

FR-N57c ajoute une conséquence que personne n'avait posée : une organisation multi-pays voit sa
consommation **par devise**, sans total agrégé — additionner des XOF et des NGN ne produit aucun
nombre qui veuille dire quelque chose.

## 2. ⚡ Un renvoi cassé, et le concept manquait là où il compte le plus

Deux PRD citaient **`FR-P58`** comme « le tarif enregistré avec l'encaissement ». Or `FR-P58` traite
des montants minimum et maximum par fournisseur × pays × devise — autre chose.

**Et le concept cité n'existait pas dans `paiement-service`.** Il était écrit dans quatre PRD
(notification `FR-N62`, catalogue `FR-C10b`, stock `FR-S14`, réseau `FR-R05b`) et **absent du seul
où il porte de l'argent réel**.

➡️ **`FR-P24b` créé** : le tarif et les frais appliqués sont enregistrés avec l'encaissement, jamais
recalculés. Les deux renvois corrigés.

**Le patron, désormais explicite dans les 5 PRD concernés :**

> **Ce qui a servi est conservé avec ce qu'il a servi à produire.**
> Le facteur de conversion avec le mouvement · le tarif avec l'encaissement · la politique de frais
> avec la demande · la version de découpage avec le rattachement · la version de modèle avec la
> proposition.

## 3. Le patron « fournisseur de candidats » manquait à 2 des 7

Le moteur de règles de l'assistant interroge chaque module (`FR-IA03b`, décision « option A »).
Cinq PRD exposaient ce contrat ; **notification et paiement l'omettaient** — alors que leurs cas
d'automatisation sont les plus évidents de la plateforme.

➡️ **`FR-N56b`** (envois échoués non rejoués, destinataires injoignables, modèles en attente) et
**`FR-P64`** (promesses de paiement échues, encaissements déclarés non validés, abonnements à
échéance). Sans eux, l'assistant ne pouvait automatiser **ni la relance de paiement, ni le rejeu
d'envoi** — les deux usages les plus demandés.

---

## Ce qui est cohérent — vérifié, pas supposé

| Point | État |
|---|---|
| **Préfixes d'exigences** (`FR-N`, `FR-P`, `FR-IA`, `FR-C`, `FR-S`, `FR-V`, `FR-R`) | ✅ aucune collision, numérotation contiguë dans chaque PRD |
| **Renvois inter-PRD** (17 au total) | ✅ tous résolvent après correction de `FR-P58` |
| **Noms de service et positions** | ✅ cohérents avec la séquence v2 |
| **Politique de données personnelles** | ✅ définie une fois (`notification-service` §9), référencée par paiement et PDV |
| **Isolation par organisation** | ✅ NFR dédiée dans les 7 |
| **Patron `XxxProvider`** (canal, paiement, modèle) | ✅ même contrat, même promesse de swap par configuration |
| **Défauts chiffrés sur les durées paramétrables** | ✅ après correction du Stock |
| **Contre-métriques** | ✅ 2 à 3 par PRD, toutes surveillent un échec réel et non un indicateur d'activité |

---

## Les 26 questions ouvertes

### ⛔ Bloquantes — elles arrêtent un incrément

| PRD | # | Question | Ce qu'elle bloque |
|---|:--:|---|---|
| **paiement** | **Q9** | **C8** — comment `paiement-service` s'authentifie auprès du catalogue pour octroyer les entitlements | **Incrément 3** (abonnements, suspension). Différée depuis `STORY-034` |
| **stock** | **Q3** | Le stock **en transit** appartient-il à l'origine ou à la destination **au bilan** ? | La valeur d'arrêté dès qu'un transfert est en cours. *Reportée sur ta décision, à ressortir au lancement* |
| **assistant** | **Q2** | **Serveur d'inférence** : quelle machine, quel modèle de production ? | La **qualité**, pas la livraison. Décision n°1 de la note d'archi, jamais tranchée |

### 🟡 Décisions produit ou commerciales — elles t'appartiennent

| PRD | # | Question |
|---|:--:|---|
| notification | Q7 | Qui paie les envois : refacturé, inclus dans l'abonnement, ou quota ? |
| paiement | Q11 | Grille des **périodes de grâce** par type de client |
| catalogue | Q4 | Le prix freelance est-il **plafonné** par la société (prix maximum conseillé) ? |
| stock | Q1 | Le taux de **coût de portage** (22 % dans le prototype) : unique ou paramétrable ? |
| pdv | Q2 | Un **magasin propre** a-t-il un plafond de crédit ? |
| assistant | Q1 | **Scoring & prévision** : quel module, quand, sur quel historique ? *(module différé)* |
| assistant | Q5 | Qui, chez le client, a le droit de passer une règle en `AUTO` ? |

### 🟢 Techniques — je peux trancher, dis-moi si tu veux le faire

`paiement Q13` (autorité sur le montant d'origine) · `catalogue Q2` (catalogue partagé), `Q5`
(remises de pied de commande) · `stock Q2` (changement de méthode d'écoulement), `Q4` (emplacements
au v1) · `pdv Q1` (plusieurs commerciaux par point), `Q3` (règles de pipeline par zone), `Q4` (départ
d'un salarié) · `reseau Q1` (agence = point de stock ?), `Q3` (affectation multi-branches), `Q4`
(contour géographique) · `assistant Q3` (nom du service), `Q4` (stockage vectoriel), `Q7` (qui
alimente le catalogue des types d'action) · `notification Q6` (rôle de rédaction), `Q8` (seuil de
délivrance)

---

## Cinq décisions qui vivent hors des PRD

1. **Module Copilot conversationnel** — différé, à placer dans la séquence
2. **Module Scoring & prévision** — différé, avec la question du démarrage à froid
3. **La clause de révélation des prix** doit figurer au **contrat des indépendants** (`FR-C29d`)
4. **L'argumentaire commercial se contredit** sur la visibilité des marges freelance (§1.3 catalogue)
5. **`Q3` du Stock** — à ressortir au lancement du module
