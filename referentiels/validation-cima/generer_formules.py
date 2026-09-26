#!/usr/bin/env python3
"""Écrit en clair la structure proposée par `cima-assurances@5.0` (STORY-540, AC-1).

`formules-en-clair.md` est DÉRIVÉ de l'artefact, jamais écrit à la main (D-540-3) : un dossier
qui recopierait les formules ferait signer à l'expert une transcription, pas ce que le produit
calcule. C'est la leçon de STORY-519 — une déclaration de plus ne mesure le comportement que si
elle en est dérivée.

    python3 generer_formules.py              # régénère formules-en-clair.md
    python3 generer_formules.py --verifier   # code 1 si le document ou la copie a divergé

Bibliothèque standard seulement.
"""

import hashlib
import json
import sys
from pathlib import Path

ICI = Path(__file__).resolve().parent
ARTEFACT = ICI / "cima-assurances-5.0.json"
SORTIE = ICI / "formules-en-clair.md"

# ⛔ Épinglée ICI, hors de l'artefact : c'est l'empreinte que l'expert examine et signe (D-540-1).
# Elle vaut celle que les trois manifestes de service (`referentiel-registry.ts` de bilan-service,
# balance-service et assurance-service) opposent à l'octet réel au chargement. Une copie qui
# dériverait ferait valider un contenu que le produit ne sert pas : on refuse de générer.
EMPREINTE_ATTENDUE = "5234764a311cf472bef7f1fd3e8ae1066f6a7c3d8d8cf6849948be92b72c0859"

# L'ordre de lecture d'une liasse ; un état inconnu de cette liste est rendu à la suite, jamais omis.
ORDRE_ETATS = [
    ("BILAN_ACTIF", "Bilan — actif"),
    ("BILAN_PASSIF", "Bilan — passif"),
    ("BILAN", "Bilan — totaux"),
    ("COMPTE_RESULTAT", "Compte de résultat — présentation propre au produit, hors modèles de l'art. 433"),
    ("COMPTE_80_VIE_CAPITALISATION", "Compte 80 — Vie / Capitalisation (modèle de l'art. 433)"),
    ("COMPTE_80_TOUTE_NATURE", "Compte 80 — Assurances de toute nature (modèle de l'art. 433)"),
    ("COMPTE_87_PERTES_ET_PROFITS", "Compte 87 — Compte général de pertes et profits (modèle de l'art. 433)"),
]

SOURCES = {"BILAN_ACTIF": "bilan actif", "BILAN_PASSIF": "bilan passif"}

MOINS = "−"


def lire_artefact():
    octets = ARTEFACT.read_bytes()
    empreinte = hashlib.sha256(octets).hexdigest()
    if empreinte != EMPREINTE_ATTENDUE:
        raise SystemExit(
            f"⛔ {ARTEFACT.name} : sha256 {empreinte}, attendu {EMPREINTE_ATTENDUE}. "
            "La copie versée au dossier n'est plus l'artefact servi — refus de générer."
        )
    return json.loads(octets), empreinte


def signe(s):
    return "+" if s == "+" else MOINS


def generer(artefact, empreinte):
    meta = artefact["meta"]
    plan = {c["numero"]: c for c in artefact["planDeComptes"]}
    postes = artefact["postes"]
    lignes = artefact["tableDePassage"]
    detail = [l for l in lignes if l["regle"] != "FORMULE"]
    par_poste = {l["poste"]: l for l in lignes}
    libelle_poste = {p["code"]: p["libelle"] for p in postes}

    def compte_en_clair(numero):
        c = plan.get(numero)
        return f"`{numero}` {c['libelle']}" if c else f"`{numero}` ⚠️ absent du plan packagé"

    def developper(code, sens, variation, chemin):
        """Formule développée jusqu'aux comptes : (signe, comptes | None, variation ?, chemin)."""
        ligne = par_poste.get(code)
        chemin = chemin + [code]
        if ligne is None:
            return [(sens, None, variation, chemin)]
        if ligne["regle"] != "FORMULE":
            return [(sens, ligne["comptesSyscohada"], variation, chemin)]
        termes = []
        for op in ligne["operandes"]:
            s = sens if op["signe"] == "+" else ("-" if sens == "+" else "+")
            v = variation or op.get("mode") == "VARIATION"
            termes += developper(op["poste"], s, v, chemin)
        return termes

    presents = dict.fromkeys(x["etat"] for x in postes + lignes)
    etats = [(e, t) for e, t in ORDRE_ETATS if e in presents]
    etats += [(e, e) for e in presents if e not in dict(ORDRE_ETATS)]

    o = []
    w = o.append
    w(f"# `{meta['code']}@{meta['version']}` — la structure proposée, écrite en clair")
    w("")
    w("> ⚙️ **Fichier GÉNÉRÉ** par [`generer_formules.py`](generer_formules.py) depuis")
    w(f"> [`{ARTEFACT.name}`]({ARTEFACT.name}) — ne pas l'éditer à la main.")
    w("> `python3 generer_formules.py --verifier` échoue dès que ce document ou la copie de")
    w("> l'artefact diverge de ce que le produit sert.")
    w("")
    w("## Identité de l'artefact soumis")
    w("")
    w("| Champ | Valeur |")
    w("|---|---|")
    w(f"| Code et version | `{meta['code']}@{meta['version']}` |")
    w(f"| Empreinte sha256 | `{empreinte}` |")
    w(f"| Date de l'artefact | {meta['date']} |")
    w(f"| Statut déclaré | `{meta['statut']}` |")
    w(f"| Zone et pays | {meta['zoneComptable']} — {', '.join(meta['pays'])} |")
    w(f"| Postes | {len(postes)} |")
    w(f"| Lignes de table de passage | {len(lignes)}, dont {len(lignes) - len(detail)} formules |")
    w(f"| Comptes au plan packagé | {len(plan)} |")
    w("")
    w("**Norme source, telle que l'artefact la déclare :**")
    w("")
    w(f"> {meta['normeSource']}")
    w("")
    w("**Mise en garde, telle que l'artefact la publie :**")
    w("")
    w(f"> {meta.get('miseEnGarde', '— aucune —')}")
    w("")
    w("## Les règles de passage, telles que l'artefact les nomme")
    w("")
    w("| Règle | Libellé dans l'artefact |")
    w("|---|---|")
    for regle, texte in artefact["regles"].items():
        w(f"| `{regle}` | {texte} |")
    w("")
    w("Une opérande marquée **Δ** est une **variation** : la valeur du poste à l'arrêté N moins sa")
    w("valeur à l'arrêté N-1. Elle se lit sur un poste de **bilan**, jamais sur un compte de gestion.")
    w("Le calcul exact de chaque règle, et ses limites, sont décrits dans [`README.md`](README.md).")
    w("")

    for numero, (etat, intitule) in enumerate(etats, start=1):
        w(f"## {numero}. {intitule} — `{etat}`")
        w("")
        details = [l for l in detail if l["etat"] == etat]
        formules = [l for l in lignes if l["etat"] == etat and l["regle"] == "FORMULE"]
        sans_ligne = [p for p in postes if p["etat"] == etat and p["code"] not in par_poste]
        if details:
            w("| Poste | Libellé | Règle | Comptes rattachés |")
            w("|---|---|---|---|")
            for l in details:
                comptes = " · ".join(compte_en_clair(c) for c in l["comptesSyscohada"])
                role = f" *(rôle : `{l['role']}`)*" if l.get("role") else ""
                w(f"| **{l['poste']}** | {l['libelle']}{role} | `{l['regle']}` | {comptes} |")
            w("")
        for l in formules:
            role = f" — rôle `{l['role']}`" if l.get("role") else ""
            w(f"### {l['poste']} — {l['libelle']}{role}")
            w("")
            membres = " ".join(
                f"{signe(op['signe'])} {'Δ ' if op.get('mode') == 'VARIATION' else ''}{op['poste']}"
                for op in l["operandes"]
            )
            w(f"**{l['poste']} = {membres.removeprefix('+ ')}**")
            w("")
            w("| Signe | Opérande | Libellé | Lu sur |")
            w("|:---:|---|---|---|")
            for op in l["operandes"]:
                delta = "Δ " if op.get("mode") == "VARIATION" else ""
                lu = SOURCES.get(op.get("etatSource"), op.get("etatSource") or "—")
                if op.get("mode") == "VARIATION":
                    lu += ", variation N − N-1"
                w(
                    f"| {signe(op['signe'])} | {delta}`{op['poste']}` | "
                    f"{libelle_poste.get(op['poste'], '⚠️ poste inconnu')} | {lu} |"
                )
            w("")
            w("Développée jusqu'aux comptes :")
            w("")
            w("| Signe | Comptes | Chemin |")
            w("|:---:|---|---|")
            for sens, comptes, variation, chemin in developper(l["poste"], "+", False, []):
                s = signe(sens)
                via = " › ".join(f"`{c}`" for c in chemin[1:])
                if comptes is None:
                    w(f"| {s} | ⚠️ poste sans ligne de table de passage | {via} |")
                    continue
                liste = ", ".join(f"`{c}`" for c in comptes)
                w(f"| {s} | {'Δ (' + liste + ')' if variation else liste} | {via} |")
            w("")
        if sans_ligne:
            w("⛔ **Postes publiés SANS aucune ligne de table de passage** — aucun compte ne les")
            w("alimente : l'état les sert vides, avec le statut `A_COMPLETER`.")
            w("")
            w("| Poste | Libellé |")
            w("|---|---|")
            for p in sans_ligne:
                w(f"| **{p['code']}** | {p['libelle']} |")
            w("")

    # Index inverse, à la manière du moteur : un compte est capté par le PLUS LONG préfixe que
    # cite la table — tous états confondus — et reçoit toutes les lignes qui portent ce préfixe.
    prefixes = {}
    for l in detail:
        for p in l["comptesSyscohada"]:
            prefixes.setdefault(p, []).append(l["poste"])
    w(f"## {len(etats) + 1}. Le plan packagé, et ce que chaque compte alimente")
    w("")
    w("Chaque compte du plan est capté, comme dans le moteur, par le **plus long préfixe** que cite")
    w("la table de passage, tous états confondus, et reçoit toutes les lignes qui portent ce préfixe.")
    w("Les postes se lisent par leur préfixe : `CA`/`CP` bilan, `RC`/`RP` compte de résultat,")
    w("`EV` compte 80 Vie, `EN` compte 80 toute nature. Un compte marqué ⛔ n'alimente **aucun** poste.")
    w("")
    w("| Compte | Libellé (tel que packagé) | Classe | Nature | Postes alimentés |")
    w("|---|---|:---:|---|---|")
    orphelins = []
    for numero, c in plan.items():
        captant = max(
            (p for p in prefixes if numero.startswith(p)), key=len, default=None
        )
        nature = f"`{c['nature']}`" if c.get("nature") else ""
        if captant is None:
            orphelins.append(numero)
            cible = "⛔ **aucun**"
        else:
            cible = ", ".join(f"`{p}`" for p in prefixes[captant])
        w(f"| `{numero}` | {c['libelle']} | {c['classe']} | {nature} | {cible} |")
    w("")
    w(f"**{len(orphelins)} comptes du plan n'alimentent aucun poste** : "
      + ", ".join(f"`{n}`" for n in orphelins) + ".")
    w("")
    w(f"## {len(etats) + 2}. Racines de gestion — le périmètre du résultat comptable")
    w("")
    w("`racinesDeGestion` = " + ", ".join(f"`{r}`" for r in artefact["racinesDeGestion"]) + ".")
    w("")
    regroupement = [n for n, c in plan.items() if c.get("nature") == "REGROUPEMENT"]
    w("Comptes marqués `REGROUPEMENT`, qu'aucune racine ne capte : "
      + ", ".join(f"`{n}` {plan[n]['libelle']}" for n in regroupement) + ".")
    w("")
    return "\n".join(o)


def main():
    artefact, empreinte = lire_artefact()
    contenu = generer(artefact, empreinte)
    if "--verifier" in sys.argv[1:]:
        actuel = SORTIE.read_text(encoding="utf-8") if SORTIE.exists() else ""
        if actuel != contenu:
            print(f"⛔ {SORTIE.name} ne correspond plus à {ARTEFACT.name} — régénérer.")
            return 1
        print(f"✅ {SORTIE.name} correspond à {ARTEFACT.name} (sha256 {empreinte[:8]}…).")
        return 0
    SORTIE.write_text(contenu, encoding="utf-8")
    print(f"{SORTIE.name} écrit ({len(contenu.splitlines())} lignes).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
