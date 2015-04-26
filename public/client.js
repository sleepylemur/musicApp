
// ***************** initialization *****************

var songsdb = [
  {id:0, name:'The Great Gig in the Sky', artist:'Pink Floyd'},
  {id:1, name:'Time', artist:'Pink Floyd'},
  {id:2, name:'Is There Anybody Out There?', artist:'Pink Floyd'},
  {id:3, name:'Terrible Lie', artist:'Nine Inch Nails'},
  {id:4, name:'Happiness in Slavery', artist:'Nine Inch Nails'},
  {id:5, name:'Hurt', artist:'Nine Inch Nails'}
];

var playlists = {"Playlist 1":[1,4,5], "Playlist2": [3,5]};
var currentSongId = -1, currentSongGroupId = 0, currentSongGroupType = "song";
var mrfloat = document.getElementById("mrfloat");

var songsByArtist;
loadSongsByArtist();

function loadSongsByArtist() {
  songsByArtist = {};
  for (var i=0; i<songsdb.length; i++) {
    if (typeof songsByArtist[songsdb[i].artist] === 'undefined') songsByArtist[songsdb[i].artist] = {};
    songsByArtist[songsdb[i].artist][i] = songsdb[i];
  }
}


var songInfoDiv = document.getElementById("songinfo");


// ***************** play pane init *****************

var accordionPlay = document.getElementById("accordionplay");

// add display-by song/playlist/artist button eventlisteners
document.getElementById("playpaneplaylistbutton").addEventListener('click',displaySongsByPlaylist.bind(null,accordionPlay,playPaneSongLinker));
document.getElementById("playpanesongbutton").addEventListener('click',displaySongsBySong.bind(null,accordionPlay,playPaneSongLinker));
document.getElementById("playpaneartistbutton").addEventListener('click',displaySongsByArtist.bind(null,accordionPlay,playPaneSongLinker));

displaySongsBySong(accordionPlay,playPaneSongLinker);
playNext();


// ***************** manage pane init *****************

var accordionDelete = document.getElementById("accordiondelete");

displaySongsByPlaylist(accordionDelete,deletePaneSongLinker);


// ***************** button response functions *****************

function displaySongsByArtist(targetdiv,linker) {
  var artists = Object.keys(songsByArtist);
  targetdiv.innerHTML = "";
  for (var artistid = 0; artistid < artists.length; artistid++) {
    var songsobj = songsByArtist[artists[artistid]];
    var songarray = Object.keys(songsobj).map(function(key){return songsobj[key];});

    targetdiv.appendChild(
      createAccordionNode(artistid, songarray[0].artist, songarray,"artist",linker)
    );
  }
}

function displaySongsByPlaylist(targetdiv,linker) {
  targetdiv.innerHTML = "";
  var playlistid = 0;
  for (playlistName in playlists) {
    targetdiv.appendChild(
      createAccordionNode(
        playlistid++,
        playlistName,
        playlists[playlistName].map(function(songid) {return songsdb[songid];}),
        "playlist",
        linker
      )
    );
  }
}

function displaySongsBySong(targetdiv,linker) {
  targetdiv.innerHTML = "";
  targetdiv.appendChild(createSongListNode(songsdb,0,"song",linker));
}

function playSong(id, groupid, grouptype,evt) {
  // console.log(arguments);
  evt.preventDefault();
  currentSongId = id;
  currentSongGroupId = groupid;
  currentSongGroupType = grouptype;
  songInfoDiv.innerHTML = songsdb[id].name;
}

function playPrev() { // still needs artist implemented
  if (currentSongGroupType === "song") {
    currentSongId -= 1;
    if (currentSongId < 0) currentSongId = songsdb.length-1;
  } else if (currentSongGroupType === "playlist") {
    var playlist = playlists[Object.keys(playlists)[currentSongGroupId]];
    var index = playlist.indexOf(currentSongId) - 1;
    if (index < 0) index = playlist.length-1;
    currentSongId = playlist[index];
  }
  songInfoDiv.innerHTML = songsdb[currentSongId].name;
}
function playNext() { // still needs artist implemented
  if (currentSongGroupType === "song") {
    currentSongId += 1;
    if (currentSongId >= songsdb.length) currentSongId = 0;
  } else if (currentSongGroupType === "playlist") {
    var playlist = playlists[Object.keys(playlists)[currentSongGroupId]];
    var index = playlist.indexOf(currentSongId) + 1;
    if (index >= playlist.length) index = 0;
    currentSongId = playlist[index];
  }
  songInfoDiv.innerHTML = songsdb[currentSongId].name;
}


// ***************** drag helper functions *****************

function attachHammer(elmt) {
  elmt.addEventListener('mousedown', handleDragStart.bind(null,elmt));
  var hammertime = new Hammer(elmt);
  hammertime.on('pan', handleDrag.bind(null,elmt));
  hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });
  hammertime.on('tap', handleDragEnd.bind(null,elmt));
}

function handleDragStart(elmt, evt) {
  var bounds = elmt.getBoundingClientRect();
  mrfloat.style.left = bounds.left+"px";
  mrfloat.style.top = bounds.top+"px";
  mrfloat.style.width = bounds.width+"px";
  mrfloat.style.height = bounds.height+"px";
  mrfloat.innerHTML = elmt.innerHTML;
  mrfloat.style.display = "inline-block";
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
  mrfloat.style.display = "none";
  mrfloat.style.background = "white";
}


// ***************** list display functions *****************

// helper function to create an accordion songlist panel

function createAccordionNode(groupid, heading, songs, grouptype, linker) {

  // create accordion heading
  var outerpanel = document.createElement("div");
  outerpanel.setAttribute("class","panel panel-default");
  var panelheading = document.createElement("div");
  panelheading.setAttribute("class","panel-heading");
  var title = document.createElement("h4");
  title.setAttribute("class","panel-title");
  var titlelink = document.createElement("a");
  titlelink.setAttribute("class", "collapsed");
  titlelink.setAttribute("data-toggle", "collapse");
  titlelink.setAttribute("data-parent", "#accordionplay");
  titlelink.setAttribute("href", "#collapse"+groupid);
  titlelink.appendChild(document.createTextNode(heading));
  title.appendChild(titlelink);
  panelheading.appendChild(title);
  outerpanel.appendChild(panelheading);

  // create song list for artist
  var collapse = document.createElement("div");
  collapse.setAttribute("id","collapse"+groupid);
  collapse.setAttribute("class","panel-collapse collapse");
  collapse.appendChild(createSongListNode(songs, groupid, grouptype, linker));
  outerpanel.appendChild(collapse);
  return outerpanel;
}


// helper function to create ul of songs

function createSongListNode(songs, groupid, grouptype, linker) {
  var listgroup = document.createElement("ul");
  listgroup.setAttribute("class","list-group");
  for (var i=0; i<songs.length; i++) {
    var li = document.createElement("li");
    li.setAttribute("class","list-group-item");
    var a = document.createElement("a");
    a.setAttribute("href","#");
    linker(li, songs[i].id, groupid, grouptype);
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

function playPaneSongLinker( elmt, songid, groupid, grouptype) {
  elmt.addEventListener('click', playSong.bind(null, songid, groupid, grouptype));
}

function deletePaneSongLinker( elmt, songid, groupid, grouptype) {
  attachHammer(elmt);
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