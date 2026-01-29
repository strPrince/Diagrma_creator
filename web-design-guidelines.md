# DigMaker Web Design Guidelines

## 1. Design Philosophy

### Core Principles
- **Clarity First**: Every element should have a clear purpose
- **Progressive Disclosure**: Show information hierarchically
- **Consistent Patterns**: Use familiar UI patterns
- **Accessibility**: WCAG 2.1 AA compliance minimum
- **Performance**: Fast load times, smooth interactions

### Visual Identity
- Modern, professional SaaS aesthetic
- Clean lines with subtle depth
- Trustworthy and approachable
- Tech-forward but not overwhelming

---

## 2. Color Palette

### Primary Colors
```css
--primary-50: #eef2ff;
--primary-100: #e0e7ff;
--primary-200: #c7d2fe;
--primary-300: #a5b4fc;
--primary-400: #818cf8;
--primary-500: #6366f1;  /* Main Primary */
--primary-600: #4f46e5;
--primary-700: #4338ca;
--primary-800: #3730a3;
--primary-900: #312e81;
```

### Secondary Colors
```css
--secondary-50: #f0f9ff;
--secondary-100: #e0f2fe;
--secondary-500: #0ea5e9;  /* Info/Cyan */
--secondary-600: #0284c7;
```

### Accent Colors
```css
--accent-violet: #8b5cf6;
--accent-fuchsia: #d946ef;
--accent-pink: #ec4899;
--accent-rose: #f43f5e;
```

### Semantic Colors
```css
--success-50: #f0fdf4;
--success-500: #22c55e;
--success-600: #16a34a;

--warning-50: #fffbeb;
--warning-500: #f59e0b;
--warning-600: #d97706;

--error-50: #fef2f2;
--error-500: #ef4444;
--error-600: #dc2626;
```

### Neutral Colors (Gray Scale)
```css
--gray-0: #ffffff;
--gray-50: #f8fafc;
--gray-100: #f1f5f9;
--gray-200: #e2e8f0;
--gray-300: #cbd5e1;
--gray-400: #94a3b8;
--gray-500: #64748b;
--gray-600: #475569;
--gray-700: #334155;
--gray-800: #1e293b;
--gray-900: #0f172a;
--gray-950: #020617;
```

### Background Colors
```css
--bg-primary: #ffffff;
--bg-secondary: #f8fafc;
--bg-tertiary: #f1f5f9;
--bg-elevated: #ffffff;
--bg-overlay: rgba(15, 23, 42, 0.8);
```

### Gradient Definitions
```css
--gradient-primary: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
--gradient-secondary: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
--gradient-accent: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%);
--gradient-dark: linear-gradient(135deg, #1e293b 0%, #334155 100%);
--gradient-mesh: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
```

---

## 3. Typography

### Font Family
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace;
--font-display: 'Inter', sans-serif;
```

### Type Scale
```css
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
--text-5xl: 3rem;        /* 48px */
```

### Font Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

### Line Heights
```css
--leading-none: 1;
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

### Typography Usage
- **Headings**: font-weight: 700; letter-spacing: -0.025em;
- **Body**: font-weight: 400; line-height: 1.6;
- **Labels**: font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
- **Code**: font-family: var(--font-mono); font-size: 0.875em;

---

## 4. Spacing System

### Base Unit: 4px
```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

---

## 5. Border Radius

```css
--radius-none: 0;
--radius-sm: 0.375rem;   /* 6px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */
--radius-2xl: 1.5rem;    /* 24px */
--radius-full: 9999px;
```

---

## 6. Shadows

```css
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
--shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
--shadow-glow: 0 0 20px rgba(99, 102, 241, 0.4);
--shadow-glow-lg: 0 0 40px rgba(99, 102, 241, 0.3);
```

---

## 7. Transitions & Animations

### Durations
```css
--duration-75: 75ms;
--duration-100: 100ms;
--duration-150: 150ms;
--duration-200: 200ms;
--duration-300: 300ms;
--duration-500: 500ms;
--duration-700: 700ms;
--duration-1000: 1000ms;
```

### Easing Functions
```css
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

### Animation Keyframes
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

---

## 8. Component Specifications

### Buttons

#### Primary Button
```css
.btn-primary {
  background: var(--gradient-primary);
  color: white;
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  transition: all var(--duration-200) var(--ease-out);
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg), var(--shadow-glow);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}
```

#### Secondary Button
```css
.btn-secondary {
  background: var(--gray-100);
  color: var(--gray-700);
  border: 1px solid var(--gray-200);
  /* ... same sizing as primary */
}

.btn-secondary:hover {
  background: var(--gray-200);
  border-color: var(--gray-300);
  transform: translateY(-1px);
}
```

#### Ghost Button
```css
.btn-ghost {
  background: transparent;
  color: var(--gray-600);
  border: 1px solid transparent;
}

.btn-ghost:hover {
  background: var(--gray-100);
  color: var(--gray-800);
}
```

### Cards

```css
.card {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  border: 1px solid var(--gray-200);
  box-shadow: var(--shadow-sm);
  padding: var(--space-6);
  transition: all var(--duration-300) var(--ease-out);
}

.card:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--gray-300);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  background: var(--bg-secondary);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: var(--gray-800);
  transition: all var(--duration-200) var(--ease-out);
  width: 100%;
}

.input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px var(--primary-100);
  background: var(--bg-primary);
}

.input::placeholder {
  color: var(--gray-400);
}
```

### Panels

```css
.panel {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  border: 1px solid var(--gray-200);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: var(--space-4) var(--space-5);
  background: linear-gradient(to right, var(--gray-50), var(--bg-primary));
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-content {
  padding: var(--space-5);
  flex: 1;
  overflow: auto;
}
```

---

## 9. Layout Guidelines

### Container
```css
.container {
  max-width: 1800px;
  margin: 0 auto;
  padding: var(--space-4);
}
```

### Grid System
- Use CSS Grid for main layouts
- Use Flexbox for component-level layouts
- Gap spacing: 16px (var(--space-4)) minimum
- Three-panel layout: 320px | 1fr | 1fr

### Responsive Breakpoints
```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

---

## 10. Accessibility Guidelines

### Focus States
- All interactive elements must have visible focus states
- Use `focus-visible` for keyboard navigation
- Focus ring: 2px solid var(--primary-500), 2px offset

### Color Contrast
- Minimum contrast ratio: 4.5:1 for normal text
- Minimum contrast ratio: 3:1 for large text
- Never rely on color alone to convey information

### Motion
- Respect `prefers-reduced-motion` media query
- Provide alternatives for animation-dependent content

### ARIA Labels
- All icon buttons must have aria-label
- Form inputs must have associated labels
- Use semantic HTML elements

---

## 11. Z-Index Scale

```css
--z-base: 0;
--z-dropdown: 100;
--z-sticky: 200;
--z-fixed: 300;
--z-modal-backdrop: 400;
--z-modal: 500;
--z-popover: 600;
--z-tooltip: 700;
--z-toast: 800;
--z-loading: 900;
```

---

## 12. Iconography

- Use Lucide icons (consistent, clean)
- Icon size: 16px (sm), 20px (md), 24px (lg)
- Stroke width: 2px
- Color: inherit from parent

---

## 13. Best Practices

### Do's
- Use CSS custom properties for theming
- Maintain consistent spacing
- Provide hover/focus states
- Use semantic HTML
- Test color contrast
- Optimize for performance

### Don'ts
- Don't use pure black (#000000)
- Don't use more than 3 font sizes in one view
- Don't use !important unless absolutely necessary
- Don't hardcode values - use CSS variables
- Don't forget mobile responsiveness

---

## 14. Dark Mode (Future)

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --bg-tertiary: #334155;
    --text-primary: #f8fafc;
    --text-secondary: #cbd5e1;
    --border-color: #334155;
  }
}
```
