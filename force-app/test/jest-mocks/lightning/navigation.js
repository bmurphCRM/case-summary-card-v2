export const CurrentPageReference = jest.fn();

const Navigate = Symbol('Navigate');
const GenerateUrl = Symbol('GenerateUrl');

export const NavigationMixin = {
    Navigate,
    GenerateUrl,
    mixin(Base) {
        return class extends Base {
            [Navigate](_pageReference, _replace) {}
            [GenerateUrl](_pageReference) {
                return Promise.resolve('');
            }
        };
    }
};
