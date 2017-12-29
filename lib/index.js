'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var request = require('superagent');

var addResourceAction = Symbol('addResourceAction');
var addReducerAction = Symbol('addReducerAction');
var remoteActions = Symbol('remoteActions');
var findValueByKey = Symbol('findValueByKey');
var removeData = Symbol('removeData');
var addData = Symbol('addData');

var Resource = function () {
  function Resource(options) {
    var _this = this;

    _classCallCheck(this, Resource);

    var name = options.name,
        url = options.url,
        headers = options.headers,
        state = options.state;


    if (!name) {
      throw new Error("Name is required when creating a new Resource.");
    }

    this.name = name.toUpperCase();
    this.url = url;
    this.headers = headers;
    this.prefix = name.toUpperCase() + '_';
    this.state = { data: state || [], errors: [] };

    this.reducerActions = {};
    this.resourceActions = {};

    /* 
     * Generic reducer action that accepts our initial state and the action
     * object. The function checks to see if the action type is one of the 
     * current Resource's listed reducer actions - if so, execute that
     * reducer action (etiher a default or custom action).
    */
    this.reducer = function () {
      var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _this.state;
      var action = arguments[1];

      if (_this.reducerActions[action.type]) {
        return _this.reducerActions[action.type](state, action);
      }
      return state;
    };

    /*
     * Add special error handlers to our resource.
    */
    this.registerSync({
      name: '$ERROR',
      reducerFn: function reducerFn(state, action) {
        return { data: state.data, errors: [action.data] };
      }
    });

    this.registerSync({
      name: '$CLEAR_ERRORS',
      reducerFn: function reducerFn(state, action) {
        return { data: state.data, errors: [] };
      }
    });
  }

  /* 
   * PRIVATE
   *
   * Create a new resource action, which are used to perform an action, such as 
   * requesting a resource from a server. However, we can also pass non remote 
   * action, as long as it uses a Promise.
  */


  _createClass(Resource, [{
    key: addResourceAction,
    value: function value(options) {
      var _this2 = this;

      var name = options.name,
          url = options.url,
          method = options.method,
          resourceFn = options.resourceFn;


      if (!name) {
        throw new Error("Name is required when adding a resource action.");
      }

      var actionName = this.prefix + name.toUpperCase();

      // Use a resourceFN if available, else use default resource action
      if (resourceFn) {
        this.resourceActions[actionName] = resourceFn;
      } else {
        this.resourceActions[actionName] = function (data) {
          return _this2.fetchRequest(url, method, data, _this2.headers);
        };
      }

      return this;
    }

    /* 
     * PRIVATE
     *
     * Adds a new reducer action to our Resource's reducer.  
    */

  }, {
    key: addReducerAction,
    value: function value(options) {
      var name = options.name,
          reducerFn = options.reducerFn;


      if (!name || !reducerFn) {
        throw new Error("Name and Reducer function are required when adding a reducer action.");
      }

      var actionName = this.prefix + name.toUpperCase();
      this.reducerActions[actionName] = this.reducerActions[actionName] || reducerFn;
      return this;
    }
  }, {
    key: remoteActions,
    value: function value() {
      var _this3 = this;

      return {
        query: {
          method: 'GET',
          url: '',
          reducerFn: function reducerFn(state, action) {
            return { data: action.data, errors: [].concat(_toConsumableArray(state.errors)) };
          }
        },
        get: {
          method: 'GET',
          url: '/:id',
          reducerFn: function reducerFn(state, action) {
            return _this3[addData](state, action);
          }
        },
        create: {
          method: 'POST',
          url: '',
          reducerFn: function reducerFn(state, action) {
            return _this3[addData](state, action);
          }
        },
        update: {
          method: 'PATCH',
          url: '/:id',
          reducerFn: function reducerFn(state, action) {
            return _this3[addData](state, action);
          }
        },
        delete: {
          method: 'DELETE',
          url: '/:id',
          reducerFn: function reducerFn(state, action) {
            return _this3[removeData](state, action);
          }
        }
      };
    }

    /* 
     * Use this to find the right value for param matching
    */

  }, {
    key: findValueByKey,
    value: function value(obj, key) {
      if (!obj || !key) {
        throw 'Object and key are required for finding value by key.';
      }

      for (var prop in obj) {
        return key === prop ? obj[prop] : this[findValueByKey](obj[prop], key);
      }
      return null;
    }

    /* 
     * Generic function for removing a piece of data from our store.
    */

  }, {
    key: removeData,
    value: function value(state, action) {
      var newState = Object.assign([], state.data);
      var indexToDelete = state.data.findIndex(function (exercise) {
        return exercise.id == action.data.id;
      });
      newState.splice(indexToDelete, 1);
      return {
        data: newState,
        errors: state.errors
      };
    }

    /* 
     * Generic function for adding a piece of data to our store.
    */

  }, {
    key: addData,
    value: function value(state, action) {
      return {
        data: [].concat(_toConsumableArray(state.data.filter(function (element) {
          return element.id !== action.data.id;
        })), [Object.assign({}, action.data)]),
        errors: state.errors
      };
    }
  }]);

  return Resource;
}();

/*  
 * Enable our resource to use our Store's dispatch function.
*/


Resource.configure = function (_ref) {
  var dispatch = _ref.dispatch;

  if (!dispatch) {
    throw new Error("Dispatch function is required when configuring the Resource class.");
  }
  Resource.prototype.dispatch = dispatch;
};

/*  
 * Dispatch an asynchronous action to our store.
 *
 * Accepts the name of the action we want to exectute, plus a data object.
 * Find the action, prefixed by the resource name (to prevent conflicts),
 * then execute it. If the request is successful, return a
 * dispatch function with the type set to the prefixed action name, plus
 * the response data.
*/
Resource.prototype.dispatchAsync = function (actionName, data) {
  var _this4 = this;

  if (!actionName) {
    throw new Error("Action name is required when dispatching an action.");
  }

  var name = this.prefix + actionName.toUpperCase();

  return this.resourceActions[name](data).then(function (response) {
    if (!response.ok) {
      throw response;
    }
    _this4.dispatch({ type: name, data: response.body });
  }).catch(function (error) {
    _this4.dispatch({ type: _this4.prefix + '$ERROR', data: error.body });
  });
};

/* 
 * Dispatch a synchronous action to our store.
*/
Resource.prototype.dispatchSync = function (actionName, data) {
  if (!actionName) {
    throw new Error("Action name is required when dispatching an action.");
  }

  var name = this.prefix + actionName.toUpperCase();
  Resource.prototype.dispatch({ type: name, data: data });
};

/*
 * Register a custom resource action and reducer action. This accepts any
 * promise based function as a resource function.
*/
Resource.prototype.registerAsync = function (options) {
  var name = options.name,
      url = options.url,
      method = options.method,
      reducerFn = options.reducerFn,
      resourceFn = options.resourceFn;


  if (!name || !reducerFn) {
    throw new Error("Name and Reducer function are required when registering a new Async action.");
  }

  if ((!url || !method) && !resourceFn) {
    throw new Error("Resource function must be provided when URL and Method are omitted");
  }

  this[addResourceAction]({ name: name, url: url, method: method, resourceFn: resourceFn });
  this[addReducerAction]({ name: name, reducerFn: reducerFn });

  return this;
};

/*
 * Register a custom resource action and reducer action. This accepts any
 * promise based function as a resource function.
*/
Resource.prototype.registerSync = function (options) {
  var name = options.name,
      reducerFn = options.reducerFn;


  if (!name || !reducerFn) {
    throw new Error("Name and Reducer function are required when registering a new Sync action.");
  }

  this[addReducerAction]({ name: name, reducerFn: reducerFn });

  return this;
};

/* 
 * Update/overwrrite a reducer action (such as a default reducer action)  
*/
Resource.prototype.updateReducerAction = function (name, reducerFn) {
  if (!name || !reducerFn) {
    throw new Error("Name and Reducer function are required when updating a reducer action.");
  }
  var actionName = this.prefix + name.toUpperCase();
  this.reducerActions[actionName] = reducerFn;
  return this;
};

/* 
 * Update/overwrrite a resource action (such as a default resource action) 
*/
Resource.prototype.updateResourceAction = function (name, resourceFn) {
  if (!name || !resourceFn) {
    throw new Error("Name and Resource function are required when updating a resource action.");
  }
  var actionName = this.prefix + name.toUpperCase();
  this.reducerActions[actionName] = resourceFn;
  return this;
};

/*
 * Registers the default remote resouce action/reducers for CRUD operations: 
 * query(index), get(individual resource), create, update, and delete.
*/
Resource.prototype.registerRemoteActions = function () {
  var actions = this[remoteActions]();

  for (var action in actions) {
    var name = '$' + action.toUpperCase();
    var url = this.url + actions[action].url;
    var method = actions[action].method;
    var reducerFn = actions[action].reducerFn;
    this.registerAsync({ name: name, url: url, method: method, reducerFn: reducerFn });
  }
  return this;
};

/*
 * Dynamically creates requests to a remote endpoint.
*/
Resource.prototype.fetchRequest = function (url, method, body, headers) {
  var _this5 = this;

  if (!url || !method) {
    throw new Error("Url and Method are required for fetching a request.");
  }
  return new Promise(function (resolve, reject) {
    /* 
     * If we set URL params, let's automatically match the a key to them.
     * eg /api/v1/widgets/:id, search through our object to find an ID
     * If we're dealing with a widget resource, it should be in the top level
    */
    var urlParams = url.match(/:(\w+)/ig);

    if (urlParams) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = urlParams[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var param = _step.value;

          url = url.replace(param, _this5[findValueByKey](body, param.substring(1)));
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }

    if (method == 'GET') {
      return request(method, url).query(body).set(headers).end(function (error, response) {
        resolve(response);
      });
    }

    if (method == 'POST' || method == 'PATCH' || method == 'PUT' || method == 'DELETE') {
      return request(method, url).send(body).set(headers).end(function (error, response) {
        resolve(response);
      });
    }

    return reject('Invalid request.');
  });
};

exports.default = Resource;