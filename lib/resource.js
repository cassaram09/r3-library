'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _http = require('./http');

var _http2 = _interopRequireDefault(_http);

var _defaults = require('./defaults');

var _defaults2 = _interopRequireDefault(_defaults);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Resource = function (_HTTP) {
  _inherits(Resource, _HTTP);

  function Resource(name, url, headers, state) {
    _classCallCheck(this, Resource);

    //  set the name, base url, and headers for this instance
    var _this = _possibleConstructorReturn(this, (Resource.__proto__ || Object.getPrototypeOf(Resource)).call(this));

    _this.name = name;
    _this.url = url;
    _this.headers = headers;
    _this.prefix = name + '_';
    _this.state = state || [];

    //  declare our reducer and resource action holders
    _this.reducerActions = {};
    _this.resourceActions = {};

    /*  
        Generic dispatch action that accepts the name of the action we want
        to exectute, plus any data, passed as an object. Find the action, 
        prefixed by the resource name (to prevent conflicts), then execute
        the request to the server. If the request is successful, return a 
        dispatch function with the type set to the prefixed action name, plus 
        the response data.
    */
    Resource.prototype.dispatchAction = function (action, data) {
      var name = _this.prefix + action;
      var res = _this;
      return function (dispatch) {
        return _this.resourceActions[name](data).then(function (response) {
          dispatch({ type: name, data: response });
        }).catch(function (error) {
          throw error;
        });
      };
    };

    /* 
        Generic reducer action that accepts our initial state and the action
        object. The function checks to see if the action type is one of the 
        current Resource's listed reducer actions - if so, execute that
        reducer action (etiher a default or custom action).
    */
    Resource.prototype.reducer = function () {
      var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _this.state;
      var action = arguments[1];

      var resource = _this;
      if (resource.reducerActions[action.type]) {
        return resource.reducerActions[action.type](state, action);
      }
      return state;
    };

    //  Register a custom resource action and reducer action. 
    Resource.prototype.registerNewAction = function (url, name, method, reducerFn) {
      _this.addResourceAction(url, name, method);
      _this.addReducerAction(name, reducerFn);
      return _this;
    };

    //  create a new reducer action (more flexible)
    Resource.prototype.addResourceAction = function (url, name, method) {
      var actionName = _this.prefix + name;
      _this.resourceActions[actionName] = function (data) {
        var request = _http2.default.createRequest(url, method, data, _this.headers);
        return _http2.default.fetchRequest(request);
      };
      return _this;
    };

    //  create a new reducer action (more flexible)
    Resource.prototype.addReducerAction = function (name, callback) {
      var actionName = _this.prefix + name;
      _this.reducerActions[actionName] = _this.reducerActions[actionName] || callback;
      return _this;
    };

    //  Upadate/overwrrite a reducer action (such as a default action. 
    Resource.prototype.updateReducerAction = function (name, callback) {
      var actionName = _this.prefix + name;
      _this.reducerActions[actionName] = callback;
      return _this;
    };

    //  Upadate/overwrrite a resource action (such as a default action. 
    Resource.prototype.updateResourceAction = function (name, callback) {
      var actionName = _this.prefix + name;
      _this.reducerActions[actionName] = callback;
      return _this;
    };

    /*  
        Registers the default action/reducers for CRUD operations: query(index),
        get(individual resource), create, update, and delete.
    */
    Resource.prototype.registerDefaults = function () {
      var obj = _defaults2.default;
      for (var _name in obj) {
        var url = _this.url + obj[_name].url;
        var method = obj[_name].method;
        _this.addResourceAction(url, _name, method);
        _this.addReducerAction(_name, obj[_name].reducerFn);
      }
      return _this;
    };

    return _this;
  }

  return Resource;
}(_http2.default);

exports.default = Resource;