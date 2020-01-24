(function(state) {
  execute(
    alterState(() => {}),
    alterState((state) => {}), // function(state) { }
    alterState(() => {})
  )(state);
})(state)



[
  (alterState(() => {}), alterState(() => {}), alterState(() => {}))
].reduce((acc, v) => {
  return v(state).then(acc)
}, new Promise);


f(state).then((state) => return state).then()




