// minimist 用来解析命令行参数
const args = require('minimist')(process.argv.slice(2)) // node scripts/dev.js reactivity -f global
const { resolve } = require('path')
const { build } = require('esbuild')

const target = args._[0] || 'reactivity';
const format = args.f || 'global';

// 要打包的模块配置(package.json)
// 开发环境只打包某一个
const pkg = require(resolve(__dirname,`../packages/${target}/package.json`))

// 输出格式
// iife 立即执行函数 (function () {})()
// node node中的模块 module.exports
// esm 浏览器中的模块 import {} 
const outputFormat = format === 'global' ? 'iife' : format === 'cjs' ? 'cjs' : 'esm';

// 输出
const outfile = resolve(__dirname,`../packages/${target}/dist/${target}.${format}.js`)
// esbuild 配置

build({
    entryPoints : [resolve(__dirname,`../packages/${target}/src/index.ts`)], // 要打包的入口点
    outfile, // 输出文件
    bundle : true, // 把所有的包全部打包到一起
    format : outputFormat, // 输出的格式
    globalName : pkg.buildOptions?.name, // 打包的全局的名字
    platform : format === 'cjs' ? "node" : 'browser', // 平台
    watch : { // 监控文件变化
         onRebuild(error) {
            if(!error) console.log('rebuild~~')
         }
    }
}).then(() => {
     console.log('watching~~~')
})

