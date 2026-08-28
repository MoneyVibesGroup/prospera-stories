# STORY-525 : Le dépôt — une doctrine, ou neuf intégrations ? La question qui change le chiffrage du programme international

Status: needs-po-decision

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

## ⛔ Ce qui doit être tranché — et c'est un arbitrage, pas un développement

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
