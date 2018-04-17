var path = require('path');
var webpack = require('webpack');

module.exports = {
  devtool: 'source-map',
  entry: ['bootstrap-loader', './static/js/main.js'],
  plugins: [
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
    }),
  ],
  output: {
    path: path.join(__dirname, 'static', 'build', 'js'),
    publicPath: path.resolve(__dirname, '/static/build/js/'),
    filename: 'bundle.js',
    sourceMapFilename: 'bundle.map.js'
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style-loader!css-loader' },
      { test: /\.(woff2?|svg)$/, loader: 'url-loader?limit=10000' },
      { test: /\.(ttf|eot)$/, loader: 'file-loader' },
    ],
  },
};
