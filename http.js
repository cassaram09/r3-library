class HTTP {
  constructor(){}
  static createRequest(url, method, body, headers) {

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

  static $get(url, id, headers){
    var request = HTTP.createRequest(url, 'GET', id, headers);
    return HTTP.fetchRequest(request)
  }

  static $patch(url, data, headers){
    var request = HTTP.createRequest(url, 'PATCH', data, headers);
    return HTTP.fetchRequest(request)
  }

  static $delete(url, id, headers){
    var request = HTTP.createRequest(url, 'DELETE', id, headers);
    return HTTP.fetchRequest(request)
  }

}

export default HTTP;
    