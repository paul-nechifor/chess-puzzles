const webpack = require('webpack');

module.exports = {
  output: {
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['', '.js'],
    moduleDirectories: ['node_modules'],
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
        },
      },
    ],
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
    }),
  ],
};
