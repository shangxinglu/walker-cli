#!/usr/bin/env node

require('commander')
.version(require('../package').version)
.usage('<command> [options]')
.command('init','生成新项目模板')
.command('list','查看所有可用模板')
.parse(process.argv)