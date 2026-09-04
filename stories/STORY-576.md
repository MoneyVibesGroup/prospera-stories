# STORY-576 : Résolution en chaîne plateforme puis organisation, et déclaration des variables

Status: done  ✅ 2026-09-04 — branche `MNV-576` sur `origin/dev` de `prospera-notification-service`

**Épic :** EPIC-055 — Modèles versionnés, multilingues, et un rendu qui n'exécute rien 🏁
**Service :** `notification-service` (nouveau)
**Points :** 3 · **Sprint :** S41
**Prérequis :** **STORY-574** (modèle versionné) · **STORY-575** (rendu par substitution)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-8, AD-9.

---

## Le fait

⚡ **Une seule copie du socle, portée par `orgId = null`.** La résolution cherche
`Modele(orgId, cle, canal, langue)` puis retombe sur `Modele(null, cle, canal, langue)`.

**Copier le socle au moment de la surcharge est le défaut symétrique, et c'est le plus tentant à
implémenter** : une correction du socle — une faute, une mention légale manquante — n'atteindrait
alors **jamais** les organisations qui ont surchargé, et rien ne le signalerait.

## Critères d'acceptation

- [x] AC-1 — Prospera livre un **socle de modèles système** porté par `orgId = null`. Une
      organisation surcharge **sans altérer** le socle des autres (FR-N11).
- [x] AC-2 — ⛔ **La surcharge ne copie pas le socle.** Un test le prouve dans le sens qui compte :
      corriger un modèle socle **atteint** une organisation qui a surchargé un **autre** modèle, et
      **n'atteint pas** celle qui a surchargé **celui-là**.
- [x] AC-3 — La chaîne de résolution est testée sur ses quatre issues : surcharge trouvée · socle
      trouvé · langue absente · modèle absent (`MODELE_INTROUVABLE`).
- [x] AC-4 — ⚡ Le modèle **déclare** ses variables et leur type. Une variable manquante ou mal typée
      à l'envoi est un **refus nommé** — `VARIABLE_MANQUANTE`, `VARIABLE_MAL_TYPEE` — **jamais** un
      trou dans le message ni la chaîne `undefined` chez un client.
- [x] AC-5 — Le refus survient **avant** toute écriture d'`Envoi` et avant toute remise : aucun quota
      consommé, aucun coût, aucune ligne au journal pour un modèle qu'on a refusé de rendre.

## Notes

🏁 Clôt EPIC-055.

- C'est le seul endroit du bloc où un défaut se voit **chez le destinataire** et pas dans les
  journaux : un `undefined` dans un message part et ne revient pas.

---

## Ce que la livraison a appris (2026-09-04)

**⛔ Deux décisions PO ont dû être prises avant d'écrire une ligne, et elles
n'étaient pas dans la fiche.** Elles étaient annoncées en fin de STORY-575, et
elles changeaient le contenu d'AC-4 et d'AC-1.

**1. `montant` et `booleen` sont refusés à la DÉCLARATION, pas au rendu.** Un
type que le moteur ne sait pas servir, accepté en base, produit un modèle
qu'aucun envoi ne pourra jamais rendre — et son rédacteur ne l'apprend qu'au
premier envoi réel. `montant` exige des décimales qu'AD-16 **interdit de
présumer** (zéro pour le XOF, deux pour l'euro), et seul le référentiel
`pays-devises-ao@AAAA.N` les détient : le port existe, l'adaptateur arrive avec
EPIC-060. `booleen` en mots exigerait une table par langue, que FR-N13 refuse, et
son seul usage réel est **conditionnel**, ce qu'AD-8 exclut. Les deux **restent
dans le vocabulaire** : les effacer aurait fait de leur réouverture une migration
de schéma au lieu d'une décision de moteur. Le rendu les refuse **aussi** — les
deux moitiés doivent tomber pour que la règle tombe.

**2. Le socle vit dans le DÉPÔT, pas derrière une route.** Aucune route ne *peut*
écrire un modèle sans organisation : toutes dérivent l'organisation du jeton, et
le gate de STORY-572 refuse un jeton qui n'en porte pas. Le socle n'a donc pas
d'auteur qui puisse s'authentifier. Une route d'administration aurait percé le
gate pour un usage à peu près jamais quotidien ; corriger le socle est désormais
une **revue de code et un déploiement**, daté et retrouvable.

**⚡ Le socle est idempotent par COMPARAISON DE CONTENU, jamais par un drapeau.**
Un marqueur « socle déjà appliqué » aurait rendu toute correction ultérieure
silencieusement inopérante — le défaut même qu'AD-9 nomme. Et la comparaison doit
porter sur **objet + corps + variables ordonnées** : comparer les seuls corps
aurait rendu **impossible à livrer** une correction portant sur l'objet d'un
e-mail, sans que rien ne le signale.

**⚡ AC-3 a une quatrième issue qu'on oublie, et elle vaut un code à elle.** « La
clé est servie sur ce canal, mais pas dans cette langue » n'est pas « ce modèle
n'existe pas » : dans le premier cas l'appelant peut redemander, et le refus lui
**liste les langues servies**. Les fondre lui aurait fait chercher un modèle qui
existe. ⛔ Et la lecture qui produit cette liste est **filtrée sur les deux mêmes
propriétaires** que la résolution : sans ce filtre, le refus aurait raconté, clé
par clé, ce qu'une organisation voisine détient.

**⚡ Un brouillon non publié ne masque pas le socle.** L'inverse ferait de « je
commence à rédiger ma version » un incident de production, que personne ne
relierait à sa cause.

**⚡ AC-5 est devenu structurel plutôt que disciplinaire.** `figerPourEnvoi` prend
désormais le **jeu de valeurs** et rend le **texte rendu** : on ne peut plus figer
sans avoir rendu. Un refus ne consomme donc rien — aujourd'hui le marquage
d'usage, demain le quota, le coût et la ligne de journal. Corollaire : la garde
`essai-sans-ecriture` a dû être **étendue à deux méthodes**, le chemin d'essai
s'étendant maintenant sur `rendreEssai` et sa moitié partagée `exigerRendu`.

**⚡ Le service ne met RIEN en forme, et c'est une décision de coût, mesurée.**
`Intl.NumberFormat('fr').format(1234.5)` insère **U+202F**, l'espace insécable
étroite, **absente de l'alphabet GSM 03.38**. Un seul de ces caractères fait
basculer tout le SMS en UCS-2 : la capacité tombe de 160 à 70 caractères, la
facture double, sans erreur et sans trace. Rendre service en formatant un nombre
aurait été une décision de facturation cachée dans un formateur. Une date ne se
formate pas non plus, faute de **fuseau** : un envoi préparé à 23 h 30 UTC est
déjà le lendemain à Lomé.

**⚠️ Une valeur blanche sur une variable obligatoire est une ABSENCE.** La
substituer laisserait dans le message le trou qu'AD-8 interdit en toutes lettres.
La variable qu'on veut voir disparaître se déclare **facultative** : c'est alors
une décision du modèle, pas un accident du jeu de valeurs.

**⚠️ Une garde qui lit du TEXTE rougit sur sa propre documentation** — payé une
fois de plus : la garde « aucun propriétaire nul hors du socle » a échoué sur le
**commentaire** du schéma qui explique la règle. Retrait des commentaires avant
balayage, contre-preuve à l'appui.

**⚠️ Le contrôle de forme d'une date ne suffit pas** : `2026-02-30` passe
l'expression régulière, et `Date` accepte le débordement en rendant le 2 mars. La
vérification relit les trois composantes.

**⚠️ `figerPourEnvoi` n'a toujours AUCUN appelant** (STORY-579), et sa garde
d'inertie tient.

1 131 tests unitaires (82 suites) + 69 e2e ; couverture 99,63 / 94,24 / 98,42 /
99,61.
