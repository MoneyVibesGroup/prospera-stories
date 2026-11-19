# Le prototype cabinet vu par un expert-comptable : utilisable, pas encore facile

> **Date :** 2026-11-19 · **Auteur :** groupe A, à la demande de l'utilisateur (« comment tu trouves le prototype si tu
> te mets à la place d'un expert-comptable et d'un cabinet ? »).
> **Statut :** à reprendre **à la fin du chantier en cours**. Consigne de l'utilisateur : « écris cela ; quand on va
> finir, on va revenir dessus ». Aucune story créée à ce stade.
> **Objet relu :** le prototype cumulatif `prototypes/prospera-prototype.html`, version 17 de l'Artifact
> `https://claude.ai/artifact/Ujo3xV4jmSq35EtfbMVkDT`. Il est réaligné sur tout le livré le 2026-11-18 (prospera-stories
> #703). Écrans regardés : cahier de recettes, contrôles de la liasse, validation de la liasse.

## ⭐ La règle de l'utilisateur (2026-11-19) : un parcours facile, même pour un paresseux

> « Pour moi, je veux un parcours facile, même pour un paresseux. »

C'est le critère qui tranche toutes les recommandations ci-dessous, et tous les écrans à venir :

- **Un geste principal par écran**, évident. Le reste est secondaire, replié ou derrière « plus d'options ».
- **Rien à lire pour avancer** : un libellé clair suffit. Une aide d'une phrase au plus, jamais un paragraphe.
- **Tout est pré-rempli** avec ce que le système sait déjà : mémoire des choix du cabinet (STORY-1098, 1099, 1100),
  valeurs par défaut sûres, dernière période, dernier dossier. L'utilisateur corrige ; il ne saisit pas.
- **Le moins de clics possible** : traiter un lot entier en une fois (« tout valider » sur ce qui est sûr, ne montrer
  que ce qui demande un regard).
- **Le produit dit quoi faire ensuite** : chaque écran se termine par l'étape suivante proposée (« 3 pièces à relire »,
  « valider la balance »).
- **Jamais de jargon** : pas de code, pas de route, pas d'empreinte à l'écran ; le technique reste derrière « détails
  techniques ».
- La rigueur ne baisse pas : rien n'est écrit sans le geste de l'utilisateur, mais ce geste doit être **un seul clic**
  quand tout est en ordre.

## Verdict

**Sur le fond, c'est solide et rassurant pour un cabinet. Dans sa forme actuelle, ce n'est pas facile :** un cabinet
décrocherait vite. Il y a beaucoup trop d'écrit.

## Ce qui est bon pour un cabinet

- **Des parcours qui suivent le métier.**
  - Cahier : choisir le mois, importer les photos, relire avec l'image en face, appliquer.
  - Liasse : brouillon, figée, rouverte avec un motif.

  Un comptable s'y reconnaît.
- **Une rigueur visible.** La pièce est derrière chaque ligne. Rien n'est écrit sans relecture. Une case vide n'est
  jamais un zéro. L'historique dit qui a fait quoi. C'est un vrai argument face à Sage.
- **Des chiffres justes et cohérents d'un écran à l'autre**, rejoués sur les moteurs livrés. C'est la base de la
  confiance.

## Ce qui le rend difficile à utiliser

1. **Deux publics mélangés sur le même écran.** Le prototype montre l'écran du comptable **et** les notes de conception
   de l'équipe : numéros de story, routes d'API (`GET /dossiers/{id}/exercices :3009`), noms de champs
   (`assujetti === REEL`), « STORY-391 livrée le 26/08 ». Sur le cahier de recettes, plus de la moitié de la hauteur est
   de la note pour l'équipe. Un expert-comptable ne la lira pas, et il en conclura que le produit est compliqué.
2. **Du jargon technique dans l'écran lui-même** :
   - des codes en majuscules (`EQUILIBRE_BILAN`, `COMPTES_NON_AFFECTES`) au lieu d'« Équilibre du bilan » ;
   - `valide: true` et `origine : SNAPSHOT` au lieu de « Chiffres figés à la validation » ;
   - des empreintes `sha256`, des identifiants `userId 68a1f3…`, des statuts « 409 ».

   Ces éléments devraient être cachés derrière un lien « détails techniques ».
3. **Trop d'explications.** Chaque bloc porte un paragraphe de justification. Un professionnel veut un libellé clair,
   et au plus **une** phrase d'aide, avec « en savoir plus ».
4. **Trop d'onglets.** L'Atelier en a 13. Un cabinet pense en trois ou quatre gestes : produire la balance, vérifier,
   le fiscal, la trésorerie.
5. **Il manque ce qu'un comptable venant de Sage attend en premier** :
   - la saisie d'écritures au clavier ;
   - les journaux ;
   - le grand livre.

   La saisie depuis les factures est cadrée (STORY-1097, FE-149). Le grand livre et la saisie rapide au clavier restent
   à prévoir.

## Recommandations, par ordre d'impact

| # | Quoi | Où | Effort |
|:--:|---|---|---|
| 1 | Un interrupteur **« Notes de conception »**, éteint par défaut. Le prototype ne montre alors que ce que le cabinet verra, et les notes restent lisibles pour l'équipe. | prototype | une passe éditoriale, sans rien perdre |
| 2 | Une passe **« langage métier »** sur l'app réelle : libellés en français comptable à la place des codes, le technique derrière « détails techniques », et un test qui interdit les codes bruts à l'écran. | `prospera-frontend-expert-comptable` (`fr.json`, composants) | une story front |
| 3 | Un **tableau de bord « à faire »**, par dossier et pour le cabinet : balances à valider, pièces à relire, échéances. C'est l'écran d'ouverture de tous les jours. | app cabinet | une story front, sur des données déjà servies |
| 4 | **Regrouper les onglets** de l'Atelier en trois ou quatre. | app cabinet | une story front |
| 5 | **Tester avec deux ou trois vrais experts-comptables**, sur cinq tâches. En août, un vrai comptable a trouvé en trois phrases deux défauts structurants que nos relectures avaient manqués (FE-046). | terrain | geste de l'utilisateur |

À ajouter quand on y reviendra : **la saisie rapide d'écritures au clavier et le grand livre**, pour les cabinets
habitués à Sage.

## Quand on y revient

1. Relire ce document avec l'utilisateur.
2. Faire le point 1 (interrupteur des notes) en premier : c'est le plus rapide et le plus visible.
3. Créer les stories des points 2 à 4, et la saisie rapide avec le grand livre, avec des identifiants réservés au
   moment de les écrire (MAX sur toutes les branches).
4. Organiser le test du point 5.
