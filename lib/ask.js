// 异步
const async = require('async')
// 命令行与开发者交流的工具
const inquirer = require('inquirer')

const evaluate = require('./eval')

/**
 * @description 使用前提示支持的类型
 */
const promptMapping = {
    string:'input',
    boolean: 'confirm'
}


/**
 * @description 询问返回结果
 */
module.exports = function ask(prompts,data,done){   
    async.eachSeries(Object.keys(prompts), (key,next)=>{
        prompt(data, key, prompts[key], next)
    }, done)
}

/**
 * @description 提示包装
 */
function prompt(data,key,prompt,done){
    // 如果有when属性，且when属性返回false，则不执行
    if(prompt.when&&!evaluate(prompt.when,data)){
        return done()
    }

    let  promptDefault = prompt.default;
    if(typeof promptDefault === 'function'){
        promptDefault = function(){
            return prompt.default.bind(this)(data)
        }
    }

    inquirer.prompt([
        {
            type:promptMapping[prompt.type] || prompt.type,
            name:key,
            message:prompt.message || prompt.label || key,
            default: promptDefault,
            choices: prompt.choices || [],
            validate: prompt.validate ||  (()=>true)
        }
    ]).then(answers=>{
        
        if(Array.isArray(answers[key])){
            data[key] = {}
            answers[key].forEach(multiChoiceAnswer =>{
                data[key][multiChoiceAnswer] = true
            })
        } else if (typeof answers[key] === 'string') {
            data[key] = answers[key].replace(/"/g,'\\"')
        } else {
            answers[key] = true
        }

        done()
    }).catch(done)
}
