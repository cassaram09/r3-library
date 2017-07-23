const r3 = require("../lib/resource");

const Resource = r3.default;

describe('Resource class', function () {
    it('creates a new resource', function () {
        var headers = {'CONTENT': 'JSON'}
        var res = new Resource('resource', '/resources', headers, []);
      
        expect(res.name).toEqual('resource');
        expect(res.url).toEqual('/resources');
        expect(res.headers).toEqual(headers);
        expect(res.state).toEqual([]);
    });
});