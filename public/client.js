
// ***************** initialization *****************

var currentSongId = -1, currentSongGroupName = "", currentSongGroupType = "song", currentSongPosition = -1;
var mrfloat = document.getElementById("mrfloat");

var songInfoDiv = document.getElementById("songinfo");
var playlistinfo = document.getElementById("selectedPlaylistInfo");

// state vars
var panestate = {
  playSelectedGroup:"",
  playSelectedGroupType:"song",
  deleteSelectedGroup:"",
  addSelectedGroup:"",
  addSelectedGroupType:"song",
  currentPane:"play",
  getCurGroup:function() {
    if (this.currentPane === "play") {
      return this.playSelectedGroup;
    } else if (this.currentPane === "delete") {
      return this.deleteSelectedGroup;
    } else if (this.currentPane === "add") {
      return this.addSelectedGroup;
    }
  },
  getCurType:function() {
    if (this.currentPane === "play") {
      return this.playSelectedGroupType;
    } else if (this.currentPane === "delete") {
      return "playlist";
    } else if (this.currentPane === "add") {
      return this.addSelectedGroupType;
    }
  },
  displayByState:function(div,songlinker,grouplinker) {
    if (this.getCurType() === "song") {
      displaySongsBySong(div,songlinker, grouplinker);
    } else if (this.getCurType() === "artist") {
      displaySongsByArtist(div,songlinker, grouplinker);
    } else if (this.getCurType() === "playlist") {
      displaySongsByPlaylist(div,songlinker, grouplinker);
    }
  }
};


// ***************** play pane init *****************

var accordionPlay = document.getElementById("accordionplay");

// add display-by song/playlist/artist button eventlisteners
// document.getElementById("playpaneplaylistbutton").addEventListener('click',displaySongsByPlaylist.bind(null,accordionPlay,playPaneSongLinker, playPaneGroupLinker));
// document.getElementById("playpanesongbutton").addEventListener('click',displaySongsBySong.bind(null,accordionPlay,playPaneSongLinker, null));
// document.getElementById("playpaneartistbutton").addEventListener('click',displaySongsByArtist.bind(null,accordionPlay,playPaneSongLinker, playPaneGroupLinker));
document.getElementById("playpaneplaylistbutton").addEventListener('click',function() {
  panestate.playSelectedGroupType = "playlist";
  panestate.displayByState(accordionPlay,playPaneSongLinker, playPaneGroupLinker);
});
document.getElementById("playpanesongbutton").addEventListener('click',function() {
  panestate.playSelectedGroupType = "song";
  panestate.displayByState(accordionPlay,playPaneSongLinker, playPaneGroupLinker);
});
document.getElementById("playpaneartistbutton").addEventListener('click',function() {
  panestate.playSelectedGroupType = "artist";
  panestate.displayByState(accordionPlay,playPaneSongLinker, playPaneGroupLinker);
});

panestate.displayByState(accordionPlay,playPaneSongLinker, playPaneGroupLinker);
playNext();


// ***************** manage pane init *****************

var selectedPlaylist = "playlist1";
var accordionDelete = document.getElementById("accordiondelete");
document.getElementById("buttonnewplaylist").addEventListener('click', newPlaylist);
// <a href="#manage" data-toggle="tab">Manage</a>
// $('a[href="#manage"]').on('show.bs.tab', function(evt) {
//   $('#manage').show();
//   $('#manage-add').hide();
// });

$('a[href="#manage-add"]').hide(); // make 3rd tab button invisible
$('a[href="#play"]').on('show.bs.tab', function(evt) {
  panestate.currentPane = "play";
  panestate.displayByState(accordionPlay,playPaneSongLinker, playPaneGroupLinker);
});
$('a[href="#manage"]').on('show.bs.tab', function(evt) {
  panestate.currentPane = "delete";
  panestate.displayByState(accordionDelete,deletePaneSongLinker, deletePaneGroupLinker);
});
$('a[href="#manage-add"]').on('show.bs.tab', function(evt) {
  panestate.currentPane = "add";
  panestate.displayByState(accordionAdd,addPaneSongLinker, addPaneGroupLinker);
});



// ***************** manage button response functions *****************

function newPlaylist() {
  var textbox = document.createElement("input");
  textbox.setAttribute('type', 'text');
  textbox.setAttribute('value', 'new playlist');
  textbox.addEventListener('blur', createPlaylist.bind(null,textbox));

  if (accordionDelete.children.length === 0) {
    accordionDelete.appendChild(textbox);
  } else {
    accordionDelete.insertBefore(textbox,accordionDelete.children[0]);
  }
  textbox.select();
}

function createPlaylist(elmt,evt) {
  getServerData("/playlistnames", function(names) {
    var newname = elmt.value;
    var counter = 2;
    while (istaken(newname, names)) {
      // while newname is taken
      newname = elmt.value + " "+counter++;
    }
    sendServerPost("/playlists", "name="+newname, function() {
      displaySongsByPlaylist(accordionDelete,deletePaneSongLinker,deletePaneGroupLinker);
    });
  });

  function istaken(name, names) {
    for (var i=0; i<names.length; i++) {
      if (names.name === name) return true;
    }
    return false;
  }
}


// ***************** add pane init *****************

var accordionAdd = document.getElementById("accordionadd");

var gotoDeleteDiv = document.getElementById("gotodeletediv");
gotoDeleteDiv.addEventListener('click', function() {
  $('a[href="#manage"]').click();
});

document.getElementById("addpaneplaylistbutton").addEventListener('click',function() {
  panestate.addSelectedGroupType = "playlist";
  panestate.displayByState(accordionAdd,addPaneSongLinker, addPaneGroupLinker);
});
document.getElementById("addpanesongbutton").addEventListener('click',function() {
  panestate.addSelectedGroupType = "song";
  panestate.displayByState(accordionAdd,addPaneSongLinker, addPaneGroupLinker);
});
document.getElementById("addpaneartistbutton").addEventListener('click',function() {
  panestate.addSelectedGroupType = "artist";
  panestate.displayByState(accordionAdd,addPaneSongLinker, addPaneGroupLinker);
});
// document.getElementById("addpaneplaylistbutton").addEventListener('click',displaySongsByPlaylist.bind(null,accordionAdd,addPaneSongLinker, addPaneGroupLinker));
// document.getElementById("addpanesongbutton").addEventListener('click',displaySongsBySong.bind(null,accordionAdd,addPaneSongLinker, null));
// document.getElementById("addpaneartistbutton").addEventListener('click',displaySongsByArtist.bind(null,accordionAdd,addPaneSongLinker, addPaneGroupLinker));

// ***************** play button response functions *****************

function displaySongsByArtist(targetdiv,linker,grouplinker) {
  getServerData("/songs", function(songs) {
    var artists = {};
    songs.forEach(function(song) {
      if (typeof artists[song.artist] === 'undefined') artists[song.artist] = [];
      artists[song.artist].push(song);
    });

    targetdiv.innerHTML = "";
    var artistid = 0;
    for (artistname in artists) {
      targetdiv.appendChild(
        createAccordionNode(targetdiv,artistid++, artistname, artists[artistname],"artist",linker,grouplinker)
      );
    }
  });
}

function displaySongsByPlaylist(targetdiv,linker,grouplinker) {
  targetdiv.innerHTML = "";
  var playlistid = 0;
  getServerData("/songs?playlist=", function(songs) {
    var playlists = {};
    songs.forEach(function(song) {
      if (typeof playlists[song.playlist] === 'undefined') playlists[song.playlist] = [];
      if (song.id !== null) { // empty playlists will have 1 song of nulls returned
        playlists[song.playlist].push({id:song.id, name:song.name, artist:song.artist, position:song.position});
      }
    });
    // console.log(playlists);
    for (playlistName in playlists) {
      targetdiv.appendChild(
        createAccordionNode(
          targetdiv,
          playlistid++,
          playlistName,
          playlists[playlistName],
          "playlist",
          linker,
          grouplinker
        )
      );
    }
  });
}

function displaySongsBySong(targetdiv,linker) {
  targetdiv.innerHTML = "";
  getServerData("/songs", function(songs) {
    targetdiv.appendChild(createSongListNode(songs,0,"song",linker));
  });
}

function playSong(position, id, groupid, grouptype,evt) {
  // console.log(arguments);
  evt.preventDefault();
  currentSongId = id;
  currentSongPosition = position;
  currentSongGroupName = groupid;
  currentSongGroupType = grouptype;
  getServerData("/song/"+id, function(song) {
    songInfoDiv.innerHTML = song.name;
  });
}

function playPrev() {
  getServerData("/song/position/"+currentSongPosition+"?next=prev&"+currentSongGroupType+"="+currentSongGroupName, function(data) {
    currentSongPosition = data.position;
    currentSongId = data.song.id;
    songInfoDiv.innerHTML = data.song.name;
  });
}
function playNext() {
  getServerData("/song/position/"+currentSongPosition+"?next=next&"+currentSongGroupType+"="+currentSongGroupName, function(data) {
    currentSongPosition = data.position;
    currentSongId = data.song.id;
    songInfoDiv.innerHTML = data.song.name;
  });
}


// ***************** list display functions *****************

// helper function to create an accordion songlist panel

function createAccordionNode(parentdiv, groupdivid, groupname, songs, grouptype, linker, grouplinker) {

  // create accordion heading
  var outerpanel = document.createElement("div");
  outerpanel.setAttribute("class","panel panel-default");
  var panelheading = document.createElement("div");
  panelheading.setAttribute("class","panel-heading");
  // var title = document.createElement("h4");
  // title.setAttribute("class","panel-title");
  // title.appendChild(document.createTextNode(groupname));
  // panelheading.appendChild(title);
  panelheading.appendChild(document.createTextNode(groupname));
  var collapseid = grouplinker(panelheading, groupdivid, groupname, grouptype);
  outerpanel.appendChild(panelheading);

  // create song list for artist
  var collapse = document.createElement("div");
  collapse.setAttribute("id", collapseid);
  if (panestate.getCurGroup() === groupname) {
    collapse.setAttribute("class","panel-collapse collapse in");
  } else {
    collapse.setAttribute("class","panel-collapse collapse");
  }
  collapse.setAttribute("data-parent","#"+parentdiv.id);
  collapse.appendChild(createSongListNode(songs, groupname, grouptype, linker));
  outerpanel.appendChild(collapse);
  return outerpanel;
}


// helper function to create ul of songs

function createSongListNode(songs, groupname, grouptype, linker) {
  var listgroup = document.createElement("ul");
  listgroup.setAttribute("class","list-group");
  for (var i=0; i<songs.length; i++) {
    var li = document.createElement("li");
    li.setAttribute("class","list-group-item");
    var a = document.createElement("a");
    a.setAttribute("href","#");
    linker(li, i, songs[i].id, groupname, grouptype);
    a.appendChild(document.createTextNode(songs[i].name));
    li.appendChild(a);
    listgroup.appendChild(li);
  }
  return listgroup;
}

// callback for creating links for play pane

function playPaneSongLinker( elmt, position, songid, groupname, grouptype) {
  elmt.addEventListener('click', playSong.bind(null, position, songid, groupname, grouptype));
}
function playPaneGroupLinker( elmt, groupdivid, groupname, grouptype ) {
  elmt.addEventListener('click', function(elmt) {
    if (document.getElementById("pcollapse"+groupdivid).className.split(' ').indexOf('in') === -1) { // if group was collapsed
      panestate.playSelectedGroup = groupname;
    } else {
      panestate.playSelectedGroup = "";
    }
    $("#pcollapse"+groupdivid).collapse('toggle');
  }.bind(null,elmt));
  return "pcollapse"+groupdivid;
}

function deletePaneSongLinker( elmt, position, songid, groupname, grouptype) {
  elmt.dataset.isa = "song";
  elmt.dataset.groupname = groupname;
  elmt.dataset.position = position;
  attachHammer(elmt,"red",dragEndDelete);
}

function deletePaneGroupLinker( elmt, groupdivid, groupname, grouptype) {
  var plusicon = document.createElement("span");
  plusicon.className = "glyphicon glyphicon-plus floatright";
  // plusicon.className = "badge";
  // plusicon.appendChild(document.createTextNode("+"));
  // plusicon.addEventListener('click', function(evt) {console.log("yo"); preventDefault(evt);});
  elmt.appendChild(plusicon);

  elmt.dataset.isa = "playlist";
  elmt.dataset.name = groupname;
  var hammertime = attachHammer(elmt,"red",dragEndDelete);
  hammertime.on('tap', function(elmt,evt) {
    var bounds = elmt.getBoundingClientRect();
    if (bounds.right - evt.srcEvent.clientX < 37) { // if they clicked on the plus then take them to playlist song add page
      selectedPlaylist = groupname;
      playlistinfo.innerHTML = "Add to "+groupname;
      // console.log(groupname);
      $('a[href="#manage-add"]').click();
    } else {
      if (document.getElementById("dcollapse"+groupdivid).className.split(' ').indexOf('in') === -1) { // if group was collapsed
        panestate.deleteSelectedGroup = groupname;
      } else {
        panestate.deleteSelectedGroup = "";
      }
      $("#dcollapse"+groupdivid).collapse('toggle');
    }
  }.bind(null,elmt));
  return "dcollapse"+groupdivid;
}

function addPaneSongLinker( elmt, position, songid, groupname, grouptype) {
  elmt.dataset.isa = "song";
  elmt.dataset.id = songid;
  attachHammer(elmt,"green",dragEndAdd);
}

function addPaneGroupLinker( elmt, groupdivid, groupname, grouptype) {
  elmt.dataset.isa = grouptype;
  elmt.dataset.name = groupname;
  var hammertime = attachHammer(elmt,"green",dragEndAdd);
  hammertime.on('tap', function(elmt) {
    if (document.getElementById("acollapse"+groupdivid).className.split(' ').indexOf('in') === -1) { // if group was collapsed
      panestate.addSelectedGroup = groupname;
    } else {
      panestate.addSelectedGroup = "";
    }
    $("#acollapse"+groupdivid).collapse('toggle');
  }.bind(null,elmt));
  return "acollapse"+groupdivid;
}


// ***************** drag helper functions *****************

function attachHammer(elmt,color,end) {
  elmt.addEventListener('mousedown', handleDragStart.bind(null,elmt,color,end));
  var hammertime = new Hammer(elmt);
  hammertime.on('pan', handleDrag.bind(null,elmt,color,end));
  hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });
  hammertime.on('tap', handleDragEnd.bind(null,elmt,color,end));
  hammertime.on('pressup', handleDragEnd.bind(null,elmt,color,end));
  return hammertime;
}

function handleDragStart(elmt, color, end, evt) {
  var bounds = elmt.getBoundingClientRect();
  mrfloat.style.left = bounds.left+"px";
  mrfloat.style.top = bounds.top+"px";
  mrfloat.style.width = bounds.width+"px";
  mrfloat.style.height = bounds.height+"px";
  mrfloat.innerHTML = elmt.innerHTML;
  mrfloat.style.display = "inline-block";
  elmt.style.background = "lightgray";
}

function handleDrag(elmt, color, end, evt) {
  if (evt.deltaX < -100) {
    mrfloat.style.background = color;
  } else {
    mrfloat.style.background = "white";
  }
  if (evt.isFinal) {
    handleDragEnd(elmt, color, end ,evt);
  } else {
    var bounds = elmt.getBoundingClientRect();
    mrfloat.style.left = bounds.left + evt.deltaX + "px";
    // mrfloat.style.top = bounds.top + evt.deltaY + "px";
  }
}

function handleDragEnd(elmt, color, end, evt) {
  if (evt.deltaX < -100) {
    end(elmt);
  } else {
    if (elmt.dataset.isa === "playlist") {
      elmt.style.background = 'rgb(242,242,242)';
    } else {
      elmt.style.background = 'white';
    }
  }
  mrfloat.style.display = "none";
  mrfloat.style.background = "white";
}

function dragEndDelete(elmt) {
  if (elmt.dataset.isa === "playlist") {
    sendServerDelete("/playlist/"+elmt.dataset.name, function() {
      // elmt.parentNode.removeChild(elmt);
      displaySongsByPlaylist(accordionDelete,deletePaneSongLinker, deletePaneGroupLinker);
    });
  } else if (elmt.dataset.isa === "song") {
    sendServerDelete("/playlist/"+elmt.dataset.groupname+"/position/"+elmt.dataset.position, function() {
      // elmt.parentNode.removeChild(elmt);
      displaySongsByPlaylist(accordionDelete,deletePaneSongLinker, deletePaneGroupLinker);
    });
  }
}
function dragEndAdd(elmt) {
  elmt.style.background = "white";
  if (elmt.dataset.isa === "song") {
    sendServerPost("/playlist/"+selectedPlaylist, "id="+elmt.dataset.id, function() {});
  } else {
    sendServerPost("/playlist/"+selectedPlaylist+"/addgroup", "type="+elmt.dataset.isa+"&name="+elmt.dataset.name, function() {});
  }
}


// ***************** server AJAX helpers *****************

function getServerData(route, next) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET","http://localhost:3000"+route,true);
  xhr.onload = function() {
    next(JSON.parse(xhr.response));
  };
  xhr.send();
}
function sendServerDelete(route, next) {
  var xhr = new XMLHttpRequest();
  xhr.open("DELETE","http://localhost:3000"+route,true);
  xhr.onload = function() {
    next();
  };
  xhr.send();
}
function sendServerPost(route, data, next) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST","http://localhost:3000"+route,true);
  xhr.onload = function() {
    next();
  };
  xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
  xhr.send(data);
}


// ***************** player interface at bottom *****************

var buttonPlay = document.getElementById("playbutton");
playbutton.addEventListener('click',play);

function play() {
    buttonPlay.innerHTML = '<span class="glyphicon glyphicon-pause"></span>';
    buttonPlay.removeEventListener('click',play);
    buttonPlay.addEventListener('click',pause);
}
function pause() {
  buttonPlay.innerHTML = '<span class="glyphicon glyphicon-play"></span>';
    buttonPlay.removeEventListener('click',pause);
    buttonPlay.addEventListener('click',play);
}