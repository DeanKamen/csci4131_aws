// YOU CAN USE THIS FILE AS REFERENCE FOR SERVER DEVELOPMENT

// Include the express module
const express = require('express');

// Helps in managing user sessions
const session = require('express-session');

//formidable parses our incoming json files.
const formidable = require("formidable");
const fs = require('fs'); //fs is required to read files once parsed

// include the mysql module
var mysql = require('mysql');

// Bcrypt library for comparing password hashes
const bcrypt = require('bcrypt');

// helps in extracting the body portion of an incoming request stream
var bodyparser = require('body-parser');

const url = require('url');

const port = 9551;

// required for reading XML files
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var jsonConnectionData;
var pool;
fs.readFile(__dirname + '/dbconfig.xml', function(err, data) {
	if (err) throw err;
    parser.parseString(data, function (err, xml) {
		result = xml.dbconfig;
		if (err) throw err;
        jsonConnectionData = {
			connectionLimit:10,
			host: result.host[0],
			user: result.user[0],
			password: result.password[0],
			database: result.database[0],
			//port: result.port[0]
		}
		pool = mysql.createPool(jsonConnectionData);
		//console.log("Attempting database connection");
		//connection.connect(function (err) {
		//	if (err) {throw err;}
		//	console.log("Connected to database!");
		//});
	});
});


// create an express application
const app = express();


// Use express-session
// In-memory session is sufficient for this assignment
app.use(session({
        secret: "csci4131secretkey",
        saveUninitialized: true,
        resave: false
    }
));

// middle ware to serve static files
app.use('/client', express.static(__dirname + '/client'));

// server listens on port set to value above for incoming connections
app.listen(port, () => console.log('Listening on port', port));

//BONUS function: parse a JSON file and create sql requests for it.
//It has to be up here before the app.use(bodyparser)
app.post('/postJSONContactEntry', function(req,res){
	if(req.session.value){
      console.log("got req for JSON post");
	  const form = new formidable.IncomingForm();
      form.parse(req, (err, fields, files) => {
		  if (err) {throw err;}
		  fs.readFile(files.uploaded_file.filepath, function(err, fd) {
			if(err) {
			  throw err;
			}
			pool.getConnection(function(err, connection){
			  if (err) {throw err;}
			  let jsonObj = JSON.parse(fd);
			  let categories = ["Academic", "Industry", "Personal"];//caps because I dont want to wipe my database
			  let c = 0;
			  for(let catPtr of [jsonObj.academic, jsonObj.industry, jsonObj.personal]){//this for loop goes through academic, industry, and personal
				for(let i=0; i<catPtr.length; i++)
				{
					contact = catPtr[i];
					let contactToEnter = {
					  contact_category: categories[c],
					  contact_name: contact.name,
					  contact_location: contact.location,
					  contact_info: contact.info,
					  contact_email: contact.email,
					  website_title: contact.website_title,
					  website_url: contact.url,
					};
					connection.query('INSERT contact_table SET ?', contactToEnter, function (err, result) {
					  if (err) {throw err;}
					  //console.log("Table record inserted!");
					});
				}
				c++;//I know what order I am accessing the categories so this is safe
			  }
			  connection.release();
			  res.redirect('/AllContacts');
			});
		  });
      });
	}else{
	  res.redirect('/login');
	} 
});

// apply the body-parser middleware to all incoming requests
app.use(bodyparser());

app.get('/',function(req, res) {
  res.sendFile(__dirname + '/client/welcome.html');
});

app.get('/welcome',function(req, res) {
  res.sendFile(__dirname + '/client/welcome.html');
});

app.get('/login',function(req, res) {
  res.sendFile(__dirname + '/client/login.html');
});

app.post('/login', function(req,res){
  let loginInfo = req.body;
  let username = loginInfo.username;
  let password = loginInfo.password;
  pool.getConnection(function(err, connection){
    connection.query("SELECT * from tbl_accounts WHERE ?", {acc_login:username}, function(err, rows, fields){
		if (err) throw err;
		
		if(rows.length != 0)
		{//because of unique usernames, this will always return at maximum one elemnent in rows[0]
			let canLogin = bcrypt.compareSync(password, rows[0].acc_password);
			canLogin = canLogin && (username === rows[0].acc_login);
			if(canLogin)
			{
				req.session.value = username;
				res.json({login:1});
			}
			else{
				res.json({login:0});
			}
		}else{
			res.json({login:0});
		}
    });
    connection.release();
  });
});

// GET method route for the contacts page.
// It serves MyContacts.html present in client folder

app.get('/AdminPage', function(req, res) {
	if(req.session.value){
	  res.sendFile(__dirname + '/client/AdminPage.html');
	}else{
	  res.redirect('/login');
	} 
});

app.get('/MyContacts', function(req, res) {
	if(req.session.value){
	  res.sendFile(__dirname + '/client/MyContacts.html');
	}else{
	  res.redirect('/login');
	} 
});

app.get('/AllContacts', function(req, res) {
	if(req.session.value){
	  res.sendFile(__dirname + '/client/AllContacts.html');
	}else{
	  res.redirect('/login');
	}  
});

app.get('/AddContact', function(req, res) {
	if(req.session.value){
	  res.sendFile(__dirname + '/client/AddContact.html');
	}else{
	  res.redirect('/login');
	}  
});
app.get('/Stocks', function(req, res) {
	if(req.session.value){
	  res.sendFile(__dirname + '/client/Stocks.html');
	}else{
	  res.redirect('/login');
	}  
});

app.get('/getAllContacts', function(req, res) {
	if(req.session.value){
		pool.getConnection(function(err, connection){
		  connection.query("SELECT * from contact_table ORDER BY contact_category ASC, contact_name ASC", 
		  function(err, rows, fields){
			if (err) throw err;
			if(rows.length != 0){
			  let allContacts = [];
			  for (var i = 0; i < rows.length; i++){
				allContacts.push({ //I want to remove the id field and rename all fields before returning
					category: rows[i].contact_category,
					name: rows[i].contact_name,
					location: rows[i].contact_location,
					info: rows[i].contact_info,
					email: rows[i].contact_email,
					website_title: rows[i].website_title,
					url: rows[i].website_url,
				});
			  }
			  res.json(allContacts);
			}else{
			  res.json({empty:"empty"});
			}
		  });
		  connection.release();
		});
	}else{
	  res.redirect('/login')
	}  
});
app.get('/getContacts', function(req, res) {
	if(req.session.value){
	  pool.getConnection(function(err, connection){
		  connection.query("SELECT * from contact_table WHERE contact_category = ? ORDER BY contact_name ASC", 
		  req.query.category, function(err, rows, fields){
			if (err) throw err;
			if(rows.length != 0){
			  let allContacts = [];
			  for (var i = 0; i < rows.length; i++){
				allContacts.push({ //I want to remove the id field and rename all fields before returning
					//I could do all but renaming in the sql request
					name: rows[i].contact_name,
					location: rows[i].contact_location,
					info: rows[i].contact_info,
					email: rows[i].contact_email,
					website_title: rows[i].website_title,
					url: rows[i].website_url,
				});
			  }
			  res.json(allContacts);
			}else{
			  res.json({empty:"empty"});
			}
		  });
	      connection.release();
	  });
	}else{
	  res.redirect('/login')
	}  
});

app.post('/postContactEntry', function(req,res){
	if(req.session.value){
      let postData = req.body;
      let contactToEnter = {
		contact_category: postData.category,
		contact_name: postData.name,
		contact_location: postData.location,
		contact_info: postData.info,
		contact_email: postData.email,
		website_title: postData.website_title,
		website_url: postData.url,
	  };
	  pool.getConnection(function(err, connection){
		  connection.query('INSERT contact_table SET ?', contactToEnter, function (err, result) {
			if (err) {
				throw err;
			}
			console.log("Table record inserted!");
			res.redirect('/AllContacts');
		  });
	      connection.release();
	  });
	}else{
	  res.redirect('/login');
	} 
});


app.get('/logout', function(req, res){
	if(req.session.value){
		req.session.destroy();
	}else{
		console.log("Not logged in, cannot log out");
	}
	res.redirect("/login");
});

app.get('/username', function(req, res){
	if(req.session.value){
		usernameJSON = {user:req.session.value};
		res.json(usernameJSON);
	}else{
		res.redirect("/login");
	}
});

app.post('/username', function(req, res){ //this is a username change request. Same entry point because its cool
	if(req.session.value){
		req.session.value = req.body.login;
		res.json({status:"success"});
	}else{
		res.redirect("/login");
	}
});

app.get('/getListOfUsers', function(req, res){
	if(req.session.value){
	  pool.getConnection(function(err, connection){
		  connection.query("SELECT * from tbl_accounts", function(err, rows, fields){
			if (err) throw err;
			if(rows.length != 0){
			  let allUsers = [];
			  for (var i = 0; i < rows.length; i++){
				allUsers.push({
					id:rows[i].acc_id,
					name: rows[i].acc_name,
					username: rows[i].acc_login
				});
			  }
			  res.json(allUsers);
			}else{
			  res.json({empty:"empty"});
			}
		  });
	      connection.release();
	  });
	}else{
		res.redirect("/login");
	}
});
app.post('/addUser', function(req, res){
	if(req.session.value){
		pool.getConnection(function(err, connection){
		  connection.query("SELECT * from tbl_accounts WHERE ?", {acc_login:req.body.login}, function(err, rows, fields){
			if (err) throw err;
			if(rows.length != 0){//we cant add this user because this login already exists.
					res.json({status:"error"});
			}else{
				const saltRounds = 10;
				const passwordHash = bcrypt.hashSync(req.body.password, saltRounds);
				const rowToBeInserted = {
					acc_name: req.body.name,
					acc_login: req.body.login,
					acc_password: passwordHash
				};
				console.log("Attempting to insert record into tbl_accounts");
				connection.query('INSERT tbl_accounts SET ?', rowToBeInserted, function (err, result) {
					if (err) {
						throw err;
					}
					console.log("Table record inserted!");
					res.json({status:"success"});
				});
			}
		  });
	      connection.release();
	    });		
	}else{
		res.redirect("/login");
	}
});
app.post('/updateUser', function(req, res){
	if(req.session.value){
		//this query finds our id we want to change AND all of the users that match the potential username
		pool.getConnection(function(err, connection){
		  connection.query("SELECT * from tbl_accounts WHERE ? OR ?", [{acc_id:req.body.id},{acc_login:req.body.login}], function(err, rows, fields){
			if (err) throw err; 
			let isEditingNonexistientUser = rows.length == 0;
			if(isEditingNonexistientUser){
					res.json({status:"error"});
					return;
			}else{
				for(let i =0; i < rows.length; i++){
					let isIdOfUserBeingUpdated = rows[i].acc_id == req.body.id;
					let isCollisonWithExistingUsername = rows[i].acc_login == req.body.login;
					let isUserFromDatabaseLoggedIn = rows[i].acc_login == req.session.value;
					if(!isIdOfUserBeingUpdated && isCollisonWithExistingUsername){//check for collisions except when we want to keep the same username
						res.json({status:"error-taken"});
						return;
					}else if(isIdOfUserBeingUpdated && isUserFromDatabaseLoggedIn){ //this combo means we are trying to edit our current account!
						res.json({status:"error-active"});
						return;
					}
				}
				let rowToBeUpdated = {
					acc_name: req.body.name,
					acc_login: req.body.login,
				};
				if(req.body.password){
					const saltRounds = 10;
					const passwordHash = bcrypt.hashSync(req.body.password, saltRounds);
					rowToBeUpdated.acc_password= passwordHash;
				}
				connection.query('UPDATE tbl_accounts SET ? WHERE ?', [rowToBeUpdated, {acc_login:rows[0].acc_login}], function (err, result) {
					if (err) {
						throw err;
					}
					console.log("Account Table record updated!");
					res.json({status:"success"});
				});
			}
          });
	      connection.release();
	    });	
	}else{
		res.redirect("/login");
	}
});

app.post('/deleteUser', function(req, res){
	if(req.session.value){
		if(req.body.login == req.session.value){
			res.json({status:"error"});
		}else{
			pool.getConnection(function(err, connection){
			  connection.query("DELETE FROM tbl_accounts WHERE ?", {acc_login:req.body.login}, function(err, rows, fields){
					if (err) throw err;
					res.json({status:"success"});
			  });
			  connection.release();
			});	
		}
	}else{
		res.redirect("/login");
	}
});

app.get('/csvRequest', function(req, res){
	if(req.session.value){
		pool.getConnection(function(err, connection){
			  connection.query("SELECT * from contact_table ORDER BY contact_category ASC, contact_name ASC", //similar request to getAllContacts
				  function(err, rows, fields){
					if (err) throw err;
					if(rows.length != 0){
					  let csvFile = "Name,Category,Location,ContactInformation,Email,Website\n";
					  let dbRow = "";
					  for (var i = 0; i < rows.length; i++){
						dbRow= "\""+rows[i].contact_name+"\",";
						dbRow+="\""+rows[i].contact_category+"\",";
						dbRow+="\""+rows[i].contact_location+"\",";
						dbRow+="\""+rows[i].contact_info+"\",";
						dbRow+="\""+rows[i].contact_email+"\",";
						dbRow+="\""+rows[i].website_url+"\"";
						//i quoted dbRow because thats how a csv file works apparently.
						csvFile+=dbRow +"\n";
					  }
					  fs.writeFile('./client/contacts.csv', csvFile, err => {
						if (err) throw err
						res.sendFile(__dirname + '/client/contacts.csv');
					  });
					}else{
					  res.json({empty:"empty"});
					}
			  });
			  connection.release();
		}); 
	}else{
		res.redirect("/login");
	}
});
app.get('/client/export_icon.png', function(req, res) {
  res.sendFile(__dirname + '/client/export-icon.png');
});

// function to return the 404 message and error to client
app.get('*', function(req, res) {
  // add details
  res.sendStatus(404);
});



