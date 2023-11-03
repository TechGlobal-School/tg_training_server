const config = {
	// url: 'http://localhost:8000/api/v1',
	user: 'techglobaldev',
	password: '$techglobaldev123!',
	database: 'techglobal',
	server: 'techglobal.cup7q3kvh5as.us-east-2.rds.amazonaws.com',
	driver: 'msnodesqlv8',
	authentication: {
		type: 'default',
	},
	options: {
		// trustedconnection: true,
		enableArithAbort: true,
		// instancename: 'techglobal',
		encrypt: true,
	},
	port: 1521,
};

export default config;
