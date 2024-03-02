import express from "express";
import dbSingleton from "../../config/db/DbSingleton.js";
const router = express.Router();

// TODO: Loop is bad idea. Make sure not to save if instructor_id is null or empty from frontend

router.get("/", async (req, res) => {
  let connection;
  try {
    connection = await dbSingleton.createConnection();

    const result = [];

    for (let i = 1; i <= 4; i++) {
      const instructor = await connection.execute(
        `SELECT * FROM instructors WHERE ID=:id`,
        [i]
      );
      const students = await connection.execute(
        `
              SELECT STUDENT.* FROM STUDENT
              WHERE STUDENT.INSTRUCTOR_ID =:id
    `,
        [i]
      );

      instructor.rows[0].STUDENTS = students.rows;
      result.push(instructor.rows[0]);
    }

    if (!result) {
      throw new Error("Error while getting instructors from database");
    }

    return res.status(200).send(result);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Error getting instructors data from DB");
  } finally {
    if (connection) {
      // the connection assignment worked, must release
      try {
        await connection.release();
      } catch (e) {
        console.error(e);
      }
    }
  }
});

// Get instructor but leave students out
router.get("/:id", async (req, res) => {
  let connection;
  try {
    let { id } = req.params;

    connection = await dbSingleton.createConnection();

    const result = await connection.execute(
      `SELECT * FROM instructors WHERE ID=:id`,
      [id]
    );

    const students = await connection.execute(
      `SELECT * FROM STUDENT WHERE STUDENT.INSTRUCTOR_ID=:id`,
      [id]
    );

    const instructor = result.rows[0];
    instructor.STUDENTS = students.rows;

    if (!instructor) {
      throw new Error("Error while getting instructor from database");
    }

    return res.status(200).send(instructor);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Error getting instructors data from DB");
  } finally {
    if (connection) {
      // the connection assignment worked, must release
      try {
        await connection.release();
      } catch (e) {
        console.error(e);
      }
    }
  }
});

export default router;
