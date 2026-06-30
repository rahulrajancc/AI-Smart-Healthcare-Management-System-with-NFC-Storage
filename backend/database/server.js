const express = require('express');
const cors= require('cors');
const app = express();
const port = 3000;
app.use(cors({
    origin:['http://127.0.0.1:5500/','http://127.0.0.1:5500','http://localhost:3000/']
}));
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

const PaitentSchema = new mongoose.Schema({
name:{
  type:String,
  required:true
},
age:{
  type:Number,
  required:true
},
disease:{
  type:String,
  // required:true   
  },
bloodGroup:{
  type:String
},
address:{
  type:String,
  unique:true
},
Postice:{
  type:String
}


});
app.use(express.json());


app.get('/', async(req, res) => {
    const userModel= mongoose.model("users",userShcema);
    const user=new userModel({name:"John",age:30});
const result= await user.save();
// console.log(result);
    const foundUser = await userModel.find({});
    res.send(foundUser);

});
app.post("/signin?", async (req, res) => {
  const userModel = mongoose.model("Login", loginSh);
 const dataModel= mongoose.model("Userdata",userDataSh);
  const { name,phone,email, pass } = req.body;
  console.log(name, phone,email, pass);
  const user = new userModel({ phone, pass });
  const data = new dataModel({ name, phone,email, pass });
  const r= data.save();
  const result = await user.save();
  res.send(result);
  console.log(r);
});


app.post("/login", async (req, res) => {
  const userModel = mongoose.model("login", loginSh);
  const { phone, pass } = req.body;
  console.log(phone, pass);
  const foundUser = await userModel.findOne({ phone, pass });
  if (foundUser) {
    res.send({ status: "success", message: "Login successful" });
  } else {
    res.send({ status: "failed", message: "Invalid credentials" });
  }});
// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});