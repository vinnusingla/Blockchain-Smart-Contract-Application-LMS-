const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const path = require('path');
const app = express();


app.set('view engine', 'pug');
app.set('views', './views');
app.use(bodyParser.json()); 		// for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); 	// for parsing application/xwww-
app.use(express.static(__dirname));


// const {getHomePage} = require('./routes/index');
// const {addPlayerPage, addPlayer, deletePlayer, editPlayer, editPlayerPage} = require('./routes/player');
// const port = 5000;

// create connection to database
// the mysql.createConnection function takes in a configuration object which contains host, user, password and the database name.
const db = mysql.createConnection ({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'aivayi'
});

// connect to database
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});
global.db = db;


app.get('/', function(req, res){
   let query = "SELECT * FROM `players` ORDER BY id ASC"; // query database to get all the players

    // execute query
    db.query(query, (err, result) => {
        if (err) {
            res.send({
            	success: false
            });
        }
        res.send(result)
    });
});


app.listen(3000,'0.0.0.0',() => console.log(`App running on http://127.0.0.1:3000`));