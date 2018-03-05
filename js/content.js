function exec(code) {
    var elt = document.createElement("script");
    elt.innerHTML = code;
    document.head.appendChild(elt);
    document.head.removeChild(elt);
}
exec("\
var decode = function(str) {\
	var x = document.createElement('div');\
    x.innerHTML = str;\
    return x.innerText;\
};\
var setupAudioPlayerInterval;\
var setupAudioPlayer = function() {\
	if(window.audioPlayer) {\
		audioPlayer.oldSendNotification = audioPlayer.sendNotification;\
		audioPlayer.sendNotification = function(data) {\
			audioPlayer.oldSendNotification();\
            var pList = (window.ls && ls.get('pad_playlist') && ls.get('pad_playlist')[data.id] && ls.get('pad_playlist')) ||\
                (window.audioPlaylist && audioPlaylist[data.id] && audioPlaylist) ||\
                (window.cur && cur.nextPlaylist && cur.nextPlaylist[data.id] && cur.nextPlaylist) ||\
                (padAudioPlaylist() && padAudioPlaylist()[data.id] && padAudioPlaylist());\
            var a2o = function(ar) {\
                return {\
                    performer: decode(ar[5]),\
                    title: decode(ar[6]),\
                    duration: ar[4],\
                    url: decode(ar[2])\
                }\
            };\
			chrome.runtime.sendMessage('" + chrome.runtime.id + "', {audio: a2o(pList?pList[data.id]:audioPlayer.getSongInfoFromDOM(data.id)), prev: pList&&pList[data.id]._prev?a2o(pList[pList[data.id]._prev]):false, next: pList&&pList[data.id]._next?a2o(pList[pList[data.id]._next]):false});\
		};\
        audioPlayer.oldPlayback = audioPlayer.playback;\
        audioPlayer.playback = function(paused) {\
            audioPlayer.oldPlayback(paused);\
            if(paused) chrome.runtime.sendMessage('" + chrome.runtime.id + "', {paused: true});\
        };\
        audioPlayer.oldShowCurrentAdded = audioPlayer.showCurrentAdded;\
        audioPlayer.showCurrentAdded = function(cancel) {\
            audioPlayer.oldShowCurrentAdded(cancel);\
            if(cancel) chrome.runtime.sendMessage('" + chrome.runtime.id + "', {notification: {title: 'Удаление', message: 'Аудиозапись удалена'}});\
            else chrome.runtime.sendMessage('" + chrome.runtime.id + "', {notification: {title: 'Добавление', message: 'Аудиозапись добавлена'}});\
        };\
		if(setupAudioPlayerInterval) clearInterval(checkAudioPlayerInterval);\
	}\
    else if(window.getAudioPlayer) {\
        window.getAudioPlayer().on(this, AudioPlayer.EVENT_PLAY, function(i) {\
            var ap = window.getAudioPlayer(),\
                e = ap.getCurrentAudio(),\
                o = ap.getCurrentPlaylist();\
            var cur = AudioUtils.asObject(i);\
            var next = false, prev = false;\
            if (e && o) {\
                var s = Math.max(0, o.indexOfAudio(e) - 1);\
                prev = AudioUtils.asObject(o.getAudioAt(s));\
                next = AudioUtils.asObject(o.getNextAudio(e));\
            }\
            chrome.runtime.sendMessage('" + chrome.runtime.id + "', {audio: cur, prev: prev, next: next});\
        });\
        window.getAudioPlayer().on(this, AudioPlayer.EVENT_PAUSE, function(i) {\
            chrome.runtime.sendMessage('" + chrome.runtime.id + "', {paused: true});\
        });\
        if(setupAudioPlayerInterval) clearInterval(setupAudioPlayerInterval);\
    }\
};\
if(window.audioPlayer || window.getAudioPlayer) setupAudioPlayer();\
else setupAudioPlayerInterval = setInterval(setupAudioPlayer, 100);\
");

function dovdmhkeysAction(action) {
    switch (action) {
        case "playpause":
            exec("\
if(window.audioPlayer) {\
	if(!audioPlayer.player || audioPlayer.player.paused()) {\
		var aid = currentAudioId() || (window.cur.defaultTrack && cur.defaultTrack.id) || (padAudioPlaylist() && padAudioPlaylist().start);\
		if(aid) {\
			playAudioNew(aid);\
		} else {\
			headPlayPause();\
			setTimeout(function() { Pads.hide('mus'); }, 500);\
		}\
	} else {\
		audioPlayer.pauseTrack();\
	}\
} else if(window.getAudioPlayer) {\
    window.getAudioPlayer().isPlaying()?window.getAudioPlayer().pause():window.getAudioPlayer().play();\
} else {\
	headPlayPause();\
	setTimeout(function() { Pads.hide('mus'); }, 500);\
}\
");
            break;
        case "play":
            exec("\
if(window.audioPlayer) {\
	if(!audioPlayer.player || audioPlayer.player.paused()) {\
		var aid = currentAudioId() || (window.cur.defaultTrack && cur.defaultTrack.id) || (padAudioPlaylist() && padAudioPlaylist().start);\
		if(aid) {\
			playAudioNew(aid);\
		} else {\
			headPlayPause();\
			setTimeout(function() { Pads.hide('mus'); }, 500);\
		}\
	}\
} else if(window.getAudioPlayer) {\
    window.getAudioPlayer().play();\
} else {\
	headPlayPause();\
	setTimeout(function() { Pads.hide('mus'); }, 100);\
}\
");
            break;
        case "pause":
            exec("\
if(window.audioPlayer) {\
	audioPlayer.pauseTrack();\
} else if(window.getAudioPlayer) {\
    window.getAudioPlayer().pause();\
}\
");
            break;
        case "next":
            exec("\
if(window.audioPlayer) {\
	audioPlayer.nextTrack(true);\
} else if(window.getAudioPlayer) {\
    window.getAudioPlayer().playNext();\
} else {\
	headPlayPause();\
	setTimeout(function() { Pads.hide('mus'); }, 500);\
}\
");
            break;
        case "prev":
            exec("\
if(window.audioPlayer) {\
	audioPlayer.prevTrack(true);\
} else if(window.getAudioPlayer) {\
    window.getAudioPlayer().playPrev();\
} else {\
	headPlayPause();\
	setTimeout(function() { Pads.hide('mus'); }, 500);\
}\
");
            break;
        case "stop":
            exec("\
if(window.audioPlayer) {\
	audioPlayer.stop();\
} else if(window.getAudioPlayer) {\
    window.getAudioPlayer().stop();\
}\
");
            break;
        case "vol+":
            exec("\
var volume = Math.min(1, audioPlayer.player.getVolume() + 0.05);\
if(window.audioPlayer) {\
	audioPlayer.player.setVolume(volume);\
} else if(window.getAudioPlayer) {\
    window.getAudioPlayer().setVolume(volume);\
}\
");
            break;
        case "vol-":
            exec("\
var volume = Math.max(0, audioPlayer.player.getVolume() - 0.05);\
if(window.audioPlayer) {\
	audioPlayer.player.setVolume(volume);\
} else if(window.getAudioPlayer) {\
    window.getAudioPlayer().setVolume(volume);\
}\
");
        case "mute":
            exec("\
if(window.audioPlayer) {\
	audioPlayer.player.setVolume(0);\
} else if(window.getAudioPlayer) {\
    window.getAudioPlayer().setVolume(0);\
}\
");
            break;
        case "favorite":
            exec("\
if(window.audioPlayer) {\
    var aid = currentAudioId();\
    if(!aid && audioPlayer.lastSong) aid = audioPlayer.lastSong.aid;\
    if(!aid || aid.split('_')[0] != vk.id) audioPlayer.addCurrentTrack();\
	else chrome.runtime.sendMessage('" + chrome.runtime.id + "', {notification: { title: 'Аудиозапись не добавлена', message: 'Вы не можете добавлять собственные аудиозаписи'}});\
}\
");
            break;
    }
}

chrome.runtime.onMessage.removeListener();
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (sender.id === chrome.runtime.id) {
            dovdmhkeysAction(request.action);
        }
    }
);