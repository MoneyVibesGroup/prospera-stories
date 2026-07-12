# Prospera — Design System (Fondation)

> Plateforme d'assurance & de finance.
> **Confiance · Simplicité · Professionnalisme.**

**Version :** 1.1 — Fondation + système de thème
**Couleurs de marque :** Orange `#FF6633` · Noir `#070707`
**Date :** 2026-07-09
**Autrice :** Sally (UX Designer, BMad)
**Pile :** Next.js 16 · React 19 · Tailwind CSS v4 (CSS-first) · shadcn/ui · Lucide
**Implémentation :** `prospera-frontend-expert-comptable/src/app/globals.css`

Ce document est la **source de vérité** de la fondation visuelle de Prospera. Il décrit
l'intention ; le fichier `globals.css` en est l'implémentation exécutable. Les deux doivent
rester synchronisés.

---

## 1. Identité de marque

### 1.1 Positionnement
Prospera est une plateforme financière et assurantielle moderne, utilisée par quatre profils
aux besoins très différents :

| Profil | Attente principale envers l'UI |
|---|---|
| **Clients** | Clarté, réassurance, zéro jargon. Comprendre son contrat et payer en confiance. |
| **Agents d'assurance** | Rapidité, densité maîtrisée, efficacité au quotidien. |
| **Courtiers** | Comparaison, multi-dossiers, vue d'ensemble. |
| **Administrateurs** | Contrôle, tables denses, données fiables et traçables. |

### 1.2 Principes de conception
1. **La confiance avant tout.** Sobriété, alignement, contrastes accessibles. Rien de
   « criard » : la couleur est un signal, jamais une décoration.
2. **La simplicité est une fonctionnalité.** Une action primaire évidente par écran. On
   réduit la charge cognitive, on ne l'ajoute pas.
3. **Le professionnalisme se mesure.** Chiffres alignés (`tabular-nums`), typographie
   lisible, espacements réguliers. La rigueur visuelle inspire la rigueur perçue.
4. **Accessible par défaut, pas en option.** WCAG 2.2 AA est le plancher, pas l'objectif.

### 1.3 Personnalité visuelle
- **Orange Prospera `#FF6633`** (primaire) : énergie, optimisme, prospérité, chaleur,
  accessibilité. C'est le signal d'action et l'accent de marque.
- **Noir Prospera `#070707`** (fondation) : autorité, sophistication, sérieux. Sert de
  couleur de texte principale, de fond du thème sombre et de la barre de navigation.
- **Neutres chauds (Stone)** : le support professionnel, discret, qui laisse respirer et
  s'accorde à l'orange (neutre chaud plutôt que gris froid).
- **Émeraude** : réservée à l'état *succès* (le vert reste universellement compris).
- Formes : arrondis **modérés** (10 px), ombres **chaudes et diffuses**, pas d'effets
  tape-à-l'œil (pas de dégradés saturés, pas de néon, pas de skeuomorphisme).

> **Confiance par la sobriété + l'affirmation.** L'orange est puissant : on l'utilise avec
> parcimonie (actions, accents, points de focus), sur une base généreuse de blanc/noir/neutres.
> Une interface « toute orange » trahirait la valeur de confiance — l'orange est un **signal**,
> jamais un aplat de fond.

**Signature visuelle :** barre de navigation **noire** avec états actifs **orange** — un motif
mémorable qui incarne les deux couleurs de marque (tokens `sidebar-*`).

---

## 2. Architecture des tokens

Trois couches, une seule règle : **les composants ne consomment que la couche sémantique.**

```
 1. PRIMITIVES        --brand-blue-600, --brand-slate-100 …   (palette brute)
        │  ne jamais utiliser directement en composant
        ▼
 2. SÉMANTIQUE        --primary, --border, --muted-foreground, --success …
        │  = rôle. Réagit au thème clair/sombre.
        ▼
 3. EXPOSITION        @theme inline → classes utilitaires Tailwind
        │  bg-primary · text-muted-foreground · rounded-lg · shadow-md
        ▼
   COMPOSANTS         <Button className="bg-primary text-primary-foreground" />
```

**Pourquoi ?** Rebrander revient à changer la couche 1. Basculer clair/sombre revient à
changer la couche 2. Les composants ne bougent jamais.

---

## 3. Palette de couleurs

### 3.1 Primitives de marque

**Prospera Orange — Primaire (`#FF6633`)**

| Token | Hex | Usage type |
|---|---|---|
| `--brand-orange-50` | `#fff4ef` | fonds très discrets, surlignage |
| `--brand-orange-100` | `#ffe6da` | badges, fonds sélectionnés |
| `--brand-orange-500` | **`#ff6633`** | **couleur de marque · fonds d'action, accents, focus** |
| `--brand-orange-600` | `#ea580c` | anneau de focus, hover sur fond clair (AA ≥ 3:1) |
| `--brand-orange-700` | `#c2410c` | **texte / liens orange sur fond clair (AA ≥ 4.5:1)** |
| `--brand-orange-950` | `#431407` | teintes profondes |

> ⚠️ **Contraste de l'orange** : `#FF6633` est trop clair pour du texte **blanc**
> (≈ 2,9:1 — échoue AA). Deux règles :
> - **Fond orange + texte NOIR** `#070707` (≈ 6,9:1 ✓) → c'est le bouton primaire.
> - **Texte orange sur fond clair** → utiliser `--brand-orange-700` (`#c2410c`), pas le 500.

**Prospera Noir & neutres chauds (Stone)**

| Token | Hex | Usage type |
|---|---|---|
| `--brand-neutral-950` | **`#070707`** | **noir de marque · texte principal, fond sombre, nav** |
| `--brand-neutral-500` | `#78716c` | texte sourdine (AA ≥ 4,5:1 sur blanc) |
| `--brand-neutral-200` | `#e7e5e4` | bordures, séparateurs |
| `--brand-neutral-100` | `#f5f5f4` | surfaces secondaires, survols |
| `--brand-neutral-50` | `#fafaf9` | fonds très clairs |

Échelle complète `--brand-neutral-50 → 950` (Stone, gris **chaud** accordé à l'orange).

**Émeraude** — réservée au **succès** : `--brand-emerald-600` `#059669`.

### 3.2 Tokens sémantiques

Chaque token existe en **clair** et **sombre** (voir `globals.css`). Chaque couple
`X` / `X-foreground` est **garanti lisible** (contraste AA du texte sur son fond).

| Rôle | Token | Clair | Utilité |
|---|---|---|---|
| Fond app | `background` / `foreground` | blanc / noir `#070707` | canvas + texte |
| Carte | `card` / `card-foreground` | blanc / noir | surfaces surélevées |
| Popover | `popover` / … | blanc / noir | menus, tooltips |
| **Primaire** | `primary` / `primary-foreground` | **orange `#FF6633` / noir** | CTA, accents |
| Secondaire | `secondary` / … | stone-100 / stone-800 | boutons secondaires |
| Sourdine | `muted` / `muted-foreground` | stone-100 / stone-500 | textes tertiaires, aides |
| Accent (neutre) | `accent` / … | stone-100 / stone-800 | survols/sélections |
| **Succès** | `success` / … | emerald-600 / blanc | payé, validé, actif |
| **Alerte** | `warning` / … | amber-500 / noir | échéance proche, attention |
| **Info** | `info` / … | bleu-600 / blanc | information neutre |
| **Danger** | `destructive` / … | rouge-600 / blanc | suppression, rejet KYC, erreur |
| Bordure | `border` | stone-200 | traits, séparateurs |
| Champ | `input` | stone-200 | contours de formulaire |
| Focus | `ring` | orange-600 | anneau de focus visible |
| **Sidebar** | `sidebar-*` | **noir `#070707` + accents orange** | navigation (signature) |

> ⚠️ **Piège shadcn :** le token `accent` est un **neutre de survol**, PAS l'orange de
> marque. Pour l'orange, utilisez `primary` ; pour l'échelle brute, `bg-brand-500`.

> 🎨 **Ambre ≠ Orange.** Le `warning` est en **ambre `#f59e0b`** (plus jaune) pour rester
> distinct de l'orange de marque. Ne jamais utiliser l'orange primaire comme couleur d'alerte.

### 3.3 Échelle de marque exposée
`bg-brand-50 … bg-brand-950` sont disponibles (`bg-brand-500` = `#FF6633`) pour les tints
ponctuels. **Préférer toujours `bg-primary`** dans les composants.

### 3.4 Dataviz
Palette catégorielle de 5 teintes (`--chart-1 → 5` : orange, teal, bleu, violet, rose —
volontairement bien séparées), éclaircie en thème sombre. Suivre la skill **dataviz**.

### 3.5 Contraste (WCAG 2.2)
- Texte normal (< 18,66 px / 24 px gras) : **≥ 4,5:1**.
- Texte large / composants d'UI & états de focus : **≥ 3:1**.
- Points de vigilance propres à cette palette :
  - `primary` (orange) porte **toujours** un texte **noir**, jamais blanc.
  - Texte orange sur fond clair → `--brand-orange-700`.
  - `ring` = orange-600 (≥ 3:1 sur blanc) pour un focus visible.
- **La couleur n'est jamais le seul vecteur d'information** : toujours doubler d'une icône,
  d'un libellé ou d'un motif (ex. badge « Rejeté » = rouge **+** icône + texte).

---

## 4. Typographie

- **Interface :** **Inter** (`--font-inter`) — neutre, institutionnelle, chiffres très
  lisibles. Fallback : `ui-sans-serif, system-ui, Segoe UI, Roboto…`.
- **Monospace :** **Geist Mono** (`--font-geist-mono`) — références de contrat, identifiants,
  code.
- **Chiffres tabulaires :** `tabular-nums` activé sur les montants et tableaux → les
  colonnes de primes/échéances s'alignent parfaitement.

### Échelle

| Token | Taille / interligne | Rôle |
|---|---|---|
| `text-5xl` | 48 / 1.1 | Display (marketing, héros) |
| `text-4xl` | 36 / 40 | H1 |
| `text-3xl` | 30 / 36 | H2 |
| `text-2xl` | 24 / 32 | H3 |
| `text-xl` | 20 / 30 | H4 |
| `text-lg` | 18 / 28 | Sous-titre, intro |
| `text-base` | 16 / 24 | **Corps (défaut)** |
| `text-sm` | 14 / 20 | Libellés, textes d'aide |
| `text-xs` | 12 / 16 | Mentions légales, badges |

### Graisses
`normal 400` (corps) · `medium 500` (libellés, boutons) · `semibold 600` (titres, montants
clés) · `bold 700` (H1–H2, chiffres mis en avant). **On évite `light` (< 400)** : nuit à la
lisibilité et à la perception de sérieux.

### Règles
- Base **16 px**, jamais en dessous pour du corps de texte.
- Longueur de ligne cible : **60–75 caractères** (`max-w-prose` / `max-w-xl`).
- Un seul `<h1>` par page ; hiérarchie de titres jamais sautée (a11y).

---

## 5. Espacement

Échelle Tailwind par défaut, **base 4 px** (`0.25rem`). Rythme de l'interface :

| Pas | px | Emploi |
|---|---|---|
| `1` | 4 | interstice icône/texte |
| `2` | 8 | padding interne dense |
| `3` | 12 | gap de formulaire |
| `4` | 16 | **padding standard de carte / gap par défaut** |
| `6` | 24 | séparation de blocs |
| `8` | 32 | sections |
| `12` | 48 | grands blocs |
| `16` | 64 | respirations de page |

**Règle des 8 :** privilégier les multiples de 8 (`2, 4, 6, 8…`) pour le rythme vertical ;
`1` et `3` réservés au micro-ajustement. Padding vertical de page recommandé : `py-6`
(mobile) → `py-8`/`py-12` (desktop).

---

## 6. Rayons (radius)

Dérivés d'une base unique `--radius: 0.625rem` (10 px).

| Classe | Valeur | Emploi |
|---|---|---|
| `rounded-sm` | 6 px | badges, tags, inputs denses |
| `rounded-md` | 8 px | boutons, champs |
| `rounded-lg` | 10 px | **cartes (défaut)** |
| `rounded-xl` | 14 px | modales, grands conteneurs |
| `rounded-2xl` | 22 px | surfaces héro |
| `rounded-full` | ∞ | avatars, pastilles, switches |

Arrondi **modéré** : assez doux pour être moderne, assez sobre pour rester institutionnel.

---

## 7. Élévation & ombres

Ombres à **teinte ardoise froide** (`rgb(15 23 42 / …)`), jamais du noir pur → rendu premium
et discret. L'élévation traduit une **hiérarchie**, pas une décoration.

| Classe | Niveau | Emploi |
|---|---|---|
| `shadow-xs` | 0 | inputs, séparation ténue |
| `shadow-sm` | 1 | **cartes au repos** |
| `shadow-md` | 2 | cartes survolées, dropdowns |
| `shadow-lg` | 3 | popovers, menus flottants |
| `shadow-xl` | 4 | modales / dialogues |
| `shadow-2xl` | 5 | overlays plein écran, spotlights |

**Règles :** au plus **un** niveau d'élévation dominant par zone visuelle ; en thème sombre,
la hiérarchie passe surtout par la **luminosité de surface** (`card` plus clair que
`background`), l'ombre devenant secondaire.

---

## 8. Icônes

- **Bibliothèque :** **Lucide** (`lucide-react`), déjà installée. Cohérente avec shadcn/ui.
- **Style :** contour (stroke), trait **1.5–2 px**, jamais pleines/multicolores.
- **Tailles :** `16` (inline/dense) · `20` (**défaut boutons/champs**) · `24` (titres,
  navigation) · `32+` (états vides, onboarding).
- **Couleur :** hérite de `currentColor` → suit le token de texte du contexte.
- **Accessibilité :** icône décorative → `aria-hidden="true"` ; icône porteuse de sens sans
  texte → `aria-label` explicite. Cible tactile **≥ 44×44 px** (padding, pas taille du glyphe).
- **Cohérence sémantique :** un concept = une icône (ex. `ShieldCheck` = contrat couvert,
  `FileText` = document, `CircleAlert` = attention). Tenir un mini-lexique lors des pages.

---

## 9. Grille & mise en page

- **Conteneur max :** `--container-max` = **1280 px** (`max-w-7xl mx-auto`).
- **Gouttières de page :** `px-4` (mobile) → `px-6` (tablette) → `px-8` (desktop).
- **Grille :** CSS Grid / Flexbox via Tailwind. Grille de contenu de référence **12 colonnes**
  (`grid-cols-12`, `gap-6`) sur desktop ; empilement 1 colonne sur mobile.
- **Layout applicatif type** (agents/courtiers/admins) : barre latérale
  (tokens `sidebar-*`) + zone de contenu ; la sidebar se replie sous `lg`.
- **Densité :** interfaces client = aérées ; consoles agent/admin = plus denses, mais le pas
  d'espacement et les tokens restent identiques (on change les valeurs, pas le système).

---

## 10. Breakpoints responsives

**Mobile-first** : on style le mobile par défaut, on ajoute les préfixes vers le haut.

| Préfixe | Largeur | Cible |
|---|---|---|
| *(base)* | < 640 px | mobile |
| `sm:` | ≥ 640 px | grand mobile / petite tablette |
| `md:` | ≥ 768 px | tablette |
| `lg:` | ≥ 1024 px | laptop / poste agent |
| `xl:` | ≥ 1280 px | desktop large |
| `2xl:` | ≥ 1536 px | postes admin larges |

Bascules structurantes attendues : navigation (drawer → sidebar) à `lg` ; tableaux denses
(admin) → cartes empilées sous `md`.

---

## 11. Accessibilité (WCAG 2.2 AA — plancher)

- **Contraste :** cf. §3.4. Tous les couples `token/foreground` sont conformes en clair et
  sombre.
- **Focus :** anneau `ring` (orange-600) **2 px + offset 2 px**, visible sur `:focus-visible`
  partout. Jamais `outline: none` sans remplacement.
- **Clavier :** tout est atteignable et actionnable au clavier ; ordre de tabulation logique ;
  focus jamais piégé (hors modale gérée).
- **Cibles tactiles :** **≥ 44×44 px**.
- **Sémantique :** HTML natif d'abord (`<button>`, `<nav>`, `<label>`), ARIA seulement en
  complément. Un `<h1>` par page, hiérarchie de titres continue.
- **Mouvement :** `prefers-reduced-motion` respecté globalement (animations neutralisées).
- **Couleur + X :** l'information n'est jamais portée par la seule couleur (icône/texte/motif
  systématiques).
- **Formulaires :** chaque champ a un `<label>` lié ; erreurs décrites en texte + `aria-invalid`
  + `aria-describedby`, jamais uniquement en rouge.
- **Langue :** `lang="fr"` sur `<html>`.

---

## 12. Conventions de nommage

| Élément | Convention | Exemple |
|---|---|---|
| Primitive de couleur | `--brand-{teinte}-{échelle}` | `--brand-orange-500` |
| Token sémantique | `--{rôle}` / `--{rôle}-foreground` | `--primary` / `--primary-foreground` |
| État | `success` · `warning` · `info` · `destructive` | `bg-warning` |
| Variable de police | `--font-{nom}` | `--font-inter` |
| Fichier composant | `PascalCase.tsx` | `PolicyCard.tsx` |
| Composant shadcn (ui) | `kebab-case.tsx` dans `components/ui/` | `button.tsx` |
| Prop booléenne | `is/has/can + Adjectif` | `isLoading`, `hasError` |
| Variante de composant | nom sémantique, pas visuel | `variant="destructive"` (pas `"red"`) |
| Classe utilitaire | tokens sémantiques d'abord | `bg-primary` (pas `bg-blue-600`) |

**Règle d'or :** en composant, on nomme par **rôle/intention**, jamais par apparence. On écrit
`text-muted-foreground`, pas `text-stone-500` ; `bg-primary`, pas `bg-brand-500` ni
`bg-[#FF6633]` ; `variant="destructive"`, pas `variant="red"`. Le jour où la marque évolue,
rien à réécrire.

---

## 13. Cartographie des fichiers

| Fichier | Rôle |
|---|---|
| `src/app/globals.css` | **Tokens** (3 couches) + base + import Tailwind/animations |
| `src/app/layout.tsx` | Polices (Inter, Geist Mono), `lang="fr"`, `ThemeProvider` |
| `components.json` | Config shadcn/ui (style *new-york*, base *slate*, icônes *lucide*) |
| `src/lib/utils.ts` | Helper `cn()` (clsx + tailwind-merge) |
| `src/components/theme-provider.tsx` | Provider `next-themes` (stratégie `class`) |
| `src/components/mode-toggle.tsx` | Bascule clair/sombre (Lucide, tokens uniquement) |
| `src/components/ui/*` | **Socle shadcn/ui** (11 composants, cf. §15) |
| `docs/prospera-design-system.md` | **Ce document** — source de vérité |

**Dépendances installées :** `clsx`, `tailwind-merge`, `class-variance-authority`,
`lucide-react`, `tw-animate-css`, `next-themes`.

> Note `components.json` : `baseColor: "slate"` est la valeur écrite par le CLI shadcn ;
> elle n'affecte que la génération de nouveaux composants. La palette réelle de Prospera est
> définie par les tokens de `globals.css` (neutres **stone** + orange), qui priment.

---

## 14. Comment utiliser cette fondation

```bash
# Ajouter un composant shadcn (héritera automatiquement des tokens Prospera)
npx shadcn@latest add button card input badge dialog
```

```tsx
// Un composant consomme UNIQUEMENT des tokens sémantiques :
import { cn } from "@/lib/utils";

<button
  className={cn(
    "inline-flex h-10 items-center gap-2 rounded-md px-4",
    "bg-primary text-primary-foreground shadow-sm",
    "hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  )}
>
  Souscrire
</button>
```

La bascule de thème est déjà en place : `<ModeToggle />` s'importe depuis
`@/components/mode-toggle` (fond `card`, focus AA, cible 44 px, tokens uniquement).

### Prochaines étapes recommandées (hors périmètre « fondation »)
1. ~~`ThemeProvider` + bascule clair/sombre~~ ✅ **livré** (`next-themes`, stratégie `class`).
2. ~~Générer le socle de composants shadcn~~ ✅ **livré** (voir §15).
3. Définir des **variantes de composants** métier (CVA) au-dessus du socle (ex. `PolicyCard`,
   `StatusBadge`, `AmountCell`).
4. Page de démonstration interne « Design System » (styleguide vivant) — quand on passera aux
   pages.

---

## 15. Socle de composants (shadcn/ui)

Composants générés dans `src/components/ui/`, câblés sur les tokens Prospera (aucune couleur
en dur). Ajoutés via `npx shadcn@latest add …`.

| Composant | Fichier | Notes Prospera |
|---|---|---|
| Button | `ui/button.tsx` | variant `default` = **orange + noir** ; `link` = `text-link` (corrigé, cf. ci-dessous) |
| Badge | `ui/badge.tsx` | idem ; utiliser pour les statuts (payé / en attente / rejeté) |
| Card | `ui/card.tsx` | surface `card`, ombre `shadow-sm` au repos |
| Input | `ui/input.tsx` | bordure `input`, focus `ring` (orange) |
| Label | `ui/label.tsx` | à lier à chaque champ (a11y) |
| Select | `ui/select.tsx` | Radix, thémé |
| Dialog | `ui/dialog.tsx` | overlay + `shadow-xl` |
| Dropdown Menu | `ui/dropdown-menu.tsx` | menus d'actions |
| Table | `ui/table.tsx` | `tabular-nums` hérité pour les montants |
| Form | `ui/form.tsx` | **React Hook Form + Zod** (`@hookform/resolvers`) — messages d'erreur a11y |
| Sonner (toasts) | `ui/sonner.tsx` | notifications, suit le thème via `next-themes` |

**Correctif d'accessibilité appliqué :** les variantes `link` de `Button` et `Badge` livrées
par shadcn utilisaient `text-primary` (orange `#FF6633` → ~2,9:1 sur fond clair, échoue AA).
Elles pointent désormais vers le **token `--link`** (orange-700 en clair, orange-400 en
sombre) → conforme AA dans les deux thèmes. Règle : **jamais `text-primary` pour du texte de
lien** ; utiliser `text-link`.

**Dépendances ajoutées par le socle :** `radix-ui`, `react-hook-form`, `zod`,
`@hookform/resolvers`, `sonner`.

### Ajouter d'autres composants
```bash
npx shadcn@latest add checkbox radio-group tabs tooltip sheet avatar --yes
```
Ils hériteront automatiquement des tokens. **Après chaque ajout**, vérifier qu'aucune variante
n'utilise `text-primary`/`bg-primary` pour du **texte** de premier plan sur fond clair (piège
de contraste propre à l'orange vif).
