var ActionTypes;
(function (ActionTypes) {
    ActionTypes["Start"] = "xstate.start";
    ActionTypes["Stop"] = "xstate.stop";
    ActionTypes["Raise"] = "xstate.raise";
    ActionTypes["Send"] = "xstate.send";
    ActionTypes["Cancel"] = "xstate.cancel";
    ActionTypes["NullEvent"] = "";
    ActionTypes["Assign"] = "xstate.assign";
    ActionTypes["After"] = "xstate.after";
    ActionTypes["DoneState"] = "done.state";
    ActionTypes["DoneInvoke"] = "done.invoke";
    ActionTypes["Log"] = "xstate.log";
    ActionTypes["Init"] = "xstate.init";
    ActionTypes["Invoke"] = "xstate.invoke";
    ActionTypes["ErrorExecution"] = "error.execution";
    ActionTypes["ErrorCommunication"] = "error.communication";
    ActionTypes["ErrorPlatform"] = "error.platform";
    ActionTypes["Update"] = "xstate.update";
    ActionTypes["Pure"] = "xstate.pure";
})(ActionTypes || (ActionTypes = {}));
var SpecialTargets;
(function (SpecialTargets) {
    SpecialTargets["Parent"] = "#_parent";
    SpecialTargets["Internal"] = "#_internal";
})(SpecialTargets || (SpecialTargets = {}));

var STATE_DELIMITER = '.';
var EMPTY_ACTIVITY_MAP = {};
var DEFAULT_GUARD_TYPE = 'xstate.guard';

var IS_PRODUCTION = process.env.NODE_ENV === 'production';

var __assign = undefined && undefined.__assign || function () {
    __assign = Object.assign || function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __values = undefined && undefined.__values || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator],
        i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var __read = undefined && undefined.__read || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o),
        r,
        ar = [],
        e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    } catch (error) {
        e = { error: error };
    } finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
            if (e) throw e.error;
        }
    }
    return ar;
};
var __spread = undefined && undefined.__spread || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
function isState(state) {
    if (isString(state)) {
        return false;
    }
    return 'value' in state && 'tree' in state && 'history' in state;
}
function keys(value) {
    return Object.keys(value);
}
function matchesState(parentStateId, childStateId, delimiter) {
    if (delimiter === void 0) {
        delimiter = STATE_DELIMITER;
    }
    var parentStateValue = toStateValue(parentStateId, delimiter);
    var childStateValue = toStateValue(childStateId, delimiter);
    if (isString(childStateValue)) {
        if (isString(parentStateValue)) {
            return childStateValue === parentStateValue;
        }
        // Parent more specific than child
        return false;
    }
    if (isString(parentStateValue)) {
        return parentStateValue in childStateValue;
    }
    return keys(parentStateValue).every(function (key) {
        if (!(key in childStateValue)) {
            return false;
        }
        return matchesState(parentStateValue[key], childStateValue[key]);
    });
}
function getEventType(event) {
    try {
        return isString(event) || typeof event === 'number' ? "" + event : event.type;
    } catch (e) {
        throw new Error('Events must be strings or objects with a string event.type property.');
    }
}
function toStatePath(stateId, delimiter) {
    try {
        if (isArray(stateId)) {
            return stateId;
        }
        return stateId.toString().split(delimiter);
    } catch (e) {
        throw new Error("'" + stateId + "' is not a valid state path.");
    }
}
function toStateValue(stateValue, delimiter) {
    if (isState(stateValue)) {
        return stateValue.value;
    }
    if (isArray(stateValue)) {
        return pathToStateValue(stateValue);
    }
    if (typeof stateValue !== 'string' && !isState(stateValue)) {
        return stateValue;
    }
    var statePath = toStatePath(stateValue, delimiter);
    return pathToStateValue(statePath);
}
function pathToStateValue(statePath) {
    if (statePath.length === 1) {
        return statePath[0];
    }
    var value = {};
    var marker = value;
    for (var i = 0; i < statePath.length - 1; i++) {
        if (i === statePath.length - 2) {
            marker[statePath[i]] = statePath[i + 1];
        } else {
            marker[statePath[i]] = {};
            marker = marker[statePath[i]];
        }
    }
    return value;
}
function mapValues(collection, iteratee) {
    var result = {};
    var collectionKeys = keys(collection);
    for (var i = 0; i < collectionKeys.length; i++) {
        var key = collectionKeys[i];
        result[key] = iteratee(collection[key], key, collection, i);
    }
    return result;
}
function mapFilterValues(collection, iteratee, predicate) {
    var e_1, _a;
    var result = {};
    try {
        for (var _b = __values(keys(collection)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var key = _c.value;
            var item = collection[key];
            if (!predicate(item)) {
                continue;
            }
            result[key] = iteratee(item, key, collection);
        }
    } catch (e_1_1) {
        e_1 = { error: e_1_1 };
    } finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        } finally {
            if (e_1) throw e_1.error;
        }
    }
    return result;
}
/**
 * Retrieves a value at the given path.
 * @param props The deep path to the prop of the desired value
 */
var path = function (props) {
    return function (object) {
        var e_2, _a;
        var result = object;
        try {
            for (var props_1 = __values(props), props_1_1 = props_1.next(); !props_1_1.done; props_1_1 = props_1.next()) {
                var prop = props_1_1.value;
                result = result[prop];
            }
        } catch (e_2_1) {
            e_2 = { error: e_2_1 };
        } finally {
            try {
                if (props_1_1 && !props_1_1.done && (_a = props_1.return)) _a.call(props_1);
            } finally {
                if (e_2) throw e_2.error;
            }
        }
        return result;
    };
};
/**
 * Retrieves a value at the given path via the nested accessor prop.
 * @param props The deep path to the prop of the desired value
 */
function nestedPath(props, accessorProp) {
    return function (object) {
        var e_3, _a;
        var result = object;
        try {
            for (var props_2 = __values(props), props_2_1 = props_2.next(); !props_2_1.done; props_2_1 = props_2.next()) {
                var prop = props_2_1.value;
                result = result[accessorProp][prop];
            }
        } catch (e_3_1) {
            e_3 = { error: e_3_1 };
        } finally {
            try {
                if (props_2_1 && !props_2_1.done && (_a = props_2.return)) _a.call(props_2);
            } finally {
                if (e_3) throw e_3.error;
            }
        }
        return result;
    };
}
function toStatePaths(stateValue) {
    if (!stateValue) {
        return [[]];
    }
    if (isString(stateValue)) {
        return [[stateValue]];
    }
    var result = flatten(keys(stateValue).map(function (key) {
        var subStateValue = stateValue[key];
        if (typeof subStateValue !== 'string' && (!subStateValue || !Object.keys(subStateValue).length)) {
            return [[key]];
        }
        return toStatePaths(stateValue[key]).map(function (subPath) {
            return [key].concat(subPath);
        });
    }));
    return result;
}
function flatten(array) {
    var _a;
    return (_a = []).concat.apply(_a, __spread(array));
}
function toArray(value) {
    if (isArray(value)) {
        return value;
    }
    if (value === undefined) {
        return [];
    }
    return [value];
}
function mapContext(mapper, context, event) {
    var e_5, _a;
    if (isFunction(mapper)) {
        return mapper(context, event);
    }
    var result = {};
    try {
        for (var _b = __values(keys(mapper)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var key = _c.value;
            var subMapper = mapper[key];
            if (isFunction(subMapper)) {
                result[key] = subMapper(context, event);
            } else {
                result[key] = subMapper;
            }
        }
    } catch (e_5_1) {
        e_5 = { error: e_5_1 };
    } finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        } finally {
            if (e_5) throw e_5.error;
        }
    }
    return result;
}
function isBuiltInEvent(eventType) {
    // check if event is a "done" event
    if (eventType.indexOf(ActionTypes.DoneState) === 0 || eventType.indexOf(ActionTypes.DoneInvoke) === 0) {
        return true;
    }
    // check if event is an "error" event
    if (eventType === ActionTypes.ErrorCommunication || eventType === ActionTypes.ErrorExecution || eventType.indexOf(ActionTypes.ErrorPlatform) === 0) {
        return true;
    }
    return false;
}
function isPromiseLike(value) {
    if (value instanceof Promise) {
        return true;
    }
    // Check if shape matches the Promise/A+ specification for a "thenable".
    if (value !== null && (isFunction(value) || typeof value === 'object') && isFunction(value.then)) {
        return true;
    }
    return false;
}
function partition(items, predicate) {
    var e_6, _a;
    var _b = __read([[], []], 2),
        truthy = _b[0],
        falsy = _b[1];
    try {
        for (var items_1 = __values(items), items_1_1 = items_1.next(); !items_1_1.done; items_1_1 = items_1.next()) {
            var item = items_1_1.value;
            if (predicate(item)) {
                truthy.push(item);
            } else {
                falsy.push(item);
            }
        }
    } catch (e_6_1) {
        e_6 = { error: e_6_1 };
    } finally {
        try {
            if (items_1_1 && !items_1_1.done && (_a = items_1.return)) _a.call(items_1);
        } finally {
            if (e_6) throw e_6.error;
        }
    }
    return [truthy, falsy];
}
function updateHistoryStates(hist, stateValue) {
    return mapValues(hist.states, function (subHist, key) {
        if (!subHist) {
            return undefined;
        }
        var subStateValue = (isString(stateValue) ? undefined : stateValue[key]) || (subHist ? subHist.current : undefined);
        if (!subStateValue) {
            return undefined;
        }
        return {
            current: subStateValue,
            states: updateHistoryStates(subHist, subStateValue)
        };
    });
}
function updateHistoryValue(hist, stateValue) {
    return {
        current: stateValue,
        states: updateHistoryStates(hist, stateValue)
    };
}
function updateContext(context, event, assignActions) {
    var updatedContext = context ? assignActions.reduce(function (acc, assignAction) {
        var e_7, _a;
        var assignment = assignAction.assignment;
        var partialUpdate = {};
        if (isFunction(assignment)) {
            partialUpdate = assignment(acc, event || { type: ActionTypes.Init });
        } else {
            try {
                for (var _b = __values(keys(assignment)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var key = _c.value;
                    var propAssignment = assignment[key];
                    partialUpdate[key] = isFunction(propAssignment) ? propAssignment(acc, event) : propAssignment;
                }
            } catch (e_7_1) {
                e_7 = { error: e_7_1 };
            } finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                } finally {
                    if (e_7) throw e_7.error;
                }
            }
        }
        return Object.assign({}, acc, partialUpdate);
    }, context) : context;
    return updatedContext;
}
function bindActionToState(action, state) {
    var exec = action.exec;
    var boundAction = __assign({}, action, { exec: exec !== undefined ? function () {
            return exec(state.context, state.event, {
                action: action,
                state: state
            });
        } : undefined });
    return boundAction;
}
// tslint:disable-next-line:no-empty
var warn = function () {};
if (!IS_PRODUCTION) {
    warn = function (condition, message) {
        var error = condition instanceof Error ? condition : undefined;
        if (!error && condition) {
            return;
        }
        if (console !== undefined) {
            var args = ["Warning: " + message];
            if (error) {
                args.push(error);
            }
            // tslint:disable-next-line:no-console
            console.warn.apply(console, args);
        }
    };
}
function isArray(value) {
    return Array.isArray(value);
}
// tslint:disable-next-line:ban-types
function isFunction(value) {
    return typeof value === 'function';
}
function isString(value) {
    return typeof value === 'string';
}
// export function memoizedGetter<T, TP extends { prototype: object }>(
//   o: TP,
//   property: string,
//   getter: () => T
// ): void {
//   Object.defineProperty(o.prototype, property, {
//     get: getter,
//     enumerable: false,
//     configurable: false
//   });
// }
function toGuard(condition, guardMap) {
    if (!condition) {
        return undefined;
    }
    if (isString(condition)) {
        return {
            type: DEFAULT_GUARD_TYPE,
            name: condition,
            predicate: guardMap ? guardMap[condition] : undefined
        };
    }
    if (isFunction(condition)) {
        return {
            type: DEFAULT_GUARD_TYPE,
            name: condition.name,
            predicate: condition
        };
    }
    return condition;
}
function isObservable(value) {
    try {
        return 'subscribe' in value && isFunction(value.subscribe);
    } catch (e) {
        return false;
    }
}
function isMachine(value) {
    try {
        return '__xstatenode' in value;
    } catch (e) {
        return false;
    }
}
var uniqueId = /*#__PURE__*/function () {
    var currentId = 0;
    return function () {
        currentId++;
        return currentId.toString(16);
    };
}();

var __values$1 = undefined && undefined.__values || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator],
        i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
function mapState(stateMap, stateId) {
    var e_1, _a;
    var foundStateId;
    try {
        for (var _b = __values$1(keys(stateMap)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var mappedStateId = _c.value;
            if (matchesState(mappedStateId, stateId) && (!foundStateId || stateId.length > foundStateId.length)) {
                foundStateId = mappedStateId;
            }
        }
    } catch (e_1_1) {
        e_1 = { error: e_1_1 };
    } finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        } finally {
            if (e_1) throw e_1.error;
        }
    }
    return stateMap[foundStateId];
}

var __read$1 = undefined && undefined.__read || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o),
        r,
        ar = [],
        e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    } catch (error) {
        e = { error: error };
    } finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
            if (e) throw e.error;
        }
    }
    return ar;
};
var __spread$1 = undefined && undefined.__spread || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read$1(arguments[i]));
    return ar;
};
function stateValuesEqual(a, b) {
    if (a === b) {
        return true;
    }
    if (a === undefined || b === undefined) {
        return false;
    }
    if (isString(a) || isString(b)) {
        return a === b;
    }
    var aKeys = keys(a);
    var bKeys = keys(b);
    return aKeys.length === bKeys.length && aKeys.every(function (key) {
        return stateValuesEqual(a[key], b[key]);
    });
}
var State = /** @class */ /*#__PURE__*/function () {
    /**
     * Creates a new State instance.
     * @param value The state value
     * @param context The extended state
     * @param historyValue The tree representing historical values of the state nodes
     * @param history The previous state
     * @param actions An array of action objects to execute as side-effects
     * @param activities A mapping of activities and whether they are started (`true`) or stopped (`false`).
     * @param meta
     * @param events Internal event queue. Should be empty with run-to-completion semantics.
     * @param tree
     */
    function State(config) {
        this.actions = [];
        this.activities = EMPTY_ACTIVITY_MAP;
        this.meta = {};
        this.events = [];
        this.value = config.value;
        this.context = config.context;
        this.event = config.event;
        this.historyValue = config.historyValue;
        this.history = config.history;
        this.actions = config.actions || [];
        this.activities = config.activities || EMPTY_ACTIVITY_MAP;
        this.meta = config.meta || {};
        this.events = config.events || [];
        Object.defineProperty(this, 'tree', {
            value: config.tree,
            enumerable: false
        });
        this.matches = this.matches.bind(this);
        this.toStrings = this.toStrings.bind(this);
    }
    /**
     * Creates a new State instance for the given `stateValue` and `context`.
     * @param stateValue
     * @param context
     */
    State.from = function (stateValue, context) {
        if (stateValue instanceof State) {
            if (stateValue.context !== context) {
                return new State({
                    value: stateValue.value,
                    context: context,
                    event: stateValue.event,
                    historyValue: stateValue.historyValue,
                    history: stateValue.history,
                    actions: [],
                    activities: stateValue.activities,
                    meta: {},
                    events: [],
                    tree: stateValue.tree
                });
            }
            return stateValue;
        }
        var event = { type: ActionTypes.Init };
        return new State({
            value: stateValue,
            context: context,
            event: event,
            historyValue: undefined,
            history: undefined,
            actions: [],
            activities: undefined,
            meta: undefined,
            events: []
        });
    };
    /**
     * Creates a new State instance for the given `config`.
     * @param config The state config
     */
    State.create = function (config) {
        return new State(config);
    };
    /**
     * Creates a new `State` instance for the given `stateValue` and `context` with no actions (side-effects).
     * @param stateValue
     * @param context
     */
    State.inert = function (stateValue, context) {
        if (stateValue instanceof State) {
            if (!stateValue.actions.length) {
                return stateValue;
            }
            var event_1 = { type: ActionTypes.Init };
            return new State({
                value: stateValue.value,
                context: context,
                event: event_1,
                historyValue: stateValue.historyValue,
                history: stateValue.history,
                activities: stateValue.activities,
                tree: stateValue.tree
            });
        }
        return State.from(stateValue, context);
    };
    Object.defineProperty(State.prototype, "inert", {
        /**
         * Returns a new `State` instance that is equal to this state no actions (side-effects).
         */
        get: function () {
            return State.inert(this, this.context);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(State.prototype, "nextEvents", {
        /**
         * The next events that will cause a transition from the current state.
         */
        get: function () {
            if (!this.tree) {
                return [];
            }
            return this.tree.nextEvents;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Returns an array of all the string leaf state node paths.
     * @param stateValue
     * @param delimiter The character(s) that separate each subpath in the string state node path.
     */
    State.prototype.toStrings = function (stateValue, delimiter) {
        var _this = this;
        if (stateValue === void 0) {
            stateValue = this.value;
        }
        if (delimiter === void 0) {
            delimiter = '.';
        }
        if (isString(stateValue)) {
            return [stateValue];
        }
        var valueKeys = keys(stateValue);
        return valueKeys.concat.apply(valueKeys, __spread$1(valueKeys.map(function (key) {
            return _this.toStrings(stateValue[key]).map(function (s) {
                return key + delimiter + s;
            });
        })));
    };
    /**
     * Whether the current state value is a subset of the given parent state value.
     * @param parentStateValue
     */
    State.prototype.matches = function (parentStateValue) {
        return matchesState(parentStateValue, this.value);
    };
    return State;
}();

// xstate-specific action types
var start = ActionTypes.Start;
var stop = ActionTypes.Stop;
var raise = ActionTypes.Raise;
var send = ActionTypes.Send;
var cancel = ActionTypes.Cancel;
var nullEvent = ActionTypes.NullEvent;
var assign = ActionTypes.Assign;
var after = ActionTypes.After;
var doneState = ActionTypes.DoneState;
var log = ActionTypes.Log;
var init = ActionTypes.Init;
var invoke = ActionTypes.Invoke;
var errorExecution = ActionTypes.ErrorExecution;
var errorPlatform = ActionTypes.ErrorPlatform;
var update = ActionTypes.Update;

var __assign$1 = undefined && undefined.__assign || function () {
    __assign$1 = Object.assign || function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign$1.apply(this, arguments);
};
var __rest = undefined && undefined.__rest || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0) t[p[i]] = s[p[i]];
    return t;
};
var initEvent = { type: init };
function toEventObject(event, payload
// id?: TEvent['type']
) {
    if (isString(event) || typeof event === 'number') {
        var eventObject = { type: event };
        if (payload) {
            Object.assign(eventObject, payload);
        }
        return eventObject;
    }
    return event;
}
function getActionFunction(actionType, actionFunctionMap) {
    return actionFunctionMap ? actionFunctionMap[actionType] || undefined : undefined;
}
function toActionObject(action, actionFunctionMap) {
    var actionObject;
    if (isString(action) || typeof action === 'number') {
        var exec = getActionFunction(action, actionFunctionMap);
        if (isFunction(exec)) {
            actionObject = {
                type: action,
                exec: exec
            };
        } else if (exec) {
            actionObject = exec;
        } else {
            actionObject = { type: action, exec: undefined };
        }
    } else if (isFunction(action)) {
        actionObject = {
            // Convert action to string if unnamed
            type: action.name || action.toString(),
            exec: action
        };
    } else {
        var exec = getActionFunction(action.type, actionFunctionMap);
        if (isFunction(exec)) {
            actionObject = __assign$1({}, action, { exec: exec });
        } else if (exec) {
            var type = action.type,
                other = __rest(action, ["type"]);
            actionObject = __assign$1({ type: type }, exec, other);
        } else {
            actionObject = action;
        }
    }
    Object.defineProperty(actionObject, 'toString', {
        value: function () {
            return actionObject.type;
        },
        enumerable: false,
        configurable: true
    });
    return actionObject;
}
var toActionObjects = function (action, actionFunctionMap) {
    if (!action) {
        return [];
    }
    var actions = isArray(action) ? action : [action];
    return actions.map(function (subAction) {
        return toActionObject(subAction, actionFunctionMap);
    });
};
function toActivityDefinition(action) {
    var actionObject = toActionObject(action);
    return __assign$1({ id: isString(action) ? action : actionObject.id }, actionObject, { type: actionObject.type });
}
/**
 * Raises an event. This places the event in the internal event queue, so that
 * the event is immediately consumed by the machine in the current step.
 *
 * @param eventType The event to raise.
 */
function raise$1(event) {
    return {
        type: raise,
        event: event
    };
}
/**
 * Sends an event. This returns an action that will be read by an interpreter to
 * send the event in the next step, after the current step is finished executing.
 *
 * @param event The event to send.
 * @param options Options to pass into the send event:
 *  - `id` - The unique send event identifier (used with `cancel()`).
 *  - `delay` - The number of milliseconds to delay the sending of the event.
 *  - `target` - The target of this event (by default, the machine the event was sent from).
 */
function send$1(event, options) {
    return {
        to: options ? options.to : undefined,
        type: send,
        event: isFunction(event) ? event : toEventObject(event),
        delay: options ? options.delay : undefined,
        id: options && options.id !== undefined ? options.id : isFunction(event) ? event.name : getEventType(event)
    };
}
function resolveSend(action, ctx, event) {
    // TODO: helper function for resolving Expr
    var resolvedEvent = isFunction(action.event) ? toEventObject(action.event(ctx, event)) : toEventObject(action.event);
    var resolvedDelay = isFunction(action.delay) ? action.delay(ctx, event) : action.delay;
    var resolvedTarget = isFunction(action.to) ? action.to(ctx, event) : action.to;
    return __assign$1({}, action, { to: resolvedTarget, event: resolvedEvent, delay: resolvedDelay });
}
/**
 * Sends an event to this machine's parent machine.
 *
 * @param event The event to send to the parent machine.
 * @param options Options to pass into the send event.
 */
function sendParent(event, options) {
    return send$1(event, __assign$1({}, options, { to: SpecialTargets.Parent }));
}
/**
 *
 * @param expr The expression function to evaluate which will be logged.
 *  Takes in 2 arguments:
 *  - `ctx` - the current state context
 *  - `event` - the event that caused this action to be executed.
 * @param label The label to give to the logged expression.
 */
function log$1(expr, label) {
    if (expr === void 0) {
        expr = function (context, event) {
            return {
                context: context,
                event: event
            };
        };
    }
    return {
        type: log,
        label: label,
        expr: expr
    };
}
/**
 * Cancels an in-flight `send(...)` action. A canceled sent action will not
 * be executed, nor will its event be sent, unless it has already been sent
 * (e.g., if `cancel(...)` is called after the `send(...)` action's `delay`).
 *
 * @param sendId The `id` of the `send(...)` action to cancel.
 */
var cancel$1 = function (sendId) {
    return {
        type: cancel,
        sendId: sendId
    };
};
/**
 * Starts an activity.
 *
 * @param activity The activity to start.
 */
function start$1(activity) {
    var activityDef = toActivityDefinition(activity);
    return {
        type: ActionTypes.Start,
        activity: activityDef,
        exec: undefined
    };
}
/**
 * Stops an activity.
 *
 * @param activity The activity to stop.
 */
function stop$1(activity) {
    var activityDef = toActivityDefinition(activity);
    return {
        type: ActionTypes.Stop,
        activity: activityDef,
        exec: undefined
    };
}
/**
 * Updates the current context of the machine.
 *
 * @param assignment An object that represents the partial context to update.
 */
var assign$1 = function (assignment) {
    return {
        type: assign,
        assignment: assignment
    };
};
/**
 * Returns an event type that represents an implicit event that
 * is sent after the specified `delay`.
 *
 * @param delayRef The delay in milliseconds
 * @param id The state node ID where this event is handled
 */
function after$1(delayRef, id) {
    var idSuffix = id ? "#" + id : '';
    return ActionTypes.After + "(" + delayRef + ")" + idSuffix;
}
/**
 * Returns an event that represents that a final state node
 * has been reached in the parent state node.
 *
 * @param id The final state node's parent state node `id`
 * @param data The data to pass into the event
 */
function done(id, data) {
    var type = ActionTypes.DoneState + "." + id;
    var eventObject = {
        type: type,
        data: data
    };
    eventObject.toString = function () {
        return type;
    };
    return eventObject;
}
/**
 * Returns an event that represents that an invoked service has terminated.
 *
 * An invoked service is terminated when it has reached a top-level final state node,
 * but not when it is canceled.
 *
 * @param id The final state node ID
 * @param data The data to pass into the event
 */
function doneInvoke(id, data) {
    var type = ActionTypes.DoneInvoke + "." + id;
    var eventObject = {
        type: type,
        data: data
    };
    eventObject.toString = function () {
        return type;
    };
    return eventObject;
}
function error(id, data) {
    var type = ActionTypes.ErrorPlatform + "." + id;
    var eventObject = { type: type, data: data };
    eventObject.toString = function () {
        return type;
    };
    return eventObject;
}

var __assign$2 = undefined && undefined.__assign || function () {
    __assign$2 = Object.assign || function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign$2.apply(this, arguments);
};
var __read$2 = undefined && undefined.__read || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o),
        r,
        ar = [],
        e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    } catch (error) {
        e = { error: error };
    } finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
            if (e) throw e.error;
        }
    }
    return ar;
};
var __spread$2 = undefined && undefined.__spread || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read$2(arguments[i]));
    return ar;
};
var __values$2 = undefined && undefined.__values || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator],
        i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var defaultStateTreeOptions = {
    resolved: false
};
var StateTree = /** @class */ /*#__PURE__*/function () {
    function StateTree(stateNode, stateValue, options, parent) {
        var _this = this;
        var _a;
        if (options === void 0) {
            options = defaultStateTreeOptions;
        }
        this.stateNode = stateNode;
        this.stateValue = stateValue;
        this.parent = parent;
        this.reentryNodes = new Set();
        this.root = this.parent ? this.parent.root : this;
        this.nodes = stateValue ? isString(stateValue) ? (_a = {}, _a[stateValue] = new StateTree(stateNode.getStateNode(stateValue), undefined, undefined, this), _a) : mapValues(stateValue, function (subValue, key) {
            return new StateTree(stateNode.getStateNode(key), subValue, undefined, _this);
        }) : {};
        var resolvedOptions = __assign$2({}, defaultStateTreeOptions, options);
        this.isResolved = resolvedOptions.resolved;
    }
    Object.defineProperty(StateTree.prototype, "done", {
        get: function () {
            var _this = this;
            switch (this.stateNode.type) {
                case 'final':
                    return true;
                case 'compound':
                    var childTree = this.nodes[keys(this.nodes)[0]];
                    return childTree.stateNode.type === 'final';
                case 'parallel':
                    return keys(this.nodes).every(function (key) {
                        return _this.nodes[key].done;
                    });
                default:
                    return false;
            }
        },
        enumerable: true,
        configurable: true
    });
    StateTree.prototype.getDoneData = function (context, event) {
        if (!this.done) {
            return undefined;
        }
        if (this.stateNode.type === 'compound') {
            var childTree = this.nodes[keys(this.nodes)[0]];
            if (!childTree.stateNode.data) {
                return undefined;
            }
            return mapContext(childTree.stateNode.data, context, event);
        }
        return undefined;
    };
    Object.defineProperty(StateTree.prototype, "atomicNodes", {
        get: function () {
            var _this = this;
            if (this.stateNode.type === 'atomic' || this.stateNode.type === 'final') {
                return [this.stateNode];
            }
            return flatten(keys(this.value).map(function (key) {
                return _this.value[key].atomicNodes;
            }));
        },
        enumerable: true,
        configurable: true
    });
    StateTree.prototype.getDoneEvents = function (entryStateNodes) {
        var _this = this;
        // If no state nodes are being entered, no done events will be fired
        if (!entryStateNodes || !entryStateNodes.size) {
            return [];
        }
        if (entryStateNodes.has(this.stateNode) && this.stateNode.type === 'final') {
            return [done(this.stateNode.id, this.stateNode.data)];
        }
        var childDoneEvents = flatten(keys(this.nodes).map(function (key) {
            return _this.nodes[key].getDoneEvents(entryStateNodes);
        }));
        if (this.stateNode.type === 'parallel') {
            var allChildrenDone = keys(this.nodes).every(function (key) {
                return _this.nodes[key].done;
            });
            if (childDoneEvents && allChildrenDone) {
                return childDoneEvents.concat(done(this.stateNode.id));
            } else {
                return childDoneEvents;
            }
        }
        if (!this.done || !childDoneEvents.length) {
            return childDoneEvents;
        }
        // TODO: handle merging strategy
        // For compound state nodes with final child state, there should be only
        // one done.state event (potentially with data).
        var doneData = childDoneEvents.length === 1 ? childDoneEvents[0].data : undefined;
        return childDoneEvents.concat(done(this.stateNode.id, doneData));
    };
    Object.defineProperty(StateTree.prototype, "resolved", {
        get: function () {
            var newStateTree = new StateTree(this.stateNode, this.stateNode.resolve(this.value), {
                resolved: true
            });
            newStateTree.reentryNodes = this.reentryNodes;
            return newStateTree;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StateTree.prototype, "paths", {
        get: function () {
            return toStatePaths(this.value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StateTree.prototype, "absolute", {
        get: function () {
            var _stateValue = this.stateValue;
            var absoluteStateValue = {};
            var marker = absoluteStateValue;
            for (var i = 0; i < this.stateNode.path.length; i++) {
                var key = this.stateNode.path[i];
                if (i === this.stateNode.path.length - 1) {
                    marker[key] = _stateValue;
                } else {
                    marker[key] = {};
                    marker = marker[key];
                }
            }
            var newStateTree = new StateTree(this.stateNode.machine, absoluteStateValue);
            newStateTree.reentryNodes = this.reentryNodes;
            return newStateTree;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StateTree.prototype, "nextEvents", {
        get: function () {
            var _this = this;
            var ownEvents = this.stateNode.ownEvents;
            var childEvents = flatten(keys(this.nodes).map(function (key) {
                var subTree = _this.nodes[key];
                return subTree.nextEvents;
            }));
            return __spread$2(new Set(childEvents.concat(ownEvents)));
        },
        enumerable: true,
        configurable: true
    });
    StateTree.prototype.clone = function () {
        var newStateTree = new StateTree(this.stateNode, this.value, undefined, this.parent);
        return newStateTree;
    };
    StateTree.prototype.combine = function (tree) {
        var _a, e_1, _b;
        if (tree.stateNode !== this.stateNode) {
            throw new Error('Cannot combine distinct trees');
        }
        var newTree = this.clone();
        tree.root.reentryNodes.forEach(function (reentryNode) {
            newTree.root.addReentryNode(reentryNode);
        });
        if (this.stateNode.type === 'compound') {
            // Only combine if no child state is defined
            var newValue = void 0;
            if (!keys(this.nodes).length || !keys(tree.nodes).length) {
                newValue = Object.assign({}, this.nodes, tree.nodes);
                newTree.nodes = newValue;
                return newTree;
            } else {
                var childKey = keys(this.nodes)[0];
                newValue = (_a = {}, _a[childKey] = this.nodes[childKey].combine(tree.nodes[childKey]), _a);
                newTree.nodes = newValue;
                return newTree;
            }
        }
        if (this.stateNode.type === 'parallel') {
            var valueKeys = new Set(__spread$2(keys(this.nodes), keys(tree.nodes)));
            var newValue = {};
            try {
                for (var valueKeys_1 = __values$2(valueKeys), valueKeys_1_1 = valueKeys_1.next(); !valueKeys_1_1.done; valueKeys_1_1 = valueKeys_1.next()) {
                    var key = valueKeys_1_1.value;
                    if (!this.nodes[key] || !tree.nodes[key]) {
                        newValue[key] = this.nodes[key] || tree.nodes[key];
                    } else {
                        newValue[key] = this.nodes[key].combine(tree.nodes[key]);
                    }
                }
            } catch (e_1_1) {
                e_1 = { error: e_1_1 };
            } finally {
                try {
                    if (valueKeys_1_1 && !valueKeys_1_1.done && (_b = valueKeys_1.return)) _b.call(valueKeys_1);
                } finally {
                    if (e_1) throw e_1.error;
                }
            }
            newTree.nodes = newValue;
            return newTree;
        }
        // nothing to do
        return this;
    };
    Object.defineProperty(StateTree.prototype, "value", {
        get: function () {
            if (this.stateNode.type === 'atomic' || this.stateNode.type === 'final') {
                return {};
            }
            if (this.stateNode.type === 'parallel') {
                return mapValues(this.nodes, function (st) {
                    return st.value;
                });
            }
            if (this.stateNode.type === 'compound') {
                if (keys(this.nodes).length === 0) {
                    return {};
                }
                var childStateNode = this.nodes[keys(this.nodes)[0]].stateNode;
                if (childStateNode.type === 'atomic' || childStateNode.type === 'final') {
                    return childStateNode.key;
                }
                return mapValues(this.nodes, function (st) {
                    return st.value;
                });
            }
            return {};
        },
        enumerable: true,
        configurable: true
    });
    StateTree.prototype.matches = function (parentValue) {
        return matchesState(parentValue, this.value);
    };
    StateTree.prototype.getEntryExitStates = function (prevTree) {
        var _this = this;
        var e_2, _a;
        var externalNodes = this.root.reentryNodes;
        if (!prevTree) {
            // Initial state
            return {
                exit: [],
                entry: __spread$2(externalNodes)
            };
        }
        if (prevTree.stateNode !== this.stateNode) {
            throw new Error('Cannot compare distinct trees');
        }
        switch (this.stateNode.type) {
            case 'compound':
                var compoundResult = {
                    exit: [],
                    entry: []
                };
                var currentChildKey = keys(this.nodes)[0];
                var prevChildKey = keys(prevTree.nodes)[0];
                if (currentChildKey !== prevChildKey) {
                    compoundResult.exit = prevTree.nodes[prevChildKey].getExitStates();
                    compoundResult.entry = this.nodes[currentChildKey].getEntryStates();
                } else {
                    compoundResult = this.nodes[currentChildKey].getEntryExitStates(prevTree.nodes[prevChildKey]);
                }
                if (externalNodes && externalNodes.has(this.stateNode)) {
                    compoundResult.exit.push(this.stateNode);
                    compoundResult.entry.unshift(this.stateNode);
                }
                return compoundResult;
            case 'parallel':
                var all = keys(this.nodes).map(function (key) {
                    return _this.nodes[key].getEntryExitStates(prevTree.nodes[key]);
                });
                var parallelResult = {
                    exit: [],
                    entry: []
                };
                try {
                    for (var all_1 = __values$2(all), all_1_1 = all_1.next(); !all_1_1.done; all_1_1 = all_1.next()) {
                        var ees = all_1_1.value;
                        parallelResult.exit = __spread$2(parallelResult.exit, ees.exit);
                        parallelResult.entry = __spread$2(parallelResult.entry, ees.entry);
                    }
                } catch (e_2_1) {
                    e_2 = { error: e_2_1 };
                } finally {
                    try {
                        if (all_1_1 && !all_1_1.done && (_a = all_1.return)) _a.call(all_1);
                    } finally {
                        if (e_2) throw e_2.error;
                    }
                }
                if (externalNodes && externalNodes.has(this.stateNode)) {
                    parallelResult.exit.push(this.stateNode);
                    parallelResult.entry.unshift(this.stateNode);
                }
                return parallelResult;
            case 'atomic':
            default:
                if (externalNodes && externalNodes.has(this.stateNode)) {
                    return {
                        exit: [this.stateNode],
                        entry: [this.stateNode]
                    };
                }
                return {
                    exit: [],
                    entry: []
                };
        }
    };
    StateTree.prototype.getEntryStates = function () {
        var _this = this;
        if (!this.nodes) {
            return [this.stateNode];
        }
        return [this.stateNode].concat(flatten(keys(this.nodes).map(function (key) {
            return _this.nodes[key].getEntryStates();
        })));
    };
    StateTree.prototype.getExitStates = function () {
        var _this = this;
        if (!this.nodes) {
            return [this.stateNode];
        }
        return flatten(keys(this.nodes).map(function (key) {
            return _this.nodes[key].getExitStates();
        })).concat(this.stateNode);
    };
    StateTree.prototype.addReentryNode = function (reentryNode) {
        this.root.reentryNodes.add(reentryNode);
    };
    return StateTree;
}();

var __values$3 = undefined && undefined.__values || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator],
        i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
function getChildren(stateNode) {
    return keys(stateNode.states).map(function (key) {
        return stateNode.states[key];
    });
}
function getConfiguration(prevStateNodes, stateNodes) {
    var e_1, _a, e_2, _b, e_3, _c;
    var prevConfiguration = new Set(prevStateNodes);
    var prevAdjList = getAdjList(prevConfiguration);
    var configuration = new Set(stateNodes);
    try {
        // add all ancestors
        for (var configuration_1 = __values$3(configuration), configuration_1_1 = configuration_1.next(); !configuration_1_1.done; configuration_1_1 = configuration_1.next()) {
            var s = configuration_1_1.value;
            var m = s.parent;
            while (m && !configuration.has(m)) {
                configuration.add(m);
                m = m.parent;
            }
        }
    } catch (e_1_1) {
        e_1 = { error: e_1_1 };
    } finally {
        try {
            if (configuration_1_1 && !configuration_1_1.done && (_a = configuration_1.return)) _a.call(configuration_1);
        } finally {
            if (e_1) throw e_1.error;
        }
    }
    var adjList = getAdjList(configuration);
    try {
        // console.log('KEYS:', [...adjList.keys()].map(k => k.id));
        // add descendants
        for (var configuration_2 = __values$3(configuration), configuration_2_1 = configuration_2.next(); !configuration_2_1.done; configuration_2_1 = configuration_2.next()) {
            var s = configuration_2_1.value;
            if (s.type === 'compound' && (!adjList.get(s) || !adjList.get(s).length)) {
                if (prevAdjList.get(s)) {
                    prevAdjList.get(s).forEach(function (sn) {
                        return configuration.add(sn);
                    });
                } else {
                    s.initialStateNodes.forEach(function (sn) {
                        return configuration.add(sn);
                    });
                }
            } else {
                if (s.type === 'parallel') {
                    try {
                        for (var _d = __values$3(getChildren(s)), _e = _d.next(); !_e.done; _e = _d.next()) {
                            var child = _e.value;
                            if (!configuration.has(child)) {
                                configuration.add(child);
                                if (prevAdjList.get(child)) {
                                    prevAdjList.get(child).forEach(function (sn) {
                                        return configuration.add(sn);
                                    });
                                } else {
                                    child.initialStateNodes.forEach(function (sn) {
                                        return configuration.add(sn);
                                    });
                                }
                            }
                        }
                    } catch (e_3_1) {
                        e_3 = { error: e_3_1 };
                    } finally {
                        try {
                            if (_e && !_e.done && (_c = _d.return)) _c.call(_d);
                        } finally {
                            if (e_3) throw e_3.error;
                        }
                    }
                }
            }
        }
    } catch (e_2_1) {
        e_2 = { error: e_2_1 };
    } finally {
        try {
            if (configuration_2_1 && !configuration_2_1.done && (_b = configuration_2.return)) _b.call(configuration_2);
        } finally {
            if (e_2) throw e_2.error;
        }
    }
    return configuration;
}
function getValueFromAdj(baseNode, adjList) {
    var stateValue = {};
    var childStateNodes = adjList.get(baseNode);
    if (!childStateNodes) {
        return {}; // todo: fix?
    }
    if (baseNode.type === 'compound') {
        if (childStateNodes[0]) {
            if (childStateNodes[0].type === 'atomic') {
                return childStateNodes[0].key;
            }
        } else {
            return {};
        }
    }
    childStateNodes.forEach(function (csn) {
        stateValue[csn.key] = getValueFromAdj(csn, adjList);
    });
    return stateValue;
}
function getAdjList(configuration) {
    var e_4, _a;
    var adjList = new Map();
    try {
        for (var configuration_3 = __values$3(configuration), configuration_3_1 = configuration_3.next(); !configuration_3_1.done; configuration_3_1 = configuration_3.next()) {
            var s = configuration_3_1.value;
            if (!adjList.has(s)) {
                adjList.set(s, []);
            }
            if (s.parent) {
                if (!adjList.has(s.parent)) {
                    adjList.set(s.parent, []);
                }
                adjList.get(s.parent).push(s);
            }
        }
    } catch (e_4_1) {
        e_4 = { error: e_4_1 };
    } finally {
        try {
            if (configuration_3_1 && !configuration_3_1.done && (_a = configuration_3.return)) _a.call(configuration_3);
        } finally {
            if (e_4) throw e_4.error;
        }
    }
    // console.log(
    //   [...adjList.keys()].map(key => [key.id, adjList.get(key)!.map(sn => sn.id)])
    // );
    return adjList;
}
function getValue(rootNode, configuration) {
    var config = getConfiguration([rootNode], configuration);
    return getValueFromAdj(rootNode, getAdjList(config));
}

var __assign$3 = undefined && undefined.__assign || function () {
    __assign$3 = Object.assign || function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign$3.apply(this, arguments);
};
var __rest$1 = undefined && undefined.__rest || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0) t[p[i]] = s[p[i]];
    return t;
};
var __read$3 = undefined && undefined.__read || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o),
        r,
        ar = [],
        e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    } catch (error) {
        e = { error: error };
    } finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
            if (e) throw e.error;
        }
    }
    return ar;
};
var __spread$3 = undefined && undefined.__spread || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read$3(arguments[i]));
    return ar;
};
var __values$4 = undefined && undefined.__values || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator],
        i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var STATE_DELIMITER$1 = '.';
var NULL_EVENT = '';
var STATE_IDENTIFIER = '#';
var TARGETLESS_KEY = '';
var EMPTY_OBJECT = {};
var isStateId = function (str) {
    return str[0] === STATE_IDENTIFIER;
};
var createDefaultOptions = function () {
    return {
        actions: {},
        guards: {},
        services: {},
        activities: {},
        delays: {},
        updater: updateContext
    };
};
var StateNode = /** @class */ /*#__PURE__*/function () {
    function StateNode(_config, options,
    /**
     * The initial extended state
     */
    context) {
        var _this = this;
        this.context = context;
        this.__xstatenode = true;
        this.__cache = {
            events: undefined,
            relativeValue: new Map(),
            initialStateValue: undefined,
            initialState: undefined,
            transitions: undefined
        };
        this.idMap = {};
        var parent = _config.parent,
            config = __rest$1(_config, ["parent"]);
        this.config = config;
        this.parent = parent;
        this.options = __assign$3({}, createDefaultOptions(), options);
        this.key = _config.key || _config.id || '(machine)';
        this.machine = this.parent ? this.parent.machine : this;
        this.path = this.parent ? this.parent.path.concat(this.key) : [];
        this.delimiter = _config.delimiter || (this.parent ? this.parent.delimiter : STATE_DELIMITER$1);
        this.id = _config.id || (this.machine ? __spread$3([this.machine.key], this.path).join(this.delimiter) : this.key);
        this.version = this.parent ? this.parent.version : _config.version;
        this.type = _config.type || (_config.parallel ? 'parallel' : _config.states && keys(_config.states).length ? 'compound' : _config.history ? 'history' : 'atomic');
        if (!IS_PRODUCTION) {
            warn(!('parallel' in _config), "The \"parallel\" property is deprecated and will be removed in version 4.1. " + (_config.parallel ? "Replace with `type: 'parallel'`" : "Use `type: '" + this.type + "'`") + " in the config for state node '" + this.id + "' instead.");
        }
        this.initial = _config.initial;
        this.order = _config.order || -1;
        this.states = _config.states ? mapValues(_config.states, function (stateConfig, key, _, i) {
            var _a;
            var stateNode = new StateNode(__assign$3({}, stateConfig, { key: key, order: stateConfig.order === undefined ? i : stateConfig.order, parent: _this }));
            Object.assign(_this.idMap, __assign$3((_a = {}, _a[stateNode.id] = stateNode, _a), stateNode.idMap));
            return stateNode;
        }) : EMPTY_OBJECT;
        // History config
        this.history = _config.history === true ? 'shallow' : _config.history || false;
        this._transient = !!(_config.on && _config.on[NULL_EVENT]);
        this.strict = !!_config.strict;
        // TODO: deprecate (entry)
        this.onEntry = toArray(_config.entry || _config.onEntry).map(function (action) {
            return toActionObject(action);
        });
        // TODO: deprecate (exit)
        this.onExit = toArray(_config.exit || _config.onExit).map(function (action) {
            return toActionObject(action);
        });
        this.meta = _config.meta;
        this.data = this.type === 'final' ? _config.data : undefined;
        this.invoke = toArray(_config.invoke).map(function (invokeConfig, i) {
            var _a, _b;
            if (isMachine(invokeConfig)) {
                (_this.parent || _this).options.services = __assign$3((_a = {}, _a[invokeConfig.id] = invokeConfig, _a), (_this.parent || _this).options.services);
                return {
                    type: invoke,
                    src: invokeConfig.id,
                    id: invokeConfig.id
                };
            } else if (typeof invokeConfig.src !== 'string') {
                var invokeSrc = _this.id + ":invocation[" + i + "]"; // TODO: util function
                _this.machine.options.services = __assign$3((_b = {}, _b[invokeSrc] = invokeConfig.src, _b), _this.machine.options.services);
                return __assign$3({ type: invoke, id: invokeSrc }, invokeConfig, { src: invokeSrc });
            } else {
                return __assign$3({}, invokeConfig, { type: invoke, id: invokeConfig.id || invokeConfig.src, src: invokeConfig.src });
            }
        });
        this.activities = toArray(_config.activities).concat(this.invoke).map(function (activity) {
            return toActivityDefinition(activity);
        });
        this.after = this.getDelayedTransitions();
    }
    /**
     * Clones this state machine with custom options and context.
     *
     * @param options Options (actions, guards, activities, services) to recursively merge with the existing options.
     * @param context Custom context (will override predefined context)
     */
    StateNode.prototype.withConfig = function (options, context) {
        if (context === void 0) {
            context = this.context;
        }
        var _a = this.options,
            actions = _a.actions,
            activities = _a.activities,
            guards = _a.guards,
            services = _a.services,
            delays = _a.delays;
        return new StateNode(this.config, {
            actions: __assign$3({}, actions, options.actions),
            activities: __assign$3({}, activities, options.activities),
            guards: __assign$3({}, guards, options.guards),
            services: __assign$3({}, services, options.services),
            delays: __assign$3({}, delays, options.delays)
        }, context);
    };
    /**
     * Clones this state machine with custom context.
     *
     * @param context Custom context (will override predefined context, not recursive)
     */
    StateNode.prototype.withContext = function (context) {
        return new StateNode(this.config, this.options, context);
    };
    Object.defineProperty(StateNode.prototype, "definition", {
        /**
         * The well-structured state node definition.
         */
        get: function () {
            return {
                id: this.id,
                key: this.key,
                version: this.version,
                type: this.type,
                initial: this.initial,
                history: this.history,
                states: mapValues(this.states, function (state) {
                    return state.definition;
                }),
                on: this.on,
                onEntry: this.onEntry,
                onExit: this.onExit,
                activities: this.activities || [],
                meta: this.meta,
                order: this.order || -1,
                data: this.data,
                invoke: this.invoke
            };
        },
        enumerable: true,
        configurable: true
    });
    StateNode.prototype.toJSON = function () {
        return this.definition;
    };
    Object.defineProperty(StateNode.prototype, "on", {
        /**
         * The mapping of events to transitions.
         */
        get: function () {
            return this.__cache.transitions || (this.__cache.transitions = this.formatTransitions(), this.__cache.transitions);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StateNode.prototype, "transitions", {
        /**
         * All the transitions that can be taken from this state node.
         */
        get: function () {
            var _this = this;
            return flatten(keys(this.on).map(function (event) {
                return _this.on[event];
            }));
        },
        enumerable: true,
        configurable: true
    });
    /**
     * All delayed transitions from the config.
     */
    StateNode.prototype.getDelayedTransitions = function () {
        var _this = this;
        if (this.after) {
            return this.after;
        }
        var afterConfig = this.config.after;
        var guards = this.machine.options.guards;
        if (!afterConfig) {
            return [];
        }
        if (isArray(afterConfig)) {
            return afterConfig.map(function (delayedTransition, i) {
                var delay = delayedTransition.delay,
                    target = delayedTransition.target;
                var delayRef;
                if (isFunction(delay)) {
                    delayRef = _this.id + ":delay[" + i + "]";
                    _this.options.delays[delayRef] = delay; // TODO: util function
                } else {
                    delayRef = delay;
                }
                var event = after$1(delayRef, _this.id);
                _this.onEntry.push(send$1(event, { delay: delay }));
                _this.onExit.push(cancel$1(event));
                return __assign$3({ event: event }, delayedTransition, { source: _this, target: target === undefined ? undefined : toArray(target), cond: toGuard(delayedTransition.cond, guards), actions: toArray(delayedTransition.actions).map(function (action) {
                        return toActionObject(action);
                    }) });
            });
        }
        var allDelayedTransitions = flatten(keys(afterConfig).map(function (delayKey) {
            var delayedTransition = afterConfig[delayKey];
            var delay = isNaN(+delayKey) ? delayKey : +delayKey;
            var event = after$1(delay, _this.id);
            _this.onEntry.push(send$1(event, { delay: delay }));
            _this.onExit.push(cancel$1(event));
            if (isString(delayedTransition)) {
                return [{
                    source: _this,
                    target: [delayedTransition],
                    delay: delay,
                    event: event,
                    actions: []
                }];
            }
            var delayedTransitions = toArray(delayedTransition);
            return delayedTransitions.map(function (transition) {
                return __assign$3({ event: event,
                    delay: delay }, transition, { source: _this, target: transition.target === undefined ? transition.target : toArray(transition.target), cond: toGuard(transition.cond, guards), actions: toArray(transition.actions).map(function (action) {
                        return toActionObject(action);
                    }) });
            });
        }));
        allDelayedTransitions.sort(function (a, b) {
            return isString(a) || isString(b) ? 0 : +a.delay - +b.delay;
        });
        return allDelayedTransitions;
    };
    /**
     * Returns the state nodes represented by the current state value.
     *
     * @param state The state value or State instance
     */
    StateNode.prototype.getStateNodes = function (state) {
        var _this = this;
        var _a;
        if (!state) {
            return [];
        }
        var stateValue = state instanceof State ? state.value : toStateValue(state, this.delimiter);
        if (isString(stateValue)) {
            var initialStateValue = this.getStateNode(stateValue).initial;
            return initialStateValue !== undefined ? this.getStateNodes((_a = {}, _a[stateValue] = initialStateValue, _a)) : [this.states[stateValue]];
        }
        var subStateKeys = keys(stateValue);
        var subStateNodes = subStateKeys.map(function (subStateKey) {
            return _this.getStateNode(subStateKey);
        });
        return subStateNodes.concat(subStateKeys.reduce(function (allSubStateNodes, subStateKey) {
            var subStateNode = _this.getStateNode(subStateKey).getStateNodes(stateValue[subStateKey]);
            return allSubStateNodes.concat(subStateNode);
        }, []));
    };
    /**
     * Returns `true` if this state node explicitly handles the given event.
     *
     * @param event The event in question
     */
    StateNode.prototype.handles = function (event) {
        var eventType = getEventType(event);
        return this.events.indexOf(eventType) !== -1;
    };
    /**
     * Resolves the given `state` to a new `State` instance relative to this machine.
     *
     * This ensures that `.events` and `.nextEvents` represent the correct values.
     *
     * @param state The state to resolve
     */
    StateNode.prototype.resolveState = function (state) {
        return new State(__assign$3({}, state, { value: this.resolve(state.value), tree: this.getStateTree(state.value) }));
    };
    StateNode.prototype.transitionLeafNode = function (stateValue, state, eventObject) {
        var stateNode = this.getStateNode(stateValue);
        var next = stateNode.next(state, eventObject);
        if (!next.tree) {
            var _a = this.next(state, eventObject),
                actions = _a.actions,
                tree = _a.tree,
                transitions = _a.transitions,
                configuration = _a.configuration;
            return {
                tree: tree,
                transitions: transitions,
                configuration: configuration,
                source: state,
                actions: actions
            };
        }
        return next;
    };
    StateNode.prototype.transitionCompoundNode = function (stateValue, state, eventObject) {
        var subStateKeys = keys(stateValue);
        var stateNode = this.getStateNode(subStateKeys[0]);
        var next = stateNode._transition(stateValue[subStateKeys[0]], state, eventObject);
        if (!next.tree) {
            var _a = this.next(state, eventObject),
                actions = _a.actions,
                tree = _a.tree,
                transitions = _a.transitions,
                configuration = _a.configuration;
            return {
                tree: tree,
                transitions: transitions,
                configuration: configuration,
                source: state,
                actions: actions
            };
        }
        return next;
    };
    StateNode.prototype.transitionParallelNode = function (stateValue, state, eventObject) {
        var e_1, _a;
        var noTransitionKeys = [];
        var transitionMap = {};
        try {
            for (var _b = __values$4(keys(stateValue)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var subStateKey = _c.value;
                var subStateValue = stateValue[subStateKey];
                if (!subStateValue) {
                    continue;
                }
                var subStateNode = this.getStateNode(subStateKey);
                var next = subStateNode._transition(subStateValue, state, eventObject);
                if (!next.tree) {
                    noTransitionKeys.push(subStateKey);
                }
                transitionMap[subStateKey] = next;
            }
        } catch (e_1_1) {
            e_1 = { error: e_1_1 };
        } finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            } finally {
                if (e_1) throw e_1.error;
            }
        }
        var stateTransitions = keys(transitionMap).map(function (key) {
            return transitionMap[key];
        });
        var enabledTransitions = flatten(stateTransitions.map(function (st) {
            return st.transitions;
        }));
        var willTransition = stateTransitions.some(function (transition) {
            return transition.tree !== undefined;
        });
        if (!willTransition) {
            var _d = this.next(state, eventObject),
                actions = _d.actions,
                tree = _d.tree,
                transitions = _d.transitions,
                _configuration = _d.configuration;
            return {
                tree: tree,
                transitions: transitions,
                configuration: _configuration,
                source: state,
                actions: actions
            };
        }
        var targetNodes = flatten(stateTransitions.map(function (st) {
            return st.configuration;
        }));
        var prevNodes = this.getStateNodes(stateValue);
        // console.log(targetNodes.map(t => t.id));
        // console.log([...getConfiguration(prevNodes, targetNodes)].map(c => c.id));
        var stateValueFromConfiguration = getValue(this.machine, getConfiguration(prevNodes, targetNodes));
        // console.log(sv);
        var combinedTree = new StateTree(this.machine, stateValueFromConfiguration);
        // const allTrees = keys(transitionMap)
        //   .map(key => transitionMap[key].tree)
        //   .filter(t => t !== undefined) as StateTree[];
        // const combinedTree = allTrees.reduce((acc, t) => {
        //   return acc.combine(t);
        // });
        var allPaths = combinedTree.paths;
        var configuration = flatten(keys(transitionMap).map(function (key) {
            return transitionMap[key].configuration;
        }));
        // External transition that escapes orthogonal region
        if (allPaths.length === 1 && !matchesState(toStateValue(this.path, this.delimiter), combinedTree.value)) {
            return {
                tree: combinedTree,
                transitions: enabledTransitions,
                configuration: configuration,
                source: state,
                actions: flatten(keys(transitionMap).map(function (key) {
                    return transitionMap[key].actions;
                }))
            };
        }
        // const allResolvedTrees = keys(transitionMap).map(key => {
        //   const { tree } = transitionMap[key];
        //   if (tree) {
        //     return tree;
        //   }
        //   const subValue = path(this.path)(state.value)[key];
        //   return new StateTree(this.getStateNode(key), subValue).absolute;
        // });
        // const finalCombinedTree = allResolvedTrees.reduce((acc, t) => {
        //   return acc.combine(t);
        // });
        return {
            tree: combinedTree,
            transitions: enabledTransitions,
            configuration: configuration,
            source: state,
            actions: flatten(keys(transitionMap).map(function (key) {
                return transitionMap[key].actions;
            }))
        };
    };
    StateNode.prototype._transition = function (stateValue, state, event) {
        // leaf node
        if (isString(stateValue)) {
            return this.transitionLeafNode(stateValue, state, event);
        }
        // hierarchical node
        if (keys(stateValue).length === 1) {
            return this.transitionCompoundNode(stateValue, state, event);
        }
        // orthogonal node
        return this.transitionParallelNode(stateValue, state, event);
    };
    StateNode.prototype.next = function (state, eventObject) {
        var _this = this;
        var e_2, _a;
        var eventType = eventObject.type;
        var candidates = this.on[eventType];
        if (!candidates || !candidates.length) {
            return {
                tree: undefined,
                transitions: [],
                configuration: [],
                source: state,
                actions: []
            };
        }
        var actions = this._transient ? [{ type: nullEvent }] : [];
        var nextStateStrings = [];
        var selectedTransition;
        try {
            for (var candidates_1 = __values$4(candidates), candidates_1_1 = candidates_1.next(); !candidates_1_1.done; candidates_1_1 = candidates_1.next()) {
                var candidate = candidates_1_1.value;
                var cond = candidate.cond,
                    stateIn = candidate.in;
                var resolvedContext = state.context;
                var isInState = stateIn ? isString(stateIn) && isStateId(stateIn) ? // Check if in state by ID
                state.matches(toStateValue(this.getStateNodeById(stateIn).path, this.delimiter)) : // Check if in state by relative grandparent
                matchesState(toStateValue(stateIn, this.delimiter), path(this.path.slice(0, -2))(state.value)) : true;
                var guardPassed = false;
                try {
                    guardPassed = !cond || this.evaluateGuard(cond, resolvedContext, eventObject, state);
                } catch (err) {
                    throw new Error("Unable to evaluate guard '" + (cond.name || cond.type) + "' in transition for event '" + eventType + "' in state node '" + this.id + "':\n" + err.message);
                }
                if (guardPassed && isInState) {
                    if (candidate.target !== undefined) {
                        nextStateStrings = candidate.target;
                    }
                    actions.push.apply(actions, __spread$3(toArray(candidate.actions)));
                    selectedTransition = candidate;
                    break;
                }
            }
        } catch (e_2_1) {
            e_2 = { error: e_2_1 };
        } finally {
            try {
                if (candidates_1_1 && !candidates_1_1.done && (_a = candidates_1.return)) _a.call(candidates_1);
            } finally {
                if (e_2) throw e_2.error;
            }
        }
        if (!nextStateStrings.length) {
            return {
                tree: selectedTransition && state.value // targetless transition
                ? new StateTree(this, path(this.path)(state.value)).absolute : undefined,
                transitions: [selectedTransition],
                configuration: selectedTransition && state.value ? [this] : [],
                source: state,
                actions: actions
            };
        }
        var nextStateNodes = flatten(nextStateStrings.map(function (str) {
            if (str instanceof StateNode) {
                return str; // TODO: fix anys
            }
            return _this.getRelativeStateNodes(str, state.historyValue);
        }));
        var isInternal = !!selectedTransition.internal;
        var reentryNodes = isInternal ? [] : flatten(nextStateNodes.map(function (n) {
            return _this.nodesFromChild(n);
        }));
        var trees = nextStateNodes.map(function (stateNode) {
            return stateNode.tree;
        });
        var combinedTree = trees.reduce(function (acc, t) {
            return acc.combine(t);
        });
        reentryNodes.forEach(function (reentryNode) {
            return combinedTree.addReentryNode(reentryNode);
        });
        return {
            tree: combinedTree,
            transitions: [selectedTransition],
            configuration: nextStateNodes,
            source: state,
            actions: actions
        };
    };
    Object.defineProperty(StateNode.prototype, "tree", {
        /**
         * The state tree represented by this state node.
         */
        get: function () {
            var stateValue = toStateValue(this.path, this.delimiter);
            return new StateTree(this.machine, stateValue);
        },
        enumerable: true,
        configurable: true
    });
    StateNode.prototype.nodesFromChild = function (childStateNode) {
        if (childStateNode.escapes(this)) {
            return [];
        }
        var nodes = [];
        var marker = childStateNode;
        while (marker && marker !== this) {
            nodes.push(marker);
            marker = marker.parent;
        }
        nodes.push(this); // inclusive
        return nodes;
    };
    StateNode.prototype.getStateTree = function (stateValue) {
        return new StateTree(this, stateValue);
    };
    /**
     * Whether the given state node "escapes" this state node. If the `stateNode` is equal to or the parent of
     * this state node, it does not escape.
     */
    StateNode.prototype.escapes = function (stateNode) {
        if (this === stateNode) {
            return false;
        }
        var parent = this.parent;
        while (parent) {
            if (parent === stateNode) {
                return false;
            }
            parent = parent.parent;
        }
        return true;
    };
    StateNode.prototype.evaluateGuard = function (guard, context, eventObject, state) {
        var condFn;
        var guards = this.machine.options.guards;
        var guardMeta = {
            state: state,
            cond: guard
        };
        // TODO: do not hardcode!
        if (guard.type === DEFAULT_GUARD_TYPE) {
            return guard.predicate(context, eventObject, guardMeta);
        }
        if (!guards[guard.type]) {
            throw new Error("Guard '" + guard.type + "' is not implemented on machine '" + this.machine.id + "'.");
        }
        condFn = guards[guard.type];
        return condFn(context, eventObject, guardMeta);
    };
    StateNode.prototype.getActions = function (transition, prevState) {
        var entryExitStates = transition.tree ? transition.tree.resolved.getEntryExitStates(prevState ? this.getStateTree(prevState.value) : undefined) : { entry: [], exit: [] };
        var doneEvents = transition.tree ? transition.tree.getDoneEvents(new Set(entryExitStates.entry)) : [];
        if (!transition.source) {
            entryExitStates.exit = [];
            // Ensure that root StateNode (machine) is entered
            entryExitStates.entry.unshift(this);
        }
        var entryStates = new Set(entryExitStates.entry);
        var exitStates = new Set(entryExitStates.exit);
        var _a = __read$3([flatten(Array.from(entryStates).map(function (stateNode) {
            return __spread$3(stateNode.activities.map(function (activity) {
                return start$1(activity);
            }), stateNode.onEntry);
        })).concat(doneEvents.map(raise$1)), flatten(Array.from(exitStates).map(function (stateNode) {
            return __spread$3(stateNode.onExit, stateNode.activities.map(function (activity) {
                return stop$1(activity);
            }));
        }))], 2),
            entryActions = _a[0],
            exitActions = _a[1];
        var actions = toActionObjects(exitActions.concat(transition.actions).concat(entryActions), this.machine.options.actions);
        return actions;
    };
    /**
     * Determines the next state given the current `state` and sent `event`.
     *
     * @param state The current State instance or state value
     * @param event The event that was sent at the current state
     * @param context The current context (extended state) of the current state
     */
    StateNode.prototype.transition = function (state, event, context) {
        var currentState;
        if (state instanceof State) {
            currentState = context === undefined ? state : this.resolveState(State.from(state, context));
        } else {
            var resolvedStateValue = isString(state) ? this.resolve(pathToStateValue(this.getResolvedPath(state))) : this.resolve(state);
            var resolvedContext = context ? context : this.machine.context;
            currentState = this.resolveState(State.from(resolvedStateValue, resolvedContext));
        }
        var eventObject = toEventObject(event);
        var eventType = eventObject.type;
        if (this.strict) {
            if (this.events.indexOf(eventType) === -1 && !isBuiltInEvent(eventType)) {
                throw new Error("Machine '" + this.id + "' does not accept event '" + eventType + "'");
            }
        }
        var stateTransition = this._transition(currentState.value, currentState, eventObject);
        if (stateTransition.tree) {
            stateTransition.tree = stateTransition.tree.resolved;
        }
        // const prevConfig = this.machine.getStateNodes(currentState.value);
        // const cv = getValue(
        //   this.machine,
        //   getConfiguration(prevConfig, stateTransition.configuration)
        // );
        // if (stateTransition.tree) {
        //   const eq = stateValuesEqual(cv, stateTransition.tree.value);
        //   console.log(eq);
        // }
        // if (!eq) {
        //   console.log('prevConfig', prevConfig.map(c => c.id));
        //   console.log('config', [...stateTransition.configuration].map(c => c.id));
        //   console.log(cv, stateTransition.tree!.value);
        // }
        return this.resolveTransition(stateTransition, currentState, eventObject);
    };
    StateNode.prototype.resolveTransition = function (stateTransition, currentState, _eventObject) {
        var _this = this;
        var e_3, _a, _b;
        var resolvedStateValue = stateTransition.tree ? stateTransition.tree.value : undefined;
        var historyValue = currentState ? currentState.historyValue ? currentState.historyValue : stateTransition.source ? this.machine.historyValue(currentState.value) : undefined : undefined;
        var currentContext = currentState ? currentState.context : stateTransition.context || this.machine.context;
        var eventObject = _eventObject || { type: ActionTypes.Init };
        if (!IS_PRODUCTION && stateTransition.tree) {
            try {
                this.ensureValidPaths(stateTransition.tree.paths); // TODO: ensure code coverage for this
            } catch (e) {
                throw new Error("Event '" + (eventObject ? eventObject.type : 'none') + "' leads to an invalid configuration: " + e.message);
            }
        }
        var actions = this.getActions(stateTransition, currentState);
        var activities = currentState ? __assign$3({}, currentState.activities) : {};
        try {
            for (var actions_1 = __values$4(actions), actions_1_1 = actions_1.next(); !actions_1_1.done; actions_1_1 = actions_1.next()) {
                var action = actions_1_1.value;
                if (action.type === start) {
                    activities[action.activity.type] = action;
                } else if (action.type === stop) {
                    activities[action.activity.type] = false;
                }
            }
        } catch (e_3_1) {
            e_3 = { error: e_3_1 };
        } finally {
            try {
                if (actions_1_1 && !actions_1_1.done && (_a = actions_1.return)) _a.call(actions_1);
            } finally {
                if (e_3) throw e_3.error;
            }
        }
        var _c = __read$3(partition(actions, function (action) {
            return action.type === raise || action.type === nullEvent;
        }), 2),
            raisedEvents = _c[0],
            otherActions = _c[1];
        var _d = __read$3(partition(otherActions, function (action) {
            return action.type === assign;
        }), 2),
            assignActions = _d[0],
            nonEventActions = _d[1];
        var updatedContext = assignActions.length ? this.options.updater(currentContext, eventObject, assignActions) : currentContext;
        var resolvedActions = flatten(nonEventActions.map(function (actionObject) {
            if (actionObject.type === send) {
                var sendAction = resolveSend(actionObject, updatedContext, eventObject || { type: ActionTypes.Init }); // TODO: fix ActionTypes.Init
                if (isString(sendAction.delay)) {
                    if (!_this.machine.options.delays || _this.machine.options.delays[sendAction.delay] === undefined) {
                        if (!IS_PRODUCTION) {
                            warn(false,
                            // tslint:disable-next-line:max-line-length
                            "No delay reference for delay expression '" + sendAction.delay + "' was found on machine '" + _this.machine.id + "'");
                        }
                        // Do not send anything
                        return sendAction;
                    }
                    var delayExpr = _this.machine.options.delays[sendAction.delay];
                    sendAction.delay = typeof delayExpr === 'number' ? delayExpr : delayExpr(updatedContext, eventObject || { type: ActionTypes.Init });
                }
                return sendAction;
            }
            if (actionObject.type === ActionTypes.Pure) {
                return actionObject.get(updatedContext, eventObject) || [];
            }
            return toActionObject(actionObject, _this.options.actions);
        }));
        var stateNodes = resolvedStateValue ? this.getStateNodes(resolvedStateValue) : [];
        var isTransient = stateNodes.some(function (stateNode) {
            return stateNode._transient;
        });
        if (isTransient) {
            raisedEvents.push({ type: nullEvent });
        }
        var meta = __spread$3([this], stateNodes).reduce(function (acc, stateNode) {
            if (stateNode.meta !== undefined) {
                acc[stateNode.id] = stateNode.meta;
            }
            return acc;
        }, {});
        var nextState = new State({
            value: resolvedStateValue || currentState.value,
            context: updatedContext,
            event: eventObject || initEvent,
            historyValue: resolvedStateValue ? historyValue ? updateHistoryValue(historyValue, resolvedStateValue) : undefined : currentState ? currentState.historyValue : undefined,
            history: !resolvedStateValue || stateTransition.source ? currentState : undefined,
            actions: resolvedStateValue ? resolvedActions : [],
            activities: resolvedStateValue ? activities : currentState ? currentState.activities : {},
            meta: resolvedStateValue ? meta : currentState ? currentState.meta : undefined,
            events: resolvedStateValue ? raisedEvents : [],
            tree: resolvedStateValue ? stateTransition.tree : currentState ? currentState.tree : undefined
        });
        nextState.changed = eventObject.type === update || !!assignActions.length;
        // Dispose of penultimate histories to prevent memory leaks
        var history = nextState.history;
        if (history) {
            delete history.history;
        }
        if (!resolvedStateValue) {
            return nextState;
        }
        var maybeNextState = nextState;
        while (raisedEvents.length) {
            var currentActions = maybeNextState.actions;
            var raisedEvent = raisedEvents.shift();
            maybeNextState = this.transition(maybeNextState, raisedEvent.type === nullEvent ? NULL_EVENT : raisedEvent.event, maybeNextState.context);
            // Save original event to state
            maybeNextState.event = eventObject;
            (_b = maybeNextState.actions).unshift.apply(_b, __spread$3(currentActions));
        }
        // Detect if state changed
        var changed = maybeNextState.changed || (history ? !!maybeNextState.actions.length || !!assignActions.length || typeof history.value !== typeof maybeNextState.value || !stateValuesEqual(maybeNextState.value, history.value) : undefined);
        maybeNextState.changed = changed;
        // Preserve original history after raised events
        maybeNextState.historyValue = nextState.historyValue;
        maybeNextState.history = history;
        return maybeNextState;
    };
    StateNode.prototype.ensureValidPaths = function (paths) {
        var _this = this;
        var e_4, _a;
        if (!IS_PRODUCTION) {
            var visitedParents = new Map();
            var stateNodes = flatten(paths.map(function (_path) {
                return _this.getRelativeStateNodes(_path);
            }));
            try {
                outer: for (var stateNodes_1 = __values$4(stateNodes), stateNodes_1_1 = stateNodes_1.next(); !stateNodes_1_1.done; stateNodes_1_1 = stateNodes_1.next()) {
                    var stateNode = stateNodes_1_1.value;
                    var marker = stateNode;
                    while (marker.parent) {
                        if (visitedParents.has(marker.parent)) {
                            if (marker.parent.type === 'parallel') {
                                continue outer;
                            }
                            throw new Error("State node '" + stateNode.id + "' shares parent '" + marker.parent.id + "' with state node '" + visitedParents.get(marker.parent).map(function (a) {
                                return a.id;
                            }) + "'");
                        }
                        if (!visitedParents.get(marker.parent)) {
                            visitedParents.set(marker.parent, [stateNode]);
                        } else {
                            visitedParents.get(marker.parent).push(stateNode);
                        }
                        marker = marker.parent;
                    }
                }
            } catch (e_4_1) {
                e_4 = { error: e_4_1 };
            } finally {
                try {
                    if (stateNodes_1_1 && !stateNodes_1_1.done && (_a = stateNodes_1.return)) _a.call(stateNodes_1);
                } finally {
                    if (e_4) throw e_4.error;
                }
            }
        } else {
            return;
        }
    };
    /**
     * Returns the child state node from its relative `stateKey`, or throws.
     */
    StateNode.prototype.getStateNode = function (stateKey) {
        if (isStateId(stateKey)) {
            return this.machine.getStateNodeById(stateKey);
        }
        if (!this.states) {
            throw new Error("Unable to retrieve child state '" + stateKey + "' from '" + this.id + "'; no child states exist.");
        }
        var result = this.states[stateKey];
        if (!result) {
            throw new Error("Child state '" + stateKey + "' does not exist on '" + this.id + "'");
        }
        return result;
    };
    /**
     * Returns the state node with the given `stateId`, or throws.
     *
     * @param stateId The state ID. The prefix "#" is removed.
     */
    StateNode.prototype.getStateNodeById = function (stateId) {
        var resolvedStateId = isStateId(stateId) ? stateId.slice(STATE_IDENTIFIER.length) : stateId;
        if (resolvedStateId === this.id) {
            return this;
        }
        var stateNode = this.machine.idMap[resolvedStateId];
        if (!stateNode) {
            throw new Error("Child state node '#" + resolvedStateId + "' does not exist on machine '" + this.id + "'");
        }
        return stateNode;
    };
    /**
     * Returns the relative state node from the given `statePath`, or throws.
     *
     * @param statePath The string or string array relative path to the state node.
     */
    StateNode.prototype.getStateNodeByPath = function (statePath) {
        if (typeof statePath === 'string' && isStateId(statePath)) {
            try {
                return this.getStateNodeById(statePath.slice(1));
            } catch (e) {
                // try individual paths
                // throw e;
            }
        }
        var arrayStatePath = toStatePath(statePath, this.delimiter).slice();
        var currentStateNode = this;
        while (arrayStatePath.length) {
            var key = arrayStatePath.shift();
            if (!key.length) {
                break;
            }
            currentStateNode = currentStateNode.getStateNode(key);
        }
        return currentStateNode;
    };
    /**
     * Resolves a partial state value with its full representation in this machine.
     *
     * @param stateValue The partial state value to resolve.
     */
    StateNode.prototype.resolve = function (stateValue) {
        var _this = this;
        var _a;
        if (!stateValue) {
            return this.initialStateValue || EMPTY_OBJECT; // TODO: type-specific properties
        }
        switch (this.type) {
            case 'parallel':
                return mapValues(this.initialStateValue, function (subStateValue, subStateKey) {
                    return subStateValue ? _this.getStateNode(subStateKey).resolve(stateValue[subStateKey] || subStateValue) : EMPTY_OBJECT;
                });
            case 'compound':
                if (isString(stateValue)) {
                    var subStateNode = this.getStateNode(stateValue);
                    if (subStateNode.type === 'parallel' || subStateNode.type === 'compound') {
                        return _a = {}, _a[stateValue] = subStateNode.initialStateValue, _a;
                    }
                    return stateValue;
                }
                if (!keys(stateValue).length) {
                    return this.initialStateValue || {};
                }
                return mapValues(stateValue, function (subStateValue, subStateKey) {
                    return subStateValue ? _this.getStateNode(subStateKey).resolve(subStateValue) : EMPTY_OBJECT;
                });
            default:
                return stateValue || EMPTY_OBJECT;
        }
    };
    Object.defineProperty(StateNode.prototype, "resolvedStateValue", {
        get: function () {
            var _a, _b;
            var key = this.key;
            if (this.type === 'parallel') {
                return _a = {}, _a[key] = mapFilterValues(this.states, function (stateNode) {
                    return stateNode.resolvedStateValue[stateNode.key];
                }, function (stateNode) {
                    return !(stateNode.type === 'history');
                }), _a;
            }
            if (this.initial === undefined) {
                // If leaf node, value is just the state node's key
                return key;
            }
            if (!this.states[this.initial]) {
                throw new Error("Initial state '" + this.initial + "' not found on '" + key + "'");
            }
            return _b = {}, _b[key] = this.states[this.initial].resolvedStateValue, _b;
        },
        enumerable: true,
        configurable: true
    });
    StateNode.prototype.getResolvedPath = function (stateIdentifier) {
        if (isStateId(stateIdentifier)) {
            var stateNode = this.machine.idMap[stateIdentifier.slice(STATE_IDENTIFIER.length)];
            if (!stateNode) {
                throw new Error("Unable to find state node '" + stateIdentifier + "'");
            }
            return stateNode.path;
        }
        return toStatePath(stateIdentifier, this.delimiter);
    };
    Object.defineProperty(StateNode.prototype, "initialStateValue", {
        get: function () {
            if (this.__cache.initialStateValue) {
                return this.__cache.initialStateValue;
            }
            var initialStateValue = this.type === 'parallel' ? mapFilterValues(this.states, function (state) {
                return state.initialStateValue || EMPTY_OBJECT;
            }, function (stateNode) {
                return !(stateNode.type === 'history');
            }) : isString(this.resolvedStateValue) ? undefined : this.resolvedStateValue[this.key];
            this.__cache.initialStateValue = initialStateValue;
            return this.__cache.initialStateValue;
        },
        enumerable: true,
        configurable: true
    });
    StateNode.prototype.getInitialState = function (stateValue, context) {
        if (context === void 0) {
            context = this.machine.context;
        }
        var tree = this.getStateTree(stateValue);
        var configuration = this.getStateNodes(stateValue);
        configuration.forEach(function (stateNode) {
            tree.addReentryNode(stateNode);
        });
        return this.resolveTransition({
            tree: tree,
            configuration: configuration,
            transitions: [],
            source: undefined,
            actions: [],
            context: context
        });
    };
    Object.defineProperty(StateNode.prototype, "initialState", {
        /**
         * The initial State instance, which includes all actions to be executed from
         * entering the initial state.
         */
        get: function () {
            if (this.__cache.initialState) {
                return this.__cache.initialState;
            }
            var initialStateValue = this.initialStateValue;
            if (!initialStateValue) {
                throw new Error("Cannot retrieve initial state from simple state '" + this.id + "'.");
            }
            this.__cache.initialState = this.getInitialState(initialStateValue);
            return this.__cache.initialState;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StateNode.prototype, "target", {
        /**
         * The target state value of the history state node, if it exists. This represents the
         * default state value to transition to if no history value exists yet.
         */
        get: function () {
            var target;
            if (this.type === 'history') {
                var historyConfig = this.config;
                if (historyConfig.target && isString(historyConfig.target)) {
                    target = isStateId(historyConfig.target) ? pathToStateValue(this.machine.getStateNodeById(historyConfig.target).path.slice(this.path.length - 1)) : historyConfig.target;
                } else {
                    target = historyConfig.target;
                }
            }
            return target;
        },
        enumerable: true,
        configurable: true
    });
    StateNode.prototype.getStates = function (stateValue) {
        var e_5, _a;
        if (isString(stateValue)) {
            return [this.states[stateValue]];
        }
        var stateNodes = [];
        try {
            for (var _b = __values$4(keys(stateValue)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var key = _c.value;
                stateNodes.push.apply(stateNodes, __spread$3(this.states[key].getStates(stateValue[key])));
            }
        } catch (e_5_1) {
            e_5 = { error: e_5_1 };
        } finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            } finally {
                if (e_5) throw e_5.error;
            }
        }
        return stateNodes;
    };
    /**
     * Returns the leaf nodes from a state path relative to this state node.
     *
     * @param relativeStateId The relative state path to retrieve the state nodes
     * @param history The previous state to retrieve history
     * @param resolve Whether state nodes should resolve to initial child state nodes
     */
    StateNode.prototype.getRelativeStateNodes = function (relativeStateId, historyValue, resolve) {
        if (resolve === void 0) {
            resolve = true;
        }
        if (isString(relativeStateId) && isStateId(relativeStateId)) {
            var unresolvedStateNode = this.getStateNodeById(relativeStateId);
            return resolve ? unresolvedStateNode.type === 'history' ? unresolvedStateNode.resolveHistory(historyValue) : unresolvedStateNode.initialStateNodes : [unresolvedStateNode];
        }
        var statePath = toStatePath(relativeStateId, this.delimiter);
        var rootStateNode = this.parent || this;
        var unresolvedStateNodes = rootStateNode.getFromRelativePath(statePath, historyValue);
        if (!resolve) {
            return unresolvedStateNodes;
        }
        return flatten(unresolvedStateNodes.map(function (stateNode) {
            return stateNode.initialStateNodes;
        }));
    };
    Object.defineProperty(StateNode.prototype, "initialStateNodes", {
        get: function () {
            var _this = this;
            if (this.type === 'atomic' || this.type === 'final') {
                return [this];
            }
            // Case when state node is compound but no initial state is defined
            if (this.type === 'compound' && !this.initial) {
                if (!IS_PRODUCTION) {
                    warn(false, "Compound state node '" + this.id + "' has no initial state.");
                }
                return [this];
            }
            var initialStateNodePaths = toStatePaths(this.initialStateValue);
            return flatten(initialStateNodePaths.map(function (initialPath) {
                return _this.getFromRelativePath(initialPath);
            }));
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Retrieves state nodes from a relative path to this state node.
     *
     * @param relativePath The relative path from this state node
     * @param historyValue
     */
    StateNode.prototype.getFromRelativePath = function (relativePath, historyValue) {
        if (!relativePath.length) {
            return [this];
        }
        var _a = __read$3(relativePath),
            stateKey = _a[0],
            childStatePath = _a.slice(1);
        if (!this.states) {
            throw new Error("Cannot retrieve subPath '" + stateKey + "' from node with no states");
        }
        var childStateNode = this.getStateNode(stateKey);
        if (childStateNode.type === 'history') {
            return childStateNode.resolveHistory(historyValue);
        }
        if (!this.states[stateKey]) {
            throw new Error("Child state '" + stateKey + "' does not exist on '" + this.id + "'");
        }
        return this.states[stateKey].getFromRelativePath(childStatePath, historyValue);
    };
    StateNode.prototype.historyValue = function (relativeStateValue) {
        if (!keys(this.states).length) {
            return undefined;
        }
        return {
            current: relativeStateValue || this.initialStateValue,
            states: mapFilterValues(this.states, function (stateNode, key) {
                if (!relativeStateValue) {
                    return stateNode.historyValue();
                }
                var subStateValue = isString(relativeStateValue) ? undefined : relativeStateValue[key];
                return stateNode.historyValue(subStateValue || stateNode.initialStateValue);
            }, function (stateNode) {
                return !stateNode.history;
            })
        };
    };
    /**
     * Resolves to the historical value(s) of the parent state node,
     * represented by state nodes.
     *
     * @param historyValue
     */
    StateNode.prototype.resolveHistory = function (historyValue) {
        var _this = this;
        if (this.type !== 'history') {
            return [this];
        }
        var parent = this.parent;
        if (!historyValue) {
            return this.target ? flatten(toStatePaths(this.target).map(function (relativeChildPath) {
                return parent.getFromRelativePath(relativeChildPath);
            })) : parent.initialStateNodes;
        }
        var subHistoryValue = nestedPath(parent.path, 'states')(historyValue).current;
        if (isString(subHistoryValue)) {
            return [parent.getStateNode(subHistoryValue)];
        }
        return flatten(toStatePaths(subHistoryValue).map(function (subStatePath) {
            return _this.history === 'deep' ? parent.getFromRelativePath(subStatePath) : [parent.states[subStatePath[0]]];
        }));
    };
    Object.defineProperty(StateNode.prototype, "stateIds", {
        /**
         * All the state node IDs of this state node and its descendant state nodes.
         */
        get: function () {
            var _this = this;
            var childStateIds = flatten(keys(this.states).map(function (stateKey) {
                return _this.states[stateKey].stateIds;
            }));
            return [this.id].concat(childStateIds);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StateNode.prototype, "events", {
        /**
         * All the event types accepted by this state node and its descendants.
         */
        get: function () {
            var e_6, _a, e_7, _b;
            if (this.__cache.events) {
                return this.__cache.events;
            }
            var states = this.states;
            var events = new Set(this.ownEvents);
            if (states) {
                try {
                    for (var _c = __values$4(keys(states)), _d = _c.next(); !_d.done; _d = _c.next()) {
                        var stateId = _d.value;
                        var state = states[stateId];
                        if (state.states) {
                            try {
                                for (var _e = __values$4(state.events), _f = _e.next(); !_f.done; _f = _e.next()) {
                                    var event_1 = _f.value;
                                    events.add("" + event_1);
                                }
                            } catch (e_7_1) {
                                e_7 = { error: e_7_1 };
                            } finally {
                                try {
                                    if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                                } finally {
                                    if (e_7) throw e_7.error;
                                }
                            }
                        }
                    }
                } catch (e_6_1) {
                    e_6 = { error: e_6_1 };
                } finally {
                    try {
                        if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                    } finally {
                        if (e_6) throw e_6.error;
                    }
                }
            }
            return this.__cache.events = Array.from(events);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StateNode.prototype, "ownEvents", {
        /**
         * All the events that have transitions directly from this state node.
         *
         * Excludes any inert events.
         */
        get: function () {
            var _this = this;
            var events = new Set(keys(this.on).filter(function (key) {
                var transitions = _this.on[key];
                return transitions.some(function (transition) {
                    return !(!transition.target && !transition.actions.length && transition.internal);
                });
            }));
            return Array.from(events);
        },
        enumerable: true,
        configurable: true
    });
    StateNode.prototype.formatTransition = function (target, transitionConfig, event) {
        var _this = this;
        var internal = transitionConfig ? transitionConfig.internal : undefined;
        var targets = toArray(target);
        var guards = this.machine.options.guards;
        // Format targets to their full string path
        var formattedTargets = targets.map(function (_target) {
            if (!isString(_target)) {
                return "#" + _target.id;
            }
            var isInternalTarget = _target[0] === _this.delimiter;
            internal = internal === undefined ? isInternalTarget : internal;
            // If internal target is defined on machine,
            // do not include machine key on target
            if (isInternalTarget && !_this.parent) {
                return "#" + _this.getStateNodeByPath(_target.slice(1)).id;
            }
            var resolvedTarget = isInternalTarget ? _this.key + _target : "" + _target;
            if (_this.parent) {
                try {
                    var targetStateNode = _this.parent.getStateNodeByPath(resolvedTarget);
                    return "#" + targetStateNode.id;
                } catch (err) {
                    throw new Error("Invalid transition for state node '" + _this.id + "' on event '" + event + "':\n" + err.message);
                }
            } else {
                return "#" + _this.getStateNodeByPath(resolvedTarget).id;
            }
        });
        if (transitionConfig === undefined) {
            return {
                target: target === undefined ? undefined : formattedTargets,
                source: this,
                actions: [],
                internal: target === undefined || internal,
                event: event
            };
        }
        // Check if there is no target (targetless)
        // An undefined transition signals that the state node should not transition from that event.
        var isTargetless = target === undefined || target === TARGETLESS_KEY;
        return __assign$3({}, transitionConfig, { actions: toActionObjects(toArray(transitionConfig.actions)), cond: toGuard(transitionConfig.cond, guards), target: isTargetless ? undefined : formattedTargets, source: this, internal: isTargetless && internal === undefined || internal, event: event });
    };
    StateNode.prototype.formatTransitions = function () {
        var _this = this;
        var _a, e_8, _b;
        var onConfig = this.config.on || EMPTY_OBJECT;
        var doneConfig = this.config.onDone ? (_a = {}, _a["" + done(this.id)] = this.config.onDone, _a) : undefined;
        var invokeConfig = this.invoke.reduce(function (acc, invokeDef) {
            if (invokeDef.onDone) {
                acc[doneInvoke(invokeDef.id)] = invokeDef.onDone;
            }
            if (invokeDef.onError) {
                acc[error(invokeDef.id)] = invokeDef.onError;
            }
            return acc;
        }, {});
        var delayedTransitions = this.after;
        var formattedTransitions = mapValues(__assign$3({}, onConfig, doneConfig, invokeConfig), function (value, event) {
            var e_9, _a;
            if (value === undefined) {
                return [{ target: undefined, event: event, actions: [], internal: true }];
            }
            if (isArray(value)) {
                return value.map(function (targetTransitionConfig) {
                    return _this.formatTransition(targetTransitionConfig.target, targetTransitionConfig, event);
                });
            }
            if (isString(value) || isMachine(value)) {
                return [_this.formatTransition([value], undefined, event)];
            }
            if (!IS_PRODUCTION) {
                try {
                    for (var _b = __values$4(keys(value)), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var key = _c.value;
                        if (['target', 'actions', 'internal', 'in', 'cond', 'event'].indexOf(key) === -1) {
                            throw new Error(
                            // tslint:disable-next-line:max-line-length
                            "State object mapping of transitions is deprecated. Check the config for event '" + event + "' on state '" + _this.id + "'.");
                        }
                    }
                } catch (e_9_1) {
                    e_9 = { error: e_9_1 };
                } finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    } finally {
                        if (e_9) throw e_9.error;
                    }
                }
            }
            return [_this.formatTransition(value.target, value, event)];
        });
        try {
            for (var delayedTransitions_1 = __values$4(delayedTransitions), delayedTransitions_1_1 = delayedTransitions_1.next(); !delayedTransitions_1_1.done; delayedTransitions_1_1 = delayedTransitions_1.next()) {
                var delayedTransition = delayedTransitions_1_1.value;
                formattedTransitions[delayedTransition.event] = formattedTransitions[delayedTransition.event] || [];
                formattedTransitions[delayedTransition.event].push(delayedTransition);
            }
        } catch (e_8_1) {
            e_8 = { error: e_8_1 };
        } finally {
            try {
                if (delayedTransitions_1_1 && !delayedTransitions_1_1.done && (_b = delayedTransitions_1.return)) _b.call(delayedTransitions_1);
            } finally {
                if (e_8) throw e_8.error;
            }
        }
        return formattedTransitions;
    };
    return StateNode;
}();

function Machine(config, options, initialContext) {
    if (initialContext === void 0) {
        initialContext = config.context;
    }
    return new StateNode(config, options, initialContext);
}

var __assign$4 = undefined && undefined.__assign || function () {
    __assign$4 = Object.assign || function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign$4.apply(this, arguments);
};
var defaultOptions = {
    deferEvents: false
};
var Scheduler = /** @class */ /*#__PURE__*/function () {
    function Scheduler(options) {
        this.processingEvent = false;
        this.queue = [];
        this.initialized = false;
        this.options = __assign$4({}, defaultOptions, options);
    }
    Scheduler.prototype.initialize = function (callback) {
        this.initialized = true;
        if (callback) {
            if (!this.options.deferEvents) {
                this.schedule(callback);
                return;
            }
            this.process(callback);
        }
        this.flushEvents();
    };
    Scheduler.prototype.schedule = function (task) {
        if (!this.initialized || this.processingEvent) {
            this.queue.push(task);
            return;
        }
        if (this.queue.length !== 0) {
            throw new Error('Event queue should be empty when it is not processing events');
        }
        this.process(task);
        this.flushEvents();
    };
    Scheduler.prototype.flushEvents = function () {
        var nextCallback = this.queue.shift();
        while (nextCallback) {
            this.process(nextCallback);
            nextCallback = this.queue.shift();
        }
    };
    Scheduler.prototype.process = function (callback) {
        this.processingEvent = true;
        try {
            callback();
        } catch (e) {
            // there is no use to keep the future events
            // as the situation is not anymore the same
            this.queue = [];
            throw e;
        } finally {
            this.processingEvent = false;
        }
    };
    return Scheduler;
}();

function isActor(item) {
    try {
        return typeof item.send === 'function';
    } catch (e) {
        return false;
    }
}

var __assign$5 = undefined && undefined.__assign || function () {
    __assign$5 = Object.assign || function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign$5.apply(this, arguments);
};
var __values$5 = undefined && undefined.__values || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator],
        i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var __read$4 = undefined && undefined.__read || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o),
        r,
        ar = [],
        e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    } catch (error) {
        e = { error: error };
    } finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
            if (e) throw e.error;
        }
    }
    return ar;
};
var __spread$4 = undefined && undefined.__spread || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read$4(arguments[i]));
    return ar;
};
var DEFAULT_SPAWN_OPTIONS = { sync: false, autoForward: false };
/**
 * Maintains a stack of the current service in scope.
 * This is used to provide the correct service to spawn().
 *
 * @private
 */
var withServiceScope = /*#__PURE__*/function () {
    var serviceStack = [];
    return function (service, fn) {
        service && serviceStack.push(service);
        var result = fn(service || serviceStack[serviceStack.length - 1]);
        service && serviceStack.pop();
        return result;
    };
}();
var Interpreter = /** @class */ /*#__PURE__*/function () {
    /**
     * Creates a new Interpreter instance (i.e., service) for the given machine with the provided options, if any.
     *
     * @param machine The machine to be interpreted
     * @param options Interpreter options
     */
    function Interpreter(machine, options) {
        var _this = this;
        if (options === void 0) {
            options = Interpreter.defaultOptions;
        }
        this.machine = machine;
        this.scheduler = new Scheduler();
        this.delayedEventsMap = {};
        this.listeners = new Set();
        this.contextListeners = new Set();
        this.stopListeners = new Set();
        this.doneListeners = new Set();
        this.eventListeners = new Set();
        this.sendListeners = new Set();
        /**
         * Whether the service is started.
         */
        this.initialized = false;
        this.children = new Map();
        this.forwardTo = new Set();
        /**
         * Alias for Interpreter.prototype.start
         */
        this.init = this.start;
        /**
         * Sends an event to the running interpreter to trigger a transition.
         *
         * An array of events (batched) can be sent as well, which will send all
         * batched events to the running interpreter. The listeners will be
         * notified only **once** when all events are processed.
         *
         * @param event The event(s) to send
         */
        this.send = function (event, payload) {
            if (isArray(event)) {
                _this.batch(event);
                return _this.state;
            }
            var eventObject = toEventObject(event, payload);
            if (!_this.initialized && _this.options.deferEvents) {
                // tslint:disable-next-line:no-console
                if (!IS_PRODUCTION) {
                    warn(false, "Event \"" + eventObject.type + "\" was sent to uninitialized service \"" + _this.machine.id + "\" and is deferred. Make sure .start() is called for this service.\nEvent: " + JSON.stringify(event));
                }
            } else if (!_this.initialized) {
                throw new Error("Event \"" + eventObject.type + "\" was sent to uninitialized service \"" + _this.machine.id + "\". Make sure .start() is called for this service, or set { deferEvents: true } in the service options.\nEvent: " + JSON.stringify(eventObject));
            }
            _this.scheduler.schedule(function () {
                var nextState = _this.nextState(eventObject);
                _this.update(nextState, eventObject);
                // Forward copy of event to child interpreters
                _this.forward(eventObject);
            });
            return _this.state; // TODO: deprecate (should return void)
            // tslint:disable-next-line:semicolon
        };
        this.sendTo = function (event, to) {
            var isParent = to === SpecialTargets.Parent;
            var target = isParent ? _this.parent : isActor(to) ? to : _this.children.get(to);
            if (!target) {
                if (!isParent) {
                    throw new Error("Unable to send event to child '" + to + "' from service '" + _this.id + "'.");
                }
                // tslint:disable-next-line:no-console
                if (!IS_PRODUCTION) {
                    warn(false, "Service '" + _this.id + "' has no parent: unable to send event " + event.type);
                }
                return;
            }
            target.send(event);
        };
        var resolvedOptions = __assign$5({}, Interpreter.defaultOptions, options);
        var clock = resolvedOptions.clock,
            logger = resolvedOptions.logger,
            parent = resolvedOptions.parent,
            id = resolvedOptions.id;
        var resolvedId = id !== undefined ? id : machine.id;
        this.id = resolvedId;
        this.logger = logger;
        this.clock = clock;
        this.parent = parent;
        this.options = resolvedOptions;
        this.scheduler = new Scheduler({
            deferEvents: this.options.deferEvents
        });
        this.initialState = this.state = withServiceScope(this, function () {
            return _this.machine.initialState;
        });
    }
    /**
     * Executes the actions of the given state, with that state's `context` and `event`.
     *
     * @param state The state whose actions will be executed
     * @param actionsConfig The action implementations to use
     */
    Interpreter.prototype.execute = function (state, actionsConfig) {
        var e_1, _a;
        try {
            for (var _b = __values$5(state.actions), _c = _b.next(); !_c.done; _c = _b.next()) {
                var action = _c.value;
                this.exec(action, state.context, state.event, actionsConfig);
            }
        } catch (e_1_1) {
            e_1 = { error: e_1_1 };
        } finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            } finally {
                if (e_1) throw e_1.error;
            }
        }
    };
    Interpreter.prototype.update = function (state, event) {
        var e_2, _a, e_3, _b, e_4, _c, e_5, _d;
        // Update state
        this.state = state;
        // Execute actions
        if (this.options.execute) {
            this.execute(this.state);
        }
        // Dev tools
        if (this.devTools) {
            this.devTools.send(event, state);
        }
        // Execute listeners
        if (state.event) {
            try {
                for (var _e = __values$5(this.eventListeners), _f = _e.next(); !_f.done; _f = _e.next()) {
                    var listener = _f.value;
                    listener(state.event);
                }
            } catch (e_2_1) {
                e_2 = { error: e_2_1 };
            } finally {
                try {
                    if (_f && !_f.done && (_a = _e.return)) _a.call(_e);
                } finally {
                    if (e_2) throw e_2.error;
                }
            }
        }
        try {
            for (var _g = __values$5(this.listeners), _h = _g.next(); !_h.done; _h = _g.next()) {
                var listener = _h.value;
                listener(state, state.event);
            }
        } catch (e_3_1) {
            e_3 = { error: e_3_1 };
        } finally {
            try {
                if (_h && !_h.done && (_b = _g.return)) _b.call(_g);
            } finally {
                if (e_3) throw e_3.error;
            }
        }
        try {
            for (var _j = __values$5(this.contextListeners), _k = _j.next(); !_k.done; _k = _j.next()) {
                var contextListener = _k.value;
                contextListener(this.state.context, this.state.history ? this.state.history.context : undefined);
            }
        } catch (e_4_1) {
            e_4 = { error: e_4_1 };
        } finally {
            try {
                if (_k && !_k.done && (_c = _j.return)) _c.call(_j);
            } finally {
                if (e_4) throw e_4.error;
            }
        }
        if (this.state.tree && this.state.tree.done) {
            // get donedata
            var doneData = this.state.tree.getDoneData(this.state.context, toEventObject(event));
            try {
                for (var _l = __values$5(this.doneListeners), _m = _l.next(); !_m.done; _m = _l.next()) {
                    var listener = _m.value;
                    listener(doneInvoke(this.id, doneData));
                }
            } catch (e_5_1) {
                e_5 = { error: e_5_1 };
            } finally {
                try {
                    if (_m && !_m.done && (_d = _l.return)) _d.call(_l);
                } finally {
                    if (e_5) throw e_5.error;
                }
            }
            this.stop();
        }
    };
    /*
     * Adds a listener that is notified whenever a state transition happens. The listener is called with
     * the next state and the event object that caused the state transition.
     *
     * @param listener The state listener
     */
    Interpreter.prototype.onTransition = function (listener) {
        this.listeners.add(listener);
        return this;
    };
    Interpreter.prototype.subscribe = function (nextListener,
    // @ts-ignore
    errorListener, completeListener) {
        var _this = this;
        if (nextListener) {
            this.onTransition(nextListener);
        }
        if (completeListener) {
            this.onDone(completeListener);
        }
        return {
            unsubscribe: function () {
                nextListener && _this.listeners.delete(nextListener);
                completeListener && _this.doneListeners.delete(completeListener);
            }
        };
    };
    /**
     * Adds an event listener that is notified whenever an event is sent to the running interpreter.
     * @param listener The event listener
     */
    Interpreter.prototype.onEvent = function (listener) {
        this.eventListeners.add(listener);
        return this;
    };
    /**
     * Adds an event listener that is notified whenever a `send` event occurs.
     * @param listener The event listener
     */
    Interpreter.prototype.onSend = function (listener) {
        this.sendListeners.add(listener);
        return this;
    };
    /**
     * Adds a context listener that is notified whenever the state context changes.
     * @param listener The context listener
     */
    Interpreter.prototype.onChange = function (listener) {
        this.contextListeners.add(listener);
        return this;
    };
    /**
     * Adds a listener that is notified when the machine is stopped.
     * @param listener The listener
     */
    Interpreter.prototype.onStop = function (listener) {
        this.stopListeners.add(listener);
        return this;
    };
    /**
     * Adds a state listener that is notified when the statechart has reached its final state.
     * @param listener The state listener
     */
    Interpreter.prototype.onDone = function (listener) {
        this.doneListeners.add(listener);
        return this;
    };
    /**
     * Removes a listener.
     * @param listener The listener to remove
     */
    Interpreter.prototype.off = function (listener) {
        this.listeners.delete(listener);
        this.eventListeners.delete(listener);
        this.sendListeners.delete(listener);
        this.stopListeners.delete(listener);
        this.doneListeners.delete(listener);
        this.contextListeners.delete(listener);
        return this;
    };
    /**
     * Starts the interpreter from the given state, or the initial state.
     * @param initialState The state to start the statechart from
     */
    Interpreter.prototype.start = function (initialState) {
        var _this = this;
        if (this.initialized) {
            // Do not restart the service if it is already started
            return this;
        }
        this.initialized = true;
        var resolvedState = withServiceScope(this, function () {
            return initialState === undefined ? _this.machine.initialState : initialState instanceof State ? _this.machine.resolveState(initialState) : _this.machine.resolveState(State.from(initialState));
        });
        if (this.options.devTools) {
            this.attachDev();
        }
        this.scheduler.initialize(function () {
            _this.update(resolvedState, { type: init });
        });
        return this;
    };
    /**
     * Stops the interpreter and unsubscribe all listeners.
     *
     * This will also notify the `onStop` listeners.
     */
    Interpreter.prototype.stop = function () {
        var e_6, _a, e_7, _b, e_8, _c, e_9, _d, e_10, _e;
        try {
            for (var _f = __values$5(this.listeners), _g = _f.next(); !_g.done; _g = _f.next()) {
                var listener = _g.value;
                this.listeners.delete(listener);
            }
        } catch (e_6_1) {
            e_6 = { error: e_6_1 };
        } finally {
            try {
                if (_g && !_g.done && (_a = _f.return)) _a.call(_f);
            } finally {
                if (e_6) throw e_6.error;
            }
        }
        try {
            for (var _h = __values$5(this.stopListeners), _j = _h.next(); !_j.done; _j = _h.next()) {
                var listener = _j.value;
                // call listener, then remove
                listener();
                this.stopListeners.delete(listener);
            }
        } catch (e_7_1) {
            e_7 = { error: e_7_1 };
        } finally {
            try {
                if (_j && !_j.done && (_b = _h.return)) _b.call(_h);
            } finally {
                if (e_7) throw e_7.error;
            }
        }
        try {
            for (var _k = __values$5(this.contextListeners), _l = _k.next(); !_l.done; _l = _k.next()) {
                var listener = _l.value;
                this.contextListeners.delete(listener);
            }
        } catch (e_8_1) {
            e_8 = { error: e_8_1 };
        } finally {
            try {
                if (_l && !_l.done && (_c = _k.return)) _c.call(_k);
            } finally {
                if (e_8) throw e_8.error;
            }
        }
        try {
            for (var _m = __values$5(this.doneListeners), _o = _m.next(); !_o.done; _o = _m.next()) {
                var listener = _o.value;
                this.doneListeners.delete(listener);
            }
        } catch (e_9_1) {
            e_9 = { error: e_9_1 };
        } finally {
            try {
                if (_o && !_o.done && (_d = _m.return)) _d.call(_m);
            } finally {
                if (e_9) throw e_9.error;
            }
        }
        // Stop all children
        this.children.forEach(function (child) {
            if (isFunction(child.stop)) {
                child.stop();
            }
        });
        try {
            // Cancel all delayed events
            for (var _p = __values$5(keys(this.delayedEventsMap)), _q = _p.next(); !_q.done; _q = _p.next()) {
                var key = _q.value;
                this.clock.clearTimeout(this.delayedEventsMap[key]);
            }
        } catch (e_10_1) {
            e_10 = { error: e_10_1 };
        } finally {
            try {
                if (_q && !_q.done && (_e = _p.return)) _e.call(_p);
            } finally {
                if (e_10) throw e_10.error;
            }
        }
        this.initialized = false;
        return this;
    };
    Interpreter.prototype.batch = function (events) {
        var _this = this;
        if (!this.initialized && this.options.deferEvents) {
            // tslint:disable-next-line:no-console
            if (!IS_PRODUCTION) {
                warn(false, events.length + " event(s) were sent to uninitialized service \"" + this.machine.id + "\" and are deferred. Make sure .start() is called for this service.\nEvent: " + JSON.stringify(event));
            }
        } else if (!this.initialized) {
            throw new Error(
            // tslint:disable-next-line:max-line-length
            events.length + " event(s) were sent to uninitialized service \"" + this.machine.id + "\". Make sure .start() is called for this service, or set { deferEvents: true } in the service options.");
        }
        this.scheduler.schedule(function () {
            var e_11, _a, _b;
            var nextState = _this.state;
            try {
                for (var events_1 = __values$5(events), events_1_1 = events_1.next(); !events_1_1.done; events_1_1 = events_1.next()) {
                    var event_1 = events_1_1.value;
                    var changed = nextState.changed;
                    var eventObject = toEventObject(event_1);
                    var actions = nextState.actions.map(function (a) {
                        return bindActionToState(a, nextState);
                    });
                    nextState = _this.machine.transition(nextState, eventObject);
                    (_b = nextState.actions).unshift.apply(_b, __spread$4(actions));
                    nextState.changed = nextState.changed || !!changed;
                    _this.forward(eventObject);
                }
            } catch (e_11_1) {
                e_11 = { error: e_11_1 };
            } finally {
                try {
                    if (events_1_1 && !events_1_1.done && (_a = events_1.return)) _a.call(events_1);
                } finally {
                    if (e_11) throw e_11.error;
                }
            }
            _this.update(nextState, toEventObject(events[events.length - 1]));
        });
    };
    /**
     * Returns a send function bound to this interpreter instance.
     *
     * @param event The event to be sent by the sender.
     */
    Interpreter.prototype.sender = function (event) {
        return this.send.bind(this, event);
    };
    /**
     * Returns the next state given the interpreter's current state and the event.
     *
     * This is a pure method that does _not_ update the interpreter's state.
     *
     * @param event The event to determine the next state
     */
    Interpreter.prototype.nextState = function (event) {
        var _this = this;
        var eventObject = toEventObject(event);
        if (eventObject.type.indexOf(errorPlatform) === 0 && !this.state.nextEvents.some(function (nextEvent) {
            return nextEvent.indexOf(errorPlatform) === 0;
        })) {
            throw eventObject.data;
        }
        var nextState = withServiceScope(this, function () {
            return _this.machine.transition(_this.state, eventObject, _this.state.context);
        });
        return nextState;
    };
    Interpreter.prototype.forward = function (event) {
        var e_12, _a;
        try {
            for (var _b = __values$5(this.forwardTo), _c = _b.next(); !_c.done; _c = _b.next()) {
                var id = _c.value;
                var child = this.children.get(id);
                if (!child) {
                    throw new Error("Unable to forward event '" + event + "' from interpreter '" + this.id + "' to nonexistant child '" + id + "'.");
                }
                child.send(event);
            }
        } catch (e_12_1) {
            e_12 = { error: e_12_1 };
        } finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            } finally {
                if (e_12) throw e_12.error;
            }
        }
    };
    Interpreter.prototype.defer = function (sendAction) {
        var _this = this;
        var delay = sendAction.delay;
        if (isString(delay)) {
            if (!this.machine.options.delays || this.machine.options.delays[delay] === undefined) {
                // tslint:disable-next-line:no-console
                if (!IS_PRODUCTION) {
                    warn(false,
                    // tslint:disable-next-line:max-line-length
                    "No delay reference for delay expression '" + delay + "' was found on machine '" + this.machine.id + "' on service '" + this.id + "'.");
                }
                // Do not send anything
                return;
            } else {
                var delayExpr = this.machine.options.delays[delay];
                delay = typeof delayExpr === 'number' ? delayExpr : delayExpr(this.state.context, this.state.event);
            }
        }
        this.delayedEventsMap[sendAction.id] = this.clock.setTimeout(function () {
            if (sendAction.to) {
                _this.sendTo(sendAction.event, sendAction.to);
            } else {
                _this.send(sendAction.event);
            }
        }, delay || 0);
    };
    Interpreter.prototype.cancel = function (sendId) {
        this.clock.clearTimeout(this.delayedEventsMap[sendId]);
        delete this.delayedEventsMap[sendId];
    };
    Interpreter.prototype.exec = function (action, context, event, actionFunctionMap) {
        var actionOrExec = getActionFunction(action.type, actionFunctionMap) || action.exec;
        var exec = isFunction(actionOrExec) ? actionOrExec : actionOrExec ? actionOrExec.exec : action.exec;
        if (exec) {
            // @ts-ignore (TODO: fix for TypeDoc)
            return exec(context, event, { action: action, state: this.state });
        }
        switch (action.type) {
            case send:
                var sendAction = action;
                if (sendAction.delay) {
                    this.defer(sendAction);
                    return;
                } else {
                    if (sendAction.to) {
                        this.sendTo(sendAction.event, sendAction.to);
                    } else {
                        this.send(sendAction.event);
                    }
                }
                break;
            case cancel:
                this.cancel(action.sendId);
                break;
            case start:
                {
                    var activity = action.activity;
                    // If the activity will be stopped right after it's started
                    // (such as in transient states)
                    // don't bother starting the activity.
                    if (!this.state.activities[activity.type]) {
                        break;
                    }
                    // Invoked services
                    if (activity.type === ActionTypes.Invoke) {
                        var serviceCreator = this.machine.options.services ? this.machine.options.services[activity.src] : undefined;
                        var id = activity.id,
                            data = activity.data;
                        if (!IS_PRODUCTION) {
                            warn(!('forward' in activity),
                            // tslint:disable-next-line:max-line-length
                            "`forward` property is deprecated (found in invocation of '" + activity.src + "' in in machine '" + this.machine.id + "'). " + "Please use `autoForward` instead.");
                        }
                        var autoForward = 'autoForward' in activity ? activity.autoForward : !!activity.forward;
                        if (!serviceCreator) {
                            // tslint:disable-next-line:no-console
                            if (!IS_PRODUCTION) {
                                warn(false, "No service found for invocation '" + activity.src + "' in machine '" + this.machine.id + "'.");
                            }
                            return;
                        }
                        var source = isFunction(serviceCreator) ? serviceCreator(context, event) : serviceCreator;
                        if (isPromiseLike(source)) {
                            this.spawnPromise(Promise.resolve(source), id);
                        } else if (isFunction(source)) {
                            this.spawnCallback(source, id);
                        } else if (isObservable(source)) {
                            this.spawnObservable(source, id);
                        } else if (isMachine(source)) {
                            // TODO: try/catch here
                            this.spawnMachine(data ? source.withContext(mapContext(data, context, event)) : source, {
                                id: id,
                                autoForward: autoForward
                            });
                        }
                    } else {
                        this.spawnActivity(activity);
                    }
                    break;
                }
            case stop:
                {
                    this.stopChild(action.activity.id);
                    break;
                }
            case log:
                var expr = action.expr ? action.expr(context, event) : undefined;
                if (action.label) {
                    this.logger(action.label, expr);
                } else {
                    this.logger(expr);
                }
                break;
            default:
                if (!IS_PRODUCTION) {
                    warn(false, "No implementation found for action type '" + action.type + "'");
                }
                break;
        }
        return undefined;
    };
    Interpreter.prototype.stopChild = function (childId) {
        var child = this.children.get(childId);
        if (!child) {
            return;
        }
        this.children.delete(childId);
        this.forwardTo.delete(childId);
        if (isFunction(child.stop)) {
            child.stop();
        }
    };
    Interpreter.prototype.spawn = function (entity, name, options) {
        if (isPromiseLike(entity)) {
            return this.spawnPromise(Promise.resolve(entity), name);
        } else if (isFunction(entity)) {
            return this.spawnCallback(entity, name);
        } else if (isObservable(entity)) {
            return this.spawnObservable(entity, name);
        } else if (isMachine(entity)) {
            return this.spawnMachine(entity, __assign$5({}, options, { id: name }));
        } else {
            throw new Error("Unable to spawn entity \"" + name + "\" of type \"" + typeof entity + "\".");
        }
    };
    Interpreter.prototype.spawnMachine = function (machine, options) {
        var _this = this;
        if (options === void 0) {
            options = {};
        }
        var childService = new Interpreter(machine, __assign$5({}, this.options, { parent: this, id: options.id || machine.id }));
        var resolvedOptions = __assign$5({}, DEFAULT_SPAWN_OPTIONS, options);
        if (resolvedOptions.sync) {
            childService.onTransition(function (state) {
                _this.send(update, { state: state, id: childService.id });
            });
        }
        childService.onDone(function (doneEvent) {
            _this.send(doneEvent);
        }).start();
        var actor = childService;
        // const actor = {
        //   id: childService.id,
        //   send: childService.send,
        //   state: childService.state,
        //   subscribe: childService.subscribe,
        //   toJSON() {
        //     return { id: childService.id };
        //   }
        // } as Actor<State<TChildContext, TChildEvents>>;
        this.children.set(childService.id, actor);
        if (resolvedOptions.autoForward) {
            this.forwardTo.add(childService.id);
        }
        return actor;
    };
    Interpreter.prototype.spawnPromise = function (promise, id) {
        var _this = this;
        var canceled = false;
        promise.then(function (response) {
            if (!canceled) {
                _this.send(doneInvoke(id, response));
            }
        }, function (errorData) {
            if (!canceled) {
                var errorEvent = error(id, errorData);
                try {
                    // Send "error.execution" to this (parent).
                    _this.send(errorEvent);
                } catch (error) {
                    _this.reportUnhandledExceptionOnInvocation(errorData, error, id);
                    if (_this.devTools) {
                        _this.devTools.send(errorEvent, _this.state);
                    }
                    if (_this.machine.strict) {
                        // it would be better to always stop the state machine if unhandled
                        // exception/promise rejection happens but because we don't want to
                        // break existing code so enforce it on strict mode only especially so
                        // because documentation says that onError is optional
                        _this.stop();
                    }
                }
            }
        });
        var actor = {
            id: id,
            send: function () {
                return void 0;
            },
            subscribe: function (next, handleError, complete) {
                var unsubscribed = false;
                promise.then(function (response) {
                    if (unsubscribed) {
                        return;
                    }
                    next && next(response);
                    if (unsubscribed) {
                        return;
                    }
                    complete && complete();
                }, function (err) {
                    if (unsubscribed) {
                        return;
                    }
                    handleError(err);
                });
                return {
                    unsubscribe: function () {
                        return unsubscribed = true;
                    }
                };
            },
            stop: function () {
                canceled = true;
            },
            toJSON: function () {
                return { id: id };
            }
        };
        this.children.set(id, actor);
        return actor;
    };
    Interpreter.prototype.spawnCallback = function (callback, id) {
        var _this = this;
        var canceled = false;
        var receive = function (e) {
            if (canceled) {
                return;
            }
            _this.send(e);
        };
        var listeners = new Set();
        var callbackStop;
        try {
            callbackStop = callback(receive, function (newListener) {
                listeners.add(newListener);
            });
        } catch (err) {
            this.send(error(id, err));
        }
        if (isPromiseLike(callbackStop)) {
            // it turned out to be an async function, can't reliably check this before calling `callback`
            // because transpiled async functions are not recognizable
            return this.spawnPromise(callbackStop, id);
        }
        var actor = {
            id: id,
            send: function (event) {
                return listeners.forEach(function (listener) {
                    return listener(event);
                });
            },
            subscribe: function (next) {
                listeners.add(next);
                return {
                    unsubscribe: function () {
                        listeners.delete(next);
                    }
                };
            },
            stop: function () {
                canceled = true;
                if (isFunction(callbackStop)) {
                    callbackStop();
                }
            },
            toJSON: function () {
                return { id: id };
            }
        };
        this.children.set(id, actor);
        return actor;
    };
    Interpreter.prototype.spawnObservable = function (source, id) {
        var _this = this;
        var subscription = source.subscribe(function (value) {
            _this.send(value);
        }, function (err) {
            _this.send(error(id, err));
        }, function () {
            _this.send(doneInvoke(id));
        });
        var actor = {
            id: id,
            send: function () {
                return void 0;
            },
            subscribe: function (next, handleError, complete) {
                return source.subscribe(next, handleError, complete);
            },
            stop: function () {
                return subscription.unsubscribe();
            },
            toJSON: function () {
                return { id: id };
            }
        };
        this.children.set(id, actor);
        return actor;
    };
    Interpreter.prototype.spawnActivity = function (activity) {
        var implementation = this.machine.options && this.machine.options.activities ? this.machine.options.activities[activity.type] : undefined;
        if (!implementation) {
            // tslint:disable-next-line:no-console
            if (!IS_PRODUCTION) {
                warn(false, "No implementation found for activity '" + activity.type + "'");
            }
            return;
        }
        // Start implementation
        var dispose = implementation(this.state.context, activity);
        this.spawnEffect(activity.id, dispose);
    };
    Interpreter.prototype.spawnEffect = function (id, dispose) {
        this.children.set(id, {
            id: id,
            send: function () {
                return void 0;
            },
            subscribe: function () {
                return { unsubscribe: function () {
                        return void 0;
                    } };
            },
            stop: dispose || undefined,
            toJSON: function () {
                return { id: id };
            }
        });
    };
    Interpreter.prototype.reportUnhandledExceptionOnInvocation = function (originalError, currentError, id) {
        if (!IS_PRODUCTION) {
            var originalStackTrace = originalError.stack ? " Stacktrace was '" + originalError.stack + "'" : '';
            if (originalError === currentError) {
                // tslint:disable-next-line:no-console
                console.error("Missing onError handler for invocation '" + id + "', error was '" + originalError + "'." + originalStackTrace);
            } else {
                var stackTrace = currentError.stack ? " Stacktrace was '" + currentError.stack + "'" : '';
                // tslint:disable-next-line:no-console
                console.error("Missing onError handler and/or unhandled exception/promise rejection for invocation '" + id + "'. " + ("Original error: '" + originalError + "'. " + originalStackTrace + " Current error is '" + currentError + "'." + stackTrace));
            }
        }
    };
    Interpreter.prototype.attachDev = function () {
        if (this.options.devTools && typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__) {
            var devToolsOptions = typeof this.options.devTools === 'object' ? this.options.devTools : undefined;
            this.devTools = window.__REDUX_DEVTOOLS_EXTENSION__.connect(__assign$5({ name: this.id, autoPause: true, stateSanitizer: function (state) {
                    return {
                        value: state.value,
                        context: state.context,
                        actions: state.actions
                    };
                } }, devToolsOptions, { features: __assign$5({ jump: false, skip: false }, devToolsOptions ? devToolsOptions.features : undefined) }));
            this.devTools.init(this.state);
        }
    };
    Interpreter.prototype.toJSON = function () {
        return {
            id: this.id
        };
    };
    /**
     * The default interpreter options:
     *
     * - `clock` uses the global `setTimeout` and `clearTimeout` functions
     * - `logger` uses the global `console.log()` method
     */
    Interpreter.defaultOptions = /*#__PURE__*/function (global) {
        return {
            execute: true,
            deferEvents: true,
            clock: {
                setTimeout: function (fn, ms) {
                    return global.setTimeout.call(null, fn, ms);
                },
                clearTimeout: function (id) {
                    return global.clearTimeout.call(null, id);
                }
            },
            logger: global.console.log.bind(console),
            devTools: false
        };
    }(typeof window === 'undefined' ? global : window);
    Interpreter.interpret = interpret;
    return Interpreter;
}();
var createNullActor = function (name) {
    if (name === void 0) {
        name = 'null';
    }
    return {
        id: name,
        send: function () {
            return void 0;
        },
        subscribe: function () {
            // tslint:disable-next-line:no-empty
            return { unsubscribe: function () {} };
        },
        toJSON: function () {
            return { id: name };
        }
    };
};
var resolveSpawnOptions = function (nameOrOptions) {
    if (isString(nameOrOptions)) {
        return __assign$5({}, DEFAULT_SPAWN_OPTIONS, { name: nameOrOptions });
    }
    return __assign$5({}, DEFAULT_SPAWN_OPTIONS, { name: uniqueId() }, nameOrOptions);
};
function spawn(entity, nameOrOptions) {
    var resolvedOptions = resolveSpawnOptions(nameOrOptions);
    return withServiceScope(undefined, function (service) {
        if (!IS_PRODUCTION) {
            warn(!!service, "Attempted to spawn an Actor (ID: \"" + (isMachine(entity) ? entity.id : 'undefined') + "\") outside of a service. This will have no effect.");
        }
        if (service) {
            return service.spawn(entity, resolvedOptions.name, resolvedOptions);
        } else {
            return createNullActor(resolvedOptions.name);
        }
    });
}
/**
 * Creates a new Interpreter instance for the given machine with the provided options, if any.
 *
 * @param machine The machine to interpret
 * @param options Interpreter options
 */
function interpret(machine, options) {
    var interpreter = new Interpreter(machine, options);
    return interpreter;
}

var __values$6 = undefined && undefined.__values || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator],
        i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var __read$5 = undefined && undefined.__read || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o),
        r,
        ar = [],
        e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    } catch (error) {
        e = { error: error };
    } finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
            if (e) throw e.error;
        }
    }
    return ar;
};
function matchState(state, patterns, defaultValue) {
    var e_1, _a;
    var resolvedState = State.from(state, state instanceof State ? state.context : undefined);
    try {
        for (var patterns_1 = __values$6(patterns), patterns_1_1 = patterns_1.next(); !patterns_1_1.done; patterns_1_1 = patterns_1.next()) {
            var _b = __read$5(patterns_1_1.value, 2),
                stateValue = _b[0],
                getValue = _b[1];
            if (resolvedState.matches(stateValue)) {
                return getValue(resolvedState);
            }
        }
    } catch (e_1_1) {
        e_1 = { error: e_1_1 };
    } finally {
        try {
            if (patterns_1_1 && !patterns_1_1.done && (_a = patterns_1.return)) _a.call(patterns_1);
        } finally {
            if (e_1) throw e_1.error;
        }
    }
    return defaultValue(resolvedState);
}

var actions = {
    raise: raise$1,
    send: send$1,
    sendParent: sendParent,
    log: log$1,
    cancel: cancel$1,
    start: start$1,
    stop: stop$1,
    assign: assign$1,
    after: after$1,
    done: done
};

var x = /*#__PURE__*/Object.freeze({
    Machine: Machine,
    StateNode: StateNode,
    State: State,
    matchesState: matchesState,
    mapState: mapState,
    actions: actions,
    assign: assign$1,
    send: send$1,
    sendParent: sendParent,
    interpret: interpret,
    Interpreter: Interpreter,
    matchState: matchState,
    spawn: spawn,
    get ActionTypes () { return ActionTypes; },
    get SpecialTargets () { return SpecialTargets; }
});

Object.defineProperty(exports, "__esModule", { value: true });
var graph_1 = require("./graph");
exports.getNodes = graph_1.getNodes;
exports.getEdges = graph_1.getEdges;
exports.getSimplePaths = graph_1.getSimplePaths;
exports.getShortestPaths = graph_1.getShortestPaths;
exports.serializeEvent = graph_1.serializeEvent;
exports.serializeState = graph_1.serializeState;
exports.adjacencyMap = graph_1.adjacencyMap;

var g = /*#__PURE__*/Object.freeze({

});



var t = /*#__PURE__*/Object.freeze({

});

const XState = x;
const graph = g;
const test = t;

export { XState, graph, test };
