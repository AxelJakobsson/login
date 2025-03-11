import "dotenv/config";
import express from "express";
import nunjucks from "nunjucks";
import morgan from "morgan";
import bcrypt from "bcrypt";
import pool from "./db.js"
import session from "express-session";

const app = express();
const port = 3000;

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

app.get("/login", (req, res) => {
  res.render("login.njk",
    { title: "Login" }
  )
});

app.post("/login", async (req, res) => {
  const { name, password } = req.body;
  const [rows] = await pool.promise().query("SELECT * FROM User WHERE name = ?", [name]);

  if (rows.length === 0){
    return res.send("User not found")
  }
  console.log("User: ", name, "Password ", password);

  res.send(`Hello ${name}, you tried to log in!`);
});



let myPlainTextPassword = "mittlösenord"
bcrypt.hash(myPlainTextPassword, 10, function(err, hash) {
  console.log(hash)
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});