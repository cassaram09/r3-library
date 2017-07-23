import HTTP from './http'
import Defaults from './defaults'

class Resource extends HTTP {
  constructor(name, url, headers){
    super();

    this.name = name
    this.url = url;
    this.headers = headers;

    this.reducerActions = {};
    this.resourceActions = {};

    this.dispatchAction = (action, data) => {
      const resource = this;
      const name = this.name + '_' + action
      return (dispatch) => {
        return resource.resourceActions[name](data).then( response => {
          var res = resource
          
          dispatch({type: name, data: response})
        }).catch(error =>{
          throw(error);
        })
      }
    }

    this.reducer = (state = [], action) => {
      var resource = this;
      if (resource.reducerActions[action.type]) {
        return resource.reducerActions[action.type](state, action)  
      }
      return state;
    }

    this.registerNewAction = (url, name, method, reducerFn) => {
      this.addResourceAction(url, name, method)
      this.addReducerAction(name, reducerFn);
      return this;
    }

    this.addResourceAction = (url, name, method) => {
      var actionName = this.name + '_' + name
      this.resourceActions[actionName] = (data) => {
        var request = HTTP.createRequest(url, method, data, this.createHeaders())
        return HTTP.fetchRequest(request)
      };
      return this;
    }

    this.addReducerAction = (name, callback) => {
      var actionName = this.name + '_' + name
      this.reducerActions[actionName] = this.reducerActions[actionName] || callback;
      return this;
    }

    this.updateReducerAction = (name, callback) => {
      var actionName = this.name + '_' + name
      this.reducerActions[actionName] = callback;
      return this;
    }

    this.updateResourceAction = (name, callback) => {
      var actionName = this.name + '_' + name
      this.reducerActions[actionName] = callback;
      return this;
    }


    this.createHeaders = () => {
      return new Headers(this.headers)
    }

    this.registerDefaults = () => {
      const obj =  Defaults
      for ( let name in obj) {
        var url = this.url + obj[name].url;
        var method = obj[name].method
        this.addResourceAction(url, name, method)
        this.addReducerAction(name, obj[name].reducerFn)
      }
      return this;
    }

  }

}

export default Resource;