# STORY-609 : L'entitlement porte une échéance, et le renouvellement prolonge

Status: todo

**Épic :** EPIC-041 — Abonnements Prospera et entitlements par événement
**Service :** `platform-catalog-service` *(⚠️ hors `paiement-service`)*
**Points :** 5 · **Sprint :** S35
**Prérequis :** **STORY-279** (le catalogue consomme `paiement.abonnement.*`)
**Origine :** revue d'architecture du 2026-09-06 · FR-P44→P47, grille tarifaire v3.0.

---

## Le récit

En tant que **Money Vibes**, je veux qu'un droit d'usage **expire de lui-même**, afin qu'une licence
non renouvelée cesse sans que personne n'ait à penser à la retirer.

## Le fait

⛔ **Aujourd'hui un droit octroyé est un droit perpétuel.** `Entitlement` porte un module, une
version de code, un référentiel, une configuration et un statut. **Aucune échéance.** Le seul organe
d'extinction est la révocation, qui exige deux choses fragiles : le réseau, et quelqu'un qui y pense.

⚡ **Le modèle commercial rend ce trou coûteux.** La grille vend une licence annuelle par bundle
**plus une maintenance mensuelle à partir de la deuxième année**. Un client qui cesse de payer garde
le produit tant qu'un humain n'agit pas. Et pour une instance installée chez le client, cet humain
doit en plus **pouvoir joindre l'instance**.

⚡ **L'inversion : un droit qui expire par défaut, un renouvellement qui prolonge.** C'est le seul
modèle où le **silence ferme**. L'oubli devient sans conséquence, et la révocation retrouve son vrai
rôle — la sanction, pas la facturation.

⛔ **Expiré n'est pas révoqué, et les fusionner fusionnerait deux remèdes.** *Expiré* se soigne en
payant ; *révoqué* se soigne en levant une sanction. La leçon de `STORY-603` s'applique mot pour
mot : deux causes qui ne se soignent pas pareil ne peuvent pas porter le même code.

⚡ **L'expiration se LIT, elle ne s'écrit pas.** Comparer l'échéance à l'instant de la lecture ne
peut pas être oublié. Une tâche planifiée qui bascule les statuts, si : elle tombe, et le droit reste
ouvert sans que rien ne le dise.

## Critères d'acceptation

- [ ] AC-1 — Un `Entitlement` porte une **échéance**. L'absence d'échéance est un cas **explicite et
      nommé** (droit sans terme), jamais un champ vide qui se lirait « pour toujours » par accident.
- [ ] AC-2 — ⚡ **L'expiration ferme à la LECTURE**, par comparaison à l'instant. Aucune tâche
      planifiée n'est nécessaire pour qu'un droit expiré cesse d'ouvrir un module.
- [ ] AC-3 — `paiement.abonnement.echeance.encaissee` **PROLONGE** l'échéance ; il ne recrée pas
      l'entitlement et ne perd pas sa configuration, son référentiel ni sa version de code.
- [ ] AC-4 — L'état absolu publié dans `entitlement.changed` distingue **expiré** de **révoqué** et
      de **suspendu**. Les consommateurs existants continuent de lire `ACTIVE` sans changement.
- [ ] AC-5 — La consommation est **idempotente sur `eventId`** et supporte l'arrivée **dans le
      désordre** : un renouvellement plus ancien ne raccourcit jamais une échéance déjà prolongée.
- [ ] AC-6 — Un droit **expiré** puis payé **rouvre** sans intervention manuelle, et le test le
      montre sur le même entitlement, pas sur un nouveau.
- [ ] AC-7 — La migration des entitlements existants est explicite : ils reçoivent le cas *sans
      terme*, jamais une échéance devinée.

## Notes

⛔ **Le jeton de licence hors ligne n'est PAS dans cette story.** Pour une instance installée chez le
client, l'échéance ne suffit pas : il faut un jeton signé par la plateforme, à durée courte,
vérifiable hors ligne avec la clé publique. Cela exige une clé de signature, une politique de
rotation et une décision d'exploitation. **Nommé ici, reporté à un cadrage propre.**

⚠️ **Cette story change un contrat lu par tous les verticaux.** `bilan`, `fiscal`, `dossier`,
`paiement` et `balance` lisent tous `entitlement.changed`. L'ajout doit être **rétrocompatible** et
annoncé aux équipes avant livraison — sans quoi un service qui teste `statut !== REVOKED` ouvrirait
un module expiré.
