module.exports = {

	rpc: {

		host:"localhost",

		port:8543

	},

	networks: {

		development: {

			host: "localhost", //our network is running on localhost

			network_id: "*",

			port: 8545, // port where your blockchain is running
			// port: 8544, // port where your blockchain is running

			from: "0x2efc3d476dacb35be2de1d908fb88d903b445ec2", 
			// from: "0xaece4a00bf18888ed53c9ee5c3f4c2f018cfdc9f", 
			

			gas: 20000000

		}

	}

};