# PRD Quality Review — Moteur d'installation (`platform-catalog-service`) · 2ᵉ passage

**Date :** 2026-11-10 · **Objet :** `prd.md` réécrit le 2026-11-10 après `revue-1/validation-report.md`
(T-01 → T-30) · **Enjeu :** validation PO ven. 13/11, puis spine de la coque `prospera-app` (qui « part de
C8 ») · **Forme :** capacité plateforme interne, brownfield, chain-top · **Référence :** grille
`prd-validation-checklist.md`, journal `.memlog.md` (lignes 80 → 109 pour les décisions d'après-revue),
`CONTRAT-DE-MODULE-2026-11-09.md`, `stories/STORY-280.md`, `prds/prd-reprise-donnees-2026-11-10/prd.md`.

Les identifiants **G-01 → G-25** reprennent la numérotation de la revue 1 (`validation-report.md`, l. 20).
Les nouveaux constats sont numérotés **N-01 → N-26**.

## Overall verdict

La réécriture est un vrai saut : le §3.1 (trois axes, huit états publiés, table menu / garde / bandeau),
FR-34 → FR-41, C12/C13, NFR-7/NFR-8 et l'horloge scellée referment presque tous les constats de la revue 1,
et le texte reflète fidèlement le journal du PO. Ce qui reste à risque, c'est la **jonction avec ce qui
tourne déjà sur `dev`** : les chemins de droits 2 → 6 (paiement, socle de vertical, licence) posent un
`ACTIVE` que la table des états publiés ne sait pas représenter — ce qui casse la règle de menu au cœur de
la spine de la coque et la décision T-01 du PO pour le distributeur de février — et STORY-280 (impayé ⇒
`SUSPENDED` automatique, arbitrage PO du 08/11) contredit FR-32/FR-41 sans qu'aucune ligne ne le dise.
Les deux se corrigent en une demi-journée de texte ; sans eux, le PRD n'est pas prêt à être consommé.

---

## 1. Decision-readiness — **adequate**

Les décisions sont désormais écrites comme des décisions, avec leur raison et parfois leur coût assumé
(FR-41 : « C'est assumé : le litige se règle alors par la voie du contrat » ; FR-15 : « le silence ne punit
pas » ; FR-17 : deux variantes nommées sur site / plateforme). §0 acte « toutes les FR pour février » et
D3 révisée, et §8.4 dit quels documents doivent bouger. Ce qui manque : deux décisions du PO qui se
contredisent ne sont pas mises face à face (N-02), deux arbitrages ont un coût que le texte ne nomme pas
(N-12, N-13), et §8.2 déclare « Aucun » point ouvert alors que l'ordre de sacrifice lui-même est un
`[ASSUMPTION : à valider par le PO]` et que la charge de Dev B n'est chiffrée nulle part.

### Findings
- **high** **N-02 · Impayé : STORY-280 contre FR-32/FR-41, deux décisions du PO non confrontées** (§3
  « Suspendre », §3.1 axe 3 `SUSPENDU`, FR-32, FR-41, §8.4) — STORY-280 (`Status: done`, « arbitrage PO
  2026-11-08 ») fait passer **automatiquement** `SUSPENDED` tous les modules du contrat sur
  `paiement.abonnement.impayee` (J+7 après l'échéance). Le PRD dit au contraire « Un impayé suit le chemin
  de FR-32 (préavis, puis lecture seule). La suspension complète (`SUSPENDU`) reste une sanction décidée
  par Money Vibes » (FR-41), tout en citant STORY-280 comme source de `SUSPENDU` « impayé décidé » (§3.1).
  Le même impayé produit donc `SUSPENDED` à J+7 sur `dev` et `PREAVIS` jusqu'à J+30 dans le PRD. §8.4
  amende 727 lot 4 mais pas 280. Le titre de FR-41 (« Suspendre à distance une instance ») annonce en outre
  un état d'**instance** que le §3.1 n'a pas (`NORMAL | GEL | VERSION_FIGEE`). *Fix :* une ligne qui dit
  laquelle des deux décisions prime ; si FR-32 prime, ajouter STORY-280 au §8.4 (ne plus consommer
  `impayee` comme suspension, ou seulement après la lecture seule) ; définir ce qu'est un « impayé décidé »
  (qui, quand) ; renommer FR-41 « Faire respecter l'échéance hors ligne ».
- **medium** **N-12 · « Le silence ne punit pas » est faux pour un abonné payé mais coupé** (FR-15, FR-41)
  — FR-41 donne à un abonné « une licence courte, valable jusqu'à sa prochaine échéance payée ». Un abonné
  qui **a payé** mais dont la liaison est coupée ne reçoit pas la licence suivante : elle expire sur
  l'horloge scellée, puis `PREAVIS`, puis `LECTURE_SEULE`. C'est peut-être voulu (le remède est la licence
  par e-mail, FR-22), mais FR-15 promet le contraire en tête de FR. *Fix :* une conséquence dans FR-15 :
  « un abonné payé mais coupé reçoit sa licence par fichier ; sans elle, l'échéance tombe ».
- **medium** **N-13 · Correctifs critiques pour toute version figée : le coût contre la thèse n'est pas
  nommé** (FR-19, FR-32, FR-21, §1, SM-6) — décision du PO légitime (journal l. 88). Mais une instance
  figée peut avoir n majeures de retard (FR-21 l'exempte de la fenêtre N-1) : lui livrer un correctif
  « sans migration » suppose de maintenir un correctif par version figée encore vivante, c'est-à-dire
  plusieurs lignes de code, contre « une seule ligne de version » (§3, FR-21) et « sans dix produits à
  maintenir » (§1). *Fix :* nommer le compromis et le borner (correctifs sur les N dernières majeures
  seulement, ou « au mieux » au-delà), ou un `[NOTE FOR PM]`.
- **low** **§8.2 « Aucun » point ouvert** — défendable après la séance du 10/11, mais §8.3 liste une
  vingtaine d'inférences dont plusieurs portent la spine (deux adresses par instance, sens de « pack »,
  liste `instance:*`, module suspendu caché), sans propriétaire ni date, et l'ordre de sacrifice (§8.4)
  n'y figure pas. *Fix :* trier §8.3 en « à confirmer vendredi » / « laissé à l'architecture ».

## 2. Substance over theater — **strong**

Toujours rien de décoratif. Les deux nouveaux parcours (UJ-4 Rachid, UJ-5 Koffi) racontent enfin le
moteur et renvoient chacun à des FR précises ; les NFR ajoutées sont chiffrées (NFR-7 : 3-2-1, RPO 1 h,
RTO 4 h ; NFR-8 : racine hors ligne, rotation, fichier d'urgence ; NFR-9 : 15 min). Un seul accroc de
substance, dans UJ-4 (N-07, au §7 de ce rapport) : le parcours contredit la FR qu'il illustre.

## 3. Strategic coherence — **adequate**

La thèse (*un seul produit, installé par modules, aux deux hébergements, sous le contrôle du client*) tient
et la partie C est désormais explicitement réduite à un circuit pour février (§0, FR-31). SM-6 et SM-7
mesurent enfin le pari central. Deux réserves : la sonde de SM-6 n'existe pas, et l'arbitrage N-13 tire
contre la thèse sans le dire.

### Findings
- **medium** **SM-6 et SM-7 sans instrument** (§6) — SM-6 se mesure par la « garde C6 en CI », mais le
  contrat (§0, ligne C6) constate « ⚠️ règle écrite (pdv AD-8), **aucune garde transverse** », et aucune
  FR ni §8.4 ne demande de la créer : la cible « 0 » est donc atteinte par défaut. SM-7 a pour cible « en
  baisse », sans source (journal du plan d'installation de FR-40 ?) ni seuil. *Fix :* ajouter la garde C6
  au §8.4 (contrat §7) ; SM-7 « durée mesurée par le plan d'installation (FR-40), 2ᵉ ≤ 50 % du 1ᵉʳ » ou
  équivalent.
- **medium** **N-17 · SM-4 sur la plateforme ne voit que les lectures honnêtes** (SM-4, FR-27, §4.C) —
  SM-4 compte les lectures sans consentement « vérifiées … par le journal de la garde ». Une lecture qui
  passe par la route AD-P16 (que §4.C maintient « pour l'exploitation ») n'entre jamais dans ce journal :
  SM-4 vaut 0 par construction. §8.4 ne demande pas non plus de restreindre AD-P16 à l'exploitation.
  *Fix :* §8.4 « AD-P16 : lecture d'exploitation journalisée, finalité déclarée » et SM-4 alimenté aussi
  par ce journal.

## 4. Done-ness clarity — **adequate**

Saut net depuis « thin » : FR-18 (C12 + `AVEC_PERTE`), FR-9 (cascade des connecteurs), FR-28
(pseudonymisation par liste de champs), FR-29 (poste d'accès), FR-33 (chronologie J0 → certificat),
FR-40 (test de coupure) et FR-15 (« reculer la date du serveur de 40 jours ; l'échéance tombe quand
même ») sont testables tels qu'écrits. Restent des conséquences qui se contredisent entre elles ou qui
s'arrêtent avant la conséquence.

### Findings
- **high** **N-04 · Le feu vert de la Reprise bloque toute mise en service, même sans Reprise** (FR-8,
  FR-7, FR-11, §3 « Mettre en service ») — FR-8 : « La mise en service est **refusée** tant que la
  Reprise de données n'a pas donné son feu vert … `MISE_EN_SERVICE_SANS_FEU_VERT` (409) ». Or FR-7 : sans
  Reprise dans l'offre, seulement « un avertissement à lire, non bloquant » ; FR-11 : « Un module sans
  reprise de données peut être promu le jour même ». Tel qu'écrit, un client sans Reprise ne passe jamais
  En service, et un module ajouté à un client déjà En service attend un feu vert qui ne viendra pas.
  *Fix :* « refusée tant que la Reprise, **quand l'offre l'inclut et que le sous-ensemble mis en service a
  un lot de reprise**, n'a pas donné son feu vert » ; aligner la définition du §3.
- **high** **N-06 · Le prospect après la fin de l'essai : « l'accès se ferme » mais il doit exporter**
  (FR-33, §3.1 axe 3, FR-36) — FR-33 : « À son terme, l'accès se ferme » puis « → **30 jours pour
  exporter** ou signer ». Comment exporte-t-il sans accès ? L'axe 3 écrit « fin de l'essai → fermé », un
  état qui n'existe ni dans l'axe 3 ni parmi les huit états publiés : la coque ne sait pas quoi afficher
  pendant ces 30 jours (FR-36 lui confie « le compte à rebours de l'essai »). *Fix :* un état
  `ESSAI_TERMINE{effaceLe}` (export seul, bandeau « effacement le … ») dans l'axe 3 et dans la table
  publiée, ou dire que l'export passe par Money Vibes.
- **medium** **N-10 · FR-9 : lecture du vrai logiciel permise, identifiants du réel interdits** (FR-9) —
  « La **lecture** depuis le vrai logiciel du client reste permise pendant l'essai » mais « L'espace
  d'essai n'a **jamais les identifiants** du réel … le serveur refuse une destination déclarée pour l'espace
  réel ». Lire le vrai Odoo exige une destination et des identifiants du vrai Odoo. *Fix :* « des
  identifiants **en lecture seule**, propres à l'essai, vers le vrai logiciel ; toute écriture par eux est
  refusée `ECRITURE_REELLE_DEPUIS_ESSAI` ».
- **medium** **N-11 · Interception totale contre usage autonome de l'essai** (FR-9, FR-6, FR-33, UJ-5
  étape 2) — FR-9 intercepte « SMS, WhatsApp, e-mail » sauf liste blanche de test. Le prospect autonome
  (FR-33) et les utilisateurs clés (UJ-5) doivent pourtant recevoir **invitation, code de connexion,
  réinitialisation de mot de passe** de l'espace d'essai ; FR-6 compte l'invitation interceptée comme
  réussie alors que personne ne la reçoit. *Fix :* une exception nommée : les messages d'identité aux
  utilisateurs de l'espace d'essai lui-même partent réellement ; tout le reste est intercepté.
- **medium** **N-15 · FR-38 calcule l'écart de dépendances, sans conséquence** (FR-38, FR-12, FR-17) —
  « l'écart avec le contrat de chaque client est calculé avant la mise à jour ». Et ensuite ? Une majeure
  qui ajoute une dépendance non souscrite : mise à jour refusée pour ce client, dépendance ajoutée
  gratuitement au contrat, ou blocage jusqu'à avenant ? Sans réponse, FR-12 (`MODULE_NON_SOUSCRIT`) et
  FR-21 (N-1 obligatoire) se contredisent pour ce client. *Fix :* une conséquence et un code nommé.
- **medium** **N-18 · FR-16 « n'envoie aucune donnée » contre FR-41 « en 24 heures »** (FR-16, FR-41) —
  la vérification quotidienne « n'envoie aucune donnée », mais FR-41 l'utilise pour remettre une licence
  **propre à l'instance** « dans la réponse au prochain contact ». Il faut au moins l'identité de
  l'instance et le numéro de licence courant. *Fix :* « n'envoie que l'identifiant de l'instance, sa
  version et le numéro de sa licence ».
- **medium** **N-14 · NFR-7 : le RPO de 1 h décidé par le PO ne s'applique plus à la plateforme**
  (NFR-7 ; journal l. 85) — le journal enregistre « sauvegardes 3-2-1 chiffrées, … RPO 1 h, RTO 4 h »
  sans restriction d'hébergement. NFR-7 rattache ces valeurs au site puis donne à la plateforme « une
  sauvegarde par jour au moins », soit une perte possible de 24 h pour le distributeur de février,
  marquée seulement `[ASSUMPTION : paliers]`. *Fix :* RPO/RTO explicites pour la plateforme, ou faire
  valider l'écart par le PO.
- **low** **Reste de T-23 (revue 1, origine adversariale)** — FR-26 « un test le vérifie sur chaque
  envoi » reste irréalisable sur un flux libre (un schéma fermé du signal le rendrait vérifiable) ; FR-28
  ne dit rien de la ré-identification par recoupement (montants exacts + année de naissance + agence).
  Non bloquant pour février si FR-28 reste peu utilisé.

## 5. Scope honesty — **adequate**

§0 et §2.2 sont alignés (libre-service du prospect assumé, Connecteurs au lot 1), §8.4 liste ce que le PRD
demande ailleurs, l'exception à Q4 est écrite (FR-33), les comptes Money Vibes sur site sont fermés par
défaut (FR-23). Ce qui reste silencieux : des obligations nouvelles imposées à chaque module hors de C13,
et deux documents qui devraient figurer au §8.4.

### Findings
- **high** **N-05 · De nouvelles obligations de module échappent à C13** (FR-17, FR-32, FR-35, FR-6,
  FR-38, §0, §7 C13) — C13 est défini comme « prérequis, vérifications, santé, interception en essai,
  export et effacement par organisation » (§0, FR-38). Mais la réécriture impose à chaque module, sans
  clause : un **interrupteur de changement par organisation** avec date limite (FR-17) ; le **classement
  de ses routes et de ses droits** en consultation / export / écriture pour la lecture seule (FR-32,
  FR-35) ; une **clef d'idempotence par vérification** (FR-6) ; l'ouverture de son **export** malgré une
  garde 403 (N-03). C'est exactement le mécanisme de T-10 : les PRD des lots 2 à 4 l'ignoreront. *Fix :*
  étendre la liste de C13 (ou C2 pour la lecture seule) et la reporter au §8.4.
- **medium** **§8.4 incomplet** — manquent : STORY-280 (N-02) ; `paiement-service` (le topic
  `paiement.abonnement.preavis.emis` devient « rappel », et FR-12 impose que « la vente résout les
  dépendances comme la console », donc une règle côté contrat/abonnement) ; AD-P16 (N-17) ; la garde C6
  (SM-6) ; l'amendement de C8 (N-03).

## 6. Downstream usability — **adequate** (avec un constat critique qui bloque la spine)

Le premier consommateur trouve enfin ce qu'il venait chercher : une énumération fermée de huit états
publiés, une règle « inconnu ⇒ `NON_INSTALLE` », l'espace dans la lecture (FR-34), deux lieux d'écrans
(FR-36), des droits `instance:*` (FR-35), la correspondance pack → code → menu (FR-37). Le glossaire est
complet et sans synonyme. Mais la règle de menu, qui est la première décision de la spine, a un trou sur
les chemins qu'emprunte justement le distributeur de février, et elle contredit C8 sans demander son
amendement.

### Findings
- **critical** **N-01 · Les chemins de droits 2 → 6 posent un `ACTIVE` que l'état publié ne sait pas
  représenter** (§3.1 axe 2 et « état publié », FR-4, FR-11, FR-12, FR-14, FR-34) — §3.1 : « Le droit
  `ACTIVE` n'est posé qu'à l'entrée en `INSTALLE` … Seuls les chemins de droits nommés de FR-4 (paiement,
  socle de vertical, opérateur) font exception », puis « L'axe 2 prime ». Un module ouvert par l'échéance
  soldée (727 lot 2), le socle de vertical (lot 7), la propagation d'un pack (lot 6) ou la licence est
  donc `ACTIVE` au catalogue mais `NON_INSTALLE` sur l'axe 2 : la table publiée dit « Droit : absent »,
  menu caché, alors que la garde du module (C2, qui lit `entitlement.changed`, FR-34 dernier point) est
  **ouverte**. Le test en matrice de FR-34 (« le menu et la garde ne se contredisent jamais ») échoue par
  construction. Conséquences concrètes : (a) le distributeur de février paie sa première échéance ⇒ tous
  ses modules sont ouverts dans l'**espace réel** avant toute répétition générale, contre la décision T-01
  du PO (journal l. 81) ; (b) sur site, la licence est « projetée en droits du catalogue » (FR-34) sans
  dire dans quel espace : si c'est dans les deux, un module 🟢 en essai est ouvert au réel avant sa mise en
  service ; (c) FR-12 dit qu'un module du contrat « devient **installable** », FR-4 et §3.1 qu'il devient
  `ACTIVE` ; (d) la parenthèse du §3.1 oublie les chemins 3 et 6. *Fix :* distinguer deux faits —
  **souscrit** (contrat, paiement, licence, socle : droit d'installer, `MODULE_NON_SOUSCRIT` sinon) et
  **ouvert** (`ACTIVE`, posé par la mise en service, ou directement pour les seuls chemins dont c'est la
  raison d'être : socle de vertical, opérateur) — et donner, pour chaque chemin de FR-4, l'espace touché et
  l'état publié obtenu. C'est la reprise de l'option (a) de G-13.
- **high** **N-03 · La règle de visibilité et la lecture seule contredisent C8 et C2, et l'export passe
  sous une garde 403** (§3.1 table, FR-32, FR-33, FR-39, §8.4) — C8 : « Une entrée est visible **si et
  seulement si** l'entitlement effectif est `ACTIVE` » ; la table publiée rend `LECTURE_SEULE` (« `ACTIVE`
  échu, `EXPIRED` calculé ») **visible**. C2 : refus de **toute** route métier hors `ACTIVE`, avec un test
  e2e « expiré ⇒ 403 » ; FR-32 ouvre lecture, recherche, export et états réglementaires en lecture seule.
  §8.4 demande seulement que « C2 distingue expiré, `SUSPENDED` et `REVOKED` », rien pour C8 — or la spine
  de la coque part de C8 (contrat §8, C8 « Dépend de »). Par ailleurs FR-39 (« données d'un module
  désinstallé restent exportables »), FR-33 (export du prospect après fermeture) et FR-32 exportent depuis
  des états dont la garde rend 403 : par quelle route ? *Fix :* §8.4 « C8 : visible ssi l'état publié ∈
  {`EN_SERVICE`, `ESSAI_PROSPECT`, `PREAVIS`, `LECTURE_SEULE`} et l'utilisateur a le droit » ; C2 : lecture
  seule par catégorie ; nommer la route d'export C13 comme **exemptée de la garde** et réservée au droit
  `instance:donnees:exporter`.
- **medium** **N-08 · FR-22 place encore « Mettre à jour depuis un fichier » dans la console** (FR-22,
  FR-36, FR-23) — FR-22 : « le DSI la dépose dans la console de l'instance … La console offre l'écran
  « Mettre à jour depuis un fichier » ». FR-36 met cet écran dans `prospera-app` « Administration », et
  les comptes Money Vibes de la console sont « fermés par défaut » (FR-23). *Fix :* remplacer « console »
  par « `prospera-app`, Administration (droit `instance:fichier:deposer`) » dans FR-22.
- **medium** **N-09 · Le droit de consentir s'attribue comme les autres, contre FR-27** (FR-35, FR-27) —
  FR-35 : « L'administrateur du client attribue ces droits lui-même », dont
  `instance:consentement:donner`. FR-27 : le consentement est donné « par le **dirigeant (DG)** du client,
  ou par une personne qu'il **désigne par écrit** ». Un DSI administrateur peut donc s'attribuer le droit
  de consentir. *Fix :* ce droit n'est attribuable que par le DG (ou réservé au rôle DG), et la
  désignation écrite est enregistrée au registre.
- **medium** **N-16 · Plateforme : un seul espace d'essai partagé, une majeure et des répétitions en
  cours** (FR-10, FR-17, FR-8, FR-33, §3.1 axe 1) — sur la plateforme, l'essai est un déploiement partagé
  par toutes les organisations et les prospects. Quand une version y arrive d'abord (FR-17), une
  répétition générale en cours rejoue un dossier d'installation préparé en N+1 vers un réel en N ; et le
  rafraîchissement « obligatoirement avant une mise à jour majeure » est « refusé pendant une répétition
  générale en cours » (FR-10) : une seule organisation peut bloquer une majeure de toute la plateforme.
  *Fix :* dire si le rafraîchissement obligatoire vaut sur la plateforme, et la règle de version d'un
  dossier d'installation (rejoué seulement vers la même version de plateforme).
- **low** **N-26 · « instance » n'est pas un code de module** (FR-35, §7 C7/C8) — les droits
  `instance:*` suivent le format `<module>:<objet>:<action>` (C7), mais aucun module `instance` n'existe au
  catalogue, et l'état publié du module d'écran « Administration » (toujours présent ? gardé par quoi ?)
  n'est pas dit. *Fix :* déclarer le moteur comme module du socle, toujours `EN_SERVICE`.

## 7. Shape fit — **adequate**

La forme est la bonne pour une capacité plateforme chain-top : glossaire, états, FR à conséquences, contrat
du moteur, renvois brownfield nombreux et pour la plupart exacts (727 lots 2/4/6/7, STORY-609, 166/167,
365, `fenetre-de-support.ts` désormais décrit comme « règle nouvelle … qui reprend le principe »). Deux
défauts : une citation brownfield fausse (STORY-280, N-02) et un parcours qui contredit sa FR.

### Findings
- **medium** **N-07 · UJ-4 contredit FR-12** (UJ-4, FR-12, FR-2) — « Moussa … a signé « Terrain & Ventes »
  plus Facturation » ; puis « Cocher Relances ajoute Facturation » (déjà au contrat, et Relances ne l'est
  pas : `MODULE_NON_SOUSCRIT` selon FR-12, « Rachid ajuste dans ses limites ») ; puis « Encaissements passe
  🔴 », module qui n'est pas au contrat non plus. Le parcours qui doit illustrer « le contrat fait foi »
  installe deux modules hors contrat. *Fix :* faire signer à Moussa Terrain & Ventes + Relances +
  Encaissements, et laisser FR-2 ajouter Facturation à la vente.
- **low** **Renvois à la revue dans le texte produit** — §3 (« G-09, G-12 »), FR-7 (« G-12 »), FR-8
  (« G-09 »), §3.1 (« voir T-16 pour le PO »), FR-34 (« T-29 »), titres de FR-34 → FR-40 (« T-01 »,
  « T-07 »…). Ces identifiants ne se résolvent pas pour la spine ni les stories. *Fix :* les remplacer par
  « décision du PO, 2026-11-10 » (le journal garde la trace).

---

## Suivi de la revue 1

| # | Constat de la revue 1 | Statut | En une ligne |
|---|---|---|---|
| G-01 | Pas de découpage par échéance | **résolu** | §0 : toutes les FR pour février, démo 15/01 = partie A ; SM-1 réécrit ; ordre de sacrifice au §8.4 (charge de Dev B non chiffrée). |
| G-02 | §8 « aucune question ouverte » faux | **partiel** | §8.2 « Aucun » devient défendable, mais pas de `[NOTE FOR PM]` et §8.3 n'a ni propriétaire ni date. |
| G-03 | Le gel bloque l'achat d'un module | **résolu** | Gel ≠ version figée ; achat en version figée = retour payant à la maintenance (FR-32, §3.1). |
| G-04 | Pari « sans dix produits » non mesuré | **partiel** | SM-6 et SM-7 ajoutés, mais la garde C6 n'existe pas et SM-7 n'a ni source ni seuil. |
| G-05 | Partie C sans indicateur | **résolu** | C réduite à un circuit pour février (FR-31) ; SM-4 étendu à la plateforme. |
| G-06 | FR-18 promet l'impossible | **résolu** | C12 (étendre puis contracter, test par module) + `retourArriere: AVEC_PERTE` avec bandeau rouge. |
| G-07 | Connecteurs écrivent depuis l'essai | **résolu** | Cascade bac à sable → interception → jamais le réel, refus nommé (FR-9) ; voir N-10. |
| G-08 | Sauvegardes et clés sans bornes | **résolu** | NFR-7 (3-2-1, RPO/RTO, test mensuel) et NFR-8 (racine, rotation, révocation, fichier d'urgence) ; voir N-14. |
| G-09 | Mise en service par étapes impossible | **résolu** | Mise en service par sous-ensemble, état « En service partiel » (§3, FR-7, FR-8). |
| G-10 | Partie C peu vérifiable | **résolu** | Champs retirés, table de correspondance locale, double approbation, poste d'accès (FR-28, FR-29). |
| G-11 | « Sans incident » non défini | **résolu** | « Incident » au §3 ; correctifs hors vagues (FR-19, FR-20). |
| G-12 | Lignes « non installé » bloquantes | **résolu** | Seules l'offre et ses dépendances dures comptent ; « hors offre » grisé (FR-7). |
| G-13 | STORY-727 contredit FR-8/11 et SM-1 | **partiel** | Chemins nommés et classés « droit » (FR-4), mais leur effet sur l'état publié n'est pas défini (N-01). |
| G-14 | Feu vert de la Reprise sans FR | **résolu** | FR-8 refuse sans feu vert, C5 le consomme ; mais la condition est trop large (N-04). |
| G-15 | D3 révisée non citée | **résolu** | §0 et §8.4 actent D3 révisée, contrat §9 et AD-P17 à amender. |
| G-16 | §0 contredit QA-3 | **résolu** | §0 : Connecteurs au lot 1, requis en février. |
| G-17 | Effacement sans propriétaire | **résolu** | Exception écrite à Q4, chronologie, certificat, effacement par chaque module (C13). |
| G-18 | Aucun modèle d'état ni règle de menu | **partiel** | §3.1 + FR-34 très bons ; trous : chemins 2 → 6 (N-01), prospect après fin (N-06), C8 non amendé (N-03). |
| G-19 | « Pack » à deux sens | **partiel** | Pack / socle de vertical séparés (`[ASSUMPTION]`), mais §1 et SM-1 parlent encore d'« un pack distributeur ». |
| G-20 | Écrans client sans lieu ni droits | **partiel** | FR-35/FR-36 les placent ; FR-22 dit encore « console » (N-08) ; droit de consentir mal gardé (N-09). |
| G-21 | AD-P16 et recette court-circuitent le consentement | **résolu** | Recette automatique, comptes MV fermés, clause unique + garde technique du registre (FR-17, FR-23, FR-27) ; voir N-17. |
| G-22 | §7 range tout dans le catalogue | **résolu** | Parties B et C laissées à la spine `[ASSUMPTION]` ; la ligne C3 parle encore pour tout le moteur (mécanique). |
| G-23 | FR-21 cite mal l'existant | **résolu** | N-1, règle nouvelle, version de plateforme définie, hors fenêtre = fin du support. |
| G-24 | FR-32 cite 280 au lieu de 727 | **résolu** | 727 lot 4 cité, « rappel » / « préavis » distingués ; mais 280 reste mal décrit (N-02). |
| G-25 | Parcours sans le moteur | **résolu** | UJ-4 (Rachid) et UJ-5 (Koffi) ajoutés `[ASSUMPTION]` ; UJ-4 contredit FR-12 (N-07). |
| M-1 | Bandeau d'en-tête périmé | **résolu** | Nouvel en-tête exact. |
| M-2 | « Rejouée à frais » | **résolu** | « refaite à neuf » (FR-33). |
| M-3 | Dérive de vocabulaire (environnement, production, Suspendre = Désinstaller) | **résolu** | UJ-1 corrigé ; Suspendre et Désinstaller définis séparément. |
| M-4 | Termes absents du glossaire | **résolu** | Prospect, offre d'essai, bilans, recette, module commercial, bilan d'instance ajoutés (nouveaux absents : voir Mechanical notes). |
| M-5 | Identifiants hors d'ordre | **résolu** | Signalé au §0 (« identifiants stables »). |
| M-6 | Niveau de titre §2.3 | **partiel** | « ### 2.3 » corrigé, mais les UJ sont aussi en `###`, au même niveau que 2.3. |
| M-7 | Codes de refus voisins | **résolu** | Tous renvoyés, ordre fixé (FR-4). |
| M-8 | Litige évitable en coupant la liaison | **résolu** | Assumé explicitement (FR-41). |
| M-9 | Frontmatter « Cabinet » | **résolu** | §0 : servi comme le distributeur `[ASSUMPTION]`. |
| M-10 | Index des hypothèses / aucun `[NOTE FOR PM]` | **partiel** | §8.3 indexe presque tout (manque l'ordre de sacrifice) ; toujours aucun `[NOTE FOR PM]`. |

**Bilan : 27 résolus · 8 partiels · 0 non résolu** (sur 35 : 25 constats + 10 notes mécaniques).

---

## Nouveaux défauts introduits par la réécriture

| # | Sévérité | Nature | Emplacement | Constat (détaillé dans la dimension) |
|---|---|---|---|---|
| N-01 | **critical** | contradiction interne + existant | §3.1, FR-4, FR-12, FR-34 | Chemins 2 → 6 : `ACTIVE` sans `INSTALLE`, menu caché et garde ouverte ; ouverture au réel avant mise en service (§6) |
| N-02 | **high** | contradiction avec `dev` / décisions PO | FR-32, FR-41, §3.1, §8.4 | STORY-280 suspend à J+7, le PRD préavise 30 j ; FR-41 nomme un état d'instance inexistant (§1) |
| N-03 | **high** | contradiction avec le contrat | §3.1, FR-32, FR-39, FR-33, §8.4 | `LECTURE_SEULE` visible contre C8, lecture contre C2, export sous garde 403 ; C8 non amendé (§6) |
| N-04 | **high** | contradiction entre FR | FR-8, FR-7, FR-11, §3 | Feu vert exigé même sans Reprise dans l'offre (§4) |
| N-05 | **high** | obligation hors contrat | FR-17, FR-32, FR-35, FR-6, C13 | Interrupteurs, lecture seule par catégorie, idempotence, export hors garde : hors C13 (§5) |
| N-06 | **high** | contradiction interne + état manquant | FR-33, §3.1 axe 3 | « L'accès se ferme » puis « 30 jours pour exporter » ; état `fermé` absent (§4) |
| N-07 | medium | parcours contre FR | UJ-4, FR-12 | Relances et Encaissements installés hors contrat (§7) |
| N-08 | medium | renvoi non mis à jour | FR-22, FR-36 | Écran « fichier » dans la console contre `prospera-app` (§6) |
| N-09 | medium | contradiction entre FR | FR-35, FR-27 | Droit de consentir attribuable par l'administrateur (§6) |
| N-10 | medium | contradiction interne | FR-9 | Lecture du vrai logiciel contre « jamais les identifiants du réel » (§4) |
| N-11 | medium | contradiction entre FR | FR-9, FR-6, FR-33 | Invitations et codes de connexion interceptés dans l'essai autonome (§4) |
| N-12 | medium | compromis non nommé | FR-15, FR-41 | Licence courte : le silence punit l'abonné payé coupé (§1) |
| N-13 | medium | compromis non nommé | FR-19, FR-32, FR-21 | Correctifs pour toute version figée contre une seule ligne de version (§1) |
| N-14 | medium | fidélité au journal | NFR-7 | RPO 1 h ramené à 24 h sur la plateforme sans décision (§4) |
| N-15 | medium | conséquence manquante | FR-38 | Écart de dépendances calculé, sans effet (§4) |
| N-16 | medium | cas non traité | FR-10, FR-17 (plateforme) | Essai partagé : majeure contre répétitions en cours (§6) |
| N-17 | medium | indicateur aveugle | SM-4, §4.C, §8.4 | AD-P16 hors du journal de la garde ; SM-4 = 0 par construction (§3) |
| N-18 | medium | contradiction entre FR | FR-16, FR-41 | « Aucune donnée » contre licence propre à l'instance en 24 h (§4) |
| N-19 | low | incohérence de définition | §3 « Gel », FR-15, FR-19 | Levée du gel : « premier contact » (tout fichier, y compris le correctif de sécurité qui doit justement passer *en* gel) contre « signal ou licence fraîche » |
| N-20 | low | dérive | §1, SM-1 | « un pack distributeur » n'a plus de référent (packs = Terrain & Ventes… ; socle ≠ pack) |
| N-21 | low | promesse non bornée | §1, titre de FR-18 | « sans rien perdre pendant 7 jours » sans la réserve `AVEC_PERTE` |
| N-22 | low | dérive | FR-33, §3 « Rappel » | « J+23 rappel » emploie un terme défini pour l'abonné seulement |
| N-23 | low | §8.4 incomplet | §8.4, FR-12 | `paiement-service` (topic renommé, dépendances à la vente), garde C6, AD-P16 absents |
| N-24 | low | renvoi cassé | §4.C | « face à des distributeurs concurrents (FR-30) » : FR-30 n'en parle pas |
| N-25 | low | promesse inexacte | FR-33, NFR-7 | Certificat d'effacement remis alors que les sauvegardes gardent les données jusqu'à 3 mois : le certificat doit dater leur expiration |
| N-26 | low | état non défini | FR-35, §7 | Module `instance` / « Administration » sans code ni état publié (§6) |

**Compte : 1 critical · 5 high · 12 medium · 8 low.**

---

## Mechanical notes

- **Identifiants :** FR-1 → FR-41 uniques et sans trou (ordre non séquentiel assumé au §0) ; NFR-1 → NFR-10
  et SM-1 → SM-7 contigus ; QA-1 → QA-4, QB-1/2, QC-1 se résolvent. UJ-1 → UJ-5 nommés, protagonistes
  présents.
- **Renvois vers la revue** dans le texte produit (G-09, G-12, T-01, T-07, T-09, T-10, T-16, T-21, T-24,
  T-29) : à remplacer par « décision du PO, 2026-11-10 ».
- **Frontmatter :** `validation: validation-report.md` pointe vers un fichier qui vit dans `revue-1/`.
- **Niveaux de titre :** UJ-1 → UJ-5 en `###`, frères de « ### 2.3 » au lieu d'en être les enfants ; UJ-4
  et UJ-5 n'ont pas de ligne vide après le titre.
- **Termes employés hors glossaire :** feu vert (central pour FR-8 et C5), vague, client pilote, bac à
  sable, liste blanche de test, plan d'installation (FR-40), poste d'accès contrôlé (FR-29), certificat
  d'effacement, état publié (défini au §3.1 seulement). Le PRD Reprise emploie « bascule », que ce
  glossaire ne relie pas à « mise en service ».
- **« Bilan d'instance » :** défini comme le bilan qui *clôt le montage* (§3, FR-25), mais NFR-7 le fait
  « passer en orange » chaque mois : c'est le voyant de santé de l'instance (FR-16), pas ce bilan.
- **§7 C3 :** « Possède : … licences, consentements » parle pour tout le moteur alors que l'en-tête du §7
  confie B et C à d'autres services.
- **Index des hypothèses :** l'aller-retour tient pour toutes les marques en ligne, sauf l'ordre de
  sacrifice (§8.4), absent du §8.3. FR-22 utilise une marque non standard (`[hors périmètre du produit :
  décision commerciale]`) ; NFR-8 « changent chaque année » n'est ni au journal ni marqué.
- **§8.1 :** la liste des thèmes tranchés le 10/11 ne dit pas *ce qui* a été tranché ; pour la séance du
  13/11, une table thème → choix → FR éviterait au PO de rouvrir le journal.
- **§3.1 :** la parenthèse « (paiement, socle de vertical, opérateur) » ne reprend que trois des cinq
  chemins d'exception de FR-4.
- **Contrat de module :** cité et respecté (onze lignes + C12/C13 au §7) ; demandes d'amendement au §8.4,
  à compléter pour C8 (N-03).
