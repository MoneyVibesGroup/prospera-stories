#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
verifier.py — controle de coherence du depot prospera-stories.

Rejoue, a la demande, tous les controles qui n'ont jusqu'ici ete faits qu'a la main
ou par des scripts jetables. Chaque controle ici correspond a un defaut REELLEMENT
constate dans ce depot : la liste n'est pas theorique.

    python outils/verifier.py              # rapport complet
    python outils/verifier.py --matrice    # + regenere MATRICE-COMPLETUDE.md
    python outils/verifier.py --bref       # que les anomalies

Code de sortie : 1 s'il reste au moins un ECHEC, 0 sinon.
Les ALERTE ne font pas echouer : ce sont des constats a arbitrer, pas des erreurs.
"""

import io
import os
import re
import sys
import json
import glob
import argparse
from collections import Counter, OrderedDict

try:
    import yaml
except ImportError:
    sys.exit("PyYAML requis :  pip install pyyaml")

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEPOT = os.path.dirname(RACINE)  # MoneyVibes_Apps

OK, ALERTE, ECHEC = 'OK', 'ALERTE', 'ECHEC'
resultats = []


def dire(niveau, controle, message):
    resultats.append((niveau, controle, message))


def lire(chemin):
    with io.open(os.path.join(RACINE, chemin), encoding='utf-8') as f:
        return f.read()


def existe(chemin):
    return os.path.isfile(os.path.join(RACINE, chemin))


# ---------------------------------------------------------------- artefacts connus
#
# Un module absent de cette table n'est PAS une erreur du script : c'est un module
# sans artefact, et c'est precisement ce qu'on veut voir. Ajouter un module ici
# quand il recoit son premier document.
#
ARTEFACTS = {
    1: ('prds/prd-notification-service-2026-08-02/prd.md',
        'architecture/architecture-notification-service-2026-08-03/ARCHITECTURE-SPINE.md',
        'epics-notification-2026-08-04.md'),
    2: ('prds/prd-pdv-2026-08-02/prd.md',
        'architecture/architecture-pdv-service-2026-08-15/ARCHITECTURE-SPINE.md',
        'epics-pdv-2026-08-15.md'),
    3: ('prds/prd-catalogue-produits-2026-08-02/prd.md',
        'architecture/architecture-catalogue-produits-service-2026-08-15/ARCHITECTURE-SPINE.md',
        'epics-catalogue-produits-2026-08-15.md'),
    4: ('prds/prd-reseau-zones-2026-08-02/prd.md',
        'architecture/architecture-reseau-service-2026-08-15/ARCHITECTURE-SPINE.md',
        'epics-reseau-2026-08-15.md'),
    5: (None, None, None),          # Immobilisations : cadrage seul, arbitre le 2026-08-16
    # Module 6 : la note 2026-07-20 est DEPASSEE (cf. son encadre) ; la spine du
    # 2026-08-16 la remplace. Statut `draft` : 4 conditions bloquantes avant `final`.
    6: ('prds/prd-assistant-ia-2026-08-02/prd.md',
        'architecture/architecture-assistant-service-2026-08-16/ARCHITECTURE-SPINE.md',
        None),
    7: ('prds/prd-stock-2026-08-02/prd.md',
        'architecture/architecture-stock-service-2026-08-15/ARCHITECTURE-SPINE.md',
        'epics-stock-2026-08-15.md'),
}

# Chantiers hors sequence numerotee (Bloc 0, modules anticipes).
HORS_SEQUENCE = OrderedDict([
    ('Fiscalite (fiscal-service)', ('prds/prd-fiscalite-2026-07-31/prd.md',
                                    'architecture/architecture-fiscal-service-2026-08-03/ARCHITECTURE-SPINE.md',
                                    'epics-fiscalite-2026-08-03.md')),
    ('PI-SPI (paiement-service)', ('prds/prd-paiement-service-2026-08-02/prd.md',
                                   'architecture/architecture-paiement-service-2026-08-03/ARCHITECTURE-SPINE.md',
                                   'epics-paiement-2026-08-03.md')),
    ('Balance / Atelier', ('prd-atelier-balance-2026-07-12.md',
                           'architecture/architecture-balance-service-2026-08-15/ARCHITECTURE-SPINE.md',
                           None)),
    ('Bilan & liasse', ('prd-bilan-service-2026-07-10.md',
                        'architecture-bilan-service-2026-07-07.md', None)),
    ('Dossier client', (None,
                        'architecture/architecture-dossier-service-2026-08-15/ARCHITECTURE-SPINE.md',
                        None)),
    ('Socle & habilitations', (None, 'architecture-auth-service-2026-07-04.md', None)),
    ('Catalogue plateforme', (None, 'architecture-catalog-service-2026-07-07.md', None)),
    ('KYC', (None, 'architecture-kyc-service-2026-07-03.md', None)),
    ('GED / OCR (document-service)', (None, None, None)),   # tech-spec Draft seule
])


# =============================================================== 1. TRACKER
def controler_tracker():
    """sprint-status.yaml : la source de verite du planning."""
    try:
        d = yaml.safe_load(lire('sprint-status.yaml'))
    except Exception as e:
        dire(ECHEC, 'T0 parse', 'sprint-status.yaml illisible : %s' % e)
        return None
    dire(OK, 'T0 parse', 'sprint-status.yaml se charge')

    slottees, par_sprint = [], {}
    for s in d.get('sprints') or []:
        n = s.get('sprint_number')
        par_sprint[n] = s
        for st in s.get('stories') or []:
            slottees.append((st.get('story_id'), n, st))

    ids = [i for i, _, _ in slottees]

    # T1 — un meme story_id slotte deux fois : le re-decoupage du 2026-08-03 l'a produit.
    dup = sorted({i for i in ids if ids.count(i) > 1})
    if dup:
        dire(ECHEC, 'T1 doublons', 'story_id slotte plusieurs fois : %s' % ', '.join(dup))
    else:
        dire(OK, 'T1 doublons', '%d stories slottees, aucun doublon' % len(ids))

    # T2 — story_path qui ne pointe sur rien : 33 cas trouves le 2026-08-15.
    casses = [(i, st['story_path']) for i, _, st in slottees
              if st.get('story_path') and not existe(st['story_path'])]
    if casses:
        dire(ECHEC, 'T2 story_path', '%d story_path sans fichier : %s'
             % (len(casses), ', '.join('%s -> %s' % c for c in casses[:6])))
    else:
        dire(OK, 'T2 story_path', 'tout story_path renseigne pointe sur un fichier')

    # T3 — le defaut du TITRE SANS FICHIER : 5 occurrences constatees (236, 345, 348...).
    sans = [i for i, _, st in slottees if not st.get('story_path')]
    if sans:
        dire(ALERTE, 'T3 titre sans fichier',
             "%d stories slottees SANS story_path — terreau du defaut « un titre n'est porte "
             "par personne ». Priorite aux sprints proches : %s"
             % (len(sans), ', '.join(sorted(i for i, n, st in slottees
                                            if not st.get('story_path') and (n or 99) <= 22)[:10]) or 'aucune avant S22'))

    # T4 — un fichier de story que le planning ignore (orphelines du 2026-07-31).
    #      ⚠️ Une story SUPERSEDED n'a RIEN a faire dans un sprint : la signaler serait
    #      inviter a la re-slotter. On ne compte que les orphelines VIVANTES.
    orphelines, remplacees = [], 0
    for p in sorted(glob.glob(os.path.join(RACINE, 'stories', 'STORY-*.md'))):
        sid = os.path.basename(p)[:-3]
        if sid in ids:
            continue
        with io.open(p, encoding='utf-8') as f:
            tete = f.read(1500)
        if re.search(r'SUPERSED|D[EÉ]PASS[EÉ]|ABANDONN', tete, re.I):
            remplacees += 1
        else:
            orphelines.append(sid)
    if orphelines:
        dire(ALERTE, 'T4 orphelines',
             '%d fichiers de story VIVANTS dans aucun sprint : %s (+ %d superseded, normales)'
             % (len(orphelines), ', '.join(orphelines[:10]), remplacees))
    else:
        dire(OK, 'T4 orphelines',
             'aucune story vivante hors planning (%d superseded, normales)' % remplacees)

    # T5 — somme != engagement. Silencieux par nature : S20 et S28 pris ainsi.
    ecarts = []
    for n, s in sorted(par_sprint.items()):
        somme = sum(x.get('points') or 0 for x in s.get('stories') or [])
        cp = s.get('committed_points')
        if cp is not None and somme != cp:
            ecarts.append((n, somme, cp, s.get('status')))
    if ecarts:
        dire(ECHEC, 'T5 engagement',
             'somme des points != committed_points : %s'
             % ' | '.join('S%s %d vs %d (%s)' % e for e in ecarts))
    else:
        dire(OK, 'T5 engagement', 'somme = committed_points sur les %d sprints' % len(par_sprint))

    # T6 — completed_points qui decroche des stories done (constate 4 fois sur le compteur).
    decroches = []
    for n, s in sorted(par_sprint.items()):
        faits = sum(x.get('points') or 0 for x in s.get('stories') or [] if x.get('status') == 'done')
        cp = s.get('completed_points')
        if cp is not None and faits != cp:
            decroches.append((n, faits, cp))
    if decroches:
        dire(ALERTE, 'T6 avancement',
             'completed_points != somme des stories done : %s'
             % ' | '.join('S%s %d vs %d' % e for e in decroches))
    else:
        dire(OK, 'T6 avancement', 'completed_points colle aux stories done')

    # T7 — les compteurs d'attribution.
    if ids:
        maxi = max(int(i.split('-')[1]) for i in ids if re.match(r'STORY-\d+$', i or ''))
        hw = int(re.search(r'STORY-(\d+)', d.get('story_id_high_water_mark', 'STORY-0')).group(1))
        if hw < maxi:
            dire(ECHEC, 'T7 compteur story', 'high_water_mark STORY-%d < max attribue STORY-%d' % (hw, maxi))
        else:
            dire(OK, 'T7 compteur story', 'high_water_mark STORY-%d >= max attribue STORY-%d' % (hw, maxi))

    # T8 — plages d'epics : « une plage annoncee dans un doc N'EST PAS reservee ».
    plages = []
    for r in d.get('reserved_ranges') or []:
        bornes = re.findall(r'EPIC-(\d+)', r.get('range', ''))
        if len(bornes) == 2:
            plages.append((int(bornes[0]), int(bornes[1]), r.get('owner', '')[:40]))
    plages.sort()
    chev = [(a, b) for a, b in zip(plages, plages[1:]) if a[1] >= b[0]]
    if chev:
        dire(ECHEC, 'T8 plages', 'plages d epics qui se chevauchent : %s' % chev)
    else:
        dire(OK, 'T8 plages', '%d plages reservees, aucun chevauchement' % len(plages))
    if plages:
        ehw = int(re.search(r'EPIC-(\d+)', d.get('epic_id_high_water_mark', 'EPIC-0')).group(1))
        maxe = max(b for _, b, _ in plages)
        if ehw != maxe:
            dire(ALERTE, 'T8 compteur epic',
                 'epic_id_high_water_mark EPIC-%d != borne haute des plages EPIC-%d' % (ehw, maxe))
    return d


# =============================================================== 2. EPICS vs PRD vs SPINE
def controler_epics():
    """Le defaut le plus couteux du depot : un document qui encode l'ancienne verite."""
    for numero, (prd, spine, epics) in list(ARTEFACTS.items()) + [(k, v) for k, v in HORS_SEQUENCE.items()]:
        if not epics or not existe(epics):
            continue
        texte = lire(epics)
        nom = os.path.basename(epics)

        # E1 — la somme des points annonces par epic contre le total en tete.
        somme = sum(int(x) for x in re.findall(r'^## EPIC-\d+ ?:.*?· (\d+) pts', texte, re.M))
        annonce = re.search(r'(\d{2,4}) pts, le PRD en annon', texte)
        if somme and annonce:
            if int(annonce.group(1)) != somme:
                dire(ECHEC, 'E1 total %s' % nom,
                     'somme des epics = %d pts mais le document annonce %s' % (somme, annonce.group(1)))
            else:
                dire(OK, 'E1 total %s' % nom, '%d pts, somme = total annonce' % somme)

        # E2 — un FR du PRD que le document d'epics ne couvre nulle part.
        #      C'est exactement FR-F79 / FR-F80, absents pendant 24 h.
        #      ATTENTION : les decoupages citent AUSSI par plages (« FR-S06 → FR-S09 »).
        #      Un controle qui ignore les plages hurle a tort — et un controle qui hurle
        #      a tort n'est plus relance. Les plages sont donc etendues avant comparaison.
        if prd and existe(prd):
            texte_prd = lire(prd)
            # Une exigence que le PRD lui-meme annule (« SANS OBJET », barree, abandonnee)
            # n'a PAS a figurer dans le decoupage : l'y exiger serait un faux positif.
            # Cas reel : FR-R28c, annulee le 2026-08-15 par l'arrivee du read-model.
            annulees = set()
            for ligne in texte_prd.splitlines():
                if re.search(r'SANS OBJET|ABANDONN[EÉ]|SUPPRIM[EÉ]|~~', ligne, re.I):
                    annulees.update(re.findall(r'\*\*((?:FR|NFR)-[A-Z]?\d+[a-z]?)\*\*', ligne))
            frs = sorted(f for f in set(re.findall(r'\*\*((?:FR|NFR)-[A-Z]?\d+[a-z]?)\*\*', texte_prd))
                         if f.startswith('FR-') and f not in annulees)
            couverts = set()
            for m in re.finditer(r'((?:FR|NFR)-[A-Z]?)(\d+)[a-z]?\s*(?:→|->|\bà\b|\.\.)\s*'
                                 r'(?:(?:FR|NFR)-[A-Z]?)?(\d+)[a-z]?', texte):
                prefixe, debut, fin = m.group(1), int(m.group(2)), int(m.group(3))
                if fin >= debut:
                    couverts.update('%s%02d' % (prefixe, k) for k in range(debut, fin + 1))

            def couvert(f):
                if f in texte:
                    return True
                m = re.match(r'((?:FR|NFR)-[A-Z]?)(\d+)', f)   # FR-S24b couvert par une plage sur 24
                return bool(m) and '%s%02d' % (m.group(1), int(m.group(2))) in couverts

            manquants = [f for f in frs if not couvert(f)]
            if manquants:
                dire(ECHEC, 'E2 couverture %s' % nom,
                     "%d exigences du PRD ne sont NI citees NI dans une plage du decoupage : %s"
                     % (len(manquants), ', '.join(manquants[:12])))
            elif frs:
                dire(OK, 'E2 couverture %s' % nom,
                     'les %d FR du PRD sont couverts (citation directe ou plage)%s'
                     % (len(frs), ', %d annulee(s) ignoree(s)' % len(annulees) if annulees else ''))

        # E3 — la plage d'AD citee contre le nombre reel d'AD de la spine.
        #      Le gras compte : « AD-1 -> **AD-21** » doit matcher aussi.
        if spine and existe(spine):
            reel = len(re.findall(r'^### AD-\d+', lire(spine), re.M))
            cite = re.search(r'AD-1\s*(?:→|->)\s*\*{0,2}AD-(\d+)', texte)
            if cite and reel:
                if int(cite.group(1)) != reel:
                    dire(ECHEC, 'E3 spine %s' % nom,
                         'le decoupage cite AD-1 -> AD-%s alors que la spine porte %d decisions'
                         % (cite.group(1), reel))
                else:
                    dire(OK, 'E3 spine %s' % nom, 'plage AD-1 -> AD-%d conforme a la spine' % reel)
            elif reel and not cite:
                dire(ALERTE, 'E3 spine %s' % nom,
                     'le decoupage ne cite aucune plage AD alors que la spine en porte %d' % reel)


# =============================================================== 3. REFERENTIELS
MOTS_TROU = re.compile(
    r"(?:à|a) (?:valider|jour|compl[eé]ter|confirmer|d[eé]finir)"
    r"|[eé]ventuel|non sourc|inconnu|to ?do", re.I)


# Champs de PROSE : un corpus juridique dit « à valider » dans le texte de la loi
# elle-meme. Les y chercher noie les vrais trous sous 25 faux. On ne controle que
# les champs PORTEURS DE VALEUR.
CHAMPS_PROSE = {'texte', 'avertissement', 'note', 'notes', 'description', 'libelle',
                'commentaire', 'intitule', 'contenu', 'extrait', 'reference', 'sources'}


def controler_referentiels():
    """« La regle est la, la valeur n'y est pas » — SMIG, durees d'amortissement, Art. 75.

    Trois fois en une journee le 2026-08-16. Ce controle les fait remonter d'un coup.
    """
    trouves = []
    for chemin in sorted(glob.glob(os.path.join(RACINE, 'referentiels', '*.json'))):
        nom = os.path.basename(chemin)
        if nom.startswith('corpus-'):        # corpus de textes de loi : que de la prose
            continue
        try:
            with io.open(chemin, encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            dire(ECHEC, 'R0 %s' % nom, 'JSON illisible : %s' % e)
            continue

        def parcourir(noeud, chemin_logique=''):
            if isinstance(noeud, dict):
                for cle, valeur in noeud.items():
                    sous = chemin_logique + '/' + str(cle)
                    if 'acompleter' in str(cle).lower().replace('_', ''):
                        trouves.append((nom, sous, str(valeur)[:120]))   # declaration explicite
                    elif str(cle).lower() in CHAMPS_PROSE:
                        continue
                    else:
                        parcourir(valeur, sous)
            elif isinstance(noeud, list):
                for element in noeud:
                    parcourir(element, chemin_logique + '[]')
            elif isinstance(noeud, str) and len(noeud) <= 260 and MOTS_TROU.search(noeud):
                trouves.append((nom, chemin_logique, noeud[:120]))

        parcourir(data)

    if trouves:
        dire(ALERTE, 'R1 valeur absente',
             "%d endroits ou un referentiel DECLARE UNE REGLE SANS SA VALEUR (ou se declare "
             "non valide). Chacun est un calcul qui sortira bloque — ou pire, code en dur :\n%s"
             % (len(trouves), '\n'.join('        %-32s %-38s %s' % t for t in trouves[:14])))
    else:
        dire(OK, 'R1 valeur absente', 'aucun trou declare dans les referentiels')


# =============================================================== 4. DOCUMENTS PERIMES
def controler_documents():
    """Un document depasse qui reste cite sans avertissement continue de faire autorite."""
    tous = {}
    for chemin in glob.glob(os.path.join(RACINE, '**', '*.md'), recursive=True):
        rel = os.path.relpath(chemin, RACINE).replace('\\', '/')
        tous[rel] = lire(rel)

    # ⚠️ Le marqueur doit qualifier LE DOCUMENT ENTIER. Un « périmé » cite au fil du
    # texte parle d'autre chose. Et neuf fichiers s'appellent ARCHITECTURE-SPINE.md :
    # chercher par nom de base confondrait des documents differents.
    # ⚠️ Un « superseded » qui traine dans une phrase parle d'AUTRE CHOSE — dans ce depot,
    # de EPIC-009. Le marqueur doit qualifier LE STATUT DU DOCUMENT : soit la formule
    # explicite, soit une ligne « Statut : ... » qui porte le mot.
    MARQUEUR = re.compile(
        r'DOCUMENT\s+(?:D[EÉ]PASS[EÉ]|P[EÉ]RIM[EÉ]|OBSOL[EÈ]TE)'
        # ⚠️ « remplace X » = ce document est ACTIF. Seul « remplacé PAR » le perime.
        r'|^[>\s#*]*(?:\*\*)?Statut\s*(?:\*\*)?\s*:[^\n]{0,60}'
        r'(?:D[EÉ]PASS[EÉ]|P[EÉ]RIM[EÉ]|SUPERSEDED|OBSOL[EÈ]TE|REMPLAC[EÉ]E?\s+PAR)',
        re.I | re.M)
    depasses = [rel for rel, t in tous.items() if MARQUEUR.search(t[:2500])]
    if not depasses:
        dire(OK, 'D1 documents', 'aucun document marque depasse')
        return

    bases = Counter(os.path.basename(r) for r in tous)
    propres = 0
    for doc in depasses:
        base = os.path.basename(doc)
        cle = base if bases[base] == 1 else doc      # nom ambigu -> chemin complet exige
        citants = [r for r, t in tous.items()
                   if r != doc and cle in t
                   and not re.search(r'D[EÉ]PASS|SUPERSED|P[EÉ]RIM|plus à jour|remplac', t)]
        if citants:
            dire(ALERTE, 'D1 %s' % base,
                 'document DEPASSE encore cite SANS RESERVE par : %s' % ', '.join(citants[:5]))
        else:
            propres += 1
    dire(OK, 'D1 documents',
         '%d documents marques depasses, dont %d sans aucun renvoi a nu' % (len(depasses), propres))
    return depasses


# =============================================================== 5. MATRICE DE COMPLETUDE
def lire_sequence():
    """Les modules sont lus depuis la sequence, pas recopies : ajouter un module la-bas
    le fait apparaitre ici en trou, sans toucher a ce script."""
    chemin = os.path.join(DEPOT, 'PROSPERA_SEQUENCE_MODULES_v2.md')
    if not os.path.isfile(chemin):
        return []
    with io.open(chemin, encoding='utf-8') as f:
        texte = f.read()
    modules = []
    for ligne in texte.splitlines():
        m = re.match(r'^\|\s*\*{0,2}(\d+)\*{0,2}\s*\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|', ligne)
        if m and m.group(2) and not m.group(2).startswith('-'):
            nom = re.sub(r'[*🆕⬆️]', '', m.group(2)).strip()
            modules.append((int(m.group(1)), nom, re.sub(r'[*]', '', m.group(3)).strip()))
    vus, uniques = set(), []
    for n, nom, vert in modules:
        if n not in vus:
            vus.add(n)
            uniques.append((n, nom, vert))
    return sorted(uniques)


def etat(chemin):
    if chemin is None:
        return 'absent'
    return 'ok' if existe(chemin) else 'DECLARE MAIS INTROUVABLE'


def controler_couverture(ecrire_matrice):
    modules = lire_sequence()
    if not modules:
        dire(ALERTE, 'C0 sequence', 'PROSPERA_SEQUENCE_MODULES_v2.md introuvable — matrice non produite')
        return

    lignes, trous = [], []
    for numero, nom, verticales in modules:
        prd, spine, epics = ARTEFACTS.get(numero, (None, None, None))
        etats = (etat(prd), etat(spine), etat(epics))
        lignes.append((numero, nom, verticales, etats))
        if etats[0] == 'ok' and etats[1] == 'absent':
            trous.append('module %d (%s) : PRD sans architecture' % (numero, nom[:34]))
        if etats[1] == 'ok' and etats[2] == 'absent':
            trous.append('module %d (%s) : architecture sans decoupage' % (numero, nom[:34]))

    fait = sum(1 for _, _, _, e in lignes if e == ('ok', 'ok', 'ok'))
    dire(OK if not trous else ALERTE, 'C1 couverture',
         '%d modules dans la sequence, %d avec la chaine complete PRD+spine+epics%s'
         % (len(lignes), fait, ('. Chaines INCOMPLETES :\n        ' + '\n        '.join(trous)) if trous else ''))

    if not ecrire_matrice:
        return

    def case(e):
        return {'ok': 'OUI', 'absent': '—'}.get(e, e)

    out = ["# Matrice de completude du programme",
           "",
           "> **Genere par `outils/verifier.py --matrice`. Ne pas editer a la main.**",
           "> Un module sans artefact n'est pas une erreur du script : c'est un trou reel.",
           "> Les modules sont lus depuis `PROSPERA_SEQUENCE_MODULES_v2.md` — en ajouter un",
           "> la-bas le fait apparaitre ici automatiquement.",
           "",
           "## Chantiers hors sequence numerotee",
           "",
           "| Chantier | PRD | Architecture | Decoupage |",
           "| --- | :---: | :---: | :---: |"]
    for nom, (prd, spine, epics) in HORS_SEQUENCE.items():
        out.append('| %s | %s | %s | %s |' % (nom, case(etat(prd)), case(etat(spine)), case(etat(epics))))

    out += ["", "## Sequence des modules", "",
            "| # | Module | Verticales | PRD | Architecture | Decoupage |",
            "| :--: | --- | --- | :---: | :---: | :---: |"]
    for numero, nom, verticales, e in lignes:
        out.append('| %d | %s | %s | %s | %s | %s |'
                   % (numero, nom, verticales, case(e[0]), case(e[1]), case(e[2])))
    out += ["", "## Lecture",
            "",
            "- **PRD OUI, Architecture —** : le besoin est cadre, rien ne dit comment le construire.",
            "- **Architecture OUI, Decoupage —** : les decisions existent, aucune story ne s'y adosse.",
            "- **Tout a —** : zone blanche. Normale au-dela de la vague en cours, anormale en deca.",
            ""]
    with io.open(os.path.join(RACINE, 'MATRICE-COMPLETUDE.md'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(out))
    dire(OK, 'C2 matrice', 'MATRICE-COMPLETUDE.md regeneree (%d modules + %d chantiers)'
         % (len(lignes), len(HORS_SEQUENCE)))


# =============================================================== rapport
def main():
    ap = argparse.ArgumentParser(description='Controle de coherence de prospera-stories.')
    ap.add_argument('--matrice', action='store_true', help='regenere MATRICE-COMPLETUDE.md')
    ap.add_argument('--bref', action='store_true', help="n'affiche que les anomalies")
    args = ap.parse_args()

    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

    controler_tracker()
    controler_epics()
    controler_referentiels()
    controler_documents()
    controler_couverture(args.matrice)

    print('')
    print('=' * 78)
    print('  VERIFICATION prospera-stories')
    print('=' * 78)
    section = None
    for niveau, controle, message in resultats:
        if args.bref and niveau == OK:
            continue
        prefixe = controle.split()[0][0]
        titre = {'T': '1. TRACKER', 'E': '2. DECOUPAGES', 'R': '3. REFERENTIELS',
                 'D': '4. DOCUMENTS', 'C': '5. COUVERTURE'}.get(prefixe, '')
        if titre != section:
            section = titre
            print('\n--- %s' % titre)
        print('  %-7s %-26s %s' % (niveau, controle, message))

    compte = Counter(n for n, _, _ in resultats)
    print('')
    print('-' * 78)
    print('  %d controles : %d OK, %d alertes, %d echecs'
          % (len(resultats), compte[OK], compte[ALERTE], compte[ECHEC]))
    if compte[ECHEC]:
        print('  Les ECHEC sont des incoherences internes : elles se corrigent.')
    if compte[ALERTE]:
        print('  Les ALERTE sont des constats a arbitrer, pas des erreurs.')
    print('-' * 78)
    return 1 if compte[ECHEC] else 0


if __name__ == '__main__':
    sys.exit(main())
