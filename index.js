const electron = require('electron');
const ipc = electron.ipcRenderer;
const path = require('path');
const http = require('http');
const fs = require('fs');
var cheerio = require('cheerio');
const { shell, clipboard } = require('electron');
var pretty = require('pretty');
var copy = require('recursive-copy');
const copyFile = require('fs-copy-file');
const date = require('date-and-time');
const marked = require('marked');

$(document).ready(function() {

    $('#tasks').hide();
    $('#view_files').hide();

    //open links in default browser
    $(document).on('click', 'a[href^="http"]', function(event) {
        event.preventDefault();
        shell.openExternal(this.href);
    });

    var source, alertFile, newsFile, duedatesFile, year, course, element, files, filename, fileExtension, manifestFile, data_manifest, newData_manifest, todayDate, newPath = [],
        totalFiles = [],
        filesToAdd = [],
        filesToDelete = [];

    var courseName, cheer, cheer2, cheer3, cheer4, data_resource, newData_resource, data_alert, newData_alert, data_news, newData_news, data_duedates, newData_duedates, content, content_alert,
        content_news, content_duedates, content_manifest, html, _text, taskSelected, thisElement, fileDisplayName, filePath, fileToDelete, oldFileName, originalName,
        editorNews, editorAlert, toolbarOptions = "",
        options = "",
        pathForFile;
    // alert(todayDate);
    $("#status").hide();
    //$('#resource_file_link, #alert_file_link, #news_file_link, #duedates_file_link').hide();


    //find source path
    $("#wrapper-inner").change(function() {
        course = $('#courses').find("input[type=radio]:checked").siblings('label').text();
        year = $('#year').find("input[type=radio]:checked").siblings('label').text();
        $("#newsSection").empty();
        $("#alertSection").empty();

        $('<div id="alertFile"></div>').appendTo('#alertSection');
        $('<div id="newsFile"></div>').appendTo('#newsSection');

        //set attr
        var resource_file_link = "https://courses.languages.vic.edu.au/2020/" + course + "/" + year + "/resources.html";
        var alert_file_link = "https://courses.languages.vic.edu.au/2020/" + course + "/" + year + "/alert.html";
        var news_file_link = "https://courses.languages.vic.edu.au/2020/" + course + "/" + year + "/news.html";
        var duedates_file_link = "https://courses.languages.vic.edu.au/2020/" + course + "/" + year + "/duedates.html";

        //activate button links
        $('#resource_file_link').attr('href', resource_file_link);
        $('#alert_file_link').attr('href', alert_file_link);
        $('#news_file_link').attr('href', news_file_link);
        $('#duedates_file_link').attr('href', duedates_file_link);

        source = "\\\\vsl-file01\\coursesdev$\\courses\\2020\\" + course + "\\" + year + "\\resources.html";
        alertFile = "\\\\vsl-file01\\coursesdev$\\courses\\2020\\" + course + "\\" + year + "\\alert.html";
        newsFile = "\\\\vsl-file01\\coursesdev$\\courses\\2020\\" + course + "\\" + year + "\\news.html";
        duedatesFile = "\\\\vsl-file01\\coursesdev$\\courses\\2020\\" + course + "\\" + year + "\\duedates.html";
        manifestFile = "\\\\vsl-file01\\coursesdev$\\courses\\2020\\" + course + "\\" + year + "\\manifest.xml";

        //source = path.join(require('os').homedir(), 'Desktop/resources.html');
        //source2 = path.join(require('os').homedir(), 'Desktop/resources2.html');
        //alertFile = path.join(require('os').homedir(), 'Desktop/alert.html');
        // console.log(source);

        //if course and year selected, enable view buttons
        if (course && year) {
            // $('#resource_file_link, #alert_file_link, #news_file_link, #duedates_file_link').show();
            $('#view_files').fadeIn();
        }

        //read file content
        data_resource = fs.readFileSync(source, 'utf8');
        data_resource = pretty(data_resource, { ocd: true })
        data_alert = fs.readFileSync(alertFile, 'utf8');
        data_alert = pretty(data_alert, { ocd: true });
        data_news = fs.readFileSync(newsFile, 'utf8');
        data_news = pretty(data_news, { ocd: true });
        data_duedates = fs.readFileSync(duedatesFile, 'utf8');
        data_manifest = fs.readFileSync(manifestFile, 'utf-8')

        cheer = cheerio.load(data_resource);
        cheer2 = cheerio.load(data_alert);
        cheer3 = cheerio.load(data_news);
        cheer4 = cheerio.load(data_duedates);
        cheerM = cheerio.load(data_manifest, { xmlMode: true });

        //load file content
        $("#link").html(data_resource);
        $("#alertFile").html(data_alert);
        $("#newsFile").html(data_news);
        $("#duedatesFile").html(data_duedates);


        console.log(data_resource);
        console.log(data_alert);
        console.log(data_news);
        console.log(data_duedates);
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
            ["image", "code-block", "link"],
        ]
        options = {
            modules: {
                toolbar: toolbarOptions,

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

        $(".box tbody").sortable({
            connectWith: ".box tbody"
        });
        $(".box tbody").disableSelection();

        //choose file
        $('#chooseFile').on('click', function() {
            ipc.send('selectFile-dialog')
        })
        ipc.on('selectFile-selected', function(event, file) {
            if (!file) {
                $('#status').html("No File selected");
                displayMessage()
            } else {
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
            "top": (event.pageY - 100) + "px",
            "left": event.pageX + "px"
        }).show();
    });

    $('#paste li').click(function() {

        $('#fileDisplayName').val(html);

    })

    $('#link,#duedatesFile').bind("contextmenu", function(event) {

        if (event.target) {
            if (event.target.tagName == 'A' || event.target.tagName == 'B') {
                if (event.target.tagName == 'A') {
                    thisElement = $(event.target);
                }
                if (event.target.tagName == 'B') {
                    thisElement = $(event.target).parent();
                }
                if (thisElement.attr('href')) {
                    originalName = thisElement.html();
                    console.log(originalName);
                    //fileDisplayName = $('#fileDisplayName').val();
                    fileDisplayName = originalName;
                    oldFileName = path.basename(thisElement.attr('href'));
                    if (path.extname(thisElement.attr('href')) == ".mp4") {
                        fileToDelete = "\\\\vsl-file01\\coursesdev$\\courses\\2020\\" + course + "\\" + year + "\\resources\\video\\" + oldFileName;
                    } else {
                        fileToDelete = "\\\\vsl-file01\\coursesdev$\\courses\\2020\\" + course + "\\" + year + "\\resources\\" + oldFileName;
                    }
                    console.log(fileToDelete)
                }
            }
            if (event.target.tagName.startsWith('H') || event.target.tagName == 'P' || event.target.tagName.startsWith('T')) {
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
                        // fileToDelete = "\\\\vsl-file01\\coursesdev$\\courses\\2020\\" + course + "\\" + year + "\\resources\\" + oldFileName;
                        //fileToDelete = path.join(require('os').homedir(), "/Desktop/resources/" + oldFileName);
                        thisElement.parent().remove();
                        if ($('#keepOldFile input').prop("checked") == false) { filesToDelete.push(fileToDelete) }

                    } else {
                        if (thisElement.is("td")) {
                            thisElement.parent().remove();
                        } else {
                            thisElement.remove();
                        }
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
                    if (thisElement.is("td")) {
                        thisElement.parent().before("<tr><td>workset no</td><td>task</td><td>Date</td></tr>\n");
                    } else {
                        thisElement.before(element + "\n");
                    }
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
                    if (thisElement.is("td")) {
                        thisElement.parent().after("\n<tr><td>workset no</td><td>task</td><td>Date</td></tr>");
                    } else {
                        thisElement.after("\n" + element);
                    }
                }
                displayOptions();
                break;

            case "Edit":

                if (fileDisplayName == "") {
                    fileDisplayName = originalName;
                }
                fileExtension = $('#fileExtName').val();

                if (filePath) {

                    oldFileName = path.basename(thisElement.attr('href'));
                    //fileToDelete = path.join(require('os').homedir(), "/Desktop/resources/" + oldFileName);
                    element = `<a href="${fullLink}">${fileDisplayName}</a>`;
                    console.log(element)
                    thisElement.replaceWith(element).append(fileExtension);
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

                thisElement.parent('li').wrap(function() {
                    return "<!--<li>" + $(this).html() + "</li>-->";
                });
                $("#status").html("File Commented Out");
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

            case "Add Here":
                thisElement.text(fileDisplayName);
                break;
        }




    });

    ////////////////////////////////////Update Html//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //Save html
    $("#submit").click(function() {


        if (course && year) {

            if (confirm("Update " + course + "/" + year + " ?")) {


                // $("#status").show();
                $("#status").html("File Updated")
                displayMessage()
                $('#selectTask').prop("selected", true);
                //displayMessage()
                console.log(filesToAdd);
                console.log(filesToDelete);

                if ($('#updateResourceFile input').prop("checked") == true) {
                    totalFiles.push("resources.html")
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
                    totalFiles.push("alert.html")
                    content_alert = editorAlert.root.innerHTML
                    content_alert = content_alert.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<p><br[\/]?><[\/]?p>/g, '');
                    content_alert = pretty(content_alert, { ocd: true });
                    newData_alert = fs.writeFileSync(alertFile, content_alert, 'utf8');
                    $("#alertFile").html(newData_alert);
                    console.log(content_alert);
                }

                if ($('#updateNewsFile input').prop("checked") == true) {
                    cheer3 = cheerio.load(editorNews.root.innerHTML);
                    var head = `<link rel="stylesheet" href="css/news.css">
                                <style>
                                /* Put local styles here */
                                </style>`;
                    cheer3('head').html(head);

                    cheer3("body").children().filter(function() {
                        return $(this).text().trim() == "";
                    }).remove();
                    content_news = cheer3.html();
                    console.log(content_news)
                    content_news = content_news.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#xA0;/g, '').replace(/<p><br[\/]?><[\/]?p>/g, '');
                    content_news = pretty(content_news, { ocd: true });
                    newData_news = fs.writeFileSync(newsFile, content_news, 'utf8');
                    $("#newsFile").html(newData_news);
                    console.log(newData_news);
                }

                if ($('#updateDuedatesFile input').prop("checked") == true) {
                    totalFiles.push("duedates.html")
                    cheer4 = cheerio.load($('#duedatesFile').html());
                    cheer4('.box').find('*').removeAttr('class');
                    content_duedates = cheer4.html();
                    content_duedates = content_duedates.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
                    content_duedates = pretty(content_duedates, { ocd: true });
                    newData_duedates = fs.writeFileSync(duedatesFile, content_duedates, 'utf8');
                    $("#duedatesFile").html(newData_duedates);
                    console.log(newData_duedates);
                }

                //copy and delete file
                if (filesToAdd != null) {

                    for (var i = 0; i < filesToAdd.length; i++) {
                        console.log(filesToAdd[i])
                        console.log(newPath[i])

                        copy(filesToAdd[i], newPath[i], function(err) {
                            if (!err) {
                                displayMessage();
                            }
                        })
                    }
                }

                if (filesToDelete != null) {
                    filesToDelete.forEach(function(file) {
                        fs.unlink(file, function(err) {
                            if (!err) {
                                displayMessage();
                            }
                        })
                    })
                }

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

                //reset filepath
                options = "";
                filePath = '';
                filesToDelete = [];
                filesToAdd = [];
                newPath = [];
                totalFiles = [];
                fileDisplayName = '';
                fileExtension = '';
                // $('#fileDisplayName').val(fileDisplayName);
                // $('#fileExtName').val(fileExtension);
                $('#fileDisplayName').val("");

                $('#cloud').show();
                $('#fileExtName').val("");
                $('#fileDisplayName').focus();

            }

        } else {

            $('#status').html("Select Course!");
            displayMessage();
        }
    });

    function displayMessage() {
        $("#status").show();
        setTimeout(function() {
            $("#status").fadeOut(500);
        }, 3000);
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
        //newPath.push("\\\\vsl-file01\\coursesdev$\\courses\\2020\\" + course + "\\" + year + "\\resources\\" + filename);
        //newPath = path.join(require('os').homedir(), "/Desktop/resources/" + filename);
        if (fileExtension == "mp4") {
            pathForFile = "\\\\vsl-file01\\coursesdev$\\courses\\2020\\" + course + "\\" + year + "\\resources\\video\\" + filename;
            fullLink = "https://courses.languages.vic.edu.au/2020/" + course + "/" + year + "/resources/video/" + filename;
        } else {
            pathForFile = "\\\\vsl-file01\\coursesdev$\\courses\\2020\\" + course + "\\" + year + "\\resources\\" + filename;
            fullLink = "https://courses.languages.vic.edu.au/2020/" + course + "/" + year + "/resources/" + filename;
        }
    }
    //clear app
    $('#clear').click(function() {
        location.reload();
    });
});