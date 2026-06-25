# Architecture

A deep-dive into how `caseSummaryCardV2` is structured. Read this if you're extending the component, debugging a behavior, or evaluating it for an org with custom requirements.

---

## Component Tree

```
caseSummaryCardV2 (container, @api props, @wire Apex)
├─ <header>
│   ├─ <lightning-icon icon-name="standard:case">
│   ├─ {title}
│   └─ {subtitle}
└─ <div.csc-tiles>
    ├─ <c-case-summary-tile data-id="age">         (clickable=false)
    ├─ <c-case-summary-tile data-id="activities">  (clickable=true) → modal(relation="activities")
    ├─ <c-case-summary-tile data-id="notes">       (clickable=true) → modal(relation="notes")
    └─ <c-case-summary-tile data-id="files">       (clickable=true) → modal(relation="files")
```

The container handles all data + theme + timer logic. The tile is purely presentational. The modal is a `LightningModal` subclass.

---

## Data Flow

```
┌──────────────────────────┐
│ caseSummaryCardV2.js     │
│                          │
│   @wire getCaseSummary ──┼──► CaseSummaryController.getCaseSummary(caseId)
│   _wiredResult          ◄┼──── CaseSummaryDTO
│                          │
│   setInterval(1s) ──► _now (reactive @track) ──► caseAgeLabel getter
│                          │
│   handleTileClick() ─────┼──► CaseRelatedListModal.open({
│                          │       relation, caseId, headerColor, accentColor
│                          │     })
│                          │
│   modal closes ──────────┼──► refreshApex(_wiredResult) ──► fresh counts
└──────────────────────────┘
```

### Wire lifecycle

1. `recordId` is auto-bound on `lightning__RecordPage`; on other targets the admin sets it.
2. `@wire(getCaseSummary, { caseId: '$recordId' })` fires whenever `recordId` changes.
3. The wire setter stores the raw `result` for `refreshApex`, populates `_summary`, and stops the timer if `isClosed === true`.
4. Errors are normalized via `extractError(err)` into `_error`.

### Timer lifecycle

1. `connectedCallback()` initializes `_now = Date.now()` and starts `setInterval(() => this._now = Date.now(), 1000)`.
2. The wire setter clears the interval if the case is already closed when data first arrives.
3. `disconnectedCallback()` always clears the interval.
4. `caseAgeLabel` (getter) reads `this._now` every render; because `_now` is `@track`-reactive, the tile re-renders every second without any explicit subscription.

### Modal data flow

The modal is a single component with three modes selected by the `relation` prop:

```
                   ┌──── relation === 'activities' ──► getOpenActivities()
caseRelatedListModal ─┤
                   ├──── relation === 'notes'      ──► getNotes()
                   │
                   └──── relation === 'files'      ──► getFiles()
```

Each path decorates the raw Apex results into a flat datatable-friendly shape:
- Activities → `{ Id, subject, subjectUrl, activityType, activityDate, status, priority, ownerName }`
- Notes / Files → `{ Id, title, titleUrl, fileType, fileExtension, createdDate, createdByName, sizeLabel }`

URL-typed columns use `/lightning/r/{ObjectType}/{Id}/view` so clicking a row title navigates natively without needing `NavigationMixin` inside the modal.

---

## Theming Architecture

### CSS Custom Property Pipeline

```
[admin-supplied hex props]    [colorTheme picklist]    [SLDS 2 design tokens]
        │                              │                          │
        ▼                              ▼                          ▼
    overrides {…}              THEMES[themeName]            var(…, fallback)
        │                              │                          │
        └────────── resolvePalette ────┘                          │
                          │                                       │
                          ▼                                       │
                  merged palette {key: hex}                       │
                          │                                       │
                          ▼                                       │
                    paletteToStyle                                │
                          │                                       │
                          ▼                                       │
              "--csc-header-color: #…; --csc-…"                   │
                          │                                       │
                          ▼                                       │
        <article class="csc-card" style={hostStyle}>              │
                          │                                       │
                          ▼                                       │
             CSS: var(--csc-header-color, var(--slds-g-…, fallback))
```

**Resolution order (per color slot):**
1. Admin-supplied hex via `@api` property (non-blank string)
2. The selected theme's color
3. SLDS 2 design-token fallback inside the CSS `var(...)` call
4. Hard-coded literal fallback (last-resort)

### The 9 color slots

| Slot key | CSS variable | What it colors |
|---|---|---|
| `headerColor` | `--csc-header-color` | Card header title text + header icon |
| `backgroundColor` | `--csc-background-color` | Card background |
| `outlineColor` | `--csc-outline-color` | Card border |
| `tileBackgroundColor` | `--csc-tile-background-color` | Each tile's background |
| `tileBorderColor` | `--csc-tile-border-color` | Each tile's border |
| `tileIconColor` | `--csc-tile-icon-color` | Tile icon foreground (via `--sds-c-icon-color-foreground-default`) |
| `tileLabelColor` | `--csc-tile-label-color` | Tile small uppercase label |
| `tileValueColor` | `--csc-tile-value-color` | Tile big-number value |
| `accentColor` | `--csc-accent-color` | Hover border / focus-visible ring |

### Why CSS custom properties (not inline per-element styles)?

- **Cascade**: a single declaration on `.csc-card` flows into the nested `c-case-summary-tile` shadow DOM via CSS inheritance — no prop drilling required.
- **SLDS 2 compatibility**: `--csc-*` vars are read inside `var(--csc-foo, var(--slds-g-…))` fallback chains, so admins who set nothing still get the SLDS look.
- **Modal scope**: the modal lives in a separate shadow root (Salesforce's overlay container). We pass `headerColor` and `accentColor` as direct props and apply them inline on the modal header so the theme is still recognizable.

---

## Adaptive Duration Formatter

`formatDuration(elapsedMs)` lives in `caseSummaryCardV2.js` and is exported for unit testing.

```
elapsedMs < 1000        → "0s"
0..59s                  → "Ns"
1m..59m 59s             → "Nm Ss"
1h..23h 59m 59s         → "Nh Mm Ss"
≥ 1d                    → "Nd Hh Mm Ss"
```

Rules:
- Drop **leading** zero units, but keep trailing zero units once a larger unit is non-zero (so `1h` becomes `"1h 0m 0s"`, not `"1h"`).
- Clamp negative elapsed (clock skew) to `0s`.
- Days are uncapped (`812d 3h 22m 14s` is fine). No months/years to avoid variable-length-month ambiguity.

---

## Apex Layer

### `CaseSummaryController`

`with sharing`, `@AuraEnabled(cacheable=true)` on all reads. Each method wraps its body in `try/catch` and rethrows as `AuraHandledException` with a sanitized message.

**Why `cacheable=true` despite counts changing?** Wire caching is request-scoped; users refresh by triggering a wire re-evaluation (e.g., the modal close → `refreshApex` chain).

**Why `with sharing` and not `inherited`?** Defensive default — even if a parent context is `without sharing`, we still want sharing rules enforced on a per-user case summary.

### `OpenActivityRow` inner class

A flat DTO that unifies Task + Event rows for the modal datatable. This lets the LWC datatable consume a single column definition for activities, with `isTask` driving the URL prefix (`Task` vs `Event`).

### `WITH USER_MODE`

Used on `Case` and `ContentDocumentLink` queries to enforce field-level security and CRUD at the SOQL layer. Not used on `Task` / `Event` because `WITH USER_MODE` plus aggregate `COUNT()` queries against those objects has tighter restrictions; sharing is still enforced because `with sharing` is declared at the class level.

---

## Testing Strategy

### Jest unit tests
- **themes.test.js** — pure logic, no DOM. Validates every theme entry has 9 hex colors and that `resolvePalette` / `paletteToStyle` behave per spec.
- **caseSummaryCardV2.test.js** — uses `createApexTestWireAdapter` to drive the wire; uses `jest.useFakeTimers()` for the ticking timer; asserts CSS custom properties land on the rendered `style` attribute.
- **caseSummaryTile.test.js** — clickable vs non-clickable rendering, `tileclick` event emission.
- **caseRelatedListModal.test.js** — imperative Apex calls per relation, error state, file size formatting.

### Apex tests
- `CaseSummaryControllerTest` creates a Case + open Tasks + future Events + 1 Note + 2 Files in `@TestSetup`.
- Tests assert count semantics, closed-case behavior, and `AuraHandledException` for invalid inputs.

### Manual smoke
1. Drop the component on a Case Lightning Record Page.
2. Verify age tile ticks every second.
3. Close the case (Status → Closed) — confirm tile flips to "Closed after …" and stops ticking.
4. Click each non-age tile — confirm modal opens with correct rows; click a row title — confirm native navigation.
5. Cycle through 5 themes in App Builder — confirm visual difference.
6. Set a hex override — confirm it wins over the theme.

---

## Extension Points

Want to extend this? A few natural seams:

- **Add a tile**: extend the `tiles` getter in `caseSummaryCardV2.js`. For a new clickable type, add a relation key in the modal `relation` switch and a new Apex method + column def.
- **Add a theme**: append an entry to `THEMES` in `themes.js`. The picklist in `js-meta.xml` `datasource` attribute also needs the new name appended (kept in sync manually).
- **Switch to a different object**: replace `Case` references in `CaseSummaryController` and `caseSummaryCardV2.js-meta.xml` (`<objects>` block) — the LWC itself is object-agnostic apart from the icon and labels.
- **Pause timer on page hide**: add a `visibilitychange` listener in `connectedCallback`; `clearInterval` when hidden, restart when visible.
