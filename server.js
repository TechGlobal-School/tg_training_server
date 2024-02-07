import express from "express";
import "dotenv/config";
import studentsRouter from "./routes/students/index.js";

// App init
const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(function (request, response, next) {
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
app.use(express.static("public"));
app.use("/students", studentsRouter);

const PORT = process.env.PORT || 8089;
app.listen(PORT, () => `Server listening on port ${PORT}`);

// MOVE BELOW ROUTES LOGIC ?

/**
 * GET /
 * Returns a list of students
 */
// router.route("/students/").get(function (request, response) {
//   console.log("GET STUDENTS");
//   oracledb.getConnection(connectionProperties, function (err, connection) {
//     if (err) {
//       console.error(err.message);
//       response.status(500).send("Error connecting to DB");
//       return;
//     }
//     console.log("After connection");
//     connection.execute(
//       "SELECT * FROM student_2",
//       {},
//       { outFormat: oracledb.OBJECT },
//       function (err, result) {
//         if (err) {
//           console.error(err.message);
//           response.status(500).send("Error getting data from DB");
//           doRelease(connection);
//           return;
//         }
//         console.log("RESULTSET:" + JSON.stringify(result));
//         let students = [];
//         result.rows.forEach(function (element) {
//           const dob = element.DOB;
//           students.push({
//             id: element.ID,
//             dob: `${dob.getFullYear()} - ${
//               dob.getMonth() + 1
//             } - ${dob.getDate()}`,
//             email: element.EMAIL,
//             firstName: element.FIRST_NAME,
//             lastName: element.LAST_NAME,
//           });
//         }, this);
//         response.json(students);
//         doRelease(connection);
//       }
//     );
//   });
// });

// /**
//  * GET /searchType/searchValue
//  * Returns a list of students that match the criteria
//  */
// router
//   .route("/students/:searchType/:searchValue")
//   .get(function (request, response) {
//     console.log("GET STUDENTS BY CRITERIA");
//     oracledb.getConnection(connectionProperties, function (err, connection) {
//       if (err) {
//         console.error(err.message);
//         response.status(500).send("Error connecting to DB");
//         return;
//       }
//       console.log("After connection");
//       let searchType = request.params.searchType;
//       let searchValue = request.params.searchValue;

//       connection.execute(
//         "SELECT * FROM student WHERE " + searchType + " = :searchValue",
//         [searchValue],
//         { outFormat: oracledb.OBJECT },
//         function (err, result) {
//           if (err) {
//             console.error(err.message);
//             response.status(500).send("Error getting data from DB");
//             doRelease(connection);
//             return;
//           }
//           console.log("RESULTSET:" + JSON.stringify(result));
//           let students = [];
//           result.rows.forEach(function (element) {
//             students.push({
//               id: element.ID,
//               firstName: element.FIRST_NAME,
//               lastName: element.LA_STNAME,
//               email: element.EMAIL,
//               dob: element.DOB,
//             });
//           }, this);
//           response.json(students);
//           doRelease(connection);
//         }
//       );
//     });
//   });

// /**
//  * POST /
//  * Saves a new student
//  */
// router.route("/students").post(function (request, response) {
//   console.log("POST STUDENT:");
//   oracledb.getConnection(connectionProperties, function (err, connection) {
//     if (err) {
//       console.error(err.message);
//       response.status(500).send("Error connecting to DB");
//       return;
//     }

//     const student = request.body;
//     const { firstName, lastName, email, dob } = student;

//     connection.execute(
//       "INSERT INTO STUDENT_2 (ID, DOB, EMAIL, FIRST_NAME, LAST_NAME)" +
//         "VALUES(STUDENT_2_SEQ.NEXTVAL, TO_DATE(:dob,'YYYY-MM-DD'),:email,:firstName,:lastName)",
//       [dob, email, firstName, lastName],
//       function (err, result) {
//         if (err) {
//           console.error("err:", err);
//           studentCheck(email, err, response, true);
//           doRelease(connection);
//           return;
//         } else {
//           connection.execute(
//             "SELECT ID FROM STUDENT_2 WHERE EMAIL=:email",
//             [email],
//             function (err, result) {
//               if (err) {
//                 console.error(err.message);
//                 response.status(500).send("Error updating student to DB");
//                 doRelease(connection);
//                 return;
//               } else {
//                 student.id = result.rows[0][0];
//                 response.json(student);
//                 response.end();
//                 doRelease(connection);
//                 return;
//               }
//             }
//           );
//         }
//       }
//     );
//   });
// });

// /**
//  * PUT /
//  * Update a student
//  */
// router.route("/students/:id").put(function (request, response) {
//   console.log("PUT STUDENT:");
//   oracledb.getConnection(connectionProperties, function (err, connection) {
//     if (err) {
//       console.error(err.message);
//       response.status(500).send("Error connecting to DB");
//       return;
//     }

//     let body = request.body;
//     let id = request.params.id;

//     connection.execute(
//       "UPDATE STUDENT_2 SET FIRST_NAME=:firstName, LAST_NAME=:lastName, DOB=TO_DATE(:dob,'YYYY-MM-DD')," +
//         " EMAIL=:email WHERE ID=:id",
//       [body.firstName, body.lastName, body.dob, body.email, id],
//       function (err, result) {
//         if (err) {
//           console.error(err.message);
//           studentCheck(body.email, err, response);
//           doRelease(connection);
//           return;
//         }
//         response.end();
//         doRelease(connection);
//       }
//     );
//   });
// });

// /**
//  * DELETE /
//  * Delete a student
//  */
// router.route("/students/:id").delete(function (request, response) {
//   console.log("DELETE STUDENT ID:" + request.params.id);
//   oracledb.getConnection(connectionProperties, function (err, connection) {
//     if (err) {
//       console.error(err.message);
//       response.status(500).send("Error connecting to DB");
//       return;
//     }

//     let id = request.params.id;
//     const deleteQuery =
//       "DELETE FROM STUDENT_2 WHERE ID " +
//       (id == "deleteAll" ? "> 2" : `= ${id}`);
//     connection.execute(deleteQuery, {}, function (err, result) {
//       if (result) {
//         if (result.rowsAffected === 0) {
//           response.status(500).send({
//             message:
//               "There is no student to delete. Tech Global and John Doe are permanent.",
//           });
//         }
//       }
//       if (err) {
//         if (err.errorNum === 20003) {
//           response.status(403).send({
//             message: `You're not authorized to delete ${
//               id == 1 ? "Tech Global!" : "John Doe!"
//             }`,
//           });
//         } else {
//           response.status(500).send("Error deleting student from DB");
//         }
//         doRelease(connection);
//         return;
//       }
//       response.end();
//       doRelease(connection);
//     });
//   });
// });

// function studentCheck(email, err, response, isAddNew = false) {
//   if (err.errorNum === 1) {
//     response.status(409).send({
//       message: "The email you have entered is already in use!",
//     });
//   } else if (err.errorNum === 1400 && isAddNew) {
//     response.status(400).send({
//       message:
//         "Missing field! Please fill all parameters and try again!",
//     });
//   } else if (err.errorNum === 2290) {
//     response.status(400).send({
//       message: !email.match(/[a-z0-9\-]+@[a-z]+\.[a-z]{2,3}/)
//         ? "Invalid email format. The expected format is <1+chars>@<1+chars>.<2+chars> and only digits, letters, and @.-_ characters are allowed."
//         : "Invalid character in the field.",
//     });
//   } else if (err.errorNum === 20001) {
//     response.status(400).send({
//       message:
//         "Invalid date. The date of birth cannot be a future date.",
//     });
//   } else if (err.errorNum === 20002) {
//     response.status(400).send({
//       message: "Invalid date. The age limit is 100.",
//     });
//   } else if (
//     err.errorNum === 1847 ||
//     err.errorNum === 1861 ||
//     err.errorNum === 1843
//   ) {
//     response.status(400).send({
//       message:
//         "Invalid date format. The expected date format is yyyy-MM-dd.",
//     });
//   } else {
//     response.status(500).send(`Error ${isAddNew ? "saving" : "updating"} student to DB`);
//   }
// }

// app.use(express.static("static"));
// app.use("/", router);
// app.listen(PORT);
