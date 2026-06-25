import { LightningElement, api } from 'lwc';

export default class CaseSummaryTile extends LightningElement {
    @api label;
    @api value;
    @api iconName;
    @api clickable = false;

    get tileClass() {
        return this.clickable ? 'tile tile_clickable' : 'tile';
    }

    handleClick() {
        if (!this.clickable) {
            return;
        }
        this.dispatchEvent(
            new CustomEvent('tileclick', { bubbles: true, composed: true })
        );
    }
}
