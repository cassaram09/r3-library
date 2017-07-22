class HTTP {
  constructor(){}

  static createRequest(url, method, body, headers) {

    var urlParams = url.match(/:(\w+)/ig)

    if (urlParams) {
      for ( let param of urlParams ){
        url = url.replace(param, body[param.substring(1)])
      }
      body = null;
    }

    if (body){
      body = JSON.stringify(body);
    }

    if (!headers){
      headers = new Headers();
    }

    var request = new Request(url, {
      method: method,
      headers: headers,
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

}

export default HTTP;
    