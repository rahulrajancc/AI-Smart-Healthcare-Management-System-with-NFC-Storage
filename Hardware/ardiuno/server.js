const express = require("express");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

const app = express();
app.use(express.json());

const port = new SerialPort({
  path: "/dev/ttyACM0",   // change if needed
  baudRate: 9600,
});

const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

let pendingResolve = null;

// persistent listener
parser.on("data", data => {
  console.log("FROM ARDUINO:", data);

  if (pendingResolve) {
    pendingResolve(data);
    pendingResolve = null;
  }
});

// ---------- READ ----------
app.get("/scan", (req, res) => {
  port.write("1\n");

  new Promise(resolve => pendingResolve = resolve)
    .then(data => res.send({ rfid: data }));
});

// ---------- WRITE ----------
app.post("/write", (req, res) => {
  const { text } = req.body;

  port.write(`0|${text}\n`);

  new Promise(resolve => pendingResolve = resolve)
    .then(data => res.send({ status: data }));
});

app.listen(3000, () => console.log("Server running"));