import $ from 'jquery'

const socket = io()

let preferences = {}

const logSelector = $('.logs-select')
const logContent = $('.log-content')

/**
* Formats the log file nicely, wraps the metadata and errors, and seperates lines
* @param {String} content The log file's content
*/
const formatLog = (content) => {
	const expressions = {
		lines: /([^\r\n]+)/g,
		badCommas: /(,\S)/g,
		error: /(error)/gi
	}

	let formatted = content
	const commas = content.match(expressions.badCommas)
	if (commas) {
		commas.forEach((match) => {
			formatted = formatted.replace(match, ` ${match.substring(1)}`)
		})
	}
	formatted = formatted.replace(expressions.error, '<span class="error">$1</span>')
	formatted = formatted.replace(expressions.lines, '<div>$1</div>')
	logContent.html(formatted)
}

/** Sorts a dates array
*
* @param  {Array}  dates 		 The array to be sorted
* @param  {String} delimiter Date delimiter (., /, -)
* @return {Array}  The ordered array contents
*/
const sortDates = (dates, delimiter = '.') => {
	const getDate = (date) => date.split(delimiter).reverse().join('')

	const fixSingles = (date) => `${date.substring(0, date.length - 1)}0${date.substring(date.length - 2)}`

	const sorted = dates.sort((a, b) => {
		a = getDate(a)
		b = getDate(b)
		if (a.length != b.length) {
			a.length < b.length ? a = fixSingles(a) : b = fixSingles(b)
		}
		return a > b ? 1 : a < b ? -1 : 0
	})

	return sorted
}

const init = () => {
	$.get('/config', (data) => {
		console.log(data)
		preferences = data
		$('#appName').html(preferences.app_name)
	})

	$.get('/logs', (logs) => {
		sortDates(logs).forEach((log) => logSelector.append(`<option value="${log}">${log}</option>`))
	})
}

// WATCHERS

logSelector.change(() => {
	const selected = logSelector.val()

	$.post('/logs', {
		log: selected
	}, (content) => {
		formatLog(content)
	})
})

// SOCKETS

socket.on('updateCurrent', (data) => {
	formatLog(data)
})

init()
