import HTTP from './http'
import * as reducer from './defaultReducerActions'

class Resource extends HTTP {
  constructor(name, url, headers){
    super();

    this.name = name
    this.url = url;
    this.headers = headers;
    this.reducerActions = reducer.actions;

    this.dispatchAction = (action, data) => {
      const resource = this;
      return (dispatch) => {
        return resource[action](data).then( response => {
          dispatch({type: action, data: response})
        }).catch(error =>{
          throw(error);
        })
      }
    }

    this.addReducerAction = (name, callback) => {
      this.reducerActions[name] = this.reducerActions[name] || callback;
    }

    this.reducer = (state = [], action) => {
      var resource = this;
      if (resource.reducerActions[action.type]) {
        return resource.reducerActions[action.type](state, action)  
      }
      return state;
    }

    this.registerAction = (url, name, method, reducerFn) => {
      this[name] = (data) => {
        var request = HTTP.createRequest(url, method, data, this.createHeaders())
        return HTTP.fetchRequest(request)
      };
      this.addReducerAction(name, reducerFn);
    }

    this.updateReducerAction = (name, callback) => {
      this.reducerActions[name] = callback;
    }

  }

  createHeaders(){
    return new Headers(this.headers)
  }

  query() {
    var request = HTTP.createRequest(this.url, 'GET', null, this.createHeaders())
    return HTTP.fetchRequest(request)
  }

  get(id) {
    var url = this.url + '/' + id
    var request = HTTP.createRequest(url , 'GET', null, this.createHeaders());
    return HTTP.fetchRequest(request);
  }

  create(data){
    var request = HTTP.createRequest(this.url, 'POST', data, this.createHeaders());
    return HTTP.fetchRequest(request)
  }

  update(data) {
    var url = this.url + '/' + data.id
    var request = HTTP.createRequest(url, 'PATCH', data, this.createHeaders());
    return HTTP.fetchRequest(request);
  }

  delete(id){
    var url = this.url + '/' + id
    var request = HTTP.createRequest(url, 'DELETE', null, this.createHeaders());
    return HTTP.fetchRequest(request)
  }

}

export default Resource;