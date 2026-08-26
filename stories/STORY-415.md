# STORY-415 : Les codes de retraitement sont publiés NUS — dix-sept cases de liasse sans un seul libellé

Status: ready-for-dev

**Épic :** EPIC-023 — Fiscalité (résultat fiscal, liquidation, TVA, provisions, TPU)
**Service :** **le paquet fiscal `TG@YYYY`** (STORY-078) — **aucune ligne de code applicatif**
**Points :** 3 · **Sprint :** S20
**Origine :** relevée le **2026-08-26** en construisant la maquette **FE-050**, en confrontant
`CodesRetraitement` au paquet fiscal du projet (`referentiels/paquet-fiscal-togo-2026.json`).

---

## Le fait, relevé à la source

Le paquet publie **dix-sept codes de la liasse** — douze réintégrations, cinq déductions :

```json
"resultatFiscal": {
  "reintegrations_codes": ["10","11","12","15","20","25","30","40","45","50","60","80"],
  "deductions_codes":     ["90","95","100","120","125"]
}
```

**Et rien d'autre.** Pas un libellé. Le résolveur du service le dit sans détour :

```ts
// fiscal.regles.ts — `togo@2026` publie 12 + 5 codes SANS libellés :
// `libelles` sort donc vide, et c'est le contrat, pas un bug.
const libelles: Record<string, string> = {};
for (const cle of ['reintegrations_libelles', 'deductions_libelles']) { … }
```

⚡ **Les deux clés que le résolveur cherche existent déjà dans le code et n'existent
pas dans la donnée.** Le mécanisme est en place, complet, testé — il lit un objet
`code → libellé` **additif**, absent aujourd'hui. Cette story ne demande donc **aucune
ligne de code applicatif** : elle demande de **remplir** ce que le service sait déjà lire.

---

## Ce que ça coûte, concrètement

`PosteRetraitementResponseDto.libelle` est optionnel, et sort donc **toujours absent**.
Sur l'écran « Résultat fiscal » (FE-050), la grille de la liasse affiche dix-sept lignes
dont la seule identité est un **nombre** : `10`, `11`, `12`, `15`, `20`…

- **À la lecture** — le comptable qui reprend un dossier ne peut pas vérifier qu'un
  montant est dans la bonne case sans ouvrir la liasse GUIDEF papier à côté.
- **À la saisie** — il doit choisir une case parmi dix-sept nombres. Le serveur validera
  que le code **existe** (`CODE_RETRAITEMENT_INCONNU`) et que le **sens** est le bon
  (`SENS_INCOHERENT`), donc un code de réintégration saisi en déduction est refusé.
  ⛔ **Mais aucune garde n'existe contre le code ADMIS ET FAUX** : `45` au lieu de `40`
  passe les trois refus, entre dans l'assiette pour le bon montant, et **alimente la
  mauvaise case de la liasse**. Le résultat fiscal reste juste ; sa **ventilation** ne
  l'est plus, et rien en aval ne bouge. C'est le mode de panne de STORY-414, transposé.
- **Au dépôt** — la DSF est déposée case par case. Une ventilation fausse ne se voit
  qu'au contrôle.

⛔ **Et le contournement n'existe pas.** Nommer `20` « Amendes et pénalités » dans
l'écran ou dans le service serait **écrire du fiscal en dur** — ce que NFR-A06 interdit,
et ce qui deviendrait faux au premier code que la loi de finances déplace. Le commentaire
du type le dit déjà mot pour mot. **Le seul endroit juste est le paquet.**

⚠️ **Ce que l'écran fait en attendant, et pourquoi ce n'est pas suffisant.** FE-050
affiche, à la place du libellé, ce que le contrat porte réellement : la **justification**
écrite par le comptable (postes manuels), le **motif** de non-déductibilité (postes
agrégés), le **type de taxe** (registre). C'est honnête et c'est utile — mais cela ne
nomme la case que **pour les cases déjà alimentées**. Les douze cases vides restent
douze nombres.

---

## Périmètre

**Inclus**

- Ajouter `reintegrations_libelles` et `deductions_libelles` au paquet `TG@2026` —
  `code → libellé`, **transcrits des feuilles « Résultat fiscal » et « Détail
  réintégrations / déductions » de la liasse**, sources OTR à l'appui.
- Un libellé **par code réellement publié**, et rien de plus : une clé qui ne
  correspondrait à aucun code de `reintegrations_codes` serait un libellé orphelin.
- Recalculer le **checksum** du paquet et le faire remonter par les artefacts
  (`_meta`), puisque `paquetFiscal.checksum` est publié à chaque calcul.

**Hors périmètre**

- **Toute modification du service.** Le résolveur lit déjà les deux clés ; le DTO porte
  déjà `libelle?`. Si un développeur se retrouve à toucher `fiscal.regles.ts`, c'est que
  la story a été mal comprise.
- **Deviner la correspondance `motif → code`** (`CHARGE_NON_JUSTIFIEE` → quel code ?).
  C'est une **autre** donnée du paquet, absente elle aussi, et elle n'est pas nommer un
  code : elle est en **choisir un**. À ficher séparément si le PO le veut.
- Les codes eux-mêmes : ils sont publiés, validés, et cette story n'y touche pas.

---

## Critères d'acceptation

1. `GET /dossiers/{id}/fiscal/resultat-fiscal` rend un `libelle` **sur chaque poste
   codé** de `postesDsf`, pour un dossier dont le paquet est `TG@2026`.
2. Un paquet qui ne publie **aucun** libellé continue de fonctionner : `libelle` reste
   absent, aucun poste n'est perdu, aucun libellé n'est inventé — le comportement
   d'aujourd'hui reste le comportement de repli.
3. La liste des libellés est **exactement** indexée sur les codes publiés : un test
   vérifie qu'aucune clé de `*_libelles` ne désigne un code absent de `*_codes`, et
   nomme les codes restés sans libellé plutôt que de les taire.
4. Chaque libellé porte sa **référence de source** dans le paquet (feuille de liasse ou
   article), au même titre que les autres rubriques transcrites.

---

## Notes

- ⚠️ **Cette story est une story de DONNÉE.** Elle est petite en code et lourde en
  vérification : chaque libellé est une affirmation fiscale, et un libellé faux est
  **pire** qu'un libellé absent — il fait ranger un montant dans une case avec
  confiance. Elle demande la même prudence que la transcription du barème CNSS.
- ⚠️ Le paquet porte déjà une réserve générale à lever (`aFaire`) et son `statut`
  précise « reste la VALIDATION par un expert-comptable/fiscaliste togolais avant mise
  en production ». Les libellés de liasse entrent dans ce même périmètre de validation.
- **Voisine de STORY-397** (« les codes sont validés mais jamais publiés ») sans se
  confondre avec elle : 397 demande de **publier la liste**, 415 demande de la rendre
  **lisible**. ⚡ Et l'une n'attend pas l'autre — cf. l'amendement porté à STORY-397 le
  2026-08-26 : `postesDsf` publie déjà la grille complète, codes **et sens**, à qui
  appelle `GET /resultat-fiscal`.
- Consommateur nommé : **FE-050**.
