#!/usr/bin/env node

// 下载远程仓库
const download = require('download-git-repo')
// 命令行处理工具
const program = require('commander')
// 路劲检测
const exists = require('fs').existsSync
const path = require('path')
// loading效果
const ora = require('ora')
// 用户根目录
const home = require('user-home')
// 波浪符路径转换
const tildify = require('tildify')
// 控制台字符串样式修改
const chalk = require('chalk')

// 命令行与开发者交流的工具
const inquirer = require('inquirer')
// 删除文件和文件夹
const rm = require('rimraf').sync
// 日志打印
const logger = require('../lib/logger')

// 内部自定义方法
const generate = require('../lib/generate')
const checkVersion = require('../lib/check-version')
const warnings = require('../lib/warnings')
const localPath = require('../lib/local-path')

const isLocalPath = localPath.isLocalPath
const getTemplatePath = localPath.getTemplatePath


// 配置commander使用方法
program
    .usage('<template-name> [project-name]')
    .option('-c, --clone', '使用git clone')
    .option('--offline','使用本地模板')



/**
 * Help
 */
program.on("--help",()=>{
    console.log('示例:')
    console.log()
    console.log(
        chalk.gray('    # 创建一个新项目，使用本地模板')
    )
    console.log('    $ vue init webpack my-project')
})


function help(){
    program.parse(process.argv)
    if(program.args.length < 1) return program.help()
}

help()


/**
 * @description 设置
 */
// 模板名字
let template = program.args[0]
// 有斜杠
const hasSlash = template.indexOf('/') > -1

// 项目目录名称
const rawName = program.args[1]

const inPlace = !rawName || rawName === '.'
const name = inPlace ? path.relative('../',process.cwd()) : rawName
const to = path.resolve(rawName || '.')
const clone = program.clone || false

// 模板加载地址
const tmp = path.join(home,'.vue-templates',template.replace(/[\/:]/g,'-'))

if(program.offline){
    console.log(`> 使用本地模板: ${chalk.yellow(tildify(tmp))}`)
    template = tmp
}


process.on('exit',()=>{
    console.log()
})

//  是否为当前目录下构建 or 存在当前路径
if(inPlace || exists(to)) {
    inquirer
    .prompt([
        {
            type:'confirm',
            message: inPlace
                ? '在当前目录下构建项目?'
                : '目录已存在，是否继续?',
            name:'ok'
        }
    ]).then((answers)=>{
        if(answers.ok){
            run()
        } else {
            logger.fatal('用户取消')
        }
    })
} else {
    run()
}

/**
 * @description 检查、下载、项目生成
 */
function run(){
    // 是否走本地模板
    if(isLocalPath(template)) {
        const templatePath = getTemplatePath(template)
        if(exists(templatePath)) {
            generate(name,templatePath,to,err=>{
                if(err) {
                    logger.fatal(err)
                }
                console.log()
                logger.success('项目生成成功 %s',name)
            })

        } else {
            logger.fatal('本地模板不存在')
        }
    }
}





