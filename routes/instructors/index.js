import express from "express";
import dbSingleton from "../../config/db/DbSingleton.js";
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const connection = await dbSingleton.createConnection();
    const result = await connection.execute("SELECT * FROM instructors");
    if (!result) {
      throw new Error("Error while getting instructors from database");
    }

    return res.status(200).send(result.rows);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Error getting data from DB");
  }
  //   finally {
  //  if (connection) {   // the connection assignment worked, must release
  //             try {
  //                 await connection.release();
  //             } catch (e) {
  //                 console.error(e);
  //             }
  //         }
  //   }
});

router.get("/:id", async (req, res) => {
  try {
    let { id } = req.params;

    const result = await connection.execute(
      `SELECT * FROM instructors WHERE ID = :id`,
      [id]
    );
    if (!result) {
      throw new Error("Error while getting instructor from database");
    }

    return res.status(200).send(result.rows);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Error getting data from DB");
  }
  //   finally {
  //  if (connection) {   // the connection assignment worked, must release
  //             try {
  //                 await connection.release();
  //             } catch (e) {
  //                 console.error(e);
  //             }
  //         }
  //   }
});

export default router;
