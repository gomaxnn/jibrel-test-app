'user strict'

const dotenv = require('dotenv').config(),
    HtmlWebPackPlugin = require('html-webpack-plugin'),
    webpack = require('webpack'),
    path = require('path')

const { API_URL, WSS_URL } = dotenv.parsed

require('babel-polyfill')

module.exports = {
    mode: 'development',
    entry: ['babel-polyfill', './front/src/index'],
    output: {
        path: path.join(__dirname, 'front/dist'),
        filename: 'bundle.js',
        publicPath: '/static/'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            },
            {
                test: /\.html$/,
                use: ['html-loader']
            }
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            CONFIG: {
                API_URL: JSON.stringify(API_URL),
                WSS_URL: JSON.stringify(WSS_URL)
            }
        }),
        new HtmlWebPackPlugin({
            template: './front/src/index.html',
            filename: './index.html'
        })
    ],
    devServer: {
        host: '0.0.0.0',
        port: 7200,
        contentBase: './front/dist',
        hot: true
    }
}
