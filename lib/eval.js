// 控制台字符样式修改
const chalk = require('chalk')

module.exports = function(exp,data) {
    try {
        const fn = new Function('data','with(data) { return ' + exp + '}')
        return fn(data)
    } catch (e) {
        console.error(chalk.red('Error when evaluate filter conditions:' + exp))
    }
}