// 控制台字符串样式修改
const chalk =require('chalk')
// 静态网页生成
const Metalsmith = require('metalsmith')
// 模板引擎
const Handlebars = require('handlebars')
// 异步库
const async = require('async')

// 模板引擎解析渲染器
const render = require('consolidate').handlebars.render
const path = require('path')

// 多个条件匹配
const multimatch = require('multimatch')
const getOptions = require('./options')
const ask = require('./ask')
const filter = require('./filter')
const logger = require('./logger')

// 注册handlebars的helper方法
Handlebars.registerHelper('if_eq',function(a,b,opts){
    return a===b 
        ? opts.fn(this)
        : opts.inverse(this)
})

Handlebars.registerHelper('unless_eq',function(a,b,opts){
    return a===b
        ? opts.inverse(this)
        : opts.fn(this)
})

/**
 * @description 模板生成
 */
module.exports = function generate(name,src,dest,done) {
    // 读取配置项入口
    const opts = getOptions(name,src)
    const metalsmith = Metalsmith(path.join(src,'template'))
    const data = Object.assign(metalsmith.metadata(),{
        destDirName:name,
        inPlace: dest === process.cwd(),
        noEscape: true
    })

    opts.helpers && Object.keys(opts.helpers).forEach(key=>{
        Handlebars.registerHelper(key,opts.helpers[key])
    })

    const helpers = { chalk,logger }
    
    if(opts.metalsmith && typeof opts.metalsmith.before === 'function') {
        opts.metalsmith.before(metalsmith,opts,helpers)
    }
    console.log('opts',opts.prompts)
    metalsmith
        // 询问并记录答案
        .use(askQuestions(opts.prompts))
        // 根据答案和过滤条件过滤文件
        .use(filterFiles(opts.filters))
        .use(renderTemplateFiles(opts.skipInterpolation))

    if(typeof opts.metalsmith === 'function') {
        opts.metalsmith(metalsmith,opts,helpers)
    } else if(opts.metalsmith && typeof opts.metalsmith.after === 'function'){
        opts.metalsmith.after(metalsmith,opts,helpers)
    }   
        
    metalsmith.clean(false)
    .source('.')
    .destination(dest)
    .build((err,files)=>{
        done(err)
        if(typeof opts.complete === 'function'){
            const helpers = { chalk,logger,files }
            opts.complete(data,helpers)
        } else {
            logMessage(opts.completeMessage,data)
        }
    })
}

/**
 * @description 创建一个用于提问的中间件
 */
function askQuestions(prompts) {
    return (files,metalsmith,done) => {
        ask(prompts, metalsmith.metadata(),done)
    }
}


/**
 * @description 创建一个用于过滤文件的中间件
 */
function filterFiles(filters) {
    return (files,metalsmith,done) => {
        filter(files, filters, metalsmith.metadata(),done)
    }
}

/**
 * @description 模板渲染
 */
function renderTemplateFiles(skipInterpolation){

    skipInterpolation = typeof skipInterpolation === 'string' ?
        [skipInterpolation] : skipInterpolation

    return (files,metalsmith,done) => {
        const keys = Object.keys(files)
        const metalsmithMetadata = metalsmith.metadata()
        async.each(keys,(file, next) => {
            if(skipInterpolation && multimatch([file,skipInterpolation, {dot:true}]).length) {
                return next();
            }

            const str = files[file].contents.toString()
            if(!/{{([^{}]+)}}/g.test(str)){
                return next()
            }

            render(str,metalsmithMetadata,(err,res)=>{
                if(err) {
                    err.message = `[${file}] ${err.message}`
                    return next(err)
                }

                files[file].contents =  new Buffer(res)
                next()
            })
        },done)
    }
}


/**
 * @description 显示模板完成信息
 */
 function logMessage(message,data) {
    if(!message) return;
    
    render(message,data,(err,res)=>{
        if(err) {
            console.error('\n   Error when rendering template complete message: ' + err.message.trim())
        } else {
            console.log('\n' + res.split(/\r?\n/g).map(line=>'     '+line).join('\n'))
        }
    })

}