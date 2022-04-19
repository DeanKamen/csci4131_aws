/*
TO DO:
-----
READ ALL COMMENTS AND REPLACE VALUES ACCORDINGLY
*/

var mysql = require("mysql");

const con = mysql.createConnection({
    host: "cse-mysql-classes-01.cse.umn.edu",
    user: "C4131S22U71",               // replace with the database user provided to you
    password: "5071",           // replace with the database password provided to you
    database: "C4131S22U71",           // replace with the database user provided to you
    port: 3306
});

con.connect(function(err) {
  if (err) {
    throw err;
  };
  console.log("Connected!");
    var sql = `CREATE TABLE contact_table(contact_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                                         contact_category VARCHAR(32),
                                         contact_name VARCHAR(256),
                                         contact_location VARCHAR(256),
                                         contact_info VARCHAR(256),
                                         contact_email VARCHAR(256),
                                         website_title VARCHAR(256),
                                         website_url VARCHAR(256))`;
  con.query(sql, function(err, result) {
    if(err) {
      throw err;
    }
    console.log("Table created");
        con.end();

  });
});
