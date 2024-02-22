import express from "express";
import dbSingleton from "../../config/db/DbSingleton.js";
const router = express.Router();

router.get("/", async (req, res) => {
  let connection;
  try {
    // const q = `
    // SELECT INSTRUCTORS.ID, INSTRUCTORS.FULLNAME, TO_CHAR(STUDENT.ID) FROM INSTRUCTORS
    // INNER JOIN STUDENT ON
    // STUDENT.ID = INSTRUCTORS.ID
    // `;
    connection = await dbSingleton.createConnection();

    const result = [];

    // const q = `SELECT * FROM instructors WHERE ID=${i}`;
    // const q2 = `
    //           SELECT STUDENT.* FROM STUDENT
    //           JOIN INSTRUCTORS
    //           ON STUDENT.INSTRUCTOR_ID = ${i}
    // `;

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

      console.log("instructor", instructor.rows[0]);
      console.log("students", students.rows);
      instructor.rows[0].STUDENTS = students.rows;
      result.push(instructor.rows[0]);
    }

    if (!result) {
      throw new Error("Error while getting instructors from database");
    }

    // console.log("result", result.rows);

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
    if (!result) {
      throw new Error("Error while getting instructor from database");
    }

    return res.status(200).send(result.rows);
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
