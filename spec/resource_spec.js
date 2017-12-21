const r3 = require("../lib/index");
const Promise = require('promise')

const Resource = r3.default;

describe('Resource class', function () {

  it('creates a new resource', function () {
      const headers = {'CONTENT': 'JSON'}
      const state = []
      const res = new Resource({name: 'resource', url: '/resources', headers: headers, state: state});
    
      expect(res.name).toEqual('resource');
      expect(res.url).toEqual('/resources');
      expect(res.headers).toEqual(headers);
      expect(res.state).toEqual([]);
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

      res.registerNewAction({name: 'getCurrentUser', url: '/current-user', method: 'GET', reducerFn: (state, action) => {return action.data} })

      var key = Object.keys(res.resourceActions)[0]
      expect(res.resourceActions[key]).toBeTruthy()
      expect(key).toEqual('resource_getCurrentUser')
  });

  // it('successfully dispatches actions', function () {
  //     const res = new Resource({name: 'resource', url: '/resources'})

  //     res.addReducerAction('test', (state, action) => {return action.data})

  //     res.resourceActions.resource_test = () => {
  //       var promise = new Promise((resolve, reject) => {
  //         true ? resolve({data: 'myData'}) : reject(Error("Error"));
  //       });
  //       return promise; 
  //     }

  //     expect(data).toEqual('myData')
  // });

});

