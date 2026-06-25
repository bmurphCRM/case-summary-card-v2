import { THEMES, THEME_NAMES, CSS_VAR_MAP, resolvePalette, paletteToStyle } from '../themes';

const HEX = /^#[0-9a-fA-F]{6}$/;
const REQUIRED_KEYS = Object.keys(CSS_VAR_MAP);

describe('themes.js', () => {
    it('exports at least 16 themes plus Custom', () => {
        expect(THEME_NAMES.length).toBeGreaterThanOrEqual(17);
        expect(THEME_NAMES).toContain('Custom');
    });

    it('every non-Custom theme has all 9 color keys with hex values', () => {
        for (const name of THEME_NAMES) {
            if (name === 'Custom') continue;
            const theme = THEMES[name];
            for (const key of REQUIRED_KEYS) {
                expect(theme[key]).toMatch(HEX);
            }
        }
    });

    it('Custom theme is empty', () => {
        expect(Object.keys(THEMES.Custom)).toHaveLength(0);
    });

    it('resolvePalette falls back to theme when no overrides set', () => {
        const palette = resolvePalette('Ocean Blue', {});
        expect(palette.headerColor).toBe(THEMES['Ocean Blue'].headerColor);
        expect(palette.accentColor).toBe(THEMES['Ocean Blue'].accentColor);
    });

    it('resolvePalette lets overrides win over the theme', () => {
        const palette = resolvePalette('Ocean Blue', { headerColor: '#123456' });
        expect(palette.headerColor).toBe('#123456');
    });

    it('resolvePalette ignores blank string overrides', () => {
        const palette = resolvePalette('Ocean Blue', { headerColor: '  ' });
        expect(palette.headerColor).toBe(THEMES['Ocean Blue'].headerColor);
    });

    it('Custom theme + no overrides produces an empty merged palette', () => {
        expect(resolvePalette('Custom', {})).toEqual({});
    });

    it('Custom theme + overrides only uses overrides', () => {
        const palette = resolvePalette('Custom', { headerColor: '#abcdef' });
        expect(palette).toEqual({ headerColor: '#abcdef' });
    });

    it('paletteToStyle emits CSS custom property declarations', () => {
        const css = paletteToStyle({ headerColor: '#0B5CAB', accentColor: '#0176D3' });
        expect(css).toContain('--csc-header-color: #0B5CAB');
        expect(css).toContain('--csc-accent-color: #0176D3');
    });

    it('paletteToStyle returns empty for empty palette', () => {
        expect(paletteToStyle({})).toBe('');
    });
});
