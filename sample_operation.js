// Canonical async "operation" or "helper function" for a language-pacakge
export function sample(arg1, arg2) {
  return state => {
    return new Promise((resolve, reject) => {
      try {
        state.output = arg1 + arg2;
        resolve(state);
      } catch (error) {
        reject(error);
      }
    });
  };
}

// Canonical sync "operation" or "helper function" for a language-pacakge
export function sample(arg1, arg2) {
  return state => {
    state.output = arg1 + arg2;
    return state;
  };
}
