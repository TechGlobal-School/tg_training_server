// Editor related routes

import express from "express";
const router = express.Router();
import axios from "axios";

// const proxy = "https://cors-anywhere.herokuapp.com/";

// Token not used yet, directly submitting code
const getToken = async () => {
  const options = {
    method: "POST",
    url: `${BASE_API}/auth-token`,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    data: {
      clientId: JDOODLE_CLIENT_ID,
      clientSecret: JDOODLE_CLIENT_SECRET,
    },
  };

  const response = await axios.request(options);
  return response.data;
};

const submitCode = async (userCode, lanugage) => {
  try {
    const execution_data = {
      script: userCode,
      language: lanugage,
      versionIndex: "2",
      // token: token,
      clientId:
        process.env.JDOODLE_CLIENT_ID || "6cf1cc311c4a4296817ed28fc580bd",
      clientSecret:
        process.env.JDOODLE_CLIENT_SECRET ||
        "d31f6e797483d0ef758436f94e06d2c81bffde29aeff90edeb34bc78b694894d",
    };

    const options = {
      method: "POST",
      url: "https://api.jdoodle.com/v1/execute",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      data: execution_data,
    };

    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error("error", error);
    return error;
  }
};

const runCodeWithGlot = async (code) => {
  const payload = {
    files: [{ name: "main.js", content: code }],
  };

  try {
    const response = await axios.post(
      "https://glot.io/api/run/javascript/latest",
      payload,
      {
        headers: {
          Authorization: "97f39cf3-b8c3-431f-90d9-f137b53052dc",
        },
      }
    );
    return response.data;
  } catch (error) {
    // return { error: error.message };
    return error;
  }
};

router.get("/", (req, res) => {
  res.send("<h1>Editor API => Check /editor</h1>");
});

router.post("/", async (req, res) => {
  try {
    const { script, language } = req.body;
    console.log("test script ---", script);
    // const submissionResult = await submitCode(script, language);
    const submissionResult = await runCodeWithGlot(script);
    if (!submissionResult) throw new Error("Error submitting code");

    console.log("test result ---", submissionResult);
    // SUCCESS
    return res.status(200).json({
      status: "SUCCESS",
      data: submissionResult,
    });
  } catch (err) {
    console.error("Error happened while calling jdoodle", err.message);
    return res.status(500).send(err.message);
  }
});

export default router;
