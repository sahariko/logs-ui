const path = require('path')
const webpack = require('webpack')
const { ModuleConcatenationPlugin } = webpack.optimize
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
	entry: './src/index.js',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'bundle.js'
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				loader: 'babel-loader',
				exclude: /node_modules/
			}
		]
	}
}

if (process.env.NODE_ENV === 'development') {
	Object.assign(module.exports, {
		devtool: '#eval-source-map',
	})
}

if (process.env.NODE_ENV === 'production') {
	module.exports.plugins = (module.exports.plugins || []).concat([
		new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: '"production"'
			}
		}),
		new ModuleConcatenationPlugin(),
		new UglifyJsPlugin({
			sourceMap: false,
			uglifyOptions: {
				compress: {
					drop_console: true,
				},
				output: {
					comments: false,
				}
			},
		}),
		new webpack.LoaderOptionsPlugin({
			minimize: true
		})
	])
}
