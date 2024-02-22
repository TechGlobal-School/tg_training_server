import express from "express";
import dbSingleton from "../../config/db/DbSingleton.js";
const router = express.Router();

// TODO: Custom error messages
// Get connection before each request?
// Update frontend upper case values same as in DB. Format DB in FE
// Remove duplicates on format date
// Validate if date is future or 100 older date?

router.get("/", async (req, res) => {
  let connection;
  try {
    connection = await dbSingleton.createConnection();
    const result = await connection.execute(`
    	SELECT STUDENT.*, INSTRUCTORS.FULLNAME AS INSTRUCTOR_NAME
	    FROM STUDENT
	    JOIN INSTRUCTORS
	    ON STUDENT.INSTRUCTOR_ID = INSTRUCTORS.ID
    `);

    // format date
    result.rows.forEach((row) => {
      const date = new Date(row.DOB);
      const year = date.toLocaleString("default", { year: "numeric" });
      const month = date.toLocaleString("default", { month: "2-digit" });
      const day = date.toLocaleString("default", { day: "2-digit" });
      return (row.DOB = year + "-" + month + "-" + day); // yyyy-mm-dd
    });
    return res.status(200).send(result.rows);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Error getting data from DB");
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

/**
 * GET /:id
 * Returns single student
 */

router.get("/:id", async (req, res) => {
  let connection;
  try {
    connection = await dbSingleton.createConnection();
    let { id } = req.params;

    const result = await connection.execute(
      `
      SELECT STUDENT.*, INSTRUCTORS.FULLNAME AS INSTRUCTOR_NAME
	    FROM STUDENT
	    JOIN INSTRUCTORS
	    ON STUDENT.INSTRUCTOR_ID = INSTRUCTORS.ID
      WHERE STUDENT.ID = :id`,
      [id]
    );
    // format date
    result.rows.forEach((row) => {
      const date = new Date(row.DOB);
      const year = date.toLocaleString("default", { year: "numeric" });
      const month = date.toLocaleString("default", { month: "2-digit" });
      const day = date.toLocaleString("default", { day: "2-digit" });
      return (row.DOB = year + "-" + month + "-" + day); // yyyy-mm-dd
    });
    res.status(200).send(result.rows);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Error connecting to DB");
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

/**
 * POST /
 * Saves a new student
 */
router.post("/", async (req, res) => {
  let connection;
  try {
    connection = await dbSingleton.createConnection();
    const student = req.body;

    // Change this to same as in DB in front end
    const { FIRST_NAME, LAST_NAME, EMAIL, DOB, INSTRUCTOR_ID } = student;

    // TODO: Double check this. Do we need this?
    const result = await connection.execute(
      `INSERT INTO STUDENT (ID, DOB, EMAIL, FIRST_NAME, LAST_NAME, INSTRUCTOR_ID) VALUES(STUDENT_SEQ.NEXTVAL, TO_DATE(:dob,'YYYY-MM-DD'),:email,:firstName,:lastName, :instructorId)`,
      [DOB, EMAIL, FIRST_NAME, LAST_NAME, INSTRUCTOR_ID],
      {
        autoCommit: true, // query has to be committed
      }
    );
    if (result) {
      const student = await connection.execute(
        "SELECT * FROM STUDENT WHERE EMAIL=:email",
        [EMAIL]
      );
      return res.status(200).send(student.rows[0]);
    }
  } catch (err) {
    console.error(err.message);

    if (err.errorNum === 1) {
      res.status(409).send({
        message: "The email you have entered is already in use!",
      });
    } else if (err.errorNum === 1400) {
      res.status(400).send({
        message: "Missing field! Please fill all parameters and try again!",
      });
    } else if (err.errorNum === 2290) {
      res.status(400).send({
        message: !email.match(/[a-z0-9\-]+@[a-z]+\.[a-z]{2,3}/)
          ? "Invalid email format. The expected format is <2+chars>@<2+chars>.<2+chars> and only digits, letters, and @.-_ characters are allowed."
          : "Invalid character in the field.",
      });
    } else if (err.errorNum === 20001) {
      res.status(400).send({
        message: "Invalid date. The date of birth cannot be a future date.",
      });
    } else if (err.errorNum === 20002) {
      res.status(400).send({
        message: "Invalid date. The age limit is 100.",
      });
    } else if (
      err.errorNum === 1847 ||
      err.errorNum === 1861 ||
      err.errorNum === 1843
    ) {
      res.status(400).send({
        message: "Invalid date format. The expected date format is yyyy-MM-dd.",
      });
    } else {
      res.status(500).send("Error saving student to DB");
    }
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

/**
 * PUT /:id
 * Update a student
 */
router.put("/:id", async (req, res) => {
  let connection;
  try {
    connection = await dbSingleton.createConnection();
    const { FIRST_NAME, LAST_NAME, DOB, EMAIL, INSTRUCTOR_ID } = req.body;
    const { id: ID } = req.params;

    console.log("req.body", req.body, ID);
    const result = await connection.execute(
      `UPDATE STUDENT 
      SET FIRST_NAME=:firstName, LAST_NAME=:lastName, DOB=TO_DATE(:dob,'YYYY-MM-DD'), EMAIL=:email, INSTRUCTOR_ID=:instructorId 
      WHERE ID=:id`,
      [FIRST_NAME, LAST_NAME, DOB, EMAIL, INSTRUCTOR_ID, ID],
      { autoCommit: true } // query has to be committed
    );

    if (result) {
      const student = await connection.execute(
        `SELECT STUDENT.*, INSTRUCTORS.FULLNAME AS INSTRUCTOR_NAME
	    FROM STUDENT
	    JOIN INSTRUCTORS
	    ON STUDENT.INSTRUCTOR_ID =:INSTRUCTOR_ID
      WHERE EMAIL=:EMAIL
      `,
        [INSTRUCTOR_ID, EMAIL]
      );
      console.log("student", student.rows[0]);
      return res.status(200).send(student.rows[0]);
    }

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);

    if (err.errorNum === 2004) {
      res.status(409).send({
        message: "The email you have entered is already in use!",
      });
    } else {
      res.status(500).send("Error updating student to DB");
    }
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

/**
 * DELETE /
 * Delete a student
 */
router.delete("/:id", async (req, res) => {
  let connection;
  try {
    connection = await dbSingleton.createConnection();
    const { id } = req.params;

    const result = await connection.execute(
      `DELETE FROM STUDENT WHERE ID=:id`,
      [id],
      {
        autoCommit: true,
      }
    );

    if (result && result?.rowsAffected === 0) {
      res.status(500).send({
        message:
          "There is no student to delete. Tech Global and John Doe are permanent.",
      });
    }
    // TODO:Send proper message
    res.status(200).send(result);
  } catch (err) {
    if (err.errorNum === 20003) {
      res.status(403).send({
        message: `You're not authorized to delete ${
          id == 1 ? "Tech Global!" : "John Doe!"
        }`,
      });
    } else {
      res.status(500).send("Error deleting student from DB");
    }
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

/**
 * DELETE /all/delete
 * Delete all students
 */
router.delete("/all/delete", async (req, res) => {
  let connection;
  try {
    connection = await dbSingleton.createConnection();
    const result = await connection.execute(
      `DELETE from STUDENT where ID > 2`,
      [],
      {
        autoCommit: true,
      }
    );
    if (result && result?.rowsAffected === 0) {
      res.status(500).send({
        message:
          "There is no student to delete. Tech Global and John Doe are permanent.",
      });
    }

    res.status(200).send(result.rows);
  } catch (err) {
    console.log("err", err);
    res.status(500).send("Error deleting student from DB");
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
