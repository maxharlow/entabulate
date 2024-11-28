import Process from 'process'
import Yargs from 'yargs'
import run from './entabulate.js'
import cliRenderer from './cli-renderer.js'

async function setup() {
    const instructions = Yargs(Process.argv.slice(2))
        .usage('Usage: entabulate <input> <output>')
        .wrap(null)
        .option('q', { alias: 'quiet', type: 'boolean', description: 'Don\'t print out progress (faster)', default: false })
        .option('V', { alias: 'verbose', type: 'boolean', description: 'Print extra information about errors', default: false })
        .help('?').alias('?', 'help')
        .version().alias('v', 'version')
        .demandCommand(2, '')
    const { alert, progress, finalise } = cliRenderer(instructions.argv.verbose)
    try {
        const {
            _: [input, output],
            quiet,
            verbose
        } = instructions.argv
        alert({
            message: 'Starting up...',
            importance: 'info'
        })
        await run(input, output, quiet ? null : progress)
        await finalise('complete')
    }
    catch (e) {
        await finalise('error', e)
        Process.exit(1)
    }
}

setup()
