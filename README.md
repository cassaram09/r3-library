# r3 Library

**r3-library** (short for React-Redux-Resource) allows users to create and dispatch both synchronous and asynchronous actions in an object oriented fashion.

**Features**  

  - Easily create and dispatch both synchronous and asynchronous actions 
  - Built-in async CRUD actions 
  - Registering new actions automatically updates your reducers  
  - Consistent, scoped naming conventions allows for easy scaling and maintenance and prevents reducer conflicts  
  - Gracefully handles errors by dispatching an error action to our store so you can render errors to your users
  - Simple remote requests using `superagent`
  - No Redux middleware required
  - Chainable commands

View a demo app that uses r3: https://react-workout-tracker.herokuapp.com/

View the source code here: https://github.com/cassaram09/workout-tracker-v2

## Installation

To install, run:
`npm install r3-library --save`

Make sure you have `redux` installed. 

**1) To create a new Resource, pass an options object during initialization with at least a `name` property, then export the resource:**  
  
A simple example, where we create a new Resource, complete with the default CRUD actions.

    // widgetResource.js    
    import Resource from 'r3-library'  
      
    const Widget = new Resource({  
      name: 'widget',  
    })  

    Widget.registerRemoteActions();
      
    export default Widget;    

A more complex example, where we create a new Resource and register some custom actions.
    
    // widgetResource.js 
    import Resource from 'r3-library'

    const Widget = new Resource({
      name: 'widget', 
      url: 'http://localhost:3000/widgets', 
      headers: {'Content-Type': "application/json"}, 
      state: []
    })

    Widget.registerRemoteActions();

    // Async action with custom request
    Widget.registerAsync({
      name: 'GET_CURRENT_WIDGET', 
      reducerFn:(state, action) => { return action.data }, 
      resourceFn: (data) => {
        return new Promise((resolve, reject) => {
          request
          .post(`/image-upload`)
          .attach('image', data.file)
          .end(function(error, response){
            resolve(response);
          });
        });
      }
    })

    // Async action with generated request
    Widget.registerAsync({
      name: 'GET_MY_WIDGET', 
      url: Widget.url + '/my-widget/:id',
      method: 'GET',
      reducerFn:(state, action) => { return action.data }, 
    })

    // Sync action
    Widget.registerSync({
      name: 'GET_LOCAL_WIDGET', 
      reducerFn: (state, action) => { return action.data }
    })

    export default Widget;

**2) Add the Resource's reducer to the your store:**

    // store.js
    import {combineReducers} from 'redux';
    import { createStore } from 'redux'
    import Widget from '/src/app/widget/widgetResource'

    const rootReducer = combineReducers({
      widgets: Widget.reducer,
    })

    function configureStore(){
      return createStore(rootReducer)
    };

    export default configureStore();

**3) Configure the Resource module to use your Store's dispatch function:**  

    // index.js
    import React from 'react';
    import { Provider } from 'react-redux'; 

    import Store from '/src/app/store/store'
    import Resource from '/src/app/utils/resource';

    import App from '/src/app/app';

    Resource.configure({dispatch: Store.dispatch})

    ReactDOM.render(
      <Provider store={Store}>
        <App />
      </Provider>,
       document.getElementById('root')
    );

**4) Import the Resource into the appropriate file and start dispatching actions!**

    // widgetPage.js
    import React, {Component} from 'react';  
    import {connect} from 'react-redux';  
    import Widget from '/src/app/widget/widgetResource'

    class WidgetsPage extends Component {
      componentWillMount(){
        Widget.dispatchAsync('$QUERY')
      }

      componentWillUnmount(){
        Widget.dispatchSync('$CLEAR_ERRORS')
      }

      render(){
        if ( this.props.widgetsErrors ){
          const widgets = this.prpos.widgetsErrors.map(error => {
            return (<div className='widget'>{error.detail}</div>)
          })
        }

        if ( this.props.widgetsData ){
          const widgets = this.prpos.widgetsData.map(widget => {
            return (<div className='widget'>{widget.quantity}</div>)
          })
        }

        return (
          <div className='widgets-page'>
            {errors}
            {widgets}
          </div>
        )
      }

    }

    function mapStateToProps(state, ownProps) { 
      return {
        widgetsData: state.widgets.data,
        widgetsErrors: state.widgets.errors
      };
    };

    export default connect(mapStateToProps)(WidgetsPage);
  

## Docs

### Working with Async actions  

Async (typically request to remote servers, but any async, promise based function should be fine) actions to query a server should use the `super-agent` module, as **r3** is designed to work with seamlessly with that module. I've found that it's more flexible then the Fetch API and there was less I had to code from scratch. Remote actions should be wrapped in a promise, otherwise **r3** will throw an error.

Example of a custom async server request:

    const uploadImage = (data) => {
      return new Promise((resolve, reject) => {
        request
        .post(`/image-upload`)
        .set('AUTHORIZATION', `Bearer ${sessionStorage.jwt}`)
        .attach('image', data.file)
        .end(function(error, response){
          resolve(response);
        });
      });
    } 

When registering a new Async action, if the `resourceFn` is ommitted, **r3** will apply a default resource action. 

### Default Remote Actions  

**r3** has several built in RESTful functions to make remote requests easier. They are:  

  - $QUERY  
  - $GET  
  - $CREATE  
  - $UPDATE  
  - $DELETE  

These predefined functions make RESTful requests to a server simple. Custom requests can generated by calling `.registerAsync`. Even more customization is possible when passing a `resouceFn` to the `.registerAsync` function.

### Working with Sync actions  

Sync actions use standard Redux actions. When registering a new sync action, we declare the name of the action - all uppercase, as per Redux convention - which will also be used as the name of our case. The reducerFn is added to our reducer. 
  
### Error handling  

**r3** comes equipped with a lightweight error handling system. When a new Resource is created, it's state is an object with two keys:  
`{data: [], errors: []}`  
The data key holds object data and functions like a normal Redux state. The errors key is used in conjunction with the built in $ERROR and $CLEAR_ERRORS actions. If a dispatched action's response returns an error ( `!response.ok` ), an error is thrown ( and caught ). The $ERROR action is then dispatched to our store, where the error is added to the error key. This value can be accessed in our component and rendered to your users like any other property in our store. 

The $CLEAR_ERRORS action should be dispatched whnen a component unmounts to reset the errors key or can be used during another point in the component lifecycle to clear errors. 

### URL Params   
  
When using the dynamically created request or default CRUD requests, **r3** will attempt to parse any url params. For example, if we're working with a RESTful resouce of a Widget, the url to get a widget might be ('/widgets/:id'). If we want to fetch a widget at `'/widgets/12'`, our dispatched action should include an `id` parameter in top level of the the data object:

    WidgetResource.dispatchAsync('$GET', {id: 12})

If our param is something different (eg `:slug`), then our dispatched action would look like:

    WidgetResource.dispatchAsync('GET_BY_SLUG', {slug: 'my-slug'})

If the parameter is not in the top level of the hash, `r3` will attempt to recursively search through the data object and parse the param. However, this is **not** recommended and the param should always be included in the first level of the data object. 

## API

**.configure(options)**  

    options = {  
      dispatch: func.isRequired,  
    }  

Assign the store's dispatch function to our Resource. This allows us to skip binding our action creators. Call this in your `index.js` file before your render function.

**.registerAsync(options)**

Register a new Asynchronous action. Asynchronous actions dispatch an sync request, then once the response is received, dispatches the data to the store or dispatches an Error action. This creates the custom resource action and reducer action, and adds both to the current resource.

    options = {  
      name: string.isRequired,  
      url: string.isRequired, 
      method: string.isRequired,  
      reducerFn: func.isRequired,
      resource: func  
    }  


**.registerSync(options)**

Register a new Synchronous action. Synchronous actions dispatch actions directly to the store. This creates a new reducer action, and adds it to the current resource.

    options = {  
      name: string.isRequired,  
      reducerFn: func.isRequired  
    }  
  
**.updateReducerAction(name, reducerFn)**

    name: string.isRequired
    reducerFn: func.isRequired

Updates a reducer action (such as a default reducer action). Accepts the name of the reducer case (not prefixed), and the callback reducer function.

**.updateResourceAction(name, resourceFn)**

    name: string.isRequired
    resourceFn: func

Updates a resource action (such as a default resource action). Accepts the name of the resource action (not prefixed), and the callback resource function.

**.registerRemoteActions()**

Registers the default remote action and reducers for CRUD operations: query(index), get(individual resource), create, update, and delete. See Docs for reference on how these functions work.

## To Do

  - Create CLI for generating a new resource
  - More robust test coverage

## Contributing

If you'd like to contribute, fork this repo and create a new feature branch with your changes. Write some tests for the code, and make them pass. Once you submit a pull request, I'll review your code and commit it if everything looks good. 
