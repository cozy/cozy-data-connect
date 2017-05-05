'use strict'

const {production} = require('./webpack.vars')
const path = require('path')

module.exports = {
  module: {
    loaders: [
      {
        test: /\.svg$/,
        include: /(sprites|icons)/,
        loader: 'svg-sprite?' + JSON.stringify({
          name: '[name]_[hash]',
          spriteModule: path.join(__dirname, 'csp-proof-sprite')
        })
      },
      {
        test: /\.(png|gif|jpe?g|svg)$/i,
        exclude: /(sprites|icons)/,
        loader: `file?path=img&name=[name]${production ? '.[hash]' : ''}.[ext]`
      }
    ]
  }
}
