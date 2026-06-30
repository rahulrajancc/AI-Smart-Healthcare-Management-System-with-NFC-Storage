

const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 2000

// In-memory store. Each item: { id, prompt, createdAt, taken, response, respondedAt }
const prompts = []

function makeId() {
  return Date.now().toString(36) + Math.floor(Math.random() * 10000).toString(36)
}

app.get('/', async (req, res) =>{ 
      const userModel= mongoose.model("users",userShcema);
    const user=new userModel({name:"John",age:30});
const result= await user.save();
// console.log(result);
    const foundUser = await userModel.find({});
    res.send(foundUser);
  
  res.json({ status: 'ok', endpoints: ['/api/prompt', '/api/response/:id'] })

})

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





//  this is the database

const mongoose=require("mongoose");
 mongoose.connect("mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.5.10")
.then((re) => {console.log("Connected to MongoDB")})
.catch((err) => {
  console.error("Failed to connect to MongoDB", err);
});
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
 const dataModel= mongoose.model("Userdata",userDataSh);

app.post("/signin",(req, res) => {
  
  const { name,phone,email, pass } = req.body;
  console.log(name, phone,email, pass);
  const user = new userModel({ phone, pass });
  const data = new dataModel({ name, phone,email, pass });
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
  }});