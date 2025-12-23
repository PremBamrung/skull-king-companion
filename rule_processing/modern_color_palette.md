# Modern Nautical Design Guide: Skull King Companion
**Version:** 1.0  
**Theme:** Modern, Clean, High-Contrast Nautical

---

## 1. Color Palette
The modern palette uses the core colors of the board game but applies them as clean accents on neutral backgrounds.

| Category | Role | Hex Code | Usage Instruction |
| :--- | :--- | :--- | :--- |
| **Primary Background** | Soft Slate / Bone | `#F8F5F0` | Main app background; clean and easy on the eyes. |
| **Secondary Background** | Deep Navy | `#0F172A` | Header, Sidebar, or Dark Mode primary background. |
| **Primary Accent** | Oxblood Red | `#A63D33` | Action buttons (CTA), critical alerts, and brand highlights. |
| **Secondary Accent** | Deep Sea Teal | `#007A7C` | Informational badges, toggle switches, and secondary buttons. |
| **Text (Primary)** | Charcoal | `#1E293B` | Body text on light background for high readability. |
| **Text (Secondary)** | Slate Gray | `#64748B` | Subtitles, labels, and less important information. |

### Suit & Game Colors (Modernized)
*   **Parrot Green:** `#22C55E` (Vibrant Green)
*   **Chest Yellow:** `#EAB308` (Rich Gold)
*   **Map Purple:** `#A855F7` (Deep Lavender)
*   **Jolly Roger:** `#1E293B` (Dark Slate)

---

## 2. Typography
A mix of a sophisticated Serif for headers and a high-legibility Sans-serif for everything else.

### **Headers (H1, H2, H3)**
*   **Recommendation:** *Playfair Display* or *Montserrat* (Bold).
*   **Style:** Clean lines, high contrast.
*   **Usage:** Page titles and section headings.

### **Body & UI Elements**
*   **Recommendation:** *Inter* or *System UI Stack*.
*   **Style:** Regular weight, optimized for mobile screens.
*   **Usage:** Scoring tables, button text, and general instructions.

---

## 3. UI Components (Modern Style)

### **Buttons**
*   **Visual:** Rounded corners (`rounded-lg` or `rounded-full`). 
*   **Style:** Flat with subtle depth (subtle `box-shadow`) or ghost styles for secondary actions.
*   **Interaction:** Smooth transitions on hover/tap (`transition-all duration-200`).

### **Cards & Containers**
*   **Layout:** Clean White/Off-white cards with soft rounded corners.
*   **Shadow:** Large, soft blur (`shadow-xl`) to create separation.
*   **Glassmorphism:** Use `backdrop-blur-md` for overlays or fixed navigation bars to add a premium, modern feel.

### **Navigation**
*   **Desktop:** Minimalist sidebar with icon-only or icon+label.
*   **Mobile:** Floating Bottom Navigation Bar with clean line icons.

---

## 4. Visual Assets

### **Icons**
*   **Style:** Thin-line or solid-fill modern icons (e.g., **Lucide** or **Heroicons**).
*   **Thematic touch:** Use nautical symbols (Anchor, Compass, Skull) but rendered in a clean, minimalist vector style.

### **Dividers & Spacing**
*   **Approach:** Use generous white space instead of heavy line dividers.
*   **Subtle dividers:** `border-slate-100` for light mode or `border-slate-800` for dark mode.

---

## 5. Tailwind CSS Configuration

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          parchment: '#F8F5F0',
          navy: '#0F172A',
          oxblood: '#A63D33',
          teal: '#007A7C',
        },
        suit: {
          green: '#22C55E',
          yellow: '#EAB308',
          purple: '#A855F7',
          black: '#1E293B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      borderRadius: {
        'skull': '12px',
      }
    },
  },
}
```

---

### **Design Principle:** 
"Functionality first. Use the board game's color DNA to build brand recognition, but use modern UI patterns to ensure the app is fast, intuitive, and accessible."
