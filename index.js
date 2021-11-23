const express = require('express');
const app = express();
app.set('view engine', 'pug')
const PORT = process.env.PORT || 3000;

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

var carrier = [];

//example of a query and passing in an array to index.pug
let query = 'Select carriername, carrierid from Carrier';
client.query (query, (err, rows) => {
	if (err) {
		console.log("error");
		return;
	}
	setOutput(rows);
	
	
	for (var i = 0; i < output.rows.length; i++) {
		carrier.push(output.rows[i].carriername);
	}
});

//home tab
app.get('/home', (req, res) => {
	res.render('index.pug', { name: output.rows[0].carriername, id: output.rows[0].carrierid, carrier: carrier, buttonclick: buttonclick()} );
})

//search results
app.get('/search', function(req, res, next) {
	var searchstring = req.query.searchBar;
	query = "Select carrierName FROM Carrier WHERE carrierName = '" + searchstring + "'";
	var results =[]
	
	client.query (query, (err, rows) => {
		if (err) {
			console.log("error");
			return;
		}
		
		for (var i = 0; i <rows.rows.length; i++) {
			results.push(rows.rows[i].carriername);
		}
		
		res.render('results.pug', {result: results});
	})
	
});


//example of passing in a function to index.pug
const buttonclick =  () =>{
	console.log('clicked');
	console.log();
	return 1;
}

//initial home page
app.use('/', (req, res, next) => {
	res.render('index.pug', { name: output.rows[0].carriername, id: output.rows[0].carrierid, carrier: carrier, buttonclick: buttonclick()} );
});



app.listen(PORT, () => {
	console.log('app listening on PORT');
});