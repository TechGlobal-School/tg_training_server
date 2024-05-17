// Editor related routes

import express from "express";
const router = express.Router();
import axios from "axios";

const proxy = "https://cors-anywhere.herokuapp.com/";

// Ulan secrets - move to .env
const BASE_API = "https://api.jdoodle.com/v1";
const JDOODLE_CLIENT_ID = "6cf1cc311c4a4296817ed28fc580bd";
const JDOODLE_CLIENT_SECRET =
  "d31f6e797483d0ef758436f94e06d2c81bffde29aeff90edeb34bc78b694894d";

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
      versionIndex: "0",
      // token: token,
      clientId: JDOODLE_CLIENT_ID,
      clientSecret: JDOODLE_CLIENT_SECRET,
    };

    const options = {
      method: "POST",
      url: `${proxy + BASE_API}/execute`,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      data: execution_data,
    };

    const response = await axios.request(options);
    // console.log("response", response);
    return response.data;
  } catch (error) {
    console.error("error", error);
    return error;
  }
};

router.get("/", (req, res) => {
  res.send("<h1>Editor API</h1>");
});

router.post("/", async (req, res) => {
  try {
    const { script, language } = req.body;
    const submissionResult = await submitCode(script, language);
    if (!submissionResult) throw new Error("Error submitting code");

    // SUCCESS
    return res.status(200).json({
      status: "SUCCESS",
      data: submissionResult,
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send(err.message);
  }
});

export default router;
