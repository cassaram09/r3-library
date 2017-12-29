const Resource = require("../lib/index").default;
const Promise = require('promise')
const redux = require('redux')
const request = require('superagent')
const mock = require('superagent-mocker')(request);

function configureStore(reducer){
  return redux.createStore(reducer)
};

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
  var Widget; 
  var Store;
  var stubbedAction = new Promise(function(resolve, reject){
    resolve('done')
  })
  var stubbedExpectation = function () {};

  beforeEach(function() {
    Widget = new Resource({
      name: 'widget', 
      url: '/widgets', 
      headers: {'Content-Type': 'application/json'}, 
      state: []
    });

    let rootReducer = redux.combineReducers({
      widget: Widget.reducer
    })

    Store = configureStore(rootReducer)

    Resource.configure({dispatch: Store.dispatch})

    // stub our async action
    Widget.dispatchAsync = function (actionName, data) {
      let _this = this;

      if (!actionName) {
        throw new Error("Action name is required when dispatching an action.");
      }

      var name = this.prefix + actionName.toUpperCase();

      return stubbedAction.then(function (response) {
        if (!response.ok) {
          throw response;
        }
        _this.dispatch({type: name, data: response.body});
        stubbedExpectation();
      }).catch(function (error) {
        _this.dispatch({ type: _this.prefix + '$ERROR', data: error.body });
      });
    };
  });


  it('creates a new resource', function () {
    expect(Widget.name).toEqual('WIDGET');
    expect(Widget.url).toEqual('/widgets');
    expect(Widget.headers).toEqual({'Content-Type': 'application/json'});
    expect(Widget.state).toEqual({data: [], errors: []});

    expect(Object.keys(Widget.resourceActions).length).toEqual(0);
  });

  it('creates assigns special error handling functions on initialization', function () {
    expect(Object.keys(Widget.reducerActions).length).toEqual(2);
    expect(Widget.reducerActions['WIDGET_$ERROR']).not.toBe(undefined)
    expect(Widget.reducerActions['WIDGET_$CLEAR_ERRORS']).not.toBe(undefined)
  });

  it('registers remote actions when called', function () {
    Widget.registerRemoteActions();
    expect(Object.keys(Widget.resourceActions).length).toEqual(5);
    expect(Object.keys(Widget.reducerActions).length).toEqual(7);
  });


  describe('can register a new action: ', function () {
    it('Async action without resourceFn', function () {

      Widget.registerAsync({
        name: 'GET_CURRENT_WIDGET', 
        url: '/current-user', 
        method: 'GET', 
        reducerFn: (state, action) => {return action.data} 
      })

      var key = Object.keys(Widget.resourceActions)[0]
      expect(Widget.resourceActions[key]).toBeTruthy()
      expect(key).toEqual('WIDGET_GET_CURRENT_WIDGET')
    });

    it('Async action with resourceFn', function () {

      Widget.registerAsync({
        name: 'GET_CURRENT_WIDGET', 
        reducerFn: (state, action) => {return action.data},
        resourceFn:(data) => {
          return new Promise((resolve, reject) => {
            request
            .get('/widgets/current')
            .end(function(error, response){
              resolve(response);
            });
          });
        }
      })

      var key = Object.keys(Widget.resourceActions)[0]
      expect(Widget.resourceActions[key]).toBeTruthy()
      expect(key).toEqual('WIDGET_GET_CURRENT_WIDGET')
    });

    it('Sync action', function () {
      Widget.registerSync({
        name: 'GET_CURRENT_WIDGET', 
        reducerFn: (state, action) => {return action.data} 
      })

      var key = Object.keys(Widget.reducerActions)[2]
      expect(Widget.resourceActions[key]).toBeFalsy()
      expect(Widget.reducerActions[key]).toBeTruthy()
      expect(key).toEqual('WIDGET_GET_CURRENT_WIDGET')
    });

    

  })

  it('successfully dispatches a Sync action that adds data to store', function () {

    Widget.registerSync({
      name:'ADD_WIDGET', 
      reducerFn: (state, action) => { 
        return addData(state,action) 
      }
    })

    Widget.dispatchSync('ADD_WIDGET', {id: 1})

    expect(Store.getState().widget.data[0]).toEqual({id: 1})

  });

  it('successfully dispatches a Sync action that removes from store', function () {

    Widget.registerSync({
      name:'DELETE_WIDGET', 
      reducerFn: (state, action) => { 
        return removeData(state,action) 
      }
    })

    Widget.dispatchSync('DELETE_WIDGET', {id: 1})

    expect(Store.getState().widget.data.length).toEqual(0)

  });

  it('successfully dispatches an $ERROR action', function () {

    Widget.dispatchSync('$ERROR', {title: 'Error title', detail: 'Error detail'})

    expect(Store.getState().widget.errors[0]).toEqual({title: 'Error title', detail: 'Error detail'})

  });

  it('successfully dispatchs a $CLEAR_ERRORS action', function () {

    Widget.dispatchSync('$ERROR', {title: 'Error title', detail: 'Error detail'})
    Widget.dispatchSync('$CLEAR_ERRORS')

    expect(Store.getState().widget.errors.length).toEqual(0)

  });

  it('successfully dispatchs a $QUERY Async action', function (done) {
    mock.get('/widgets', function(req) {
      return {
        ok: true,
        body: [{id: 1}, {id: 2}, {id: 3}]
      };
    });

    Widget.registerRemoteActions();

    stubbedAction = new Promise(function(resolve, reject){
      request
      .get(Widget.url)
      .end( (error, response) => {
        resolve(response)
      })
    })

    stubbedExpectation = function(){
      expect(Store.getState().widget.data).toEqual([{id: 1}, {id: 2}, {id: 3}])
      done()
    }

    Widget.dispatchAsync('$QUERY')

  });

  it('successfully dispatchs a $CREATE Async action', function (done) {
    mock.post('/widgets', function(req) {
      return {
        ok: true,
        body: {id: 1, name: 'myWidget'}
      };
    });

    Widget.registerRemoteActions();

    stubbedAction = new Promise(function(resolve, reject){
      request
      .post(Widget.url)
      .send({name: 'myWidget'})
      .end( (error, response) => {
        resolve(response)
      })
    })

    stubbedExpectation = function(){
      expect(Store.getState().widget.data).toEqual([{id: 1, name: 'myWidget'}])
      done()
    }

    Widget.dispatchAsync('$CREATE')

  });

});

