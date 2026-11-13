# Journal de la passe de cohérence du PRD Assurance (2026-11-13)

Fichier modifié : `prd.md` seul. Règles : aucune FR renumérotée ni supprimée, aucune balise [ASSUMPTION] retirée, pas de réécriture de style. Catégories : 1 transitions et conventions de l'offre ; 2 codes de refus ; 3 renvois ; 4 montants de SIN-2026-9002 ; 5 valeurs clés ; 6 contradictions (sans correction, voir la fin).

## Corrections


### Catégorie 2 : codes de refus unifiés sur FR-136

- [2] FR-30, FR-31, FR-38, FR-42, FR-51, FR-58, FR-68, FR-75, FR-76, FR-77, FR-80, FR-87, FR-88 : `MOTIF_OBLIGATOIRE` -> `MOTIF_ECRIT` (13 occurrence(s), synonyme du catalogue FR-136)
- [2] FR-65 : `DECISION_MOTIVEE_REQUISE` -> `MOTIF_ECRIT` (1 occurrence(s), synonyme du catalogue FR-136)
- [2] FR-30, FR-45, FR-75 : `PIECES_OBLIGATOIRES_MANQUANTES` -> `PIECES_COMPLETES` (3 occurrence(s), synonyme du catalogue FR-136)
- [2] FR-50, FR-52 : `DOSSIER_NON_AFFECTE` -> `DOSSIER_AFFECTE` (2 occurrence(s), synonyme du catalogue FR-136)
- [2] FR-42, FR-75 : `GARANTIE_NON_DECIDEE` -> `GARANTIE_ENGAGEABLE` (2 occurrence(s), synonyme du catalogue FR-136)
- [2] FR-75, FR-77 : `MONTANT_NUL` -> `MONTANT_EVALUE` (2 occurrence(s), synonyme du catalogue FR-136)
- [2] FR-78 : `DELEGATION_INSUFFISANTE` -> `VALIDATION_ACQUISE` (2 occurrence(s), synonyme du catalogue FR-136)
- [2] FR-78 : `FRACTIONNEMENT_DETECTE` -> `VALIDATION_ACQUISE` (1 occurrence(s), synonyme du catalogue FR-136)
- [2] FR-79 : `VISA_DT_MANQUANT` -> `VALIDATION_ACQUISE` (1 occurrence(s), synonyme du catalogue FR-136)
- [2] FR-82, FR-84 : `OFFRE_NON_VALIDEE` -> `VALIDATION_ACQUISE` (2 occurrence(s), synonyme du catalogue FR-136)
- [2] FR-90 : `DELEGATION_DG` -> `VALIDATION_ACQUISE` (1 occurrence(s), synonyme du catalogue FR-136)
- [2] FR-79, FR-80 : `SIGNAL_FRAUDE_BLOQUANT` -> `AUCUN_SIGNAL_BLOQUANT` (2 occurrence(s), synonyme du catalogue FR-136)
- [2] FR-86 : `ACCORD_NON_ENREGISTRE` -> `ACCORD_ENREGISTRE` (1 occurrence(s), synonyme du catalogue FR-136)
- [2] FR-45 : `CONTRAT_NON_VALIDE` -> `CONTRAT_VERIFIE` (1 occurrence(s), synonyme du catalogue FR-136)
- [2] FR-61, FR-75 : `EXPERTISE_NON_CLOSE` -> `EXPERTISE_VALIDEE` (2 occurrence(s), synonyme du catalogue FR-136)
- [2] FR-67 : `COMPLEMENT_NON_REVENU` -> `COMPLEMENT_EXPERT_RECU` (2 occurrence(s), synonyme du catalogue FR-136)
- [2] FR-89 : `RELANCES_NON_TRACEES` -> `RELANCES_EPUISEES` (1 occurrence(s), synonyme du catalogue FR-136)

### Catégorie 2 (suite) : codes de refus ajoutés au catalogue FR-136

- [2] FR-136 : liste des codes -> + 52 codes de refus cités ailleurs (second tableau, avec la FR qui porte la règle) : STATUT_INCONNU, NUMERO_OFFICIEL_DEJA_ATTRIBUE, PREJUDICE_NON_ETABLI, GARANTIE_ACQUISE_AVEC_BLOCAGE, MENTION_LEGALE_ABSENTE, MENTION_OBLIGATOIRE, RELANCE_TROP_PROCHE, RELANCE_INCOMPLETE, VOLET_INCOMPATIBLE, CIBLE_IDENTIQUE, ALERTE_BLOQUANTE_NON_LEVEE, PIECES_NON_NOMMEES, MISSION_DEJA_OUVERTE, SEUIL_ACCORD_SUR_DEVIS_DEPASSE, CONTROLE_DEVIS_ABSENT, TRANSITION_MISSION_INTERDITE, EXPERT_NON_ELIGIBLE, EXPERTISE_EXTERNE_IMPOSEE, CONVOCATION_TROP_TARDIVE, QUALIFICATION_NON_VERIFIEE, CONTRE_EXPERTISE_NON_AUTORISEE, PIECE_JOINTE_OBLIGATOIRE, POSTE_HORS_BAREME, CONDITION_POSTE_NON_REMPLIE, TABLE_NON_VALIDEE, SUPPLEMENT_NON_AUTORISE, MONTANT_INCHANGE, QUORUM_NON_ATTEINT, TEXTE_ECART_DECOMPTE, MENTION_LEGALE_VERROUILLEE, PREUVE_ENVOI_ABSENTE, CANAL_INJOIGNABLE, PARAMETRE_REGLEMENTAIRE, PIECE_ACCORD_ABSENTE, AUTORISATION_REPRESENTANT_ABSENTE, MONTANT_CONTRE_PROPOSITION_ABSENT, HONORAIRES_NON_VISES, AVIS_TUTELLE, BENEFICIAIRE_CONFORME, NUMERO_DEJA_UTILISE, POUVOIR_REQUIS, PLAFOND_ESPECES, ETAT_REGLEMENT, BENEFICIAIRE_VERIFIE, DOUBLON_REGLEMENT, MONTANT_RECLAME, MONTANT_ENCAISSE, AFFECTATION_EQUILIBREE, ECHEANCE_INCOMPLETE, ECHEANCE_REGLEMENTAIRE, SUSPENSION_NON_MOTIVEE, CANAL_ABSENT

### Catégorie 3 : renvois

- [3] FR-30 : La table complète des transitions est en §5.8 (W3) ; ce paragraphe fixe le cadre. -> La table complète des transitions est en §5.13 (FR-135) ; ce paragraphe fixe le cadre.
- [3] FR-31 : Le détail de `LITIGE` et de `FRAUDE_SUSPECTEE` est en §5.12 (W3) ; celui du refus de prise en charge en FR-42. -> Le détail de `LITIGE` et de `FRAUDE_SUSPECTEE` est en §5.11 (FR-124, FR-125) et §5.12 ; celui du refus de p...
- [3] FR-32 : tout est en §5.10 (W3). -> tout est en §5.10.
- [3] FR-31 : dans les états de pilotage avec leur motif (§5.14). -> dans les états de pilotage avec leur motif (§6.7, FR-213).
- [3] FR-33 : dans les contrôles du contrôle interne (`AUD`, §5.12). -> dans les contrôles du contrôle interne (`AUD`, §6.7).
- [3] FR-42 : (rédaction, usage n°11, §5.12) -> (rédaction, usage n°11, §5.11)
- [3] FR-80 : courrier de refus §5.12) -> courrier de refus §5.11)
- [3] FR-88 : Le litige est géré par `RESP` ou `DG` (§5.12) -> Le litige est géré par `RESP`, `DG` ou `DT` (§5.11, FR-124)
- [3] FR-10 : §5.7 (offre), §5.12 (refus), §6.1 (réclamations) -> §5.7 (offre), §5.11 (refus), §6.1 (réclamations)
- [3] FR-52 : qui sert aux indicateurs de délai (§5.14). -> qui sert aux indicateurs de délai (§6.7, FR-213).
- [3] FR-48, FR-49 : (module `assurance`, partie 3) -> (module `assurance`, §6.4)
- [3] FR-103 : (partie 3, module `assurance`) -> (§6.4, module `assurance`)
- [3] FR-116 : (catégorie `CONTENTIEUX`, partie 3) -> (catégorie `CONTENTIEUX`, §6.4)
- [3] FR-120 : (instance locale, partie 4) -> (instance locale, §7.4)
- [3] FR-145 : `notification` (partie 4) -> `notification` (§7.2)
- [3] FR-71 : garde-fou de la fiche IA (partie 4) -> garde-fou de la fiche IA (§7.4)
- [3] FR-147 : (§8, décision D20) -> (§4.13, FR-23)
- [3] FR-89 : module partagé `paiement` (§7) -> module partagé `paiement` (§7.1)
- [3] FR-95 : exécutés par le module `paiement`** (§7) -> exécutés par le module `paiement`** (§7.1)

### Catégorie 3 (suite) : renvois flous ou faux

- [3] FR-207 : le jour restant (§5). -> le jour restant (§5.14).
- [3] FR-213 : est reprise comme défaut interne (§5). -> est reprise comme défaut interne (§5.14).
- [3] FR-220 : accord enregistré de l'assuré (§5). -> accord enregistré de l'assuré (§5.8, FR-90).
- [3] FR-221 : n'est pas tracée (§5). -> n'est pas tracée (§5.8, FR-91).
- [3] FR-145 : indicateur de pilotage (§6) ; -> indicateur de pilotage (§6.7) ;
- [3] FR-231 : repris par `reprise`** (§6), -> repris par `reprise`** (§6.8),
- [3] FR-124 : (paramètre, §6). -> (paramètre, §6.4, FR-188).
- [3] FR-219 : cadré au §6. -> cadré au §6.8.
- [3] FR-10 : destinataire : GEST, DAF/RESP -> destinataire : GEST, RESP
- [3] FR-198 : remise à l'assuré sur l'accusé de réception ; la déclaration part vers le LC (FR-196) -> remise à l'assuré sur l'accusé de déclaration (FR-36) ; la déclaration part vers le LC (FR-196)
- [3] FR-53 : n'est jamais affiché hors des rôles autorisés (FR-70). -> n'est jamais affiché hors des rôles autorisés (FR-9, FR-153).

### Catégorie 1 : transitions et conventions de l'offre (FR-135 fait foi)

- [1] FR-76 : C'est la procédure du groupe (offre validée envoyée sous 48 h, paiement préparé après accord) et le Code CI... -> C'est la procédure du groupe (offre validée envoyée sous 48 h, paiement préparé après accord) et le Code CI...
- [1] FR-30 : | Validation, puis offre envoyée à l'assuré sous 48 h, puis accord enregistré | Délégation insuffisante ; s... -> | Validation par la délégation, dans `EN_VALIDATION` ; puis offre envoyée à l'assuré sous 48 h (transition ...
- [1] FR-30 : | Ordre de règlement, quittance, remise contre pièce d'identité (§5.8) | -> | Ordre de règlement, quittance, remise contre pièce d'identité (§5.8) ; les trois statuts sont dérivés des...
- [1] FR-31 : `REJETE` et `CLOTURE` se rouvrent par une décision motivée du `RESP` ou du `DG`. -> `REJETE`, `SANS_SUITE` et `CLOTURE` se rouvrent par une décision motivée du `RESP`, du `DG` ou du `DT` (tra...
- [1] FR-45 : l'agent **ouvre** le dossier (`DECLARE → OUVERT`) -> l'agent **ouvre** le dossier (`DECLARE → OUVERT`, transition 1)
- [1] FR-45 : (`DECLARE → PIECES_ATTENDUES`) : le dossier reçoit -> (`DECLARE → PIECES_ATTENDUES`, transition 2) : le dossier reçoit
- [1] FR-45 : « Reprendre le circuit » (`PIECES_ATTENDUES → OUVERT`) devient possible -> « Reprendre le circuit » (`PIECES_ATTENDUES → OUVERT`, transition 3) devient possible
- [1] FR-52 : **prend le dossier en instruction** (`OUVERT → EN_INSTRUCTION`). -> **prend le dossier en instruction** (`OUVERT → EN_INSTRUCTION`, transition 5).
- [1] FR-52 : `OUVERT → EN_INSTRUCTION` exige : droit `GEST` ou `RESP` ; -> `OUVERT → EN_INSTRUCTION` (transition 5) exige : droit `GEST`, `GREC` ou `RESP` ;
- [1] FR-57 : **demander des pièces complémentaires** (`EN_INSTRUCTION → PIECES_ATTENDUES`) -> **demander des pièces complémentaires** (`EN_INSTRUCTION → PIECES_ATTENDUES`, transition 6)
- [1] FR-75 : **enregistre l'évaluation** (`EN_INSTRUCTION → EVALUE`) -> **enregistre l'évaluation** (`EN_INSTRUCTION → EVALUE`, transition 7)
- [1] FR-77 : **envoie le dossier en validation** (`EVALUE → EN_VALIDATION`) -> **envoie le dossier en validation** (`EVALUE → EN_VALIDATION`, transition 8)
- [1] FR-80 : pour réévaluation (`EN_VALIDATION → EN_INSTRUCTION`) -> pour réévaluation (`EN_VALIDATION → EN_INSTRUCTION`, transition 11)
- [1] FR-80 : (`EN_VALIDATION → PIECES_ATTENDUES`), ou -> (`EN_VALIDATION → PIECES_ATTENDUES`, transition 12), ou
- [1] FR-80 : (`EN_VALIDATION → REJETE`, refus motivé -> (`EN_VALIDATION → REJETE`, transition 13, refus motivé
- [1] FR-84 : L'envoi (`EN_VALIDATION → OFFRE_ENVOYEE`) est un acte qui enregistre -> L'envoi (`EN_VALIDATION → OFFRE_ENVOYEE`, transition 10 ; la validation par la délégation a eu lieu avant, ...
- [1] FR-84 : - `EN_VALIDATION → OFFRE_ENVOYEE` exige : -> - `EN_VALIDATION → OFFRE_ENVOYEE` (transition 10) exige :
- [1] FR-86 : Seul cet enregistrement fait passer le dossier de `OFFRE_ENVOYEE` à `ORDRE_EMIS` -> Seul cet enregistrement fait passer le dossier de `OFFRE_ENVOYEE` à `ORDRE_EMIS` (transition 14)
- [1] FR-86 : - `OFFRE_ENVOYEE → ORDRE_EMIS` exige un accord enregistré -> - `OFFRE_ENVOYEE → ORDRE_EMIS` (transition 14) exige un accord enregistré
- [1] FR-87 : (`OFFRE_ENVOYEE → EN_INSTRUCTION`). Le gestionnaire reprend -> (`OFFRE_ENVOYEE → EN_INSTRUCTION`, transition 15). Le gestionnaire reprend
- [1] FR-88 : passe à `LITIGE` (`OFFRE_ENVOYEE → LITIGE`). -> passe à `LITIGE` (`OFFRE_ENVOYEE → LITIGE`, transition 16).
- [1] FR-89 : classement `SANS_SUITE` motivé, appel, visite. -> classement `SANS_SUITE` motivé (transition 27), appel, visite.
- [1] FR-88 : Un `GEST` ne peut pas constater un litige (`DROIT_INSUFFISANT`) ; `RESP` ou `DG` le peuvent. -> Un `GEST` ne peut pas constater un litige (`DROIT_INSUFFISANT`) ; `RESP`, `DG` ou `DT` le peuvent (transiti...
- [5] intro ## 3. : | **Décompte** | Le calcul qui mène du dommage à l'indemnité : dommage, vétusté, franchise, plafond, règle ... -> | **Décompte** | Le calcul qui mène du dommage à l'indemnité : dommage, vétusté, règle proportionnelle, pla...
- [5] FR-82 : détail du décompte (dommage, vétusté, franchise, plafond, règle proportionnelle ; ou, -> détail du décompte (dommage, vétusté, règle proportionnelle, plafond, franchise ; ou,
- [5] FR-134 : le décompte est arrêté (dommage, vétusté, franchise, plafond, règle proportionnelle) -> le décompte est arrêté (dommage, vétusté, règle proportionnelle, plafond, franchise)
- [5] FR-89 : la démo n'a qu'un seuil de 2 000 000 FCFA (FR-78, FR-79). -> la démo n'a qu'un seuil unique de 2 000 000 FCFA, valeur de la démo qui ne vaut plus comme seuil de délégat...
- [4] intro ## 3. : devis du garage 1 273 000, chiffrage de l'expert 445 500, provision d'ouverture 780 000 puis réajustée à l'... -> devis du garage 1 273 000, chiffrage de l'expert 445 500, évaluation arrêtée 395 500 (445 500 moins la fran...
- [4] FR-113 : - Une part du tiers égale à 70 % sur 445 500 FCFA payés donne un montant réclamé de 311 850 FCFA (chiffre d... -> - Une part du tiers égale à 70 % sur 395 500 FCFA payés (l'évaluation arrêtée de `SIN-2026-9002`, franchise...
- [4] FR-120 : - Pour une créance de 311 850 FCFA et une offre de 250 000 FCFA, l'écart affiché est de 61 850 FCFA (enviro... -> - Pour une créance de 276 850 FCFA (celle de `SIN-2026-9002`) et une offre de 200 000 FCFA, l'écart affiché...

### Catégorie 2 (complément)

- [2] FR-136 : | `CONTRE_EXPERTISE_NON_AUTORISEE` | -> | `PART_TIERS_NON_CHIFFREE` | La part du tiers doit être chiffrée (en pourcentage) pour une responsabilité ...

### Catégories 3 et 6 (corrections tranchées par le plan)

- [3] FR-3 : Le détail du contrôle est au §5 ; la projection -> Le détail du contrôle est au §5.2 (FR-41, FR-42) ; la projection
- [3] FR-8 : Le détail du circuit de décision est au §5. -> Le détail du circuit de décision est au §5.7 (FR-77 à FR-81).
- [6] FR-188 : Une révision dont l'écart dépasse 2 000 000 FCFA attend -> Une révision dont l'écart atteint ou dépasse 2 000 000 FCFA attend (aligné sur FR-76 et D12 : écart >= 2 000 000)
- [6] FR-89 : (15 statuts de la démo, 11 ici) -> (15 statuts de la démo ; ici 11 statuts du circuit nominal et 4 sorties, soit 15, FR-134) (le décompte 15 -> 11 contredisait FR-134 et FR-139)

## Contradictions non tranchées

Rien n'est corrigé ici : le plan ne tranche pas. Les propositions s'alignent sur FR-135 (la table fait foi, FR-134).

1. **Dénonciation de la transaction après l'accord (corporel).** FR-86 : « le dossier revient à `OFFRE_ENVOYEE` » ; FR-90 : l'ordre est annulé et le dossier « repasse en `EN_INSTRUCTION` » ; FR-135 : ni `ORDRE_EMIS → OFFRE_ENVOYEE` ni `ORDRE_EMIS → EN_INSTRUCTION` n'existent (seule la 19, `ORDRE_EMIS → EN_VALIDATION`, rejet comptable). Proposition : ajouter à FR-135 une transition `ORDRE_EMIS → EN_INSTRUCTION` (motif obligatoire, dénonciation enregistrée, RESP) et aligner FR-86 sur FR-90.
2. **Règlements sans accord de l'assuré (honoraires d'expert, titre commercial).** FR-90 dit qu'ils « échappent à l'accord » et naissent du visa des honoraires ou de la décision du `DG` ; FR-135 exige `ACCORD_ENREGISTRE` pour la transition 14 et ne prévoit aucune transition pour un règlement commercial hors circuit offre/accord ; D8 fait décider le commercial par le `DG` seul. Proposition : préciser dans FR-135/FR-92 que ces deux natures créent un règlement sans changer le statut du dossier (ou ajouter une transition dédiée si le dossier est déjà `REJETE` ou `CLOTURE`).
3. **Dossier en `LITIGE` et règlement de la part non contestée.** FR-88 autorise « un règlement de la part non contestée, avec accord enregistré » ; FR-124 interdit tout ordre de règlement et toute nouvelle offre tant que le dossier n'est pas revenu en `EN_INSTRUCTION`, et la table n'a aucune transition `LITIGE → ORDRE_EMIS`. Proposition : retenir FR-124 (retour en `EN_INSTRUCTION`, puis offre sur la part non contestée) et supprimer l'exception de FR-88.
4. **`AUD` « lecture seule » et ses actes de fraude.** §2.1 et FR-6 : `AUD` en lecture seule ; FR-135 (31, 37, 38), FR-129 et FR-133 : `AUD` signale, écarte et confirme une fraude (donc fait passer le dossier à `REJETE`). Proposition : écrire en §2.1/FR-6 que `AUD` agit sur la revue de fraude (écarter, confirmer, signaler) mais jamais sur le circuit d'indemnisation ; ou retirer la confirmation à `AUD` et la réserver à `DG`/`DT`.
5. **Qui ordonne une contre-expertise.** §2.1 : `RESP` ; FR-7 ligne 8 : « seuls RESP et DG » ; FR-66, FR-88, FR-124 et FR-135 (écarts) : `RESP`, `DG` ou `DT`. Proposition : `RESP`, `DG`, `DT` partout (valeur majoritaire), §2.1 et FR-7 à corriger.
6. **Remise du chèque par `CPT`.** FR-97 : « `ACC` (ou `CPT`) » remet ; FR-7 ligne 3 : émettre et remettre sont deux personnes différentes (chaîne ordre, chèque, remise par trois personnes), FR-93 : `CPT` émet. Proposition : dire en FR-97 que `CPT` ne remet que les chèques qu'il n'a pas émis ; le test de séparation (FR-7) reste la règle.
7. **Conditions de clôture.** FR-104 exige aussi `EXPERTISE_VALIDEE` (aucune mission ouverte) et « aucune offre définitive attendue » ; FR-135 transition 22 ne porte que `REGLEMENT_REMIS`, `SOLDE_APURE`, `RECOURS_QUALIFIE`. FR-104 limite la clôture à `GEST` ou `RESP` ; la 22 inclut `GREC`. Proposition : ajouter `EXPERTISE_VALIDEE` à la transition 22 et lister `GREC` en FR-104.
8. **Délai d'envoi de l'offre.** FR-84 : 48 heures **ouvrées** (balise) ; D6, FR-142, FR-146 : 48 heures sans précision. Proposition : « 48 heures ouvrées » partout, ou « 48 heures » partout.
9. **Point de départ de la cible de paiement de 72 heures.** FR-142 (tableau) : accord enregistré ; FR-102 : fin du délai de dénonciation au corporel. Proposition : ajouter la ligne « corporel » au tableau de FR-142.
10. **Sources non rapprochées dans les annexes.** Les annexes A, B, D (écrites ailleurs) peuvent encore employer les codes de refus abandonnés (`MOTIF_OBLIGATOIRE`, `DELEGATION_INSUFFISANTE`, `SIGNAL_FRAUDE_BLOQUANT`, etc., liste en FR-136) ; à vérifier à l'assemblage.

## Contrôles faits

- Toute FR citée existe (les renvois « PRD moteur », « PRD Reprise », « PRD-D » visent d'autres PRD) ; tout §x.y cité existe.
- Tout code de refus cité entre parenthèses dans les §4 à §7 est dans FR-136 (deux tableaux).
- Aucune FR renumérotée ou supprimée ; aucune balise [ASSUMPTION] retirée (une balise ajoutée en FR-113 pour le chiffre de SIN-2026-9002).
- Seuil de 2 000 000 FCFA : ne subsiste que comme « valeur de la démo » (FR-8, FR-89, écarts) et comme seuil d'écart de provision (FR-76, FR-124, FR-188, D12), qui est autre chose.

### Arbitrages appliqués (coordinateur, sur délégation du PO)

- [Arb.1] FR-135 : | 41 | `SANS_SUITE → EN_INSTRUCTION` | Rouvrir : l'assuré se manifeste | RESP, DG, DT | — | oui | -> | 41 | `SANS_SUITE → EN_INSTRUCTION` | Rouvrir : l'assuré se manifeste | RESP, DG, DT | — | oui | | 42 | `O...
- [Arb.1] FR-135 : - Le tableau contient 41 lignes ; -> - Le tableau contient 42 lignes ;
- [Arb.1] FR-135 : 33 à 36 et 41 [ASSUMPTION: 9, 21, 23, 27, 33 à 36 et 41 sont -> 33 à 36, 41 et 42 [ASSUMPTION: 9, 21, 23, 27, 33 à 36, 41 et 42 sont
- [Arb.1] FR-149 : fermer les culs-de-sac** : 9, 21, 23, 27, 33 à 36 et 41 (FR-135) -> fermer les culs-de-sac** : 9, 21, 23, 27, 33 à 36, 41 et 42 (FR-135)
- [Arb.1] FR-90 : est enregistrée sur le dossier ; tant que l'ordre n'est pas exécuté, elle l'annule (statut `ANNULE`, motif ... -> est enregistrée sur le dossier (lettre de dénonciation versée comme pièce) ; tant qu'aucun règlement n'est ...
- [Arb.1] FR-86 : si la victime dénonce dans ce délai, le dossier revient à `OFFRE_ENVOYEE` avec un motif et la nouvelle éché... -> si la victime dénonce dans ce délai, le dossier repasse en `EN_INSTRUCTION` (transition 42, motif obligatoi...
- [Arb.1] FR-136 : | `PIECE_ACCORD_ABSENTE` | -> | `DENONCIATION_RECUE` | Joignez la lettre de dénonciation de la transaction. | FR-86, FR-90, FR-135 | | `A...
- [Arb.2] FR-90 : Deux natures de règlement échappent à l'accord de l'assuré, car leur bénéficiaire n'est pas l'assuré : les ... -> Les **honoraires d'expert** échappent à l'accord de l'assuré, car leur bénéficiaire n'est pas l'assuré : ce...
- [Arb.2] FR-90 : - Le règlement à titre commercial sans décision du `DG` enregistrée est refusé (`VALIDATION_ACQUISE`). -> - Le règlement à titre commercial sans décision du `DG` enregistrée est refusé (`VALIDATION_ACQUISE`) ; san...
- [Arb.2] FR-92 : Statut du dossier dérivé : `ORDRE_EMIS` tant qu'au moins un règlement est -> Statut du dossier dérivé (les règlements d'honoraires sont exclus de ce calcul, FR-90) : `ORDRE_EMIS` tant ...
- [Arb.3] FR-124 : Un dossier en litige ne peut pas recevoir d'ordre de règlement ni de nouvelle offre tant qu'il n'est pas re... -> En litige, aucune nouvelle offre globale ni aucun ordre pour la part contestée n'est possible tant que le l...
- [Arb.3] FR-88 : - Pendant le `LITIGE`, aucun ordre de règlement ne peut être émis sur le montant refusé ; seul un règlement... -> - Pendant le `LITIGE`, aucun ordre de règlement ne peut être émis sur le montant refusé et aucune nouvelle ...
- [Arb.4] intro ### 2.1 : | AUD | Contrôle interne | tous les dossiers, **en lecture seule** | contrôle, lit le journal des changemen... -> | AUD | Contrôle interne | tous les dossiers, **en lecture seule pour les décisions** | contrôle, lit le jo...
- [Arb.4] FR-6 : (DG, DT, RESP, AUD en lecture seule) -> (DG, DT, RESP, AUD en lecture seule pour les décisions : il signale une suspicion de fraude et rend un avis...
- [Arb.4] FR-129 : Un relecteur (`AUD`, `RESP`, `DG` ou `DT`) **prend** la revue (`EN_REVUE`), puis conclut : **écarter** (`RE... -> Un relecteur (`AUD`, `RESP`, `DG` ou `DT`) **prend** la revue (`EN_REVUE`). `AUD` rend un **avis écrit**, v...
- [Arb.4] FR-129 : - Une confirmation par `RESP` est refusée (`DROIT_INSUFFISANT`) ; un écartement par `GEST` l'est aussi. -> - Une confirmation par `RESP` ou `AUD` est refusée (`DROIT_INSUFFISANT`) ; un écartement par `GEST` ou `AUD...
- [Arb.4] FR-133 : La **confirmation** de la fraude est réservée à `DG`, `DT` et `AUD`, avec une conclusion écrite. -> La **confirmation** de la fraude est réservée à `DG` et `DT`, avec une conclusion écrite, après l'**avis éc...
- [Arb.4] FR-133 : - Une confirmation par `RESP`, `GEST` ou `GREC` est refusée (`DROIT_INSUFFISANT`). -> - Une confirmation par `RESP`, `GEST`, `GREC` ou `AUD` est refusée (`DROIT_INSUFFISANT`) ; une confirmation...
- [Arb.4] FR-135 : | 37 | `FRAUDE_SUSPECTEE → EN_INSTRUCTION` | Écarter la suspicion et reprendre | RESP, DG, DT, AUD | revue ... -> | 37 | `FRAUDE_SUSPECTEE → EN_INSTRUCTION` | Écarter la suspicion et reprendre | RESP, DG, DT | revue `ECAR...
- [Arb.4] FR-135 : | 38 | `FRAUDE_SUSPECTEE → REJETE` | Confirmer la fraude et refuser | DG, DT, AUD | revue `CONFIRME` | oui | -> | 38 | `FRAUDE_SUSPECTEE → REJETE` | Confirmer la fraude et refuser | DG, DT | revue `CONFIRME`, `AVIS_AUD_...
- [Arb.4] FR-136 : | `PIECE_ACCORD_ABSENTE` | -> | `AVIS_AUD_REQUIS` | L'avis écrit du contrôle interne est requis avant de confirmer une fraude. | FR-129, ...
- [Arb.5] intro ### 2.1 : attribue les dossiers, ordonne une contre-expertise, valide jusqu'au seuil -> attribue les dossiers, ordonne une contre-expertise (comme `DG` et `DT`), valide jusqu'au seuil
- [Arb.5] FR-7 : seuls RESP et DG l'ordonnent ; le gestionnaire ne peut pas -> seuls RESP, DG et DT l'ordonnent ; le gestionnaire ne peut pas
- [Arb.6] FR-135 : | 20 | `CHEQUE_A_REMETTRE → REGLE` | Constater la remise au bénéficiaire | ACC, CPT | `REGLEMENT_EMIS`, `ID... -> | 20 | `CHEQUE_A_REMETTRE → REGLE` | Constater la remise au bénéficiaire | ACC ; CPT seulement s'il n'a pas...
- [Arb.6] FR-97 : À la remise, `ACC` (ou `CPT`) enregistre : -> À la remise, `ACC` enregistre (`CPT` seulement pour un règlement qu'il n'a pas lui-même émis, FR-7, FR-93) :
- [Arb.6] FR-97 : - Un gestionnaire du dossier qui n'a pas le rôle `ACC` ou `CPT` ne peut pas enregistrer la remise (`DROIT_I... -> - Un gestionnaire du dossier qui n'a pas le rôle `ACC` ou `CPT` ne peut pas enregistrer la remise (`DROIT_I...
- [Arb.6] FR-7 : | 3 | Émettre le règlement et le remettre au bénéficiaire | chaîne **ordre, chèque, remise** assurée par tr... -> | 3 | Émettre le règlement et le remettre au bénéficiaire | chaîne **ordre, chèque, remise** assurée par tr...
- [Arb.6] FR-89 : le guichet (`ACC` ou `CPT`) le remet contre quittance signée. -> le guichet (`ACC` ; `CPT` seulement pour un règlement qu'il n'a pas émis) le remet contre quittance signée.
- [Arb.6] FR-93 : - L'émission est refusée si l'un des contrôles de FR-100 est en alerte non levée (`CONTROLE_LBC_FT`). -> - L'émission est refusée si l'un des contrôles de FR-100 est en alerte non levée (`CONTROLE_LBC_FT`). - Le ...
- [Arb.7] FR-135 : `REGLEMENT_REMIS`, `SOLDE_APURE`, `RECOURS_QUALIFIE` | oui | -> `REGLEMENT_REMIS`, `SOLDE_APURE`, `EXPERTISE_VALIDEE`, `RECOURS_QUALIFIE` | oui |
- [Arb.7] FR-104 : Le gestionnaire (`GEST`) ou le responsable (`RESP`) clôture un dossier `REGLE` -> Le gestionnaire (`GEST`, `GREC`) ou le responsable (`RESP`) clôture un dossier `REGLE`
- [Arb.8] intro ### 2.3 : Prospera envoie l'**offre** à Mawuli sous 48 heures ; -> Prospera envoie l'**offre** à Mawuli sous 48 heures ouvrées ;
- [Arb.8] FR-14 : offre validée envoyée sous 48 heures ; rapport d'expert -> offre validée envoyée sous 48 heures ouvrées ; rapport d'expert
- [Arb.8] FR-83 : #### FR-84 : L'offre validée part sous 48 heures -> #### FR-84 : L'offre validée part sous 48 heures ouvrées
- [Arb.8] FR-84 : l'offre doit être **envoyée sous 48 heures** (paramètre, valeur du mémoire `[ASSUMPTION: 48 heures ouvrées,... -> l'offre doit être **envoyée sous 48 heures ouvrées** (paramètre, valeur du mémoire `[ASSUMPTION: 48 heures ...
- [Arb.8] FR-84 : non envoyé après 48 heures est une **alerte** -> non envoyé après 48 heures ouvrées est une **alerte**
- [Arb.8] FR-84 : Un dossier validé depuis plus de 48 heures sans envoi -> Un dossier validé depuis plus de 48 heures ouvrées sans envoi
- [Arb.8] FR-142 : offre envoyée | 48 heures | alerte au gestionnaire -> offre envoyée | 48 heures ouvrées | alerte au gestionnaire
- [Arb.8] FR-30 : offre envoyée à l'assuré sous 48 h (transition 10) -> offre envoyée à l'assuré sous 48 h ouvrées (transition 10)
- [Arb.8] FR-76 : (offre validée envoyée sous 48 h, paiement préparé après accord) -> (offre validée envoyée sous 48 h ouvrées, paiement préparé après accord)
- [Arb.8] FR-146 : offre à envoyer sous 48 h | -> offre à envoyer sous 48 h ouvrées |
- [Arb.8] FR-146 : alerte à mi-délai des 48 h] -> alerte à mi-délai des 48 h ouvrées]
- [Arb.9] FR-142 : | Paiement (cible) | accord enregistré | dernier règlement `PAYE` | 72 heures | -> | Paiement (cible) | accord enregistré ; au corporel automobile, fin du délai de dénonciation de 15 jours |...
- [Arb.9] FR-14 : paiement sous 72 heures après accord ; relance du recours -> paiement sous 72 heures après l'accord enregistré (au corporel automobile, après la fin du délai de dénonci...
- [Arb.9] FR-142 : elle est remplacée par la cible de 72 heures après accord. -> elle est remplacée par la cible de 72 heures après l'accord enregistré (au corporel automobile, après la fi...

#### Synthèse des arbitrages appliqués

1. Dénonciation (art. 235) : transition 42 `ORDRE_EMIS → EN_INSTRUCTION` ajoutée à FR-135 (42 lignes) ; FR-86 et FR-90 alignés ; codes `DENONCIATION_RECUE` et `AUCUN_REGLEMENT_REMIS` ajoutés à FR-136.
2. Honoraires : règlements `HONORAIRES` sans changement de statut (FR-90, FR-92) ; règlement commercial : décision du `DG`, accord du bénéficiaire exigé, transition 14.
3. LITIGE : FR-88 retenu ; FR-124 corrigé (acompte sur la part non contestée permis, le dossier reste `LITIGE`).
4. AUD : lecture seule pour les décisions, signale et rend un avis écrit ; écarter = `RESP`, `DG`, `DT` ; confirmer = `DG`, `DT` après avis (`AVIS_AUD_REQUIS`, nouveau code) ; §2.1, FR-6, FR-129, FR-133, transitions 37 et 38.
5. Contre-expertise : `RESP`, `DG`, `DT` (§2.1, FR-7).
6. Remise du chèque : `ACC` ; `CPT` seulement s'il n'a pas émis ; transition 20, FR-97, FR-93, FR-7, §5.8.
7. Clôture : `EXPERTISE_VALIDEE` ajoutée à la transition 22, `GREC` listé en FR-104.
8. 48 heures ouvrées partout.
9. 72 heures : départ à l'accord enregistré, ou fin du délai de dénonciation au corporel (FR-142, FR-14).
10. Autres contradictions du journal : propositions 6, 7, 8, 9 appliquées dans les arbitrages ci-dessus ; la 10 (annexes) reste une vérification à l'assemblage. Les contradictions 1 à 9 ci-dessus sont closes.

Non appliqué ou laissé volontairement : `RECOURS_QUALIFIE` et « aucune offre définitive attendue » restent des conditions de clôture (FR-104, transition 22), car « le recours peut continuer après la clôture » ne les contredit pas (il faut seulement que la question du recours soit tranchée) ; FR-7 ligne 10 (`AUD` certifie une reconstitution) et §2.1 (`DG` certifie) non modifiés, un point à confirmer au regard de « `AUD` ne décide jamais ».
