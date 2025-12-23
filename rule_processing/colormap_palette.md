# Design Guide: Skull King Companion App
**Version:** 1.0  
**Theme:** Skeuomorphic Nautical Vintage (The "Captain’s Log" Aesthetic)

---

## 1. Color Palette
The palette is rooted in weathered, organic tones. It prioritizes "materiality" over flat digital colors.

| Category | Role | Hex Code | Usage Instruction |
| :--- | :--- | :--- | :--- |
| **Primary Background** | Parchment | `#E6D5B8` | Main app background; use with a subtle paper grain texture. |
| **Secondary (Border)** | Weathered Wood | `#4E3629` | App-wide frames, container borders, and navigation bars. |
| **Accent (Action)** | Oxblood Red | `#A63D33` | Primary Call-to-Action (CTA) buttons and critical warnings. |
| **Accent (Info)** | Deep Sea Teal | `#007A7C` | "Captain’s Log" tips, score highlights, and active state indicators. |
| **Text (Primary)** | Ink Black | `#1A1A1A` | All body text; should look like dried ink on parchment. |
| **Text (Header)** | Deep Wood | `#3E2723` | Large titles and section headers. |

### Suit & Game Colors
*   **Parrot Green:** `#3A7D44`
*   **Chest Yellow/Gold:** `#E5B22E`
*   **Map Purple:** `#6D4A8D`
*   **Jolly Roger Black:** `#1A1A1B`

---

## 2. Typography
The hierarchy follows a "Triple-Font" strategy to balance theme with high legibility on mobile screens.

### **Primary Headers (H1, H2)**
*   **Recommendation:** *Cinzel Decorative* or *Vollkorn SC* (All-Caps).
*   **Style:** Bold, heavy Slab Serif.
*   **Feel:** Carved, authoritative, 18th-century printing.
*   **Usage:** Page titles (e.g., "BIDDING", "THE DECK").

### **Sub-headers & Labels**
*   **Recommendation:** *Crimson Text* or *EB Garamond*.
*   **Style:** Bold Serif with high tracking (letter spacing).
*   **Feel:** Historical, clean, professional.
*   **Usage:** Card names, player names, table headers.

### **Flavor & Callout Text**
*   **Recommendation:** *Dancing Script* or *Pinyon Script*.
*   **Style:** Humanist Italic/Script.
*   **Feel:** Handwritten margin notes from a captain’s journal.
*   **Usage:** "Pro-tips," flavor quotes, or the "Journal de Bord" sections.

---

## 3. UI Components

### **Buttons (The "Brushstroke" Style)**
*   **Visual:** Do not use perfectly rounded or sharp rectangular buttons. Use an SVG mask that mimics a **painterly brushstroke**.
*   **Primary CTA:** Oxblood Red (`#A63D33`) with white serif text.
*   **Secondary CTA:** Deep Sea Teal (`#007A7C`) with white serif text.
*   **Interaction:** On hover/press, add a subtle "ink-bleed" (slight glow or expansion of the brushstroke).

### **Containers (The "Artifact" Box)**
*   **Background:** Slightly lighter parchment (`#F2EFE9`).
*   **Border:** 4px – 8px thick wood-grain border.
*   **Corners:** Use "Metallic Corner Brackets" (Gold `#C5A059`) as decorative absolute-positioned elements in the four corners.
*   **Shadow:** Heavy, soft drop shadow to suggest the container is a physical object resting on a table.

### **Navigation (Ribbon Tabs)**
*   **Design:** Use a "Ribbon" or "Bookmark" shape (`<path>` with a notched bottom).
*   **Placement:** Fixed to the top-right or left-hand side, overlapping the main content area.
*   **Colors:** Royal Purple (`#702963`) for scoring, Nautical Blue (`#2B547E`) for game rules.

### **Card Components**
*   **Layout:** "Double-fringe" layout. Numerical values must be in the top-left and bottom-right.
*   **Style:** White "Polaroid" border inside the main suit color frame.
*   **Art:** High-saturation digital paintings with a "watercolor wash" overlay.

---

## 4. Visual Assets & Motifs

### **Icons**
*   **Style:** Hand-drawn ink hatching. Symbols should look stamped or etched.
*   **Frames:** Always encase icons in circular or ornamental "porthole" frames.
*   **Key Symbols:**
    *   **Crossed Daggers:** Use as section dividers.
    *   **Anchors:** Reset/Home button.
    *   **Skull & Crossbones:** Game Over/Skull King specific UI.
    *   **Compass Rose:** Directional indicators or "Next Phase" transitions.

### **Decorative Elements**
*   **The "Splatter":** Use semi-transparent red or teal watercolor splatters as backgrounds for "Alert" or "Winning" states.
*   **Dividers:** Instead of `<hr>`, use an SVG of a nautical rope or two crossed daggers.
*   **Texture Overlays:** Apply a global low-opacity noise filter to the app to simulate physical paper texture.

---

## 5. CSS / Tailwind Configuration

To implement this theme, extend your `tailwind.config.js` and use custom utilities for the skeuomorphic effects.

### **tailwind.config.js**
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        parchment: {
          light: '#F4E4BC',
          DEFAULT: '#E6D5B8',
          dark: '#DCC7A1',
        },
        wood: '#4E3629',
        oxblood: '#A63D33',
        teal: '#007A7C',
        ink: '#1A1A1A',
        gold: '#D4AF37',
      },
      fontFamily: {
        header: ['Cinzel Decorative', 'serif'],
        body: ['EB Garamond', 'serif'],
        script: ['Dancing Script', 'cursive'],
      },
      backgroundImage: {
        'paper-texture': "url('/assets/textures/parchment_grain.png')",
        'wood-frame': "url('/assets/textures/dark_oak_grain.jpg')",
      }
    },
  },
}
```

### **Custom Utility Suggestions**
*   **Paper Shadow:** `shadow-[0_10px_30px_rgba(0,0,0,0.5)]`
*   **Rough Edge Mask:** Create a CSS `mask-image` using a grainy SVG to ensure buttons don't have perfect "digital" edges.
*   **Ink Bleed Text:** Use a very slight `text-shadow` (e.g., `text-shadow: 0.5px 0.5px 1px rgba(26,26,26,0.3)`) to simulate ink soaking into paper.
*   **Wood Frame Border:** 
    ```css
    .wood-border {
      border: 12px solid transparent;
      border-image: url('wood-texture.jpg') 30 round;
    }
    ```

---

### **UX Lead Note:** 
"Prioritize **texture over flat color**. Every background should have a grain, every line should have a slight 'ink-bleed' or jitter, and primary navigation should feel like physical objects rather than digital buttons."