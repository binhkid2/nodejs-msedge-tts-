import { MsEdgeTTS } from "msedge-tts";
import express from "express";
import bodyParser from "body-parser";
import "dotenv/config";
import fs from "fs";
import cors from "cors";
const tts = new MsEdgeTTS();
const app = express();
import { v4 as uuid } from "uuid";
// Middleware to parse JSON request bodies
app.use(bodyParser.json());
// Middleware to validate Bearer token
const authenticateBearerToken = (req, res, next) => {
  const bearerHeader = req.headers["authorization"];

  if (typeof bearerHeader !== "undefined") {
    const bearerToken = bearerHeader.split(" ")[1];
    // Replace 'YOUR_SECRET_TOKEN' with your actual secret token
    if (bearerToken === "binh-dep-trai") {
      next();
    } else {
      res.status(403).json({ error: "Invalid token" });
    }
  } else {
    res.status(401).json({ error: "Token is missing" });
  }
};

/*

const whitelist = ["http://localhost:8080","http://localhost:5173","squid-app-r3ird.ondigitalocean.app","https://theheai.com"]
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error("Not allowed by CORS"))
    }
  },
  credentials: true,
}
app.use(cors(corsOptions))
*/
//ALLOW ALL
const corsOptions = {
  origin: "*", // Allow all origins (not recommended for production without proper security measures)
  credentials: true,
};
app.use(cors(corsOptions));
app.post("/api/tts", authenticateBearerToken, async (req, res) => {
  const text = req.body.text;
  const voiceId = req.body.voice_id;
  // Using ISO string as file name
  const fileName = uuid();
  try {
    await tts.setMetadata(
      voiceId,
      MsEdgeTTS.OUTPUT_FORMATS.WEBM_24KHZ_16BIT_MONO_OPUS
    );

    const filePath = await tts.toFile(`./rac/${fileName}.webm`, text);
    // Read the WebM file using fs.readFile

    fs.readFile(`./rac/${fileName}.webm`, (err, data) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error reading the file");
      }
      // Here, 'data' contains the binary content of the WebM file
      // You can convert it to base64
      const base64Data = Buffer.from(data).toString("base64");
      // You can also do additional processing or conversion of the audio here if needed
      // Send the base64 data as a response
      res.send({ base64Data: base64Data });
      // Delete the file after sending it
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        } else {
          console.log("File deleted successfully");
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message }); // Sending specific error message
  }
});

const port = parseInt(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
