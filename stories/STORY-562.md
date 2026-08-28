# STORY-562 : Suivre le parcours d'une déclaration déposée et rapporter l'accusé — le fait séparé que le port attendait déjà

Status: ready-for-dev

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service` (`:3012`) — adaptateur de canal, travaux récurrents
**Points :** 5 · **Sprint :** S29
**Origine :** **décision PO du 2026-08-28** — *« … déposer et **récupérer ou suivre le parcours**
pour la déclaration »*.
**Prérequis :** **STORY-561** (le connecteur) · **STORY-333** (capture de l'accusé — le chemin
manuel, qui reste)
**Réf. :** **AD-12** (le port est asynchrone : l'accusé arrive comme un fait séparé) · **AD-18**
(tout travail récurrent passe par BullMQ) · **STORY-334** (rejet administratif)

---

## Pourquoi cette story est petite

Parce que **le port l'attendait déjà**. AD-12 :

> Déposer rend un identifiant de dépôt ; l'accusé arrive comme un **fait séparé**, jamais comme
> valeur de retour. […] un connecteur automatisé produira simplement ce fait immédiatement.

⇒ STORY-333 a livré le chemin par lequel un accusé **saisi par un humain** devient ce fait. Cette
story ajoute une seconde source au **même** fait : un accusé **relevé par le connecteur**. Rien du
cycle de vie de la déclaration ne change.

⚡ **Et « immédiatement » est une simplification qu'il faut corriger.** Un portail administratif ne
rend pas toujours l'accusé dans la session de dépôt : il le publie plus tard, parfois le
lendemain, parfois après contrôle. **Le suivi est donc récurrent, pas synchrone** — d'où AD-18.

## Périmètre

**Inclus**

- Un **travail récurrent** (BullMQ, AD-18) qui, pour chaque dépôt engagé par connecteur et sans
  issue, consulte l'écran de suivi déclaré au paquet et en dérive un état.
- **Quatre issues, et pas davantage** : `ACCUSE_DISPONIBLE`, `REJET`, `EN_COURS`, `INDETERMINE`.
  ⛔ `INDETERMINE` est une issue de plein droit : elle dit que le produit n'a pas su lire l'écran,
  ce qui n'est ni un succès ni un rejet, et doit remonter au cabinet plutôt que d'être arrondi.
- L'accusé relevé alimente **le même chemin que STORY-333** — horodatage, rattachement, archivage
  (STORY-335) — et la qualification du retard reste celle de 333.
- Un rejet relevé alimente **STORY-334**, avec son motif tel que le portail le donne, **verbatim**.
  ⚠️ Ne jamais reformuler un motif administratif : c'est la pièce qu'on opposera.
- **Arrêt du suivi** : un dépôt qui n'aboutit pas au bout d'un délai déclaré au paquet cesse d'être
  interrogé, et le cabinet est averti. Un travail récurrent sans condition d'arrêt est une fuite.
- **Le suivi manuel reste ouvert en permanence.** À tout moment, le cabinet peut saisir l'accusé
  lui-même — y compris pendant qu'un suivi automatique tourne. La saisie humaine **gagne** et
  arrête le suivi.

**Hors périmètre**

- Le dépôt : **STORY-561**.
- Relancer un dépôt en échec. Une reprise est une décision, pas une conséquence.
- Notifier le client final. La chaîne de notification a son propre service ; ici on produit le
  fait, on ne choisit pas qui l'apprend.

## Critères d'acceptation

1. Un dépôt engagé par connecteur est suivi jusqu'à l'une des quatre issues, ou jusqu'à
   l'échéance d'arrêt déclarée.
2. Un accusé relevé produit **exactement le même fait** qu'un accusé saisi (STORY-333) — témoin :
   les deux chemins rendent le dossier dans le même état, indistinguable en aval.
3. La **source** de l'accusé est tracée — relevé ou saisi — sans changer sa valeur probante.
4. Un rejet relevé porte son motif **verbatim** et alimente STORY-334.
5. `INDETERMINE` remonte au cabinet ; le dépôt **ne bascule pas** en « accusé reçu » par défaut.
6. Une saisie manuelle pendant un suivi automatique **arrête le suivi** et fait foi.
7. Le suivi respecte le rythme déclaré au paquet ; aucune interrogation en boucle serrée.
8. **Non-régression** : sans connecteur, STORY-333 fonctionne à l'identique — aucun travail
   récurrent n'est créé pour un dépôt assisté.

## Notes

- ⚡ **La valeur n'est pas le gain de clics, c'est la fin de l'oubli.** Aujourd'hui, un accusé
  arrive sur un portail et personne ne le sait tant qu'on n'y retourne pas. Un suivi qui rapporte
  l'issue transforme une vérification à faire en un fait qui arrive — et c'est ce qui fait qu'une
  échéance ne se découvre pas dépassée.
- ⚠️ **`INDETERMINE` sera l'issue la plus fréquente au démarrage**, et c'est normal : les écrans
  de suivi sont hétérogènes. En faire une issue nommée plutôt qu'un échec évite de conclure que le
  connecteur ne marche pas alors qu'il n'a simplement pas su lire.
- ⛔ **Ne jamais dériver un accusé d'une absence de rejet.** « Rien d'anormal à l'écran » n'est pas
  une preuve de dépôt, et c'est une preuve que le cabinet produira deux ans plus tard.
