# STORY-462 : Le taux de marge saisi n'est vérifiable contre rien — les ancres ne publient pas la marge brute constatée

Status: ready-for-dev

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 3 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé en cherchant quoi afficher en regard du champ « taux de marge » de l'écran FE-035 — et en ne trouvant rien.

---

## Le fait

Le moteur demande deux taux, `tauxMargePct` et `tauxChargesPct`, tous deux appliqués aux produits. Les
ancres publient `produitsBase`, `chargesBase` et `resultatBase`.

On peut donc contrôler **une seule chose** : que `tauxMarge − tauxCharges` ressemble au ratio constaté
`resultatBase / produitsBase` (**1,22 %** sur le dossier de démonstration). Chacun des deux taux **pris
isolément n'a aucun constaté** auquel se comparer.

Or ce sont les deux nombres que le comptable règle en premier, et la **marge brute** est le repère
central d'un distributeur. Le moteur des états la calcule pourtant : les SIG (`XA` marge commerciale,
`XB` valeur ajoutée…) existent dans `LiasseProduite`. Mais `ancrage.ts` **interdit** de les lire —
invariant P7, à raison : y toucher ferait entrer un code de poste dans le prévisionnel.

Il ne s'agit donc pas de « lire un poste de plus », mais de **publier un agrégat de plus**.

## Critères d'acceptation

- [ ] AC-1 — `AncresProjection` gagne `margeBruteBase: number | null` et `margeBruteAncree: boolean`,
      alimentés par un **marqueur** de paquet référentiel (patron `tresorerie?`), jamais par `sig[]`.
- [ ] AC-2 — L'invariant P7 est **re-testé** : la spec exécutable qui interdit les codes de poste dans
      `projection/` doit rester verte.
- [ ] AC-3 — Un référentiel sans marqueur de marge (SFD-BCEAO) rend `null` **signalé** ; l'écran
      retombe alors sur le seul contrôle `marge − charges`.
- [ ] AC-4 — La réponse publie le **taux** constaté, pas seulement le montant : c'est ce qui se compare
      à la saisie.

## Conséquences ailleurs

- L'écran FE-035 affiche aujourd'hui le contrôle `marge − charges` **et déclare** qu'il est le seul
  possible. Cette story est ce qui lui permettra d'en afficher trois.
