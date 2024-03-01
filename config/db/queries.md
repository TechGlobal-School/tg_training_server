# Not finished. Just the documentation

# Queries

## Students

Queries for students routes

### Get students

- Current

```sql
SELECT * FROM STUDENT
```

- New

```sql
SELECT STUDENT.*, INSTRUCTORS.FULLNAME AS INST_NAME
FROM STUDENT
JOIN INSTRUCTORS
ON STUDENT.INSTRUCTOR_ID = INSTRUCTORS.ID
```

### Get student using id

```sql
SELECT * FROM STUDENT WHERE ID = :id
```

### Post student

```sql
INSERT INTO STUDENT (ID, DOB, EMAIL, FIRST_NAME, LAST_NAME) VALUES(STUDENT_SEQ.NEXTVAL, TO_DATE(:dob,'YYYY-MM-DD'),:email,:firstName,:lastName)

```

### Update student using id

```sql
UPDATE STUDENT SET FIRST_NAME=:firstName, LAST_NAME=:lastName, DOB=TO_DATE(:dob,'YYYY-MM-DD'), EMAIL=:email WHERE ID=:id
```

### Delete student using id

```sql
DELETE FROM STUDENT WHERE ID=:id
```

### Delete all students

```sql
-- except first 2 students
DELETE from STUDENT where ID > 2
```

## Instructors

Queries for instructors routes

### Get instructors

```sql
SELECT * FROM INSTRUCTORS
```

### Get instructor using id

```sql
SELECT * FROM INSTRUCTORS WHERE ID=:id
```
