import express from "express";
import bodyParser from "body-parser";
import oracledb from "oracledb";

oracledb.autoCommit = true;
const PORT = process.env.PORT || 8089;
const app = express();

const connectionProperties = {
  user: process.env.DB_USER_NAME || "techglobaldev",
  password: process.env.DB_USER_PASSWORD || "$techglobaldev123!",
  connectString:
    process.env.DB_DEFAULT_CONNECT_DESCRIPTOR ||
    "techglobal.cup7q3kvh5as.us-east-2.rds.amazonaws.com:1521/TGDEVQA",
};

function doRelease(connection) {
  connection.release(function (err) {
    if (err) {
      console.error(err.message);
    }
  });
}

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ type: "*/*" }));

const router = express.Router();

router.use(function (request, response, next) {
  console.log("REQUEST:" + request.method + "   " + request.url);
  console.log("BODY:" + JSON.stringify(request.body));
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  response.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  response.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

/**
 * GET /
 * Returns a list of students
 */
router.route("/students/").get(function (request, response) {
  console.log("GET STUDENTS");
  oracledb.getConnection(connectionProperties, function (err, connection) {
    if (err) {
      console.error(err.message);
      response.status(500).send("Error connecting to DB");
      return;
    }
    console.log("After connection");
    connection.execute(
      "SELECT * FROM student_2",
      {},
      { outFormat: oracledb.OBJECT },
      function (err, result) {
        if (err) {
          console.error(err.message);
          response.status(500).send("Error getting data from DB");
          doRelease(connection);
          return;
        }
        console.log("RESULTSET:" + JSON.stringify(result));
        let students = [];
        result.rows.forEach(function (element) {
          students.push({
            id: element.ID,
            dob: element.DOB,
            email: element.EMAIL,
            firstName: element.FIRST_NAME,
            lastName: element.LAST_NAME,
          });
        }, this);
        response.json(students);
        doRelease(connection);
      }
    );
  });
});

/**
 * GET /searchType/searchValue
 * Returns a list of students that match the criteria
 */
router
  .route("/students/:searchType/:searchValue")
  .get(function (request, response) {
    console.log("GET STUDENTS BY CRITERIA");
    oracledb.getConnection(connectionProperties, function (err, connection) {
      if (err) {
        console.error(err.message);
        response.status(500).send("Error connecting to DB");
        return;
      }
      console.log("After connection");
      let searchType = request.params.searchType;
      let searchValue = request.params.searchValue;

      connection.execute(
        "SELECT * FROM student WHERE " + searchType + " = :searchValue",
        [searchValue],
        { outFormat: oracledb.OBJECT },
        function (err, result) {
          if (err) {
            console.error(err.message);
            response.status(500).send("Error getting data from DB");
            doRelease(connection);
            return;
          }
          console.log("RESULTSET:" + JSON.stringify(result));
          let students = [];
          result.rows.forEach(function (element) {
            students.push({
              id: element.ID,
              firstName: element.FIRST_NAME,
              lastName: element.LA_STNAME,
              email: element.EMAIL,
              dob: element.DOB,
            });
          }, this);
          response.json(students);
          doRelease(connection);
        }
      );
    });
  });

/**
 * POST /
 * Saves a new student
 */
router.route("/students").post(function (request, response) {
  console.log("POST STUDENT:");
  oracledb.getConnection(connectionProperties, function (err, connection) {
    if (err) {
      console.error(err.message);
      response.status(500).send("Error connecting to DB");
      return;
    }

    const student = request.body;
    console.log("student:", student);
    const { firstName, lastName, email, dob } = student;
    // addNewOrUpdateWithPut(student, false, response, connection);

    connection.execute(
      "INSERT INTO STUDENT_2 (ID, DOB, EMAIL, FIRST_NAME, LAST_NAME)" +
        "VALUES(STUDENT_2_SEQ.NEXTVAL, :dob,:email,:firstName,:lastName)",
      [dob, email, firstName, lastName],
      function (err, result) {
        if (err) {
          console.log("body:", student);
          console.error("err:", JSON.stringify(err));
          if (err.errorNum === 1) {
            response.status(409).send({
              message: "The email you have entered is already in use!",
            });
          } else if (err.errorNum === 1400) {
            response.status(400).send({
              message: "Missing field! Please fill all parameters and try again!",
            });
          } else if (err.errorNum === 2290) {
            response.status(400).send({
              message: "Invalid character in the field.",
            });
          } else if(!email.matches(/[\\w.-]{2,}@[\\w.-]{2,}\\.[\\w.-]{2,}/)){
            // response.status(400).send({
            //   message: "Invalid email format. The expected format is <2+chars>@<2+chars>.<2+chars> and only digits, letters, and @.-_ characters are allowed.",
            // });
          } else {
            response.status(500).send("Error saving student to DB");
          }
          doRelease(connection);
          return;
        }
        // response.json(student);
        response.end();
        doRelease(connection);
      }
    );
  });
});

/**
 * PUT /
 * Update a student
 */
router.route("/students/:id").put(function (request, response) {
  console.log("PUT STUDENT:");
  oracledb.getConnection(connectionProperties, function (err, connection) {
    if (err) {
      console.error(err.message);
      response.status(500).send("Error connecting to DB");
      return;
    }

    let body = request.body;
    let id = request.params.id;

    connection.execute(
      "UPDATE STUDENT_2 SET FIRST_NAME=:firstName, LAST_NAME=:lastName, DOB=:dob," +
        " EMAIL=:email WHERE ID=:id",
      [body.firstName, body.lastName, body.dob, body.email, id],
      function (err, result) {
        if (err) {
          console.error(err.message);
          response.status(500).send("Error updating student to DB");
          doRelease(connection);
          return;
        }
        response.end();
        doRelease(connection);
      }
    );
  });
});

/**
 * DELETE /
 * Delete a student
 */
router.route("/students/:id").delete(function (request, response) {
  console.log("DELETE STUDENT ID:" + request.params.id);
  oracledb.getConnection(connectionProperties, function (err, connection) {
    if (err) {
      console.error(err.message);
      response.status(500).send("Error connecting to DB");
      return;
    }

    let id = request.params.id;
    // id === 'deleteAll' ? "!= 1" : "= :id"
    connection.execute(
      "DELETE FROM STUDENT_2 WHERE ID " +
        (id === "deleteAll" ? "!= 1" : "= :id"),
      [id],
      function (err, result) {
        if (err) {
          console.error(err.message);
          response.status(500).send("Error deleting student from DB");
          doRelease(connection);
          return;
        }
        response.end();
        doRelease(connection);
      }
    );
  });
});

/**
 * DELETE ALL /
 * Delete all students
 */
// router.route("/students/deleteAll").delete(function (request, response) {
//   console.log("DELETE ALL STUDENTS:", request.params);
//   oracledb.getConnection(connectionProperties, function (err, connection) {
//     if (err) {
//       console.error(err.message);
//       response.status(500).send("Error connecting to DB");
//       return;
//     }

//     //   let body = request.body;
//     //   let id = request.params.id;
//     connection.execute(
//       "DELETE FROM STUDENT_2 WHERE ID != :id",
//       [id],
//       function (err, result) {
//         if (err) {
//           console.error(err.message);
//           response.status(500).send("Error deleting all students to DB");
//           doRelease(connection);
//           return;
//         }
//         response.end();
//         doRelease(connection);
//       }
//     );
//   });
// });


function checkEmailIsValid(student) {
  const emailPattern = /[\\w.-]{2,}@[\\w.-]{2,}\\.[\\w.-]{2,}/;
  const email = student.email().trim();
  if (!email.matches(/[\\w.-]{2,}@[\\w.-]{2,}\\.[\\w.-]{2,}/)) {
    throw new ResponseStatusException(
      HttpStatus.BAD_REQUEST,
      "Invalid email format. The expected format is <2+chars>@<2+chars>.<2+chars> and only digits, letters, and @.-_ characters are allowed."
    );
  }
}

// function checkDobIsValid(student) {
//   try {
//     const dob = student.dob;
//       if (dob === "") throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Field value cannot be empty.");
//       else if (isDateFuture(dob))
//           throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date. The date of birth cannot be a future date.");
//       else if (isDate100YearsOrPast(dob))
//           throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date. The date of birth cannot be older than 100 years.");
//   } catch (DateTimeParseException e) {
//       e.printStackTrace();
//       throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date format. The expected date format is yyyy-MM-dd.");
//   }
// }

app.use(express.static("static"));
app.use("/", router);
app.listen(PORT);
