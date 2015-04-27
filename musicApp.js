var express = require('express');
var sqlite3 = require('sqlite3');
var bodyParser = require('body-parser');

var db = new sqlite3.Database('music.db');

var app = express();
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended:false}));

app.get('/', function(req,res) {
  res.render('index.html');
});

app.get('/playlistnames', function(req,res) {
  db.all("SELECT name FROM playlists", function(err,data) {
    if (err) console.log(err);
    res.json(data);
  });
});

// get /song/position/pos?next=(next|prev) with optional args search and (playlist or artist) - steps through current playing songgroup
//   example: get /song/2?next=next&search=nine+inch+nails&playlist=happy+songs

app.get('/song/position/:pos', function(req,res) {
  if (typeof req.query.playlist !== 'undefined') {
    // step through songs by playlist
    if (typeof req.query.search !== 'undefined') {
      var search = "%"+req.query.search+"%";
      db.all("SELECT songs.id, songs.name, songs.artist FROM "+
        "songs JOIN playlistsongs ON songs.id = playlistsongs.songid "+
        "WHERE playlistsongs.name = ? AND (songs.name LIKE ? OR songs.artist LIKE ?) ORDER BY playlistsongs.position",
        req.query.playlist, search, search, function(err,data) {
          if (err) console.log(err);
          getNext(data);
        }
      );
    } else {
      db.all("SELECT songs.id, songs.name, songs.artist FROM "+
        "songs JOIN playlistsongs ON songs.id = playlistsongs.songid "+
        "WHERE playlistsongs.name = ? ORDER BY playlistsongs.position",
        req.query.playlist, function(err,data) {
          if (err) console.log(err);
          getNext(data);
        }
      );
    }
  } else if (typeof req.query.artist !== 'undefined') {
    // step through songs by artist
    if (typeof req.query.search !== 'undefined') {
      var search = "%"+req.query.search+"%";
      db.all("SELECT id,name,artist FROM songs WHERE artist = ? AND name LIKE ? ORDER BY name", req.query.artist, search, function(err,data) {
        if (err) console.log(err);
        getNext(data);
      });
    } else {
      db.all("SELECT id,name,artist FROM songs WHERE artist = ? ORDER BY name", req.query.artist, function(err,data) {
        if (err) console.log(err);
        getNext(data);
      });
    }
  } else {
    // step through all songs
    if (typeof req.query.search !== 'undefined') {
      var search = "%"+req.query.search+"%";
      db.all("SELECT id,name,artist FROM songs WHERE song LIKE ? OR artist LIKE ? ORDER BY name", search, search, function(err,data) {
        if (err) console.log(err);
        getNext(data);
      });
    } else {
      db.all("SELECT id,name,artist FROM songs ORDER BY name", function(err,data) {
        if (err) console.log(err);
        getNext(data);
      });
    }
  }
  function getNext(songs) {
    var index = req.params.pos;
    if (req.query.next === "prev") { // step through songs backwards
      index--;
    } else { // step through songs forwards
      index++;
    }
    if (index < 0) index = songs.length - 1;
    else if (index >= songs.length) index = 0;
    res.json({position:index, song:songs[index]});
  }
});

// returns info on song
app.get("/song/:id", function(req,res) {
  // simple song request
  db.get("SELECT id,name,artist FROM songs WHERE id = ?", req.params.id, function(err,data) {
    res.json(data);
  });
});

app.get('/songs', function(req,res) {
  if (typeof req.query.playlist !== 'undefined') {
    if (req.query.playlist.length === 0) {
      if (typeof req.query.search !== 'undefined') {
        // retrieve all playlists with search
        var search = "%"+req.query.search+"%";
        db.all("SELECT songs.id,songs.name,songs.artist,playlistsongs.position,playlists.name as playlist "+
          "FROM playlists "+
          "LEFT OUTER JOIN playlistsongs ON playlists.name = playlistsongs.name "+
          "LEFT OUTER JOIN songs ON playlistsongs.songid = songs.id "+
          "WHERE songs.name LIKE ? OR songs.artist LIKE ? ORDER BY playlists.name,playlistsongs.position",
          search, search, function(err,data) {
            res.json(data);
          }
        );
      } else {
        // retrieve all playlists
        db.all("SELECT songs.id,songs.name,songs.artist,playlistsongs.position,playlists.name as playlist "+
          "FROM playlists "+
          "LEFT OUTER JOIN playlistsongs ON playlists.name = playlistsongs.name "+
          "LEFT OUTER JOIN songs ON playlistsongs.songid = songs.id "+
          "ORDER BY playlists.name,playlistsongs.position",
          function(err,data) {
            res.json(data);
          }
        );
      }
    } else { // these will not return any empty playlists
      if (typeof req.query.search !== 'undefined') {
        // retrieve playlist with search
        var search = "%"+req.query.search+"%";
        db.all("SELECT songs.id,songs.name,songs.artist,playlistsongs.position,playlistsongs.name as playlist "+
          "FROM songs JOIN playlistsongs ON playlistsongs.songid = songs.id "+
          "WHERE playlistsongs.name = ? AND (songs.name LIKE ? OR songs.artist LIKE ?) ORDER BY playlistsongs.position",
          req.query.playlist, search, search, function(err,data) {
            res.json(data);
          }
        );
      } else {
        // retrieve playlist
        db.all("SELECT songs.id,songs.name,songs.artist,playlistsongs.position,playlistsongs.name as playlist "+
          "FROM songs JOIN playlistsongs ON playlistsongs.songid = songs.id "+
          "WHERE playlistsongs.name = ? ORDER BY playlistsongs.position", req.query.playlist, function(err,data) {
            res.json(data);
          }
        );
      }
    }
  } else if (typeof req.query.artist !== 'undefined') {
    if (typeof req.query.search !== 'undefined') {
      // songs by artist with search
      var search = "%"+req.query.search+"%";
      db.all("SELECT id,name,artist FROM songs WHERE artist = ? AND (name LIKE ? OR artist LIKE ?) ORDER BY name",
        req.query.artist, search, search, function(err,data) {
          res.json(data);
        }
      );
    } else {
      // songs by artist
      db.all("SELECT id,name,artist FROM songs WHERE artist = ? ORDER BY name",req.query.artist, function(err,data) {
        res.json(data);
      });
    }
  } else {
    // retrieve all songs
    db.all("SELECT id,name,artist FROM songs ORDER BY name", function(err,data) {
      res.json(data);
    });
  }
});

app.post('/playlists', function(req,res) {
  db.run('INSERT INTO playlists (name) VALUES (?)', req.body.name, function(err) {
    if (err) throw(err);
    res.end();
  });
});

// add song to playlist
app.post('/playlist/:playlist', function(req,res) {
  db.run('INSERT INTO playlistsongs (name,songid) VALUES (?,?)',
    req.params.playlist, req.body.id, function(err) {
      if (err) console.log(err);
      res.end();
    }
  );
});

// add group of songs to playlist
app.post('/playlist/:playlist/addgroup', function(req,res) {
  if (req.body.type === 'artist') {
    db.run('INSERT INTO playlistsongs (name,songid) SELECT ?,id FROM songs WHERE artist = ?', req.params.playlist, req.body.name, function(err) {
      if (err) console.log(err);
      res.end();
    });
  } else if (req.body.type === 'playlist') {
    db.run('INSERT INTO playlistsongs (name,songid) SELECT ?,songid FROM playlistsongs WHERE name = ?', req.params.playlist, req.body.name, function(err) {
      if (err) console.log(err);
      res.end();
    });
  } else {
    throw("unknown group type");
  }
});

app.delete('/playlist/:name', function(req,res) {
  db.run('DELETE FROM playlists WHERE name = ?', req.params.name, function(err) {
    if (err) throw(err);
    res.end();
  });
});
app.delete('/playlist/:name/position/:pos', function(req,res) {
  db.run('DELETE FROM playlistsongs WHERE ROWID IN (SELECT ROWID FROM playlistsongs WHERE name=? ORDER BY position LIMIT 1 OFFSET ?)',
    req.params.name, req.params.pos, function(err) {
      if (err) console.log(err);
      res.end();
    }
  );
});

app.listen(3000, function() {console.log('started musicApp on 3000');});