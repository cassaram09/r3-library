const r3 = require("../lib/resource");
const Promise = require('promise')

const Resource = r3.default;

describe('Resource class', function () {

  it('creates a new resource', function () {
      const headers = {'CONTENT': 'JSON'}
      const res = new Resource('resource', '/resources', headers);
    
      expect(res.name).toEqual('resource');
      expect(res.url).toEqual('/resources');
      expect(res.headers).toEqual(headers);
      expect(res.state).toEqual([]);
  });

  it('sets the default state correctly', function () {
      const first = new Resource('first', '/first', null);
      const second = new Resource('second', '/second', null).configureState(false);
      const third = new Resource('second', '/second', null).configureState('cat');
      
      expect(first.state).toEqual([]);
      expect(second.state).toEqual(false);
      expect(third.state).toEqual('cat');
  });

  it('registers default functions when called', function () {
      const defaults = new Resource('defaults', '/resources', {}, []).registerDefaults();
      const noDefaults = new Resource('noDefaults', '/resources', {}, [])

      defaultKeys = Object.keys(defaults.resourceActions)
      expect(defaultKeys.length).toEqual(5);

      noDefaultKeys = Object.keys(noDefaults.resourceActions)
      expect(noDefaultKeys.length).toEqual(0);
  });

  it('successfully registers new actions', function () {
      const res = new Resource('resource', '/resources', null, []);

      res.registerNewAction('/current-user', 'getCurrentUser', 'GET', (state, action) => {return action.data})

      var key = Object.keys(res.resourceActions)[0]
      expect(res.resourceActions[key]).toBeTruthy()
      expect(key).toEqual('resource_getCurrentUser')
  });

  // it('successfully dispatches actions', function () {
  //     const res = new Resource('resource', '/resources')

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

