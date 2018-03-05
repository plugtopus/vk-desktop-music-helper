var hostInstalled = false;
var hostShouldBeInstalled = false;
var port = null;
var tabId = null;
var notificationId = null;
var audioNotificationId = null;
var noTabNotificationId = null;
var downloadNotificationId = null;
var installNotificationId = null;
var installDownloadedNotificationId = null;
var disconnectedNotificationId = null;
var installDownloadId = null;
var currentAudioInfo = null;
var currentDownloaded = null;
var downloads = {};
var emptyFn = function() {};

function sendNativeMessage(value) {
    port.postMessage({
        audio: value
    });
}

function createTab(callback) {
    var createTabInternal = function(callback) {
        chrome.tabs.onUpdated.addListener(tabOnUpdated);
        chrome.tabs.create({
            url: newTabUrl || "http://vk.com/" + newTabCustomUrl,
            active: newTabActive,
            pinned: newTabPinned
        }, function(tab) {
            callback(tabId = tab.id);
        });
    };
    chrome.windows.getAll(function(windows) {
        if (windows.length) createTabInternal(callback);
        else {
            chrome.tabs.onUpdated.addListener(tabOnUpdated);
            chrome.windows.create({
                url: newTabUrl || "http://vk.com/" + newTabCustomUrl
            }, function() {
                chrome.tabs.query({
                    url: [
                        "*://vk.com/*"
                    ]
                }, function(tabs) {
                    callback(tabId = tabs[0].id);
                });
            });
        }
    });
}

function getTabId(callback) {
    var noTabHandler = function(callback) {
        switch (noTabAction) {
            case "ask":
                if (noTabNotificationId) chrome.notifications.clear(noTabNotificationId, emptyFn);
                chrome.notifications.create("", {
                    type: "basic",
                    iconUrl: "images/music.png",
                    title: "Сайт не открыт",
                    message: "Открыть сайт и выполнить действие?",
                    buttons: [{
                            title: "Да",
                            iconUrl: "images/yes.png"
                        },
                        {
                            title: "Нет",
                            iconUrl: "images/no.png"
                        }
                    ]
                }, function(id) {
                    noTabNotificationId = id;
                });
                break;
            case "create":
                createTab(callback);
        }
    };
    if (tabId) {
        chrome.tabs.query({
            url: [
                "*://vk.com/*",
                "*://new.vk.com/*"
            ]
        }, function(tabs) {
            var exists = false;
            for (var i = 0; i < tabs.length; i++) {
                if (tabs[i].id === tabId) {
                    exists = true;
                    break;
                }
            }
            if (exists) callback(tabId);
            else if (tabs.length) callback(tabId = tabs[0].id);
            else noTabHandler(callback);
        });
    } else chrome.tabs.query({
        url: [
            "*://vk.com/*",
            "*://new.vk.com/*"
        ]
    }, function(tabs) {
        if (tabs.length) callback(tabId = tabs[0].id);
        else noTabHandler(callback);
    });

}

function onNativeMessage(message) {
    var action = message.action;
    if (action === 'handshake') {
        hostInstalled = true;
        hostShouldBeInstalled = false;
    } else
        getTabId(function(tabId) {
            chrome.tabs.sendMessage(tabId, {
                action: action
            });
        });
}

function onDisconnected() {
    if (hostInstalled) chrome.notifications.create("", {
        type: "basic",
        iconUrl: "images/no.png",
        title: "Связь прервана",
        message: "Связь с дополнительным программным обеспечением прервана. Это значит, что горячие клавиши не будут работать. Попробовать восстановить связь?",
        buttons: [{
                title: "Да",
                iconUrl: "images/yes.png"
            },
            {
                title: "Нет",
                iconUrl: "images/no.png"
            }
        ]
    }, function(id) {
        disconnectedNotificationId = id;
    });
}

function connect() {
    var hostName = "com.vk.lufton.vdmh";
    port = chrome.runtime.connectNative(hostName);
    port.onMessage.addListener(onNativeMessage);
    port.onDisconnect.addListener(onDisconnected);
    setTimeout(function() {
        if (!hostInstalled) {
            if (hostShouldBeInstalled) connect();
            else if (localStorage && !localStorage['ignoreHostInstallation']) {
                chrome.notifications.create("", {
                    type: "basic",
                    iconUrl: "images/download.png",
                    title: "Установка приложения для Windows",
                    message: "Для управления воспроизведения при помощи горячих клавиш необходимо установить дополнительное программное обеспечение. Кликните по данному сообщению чтобы начать загрузку."
                }, function(id) {
                    localStorage['ignoreHostInstallation'] = true;
                    installNotificationId = id;
                });
            }
        }
    }, 3000);
}

function showAudioNotification() {
    var buttons = {
        next: {
            title: "Следующий трек",
            iconUrl: "images/next.png"
        },
        pause: {
            title: "Приостановить",
            iconUrl: "images/pause.png"
        },
        prev: {
            title: "Предыдущий трек",
            iconUrl: "images/prev.png"
        },
        download: {
            title: "Скачать",
            iconUrl: "images/download.png"
        },
        mute: {
            title: "Выключить звук",
            iconUrl: "images/mute.png"
        },
        favorite: {
            title: "Добавить/Удалить",
            iconUrl: "images/star.png"
        }
    };
    if (audioNotificationId) chrome.notifications.clear(audioNotificationId, emptyFn);
    var items = [];
    if (button1Action) items.push(buttons[button1Action]);
    if (showNextPrev && button1Action === "prev" && currentAudioInfo.prev) items[items.length - 1].title += ' (' + currentAudioInfo.prev.performer + ' - ' + currentAudioInfo.prev.title + ')';
    else if (showNextPrev && button1Action === "next" && currentAudioInfo.next) items[items.length - 1].title += ' (' + currentAudioInfo.next.performer + ' - ' + currentAudioInfo.next.title + ')';
    if (button2Action) items.push(buttons[button2Action]);
    if (showNextPrev && button2Action === "prev" && currentAudioInfo.prev) items[items.length - 1].title += ' (' + currentAudioInfo.prev.performer + ' - ' + currentAudioInfo.prev.title + ')';
    else if (showNextPrev && button2Action === "next" && currentAudioInfo.next) items[items.length - 1].title += ' (' + currentAudioInfo.next.performer + ' - ' + currentAudioInfo.next.title + ')';
    var params = {
        type: "basic",
        iconUrl: "images/music.png",
        title: currentAudioInfo.title + ' (' + duration(currentAudioInfo.duration) + ')',
        message: currentAudioInfo.performer,
        buttons: items
    };
    if (showNextPrev && currentAudioInfo.next) params.contextMessage = 'Далее: ' + currentAudioInfo.next.performer + ' - ' + currentAudioInfo.next.title;
    chrome.notifications.create("", params, function(id) {
        audioNotificationId = id;
    });
}

function tabOnUpdated(id, info) {
    if (id === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(tabOnUpdated);
        chrome.browserAction.setIcon({
            path: "images/play.png"
        });
        onNativeMessage({
            action: "playpause"
        });
    }
}

function duration(dur) {
    return dur < 60 * 60 ?
        new Date(null, null, null, null, null, dur).toTimeString().match(/(\d{2}:\d{2})\s/)[1] :
        new Date(null, null, null, null, null, dur).toTimeString().match(/(\d{2}:\d{2}:\d{2})\s/)[1];
}

function doAction(action) {
    switch (action) {
        case "next":
        case "pause":
        case "prev":
        case "mute":
        case "favorite":
            onNativeMessage({
                action: action
            });
            break;
        case "download":
            var exists = false;
            for (var downloadId in downloads) {
                if (downloads[downloadId] === currentAudioInfo) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                chrome.downloads.download({
                    url: currentAudioInfo.url,
                    filename: (currentAudioInfo.performer + " - " + currentAudioInfo.title + ".mp3").replace(/[|&;$%@"<>()+,:?/\\*]/g, ''),
                    saveAs: confirmDownload
                }, function(id) {
                    downloads[id] = currentAudioInfo;
                });
            }
            break;
    }
}
document.addEventListener('DOMContentLoaded', function() {
    connect();
    chrome.tabs.query({
        url: [
            "*://vk.com/*",
            "*://new.vk.com/*"
        ]
    }, function(tabs) {
        for (var i = 0; i < tabs.length; i++) {
            chrome.tabs.executeScript(tabs[i].id, {
                file: "content.js"
            });
        }
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
        for (var param in items) {
            window[param] = items[param];
        }
    });
    chrome.tabs.onUpdated.addListener(function(id, changeInfo) {
        if (tabId === id && changeInfo.status && changeInfo.status === "loading") chrome.browserAction.setIcon({
            path: "images/play.png"
        });
    });
    chrome.tabs.onRemoved.addListener(function(id) {
        if (tabId === id) chrome.browserAction.setIcon({
            path: "images/play.png"
        });
    });
    chrome.browserAction.onClicked.addListener(function() {
        onNativeMessage({
            action: "playpause"
        });
    });
    chrome.runtime.onMessageExternal.addListener(
        function(request) {
            if (request.audio) {
                chrome.browserAction.setIcon({
                    path: "images/pause.png"
                });
                currentAudioInfo = request.audio;
                if (request.prev) currentAudioInfo.prev = request.prev;
                if (request.next) currentAudioInfo.next = request.next;
                if (notifications)
                    showAudioNotification();
            } else if (request.notification) {
                if (notificationId) chrome.notifications.clear(notificationId, emptyFn);
                chrome.notifications.create("", {
                    type: "basic",
                    iconUrl: "images/music.png",
                    title: request.notification.title,
                    message: request.notification.message
                }, function(id) {
                    notificationId = id;
                });
            } else if (request.paused) {
                chrome.browserAction.setIcon({
                    path: "images/play.png"
                });
            }
        }
    );
    chrome.notifications.onClicked.addListener(function(notifId) {
        switch (notifId) {
            case audioNotificationId:
                switch (clickAction) {
                    case "activateTab":
                        getTabId(function(tabId) {
                            chrome.tabs.get(tabId, function(tab) {
                                chrome.windows.update(tab.windowId, {
                                    focused: true
                                });
                                chrome.tabs.update(tab.id, {
                                    active: true
                                });
                            });
                        });
                        break;
                    case "showOptions":
                        chrome.tabs.create({
                            url: "chrome://extensions/?options=" + chrome.runtime.id
                        });
                        break;
                }
                break;
            case installNotificationId:
                chrome.downloads.download({
                    url: 'http://tiny.cc/vhotkeys',
                    filename: 'vhotkeysinstall.exe',
                    conflictAction: 'overwrite'
                }, function(id) {
                    installDownloadId = id;
                });
                break;
            case installDownloadedNotificationId:
                chrome.downloads.open(installDownloadId);
                break;
        }
    });
    chrome.notifications.onButtonClicked.addListener(function(notifId, btnIdx) {
        switch (notifId) {
            case audioNotificationId:
                if (btnIdx === 0) {
                    doAction(button1Action);
                } else {
                    doAction(button2Action);
                }
                break;
            case noTabNotificationId:
                if (btnIdx === 0) {
                    createTab(function() {});
                }
                break;
            case downloadNotificationId:
                if (btnIdx === 0) {
                    chrome.downloads.open(currentDownloaded);
                } else {
                    chrome.downloads.show(currentDownloaded);
                }
                break;
            case disconnectedNotificationId:
                if (btnIdx === 0) connect();
                break;
        }
    });
    chrome.downloads.onChanged.addListener(function(data) {
        if (!data.state || data.state.current !== "complete") return;
        if (data.id === installDownloadId) {
            chrome.notifications.create("", {
                type: "basic",
                iconUrl: "images/music.png",
                title: "Продолжение установки",
                message: "Для продолжения установки кликните по данному сообщению."
            }, function(id) {
                installDownloadedNotificationId = id;
            });
            hostShouldBeInstalled = true;
            setTimeout(function() {
                connect();
            }, 7000);
        }
        if (!downloads[data.id]) return;
        if (!notifyDownloadComplete) return;
        currentDownloaded = data.id;
        if (downloadNotificationId) chrome.notifications.clear(downloadNotificationId, emptyFn);
        chrome.notifications.create("", {
            type: "basic",
            iconUrl: "images/download.png",
            title: "Загрузка завершена",
            message: downloads[data.id].performer + " - " + downloads[data.id].title,
            buttons: [{
                    title: "Воспроизвести",
                    iconUrl: "images/play.png"
                },
                {
                    title: "Открыть в папке",
                    iconUrl: "images/explore.png"
                }
            ]
        }, function(id) {
            delete downloads[data.id];
            downloadNotificationId = id;
        });
    });
});