# -*- coding: utf-8 -*-
# Génère les données du plan comptable (FE-148), le fichier d'exemple Sage et ASSERTE l'aperçu.
import json, os, re, sys
OUT = os.path.dirname(os.path.abspath(__file__))

REFS = [
 ("101","Capital social"),("104","Primes liées au capital social"),("111","Réserve légale"),("118","Autres réserves"),
 ("121","Report à nouveau créditeur"),("129","Report à nouveau débiteur"),("131","Résultat net : bénéfice"),("139","Résultat net : perte"),
 ("161","Emprunts obligataires"),("162","Emprunts auprès des établissements de crédit"),
 ("213","Logiciels"),("231","Bâtiments industriels, agricoles et commerciaux"),("241","Matériel et outillage industriels"),
 ("244","Matériel et mobilier de bureau"),("245","Matériel de transport"),
 ("311","Marchandises A"),("312","Marchandises B"),("321","Matières premières"),
 ("401","Fournisseurs, dettes en compte"),("402","Fournisseurs, effets à payer"),("408","Fournisseurs, factures non parvenues"),("409","Fournisseurs débiteurs"),
 ("411","Clients"),("412","Clients, effets à recevoir"),("416","Clients douteux ou litigieux"),("418","Clients, produits non encore facturés"),("419","Clients créditeurs"),
 ("421","Personnel, avances et acomptes"),("422","Personnel, rémunérations dues"),("431","Sécurité sociale"),("432","Caisses de retraite"),
 ("441","État, impôt sur les bénéfices"),("443","État, TVA facturée"),("445","État, TVA récupérable"),("447","État, impôts retenus à la source"),
 ("471","Débiteurs et créditeurs divers"),("481","Fournisseurs d’investissements"),("491","Dépréciations des comptes clients"),
 ("511","Effets à encaisser"),("512","Effets à l’encaissement"),("513","Chèques à encaisser"),("514","Chèques à l’encaissement"),("515","Cartes bancaires à encaisser"),("518","Autres valeurs à l’encaissement"),
 ("521","Banques locales"),("522","Banques autres États de la région"),("523","Banques autres États de la zone monétaire"),("524","Banques hors zone monétaire"),("525","Banques, dépôts à terme"),("526","Banques, intérêts courus"),
 ("571","Caisse siège social"),("572","Caisse succursale A"),("573","Caisse succursale B"),
 ("601","Achats de marchandises"),("602","Achats de matières premières"),("604","Achats stockés de fournitures consommables"),("605","Autres achats"),("608","Achats d’emballages"),
 ("611","Transports sur achats"),("612","Transports sur ventes"),
 ("621","Sous-traitance générale"),("622","Locations et charges locatives"),("624","Entretien, réparations et maintenance"),("625","Primes d’assurance"),("627","Publicité et relations publiques"),("628","Frais de télécommunications"),
 ("631","Frais bancaires"),("632","Rémunérations d’intermédiaires et de conseils"),("641","Impôts et taxes directs"),
 ("661","Rémunérations directes du personnel national"),("664","Charges sociales"),("671","Intérêts des emprunts"),
 ("701","Ventes de marchandises"),("702","Ventes de produits finis"),("706","Services vendus"),("707","Produits accessoires"),
]
refs = [{"n": n, "l": l} for n, l in REFS]
ROOT = {n: l for n, l in REFS}
assert len(set(ROOT)) == len(REFS)

CAB = {
 "version": 3, "maj": "12/11/2026", "par": "Awa Diallo",
 "historique": [
   {"v": 1, "d": "02/09/2026", "par": "Awa Diallo", "t": "Modèle créé : 6 comptes, 6 journaux."},
   {"v": 2, "d": "29/09/2026", "par": "Awa Diallo", "t": "Ajout de 521300 Ecobank Lomé et de 571100 Caisse principale."},
   {"v": 3, "d": "12/11/2026", "par": "Awa Diallo", "t": "Désactivation de 521900 UTB Lomé (compte clôturé)."},
 ],
 "comptes": [
   {"n": "401LOME", "l": "Fournisseurs Lomé", "a": True},
   {"n": "411KARA", "l": "Clients Kara", "a": True},
   {"n": "411LOME", "l": "Clients Lomé", "a": True},
   {"n": "521100", "l": "BOA Lomé", "a": True},
   {"n": "521200", "l": "Orabank Lomé", "a": True},
   {"n": "521300", "l": "Ecobank Lomé", "a": True},
   {"n": "521900", "l": "UTB Lomé (compte clôturé)", "a": False},
   {"n": "571100", "l": "Caisse principale", "a": True},
   {"n": "601100", "l": "Achats de marchandises locales", "a": True},
   {"n": "661100", "l": "Salaires du personnel", "a": True},
   {"n": "701100", "l": "Ventes de marchandises Lomé", "a": True},
 ],
 "journaux": [
   {"c": "ACH", "l": "Achats", "t": "ACHATS", "cpt": "", "a": True},
   {"c": "BQ1", "l": "Banque BOA Lomé", "t": "TRESORERIE", "cpt": "521100", "a": True},
   {"c": "BQ2", "l": "Banque Orabank Lomé", "t": "TRESORERIE", "cpt": "521200", "a": True},
   {"c": "CAI", "l": "Caisse principale", "t": "TRESORERIE", "cpt": "571100", "a": True},
   {"c": "OD", "l": "Opérations diverses", "t": "OD", "cpt": "", "a": True},
   {"c": "VTE", "l": "Ventes", "t": "VENTES", "cpt": "", "a": True},
 ],
}
CLI = {
 "nom": "Ets Kossi Distribution",
 "comptes": [
   {"n": "411KOSSI", "l": "Clients grands comptes Kara", "a": True},
   {"n": "571300", "l": "Caisse boutique Bè", "a": True},
   {"n": "622300", "l": "Loyer boutique Bè", "a": True},
 ],
 "journaux": [{"c": "CAI2", "l": "Caisse boutique Bè", "t": "TRESORERIE", "cpt": "571300", "a": True}],
 "masques": ["521300"],
 "mouvementes": ["411LOME", "521100", "601100", "661100", "701100", "411KOSSI", "571300"],
}

def racine_de(n):
    best = None
    for r in ROOT:
        if n.startswith(r) and (best is None or len(r) > len(best)): best = r
    return best

def proche(n):
    if not re.match(r"^\d", n): return None
    p3 = int((n + "000")[:3]); best = None; bl = 0; bd = 10**9
    for r in ROOT:
        l = 0
        while l < len(r) and l < len(n) and r[l] == n[l]: l += 1
        d = abs(int(r) - p3)
        if l > bl or (l == bl and d < bd): best, bl, bd = r, l, d
    return (best, bl) if bl > 0 else None

def classer(lignes, exist):
    vus = {}; rows = []
    for x in lignes:
        n = re.sub(r"\s+", "", x["n"]).upper(); l = x["l"].strip()
        r = {"ligne": x["ligne"], "n": n, "l": l, "st": "ok"}
        if not re.match(r"^[0-9][0-9A-Z]*$", n):
            r["st"] = "ko"; r["kind"] = "illisible"
        elif n in ROOT:
            r["st"] = "skip"; r["kind"] = "reference"
        elif n in exist:
            r["st"] = "ko"; r["kind"] = "double"
        elif n in vus:
            r["st"] = "ko"; r["kind"] = "double_fichier"
        else:
            rac = racine_de(n)
            if not rac:
                r["st"] = "ko"; r["kind"] = "racine"
                p = proche(n)
                if p: r["fix"] = p[0] + n[3:]; r["proche"] = p[0]
            elif not l:
                r["st"] = "ko"; r["kind"] = "libelle"; r["fix"] = ROOT[rac] + " " + n; r["racine"] = rac
            else:
                r["racine"] = rac
        if r["st"] != "skip": vus[n] = x["ligne"]
        rows.append(r)
    return rows

HEAD = "Numéro de compte;Intitulé du compte;Type;Collectif"
SAMPLE = [
 ("401","Fournisseurs","Général",""),("411","Clients","Général",""),("521","Banques locales","Général",""),
 ("521100","BOA Lomé","Général",""),
 ("521400","Coris Bank Lomé","Général",""),("521500","UTB Kara","Général",""),("521600","","Général",""),
 ("516000","Terminal de paiement (TPE)","Général",""),
 ("571200","Caisse Kara","Général",""),
 ("411ACCR","Clients Accra","Tiers","411"),("411SOKO","Clients Sokodé","Tiers","411"),
 ("401KARA","Fournisseurs Kara","Tiers","401"),("401IMPT","Fournisseurs import Chine","Tiers","401"),
 ("443100","TVA facturée sur ventes","Général",""),("445100","TVA récupérable sur achats","Général",""),
 ("605100","Fournitures de bureau","Général",""),("622100","Loyer entrepôt Lomé","Général",""),
 ("628100","Téléphone et internet","Général",""),("631100","Frais bancaires BOA","Général",""),
 ("661200","Primes et gratifications","Général",""),("706100","Prestations de transport","Général",""),
]
csv = "\r\n".join([HEAD] + [";".join(r) for r in SAMPLE]) + "\r\n"
lignes = [{"ligne": i + 2, "n": r[0], "l": r[1]} for i, r in enumerate(SAMPLE)]

exist_cab = {c["n"]: c["l"] for c in CAB["comptes"]}
exist_cli = dict(exist_cab); exist_cli.update({c["n"]: c["l"] for c in CLI["comptes"]})

def resume(rows):
    c = {"lues": len(rows), "ok": 0, "ko": 0, "skip": 0}
    for r in rows: c[r["st"]] += 1
    return c

rc = classer(lignes, exist_cab); rk = classer(lignes, exist_cli)
res_cab = resume(rc); res_cli = resume(rk)
# attendus (écrits À LA MAIN, indépendamment du code)
assert len(SAMPLE) == 21
assert res_cab == {"lues": 21, "ok": 15, "ko": 3, "skip": 3}, res_cab
assert res_cli == res_cab, res_cli
byk = {r["kind"]: r for r in rc if r["st"] == "ko"}
assert set(byk) == {"double", "libelle", "racine"}, set(byk)
assert byk["double"]["n"] == "521100"
assert byk["racine"]["n"] == "516000" and byk["racine"]["proche"] == "515" and byk["racine"]["fix"] == "515000"
assert byk["libelle"]["n"] == "521600" and byk["libelle"]["fix"] == "Banques locales 521600"
assert [r["n"] for r in rc if r["st"] == "skip"] == ["401", "411", "521"]
assert all(r["racine"] for r in rc if r["st"] == "ok")
for r in rc:
    if r["st"] == "ok": assert r["n"].startswith(r["racine"]) and r["n"] != r["racine"]
apres = 15 + 2
assert apres == 17
for c in CAB["comptes"] + CLI["comptes"]:
    assert racine_de(c["n"]) and c["n"] not in ROOT, c
for j in CAB["journaux"] + CLI["journaux"]:
    if j["cpt"]: assert j["cpt"] in exist_cli
assert all(m in exist_cab for m in CLI["masques"])
assert not (set(exist_cab) & {c["n"] for c in CLI["comptes"]})
assert "411KARA" in exist_cab
assert not any(c["n"] == "521600" or c["n"] == "515000" for c in CAB["comptes"])

actifs = [c for c in CAB["comptes"] if c["a"]]
herites = [c for c in actifs if c["n"] not in CLI["masques"]]
EXPECT = {
  "refs": len(refs), "cab_comptes": len(CAB["comptes"]), "cab_actifs": len(actifs), "cab_inactifs": len(CAB["comptes"]) - len(actifs),
  "cab_journaux": len(CAB["journaux"]), "cab_version": CAB["version"],
  "cli_herites": len(herites), "cli_propres": len(CLI["comptes"]), "cli_masques": len(CLI["masques"]),
  "cli_ajouts": len(herites) + len(CLI["comptes"]) + len(CLI["masques"]),
  "cli_journaux_herites": len([j for j in CAB["journaux"] if j["a"]]), "cli_journaux_propres": len(CLI["journaux"]),
  "import": res_cab, "import_apres": {"enregistres": apres, "version": CAB["version"] + 1, "cab_total": len(CAB["comptes"]) + apres},
}
data = {"refs": refs, "cab": CAB, "cli": CLI, "sample": csv, "sampleNom": "export-sage-plan-comptable-cabinet-diallo.csv"}
open(os.path.join(OUT, "planData.json"), "wb").write(json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode("utf-8"))
open(os.path.join(OUT, "expect.json"), "wb").write(json.dumps(EXPECT, ensure_ascii=False, indent=1).encode("utf-8"))
open(os.path.join(OUT, "export-sage-plan-comptable-cabinet-diallo.csv"), "wb").write(b"\xef\xbb\xbf" + csv.encode("utf-8"))
print(json.dumps(EXPECT, ensure_ascii=False))
