$(window).on("load", function () {
    if (
        window.location.pathname === "/index" ||
        window.location.pathname === ""
    ) {
        if ($("#top-artists").length) loadTopArtists();
    }
});

function loadTopArtists() {
    $.getJSON("/api/top-artists", function (data) {
        addArtists(data);
    });
}

function addArtists(data) {
    let artistDiv = $("#top-artists");
    let rank = 1;
    data.forEach((element) => {
        artistDiv.append(
            `<div class="artist-box">#${rank}<img src="${element.image}" draggable="false">${element.name}</div>`
        );
        rank++;
    });
}

$(window).on('load', function() {
    username = document.getElementById("username");
    firstPass = document.getElementById("first-pass");
    repeatPass = document.getElementById("repeat-pass");

    // check if passwords match
    if (firstPass && repeatPass){
        firstPass.addEventListener("keyup", (e) => {
            checkMatchingPass(firstPass, repeatPass);
        })
        repeatPass.addEventListener("keyup", (e) => {
            checkMatchingPass(firstPass, repeatPass);
        })
    }
    if (username) {
        // check if username is taken 1 second after stopping typing
        let usernameCheckTimout;
        username.addEventListener("keyup", (e) => {
            clearTimeout(usernameCheckTimout);
            usernameCheckTimout = setTimeout(() => {
                checkUsernameFree(username.value)
            }, 1000);
        });
        // or on page load
        checkUsernameFree(username.value)
    }
});

function checkUsernameFree(username){
    $.ajax({
        type : "POST",
        url : '/check_username',
        dataType: "json",
        data: JSON.stringify({'username':username}),
        contentType: 'application/json;charset=UTF-8',
        success: function (data) {
                markUsername(data == 0)
            }
        });
}

function markUsername(free){
    info = document.getElementById("username-info");
    text = document.getElementById("username-info-text");
    icon = document.getElementById("username-info-icon");
    if (info){
        if (free) {
            text.innerHTML = "all good";
            icon.className = "glyphicon glyphicon-question-sign";
            info.classList.remove("error-text");
        }
        else {
            text.innerHTML = "Sorry, that username is taken";
            icon.className = "glyphicon glyphicon-exclamation-sign";
            info.classList.add("error-text");
        }
    }
}

function checkMatchingPass(firstPass, repeatPass) {
    if (firstPass.value != repeatPass.value){
        if (!repeatPass.classList.contains("incorrect")) {
            repeatPass.classList.add("incorrect");
        }
    }
    else {
        repeatPass.classList.remove("incorrect");
    }
}
$(window).on("load", function () {
    let borderElements = $(".gradient-border");
    if (borderElements) {
        setInterval(() => {
            borderElements.each(function (index) {
                borderElements[index].style.setProperty(
                    "--grad",
                    ((parseInt(borderElements[index].style.getPropertyValue("--grad")) || 0) + 2) % 360
                );
            });
        }, 20);
    }
});

/* autocomplete.js */

$(window).on("load", function () {
    $(document).on("click", ".autocomplete-options li", function (e) {
        selectAutocomplete($(e.target).parent().parent(), e.target.innerHTML);
    });

    // close autocomplete menu
    $(document).on("click", ".autocomplete-options", function (e) {
        e.stopPropagation(); // dont close when clicking this
    });
    $(document).on("click", function (e) {
        // remove display if it wasnt the element clicked
        $(".autocomplete-input").each(function (index) {
            setAutocompleteVisibility($(this).parent(), e.target == this);
        });
    });

    // manage keyboard
    $(document).on("keyup", ".autocomplete-input", onAutocompleteKeyPress);

    $(document).on("keydown", autocompleteKeyControls);
});

/**
 * Set the visibility of the selected autocomplete options
 * @param {*} autocomplete - the .autocomplete-wrapper element to set option visibility to
 * @param {*} enabled - whether the options should be enabled
 */
function setAutocompleteVisibility(autocomplete, enabled) {
    autocomplete = $(autocomplete);

    textBox = autocomplete.children(".autocomplete-input").first()
    optionDiv = autocomplete.children(".autocomplete-options").first()

    // never display if input is empty
    if (textBox.val() == "") enabled = false; 

    if (!enabled) acSelected[autocomplete.id] = -1

    optionDiv.css("display", enabled ? "" : "none");
}

/**
 * Sets the input of the autocomplete to a value
 * @param {*} autocomplete - the .autocomplete-wrapper element to set option visibility to
 * @param {*} value - the value to set the autocomplete input to
 */

function selectAutocomplete(autocomplete, value) {
    autocomplete = $(autocomplete);
    console.log(autocomplete)
    autocomplete.children(".autocomplete-input").first().val(value);
    setAutocompleteVisibility(autocomplete, false);
}

function onAutocompleteKeyPress(e) {
    if (e.keyCode == keyUp || e.keyCode == keyDown || e.keyCode == keyEnter) return;

    autocomplete = $(e.target).parent()
    
    setAutocompleteVisibility(autocomplete, true);
    filterOptions(autocomplete);
}

/**
 * Changes which elements are displayed from the .autocomplete-options list
 * @param {*} autocomplete - the .autocomplete-wrapper element to set option visibility to
 */
function filterOptions(autocomplete) {
    autocomplete = $(autocomplete);
    let input = autocomplete.children(".autocomplete-input").first();
    let optionList = autocomplete.children(".autocomplete-options").first();
    let options = optionList.find("li");

    let filter = input.val().toUpperCase();

    for (i = 0; i < options.length; i++) {
        txtValue = options[i].textContent || options[i].innerText;
        // if the input isnt blank and the value matches then display
        if (input.val() != "" && txtValue.toUpperCase().indexOf(filter) > -1) {
            $(options[i]).css("display", "");
        } else {
            $(options[i]).css("display", "none");
        }
        $(options[i]).removeClass("selected");
    }
}

acSelected = {}

/**
 *
 * @param {*} e
 * @returns
 */
function autocompleteKeyControls(e) {
    if (e.keyCode != keyUp && e.keyCode != keyDown && e.keyCode != keyEnter) return;
    e.preventDefault();

    let autocomplete = $(e.target).parent();
    let optionsList = autocomplete.children(".autocomplete-options:first-child");

    enabled = optionsList.children('li:visible')
    optionCount = enabled.length

    if (optionCount == 0 || optionsList.css('display') == "none") return;

    let optionHeight = enabled.first().height() * 2;

    // may not be the best way
    if (!acSelected[autocomplete.id]) acSelected[autocomplete.id] = 0

    if (e.keyCode == keyUp || e.keyCode == keyDown) {
        if (optionsList.css("display") == "none") return;

        if (e.keyCode == keyUp) {
            console.log(acSelected[autocomplete.id])
            if (acSelected[autocomplete.id] == -1) acSelected[autocomplete.id]++;
            acSelected[autocomplete.id] = (acSelected[autocomplete.id] - 1).mod(optionCount);
        } else if (e.keyCode == keyDown) {
            acSelected[autocomplete.id] = (acSelected[autocomplete.id] + 1).mod(optionCount);
        }

        optionsList.scrollTop(acSelected[autocomplete.id] * optionHeight);

        // highlight selected
        for (i = 0; i < enabled.length; i++) {
            if (i == acSelected[autocomplete.id]) $(enabled[i]).addClass("selected");
            else $(enabled[i]).removeClass("selected");
        }
    } else if (e.keyCode == keyEnter) {
        // submit
        if (optionsList.css("display") == "none") checkButton();
        // choose
        else if (acSelected[autocomplete.id] != -1) selectAutocomplete(autocomplete, enabled[acSelected[autocomplete.id]].innerHTML);
    }
}

/**
 * 
 * @param {*} html - the HTML string to turn into a jQuery object
 * @returns 
 */
function wrapComponent(html){
    return $($.parseHTML(html))
}

function loaderComponent() {
    return wrapComponent(`
    <div id="loader-graphic">
        <div class="loader-bouncer"></div>
        <div class="loader-bouncer"></div>
        <div class="loader-bouncer"></div>
    </div>
    `)
}

function coverArtBoxComponent(coverArtData, index, link) {
    return wrapComponent(`
    <div class='cover-art-box'>
        ${link ? `<a class='cover-art-link' href=${link}>` : ""}
            <img src=${coverArtData.image} draggable=false>
        ${link ? `</a>` : ""}
        ${coverArtData.name}
    </div>
    `)
}

function errorMessageComponent(message) {
    return wrapComponent(`
    <h1>${message}</h1>
    <a href="/">Back to Home</a>
    `)
}

function userResultComponent(user) {
    return wrapComponent(`
    <div class="user-result" data-id=${user.id}>
        <div class="user-result-details">
            <img class="profile-pic" src="${user.image_url ?? ''}">
            <div class="username">${user.username}</div>
        </div>
        <div class="add-friend-container">
            ${user.is_self ? '' : user.is_friend ? `<div>Added</div>` : `<button class="button green add-friend">Add Friend</button>`}
        </div>
    </div>
    `)
}
// min & max inclusive
function randBetween(min, max) { 
    return Math.floor(Math.random() * (max - min + 1) + min)
}

// interesting
// https://web.archive.org/web/20090717035140if_/javascript.about.com/od/problemsolving/a/modulobug.htm
Number.prototype.mod = function (n) {
    "use strict";
    return ((this % n) + n) % n;
};

Array.prototype.shuffle = function() {
    return this.sort(function() {
        return Math.random() - 0.5;
      });
}


$(document).ready(function () {
    $(".sortable").on("click", function () {
        var $table = $(this).closest("table");
        var columnIndex = $(this).index();
        var rows = $table.find("tbody tr").get();
        var isAscending = $(this).data("sort") === "asc";

        rows.sort(function (a, b) {
            var aValue = $(a).find("td").eq(columnIndex).text().trim();
            var bValue = $(b).find("td").eq(columnIndex).text().trim();

            if (isAscending) {
                return aValue.localeCompare(bValue, undefined, { numeric: true });
            } else {
                return bValue.localeCompare(aValue, undefined, { numeric: true });
            }
        });

        $table.find("tbody").empty().append(rows);
        $(this).data("sort", isAscending ? "desc" : "asc");

        $(".sortable .fa").hide();
        var $sortIcon = $(this).find(".fa");
        $sortIcon.show();
        $sortIcon.removeClass("fa-caret-up fa-caret-down").addClass(isAscending ? "fa-caret-up" : "fa-caret-down");
    });

    $('.tracklist-selector').on('click', function(e) {
        target = $(e.target)
        if (target.hasClass('disabled')) return;

        id = target.attr('id')
        type = id.split('-')[0]
        chooseStatsTable(type)

    }) 
});

function chooseStatsTable(type) {
    if (type == 'playlist') {
        $('#artist-table').css('display', 'none')
        $('#playlist-table').removeAttr('style')
    }
    else {
        $('#playlist-table').css('display', 'none')
        $('#artist-table').removeAttr('style')
    }
}
$(window).on("load", function () {
    $(document).on("click", ".add-friend", function (e) {
        addFriend($(e.target).parent(), $(e.target).closest(".user-result").data("id"));
    });
});

function searchUsers() {
    input = $("#user-search-input").first();
    $.getJSON(`/api/search-users?name=${input.val()}`).done((response) => {
        container = $("#user-search-results");
        container.empty();
        response.users.forEach((user) => {
            container.append(userResultComponent(user));
        });
    });
}

function addFriend(container, id) {
    if (!id) {
        container.empty();
        container.append("Error");
    } else {
        $.ajax({
            type: "POST",
            url: "/api/add-friend",
            data: JSON.stringify({ id: id }),
            contentType: "application/json",
        })
            .done((response) => {
                container.empty();
                container.append("Added");
            })
            .fail(function (jqxhr, textStatus, error) {
                container.empty();
                container.append("Error");
            });
    }
}

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
$(window).on("load", function () {
    if (window.location.pathname === "/lyricgame") {
        loadPlaylists();
    }
    $('.tracklist-selector').on('click', function(e) {
        if ($(e.target).hasClass('disabled')) return;
        let link = e.target.href;
        var fragment = link.split('#')[1];

        if (fragment === "playlist-selector") {
            selectorClick('playlists', loadPlaylists)
        }
        else if (fragment === "artist-selector") { 
            selectorClick('artists', loadArtists)
        }
    }) 
});

function selectorClick(type, toLoad) {
    let selectors = $('.cover-art-selectors').first().children()
    selectors.css('display', 'none')

    let selector = selectors.siblings(`#${type}`).first()
    selector.removeAttr("style");
    if (selector.children().length == 0) {
        toLoad()
    }
}

function loadArtists() {
    loader = loaderComponent();
    loader.css("margin", "auto");
    $("#artists").append(loader);

    $.getJSON("/api/get-artists", function (data) {
        loader.remove();
        console.log(data)
        // sort alphabetically
        data.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1)
        addArtSelectors(data, $('#artists'), 'artist');
    });
}

function loadPlaylists() {
    loader = loaderComponent();
    loader.css("margin", "auto");
    $("#playlists").append(loader);

    $.getJSON("/api/get-playlists", function (data) {
        addArtSelectors(data, $('#playlists'), 'playlist');
        loader.remove();
    });
}

function addArtSelectors(data, div, type) {
    //let url = window.location.href;
    let index = 0;
    data.forEach((element) => {
        if (element.trackCount != 0) {
            data[element.id] = element;
            let artBox = coverArtBoxComponent(
                element,
                index,
                `lyricgame/${type}/${element.id}`
            );
            artBox.css({
                "opacity": "0",
                "animation": "fade-drop-in 1s forwards",
                "animation-delay": `${index * 0.05}s`,
            });
            div.append(artBox);
            index++;
        }
    });
}
