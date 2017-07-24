# r3 Library

**r3-library** (short for React-Redux-Resource) is a small library to handle remote API resources in a CRUD React-Redux application more efficiently. This library creates a new resource predefined with a set of RESTful CRUD actions, but also offers flexibility for custom actions. 

## Installation

To install, run:
`npm install r3-library`

Make sure you have **redux-thunk** included in your middleware. 

```
import { createStore, applyMiddleware} from 'redux'
import rootReducer from './rootReducer'
import thunk from 'redux-thunk'

function configureStore(){
  return createStore(rootReducer, applyMiddleware(thunk))
};

export default configureStore();
```

To create a new RESTful resource, create a new file and export the resource:

```
import Resource from 'r3-library'

const url = '/users'

const headers = {
  'Content-Type': 'application/json',
  'AUTHORIZATION': `Bearer ${sessionStorage.jwt}`
}

const User = new Resource('user', url, headers, [])
  .registerDefaults()
  .registerNewAction('/password-reset', 'changePassword', 'POST')
  .registerNewAction(url, 'uploadImage', 'GET')
  .registerNewAction('/current-user', 'getCurrentUser', 'GET', (state, action) => {return action.data})
  .addReducerAction('update', (state, action) => {return action.data})
  .addResourceAction('/users', 'update', 'PATCH');

export default User;
```

Then call the resource where you'd like to use it:

```
import React, {Component} from 'react';
import {connect} from 'react-redux';  
import {bindActionCreators} from 'redux'; 

import User from './userResource'
import UserForm from './userForm'

class UserProfile extends Component {
  constructor(props){
    super(props) 

    this.state = {
      user: this.props.user,
    }
    this.updateUser = (event) => {
      event.preventDefault();
      var state = Object.assign({}, this.state)
      delete state.user.avatar;
      // calls the User resource's update action, passing state as data
      this.props.actions.dispatchAction('update', state)
      return this.toggleEdit();
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

function mapDispatchToProps(dispatch){
  return {
    // Connect your resource's dispatch action to this component
    actions: bindActionCreators({dispatchAction: User.dispatchAction}, dispatch)
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(UserProfile);
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

**.registerDefaults()**

Registers the default action/reducers for CRUD operations: query(index), get(individual resource), create, update, and delete.

## To Do

  - Build out test coverage 
  - Install jsLint
  - CLI for generating a new resource

## Contributing

If you'd like to contribute, fork this repo and create a new feature branch with your changes. Write some tests for the code, and make them pass. Once you submit a pull request, I'll review your code and commit it if everything looks good. 
