this.knockout = this.knockout || {};
(function () {
'use strict';

var literalRE = /^(?:true|false|null|NaN|Infinity|[\+\-]?\d?)$/i;

// no-ops function
function noop() {}

// has own property
function hasOwn(target, key) {
    return target.hasOwnProperty(key);
}

// has own property and not falsy value
function exist(target, key) {
    return target[key] && hasOwn(target, key);
}

// my-name => myName
function normalize(name) {
    return name.split(/\-/g).map(function (word, i) {
        return i > 0 ? word.charAt(0).toUpperCase() + word.substr(1) : word;
    }).join('');
}

// type checker
function isType(name) {
    return function (real) {
        return Object.prototype.toString.call(real) === '[object ' + name + ']';
    };
}

// type checkers
var isString = isType('String');
var isNumber = isType('Number');
var isBoolean = isType('Boolean');
var isObject = isType('Object');
var isArray = isType('Array');
var isFunction = isType('Function');
var isDate = isType('Date');
var isRegExp = isType('RegExp');

// parse to string to primitive value
//
// "true" => true
// "false" => false
// "null" => null
//
// @param {String} value
// @return {Any}
function toPrimitive(value) {
    if (typeof value !== 'string') {
        return value;
    } else if (value === 'True') {
        return true;
    } else if (value === 'False') {
        return false;
    }

    if (literalRE.test(value)) {
        return new Function('return ' + value)();
    } else {
        return value;
    }
}

// transform array like object to real array
//
// @param {Object} target
// @return {Array}
function toArray(target) {
    var len = target.length;
    var result = [];

    while (len-- >= 0) {
        result[len] = target[len];
    }

    return result;
}

// iterate array or array like object
//
// @param {Array|Object} target
// @param {Function} iterator
function each(target, iterator) {
    var i = void 0,
        len = void 0;

    for (i = 0, len = target.length; i < len; i += 1) {
        if (iterator(target[i], i, target) === false) {
            return;
        }
    }
}

// iterate array or array like object and check those items some true
//
// @param {Array|Object} target
// @param {Function} checker
// @return {Boolean}
function some(target, checker) {
    var result = false;

    each(target, function (item, i) {
        if (checker(item, i, target)) {
            result = true;
            return false;
        }
    });

    return result;
}

// iterate array or array like object and check those items all true
//
// @param {Array|Object} target
// @param {Function} checker
// @return {Boolean}
function every(target, checker) {
    if (!target || !target.length) {
        return false;
    }

    var result = true;

    each(target, function (item, i) {
        if (!checker(item, i, target)) {
            result = false;
            return false;
        }
    });

    return result;
}

// iterate dict
//
// @param {Object} dict
// @param {Function} iterator
function eachDict(dict, iterator) {
    if (!dict) {
        return;
    }

    each(Object.keys(dict), function (key) {
        if (iterator(key, dict[key], dict) === false) {
            return;
        }
    });
}

function apply(selector, contextNode) {
    if (isString(contextNode)) {
        contextNode = document.querySelector(contextNode);
    }

    var nodes = (contextNode || document).querySelectorAll(selector);

    ko.utils.arrayForEach(nodes, function (node) {
        var bindingStatements = null;
        var bindingAttributes = node.getAttribute('data-bind') || '';

        if (bindingAttributes.indexOf(/\bskip\b\s*:/g) > -1) {
            return;
        }

        ko.applyBindings(null, node);
        bindingStatements = bindingAttributes ? bindingAttributes.split(',') : [];
        bindingStatements.push('skip: true');
        node.setAttribute('data-bind', bindingStatements.join(','));
    });
}

// extend ko.components
ko.components.apply = ko.components.apply || apply;

// create computed observalbes on context
//
// @param {Object} context
// @param {Object} methods
function computedAll(context, methods) {
    eachDict(methods, function (name, method) {
        context[name] = ko.computed(method, context);
    });
}

// create pure computed observalbes on context
//
// @param {Object} context
// @param {Object} methods
function pureComputedAll(context, methods) {
    eachDict(methods, function (name, method) {
        context[name] = ko.pureComputed(method, context);
    });
}

function interopDefault(ex) {
	return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var index = createCommonjsModule(function (module) {
var inserted = {};

module.exports = function (css, options) {
    if (inserted[css]) return;
    inserted[css] = true;

    var elem = document.createElement('style');
    elem.setAttribute('type', 'text/css');

    if ('textContent' in elem) {
        elem.textContent = css;
    } else {
        elem.styleSheet.cssText = css;
    }

    var head = document.getElementsByTagName('head')[0];
    if (options && options.prepend) {
        head.insertBefore(elem, head.childNodes[0]);
    } else {
        head.appendChild(elem);
    }
};
});

var insert = interopDefault(index);

// empty component template
var emptyTemplate = '<noscript><!-- empty template --></noscript>';

// throw error with plugin name
//
// @param {String} message
function throwError(message) {
    throw new Error('knockout.register: ' + message);
}

// insert dom stylesheet
function insertCss() {
    return insert.apply(null, arguments);
}

// robust mixin
//
// @param {Object} dest
// @param {Object} opts
// @param {Array|Object} mixins
function mixin(dest, opts, mixins) {

    // opts is optional
    if (!mixins && opts) {
        mixins = opts;
        opts = null;
    }

    if (mixins && !Array.isArray(mixins)) {
        mixins = [mixins];
    }

    if (!mixins || !mixins.length) {
        return dest;
    }

    // cache last opts
    dest.opts = opts = opts || {};

    ko.utils.arrayForEach(mixins, function (mixin) {
        var mixinCopy = null;

        // pre mix
        if (isFunction(mixin.preMix)) {
            mixinCopy = ko.utils.extend({}, mixin);
            mixinCopy.preMix(opts);
        }

        ko.utils.extend(dest, mixinCopy || mixin);

        // post mix
        if (isFunction(mixin.postMix)) {
            mixin.postMix.call(dest, opts);
        }
    });

    delete dest.preMix;
    delete dest.postMix;

    return dest;
}

// extend ko.utils
ko.utils.mixin = ko.utils.mixin || mixin;
ko.utils.insertCss = ko.utils.insertCss || insertCss;

var defaultSpy = document.createComment('spy');

function getVmForNode(node) {
    var spy = node.lastElementChild || defaultSpy;
    var useDefault = spy === defaultSpy;

    if (useDefault) {
        node.appendChild(spy);
    }

    var vm = ko.dataFor(spy);

    if (useDefault) {
        node.removeChild(spy);
    }

    return vm;
}

// query element by selector
//
// @param {String} selector
// @param {Node} context
function querySelector(selector) {
    var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

    return getVmForNode(context.querySelector(selector));
}

// query elements by selector
//
// @param {String} selector
// @param {Node} context
function querySelectorAll(selector) {
    var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

    var nodes = ko.utils.makeArray(context.querySelectorAll(selector));

    return ko.utils.arrayMap(nodes, function (node) {
        return getVmForNode(node);
    });
}

// query element by id
//
// @param {String} selector
// @param {Node} context
function getElementById() {
    return getVmForNode(context.getElementById(selector));
}

// query elements by tag name
//
// @param {String} selector
// @param {Node} context
function getElementsByTagName(selector) {
    var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

    var nodes = ko.utils.makeArray(context.getElementsByTagName(selector));

    return ko.utils.arrayMap(nodes, function (node) {
        return getVmForNode(node);
    });
}

// query elements by class name
//
// @param {String} selector
// @param {Node} context
function getElementsByClassName(selector) {
    var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

    var nodes = ko.utils.makeArray(context.getElementsByClassName(selector));

    return ko.utils.arrayMap(nodes, function (node) {
        return getVmForNode(node);
    });
}

// ref vm
//
// @param {String} query
// @param {Node} context
function ref(query, context) {
    return ko.components.querySelector(query, context || this.componentInfo.element);
}

// ref vms
//
// @param {String} query
// @param {Node} context
function refs(query, context) {
    return ko.components.querySelectorAll(query, context || this.componentInfo.element);
}

// extend ko.components
ko.components.querySelector = querySelector;
ko.components.querySelectorAll = querySelectorAll;
ko.components.getElementById = getElementById;
ko.components.getElementsByTagName = getElementsByTagName;
ko.components.getElementsByClassName = getElementsByClassName;

var hasConsole = !!window.console;

function warn(msg, extra) {
     hasConsole && console.error(msg, extra);
}

function isBasic(value) {
    return isString(value) || isNumber(value) || isBoolean(value);
}

// Clone array items and create observable array
//
// @param {Array} data
function observableArray$$1(data) {
    each(data, function (item, i) {
        if (ko.isObservable(item)) {
            return true;
        }

        if (isObject(item)) {
            data[i] = observableObject$$1(item);
        } else if (isArray(item)) {
            data[i] = observableArray$$1(item);
        }
    });

    return ko.observableArray(data);
}

// Clone properties and create observable object
//
// @param {Object} data
function observableObject$$1(data) {
    eachDict(data, function (propKey, propValue) {
        if (ko.isObservable(propValue)) {
            return true;
        }

        if (isObject(propValue)) {
            data[propKey] = observableObject$$1(propValue);
        } else if (isArray(propValue)) {
            data[propKey] = observableArray$$1(propValue);
        } else if (isBasic(propValue)) {
            data[propKey] = ko.observable(propValue);
        } else {
            data[propKey] = propValue;
        }
    });

    return data;
}

// Run validator on given prop
//
// @param {String} propName
// @param {Any} propValue
// @param {Object} data
// @param {Object|Function} validator
// @return {Boolean}
function validProp$$1(propName, propValue, data, validator) {
    var isWrapped = isObject(validator);
    var required = isWrapped ? validator.required : false;
    var defaultValue = isWrapped ? validator.default : undefined;

    validator = isWrapped ? validator.type : validator;
    propValue = ko.unwrap(propValue);
    propValue = propValue === undefined ? defaultValue : propValue;

    // required
    if (propValue === undefined && required) {
        warn('Invalid prop: Missing required prop: ' + propName, data);
        return false;
    } else if (!validator(propValue)) {
        warn('Invalid prop: key: ' + propName + ', propValue: ' + propValue, data);
        return false;
    } else {
        data[propName] = propValue;
        return true;
    }
}

// Run object validators on given prop
//
// @param {String} propName
// @param {Any} propValue
// @param {Object} data
// @param {Object} validators
// @return {Boolean}
function validObject$$1(propName, propValue, data, validators) {
    propValue = ko.unwrap(propValue);
    data = data[propName] = {};

    return every(Object.keys(validators), function (subPropName) {
        var validator = validators[subPropName];
        var subPropValue = propValue ? propValue[subPropName] : undefined;

        if (isFunction(validator) || isObject(validator) && hasOwn(validator, 'type')) {
            return validProp$$1(subPropName, subPropValue, data, validator);
        } else if (isObject(validator)) {
            data[subPropName] = {};

            return validObject$$1(subPropName, subPropValue, data[subPropName], validator);
        } else if (isArray(validator)) {
            var len = validator.length;

            // oneOfType
            if (len > 1) {
                return validWithin$$1(subPropName, subPropValue, data, validator);

                // arrayOf
            } else {
                data[subPropName] = [];

                return validArray$$1(subPropName, subPropValue, data[subPropName], validator[0]);
            }
        } else {
            warn('Invalid validator: ' + validator, data);
            return false;
        }
    });
}

// Run validators on given prop
//
// @param {String} propName
// @param {Any} propValue
// @param {Object} data
// @param {Array} validators
// @return {Boolean}
function validWithin$$1(propName, propValue, data, validators) {
    propValue = ko.unwrap(propValue);

    return some(validators, function (validator) {
        return validArray$$1(propName, [propValue], [], validator);
    }) ? (data[propName] = propValue) !== undefined : false;
}

// Run validator on given array prop
//
// @param {String} propName
// @param {Array} propValue
// @param {Array} data
// @param {Object|Array|Function} validator
// @return {Boolean}
function validArray$$1(propName, propValue, data, validator) {
    var validMethod = void 0;
    var useValidArray = false;

    if (isFunction(validator) || isObject(validator) && hasOwn(validator, 'type')) {
        validMethod = validProp$$1;
    } else if (isObject(validator)) {
        validMethod = validObject$$1;
    } else if (isArray(validator)) {
        if (validator.length > 1) {
            validMethod = validWithin$$1;
        } else {
            validMethod = validArray$$1;
            useValidArray = true;
        }
    } else {
        warn('Invalid validator: ' + validator, data);
        return false;
    }

    propValue = ko.unwrap(propValue);

    return every(propValue, function (item, i) {
        var validResult = useValidArray ? [] : {};

        return validMethod(i, item, validResult, validator) ? data.push(useValidArray ? validResult : validResult[i]) !== undefined : false;
    });
}

// Create view model according to validators
//
// @param {Object} data
// @param {Object} validators
function observable$$1(data, validators) {
    if (!isObject(data)) {
        warn('Invalid props: ' + data);
        return null;
    } else {
        var validResult = {};

        validObject$$1('data', data, validResult, validators);
        observableObject$$1(validResult);

        return validResult['data'];
    }
}

function is(constructor) {
    return function (actual) {
        return actual instanceof constructor;
    };
}

var validators = {

    // basic types run validator immediately
    // true valid
    // false invalid
    String: isString,
    Number: isNumber,
    Boolean: isBoolean,
    Object: isObject,
    Array: isArray,
    Function: isFunction,
    Date: isDate,
    RegExp: isRegExp,
    instanceof: is,
    Node: is(Node),
    Element: is(Element),
    any: function any(actual) {
        return actual !== null && actual !== undefined;
    },
    oneOf: function oneOf() {
        var enums = toArray(arguments);

        return function (actual) {
            return some(enums, function (expected) {
                return actual === expected;
            });
        };
    },


    // combination types not run validator immediately
    // [ ... ] List of validators at least fullfill one validator
    // { ... } Validators in { key: validator } pair all validators need to fullfill

    // Construct shape validators
    //
    // @param {Object} plan
    // @return {Object}
    shape: function shape(plan) {
        return plan;
    },


    // Construct array validators
    //
    // @param {Function} validator
    // @return {Array}
    arrayOf: function arrayOf(validator) {
        return [validator];
    },


    // Construct type validators
    //
    // @param {Function...}
    // @return {Array}
    oneOfType: function oneOfType() {
        return arguments.length > 1 ? toArray(arguments) : arguments[0];
    }
};

ko.types = ko.types || validators;

var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();















var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

var get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

















var set = function set(object, property, value, receiver) {
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent !== null) {
      set(parent, property, value, receiver);
    }
  } else if ("value" in desc && desc.writable) {
    desc.value = value;
  } else {
    var setter = desc.set;

    if (setter !== undefined) {
      setter.call(receiver, value);
    }
  }

  return value;
};

var invalidAttrNameRE = /^(?:data-[\w-]+|params|id|class|style)\b/i;
var observableAttrNameRE = /^k-([\w\-]+)/i;
var eventAttrNameRE = /^on-([\w\-]+)/i;
var bindingProvider = new ko.bindingProvider();

function pluckObservableBindingString(nodeName, nodeValue) {
    var result = nodeName.match(observableAttrNameRE);

    return result ? normalize(result[1]) + ':' + nodeValue : '';
}

function pluckEventBindingString(nodeName, nodeValue) {
    var result = nodeName.match(eventAttrNameRE);

    return result ? normalize(result[0]) + ':' + nodeValue : '';
}

function pluckObservableParams(bindingContext, bindingString) {
    return bindingProvider.parseBindingsString(bindingString, bindingContext);
}

function pluckEventParams(bindingContext, bindingString) {
    var i = 0,
        handlerParams = void 0,
        bindingError = void 0;
    var bindingParents = ko.utils.makeArray(bindingContext.$parents);

    if (bindingParents.indexOf(bindingContext.$data) < 0) {
        bindingParents.unshift(bindingContext.$data);
    }

    bindingContext = { $data: null };

    while (bindingContext.$data = bindingParents[i]) {
        i += 1;

        try {
            handlerParams = bindingProvider.parseBindingsString(bindingString, bindingContext);
            bindingError = null;
            break;
        } catch (err) {
            bindingError = err;
        }
    }

    if (bindingError) {
        throw bindingError;
    }

    return handlerParams;
}

function pluck(node) {
    var bindingContext = null;
    var observableBindingStringList = [];
    var eventBindingStringList = [];

    var result = ko.utils.makeArray(node.attributes).reduce(function (params, node) {
        var nodeName = node.nodeName;
        var nodeValue = node.nodeValue;

        if (invalidAttrNameRE.test(nodeName)) {
            return params;
        }

        if (observableAttrNameRE.test(nodeName)) {
            observableBindingStringList.push(pluckObservableBindingString(nodeName, nodeValue));
        } else if (eventAttrNameRE.test(nodeName)) {
            eventBindingStringList.push(pluckEventBindingString(nodeName, nodeValue));
        } else {
            params[normalize(nodeName)] = toPrimitive(nodeValue);
        }

        return params;
    }, {});

    var eventBindingString = '{' + eventBindingStringList.join(',') + '}';
    var observableBindingString = '{' + observableBindingStringList.join(',') + '}';

    if (eventBindingString || observableBindingString) {
        bindingContext = ko.contextFor(node);
    }

    return _extends(result, eventBindingString && pluckEventParams(bindingContext, eventBindingString), observableBindingString && pluckObservableParams(bindingContext, observableBindingString));
}

var modulePolyfill = {
    constructor: noop,
    defaults: {},
    template: emptyTemplate
};

// Transform transiton component module to native component module
//
// @param {Object} module Transiton component module
// @return {Object} Native component module
function transform(module) {
    var _Object$assign = _extends({}, modulePolyfill, module);

    var name = _Object$assign.name;
    var constructor = _Object$assign.constructor;
    var defaults$$1 = _Object$assign.defaults;
    var props = _Object$assign.props;
    var mixins = _Object$assign.mixins;
    var methods = _Object$assign.methods;
    var computed = _Object$assign.computed;
    var pureComputed = _Object$assign.pureComputed;
    var style = _Object$assign.style;
    var template = _Object$assign.template;


    insertCss(module.style);
    _extends(constructor.prototype, {
        ref: ref,
        refs: refs,
        ready: noop
    }, methods);

    return {
        viewModel: {
            createViewModel: function createViewModel(params, componentInfo) {
                componentInfo.name = name;

                var opts = _extends({}, defaults$$1, ko.toJS(params), pluck(componentInfo.element));
                var vm = new constructor(opts, componentInfo);

                props && _extends(vm, observable$$1(opts, props));
                mixins && mixin(vm, opts, mixins);
                computed && computedAll(vm, computed);
                pureComputed && pureComputedAll(vm, pureComputed);

                vm.$opts = opts;
                vm.$defaults = defaults$$1;
                vm.$info = vm.componentInfo = componentInfo;

                delete vm.$opts['$raw'];
                delete vm.$defaults['$raw'];

                return vm;
            }
        },
        synchronous: true,
        template: template
    };
}

// Register transition component module
//
// @param {String|Object} module Component name or module
// @param {Object} module Transition component module if first param is component name
function register(module) {
    if (!module) {
        throwError('Component name or module is required.');
    }

    // native component module
    if (isString(module)) {
        return ko.components._register(arguments[0], arguments[1]);
    }

    // standard component module
    var name = module.name;


    if (!exist(module, 'name')) {
        throwError('Component name is required.');
    }

    return ko.components._register(name, transform(module));
}

ko.components._register = ko.components._register || ko.components.register;
ko.components.register = register;

}());
