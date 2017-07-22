export const actions = {
  query: (state, action) => { return action.data },
  get: (state, action) => { return addData(state, action) },
  create: (state, action) => { return addData(state, action) },
  update: (state, action) => { return addData(state, action) },
  delete: (state, action) => { return removeData(state, action) },
}

export function removeData(state, action){
  const newState = Object.assign([], state);
  const indexToDelete = state.findIndex(exercise => {
    return exercise.id == action.data.id
  })
  newState.splice(indexToDelete, 1);
  return newState;
}

export function addData(state, action){
  return [ ...state.filter(element => element.id !== action.data.id), Object.assign({}, action.data)]
}
