const { app, BrowserWindow, ipcMain } = require('electron')
//require('electron-debug')()

/**@type {BrowserWindow} */
let mainWindow

/**@type {Set<BrowserWindow>} */
let notes = new Set()

ipcMain.addListener('open-notes', (sender, notes) => {
	(notes || [1, 2]).forEach(open_note)
})
function open_note(id) {
	console.log('opening note ', id)
	let note = new BrowserWindow({
		x: 30 + Math.round(Math.random() * 200),
		y: 30 + Math.round(Math.random() * 200),
		width: 100 + Math.round(Math.random() * 300),
		height: 100 + 32 + Math.round(Math.random() * 300),
		transparent: false,
		frame: false,
		show: false,
		backgroundColor: '#f0f',
		parent: mainWindow,
		webPreferences: {
			nodeIntegration: true
		}
	})
	note.noteid = id
	note.loadFile('note.html')
	note.on('focus', () => {
		//refersh z-order
		notes.delete(note)
		notes.add(note)
		mainWindow.webContents.send('order-changed', [...notes].map(n => n.noteid))
	})
	note.on('closed', () => {
		notes.delete(note)
		if (!notes.size) mainWindow.close()
	})
	notes.add(note)
}

function initialize() {
	mainWindow = new BrowserWindow({
		//x: -1, y: -1, width: 1, height: 1,
		transparent: false,
		frame: true,
		x: 800, y: 100, height: 300, width: 400,
		webPreferences: {
			nodeIntegration: true
		}
	})
	//mainWindow.setIgnoreMouseEvents(true)
	mainWindow.loadFile('index.html')
	mainWindow.on('closed', function () {
		mainWindow = null
	})
	mainWindow.webContents.openDevTools()
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