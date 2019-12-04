module.exports = {
  // This does nothing?
  escape: str => ('' + str).replace('$', '$').replace('{', '{').replace('}', '}')
};
