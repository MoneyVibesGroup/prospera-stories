# -*- coding: utf-8 -*-
"""Donnees chiffrees de la maquette FE-141 (analyse financiere), lot 6.

Ce script ne dessine rien. Il LIT la liasse du prototype (Bilan et compte de resultat de l'exercice 2025, comparatif
2024), calcule les 19 indicateurs par une transcription des regles pures de bilan-service
(src/modules/bilan/analyse/analyse.regles.ts, STORY-552), ASSERTE les valeurs, et produit le bloc JSON que le
prototype embarque (#anaData). Le JS du prototype ne connait aucun montant et ne recalcule rien.

Les indicateurs de dette (STORY-1084) ne sont pas recalcules : ils sont LUS dans le bloc deja valide du dossier de
financement du prototype et assertes contre les valeurs de reference.

Usage : python generer-donnees-lot6.py <prototype.html> [<sortie.json>]
"""
import json, re, sys
from fractions import Fraction


def nombre(s):
    for a in ('&minus;', '−', '&nbsp;', ' ', ' ', ' '):
        s = s.replace(a, '-' if a in ('&minus;', '−') else '')
    return int(s)


def ligne(seg, code):
    """Cellules du premier <tr> de `seg` dont la premiere cellule vaut `code`."""
    for tr in re.findall(r'<tr[^>]*>(.*?)</tr>', seg, re.S):
        cells = [re.sub(r'<[^>]+>', '', c).strip() for c in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', tr, re.S)]
        # les lignes de produits du compte de resultat portent une lettre en exposant (TA + « A »)
        if cells and (cells[0] == code or (code[0] == 'T' and cells[0] == code + code[1])):
            return cells
    raise AssertionError('poste %s introuvable dans le prototype' % code)


def lire_liasse(html):
    i = html.index('data-bil-panel="etats"')
    seg = html[i:i + 400000]
    L = {}
    for code in ('AZ', 'BB', 'BI', 'BK', 'BT', 'BZ'):                 # actif : Net N, Net N-1
        c = ligne(seg, code); L[code] = (nombre(c[-2]), nombre(c[-1]))
    for code in ('CA', 'CH', 'CJ', 'CL', 'CP', 'DA', 'DB', 'DD', 'DJ', 'DP', 'DT', 'DZ'):  # passif : N, N-1
        c = ligne(seg, code); L[code] = (nombre(c[-2]), nombre(c[-1]))
    for code in ('TA', 'RA', 'RB', 'XA', 'XB', 'XC', 'XD', 'XI'):      # compte de resultat : N, N-1, ecart
        c = ligne(seg, code); L[code] = (nombre(c[-3]), nombre(c[-2]))
    return L


def arrondi(num, den, facteur=1):
    """num * facteur / den a deux decimales, demi-unite eloignee de zero (rapportArrondi du service)."""
    n = Fraction(num) * facteur * 100
    d = Fraction(den)
    q = (2 * abs(n) + d) // (2 * d)
    return (1 if n >= 0 else -1) * int(q) / 100


def masses(L, k):
    g = lambda c: L[c][k]
    return dict(
        ACTIF_IMMOBILISE=g('AZ'), ACTIF_CIRCULANT=g('BK'), TRESO_ACTIF=g('BT'),
        # balance avant cloture : le resultat est porte par le compte de resultat, pas par CJ
        CP_MASSE=g('CA') + g('CH') + g('CL'), RESULTAT=g('XI'),
        DETTES_FIN=g('DA') + g('DB'), DETTES_FIN_ASSIM=g('DD'), PASSIF_CIRCULANT=g('DP'), TRESO_PASSIF=g('DT'),
        STOCKS=g('BB'), CLIENTS=g('BI'), FOURNISSEURS=g('DJ'),
        VENTES_MARCH=g('TA'), MARGE=g('XA'), CA=g('XB'), VA=g('XC'), EBE=g('XD'),
        ACHATS=abs(g('RA')),            # charge lue en positif
        VARIATION=-g('RB'))             # RB au credit (+) = stock en hausse = charge negative


CODES = ['POIDS_CAPITAUX_PROPRES', 'ENDETTEMENT', 'CAPACITE_REMBOURSEMENT', 'LIQUIDITE_GENERALE', 'LIQUIDITE_REDUITE',
         'LIQUIDITE_IMMEDIATE', 'TAUX_MARGE_COMMERCIALE', 'TAUX_VALEUR_AJOUTEE', 'TAUX_EBE', 'MARGE_NETTE', 'ROE', 'ROA',
         'BFR', 'FRNG', 'TRESORERIE_NETTE', 'DIO', 'DSO', 'DPO', 'CYCLE_EXPLOITATION']


def indicateurs_colonne(M, jours=360):
    cp = M['CP_MASSE'] + M['RESULTAT']
    tot_a = M['ACTIF_IMMOBILISE'] + M['ACTIF_CIRCULANT'] + M['TRESO_ACTIF']
    tot_p = cp + M['DETTES_FIN_ASSIM'] + M['PASSIF_CIRCULANT'] + M['TRESO_PASSIF']
    assert tot_a == tot_p, ('bilan non equilibre', tot_a, tot_p)
    ct = M['PASSIF_CIRCULANT'] + M['TRESO_PASSIF']
    cons = M['ACHATS'] + M['VARIATION']
    R = {}

    def rap(code, num, den, facteur=1):
        R[code] = dict(n=num, d=den, v=arrondi(num, den, facteur) if den > 0 else None)
    rap('POIDS_CAPITAUX_PROPRES', cp, tot_p, 100)
    rap('ENDETTEMENT', M['DETTES_FIN'], cp)
    rap('CAPACITE_REMBOURSEMENT', M['DETTES_FIN'], M['EBE'])
    rap('LIQUIDITE_GENERALE', M['ACTIF_CIRCULANT'] + M['TRESO_ACTIF'], ct)
    rap('LIQUIDITE_REDUITE', M['ACTIF_CIRCULANT'] - M['STOCKS'] + M['TRESO_ACTIF'], ct)
    rap('LIQUIDITE_IMMEDIATE', M['TRESO_ACTIF'], ct)
    rap('TAUX_MARGE_COMMERCIALE', M['MARGE'], M['VENTES_MARCH'], 100)
    rap('TAUX_VALEUR_AJOUTEE', M['VA'], M['CA'], 100)
    rap('TAUX_EBE', M['EBE'], M['CA'], 100)
    rap('MARGE_NETTE', M['RESULTAT'], M['CA'], 100)
    rap('ROE', M['RESULTAT'], cp, 100)
    rap('ROA', M['RESULTAT'], tot_a, 100)
    for code, val in (('BFR', M['ACTIF_CIRCULANT'] - M['PASSIF_CIRCULANT']),
                      ('FRNG', cp + M['DETTES_FIN_ASSIM'] - M['ACTIF_IMMOBILISE']),
                      ('TRESORERIE_NETTE', M['TRESO_ACTIF'] - M['TRESO_PASSIF'])):
        R[code] = dict(n=val, d=None, v=val)
    rap('DIO', M['STOCKS'], cons, jours)
    rap('DSO', M['CLIENTS'], M['CA'], jours)
    rap('DPO', M['FOURNISSEURS'], M['ACHATS'], jours)
    R['CYCLE_EXPLOITATION'] = dict(n=None, d=None, v=round(R['DIO']['v'] + R['DSO']['v'] - R['DPO']['v'], 2))
    assert R['BFR']['v'] + R['TRESORERIE_NETTE']['v'] == R['FRNG']['v'], 'identite BFR + tresorerie nette = FRNG'
    return R, dict(cp=cp, tot_a=tot_a, tot_p=tot_p, ct=ct, cons=cons)


# (famille, unite, libelle, formule) : recopies de DEFINITIONS_INDICATEURS (analyse.regles.ts)
DEF = {
    'POIDS_CAPITAUX_PROPRES': ('STRUCTURE', 'POURCENTAGE', 'Poids des capitaux propres dans le total du passif', 'capitaux propres (résultat de l’exercice compris) / total du passif × 100. Distinct de l’« autonomie financière » du prévisionnel (capitaux propres / ressources stables).'),
    'ENDETTEMENT': ('STRUCTURE', 'RATIO', 'Endettement financier', 'dettes financières / capitaux propres (résultat de l’exercice compris).'),
    'CAPACITE_REMBOURSEMENT': ('STRUCTURE', 'ANNEES', 'Capacité de remboursement', 'dettes financières / excédent brut d’exploitation, en années.'),
    'LIQUIDITE_GENERALE': ('LIQUIDITE', 'RATIO', 'Liquidité générale', '(actif circulant, hors activités ordinaires compris, + trésorerie-actif) / (passif circulant, hors activités ordinaires compris, + trésorerie-passif).'),
    'LIQUIDITE_REDUITE': ('LIQUIDITE', 'RATIO', 'Liquidité réduite', '(actif circulant − stocks + trésorerie-actif) / (passif circulant + trésorerie-passif).'),
    'LIQUIDITE_IMMEDIATE': ('LIQUIDITE', 'RATIO', 'Liquidité immédiate', 'trésorerie-actif / (passif circulant + trésorerie-passif).'),
    'TAUX_MARGE_COMMERCIALE': ('RENTABILITE', 'POURCENTAGE', 'Taux de marge commerciale', 'marge commerciale / ventes de marchandises × 100.'),
    'TAUX_VALEUR_AJOUTEE': ('RENTABILITE', 'POURCENTAGE', 'Taux de valeur ajoutée', 'valeur ajoutée / chiffre d’affaires × 100.'),
    'TAUX_EBE': ('RENTABILITE', 'POURCENTAGE', 'Taux d’excédent brut d’exploitation', 'excédent brut d’exploitation / chiffre d’affaires × 100.'),
    'MARGE_NETTE': ('RENTABILITE', 'POURCENTAGE', 'Marge nette', 'résultat de l’exercice / chiffre d’affaires × 100.'),
    'ROE': ('RENTABILITE', 'POURCENTAGE', 'Rentabilité des capitaux propres', 'résultat de l’exercice / capitaux propres (résultat compris) × 100.'),
    'ROA': ('RENTABILITE', 'POURCENTAGE', 'Rentabilité de l’actif', 'résultat de l’exercice / total de l’actif × 100.'),
    'BFR': ('EXPLOITATION', 'MONTANT', 'Besoin en fonds de roulement', 'actif circulant − passif circulant (hors activités ordinaires compris des deux côtés).'),
    'FRNG': ('EXPLOITATION', 'MONTANT', 'Fonds de roulement net global', 'capitaux propres (résultat compris) + dettes financières et ressources assimilées − actif immobilisé.'),
    'TRESORERIE_NETTE': ('EXPLOITATION', 'MONTANT', 'Trésorerie nette', 'trésorerie-actif − trésorerie-passif.'),
    'DIO': ('EXPLOITATION', 'JOURS', 'Délai de rotation des stocks', 'stocks / achats consommés (achats + variation des stocks d’achats) × jours de la période.'),
    'DSO': ('EXPLOITATION', 'JOURS', 'Délai de recouvrement des clients', 'créances clients / chiffre d’affaires × jours de la période. Montants tels que la liasse les porte (créances toutes taxes, chiffre d’affaires hors taxes).'),
    'DPO': ('EXPLOITATION', 'JOURS', 'Délai de paiement des fournisseurs', 'dettes fournisseurs / achats × jours de la période. Montants tels que la liasse les porte (dettes toutes taxes, achats hors taxes).'),
    'CYCLE_EXPLOITATION': ('EXPLOITATION', 'JOURS', 'Cycle d’exploitation', 'DIO + DSO − DPO, sur les valeurs publiées des trois délais (refaisable à la main).'),
}

# Reperes D'EXEMPLE. STORY-553 : aucun paquet publie n'en declare (le corpus n'est pas une source citable).
# Trois seulement, pour dessiner le verdict ; chacun le dit.
REPERES = {
    'POIDS_CAPITAUX_PROPRES': ('PLUS_HAUT_MIEUX', [('RISQUE', None, 20), ('ACCEPTABLE', 20, 30), ('BON', 30, 50), ('TRES_BON', 50, None)]),
    'ENDETTEMENT': ('PLUS_BAS_MIEUX', [('TRES_BON', None, 0.4), ('BON', 0.4, 0.6), ('ACCEPTABLE', 0.6, 0.8), ('RISQUE', 0.8, None)]),
    'DSO': ('PLUS_BAS_MIEUX', [('TRES_BON', None, 30), ('BON', 30, 60), ('ACCEPTABLE', 60, 90), ('RISQUE', 90, None)]),
}


def niveau(v, bornes):
    for n, lo, hi in bornes:
        if (lo is None or v >= lo) and (hi is None or v < hi):
            return n
    raise AssertionError('bornes qui ne couvrent pas la droite')


def construire_dette(html):
    """Indicateurs de dette (STORY-1084) lus dans le bloc valide du dossier de financement du prototype."""
    ligne5 = [l for l in html.splitlines() if 'Capacité d’endettement restante' in l and 'Autonomie financière' in l and '1,76' in l and 'Solide' in l]
    assert ligne5, 'tableau des indicateurs de dette introuvable'
    txt = re.sub(r'<[^>]+>', '|', ligne5[0]).replace('&nbsp;', ' ').replace('&minus;', '-').replace('−', '-')
    txt = re.sub(r'(\|\s*)+', '|', txt)
    m = re.search(r'Couverture du service de la dette\|\?\|[^|]*\|(\d,\d\d)\|([^|]+)\|(\d,\d\d)\|([^|]+)\|(\d,\d\d)\|([^|]+)\|'
                  r'Capacité d’endettement restante\|\?\|[^|]*\|(-?[\d ]+)\|([^|]+)\|(-?[\d ]+)\|([^|]+)\|(-?[\d ]+)\|([^|]+)\|'
                  r'Autonomie financière\|\?\|[^|]*\|([\d,]+) %\|([^|]+)\|([\d,]+) %\|([^|]+)\|([\d,]+) %\|([^|]+)\|', txt)
    assert m, 'bloc des indicateurs de dette introuvable dans le prototype'
    g = m.groups()
    f = lambda s: float(s.replace(',', '.'))
    couv, cap, aut = [f(g[0]), f(g[2]), f(g[4])], [int(g[6].replace(' ', '')), int(g[8].replace(' ', '')), int(g[10].replace(' ', ''))], [f(g[12]), f(g[14]), f(g[16])]
    assert couv == [1.76, 1.56, 1.65] and cap == [-8653352, 588400, 11238024] and aut == [37.7, 50.9, 68.4], (couv, cap, aut)
    v = lambda *a: [s.strip() for s in a]
    return dict(annees=['2026', '2027', '2028'], projet='Achat d’un camion de livraison · 25 000 000 F · 48 mois', indicateurs=[
        dict(code='COUVERTURE_SERVICE_DETTE', libelle='Couverture du service de la dette', unite='RATIO', valeurs=couv, verdicts=v(g[1], g[3], g[5]),
             formule='(capacité d’autofinancement + intérêts d’emprunt) / (capital remboursé + intérêts d’emprunt)'),
        dict(code='CAPACITE_ENDETTEMENT_RESIDUELLE', libelle='Capacité d’endettement restante', unite='MONTANT', valeurs=cap, verdicts=v(g[7], g[9], g[11]),
             formule='capitaux propres − dettes financières, à la clôture'),
        dict(code='AUTONOMIE_FINANCIERE', libelle='Autonomie financière', unite='POURCENTAGE', valeurs=aut, verdicts=v(g[13], g[15], g[17]),
             formule='capitaux propres / (capitaux propres + dettes financières) — la définition du prévisionnel')])


def construire_analyse(html):
    L = lire_liasse(html)
    assert L['BZ'] == (5700000, 6050000) and L['DZ'] == (5700000, 6050000), 'totaux du bilan du prototype'
    assert L['XB'] == (16000000, 16780000) and L['XI'] == (200000, 800000), 'CA et resultat du prototype'
    assert L['CP'] == (4350000, 4180000), 'capitaux propres du prototype'
    cols = {}
    for i, nom in enumerate(('N', 'N1')):
        M = masses(L, i)
        cols[nom] = (M,) + indicateurs_colonne(M)
    out = dict(source='Liasse du prototype : Bilan et compte de résultat 2025, comparatif 2024', jours=360,
               masses={k: [cols['N'][0][k], cols['N1'][0][k]] for k in cols['N'][0]}, indicateurs=[], composition={})
    for code in CODES:
        fam, unite, lib, formule = DEF[code]
        ind = dict(code=code, famille=fam, unite=unite, libelle=lib, formule=formule)
        for nom in ('N', 'N1'):
            r = cols[nom][1][code]
            col = dict(valeur=r['v'], numerateur=r['n'], denominateur=r['d'], motif=None, verdict=None, motifVerdict='AUCUN_REPERE_DECLARE')
            if code in REPERES:
                col['verdict'] = niveau(r['v'], REPERES[code][1]); col['motifVerdict'] = None
            ind[nom.lower()] = col
        if code in REPERES:
            ind['seuil'] = dict(sens=REPERES[code][0], bornes=[dict(niveau=a, min=b, max=c) for a, b, c in REPERES[code][1]],
                                secteurRetenu='TOUS', source='Repère d’exemple de la maquette : aucun repère n’est déclaré par le référentiel publié (STORY-553).')
        out['indicateurs'].append(ind)
    m = out['masses']; A = {k: [cols['N'][2][k], cols['N1'][2][k]] for k in cols['N'][2]}
    neg = lambda l: [-x for x in l]
    out['composition'] = {
        'POIDS_CAPITAUX_PROPRES': [['N', 'Capital, report à nouveau, subventions d’investissement', m['CP_MASSE']], ['N', 'Résultat de l’exercice (compte de résultat)', m['RESULTAT']], ['D', 'Total du passif (DZ)', A['tot_p']]],
        'ENDETTEMENT': [['N', 'Emprunts et dettes financières diverses (DA) et location-acquisition (DB)', m['DETTES_FIN']], ['D', 'Capitaux propres, résultat compris', A['cp']]],
        'CAPACITE_REMBOURSEMENT': [['N', 'Dettes financières', m['DETTES_FIN']], ['D', 'Excédent brut d’exploitation (XD)', m['EBE']]],
        'LIQUIDITE_GENERALE': [['N', 'Actif circulant (BK) + trésorerie-actif (BT)', [m['ACTIF_CIRCULANT'][i] + m['TRESO_ACTIF'][i] for i in (0, 1)]], ['D', 'Passif circulant (DP) + trésorerie-passif (DT)', A['ct']]],
        'LIQUIDITE_REDUITE': [['N', 'Actif circulant − stocks (BB) + trésorerie-actif', [m['ACTIF_CIRCULANT'][i] - m['STOCKS'][i] + m['TRESO_ACTIF'][i] for i in (0, 1)]], ['D', 'Passif circulant + trésorerie-passif', A['ct']]],
        'LIQUIDITE_IMMEDIATE': [['N', 'Trésorerie-actif (BT)', m['TRESO_ACTIF']], ['D', 'Passif circulant + trésorerie-passif', A['ct']]],
        'TAUX_MARGE_COMMERCIALE': [['N', 'Marge commerciale (XA)', m['MARGE']], ['D', 'Ventes de marchandises (TA)', m['VENTES_MARCH']]],
        'TAUX_VALEUR_AJOUTEE': [['N', 'Valeur ajoutée (XC)', m['VA']], ['D', 'Chiffre d’affaires (XB)', m['CA']]],
        'TAUX_EBE': [['N', 'Excédent brut d’exploitation (XD)', m['EBE']], ['D', 'Chiffre d’affaires (XB)', m['CA']]],
        'MARGE_NETTE': [['N', 'Résultat net (XI)', m['RESULTAT']], ['D', 'Chiffre d’affaires (XB)', m['CA']]],
        'ROE': [['N', 'Résultat net (XI)', m['RESULTAT']], ['D', 'Capitaux propres, résultat compris', A['cp']]],
        'ROA': [['N', 'Résultat net (XI)', m['RESULTAT']], ['D', 'Total de l’actif (BZ)', A['tot_a']]],
        'BFR': [['N', 'Actif circulant (BK)', m['ACTIF_CIRCULANT']], ['N', 'moins le passif circulant (DP)', neg(m['PASSIF_CIRCULANT'])]],
        'FRNG': [['N', 'Capitaux propres, résultat compris', A['cp']], ['N', 'Dettes financières et ressources assimilées (DD)', m['DETTES_FIN_ASSIM']], ['N', 'moins l’actif immobilisé (AZ)', neg(m['ACTIF_IMMOBILISE'])]],
        'TRESORERIE_NETTE': [['N', 'Trésorerie-actif (BT)', m['TRESO_ACTIF']], ['N', 'moins la trésorerie-passif (DT)', neg(m['TRESO_PASSIF'])]],
        'DIO': [['N', 'Stocks (BB)', m['STOCKS']], ['D', 'Achats consommés : achats (RA) + variation des stocks (RB)', A['cons']]],
        'DSO': [['N', 'Créances clients (BI)', m['CLIENTS']], ['D', 'Chiffre d’affaires (XB)', m['CA']]],
        'DPO': [['N', 'Fournisseurs d’exploitation (DJ)', m['FOURNISSEURS']], ['D', 'Achats de marchandises (RA)', m['ACHATS']]],
        'CYCLE_EXPLOITATION': [],
    }
    # valeurs attendues, ecrites en dur apres calcul a la main (arrondi demi-unite eloignee de zero)
    v = {i['code']: (i['n']['valeur'], i['n1']['valeur']) for i in out['indicateurs']}
    attendu = {'POIDS_CAPITAUX_PROPRES': (76.32, 69.09), 'ENDETTEMENT': (0.16, 0.22), 'CAPACITE_REMBOURSEMENT': (0.61, 0.5),
               'LIQUIDITE_GENERALE': (3.0, 1.98), 'BFR': (450000, 250000), 'FRNG': (1300000, 950000), 'TRESORERIE_NETTE': (850000, 700000),
               'DIO': (28.43, 15.28), 'DSO': (9.68, 14.8), 'DPO': (18.67, 25.12), 'MARGE_NETTE': (1.25, 4.77), 'ROE': (4.6, 19.14), 'TAUX_EBE': (7.13, 10.81)}
    for k, (a, b) in attendu.items():
        assert abs(v[k][0] - a) < 0.0051 and abs(v[k][1] - b) < 0.0051, (k, v[k], (a, b))
    assert v['CYCLE_EXPLOITATION'][0] == round(v['DIO'][0] + v['DSO'][0] - v['DPO'][0], 2)
    out['dette'] = construire_dette(html)
    return out


if __name__ == '__main__':
    html = open(sys.argv[1], encoding='utf-8', newline='').read()
    A = construire_analyse(html)
    if len(sys.argv) > 2:
        json.dump(A, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False)
    print({i['code']: (i['n']['valeur'], i['n1']['valeur']) for i in A['indicateurs']})
