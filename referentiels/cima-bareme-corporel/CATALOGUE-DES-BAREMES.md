# Catalogue des barèmes par type de sinistre

Le logiciel choisit le barème selon le type de sinistre et la garantie qui joue. Un seul est un barème **légal** CIMA ; les autres viennent du contrat, d'une convention de place ou de l'expertise.

| Type de sinistre | Barème qui s'applique | Nature | Source | Où il vit | État |
|---|---|---|---|---|---|
| Corporel, accident de la circulation (RC automobile) | Barème CIMA Livre II, art. 258 à 266 + barème fonctionnel + conversion des rentes | **légal**, plancher de l'offre (art. 231) | Code CIMA | `referentiels/cima-bareme-corporel/` | **saisi et vérifié** (validation du juriste à faire) |
| Fonds de garantie automobile | Le même, dans la limite des plafonds nationaux | légal | Code CIMA art. 603 | idem | idem |
| Corporel hors circulation (RC générale, RC exploitation) | Droit commun ; le barème CIMA sert souvent de **référence** | jurisprudence | juge, juriste | paramètre « barème de référence » par garantie | à confirmer par le juriste |
| Individuelle accident, capital accident | Barème contractuel d'invalidité : capital × taux du barème du contrat | contractuel | police | projection du contrat (logiciel de la compagnie) | à fournir par la compagnie |
| Matériel automobile | Expertise, **grille de vétusté**, franchise ; entre assureurs : **barème de responsabilité** du constat amiable | contractuel et convention | grilles de la compagnie, convention de place | paramètres de la compagnie | à fournir (A-5, A-23) ; valeurs de démo marquées comme telles |
| Incendie, multirisque habitation, vol, transport | Capitaux, franchises, vétusté, règle proportionnelle | contractuel | police | projection du contrat | décompte spécifié (PRD FR-69) |
| Accident du travail | Hors assureur IARD (sécurité sociale), sauf contrat individuel | — | — | — | hors périmètre |
