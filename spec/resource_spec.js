const Resource = require("../lib/index").default;
const Promise = require('promise')
const redux = require('redux')
const request = require('superagent')
const mock = require('superagent-mocker')(request);

var originalTimeout;
  beforeEach(function() {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });

afterEach(function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

function configureStore(reducer){
  return redux.createStore(reducer)
};

mock.post('/widgets', function(req) {
  return {
    body: req.body
  };
});

mock.get('/widgets', function(req) {
  return {
    ok: true,
    body: [{id: 1}, {id: 2}, {id: 3}]
  };
});

mock.get('/widgets/1', function(req) {
  return {
    body: {id: 1}
  };
});



/* 
 * Generic function for removing a piece of data from our store.
*/
function removeData(state, action){
  const newState = Object.assign([], state.data);
  const indexToDelete = state.data.findIndex(exercise => {
    return exercise.id == action.data.id
  })
  newState.splice(indexToDelete, 1);
  return {data: newState, errors: state.errors}
}

/* 
 * Generic function for adding a piece of data to our store.
*/
function addData(state, action){
  return {data: [ ...state.data.filter(element => element.id !== action.data.id), Object.assign({}, action.data)], errors: state.errors}
}

describe('Resource', function () {

  it('creates a new resource', function () {

      const headers = {'CONTENT': 'JSON'}
      const res = new Resource({name: 'resource', url: '/resources', headers: headers, state: []});

      expect(res.name).toEqual('RESOURCE');
      expect(res.url).toEqual('/resources');
      expect(res.headers).toEqual(headers);
      expect(res.state).toEqual({data: [], errors: []});
  });

  it('registers remote actions when called', function () {
      const remotes = new Resource({name: 'defaults', url: '/defaults', headers: {}, state: []}).registerRemoteActions();
      const noRemotes = new Resource({name: 'defaults', url: '/defaults', headers: {}, state: []})

      const remotesKeys = Object.keys(remotes.resourceActions)
      expect(remotesKeys.length).toEqual(5);

      const noRemotesKeys = Object.keys(noRemotes.resourceActions)
      expect(noRemotesKeys.length).toEqual(0);
  });

  it('successfully registers new actions', function () {
      const res = new Resource({name: 'resource', url: '/resources', headers: null, state: []});

      res.registerNewAction({name: 'GET_CURRENT_USER', url: '/current-user', method: 'GET', reducerFn: (state, action) => {return action.data} })

      var key = Object.keys(res.resourceActions)[0]
      expect(res.resourceActions[key]).toBeTruthy()
      expect(key).toEqual('RESOURCE_GET_CURRENT_USER')
  });

  it('successfully dispatches a Sync action that adds to store', function () {

    const Widget = new Resource({name: 'widget', url: '/widgets', state: []})

    let rootReducer = redux.combineReducers({
      widget: Widget.reducer
    })

    let Store = configureStore(rootReducer)

    Resource.configure({dispatch: Store.dispatch})

    Widget.addReducerAction('ADD_WIDGET', (state, action) => { 
      return addData(state,action) 
    })

    Widget.dispatchSync('ADD_WIDGET', {id: 1})

    expect(Store.getState().widget.data[0]).toEqual({id: 1})

  });

  it('successfully dispatches a Sync action that removes from store', function () {

    const Widget = new Resource({name: 'widget', url: '/widgets', state: []})

    let rootReducer = redux.combineReducers({
      widget: Widget.reducer
    })

    let Store = configureStore(rootReducer)

    Resource.configure({dispatch: Store.dispatch})

    Widget.addReducerAction('DELETE_WIDGET', (state, action) => { 
      return removeData(state,action) 
    })

    Widget.dispatchSync('DELETE_WIDGET', {id: 1})

    expect(Store.getState().widget.data.length).toEqual(0)

  });

  it('successfully dispatches an $ERROR action', function () {

    const Widget = new Resource({name: 'widget', url: '/widgets', state: []})

    let rootReducer = redux.combineReducers({
      widget: Widget.reducer
    })

    let Store = configureStore(rootReducer)

    Resource.configure({dispatch: Store.dispatch})

    Widget.dispatchSync('$ERROR', {title: 'Error title', detail: 'Error detail'})

    expect(Store.getState().widget.errors[0]).toEqual({title: 'Error title', detail: 'Error detail'})

  });

  it('successfully dispatchs a $CLEAR_ERRORS action', function () {

    const Widget = new Resource({name: 'widget', url: '/widgets', state: []})

    let rootReducer = redux.combineReducers({
      widget: Widget.reducer
    })

    let Store = configureStore(rootReducer)

    Resource.configure({dispatch: Store.dispatch})

    Widget.dispatchSync('$ERROR', {title: 'Error title', detail: 'Error detail'})
    Widget.dispatchSync('$CLEAR_ERRORS')

    expect(Store.getState().widget.errors.length).toEqual(0)

  });

  // need to work on this test - dispatchAsync not working
  it('successfully dispatchs a GET Async action', function (done) {

    const Widget = new Resource({name: 'widget', url: '/widgets', state: []}).registerRemoteActions()

    let rootReducer = redux.combineReducers({
      widget: Widget.reducer
    })

    let Store = configureStore(rootReducer)

    Resource.configure({dispatch: Store.dispatch})

    request
    .get(Widget.url)
    .end( (error, response) => {
      Widget.dispatch({type: Widget.prefix + '$QUERY', data: response.body});
      expect(Store.getState().widget.data).toEqual([{id: 1}, {id: 2}, {id: 3}])
      done()
    })


  });


});

