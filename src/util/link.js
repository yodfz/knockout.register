import {
    hasOwn,
    every,
    eachDict,
    toArray,
    isFunction,
    validArray
} from './index';

export const linkedLabel = '__hasLinked';
export const unlinkMethodLabel = '__unlink';

function isArrayObservable(target) {
    return ko.isObservable(target) && isFunction(target.push);
}

// Link array observable with validators
//
// @param {Function} observable
// @param {Object|Function} validator
export function linkArrayObservable(observable, validator) {
    if (!isArrayObservable(observable) || observable[linkedLabel]) {
        return;
    }

    const originPush = observable.push;
    const originUnshift = observable.unshift;
    const originSplice = observable.splice;

    observable[unlinkMethodLabel] = () => {
        observable.push = originPush;
        observable.unshift = originUnshift;
        observable.splice = originSplice;
        delete observable[linkedLabel];
        delete observable[unlinkMethodLabel];
    };

    observable.push = (item) => {
        const validResult = {};

        if (validArray('push', [ item ], validResult, validator)) {
            originPush.call(observable, validResult['push'][0]);
        }
    };

    observable.unshift = (item) => {
        const validResult = {};

        if (validArray('unshift', [ item ], validResult, validator)) {
            originUnshift.call(observable, validResult['unshift'][0]);
        }
    };

    observable.splice = function () {
        if (arguments.length < 3) {
            return;
        }

        const args = [ arguments[0], arguments[1] ];
        const result = every(toArray(arguments, 2), (item, i) => {
            const subValidResult = {};
            const subResult = validArray('splice', [ item ], subValidResult, validator);

            if (subResult) {
                args.push(subValidResult['splice'][0]);
            }

            return subResult;
        });

        if (result) {
            originSplice.apply(observable, args);
        }
    };

    observable[linkedLabel] = true;
};

// Link object observable with validators
//
// @param {Object} data
// @param {Object} validators
export function linkObjectObservable(data, validators) {
    eachDict(validators, (propName, validator) => {
        if (isArray(validator) && validator.length === 1) {
            linkArrayObservable(data[propName], validator[0]);
        } else if (isObject(validator) && !hasOwn(validator, 'type')) {
            linkObjectObservable(data[propName], validator);
        }
    });
};
