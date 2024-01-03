
// 加载元数据
const metadata = require('read-metadata')
const exists = require('fs').existsSync
const path = require('path')
// 检验npm包名
const validateName = require('validate-npm-package-name');
const getUser = require('./git-user')


/**
 * @description 读取获取元数据
 */
module.exports = function options(name,dir){
    const opts = getMetadata(dir)
    setDefault(opts,'name',name)
    setVaildateName(opts)
    const author = getUser()
    if(author){
        setDefault(opts,'author',author)
    }   

    return opts
}

/**
 * @description 从meta.js或meta.json获取数据
 */
function getMetadata(dir){
    const json = path.join(dir,'meta.json')
    const js = path.join(dir,'meta.js')

    let opts = {}

    if(exists(json)){
        opts = metadata.sync(json)
    } else if(exists(js)) {
        const req = require(path.resolve(js))

        if(req !== Object(req)){
            throw new Error('meta.js需要导出一个对象')
        }
        opts = req 
    }
    
    return opts

}

/**
 * @description 设置提示问题的默认值
 * 
 * @param {Object} opts
 * @param {String} key
 * @param {String} value
 */
function setDefault(opts,key,value){
    if(opts.schema){
        opts.prompts = opts.schema
        delete opts.schema
    }

    const prompts = opts.prompts || (opts.prompts = {});
    if(!prompts[key] || typeof prompts[key] !== 'object'){
        prompts[key] = {
            type:'string',
            default: value
        }
    } else {
        prompts[key]['default'] = value
    }

}

/**
 * @description 设置名称验证
 */
function setVaildateName(opts){
        const name = opts.prompts.name
        const customValidate = name.validate
        name.validate = name =>{

            const its = validateName(name)
            if(!its.validForNewPackages){
                const errors =( its.errors || []).concat(its.warnings || [])
                return 'Sorry' + errors.join(' and ')+'.'
            }
            if(typeof customValidate === 'function') {
                return customValidate(name)
            }
            return true
        }

}