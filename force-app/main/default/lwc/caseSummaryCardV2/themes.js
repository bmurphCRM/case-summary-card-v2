const t = (headerColor, backgroundColor, outlineColor, tileBackgroundColor, tileBorderColor, tileIconColor, tileLabelColor, tileValueColor, accentColor) => ({
    headerColor,
    backgroundColor,
    outlineColor,
    tileBackgroundColor,
    tileBorderColor,
    tileIconColor,
    tileLabelColor,
    tileValueColor,
    accentColor
});

export const THEMES = {
    'Ocean Blue':           t('#0B5CAB', '#F4F8FC', '#D4E2F2', '#FFFFFF', '#D4E2F2', '#0176D3', '#54698D', '#0B2545', '#0176D3'),
    'Forest Green':         t('#0F6B3A', '#F2F8F4', '#CFE3D6', '#FFFFFF', '#CFE3D6', '#0B8E3B', '#4D6657', '#0E2A1A', '#0B8E3B'),
    'Sunset Orange':        t('#C8501D', '#FFF6F0', '#F7D9C4', '#FFFFFF', '#F7D9C4', '#FE9339', '#7A5443', '#3A1A0A', '#FE9339'),
    'Royal Purple':         t('#5A2EA6', '#F6F3FC', '#DDD0F2', '#FFFFFF', '#DDD0F2', '#8B44D6', '#5F507A', '#221045', '#8B44D6'),
    'Professional Slate':   t('#3E3E3C', '#F4F4F5', '#DDDBD9', '#FFFFFF', '#DDDBD9', '#706E6B', '#5C5B59', '#181818', '#706E6B'),
    'Crimson':              t('#9B1B30', '#FCF3F4', '#EFC9D0', '#FFFFFF', '#EFC9D0', '#C9304B', '#7A4F58', '#37080F', '#C9304B'),
    'Teal Modern':          t('#0D7C8B', '#F0F8F9', '#C7E2E6', '#FFFFFF', '#C7E2E6', '#11A2B5', '#4D6E73', '#06303A', '#11A2B5'),
    'Goldenrod':            t('#A77900', '#FBF6E6', '#EEDFAE', '#FFFFFF', '#EEDFAE', '#D5A021', '#7A6520', '#3A2C00', '#D5A021'),
    'Midnight':             t('#0F172A', '#1E293B', '#334155', '#273449', '#3A4A66', '#7DD3FC', '#94A3B8', '#F8FAFC', '#38BDF8'),
    'Carbon':               t('#111111', '#1E1E1E', '#2C2C2C', '#262626', '#3A3A3A', '#FF7A59', '#A0A0A0', '#F5F5F5', '#FF7A59'),
    'Graphite':             t('#1F2937', '#2B2F36', '#3C434D', '#343941', '#4A515B', '#A7F3D0', '#9CA3AF', '#F3F4F6', '#34D399'),
    'Rose Quartz':          t('#A23B5B', '#FDF4F7', '#F2CFDA', '#FFFFFF', '#F2CFDA', '#D4567A', '#7A5862', '#3A0E1E', '#D4567A'),
    'Mint Fresh':           t('#1E8E66', '#F0FAF6', '#C6E8D9', '#FFFFFF', '#C6E8D9', '#2EBA88', '#4F706A', '#0B2A22', '#2EBA88'),
    'Indigo':               t('#3730A3', '#F3F2FB', '#D0CCF0', '#FFFFFF', '#D0CCF0', '#4F46E5', '#5C5A78', '#1E1B4B', '#4F46E5'),
    'Sandstone':            t('#8A6B3B', '#FBF6EE', '#E7D6B5', '#FFFFFF', '#E7D6B5', '#B8893E', '#7A6A4F', '#3A2A14', '#B8893E'),
    'Volt Cyber':           t('#0A0A0A', '#0F1115', '#1F2933', '#161A20', '#2A3340', '#A3E635', '#94A3B8', '#F1F5F9', '#A3E635'),
    'Custom':               {}
};

export const THEME_NAMES = Object.keys(THEMES);

export const CSS_VAR_MAP = {
    headerColor: '--csc-header-color',
    backgroundColor: '--csc-background-color',
    outlineColor: '--csc-outline-color',
    tileBackgroundColor: '--csc-tile-background-color',
    tileBorderColor: '--csc-tile-border-color',
    tileIconColor: '--csc-tile-icon-color',
    tileLabelColor: '--csc-tile-label-color',
    tileValueColor: '--csc-tile-value-color',
    accentColor: '--csc-accent-color'
};

export function resolvePalette(themeName, overrides = {}) {
    const palette = THEMES[themeName] || {};
    const merged = {};
    for (const key of Object.keys(CSS_VAR_MAP)) {
        const override = overrides[key];
        if (override && override.trim().length > 0) {
            merged[key] = override.trim();
        } else if (palette[key]) {
            merged[key] = palette[key];
        }
    }
    return merged;
}

export function paletteToStyle(palette) {
    return Object.entries(palette)
        .filter(([, v]) => !!v)
        .map(([k, v]) => `${CSS_VAR_MAP[k]}: ${v}`)
        .join('; ');
}
