const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const exec = require('child_process').exec;
const rimraf = require('rimraf');
const log = console.log.bind(console);

const watcher = chokidar.watch('src', {
	persistent: true
});


function addJSFiles () {
	watcher.add(['src/*.js']);
	log('Watching files:\n', watcher.getWatched());
}

function createBuild (filePath, event) {
	rimraf.sync(path.join(__dirname, 'build/**/*.js'), {});

	exec('"c:\\windows\\system32\\windowspowershell\\v1.0\\powershell.exe" -ExecutionPolicy ByPass -Command "npm run eslint --silent"', output);
	debugger;
}

function output(error, stdout, stderr) {
	if (error) {
		console.error(error);
	} else {
		console.log(stdout);	
	}
} 

watcher.on('ready', addJSFiles).on('change', createBuild);