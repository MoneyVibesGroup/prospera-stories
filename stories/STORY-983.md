# STORY-983 : les champs sensibles et le registre `classification-sante`

Status: done

**Complexité :** moyenne (deux bibliothèques à fichier unique, un registre, une garde rejouée contre Karapace)

**Épic :** EPIC-201 (le socle technique : services, migrations et protection des données)
**Dépôt :** `MoneyVibesGroup/prospera-plateforme`, dossiers de C seulement : `champs-sensibles/`, `classification-sante/`
(README du dépôt, « Qui écrit dans quel dossier »)
**Plage :** groupe C, n° 4 du lot de C (`coordination/PLAN-4-SESSIONS-2026-11-14.md` §5). Attendait STORY-931 (B) :
faite (plateforme #1).

---

## Pourquoi

Un dossier corporel porte des **données de santé** (FR-9 : certificats médicaux, taux d'incapacité, rapports
d'expertise médicale, pièces du médecin-conseil) ; la loi togolaise n° 2019-014 en interdit le traitement par principe
(art. 21). Deux choses doivent exister **avant** le premier champ du dossier (EPIC-205 et suivants) :

1. **une seule liste** des champs et des pièces classés « santé », que tout fait publié est vérifié de ne pas porter
   (spine assurance, AD-23 ; FR-196, FR-227, FR-232 : rien de médical ne sort, ni vers la compagnie, ni dans un message,
   ni dans un lot sortant) ;
2. **une seule façon de chiffrer** un champ, et de retrouver un téléphone ou une pièce d'identité chiffrés **à
   l'égalité** par un index aveugle (AD-24, héritage de la microfinance AD-18 ; FR-253 : téléphones, pièces d'identité
   et champs de santé illisibles dans le stockage).

## Ce qui doit être vrai à la fin (plan §5, n° 4 ; EPIC-201, « Fini quand »)

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **Chiffrement par champ** : une enveloppe versionnée (version de clé, nonce, texte chiffré, étiquette), AES-256-GCM, liée à son **contexte** (organisation, champ) ; un texte altéré, un autre contexte, une clé inconnue sont **refusés par un code nommé**, jamais déchiffrés en silence | tests de `champs-sensibles` |
| AC-2 | **Index aveugle** : HMAC-SHA-256 sous une clé d'index distincte de la clé de chiffrement, après normalisation ; **un téléphone chiffré se retrouve à l'égalité** quelle que soit sa graphie (`+228 90 12 34 56`, `0022890123456`, `90-12-34-56`) ; deux organisations n'ont pas le même index pour le même numéro | tests ; vecteurs |
| AC-3 | **Vecteurs** reproductibles (clés, nonce et entrées fixés) : chaque copie de la bibliothèque dans un service les rejoue à l'octet | `champs-sensibles/vecteurs.json` ; test |
| AC-4 | **Registre `classification-sante`** versionné, par module : champs et types de pièces classés « santé », avec leur motif (FR) ; son schéma est en draft-07 fermé | `classification-sante/classification-sante.json` ; test |
| AC-5 | **La garde** : **un champ de santé ajouté à un schéma d'événement fait échouer la CI** (JSON Schema et Avro, à toute profondeur, quelle que soit la casse ou la graphie `snake_case`) ; un champ d'un module de C absent du registre refuse le schéma ; elle tourne sur les schémas de `contrats/assurance/` et **contre un registre Karapace vivant** | tests ; script Karapace prouvé sur une pile |
| AC-6 | Les deux bibliothèques sont **un fichier unique sans import** hors `node:` (patron de `garde-etat-publie`) : un service les copie à une étiquette et garde leur empreinte | README des dossiers |

## Décisions retenues par défaut (contestables)

- **D-983-1 — Le registre vit dans `classification-sante/`**, pas dans `contrats/assurance/` comme l'écrit la spine
  (AD-23) : le README du dépôt (B, STORY-931) a donné ce dossier au registre. Un seul fichier, un seul endroit.
- **D-983-2 — `node:crypto`, sans bibliothèque tierce.** AES-256-GCM (nonce de 96 bits tiré au hasard), HMAC-SHA-256.
  Le choix de la bibliothèque et la rotation étaient renvoyés à la story de pointe de la microfinance (AD-18) : elle n'a
  pas eu lieu ; l'assurance en a besoin la première. La hiérarchie de clés est posée (clés de données enveloppées par
  une clé maîtresse) ; **le coffre et le déverrouillage à deux personnes restent hors de cette story** (exploitation,
  EPIC-221 ; microfinance).
- **D-983-3 — L'index aveugle porte l'organisation** dans son entrée : le même téléphone dans deux organisations donne
  deux index (pas de rapprochement entre clients d'une plateforme partagée). Il porte aussi la **nature** du champ
  (`telephone`, `piece-identite`) : un numéro de téléphone et un numéro de pièce identiques ne se confondent pas.
- **D-983-4 — La garde compare des NOMS de champ normalisés** (minuscules, sans accents, sans `_` ni `-`) : un
  `taux_incapacite` est aussi refusé qu'un `tauxIncapacite`. Les champs de santé de **tout** module sont refusés dans
  **tout** schéma ; l'exhaustivité (« un champ absent du registre refuse le schéma », AD-23) ne vaut que pour les
  **modules de C** déclarés au registre.
- **D-983-5 — Les tests de C tournent depuis ses dossiers** (`node --test champs-sensibles/test classification-sante/test`) :
  le `npm test` racine (B) ne les lit pas encore ; demande à B de les ajouter.
- **D-983-6 — Le module d'un contrat de C est son premier dossier** sous `contrats/assurance/` (`contrats/assurance/
  liaison-assureur/…`) ; un schéma posé à la racine de `contrats/assurance/` est refusé (`MODULE_NON_CLASSE`). Le
  module d'un sujet Karapace est le premier segment de son topic (`sinistres.dossier.ouvert@1-value` → `sinistres`).
- **D-983-7 — Les données personnelles directes** d'AD-16 (téléphone, numéro de pièce, date de naissance, adresse
  électronique) sont refusées dans les faits des **seuls modules du registre** : les faits des autres groupes
  (`identity.*` porte une adresse électronique) ne sont pas jugés sur une règle de la spine assurance.
- **D-983-8 — La liste des champs de santé est un défaut**, tirée de FR-9, FR-70 et de l'arbitrage R5 (taux
  d'incapacité, consolidation, lésions, diagnostic, conclusions médicales, échelles de souffrance et d'esthétique,
  tierce personne, cause du décès, rapport médical, texte OCR) et neuf types de pièces. Le médecin-conseil et le
  juriste la relisent (J-02) ; un ajout est une ligne du registre.

## Contexte pour le développeur

- Patron : `paquets/garde-etat-publie` (fichier unique, sans import, empreinte gardée par le service qui le copie).
- Node 24 exécute le TypeScript nativement (`erasableSyntaxOnly`, `verbatimModuleSyntax`) : ni `enum`, ni paramètres de
  constructeur publics.
- Les FR de santé : FR-9 (liste et lecteurs), FR-63/FR-70 (postes corporels), FR-196 (rien de médical au LC), FR-227
  (aucune donnée de santé dans un message), FR-232 (rien de médical ne sort), FR-253 (chiffrement au repos).

## Ce qui a été livré

**2026-11-15** — `prospera-plateforme` **#3**, fusionnée en « Rebase and merge » sur `dev` (`16cc114`). Dix-neuf fichiers,
tous dans `champs-sensibles/` et `classification-sante/`.

- `champs-sensibles/` : `src/index.ts` (fichier unique, imports `node:` seulement), `vecteurs.json` et son générateur,
  README. **40/40** sous Node 24 (`v24.22.3`).
- `classification-sante/` : registre, schéma du registre (draft-07, fermé), garde `src/index.ts`, script
  `scripts/verifier-karapace.ts`, README. **27/27** sous Node 24.
- Suite racine de B inchangée (36 passés, 0 échec) ; `tsc` propre dans les deux dossiers.
- **Karapace 6.2 réel** (pile jetable `grp-c-k`, sans port sur l'hôte) : les trois vrais schémas du catalogue
  (`entitlement.changed`, `catalogue.manifeste.publie`, `etat-publie.changed`) et un fait Avro ⇒ sortie **0** ; une
  version 2 compatible BACKWARD (Karapace l'accepte) qui ajoute `detail.taux_incapacite` dans une union ⇒ sortie
  **1**, `CHAMP_SANTE` nommé avec sujet, version et chemin ; registre injoignable ⇒ sortie **2**.
- **Trois mutations rouges** : la santé ignorée (7 échecs), le `snake_case` non normalisé (4), le contexte non lié à
  l'enveloppe (5).

**Reste, hors de cette story :** brancher la garde dans le `npm test` racine (B) ; copier les deux fichiers dans
`prospera-sinistres-service` (avec ses premiers faits, EPIC-205) et dans les autres services de C à leurs premiers
champs sensibles ; le coffre et le déverrouillage de la clé maîtresse (exploitation).
