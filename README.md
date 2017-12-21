# r3 Library

**r3-library** (short for React-Redux-Resource) is a small library to handle resources in a React-Redux application more efficiently. This library creates a new resource predefined with a set of RESTful CRUD actions, but also offers flexibility for custom actions. 

## Installation

To install, run:
`npm install r3-library --save`

Make sure you have **redux** installed. 

```
import { createStore, applyMiddleware} from 'redux'
import rootReducer from './rootReducer'

function configureStore(){
  return createStore(rootReducer)
};

export default configureStore();
```

To create a new RESTful resource, create a new file and export the resource:

```
// Simple example. 

import Resource from 'r3-library'

const Widget = new Resource({
  name: 'widgets', 
  url:  '/widgets', 
  headers: {}, 
  state: []
})

Widget.registerRemoteActions();

export default Widget;
```

```
// More complex example!

import Resource from 'r3-library'
import API from '/src/app/utils/api';
import request from 'superagent';

const User = new Resource({
  name: 'user', 
  url:  API.base + '/users', 
  headers: API.headers, 
  state: {}
})

// fetches data for the current user
User.registerNewAction({
  name: 'getCurrentUser', 
  url: API.base + '/current-user', 
  method: 'GET', 
  reducerFn: ( (state, action) => action.data ) 
})

// updates data for the current user, returns updated user
User.registerNewAction({
  name: 'update', 
  url: User.url + '/:id', 
  method: 'PATCH', 
  reducerFn: ( (state, action) => action.data ) 
})

// handle image upload - example of a custom action
const uploadImageAction = (data) => {
  return new Promise((resolve, reject) => {
    const req = request.patch(User.url + '/' + data.id).set('AUTHORIZATION', `Bearer ${sessionStorage.jwt}`)
      req.attach('user[avatar]', data.file);
      req.end(function(error, response){
        resolve(response.body);
      });
  });
}

User.registerNewAction({
  name: 'uploadImage', 
  url: User.url + '/:id', 
  method: 'PATCH', 
  reducerFn: ( (state, action) => action.data ),
  resourceFn: uploadImageAction
})

export default User;

```

Then call the resource where you'd like to use it:
`Resource.dispatchAction('update', this.state)(Store.dispatch)`

```
import React, {Component} from 'react';
import {connect} from 'react-redux';  

import User from './userResource'
import UserForm from './userForm'

import Store from '../store/store'

class UserProfile extends Component {
  constructor(props){
    super(props) 

    this.state = {
      user: this.props.user,
    }

    this.updateUser = (event) => {
      event.preventDefault();
      User.dispatchAction('update', this.state)(Store.dispatch)
    }
  }

  render(){
    return (
      <div id='userProfile'>
        <UserForm user={this.state.user} updateUser={this.updateUser} /> 
      </div>
    )
  }

}

function mapStateToProps(state, ownProps) { 
  return {user: state.user};
};

export default connect(mapStateToProps)(UserProfile);
```

## Resource Functions

The following are instance methods available on an instance of Resource. These methods are chainable (see example above).

**.registerNewAction(url, name, method, reducerFn)**

Register a new action. This creates the custom resource action and reducer action, adding both to the current resource.

**.addResourceAction(url, name, method)**

Create a new resource action. Accepts the target url, name of the action (not prefixed), and the callback function. *NOTE: must match a reducer name.*

**.addReducerAction(name, callback)**

Create a new reducer action. Accepts the name of the reducer case (not prefixed), and the callback function. *NOTE: must match a resource name.*

**.updateReducerAction(name, callback)**

Update/overwrite a reducer action (such as a default reducer action) 

**.updateResourceAction(name, callback)**

Update/overwrite a resource action (such as a default resource action)

**.registerRemoteActions()**

Registers the default remote action/reducers for CRUD operations: query(index), get(individual resource), create, update, and delete.

## To Do

  - Create CLI for generating a new resource
  - Build out test coverage
  - Build more robust request creation

## Contributing

If you'd like to contribute, fork this repo and create a new feature branch with your changes. Write some tests for the code, and make them pass. Once you submit a pull request, I'll review your code and commit it if everything looks good. 
