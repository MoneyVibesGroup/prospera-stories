# STORY-525 : Le dépôt — une doctrine, ou neuf intégrations ? La question qui change le chiffrage du programme international

Status: ready-for-dev

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service` (cadrage) — puis N services selon l'arbitrage
**Points :** 8 *(le cadrage ; les intégrations sont hors de ce chiffrage)* · **Sprint :** S20
**Origine :** §6.1 de `analyse-scalabilite-multireferentiel-2026-08-27.md`.

---

## Le fait

Le produit s'arrête à la **liasse et à son export**. Ce que le cabinet achète, c'est **le dépôt** :
l'**e-DSF** à l'OTR au Togo, et des plateformes, des formats, des canaux et des calendriers
**différents** à la DGI du Bénin, de Côte d'Ivoire, du Sénégal.

**État réel, vérifié :**

| Ce qui existe | Ce que ça couvre |
|---|---|
| `EPIC-032` — dépôt assisté, accusé, dossier de contrôle, jalon `format confirmé` | **cadré**, non livré |
| **FE-081** — déclarer un dépôt, son numéro d'accusé, sa pièce jointe, son signataire | écrite, `blocked` sur **STORY-446**, non livrée |
| **STORY-446** — état `DEPOSE` + accusé | non livrée |

⇒ **Ce qui existe couvre la TRACE du dépôt, pas le dépôt.** Et FE-034 a déjà dû corriger un libellé
qui disait « Liasse déposée » là où le produit ne savait que « figer ».

## ✅ ARBITRAGE PO — 2026-08-28 : **VOIE A. Le produit dépose.**

La doctrine vaut pour **les trois verticaux** : fiscal (ici), IMF ([[STORY-509]]) et assurance
([[STORY-523]]). Elles cessent d'être `needs-po-decision` et citent cette décision.

### Ce que la voie A engage, dit sans adoucir

**Le dépôt devient une capacité produit, donc un engagement de disponibilité.** Un cabinet qui
dépose par Prospera ne peut plus déposer autrement le jour de l'échéance. Trois conséquences qui ne
se négocient pas :

1. ⛔ **Chaque pays est une intégration, avec son jalon `format confirmé`.** Aucun pays n'est promis
   avant que son gabarit officiel ne soit **au dépôt**, sourcé et daté. Le programme a payé deux
   fois pour l'avoir oublié (acomptes trimestriels au lieu des dates réelles, RSL à 10 % au lieu de
   8,75 %) : deux erreurs **plausibles**, donc invisibles à la relecture.
2. ⛔ **Un format change sans prévenir.** Une administration révise son gabarit entre deux lois de
   finances. ⇒ Le format est **packagé et versionné**, jamais codé ([[STORY-536]]), et un dépôt
   porte **la version de format qui l'a produit**.
3. ⛔ **Un dépôt peut être REJETÉ par l'administration.** C'est l'état que le produit ne connaît pas
   aujourd'hui, et il est aussi important que l'accusé : un rejet non traité est une échéance
   manquée, et au Togo une échéance manquée coûte **40 %**.

### Le découpage qui en découle

| Story | Objet |
|---|---|
| **STORY-536** | le **paquet de dépôt** : format, canal, calendrier, gabarit — packagé par pays et par état |
| **STORY-537** | la **génération du fichier e-DSF Togo** (OTR) — 1ᵉʳ pays, jalon `format confirmé` |
| **STORY-538** | **transmission, accusé et REJET** — le cycle de vie complet d'un dépôt |
| **STORY-539** | le **calendrier de dépôt** et les échéances opposables, multi-pays et multi-état |
| **STORY-446** | état `DEPOSE` + accusé — **existante, non livrée, et elle bloque FE-081** |

⚠️ **Cette story-ci reste le CADRAGE** : elle pose la doctrine, le contrat commun et le jalon. Les
intégrations pays sont chiffrées une par une, et **aucune n'est incluse dans ses 8 points**.

---

## Ce qui a été tranché — conservé pour la traçabilité

**Q1 — Prospera produit-il le fichier de télédéclaration, ou s'arrête-t-il à la liasse que le
cabinet dépose lui-même ?**

- **Voie A — le produit dépose.** N pays = N intégrations, N formats, N calendriers, N évolutions
  annuelles à suivre. **Aucune n'est chiffrée aujourd'hui.** C'est le poste de coût caché le plus
  lourd du programme international.
- **Voie B — le produit produit la liasse et trace le dépôt.** Parfaitement défendable : c'est ce
  que fait la majorité des outils de production comptable, et le cabinet dépose lui-même. ⚠️ **Mais
  il faut le DIRE** — un cabinet suppose la voie A tant qu'on ne lui dit rien.

⚡ **Et la question se pose TROIS fois dans le programme** : ici (fiscal), à **STORY-509** (états DIMF
d'une IMF) et à **STORY-523** (états annuels CIMA). **Une seule doctrine doit valoir pour les
trois** — trois doctrines de dépôt dans un même produit seraient incompréhensibles pour le cabinet
qui tient les trois types de dossiers.

## Critères d'acceptation *(applicables une fois Q1 tranchée)*

- [ ] AC-1 — La doctrine retenue est **écrite** et s'applique aux trois verticaux ; STORY-509 et
      STORY-523 la citent au lieu de la re-poser.
- [ ] AC-2 — Sous **voie B** : l'écran dit **explicitement** que le dépôt est à la charge du cabinet,
      partout où une liasse est figée. Doctrine FE-073 — dire ce qu'on ne fait pas est une
      information ; laisser croire qu'on le fera est une promesse.
- [ ] AC-3 — Sous **voie A** : chaque pays est **une story avec son jalon `format confirmé`**, et
      aucune n'est promise avant que son gabarit officiel ne soit au dépôt.
- [ ] AC-4 — Dans les deux cas, **STORY-446** (état `DEPOSE` + accusé) est livrée : tracer un dépôt
      est utile quelle que soit la voie, et **FE-081 est bloquée dessus** depuis sa création.

## Notes

- Voir [[FE-081]], [[STORY-446]], [[STORY-453]] (l'échéance opposable), [[STORY-509]], [[STORY-523]].
