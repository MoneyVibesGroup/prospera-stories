# STORY-522 : La classe 8 CIMA se lit par liste explicite, jamais par racine — la base imposable exactement doublée

Status: ready-for-dev

**Épic :** EPIC-133 — Comptes de résultat technique Vie / Non-Vie et compte non technique
**Service :** `assurance-service` + `balance-service` (`modules/fiscal`) + référentiel
**Points :** 8 · **Sprint :** S20
**Origine :** revue de l'artefact, 2026-08-27 — **AD-9** de la spine ; consolide la garde de STORY-488 AC-5.

---

## Le fait, mesuré dans l'artefact

```
racinesDeGestion: ['6', '7', '80', '82', '83', '84', '85', '86']
```

La **classe 8 du plan CIMA mêle des comptes de gestion et des comptes de REGROUPEMENT**. Un compte
de regroupement reprend, par construction, des montants déjà portés par les comptes qu'il regroupe.

⇒ Un repli générique qui balaie ces racines **compte deux fois les mêmes montants**. Le repli a déjà
été **mesuré** sur ce référentiel : la base imposable ressortait **exactement doublée**, et **aucun
contrôle ne s'en apercevait** — le calcul était juste, sa source ne l'était pas.

⚡ **C'est le meilleur avertissement de tout ce vertical, et il se généralise :** sur un référentiel
sectoriel, **un traitement générique qui « marche » est le mode de panne le plus probable**, pas le
rassurant. Rien ne refuse, rien ne déséquilibre, et le nombre est faux d'un facteur deux.

## Critères d'acceptation

- [ ] AC-1 — Toute lecture de la classe 8 passe par une **liste explicite de comptes**, jamais par
      une racine. `racinesDeGestion` cesse de porter des racines de classe 8 en bloc.
- [ ] AC-2 — Les comptes de **regroupement** sont **identifiés et marqués** dans le plan packagé,
      depuis l'article 431 — pas déduits de leur numéro.
- [ ] AC-3 — ⛔ **Test de régression permanent, et c'est LE test :** un jeu de balance CIMA où la
      classe 8 est renseignée doit produire une base imposable **simple**. Remettre la racine `80`
      dans `racinesDeGestion` doit faire **doubler le résultat et virer le test au rouge** — sinon
      la garde ne garde rien.
- [ ] AC-4 — La même vérification est faite pour **les trois autres référentiels** : le repli
      générique est **partagé**, et le défaut est un défaut de repli, pas de CIMA. Le trouver
      ailleurs serait le résultat le plus utile de la story.
- [ ] AC-5 — Le repli, quand il ne sait pas décider, **refuse plutôt que de deviner** et nomme le
      compte en cause. Une base imposable calculée sur une source douteuse est pire qu'une erreur
      déclarée.

## Notes

- Consolide [[STORY-488]] AC-5, qui posait la garde ; celle-ci la rend explicite et la généralise.
- Voir spine AD-9, `analyse-referentiels-sfd-zonefranche-cima-2026-07-21.md` §3.
