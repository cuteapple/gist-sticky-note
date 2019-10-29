const { app, BrowserWindow, ipcMain } = require('electron')
// I like warnning, why I need to disable all :(
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true

/**placeholder window, provide icon and window collection (parent) */
/**@type {BrowserWindow} */
let mainWindow

/**@type {BrowserWindow} */
let notelistWindow

/**@typedef {string} NoteId*/
/**@type {Map<NoteId,BrowserWindow>} */
let notes = new Map()

/**the program is currently closing, do not process relevent events */
let quitting = false

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
        transparent: false, frame: false, show: false,
        backgroundColor: '#f0f', //not supposed to be seem
        webPreferences: { nodeIntegration: true }
    })

    note.noteid = id
    note.loadFile('note.html')
    note.on('focus', () => {
        console.log('focus', note.noteid)
        if(quitting) return
        //refersh z-order
        notes.delete(note.noteid)
        notes.set(note.noteid, note)
        //Todo: observe change of notes
        notelistWindow.webContents.send('order-changed', [...notes.keys()])
    })

    note.on('closed', () => {
        console.log('closed', note.noteid)
        if(quitting) return
        notes.delete(note.noteid)
        notelistWindow.webContents.send('order-changed', [...notes.keys()])
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
        webPreferences: { nodeIntegration: false }
    })
    mainWindow.setIgnoreMouseEvents(true)
    mainWindow.loadFile('app-icon.png')
    mainWindow.on('close', () => { quitting = true })
    mainWindow.on('closed', function() {
        console.log('main window closed')
        quitting = false
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
        console.log('notelist window closeing')
        if(!quitting && notes.size) {
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
/// To be honest I don't really understand what below codes doing (I can guess, though)
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