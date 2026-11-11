# Vérification finale : spine (42 AD) contre `review-reconcile-prd.md` et `review-rubric.md`

Vérifié le 2026-11-11 contre `ARCHITECTURE-SPINE.md` final et `.memlog.md` (D-1 → D-18, Q-1 → Q-11). Le tableau `disposition.md` n'a pas été cru : chaque constat a été relu dans la spine.

**Bilan**

- `review-reconcile-prd.md` (36 constats) : **OK 34 / PARTIEL 1 / KO 0 / CADUC 1**
- `review-rubric.md` (30 constats) : **OK 26 / PARTIEL 3 / KO 0 / CADUC 1**

Aucune régression (KO) : la dernière passe n'a rien retiré ni contredit de ce que les rapports demandaient. Quatre PARTIEL, tous à corriger en une phrase (voir la fin).

## Rapport 1 : réconciliation PRD (E-01 → E-36)

| id | verdict | AD | preuve courte | correction |
|---|---|---|---|---|
| E-01 | OK | 31, 9, 7 | `CORRECTIF` par majeure maintenue, sans migration, 72 h depuis « prévenu », report unique 7 j, annonce dans la réponse quotidienne, hors vagues ; D-18 respectée | |
| E-02 | OK | 30, 7, 24 | `VERSION_FIGEE` calculée par l'agent, N/N-1 distinct de la compatibilité d'agent, DG prévenu à 90 j, pas de promotion forcée | |
| E-03 | OK | 17, 37, 6 | `instance.etat.modifie`, `POST /commandes` + `instance.commande.deposee`, `.executee` ; gel retiré des tâches de la partie A | |
| E-04 | OK | 8, 4, 7 | `LICENCE_AUTRE_INSTANCE`, `LICENCE_ANTERIEURE` toutes clés confondues, refus entier, validité, composition de l'état de confiance, effet du fichier d'urgence | |
| E-05 | OK | 35, 16 | fichier de rétablissement, compteur `dernier + 1`, RTO 4 h | |
| E-06 | OK | 14, 4 | jeton d'export signé, vérifié hors ligne par `apprentissage-service` | |
| E-07 | OK | 38, 16 | essai prospect, avis à 2 destinataires, effacement par route C13 de chaque propriétaire, certificat daté sur la rétention, acheteur hébergé à 90 j | |
| E-08 | OK | 39 | volumes versionnés hors migration, calibration sœur, test d'empreinte aux conventions | |
| E-09 | OK | 13, 12 | cas plateforme : registre tenu par l'agent, alimenté par `abonnement.contrat.signe`, compte de service IA derrière la garde, lectures d'exploitation journalisées | |
| E-10 | OK | 14, 13 | double approbation (DG + responsable des données via `approbationsExport`), purge 30 j, table de correspondance jamais exportée, clause du contrat préalable | |
| E-11 | OK | 15, 19, 2 | partie A orchestre naissance et rejeu, l'agent ne fait que le rafraîchissement ; AD-19 liste sept points dont FR-17 et FR-18 | |
| E-12 | OK | 25, 17 | faits de paiement relayés par l'agent de la plateforme (D-13), envoi par `notification-service` (D-16), lien à durée limitée, alerte J-7, jamais de sanction d'un acheteur soldé | |
| E-13 | PARTIEL | 6, 32, conventions | date limite d'interrupteur dans AD-6, « une seule version ouverte » dans AD-32, test éteint/allumé aux conventions ; manque « sur site, tous les interrupteurs passent à leur position finale à la promotion » (PRD FR-17 / décision PO du 2026-11-10) et « un interrupteur ne change jamais la forme des données » | Ajouter à AD-11 : « sur site, la promotion fait passer tous les interrupteurs à leur position finale ; un interrupteur ne change jamais la forme des données (test éteint/allumé). » |
| E-14 | OK | 32, 9, 11 | pilote, 7 j sans incident, plafond 14 j ; incidents dans le schéma fermé du signal ; « pas deux promotions en 7 jours » tenu par l'agent (site) et la centrale (plateforme) | |
| E-15 | OK | 11 | retour arrière « au niveau de correctif courant », ne retire jamais un correctif | |
| E-16 | OK | 11, 40 | migrations avant bascule, bascule des seuls services modifiés, durée journalisée, annonce | |
| E-17 | OK | 2, 11, 23, 40 | installation logique (plateforme) contre profil lancé (site), images préchargées, étapes horodatées | |
| E-18 | OK | 10, 40 | sonde SM-3 avec test d'intrusion, garde C6 au gabarit, tests aux conventions | |
| E-19 | OK | 9, 40 | signal : santé par module, voyant (test de restauration), niveau et anomalies, mises à jour en attente, écarts nommés en codes, avancement, incidents | |
| E-20 | OK | 9 | compteurs de Connecteurs dans la vérification quotidienne sur site ; addendum A-4 déjà aligné | |
| E-21 | CADUC | 4, 9, Deferred | D-12 : pas de TPM en v1, un seul niveau `LOGICIEL`, gel 30 j pour tous ; la seule occurrence de TPM est au Deferred | |
| E-22 | OK | 12 | pseudonyme stable dans la chaîne, table de correspondance hors chaîne et seule effaçable | |
| E-23 | OK | 15 | mêmes routes C13 et même bibliothèque de masquage que le niveau 1, refus par organisation, jamais `ESSAI_PROSPECT`, jamais d'écriture dans le réel | |
| E-24 | OK | 10 | aucun secret d'écriture du réel dans l'essai, liste blanche et journal des interceptions tenus par la partie A, `ECRITURE_REELLE_DEPUIS_ESSAI` aux codes | |
| E-25 | OK | 23, 26, conventions | bibliothèque `point-de-decision` unique avec preuve par mutation, ordre des refus, codes `MANIFESTE_*` et `AVEC_PERTE_INTERDIT_PLATEFORME` aux conventions | |
| E-26 | OK | 9, 1 | définition du contact (« jamais déjà vu »), exception du correctif critique par fichier pendant le gel | |
| E-27 | OK | 10 | séquence de montage et cinq contrôles du bilan, premier signal confirmé par la centrale | |
| E-28 | OK | 16, 19 | RTO 4 h, 7/4/3, clé d'exploitation tenue par l'agent et clé de secours au client, copie hors machine croisée | |
| E-29 | OK | 20 | comptes Money Vibes : ouverture distincte, durée bornée, fermés par défaut, journal consultable | |
| E-30 | OK | 4, 16, 34 | volume dédié et miroir qui n'avance que ; le compteur ne s'incrémente qu'à chaque contact préparé | |
| E-31 | OK | 10, 3 | agent et Traefik dans un troisième projet, hors profils | |
| E-32 | OK | conventions | recul de 40 jours, cas de la matrice, re-promouvoir, indicateur sans identifiant, `instance:*` en gel, tous présents | |
| E-33 | OK | 41, 10 | démo du 15/01 sur l'horloge système de la plateforme, ordre de repli de §8.4 transposé | |
| E-34 | OK | 13, 37 | `CONSENTEMENT_RESERVE_AU_DG` appliqué par `auth-service`, DG enregistré porté par l'état voulu, revérifié par l'agent | |
| E-35 | OK | 11 | promotion installe le module ajouté par la majeure après l'avenant automatique (FR-12) | |
| E-36 | OK | 13, 17 | « la console lit le registre par `apprentissage-service` », ligne au tableau des contrats | |

## Rapport 2 : grille de la bonne spine (C-1 → C-6, H-1 → H-7, M-1 → M-10, B-1 → B-7)

| id | verdict | AD | preuve courte | correction |
|---|---|---|---|---|
| C-1 | OK | 28, 7 | racine sur deux clés matérielles, deux détenteurs, racine de secours, familles `ci` et `centrale` (D-14), jeux dev/recette/prod, compromission par fichier d'urgence | |
| C-2 | OK | 36, 10 | exécuteur seul au socket, contact sans privilège ni socket, liste blanche, gabarits sans `privileged`, secrets en fichiers, disque chiffré exigé, SBOM et analyse bloquante. Réserve : l'exécuteur « minimal » porte aussi Kafka et `GET /heure`, mais la faille du processus réseau ne vaut pas root | |
| C-3 | OK | 35 | sauvegarde 3-2-1 de la base, de la CA et du registre, RTO 4 h, compteur qui évite le faux recul, prolongation après 3 j de panne ; haute disponibilité au Deferred (Q-3) | |
| C-4 | PARTIEL | 35, 13, 17, 2 | fichier de rétablissement, miroir, test « serveur perdu » présents ; mais la centrale qui émet le fichier « portant la copie signée du registre » n'a aucun contrat pour l'obtenir (la copie vit dans `apprentissage-service`, qui ne parle à aucun autre service du poste central), et la copie n'est envoyée qu'avec un échantillon (AD-13) : un retrait fait après la dernière copie reviendrait au ré-ancrage | Ajouter à AD-9 et AD-17 : « l'agent joint la copie signée du registre au contact à chaque changement du registre (retrait compris), et la centrale la garde pour le fichier de rétablissement. » |
| C-5 | OK | 26, 17, 22, 9 | JWS Ed25519 + JCS, champs obligatoires, schémas et vecteurs signés rejoués des deux côtés, `versionProtocole`, état voulu nommé | |
| C-6 | OK | 29 | CA dédiée, jeton d'enrôlement, clé générée sur place, 30 j + grâce 30 j, révocation côté centrale, renouvellement refusé après recul ou sanction | |
| H-1 | OK | 11, 40, 23 | migrations avant la bascule, interruption journalisée, test de performance NFR-9, NFR-5 par les étapes horodatées | |
| H-2 | OK | 33 | point d'entrée `migrer` idempotent déclaré au manifeste, verrou de composition, lecture N et N-1 | |
| H-3 | OK | 34, 3 | SQLite chiffré à journal anticipé, bail exclusif, format N lisible par N-1 ou migration après validation | |
| H-4 | OK | 34, 12 | réseau Docker dédié, un client Kafka par espace, tampon local et fait « trou », ordre de chaîne fixé par l'agent | |
| H-5 | OK | 9, conventions | 443 vers deux noms sans inspection, proxy explicite, registre par le même mTLS, test « registre indisponible » | |
| H-6 | OK | 16, 9, 20 | les marques sont couvertes par D-15, Q-2, Q-3, Q-4, D-12 ; AD-1 sans « façon GitOps » | |
| H-7 | OK | 41 | premier incrément : agent et centrale simulés, état voulu signé, licence, test croisé | |
| M-1 | OK | 5 | trois règles testables : borne de 48 h, éteint, heure de référence de numéro plus élevé journalisée | |
| M-2 | OK | 13, 26 | vocabulaire fermé et versionné, copie complète du registre par échantillon, copie périmée à 14 j | |
| M-3 | OK | 40 | journaux JSON, `instanceId` et `correlationId`, alertes vers le ticket, « agent muet » distinct de « centrale muette » | |
| M-4 | OK | 19 | sept points listés et test « aucune branche plateforme hors port d'heure, source de droits et configuration » | |
| M-5 | PARTIEL | 32, Seed | recette de la centrale et instance de test présentes, pilote d'abord, centrale peut arrêter une vague ; rien sur la version d'agent essayée avant une vague, ni sur l'arrêt automatique d'une vague sur incident, ni sur la taille d'une vague | Ajouter à AD-32 : « une version de l'agent suit les mêmes vagues (pilote d'abord) ; un incident remonté suspend la vague suivante jusqu'à décision de Money Vibes. » |
| M-6 | OK | conventions | compatibilité croisée N/N-1, test de contrat des deux côtés, attaques, non-sortie de champ, charge (AD-40) | |
| M-7 | OK | 36 | build dans la CI, SBOM, analyse bloquante ; builds reproductibles au Deferred | |
| M-8 | OK | 14 | même identité mTLS, morceaux repris, clef d'idempotence | |
| M-9 | OK | 15 | identités de service émises par l'`auth-service` de chaque espace, jamais partagées | |
| M-10 | PARTIEL | 12, 38 | rétention du journal et pseudonymisation dites ; le sort de l'état de confiance, du registre des consentements et du magasin à la fin d'un contrat sur site (réversibilité, effacement) n'est pas dit (AD-38 ne traite que prospect et hébergé) | Ajouter à AD-38 : « à la fin d'un contrat sur site, l'agent exporte puis efface le magasin (état de confiance, registre) ; seul le journal est gardé, pseudonymisé. » |
| B-1 | OK | 20, Deferred | « sortant en 443 » inscrit dans la règle | |
| B-2 | OK | 16 | Mongo et MinIO sauvegardés au même instant de référence | |
| B-3 | OK | Paradigme | la parenthèse de justification a disparu | |
| B-4 | OK | 9 | gel : une règle d'une ligne (`gelApresJours`, 30 j) | |
| B-5 | CADUC | Deferred | `tpm2-tools` sorti de la pile v1 (D-12) | |
| B-6 | OK | conventions | `ETAT_VOULU_REFUSE` ou `SIGNATURE_REFUSEE`, détail au journal | |
| B-7 | OK | Diagramme 1 | flèche vers le moteur Docker, registre ajouté | |

## Corrections à faire (PARTIEL)

1. **E-13** : AD-11, ajouter la règle de la position finale des interrupteurs sur site et « jamais de changement de forme des données ».
2. **C-4** : AD-9 / AD-17, l'agent joint la copie signée du registre à chaque changement (retrait compris), la centrale la garde pour le fichier de rétablissement.
3. **M-5** : AD-32, la ligne de version de l'agent suit les vagues ; un incident suspend la vague suivante.
4. **M-10** : AD-38, sort du magasin de l'agent à la fin d'un contrat sur site.
