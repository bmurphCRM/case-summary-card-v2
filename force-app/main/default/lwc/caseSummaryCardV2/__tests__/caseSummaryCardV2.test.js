import { createElement } from 'lwc';
import CaseSummaryCard from 'c/caseSummaryCardV2';
import { formatDuration } from 'c/caseSummaryCardV2';
import CaseRelatedListModal from 'c/caseRelatedListModal';
import getCaseSummary from '@salesforce/apex/CaseSummaryController.getCaseSummary';

jest.mock(
    '@salesforce/apex/CaseSummaryController.getCaseSummary',
    () => {
        const { createApexTestWireAdapter } = require('@salesforce/sfdx-lwc-jest');
        return { default: createApexTestWireAdapter(jest.fn()) };
    },
    { virtual: true }
);

jest.mock(
    '@salesforce/apex',
    () => ({ refreshApex: jest.fn().mockResolvedValue(undefined) }),
    { virtual: true }
);

jest.mock('c/caseRelatedListModal');

function flushPromises() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

function makeElement(props = {}) {
    const el = createElement('c-case-summary-card-v2', { is: CaseSummaryCard });
    Object.assign(el, { recordId: '500000000000000AAA', ...props });
    document.body.appendChild(el);
    return el;
}

describe('caseSummaryCard', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    it('renders 4 tiles when summary data resolves', async () => {
        const el = makeElement();
        getCaseSummary.emit({
            caseId: '500000000000000AAA',
            createdDate: new Date(Date.now() - 5000).toISOString(),
            closedDate: null,
            isClosed: false,
            openActivityCount: 3,
            noteCount: 1,
            fileCount: 2
        });
        await flushPromises();

        const tiles = el.shadowRoot.querySelectorAll('c-case-summary-tile');
        expect(tiles).toHaveLength(4);
    });

    it('uses "Closed after" prefix for closed cases', async () => {
        const created = Date.now() - 5 * 24 * 60 * 60 * 1000;
        const closed = created + 2 * 60 * 60 * 1000;
        const el = makeElement();
        getCaseSummary.emit({
            caseId: '500000000000000AAA',
            createdDate: new Date(created).toISOString(),
            closedDate: new Date(closed).toISOString(),
            isClosed: true,
            openActivityCount: 0,
            noteCount: 0,
            fileCount: 0
        });
        await flushPromises();

        const tiles = el.shadowRoot.querySelectorAll('c-case-summary-tile');
        expect(tiles[0].label).toBe('Closed after');
    });

    it('renders an error block when wire emits an error', async () => {
        const el = makeElement();
        getCaseSummary.emitError({ body: { message: 'boom' } });
        await flushPromises();

        const err = el.shadowRoot.querySelector('.csc-state_error');
        expect(err).not.toBeNull();
        expect(err.textContent).toContain('boom');
    });

    it('opens the modal with relation=activities when activities tile clicked', async () => {
        CaseRelatedListModal.open.mockResolvedValue(undefined);
        const el = makeElement();
        getCaseSummary.emit({
            caseId: '500000000000000AAA',
            createdDate: new Date(Date.now() - 5000).toISOString(),
            closedDate: null,
            isClosed: false,
            openActivityCount: 3,
            noteCount: 1,
            fileCount: 2
        });
        await flushPromises();

        const tiles = el.shadowRoot.querySelectorAll('c-case-summary-tile');
        const activitiesTile = tiles[1];
        activitiesTile.dispatchEvent(
            new CustomEvent('tileclick', { bubbles: true, composed: true })
        );
        await flushPromises();

        expect(CaseRelatedListModal.open).toHaveBeenCalledTimes(1);
        const opts = CaseRelatedListModal.open.mock.calls[0][0];
        expect(opts.relation).toBe('activities');
        expect(opts.caseId).toBe('500000000000000AAA');
    });

    it('applies theme CSS custom properties to the root article', async () => {
        const el = makeElement({ colorTheme: 'Crimson' });
        getCaseSummary.emit({
            caseId: '500000000000000AAA',
            createdDate: new Date().toISOString(),
            isClosed: false,
            openActivityCount: 0,
            noteCount: 0,
            fileCount: 0
        });
        await flushPromises();

        const card = el.shadowRoot.querySelector('.csc-card');
        const style = card.getAttribute('style');
        expect(style).toContain('--csc-header-color: #9B1B30');
    });

    it('hex override beats the theme palette', async () => {
        const el = makeElement({ colorTheme: 'Ocean Blue', titleHeaderColor: '#123456' });
        getCaseSummary.emit({
            caseId: '500000000000000AAA',
            createdDate: new Date().toISOString(),
            isClosed: false,
            openActivityCount: 0,
            noteCount: 0,
            fileCount: 0
        });
        await flushPromises();

        const card = el.shadowRoot.querySelector('.csc-card');
        expect(card.getAttribute('style')).toContain('--csc-header-color: #123456');
    });

    it('Custom theme with no overrides yields empty style', async () => {
        const el = makeElement({ colorTheme: 'Custom' });
        getCaseSummary.emit({
            caseId: '500000000000000AAA',
            createdDate: new Date().toISOString(),
            isClosed: false,
            openActivityCount: 0,
            noteCount: 0,
            fileCount: 0
        });
        await flushPromises();

        const card = el.shadowRoot.querySelector('.csc-card');
        const style = card.getAttribute('style') || '';
        expect(style).toBe('');
    });
});

describe('formatDuration', () => {
    it('returns 0s for sub-second elapsed', () => {
        expect(formatDuration(0)).toBe('0s');
        expect(formatDuration(500)).toBe('0s');
    });

    it('collapses leading zero units', () => {
        expect(formatDuration(45 * 1000)).toBe('45s');
        expect(formatDuration(4 * 60 * 1000 + 12 * 1000)).toBe('4m 12s');
        expect(formatDuration(2 * 3600 * 1000 + 4 * 60 * 1000 + 12 * 1000)).toBe('2h 4m 12s');
        expect(
            formatDuration(5 * 86400 * 1000 + 3 * 3600 * 1000 + 22 * 60 * 1000 + 14 * 1000)
        ).toBe('5d 3h 22m 14s');
    });

    it('keeps trailing zero units once a larger one is present', () => {
        expect(formatDuration(60 * 1000)).toBe('1m 0s');
        expect(formatDuration(3600 * 1000)).toBe('1h 0m 0s');
        expect(formatDuration(86400 * 1000)).toBe('1d 0h 0m 0s');
    });
});
