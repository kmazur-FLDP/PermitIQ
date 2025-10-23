# PermitIQ Professional Design System

## Design Philosophy
**Professional • Clean • Modern • Data-Focused**

PermitIQ is a professional GIS data platform. The design should communicate:
- **Reliability**: Enterprise-grade data integrity
- **Clarity**: Clear information hierarchy
- **Efficiency**: Fast, intuitive workflows
- **Sophistication**: Modern professional aesthetics

---

## Color Palette

### Primary Colors
```css
--primary-blue: #1e40af      /* Blue 800 - Primary actions, headers */
--primary-blue-light: #3b82f6 /* Blue 500 - Hover states */
--primary-blue-dark: #1e3a8a  /* Blue 900 - Active states */
```

### Accent Colors
```css
--accent-cyan: #06b6d4       /* Cyan 500 - Secondary actions */
--accent-teal: #14b8a6       /* Teal 500 - Success states */
--accent-emerald: #10b981    /* Emerald 500 - Positive metrics */
```

### Neutral Palette
```css
--slate-50: #f8fafc          /* Background */
--slate-100: #f1f5f9         /* Card backgrounds */
--slate-200: #e2e8f0         /* Borders */
--slate-600: #475569         /* Body text */
--slate-700: #334155         /* Headings */
--slate-900: #0f172a         /* Dark text */
```

### Semantic Colors
```css
--success: #10b981           /* Green - Active/Success */
--warning: #f59e0b           /* Amber - Warnings */
--error: #ef4444             /* Red - Errors/Expired */
--info: #3b82f6              /* Blue - Information */
```

---

## Typography

### Font Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Scale
- **Display**: 3xl (30px) - Page titles
- **Heading 1**: 2xl (24px) - Section headers
- **Heading 2**: xl (20px) - Card titles
- **Heading 3**: lg (18px) - Sub-sections
- **Body**: base (16px) - Regular text
- **Small**: sm (14px) - Labels, captions
- **Tiny**: xs (12px) - Metadata

### Weights
- **Light**: 300 - Supporting text
- **Regular**: 400 - Body text
- **Medium**: 500 - Emphasis
- **Semibold**: 600 - Headings
- **Bold**: 700 - Strong emphasis

---

## Spacing System

Based on 4px grid:
```
2px  (0.5)  - Tight spacing
4px  (1)    - Element padding
8px  (2)    - Component padding
12px (3)    - Small gaps
16px (4)    - Standard gaps
24px (6)    - Section spacing
32px (8)    - Large spacing
48px (12)   - Page margins
```

---

## Component Styles

### Cards
```css
background: white
border: 1px solid slate-200
border-radius: 12px
box-shadow: 0 1px 3px rgba(0,0,0,0.05)
padding: 24px
transition: all 200ms
```

Hover state:
```css
box-shadow: 0 4px 12px rgba(0,0,0,0.08)
transform: translateY(-2px)
```

### Buttons

**Primary**
```css
background: linear-gradient(135deg, #1e40af, #3b82f6)
color: white
padding: 10px 20px
border-radius: 8px
font-weight: 500
box-shadow: 0 2px 4px rgba(30,64,175,0.2)
```

**Secondary**
```css
background: white
border: 1px solid slate-300
color: slate-700
padding: 10px 20px
border-radius: 8px
font-weight: 500
```

**Ghost**
```css
background: transparent
color: slate-600
padding: 10px 16px
border-radius: 6px
font-weight: 500
```

### Inputs
```css
background: white
border: 1px solid slate-300
border-radius: 8px
padding: 10px 14px
font-size: 14px
transition: all 150ms
```

Focus state:
```css
border-color: #3b82f6
ring: 2px solid rgba(59,130,246,0.1)
```

### Navigation
```css
background: white
border-bottom: 1px solid slate-200
height: 64px
box-shadow: 0 1px 3px rgba(0,0,0,0.04)
```

---

## Layout Principles

### Page Structure
```
- Navigation Bar (64px fixed)
- Page Content (flex-1)
  - Header Section (80px) - Title + actions
  - Main Content (flex-1) - Cards, tables, maps
  - Footer (optional)
```

### Grid System
- **Dashboard**: 12-column grid
- **Cards**: 2-4 columns responsive
- **Spacing**: 24px gaps between cards
- **Max Width**: 1400px for content

### Whitespace
- Generous padding in cards (24px)
- Clear visual separation between sections (32px)
- Comfortable line height (1.6 for body text)

---

## Dashboard Components

### Stat Cards
```
- White background
- Subtle border
- Icon in blue gradient circle
- Large number (2xl, bold)
- Label below (sm, slate-600)
- Hover: lift effect
```

### Charts
```
- Clean axes
- Blue color scheme (#1e40af, #3b82f6, #06b6d4)
- Grid lines: slate-200
- Labels: slate-600
- Tooltips: white bg, shadow
```

### Tables
```
- Header: slate-50 background
- Rows: hover slate-50
- Borders: slate-200
- Text: slate-700
- Padding: 12px 16px
```

---

## Map Interface

### Controls
```
- Sidebar: 320px width, white, shadow
- Buttons: Rounded (8px), clear active states
- Filters: Consistent spacing (16px)
- Labels: Uppercase (xs), medium weight, slate-600
```

### Overlays
```
- Glass morphism effect
- White background, 80% opacity
- Backdrop blur: 12px
- Border: white 40% opacity
- Shadow: subtle
```

---

## Animations

### Transitions
```css
transition-duration: 150ms (default)
transition-timing: ease-in-out
```

### Hover Effects
- Cards: translateY(-2px)
- Buttons: brightness(110%)
- Links: color transition

### Loading States
- Skeleton screens (slate-200 shimmer)
- Spinner: blue gradient
- Progress bars: blue fill

---

## Accessibility

- Minimum contrast ratio: 4.5:1
- Focus indicators: 2px blue ring
- Touch targets: minimum 44x44px
- Keyboard navigation: full support
- Screen reader labels: all interactive elements

---

## Responsive Breakpoints

```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

---

## Implementation Notes

1. **Remove glass morphism effects** - Replace with clean white cards
2. **Remove excessive gradients** - Use solid colors with subtle accents
3. **Reduce animations** - Keep only essential transitions
4. **Increase whitespace** - More breathing room
5. **Consistent shadows** - Use 3-level shadow system
6. **Professional icons** - Minimize emoji use in production UI
7. **Clean navigation** - Simple, clear hierarchy
8. **Data-first design** - Content is hero, not decoration
