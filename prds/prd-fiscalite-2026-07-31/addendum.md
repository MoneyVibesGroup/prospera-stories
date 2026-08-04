# Addendum — PRD Fiscalité

Contenu apporté par le PO qui a sa place dans un document AVAL (architecture, solution design, spéc UX),
pas dans le corps du PRD. Conservé ici mot pour mot dans l'intention, reformulé pour la lisibilité.

---

## A. Architecture cible proposée par le PO (2026-07-31)

Empilement en couches, du dossier au paiement :

```
                    PROSPERA TAX & COMPLIANCE
                              │
             ┌────────────────┴────────────────┐
       CLIENT / DOSSIER                  CABINET / ÉQUIPE
             └────────────────┬────────────────┘
                       COMPTABILITÉ
                              │
                      TAX DATA ENGINE      ← extraction des données fiscalisables
                              │
                      TAX RULE ENGINE      ← règles paramétrables par pays
                              │
              ┌───────────────┼───────────────┐
            TOGO            BÉNIN        CÔTE D'IVOIRE
         Country Adapter  Country Adapter  Country Adapter
              └───────────────┼───────────────┘
                    DECLARATION ENGINE       ← mise au format national
                              │
                       WORKFLOW MOTEUR
                              │
                     VALIDATION / SIGNATURE
                              │
                      PORTAL CONNECTOR
                              │
                    DÉPÔT → ACCUSÉ → ARCHIVAGE
                              │
                       PAIEMENT / SUIVI
```

**Principe directeur :** le cœur reste identique, seule la couche « pays » change. Le même calcul fiscal
doit pouvoir produire un format Togo, un format Bénin, un format Côte d'Ivoire.

**Découpage Tax Engine ⊥ pays :**

```
Tax Engine
   ├── Country : Togo · Bénin · Côte d'Ivoire · Sénégal
   └── Tax Rules : TVA · IS · IR · Retenues · Taxes locales · Taxes spécifiques
```

Interdit : « TVA = une règle universelle ». La logique de TVA est similaire partout, mais taux,
exonérations, régime simplifié, seuils, périodicité, échéances, déductibilité, territorialité,
facturation électronique, retenues et règles de crédit divergent.

---

## B. Modèle de données du Dossier Fiscal Client

Le client est une entité unique ; chaque **implantation fiscale** est un contexte distinct.

```
CLIENT
  └── Société A
        ├── Togo          → identifiant fiscal · régime TVA · portail · obligations
        ├── Bénin         → identifiant fiscal · régime TVA · obligations
        └── Côte d'Ivoire → identifiant fiscal · obligations
```

Contenu du dossier permanent (indépendant du pays) : raison sociale, forme juridique, RCCM ou
équivalent, identifiant fiscal, numéro de TVA le cas échéant, adresse, activité, régime fiscal, date de
début d'activité, exercice comptable, coordonnées bancaires, dirigeants, représentants légaux, associés,
contrats importants, statuts, documents administratifs, anciennes déclarations, correspondances avec
l'administration.

---

## C. Credential Vault + Mandate Management (conception de sécurité)

Rejeté explicitement par le PO : *« Donnez-nous votre login et votre mot de passe fiscal »* comme modèle
d'architecture.

```
CLIENT
 ├── Identité fiscale
 ├── Mandats                  → Cabinet · Expert-comptable · Collaborateur
 ├── Connexions administratives → Portail fiscal · social · douanier · autres
 └── Autorisations            → Lecture · Préparation · Dépôt · Signature · Paiement
```

Cinq natures d'accès à ne surtout pas confondre :

1. **Identifiant fiscal de l'entreprise** — donnée métier.
2. **Compte utilisateur du portail** — donnée d'accès (login, mot de passe, MFA/OTP).
3. **Mandat** — qui agit, pour quelle entreprise, quelle période, quelles obligations, quelles limites.
4. **Certificat électronique** — certificat, signature, token, clé cryptographique. *Change complètement
   l'architecture quand un pays l'impose.*
5. **Accès bancaire** — gradué : aucun accès / consultation / préparation / validation / pouvoir de
   paiement. Ces droits ne doivent jamais être mélangés.

Exigences : chiffrement fort, coffre-fort de secrets, journalisation, rotation des credentials, MFA,
séparation des rôles, traçabilité de chaque action. **Le collaborateur ne devrait pas nécessairement
connaître le mot de passe.**

---

## D. Séparation chaîne fiscale / chaîne financière

| Chaîne fiscale | Chaîne financière |
| --- | --- |
| Calcul | Création de l'ordre de paiement |
| Préparation | Validation bancaire |
| Signature | Débit du compte |
| Dépôt | |

Séquence complète : `CALCUL → VALIDATION → DÉPÔT → ACCUSÉ → ORDRE DE PAIEMENT → AUTORISATION →
PAIEMENT → RAPPROCHEMENT`.

Le paiement effectif peut nécessiter compte bancaire du client, authentification forte, OTP, validation
du dirigeant, signature électronique, autorisation bancaire — le cabinet ne doit pas supposer qu'il peut
payer à la place du client.

---

## E. Chaîne de justification en contrôle fiscal

Ce qui fait peur en contrôle n'est pas « le montant est faux », c'est **ne pas pouvoir démontrer comment
le chiffre a été obtenu**. Chaîne à pouvoir remonter à la demande :

```
15 000 000 → Déclaration TVA → Calcul fiscal → Balance comptable
           → Journal des ventes → Factures → Pièces justificatives
```

Exemple de versionnement attendu sur une déclaration :

```
Déclaration TVA — Juillet 2026
  v1  12 500 000  créée par Collaborateur A
  v2  13 200 000  correction d'une facture
  v3  13 450 000  validation expert-comptable
  Dépôt    18/08/2026 · utilisateur Cabinet · référence XXXXX
  Paiement 13 450 000 · référence XXXXX
```

---

## F. Alternatives écartées et pourquoi

- **Modèle A — le client fait tout** (le cabinet prépare, le client dépose, paie, le cabinet archive la
  preuve). Le plus simple juridiquement, écarté : *le cabinet ne maîtrise pas l'exécution* — le client
  peut oublier, déposer en retard, modifier le montant, ne pas payer.
- **Modèle C — le cabinet fait toute la chaîne y compris le paiement.** Écarté comme cible par défaut :
  concentre le plus de risques, dépend d'une authentification forte et d'autorisations bancaires que le
  cabinet ne détient pas de droit. Reste possible **si et seulement si** un mécanisme légal ET technique
  de mandat l'autorise, pays par pays.
- **Automatiser d'emblée 100 % des portails de 10 pays** — nommé « le piège classique » par le PO.

---

## G. Comparables

- **CassKai** (`casskai.app`) — comptabilité + facturation pour PME OHADA, pages produit dédiées Togo,
  Bénin, Côte d'Ivoire ; SYSCOHADA + facture normalisée électronique + FNE côté Côte d'Ivoire.
- **KiboERP** — comptabilité SYSCOHADA & IFRS, cloud et on-premise.

Aucun des deux ne semble positionné sur la **preuve de dépôt et la piste d'audit inter-pays**, qui est
l'axe de différenciation retenu.

---

## H. Paysage des canaux nationaux (relevé 2026-07-31, à confirmer par pièces)

| Pays | Déclaration périodique | Dépôt des états financiers |
| --- | --- | --- |
| Togo | `e-services.otr.tg` (depuis 2016 GE / 2017 PME) | **GUDEF** `gudef.otr.tg` (obligatoire depuis 2023 ; redistribue à OTR, BCEAO, INSEED, tribunal de commerce) |
| Sénégal | `etax` (DGID) | **SEN-ETAFI** `sen-etafi.dgid.sn` — publie des modèles XLSX, dont **liasse SMT SYSCOHADA révisé** |
| Burkina Faso | `eSINTAX.bf` + télépaiement mPAYMENT (Orange, Moov) ; `dgi.bf/edocument` | à documenter |
| Côte d'Ivoire | `e-impots.gouv.ci` + mobile money | à documenter |
| Bénin | à documenter | DSF au 30/04 |

⚠️ Aucun de ces portails n'expose d'API publique documentée à ce stade du relevé. À prouver ou à
infirmer avant de spécifier le Portal Connector.
