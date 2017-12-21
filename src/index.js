class Resource {
  constructor(options){
    const { name, url, headers, state } = options

    if ( !name ) {
      throw("Name is required when creating a new Resource.")
    }

    this.name = name;
    this.url = url;
    this.headers = headers;
    this.prefix = name + '_';
    this.state = state || []

    // Declare our reducer and resource action holders
    this.reducerActions = {};
    this.resourceActions = {};

    /* 
     * Generic reducer action that accepts our initial state and the action
     * object. The function checks to see if the action type is one of the 
     * current Resource's listed reducer actions - if so, execute that
     * reducer action (etiher a default or custom action).
    */
    this.reducer = (state = this.state, action) => {
      if (this.reducerActions[action.type]) {
        return this.reducerActions[action.type](state, action);
      }
      return state;
    }
  }
}

/*  
 * Pass the Store's dispatch function as an argument.
*/
Resource.setDispatch = function(dispatch){
  this.prototype.dispatch = dispatch;
}

/*  
 * Generic dispatch action that accepts the name of the action we want
 * to exectute, plus a data object. 
 * Find the action, prefixed by the resource name (to prevent conflicts),
 * then execute it. If the request is successful, return a
 * dispatch function with the type set to the prefixed action name, plus
 * the response data.
*/
Resource.prototype.dispatchAction = function(action, data) {
  const name = this.prefix + action;
  return this.resourceActions[name](data).then( response => {
    this.dispatch({type: name, data: response});
  }).catch(error => {
    throw(error);
  })
}

// Used to set state if not declared during initialization. 
Resource.prototype.setState = function(state) {
  if ( state ){
    this.state = state;
  }
  return this;
}

/* 
 * Create a new resource action, which are used to perform an action, such as 
 * requesting a resource from a server. However, we can also pass non remote 
 * action, as long as it uses a Promise.
*/ 
Resource.prototype.addResourceAction = function(options) {
  const { name, url, method, resourceFn } = options

  if ( !name || !url || !method ) {
    throw("Name, Url Method are required when adding a resource action.")
  }

  const actionName = this.prefix + name;

  // Use a resourceFN if available, else use default resource action
  if ( resourceFn ) {
    this.resourceActions[actionName] = resourceFn
  } else {
    this.resourceActions[actionName] = (data) => {
      var request = this.createRequest(url, method, data, this.headers);
      return this.fetchRequest(request);
    };
  }

  return this;
}

// Create a new reducer action 
Resource.prototype.addReducerAction = function(name, reducerFn) {
  if (!name || !reducerFn){
    throw("Name and Reducer function are required.")
  }
  const actionName = this.prefix + name;
  this.reducerActions[actionName] = this.reducerActions[actionName] || reducerFn;
  return this;
}

// Update/overwrrite a reducer action (such as a default reducer action) 
Resource.prototype.updateReducerAction = function(name, reducerFn) {
  if (!name || !reducerFn){
    throw("Name and Reducer function are required.")
  }
  const actionName = this.prefix + name;
  this.reducerActions[actionName] = reducerFn;
  return this;
}

//  Update/overwrrite a resource action (such as a default resouce action) 
Resource.prototype.updateResourceAction = function(name, resourceFn) {
  if (!name || !resourceFn){
    throw("Name and Resource function are required.")
  }
  const actionName = this.prefix + name;
  this.reducerActions[actionName] = resourceFn;
  return this;
}

/*
 * Registers the default remote resouce action/reducers for CRUD operations: 
 * query(index), get(individual resource), create, update, and delete.
*/
Resource.prototype.registerRemoteActions = function() { 
  for ( let name in RemoteActions) {
    const url = this.url + RemoteActions[name].url;
    const method = RemoteActions[name].method;
    const reducerFn =  RemoteActions[name].reducerFn
    this.registerNewAction({url, name, method, reducerFn})
  }
  return this;
}

/*
 * Register a custom resource action and reducer action. This accepts any
 * promise based function as a resource function.
*/
Resource.prototype.registerNewAction = function(options) {
  const { name, url, method, reducerFn, resourceFn } = options

  if ( !name || !url || !method || !reducerFn ) {
    throw("Name, Url, Method, Reducer function, and Resource function are required when registering a new action.")
  }

  this.addResourceAction({name, url, method, resourceFn});
  this.addReducerAction(name, reducerFn);
  return this;
}

/*
 * Dynamically creates requests to a remote endpoint.
*/
Resource.prototype.createRequest = function(url, method, body, headers) {

  // Use this to find the right value for param matching
  function findValueByKey(obj, key){
    for (let prop in obj) {
      return key === prop ? obj[prop] : findValueByKey(obj[prop], key)
    }
    return null;
  }

  /* 
   * If we set URL params, let's automatically match the a key to them.
   * eg /api/v1/widgets/:id, search through our object to find an ID
   * If we're dealing with a widge resource, it should be in the top level
  */
  const urlParams = url.match(/:(\w+)/ig)

  if (urlParams) {
    for ( let param of urlParams ){
      url = url.replace(param, findValueByKey(body, param.substring(1)))
    }
  }

  // Not permitted to send a body with GET/HEAD requests
  if (body && method != 'GET'){
    body = JSON.stringify(body);
  } else {
    body = undefined;
  }

  let request = new Request(url, {
    method: method,
    headers: new Headers(headers),
    body: body
  });

  return request;
}

// Wrapper for fetching requests. 
Resource.prototype.fetchRequest = function(request){
  return fetch(request).then(response => {
    return response.json();
  }).catch(error => {
    return error;
  })
}

Resource.prototype.post = function(url, data, headers){
  const request = this.createRequest(url, 'POST', data, headers);
  return this.fetchRequest(request)
}

Resource.prototype.get = function(url, data, headers){
  const request = this.createRequest(url, 'GET', data, headers);
  return this.fetchRequest(request)
}

Resource.prototype.patch = function(url, data, headers){
  const request = this.createRequest(url, 'PATCH', data, headers);
  return this.fetchRequest(request)
}

Resource.prototype.delete = function(url, data, headers){
  const request = this.createRequest(url, 'DELETE', data, headers);
  return this.fetchRequest(request)
}

function removeData(state, action){
  const newState = Object.assign([], state);
  const indexToDelete = state.findIndex(exercise => {
    return exercise.id == action.data.id
  })
  newState.splice(indexToDelete, 1);
  return newState;
}

function addData(state, action){
  return [ ...state.filter(element => element.id !== action.data.id), Object.assign({}, action.data)]
}

const RemoteActions = {
  query: {
    method: 'GET',
    url: '',
    reducerFn: (state, action) => { return action.data },
  },
  get: {
    method: 'GET',
    url: '/:id',
    reducerFn: (state, action) => { return addData(state, action) },
  },
  create: {
    method: 'POST',
    url: '',
    reducerFn: (state, action) => { return addData(state, action) },
  },
  update: {
    method: 'PATCH',
    url: '/:id',
    reducerFn: (state, action) => { return addData(state, action) },
  },
  delete: {
    method: 'DELETE',
    url: '/:id',
    reducerFn: (state, action) => { return removeData(state, action) },
  }
}

export default Resource;
