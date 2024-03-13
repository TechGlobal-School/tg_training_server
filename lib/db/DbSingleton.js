import oracledb from "oracledb";

class DbSingleton {
  static instance;

  async createConnection() {
    oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

    try {
      const connection = await oracledb.getConnection({
        user: process.env.DB_USER_NAME,
        password: process.env.DB_USER_PASSWORD,
        connectString: process.env.DB_DEFAULT_CONNECT_DESCRIPTOR,
      });
      return connection;
    } catch (err) {
      console.log("err", err.message);
    }
  }
  static getInstance() {
    if (!this.instance) {
      this.instance = new DbSingleton();
    }
    return this.instance;
  }
}

const dbSingleton = DbSingleton.getInstance();

export default dbSingleton;
