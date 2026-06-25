import { LightningElement, api, wire, track } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import getCaseSummary from '@salesforce/apex/CaseSummaryController.getCaseSummary';
import CaseRelatedListModal from 'c/caseRelatedListModal';
import { resolvePalette, paletteToStyle } from './themes';

const TICK_MS = 1000;
const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

const TILE_ACTIVITIES = 'activities';
const TILE_NOTES = 'notes';
const TILE_FILES = 'files';

export default class CaseSummaryCard extends LightningElement {
    @api recordId;

    @api title = 'Case Summary';
    @api subtitle = '';
    @api colorTheme = 'Ocean Blue';

    @api titleHeaderColor = '';
    @api backgroundColor = '';
    @api outlineColor = '';
    @api tileBackgroundColor = '';
    @api tileBorderColor = '';
    @api tileIconColor = '';
    @api tileLabelColor = '';
    @api tileValueColor = '';
    @api accentColor = '';

    @track _now = Date.now();
    _summary;
    _wiredResult;
    _error;
    _timerId;

    @wire(getCaseSummary, { caseId: '$recordId' })
    wiredSummary(result) {
        this._wiredResult = result;
        if (result.data) {
            this._summary = result.data;
            this._error = undefined;
            if (result.data.isClosed) {
                this.stopTimer();
            } else {
                this.startTimer();
            }
        } else if (result.error) {
            this._summary = undefined;
            this._error = this.extractError(result.error);
        }
    }

    connectedCallback() {
        this._now = Date.now();
        this.startTimer();
    }

    disconnectedCallback() {
        this.stopTimer();
    }

    startTimer() {
        if (this._timerId) return;
        this._timerId = setInterval(() => {
            this._now = Date.now();
        }, TICK_MS);
    }

    stopTimer() {
        if (this._timerId) {
            clearInterval(this._timerId);
            this._timerId = undefined;
        }
    }

    get hasData() {
        return !!this._summary;
    }

    get isLoading() {
        return !this._summary && !this._error;
    }

    get hasError() {
        return !!this._error;
    }

    get errorMessage() {
        return this._error || '';
    }

    get palette() {
        return resolvePalette(this.colorTheme, {
            headerColor: this.titleHeaderColor,
            backgroundColor: this.backgroundColor,
            outlineColor: this.outlineColor,
            tileBackgroundColor: this.tileBackgroundColor,
            tileBorderColor: this.tileBorderColor,
            tileIconColor: this.tileIconColor,
            tileLabelColor: this.tileLabelColor,
            tileValueColor: this.tileValueColor,
            accentColor: this.accentColor
        });
    }

    get hostStyle() {
        return paletteToStyle(this.palette);
    }

    get caseAgeLabel() {
        if (!this._summary || !this._summary.createdDate) return '';
        const createdMs = new Date(this._summary.createdDate).getTime();
        const closed = this._summary.isClosed && this._summary.closedDate;
        const endMs = closed ? new Date(this._summary.closedDate).getTime() : this._now;
        const elapsed = Math.max(0, endMs - createdMs);
        return formatDuration(elapsed);
    }

    get caseAgePrefix() {
        if (!this._summary) return '';
        return this._summary.isClosed ? 'Closed after' : 'Open for';
    }

    get tiles() {
        const s = this._summary || {};
        return [
            {
                id: 'age',
                label: this.caseAgePrefix,
                value: this.caseAgeLabel || '—',
                iconName: 'utility:clock',
                clickable: false
            },
            {
                id: TILE_ACTIVITIES,
                label: 'Open Activities',
                value: this.formatCount(s.openActivityCount),
                iconName: 'standard:task',
                clickable: true
            },
            {
                id: TILE_NOTES,
                label: 'Notes',
                value: this.formatCount(s.noteCount),
                iconName: 'standard:note',
                clickable: true
            },
            {
                id: TILE_FILES,
                label: 'Files',
                value: this.formatCount(s.fileCount),
                iconName: 'standard:file',
                clickable: true
            }
        ];
    }

    formatCount(n) {
        if (n === undefined || n === null) return '0';
        return String(n);
    }

    extractError(err) {
        if (!err) return 'Unknown error';
        if (err.body) {
            if (Array.isArray(err.body)) {
                return err.body.map((b) => b.message).join(', ');
            }
            if (err.body.message) return err.body.message;
        }
        return err.message || 'Unknown error';
    }

    async handleTileClick(event) {
        const tileId = event.currentTarget.dataset.id;
        if (!tileId || tileId === 'age') return;

        const labels = {
            [TILE_ACTIVITIES]: 'Open Activities',
            [TILE_NOTES]: 'Notes',
            [TILE_FILES]: 'Files'
        };

        await CaseRelatedListModal.open({
            size: 'medium',
            label: labels[tileId] || 'Related List',
            relation: tileId,
            caseId: this.recordId,
            headerColor: this.palette.headerColor,
            accentColor: this.palette.accentColor
        });

        if (this._wiredResult) {
            refreshApex(this._wiredResult);
        }
    }
}

export function formatDuration(elapsedMs) {
    if (!elapsedMs || elapsedMs < MS_PER_SECOND) return '0s';
    const days = Math.floor(elapsedMs / MS_PER_DAY);
    const hours = Math.floor((elapsedMs % MS_PER_DAY) / MS_PER_HOUR);
    const minutes = Math.floor((elapsedMs % MS_PER_HOUR) / MS_PER_MINUTE);
    const seconds = Math.floor((elapsedMs % MS_PER_MINUTE) / MS_PER_SECOND);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (days > 0 || hours > 0) parts.push(`${hours}h`);
    if (days > 0 || hours > 0 || minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    return parts.join(' ');
}
