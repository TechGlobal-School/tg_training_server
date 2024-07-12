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
    	SELECT STUDENTS.*, INSTRUCTORS.FULLNAME AS INSTRUCTOR_NAME
	    FROM STUDENTS
	    JOIN INSTRUCTORS
	    ON STUDENTS.INSTRUCTOR_ID = INSTRUCTORS.INSTRUCTOR_ID
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
      SELECT STUDENTS.*, INSTRUCTORS.FULLNAME AS INSTRUCTOR_NAME
	    FROM STUDENTS
	    JOIN INSTRUCTORS
	    ON STUDENTS.INSTRUCTOR_ID = INSTRUCTORS.INSTRUCTOR_ID
      WHERE STUDENTS.STUDENT_ID = :id`,
      [id]
    );
    const rows = result?.rows;

    console.log("result", result);
    // 404
    if (rows?.length <= 0) {
      return res.status(404).send(`Student not found with this id of ${id}`);
    }
    // 200
    const studentObj = rows[0];
    return res.status(200).send(studentObj);
  } catch (err) {
    // 500
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

    // Better check in DB but its a quick solution
    if (![1, 2, 3, 4].includes(INSTRUCTOR_ID)) {
      return res.status(400).send("Wrong Instructor ID, It can be 1,2,3 or 4.");
    }

    const result = await connection.execute(
      `INSERT INTO STUDENTS (STUDENT_ID, DOB, EMAIL, FIRST_NAME, LAST_NAME, INSTRUCTOR_ID) VALUES(STUDENT_SEQ.NEXTVAL, TO_DATE(:dob,'YYYY-MM-DD'),:email,:firstName,:lastName, :instructorId)`,
      [DOB, EMAIL, FIRST_NAME, LAST_NAME, INSTRUCTOR_ID],
      {
        autoCommit: true, // query has to be committed
      }
    );

    // We need ID as well
    const student = await connection.execute(
      `
    	SELECT * FROM STUDENTS
      WHERE STUDENTS.EMAIL=:email
    `,
      [EMAIL]
    );

    if (!result || !student) throw new Error("Error saving student to DB");

    // Note: Burak wants format of response DOB same as one posted for testing purposes
    const studentObj = student.rows?.[0];
    studentObj.DOB = DOB;

    return res.status(201).send(studentObj);
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
    const { id: STUDENT_ID } = req.params;

    // We don't care about timezone hence substr()
    const result = await connection.execute(
      `UPDATE STUDENTS
      SET FIRST_NAME=:firstName, LAST_NAME=:lastName, DOB=TO_DATE(substr(:dob, 1, 10),'YYYY-MM-DD'), EMAIL=:email, INSTRUCTOR_ID=:instructorId 
      WHERE STUDENT_ID=:id`,
      [FIRST_NAME, LAST_NAME, DOB, EMAIL, INSTRUCTOR_ID, STUDENT_ID],
      { autoCommit: true } // commit
    );

    // If email is correct but id incorrect or vice versa error should be given
    if (!result || result.rowsAffected === 0) {
      throw new Error("Error updating student to DB");
    }

    return res.status(200).send(`Successfully updated ${FIRST_NAME}`);
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
 * PATCH /:id
 * Update a student partially
 */
router.patch("/:id", async (req, res) => {
  let connection;
  try {
    connection = await dbSingleton.createConnection();
    const { id } = req.params;
    const parseId = parseInt(id);

    if (isNaN(parseId)) {
      return res.status(400).send("Incorrect id provided");
    }

    if (parseId === 1 || parseId === 2) {
      return res
        .status(403)
        .send("Not Authorized to update first 2 default students");
    }

    const result = await connection.execute(
      `
      SELECT STUDENTS.*, INSTRUCTORS.FULLNAME AS INSTRUCTOR_NAME
	    FROM STUDENTS
	    JOIN INSTRUCTORS
	    ON STUDENTS.INSTRUCTOR_ID = INSTRUCTORS.INSTRUCTOR_ID
      WHERE STUDENTS.STUDENT_ID = :id`,
      [id]
    );
    // console.log("result", result);

    const rows = result?.rows;

    console.log("rows", rows);

    // 404
    if (rows?.length <= 0) {
      return res.status(404).send(`Student not found with this id of ${id}`);
    }

    const student = rows[0];

    // TODO: Needs helper function to minimize the code size

    // First Name
    if (req.body.FIRST_NAME) {
      if (student.FIRST_NAME === req.body.FIRST_NAME) {
        return res.status(304).send("Nothing has changed");
      }
      student.FIRST_NAME = req.body.FIRST_NAME;

      const result = await connection.execute(
        `UPDATE STUDENTS
        SET FIRST_NAME=:firstName 
        WHERE STUDENT_ID=:id`,
        [req.body.FIRST_NAME, id],
        { autoCommit: true }
      );

      if (!result || result.rowsAffected === 0) {
        throw new Error("Error updating student to DB");
      }

      return res.status(200).json({
        student: student,
        message: `Student's first name updated to '${req.body.FIRST_NAME}'`,
      });
    }

    // Last Name
    if (req.body.LAST_NAME) {
      if (student.LAST_NAME === req.body.LAST_NAME) {
        return res.status(304).send("Nothing has changed");
      }
      student.LAST_NAME = req.body.LAST_NAME;

      const result = await connection.execute(
        `UPDATE STUDENTS
        SET LAST_NAME=:lastName 
        WHERE STUDENT_ID=:id`,
        [req.body.LAST_NAME, id],
        { autoCommit: true }
      );

      if (!result || result.rowsAffected === 0) {
        throw new Error("Error updating student to DB");
      }

      return res.status(200).json({
        student: student,
        message: `Student's last name updated to '${req.body.LAST_NAME}'`,
      });
    }

    // Email -> error
    if (req.body.EMAIL) {
      if (student.EMAIL === req.body.EMAIL) {
        return res.status(304).send("Nothing has changed");
      }
      student.EMAIL = req.body.EMAIL;

      const result = await connection.execute(
        `UPDATE STUDENTS
        SET EMAIL=:email 
        WHERE STUDENT_ID=:id`,
        [req.body.EMAIL, id],
        { autoCommit: true }
      );

      if (!result || result.rowsAffected === 0) {
        throw new Error("Error updating student to DB");
      }

      return res.status(200).json({
        student: student,
        message: `Student's email updated to '${req.body.EMAIL}'`,
      });
    }

    // DOB
    if (req.body.DOB) {
      if (student.DOB === req.body.DOB) {
        return res.status(304).send("Nothing has changed");
      }
      student.DOB = req.body.DOB;

      const result = await connection.execute(
        `UPDATE STUDENTS
        SET DOB=TO_DATE(substr(:dob, 1, 10),'YYYY-MM-DD') 
        WHERE STUDENT_ID=:id`,
        [req.body.DOB, id],
        { autoCommit: true }
      );

      if (!result || result.rowsAffected === 0) {
        throw new Error("Error updating student to DB");
      }

      return res.status(200).json({
        student: student,
        message: `Student's dob updated to '${req.body.DOB}'`,
      });
    }

    // INSTRUCTOR_ID
    if (req.body.INSTRUCTOR_ID) {
      if (![1, 2, 3, 4].includes(req.body.INSTRUCTOR_ID)) {
        return res
          .status(400)
          .send("Wrong Instructor ID, It can be 1,2,3 or 4.");
      }

      if (student.INSTRUCTOR_ID === req.body.INSTRUCTOR_ID) {
        return res.status(304).send("Nothing has changed");
      }
      student.INSTRUCTOR_ID = req.body.INSTRUCTOR_ID;

      const result = await connection.execute(
        `UPDATE STUDENTS
        SET INSTRUCTOR_ID=:instructorId 
        WHERE STUDENT_ID=:id`,
        [req.body.INSTRUCTOR_ID, id],
        { autoCommit: true }
      );

      if (!result || result.rowsAffected === 0) {
        throw new Error("Error updating student to DB");
      }

      return res.status(200).json({
        student: student,
        message: `Student's instructor id updated to '${req.body.INSTRUCTOR_ID}'`,
      });
    }

    // return ???
  } catch (err) {
    // return ???
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
      `DELETE FROM STUDENTS WHERE STUDENT_ID=:id`,
      [id],
      { autoCommit: true }
    );

    if (result && result?.rowsAffected === 0) {
      return res.status(404).send({
        message:
          "There is no student to delete. First 2 students 'Tech Global' and 'John Doe' are default and can't be deleted",
      });
    }
    res
      .status(200)
      .send({ message: `Successfully deleted user with Id: ${id}` });
  } catch (err) {
    if (err.errorNum === 20003) {
      return res.status(403).send({
        message:
          "You're not authorized to delete first 2 default students with id of 1 and 2",
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
      `DELETE from STUDENTS where STUDENT_ID > 2`,
      [],
      {
        autoCommit: true,
      }
    );
    if (!result || result?.rowsAffected === 0) {
      return res
        .status(404)
        .send(
          "There is no student to delete. Tech Global and John Doe are permanent."
        );
    }
    res.status(200).send({ message: "Successfully deleted all users!" });
  } catch (err) {
    console.log("err", err);
    res.status(500).send(err.message ?? "Error deleting all students from DB");
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
