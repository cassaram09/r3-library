'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function removeData(state, action) {
  var newState = Object.assign([], state);
  var indexToDelete = state.findIndex(function (exercise) {
    return exercise.id == action.data.id;
  });
  newState.splice(indexToDelete, 1);
  return newState;
}

function addData(state, action) {
  return [].concat(_toConsumableArray(state.filter(function (element) {
    return element.id !== action.data.id;
  })), [Object.assign({}, action.data)]);
}

exports.default = {
  query: {
    method: 'GET',
    url: '',
    reducerFn: function reducerFn(state, action) {
      return action.data;
    }
  },
  get: {
    method: 'GET',
    url: '/:id',
    reducerFn: function reducerFn(state, action) {
      return addData(state, action);
    }
  },
  create: {
    method: 'POST',
    url: '',
    reducerFn: function reducerFn(state, action) {
      return addData(state, action);
    }
  },
  update: {
    method: 'PATCH',
    url: '/:id',
    reducerFn: function reducerFn(state, action) {
      return addData(state, action);
    }
  },
  delete: {
    method: 'DELETE',
    url: '/:id',
    reducerFn: function reducerFn(state, action) {
      return removeData(state, action);
    }
  }
};