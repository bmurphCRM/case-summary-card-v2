import { createElement } from 'lwc';
import CaseSummaryTile from 'c/caseSummaryTile';

function makeTile(props = {}) {
    const el = createElement('c-case-summary-tile', { is: CaseSummaryTile });
    Object.assign(el, { label: 'Open Activities', value: '3', iconName: 'standard:task', ...props });
    document.body.appendChild(el);
    return el;
}

describe('caseSummaryTile', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('renders a button when clickable', () => {
        const el = makeTile({ clickable: true });
        const btn = el.shadowRoot.querySelector('button.tile');
        expect(btn).not.toBeNull();
    });

    it('renders a div when not clickable', () => {
        const el = makeTile({ clickable: false });
        expect(el.shadowRoot.querySelector('button.tile')).toBeNull();
        expect(el.shadowRoot.querySelector('div.tile')).not.toBeNull();
    });

    it('fires tileclick when clicked while clickable', () => {
        const el = makeTile({ clickable: true });
        const handler = jest.fn();
        el.addEventListener('tileclick', handler);
        el.shadowRoot.querySelector('button.tile').click();
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('does not fire tileclick when not clickable', () => {
        const el = makeTile({ clickable: false });
        const handler = jest.fn();
        el.addEventListener('tileclick', handler);
        el.shadowRoot.querySelector('div.tile').click();
        expect(handler).not.toHaveBeenCalled();
    });

    it('renders label and value', () => {
        const el = makeTile({ clickable: true });
        const text = el.shadowRoot.querySelector('.tile').textContent;
        expect(text).toContain('Open Activities');
        expect(text).toContain('3');
    });
});
