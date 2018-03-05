$(function() {
    $("#notifications").change(function() {
        if ($(this).prop("checked")) {
            $("#button1Action").closest('label').show();
            if ($("#button1Action").val()) $("#button2Action").closest('label').show();
            $("#showNextPrev").closest("label").show();
        } else {
            $("#button1Action").closest('label').hide();
            $("#button2Action").closest('label').hide();
            $("#showNextPrev").closest("label").hide();
        }
    });
    var button1 = function() {
        if ($(this).val()) {
            $("#button2Action").closest('label').show();
        } else {
            $("#button2Action").val("").selectmenu("refresh").closest('label').hide();
        }
    };
    $("#button1Action").selectmenu({
        width: 400,
        change: button1
    }).change(button1);
    $("#button2Action").selectmenu({
        width: 400
    });
    var noTabAction = function() {
        if ($(this).val()) {
            $("#newTabUrl").closest('label').show();
            $("#newTabActive").closest('label').show();
            $("#newTabPinned").closest('label').show();
        } else {
            $("#newTabUrl").closest('label').hide();
            $("#newTabActive").closest('label').hide();
            $("#newTabPinned").closest('label').hide();
        }
    };
    $("#clickAction").selectmenu({
        width: 400
    });
    $("#noTabAction").selectmenu({
        width: 400,
        change: noTabAction
    }).change(noTabAction);
    var newTabUrl = function() {
        if ($(this).val()) {
            $("#newTabCustomUrl").closest('table').hide();
        } else {
            $("#newTabCustomUrl").closest('table').show();
        }
    };
    $("#newTabUrl").selectmenu({
        width: 400,
        change: newTabUrl
    }).change(newTabUrl);
    $("input:submit").button().click(function(event) {
        event.preventDefault();
        var settings = {
            notifications: $("#notifications").prop("checked"),
            button1Action: $("#button1Action").val(),
            button2Action: $("#button2Action").val(),
            clickAction: $("#clickAction").val(),
            showNextPrev: $("#showNextPrev").prop("checked"),
            noTabAction: $("#noTabAction").val(),
            newTabUrl: $("#newTabUrl").val(),
            newTabCustomUrl: $("#newTabCustomUrl").val(),
            newTabActive: $("#newTabActive").prop("checked"),
            newTabPinned: $("#newTabPinned").prop("checked"),
            confirmDownload: $("#confirmDownload").prop("checked"),
            notifyDownloadComplete: $("#notifyDownloadComplete").prop("checked")
        };
        chrome.storage.sync.set(settings, function() {
            chrome.notifications.create("", {
                type: "basic",
                iconUrl: "../images/music.png",
                title: "Сохранение",
                message: "Настройки сохранены"
            }, function() {});
            chrome.runtime.getBackgroundPage(function(win) {
                for (var param in settings) {
                    win[param] = settings[param];
                }
                setTimeout(function() {
                    window.close();
                }, 500);
            });
        });
    });
    chrome["storage"].sync.get({
        notifications: true,
        button1Action: "next",
        button2Action: "download",
        clickAction: "activateTab",
        showNextPrev: true,
        noTabAction: "ask",
        newTabUrl: "http://vk.com/audio",
        newTabCustomUrl: "audio",
        newTabActive: false,
        newTabPinned: false,
        confirmDownload: false,
        notifyDownloadComplete: true
    }, function(items) {
        $("#button1Action").val(items.button1Action).selectmenu("refresh").change();
        $("#button2Action").val(items.button2Action).selectmenu("refresh");
        $("#clickAction").val(items.clickAction).selectmenu("refresh");
        $("#showNextPrev").prop("checked", items.showNextPrev).change();
        $("#notifications").prop("checked", items.notifications).change();
        $("#newTabUrl").val(items.newTabUrl).selectmenu("refresh").change();
        $("#newTabCustomUrl").val(items.newTabCustomUrl);
        $("#newTabActive").prop("checked", items.newTabActive).change();
        $("#newTabPinned").prop("checked", items.newTabPinned).change();
        $("#noTabAction").val(items.noTabAction).selectmenu("refresh").change();
        $("#confirmDownload").prop("checked", items.confirmDownload).change();
        $("#notifyDownloadComplete").prop("checked", items.notifyDownloadComplete).change();
    });
});