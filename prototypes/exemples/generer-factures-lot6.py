# -*- coding: utf-8 -*-
"""Donnees de la maquette FE-149 (factures -> ecritures) et FE-150 (memoire des choix), lot 6.

Les ecritures proposees suivent le contrat de STORY-1097 (#751) :
  achat : charge HT au debit, TVA recuperable (4452) au debit, fournisseur TTC au credit, journal d'achats ;
  TVA non recuperable : la TVA s'ajoute a la charge, sans ligne de TVA ; TVA absente : pas de ligne de TVA.
Les sources des valeurs reprises sont celles de STORY-1098 (#755) : MEMOIRE_DOSSIER, MEMOIRE_CABINET,
COMPTE_PAR_DEFAUT_DU_TIERS ; les lignes de cahiers portent le champ facultatif `suggestion` de STORY-1099 (#758).
Valeurs de reference reprises des tests de comptabilite-service : CEET (NIF 1000234567, FA-0142, 12/03/2026,
100 000 / 18 000 / 118 000), TRANSIT EXPRESS (TE-77, 50 000 / 9 000 / 59 000, sans NIF), compte 6052.

Usage : python generer-factures-lot6.py <prototype.html> [<sortie.json>]
"""
import json, re, sys

TVA_ACHAT = dict(compte='4452', libelle='État, TVA récupérable sur achats')   # comptes-de-facturation@1 (SN)
COLLECTIF = '401'


def plan_du_prototype(html):
    d = json.loads(re.search(r'<script type="application/json" id="planData">(.*?)</script>', html, re.S).group(1))
    refs = {r['n']: r['l'] for r in d['refs']}
    propres = {c['n']: c['l'] for c in d['cab']['comptes'] if c['a']}
    propres.update({c['n']: c['l'] for c in d['cli']['comptes'] if c['a']})
    return refs, propres


def racine(n, refs):
    best = None
    for r in refs:
        if n.startswith(r) and (best is None or len(r) > len(best)):
            best = r
    return best


def proposer(p):
    """Regle pure de la proposition (STORY-1097), recopiee ici pour les donnees ; le JS la rejoue apres une correction."""
    ht, tva, ttc = p['ht'], p.get('tva') or 0, p['ttc']
    lignes = []
    if p['traitement'] == 'NON_RECUPERABLE':
        lignes.append(dict(role='CHARGE', compte=p.get('compte'), debit=ht + tva, credit=0))
    else:
        lignes.append(dict(role='CHARGE', compte=p.get('compte'), debit=ht, credit=0))
        if tva > 0:
            lignes.append(dict(role='TVA', compte=TVA_ACHAT['compte'], debit=tva, credit=0))
    lignes.append(dict(role='TIERS', compte=COLLECTIF, debit=0, credit=ttc))
    td, tc = sum(l['debit'] for l in lignes), sum(l['credit'] for l in lignes)
    return lignes, td, tc


MEM_DOS = lambda ref, le, par: dict(origine='MEMOIRE_DOSSIER', pieceRef=ref, choisiLe=le, choisiPar=par)
MEM_CAB = lambda ref, le, par: dict(origine='MEMOIRE_CABINET', pieceRef=ref, choisiLe=le, choisiPar=par)
DEFAUT = dict(origine='COMPTE_PAR_DEFAUT_DU_TIERS')

PIECES = [
    dict(id='p1', memId='m1', nom='CEET-FA-0143.pdf', fournisseur='CEET', nif='1000234567', num='FA-0143', date='2026-04-12', ht=100000, tva=18000, ttc=118000,
         compte='6052', source=MEM_DOS('FA-0142', '2026-03-12', 'Kofi Santos'), tiers=dict(code='F-CEET', nom='CEET', origine='NIF'), signaux=[]),
    dict(id='p2', memId='c2', nom='Togocom-T-0418.pdf', fournisseur='TOGOCOM', nif='1000876543', num='T-0418', date='2026-04-05', ht=25000, tva=4500, ttc=29500,
         compte='628', source=MEM_CAB('T-0391', '2026-02-20', 'Fatou Adjovi'), tiers=dict(code='F-TOGOCOM', nom='TOGOCOM', origine='NIF'), signaux=[]),
    dict(id='p3', nom='Total-Togo-8841.jpg', fournisseur='TOTAL TOGO', nif='1000345678', num='8841', date='2026-04-08', ht=60000, tva=10800, ttc=70800,
         compte='6041', source=DEFAUT, tiers=dict(code='F-TOTAL', nom='TOTAL TOGO', origine='NIF'), signaux=[]),
    dict(id='p4', memId='m2', nom='Loyer-avril-Amegan.pdf', fournisseur='M. AMEGAN', nif=None, num='LOY-04', date='2026-04-01', ht=75000, tva=None, ttc=75000,
         compte='622300', source=MEM_DOS('LOY-03', '2026-03-02', 'Kofi Santos'), tiers=dict(code='F-AMEGAN', nom='M. AMEGAN', origine='NOM'),
         signaux=[dict(code='TVA_ABSENTE', gravite='AVERTISSEMENT')]),
    dict(id='p5', memId='m3', nom='SODIGAZ-SG-5521.pdf', fournisseur='SODIGAZ', nif='1000456789', num='SG-5521', date='2026-03-28', ht=80000, tva=14400, ttc=94400,
         compte='6053', source=MEM_DOS('SG-5498', '2026-03-03', 'Kofi Santos'), tiers=dict(code='F-SODIGAZ', nom='SODIGAZ', origine='NIF'),
         signaux=[dict(code='DOUBLON_PROBABLE', gravite='AVERTISSEMENT', details=dict(numeroProvisoire='ACH-BR-000212', date='2026-03-28'))]),
    dict(id='p6', nom='Transit-Express-TE-77.pdf', fournisseur='TRANSIT EXPRESS', nif=None, num='TE-77', date='2026-03-14', ht=50000, tva=9000, ttc=59000,
         compte=None, source=None, tiers=None, aCreer=dict(nom='TRANSIT EXPRESS', nif=None, categorie='FOURNISSEUR'),
         signaux=[dict(code='TIERS_A_CREER', gravite='BLOQUANT'), dict(code='COMPTE_A_CHOISIR', gravite='BLOQUANT', details=dict())]),
    dict(id='p7', nom='Quincaillerie-Adjovi-Q-209.jpg', fournisseur='QUINCAILLERIE ADJOVI', nif='1000567890', num='Q-209', date='2026-04-09', ht=120000, tva=21600, ttc=143000,
         confianceTTC=0.62, compte=None, source=None, tiers=dict(code='F-ADJOVI', nom='QUINCAILLERIE ADJOVI', origine='NIF'),
         signaux=[dict(code='ECART_HT_TVA_TTC', gravite='BLOQUANT', details=dict(ht=120000, tva=21600, ttc=143000, ecart=1400)),
                  dict(code='COMPTE_A_CHOISIR', gravite='BLOQUANT', details=dict(ecarte='605900', raison='COMPTE_DESACTIVE', memoire='MEMOIRE_DOSSIER'))]),
    dict(id='p8', nom='IMG_0537.jpg', statut='ILLISIBLE', signaux=[dict(code='LECTURE_ECHOUEE', gravite='BLOQUANT')]),
]

VENTES = [   # un lot de ventes : l'OCR ne lit que l'emetteur (la societe du client) : le client est TOUJOURS a choisir (D-1097-3)
    dict(id='v1', memId='m4', nom='FV-0101.pdf', fournisseur='ETS KOSSI DISTRIBUTION', nif='1000745307', num='FV-0101', date='2026-04-02', ht=150000, tva=27000, ttc=177000,
         compte='701100', source=MEM_DOS('FV-0098', '2026-03-05', 'Fatou Adjovi'), tiers=None, signaux=[dict(code='TIERS_A_CHOISIR', gravite='BLOQUANT')]),
    dict(id='v2', memId='m4', nom='FV-0102.pdf', fournisseur='ETS KOSSI DISTRIBUTION', nif='1000745307', num='FV-0102', date='2026-04-06', ht=500000, tva=90000, ttc=590000,
         compte='701100', source=MEM_DOS('FV-0098', '2026-03-05', 'Fatou Adjovi'), tiers=None, signaux=[dict(code='TIERS_A_CHOISIR', gravite='BLOQUANT')]),
    dict(id='v3', memId='m4', nom='FV-0103.jpg', fournisseur='ETS KOSSI DISTRIBUTION', nif='1000745307', num='FV-0103', date='2026-04-10', ht=40000, tva=7200, ttc=47200,
         compte='701100', source=MEM_DOS('FV-0098', '2026-03-05', 'Fatou Adjovi'), tiers=None, signaux=[dict(code='TIERS_A_CHOISIR', gravite='BLOQUANT')]),
]
CLIENTS = [dict(code='C-KODJO', nom='Kodjo'), dict(code='C-MAIRIE-KARA', nom='Mairie de Kara'), dict(code='C-SODIGAZ', nom='SODIGAZ (vente)')]

BROUILLARDS = [   # ecritures deja au brouillard (le doublon probable de p5 en est une)
    dict(id='b0', num='ACH-000041', statut='VALIDEE', date='2026-02-27', libelle='CEET — FA-0139', ref='FA-0139', debit=94400, credit=94400),
    dict(id='b1', num='ACH-BR-000209', statut='BROUILLARD', date='2026-03-03', libelle='SODIGAZ — SG-5498', ref='SG-5498', debit=94400, credit=94400),
    dict(id='b2', num='ACH-BR-000210', statut='BROUILLARD', date='2026-03-12', libelle='CEET — FA-0142', ref='FA-0142', debit=118000, credit=118000),
    dict(id='b3', num='ACH-BR-000211', statut='BROUILLARD', date='2026-03-02', libelle='M. AMEGAN — LOY-03', ref='LOY-03', debit=75000, credit=75000),
    dict(id='b4', num='ACH-BR-000212', statut='BROUILLARD', date='2026-03-28', libelle='SODIGAZ — SG-5521', ref='SG-5521', debit=94400, credit=94400),
]

MEMOIRE = dict(
    ecritures=dict(
        dossier=[
            dict(id='m1', cle='NIF 1000234567', nom='CEET', sens='ACHAT', compte='6052', tva='RECUPERABLE', journal='ACH', tiers='CEET', ref='FA-0142', le='2026-03-12', par='Kofi Santos'),
            dict(id='m2', cle='NOM · M. AMEGAN', nom='M. AMEGAN', sens='ACHAT', compte='622300', tva='RECUPERABLE', journal='ACH', tiers='M. AMEGAN', ref='LOY-03', le='2026-03-02', par='Kofi Santos'),
            dict(id='m3', cle='NIF 1000456789', nom='SODIGAZ', sens='ACHAT', compte='6053', tva='RECUPERABLE', journal='ACH', tiers='SODIGAZ', ref='SG-5498', le='2026-03-03', par='Kofi Santos'),
            dict(id='m4', cle='NOM · ETS KOSSI DISTRIBUTION', nom='Vos ventes', sens='VENTE', compte='701100', tva='FACTUREE', journal='VTE', tiers=None, ref='FV-0098', le='2026-03-05', par='Fatou Adjovi'),
        ],
        cabinet=[
            dict(id='c1', cle='NIF 1000234567', nom='CEET', sens='ACHAT', compte='6052', tva='RECUPERABLE', journal='ACH', ref='FA-0127', le='2026-02-20', par='Fatou Adjovi'),
            dict(id='c2', cle='NIF 1000876543', nom='TOGOCOM', sens='ACHAT', compte='628', tva='RECUPERABLE', journal='ACH', ref='T-0391', le='2026-02-20', par='Fatou Adjovi'),
            dict(id='c3', cle='NIF 1000612345', nom='SOCIÉTÉ TOGOLAISE DES EAUX', sens='ACHAT', compte='6051', tva='RECUPERABLE', journal='ACH', ref='E-2601', le='2026-01-30', par='Awa Diallo'),
            dict(id='c4', cle='NOM · IMPRIMERIE DU GOLFE', nom='IMPRIMERIE DU GOLFE', sens='ACHAT', compte='6055', tva='NON_RECUPERABLE', journal='ACH', ref='IG-310', le='2026-01-16', par='Awa Diallo'),
        ]),
    cahiers=dict(
        dossier=[
            dict(id='k1', cle='NOM · CEET', nom='CEET', cahier='DEPENSES', choix='Électricité CEET', compte='6051', ref='facture mars', le='2026-03-14', par='Kofi Santos'),
            dict(id='k3', cle='LIBELLÉ · VENTE MARCHANDISES KODJO', nom='Vente marchandises — Kodjo', cahier='RECETTES', choix='701', compte='701', ref='page 3', le='2026-02-14', par='Fatou Adjovi'),
        ],
        cabinet=[
            dict(id='l1', cle='NOM · STATION TOTAL BÈ', nom='Station Total Bè', cahier='DEPENSES', choix='Carburant motos', compte=None, ref='ticket 0388', le='2026-02-02', par='Awa Diallo'),
            dict(id='l2', cle='NOM · CEET', nom='CEET', cahier='DEPENSES', choix='Électricité CEET', compte=None, ref='facture janv.', le='2026-02-01', par='Awa Diallo'),
        ]),
    actes=[dict(le='2026-03-30', par='Awa Diallo', texte='Mémoire oubliée : IMPRIMERIE LOMÉ (écritures, cabinet).', motif='GESTE'),
           dict(le='2026-03-21', par='Kofi Santos', texte='Mémoire oubliée : facture RC-77 abandonnée (écritures, dossier).', motif='ABANDON')])

SIGNAUX = {   # libelles de la maquette ; le serveur publie le code stable, le texte est a aligner (ecart note)
    'LECTURE_EN_COURS': 'La lecture de cette facture est en cours.',
    'LECTURE_ECHOUEE': 'La facture n’a pas pu être lue. Redéposez une photo plus nette.',
    'TIERS_A_CREER': 'Ce fournisseur n’existe pas encore dans le dossier. Créez-le en un clic.',
    'COMPTE_A_CHOISIR': 'Aucun compte n’est proposé : choisissez celui de la charge.',
    'ECART_HT_TVA_TTC': 'Les montants ne tombent pas juste : HT + TVA ≠ TTC. Corrigez le montant lu de travers.',
    'TVA_ABSENTE': 'Aucune TVA n’a été lue : elle est laissée à zéro. Gardez ainsi si le loyer n’est pas soumis à la TVA.',
    'DOUBLON_PROBABLE': 'Même fournisseur, même numéro de facture : elle est peut-être déjà au brouillard.',
    'TIERS_A_CHOISIR': 'À la vente, le client n’est pas lu sur la facture : choisissez-le.',
    'DATE_ABSENTE': 'La date n’a pas été lue.', 'MONTANT_ABSENT': 'Un montant n’a pas été lu.',
}

REFUS = {   # refus nommes de STORY-1097 : titre court + ce qu'on peut faire
    'FACTURES_RESERVEES_AU_SYSTEME_NORMAL': 'Ce client tient ses cahiers (système minimal de trésorerie). Ses factures se déposent là-bas.',
    'EXERCICE_CLOS': 'L’exercice 2025 est clos. Déposez ces factures dans l’exercice 2026.',
    'EXERCICE_INDETERMINE': 'Aucun exercice ouvert ne couvre la date de cette facture.',
    'AUTRE_EXERCICE': 'La date de cette facture désigne un autre exercice ouvert : déposez-la là.',
    'LOT_TROP_GRAND': 'Un dépôt ne peut pas dépasser 50 fichiers. Déposez le reste dans un second lot.',
    'FICHIER_TROP_VOLUMINEUX': 'Ce fichier dépasse 10 Mo. Réduisez-le ou prenez une photo plus légère.',
    'FORMAT_NON_PRIS_EN_CHARGE': 'Seuls les PDF, les JPEG et les PNG sont lus.',
    'FICHIER_ABSENT': 'Choisissez au moins une facture.',
    'SENS_REQUIS': 'Dites si ce sont des achats ou des ventes.',
    'DOCUMENTS_INDISPONIBLES': 'Les documents sont momentanément indisponibles : la lecture reprendra dans un instant. Rien n’est perdu.',
    'DEJA_INSCRITE': 'Cette facture est déjà au brouillard.',
    'INSCRIPTION_EN_COURS': 'Cette facture est en cours d’inscription : patientez un instant.',
    'PIECE_NON_INSCRIPTIBLE': 'Il reste quelque chose à régler sur cette facture avant de l’inscrire.',
    'DEVISE_ETRANGERE': 'La facture n’est pas en francs CFA : la conversion n’est pas encore prise en charge.',
}


def construire(html):
    refs, propres = plan_du_prototype(html)
    # chaque compte utilise a une racine du referentiel ou un compte propre du dossier
    comptes_utilises = {p.get('compte') for p in PIECES if p.get('compte')} | {m['compte'] for g in MEMOIRE['ecritures'].values() for m in g}
    for c in comptes_utilises:
        assert c in propres or racine(c, refs), ('compte sans racine dans le plan du prototype', c)
    assert racine(COLLECTIF, refs) and refs.get('443')
    cps = []
    for p in PIECES:
        if p.get('statut') == 'ILLISIBLE':
            continue
        p['traitement'] = 'RECUPERABLE'
        lignes, td, tc = proposer(p)
        p['lignes'], p['totalDebit'], p['totalCredit'] = lignes, td, tc
        ecart = (p['ht'] + (p['tva'] or 0)) != p['ttc']
        assert ecart == any(s['code'] == 'ECART_HT_TVA_TTC' for s in p['signaux']), ('ecart mal signale', p['id'])
        assert (td == tc) == (not ecart), ('equilibre', p['id'], td, tc)
        if p['tva'] is None:
            assert any(s['code'] == 'TVA_ABSENTE' for s in p['signaux'])
        if p.get('compte') is None:
            assert any(s['code'] == 'COMPTE_A_CHOISIR' for s in p['signaux'])
        p['inscriptible'] = not any(s['gravite'] == 'BLOQUANT' for s in p['signaux'])
        cps.append(p)
    # valeur de reference de l'AC-2 de STORY-1097 : 6xx debit 100 000, 4452 debit 18 000, 401 credit 118 000
    p1 = PIECES[0]
    assert [(l['compte'], l['debit'], l['credit']) for l in p1['lignes']] == [('6052', 100000, 0), ('4452', 18000, 0), ('401', 0, 118000)]
    assert (p1['ht'], p1['tva'], p1['ttc']) == (100000, 18000, 118000)
    for v in VENTES:   # vente : client TTC au debit, produit HT et TVA facturee au credit
        assert v['ht'] + v['tva'] == v['ttc'] and v['compte'] in propres, v['id']
        v['traitement'] = 'FACTUREE'
        v['lignes'] = [dict(role='TIERS', compte='411', debit=v['ttc'], credit=0), dict(role='PRODUIT', compte=v['compte'], debit=0, credit=v['ht']),
                       dict(role='TVA', compte='443', debit=0, credit=v['tva'])]
        v['totalDebit'] = sum(l['debit'] for l in v['lignes']); v['totalCredit'] = sum(l['credit'] for l in v['lignes'])
        assert v['totalDebit'] == v['totalCredit'], v['id']
        v['inscriptible'] = False
    # decomptes affiches par la maquette
    pretes = [p for p in cps if p['inscriptible'] and not p['signaux']]
    inscriptibles = [p for p in cps if p['inscriptible']]
    comp = dict(pieces=len(PIECES), enLecture=0, lues=len(cps), illisibles=1, deposEchoues=0, inscriptibles=len(inscriptibles), inscrites=0)
    assert comp == dict(pieces=8, enLecture=0, lues=7, illisibles=1, deposEchoues=0, inscriptibles=5, inscrites=0), comp
    assert [p['id'] for p in pretes] == ['p1', 'p2', 'p3']
    # la memoire cite des sources que les pieces reprennent
    for g in MEMOIRE['ecritures'].values():
        for m in g:
            assert m['compte'] in propres or racine(m['compte'], refs)
    # le brouillard : un doublon de la piece p5 existe deja
    assert any(b['ref'] == 'SG-5521' for b in BROUILLARDS)
    for b in BROUILLARDS:
        assert b['debit'] == b['credit']
    return dict(
        dossier=dict(nom='Ets Kossi Distribution', referentiel='SN', exercice='2026', nif='1000745307'),
        tva=TVA_ACHAT, journaux=[dict(c='ACH', l='Achats'), dict(c='VTE', l='Ventes'), dict(c='OD', l='Opérations diverses')],
        plan=dict(refs=refs, propres=propres),
        comptes=[dict(n='601100', l=propres.get('601100', 'Achats de marchandises locales')), dict(n='6052', l=None), dict(n='6053', l=None), dict(n='6041', l=None),
                 dict(n='611', l=None), dict(n='622300', l=propres.get('622300')), dict(n='628', l=None), dict(n='6055', l=None), dict(n='605900', l=None, actif=False)],
        pieces=PIECES, ventes=VENTES, clients=CLIENTS, brouillards=BROUILLARDS, memoire=MEMOIRE, signaux=SIGNAUX, refus=REFUS, compteurs=comp,
        lot=dict(lotId='lot-demo', sens='ACHAT', avoir=False, devise='XOF', creeLe='2026-04-15', creePar='Kofi Santos'))


if __name__ == '__main__':
    html = open(sys.argv[1], encoding='utf-8', newline='').read()
    D = construire(html)
    if len(sys.argv) > 2:
        json.dump(D, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False)
    print('ok', D['compteurs'])
