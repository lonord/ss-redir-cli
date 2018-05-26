#!/usr/bin/env node

import * as program from 'commander'
import * as ms from 'ms'
import * as prettyBytes from 'pretty-bytes'
import * as UI from 'readline-ui'
import createHTTPClient from './http-client'
import createPromptUI, { errorMsg, infoMsg } from './prompt'

const pathPrefix = '/api'

// tslint:disable-next-line:no-var-requires
const pkg = require('../package.json')

program
	.version(pkg.version)
	.description(pkg.description)
	.option('-p, --port <n>', 'Server port, default 11080')
	.option('-h, --host <n>', 'Server hostname, default 127.0.0.1')
	.parse(process.argv)

const host = program.host || '127.0.0.1'
const port = isNaN(parseInt(program.port)) ? 11080 : parseInt(program.port)

console.log(`ss-redir-cli v${pkg.version}`)
console.log(`Connecting server ${host}:${port} ...`)
const client = createHTTPClient(port, host)
client.get(pathPrefix + '/version').then((version) => {
	console.log(`Connected!   [ss-redir-service v${version}]`)
	const p = createPromptUI({
		functions: [
			{
				name: 'start',
				args: [],
				handle: async () => {
					await client.put(pathPrefix + '/action/start')
					printResult('OK')
				}
			},
			{
				name: 'stop',
				args: [],
				handle: async () => {
					await client.put(pathPrefix + '/action/stop')
					printResult('OK')
				}
			},
			{
				name: 'getStatus',
				args: [],
				handle: async () => {
					const status = await client.get(pathPrefix + '/status')
					printResult(`ss service is ${status.running ? infoMsg('running') : errorMsg('not running')}`)
					if (status.running) {
						printResult(`ss running up to ${infoMsg(ms(status.uptime))}`)
						printResult(`ss mode is ${infoMsg(status.ssMode)}`)
						for (const pName in status.processStatus) {
							if (pName in status.processStatus) {
								const stat = status.processStatus[pName]
								if (stat.pid > 0) {
									printResult(
										`[${pName}] ` +
										`pid: ${infoMsg(stat.pid + '')}, ` +
										`cpu: ${infoMsg(stat.cpu + '%')}, ` +
										`mem: ${infoMsg(prettyBytes(stat.mem))}`
									)
								}
							}
						}
					}
				}
			},
			{
				name: 'getSSMode',
				args: [],
				handle: async () => {
					const mode = await client.get(pathPrefix + '/ssmode')
					printResult(`ss mode is ${infoMsg(mode)}`)
				}
			},
			{
				name: 'setSSMode',
				args: ['mode'],
				handle: async (mode) => {
					if (mode === 'auto' || mode === 'global') {
						await client.post(pathPrefix + '/ssmode', { mode })
						printResult('OK')
					} else {
						throw new Error('ss mode should be `auto` or `global`')
					}
				}
			},
			{
				name: 'getUserGFWList',
				args: [],
				handle: async () => {
					const gfwlist = await client.get(pathPrefix + '/gfwlist/user')
					gfwlist.forEach((t) => printResult(t))
				}
			},
			{
				name: 'addUserGFWDomain',
				args: ['domain'],
				handle: async (domain) => {
					await client.put(pathPrefix + `/gfwlist/user/${domain}`)
					await client.put(pathPrefix + '/action/gfwlist/validate')
					printResult('OK')
				}
			},
			{
				name: 'removeUserGFWDomain',
				args: ['domain'],
				handle: async (domain) => {
					await client.del(pathPrefix + `/gfwlist/user/${domain}`)
					await client.put(pathPrefix + '/action/gfwlist/validate')
					printResult('OK')
				}
			},
			{
				name: 'updateStandardGFWList',
				args: [],
				handle: async () => {
					await client.put(pathPrefix + '/action/gfwlist/update')
					await client.put(pathPrefix + '/action/gfwlist/validate')
					printResult('OK')
				}
			},
			{
				name: 'validateGFWList',
				args: [],
				handle: async () => {
					await client.put(pathPrefix + '/action/gfwlist/validate')
					printResult('OK')
				}
			},
			{
				name: 'invalidateGFWList',
				args: [],
				handle: async () => {
					await client.put(pathPrefix + '/action/gfwlist/invalidate')
					printResult('OK')
				}
			}
		]
	})
}).catch((err) => {
	console.error(errorMsg(`Connect Error: ${err.message || err.toString()}`))
	process.exit(1)
})

function printResult(str: string) {
	console.log('* ' + str)
}
