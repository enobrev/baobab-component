"use strict";

import React            from 'react';
import shallowCompare   from 'react-addons-shallow-compare';
import Baobab           from 'baobab';

/**
 * Components should extend this component.  The extending components should override the stateQueries method.
 * This method returns an object holding Baobab cursor queries, which affect the component render.  Consider it the
 * State of the Component
 *
 *
 * Once the stateQueries method is in place, all your other methods should load their data from this.state.  In order to update the
 * current component's state, you should _always_ update the Baobab Database.  If you have local state to manage, it's a good
 * idea to track that in your Baobab database as well.
 *
 * All your cursors are stored in this.CURSORS, which are Baobab Cursors.  So if you want to update something...

    this.CURSORS.whatever.set('someValue');

 * or

    this.CURSORS.something.merge({something: 'else'});

 * Updating the cursor will re-render the current component because the current component's state will have changed.  As will
 * any other BaobabComponent that has been watching the same data.
 *
 * The baobab update methods are documented here: https://github.com/Yomguithereal/baobab#updates
 */

export default class BaobabComponent extends React.Component {
    static LOCAL_STATE = 'LOCAL_STATE';
    static TREE        = new Baobab();

    /**
     *
     * @param {String} sAction
     * @param {Object} [oContext]
     */
    static LOGGER      = (sAction, oContext) => {};

    /**
     *
     * @param {Object} props
     * @param {Object} context
     * @param {Baobab} oBaobabTree
     */
    constructor(props, context, oBaobabTree) {
        super(props, context);

        if (!BaobabComponent.TREE) {
            BaobabComponent.LOGGER('Please be sure to initialize using BaobabComponent.setTree with your BaobabTree', {level: 'error'});
            throw new Error('Could not initialize BaobabComponent without a baobab tree');
        }

        this.sLocalPrefix = UUID(); // Local Vars are prefixed by a UUID which is reset at components are initialized
        BaobabComponent.TREE.set([this.sLocalPrefix], {});

        this._watch();
    }

    /**
     *
     * @param {Function} fLoggerMethod (sAction, oContext) => {}
     */
    static setLoggerMethod(fLoggerMethod) {
        BaobabComponent.LOGGER = fLoggerMethod;
    }

    static setTree(oTree) {
        BaobabComponent.TREE = oTree;
    }

    /**
     * This method should be overridden in your component.  It defines how the data will be retrieved and modified to
     * generate the state of your component.
     *
     * Each property of the returned object is the name of the state variable that will be maintained.
     * The value can be a simple baobab path or an object with more advanced settings.
     *
     * The available settings are:
     *
     * cursor:        A baobab path.  If it's set, then this.CURSORS[property] will have a cursor that you can modify in your component methods
     * invokeRender: designates whether changes to this state property should invoke rendering of the current component
     * setState:     this method will be run just before this.setState(oState) is called, allowing you to modify the values from the cursor before they are added to the local state
     * onUpdate:     this method will be called _after_ the state has been updated, for each key that has been updated
     *
     *
     * Example:
     *

     stateQueries() {
        return {

            column:  [ 'local', 'columns', this.props.id ],
            name:    [ 'local', 'columns', this.props.id, 'name' ],
            tables:   {
                cursor:       ['local', 'tables'],
                invokeRender: false,
                setState:     oState => oState.table = oState.tables[oState.column.table_id]
            },
            columns: {
                cursor:        [ 'local', 'columns' ],
                invokeRender:  false,
                setState:      oState => oState.table_columns = Object.values(oState.columns).filter(oColumn => oColumn.table_id == oState.column.table_id)
            },
            table_columns: {
                invokeRender: false,
                setState:     oState => oState.column_index  = oState.table_columns.findIndex(oColumn => oColumn.id == oState.column.id)
            }
        }
    }
     *
     * @return {{string: [string,*]}} | {{string: {cursor: [string,*], invokeRender: boolean, setState: (function({}): {})}, onUpdate: (function({}): {})}}
     */
    stateQueries() {
        console.error('You should override BaobabComponent.stateQueries');
        console.trace();
        BaobabComponent.LOGGER('You should override BaobabComponent.stateQueries', {level: 'error'});
        return {};
    }

    addCursor(sKey, oQuery) {
        this._oQueries[sKey] = oQuery;
        this._refresh();
        this._onWatcherData();
    }

    removeCursor(sKey) {
        delete this._oQueries[sKey];
        this._refresh();
        this._onWatcherData();
    }

    overrideCursor(sKey, oOverride) {
        if (Array.isArray(oOverride)) {
            oOverride = {cursor: oOverride};
        }

        this._oQueries[sKey] = Object.assign({}, this._oQueries[sKey], oOverride);
        this._refresh();
        this._onWatcherData();
    }

    _watch() {
        this.state   = {};
        this.CURSORS = {};
        this.oData   = {};

        this.bWatch   = true;
        this._oQueries = this.stateQueries();
        this._refresh();

        this._onWatcherData(); // Initialize
        BaobabComponent.TREE.on('update', this._treeUpdate); // Watch
    }

    /**
     * This method will get "update" events from ALL Baobab updates.
     * We check if any of the updates are interesting to us, and if so, we process the new data.
     * @param {Event} oEvent
     * @private
     */
    _treeUpdate = oEvent => {
        let aChangedPath = solveUpdate(oEvent.data.paths, this._aPaths);
        if (aChangedPath !== false) {
            this._onWatcherData(oEvent, aChangedPath);
        }
    };

    /**
     * This is where all the magic happens.  First we grab the _current_ state, which is _after_ the Baobab tree has been updated
     * and merge it with our local version of the data - but only in a state variable.  We're not overwriting our data yet.
     *
     * Then we loop through and run _processState on every one, which takes care of all adjustments and prepares and onUpdate calls, and so on
     *
     * When we'll check if anything NEW was created in our adjustments and loop through those as well.
     *
     * Finally, if anything non-passive has updated, let's update our local data and local state, which will fire a component Render
     *
     * @param {Event} oEvent
     * @param {Array} aChangedPath
     * @private
     */
    _onWatcherData = (oEvent, aChangedPath) => {
        if (!this.bWatch) {
            return;
        }

        let oState = Object.assign({}, this.oData, this._getData());
        let aKeys  = new Set(Object.keys(oState));

        this.aAfter   = [];
        this.bChanged = false;
        this.aChanged = []; // For Tracking and Debugging

        for (let sKey in oState) {
            this._processState(oState, sKey);
        }

        // Process anything new created by processing state
        let aCheckForNewKeys = new Set(Object.keys(oState));
        if (aCheckForNewKeys.size > aKeys.size) {
            let aNewKeys = new Set([ ...aCheckForNewKeys ].filter(x => !aKeys.has(x)));
            if (aNewKeys.size > 0) {
                for (let sKey of aNewKeys) {
                    this._processState(oState, sKey);
                }
            }
        }

        /*
        if (aChangedPath) {
            console.log('BaobabComponent.Listener', this.constructor.name, aChangedPath, oEvent.type, oEvent.data.paths.map(aPath => aPath.join('.')));
        }
        */

        //console.log('AFTER', this.constructor.name, this.aAfter);

        // Putting our updated state into this.oData
        this.oData = oState;

        // Saving STATE_LOCAL vars into their cursors as they may have been changed by our stateQueries
        this._oLocal.forEach(sKey =>this.CURSORS[sKey].set(oState[sKey]));

        let fDone = () => this.aAfter.map(sKey => this._oQueries[sKey].onUpdate(oState));

        if (this.bChanged) {
            // console.log('CHANGED', this.constructor.name, this.aChanged, oState);
            if (oEvent) { // Handler
                this.setState(oState, fDone);
            } else {      // Virgin
                this.state = oState;
                fDone();
            }
        } else {
            //console.log('UNCHANGED', this.constructor.name);
            fDone();
        }
    };

    /**
     *
     * @param {Object} oState The Currently Modified State Object, which is being actively modified
     * @param {String} sKey   The Key we're currently modifying
     * @private
     */
    _processState = (oState, sKey) => {
        let bKeyDataChanged = oState[sKey] != this.oData[sKey];

        if (bKeyDataChanged && this._bBefore && this._oBefore.has(sKey)) {
            this._oQueries[ sKey ].setState(oState);
        }

        if (bKeyDataChanged && this._bAfter && this._oAfter.has(sKey)) { // We're not running onUpdate methods until after we've updated our state
            this.aAfter.push(sKey);
        }

        if (this._bPassive && this._oPassive.has(sKey)) {
            // Do Not Notify updates for This Key
        } else if (bKeyDataChanged) {
            this.bChanged = true;
            this.aChanged.push(sKey); // For Tracking and Debugging
        }
    };

    componentDidMount() {
        this.bWatch = true;
    }

    componentWillUnmount() {
        this.bWatch = false;

        BaobabComponent.TREE.unset([this.sLocalPrefix]);
    }

    shouldComponentUpdate(oNextProps, oNextState) {
        return shallowCompare(this, oNextProps, oNextState);
    }

    onBoundInputChange = oEvent => {
        this.CURSORS[oEvent.target.name].set(oEvent.target.value);
    };

    /**
     * Parse our Queries object and prepare our cursors and methods for action
     * @private
     */
    _refresh() {
        this._oBefore  = new Set();
        this._oAfter   = new Set();
        this._oPassive = new Set();
        this._oLocal   = new Set();
        this._oPaths   = {};
        this.CURSORS   = {};

        Object.keys(this._oQueries).map(sKey => {
            let mQuery    = this._oQueries[sKey];
            let bIsPath   = Array.isArray(mQuery);
            let sPath;

            if (bIsPath) {
                sPath     = mQuery;

                if (!this._checkPath(sPath)) {
                    console.warn('BaobabComponent: Incomplete Path for Cursor', sPath);
                    return;
                }
            } else {
                if (mQuery.cursor !== undefined) {
                    if (mQuery.cursor === BaobabComponent.LOCAL_STATE) {
                        sPath = [this.sLocalPrefix, sKey];
                        this._oLocal.add(sKey);
                    } else {
                        sPath = mQuery.cursor
                    }
                }

                if (!sPath) {
                    sPath = [this.sLocalPrefix, sKey]; // Default to treating as LOCAL_STATE
                    this._oLocal.add(sKey);
                }

                if (!this._checkPath(sPath)) {
                    console.warn('BaobabComponent: Incomplete Path for Cursor', sPath);
                    return;
                }

                if (mQuery.default !== undefined) {
                    if (!BaobabComponent.TREE.exists(sPath) || !BaobabComponent.TREE.get(sPath)) {
                        BaobabComponent.TREE.set(sPath, mQuery.default);
                    }
                }

                if (typeof mQuery.setState === 'function') {
                    this._oBefore.add(sKey);
                }

                if (typeof mQuery.onUpdate === 'function') {
                    this._oAfter.add(sKey);
                }

                if (mQuery.invokeRender !== undefined && mQuery.invokeRender === false) {
                    this._oPassive.add(sKey);
                }
            }

            if (sPath) {
                this._oPaths[ sKey ] = sPath;
                try {
                    this.CURSORS[sKey] = BaobabComponent.TREE.select(sPath);
                } catch (e) {
                    console.warn('BaobabComponent: Key Unavailable for Cursor', sKey, sPath /* , e */);
                }
            }
        });

        this._bBefore  = this._oBefore.size  > 0;
        this._bAfter   = this._oAfter.size   > 0;
        this._bPassive = this._oPassive.size > 0;
        this._aPaths   = Object.values(this._oPaths);
        this._getData  = () => {
            let oData = {};

            Object.keys(this._oPaths).forEach(sStateParameter => {
                let aPath = this._oPaths[sStateParameter];

                // console.log('_refresh.getData', aPath);

                if (!this._checkPath(aPath)) {
                    // console.warn('BaobabComponent: Incomplete Path for Data', sStateParameter, aPath);
                    return;
                }

                try {
                    oData[sStateParameter] = BaobabComponent.TREE.get(aPath);
                } catch (e) {
                    // console.warn('BaobabComponent: Key Unavailable for Data', sStateParameter, aPath /* , e */);
                }
            });

            return oData;
        };
    }

    _checkPath(aPath) {
        return aPath.indexOf(undefined) === -1 && aPath.indexOf(null) === -1;
    }
}


/**
 * Ripped from baobab::helpers - used to figure out if a watched path has been changed
 *
 * ---
 *
 * Function determining whether some paths in the tree were affected by some
 * updates that occurred at the given paths. This helper is mainly used at
 * cursor level to determine whether the cursor is concerned by the updates
 * fired at tree level.
 *
 * NOTES: 1) If performance become an issue, the following threefold loop
 *           can be simplified to a complex twofold one.
 *        2) A regex version could also work but I am not confident it would
 *           be faster.
 *        3) Another solution would be to keep a register of cursors like with
 *           the monkeys and update along this tree.
 *
 * @param  {array} affectedPaths - The paths that were updated.
 * @param  {array} comparedPaths - The paths that we are actually interested in.
 * @return {boolean}             - Is the update relevant to the compared
 *                                 paths?
 */

function solveUpdate(affectedPaths, comparedPaths) {
    let l = affectedPaths.length;

    // Looping through possible paths
    for (let i = 0; i < l; i++) {
        let p = affectedPaths[i];

        if (!p.length)
            return p;

        let m = comparedPaths.length;

        // Looping through logged paths
        for (let j = 0; j < m; j++) {
            let c = comparedPaths[j];

            if (!c || !c.length)
                return p;

            let n = c.length;

            // Looping through steps
            for (let k = 0; k < n; k++) {
                let s = c[k];

                // If path is not relevant, we break
                // NOTE: the '!=' instead of '!==' is required here!
                if (s != p[k])
                    break;

                // If we reached last item and we are relevant
                if (k + 1 === n || k + 1 === p.length)
                    return p;
            }
        }
    }

    return false;
}

// http://stackoverflow.com/a/8809472/14651
const UUID = function() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x7|0x8)).toString(16);
    });

    return uuid.toLowerCase().replace(/\-/g, '');
};