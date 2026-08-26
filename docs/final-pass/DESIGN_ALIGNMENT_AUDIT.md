# Design Alignment Audit — Pre-Fix

Source: internal design reference (not included in this repository). Tokens are implemented in `src/design/tokens.ts`.

| Token/principle | Design source | Current implementation | Discrepancy |
|---|---|---|---|
| Canvas | `#F3F0EE` | Used across pages and layout | Aligned |
| Ink | `#141413` | Used for headings and primary CTAs | Aligned |
| Signal orange | `#CF4500` / `#F37338` | Project uses `#C84A12` frequently | Slight hue mismatch |
| Floating navbar | Centered white pill below viewport top | Sticky max-width pill with rounded geometry | Aligned in grammar; spacing is tighter than source |
| Typography | MarkForMC; 450 body; tight editorial headings | Sofia/Inter fallback, frequent `font-extrabold`, small UI text | Partial |
| Radii | 20px controls, 40px major surfaces, pills | 32–40px surfaces and pills | Aligned |
| Shadows | Soft 4/24 and 24/48 atmospheric shadows | Matching shadow utilities plus inline variants | Aligned |
| Responsive nav | Pill preserved with compact hamburger | Desktop links collapse to hamburger | Aligned |
| Editorial composition | Generous spacing and restrained controls | Strong on Simulator/Detail; Dataset Lab is denser and utility-like | Partial |

The meaningful pre-fix changes should target truthfulness and state first, not a full visual rewrite.
