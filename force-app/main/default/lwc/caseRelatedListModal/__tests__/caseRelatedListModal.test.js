import { createElement } from 'lwc';
import CaseRelatedListModal from 'c/caseRelatedListModal';
import getOpenActivities from '@salesforce/apex/CaseSummaryController.getOpenActivities';
import getNotes from '@salesforce/apex/CaseSummaryController.getNotes';
import getFiles from '@salesforce/apex/CaseSummaryController.getFiles';

jest.mock(
    '@salesforce/apex/CaseSummaryController.getOpenActivities',
    () => ({ default: jest.fn() }),
    { virtual: true }
);
jest.mock(
    '@salesforce/apex/CaseSummaryController.getNotes',
    () => ({ default: jest.fn() }),
    { virtual: true }
);
jest.mock(
    '@salesforce/apex/CaseSummaryController.getFiles',
    () => ({ default: jest.fn() }),
    { virtual: true }
);

function flushPromises() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

function makeModal(props = {}) {
    const el = createElement('c-case-related-list-modal', { is: CaseRelatedListModal });
    Object.assign(el, { caseId: '500x', relation: 'activities', ...props });
    document.body.appendChild(el);
    return el;
}

describe('caseRelatedListModal', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    it('loads activities when relation=activities', async () => {
        getOpenActivities.mockResolvedValue([
            { id: '00T1', subject: 'Follow up', isTask: true, ownerName: 'Alice' }
        ]);
        makeModal({ relation: 'activities' });
        await flushPromises();
        await flushPromises();

        expect(getOpenActivities).toHaveBeenCalledWith({ caseId: '500x' });
    });

    it('loads notes when relation=notes', async () => {
        getNotes.mockResolvedValue([]);
        makeModal({ relation: 'notes' });
        await flushPromises();
        await flushPromises();

        expect(getNotes).toHaveBeenCalledWith({ caseId: '500x' });
    });

    it('loads files when relation=files', async () => {
        getFiles.mockResolvedValue([]);
        makeModal({ relation: 'files' });
        await flushPromises();
        await flushPromises();

        expect(getFiles).toHaveBeenCalledWith({ caseId: '500x' });
    });

    it('renders an error state when Apex rejects', async () => {
        getOpenActivities.mockRejectedValue({ body: { message: 'kaboom' } });
        const el = makeModal({ relation: 'activities' });
        await flushPromises();
        await flushPromises();

        const errEl = el.shadowRoot.querySelector('.state_error');
        expect(errEl).not.toBeNull();
        expect(errEl.textContent).toContain('kaboom');
    });

    it('formats file size labels', async () => {
        getFiles.mockResolvedValue([
            {
                Id: 'cdl1',
                ContentDocumentId: 'doc1',
                ContentDocument: {
                    Id: 'doc1',
                    Title: 'spec.pdf',
                    FileType: 'PDF',
                    FileExtension: 'pdf',
                    ContentSize: 2048,
                    CreatedBy: { Name: 'Bob' }
                }
            }
        ]);
        const el = makeModal({ relation: 'files' });
        await flushPromises();
        await flushPromises();

        const table = el.shadowRoot.querySelector('lightning-datatable');
        expect(table).not.toBeNull();
        expect(table.data[0].sizeLabel).toBe('2.0 KB');
        expect(table.data[0].titleUrl).toContain('/lightning/r/ContentDocument/doc1/view');
    });
});
