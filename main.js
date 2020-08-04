const electron = require('electron');
const url = require('url');
const path = require('path');
const dialog = electron.dialog;
const ipc = electron.ipcMain;
const { app, BrowserWindow, autoupdater } = electron;
var mainWindow;
const { shell } = require('electron')


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
    dialog.showOpenDialog(window, selectFileOptions, function(file) {

        if (file) {
            event.sender.send('selectFile-selected', file);
            console.log(file);
        } else { console.log("No File Selected") }
    });

});