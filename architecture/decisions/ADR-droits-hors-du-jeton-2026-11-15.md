# ADR : les droits de tenant sortent du jeton

Statut : **adoptée** le 2026-11-15, sur la recommandation de la relecture de A (STORY-365). Elle est prise par défaut,
selon la règle de l'utilisateur (« prendre sa recommandation »), et **reste contestable par le PO** jusqu'à sa première
story de mise en œuvre.
Portée : `auth-service`, `platform-catalog-service` (partie A), la garde de chaque module, la coque.
Échéance : **avant février 2027** (relecture de A ; STORY-938).

## Contexte

- Le jeton d'accès porte aujourd'hui les droits de tenant de l'appelant (`perms[]`). STORY-365 l'a borné :
  - **44 droits** au plus ;
  - **3 584 octets** au plus ;
  - un jeton plus large est refusé (`JETON_HORS_BORNE`), jamais tronqué.
- Les manifestes des verticales déclarent **347 droits**. `sinistres` en porte 23 à lui seul, et un DG à plusieurs
  modules dépasserait **60 à 100 droits**. La borne ne tient pas face aux verticales (relecture de A).
- La spine du moteur a déjà déplacé la question :
  - `droitsEffectifs` (droits de l'appelant ∩ modules ouverts) est rendu par la **lecture de l'état publié** (AD-24),
    et la coque ne lit jamais `perms[]` pour afficher (spine de la coque, AD-6) ;
  - il reste à décider **d'où viennent les droits de l'appelant**.

## Décision

1. **Le jeton porte l'identité, pas les droits** : `sub`, `org`, `roles` (le rôle de membre et les rôles de tenant, par
   leur nom), `emailVerified`, et une **version des droits** (`dv`, entier croissant par membre et par organisation). Il
   reste borné par construction : les rôles sont peu nombreux, les droits ne le sont pas.
2. **Les droits se résolvent par une lecture** servie par `auth-service` :
   - la route est `GET /api/v1/moi/droits?organisationId=…` ;
   - elle rend les droits **effectifs** du membre : rôles, surcharges DELTA (STORY-167), rôle par défaut du vertical
     (STORY-902) ;
   - elle rend aussi `dv`, la version des droits.
3. **Les services lisent cette résolution par un cache**, clé (membre, organisation, `dv`) :
   - un jeton qui porte un `dv` plus récent que l'entrée en cache force la relecture ;
   - un changement de rôle, de surcharge ou d'appartenance publie `identity.droits.changed` (membre, organisation,
     `dv`), qui invalide le cache sans attendre le jeton suivant ;
   - le cache garde au plus **60 s** (valeur de configuration), comme la relecture de l'état publié par la coque
     (30 s).
4. **La partie A** compose `droitsEffectifs` avec cette résolution, et non plus avec `perms[]` du jeton : l'état publié
   l'intersecte avec les modules ouverts (AD-24 inchangé). **La coque** ne change pas : elle lit déjà `droitsEffectifs`.
5. **Transition** : `perms[]` reste émis tant qu'un consommateur le lit. On le retire service par service, chacun à
   sa semaine, après un test de double lecture (patron de STORY-937) : décider avec la résolution et comparer à
   `perms[]`. La borne de STORY-365 reste en place jusqu'au retrait.

## Pourquoi

- Une borne relevée ne tient qu'un temps. Les droits croissent avec chaque verticale et chaque module, alors que les
  rôles, eux, restent peu nombreux.
- Un cookie de 4 Ko et des en-têtes bornés par les proxys ne laissent pas de marge ; un jeton refusé coupe tout
  l'utilisateur, alors qu'une résolution lente ne coupe qu'un écran.
- La résolution existe déjà presque. `auth-service` calcule les droits effectifs pour émettre le jeton ; la partie A
  les intersecte pour l'état publié. Il reste à les servir et à les mettre en cache, sans inventer de règle.

## Conséquences

- Une **lecture de plus** par service, amortie par le cache et invalidée par événement. Si `auth-service` est
  injoignable, le cache sert sa dernière valeur jusqu'à son terme, puis **on ferme** (refus nommé), jamais on n'ouvre.
- `identity.droits.changed@1` : un contrat **nouveau**, à poser au registre (AD-27), produit par `auth-service`.
- Le contrôle de STORY-902 « un droit attribué hors borne est refusé à l'attribution » disparaît avec la borne.
  `CONSENTEMENT_RESERVE_AU_DG` (STORY-938) reste vérifié à l'attribution.

## Mise en œuvre (stories à écrire, lot du moteur suivant)

1. `auth-service` : la route `GET /moi/droits`, `dv` dans le jeton, `identity.droits.changed@1`.
2. La partie A : `droitsEffectifs` lus depuis la résolution (double lecture contre `perms[]`).
3. Chaque garde de module qui lit `perms[]` (paiement, notification, fiscal) : la résolution en cache, avec une double
   lecture, à la semaine de son propriétaire.
4. Le retrait de `perms[]` et de la borne de STORY-365, une fois le dernier lecteur passé.
