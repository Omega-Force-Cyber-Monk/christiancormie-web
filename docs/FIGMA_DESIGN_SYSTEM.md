# Figma Design System Reference

Inspected 14 October 2026. This document supports [AGENTS.md](../AGENTS.md).
It records exported values and unresolved relationships; it does **not** approve a
brand mode, activate a theme, generate tokens, or authorize global styling changes.
The supplied full-page SVG governs page-specific visual details under the authority
order in AGENTS.md. Inspect the relevant original JSON for component-specific work.

## 1. Export inventory

All nine files parse as JSON. Paths below are original export filenames.
Counts include repeated values across modes, not 1,489 unique design properties.

| Export                                                                                    | Mode       | Token entries | Types          |
| ----------------------------------------------------------------------------------------- | ---------- | ------------- | -------------- |
| [1. Color modes/Dark mode.tokens.json](<../figma/1. Color modes/Dark mode.tokens.json>)   | Dark mode  | 304           | color          |
| [1. Color modes/Light mode.tokens.json](<../figma/1. Color modes/Light mode.tokens.json>) | Light mode | 304           | color          |
| [2. Radius/Mode 1.tokens.json](<../figma/2. Radius/Mode 1.tokens.json>)                   | Mode 1     | 11            | number         |
| [3. Spacing/Mode 1.tokens.json](<../figma/3. Spacing/Mode 1.tokens.json>)                 | Mode 1     | 17            | number         |
| [4. Widths/Mode 1.tokens.json](<../figma/4. Widths/Mode 1.tokens.json>)                   | Mode 1     | 12            | number         |
| [5. Containers/Value.tokens.json](<../figma/5. Containers/Value.tokens.json>)             | Value      | 3             | number         |
| [6. Typography/Value.tokens.json](<../figma/6. Typography/Value.tokens.json>)             | Value      | 32            | string, number |
| [_Primitives/Mode.tokens.json](../figma/_Primitives/Mode.tokens.json)                     | Mode       | 403           | color, number  |
| [_Primitives/Style.tokens.json](../figma/_Primitives/Style.tokens.json)                   | Style      | 403           | color, number  |

Primitive sets each contain 371 color and 32 numeric spacing tokens. Color modes
have identical 304 token paths each. Remaining exports contain 11 radii, 17 spacing
values, 12 widths, 3 containers and 32 typography values.

## 2. Approval and alias findings

- The only primitive value differences between Mode and Style are the 12
  `Colors/Brand/*` colors. Mode Brand/500 is `#8A2BE2`; Style Brand/500 is
  `#FF6B35`. Both also contain Base/Primary `#FF5733` and Primary Foundation/500
  `#FF6B4A`; these are distinct exported roles.
- Light mode has 256 primitive alias metadata entries. All targets resolve by
  name in both primitive exports; concrete values have zero mismatches against
  Style and 48 against Mode.
- Dark mode has 264 primitive alias metadata entries. 242 resolve by name with
  zero concrete-value mismatches against Style and 21 against Mode. The other
  22 target `Colors/Base/transparent`, absent from both primitive exports.
- Semantic alignment with Style is confirmed where targets resolve by name;
  selecting Style as the approved palette is still a user/design decision.
- Cross-collection target variable IDs do not match IDs in the supplied primitive
  exports. Do not assume those metadata IDs are a portable local alias graph.
  Concrete `$value` data is present; missing metadata targets do not make the
  entire export unusable.
- All 4 light and 18 dark local `{...}` references resolve within their own export,
  with no cycles found. Distinguish these from Figma alias metadata.
- Spacing, width and container metadata targets resolve by name and match both
  primitive exports. Do not normalize names before resolving references: names
  include spaces, parentheses and a Unicode dot (U+2024).

Until approval, retain the existing palette and report conflicts. An SVG-specific
color may be scoped to its page; it does not redefine shared tokens. Do not repair
exports or implement a generation pipeline during ordinary static-page work.

## 3. Primitive colors

### Base colors

Identical in Mode and Style. Case and spelling are preserved.

| Token path                      | Mode + Style |
| ------------------------------- | ------------ |
| `Colors/Base/Primary`           | `#FF5733`    |
| `Colors/Base/Secondary`         | `#2ED3D1`    |
| `Colors/Base/Secondary Surface` | `#121826`    |
| `Colors/Base/Surface 2`         | `#1B2233`    |
| `Colors/Base/Card`              | `#242D42`    |
| `Colors/Base/Text Primary`      | `#FFFFFF`    |
| `Colors/Base/Text Secondary`    | `#B8C1D1`    |
| `Colors/Base/Muted Text`        | `#7C8799`    |
| `Colors/Base/Disable text`      | `#5A6475`    |
| `Colors/Base/white`             | `#FAFAFA`    |
| `Colors/Base/black`             | `#0A0A0A`    |

### Complete primitive palette scales

A cell's exact token path is its Palette path plus `/` plus its column's exported
shade name. Non-Brand rows match in both exports. Both unapproved Brand modes are
listed. Gray alpha values include opacity.

| Palette path                    | Export       | 25                     | 50                     | 100                    | 200                    | 300                   | 400                    | 500                   | 600                    | 700                    | 800                    | 900                    | 950                 |
| ------------------------------- | ------------ | ---------------------- | ---------------------- | ---------------------- | ---------------------- | --------------------- | ---------------------- | --------------------- | ---------------------- | ---------------------- | ---------------------- | ---------------------- | ------------------- |
| `Colors/Primary Foundation`     | Mode + Style | `#FFF4F1`              | `#FFF0ED`              | `#FFD1C7`              | `#FFBBAC`              | `#FF9C86`             | `#FF896E`              | `#FF6B4A`             | `#E86143`              | `#B54C35`              | `#8C3B29`              | `#6B2D1F`              | `#3D0D05`           |
| `Colors/Secondary Foundation`   | Mode + Style | `#F4F6FA`              | `#E7E8E9`              | `#B6B7BC`              | `#92959B`              | `#60646E`             | `#414651`              | `#121826`             | `#101623`              | `#0D111B`              | `#0A0D15`              | `#080A10`              | `#05070C`           |
| `Colors/Gray (dark mode alpha)` | Mode + Style | `#FFFFFF` (alpha 0.98) | `#FFFFFF` (alpha 0.96) | `#FFFFFF` (alpha 0.94) | `#FFFFFF` (alpha 0.92) | `#FFFFFF` (alpha 0.8) | `#FFFFFF` (alpha 0.56) | `#FFFFFF` (alpha 0.5) | `#FFFFFF` (alpha 0.35) | `#FFFFFF` (alpha 0.16) | `#FFFFFF` (alpha 0.08) | `#FFFFFF` (alpha 0.04) | `#FFFFFF` (alpha 0) |
| `Colors/Brand`                  | Mode         | `#FBF8FF`              | `#F3EAFC`              | `#DBBDF6`              | `#C99DF2`              | `#B171EC`             | `#A155E8`              | `#8A2BE2`             | `#7E27CE`              | `#621FA0`              | `#4C187C`              | `#3A125F`              | `#3A125F`           |
| `Colors/Brand`                  | Style        | `#FFF6F4`              | `#FFF0EB`              | `#FFD1C0`              | `#FFBBA2`              | `#FF9C78`             | `#FF895D`              | `#FF6B35`             | `#E86130`              | `#B54C26`              | `#8C3B1D`              | `#6B2D16`              | `#5E2510`           |
| `Colors/Error`                  | Mode + Style | `#FFFBFA`              | `#FEF3F2`              | `#FEE4E2`              | `#FECDCA`              | `#FDA29B`             | `#F97066`              | `#F04438`             | `#D92D20`              | `#B42318`              | `#912018`              | `#7A271A`              | `#55160C`           |
| `Colors/Warning`                | Mode + Style | `#FFFCF5`              | `#FFFAEB`              | `#FEF0C7`              | `#FEDF89`              | `#FEC84B`             | `#FDB022`              | `#F79009`             | `#DC6803`              | `#B54708`              | `#93370D`              | `#7A2E0E`              | `#4E1D09`           |
| `Colors/Success`                | Mode + Style | `#F6FEF9`              | `#ECFDF3`              | `#DCFAE6`              | `#ABEFC6`              | `#75E0A7`             | `#47CD89`              | `#17B26A`             | `#079455`              | `#067647`              | `#085D3A`              | `#074D31`              | `#053321`           |
| `Colors/Gray blue`              | Mode + Style | `#FCFCFD`              | `#F8F9FC`              | `#EAECF5`              | `#D5D9EB`              | `#B3B8DB`             | `#717BBC`              | `#4E5BA6`             | `#3E4784`              | `#363F72`              | `#293056`              | `#101323`              | `#0D0F1C`           |
| `Colors/Gray modern`            | Mode + Style | `#FCFCFD`              | `#F8FAFC`              | `#EEF2F6`              | `#E3E8EF`              | `#CDD5DF`             | `#9AA4B2`              | `#697586`             | `#4B5565`              | `#364152`              | `#202939`              | `#121926`              | `#0D121C`           |
| `Colors/Gray neutral`           | Mode + Style | `#FCFCFD`              | `#F9FAFB`              | `#F3F4F6`              | `#E5E7EB`              | `#D2D6DB`             | `#9DA4AE`              | `#6C737F`             | `#4D5761`              | `#384250`              | `#1F2A37`              | `#111927`              | `#0D121C`           |
| `Colors/Gray iron`              | Mode + Style | `#FCFCFC`              | `#FAFAFA`              | `#F4F4F5`              | `#E4E4E7`              | `#D1D1D6`             | `#A0A0AB`              | `#70707B`             | `#51525C`              | `#3F3F46`              | `#26272B`              | `#1A1A1E`              | `#131316`           |
| `Colors/Gray true`              | Mode + Style | `#FCFCFC`              | `#F7F7F7`              | `#F5F5F5`              | `#E5E5E5`              | `#D6D6D6`             | `#A3A3A3`              | `#737373`             | `#525252`              | `#424242`              | `#292929`              | `#141414`              | `#0F0F0F`           |
| `Colors/Gray warm`              | Mode + Style | `#FDFDFC`              | `#FAFAF9`              | `#F5F5F4`              | `#E7E5E4`              | `#D7D3D0`             | `#A9A29D`              | `#79716B`             | `#57534E`              | `#44403C`              | `#292524`              | `#1C1917`              | `#171412`           |
| `Colors/Moss`                   | Mode + Style | `#FAFDF7`              | `#F5FBEE`              | `#E6F4D7`              | `#CEEAB0`              | `#ACDC79`             | `#86CB3C`              | `#669F2A`             | `#4F7A21`              | `#3F621A`              | `#335015`              | `#2B4212`              | `#1A280B`           |
| `Colors/Green light`            | Mode + Style | `#FAFEF5`              | `#F3FEE7`              | `#E3FBCC`              | `#D0F8AB`              | `#A6EF67`             | `#85E13A`              | `#66C61C`             | `#4CA30D`              | `#3B7C0F`              | `#326212`              | `#2B5314`              | `#15290A`           |
| `Colors/Green`                  | Mode + Style | `#F6FEF9`              | `#EDFCF2`              | `#D3F8DF`              | `#AAF0C4`              | `#73E2A3`             | `#3CCB7F`              | `#16B364`             | `#099250`              | `#087443`              | `#095C37`              | `#084C2E`              | `#052E1C`           |
| `Colors/Teal`                   | Mode + Style | `#F6FEFC`              | `#F0FDF9`              | `#CCFBEF`              | `#99F6E0`              | `#5FE9D0`             | `#2ED3B7`              | `#15B79E`             | `#0E9384`              | `#107569`              | `#125D56`              | `#134E48`              | `#0A2926`           |
| `Colors/Cyan`                   | Mode + Style | `#F5FEFF`              | `#ECFDFF`              | `#CFF9FE`              | `#A5F0FC`              | `#67E3F9`             | `#22CCEE`              | `#06AED4`             | `#088AB2`              | `#0E7090`              | `#155B75`              | `#164C63`              | `#0D2D3A`           |
| `Colors/Blue light`             | Mode + Style | `#F5FBFF`              | `#F0F9FF`              | `#E0F2FE`              | `#B9E6FE`              | `#7CD4FD`             | `#36BFFA`              | `#0BA5EC`             | `#0086C9`              | `#026AA2`              | `#065986`              | `#0B4A6F`              | `#062C41`           |
| `Colors/Blue`                   | Mode + Style | `#F5FAFF`              | `#EFF8FF`              | `#D1E9FF`              | `#B2DDFF`              | `#84CAFF`             | `#53B1FD`              | `#2E90FA`             | `#1570EF`              | `#175CD3`              | `#1849A9`              | `#194185`              | `#102A56`           |
| `Colors/Blue dark`              | Mode + Style | `#F5F8FF`              | `#EFF4FF`              | `#D1E0FF`              | `#B2CCFF`              | `#84ADFF`             | `#528BFF`              | `#2970FF`             | `#155EEF`              | `#004EEB`              | `#0040C1`              | `#00359E`              | `#002266`           |
| `Colors/Indigo`                 | Mode + Style | `#F5F8FF`              | `#EEF4FF`              | `#E0EAFF`              | `#C7D7FE`              | `#A4BCFD`             | `#8098F9`              | `#6172F3`             | `#444CE7`              | `#3538CD`              | `#2D31A6`              | `#2D3282`              | `#1F235B`           |
| `Colors/Violet`                 | Mode + Style | `#FBFAFF`              | `#F5F3FF`              | `#ECE9FE`              | `#DDD6FE`              | `#C3B5FD`             | `#A48AFB`              | `#875BF7`             | `#7839EE`              | `#6927DA`              | `#5720B7`              | `#491C96`              | `#2E125E`           |
| `Colors/Purple`                 | Mode + Style | `#FAFAFF`              | `#F4F3FF`              | `#EBE9FE`              | `#D9D6FE`              | `#BDB4FE`             | `#9B8AFB`              | `#7A5AF8`             | `#6938EF`              | `#5925DC`              | `#4A1FB8`              | `#3E1C96`              | `#27115F`           |
| `Colors/Fuchsia`                | Mode + Style | `#FEFAFF`              | `#FDF4FF`              | `#FBE8FF`              | `#F6D0FE`              | `#EEAAFD`             | `#E478FA`              | `#D444F1`             | `#BA24D5`              | `#9F1AB1`              | `#821890`              | `#6F1877`              | `#47104C`           |
| `Colors/Pink`                   | Mode + Style | `#FEF6FB`              | `#FDF2FA`              | `#FCE7F6`              | `#FCCEEE`              | `#FAA7E0`             | `#F670C7`              | `#EE46BC`             | `#DD2590`              | `#C11574`              | `#9E165F`              | `#851651`              | `#4E0D30`           |
| `Colors/Rosé`                   | Mode + Style | `#FFF5F6`              | `#FFF1F3`              | `#FFE4E8`              | `#FECDD6`              | `#FEA3B4`             | `#FD6F8E`              | `#F63D68`             | `#E31B54`              | `#C01048`              | `#A11043`              | `#89123E`              | `#510B24`           |
| `Colors/Orange dark`            | Mode + Style | `#FFF9F5`              | `#FFF4ED`              | `#FFE6D5`              | `#FFD6AE`              | `#FF9C66`             | `#FF692E`              | `#FF4405`             | `#E62E05`              | `#BC1B06`              | `#97180C`              | `#771A0D`              | `#57130A`           |
| `Colors/Orange`                 | Mode + Style | `#FEFAF5`              | `#FEF6EE`              | `#FDEAD7`              | `#F9DBAF`              | `#F7B27A`             | `#F38744`              | `#EF6820`             | `#E04F16`              | `#B93815`              | `#932F19`              | `#772917`              | `#511C10`           |
| `Colors/Yellow`                 | Mode + Style | `#FEFDF0`              | `#FEFBE8`              | `#FEF7C3`              | `#FEEE95`              | `#FDE272`             | `#FAC515`              | `#EAAA08`             | `#CA8504`              | `#A15C07`              | `#854A0E`              | `#713B12`              | `#542C0D`           |

Tables show exported hex and readable alpha. JSON retains exact sRGB components
and floating-point alpha; do not reduce translucent tokens to opaque hex or discard
color space. Displayed alpha is rounded to six decimals.

## 4. Semantic colors: light and dark

Exact paths and local reference expressions are preserved. These are export values,
**not approved CSS-variable or Tailwind mappings**. Text, Border, Foreground and
Background define separate roles; do not substitute them merely because colors match.

Background layers are semantic surfaces; there is no separate `Colors/Surface`
group. Base/Card and Base/Surface 2 are primitive surfaces, not aliases automatically
assigned to components.

### Text

| Exact token path                         | Light mode | Dark mode |
| ---------------------------------------- | ---------- | --------- |
| `Colors/Text/text-primary (900)`         | `#6B2D1F`  | `#E7E8E9` |
| `Colors/Text/text-primary_on-brand`      | `#FAFAFA`  | `#E7E8E9` |
| `Colors/Text/text-secondary (700)`       | `#B54C35`  | `#60646E` |
| `Colors/Text/text-secondary_hover`       | `#8C3B29`  | `#92959B` |
| `Colors/Text/text-secondary_on-brand`    | `#FFBBA2`  | `#60646E` |
| `Colors/Text/text-tertiary (600)`        | `#E86143`  | `#414651` |
| `Colors/Text/text-tertiary_hover`        | `#B54C35`  | `#60646E` |
| `Colors/Text/text-tertiary_on-brand`     | `#FFBBA2`  | `#414651` |
| `Colors/Text/text-quaternary (500)`      | `#FF6B4A`  | `#414651` |
| `Colors/Text/text-quaternary_on-brand`   | `#FF9C78`  | `#414651` |
| `Colors/Text/text-white`                 | `#FAFAFA`  | `#FAFAFA` |
| `Colors/Text/text-disabled`              | `#FF6B4A`  | `#121826` |
| `Colors/Text/text-placeholder`           | `#FF6B4A`  | `#121826` |
| `Colors/Text/text-placeholder_subtle`    | `#FF9C86`  | `#0D111B` |
| `Colors/Text/text-brand-primary (900)`   | `#6B2D16`  | `#E7E8E9` |
| `Colors/Text/text-brand-secondary (700)` | `#B54C26`  | `#60646E` |
| `Colors/Text/text-brand-secondary_hover` | `#8C3B1D`  | `#92959B` |
| `Colors/Text/text-brand-tertiary (600)`  | `#E86130`  | `#414651` |
| `Colors/Text/text-brand-tertiary_alt`    | `#E86130`  | `#E7E8E9` |
| `Colors/Text/text-error-primary (600)`   | `#D92D20`  | `#F97066` |
| `Colors/Text/text-error-primary_hover`   | `#B42318`  | `#FDA29B` |
| `Colors/Text/text-warning-primary (600)` | `#DC6803`  | `#FDB022` |
| `Colors/Text/text-success-primary (600)` | `#079455`  | `#47CD89` |

### Border

| Exact token path                       | Light mode             | Dark mode |
| -------------------------------------- | ---------------------- | --------- |
| `Colors/Border/border-primary`         | `#FF9C86`              | `#0D111B` |
| `Colors/Border/border-secondary`       | `#FFBBAC`              | `#0A0D15` |
| `Colors/Border/border-secondary_alt`   | `#000000` (alpha 0.08) | `#0A0D15` |
| `Colors/Border/border-tertiary`        | `#FFD1C7`              | `#0A0D15` |
| `Colors/Border/border-disabled`        | `#FF9C86`              | `#0D111B` |
| `Colors/Border/border-disabled_subtle` | `#FFBBAC`              | `#0A0D15` |
| `Colors/Border/border-brand`           | `#FF6B35`              | `#FF895D` |
| `Colors/Border/border-brand_alt`       | `#E86130`              | `#0D111B` |
| `Colors/Border/border-error`           | `#F04438`              | `#F97066` |
| `Colors/Border/border-error_subtle`    | `#FDA29B`              | `#F04438` |

### Foreground

| Exact token path                             | Light mode                                     | Dark mode |
| -------------------------------------------- | ---------------------------------------------- | --------- |
| `Colors/Foreground/fg-primary (900)`         | `#6B2D1F`                                      | `#FAFAFA` |
| `Colors/Foreground/fg-secondary (700)`       | `#B54C35`                                      | `#60646E` |
| `Colors/Foreground/fg-secondary_hover`       | `#8C3B29`                                      | `#92959B` |
| `Colors/Foreground/fg-tertiary (600)`        | `#E86143`                                      | `#414651` |
| `Colors/Foreground/fg-tertiary_hover`        | `#B54C35`                                      | `#60646E` |
| `Colors/Foreground/fg-quaternary (400)`      | `#FF896E`                                      | `#101623` |
| `Colors/Foreground/fg-quaternary_hover`      | `#FF6B4A`                                      | `#121826` |
| `Colors/Foreground/fg-white`                 | `#FAFAFA`                                      | `#FAFAFA` |
| `Colors/Foreground/fg-disabled`              | `#FF896E`                                      | `#121826` |
| `Colors/Foreground/fg-disabled_subtle`       | `#FF9C86`                                      | `#101623` |
| `Colors/Foreground/fg-brand-primary (600)`   | `#E86130`                                      | `#FF6B35` |
| `Colors/Foreground/fg-brand-primary_alt`     | `{Colors.Foreground.fg-brand-primary (600)}`   | `#60646E` |
| `Colors/Foreground/fg-brand-secondary (500)` | `#FF6B35`                                      | `#FF6B35` |
| `Colors/Foreground/fg-brand-secondary_alt`   | `{Colors.Foreground.fg-brand-secondary (500)}` | `#101623` |
| `Colors/Foreground/fg-brand-secondary_hover` | `#E86130`                                      | `#121826` |
| `Colors/Foreground/fg-error-primary`         | `#D92D20`                                      | `#F04438` |
| `Colors/Foreground/fg-error-secondary`       | `#F04438`                                      | `#F97066` |
| `Colors/Foreground/fg-warning-primary`       | `#DC6803`                                      | `#F79009` |
| `Colors/Foreground/fg-warning-secondary`     | `#F79009`                                      | `#FDB022` |
| `Colors/Foreground/fg-success-primary`       | `#079455`                                      | `#17B26A` |
| `Colors/Foreground/fg-success-secondary`     | `#17B26A`                                      | `#47CD89` |

### Background

| Exact token path                            | Light mode | Dark mode                          |
| ------------------------------------------- | ---------- | ---------------------------------- |
| `Colors/Background/bg-primary`              | `#FAFAFA`  | `#05070C`                          |
| `Colors/Background/bg-primary_alt`          | `#FAFAFA`  | `{Colors.Background.bg-secondary}` |
| `Colors/Background/bg-primary_hover`        | `#FFF0ED`  | `#0A0D15`                          |
| `Colors/Background/bg-primary-solid`        | `#3D0D05`  | `{Colors.Background.bg-secondary}` |
| `Colors/Background/bg-secondary`            | `#FFF0ED`  | `#080A10`                          |
| `Colors/Background/bg-secondary_alt`        | `#FFF0ED`  | `{Colors.Background.bg-primary}`   |
| `Colors/Background/bg-secondary_hover`      | `#FFD1C7`  | `#0A0D15`                          |
| `Colors/Background/bg-secondary_subtle`     | `#FFF4F1`  | `#080A10`                          |
| `Colors/Background/bg-secondary-solid`      | `#E86143`  | `#101623`                          |
| `Colors/Background/bg-tertiary`             | `#FFD1C7`  | `#0A0D15`                          |
| `Colors/Background/bg-quaternary`           | `#FFBBAC`  | `#0D111B`                          |
| `Colors/Background/bg-active`               | `#FFF0ED`  | `#0A0D15`                          |
| `Colors/Background/bg-disabled`             | `#FFD1C7`  | `#0A0D15`                          |
| `Colors/Background/bg-disabled_subtle`      | `#FFF0ED`  | `#080A10`                          |
| `Colors/Background/bg-overlay`              | `#3D0D05`  | `#0A0D15`                          |
| `Colors/Background/bg-brand-primary`        | `#FFF0EB`  | `#FF6B35`                          |
| `Colors/Background/bg-brand-primary_alt`    | `#FFF0EB`  | `{Colors.Background.bg-secondary}` |
| `Colors/Background/bg-brand-secondary`      | `#FFD1C0`  | `#E86130`                          |
| `Colors/Background/bg-brand-solid`          | `#E86130`  | `#E86130`                          |
| `Colors/Background/bg-brand-solid_hover`    | `#B54C26`  | `#FF6B35`                          |
| `Colors/Background/bg-brand-section`        | `#8C3B1D`  | `{Colors.Background.bg-secondary}` |
| `Colors/Background/bg-brand-section_subtle` | `#B54C26`  | `{Colors.Background.bg-primary}`   |
| `Colors/Background/bg-error-primary`        | `#FEF3F2`  | `#55160C`                          |
| `Colors/Background/bg-error-secondary`      | `#FEE4E2`  | `#D92D20`                          |
| `Colors/Background/bg-error-solid`          | `#D92D20`  | `#D92D20`                          |
| `Colors/Background/bg-error-solid_hover`    | `#B42318`  | `#F04438`                          |
| `Colors/Background/bg-warning-primary`      | `#FFFAEB`  | `#4E1D09`                          |
| `Colors/Background/bg-warning-secondary`    | `#FEF0C7`  | `#DC6803`                          |
| `Colors/Background/bg-warning-solid`        | `#DC6803`  | `#DC6803`                          |
| `Colors/Background/bg-success-primary`      | `#ECFDF3`  | `#053321`                          |
| `Colors/Background/bg-success-secondary`    | `#DCFAE6`  | `#079455`                          |
| `Colors/Background/bg-success-solid`        | `#079455`  | `#079455`                          |

### Effects and component colors

The exports also include effect colors and component-specific colors for buttons,
toggles, inputs, charts and other controls. Inspect the original owning token group
for that component. Shadow color tokens do not define blur/spread/offset; use SVG
geometry when these properties are missing.

Representative exact transparency/button values:

| Exact token path                                                | Light mode             | Dark mode              |
| --------------------------------------------------------------- | ---------------------- | ---------------------- |
| `Colors/Effects/Shadows/shadow-xs`                              | `#0A0D12` (alpha 0.05) | `#FFFFFF` (alpha 0)    |
| `Colors/Effects/Shadows/shadow-skeumorphic-inner`               | `#0A0D12` (alpha 0.05) | `#0C0E12` (alpha 0.05) |
| `Colors/Effects/Shadows/shadow-skeumorphic-inner-border`        | `#0A0D12` (alpha 0.18) | `#0C0E12` (alpha 0.18) |
| `Component colors/Alpha/alpha-white-10`                         | `#FFFFFF` (alpha 0.1)  | `#0C0E12` (alpha 0.1)  |
| `Component colors/Alpha/alpha-black-10`                         | `#000000` (alpha 0.1)  | `#FFFFFF` (alpha 0.1)  |
| `Component colors/Components/Buttons/button-primary-icon`       | `#FF9C78`              | `#FF9C78`              |
| `Component colors/Components/Buttons/button-primary-icon_hover` | `#FFBBA2`              | `#FFBBA2`              |

An alpha-white name can resolve to dark RGB in dark mode: follow its value. Several
dark effect tokens have alpha 0; preserve transparency instead of displaying white.
Status roles are included above as error/warning/success text, foreground and background.

## 5. Typography

| Exact family token                | Exported string |
| --------------------------------- | --------------- |
| `Font family/font-family-display` | `Inter`         |
| `Font family/font-family-body`    | `Inter`         |

Both display and body families are Inter. The app currently also imports Poppins
and Lora; they are not Figma typography tokens. Do not globally replace existing
fonts while implementing one page.

### Sizes and corresponding line heights

Each row pairs separate size/line-height tokens sharing a suffix, not an exported
composite typography style. Figma length values require explicit CSS units.

| Exact size token        | Size (px) | Exact line-height token   | Line height (px) |
| ----------------------- | --------- | ------------------------- | ---------------- |
| `Font size/text-xs`     | 12        | `Line height/text-xs`     | 18               |
| `Font size/text-sm`     | 14        | `Line height/text-sm`     | 20               |
| `Font size/text-md`     | 16        | `Line height/text-md`     | 24               |
| `Font size/text-lg`     | 18        | `Line height/text-lg`     | 28               |
| `Font size/text-xl`     | 20        | `Line height/text-xl`     | 30               |
| `Font size/display-xs`  | 24        | `Line height/display-xs`  | 32               |
| `Font size/display-sm`  | 30        | `Line height/display-sm`  | 38               |
| `Font size/display-md`  | 36        | `Line height/display-md`  | 44               |
| `Font size/display-lg`  | 48        | `Line height/display-lg`  | 60               |
| `Font size/display-xl`  | 60        | `Line height/display-xl`  | 72               |
| `Font size/display-2xl` | 72        | `Line height/display-2xl` | 90               |

### Weight and style strings

| Exact token path              | Exported string   |
| ----------------------------- | ----------------- |
| `Font weight/regular`         | `Regular`         |
| `Font weight/regular-italic`  | `Regular italic`  |
| `Font weight/medium`          | `Medium`          |
| `Font weight/medium-italic`   | `Medium italic`   |
| `Font weight/semibold`        | `Semibold`        |
| `Font weight/semibold-italic` | `Semibold italic` |
| `Font weight/bold`            | `Bold`            |
| `Font weight/bold-italic`     | `Bold italic`     |

These are named strings, not exported numeric CSS weights. Preserve weight and
italic style separately; do not fabricate numeric-weight tokens or claim an
unapproved mapping. Reconstruct ordinary SVG text as real text with the matching
family, size, line height, weight/style and SVG-specific tracking. No composite
text-style or letter-spacing tokens occur in this typography export.

## 6. Layout tokens

These are exported numbers, not implemented CSS custom properties. Use explicit
px or a deliberate equivalent rem conversion for lengths. Widths are measurements,
not an approved breakpoint configuration.

### Border radius

| Exact token path | Value (px) |
| ---------------- | ---------- |
| `radius-none`    | 0          |
| `radius-xxs`     | 2          |
| `radius-xs`      | 4          |
| `radius-sm`      | 6          |
| `radius-md`      | 8          |
| `radius-lg`      | 10         |
| `radius-xl`      | 12         |
| `radius-2xl`     | 16         |
| `radius-3xl`     | 20         |
| `radius-4xl`     | 24         |
| `radius-full`    | 9999       |

### Spacing scale

| Exact token path | Value (px) |
| ---------------- | ---------- |
| `spacing-none`   | 0          |
| `spacing-xxs`    | 2          |
| `spacing-xs`     | 4          |
| `spacing-sm`     | 6          |
| `spacing-md`     | 8          |
| `spacing-lg`     | 12         |
| `spacing-xl`     | 16         |
| `spacing-2xl`    | 20         |
| `spacing-3xl`    | 24         |
| `spacing-4xl`    | 32         |
| `spacing-5xl`    | 40         |
| `spacing-6xl`    | 48         |
| `spacing-7xl`    | 64         |
| `spacing-8xl`    | 80         |
| `spacing-9xl`    | 96         |
| `spacing-10xl`   | 128        |
| `spacing-11xl`   | 160        |

### Widths

| Exact token path      | Value (px) |
| --------------------- | ---------- |
| `width-xxs`           | 320        |
| `width-xs`            | 384        |
| `width-sm`            | 480        |
| `width-md`            | 560        |
| `width-lg`            | 640        |
| `width-xl`            | 768        |
| `width-2xl`           | 1024       |
| `width-3xl`           | 1280       |
| `width-4xl`           | 1440       |
| `width-5xl`           | 1600       |
| `width-6xl`           | 1920       |
| `paragraph-max-width` | 720        |

### Containers and responsive padding

| Exact token path              | Value (px) |
| ----------------------------- | ---------- |
| `container-padding-mobile`    | 16         |
| `container-padding-desktop`   | 32         |
| `container-max-width-desktop` | 1280       |

Container padding is 16px mobile and 32px desktop; desktop max width is 1280px.
Intermediate behavior is not specified. Use the SVG and existing responsive
patterns; do not infer a new mobile screen from width names.

## 7. Existing implementation and mapping boundaries

Tailwind 4 uses `@tailwindcss/vite` and `src/styles/globals.css`. There is no
custom `@theme`, standalone Tailwind configuration, JSON import or generator
binding these exports to utilities.

Current CSS values, shown to distinguish implementation from exports:

| Existing CSS property | Root      | Admin shell |
| --------------------- | --------- | ----------- |
| `--background`        | `#f6f7f9` | `#121826`   |
| `--surface`           | `#ffffff` | `#171e30`   |
| `--surface-muted`     | `#eef1f5` | `#182030`   |
| `--text`              | `#17202a` | `#ffffff`   |
| `--text-muted`        | `#687586` | `#90a1b9`   |
| `--border`            | `#d9dee7` | `#2e3443`   |
| `--primary`           | `#0f766e` | `#ff5733`   |
| `--primary-strong`    | `#115e59` | `#ff6b4a`   |
| `--success`           | `#15803d` | `#2dd4bf`   |
| `--warning`           | `#b45309` | `#eab308`   |
| `--danger`            | `#b91c1c` | `#f87171`   |

These are not automatic aliases to similar Figma names. Root uses Inter; auth/public
styling uses Poppins. Admin content caps at 1540px with 24/32/48/64px responsive
padding, differing from the container export. Preserve existing screens and report
any differences relevant to a supplied SVG.

Installed Tailwind breakpoints: sm 40rem, md 48rem, lg 64rem, xl 80rem, 2xl 96rem.
Existing global CSS has 768px, 1024px and 1280px media queries. Figma width tokens
do not automatically replace these breakpoints.

Names do not map directly to Tailwind defaults: `radius-md` exports 8px while
installed `rounded-md` uses 0.375rem; `radius-3xl` exports 20px while
`rounded-3xl` uses 1.5rem. Figma `text-md` is not an established custom utility
in this app. Similar suffixes do not establish an approved mapping.

## 8. Future implementation rules

1. Follow SVG-first visual authority and separate static/integration stages in AGENTS.md.
2. Prefer approved semantic tokens for repeated properties. Identify the approved
   mode; preserve references, alpha, names, typography and units.
3. Do not silently choose Mode/Style, rewrite JSON, generate CSS or change the global
   palette. These require an explicit design decision and scoped implementation task.
4. Preserve clear SVG-specific details through scoped styling/assets; record conflicts
   with approved shared tokens. Avoid one-off values when an approved match exists.
5. Keep artwork feature-local, text semantic and layout responsive. Reuse components
   without sacrificing the page's hierarchy or existing accessibility foundations.
6. Report font/palette/alias/responsive ambiguity. The user performs manual visual
   review; development/preview servers and browser testing are prohibited.
