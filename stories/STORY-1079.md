# STORY-1079 : dans l'espace d'essai, la garde de bilan ne lit pas le KYC — l'état publié décide seul

Status: in-progress

**Ticket :** `tickets/TICKET-BACKEND-modules-ouverts-dans-l-essai.md`, **point 3** (« D (bilan) » ; ouvert par B,
STORY-1116, D-1116-1) · **Dépôt :** `prospera-bilan-service` (tenu par D au lot 6, D-L6-5 ; `origin/dev` au départ :
`5055933`, STORY-1118) · **Plage :** groupe D, dernier numéro de 1030 → 1079 (entrée du tracker réservée par STORY-1078)
· **Priorité :** Must de la démo du 15/01 · **Ordre de D :** 1118 ✅ → **1079** → 1074 → 1075.
**Décision d'architecture :** **Q-D-17** (journal de D) — choix par défaut appliqué sans réponse : `INSTANCE_ESPACE=ESSAI`
⇒ le palier KYC de `requires-bilan-access` est sauté ; l'e-mail vérifié et l'état publié (`ESSAI_PROSPECT`, garde
partagée `garde-etat-publie-v1`) restent exigés (AD-15 : un prospect n'a pas de KYC ; l'essai est borné par son état
publié et son effacement ; NFR-A01). À confirmer par l'architecte ou le PO avant la démo.
**Sources :** le ticket ; `stories/STORY-918.md` (l'état publié seul), `STORY-912` (le topic par espace), `STORY-928`
(D-928-2 : `INSTANCE_ESPACE`, `EspaceDeLInstance`), `STORY-1083` (la garde du module `financement`). Code d'`origin/dev`
(`5055933`) : `src/modules/read-models/guards/bilan-access.guard.ts`, `src/modules/financement/acces/financement-access.guard.ts`,
`src/modules/instance-c13/espace.ts`, `src/config/env.validation.ts` (`INSTANCE_ESPACE` : `@IsIn(['ESSAI','REEL'])`).
**Ne touche pas :** `prospera-balance-service` (C) ni `prospera-dossier-service` (B) : la même règle leur est demandée
(journal de D, « Demandes aux autres groupes »).

## Avant la story (commit séparé) : deux e2e rouges sur `dev`

Constatés par STORY-1118 dans une image de `dev` `d2c65c6` ; **causes dans `bilan-service`**, corrigées sans délai relevé :

- **`ecoute-stable`** (garde de balayage de STORY-630) : `test/instance-c13.e2e-spec.ts` (STORY-928) importe
  `ecouterPourSupertest` sous l'alias `ecouter` ; la garde cherche le texte `ecouterPourSupertest(app)`. Le comportement
  était déjà le bon (serveur en écoute) : l'alias est retiré.
- **`bilan-dossier-portee-collaborateur`** : STORY-1083 a ajouté le 25ᵉ contrôleur niché (`FinancementController`,
  `@RequiresDossierScope`) sans rattraper le compte de la batterie (24, l'invariant unitaire disait déjà 25). Le compte
  passe à 25, `FinancementController` est nommé, et la chaîne de la batterie reçoit `FinancementAccessGuard` à sa place
  d'`AppModule` (module ouvert, tous les droits du manifeste) : ses routes sont éprouvées route par route.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|---|---|---|
| AC-1 | Dans une instance `INSTANCE_ESPACE=ESSAI`, un prospect **sans KYC** (aucun `kyc.status.changed`), e-mail vérifié, module `bilan` en `ESSAI_PROSPECT`, lit son bilan (200) ; le read-model KYC n'est pas lu | spec `bilan-access.guard.espace.spec.ts`, e2e `bilan-access-espace`, pile `grp-d` |
| AC-2 | Dans l'essai, l'état publié reste exigé (inconnu, `NON_INSTALLE`, `ESSAI_TERMINE`, `DESINSTALLE` ⇒ 403 `BILAN_NOT_ENTITLED`) et l'e-mail vérifié aussi (403 `EMAIL_NOT_VERIFIED`, en premier) ; l'ordre des codes ne change pas | idem |
| AC-3 | Dans l'espace réel, **rien ne change** : la même requête rend 403 `KYC_NOT_APPROVED` ; une mutation qui saute le KYC hors de l'essai rougit | specs, e2e, mutations, pile `grp-d` (instance réelle) |
| AC-4 | L'espace se lit de la configuration de l'instance (`INSTANCE_ESPACE`, validée au démarrage, absente ⇒ `REEL`), jamais d'une donnée de la requête, du jeton ou du message projeté ; une garde construite sans espace exige le KYC (fail-closed) | specs (en-tête, paramètre, état publié « ESSAI » sur une instance réelle ; garde sans espace), câblage par l'injecteur |
| AC-5 | La garde du module `financement` (même service) suit la même règle (D-1079-4) | `financement-access.guard.espace.spec.ts`, mutations |
| AC-6 | Les deux e2e rouges sur `dev` sont verts, cause corrigée (commit séparé, avant la story) | e2e `ecoute-stable`, `bilan-dossier-portee-collaborateur` |
| AC-7 | La règle demandée à `balance-service` (C) et `dossier-service` (B) est écrite ; la ligne « Suivi » du ticket est à jour | journal de D, ticket |

## Décisions retenues par défaut (contestables)

- **D-1079-1 — L'espace est celui de l'instance, lu une fois.** `INSTANCE_ESPACE` est déjà validée au démarrage
  (`validateEnv`, `@IsIn(['ESSAI','REEL'])` : une autre valeur fait échouer le boot ; absente ⇒ `REEL`) et lue par
  `EspaceDeLInstanceConfig` (STORY-928) — le même lecteur que les routes C13 et que le topic de l'état publié
  (`etat-publie.changed.<espace>`). `AppModule` fournit `EspaceDeLInstance` aux gardes globales. Ni le jeton, ni un
  en-tête, ni un paramètre, ni l'`espace` porté par le message projeté ne décident du KYC.
- **D-1079-2 — Seul le palier KYC est sauté.** E-mail vérifié, organisation valide dans le jeton, état publié décidé
  par la garde partagée selon la sorte de la requête : inchangés, dans le même ordre. Le read-model KYC n'est **pas lu**
  dans l'essai (aucune requête Mongo). Aucun code d'erreur neuf ; `KYC_NOT_APPROVED` n'est plus rendu par ces gardes
  dans l'espace d'essai.
- **D-1079-3 — Fail-closed.** L'espace est une dépendance **facultative** des gardes (`@Optional()`) : une garde
  construite sans lui (les quelque 58 batteries qui montent `BilanAccessGuard` à la main, un module qui ne le fournirait
  pas) est dans l'espace réel et exige le KYC. Le seul sens d'erreur possible d'un oubli de câblage est donc un refus.
- **D-1079-4 — La garde du module `financement` suit la même règle** (`FinancementAccessGuard`, STORY-1083) : même
  service, même espace ; sans cela, un module `financement` ouvert dans l'essai rendrait le même 403. L'e-mail, l'état
  publié du module `financement` et le droit de la route (`GET /moi/droits`) restent exigés.
- **D-1079-5 — Hors périmètre, écrit :** le consommateur de `fiscal.declaration.deposee` (`refusAccesBilan`, KYC et
  droit) n'est pas touché — l'espace d'essai n'a ni `fiscal-service` ni dépôt. La garde de portée du dossier
  (`DossierScopeGuard`) ne lit pas le KYC : inchangée.
- **D-1079-6 — Les deux e2e rouges** : causes corrigées dans les tests, pas de délai relevé ni de garde affaiblie
  (ci-dessus).

## Ce que `dossier-service` (B) et `balance-service` (C) devront faire de même

Même règle, même forme (demande écrite au journal de D, « Demandes aux autres groupes ») :

1. Lire l'espace de l'**instance** dans une variable validée au démarrage (`INSTANCE_ESPACE`, `ESSAI` | `REEL`, absente
   ⇒ `REEL`), une fois, jamais dans le jeton, la requête ni le message projeté.
2. Dans la garde du module (`@RequiresBalanceAccess` pour balance ; la garde de dossier qui lit le KYC, à vérifier
   pour dossier) : **sauter le seul palier KYC** dans l'espace d'essai, sans lire le read-model ; e-mail vérifié et
   état publié (garde partagée) restent exigés, dans le même ordre.
3. Fail-closed : une garde sans espace fourni exige le KYC.
4. Preuves attendues : le prospect sans KYC lit dans l'essai ; la même requête rend `403 KYC_NOT_APPROVED` sur une
   instance réelle ; une mutation qui saute le KYC hors de l'essai rougit.

## Contrat annoncé avant le code

Voir « ⚠ Contrats » du journal de D (entrée STORY-1079) : comportement de la garde, aucun champ, route, code ni topic
neuf.

## Preuves

À compléter.
