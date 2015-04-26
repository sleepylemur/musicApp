var express = require('express');
var sqlite3 = require('sqlite3');
var bodyParser = require('body-parser');

var db = new sqlite3.Database('music.db');

var app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:false}));

app.get('/', function(req,res) {
  res.render('index.html');
});

app.get('/songs', function(req,res) {
  if (typeof req.query.playlist !== 'undefined') {
    if (req.query.playlist.length === 0) {
      if (typeof req.query.search !== 'undefined') {
        // retrieve all playlists with search
        var search = "%"+req.query.search+"%";
        db.all("SELECT songs.id,songs.name,songs.artist,playlists.position,playlists.name as playlist "+
          "FROM songs JOIN playlists ON playlists.songid = songs.id "+
          "WHERE songs.name LIKE ? OR songs.artist LIKE ? ORDER BY playlists.name,playlists.position",
          search, search, function(err,data) {
            res.json(data);
          }
        );
      } else {
        // retrieve all playlists
        db.all("SELECT songs.id,songs.name,songs.artist,playlists.position,playlists.name as playlist "+
          "FROM songs JOIN playlists ON playlists.songid = songs.id "+
          "ORDER BY playlists.name,playlists.position",
          function(err,data) {
            res.json(data);
          }
        );
      }
    } else {
      if (typeof req.query.search !== 'undefined') {
        // retrieve playlist with search
        var search = "%"+req.query.search+"%";
        db.all("SELECT songs.id,songs.name,songs.artist,playlists.position,playlists.name as playlist "+
          "FROM songs JOIN playlists ON playlists.songid = songs.id "+
          "WHERE playlists.name = ? AND (songs.name LIKE ? OR songs.artist LIKE ?) ORDER BY playlists.position",
          req.query.playlist, search, search, function(err,data) {
            res.json(data);
          }
        );
      } else {
        // retrieve playlist
        db.all("SELECT songs.id,songs.name,songs.artist,playlistsongs.position,playlists.name as playlist "+
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
      db.all("SELECT id,name,artist FROM songs WHERE artist = ? AND (name LIKE ? OR artist LIKE ?)",
        req.query.artist, search, search, function(err,data) {
          res.json(data);
        }
      );
    } else {
      // songs by artist
      db.all("SELECT id,name,artist FROM songs WHERE artist = ?",req.query.artist, function(err,data) {
        res.json(data);
      });
    }
  } else {
    // retrieve all songs
    db.all("SELECT id,name,artist FROM songs", function(err,data) {
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

app.delete('/playlists/:name', function(req,res) {
  db.run('DELETE FROM playlists WHERE name = ?', req.params.name, function(err) {
    if (err) throw(err);
    res.end();
  });
});
app.delete('/playlist/:name/position/:pos', function(req,res) {
  db.run('DELETE FROM playlistsongs WHERE name = ? AND position = ?', function(err) {
    if (err) throw(err);
    res.end();
  });
});

app.listen(3000, function() {console.log('started musicApp on 3000');});