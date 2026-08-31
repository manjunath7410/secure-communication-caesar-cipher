# UI/UX & Design System Documentation
# Secure Military Communication Platform

---

## 1. Tactical Design System Philosophy

The user interface of the **Secure Military Communication** platform is modeled after modern aerospace defense consoles and tactical command stations. It emphasizes high-contrast legibility, dense information displays, precise mathematical controls, and instantaneous feedback without distracting visual clutter.

```
+------------------------------------------------------------------------------------+
|  [SHIELD ICON] SECURE MILITARY COMM  |  VIEW: ENCRYPT  |  CLR: TOP_SECRET  |  THEME |
+-----------------------+------------------------------------------------------------+
|  [#] Operations Hub   |  ENCRYPTION STUDIO                                         |
|  [>] Encrypt Studio   |  +----------------------------------+--------------------+ |
|  [<] Decrypt Studio   |  | Plaintext Input Editor           | Shift Controls     | |
|  [*] Brute Force      |  | "ATTACK AT DAWN"                 | [Rotary Dial: 3]   | |
|  [@] Message Vault    |  |                                  | [Slider] [ROT13]   | |
|  [?] Academy / Learn  |  +----------------------------------+--------------------+ |
|  [%] Security Health  |  | Live Ciphertext Output: "DWWDFN DW GDZQ"               | |
|  [!] Settings         |  | [COPY] [SAVE TO VAULT] [TRANSMIT]                      | |
|                       |  +--------------------------------------------------------+ |
+-----------------------+------------------------------------------------------------+
|  STATUS: OPERATIONAL  |  CIPHER: CAESAR (k=3)  |  API: HEALTHY  |  LATENCY: 4ms     |
+------------------------------------------------------------------------------------+
```

---

## 2. Typographic Hierarchy

| Role | Font Family | Weights | Usage / Applied Elements |
| :--- | :--- | :--- | :--- |
| **Primary Display & UI** | `Plus Jakarta Sans`, sans-serif | 500, 600, 700, 800 | Section headers, navigation items, buttons, modal titles, badge labels |
| **Monospace / Cryptography** | `JetBrains Mono`, monospace | 400, 500, 600 | Ciphertext inputs/outputs, hex keys, JWT tokens, mathematical shift formulas |

---

## 3. Color Palette & Theming

### 3.1 Color Definitions

| Palette Swatch | Light Mode Class / Hex | Dark Mode Class / Hex | Functional Application |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `bg-neutral-50` (`#FAFAFA`) | `bg-neutral-950` (`#0A0A0A`) | Root background layer |
| **Surface Containers** | `bg-white` (`#FFFFFF`) | `bg-neutral-900` (`#171717`) | Card surfaces, modals, editors |
| **Primary Tactical Accent** | `bg-blue-600` (`#2563EB`) | `bg-blue-500` (`#3B82F6`) | Primary action buttons, active navigation indicators |
| **Tactical NATO Green** | `text-emerald-600` (`#059669`) | `text-emerald-400` (`#34D399`) | Healthy operational status, successful validations |
| **Alert Amber** | `text-amber-600` (`#D97706`) | `text-amber-400` (`#FBBF24`) | Warnings, rate-limiting notifications |
| **Defensive Crimson** | `text-red-600` (`#DC2626`) | `text-red-400` (`#F87171`) | Lockout alarms, error badges, account deletion |

### 3.2 FOUC Prevention Mechanism
To ensure zero Flash of Unstyled Content (FOUC) when switching between light and dark themes on initial page load, an inline execution script in `index.html` inspects `localStorage` and OS media queries before React mounts:

```javascript
(function() {
  try {
    var saved = localStorage.getItem('secure_comm_theme_preference');
    var isDark = false;
    if (saved === 'dark') {
      isDark = true;
    } else if (saved === 'light') {
      isDark = false;
    } else {
      isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    var root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  } catch (e) {}
})();
```

---

## 4. Key Interactive Components

1. **Rotary Shift Dial (`src/components/crypto/RotaryShiftDial.tsx`):**
   - 360-degree rotational controller enabling fluid angular drag or click selection of shift values $k \in [0, 25]$.
   - Synchronously renders the corresponding substitution alphabet mapping.
2. **App Lock Tactical Screen (`src/components/security/AppLockScreen.tsx`):**
   - Full-screen biometric and 6-digit PIN barrier with animated security shield icons, on-screen tactile keypad, and exponential lockout timer.
3. **Candidate Permutation Matrix (`src/pages/BruteForcePage.tsx`):**
   - Tabular view of all 26 shift variations with confidence score badges and copy controls.
4. **Encrypted History Vault (`src/pages/HistoryPage.tsx`):**
   - Searchable, sortable dispatch table with tag filters and deletion dialogs.
