"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import React from 'react';
import shallowCompare from 'react-addons-shallow-compare';
import Baobab from 'baobab';
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
 * any other baobabComponent that has been watching the same data.
 *
 * The baobab update methods are documented here: https://github.com/Yomguithereal/baobab#updates
 */

var baobabComponent =
/*#__PURE__*/
function (_React$Component) {
  _inherits(baobabComponent, _React$Component);

  /**
   *
   * @param {String} sAction
   * @param {Object} [oContext]
   */

  /**
   *
   * @param {Object} props
   * @param {Object} context
   */
  function baobabComponent(props, context) {
    var _this;

    _classCallCheck(this, baobabComponent);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(baobabComponent).call(this, props, context));

    _defineProperty(_assertThisInitialized(_this), "_watch", function (oProps) {
      _this.state = {};
      _this.CURSORS = {};
      _this.oData = {};
      _this.bWatch = true;
      var oQueries = {};

      if (baobabComponent.FOLLOW_PROPS) {
        oQueries.PROPS = {
          cursor: baobabComponent.LOCAL_STATE,
          default: oProps || {}
        };
      }

      _this._oQueries = Object.assign(oQueries, _this.stateQueries());

      _this._refresh();

      _this._onWatcherData(); // Initialize


      baobabComponent.TREE.on('update', _this._treeUpdate); // Watch
    });

    _defineProperty(_assertThisInitialized(_this), "_treeUpdate", function (oEvent) {
      var aChangedPath = solveUpdate(oEvent.data.paths, _this._aPaths);

      if (aChangedPath !== false) {
        _this._onWatcherData(oEvent, aChangedPath);
      }
    });

    _defineProperty(_assertThisInitialized(_this), "_onWatcherData", function (oEvent, aChangedPath) {
      if (!_this.bWatch) {
        return;
      }

      var oState = Object.assign({}, _this.oData, _this._getData());
      var aKeys = new Set(Object.keys(oState));
      _this.aAfter = [];
      _this.bChanged = false;
      _this.aChanged = []; // For Tracking and Debugging

      aKeys.forEach(function (sKey) {
        return _this._processState(oState, sKey);
      }); // Process anything new created by processing state

      var aCheckForNewKeys = new Set(Object.keys(oState));

      if (aCheckForNewKeys.size > aKeys.size) {
        var aNewKeys = new Set(_toConsumableArray(aCheckForNewKeys).filter(function (x) {
          return !aKeys.has(x);
        }));

        if (aNewKeys.size > 0) {
          aNewKeys.forEach(function (sKey) {
            return _this._processState(oState, sKey);
          });
        }
      }

      if (baobabComponent.DEBUG_LEVEL >= 2) {
        if (aChangedPath) {
          console.log('baobabComponent.Listener', _this.constructor.name, aChangedPath, oEvent.type, oEvent.data.paths.map(function (aPath) {
            return aPath.join('.');
          }));
        }
      }

      if (baobabComponent.DEBUG_LEVEL >= 1) {
        console.log('AFTER', _this.constructor.name, _this.aAfter);
      } // Putting our updated state into this.oData


      _this.oData = oState; // Saving STATE_LOCAL vars into their cursors as they may have been changed by our stateQueries

      _this._oLocal.forEach(function (sKey) {
        return _this.CURSORS[sKey].set(oState[sKey]);
      });

      var fDone = function fDone() {
        return _this.aAfter.map(function (sKey) {
          return _this._oQueries[sKey].onUpdate(oState);
        });
      };

      if (_this.bChanged) {
        if (baobabComponent.DEBUG_LEVEL >= 1) {
          console.log('CHANGED', _this.constructor.name, _this.aChanged, oState);
        }

        if (oEvent) {
          // Handler
          _this.setState(oState, fDone);
        } else {
          // Virgin
          _this.state = oState;
          fDone();
        }
      } else {
        if (baobabComponent.DEBUG_LEVEL >= 3) {
          console.log('UNCHANGED', _this.constructor.name);
        }

        fDone();
      }
    });

    _defineProperty(_assertThisInitialized(_this), "_processState", function (oState, sKey) {
      var bKeyDataChanged = oState[sKey] != _this.oData[sKey];

      if (bKeyDataChanged && _this._bBefore && _this._oBefore.has(sKey)) {
        _this._oQueries[sKey].setState(oState);
      }

      if (bKeyDataChanged && _this._bAfter && _this._oAfter.has(sKey)) {
        // We're not running onUpdate methods until after we've updated our state
        _this.aAfter.push(sKey);
      }

      if (_this._bPassive && _this._oPassive.has(sKey)) {// Do Not Notify updates for This Key
      } else if (bKeyDataChanged) {
        _this.bChanged = true;

        _this.aChanged.push(sKey); // For Tracking and Debugging

      }
    });

    _defineProperty(_assertThisInitialized(_this), "onBoundInputChange", function (oEvent) {
      _this.CURSORS[oEvent.target.name].set(oEvent.target.value);
    });

    if (!baobabComponent.TREE) {
      baobabComponent.LOGGER('Please be sure to initialize using baobabComponent.setTree with your BaobabTree', {
        level: 'error'
      });
      throw new Error('Could not initialize baobabComponent without a baobab tree');
    }

    _this.sLocalPrefix = UUID(); // Local Vars are prefixed by a UUID which is reset at components are initialized

    baobabComponent.TREE.set([_this.sLocalPrefix], {});

    _this._watch(props);

    return _this;
  }
  /**
   *
   * @param {Function} fLoggerMethod (sAction, oContext) => {}
   */


  _createClass(baobabComponent, [{
    key: "stateQueries",

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
    value: function stateQueries() {
      console.error('You should override baobabComponent.stateQueries');
      console.trace();
      baobabComponent.LOGGER('You should override baobabComponent.stateQueries', {
        level: 'error'
      });
      return {};
    }
  }, {
    key: "addCursor",
    value: function addCursor(sKey, oQuery) {
      this._oQueries[sKey] = oQuery;

      this._refresh();

      this._onWatcherData();
    }
  }, {
    key: "removeCursor",
    value: function removeCursor(sKey) {
      delete this._oQueries[sKey];

      this._refresh();

      this._onWatcherData();
    }
  }, {
    key: "overrideCursor",
    value: function overrideCursor(sKey, oOverride) {
      if (Array.isArray(oOverride)) {
        oOverride = {
          cursor: oOverride
        };
      }

      this._oQueries[sKey] = Object.assign({}, this._oQueries[sKey], oOverride);

      this._refresh();

      this._onWatcherData();
    }
  }, {
    key: "UNSAFE_componentWillReceiveProps",
    value: function UNSAFE_componentWillReceiveProps(oProps) {
      if (baobabComponent.FOLLOW_PROPS) {
        this.CURSORS.PROPS.set(oProps);
      }
    }
  }, {
    key: "componentDidMount",
    value: function componentDidMount() {
      this.bWatch = true;
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.bWatch = false;
      baobabComponent.TREE.unset([this.sLocalPrefix]);
    }
  }, {
    key: "shouldComponentUpdate",
    value: function shouldComponentUpdate(oNextProps, oNextState) {
      return shallowCompare(this, oNextProps, oNextState);
    }
  }, {
    key: "_refresh",

    /**
     * Parse our Queries object and prepare our cursors and methods for action
     * @private
     */
    value: function _refresh() {
      var _this2 = this;

      this._oBefore = new Set();
      this._oAfter = new Set();
      this._oPassive = new Set();
      this._oLocal = new Set();
      this._oPaths = {};
      this._oDynamic = {};
      this.CURSORS = {};
      Object.keys(this._oQueries).map(function (sKey) {
        var mQuery = _this2._oQueries[sKey];
        var bIsPath = Array.isArray(mQuery);
        var aPath;

        if (bIsPath) {
          aPath = mQuery;

          if (!_this2._checkPath(aPath)) {
            console.warn('baobabComponent: Incomplete Path for Cursor', aPath);
            return;
          }
        } else {
          if (mQuery.cursor !== undefined) {
            if (mQuery.cursor === baobabComponent.LOCAL_STATE) {
              aPath = [_this2.sLocalPrefix, sKey];

              _this2._oLocal.add(sKey);
            } else {
              aPath = mQuery.cursor;
            }
          }

          if (!aPath) {
            aPath = [_this2.sLocalPrefix, sKey]; // Default to treating as LOCAL_STATE

            _this2._oLocal.add(sKey);
          }

          if (!_this2._checkPath(aPath)) {
            console.warn('baobabComponent: Incomplete Path for Cursor', aPath);
            return;
          }

          if (mQuery.default !== undefined) {
            if (!baobabComponent.TREE.exists(aPath) || !baobabComponent.TREE.get(aPath)) {
              baobabComponent.TREE.set(aPath, mQuery.default);
            }
          }

          if (typeof mQuery.setState === 'function') {
            _this2._oBefore.add(sKey);
          }

          if (typeof mQuery.onUpdate === 'function') {
            _this2._oAfter.add(sKey);
          }

          if (mQuery.invokeRender !== undefined && mQuery.invokeRender === false) {
            _this2._oPassive.add(sKey);
          }
        }

        if (aPath) {
          _this2._oPaths[sKey] = aPath;

          try {
            _this2.CURSORS[sKey] = baobabComponent.TREE.select(aPath);
          } catch (e) {
            console.warn('baobabComponent: Key Unavailable for Cursor', sKey, aPath
            /* , e */
            );
          }
        }
      });
      this._bBefore = this._oBefore.size > 0;
      this._bAfter = this._oAfter.size > 0;
      this._bPassive = this._oPassive.size > 0;
      this._aPaths = Object.values(this._oPaths);

      this._getData = function () {
        var oData = {};
        Object.keys(_this2._oPaths).forEach(function (sStateParameter) {
          var aPath = _this2._oPaths[sStateParameter];

          if (baobabComponent.DEBUG_LEVEL >= 3) {
            console.log('_refresh.getData', aPath);
          }

          if (!_this2._checkPath(aPath)) {
            if (baobabComponent.DEBUG_LEVEL >= 2) {
              console.warn('baobabComponent: Incomplete Path for Data', sStateParameter, aPath);
            }

            return;
          }

          try {
            oData[sStateParameter] = baobabComponent.TREE.get(aPath);
          } catch (e) {
            if (baobabComponent.DEBUG_LEVEL >= 2) {
              console.warn('baobabComponent: Key Unavailable for Data', sStateParameter, aPath
              /* , e */
              );
            }
          }
        });
        return oData;
      };
    }
  }, {
    key: "_checkPath",
    value: function _checkPath(aPath) {
      return aPath.indexOf(undefined) === -1 && aPath.indexOf(null) === -1;
    }
  }], [{
    key: "setLoggerMethod",
    value: function setLoggerMethod(fLoggerMethod) {
      baobabComponent.LOGGER = fLoggerMethod;
    }
  }, {
    key: "setTree",
    value: function setTree(oTree) {
      baobabComponent.TREE = oTree;
    }
  }, {
    key: "setFollowProps",
    value: function setFollowProps(bFollowProps) {
      baobabComponent.FOLLOW_PROPS = bFollowProps;
    }
  }, {
    key: "setDebugLevel",
    value: function setDebugLevel(iDebugLevel) {
      baobabComponent.DEBUG_LEVEL = iDebugLevel;
    }
  }]);

  return baobabComponent;
}(React.Component);
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


_defineProperty(baobabComponent, "LOCAL_STATE", 'LOCAL_STATE');

_defineProperty(baobabComponent, "TREE", new Baobab());

_defineProperty(baobabComponent, "FOLLOW_PROPS", false);

_defineProperty(baobabComponent, "DEBUG_LEVEL", 0);

_defineProperty(baobabComponent, "LOGGER", function (sAction, oContext) {});

export { baobabComponent as default };

function solveUpdate(affectedPaths, comparedPaths) {
  var l = affectedPaths.length; // Looping through possible paths

  for (var i = 0; i < l; i++) {
    var p = affectedPaths[i];
    if (!p.length) return p;
    var m = comparedPaths.length; // Looping through logged paths

    for (var j = 0; j < m; j++) {
      var c = comparedPaths[j];
      if (!c || !c.length) return p;
      var n = c.length; // Looping through steps

      for (var k = 0; k < n; k++) {
        var s = c[k]; // If path is not relevant, we break
        // NOTE: the '!=' instead of '!==' is required here!

        if (s != p[k]) break; // If we reached last item and we are relevant

        if (k + 1 === n || k + 1 === p.length) return p;
      }
    }
  }

  return false;
} // http://stackoverflow.com/a/8809472/14651


var UUID = function UUID() {
  var d = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == 'x' ? r : r & 0x7 | 0x8).toString(16);
  });
  return uuid.toLowerCase().replace(/\-/g, '');
};