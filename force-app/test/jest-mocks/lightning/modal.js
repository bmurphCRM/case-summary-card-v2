import { LightningElement, api } from 'lwc';

export default class LightningModal extends LightningElement {
    @api size;
    @api label;
    @api description;

    static open = jest.fn().mockResolvedValue(undefined);

    close = jest.fn();
}
