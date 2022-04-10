'use strict'
module.exports = {
  publicPath: '/',
  outputDir: 'dist',
  assetsDir: 'static',
  devServer: {
    proxy: {
      '^/api': {
        target: 'http://127.0.0.1:18080/',
        changeOrigin: true,
      },
    },
  }
}
