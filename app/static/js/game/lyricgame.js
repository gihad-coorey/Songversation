let playlistCache = {};
let availableTrackIDs = [];

let loadedTracks = new Map();
/** List of all trackIDs with lyrics */
let loadedLyrics = [];

/** @type Track */
let currentTrack = null;

let score = 0;

let objectID;

const keyUp = 38,
    keyDown = 40,
    keyEnter = 13;

/* 
    TODO: 
    - ensure only songs with lyrics can get selected
    - ensure playlists have songs on spotify 
    - remove local tracks
    - remove punctuation from autocomplete search
    - keyboard support - arrowkey autocomplete, enter to submit
    - some lyric links return 404 - make sure thats fixed
    - make the autocomplete include artist names 
*/

$(window).on("load", function () {
    objectID = window.location.pathname.split("/").pop(); // get the last part in the path
    if (window.location.pathname.includes("/playlist/")) {
        getPlaylist(objectID).then((response) => {
            if (response.error === true) {
                displayError(response.message);
            } else {
                loadGameWithPlaylist(response);
            }
        });
    } else if (window.location.pathname.includes("/artist/")) {
        getArtistTracks(objectID).then((response) => {
            if (response.error === true) {
                displayError(response.message);
            } else {
                loadGameWithArtist(response);
            }
        });
    }
});

function displayError(message) {
    let game = $("#lyric-game");
    game.empty();
    game.append(errorMessageComponent(message));
    $("#loader-container").remove();
}

function getPlaylist(playlistID) {
    return $.getJSON(`/api/get-playlist/${playlistID}`);
}

function getArtistTracks(artistID) {
    return $.getJSON(`/api/get-artist-tracks/${artistID}`);
}

function loadGameWithPlaylist(playlist) {
    loadedTracks = playlist.tracks.reduce(function (map, obj) {
        map[obj.id] = obj;
        return map;
    }, {});
    loadGame(loadedTracks);
}

function loadGameWithArtist(artist) {
    loadedTracks = artist.reduce(function (map, obj) {
        map[obj.id] = obj;
        return map;
    }, {});
    loadGame(loadedTracks);
}

function loadGame(trackDict) {
    console.log(trackDict);

    availableTrackIDs = Object.keys(trackDict);
    availableTrackIDs = availableTrackIDs.filter((n) => n).shuffle(); // remove null track ids (local files) and shuffle

    // playlist icon
    /*selectedPlaylist = coverArtBoxComponent(playlist);
    selectedPlaylist.css("animation", "fade-in 1s");
    selectedPlaylist.addClass("selected-playlist");
    $("#selected-cover-art").append(selectedPlaylist);*/

    // register autocomplete options
    const trackListDiv = $("#track-list");
    Object.values(trackDict).forEach(function (track) {
        trackListDiv.append($("<li>", { html: `${trackListDisplay(track)}` }));
    });

    $("#score-text").html(`0`);

    loadLyrics(5, [...availableTrackIDs], true);
}

function finishScreen() {
    /*
        TODO:
        - replay with same playlist
        - back to playlists
    */

    commitStats(score, currentTrack['id']);
    showTrack(currentTrack);
  
    $("#streak-score").html(`Final Streak: ${score}`);
    $("#win-modal").modal("show");
}

function commitStats(score, songFailedOn) {
    let parts = window.location.pathname.split("/");
    let gameType = parts[parts.length - 2];

    console.log(gameType)

    let valid_types = ["playlist", "artist"];
    if (!valid_types.includes(gameType)) {
        console.log(`Game type, ${gameType} is invalid`);
        return;
    }

    $.post("/api/add-game", { score: score, last_song: songFailedOn, game_type: gameType, game_object_id: objectID })
        .done(function () {
            console.log("Stats saved successfully.");
        })
        .fail(function () {
            console.log("Error saving stats.");
        });
}

function trackListDisplay(track) {
    return `${track.name} - ${track.artists.join(", ")}`;
}

// BUTTONS
function skipButton() {
    playSong(currentTrack);
    finishScreen();
}

function checkButton() {
    input = $("#guess-input");
    if (input.val() == trackListDisplay(currentTrack)) {
        score++;
        $("#score-text").html(`${score}`);
        chooseLyrics();
    } else {
        playSong(currentTrack);
        finishScreen();
        console.log("wrong");
    }

    input.val("");
}
/**
 * Will load all lyrics in order from the availableTrackIDs array into the loadedTracks map
 * First time loads of playlists with large amounts of lyric-less songs could be slow
 * @param {number} numToLoad - The amount of tracks to request lyrics for at once
 * @param {Array} tracksToLoad - A list of trackIDs to get lyrics for
 * @param {boolean} startGame - Whether the game will start when finding suitable lyrics
 * */
function loadLyrics(numToLoad, tracksToLoad, startGame) {
    numToLoad = Math.min(numToLoad, tracksToLoad.length);
    toLoad = tracksToLoad.splice(tracksToLoad.length - numToLoad, numToLoad);
    $.getJSON("/api/get-track-lyrics?track_ids=" + toLoad).done(function (response) {
        for (const track_id in response.track_lyrics) {
            loadedTracks[track_id].lyrics = response.track_lyrics[track_id];
            if (response.track_lyrics[track_id].length > 0) loadedLyrics.push(track_id);
        }

        // will only be called on the first load
        if (loadedLyrics.length > 0 && startGame) {
            chooseLyrics();
            loader = $("#loader-container");
            if (loader) loader.remove();
            startGame = false;
        }
        if (tracksToLoad.length != 0) {
            loadLyrics(numToLoad, tracksToLoad, startGame);
        } 
        // when lyrics have finished loading
        else {
            console.log("finished loading lyrics");
            if (loadedLyrics.length == 0) {
                console.log("no lyrics")
            }
        }
    });
}

function chooseLyrics(trackID) {
    // choose random song
    if (!trackID) trackID = loadedLyrics.pop();

    if (loadedLyrics.length == 0) {
        console.log("out of songs");
    }
    currentTrack = loadedTracks[trackID];
    loadSong(currentTrack);
    displayLyrics(loadedTracks[trackID].lyrics, trackID);
}

function displayLyrics(lyrics, trackID) {
    // clear box from any previous attempts
    $("#lyric-box").empty();

    let startLine = randBetween(0, lyrics.length - 3);
    initialiseLyricBox(loadedTracks[trackID].lyrics, 3, startLine);
    setTimeout(function () {
        displayLyricLine(trackID, startLine, startLine);
    }, 500);
}

function initialiseLyricBox(lyrics, numLines, startLine) {
    let lyricBox = $("#lyric-box");
    // for adjustment if we add difficulties
    for (let i = 0; i < numLines; i++) {
        lyricBox.append(
            `<div class="lyric-line" style="opacity:0">
                <p>${lyrics[startLine + i]}<p>
            </div>`
        );
    }
}

function displayLyricLine(trackID, startLine, curLine) {
    // stop if the player has already guessed the song correctly
    if (trackID != currentTrack.id) return;

    const lyricNum = curLine - startLine;

    const lyricBox = $("#lyric-box");
    const lyricLines = lyricBox.children(".lyric-line");
    const lyricLine = lyricLines.eq(lyricNum);
    lyricLine.css({
        animation: "fade-in 1s forwards",
    });
    curLine++;
    // call next if less than 3 lyrics have been displayed
    if (lyricNum < lyricLines.length)
        setTimeout(function () {
            displayLyricLine(trackID, startLine, curLine);
        }, 3000);
}

function playAgain() {
    score = 0;
    $("#score-text").html(`${score}`);
    chooseLyrics();
}

function playSong() {
    var audioPlayer = document.getElementById('audioPlayer');
    audioPlayer.currentTime = 0; // Start from the beginning
    audioPlayer.play();
    audioPlayer.addEventListener('ended', function() {
        // Playback has finished, pause
        audioPlayer.pause();
    });
}

function loadSong(currentTrack) {
    if (!currentTrack.preview_url) {
        return;
    }
    $("#audioSource").attr("src", currentTrack.preview_url);
    var audioPlayer = document.getElementById("audioPlayer");
    audioPlayer.load(); // Load the audio source
    console.log(currentTrack.preview_url);
}

function showTrack(currentTrack) {
    $("#track-image").attr('src', currentTrack.image_url);
    const artists=currentTrack.artists;
    let allArtists = "";
    for (let i = 0; i < artists.length; i++) {
        if (i != artists.length-1){
            allArtists += artists[i] + ', ';
        }
        else {
            allArtists += artists[i];
        }
    }
    $("#track-name").html(currentTrack.name + ' - ' + allArtists);
}