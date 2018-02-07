#!/usr/bin/env node

require('colors')
const express = require('express')
const app = express()
const path = require('path')
const fs = require('fs')
const parser = require('body-parser')
const server = require('http').Server(app)
const io = require('socket.io')(server)

const callerDirectory = process.cwd()
const CONFIG_FILE_NAME = '.logs.ui.json'
const MANDATORY_FIELDS = [
	'logs_dir'
]

/**
 * Throw error shorthand.
 * @param  {String} error Error description
 */
const err = (error) => {
	throw new Error(error)
}

/**
 * Fetches the config file, traversing upwards in the file tree until root.
 * @return {String} Config file path.
 */
const getConfigFile = () => {
	let folder = callerDirectory

	while (folder) {
		const configPath = path.join(folder, CONFIG_FILE_NAME)

		try {
			if (fs.existsSync(configPath)) {
				return configPath
			}
		} catch (e) {
			err(e)
		}

		const folderMetadata = path.parse(folder)

		if (folderMetadata.root === folderMetadata.dir) {
			err(`No config file with name ${CONFIG_FILE_NAME} found in this directory or any of its parents.`)
		} else {
			folder = path.join(folder, '..')
		}
	}
}

const userConfig = require(getConfigFile())

MANDATORY_FIELDS.forEach((field) => {
	if (!userConfig[field]) {
		err(`Preferences file doesn't contain the ${field} property`)
	}
})

const config = {
	port: userConfig.port || 1095,
	paths: {
		root: path.resolve(__dirname),
		logs: path.resolve(userConfig.logs_dir)
	}
}

let currentLog = ''

app.use(parser.urlencoded({extended:true}))
app.use(parser.json())
app.use(express.static(config.paths.root))

server.listen(config.port, () => {
	console.log('Initiating', 'Logs GUI'.cyan)
	console.log('Available on port', config.port.bold)
})

// ROUTES

app.get('/config', (req, res) => {
	res.send(userConfig)
})

app.get('/logs', (req, res) => {
	let contents

	try {
		contents = fs.readdirSync(config.paths.logs)
	} catch (e) {
		err(`Couldn't read specified logs directory: ${config.paths.logs}`)
	}

	const logs = contents.map((file) => {
		const filePath = path.join(config.paths.logs, file)

		if (file && fs.statSync(filePath).isFile() && !file.startsWith('.')) {
			return file.split('.txt')[0]
		}
	})

	res.send(logs)
})

app.post('/logs', (req, res) => {
	const log = req.body.log
	let content = ''

	if (log.length > 0) {
		const fileName = `${log}.txt`
		currentLog = fileName
		content = fs.readFileSync(path.join(config.paths.logs, fileName))
	}

	res.send(content)
})

// WATCHERS

fs.watch(config.paths.logs, (event, file) => {
	if (file === currentLog) {
		fs.readFile(path.join(config.paths.logs, file), 'utf8', (err, content) => {
			io.emit('updateCurrent', content)
		})
	}
})
