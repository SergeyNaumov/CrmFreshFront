if (process.env.NODE_ENV === 'development') {
  module.exports = {
    runtimeCompiler: true,
    publicPath: '/',
    //VUE_APP_BACKEND_BASE: '/backend'
  }
}
else{
  module.exports = {
    runtimeCompiler: true,
    publicPath: '/',
    //VUE_APP_BACKEND_BASE: '/backend'
  }
}

