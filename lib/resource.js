"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

  this.name = name;
  this.url = url;
  this.headers = headers;
  this.prefix = name + '_';
  this.state = state || [];

  // Declare our reducer and resource action holders
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
};

/*  
 * Generic dispatch action that accepts the name of the action we want
 * to exectute, plus a data object. 
 * Find the action, prefixed by the resource name (to prevent conflicts),
 * then execute it. If the request is successful, return a
 * dispatch function with the type set to the prefixed action name, plus
 * the response data.
*/


Resource.prototype.dispatchAction = function (action, data) {
  var _this2 = this;

  var name = this.prefix + action;
  return function (dispatch) {
    return _this2.resourceActions[name](data).then(function (response) {
      dispatch({ type: name, data: response });
    }).catch(function (error) {
      throw error;
    });
  };
};

// Used to set state if not declared during initialization. 
Resource.prototype.setState = function (state) {
  if (state) {
    this.state = state;
  }
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


  if (!name || !url || !method) {
    throw "Name, Url Method are required when adding a resource action.";
  }

  var actionName = this.prefix + name;

  // Use a resourceFN if available, else use default resource action
  if (resourceFn) {
    this.resourceActions[actionName] = resourceFn;
  } else {
    this.resourceActions[actionName] = function (data) {
      var request = _this3.createRequest(url, method, data, _this3.headers);
      return _this3.fetchRequest(request);
    };
  }

  return this;
};

// Create a new reducer action 
Resource.prototype.addReducerAction = function (name, reducerFn) {
  if (!name || !reducerFn) {
    throw "Name and Reducer function are required.";
  }
  var actionName = this.prefix + name;
  this.reducerActions[actionName] = this.reducerActions[actionName] || reducerFn;
  return this;
};

// Update/overwrrite a reducer action (such as a default reducer action) 
Resource.prototype.updateReducerAction = function (name, reducerFn) {
  if (!name || !reducerFn) {
    throw "Name and Reducer function are required.";
  }
  var actionName = this.prefix + name;
  this.reducerActions[actionName] = reducerFn;
  return this;
};

//  Update/overwrrite a resource action (such as a default resouce action) 
Resource.prototype.updateResourceAction = function (name, resourceFn) {
  if (!name || !resourceFn) {
    throw "Name and Resource function are required.";
  }
  var actionName = this.prefix + name;
  this.reducerActions[actionName] = resourceFn;
  return this;
};

/*
 * Registers the default remote resouce action/reducers for CRUD operations: 
 * query(index), get(individual resource), create, update, and delete.
*/
Resource.prototype.registerRemoteActions = function () {
  for (var name in RemoteActions) {
    var url = this.url + RemoteActions[name].url;
    var method = RemoteActions[name].method;
    var reducerFn = RemoteActions[name].reducerFn;
    this.registerNewAction({ url: url, name: name, method: method, reducerFn: reducerFn });
  }
  return this;
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


  if (!name || !url || !method || !reducerFn) {
    throw "Name, Url, Method, Reducer function, and Resource function are required when registering a new action.";
  }

  this.addResourceAction({ name: name, url: url, method: method, resourceFn: resourceFn });
  this.addReducerAction(name, reducerFn);
  return this;
};

/*
 * Dynamically creates requests to a remote endpoint.
*/
Resource.prototype.createRequest = function (url, method, body, headers) {

  // Use this to find the right value for param matching
  function findValueByKey(obj, key) {
    for (var prop in obj) {
      return key === prop ? obj[prop] : findValueByKey(obj[prop], key);
    }
    return null;
  }

  /* 
   * If we set URL params, let's automatically match the a key to them.
   * eg /api/v1/widgets/:id, search through our object to find an ID
   * If we're dealing with a widge resource, it should be in the top level
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

  // Not permitted to send a body with GET/HEAD requests
  if (body && method != 'GET') {
    body = JSON.stringify(body);
  } else {
    body = undefined;
  }

  var request = new Request(url, {
    method: method,
    headers: new Headers(headers),
    body: body
  });

  return request;
};

// Wrapper for fetching requests. 
Resource.prototype.fetchRequest = function (request) {
  return fetch(request).then(function (response) {
    return response.json();
  }).catch(function (error) {
    return error;
  });
};

Resource.prototype.post = function (url, data, headers) {
  var request = this.createRequest(url, 'POST', data, headers);
  return this.fetchRequest(request);
};

Resource.prototype.get = function (url, data, headers) {
  var request = this.createRequest(url, 'GET', data, headers);
  return this.fetchRequest(request);
};

Resource.prototype.patch = function (url, data, headers) {
  var request = this.createRequest(url, 'PATCH', data, headers);
  return this.fetchRequest(request);
};

Resource.prototype.delete = function (url, data, headers) {
  var request = this.createRequest(url, 'DELETE', data, headers);
  return this.fetchRequest(request);
};

function removeData(state, action) {
  var newState = Object.assign([], state);
  var indexToDelete = state.findIndex(function (exercise) {
    return exercise.id == action.data.id;
  });
  newState.splice(indexToDelete, 1);
  return newState;
}

function addData(state, action) {
  return [].concat(_toConsumableArray(state.filter(function (element) {
    return element.id !== action.data.id;
  })), [Object.assign({}, action.data)]);
}

var RemoteActions = {
  query: {
    method: 'GET',
    url: '',
    reducerFn: function reducerFn(state, action) {
      return action.data;
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
};

exports.default = Resource;