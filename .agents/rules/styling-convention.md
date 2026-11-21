# Styling Conventions

Follow these rules for all styling in this React project to keep component logic clean, readable, and maintainable.

## 1. No Inline Styles or In-Component Style Definitions

- **Do NOT use `style={{ ... }}`** on JSX elements for static layout, spacing, colors, typography, or transitions.
- **Do NOT define `<style>` tags** inside `.tsx` / `.jsx` component files.
- **Do NOT declare `const styles = { ... }` objects** inside component files.
- **Exception (Dynamic Runtime Values Only):** Inline `style` is allowed only for values computed at runtime that cannot be expressed in static CSS (e.g., drag coordinates, virtualized scroll offsets, dynamic widths). Prefer passing dynamic values via CSS custom properties (e.g., `style={{ '--progress': `${percent}%` } as React.CSSProperties}`) and keeping all layout/visual rules in CSS.

## 2. Co-located Stylesheet Files

- Place component and feature styles in a co-located **CSS Module** using `kebab-case` with the `.module.scss` extension (`<component-name>.module.scss`):
  - **All** component and feature stylesheets must use `.module.scss` (e.g., `action-button-group.module.scss`, `content-tabs.module.scss`) so class names are locally scoped and naming stays consistent across `src/components/` and `src/features/`.
  - Do **not** create plain `*.scss` or `*.css` files inside `src/components/` or `src/features/`. Global stylesheets without `.module.scss` belong only in `src/styles/` (e.g., `variables.scss`, `global.css`).
  - When targeting third-party selectors (`antd`, `ag-grid`) inside a `.module.scss` file, scope them under a local module class using `:global(...)`.
- Keep `@keyframes`, pseudo-classes (`:hover`, `:focus`, `:disabled`), media queries, and state variants in the stylesheet—never in JSX.

## 3. Design Tokens & Theme Consistency

- Reuse CSS custom properties from `src/styles/` (`variables.css`, `colors.css`, `semantic-colors.css`, `typography.css`) instead of hardcoding hex colors, font sizes, radii, or spacing values.
- When styling Ant Design (`antd`) overrides, scope them under a component/module class rather than global element selectors.

## 4. Conditional & State Styling

- Toggle appearance using CSS classes or `data-*` attributes (e.g., `data-state="completing"` or conditional class names) instead of ternary expressions inside `style={{ ... }}`.
- For simple, short layout utilities (e.g., `flex items-center gap-2`), Tailwind utility classes are acceptable; extract to a CSS Module class if the class list grows long or repeats.
