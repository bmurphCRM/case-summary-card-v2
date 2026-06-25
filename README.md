# Case Summary Card V2

A modern, themable Lightning Web Component (LWC) that surfaces an at-a-glance summary of a Salesforce Case via four interactive tiles:

1. **Case Age** — live ticking timer while the case is open; static "Closed after …" once closed.
2. **Open Activities** — count of open Tasks + future Events linked to the Case.
3. **Notes** — count of `ContentNote` records linked via `ContentDocumentLink`.
4. **Files** — count of non-Note `ContentDocument` files linked to the Case.

<img width="1682" height="830" alt="image" src="https://github.com/user-attachments/assets/830bdee7-0071-494e-8117-d087f734926d" />


Tiles 2–4 are clickable and open a `LightningModal` listing the related records with row-level navigation back to the source object.

Built on SLDS 2 design tokens with 16 named color themes plus full per-color hex overrides.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
  - [Properties](#properties)
  - [Color Themes](#color-themes)
  - [Custom Color Overrides](#custom-color-overrides)
- [Component Targets](#component-targets)
- [Data Layer (Apex)](#data-layer-apex)
- [Development](#development)
- [Testing](#testing)
- [Known Limitations](#known-limitations)
- [Project Structure](#project-structure)
- [License](#license)

---

## Features

- **Live ticking timer** — updates every second on open cases; clamps to `0s` on clock skew; stops ticking once the case is closed.
- **Adaptive duration format** — collapses zero leading units. Examples: `30s`, `4m 12s`, `2h 4m 12s`, `5d 3h 22m 14s`.
- **Drill-down modal** — clicking a count tile opens a `LightningModal` with the full related list as a `lightning-datatable`, including URL-typed columns for native navigation.
- **16 built-in color themes** plus a `Custom` option.
- **9 individual hex override properties** that always win over the selected theme — lets admins pick a theme and selectively recolor one element.
- **SLDS 2 styling hooks** (`--slds-g-*` design tokens) drive the default look; theming overrides via `--csc-*` CSS custom properties.
- **Multi-target** — works on Record Pages, App Pages, Home Pages, and Experience Cloud sites.
- **Responsive grid** — 4 columns on desktop, 2 on tablet (≤ 768px), 1 on phone (≤ 420px).
- **Cacheable Apex** — all server-side reads use `@AuraEnabled(cacheable=true)` with `refreshApex` invoked after every modal close to keep counts accurate.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  caseSummaryCardV2 (container)                                   │
│   • @wire getCaseSummary  → CaseSummaryDTO                       │
│   • setInterval(1s) → reactive `_now` drives age formatter       │
│   • theme + override merge → CSS custom properties on root       │
│                                                                  │
│   ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│   │ caseSummaryTile  │  │ caseSummaryTile  │  │ caseSummaryTile│ │
│   │  (age)           │  │  (activities)    │  │  (notes/files) │ │
│   └──────────────────┘  └────────┬─────────┘  └────────┬───────┘ │
│                                  │  click             │         │
│                                  ▼                    ▼         │
│                         ┌──────────────────────────────────┐    │
│                         │  caseRelatedListModal            │    │
│                         │  (LightningModal subclass)       │    │
│                         │   • relation: activities|notes|files│ │
│                         │   • lightning-datatable          │    │
│                         └──────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                                  │
                                  │ @AuraEnabled(cacheable=true)
                                  ▼
                  ┌─────────────────────────────────┐
                  │ CaseSummaryController.cls       │
                  │  • getCaseSummary               │
                  │  • getOpenActivities (Task+Event)│
                  │  • getNotes (ContentDocumentLink)│
                  │  • getFiles (ContentDocumentLink)│
                  └─────────────────────────────────┘
```

**Components:**
- `caseSummaryCardV2` — container LWC; wires Apex, manages the timer, merges theme + overrides.
- `caseSummaryTile` — stateless presentational tile (button when clickable, div otherwise).
- `caseRelatedListModal` — single `LightningModal` subclass; renders activities, notes, or files based on a `relation` prop.

**Apex:**
- `CaseSummaryController` — `with sharing`; all 4 read methods are `@AuraEnabled(cacheable=true)`.
- `CaseSummaryDTO` — wire payload for the summary tile (createdDate, closedDate, isClosed, openActivityCount, noteCount, fileCount).
- `CaseSummaryController.OpenActivityRow` — inner class flattening Task + Event rows into a single shape for the modal datatable.

---

## Installation

### Prerequisites
- Salesforce CLI (`sf`) v2.x
- An authenticated org (`sf org login web`)
- API version 62.0 or higher

### Deploy

```bash
sf project deploy start \
  --source-dir force-app/main/default \
  --target-org <your-alias>
```

### Assign the permission set

The bundled permission set grants Apex class access for the LWC's wire methods:

```bash
sf org assign permset -n CaseSummaryCard_Access -o <your-alias>
```

### Add to a Lightning page

1. Open any Case in the target org.
2. Click the gear icon → **Edit Page**.
3. Find **Case Summary Card V2** in the Custom Components panel.
4. Drag onto the page.
5. Configure properties in the right-hand panel (Title, Color Theme, hex overrides).
6. **Save** and **Activate** the page.

---

## Configuration

### Properties

All properties are exposed on every supported target via `js-meta.xml`.

| Property | Type | Default | Description |
|---|---|---|---|
| `title` | String | `Case Summary` | Header title shown above the tiles. |
| `subtitle` | String | _(empty)_ | Optional subtitle shown below the title. |
| `colorTheme` | String (picklist) | `Ocean Blue` | One of 16 built-in themes plus `Custom`. |
| `titleHeaderColor` | String (hex) | _(theme)_ | Header text and icon color. Overrides theme. |
| `backgroundColor` | String (hex) | _(theme)_ | Card background color. |
| `outlineColor` | String (hex) | _(theme)_ | Card border color. |
| `tileBackgroundColor` | String (hex) | _(theme)_ | Tile background color. |
| `tileBorderColor` | String (hex) | _(theme)_ | Tile border color. |
| `tileIconColor` | String (hex) | _(theme)_ | Icon foreground inside each tile. |
| `tileLabelColor` | String (hex) | _(theme)_ | Tile label (small uppercase) color. |
| `tileValueColor` | String (hex) | _(theme)_ | Tile big-number value color. |
| `accentColor` | String (hex) | _(theme)_ | Focus ring + hover accent color. |
| `recordId` | String | _(auto on Record Page)_ | Case Id. Auto-bound on `lightning__RecordPage`. Set manually on App Page / Home Page / Community. |

> All hex properties accept `#RRGGBB` format. Blank values fall back to the selected theme.

### Color Themes

16 visually distinct themes ship with the component:

| Theme | Header | Card BG | Outline | Tile BG | Tile Border | Icon | Label | Value | Accent |
|---|---|---|---|---|---|---|---|---|---|
| Ocean Blue | `#0B5CAB` | `#F4F8FC` | `#D4E2F2` | `#FFFFFF` | `#D4E2F2` | `#0176D3` | `#54698D` | `#0B2545` | `#0176D3` |
| Forest Green | `#0F6B3A` | `#F2F8F4` | `#CFE3D6` | `#FFFFFF` | `#CFE3D6` | `#0B8E3B` | `#4D6657` | `#0E2A1A` | `#0B8E3B` |
| Sunset Orange | `#C8501D` | `#FFF6F0` | `#F7D9C4` | `#FFFFFF` | `#F7D9C4` | `#FE9339` | `#7A5443` | `#3A1A0A` | `#FE9339` |
| Royal Purple | `#5A2EA6` | `#F6F3FC` | `#DDD0F2` | `#FFFFFF` | `#DDD0F2` | `#8B44D6` | `#5F507A` | `#221045` | `#8B44D6` |
| Professional Slate | `#3E3E3C` | `#F4F4F5` | `#DDDBD9` | `#FFFFFF` | `#DDDBD9` | `#706E6B` | `#5C5B59` | `#181818` | `#706E6B` |
| Crimson | `#9B1B30` | `#FCF3F4` | `#EFC9D0` | `#FFFFFF` | `#EFC9D0` | `#C9304B` | `#7A4F58` | `#37080F` | `#C9304B` |
| Teal Modern | `#0D7C8B` | `#F0F8F9` | `#C7E2E6` | `#FFFFFF` | `#C7E2E6` | `#11A2B5` | `#4D6E73` | `#06303A` | `#11A2B5` |
| Goldenrod | `#A77900` | `#FBF6E6` | `#EEDFAE` | `#FFFFFF` | `#EEDFAE` | `#D5A021` | `#7A6520` | `#3A2C00` | `#D5A021` |
| Midnight (dark) | `#0F172A` | `#1E293B` | `#334155` | `#273449` | `#3A4A66` | `#7DD3FC` | `#94A3B8` | `#F8FAFC` | `#38BDF8` |
| Carbon (dark) | `#111111` | `#1E1E1E` | `#2C2C2C` | `#262626` | `#3A3A3A` | `#FF7A59` | `#A0A0A0` | `#F5F5F5` | `#FF7A59` |
| Graphite (dark) | `#1F2937` | `#2B2F36` | `#3C434D` | `#343941` | `#4A515B` | `#A7F3D0` | `#9CA3AF` | `#F3F4F6` | `#34D399` |
| Rose Quartz | `#A23B5B` | `#FDF4F7` | `#F2CFDA` | `#FFFFFF` | `#F2CFDA` | `#D4567A` | `#7A5862` | `#3A0E1E` | `#D4567A` |
| Mint Fresh | `#1E8E66` | `#F0FAF6` | `#C6E8D9` | `#FFFFFF` | `#C6E8D9` | `#2EBA88` | `#4F706A` | `#0B2A22` | `#2EBA88` |
| Indigo | `#3730A3` | `#F3F2FB` | `#D0CCF0` | `#FFFFFF` | `#D0CCF0` | `#4F46E5` | `#5C5A78` | `#1E1B4B` | `#4F46E5` |
| Sandstone | `#8A6B3B` | `#FBF6EE` | `#E7D6B5` | `#FFFFFF` | `#E7D6B5` | `#B8893E` | `#7A6A4F` | `#3A2A14` | `#B8893E` |
| Volt Cyber | `#0A0A0A` | `#0F1115` | `#1F2933` | `#161A20` | `#2A3340` | `#A3E635` | `#94A3B8` | `#F1F5F9` | `#A3E635` |
| Custom | _(none)_ | _(none)_ | _(none)_ | _(none)_ | _(none)_ | _(none)_ | _(none)_ | _(none)_ | _(none)_ |

> **`Custom`** resolves to an empty palette. Use it when you want to set every color manually via the hex overrides; any property you leave blank simply falls through to the SLDS 2 design-token default.

### Custom Color Overrides

Override resolution per color slot:

```
admin-supplied hex (non-blank)  →  selected theme palette  →  SLDS design token default
```

This means an admin can pick **Crimson** and then change just `titleHeaderColor` to `#000000` to get black headers on a red palette. Blanks always defer to the theme; a single override never forces you to specify the other 8.

The merge logic lives in [`themes.js`](./force-app/main/default/lwc/caseSummaryCardV2/themes.js) and is exported as `resolvePalette(themeName, overrides)` for testability.

---

## Component Targets

| Target | Use Case | Notes |
|---|---|---|
| `lightning__RecordPage` | Case Lightning Record Page | `recordId` auto-bound. Most common deployment surface. |
| `lightning__AppPage` | App Builder App Page | Admin maps `recordId` manually. |
| `lightning__HomePage` | Home Page | Useful for a "watch one case" experience; admin maps `recordId`. |
| `lightningCommunity__Page` / `lightningCommunity__Default` | Experience Cloud | `recordId` defaults to `{!recordId}` URL param; bind via the page property panel. |

---

## Data Layer (Apex)

All controller methods are `@AuraEnabled(cacheable=true)` and rethrow as sanitized `AuraHandledException` on failure.

### `getCaseSummary(Id caseId) → CaseSummaryDTO`

Returns the wire payload that drives the four tiles:

```json
{
  "caseId": "500…",
  "createdDate": "2025-08-12T14:22:18Z",
  "closedDate": null,
  "isClosed": false,
  "openActivityCount": 5,
  "noteCount": 2,
  "fileCount": 7
}
```

**Counts use these queries:**

| Tile | SOQL |
|---|---|
| Open Activities | `COUNT() FROM Task WHERE WhatId = :id AND IsClosed = false` ➕ `COUNT() FROM Event WHERE WhatId = :id AND EndDateTime >= :now` |
| Notes | `COUNT() FROM ContentDocumentLink WHERE LinkedEntityId = :id AND ContentDocument.FileType = 'SNOTE'` |
| Files | `COUNT() FROM ContentDocumentLink WHERE LinkedEntityId = :id AND ContentDocument.FileType != 'SNOTE'` |

> **Why Task + Event instead of `OpenActivity`?** Some orgs reject direct queries against the virtual `OpenActivity` object (`entity type OpenActivity does not support query`). Counting Task and Event directly is portable across every org.

### `getOpenActivities(Id caseId) → List<OpenActivityRow>`

Returns up to 200 combined rows (open Tasks + future Events) with a unified shape:

```json
[
  {
    "id": "00T…",
    "subject": "Follow up call",
    "activityDate": "2026-07-01",
    "status": "In Progress",
    "priority": "High",
    "ownerName": "Alice Adams",
    "isTask": true
  }
]
```

### `getNotes(Id caseId) → List<ContentDocumentLink>`
### `getFiles(Id caseId) → List<ContentDocumentLink>`

Both query `ContentDocumentLink` with the relevant `FileType` filter and return up to 200 rows including `ContentDocument.Title`, `CreatedDate`, `CreatedBy.Name`, `ContentSize`, and (for files) `FileType`, `FileExtension`.

---

## Development

```bash
git clone https://github.com/<your-org>/case-summary-card-v2.git
cd case-summary-card-v2
npm install
```

### Authorize a dev org

```bash
sf org login web -a csc-dev
sf project deploy start -d force-app -o csc-dev
sf org assign permset -n CaseSummaryCard_Access -o csc-dev
sf org open -o csc-dev
```

### Iteration loop

```bash
# Watch + redeploy on save
sf project deploy start -d force-app -o csc-dev

# Or push diffs incrementally
sf project retrieve start -d force-app -o csc-dev
```

---

## Testing

### Jest (LWC unit tests)

```bash
npm run test:unit            # one-off
npm run test:unit:watch      # watch mode
npm run test:unit:coverage   # with coverage report
```

Tests cover:
- Theme resolution (override-beats-theme, blank-override-falls-through, `Custom`-empty)
- Adaptive duration formatter (zero-collapse, multi-day, sub-second)
- Wire success / error states
- Tile click → modal open
- Modal data shape per relation (activities / notes / files)

### Apex tests

```bash
sf apex run test --tests CaseSummaryControllerTest -o <alias> --code-coverage --result-format human --wait 10
```

`CaseSummaryControllerTest` covers:
- Open-case counts (tasks, events, notes, files)
- Closed-case `closedDate` propagation
- `getOpenActivities` / `getNotes` / `getFiles` return shape
- Null / wrong-sObject-type input → `AuraHandledException`

> If your org has Flows that fire on `Case` insert, you may need to either supply required Flow inputs in the test setup, or temporarily deactivate those Flows during test runs.

---

## Known Limitations

- **Related-list cap of 200 rows** — `getOpenActivities`, `getNotes`, and `getFiles` cap their results at 200. The modal shows a "Showing first 200 records" banner when this cap is hit.
- **No real-time push** — counts refresh on initial wire and after every modal close via `refreshApex`, but a new Task added by another user won't appear until one of those events.
- **Hex validation is browser-side only** — invalid hex strings pass through unchanged; the browser silently ignores garbage `--csc-*` values and the SLDS fallback renders. Document the `#RRGGBB` expectation in admin training.
- **Time units stop at days** — very long cases display `812d 3h 22m 14s` rather than introducing variable-length month / year units.
- **Page-hidden tab** — the timer keeps ticking when the tab is backgrounded. Cheap enough not to matter, but a future enhancement could pause via `visibilitychange`.

---

## Project Structure

```
case-summary-card-v2/
├── README.md
├── sfdx-project.json
├── package.json
├── jest.config.js
├── .forceignore
├── .prettierrc
├── config/
│   └── project-scratch-def.json
├── docs/
│   ├── architecture.md          # deep-dive component design
│   └── configuration.md         # detailed property reference
└── force-app/
    ├── test/
    │   └── jest-mocks/lightning/
    │       ├── modal.js
    │       └── navigation.js
    └── main/default/
        ├── classes/
        │   ├── CaseSummaryController.cls
        │   ├── CaseSummaryDTO.cls
        │   └── CaseSummaryControllerTest.cls
        ├── lwc/
        │   ├── caseSummaryCardV2/      ← container
        │   ├── caseSummaryTile/        ← presentational tile
        │   └── caseRelatedListModal/   ← drill-down modal
        └── permissionsets/
            └── CaseSummaryCard_Access.permissionset-meta.xml
```

---

## License

MIT
