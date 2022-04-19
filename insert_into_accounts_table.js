/*
TO DO:
-----
READ ALL COMMENTS AND REPLACE VALUES ACCORDINGLY
*/

const mysql = require("mysql");
const bcrypt = require('bcrypt');

const dbCon = mysql.createConnection({
    host: "localhost",
    user: "hunter",               // replace with the database user provided to you
    password: "5071",           // replace with the database password provided to you
    database: "contacts",           // replace with the database user provided to you
});

console.log("Attempting database connection");
dbCon.connect(function (err) {
    if (err) {
        throw err;
    }

    console.log("Connected to database!");

    const saltRounds = 10;
    const myPlaintextPassword = 'pass';// replace with acc_password chosen by you OR retain the same value
    const passwordHash = bcrypt.hashSync(myPlaintextPassword, saltRounds);

    const rowToBeInserted = {
        acc_name: 'user',            // replace with acc_name chosen by you OR retain the same value
        acc_login: 'user',           // replace with acc_login chosen by you OR retain the same value
        acc_password: passwordHash      
    };

    console.log("Attempting to insert record into tbl_accounts");
    dbCon.query('INSERT tbl_accounts SET ?', rowToBeInserted, function (err, result) {
        if (err) {
            throw err;
        }
        console.log("Table record inserted!");
    });

    dbCon.end();
});
/*
connection.query("SELECT * from contact_table", function(err, rows, fields){
	if (err) throw err;
	if(rows.length != 0)
	{
		for (var i = 0; i < rows.length; i++){
			console.log(
				rows[i].contact_id + " " +
				rows[i].contact_category + " " +
				rows[i].contact_name + " " +
				rows[i].contact_info + " " +
				rows[i].contact_email + " " +
				rows[i].website_title + " " +
				rows[i].website_url
			);
		}
	}else{
		console.log("No rows retrieved");
	}
});
*/
