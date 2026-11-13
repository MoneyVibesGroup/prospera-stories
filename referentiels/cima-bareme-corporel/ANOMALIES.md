# Anomalies relevées dans la source officielle (Code CIMA 2019)

Reproduites telles qu'imprimées. Chacune est une ligne de la revue juridique avant la mise en service. En attendant, le moteur de calcul **refuse le calcul automatique** sur la cellule concernée et demande une saisie manuelle motivée, visée par le responsable.

| # | Table | Cellule | Imprimé | Pourquoi c'est suspect | Lecture probable (non appliquée) |
|---|---|---|---|---|---|
| 1 | `conversion_rentes` | viagère, masculin, âge 80 (p. 100) | 2,707 | casse la série décroissante : 79 ans = 4,356 ; 81 ans = 3,582 | une valeur comprise entre 3,582 et 4,356 |
| 2 | `bareme_medical` | Côlon, « pas de désordre fonctionnel » (p. 132) | 10 à 5 % | borne basse supérieure à la borne haute | 0 à 5 % |
| 3 | `art260_point_ip` | tranches de taux d'IP | « Moins de 5 », puis « De 6 à 10 » | le taux de 5 % n'appartient à aucune tranche | 5 % rattaché à la première tranche |
| 4 | `bareme_audition` | en-têtes « voix haute » et « voix chuchotée » (p. 117) | rangées d'en-têtes superposées | le rattachement des distances aux colonnes de décibels est déduit de la mise en page | valeurs sûres (matrice symétrique), étiquettes à confirmer |
| 5 | `art265_repartition` | colonnes d'orphelins | seule la colonne « orphelins doubles » existe | le texte renvoie au tableau des orphelins doubles quand les deux cas coexistent | appliquer la colonne existante |
