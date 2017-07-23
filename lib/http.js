'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HTTP = function () {
  function HTTP() {
    _classCallCheck(this, HTTP);
  }

  _createClass(HTTP, null, [{
    key: 'createRequest',
    value: function createRequest(url, method, body, headers) {

      var urlParams = url.match(/:(\w+)/ig);

      if (urlParams) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = urlParams[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var param = _step.value;

            url = url.replace(param, HTTP.findValueByKey(body, param.substring(1)));
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }

      // Not permitted to send a body with GET/HEAD requests
      if (body && method != 'GET') {
        body = JSON.stringify(body);
      } else {
        body = undefined;
      }

      var request = new Request(url, {
        method: method,
        headers: new Headers(headers),
        body: body
      });

      return request;
    }
  }, {
    key: 'fetchRequest',
    value: function fetchRequest(request) {
      return fetch(request).then(function (response) {
        return response.json();
      }).catch(function (error) {
        return error;
      });
    }
  }, {
    key: '$post',
    value: function $post(url, data, headers) {
      var request = HTTP.createRequest(url, 'POST', data, headers);
      return HTTP.fetchRequest(request);
    }
  }, {
    key: '$get',
    value: function $get(url, data, headers) {
      var request = HTTP.createRequest(url, 'GET', data, headers);
      return HTTP.fetchRequest(request);
    }
  }, {
    key: '$patch',
    value: function $patch(url, data, headers) {
      var request = HTTP.createRequest(url, 'PATCH', data, headers);
      return HTTP.fetchRequest(request);
    }
  }, {
    key: '$delete',
    value: function $delete(url, data, headers) {
      var request = HTTP.createRequest(url, 'DELETE', data, headers);
      return HTTP.fetchRequest(request);
    }
  }, {
    key: 'findValueByKey',
    value: function findValueByKey(obj, key) {
      var match;
      for (var prop in obj) {
        if (key === prop) {
          return obj[prop];
        } else {
          return HTTP.findValueByKey(obj[prop], key);
        }
      }
      return null;
    }
  }]);

  return HTTP;
}();

exports.default = HTTP;