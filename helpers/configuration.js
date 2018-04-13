module.exports = {
  createlink: function (route) {
    // this function should be used to generate internal links
    // supports adding a context path in case we install the application behind another layer
    return (process.env.CONTEXT_PATH || '')+route;
  }
}
