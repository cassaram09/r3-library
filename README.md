# r3 Library

**r3-library** (short for React-Redux-Resource) is a small library to handle resources in a React-Redux application more efficiently. This library allows users to create a Resource handles remote and promise based actions. It dynamically generates the reducer for use by the store. 

This project was inspired by AngularJS $Resource functionality for making HTTP requests. While the original goal was only to handle HTTP requests, it was useful to also be able to use non-HTTP, promise-based actions as part of the resource's capabilities. 

## Installation

To install, run:
`npm install r3-library --save`

Make sure you have **redux** installed. 

1) To create a new Resource, pass an options object during initialization with at least a `name` property, then export the resource:

```
// widgetResource.js 
// simple example. 

import Resource from 'r3-library'

const Widget = new Resource({
  name: 'widgets', 
})

export default Widget;
```

```
// widgetResource.js 
// More complex example!

import Resource from 'r3-library'

const headers = {'Content-Type': "application/json"}

const Widget = new Resource({
  name: 'widgets', 
  url: 'http://localhost:3000/widgets', 
  headers: headers, 
  state: []
})

// Custom action
Widget.registerNewAction({
  name: 'getCurrentWidget', 
  url: API.base + '/current-widget', 
  method: 'GET', 
  reducerFn: ( (state, action) => action.data ) 
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
  } else {
    return state
  }
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

```

2) Add the Resource's reducer to the your store:

```
// store.js

import {combineReducers} from 'redux';
import { createStore, applyMiddleware} from 'redux'
import Widget from '/src/app/widget/widgetResource'

const rootReducer = combineReducers({
  widgets: Widget.reducer,
})

function configureStore(){
  return createStore(rootReducer)
};

export default configureStore();
```

3) Configure the Resource module to use your Store's dispatch function:

```
// index.js

import React from 'react';
import { Provider } from 'react-redux'; 

import Store from '/src/app/store/store'
import Resource from '/src/app/utils/resource';

import App from '/src/app/app';

Resource.setDispatch(Store.dispatch)

ReactDOM.render(
  <Provider store={Store}>
    <App />
  </Provider>,
   document.getElementById('root')
);

```

4) Import the Resource and your store into the appropriate file. Because the dispatch action returns a function that accepts `dispatch` as an arg, we pass `Store.dispatch` as an argument to the returned function*

`Resource.dispatchAction('update', this.state)(Store.dispatch)`

```
import React, {Component} from 'react';
import {connect} from 'react-redux';  

import Widget from '/src/app/widget/widgetResource'

class WidgetsPage extends Component {
  componentWillMount(){
    Widget.dispatchAction('query')
  }

  render(){
    if ( this.props.widgets ){
      const widgets = this.prpos.widgets.map(widget => {
        return (<div className='widget'>{widget.quantity}</div>)
      })
    }

    return (
      <div className='widgets-page'>
        {widgets}
      </div>
    )
  }

}

function mapStateToProps(state, ownProps) { 
  return {widgets: state.widgets};
};

export default connect(mapStateToProps)(WidgetsPage);
```

## API

**.setDispatch(dispatchFn)**

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
  - Remove necessity for call to Store.dispatch when dispatching an action*
  - More robust test coverage
  - Better request creation and handling

## Contributing

If you'd like to contribute, fork this repo and create a new feature branch with your changes. Write some tests for the code, and make them pass. Once you submit a pull request, I'll review your code and commit it if everything looks good. 
