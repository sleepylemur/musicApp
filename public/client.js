
// ***************** initialization *****************

var currentSongId = -1, currentSongGroupName = "", currentSongGroupType = "song", currentSongPosition = -1;
var mrfloat = document.getElementById("mrfloat");

var songInfoDiv = document.getElementById("songinfo");


// ***************** play pane init *****************

var accordionPlay = document.getElementById("accordionplay");

// add display-by song/playlist/artist button eventlisteners
document.getElementById("playpaneplaylistbutton").addEventListener('click',displaySongsByPlaylist.bind(null,accordionPlay,playPaneSongLinker, playPaneGroupLinker));
document.getElementById("playpanesongbutton").addEventListener('click',displaySongsBySong.bind(null,accordionPlay,playPaneSongLinker, null));
document.getElementById("playpaneartistbutton").addEventListener('click',displaySongsByArtist.bind(null,accordionPlay,playPaneSongLinker, playPaneGroupLinker));

displaySongsBySong(accordionPlay,playPaneSongLinker);
playNext();


// ***************** manage pane init *****************

var accordionDelete = document.getElementById("accordiondelete");
document.getElementById("buttonnewplaylist").addEventListener('click', newPlaylist);

displaySongsByPlaylist(accordionDelete,deletePaneSongLinker, deletePanePlaylistLinker);


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
  var newname = elmt.value;
  var counter = 2;
  while (typeof playlists[newname] !== 'undefined') {
    // while newname is taken
    newname = elmt.value + " "+counter++;
  }

  var newplaylists = {};
  newplaylists[newname] = [];
  for (key in playlists) {
    newplaylists[key] = playlists[key];
  }
  playlists = newplaylists;
  elmt.parentNode.removeChild(elmt);
  displaySongsByPlaylist(accordionDelete,deletePaneSongLinker,deletePanePlaylistLinker);
}

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
    console.log(playlists);
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


// ***************** drag helper functions *****************

function attachHammer(elmt) {
  elmt.addEventListener('mousedown', handleDragStart.bind(null,elmt));
  var hammertime = new Hammer(elmt);
  hammertime.on('pan', handleDrag.bind(null,elmt));
  hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });
  hammertime.on('tap', handleDragEnd.bind(null,elmt));
  return hammertime;
}

function handleDragStart(elmt, evt) {
  var bounds = elmt.getBoundingClientRect();
  mrfloat.style.left = bounds.left+"px";
  mrfloat.style.top = bounds.top+"px";
  mrfloat.style.width = bounds.width+"px";
  mrfloat.style.height = bounds.height+"px";
  mrfloat.innerHTML = elmt.innerHTML;
  mrfloat.style.display = "inline-block";
  elmt.style.background = "lightgray";
}

function handleDrag(elmt, evt) {
  if (evt.deltaX < -100) {
    mrfloat.style.background = "red";
  } else {
    mrfloat.style.background = "white";
  }
  if (evt.isFinal) {
    handleDragEnd(elmt,evt);
  } else {
    var bounds = elmt.getBoundingClientRect();
    mrfloat.style.left = bounds.left + evt.deltaX + "px";
    mrfloat.style.top = bounds.top + evt.deltaY + "px";
  }
}

function handleDragEnd(elmt, evt) {
  if (evt.deltaX < -100) {
    elmt.parentNode.removeChild(elmt);
  } else {
    elmt.style.background = "white";
  }
  mrfloat.style.display = "none";
  mrfloat.style.background = "white";
}


// ***************** list display functions *****************

// helper function to create an accordion songlist panel

function createAccordionNode(parentdiv, groupdivid, groupname, songs, grouptype, linker, grouplinker) {

  // create accordion heading
  var outerpanel = document.createElement("div");
  outerpanel.setAttribute("class","panel panel-default");
  var panelheading = document.createElement("div");
  panelheading.setAttribute("class","panel-heading");
  var collapseid = grouplinker(panelheading, groupdivid);
  var title = document.createElement("h4");
  title.setAttribute("class","panel-title");
  // var titlelink = document.createElement("a");
  // titlelink.setAttribute("class", "collapsed");
  // titlelink.setAttribute("data-toggle", "collapse");
  // titlelink.setAttribute("data-parent", "#accordionplay");
  // titlelink.setAttribute("href", "#collapse"+groupid);
  // titlelink.appendChild(document.createTextNode(heading));
  // title.appendChild(titlelink);
  title.appendChild(document.createTextNode(groupname));
  panelheading.appendChild(title);
  outerpanel.appendChild(panelheading);

  // create song list for artist
  var collapse = document.createElement("div");
  collapse.setAttribute("id", collapseid);
  collapse.setAttribute("class","panel-collapse collapse");
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
    // a.addEventListener("click", playSong.bind(null, songs[i].id, groupid, grouptype));
    
    // var hammertime = attachHammer(a);
    // hammertime.on("tap", playSong.bind(songs[i].id,groupid,grouptype));


      // function(evt) {console.log('test');playSong(evt,songs[i].id);});
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
function playPaneGroupLinker( elmt, groupdivid ) {
  elmt.addEventListener('click', function(elmt) {$("#pcollapse"+groupdivid).collapse('toggle');}.bind(null,elmt));
  return "pcollapse"+groupdivid;
}

function deletePaneSongLinker( elmt, position, songid, groupname, grouptype) {
  attachHammer(elmt);
}

function deletePanePlaylistLinker( elmt, groupdivid) {
  // elmt.addEventListener('click', function(elmt) {
  //   console.log(target);
  //   $(target).collapse('toggle');
  // }.bind(null,elmt));
  var hammertime = attachHammer(elmt);
  hammertime.on('tap', function(elmt) {$("#dcollapse"+groupdivid).collapse('toggle');}.bind(null,elmt));
  return "dcollapse"+groupdivid;
  // elmt.addEventListener('click', function(elmt) {$(target).collapse('toggle');}.bind(null,elmt));
  // hammertime.on('tap', function(elmt) {$(target).collapse('toggle');}.bind(null,elmt));
}




          // <div class="panel panel-default"> 
          //   <div class="panel-heading">
          //     <h4 class="panel-title">
          //       <a data-toggle="collapse" data-parent="#accordionplay" href="#collapseOne">
          //         Nine Inch Nails
          //       </a>
          //     </h4>
          //   </div>
          //   <div id="collapseOne" class="panel-collapse collapse in">
          //     <ul class="list-group">
          //       <li class="list-group-item"><a href="">Terrible Lie</a><span class="badge"><em>i</em></span></li>
          //       <li class="list-group-item"><a href="">I'm Drunk</a><span class="badge"><em>i</em></span></li>
          //       <li class="list-group-item"><a href="">Happiness in Slavery</a><span class="badge"><em>i</em></span></li>
          //     </ul>
          //    <!--  <div class="panel-body">
                
          //     </div> -->
          //   </div>
          // </div>

// ***************** server AJAX helpers *****************

function getServerData(route, next) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET","http://localhost:3000"+route,true);
  xhr.onload = function() {
    next(JSON.parse(xhr.response));
  };
  xhr.send();
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