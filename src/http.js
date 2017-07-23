class HTTP {
  constructor(){}

  static createRequest(url, method, body, headers) {

    var urlParams = url.match(/:(\w+)/ig)

    if (urlParams) {
      for ( let param of urlParams ){
        url = url.replace(param, HTTP.findValueByKey(body, param.substring(1)))
      }
    }

    // Not permitted to send a body with GET/HEAD requests
    if (body && method != 'GET'){
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

  static fetchRequest(request){
    return fetch(request).then(response => {
      return response.json();
    }).catch(error => {
      return error;
    })
  }

  static $post(url, data, headers){
    var request = HTTP.createRequest(url, 'POST', data, headers);
    return HTTP.fetchRequest(request)
  }

  static $get(url, data, headers){
    var request = HTTP.createRequest(url, 'GET', data, headers);
    return HTTP.fetchRequest(request)
  }

  static $patch(url, data, headers){
    var request = HTTP.createRequest(url, 'PATCH', data, headers);
    return HTTP.fetchRequest(request)
  }

  static $delete(url, data, headers){
    var request = HTTP.createRequest(url, 'DELETE', data, headers);
    return HTTP.fetchRequest(request)
  }

  static findValueByKey(obj, key){
    var match;
    for (var prop in obj) {
      if (key === prop) {
        return obj[prop]
      } else{
        return HTTP.findValueByKey(obj[prop], key)
      }
    }
    return null;
  }

}

export default HTTP;
