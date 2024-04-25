import express from "express";
import dbSingleton from "../../lib/db/DbSingleton.js";
import { logger } from "../../lib/logger/logger.js";
const router = express.Router();

router.get("/", async (req, res) => {
  let connection;
  try {
    // TODO: Testing logger - check on AWS
    logger.log({
      level: "info",
      message: "/students GET hit",
    });

    connection = await dbSingleton.createConnection();
    const result = await connection.execute(`
    	SELECT STUDENT.*, INSTRUCTORS.FULLNAME AS INSTRUCTOR_NAME
	    FROM STUDENT
	    JOIN INSTRUCTORS
	    ON STUDENT.INSTRUCTOR_ID = INSTRUCTORS.ID
    `);

    return res.status(200).send(result.rows);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Error getting data from DB");
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
    const studentObj = result.rows[0];
    res.status(200).send(studentObj);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Error connecting to DB");
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

/**
 * POST /
 * Saves a new student
 */
router.post("/", async (req, res) => {
  let connection;
  try {
    connection = await dbSingleton.createConnection();
    const { FIRST_NAME, LAST_NAME, EMAIL, DOB, INSTRUCTOR_ID } = req.body;

    const result = await connection.execute(
      `INSERT INTO STUDENT (ID, DOB, EMAIL, FIRST_NAME, LAST_NAME, INSTRUCTOR_ID) VALUES(STUDENT_SEQ.NEXTVAL, TO_DATE(:dob,'YYYY-MM-DD'),:email,:firstName,:lastName, :instructorId)`,
      [DOB, EMAIL, FIRST_NAME, LAST_NAME, INSTRUCTOR_ID],
      {
        autoCommit: true, // query has to be committed
      }
    );

    // We need ID as well
    const student = await connection.execute(
      `
    	SELECT * FROM STUDENT
      WHERE STUDENT.EMAIL=:email
    `,
      [EMAIL]
    );

    if (!result || !student) throw new Error("Error saving student to DB");

    // No needed to query again for student if we know result successful
    return res.status(201).send(student.rows?.[0]);
  } catch (err) {
    console.error("Error", err.message);

    if (err.errorNum === 1) {
      return res.status(409).send({
        message: "The email you have entered is already in use!",
      });
    } else if (err.errorNum === 1400) {
      return res.status(400).send({
        message: "Missing field! Please fill all parameters and try again!",
      });
    } else if (err.errorNum === 2290) {
      return res.status(400).send({
        message: !req.body.EMAIL.match(/[a-z0-9\-]+@[a-z]+\.[a-z]{2,3}/)
          ? "Invalid email format. The expected format is <2+chars>@<2+chars>.<2+chars> and only digits, letters, and @.-_ characters are allowed."
          : "Invalid character in the field.",
      });
    } else if (err.errorNum === 20001) {
      return res.status(400).send({
        message: "Invalid date. The date of birth cannot be a future date.",
      });
    } else if (err.errorNum === 20002) {
      return res.status(400).send({
        message: "Invalid date. The age limit is 100.",
      });
    } else if (
      err.errorNum === 1847 ||
      err.errorNum === 1861 ||
      err.errorNum === 1843
    ) {
      return res.status(400).send({
        message: "Invalid date format. The expected date format is yyyy-MM-dd.",
      });
    } else {
      return res.status(500).send({ message: "Error saving student to DB" });
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

    // We don't care about timezone hence substr()
    const result = await connection.execute(
      `UPDATE STUDENT
      SET FIRST_NAME=:firstName, LAST_NAME=:lastName, DOB=TO_DATE(substr(:dob, 1, 10),'YYYY-MM-DD'), EMAIL=:email, INSTRUCTOR_ID=:instructorId 
      WHERE ID=:id`,
      [FIRST_NAME, LAST_NAME, DOB, EMAIL, INSTRUCTOR_ID, ID],
      { autoCommit: true } // commit
    );

    // If email is correct but id incorrect or vice versa error should be given
    if (!result || result.rowsAffected === 0) {
      throw new Error("Error updating student to DB");
    }

    return res.status(201).send(`Successfully updated ${FIRST_NAME}`);
  } catch (err) {
    console.error("Error", err.message);

    if (err.errorNum === 2004) {
      return res.status(409).send({
        message: "The email you have entered is already in use!",
      });
    } else {
      return res.status(500).send({
        message: "Error updating student to DB",
      });
    }
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
      { autoCommit: true }
    );

    if (result && result?.rowsAffected === 0) {
      return res.status(500).send({
        message:
          "There is no student to delete. Tech Global and John Doe are permanent.",
      });
    }
    res
      .status(200)
      .send({ message: `Successfully deleted user with Id: ${id}` });
  } catch (err) {
    if (err.errorNum === 20003) {
      return res.status(403).send({
        message: `You're not authorized to delete ${
          id == 1 ? "Tech Global!" : "John Doe!"
        }`,
      });
    } else {
      return res.status(500).send("Error deleting student from DB");
    }
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
    console.log("result", result);
    if (!result || result?.rowsAffected === 0) {
      throw new Error(
        "There is no student to delete. Tech Global and John Doe are permanent."
      );
    }
    res.status(200).send({ message: "Successfully deleted all users!" });
  } catch (err) {
    console.log("err", err);
    res.status(500).send(err.message ?? "Error deleting student from DB");
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
