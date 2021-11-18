const express = require('express');
const app = express();

const {Client} = require('pg')
const client = new Client({
	host: "cse412project.coe06igosmnw.us-east-2.rds.amazonaws.com", 
	user: "postgres", 
	port: 5432, 
	password: "cse412project", 
	database: "cse412projectdatabase"
});

client.connect();

let output;
const setOutput = (rows) => {
	output = rows;
}

let query = 'Select carriername, carrierid from Carrier';
client.query (query, (err, rows) => {
	if (err) {
		console.log("error");
		return;
	}
	setOutput(rows);
});


app.use('/', (req, res, next) => {
	res.render('index.pug', { name: output.rows[0].carriername, age: output.rows[0].carrierid});
});

app.listen(8080, () => {
	console.log('app listening on 8080');
});