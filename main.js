const { app, BrowserWindow, ipcMain } = require('electron')
// I like warnning, why I need to disable all :(
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true

/**@type {BrowserWindow} */
let mainWindow

/**@typedef {string} NoteId*/
/**@type {Map<NoteId,BrowserWindow>} */
let notes = new Map()

ipcMain.addListener('open-note', (sender, noteid) => open_note(noteid))
function open_note(id) {
	//check if already open
	if (notes.has(id)) {
		notes.get(id).focus()
		console.log(`bring note ${id} to front`)
		return
	}

	console.log(`opening note ${id}`)
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
		notes.delete(note.noteid)
		notes.set(note.noteid, note)
		//Todo: observe change of notes
		mainWindow.webContents.send('order-changed', [...notes.keys()])
	})
	note.on('closed', () => {
		notes.delete(note.noteid)
		//Todo: condition
		//if (!notes.size) mainWindow.close() //no need when mainWindow is visible
	})
	notes.set(note.noteid, note)
}

function initialize() {
	mainWindow = new BrowserWindow({
		//x: -1, y: -1, width: 1, height: 1,
		transparent: false,
        frame: true,
        //no use
        //backgroundThrottling: false, //REVIEW: not ideal... but the text would't change for some special reason
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