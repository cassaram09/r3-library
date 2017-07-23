describe('Resource class', function () {
    it('creates a new resource', function () {
        var resource = new Resource('resource', '/resources')
        expect(resource.name).toEqual('resource');
    });
});