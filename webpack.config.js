const autoprefixer = require('autoprefixer');

module.exports = {
  entry: [
    './src/index.jsx'
  ],
  output: {
    path: __dirname + '/dist',
    publicPath: '/',
    filename: 'bundle.js'
  },
  devServer: {
    contentBase: './dist',
    hot: true
  },
  target: 'web',
  stats: 'errors-only',
  module: {
    rules: [
      { 
        test: /\.xml$/, 
        exclude: /node_modules/,
        use: {
          loader: 'xml-loader',
          options: {
            explicitArray: true,
            explicitChildren: true,
            preserveChildrenOrder: true,
            attrkey: "attributes",
            childkey: "children",
            charkey: "text"
          },
        },
      },
      {
        test: /\.txt$/,
        exclude: /node_modules/,
        use: 'raw-loader'
      },
      {
        test: /\.jsx$/,
        exclude: /node_modules/,
        loader: ['babel-loader?presets[]=react'],
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => [autoprefixer({ browsers: ['last 2 versions'] })],
            },
          },
        ],
      },
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.jsx'],

  },
};
