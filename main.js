const electron = require('electron');
const url = require('url');
const path = require('path');
const dialog = electron.dialog;
const ipc = electron.ipcMain;
const { app, BrowserWindow } = electron;
const { shell } = require('electron')
var window;
// 8e2565abef29d2adcab55689d4408fad7664ddf6

app.on('ready', function() {
    //create new window
    mainWindow = new BrowserWindow({
        minWidth: 1150,
        width: 1150,
        minHeight: 790,
        height: 790,
        webPreferences: {
            nodeIntegration: true
        }
    });
    //mainWindow.openDevTools();
    //mainWindow.autoHideMenuBar = true;
    // load html
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true
    }));
    mainWindow.removeMenu()

});

ipc.on('selectFile-dialog', function(event) {

    var window = BrowserWindow.fromWebContents(event.sender);
    var selectFileOptions = {
        title: 'Choose File to Upload',
        buttonLabel: 'Add',
        properties: [
            'openFile'
        ]
    };

    dialog.showOpenDialog(window, selectFileOptions, function(file, err) {
        if (file) {
            event.sender.send('selectFile-selected', file[0]);
            console.log(file);
        } else {
            event.sender.send('selectFile-selected', err)

        }
    });

});