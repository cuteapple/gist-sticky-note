const { app, BrowserWindow } = require('electron')
require('electron-debug')();

/**@type {BrowserWindow} */
let mainWindow

/**@type {Set<BrowserWindow>} */
let notes = new Set()

function initialize() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		x: -1, y: -1, width: 1, height: 1,
		transparent: true,
		frame: false,
		webPreferences: {
			nodeIntegration: false
		}
	})
	mainWindow.setIgnoreMouseEvents(true)


	for (let i of [1]) {
		let note = new BrowserWindow({
			x: 30,
			y: 30,
			width: 300,
			height: 300 + 32,
			transparent: false,
			frame: false,
			backgroundColor: '#f0f',
			parent: mainWindow
		})
		note.loadFile('note.html')
		note.on('closed', () => {
			notes.delete(note)
			if (!notes.size) mainWindow.close()
		})
		notes.add(note)
	}

	mainWindow.on('closed', function () {
		mainWindow = null
	})
}
app.on('ready', initialize)


// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', function () {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow()
	}
})