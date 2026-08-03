# STORY-170 : `TranscriptionProvider` — la **troisième famille de modèle**, et l'audio qui va avec

**Epic :** EPIC-026 — Assistant IA transverse *(extension)*
**Réf. PRD :** [`prds/prd-assistant-ia-2026-08-02/prd.md`](../prds/prd-assistant-ia-2026-08-02/prd.md) §6 groupe B (FR-IA05→IA09) · groupe C *(contrat Proposition)* · §7 **NFR-4** *(les données ne quittent pas l'infrastructure)*
**Réf. code livré :** **STORY-116** *(prévue — `LlmProvider`)* · `OcrProvider` (`document-service`, STORY-041/042) · `ChannelProvider` · `PaymentProvider` — **quatre déclinaisons du même patron**
**Dépend de :** STORY-115 *(scaffold `assistant-service`)*, STORY-117 *(contrat Proposition)*
**Débloque :** **MB-03** *(voice-to-CRM)*
**Priorité :** Must Have — **dans le bloc terrain**
**Story Points :** 8
**Statut :** À faire
**Assigné à :** null
**Créée le :** 2026-08-02
**Sprint :** à planifier — **bloc terrain**
**Service :** `assistant-service` (`:3011`)

---

## Contexte — trois familles de modèle, pas une

`assistant-service` porte un **`LlmProvider`** : un modèle de **texte**. `document-service` porte un
**`OcrProvider`** : Tesseract, de l'**image vers du texte**.

Le voice-to-CRM demandé par le PO — *« enregistrer une tournée chez un client »* — n'est **ni l'un ni
l'autre**. Il demande de la **reconnaissance vocale** : de l'**audio vers du texte**. C'est une
troisième famille de modèle, avec ses propres contraintes.

> ⚠️ **Ce n'est pas une variante du `LlmProvider`.** Un modèle de langage ne transcrit pas de l'audio.
> La note d'architecture le disait déjà pour l'OCR : *« `qwen2.5:3b` est un LLM texte, il ne fait pas
> d'OCR »*. La même phrase vaut ici.

**La chaîne complète compte donc deux modèles :**

```
audio  ──[ TranscriptionProvider ]──►  texte brut
                                          │
                                          ▼
                              [ LlmProvider ]  ──►  Proposition structurée
                                                          │
                                                          ▼
                                                  validation humaine
```

---

## User Story

**En tant que** commercial de terrain,
**je veux** dicter mon compte-rendu de visite au lieu de le taper,
**afin de** ne pas passer ma soirée à ressaisir ma journée.

**En tant qu'**équipe plateforme,
**je veux** que la transcription suive les mêmes règles que le reste de l'IA,
**afin de** ne pas ouvrir une porte de sortie aux données de nos clients.

---

## Périmètre

### A. Le contrat `TranscriptionProvider`

Un port, une opération : `transcrire(audio, options) → texte + indice de confiance + langue détectée`.

Même patron que les trois autres fournisseurs : **le service ne dépend jamais d'un modèle concret**.

### B. Auto-hébergé — même doctrine que le reste

`NFR-4` du PRD Assistant IA : **les données ne quittent pas l'infrastructure Money Vibes**.

⚡ **L'audio d'un compte-rendu de visite est particulièrement sensible** : il contient des noms de
clients, des montants, des appréciations sur des personnes, et **potentiellement la voix d'un tiers**
qui n'a rien signé.

| Environnement | Modèle |
|---|---|
| Développement | Modèle de transcription local, en conteneur — valide **la mécanique**, pas la qualité |
| Production | **Modèle auto-hébergé** sur l'infrastructure Money Vibes |
| API externe | Possible mais **exige** : accord interdisant l'entraînement, minimisation, **activation explicite par organisation**, audit de chaque envoi (`FR-IA09`) |

### C. ⚠️ La qualité en contexte togolais — à mesurer, pas à supposer

Un commercial à Sokodé parle **français**, avec des mots locaux, dans un environnement bruyant
*(marché, moto, vent)*, sur le micro d'un téléphone d'entrée de gamme.

> ⚡ **La transcription sera imparfaite, et c'est structurel.** La conception doit en tenir compte
> plutôt que de l'espérer bonne :
> - L'indice de confiance est **exposé**, pas masqué
> - Le texte brut est **conservé et affiché** à côté de la proposition structurée
> - ⚡ **L'humain valide toujours** — c'est déjà la doctrine (`FR-IA10`), elle prend ici tout son sens

**Langues :** français au v1. L'ajout d'une langue est une **configuration du fournisseur**, pas un
développement — mais la **qualité** sur les langues locales est à mesurer avant toute promesse
commerciale.

### D. La chaîne complète produit une **Proposition**

Le texte transcrit est passé au `LlmProvider` pour être **structuré** en compte-rendu : client visité,
sujets abordés, engagement pris, montant évoqué, action à faire.

⚡ **Le résultat est une `Proposition`** (`FR-IA10`) : persistée, avec son cycle
`PROPOSED → ACCEPTED / REJECTED`, son modèle et sa version de gabarit. **Rien n'entre dans le CRM
sans validation humaine.**

⚠️ **Aucune affirmation à portée d'engagement ne se déduit d'une transcription.** Un montant entendu
dans un compte-rendu est une **proposition de montant**, jamais une créance.

### E. Traitement différé

Une transcription prend du temps et l'audio arrive par lots au retour du réseau (`MB-02`).

- Traitement **asynchrone**, avec progression visible
- ⚡ **File équitable entre organisations** — même exigence que `FR-IA52` : un distributeur qui
  synchronise 40 comptes-rendus ne bloque pas les autres

### F. Cycle de vie de l'audio

⚡ **L'audio est une donnée personnelle**, potentiellement celle d'un tiers.

| Règle | Valeur |
|---|---|
| Conservation de l'**audio** | **Supprimé après transcription validée** — défaut, paramétrable, **plafond 30 jours** |
| Conservation du **texte brut** | Conservé avec la Proposition — c'est la pièce qui permet de comprendre une erreur |
| Consentement | ⚠️ Le commercial doit savoir qu'il enregistre ; **si un tiers est audible, c'est une question juridique** — voir §Risques |

### G. Mesure de consommation

Chaque transcription est **comptée et attribuée** — organisation, utilisateur, durée d'audio, modèle.
Même patron que `FR-IA49`.

---

## Critères d'acceptation

1. `TranscriptionProvider` est un port ; l'implémentation de développement en est une réalisation.
   **Aucune référence au modèle concret** hors de son implémentation et de la configuration.
2. Le passage développement → production est une **configuration** — aucun code conditionnel.
3. La transcription retourne **texte + indice de confiance + langue détectée**.
4. ⚡ Le **texte brut est conservé** et restitué **à côté** de la proposition structurée.
5. La chaîne produit une **`Proposition`** au contrat `FR-IA10`, avec son cycle et sa traçabilité de
   modèle.
6. ⚡ **Aucune donnée n'entre dans un module métier sans acceptation humaine** de la Proposition.
7. Traitement **asynchrone** avec progression ; **file équitable** entre organisations.
8. L'**audio est supprimé** après transcription validée ; le plafond de conservation est opposable.
9. Chaque transcription est **comptée et attribuée**.
10. Le service **démarre sans fournisseur de transcription** configuré et l'annonce dans `/health`
    (`transcription: down`) — même patron que `llm:`.
11. Une transcription à **faible confiance** est marquée comme telle et **ne peut pas être acceptée
    sans lecture du texte brut**.
12. Un envoi vers une API externe est **impossible sans activation explicite** de l'organisation.

---

## Notes techniques

### Pourquoi AC 4 et AC 11 comptent plus qu'ils n'en ont l'air

Une proposition structurée à partir d'une transcription douteuse **paraît propre** : elle a des
champs, des montants, des noms. Rien ne signale qu'elle repose sur un texte où le modèle a entendu
*« quinze »* au lieu de *« cinquante »*.

Afficher le texte brut à côté, et **bloquer l'acceptation à l'aveugle** quand la confiance est faible,
est ce qui empêche une erreur d'audio de devenir une erreur de gestion.

### Ce qui n'est pas dans cette story

La capture audio sur l'appareil (`MB-03`), les écrans de validation (`MB-03`), les rapports (`MB-04`).

---

## Risques & mitigation

| Risque | Mitigation |
|---|---|
| ⚡ Une transcription approximative produit une donnée fausse d'apparence propre | **AC 4/11** : texte brut affiché, acceptation bloquée à faible confiance |
| L'audio contient la voix d'un **tiers non consentant** | ⚠️ **Question juridique ouverte** — à trancher avec le cadre togolais *(loi n° 2019-014)*. Mitigation technique : suppression rapide de l'audio (AC 8) |
| La qualité en contexte togolais est supposée bonne et promise commercialement | **§C** : à mesurer avant toute promesse |
| Les données partent chez un tiers | **AC 12** + `NFR-4` |
| Une organisation sature la file | **AC 7** — équité, comme `FR-IA52` |

---

## Definition of Done

- [ ] Les 12 critères vérifiés
- [ ] `lint` 0 · couverture ≥ 90 %
- [ ] **Vérification docker** : transcription d'un échantillon audio réel *(bruit de fond inclus)*,
      chaîne complète jusqu'à la Proposition, suppression de l'audio, démarrage sans fournisseur
- [ ] ⚡ **Mesure de qualité consignée** sur un échantillon d'enregistrements en conditions réelles —
      avant toute communication commerciale sur la fonctionnalité
- [ ] Question juridique de l'enregistrement d'un tiers **posée et tracée**
- [ ] Branche `MNV-170`, PR rebase-mergée sur `dev`

---

## Progress Tracking

*(à remplir à l'implémentation)*
