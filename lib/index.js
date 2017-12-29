'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var request = require('superagent');

var Resource = function Resource(options) {
  var _this = this;

  _classCallCheck(this, Resource);

  var name = options.name,
      url = options.url,
      headers = options.headers,
      state = options.state;


  if (!name) {
    throw "Name is required when creating a new Resource.";
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
  this.addReducerAction('$ERROR', function (state, action) {
    return { data: state.data, errors: [action.data] };
  });

  this.addReducerAction('$CLEAR_ERRORS', function (state, action) {
    return { data: state.data, errors: [] };
  });
};

/*  
 * Enable our resource to use our Store's dispatch function.
*/


Resource.configure = function (_ref) {
  var dispatch = _ref.dispatch;

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
  var _this2 = this;

  var name = this.prefix + actionName.toUpperCase();

  return this.resourceActions[name](data).then(function (response) {
    if (!response.ok) {
      throw response;
    }
    _this2.dispatch({ type: name, data: response.body });
  }).catch(function (error) {
    _this2.dispatch({ type: _this2.prefix + '$ERROR', data: error.body });
  });
};

/* 
 * Dispatch a synchronous action to our store.
*/
Resource.prototype.dispatchSync = function (actionName, data) {
  var name = this.prefix + actionName.toUpperCase();
  this.dispatch({ type: name, data: data });
};

/*
 * Register a custom resource action and reducer action. This accepts any
 * promise based function as a resource function.
*/
Resource.prototype.registerNewAction = function (options) {
  var name = options.name,
      url = options.url,
      method = options.method,
      reducerFn = options.reducerFn,
      resourceFn = options.resourceFn;


  if (!name || !reducerFn) {
    throw "Name and Reducer function are required when registering a new action.";
  }

  this.addResourceAction({ name: name, url: url, method: method, resourceFn: resourceFn });
  this.addReducerAction(name, reducerFn);
  return this;
};

/* 
 * Create a new resource action, which are used to perform an action, such as 
 * requesting a resource from a server. However, we can also pass non remote 
 * action, as long as it uses a Promise.
*/
Resource.prototype.addResourceAction = function (options) {
  var _this3 = this;

  var name = options.name,
      url = options.url,
      method = options.method,
      resourceFn = options.resourceFn;


  if (!name) {
    throw "Name is required when adding a resource action.";
  }

  var actionName = this.prefix + name.toUpperCase();

  // Use a resourceFN if available, else use default resource action
  if (resourceFn) {
    this.resourceActions[actionName] = resourceFn;
  } else {
    this.resourceActions[actionName] = function (data) {
      return _this3.fetchRequest(url, method, data, _this3.headers);
    };
  }

  return this;
};

/* 
 * Adds a new reducer action to our Resource's reducer.  
*/
Resource.prototype.addReducerAction = function (name, reducerFn) {
  if (!name || !reducerFn) {
    throw "Name and Reducer function are required.";
  }
  var actionName = this.prefix + name.toUpperCase();
  this.reducerActions[actionName] = this.reducerActions[actionName] || reducerFn;
  return this;
};

/* 
 * Update/overwrrite a reducer action (such as a default reducer action)  
*/
Resource.prototype.updateReducerAction = function (name, reducerFn) {
  if (!name || !reducerFn) {
    throw "Name and Reducer function are required.";
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
    throw "Name and Resource function are required.";
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
  for (var action in this.remoteActions) {
    var name = '$' + action.toUpperCase();
    var url = this.url + this.remoteActions[action].url;
    var method = this.remoteActions[action].method;
    var reducerFn = this.remoteActions[action].reducerFn;
    this.registerNewAction({ name: name, url: url, method: method, reducerFn: reducerFn });
  }
  return this;
};

/*
 * Dynamically creates requests to a remote endpoint.
*/
Resource.prototype.fetchRequest = function (url, method, body, headers) {
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

          url = url.replace(param, findValueByKey(body, param.substring(1)));
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
      request(method, url).query(body).set(headers).end(function (error, response) {
        resolve(response);
      });
      return;
    }

    if (method == 'POST' || method == 'PATCH' || method == 'PUT' || method == 'DELETE') {
      request(method, url).send(body).set(headers).end(function (error, response) {
        resolve(response);
      });
      return;
    }

    reject('Invalid request.');
  });
};

Resource.prototype.remoteActions = {
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
      return addData(state, action);
    }
  },
  create: {
    method: 'POST',
    url: '',
    reducerFn: function reducerFn(state, action) {
      return addData(state, action);
    }
  },
  update: {
    method: 'PATCH',
    url: '/:id',
    reducerFn: function reducerFn(state, action) {
      return addData(state, action);
    }
  },
  delete: {
    method: 'DELETE',
    url: '/:id',
    reducerFn: function reducerFn(state, action) {
      return removeData(state, action);
    }
  }

  /* 
   * Use this to find the right value for param matching
  */
};function findValueByKey(obj, key) {
  for (var prop in obj) {
    return key === prop ? obj[prop] : findValueByKey(obj[prop], key);
  }
  return null;
}

/* 
 * Generic function for removing a piece of data from our store.
*/
function removeData(state, action) {
  var newState = Object.assign([], state.data);
  var indexToDelete = state.data.findIndex(function (exercise) {
    return exercise.id == action.data.id;
  });
  newState.splice(indexToDelete, 1);
  return { data: newState, errors: state.errors };
}

/* 
 * Generic function for adding a piece of data to our store.
*/
function addData(state, action) {
  return { data: [].concat(_toConsumableArray(state.data.filter(function (element) {
      return element.id !== action.data.id;
    })), [Object.assign({}, action.data)]), errors: state.errors };
}

exports.default = Resource;