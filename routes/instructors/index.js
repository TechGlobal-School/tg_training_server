import express from "express";
import dbSingleton from "../../lib/db/DbSingleton.js";
const router = express.Router();

// Todo: get rid of loop
router.get("/", async (req, res) => {
  let connection;
  try {
    connection = await dbSingleton.createConnection();
    const result = [];
    for (let i = 1; i <= 4; i++) {
      // Get instructor
      const instructor = await connection.execute(
        `SELECT * FROM instructors WHERE INSTRUCTOR_ID=:id`,
        [i]
      );
      // Get students
      const students = await connection.execute(
        `
              SELECT STUDENTS.* FROM STUDENTS
              WHERE STUDENTS.INSTRUCTOR_ID =:id
    `,
        [i]
      );
      // Add students
      instructor.rows[0].STUDENTS = students.rows;
      result.push(instructor.rows[0]);
    }

    if (!result) {
      throw new Error("Error getting instructors");
    }

    res.status(200).send(result);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send(err.message);
  } finally {
    if (connection) {
      // Release connection
      try {
        await connection.release();
      } catch (e) {
        console.error(e);
      }
    }
  }
});

router.get("/:id", async (req, res) => {
  let connection;
  try {
    let { id } = req.params;

    connection = await dbSingleton.createConnection();
    // Get instructor
    const result = await connection.execute(
      `SELECT * FROM instructors WHERE INSTRUCTOR_ID=:id`,
      [id]
    );
    // Get its students
    const students = await connection.execute(
      `SELECT * FROM STUDENTS WHERE STUDENTS.INSTRUCTOR_ID=:id`,
      [id]
    );
    // Add students
    const instructor = result.rows[0];
    instructor.STUDENTS = students.rows;

    if (!instructor) {
      throw new Error("Error getting instructor");
    }

    res.status(200).send(instructor);
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  } finally {
    if (connection) {
      // Release connection
      try {
        await connection.release();
      } catch (e) {
        console.error(e);
      }
    }
  }
});

export default router;
