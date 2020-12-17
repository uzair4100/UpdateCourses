const electron = require('electron');
const ipc = electron.ipcRenderer;
const path = require('path');
const http = require('http');
const fs = require('fs');
var cheerio = require('cheerio');
const { shell, clipboard } = require('electron');
var pretty = require('pretty');
var copy = require('recursive-copy');
const date = require('date-and-time');
const marked = require('marked');
var mv = require('mv');


$(document).ready(function() {

    $('#tasks,#spin,#status').hide();
    $('.dropdown2').hide();

    //open links in default browser
    $(document).on('click', 'a[href^="http"]', function(event) {
        event.preventDefault();
        shell.openExternal(this.href);
    });

    var source, alertFile, newsFile, year, course, element, files, filename, fileExtension, manifestFile, data_manifest, newData_manifest, todayDate, newPath = [],
        totalFiles = [],
        filesToAdd = [],
        filesToDelete = [];

    var courseName, cheer, cheer2, cheer3, cheer4, data_resource, newData_resource, data_alert, newData_alert, data_news, newData_news, content, content_alert,
        content_news, content_manifest, html, taskSelected, thisElement, fileDisplayName, filePath, fileToDelete, oldFileName, originalName, originalExt, yearCalender, MOVE_FROM = [],
        MOVE_TO = [],
        editorNews, editorAlert, toolbarOptions = "",
        img1, img2, img1css,
        options = "",
        pathForFile;
    // alert(todayDate);
    //$('#resource_file_link, #alert_file_link, #news_file_link, #duedates_file_link').hide();


    //find source path
    $("#wrapper-inner").change(function() {

        yearCalender = $('#yearCalender').find("input[type=radio]:checked").siblings('label').text();
        course = $('#courses').find("input[type=radio]:checked").siblings('label').text();
        year = $('#year').find("input[type=radio]:checked").siblings('label').text();

        $("#newsSection").empty();
        $("#alertSection").empty();

        //load quill editor in alert and news file
        $('<div id="alertFile"></div>').appendTo('#alertSection');
        $('<div id="newsFile"></div>').appendTo('#newsSection');

        //set attr
        var resource_file_link = "https://courses.languages.vic.edu.au/" + yearCalender + "/" + course + "/" + year + "/resources.html";
        var alert_file_link = "https://courses.languages.vic.edu.au/" + yearCalender + "/" + course + "/" + year + "/alert.html";
        var news_file_link = "https://courses.languages.vic.edu.au/" + yearCalender + "/" + course + "/" + year + "/news.html";

        //activate live button links
        $('#resource_file_link').attr('href', resource_file_link);
        $('#alert_file_link').attr('href', alert_file_link);
        $('#news_file_link').attr('href', news_file_link);


        source = "\\\\vsl-file01\\coursesdev$\\courses\\" + yearCalender + "\\" + course + "\\" + year + "\\resources.html";
        alertFile = "\\\\vsl-file01\\coursesdev$\\courses\\" + yearCalender + "\\" + course + "\\" + year + "\\alert.html";
        newsFile = "\\\\vsl-file01\\coursesdev$\\courses\\" + yearCalender + "\\" + course + "\\" + year + "\\news.html";
        manifestFile = "\\\\vsl-file01\\coursesdev$\\courses\\" + yearCalender + "\\" + course + "\\" + year + "\\manifest.xml";

        //source = path.join(require('os').homedir(), 'Desktop/resources.html');
        //source2 = path.join(require('os').homedir(), 'Desktop/resources2.html');
        //alertFile = path.join(require('os').homedir(), 'Desktop/alert.html');
        // console.log(source);

        //if course and year selected, enable view buttons
        if (course && year) {
            // $('#resource_file_link, #alert_file_link, #news_file_link, #duedates_file_link').show();
            $('.dropdown2').fadeIn();
        }

        //read file content
        //data_resource = fs.readFileSync(source, 'utf8');
        data_resource = fileRead(source);
        data_resource = pretty(data_resource, { ocd: true })
            //data_alert = fs.readFileSync(alertFile, 'utf8');
        data_alert = fileRead(alertFile);
        data_alert = pretty(data_alert, { ocd: true });
        // data_news = fs.readFileSync(newsFile, 'utf8');
        data_news = fileRead(newsFile);
        data_news = pretty(data_news, { ocd: true });
        //data_manifest = fs.readFileSync(manifestFile, 'utf-8')
        data_manifest = fileRead(manifestFile);

        cheer = cheerio.load(data_resource);
        cheer2 = cheerio.load(data_alert);
        cheer3 = cheerio.load(data_news);
        cheerM = cheerio.load(data_manifest, { xmlMode: true });

        //load file content
        $("#link").html(data_resource);
        $("#alertFile").html(data_alert);
        $("#newsFile").html(data_news);

        //get image paths for local web server
        img1 = cheer3('img').first().attr('src')
        img2 = cheer3('img').last().attr('src')
        if (cheer3('img').first().attr('style')) {
            img1css = cheer3('img').first().attr('style')
        } else {
            img1css = "";
        }
        console.log(img1css)

        console.log(data_resource);
        console.log(data_alert);
        console.log(data_news);
        console.log(data_manifest);

        var Bold = Quill.import('formats/bold');
        var Italic = Quill.import('formats/italic');
        Bold.tagName = 'B'; // Quill uses <strong> by default
        Italic.tagName = 'I'; // Quill uses <em> by default
        Quill.register({ Bold: true, Italic: true });


        toolbarOptions = [
            [{ header: [1, 2, 3, 4, 5, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ 'color': ['red', 'blue', 'yellow', 'green', 'black'] }, { 'background': ['red', 'blue', 'yellow', 'green', 'black'] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'image', 'video', 'formula']
        ]
        options = {
            modules: {
                toolbar: toolbarOptions,
                clipboard: {
                    matchVisual: false
                }
            },
            theme: 'snow'
        };



        editorAlert = new Quill('#alertFile', options)
        editorNews = new Quill('#newsFile', options)

        courseName = course + " " + year;
        $('#courseName').html(courseName);

        $(".res_col ul").sortable({
            connectWith: ".res_col ul"
        });
        $(".res_col ul").disableSelection();


        //choose file
        $('#chooseFile').on('click', function() {

            ipc.send('selectFile-dialog')
        })
        ipc.on('selectFile-selected', function(event, file) {

            if (file) {
                filePath = file;
                console.log(filePath)
                processPath();
            }
        });

        //drag drop
        $('#selectFile').on("dragover", (e) => {
            e.preventDefault();
            e.stopPropagation();
            $('#selectFile').css({
                "opacity": "0.3"
            })
        });

        $('#selectFile').on("dragenter", (e) => {

        });

        $('#selectFile').on("dragleave", (e) => {
            $('#selectFile').css({
                "opacity": "1"
            })
        });

        $('#selectFile').on("drop", (e) => {

            e.preventDefault();
            e.stopPropagation();

            $('#selectFile').css({
                "opacity": "1"
            });

            files = e.target.files;
            if (!files || files.length === 0)
                files = (e.dataTransfer ? e.dataTransfer.files : e.originalEvent.dataTransfer.files);
            console.log(files)
            console.log(files[0].path);
            filePath = files[0].path;
            processPath();
        });


    }); //end change function

    //paste option
    $('#fileDisplayName').bind("contextmenu", function(event) {
        event.preventDefault();
        $('#paste').css({
            "top": (event.pageY - 80) + "px",
            "left": event.pageX + "px"
        }).show();
    });

    $('#paste li').click(function() {

        $('#fileDisplayName').val(html);

    })

    $('#link').bind("contextmenu", function(event) {

        if (event.target) {
            if (event.target.tagName == 'A' || event.target.tagName == 'B' || event.target.tagName == 'I') {
                if (event.target.tagName == 'A') {
                    thisElement = $(event.target);
                }
                if (event.target.tagName == 'B' || event.target.tagName == 'I') {
                    thisElement = $(event.target).parent();
                }
                if (thisElement.attr('href')) {
                    originalName = thisElement.html();
                    originalExt = path.extname(path.basename(thisElement.attr('href')));
                    originalExt = "(" + originalExt.slice(1) + ")";
                    console.log(originalName);
                    console.log(originalExt)
                        //fileDisplayName = $('#fileDisplayName').val();
                    fileDisplayName = originalName;
                    oldFileName = path.basename(thisElement.attr('href'));
                    if (path.extname(thisElement.attr('href')) == ".mp4") {
                        fileToDelete = "\\\\vsl-file01\\coursesdev$\\courses\\" + yearCalender + "\\" + course + "\\" + year + "\\resources\\video\\" + oldFileName;
                    } else {
                        fileToDelete = "\\\\vsl-file01\\coursesdev$\\courses\\" + yearCalender + "\\" + course + "\\" + year + "\\resources\\" + oldFileName;
                    }
                    console.log(fileToDelete)
                }
            }
            if (event.target.tagName.startsWith('H') || event.target.tagName == 'P') {
                thisElement = $(event.target);
                console.log(thisElement.text());
            }

            $('#tasks').css({
                top: (event.pageY) + 'px',
                left: (event.pageX) + 'px'
            }).show();
        }


    });

    $(document).click(function() {
        $('#tasks').hide();
        $('#paste').hide();

    });

    $('#tasks li').click(function() {
        $('#tasks').hide();
        taskSelected = $(this).text().trim();
    });

    $('#tasks li').click(function() {

        console.log(taskSelected)
        $('#selectTask').prop("selected", true);

        fileDisplayName = $('#fileDisplayName').val();
        fileExtension = $('#fileExtName').val();

        switch (taskSelected) {

            case "Delete":

                if (confirm("Delete (" + thisElement.text() + ") ?")) {

                    if (thisElement.attr('href')) {

                        oldFileName = path.basename(thisElement.attr('href'));
                        // fileToDelete = "\\\\vsl-file01\\coursesdev$\\courses\\" + yearCalender + "\\" + course + "\\" + year + "\\resources\\" + oldFileName;
                        //fileToDelete = path.join(require('os').homedir(), "/Desktop/resources/" + oldFileName);
                        thisElement.parent().remove();
                        if ($('#keepOldFile input').prop("checked") == false) { filesToDelete.push(fileToDelete) }

                    } else {
                        thisElement.remove();
                    }
                }
                break;

            case "Add Above":
                if (filePath) {
                    element = `<li><a href="${fullLink}">${fileDisplayName}</a> ${fileExtension}</li>`;
                    filesToAdd.push(filePath)
                    newPath.push(pathForFile);
                    //newPath.push(path.join(require('os').homedir(), "/Desktop/resources/" + filename));
                    filePath = '';
                } else {
                    fileDisplayName = marked($('#fileDisplayName').val());
                    element = fileDisplayName;
                }
                if (thisElement.attr('href')) {
                    thisElement.parent().before(element + "\n");
                } else {
                    thisElement.before(element + "\n");
                }
                displayOptions();
                break;

            case "Add Below":
                if (filePath) {
                    element = `<li><a href="${fullLink}">${fileDisplayName}</a> ${fileExtension}</li>`;
                    filesToAdd.push(filePath)
                    newPath.push(pathForFile);
                    //newPath.push(path.join(require('os').homedir(), "/Desktop/resources/" + filename));
                    filePath = '';
                } else {
                    fileDisplayName = marked($('#fileDisplayName').val());
                    element = fileDisplayName;
                }
                if (thisElement.attr('href')) {
                    thisElement.parent('li').after("\n" + element);


                } else {
                    thisElement.after("\n" + element);
                }
                displayOptions();
                break;

            case "Edit":
                if (fileDisplayName == "") {
                    fileDisplayName = originalName;
                }


                if (filePath) {

                    oldFileName = path.basename(thisElement.attr('href'));
                    //fileToDelete = path.join(require('os').homedir(), "/Desktop/resources/" + oldFileName);
                    element = `<li><a href="${fullLink}">${fileDisplayName}</a>${fileExtension}</li>`;
                    console.log(element)
                    thisElement.effect("shake", { times: 4, distance: 10 }, 800);
                    setTimeout(() => {
                        thisElement.parent('li').replaceWith(element)
                    }, 300);
                    filesToAdd.push(filePath)
                    newPath.push(pathForFile);
                    //newPath.push(path.join(require('os').homedir(), "/Desktop/resources/" + filename));
                    if ($('#keepOldFile input').prop("checked") == false) { filesToDelete.push(fileToDelete) }
                    filePath = '';
                } else {
                    if (thisElement.attr('href')) {
                        element = `<li><a href="${thisElement.attr('href')}">${fileDisplayName}</a> ${fileExtension}</li>`;
                        thisElement.parent('li').replaceWith(element);
                    } else {
                        thisElement.text(fileDisplayName);

                    }
                }

                displayOptions();
                break;

            case "Comment Out":

                if (thisElement.attr('href')) {
                    thisElement.parent('li').wrap(function() {
                        console.log("<!--<li>" + $(this).html() + "</li>-->")
                        return "<!--<li>" + $(this).html() + "</li>-->";
                    });
                } else {
                    let el2 = "<!--" + thisElement.removeAttr('class').get(0).outerHTML + "-->"
                    console.log(thisElement.removeAttr('class').get(0).outerHTML)
                    console.log(el2)
                    thisElement.replaceWith(el2)
                }
                // $("#status").html("File Commented Out");
                break;

            case "Uncomment Files":
                let content = $("#link").html();
                content = content.replace(/<!--/g, '').replace(/-->/g, '')
                $("#link").html(content);
                console.log($("#link").html())
                console.log("uncommented")
                break;

            case "Copy Text":
                if (thisElement.attr('href')) {
                    clipboard.writeText(thisElement.html());
                } else {
                    clipboard.writeText(thisElement.html());
                }

                html = clipboard.readText()
                console.log(html)
                break;

            case "Copy HTML":
                if (thisElement.attr('href')) {
                    clipboard.writeText(thisElement.parent().get(0).outerHTML);
                } else {
                    clipboard.writeText(thisElement.get(0).outerHTML);
                }

                html = clipboard.readText()
                console.log(html)
                break;



            case "Make New Column":

                $('.res_col:last').after(`<div class="res_col"><ul><h5>New Column</h5><li><a href="https://www.vsl.vic.edu.au/">Edit me</a></li></ul></div>`)

                break;

        }




    });

    ////////////////////////////////////Update Html//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //Save html
    $("#submit").click(function() {
        var allFiles = [],
            allFilesNames = '';
        if ($('#updateResourceFile input').prop("checked") == true) {
            allFiles.push("resources.html")
        }
        if ($('#updateAlertFile input').prop("checked") == true) {
            allFiles.push("alert.html")
        }
        if ($('#updateNewsFile input').prop("checked") == true) {
            allFiles.push("news.html")
        }

        allFiles.forEach(function(file) {
            allFilesNames += "\n" + file;
        })

        console.log(allFilesNames)

        if (course && year) {

            if (confirm("Update " + course + "/" + year + " " + allFilesNames + " ?")) {

                $("#spin").show();
                // $("#status").html("Updated " + course + " " + year)

                $('#selectTask').prop("selected", true);
                //displayMessage()
                console.log(filesToAdd);
                console.log(filesToDelete);

                if ($('#updateResourceFile input').prop("checked") == true) {
                    //remove empty columns
                    $('.res_col').each(function() {
                        if ($.trim($(this).children().children().text()) == "") {
                            $(this).remove();
                        }
                    })

                    //remove Jquery ui classes
                    cheer = cheerio.load($('#link').html())
                    cheer(".res_col").find('*').removeAttr("id").removeAttr("class");
                    //write new html to respurce file
                    content = cheer.html();
                    content = pretty(content, { ocd: true });
                    console.log(content);
                    newData_resource = fs.writeFileSync(source, content, 'utf8')
                    $("#link").html(newData_resource);

                } //end updating resource file



                if ($('#updateAlertFile input').prop("checked") == true) {
                    content_alert = editorAlert.root.innerHTML
                    content_alert = content_alert.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<p><br[\/]?><[\/]?p>/g, '');
                    content_alert = pretty(content_alert, { ocd: true });
                    newData_alert = fs.writeFileSync(alertFile, content_alert, 'utf8');
                    $("#alertFile").html(newData_alert);
                    console.log(content_alert);
                }

                if ($('#updateNewsFile input').prop("checked") == true) {
                    let N = cheerio.load(editorNews.root.innerHTML)
                    N('img').first().attr({ "src": img1, "style": img1css })
                    N('img').last().attr('src', img2)
                    content_news = N('body').html()
                        //content_news = editorNews.root.innerHTML;
                    content_news = content_news.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#xA0;/g, '').replace(/&apos;/g, "'");
                    content_news = pretty(content_news, { ocd: true });
                    newData_news = fs.writeFileSync(newsFile, content_news, 'utf8');
                    $("#newsFile").html(newData_news);
                    console.log(newData_news);
                }

                //copy and delete file
                if (filesToDelete != null) {
                    filesToDelete.forEach(function(file) {
                        fs.unlink(file, function(err) {
                            if (!err) {
                                console.log("file deleted");

                            }
                        })
                    })
                }

                if (filesToAdd != null) {

                    for (var i = 0; i < filesToAdd.length; i++) {
                        console.log(filesToAdd[i])
                        console.log(newPath[i])
                        MOVE_FROM.push(filesToAdd[i])
                        var uploaded = filesToAdd[i].split("\\")
                        uploaded.pop()
                        uploaded = uploaded.join("\\")
                        console.log(uploaded)
                        uploaded = uploaded + "\\uploaded\\" + path.basename(filesToAdd[i]);
                        console.log(uploaded)
                        MOVE_TO.push(uploaded)
                        copy(filesToAdd[i], newPath[i], function(err) {
                            if (!err) {
                                console.log(MOVE_FROM)
                                console.log(MOVE_TO)
                                console.log("file added")
                            }
                        })

                    }

                }
                setTimeout(() => {
                    moveToUploaded(MOVE_FROM, MOVE_TO)
                }, 500);

                /*
                console.log(totalFiles)
                    //update manifest file
                todayDate = date.format(new Date(), 'YYYYMMDDHHmmss');
                cheerM('mydate').text(todayDate);
                cheerM('file').each(function(index, file) {
                        if (totalFiles.includes($(this).text())) {
                            cheerM(this).attr("date", todayDate)
                                //console.log($(this).attr('date').val())
                        }
                    })
                    //console.log(cheerM.html())
                content_manifest = cheerM.html();
                newData_manifest = fs.writeFileSync(manifestFile, content_manifest, 'utf8')
                console.log(newData_manifest);
                */

                //reset filepath
                setTimeout(() => {
                    displayMessage("Updated " + course + " " + year, 4000);

                    options = "";
                    filePath = '';
                    filesToDelete = [];
                    filesToAdd = [];
                    newPath = [];
                    totalFiles = [];
                    fileDisplayName = '';
                    fileExtension = '';
                    MOVE_FROM = [];
                    MOVE_TO = [];
                    $('#fileDisplayName').val("");
                    $('#cloud').show();
                    $('#fileExtName').val("");
                    $('#fileDisplayName').focus();
                }, 1500);

            }

        } else {

            displayMessage("Select Course!", 1000);
        }
    });

    function fileRead(file) {
        let fileContents
        try {
            fileContents = fs.readFileSync(file, 'utf-8');
        } catch (err) {
            if (err.code === 'ENOENT') {
                console.log('File not found!');
                fileContents = `<div style=" text-align: center !important;
                color: black !important;
                font-size: 30px !important;
                font-weight: 600 !important;">${err}</div>`
            } else {
                throw err;
            }
        }
        return fileContents
    }

    function displayMessage(msg, duration) {
        $('#spin').hide();
        $("#status").html(msg).show();
        setTimeout(function() {
            $("#status").fadeOut(500);
        }, duration);
    }

    function displayOptions() {
        $("#selectedFileName").html("Drag File here");
        $('#cloud, #chooseFile').show();
        $('#fileDisplayName').val("");
        $('#fileDisplayName').focus();
    }

    function processPath() {
        //process file path
        filename = path.basename(filePath);
        $("#selectedFileName").html(filename);
        $('#cloud').hide();
        $("#selectedFileName").show();
        fileExtension = path.extname(filePath).slice(1);
        $('#fileDisplayName').val(filename);
        $('#fileExtName').val("(" + fileExtension + ")");
        fileDisplayName = $('#fileDisplayName').val();
        // filesToAdd.push(filePath)
        //newPath.push("\\\\vsl-file01\\coursesdev$\\courses\\" + yearCalender + "\\" + course + "\\" + year + "\\resources\\" + filename);
        //newPath = path.join(require('os').homedir(), "/Desktop/resources/" + filename);
        if (fileExtension == "mp4") {
            pathForFile = "\\\\vsl-file01\\coursesdev$\\courses\\" + yearCalender + "\\" + course + "\\" + year + "\\resources\\video\\" + filename;
            fullLink = "https://courses.languages.vic.edu.au/" + yearCalender + "/" + course + "/" + year + "/resources/video/" + filename;
        } else {
            pathForFile = "\\\\vsl-file01\\coursesdev$\\courses\\" + yearCalender + "\\" + course + "\\" + year + "\\resources\\" + filename;
            fullLink = "https://courses.languages.vic.edu.au/" + yearCalender + "/" + course + "/" + year + "/resources/" + filename;
        }
    }

    function moveToUploaded(src, dest) {
        if ($('#moveToUpload input').prop("checked") == true) {

            for (var i = 0; i < src.length; i++) {
                mv(src[i], dest[i], function(err) {
                    if (!err) {
                        console.log("file moved to " + dest[i])
                    }
                });
            }
            src = [], dest = []
        }
    }

    //clear app
    $('#clear').click(function() {
        location.reload();
    });
});