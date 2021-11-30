const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const uid = require('uid');
const app = express();
app.set('view engine', 'pug')
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
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

var cookie;
var firstTime = 0;

//home tab
app.get('/home', (req, res) => {
	res.render('index.pug');
})

//watch list tab
app.get('/watch', (req, res) => {
	let results = [];
	query = "SELECT W.model, C.carrierName, E.websiteName FROM WatchList W, Carrier C, StoreEntry E WHERE W.carrierID = C.carrierID AND W.storeID = E.storeID AND W.userid='" + cookie + "'";
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

		query = "INSERT INTO WatchList VALUES('" + req.body.model + "', " + cid + ", " + sid + ", '" + cookie + "')";

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
	query = "SELECT carrierID, storeID from Carrier, StoreEntry WHERE carrierName='" + data[1] + "' AND websiteName='" + data[2] + "'";
	client.query (query, (err, rows) => {
		if (err) {
			
			console.log("error");
			return;
		}
		
		let cid = rows.rows[0].carrierid;
		let sid = rows.rows[0].storeid;
		query = "DELETE FROM WatchList WHERE model='" + data[0] + "' AND carrierID=" + cid + " AND storeID=" + sid + " AND userid='" + cookie + "'";
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
	var searchstring = req.query.searchBar.toLowerCase();
	query = "SELECT model from Phone WHERE LOWER(model) LIKE '%" + searchstring + "%'";
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
		//console.log(results);
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
	query = "SELECT P.model, P.brand, P.OS, P.battery, P.screenRes, P.dimensions, P.audiojack, P.imgurl FROM Phone P WHERE P.model='" + modelName + "'";
	client.query (query, (err, rows) => {
		if (err) {
			console.log("error");
			return;
		}	

		if (rows.rows != []) {
			phoneInfo.push(rows.rows[0].imgurl);
			phoneInfo.push(rows.rows[0].model);
			phoneInfo.push(rows.rows[0].brand);
			phoneInfo.push(rows.rows[0].os);
			phoneInfo.push(rows.rows[0].battery);
			phoneInfo.push(rows.rows[0].screenres);
			phoneInfo.push(rows.rows[0].dimensions);
			phoneInfo.push(rows.rows[0].audiojack);

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

			let plans = [];
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
						if (!plans.includes(rows.rows[i].websitename)) {
							let plan = [rows.rows[i].websitename];
							plans.push(plan);
						}
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

					
					query = "SELECT S.websiteName, P.paymentPeriod, P.planName, P.duration, P.price FROM StorePlans P, StoreEntry S WHERE S.storeID = P.storeID AND P.planName LIKE '%" + modelName.trim() + "%'"
					client.query (query, (err, rows) => {
						if (err) {
							console.log("error");
							return;
						}

						for (var i = 0; i <rows.rows.length; i++) {
							for (var j = 0; j < plans.length; j++) {
								if (plans[j][0] == rows.rows[i].websitename) {
									plans[j].push(rows.rows[i].planname);
									plans[j].push(rows.rows[i].duration);
									plans[j].push(rows.rows[i].paymentperiod);
									plans[j].push(rows.rows[i].price);
								}
							}
						}
						res.render('show.pug', {phoneInfo: phoneInfo, carriers: carriers, storeInfo: storeInfo, colors:colors, plans: plans});
					})
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
app.use(function (req, res, next) {
	cookie = req.cookies.cookieID;
	if (cookie === undefined) {
		let id = uid.uid();
		res.cookie('cookieID',id);
		console.log('cookie added');
	} else {
		//console.log('cookie exists', cookie);
		if (firstTime == 0) {
			query = "INSERT INTO WatchList2 VALUES('" + cookie + "')";
			client.query (query, (err, rows) => {
				if (err) {
					console.log("user already in database");
					return;	
				}
				console.log("user placed into database");
			})
			firstTime = 1;
		}
	}
	next();

});


//initial home page
app.use('/', (req, res, next) => {
	res.render('index.pug' );
});



app.listen(PORT, () => {
	console.log('app listening on PORT 3000 or 5000');
});