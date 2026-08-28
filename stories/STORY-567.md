# STORY-567 : Trois portes vers un même redevable — le salarié, le dirigeant et le cabinet ouvrent chacun un compte « déclaration », et le dirigeant reste lié à sa société

Status: ready-for-dev

**Épic :** EPIC-027 — Natures d'accès et habilitations graduées
**Service :** `fiscal-service` (`:3012`) · `auth-service` · `platform-catalog-service`
**Points :** 13 · **Sprint :** S30
**Origine :** **décision PO du 2026-08-28** — *« un salarié peut créer un compte juste pour la
partie déclaration fiscale, de même qu'un dirigeant, mais aussi le cabinet peut créer un compte
uniquement pour la déclaration »*.
**Amende :** ⛔ **STORY-563**, dont le hors-périmètre disait *« Donner un compte Prospera au
dirigeant. Il est **sujet** de données, pas utilisateur »* — **le PO rouvre exactement ce point.**
**Prérequis :** **STORY-563** (le `Redevable`)
**Réf. :** **STORY-549** (registre de modules au catalogue ; arbitrage PO *« DEUX modules fiscaux
et non un — ils se vendent différemment »*) · **STORY-301** (mandat) · **NFR-F06** (isolation)

---

## Le fait

STORY-563 a créé le `Redevable` mais l'a laissé **sans utilisateur** : le cabinet agit pour lui
sous mandat, et la personne physique n'a aucun accès. Le PO ouvre trois portes vers ce même objet.

⚡ **Le point structurant : trois portes, un seul `Redevable`.** Ce n'est pas trois produits, c'est
trois façons d'arriver au même agrégat — et c'est ce qui interdit de fabriquer trois modèles de
données qui divergeront.

| Porte | Qui ouvre le compte | D'où vient la matière | Y a-t-il un dossier d'entreprise ? |
|---|---|---|---|
| **Salarié** | lui-même | **ce qu'il fournit** (STORY-568) | non |
| **Dirigeant** | lui-même | sa **rémunération dans le dossier** de sa société | oui, il y est rattaché |
| **Cabinet** | le cabinet, pour un client | mandat + saisie du cabinet | selon le client |

## ⚠️ Le cas du dirigeant est le seul qui porte un lien, et c'est là qu'est la valeur

Un salarié qui s'inscrit seul arrive **vide** : le produit ne sait rien de lui. Un dirigeant, lui,
existe **déjà** dans le produit — ses lignes de rémunération sont dans le dossier de sa société,
et les retenues déjà opérées sont connues.

⇒ **Son compte ne crée pas la donnée, il l'ouvre.** C'est le seul des trois où le produit peut
pré-remplir, et c'est ce qui doit décider de l'ordre de livraison.

⛔ **Mais le lien ne s'invente pas.** Rattacher un compte personnel au dossier d'une société est
une **jointure entre deux périmètres d'isolation** (NFR-F06). Elle exige :

1. que le `Redevable` personne physique existe **dans** ce dossier (STORY-563) ;
2. que le cabinet **reconnaisse** le rattachement, ou que le dirigeant le demande et que le cabinet
   l'accepte ;
3. qu'elle soit **révocable des deux côtés**, et que sa révocation ne détruise ni le compte ni les
   déclarations déjà faites.

⚠️ **Ne jamais dériver le lien d'un NIF identique ou d'un nom qui correspond.** Deux personnes
peuvent porter le même nom ; un NIF saisi deux fois peut être une erreur de frappe. Le
rattachement est un **acte**, jamais une déduction.

## Le compte du cabinet « uniquement pour la déclaration »

⚡ **Ce troisième cas n'est pas un problème d'architecture, c'est un problème de catalogue** — et
il est déjà tranché. **STORY-549** a acté, sur arbitrage PO, **deux modules fiscaux distincts**
parce qu'*« ils se vendent différemment : les déclarations sont une obligation, le conseil un
service à valeur ajoutée »*.

⇒ Un cabinet « déclaration seule » est un cabinet dont l'entitlement porte `declarations` **sans**
`bilan`. ⚠️ **Et c'est la garde à écrire** : aujourd'hui la chaîne suppose partout qu'un dossier a
une balance et une liasse. Un cabinet sans module `bilan` doit pouvoir déclarer **sans que la
moitié des écrans se bloquent sur une balance absente**.

## Périmètre

**Inclus**

- Un **type de compte « déclaration »**, ouvrable par les trois portes, dont le périmètre est le
  ou les `Redevable` auxquels il donne accès — jamais un dossier comptable entier.
- **Le rattachement dirigeant ↔ société** comme acte explicite, à double consentement, révocable
  des deux côtés, et **traçable**.
- **La révocation ne détruit rien** : le compte survit, les déclarations passées restent, seul
  l'accès à la matière de l'entreprise cesse. ⚠️ Une révocation qui effacerait des déclarations
  détruirait des preuves fiscales.
- **La garde « pas de balance »** : les obligations d'un redevable personne physique ne dépendent
  d'aucune balance, d'aucune liasse et d'aucun référentiel comptable. Témoin exécutable.
- L'entitlement `declarations` seul ouvre un parcours complet ; l'absence de `bilan` n'est pas une
  erreur mais une configuration.

**Hors périmètre**

- **Le paiement.** Décision PO du même jour : *« on ne fait que la déclaration, la personne même va
  payer après »* — cf. **STORY-565**, révisée en conséquence.
- La collecte des informations du salarié : **STORY-568**.
- Les **associés** (`typeBeneficiaire = ASSOCIE`) : le modèle les accueille, le parcours ne les
  ouvre pas encore.
- Un compte pour un salarié **créé par son employeur**. ⛔ Tentant et à écarter : un employeur qui
  ouvre un compte fiscal au nom de son salarié crée un accès qu'il pourrait lire. La personne
  ouvre son compte, ou personne ne l'ouvre pour elle.

## Critères d'acceptation

1. Les trois portes aboutissent au **même agrégat `Redevable`** — témoin : aucun second modèle,
   aucune table parallèle.
2. Un compte « déclaration » n'ouvre **aucun accès** à la comptabilité, à la balance ou à la liasse
   d'une société, y compris pour un dirigeant rattaché.
3. Le rattachement dirigeant ↔ société exige **deux consentements** ; il est refusé s'il n'y en a
   qu'un, et le refus dit lequel manque.
4. ⛔ **Aucun rattachement automatique** : un NIF identique ou un nom correspondant ne crée jamais
   de lien. Une garde le vérifie.
5. La révocation coupe l'accès **sans supprimer** compte ni déclarations ; les deux parties
   peuvent l'initier ; l'acte est journalisé.
6. Un cabinet doté du seul entitlement `declarations` parcourt une déclaration de bout en bout —
   témoin exécutable **sans aucune balance dans le dossier**.
7. L'isolation reste dérivée du jeton (NFR-F06) : un compte personnel ne peut jamais atteindre un
   redevable d'une autre organisation, même en connaissant son identifiant.
8. Le détail nominatif reste soumis à la restriction de lecture d'AD-21.

## Notes

- ⚡ **Ordre de livraison recommandé : dirigeant, puis cabinet, puis salarié.** Le dirigeant a déjà
  sa donnée dans le produit — c'est le seul des trois qui marche le premier jour. Le cabinet est
  un entitlement. Le salarié arrive vide et dépend entièrement de STORY-568.
- ⚠️ **Le compte du salarié est un autre produit, pas une autre porte.** Acquisition, support,
  volumétrie et économie unitaire n'ont rien à voir avec le B2B cabinet. Le construire est une
  décision de marché autant que de technique — à instruire avant d'ouvrir la porte au public.
- ⛔ **STORY-563 doit être amendée** : son hors-périmètre exclut ce que cette story livre. Une
  fiche qui affirme le contraire de sa voisine encode l'ancienne vérité et la garde active.
