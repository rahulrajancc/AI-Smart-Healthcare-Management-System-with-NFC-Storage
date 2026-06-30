


const express = require('express')
const cors = require('cors')
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

// database
const mongoose = require('mongoose');

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 2000

// In-memory store. Each item: { id, prompt, createdAt, taken, response, respondedAt }
const prompts = []

function makeId() {
  return Date.now().toString(36) + Math.floor(Math.random() * 10000).toString(36)
}

// basic root endpoint (keep simple)
app.get('/', (req, res) => {
  res.json({ status: 'ok', endpoints: ['/api/prompt', '/api/response/:id'] });
});

// POST a new prompt (from Python)
app.post('/api/prompt', (req, res) => {
  const { prompt } = req.body
  if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'missing prompt string' })
  const id = makeId()
  const entry = { id, prompt, createdAt: Date.now(), taken: false, response: null, respondedAt: null }
  prompts.push(entry)
  console.log('[prompt created]', id, prompt)
  return res.json({ id })
})

// GET the next pending prompt for the MedAi client
// Returns 204 when no pending prompts are available
app.get('/api/prompt', (req, res) => {
  const pending = prompts.find((p) => p.response === null && !p.taken)
  if (!pending) return res.status(204).send()
  // Mark as taken so only one client receives it
  pending.taken = true
  console.log('[prompt delivered]', pending.id)
  return res.json({ id: pending.id, prompt: pending.prompt, createdAt: pending.createdAt })
})

// POST a response for a given prompt id (from MedAi client)
app.post('/api/response', (req, res) => {
  const { id, response } = req.body
  if (!id) return res.status(400).json({ error: 'missing id' })
  const entry = prompts.find((p) => p.id === id)
  if (!entry) return res.status(404).json({ error: 'prompt id not found' })
  entry.response = response
  entry.respondedAt = Date.now()
  console.log('[response saved]', id, response)
  return res.json({ ok: true })
})

// GET response for an id (for Python to poll)
// 204 -> not ready yet, 200 -> { id, response }
app.get('/api/response/:id', (req, res) => {
  const { id } = req.params
  const entry = prompts.find((p) => p.id === id)
  if (!entry) return res.status(404).json({ error: 'prompt id not found' })
  if (entry.response === null) return res.status(204).send()
  return res.json({ id: entry.id, response: entry.response, respondedAt: entry.respondedAt })
})

// Optional: list all stored items (for debugging)
app.get('/api/prompts', (req, res) => res.json(prompts))

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
  console.log('POST /api/prompt  -> { prompt }')
  console.log('GET  /api/prompt  -> next prompt (204 if none)')
  console.log('POST /api/response -> { id, response }')
  console.log('GET  /api/response/:id -> response (204 if pending)')
})





// connect to MongoDB (done early)
mongoose.connect("mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.5.10")
  .then(() => { console.log("Connected to MongoDB") })
  .catch((err) => { console.error("Failed to connect to MongoDB", err); });
const userShcema=new mongoose.Schema({
  name:{
    type:String,
    required:true,
    unique:true
  },
  pass:{
    type:String
  }
});

const loginSh= new mongoose.Schema({
   phone:{
    type:String,
    required:true,
    unique:true
   },
   pass:{
    type:String,
    required:true
   } 
})

// simple doctor schema (for portal login)
const doctorSh = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  pass: { type: String, required: true },
  name: { type: String, default: '' },
});

const userDataSh=new mongoose.Schema({
  name:{
    type:String,
    required:true,
  },
  phone:{
    type:String,
    required:true,
    unique:true,
    sparse:true
  },
  email:{
    type:String,
    required:true,
    unique:true,
    sparse:true
  },
  pass:{
    type:String,
    required:true
  }
});
const userModel = mongoose.model("Login", loginSh);
const doctorModel = mongoose.model("Doctor", doctorSh);
// we will create the Userdata model after adding health fields below

// extend the user data schema with health profile and timeline before compiling model
userDataSh.add({
  bloodType: { type: String, default: '' },
  nfcCardId: { type: String, default: '' },
  lastSync: { type: Date },
  prescriptionCount: { type: Number, default: 0 },
  reportCount: { type: Number, default: 0 },
  checkupCount: { type: Number, default: 0 },
  vaccinesCount: { type: Number, default: 0 },
  // health timeline entries
  healthTimeline: [
    {
      date: String,
      name: String,
      dose: String,
      doctor: String,
    },
  ],
});

// compile health model after schema is complete
const healthModel = mongoose.model('Userdata', userDataSh);

// helper function to ensure a user doc exists
async function ensureUser(phone) {
  let user = await healthModel.findOne({ phone });
  if (!user) {
    user = new healthModel({ phone, name: '', email: '', pass: '' });
    await user.save();
  }
  return user;
}

// get profile
app.get('/api/user/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const user = await healthModel.findOne({ phone });
    if (!user) return res.status(404).json({ error: 'user not found' });
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
});

// list all users (for doctor portal)
app.get('/api/users', async (req, res) => {
  try {
    const users = await healthModel.find({}, 'name phone email');
    return res.json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
});

  // find user by card id
  app.get('/api/user/by-card/:cardId', async (req, res) => {
    try {
      const { cardId } = req.params;
      const user = await healthModel.findOne({ nfcCardId: cardId });
      if (!user) return res.status(404).json({ error: 'user not found' });
      return res.json(user);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'server error' });
    }
  });

  // doctor signup
  app.post('/api/doctor/signup', async (req, res) => {
    const { phone, pass, name } = req.body;
    if (!phone || !pass) return res.status(400).json({ error: 'missing fields' });
    try {
      const existing = await doctorModel.findOne({ phone });
      if (existing) return res.status(409).json({ error: 'already exists' });
      const doc = new doctorModel({ phone, pass, name });
      await doc.save();
      return res.json({ ok: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'server error' });
    }
  });

  // doctor login
  app.post('/api/doctor/login', async (req, res) => {
    const { phone, pass } = req.body;
    if (!phone || !pass) return res.status(400).json({ error: 'missing fields' });
    try {
      const doc = await doctorModel.findOne({ phone, pass });
      if (!doc) return res.status(401).json({ error: 'invalid credentials' });
      // return basic info
      return res.json({ ok: true, name: doc.name, phone: doc.phone });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'server error' });
    }
  });

// update profile (partial)
app.post('/api/user/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const updates = req.body;
    const user = await ensureUser(phone);
    Object.assign(user, updates);
    // convenience: get timeline directly from card id (avoids extra lookup)
    app.get('/api/user/by-card/:cardId/timeline', async (req, res) => {
      const u = await healthModel.findOne({ nfcCardId: req.params.cardId });
      if (!u) return res.status(404).send('not found');
      res.send(u.healthTimeline || []);
    });

    // allow posting a timeline entry using card id
    app.post('/api/user/by-card/:cardId/timeline', async (req, res) => {
      try {
        const { cardId } = req.params;
        const entry = req.body; // expects { date, name, dose, doctor }
        if (!entry || !entry.date || !entry.name) return res.status(400).json({ error: 'invalid entry' });
        const u = await healthModel.findOne({ nfcCardId: cardId });
        if (!u) return res.status(404).json({ error: 'user not found' });
        u.healthTimeline = u.healthTimeline || [];
        u.healthTimeline.push(entry);
        await u.save();
        return res.json({ ok: true, entry });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'server error' });
      }
    });
    await user.save();
    return res.json({ ok: true, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
});

// add timeline entry
app.post('/api/user/:phone/timeline', async (req, res) => {
  try {
    const { phone } = req.params;
    const entry = req.body; // expects { date, name, dose, doctor }
    if (!entry || !entry.date || !entry.name) {
      return res.status(400).json({ error: 'invalid entry' });
    }
    const user = await ensureUser(phone);
    user.healthTimeline = user.healthTimeline || [];
    user.healthTimeline.push(entry);
    await user.save();
    return res.json({ ok: true, entry });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
});

// increment a numeric counter (prescriptionCount, reportCount, etc.)
app.post('/api/user/:phone/count', async (req, res) => {
  try {
    const { phone } = req.params;
    const { field, amount = 1 } = req.body;
    const allowed = ['prescriptionCount', 'reportCount', 'checkupCount', 'vaccinesCount'];
    if (!allowed.includes(field)) return res.status(400).json({ error: 'invalid field' });
    const user = await ensureUser(phone);
    user[field] = (user[field] || 0) + amount;
    await user.save();
    return res.json({ ok: true, [field]: user[field] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
});

// get timeline
app.get('/api/user/:phone/timeline', async (req, res) => {
  try {
    const { phone } = req.params;
    const user = await healthModel.findOne({ phone });
    if (!user) return res.status(404).json({ error: 'user not found' });
    return res.json(user.healthTimeline || []);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
});

app.post("/signin",(req, res) => {
  
  const { name,phone,email, pass } = req.body;
  console.log(name, phone,email, pass);
  const user = new userModel({ phone, pass });
  const data = new healthModel({ name, phone,email, pass });
  const r= data.save();
  const result = user.save();
  res.send(result);
  console.log(r);
});


app.post("/login", async (req, res) => {
  // const userModel = mongoose.model("login", loginSh);
  const { phone, pass } = req.body;
  console.log(phone, pass);
  const foundUser = await userModel.findOne({ phone, pass });
  if (foundUser) {
    res.send({ status: "success", message: "Login successful" });
  } else {
    res.send({ status: "failed", message: "Invalid credentials" });
  }
});

// Endpoint to assign NFC card to patient
app.post('/api/user/:phone/assign-nfc', async (req, res) => {
  try {
    const { phone } = req.params;
    const { nfcCardId } = req.body;
    if (!nfcCardId) return res.status(400).json({ error: 'missing nfcCardId' });
    
    const user = await ensureUser(phone);
    user.nfcCardId = nfcCardId;
    await user.save();
    
    // Trigger write to Arduino: write the NFC card ID
    await writeToArduino(nfcCardId);
    
    return res.json({ ok: true, nfcCardId: user.nfcCardId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
});

// Endpoint to add prescription with NFC ID
app.post('/api/user/by-card/:cardId/prescription', async (req, res) => {
  try {
    const { cardId } = req.params;
    const entry = req.body; // expects { date, name, dose, doctor }
    if (!entry || !entry.date || !entry.name) return res.status(400).json({ error: 'invalid entry' });
    
    const user = await healthModel.findOne({ nfcCardId: cardId });
    if (!user) return res.status(404).json({ error: 'user not found' });
    
    user.healthTimeline = user.healthTimeline || [];
    user.healthTimeline.push(entry);
    user.prescriptionCount = (user.prescriptionCount || 0) + 1;
    
    await user.save();
    return res.json({ ok: true, entry, prescriptionCount: user.prescriptionCount });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
});

  const port = new SerialPort({
    path: "/dev/ttyACM0",   // change if needed
    baudRate: 9600,
  });
  // port.on('open', () => console.log('serial port opened'));
  port.on('open', () => {
  console.log('serial port opened');
  
  // wait for Arduino reset
  setTimeout(() => {
    console.log("Arduino ready for commands");
  }, 2000);
});
  port.on('error', (err) => console.error('serial port error', err));
  // also log raw buffer events in case the parser never emits (no newline)
  port.on('data', (buf) => {
    console.log('RAW FROM ARDUINO (buffer):', buf);
  });
  
  const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));
  
  // we log all incoming data for debugging; individual promises register their own listeners
 parser.on("data", data => {

  const clean = data.trim();

  if (!clean) return; // ignore empty

  if (clean === "READY") {
    console.log("Arduino READY");
    return;
  }

  console.log("FROM ARDUINO:", clean);
});
  
  // Helper function to read NFC card (scan)
  function scanNFC() {
    // use a one‑time listener instead of a shared `pendingResolve` variable
    return new Promise((resolve, reject) => {
      let timeout;
      const onData = (data) => {
        cleanup();
        resolve(data.trim());
      };
      const cleanup = () => {
        parser.off('data', onData);
        clearTimeout(timeout);
      };

      // install listener first so we don't miss immediate responses
      parser.on('data', onData);
      console.log('[arduino] write scan command');
      if (!port.isOpen) {
        console.warn('scanNFC called but serial port is not open');
      }
      port.write("1\n", (err) => {
        if (err) console.error('write error on scan', err);
        port.drain(() => {});
      }); // 1 = scan mode
      timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Scan timeout'));
      }, 5000);
    });
  }
  
  // Helper function to write to NFC card
  // Helper function to write to NFC card
function writeToArduino(data) {
  return new Promise((resolve, reject) => {
    let timeout;

   const onData = (resp) => {

  const msg = resp.trim();

  if (msg === "WRITE_OK") {
    cleanup();
    resolve(msg);
  }

  if (msg === "WRITE_FAIL") {
    cleanup();
    reject(new Error("Write failed"));
  }

};

    const cleanup = () => {
      parser.off("data", onData);
      clearTimeout(timeout);
    };

    parser.on("data", onData);

    if (!port.isOpen) {
      return reject(new Error("Serial port not open"));
    }

    console.log("Writing to Arduino:", data);

    port.write(`0|${data}\n`, (err) => {
      console.log('Write callback', { err });
      if (err) {
        cleanup();
        return reject(err);
      }
      port.drain(() => {});
    });

    // timeout = setTimeout(() => {
    //   cleanup();
    //   reject(new Error("Write timeout"));
    // }, 15000);

  });
}
  
  // ---------- SCAN NFC ----------
  app.get("/scan", async (req, res) => {
    try {
      const rfidData = await scanNFC();
      res.json({ ok: true, rfid: rfidData });
    } catch (err) {
      console.error('Scan error:', err);
      res.status(500).json({ error: 'Scan failed', details: err.message });
    }
  });
  
  // ---------- WRITE TO NFC ----------
  app.post("/write", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: 'missing text' });
      
      const status = await writeToArduino(text);
      res.json({ ok: true, status: status });
    } catch (err) {
      console.error('Write error:', err);
      res.status(500).json({ error: 'Write failed', details: err.message });
    }
  });

  // Make helper functions globally available
  global.scanNFC = scanNFC;
  global.writeToArduino = writeToArduino;