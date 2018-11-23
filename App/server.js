var artifact = require('../Leave/build/contracts/Leave.json')
// var artifact = require('./build/contracts/Leave.json')
var express = require('express');
var bodyParser = require('body-parser');
var Web3 = require('web3') ;
var path = require("path");
var fs = require('fs');
const mysql = require('mysql');
var session = require('express-session');
var contract = require('truffle-contract');
var app = express();
var format = format = require('string-format');
var request = require('request');

var ssn ;

format.extend(String.prototype, {})


app.set('view engine', 'pug');
app.set('views', './views');
app.use(bodyParser.json()); 		// for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); 	// for parsing application/xwww-
app.use(express.static(__dirname));
app.use(session({secret:'XASDASDA'}));


Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;
if(typeof web3 !== 'undefined'){
	console.warn("Using web3 detected from external source like Metamask")
	web3 = new Web3(web3.currentProvider);	// Use Mist/MetaMask's provider
}
else{
	console.warn("No web3 detected. Falling back to http://localhost:8545.");
	web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));	// fallback - using fallback strategy
}
var Leave = contract(artifact);

var Leave1 = new web3.eth.Contract(artifact.abi,"0xecb046e582fd480b28bb0e74ffbac3f6f543769c");
// instantiate by address
// var Leave = MyContract.at("0xe82b712c013cc1eabf2253cd22e0a4eecd44eafc");

Leave.setProvider(web3.currentProvider);
// var instance = Leave.deployed().then(function(res){},function(err){});


const db = mysql.createConnection ({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'LMS'
});
// connect to database
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});
global.db = db;



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var errorHandler = function(err){
	console.log('Found error in error handler' + err);
	return res.send({
		success:false,
		err: err
	});
}

var wait = function(ms){
	var start = new Date().getTime();
	var end = start;
	while(end<start+ms){
		end = new Date().getTime();
	}
	web3.miner.stop();
}

const Miner_JS = web3.extend({
	property: 'miner',
	methods: [
		new web3.extend.Method({
			name: 'start',
			call: 'miner_start',
			params: 1,
			inputFormatter: [null]
		}),
		new web3.extend.Method({
			name: 'stop',
			call: 'miner_stop'
		}),
		new web3.extend.Method({
			name: 'setEtherbase',
			call: 'miner_setEtherbase',
			params: 1,
			inputFormatter: [web3.extend.formatters.inputAddressFormatter]
		}),
		new web3.extend.Method({
			name: 'setExtra',
			call: 'miner_setExtra',
			params: 1
		}),
		new web3.extend.Method({
			name: 'setGasPrice',
			call: 'miner_setGasPrice',
			params: 1,
			inputFormatter: [web3.extend.utils.fromDecimal]
		}),
		new web3.extend.Method({
			name: 'setRecommitInterval',
			call: 'miner_setRecommitInterval',
			params: 1,
		}),
		new web3.extend.Method({
			name: 'getHashrate',
			call: 'miner_getHashrate'
		}),
	],
	properties: []
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


app.get('/', function(req, res){
   // res.send("Hello world!");
   res.sendFile(path.join(__dirname +'/templates/signup.html'));
});


app.post('/signup',function(req,res){

	if(req.body.password !== undefined && req.body.email !== undefined ){
		web3.eth.personal.newAccount(req.body.password,function (err, acc){
			if(err){
				return res.status(400).send({
					success: false,
					err: err
				})
			}

			console.log('Created new Account - ' + acc);
			web3.miner.setEtherbase(acc,function(err,result){
				if(err){
					return res.status(400).send({
						success: false,
						err: err
					})
				}
				console.log('changed etherbase successfully')
				
				web3.miner.start();
				setTimeout(function () {
					web3.eth.personal.unlockAccount(acc,req.body.password,15000, (err, result1) => {
						if(err){
							return res.status(400).send({
								success: false,
								err: err
							})
						}

						console.log('Logged in Account successfully- ' + acc);
						ssn=req.session;
						ssn.accountAddress = acc;

						Leave.deployed().then(function(contractInstance) {
							console.log('Going to create user');
							contractInstance.createAccount(req.body.email,{gas:500000, from: acc}).then(function(result2){
								web3.miner.stop();
								console.log('user created');

								console.log('Going to enter user in DB');
								let query = "INSERT INTO `users` (`id`, `email`, `name`, `password`, `accountAddress`) VALUES (NULL, " 
								query =query + "'" + req.body.email + "' , '" + req.body.name + "' , '" + req.body.password + "' , '" + acc + "');";
							    db.query(query, (err, result3) => {
							        if (err) {
							        	console.log(err);
							            res.send({
							            	success: false
							            });
							        }

							        console.log('Succesfully stored user in DB');
							        return res.status(400).send({
										success: true,
										accountAddress: acc
									});
							    });  
							},function(err){
								console.log('Found error in error handler' + err);
								return res.send({
									success:false,
									err: err
								})
							});
						},function(err){
							console.log('Found error in error handler' + err);
							return res.send({
								success:false,
								err: err
							})
						});
					});
				}, 10000);
			});
		});
	}
	else{
		console.log('No password or email');
		return res.status(400).send({
			success: false,
			err: 'No Password or Email Found'
		});
	}
});

app.post('/login',function(req,res){
	if(req.body.password !== undefined && req.body.email !== undefined){

		let query = "SELECT * FROM `users` where email = '" + req.body.email + "';";

		db.query(query, (err, result) => {
	        if (err) {
	        	console.log(err);
	            return res.send({
	            	success: false,
	            	msg: err
	            });
	        }
	        if(result.length !== 1){
	            return res.send({
	            	success: false,
	            	msg: 'Multiple or zero entries for email exists'
	            });
	        }
	        else if (result[0].password !== req.body.password){
	            return res.send({
	            	success: false,
	            	msg: 'Password is not correct'
	            });
	        }

	        console.log('password is correct');
        	web3.eth.personal.unlockAccount(result[0].accountAddress,req.body.password,15000, (err, acc) => {
				if(err){
					return res.status(400).send({
						success: false,
						err: err
					})
				}
				console.log('Logged in Account - ' + result[0].accountAddress);
				ssn=req.session;
				ssn.accountAddress = result[0].accountAddress;

				return res.status(400).send({
					success: true
				});
			});

	    });
	}
	else{
		console.log('Unable to login');
		return res.status(400).send({
			success: false
		});
	}
});

app.get('/logout',function(req,res){
	ssn=req.session;
	console.log(ssn);
	if(ssn.accountAddress === undefined){
		return res.status(400).send({
			success: false,
			msg: 'Please Log In'
		})
	}

	web3.eth.personal.lockAccount(ssn.accountAddress, (err, acc) => {
		if(err){
			return res.status(400).send({
				success: false,
				err: err
			})
		}
		console.log('Logged out Account - ' + ssn.accountAddress);

		return res.status(400).send({
			success: true
		});
	});
});


app.post('/applyForLeave',function(req,res){
	ssn=req.session;
	console.log(ssn);
	if(ssn.accountAddress === undefined){
		return res.status(400).send({
			success: false,
			msg: 'Please Log In'
		})
	}
	if(req.body.sDate !== undefined && req.body.eDate !== undefined && ssn.accountAddress !== undefined){
		console.log('Request received');
		try{
			Leave.deployed().then(function(contractInstance) {
				console.log('got contract instance');
				contractInstance.applyForLeave.call(req.body.sDate,req.body.eDate,{gas:200000, from: ssn.accountAddress}).then(function(result){
					if(result === false){
						return res.status(400).send({
							success: false,
							msg: "Can't apply for leave most probably you don't have an account on our app"
						});
					}

					contractInstance.applyForLeave(req.body.sDate,req.body.eDate,{gas:200000, from: ssn.accountAddress}).then(function(result1){
						console.log('leave applied successfully');
						return res.status(400).send({
							success: true,
							data: result
						});
					},function(err){
						console.log('Found error in error handler' + err);
						return res.send({
							success:false,
							err: err
						})
					});
				},function(err){
					console.log('Found error in error handler' + err);
					return res.send({
						success:false,
						err: err
					})
				});
			},function(err){
				console.log('Found error in error handler' + err);
				return res.send({
					success:false,
					err: err
				})
			});
		}
		catch(err){
			console.log(err);
			return res.status(400).send({
				success: false
			});
		}
		
	}
	else{
		return res.status(400).send({
			success: false
		});
	}
});

app.get('/getAllLeaves',function(req,res){
	ssn=req.session;
	console.log(ssn);
	if(ssn.accountAddress === undefined){
		return res.status(400).send({
			success: false,
			msg: 'Please Log In'
		})
	}
	Leave.deployed().then(function(contractInstance) {
		console.log('got contract instance');
		contractInstance.getAllLeaves.call({from: ssn.accountAddress}).then(function(result){
			console.log(result);
			return res.status(400).send({
				success: true,
				data: result
			});
		},function(err){
			console.log('Found error in error handler' + err);
			return res.send({
				success:false,
				err: err
			})
		});
	},function(err){
		console.log('Found error in error handler' + err);
		return res.send({
			success:false,
			err: err
		})
	});
		
});

app.get('/getMyLeaves',function(req,res){
	ssn=req.session;
	console.log(ssn);
	if(ssn.accountAddress === undefined){
		return res.status(400).send({
			success: false,
			msg: 'Please Log In'
		})
	}
	Leave.deployed().then(function(contractInstance) {
		console.log('got contract instance');
		contractInstance.getMyLeaves.call({from: ssn.accountAddress}).then(function(result){
			console.log(result);
			return res.status(400).send({
				success: true,
				data: result
			});
		},function(err){
			console.log('Found error in error handler' + err);
			return res.send({
				success:false,
				err: err
			})
		});
	},function(err){
		console.log('Found error in error handler' + err);
		return res.send({
			success:false,
			err: err
		})
	});
		
});

app.post('/approveLeave',function(req,res){
	ssn=req.session;
	console.log(ssn);
	if(ssn.accountAddress === undefined){
		return res.status(400).send({
			success: false,
			msg: 'Please Log In'
		})
	}
	if(req.body.id === undefined){
		return res.status(400).send({
			success: false,
			msg: 'Leave ID not received'
		})
	}
	Leave.deployed().then(function(contractInstance) {
		console.log('got contract instance');
		
		contractInstance.approveLeave.call(req.body.id,{gas:500000, from: ssn.accountAddress}).then(function(result){
			if(result === false){
				return res.status(400).send({
					success: false,
					msg: "Can't approve leave either you don't have permission or leave is already rejected or approved"
				});
			}

			contractInstance.approveLeave(req.body.id,{gas:500000, from: ssn.accountAddress}).then(function(result1){
				console.log(result);
				return res.status(400).send({
					success: true,
					data: result
				});
			},function(err){
				console.log('Found error in error handler' + err);
				return res.send({
					success:false,
					err: err
				})
			});
		},function(err){
			console.log('Found error in error handler' + err);
			return res.send({
				success:false,
				err: err
			})
		});

	},function(err){
		console.log('Found error in error handler' + err);
		return res.send({
			success:false,
			err: err
		})
	});		
});

app.post('/rejectLeave',function(req,res){
	ssn=req.session;
	console.log(ssn);
	if(ssn.accountAddress === undefined){
		return res.status(400).send({
			success: false,
			msg: 'Please Log In'
		})
	}
	if(req.body.id === undefined){
		return res.status(400).send({
			success: false,
			msg: 'Leave ID not received'
		})
	}
	Leave.deployed().then(function(contractInstance) {
		console.log('got contract instance');
		contractInstance.rejectLeave.call(req.body.id,{gas:500000, from: ssn.accountAddress}).then(function(result){
			if(result === false){
				return res.status(400).send({
					success: false,
					msg: "Can't approve leave either you don't have permission or leave is already rejected or approved"
				});
			}

			contractInstance.rejectLeave(req.body.id,{gas:500000, from: ssn.accountAddress}).then(function(result1){
				console.log(result);
				return res.status(400).send({
					success: true,
					data: result
				});
			},function(err){
				console.log('Found error in error handler' + err);
				return res.send({
					success:false,
					err: err
				})
			});
		},function(err){
			console.log('Found error in error handler' + err);
			return res.send({
				success:false,
				err: err
			})
		});
	},function(err){
		console.log('Found error in error handler' + err);
		return res.send({
			success:false,
			err: err
		})
	});
		
});

app.post('/showLeave',function(req,res){
	ssn=req.session;
	console.log(ssn);
	if(ssn.accountAddress === undefined){
		return res.status(400).send({
			success: false,
			msg: 'Please Log In'
		})
	}
	if(req.body.id === undefined){
		return res.status(400).send({
			success: false,
			msg: 'Leave ID not received'
		})
	}
	Leave.deployed().then(function(contractInstance) {
		console.log('got contract instance');
		contractInstance.showLeave.call(req.body.id,{from: ssn.accountAddress}).then(function(result){
			console.log(result);
			return res.status(400).send({
				success: true,
				data: result
			});
		},function(err){
			console.log('Found error in error handler' + err);
			return res.send({
				success:false,
				err: err
			})
		});
	},function(err){
		console.log('Found error in error handler' + err);
		return res.send({
			success:false,
			err: err
		})
	});	
});

app.get('/userExists',function(req,res){
	ssn=req.session;
	console.log(ssn);
	if(ssn.accountAddress === undefined){
		return res.status(400).send({
			success: false,
			msg: 'Please Log In'
		})
	}
	try{
		Leave.deployed().then(function(contractInstance) {
			console.log('got contract instance');
			contractInstance.userExists.call(ssn.accountAddress,{from: ssn.accountAddress}).then(function(result){
				console.log(result);
				return res.status(400).send({
					success: true,
					data: result
				});
			},function(err){
				console.log('Found error in error handler' + err);
				return res.send({
					success:false,
					err: err
				})
			});
		},function(err){
			console.log('Found error in error handler' + err);
			return res.send({
				success:false,
				err: err
			})
		});
	}
	catch(err){
		console.log(err);
		return res.status(400).send({
			success: false
		});
	}	
});



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.listen(3000,'0.0.0.0',() => console.log(`App running on http://127.0.0.1:3000`));