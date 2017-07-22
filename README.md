# r3 Library

r3-library (short for React-Readux-Resource) is a small library to handle remote API resources in a CRUD React-Redux application more efficiently. This library creates a new resource predefined with a set of RESTful CRUD actions right out of the box, but also offers flexiblity for custom actions. 

First, make sure you have `redux-thunk` included in your middleware. 

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

const User = new Resource('user', url, headers);

// register a custom action

User.addAction("changePassword", function(data) {
  var request = Resource.createRequest('/password-reset', 'POST', data, User.createHeaders())
  return Resource.fetchRequest(request)
})

export default User;
