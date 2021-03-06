'use strict'
const path = require('path')
const utils = require('./utils')
const webpack = require('webpack')
// 生产环境 配置文件
const config = require('../config')
// webpack 配置合并插件
const merge = require('webpack-merge')
// webpack基本配置
const baseWebpackConfig = require('./webpack.base.conf')
// webpack 复制文件和文件夹的插件
const CopyWebpackPlugin = require('copy-webpack-plugin')
// 自动生成 html 并且注入到 .html 文件中的插件
const HtmlWebpackPlugin = require('html-webpack-plugin')
// 提取css的插件
const ExtractTextPlugin = require('extract-text-webpack-plugin')
// webpack 优化压缩和优化 css 的插件
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
// js压缩插件
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
// 如果当前环境为测试环境，则使用测试环境
// 否则，使用生产环境
const env = require('../config/prod.env')

const webpackConfig = merge(baseWebpackConfig, {
  module: {
    rules: utils.styleLoaders({
      sourceMap: config.build.productionSourceMap,
      extract: true,
      usePostCSS: true
    })
  },
  // 是否开启 sourceMap
  devtool: config.build.productionSourceMap ? config.build.devtool : false,
  output: {
    path: config.build.assetsRoot,      // 编译输出的静态资源根路径 创建dist文件夹
    filename: utils.assetsPath('js/[name].[chunkhash].js'),  // 编译输出的文件名
     // 没有指定输出名的文件输出的文件名 或可以理解为 非入口文件的文件名，而又需要被打包出来的文件命名配置,如按需加载的模块
    chunkFilename: utils.assetsPath('js/[id].[chunkhash].js')
  },
  plugins: [
    // http://vuejs.github.io/vue-loader/en/workflow/production.html
      // 配置全局环境为生产环境
    new webpack.DefinePlugin({
      'process.env': env
    }),
     // js文件压缩插件
    new UglifyJsPlugin({
      uglifyOptions: {
        compress: { // 压缩配置
          warnings: false  // 不显示警告
        }
      },
      sourceMap: config.build.productionSourceMap, // 生成sourceMap文件
      parallel: true
    }),
    // extract css into its own file
     // 将js中引入的css分离的插件
    new ExtractTextPlugin({
      filename: utils.assetsPath('css/[name].[contenthash].css'),
      // Setting the following option to `false` will not extract CSS from codesplit chunks.
      // Their CSS will instead be inserted dynamically with style-loader when the codesplit chunk has been loaded by webpack.
      // It's currently set to `true` because we are seeing that sourcemaps are included in the codesplit bundle as well when it's `false`, 
      // increasing file size: https://github.com/vuejs-templates/webpack/issues/1110
      allChunks: true,
    }),
    // Compress extracted CSS. We are using this plugin so that possible
    // duplicated CSS from different components can be deduped.
    // 压缩提取出的css，并解决ExtractTextPlugin分离出的js重复问题(多个文件引入同一css文件)
    new OptimizeCSSPlugin({
      cssProcessorOptions: config.build.productionSourceMap
        ? { safe: true, map: { inline: false } }
        : { safe: true }
    }),
    // generate dist index.html with correct asset hash for caching.
    // you can customize output by editing /index.html
    // see https://github.com/ampedandwired/html-webpack-plugin
    // 将 index.html 作为入口，注入 html 代码后生成 index.html文件 引入css文件和js文件
    new HtmlWebpackPlugin({
      filename: config.build.index,  // 生成的html的文件名
      template: 'index.html',         // 依据的模板
      inject: true,                   // 注入的js文件将会被放在body标签中,当值为'head'时，将被放在head标签中
      minify: {       // 压缩配置
        removeComments: true,           // 删除html中的注释代码
        collapseWhitespace: true,      // 删除html中的空白符
        removeAttributeQuotes: true     // 删除html元素中属性的引号
        // more options:
        // https://github.com/kangax/html-minifier#options-quick-reference
      },
      // necessary to consistently work with multiple chunks via CommonsChunkPlugin
      chunksSortMode: 'dependency'        // 必须通过 CommonsChunkPlugin一致地处理多个 chunks   // 按dependency的顺序引入
    }),
    // keep module.id stable when vendor modules does not change
    new webpack.HashedModuleIdsPlugin(),
    // enable scope hoisting
    new webpack.optimize.ModuleConcatenationPlugin(),
    // split vendor js into its own file
     // 分割公共 js 到独立的文件vendor中
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks (module) {
        // any required modules inside node_modules are extracted to vendor
        return (
          module.resource &&
          /\.js$/.test(module.resource) &&
          module.resource.indexOf(
            path.join(__dirname, '../node_modules')
          ) === 0
        )
      }
    }),
    // extract webpack runtime and module manifest to its own file in order to
    // prevent vendor hash from being updated whenever app bundle is updated
      /* 
     上面虽然已经分离了第三方库,每次修改编译都会改变vendor的hash值，导致浏览器缓存失效。
     原因是vendor包含了webpack在打包过程中会产生一些运行时代码，运行时代码中实际上保存了打包后的文件名。
     当修改业务代码时,业务代码的js文件的hash值必然会改变。一旦改变必然
     会导致vendor变化。vendor变化会导致其hash值变化。
    */
    // 下面主要是将运行时代码提取到单独的manifest文件中，防止其影响vendor.js
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest',
      minChunks: Infinity
    }),
    // This instance extracts shared chunks from code splitted chunks and bundles them
    // in a separate chunk, similar to the vendor chunk
    // see: https://webpack.js.org/plugins/commons-chunk-plugin/#extra-async-commons-chunk
    new webpack.optimize.CommonsChunkPlugin({
      name: 'app',
      async: 'vendor-async',
      children: true,
      minChunks: 3
    }),

    // copy custom static assets
    // 复制静态资源,将static文件内的内容复制到指定文件夹
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, '../static'),
        to: config.build.assetsSubDirectory,
        ignore: ['.*']
      }
    ])
  ]
})
// 配置文件开启了gzip压缩
if (config.build.productionGzip) {
  // 引入压缩文件的组件,该插件会对生成的文件进行压缩，生成一个.gz文件
  const CompressionWebpackPlugin = require('compression-webpack-plugin')
  // 向webpackconfig.plugins中加入下方的插件
  webpackConfig.plugins.push(
    new CompressionWebpackPlugin({
      asset: '[path].gz[query]',   //目标文件名
      algorithm: 'gzip',           //使用gizp压缩
      test: new RegExp(            //满足正则表达式的文件会被压缩
        '\\.(' +
        config.build.productionGzipExtensions.join('|') +
        ')$'
      ),
      threshold: 10240,            //资源文件大于10240B=10kb时会被压缩
      minRatio: 0.8                //最小压缩比达到0.8时才会被压缩
    })
  )
}
// 开启包分析的情况时， 给 webpack plugins添加 webpack-bundle-analyzer 插件
if (config.build.bundleAnalyzerReport) {
  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
  webpackConfig.plugins.push(new BundleAnalyzerPlugin())
}

module.exports = webpackConfig
