function removeData(state, action){
  const newState = Object.assign([], state);
  const indexToDelete = state.findIndex(exercise => {
    return exercise.id == action.data.id
  })
  newState.splice(indexToDelete, 1);
  return newState;
}

function addData(state, action){
  return [ ...state.filter(element => element.id !== action.data.id), Object.assign({}, action.data)]
}

export default {
  query: {
    method: 'GET',
    url: '',
    reducerFn: (state, action) => { return action.data },
  },
  get: {
    method: 'GET',
    url: '/:id',
    reducerFn: (state, action) => { return addData(state, action) },
  },
  create: {
    method: 'POST',
    url: '',
    reducerFn: (state, action) => { return addData(state, action) },
  },
  update: {
    method: 'PATCH',
    url: '/:id',
    reducerFn: (state, action) => { return addData(state, action) },
  },
  delete: {
    method: 'DELETE',
    url: '/:id',
    reducerFn: (state, action) => { return removeData(state, action) },
  }
}
