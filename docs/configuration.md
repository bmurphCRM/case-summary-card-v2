# Configuration Reference

Detailed reference for every property exposed by **Case Summary Card V2**.

---

## Property Matrix

| Property | Type | Default | Targets | Description |
|---|---|---|---|---|
| `recordId` | String | _auto on Record Page_ | App Page, Home Page, Community | Salesforce Id of the Case to summarize. Auto-bound on `lightning__RecordPage`. |
| `title` | String | `Case Summary` | All | Header title text displayed above the tiles. |
| `subtitle` | String | _(empty)_ | All | Optional smaller text shown directly below the title. |
| `colorTheme` | String picklist | `Ocean Blue` | All | Name of a built-in palette, or `Custom` to start from scratch. |
| `titleHeaderColor` | String (`#RRGGBB`) | _(theme)_ | All | Header title and header icon color. |
| `backgroundColor` | String (`#RRGGBB`) | _(theme)_ | All | Card background color. |
| `outlineColor` | String (`#RRGGBB`) | _(theme)_ | All | Card border color. |
| `tileBackgroundColor` | String (`#RRGGBB`) | _(theme)_ | All | Each tile's background. |
| `tileBorderColor` | String (`#RRGGBB`) | _(theme)_ | All | Each tile's border. |
| `tileIconColor` | String (`#RRGGBB`) | _(theme)_ | All | Tile icon foreground color. |
| `tileLabelColor` | String (`#RRGGBB`) | _(theme)_ | All | Tile label (uppercase) text color. |
| `tileValueColor` | String (`#RRGGBB`) | _(theme)_ | All | Tile big-number value color. |
| `accentColor` | String (`#RRGGBB`) | _(theme)_ | All | Focus ring + hover accent. |

All `*Color` properties accept the `#RRGGBB` hex form. Blank values defer to the selected theme.

---

## Resolution Order (per color slot)

```
1. Admin-supplied hex value         (if non-empty, wins)
        │
        └─► 2. Selected theme's color  (if a theme is selected and has the slot)
                  │
                  └─► 3. SLDS 2 design token fallback inside CSS var(…)
                          │
                          └─► 4. Hard-coded literal fallback (last resort)
```

### Example — admin sets Crimson theme and overrides only `titleHeaderColor`

| Slot | Resolved value | Source |
|---|---|---|
| `titleHeaderColor` | `#000000` (admin override) | step 1 |
| `backgroundColor` | `#FCF3F4` (Crimson card bg) | step 2 |
| `outlineColor` | `#EFC9D0` (Crimson outline) | step 2 |
| `tileIconColor` | `#C9304B` (Crimson icon) | step 2 |
| `accentColor` | `#C9304B` (Crimson accent) | step 2 |

---

## Theme Catalog

Light themes intended for default Lightning Experience:
- Ocean Blue, Forest Green, Sunset Orange, Royal Purple, Professional Slate, Crimson, Teal Modern, Goldenrod, Rose Quartz, Mint Fresh, Indigo, Sandstone

Dark themes intended for dark-mode pages or Experience Cloud sites with dark backgrounds:
- Midnight, Carbon, Graphite, Volt Cyber

Special:
- **Custom** — empty palette. Use this when you want every color admin-supplied.

See the full hex table in [README.md → Color Themes](../README.md#color-themes).

---

## Per-Target Notes

### `lightning__RecordPage`
- `recordId` is auto-bound and is **not** exposed as a configurable property on this target. The component is locked to `Case`.

### `lightning__AppPage` / `lightning__HomePage`
- `recordId` is exposed as a manual property. Admins must paste or bind a 15/18-character Case Id.
- Useful when you want to surface a "watched" Case on a dashboard-style page.

### `lightningCommunity__Default` (Experience Cloud)
- `recordId` defaults to `{!recordId}`, which resolves against the page's URL param. On a Case detail page in Experience Cloud, this binds automatically.
- For custom community pages, bind `recordId` to whatever page-state expression resolves to the Case Id.

---

## Permission Set

`CaseSummaryCard_Access` grants:
- `CaseSummaryController` Apex class access
- `CaseSummaryDTO` Apex class access

Assign it to any profile/permission-set group that should be able to view the component:

```bash
sf org assign permset -n CaseSummaryCard_Access -o <alias>
```

Object permissions (`Case`, `Task`, `Event`, `ContentDocument`, `ContentDocumentLink`) are **not** part of this permission set — they should come from the user's existing profile. The component honors sharing and field-level security at the SOQL layer via `with sharing` + `WITH USER_MODE`.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Component shows a spinner indefinitely | `recordId` is null | On non-Record-Page targets, ensure `recordId` is mapped in the App Builder property panel. |
| Tile shows `0` but you can see records on the page | User lacks read access to the underlying objects | The component honors sharing — grant `Case`, `Task`, `Event`, or `ContentDocumentLink` read as appropriate. |
| Color override is ignored | Hex value is blank or malformed | Use `#RRGGBB` (e.g. `#0B5CAB`). The browser silently ignores invalid CSS values. |
| Header color matches theme even though I set `titleHeaderColor` | Whitespace-only override is treated as blank | Trim whitespace; the resolver ignores strings whose `.trim()` is empty. |
| Modal opens but is empty | No records exist OR user can't see them | Empty state message will say "No <records> found." If 200+ rows exist, you'll see a "Showing first 200" banner. |
| Age tile says "—" | `createdDate` not yet wired | Brief flicker between mount and first wire response — normal. If it persists, the wire is erroring; check the error banner. |
