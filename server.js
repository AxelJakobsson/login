import "dotenv/config";
import express from "express";
import nunjucks from "nunjucks";
import morgan from "morgan";
import bcrypt, { hash } from "bcrypt";
import pool from "./db.js"
import session from "express-session";

const app = express();
const port = 3000;
const saltRounds = 10

nunjucks.configure("views", {
  autoescape: true,
  express: app,
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(morgan("dev"));

app.use(session({
  secret: "keyboard cat",
  resave: false,
  saveUninitialized: true,
  cookie: { sameSite: true }
}));


app.get("/", (req, res) => {
  if (req.session.views) {
    req.session.views++
  } else {
    req.session.views = 1
  }
  res.render("index.njk",
    { title: "Test", message: "Funkar?", views: req.session.views }
  )
});

app.get("/login", async (req, res) => {

  const myPlaintextPassword = "test123"
  const name = "testUser"


  bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
    // Store hash in your password DB.
    pool.promise().query(`INSERT INTO User (name, hashed) VALUES (?, ?)`, [name, hash])

    res.render("login.njk",
      { title: "Login", message: hash }
  )
});
});

app.post("/login", async (req, res) => {
  const {name, password } = req.body
  
  const [users] = await pool.promise().query(`SELECT * FROM User WHERE name = ?`, [name])
  if (users.length === 0){  
    return res.status(400).send("Invalid user")
  }
  const hashedPassword = users[0].hashed;

  bcrypt.compare(password, hashedPassword, function(err, result) {
    if (err){
      console.log("failed to compare")  
    }
    if (result) {
      console.log("Worked")
      req.session.loggedIn = true
      res.redirect("/hemligsida")
    }
    else {
      res.sendStatus(401)
    }
  })


})

app.get("/createAccount", (req, res) => {
  res.render("createAccount.njk", 
    { title: "Create account" }
  )
})

app.post("/createAccount", async (req, res) => {
  const {name, password } = req.body;

  bcrypt.hash(password, saltRounds, function(err, hash) {
    // Store hash in your password DB.
    pool.promise().query("INSERT INTO User (name, hashed) VALUES (?, ?)", [name, hash])
  });
  res.redirect("/")
});

app.get("/hemligsida", (req, res) => {
  if (req.session.loggedIn == true) {
    console.log(req.session.loggedIn + "worked")
    res.render("index.njk", { title: "Hemlig sida" })
  } else {
    console.log(req.session.loggedIn + "failed")
    res.status(401).send("Unauthorizedd")
  }
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});