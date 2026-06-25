import { api } from 'lwc';
import LightningModal from 'lightning/modal';
import getOpenActivities from '@salesforce/apex/CaseSummaryController.getOpenActivities';
import getNotes from '@salesforce/apex/CaseSummaryController.getNotes';
import getFiles from '@salesforce/apex/CaseSummaryController.getFiles';

const RELATION_ACTIVITIES = 'activities';
const RELATION_NOTES = 'notes';
const RELATION_FILES = 'files';

const ACTIVITY_COLUMNS = [
    { label: 'Subject', fieldName: 'subjectUrl', type: 'url',
      typeAttributes: { label: { fieldName: 'subject' }, target: '_self' } },
    { label: 'Type', fieldName: 'activityType', type: 'text' },
    { label: 'Date', fieldName: 'activityDate', type: 'date' },
    { label: 'Status', fieldName: 'status', type: 'text' },
    { label: 'Priority', fieldName: 'priority', type: 'text' },
    { label: 'Owner', fieldName: 'ownerName', type: 'text' }
];

const NOTE_COLUMNS = [
    { label: 'Title', fieldName: 'titleUrl', type: 'url',
      typeAttributes: { label: { fieldName: 'title' }, target: '_self' } },
    { label: 'Created By', fieldName: 'createdByName', type: 'text' },
    { label: 'Created', fieldName: 'createdDate', type: 'date' },
    { label: 'Size', fieldName: 'sizeLabel', type: 'text' }
];

const FILE_COLUMNS = [
    { label: 'Title', fieldName: 'titleUrl', type: 'url',
      typeAttributes: { label: { fieldName: 'title' }, target: '_self' } },
    { label: 'Type', fieldName: 'fileType', type: 'text' },
    { label: 'Extension', fieldName: 'fileExtension', type: 'text' },
    { label: 'Created By', fieldName: 'createdByName', type: 'text' },
    { label: 'Created', fieldName: 'createdDate', type: 'date' },
    { label: 'Size', fieldName: 'sizeLabel', type: 'text' }
];

function formatBytes(bytes) {
    if (bytes == null) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default class CaseRelatedListModal extends LightningModal {
    @api caseId;
    @api relation;
    @api headerColor;
    @api accentColor;

    rows = [];
    isLoading = true;
    errorMessage;
    truncated = false;

    connectedCallback() {
        this.loadData();
    }

    get columns() {
        if (this.relation === RELATION_ACTIVITIES) return ACTIVITY_COLUMNS;
        if (this.relation === RELATION_NOTES) return NOTE_COLUMNS;
        if (this.relation === RELATION_FILES) return FILE_COLUMNS;
        return [];
    }

    get hasRows() {
        return Array.isArray(this.rows) && this.rows.length > 0;
    }

    get isEmpty() {
        return !this.isLoading && !this.errorMessage && !this.hasRows;
    }

    get hostStyle() {
        const parts = [];
        if (this.headerColor) parts.push(`--csc-header-color: ${this.headerColor}`);
        if (this.accentColor) parts.push(`--csc-accent-color: ${this.accentColor}`);
        return parts.join('; ');
    }

    get emptyMessage() {
        if (this.relation === RELATION_NOTES) return 'No notes found for this case.';
        if (this.relation === RELATION_FILES) return 'No files found for this case.';
        return 'No open activities found for this case.';
    }

    async loadData() {
        this.isLoading = true;
        this.errorMessage = undefined;
        try {
            let raw;
            if (this.relation === RELATION_ACTIVITIES) {
                raw = await getOpenActivities({ caseId: this.caseId });
                this.rows = this.decorateActivities(raw || []);
            } else if (this.relation === RELATION_NOTES) {
                raw = await getNotes({ caseId: this.caseId });
                this.rows = this.decorateDocs(raw || []);
            } else if (this.relation === RELATION_FILES) {
                raw = await getFiles({ caseId: this.caseId });
                this.rows = this.decorateDocs(raw || []);
            } else {
                this.rows = [];
            }
            this.truncated = this.rows.length === 200;
        } catch (e) {
            this.errorMessage = (e && e.body && e.body.message) || e.message || 'Unable to load records.';
            this.rows = [];
        } finally {
            this.isLoading = false;
        }
    }

    decorateActivities(rawRows) {
        return rawRows.map((r) => ({
            Id: r.id,
            subject: r.subject || '',
            subjectUrl: `/lightning/r/${r.isTask ? 'Task' : 'Event'}/${r.id}/view`,
            activityType: r.isTask ? 'Task' : 'Event',
            activityDate: r.activityDate,
            status: r.status || '',
            priority: r.priority || '',
            ownerName: r.ownerName || ''
        }));
    }

    decorateDocs(rawRows) {
        return rawRows.map((r) => {
            const doc = r.ContentDocument || {};
            return {
                Id: r.Id,
                title: doc.Title || '',
                titleUrl: doc.Id || r.ContentDocumentId
                    ? `/lightning/r/ContentDocument/${r.ContentDocumentId}/view`
                    : '#',
                fileType: doc.FileType || '',
                fileExtension: doc.FileExtension || '',
                createdDate: doc.CreatedDate,
                createdByName: doc.CreatedBy && doc.CreatedBy.Name ? doc.CreatedBy.Name : '',
                sizeLabel: formatBytes(doc.ContentSize)
            };
        });
    }

    handleClose() {
        this.close('close');
    }
}
