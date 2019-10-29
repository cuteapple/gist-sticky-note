const { app, BrowserWindow, ipcMain } = require('electron')
// I like warnning, why I need to disable all :(
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true

/**@type {BrowserWindow} */
let mainWindow

/**@type {BrowserWindow} */
let notelistWindow

/**@typedef {string} NoteId*/
/**@type {Map<NoteId,BrowserWindow>} */
let notes = new Map()

ipcMain.addListener('open-list-window', (sender) => {
    notelistWindow.show()
})

ipcMain.addListener('open-note', (sender, noteid) => open_note(noteid))

function open_note(id) {
    //check if already open
    if(notes.has(id)) {
        notes.get(id).focus()
        console.log(`bring note ${id} to front`)
        return
    }

    console.log(`opening note ${id}`)
    let note = new BrowserWindow({
        parent: mainWindow,
        x: 30 + Math.round(Math.random() * 200),
        y: 30 + Math.round(Math.random() * 200),
        width: 100 + Math.round(Math.random() * 300),
        height: 100 + 32 + Math.round(Math.random() * 300),
        transparent: false, frame: false, show: false,
        backgroundColor: '#f0f', //not supposed to be seem
        webPreferences: { nodeIntegration: true }
    })

    note.noteid = id
    note.loadFile('note.html')
    note.on('focus', () => {
        //refersh z-order
        notes.delete(note.noteid)
        notes.set(note.noteid, note)
        //Todo: observe change of notes
        notelistWindow.webContents.send('order-changed', [...notes.keys()])
    })
    note.on('closed', () => {
        notes.delete(note.noteid)
        console.log(notes.size, notelistWindow.isVisible())
        if(!notes.size && !notelistWindow.isVisible()) {
            console.log('closing main window')
            mainWindow.close()
        }
    })
    notes.set(note.noteid, note)
}


function initialize() {
    ///
    /// Create main window
    ///
    mainWindow = new BrowserWindow({
        x: -1000, y: -1000, width: 480, height: 300,
        transparent: true, frame: false,
        webPreferences: { nodeIntegration: true }
    })
    mainWindow.setIgnoreMouseEvents(true)
    mainWindow.loadFile('app-icon.png')
    mainWindow.on('closed', function() {
        console.log('main window closed')
        mainWindow = null
    })

    ///
    /// Create notelist window
    ///
    notelistWindow = new BrowserWindow({
        parent: mainWindow,
        x: 800, y: 100, height: 300, width: 400,
        transparent: false, frame: true,
        webPreferences: { nodeIntegration: true }
    })
    notelistWindow.on('close', ev => {
        if(notes.size) {
            ev.preventDefault();
            notelistWindow.hide()
        }
        else {
            mainWindow.close()
        }
    })
    notelistWindow.loadFile('index.html')
}
app.on('ready', initialize)

///
/// To be honist I don't really understand what below codes doing (I can guess, though)
///

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if(process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function() {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if(mainWindow === null) {
        initialize()
    }
})