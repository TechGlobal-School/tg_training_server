/*
import config from './dbconfig.js';
// const sql = require('mssql');
import sql from 'mssql';

export async function getStudents() {
	try {
		let pool = await sql.connect(config);
		let students = await pool.request().query('SELECT * FROM student');
		return students;
	} catch (error) {
		console.log(error);
	}
}

export default getStudents;
// module.exports = {
	// getStudents: getStudents,
// }
*/