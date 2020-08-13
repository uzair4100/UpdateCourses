const electron = require('electron');
const url = require('url');
const path = require('path');
const dialog = electron.dialog;
const ipc = electron.ipcMain;
const { app, BrowserWindow } = electron;
var mainWindow;
const { shell } = require('electron')
    // 8e2565abef29d2adcab55689d4408fad7664ddf6

app.on('ready', function() {
    //create new window
    mainWindow = new BrowserWindow({
        //  minWidth: 1320,
        width: 1320,
        // minHeight: 1050,
        height: 1050,
        webPreferences: {
            nodeIntegration: true
        }
    });
    // mainWindow.openDevTools();
    //mainWindow.autoHideMenuBar = true;
    // load html
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true
    }));

});

ipc.on('selectFile-dialog', function(event) {

    var window = BrowserWindow.fromWebContents(event.sender);

    var selectFileOptions = {
        title: 'Choose File to Upload',
        buttonLabel: 'OK',
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