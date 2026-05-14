# Design System Document: High-End Editorial

## 1. Overview & Creative North Star: "The Modern Concierge"
This design system is built to transcend the utility of standard mobile interfaces, moving instead into the realm of a high-end digital concierge. Our Creative North Star is **"The Modern Concierge"**—an aesthetic defined by editorial confidence, intentional whitespace, and a rejection of "templated" UI patterns.

To achieve a signature look, this system breaks the traditional rigid grid. We favor **intentional asymmetry**: overlapping elements, high-contrast typography scales (where massive serif headlines meet petite, widely-spaced sans-serif labels), and a "paper-on-stone" layering philosophy. The goal is a feeling of curated exclusivity where the interface recedes to let the content—and the brand's prestige—take center stage.

---

## 2. Colors & Tonal Depth
The palette is rooted in a deep, botanical Juniper Green (`primary`), punctuated by "Gold" accents (`tertiary`), and supported by a sophisticated range of "Crisp White" and mint-tinted neutrals.

### The "No-Line" Rule
To maintain a premium feel, **1px solid borders are prohibited for sectioning.** We do not use "lines" to separate ideas. Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section should sit directly against a `surface` background to create a soft, architectural break.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of fine heavy-weight paper.
- **Nesting:** Place a `surface-container-lowest` card (pure white) inside a `surface-container` section to create a natural, "lifted" feel without using a single stroke or shadow.
- **The Glass & Gradient Rule:** For floating headers or navigation bars, use **Glassmorphism**. Apply a semi-transparent `surface` color with a `backdrop-blur` of 20px. This allows the deep Juniper tones to bleed through, softening the interface.
- **Signature Textures:** Use a subtle linear gradient for primary CTAs, transitioning from `primary` (#002418) to `primary_container` (#063b2a). This provides a "satin" finish that flat color cannot replicate.

---

## 3. Typography: The Editorial Contrast
We use a high-contrast pairing to evoke the feeling of a luxury magazine.

*   **Display & Headlines (Noto Serif):** These are our "Statement" pieces. Use `display-lg` and `headline-lg` with tight tracking (-2%) to create an authoritative, editorial presence.
*   **Body & Labels (Manrope):** These provide functional clarity. Use `body-md` for legibility, and `label-md` for metadata. 
*   **The Signature Move:** Use `label-md` in all-caps with a `0.1rem` letter-spacing for category headers. This "petite" type creates a sophisticated counterpoint to the large serif headings.

---

## 4. Elevation & Depth
Elevation in this system is organic, not synthetic. We mimic natural light hitting high-quality materials.

*   **The Layering Principle:** Depth is achieved by "stacking" surface tiers. A `surface-container-highest` element should be reserved for the most interactive, "closest" elements to the user.
*   **Ambient Shadows:** When a shadow is required (e.g., for a floating action button), use an extra-diffused shadow: `blur: 24px`, `opacity: 6%`, and color it using a tinted `on-surface` (#191c1c). This mimics ambient light rather than a harsh "drop shadow."
*   **The "Ghost Border" Fallback:** If a container requires a border for accessibility (e.g., an input field), use the `outline-variant` token at **15% opacity**. A 100% opaque border is considered too "heavy" for this system.

---

## 5. Components

### Buttons
*   **Primary:** High-contrast `primary` background with `on-primary` text. Apply a `DEFAULT` (0.25rem) radius for a sharp, tailored look.
*   **Tertiary (The "Gold" Accent):** Used sparingly for "Member-Only" or "VIP" actions. Use `tertiary_fixed` with `on_tertiary_fixed`.

### Input Fields
*   **Styling:** No bottom line or heavy box. Use a `surface-container-low` background with a `Ghost Border` (outline-variant at 15%).
*   **Focus:** Transition the ghost border to `primary` at 50% opacity.

### Cards & Lists
*   **Layout:** Forbid the use of divider lines. Separate list items using `1.5` (0.5rem) of vertical whitespace.
*   **Editorial Cards:** Use asymmetrical padding. For example, use `spacing.6` on the top and `spacing.4` on the sides to create a "gallery" feel.

### Featured "Member" Carousel
A custom component utilizing a `surface-container-lowest` card with a `tertiary_fixed` (gold) "label-sm" tag in the top right. This component should use an `xl` (0.75rem) corner radius to differentiate "soft" lifestyle content from "sharp" functional UI.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use `spacing.12` and `spacing.16` to create "Breathing Room" between major sections. High-end design is defined by the space you *don't* fill.
*   **Do** overlap elements. Let an image from a `surface-container` bleed slightly into the `surface` background to break the "boxed-in" feel.
*   **Do** use the `tertiary` (Gold) palette exclusively for moments of delight, rewards, or premium status.

### Don’t:
*   **Don’t** use pure black (#000000) for text. Always use `on-surface` (#191c1c) to maintain a soft, ink-on-paper quality.
*   **Don’t** use standard "Material" ripple effects. Use a subtle opacity fade (0.9 to 1.0) for touch states to keep the interaction feel "calm."
*   **Don’t** use icons with heavy fills. Use light, "Outline" style icons with a `0.5px` or `1px` stroke weight to match the refined serif typography.