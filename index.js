const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.set('view engine', 'pug')
app.use(bodyParser.urlencoded({extended: true}));
const PORT = process.env.PORT || 3000;

//connect to database
const {Client} = require('pg')
const client = new Client({
	host: "cse412project.coe06igosmnw.us-east-2.rds.amazonaws.com", 
	user: "postgres", 
	port: 5432, 
	password: "cse412project", 
	database: "cse412projectdatabase"
});

client.connect();


//home tab
app.get('/home', (req, res) => {
	res.render('index.pug', { name: output.rows[0].carriername, id: output.rows[0].carrierid, carrier: carrier, buttonclick: buttonclick()} );
})

//watch list tab
app.get('/watch', (req, res) => {
	let results = [];
	query = "SELECT W.model, C.carrierName, E.websiteName FROM WatchList W, Carrier C, StoreEntry E WHERE W.carrierID = C.carrierID AND W.storeID = E.storeID";
	client.query (query, (err, rows) => {
		if (err) {
			console.log("error");
			return;
		}	

		if (rows.rows != []) {
					for (var i = 0; i <rows.rows.length; i++) {
						results.push(rows.rows[i].model);
						results.push(rows.rows[i].carriername);
						results.push(rows.rows[i].websitename);
					}
		}
		res.render('watch.pug', {results: results} );
	})
})

//add to watch list
app.post('/add', (req, res) => {
	query = "SELECT carrierID, storeID from Carrier, StoreEntry WHERE carrierName='" + req.body.cservices + "' AND websiteName='" + req.body.stores + "'";
	client.query (query, (err, rows) => {
		if (err) {
			
			console.log("error");
			return;
		}
		
		let cid = rows.rows[0].carrierid;
		let sid = rows.rows[0].storeid;

		query = "INSERT INTO WatchList VALUES('" + req.body.model + "', " + cid + ", " + sid + ")";
		client.query (query, (err, rows) => {
			if (err) {
				
				console.log("error");
				return;
			}
		})
	})
})

//remove from watch list
app.post('/remove', (req, res) => {
	let data = JSON.parse(req.body.remove);
	console.log(data);
	query = "SELECT carrierID, storeID from Carrier, StoreEntry WHERE carrierName='" + data[1] + "' AND websiteName='" + data[2] + "'";
	client.query (query, (err, rows) => {
		if (err) {
			
			console.log("error");
			return;
		}
		
		let cid = rows.rows[0].carrierid;
		let sid = rows.rows[0].storeid;
		query = "DELETE FROM WatchList WHERE model='" + data[0] + "' AND carrierID=" + cid + "AND storeID=" + sid;
		client.query (query, (err, rows) => {
			if (err) {
				
				console.log("error");
				return;
			}
			
		})
	})
})

//search results
app.get('/search', function(req, res, next) {
	var searchstring = req.query.searchBar;
	query = "SELECT model from Phone WHERE model LIKE '%" + searchstring + "%'";
	let results =[];
	
	client.query (query, (err, rows) => {
		if (err) {
			console.log("error");
			return;
		}
		
		for (var i = 0; i <rows.rows.length; i++) {
			results.push(rows.rows[i].model);
		}
		
		//console.log(rows.rows);
//		console.log(results);
		res.render('results.pug', {results: results});
	})
	
});

//show more information about a phone
app.get('/show', function(req, res, next) {
	let modelName = req.query.rowvalue;
	let phoneInfo = [];
	let carriers = [];
	let storeInfo = [];
	let colors = [];
	query = "SELECT P.model, P.brand, P.OS, P.batteryLife, P.screenRes, P.dimensions FROM Phone P WHERE P.model='" + modelName + "'";
	client.query (query, (err, rows) => {
		if (err) {
			console.log("error");
			return;
		}	

		if (rows.rows != []) {
			phoneInfo.push(rows.rows[0].model);
			phoneInfo.push(rows.rows[0].brand);
			phoneInfo.push(rows.rows[0].os);
			phoneInfo.push(rows.rows[0].batterylife);
			phoneInfo.push(rows.rows[0].screenres);
			phoneInfo.push(rows.rows[0].dimensions);
			
		}
		query = "SELECT C.carrierName FROM Phone P, Carrier C, CelluarService S WHERE P.model LIKE '%" + modelName + "%' AND P.model = S.model AND S.carrierID = C.carrierID";
		client.query (query, (err, rows) => {
			if (err) {
				console.log("error");
				return;
			}
			if (rows.rows != []) {
				for (var i = 0; i <rows.rows.length; i++) {
					carriers.push(rows.rows[i].carriername);
				}
			}
			query = "SELECT S.price, S.storageSpace, E.websiteName FROM Phone P, Sells S, StoreEntry E WHERE P.model LIKE '%" + modelName + "%' AND S.model = P.model AND S.storeID = E.storeID";
			client.query (query, (err, rows) => {
				if (err) {
					console.log("error");
					return;
				}

				if (rows.rows != []) {
					for (var i = 0; i <rows.rows.length; i++) {
						storeInfo.push(rows.rows[i].websitename);
						storeInfo.push(rows.rows[i].storagespace);
						storeInfo.push(rows.rows[i].price);
					}
				}
				query = "SELECT F.color FROM Phone P, Features F WHERE P.model LIKE '%" + modelName + "%' AND P.model = F.model";
				client.query (query, (err, rows) => {
					if (err) {
						console.log("error");
						return;
					}

					if (rows.rows != []){ 
						for (var i = 0; i <rows.rows.length; i++) {
							colors.push(rows.rows[i].color);
						}
					}
					res.render('show.pug', {phoneInfo: phoneInfo, carriers: carriers, storeInfo: storeInfo, colors:colors});
				})
			})
		})
	})
})

//show data plans for each carrier
app.get('/dataplans', (req, res) => {
	query = "SELECT carrierName FROM Carrier";
	client.query (query, (err, rows) => {
		if (err) {
			console.log("error");
			return;	
		}	
		let carriers = [];

		for (var i = 0; i <rows.rows.length; i++) {
			let carrier = [rows.rows[i].carriername];
			carriers.push(carrier);
		}

		

		query = "SELECT C.carrierName, P.dataLimit, P.monthlyPrice, P.planName FROM DataPlans P, Carrier C WHERE C.carrierID = P.carrierID";
		client.query (query, (err, rows) => {
			if (err) {
				console.log("error");
				return;	
			}	

			for (var i = 0; i <rows.rows.length; i++) {
				for (var j = 0; j < carriers.length; j++) {
					if (carriers[j][0] == rows.rows[i].carriername) {
						carriers[j].push(rows.rows[i].planname);
						carriers[j].push(rows.rows[i].datalimit);
						carriers[j].push(rows.rows[i].monthlyprice);
					}
				}
			}
			
			res.render('dataplans.pug', {carriers:carriers});
		})
	})
})

//initial home page
app.use('/', (req, res, next) => {
	res.render('index.pug', { name: output.rows[0].carriername, id: output.rows[0].carrierid, carrier: carrier} );
});



app.listen(PORT, () => {
	console.log('app listening on PORT 3000');
});