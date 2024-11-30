import FSExtra from 'fs-extra'
import Scramjet from 'scramjet'
import NDJson from 'ndjson'
import StreamArray from 'stream-json/streamers/StreamArray.js'
import * as Flat from 'flat'

async function detectInput(filename, formatSpecified) {
    const exists = await FSExtra.pathExists(filename)
    if (!exists) throw new Error(`${filename} doesn\'t exist!`)
    const stats = await FSExtra.stat(filename)
    if (stats.isDirectory()) return { isDirectory: true } // whatever format specified, if it's a directory treat it as such
    const matches = formatSpecified ? true : filename.toLowerCase().match(/(?<=\.)[a-z0-9]+$/)
    if (matches) {
        const extension = formatSpecified ? null : matches[0].toUpperCase()
        const format = formatSpecified ? formatSpecified.toUpperCase()
            : extension === 'NDJSON' ? 'JSONL'
            : extension
        if (!['JSON', 'JSONL'].includes(format)) throw new Error(`${extension} is not supported as an input`)
        if (format === 'JSON') {
            const file = await FSExtra.open(filename, 'r')
            const firstCharacter = await FSExtra.read(file, Buffer.alloc(1), 0, 1)
            if (firstCharacter.buffer.toString() !== '[') throw new Error('Json input does not contain a top-level array (is it JsonL?)')
        }
        return { isFile: true, format }
    }
    else throw new Error(`${filename} must include an extension or be a directory`)
}

async function detectOutput(filename, formatSpecified) {
    const exists = await FSExtra.pathExists(filename)
    if (exists && filename !== '/dev/stdout') throw new Error(`${filename} already exists!`)
    const matches = formatSpecified ? true : filename.toLowerCase().match(/(?<=\.)[a-z0-9]+$/)
    if (matches) {
        const extension = formatSpecified ? null : matches[0].toUpperCase()
        const format = formatSpecified ? formatSpecified.toUpperCase()
            : extension === 'NDJSON' ? 'JSONL'
            : extension
        if (!['CSV', 'JSONL'].includes(format)) throw new Error(`${extension} is not supported as an output`)
        return { isFile: true, format }
    }
    else return { isFile: true, format: 'CSV' }
}

function extract(object, path) {
    const paths = path.split('.')
    return paths.reduce((a, key, i) => {
        if (!a || !a[key]) return undefined
        else if (i === paths.length - 1) {
            const data = a[key]
            delete a[key]
            return data
        }
        else return a[key]
    }, object)
}

async function* walk(directory) {
    const files = await FSExtra.readdir(directory, { withFileTypes: true })
    for (const file of files) {
        if (file.isDirectory()) yield* walk(`${directory}/${file.name}`)
        else yield `${directory}/${file.name}`
    }
}

function read(filename, type) {
    if (type.format === 'JSON') {
        return Scramjet.DataStream.from(FSExtra.createReadStream(filename)
            .pipe(StreamArray.withParser()))
            .map(entry => entry.value)
    }
    if (type.format === 'JSONL') {
        return Scramjet.DataStream.from(FSExtra.createReadStream(filename)
            .pipe(NDJson.parse()))
    }
    if (type.isDirectory) {
        return Scramjet.DataStream.from(walk(filename))
            .map(FSExtra.readJson)
    }
}

function length(data) {
    return data.reduce(a => a + 1, 0)
}

function detectHeaders(data) {
    return data.reduce((a, row) => {
        const keys = Object.keys(Flat.flatten(row, { safe: true }))
        return Array.from(new Set(a.concat(keys)))
    }, [])
}

async function write(data, headers, filename, type) {
    const processed = data.map(row => {
        const rowFlatEntries = Object.entries(Flat.flatten(row, { safe: true })).map(([key, value]) => {
            if (Array.isArray(value) && type.format !== 'JSONL') return [key, JSON.stringify(value)]
            if (typeof value === 'object') return [key, null] // the only objects at this point will be empty
            return [key, value]
        })
        const rowFlat = Object.fromEntries(rowFlatEntries)
        return headers.slice().reverse().reduce((a, header) => {
            return Object.assign({ [header]: rowFlat[header] }, a)
        }, {})
    })
    if (type.format === 'CSV') return processed.CSVStringify()
        .each(line => FSExtra.appendFile(filename, line))
        .whenEnd()
    if (type.format === 'JSONL') return processed.JSONStringify()
        .each(line => FSExtra.appendFile(filename, line))
        .whenEnd()
    else throw new Error(`${type.format} output failure`) // should never be reached
}

async function run(input, inputFormat, output, outputFormat, progress = null) {
    const inputType = await detectInput(input, inputFormat)
    const outputType = await detectOutput(output, outputFormat)
    if (inputType.format === outputType.format) throw new Error(`input and output formats are both ${inputType.format}`)
    const total = !progress ? null : await length(read(input, inputType))
    const headersData = read(input, inputType)
    if (progress) headersData.each(progress('Detecting headers...', total))
    const headers = await detectHeaders(headersData)
    const bodyData = read(input, inputType)
    if (progress) bodyData.each(progress('Writing data...     ', total))
    await write(bodyData, headers, output, outputType)
}

export default run
