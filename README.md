# r3 Library

**r3-library** (short for React-Redux-Resource) is a small library that allows users to easily create and dispatch actions in an object oriented fashion.

Easily create synchronous and asynchronous actions
Registering new actions automatically updates your reducers.
Consistent, scoped naming conventions allows for easier scaling and maintenance

This project was inspired by AngularJS $Resource functionality for making HTTP requests. The original goal was to make it easier to handle HTTP requests /async actions in Redux, I quickly expanded the scope to also handle other async Promise based actions as well as synchronous actions. 

EDIT: 12/29/17  
  - Ability to dispatch error handling actions  
  - Ability to dispatch both Async and Sync actions  
  - Better test coverage  
  - Refactored request handling using `superagent` module  
  - General code cleanup  

## Installation

To install, run:
`npm install r3-library --save`

Make sure you have **redux** installed. 

**1) To create a new Resource, pass an options object during initialization with at least a `name` property, then export the resource:**  
  
**A simple example:**  

    // widgetResource.js    
    import Resource from 'r3-library'  
      
    const Widget = new Resource({  
      name: 'widgets',  
    })  
      
    export default Widget;    

   
**More complex example:**  
    
    // widgetResource.js 
    import Resource from 'r3-library'

    const Widget = new Resource({
      name: 'widgets', 
      url: 'http://localhost:3000/widgets', 
      headers: {'Content-Type': "application/json"}, 
      state: []
    })

    // Custom action
    Widget.registerNewAction({
      name: 'GET_CURRENT_WIDGET', 
      url: 'http://localhost:3000/widgets', 
      method: 'GET', 
      reducerFn:(state, action) => { return action.data }
    })

    // Example of promise-based, non remote resource action below

    // Promise based resource action
    const localWidgetAction = () => {
      return new Promise((resolve, reject) => {
        resolve({widgets: true})
      });
    }

    // Corresponding reducer
    const localWidgetReducer = (state, action) => {
      if (action.widgets){
        // do some stuff
        return updatedState
      } 

      return state
    }

    // Then register the action
    Widget.registerNewAction({
      name: 'localWidget', 
      url: '/local-widget', 
      method: 'POST',
      resourceFn: localWidgetAction, 
      reducerFn: localWidgetReducer
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



**4) Import the Resource and your store into the appropriate file. Because the dispatch action returns a function that accepts `dispatch` as an arg, we pass `Store.dispatch` as an argument to the returned function**

    // widgetPage.js
    import React, {Component} from 'react';  
    import {connect} from 'react-redux';  
    import Widget from '/src/app/widget/widgetResource'

    class WidgetsPage extends Component {
      componentWillMount(){
        Widget.dispatchAction('$QUERY')
      }

      componentWillUnmount(){
        Widget.dispatchAction('$CLEAR_ERRORS')
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

**Working with Async actions**


**Working with Sync actions**


**Error handling**
**r3** comes equipped with a lightweight error handling system. When a new Resource is created, it's state is an object with two keys:  
`{data: [], errors: []}`  
The data key holds object data and functions like a normal Redux state. The errors key is used in conjunction with the built in $ERROR and $CLEAR_ERRORS actions. If a dispatched action's response returns an error ( `!response.ok` ), an error is thrown ( and caught ). The $ERROR action is then dispatched to our store, where the error is added to the error key. This value can be accessed in our component and rendered to your users like any other property in our store. 

The $CLEAR_ERRORS action should be dispatched whnen a component unmounts to reset the errors key or can be used during another point in the component lifecycle to clear errors. 

**Remote Actions**
Remote actions to query a server should use the `super-agent` module, as **r3** is designed to work with seamlessly with that module. I've found that it's more flexible then the Fetch API and there was less I had to code from scratch. Remote actions should be wrapped in a promise, otherwise **r3** will throw an error.

Example of a custom remote action:

  const uploadImage = (data) => {
    return new Promise((resolve, reject) => {
      request
      .ppst(`/image-upload`)
      .set('AUTHORIZATION', `Bearer ${sessionStorage.jwt}`)
      .attach('image', data.file)
      .end(function(error, response){
        resolve(response);
      });
    });
  }


## API

**.configure(options)**  

    options = {  
      dispatch: func.isRequired,  
    }  

Assign the store's dispatch function to our Resource. This allows us to skip binding our action creators. Call this in your `index.js` file before your render function.

**.registerNewAction(options)**

Register a new action. This creates the custom resource action and reducer action, and adds both to the current resource.

    options = {  
      name: string.isRequired,  
      url: string.isRequired, 
      method: string.isRequired,  
      reducerFn: func.isRequired  
    }  

**.addResourceAction(options)**

Create a new resource action. Accepts name of the action (not prefixed), target Url, and the callback resource function. If no resource function is provided, r3-library will add a generic function that sends a request to the target url with the specified method and the Resource's declared headers. *NOTE: must match a reducer name.*

    options = {  
      name: string.isRequired,  
      url: string.isRequired,  
      method: string.isRequired,  
      resourceFn: func  
    }

**.addReducerAction(name, reducerFn)**

    name: string.isRequired
    reducerFn: func.isRequired

Creates a new reducer action. Accepts the name of the reducer case (not prefixed), and the callback reducer function. Passing the name of a reducer that already exists will not overwrite that reducer. Use `updateReducerAction` instead. *NOTE: must match a resource name.*

**.updateReducerAction(name, callback)**

    name: string.isRequired
    reducerFn: func.isRequired

Updates a reducer action (such as a default reducer action). Accepts the name of the reducer case (not prefixed), and the callback reducer function.

**.updateResourceAction(name, resourceFn)**

    name: string.isRequired
    resourceFn: func

Updates a resource action (such as a default resource action). Accepts the name of the resource action (not prefixed), and the callback resource function. If no resource function is provided, r3-library will add a generic function that sends a request to the target url with the specified method and the Resource's declared headers.

**.registerRemoteActions()**

Registers the default remote action and reducers for CRUD operations: query(index), get(individual resource), create, update, and delete.

## To Do

  - Create CLI for generating a new resource
  - More robust test coverage

## Contributing

If you'd like to contribute, fork this repo and create a new feature branch with your changes. Write some tests for the code, and make them pass. Once you submit a pull request, I'll review your code and commit it if everything looks good. 
