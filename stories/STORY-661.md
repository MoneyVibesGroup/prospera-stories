# STORY-661 : L'adresse de paiement du payeur — un moyen de paiement, pas un profil

Status: done

**Épic :** EPIC-036 — Fournisseurs de paiement interchangeables et simultanés
**Service :** `paiement-service`
**Points :** 5 · **Sprint :** ⚠️ **NON SLOTTÉE** — première story de la phase A de `PLAN-PI-SPI-CAS-D-USAGE-2026-09-15`.
**Prérequis :** **STORY-290** (le payeur d'une créance), **STORY-600** (l'adaptateur du schéma), **STORY-652** (la clé d'API)
**Origine :** inventaire du 2026-09-15 : le port attend l'adresse de paiement du payeur, et aucune donnée du service ne la porte.

---

## Le fait

Pour pousser une demande de paiement, le schéma interopérable exige l'adresse de paiement du
**payeur** : on ne demande pas d'argent à un inconnu (STORY-600). L'adaptateur la lit dans
`contactPayeur.adresseDePaiement` et refuse sans elle, avant tout appel. **Mais aucune créance ni
aucune demande ne la porte** : le payeur n'a qu'un nom, un téléphone et un courriel. Aucune demande
PI-SPI ne peut donc partir de données réelles, et toute la phase A en dépend.

⚡⚡ **UNE ADRESSE DE PAIEMENT EST UN CANAL, PAS UN PROFIL.** Le domaine écrit, sur les deux schémas
du payeur : *« un nom et au plus deux canaux — aucun profil ; tout champ de plus ici serait un
profil qui commence »*. La règle est juste, et cette story la **tient** au lieu de la contourner. Le
téléphone est là pour qu'on **envoie** le lien au payeur ; l'adresse de paiement est là pour qu'on
lui **pousse** la demande. C'est le même rôle — joindre le payeur pour cet encaissement-là — sur un
autre canal. Et elle ne porte aucune donnée personnelle : c'est un identifiant de 36 caractères tiré
au hasard par la plateforme.

⛔⛔ **CE QUE L'ANNUAIRE RÉPOND N'EST JAMAIS RANGÉ.** Le guide d'enrôlement exige de **rechercher**
l'adresse et d'**afficher** le nom et le pays du titulaire pour qu'on le reconnaisse, avant
d'enregistrer. Ce nom et ce pays sont exactement un profil qui commence : ils servent à la
confirmation, à l'écran, et s'arrêtent là. Le service range l'**adresse** que l'organisation a
confirmée, jamais ce que le schéma a dit de son titulaire.

⚠️ **L'ANNUAIRE NE CONFIRME QUE LES ADRESSES DE PAIEMENT.** Le schéma accepte aussi un numéro de
téléphone ou un code marchand comme alias de payeur, mais sa recherche refuse tout ce qui n'est pas
une adresse de 36 caractères. Une adresse qu'on ne peut pas faire confirmer ne s'enregistre pas
selon le guide : la story se limite donc aux adresses de paiement.

## Critères d'acceptation

- [x] AC-1 — Le payeur porte une **adresse de paiement facultative**, sur la créance, et **figée**
      sur la demande à l'émission comme le reste du payeur. Sa forme est contrôlée à l'écriture —
      36 caractères au format d'identifiant universel — et un écart est **refusé**, jamais corrigé.
- [x] AC-2 — ⛔ **Elle survit à chaque recopie.** Le payeur est recopié champ par champ à plusieurs
      endroits : schémas, domaine, relecture des documents, vues. Une recette relit une créance et une
      demande écrites avec une adresse, et **échoue si une seule couche l'a perdue** — c'est le défaut
      qu'un champ ajouté produit sans bruit.
- [x] AC-3 — Une **question à l'annuaire** rend le nom et le pays du titulaire d'une adresse, **sans
      rien écrire**, sous `paiement:demande:emettre` — aucun droit nouveau : c'est le geste de celui
      qui émet. Une adresse inconnue est un refus nommé ; l'absence de tout fournisseur capable de
      répondre en est un autre, jamais une panne.
- [x] AC-4 — ⛔⛔ **Ni le nom ni le pays rendus ne sont rangés**, nulle part. Et l'adresse du payeur
      n'entre dans **aucune** trace d'audit ni charge publiée : le payeur y reste désigné par son nom,
      comme aujourd'hui.
- [x] AC-5 — Le port gagne une méthode **facultative et asynchrone** — elle parle au fournisseur. Son
      absence se lit « ce fournisseur ne sait pas reconnaître une adresse », jamais « tout va bien »,
      et la garde qui recense les méthodes du port en tient compte.

## Ce qui sera facile à rater

1. ⛔⛔ **Ranger le nom rendu par l'annuaire « pour ne pas le redemander ».** C'est le profil que la
      règle interdit, et une donnée personnelle venue d'un tiers.
2. ⛔ **Perdre le champ dans une recopie explicite.** Voir AC-2.
3. ⚠️ **Ajouter `adresseDePaiement` au tamis du journal d'audit.** Le port porte déjà un champ de ce
      nom, et la garde qui soumet les noms du port au tamis rougirait — le piège déjà payé en
      STORY-256. La règle « le payeur n'est tracé que par son nom » est tenue par les fabriques de
      traces, et une recette la vérifie.
4. ⚠️ **Accepter un numéro de téléphone comme adresse de paiement.** Voir « Le fait ».

## Ce que la story ne fait pas

- **Émettre la demande vers le fournisseur** : STORY-662.
- **Compléter le payeur d'une créance déjà écrite** : aucune route ne le permet aujourd'hui, pour
      aucun canal. L'adresse se donne à la saisie ou à l'émission.
- **Les alias téléphone et code marchand** : voir « Le fait ».

## Livraison (2026-09-15)

- Branche `MNV-661` (b8ff84d), empilée sur `origin/dev` (MNV-660).
- Route : `POST /api/v1/adresses-de-paiement/reconnaissance` → `{ nom, pays }`, rien d'écrit.
- Port : `reconnaitreUneAdresseDePaiement?` ; registre : `fournisseursQuiReconnaissent()`.
- Recette d'appel réel (simulateur BCEAO) : l'annuaire reconnaît l'adresse de payeur — 7 prouvés,
  1 bloqué (adresse d'encaissement du client business non renseignée), 0 échec.
- Docker : service `healthy`, route montée, `401` sans jeton.
- Suites : 3 342 unitaires (+34), 261 e2e, lint 0.

## Notes

- Voir [[STORY-290]] (le payeur), [[STORY-600]] (on ne demande pas d'argent à un inconnu),
  [[STORY-276]] (le tamis des contacts), [[STORY-256]] (le piège du tamis sur les noms du port).
