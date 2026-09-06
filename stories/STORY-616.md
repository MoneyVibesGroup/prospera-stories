# STORY-616 : La santé des canaux, par organisation

Status: done

**Épic :** EPIC-054 — Permissions au catalogue et cloisonnement des passerelles
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S44
**Prérequis :** **STORY-604** (résolution à la remise), **STORY-614** (vérification avant activation)
**Origine :** revue d'architecture du 2026-09-06 · rail B, bloc B1 · FR-N54, FR-N55, AD-6.

---

## Le récit

En tant qu'**organisation cliente**, je veux voir l'état de **mes** canaux, afin de savoir que mes
messages ne partent plus avant qu'un client ne me le dise.

## Le fait

⚡ **La santé s'observe et se publie, elle ne décide de rien** (leçon `paiement-service` STORY-249).
Aucun envoi ne consulte cet état pour choisir un canal : un routage qui lirait la santé se mettrait à
dépendre d'une observation périmée, et fermerait un canal parfaitement vivant sur la foi d'un
incident d'hier.

⛔ **`/health` reste une question de PLATEFORME, et le reste.** Elle est publique : un appel sortant
déclenché depuis là, avec la clé d'un client, serait déclenchable par n'importe qui. La santé par
organisation vit sur une route **authentifiée et cloisonnée** — et STORY-604 a déjà rendu l'autre
inexprimable.

⚡ **Elle PUBLIE ce que la dernière vérification a constaté, elle ne redemande rien.** Une page qui
interrogerait les cinq passerelles à chaque affichage coûterait cinq conversations SMTP par visite,
et donnerait à n'importe quel membre d'une organisation un moyen de marteler son propre relais.
STORY-614 a déjà posé le constat ; cette story le rend lisible.

⚠️ **Un constat n'est utile que s'il peut être REFAIT.** Aujourd'hui la vérification n'a qu'un seul
déclencheur — l'enregistrement — et l'état resterait donc figé au jour de la saisie. Une clé qui
expire trois mois plus tard ne se verrait nulle part.

## Critères d'acceptation

- [x] AC-1 — Une route **authentifiée** rend l'état des canaux **de l'organisation du jeton**.
- [x] AC-2 — ⛔ `/health` ne change pas et n'utilise aucun secret d'organisation. La santé par
      organisation ne peut **pas** déclencher d'appel sortant — par absence d'injection, pas par
      discipline.
- [x] AC-3 — L'état distingue *non configuré*, *configuré et sain*, *configuré et refusé*.
- [x] AC-4 — Aucun motif ne porte le texte rendu par la passerelle.
- [x] AC-5 — La vérification est **rejouable** sur demande, pour que l'état puisse changer.

## Notes

⚠️ **Aucun appelant hors de ce module ne lit cet état.** Une garde de présence le vérifie : c'est ce
qui rend vraie la phrase *« elle ne décide de rien »*.

---

## Journal de livraison (2026-09-06) — branche `MNV-616`

**Livré :** 2 447 tests unitaires (196 suites), e2e complet, lint et build au vert.
🏁 **Bloc B1 du rail B complet** — STORY-604, 605, 614, 615, 616.

### ⛔⛔ AC-2 ne tient pas par une garde : il tient par une ABSENCE D'INJECTION

`SanteCanauxService` ne reçoit **que** le modèle des configurations. Ni le registre des canaux,
ni le port de résolution, ni le port DNS. La question *« et si on interrogeait la passerelle pour
être sûr ? »* n'a **aucun endroit où se poser** — c'est le patron de STORY-597, repris tel quel,
et il vaut mieux que n'importe quelle garde de balayage.

⚡ Le coût évité est concret : une page qui affiche cinq canaux aurait déclenché **cinq
conversations SMTP par visite**, et donné à n'importe quel membre d'une organisation un moyen de
marteler son propre relais. `/health` était protégée depuis STORY-604 ; une route authentifiée
qui compose est un amplificateur plus discret, pas moins réel.

### ⚡ La santé PUBLIE ce que STORY-614 a constaté — et c'est ce qui l'a rendue faisable en 3 points

Les trois situations d'AC-3 se lisent directement dans le verdict déjà stocké : *pas de ligne* ⇒
`NON_CONFIGURE`, `VERIFIEE` ⇒ `SAIN`, `REFUSEE` ⇒ `REFUSE`. Il n'y avait rien à observer de neuf,
seulement à rendre lisible. ⚡ *Quand une story précédente a écrit le fait, la suivante n'a plus
qu'à le nommer.*

### ⚡ Cinq états, pas trois — et le critère est le GESTE, pas la nuance

`DESACTIVE` et `A_VERIFIER` se sont ajoutés parce qu'ils appellent des gestes que les trois
autres n'appellent pas : réactiver, et rejouer la vérification. ⛔ **Le canal désactivé gagne sur
tout le reste** : afficher `SAIN` sur une passerelle coupée mais vérifiée serait exactement le
mensonge que la story existe pour éviter — le client verrait « tout va bien » sur un canal qui
n'envoie rien.

⚠️ Et **`NON_VERIFIABLE` compte pour SAIN** : la cloche in-app n'a aucune passerelle à
interroger, et la ranger sous *à vérifier* enverrait le client chercher un problème inexistant,
indéfiniment. C'est la suite directe de la distinction d'AC-4 de STORY-614.

### ⚠️ AC-5 s'est imposé en cours de route : un constat figé ne dit rien

La fiche d'origine n'avait que quatre critères. En écrivant l'état, il est devenu évident que la
vérification n'avait qu'un **seul déclencheur** — l'enregistrement : l'état serait resté figé au
jour de la saisie, et une clé qui expire trois mois plus tard ne se serait vue nulle part.
`POST /passerelles/:canal/verification` rend le constat rejouable, et l'AC a été ajouté à la
fiche avant d'être satisfait.

⛔ **Un verdict défavorable CONSTATE, il ne désactive pas.** Le constat est un fait ; la
désactivation est une décision, et elle appartient à l'organisation. Couper automatiquement
fermerait une passerelle sur un incident passager — et ne changerait rien à ce qui se passe déjà
à la remise, où le refus est nommé depuis STORY-605. Même règle qu'en STORY-615 : *un échec ne
retire pas un acquis, il se raconte.*

### ⚠️ Les CINQ canaux sont rendus, toujours

Ne rendre que les canaux configurés ferait lire « rien à signaler » là où la vraie réponse est
« vous n'avez rien configuré ». C'est la distinction que STORY-598 avait déjà payée entre *rien à
proposer* et *on ne sait pas encore*.

### ⛔ Un double de collection doit honorer les DEUX chaînes d'appel — cinquième occurrence

Le double de `configurations_passerelles` dans l'e2e ne connaissait que `find().sort().lean()` ;
la santé appelle `find().lean()`. Résultat : `500`, sur un service parfaitement juste. ⚡ *Un
double qui ne connaît qu'une chaîne teste la chaîne qu'il connaît* — et il faut lire le code
appelant, pas le double, pour comprendre pourquoi il rougit.

### ⛔ Le piège de l'ordre des routes, troisième fois

`/passerelles/sante`, après `/passerelles/politique` (605) et `/passerelles/domaines` (615), sur
le même contrôleur, dans la même session. Trois fois la même faute possible, trois tests e2e.
⚡ **Un contrôleur qui porte une route paramétrée à la racine transforme chaque ajout littéral en
occasion de se tromper** — le vrai remède serait un préfixe distinct, à trancher si une quatrième
arrive.

### Ce que la story ne fait pas

- ⚠️ **Aucune re-vérification périodique** : le constat ne se rafraîchit que sur demande. Une
  tâche planifiée serait une story à part, et elle poserait la question de la fréquence — donc du
  nombre d'authentifications qu'on inflige aux relais de nos clients.
- ⚠️ **Aucune alerte** : l'état se lit, il ne se pousse pas. Le canal qui préviendrait
  l'organisation serait… ce service lui-même, ce qui demande de décider quoi faire quand c'est
  précisément lui qui est en cause.
- ⚠️ **La console de l'exploitant ne montre pas cet état par organisation** : elle compte les
  identités d'envoi (STORY-605), elle ne liste pas les clients en panne. La borne de STORY-597
  tient toujours.
