const http = require('http');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const useragent = require('useragent');
const { MongoClient } = require('mongodb');
const MongoStore = require('connect-mongo');

const app = express();
const mongoURI = "mongodb://host.docker.internal:27017";
const client = new MongoClient(mongoURI);

const port = 4000;

app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    secret: 'secretKey',
    saveUninitialized: true,
    resave: false,
    store: MongoStore.create({ mongoUrl: mongoURI, dbName: 'dailyBugleSessions' }),
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 1 day expiration
    }
  })
);

client.connect().then(() => console.log('Connected to MongoDB'));

app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const db = client.db('dailyBugle');
  const users = db.collection('users');
  const agent = useragent.parse(req.headers['user-agent']);

  const existingUser = await users.findOne({ username });
  if (existingUser) {
    return res.status(400).send('User already exists');
  }

  // Insert user with a role of 'reader'
  const newUser = await users.insertOne({ username, password, role: 'reader' });

  // Store user session data, including role, OS, and browser information
  req.session.userInfo = {
    userId: newUser.insertedId,
    username,
    role: 'reader',
    ip: req.ip,
    os: agent.os.toString(),
    browser: agent.toAgent()
  };

  // Set a cookie with the role for client access if needed
  res.cookie('user_role', 'reader', { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });
  res.send({role: 'reader'});
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const db = client.db('dailyBugle');
  const users = db.collection('users');
  const agent = useragent.parse(req.headers['user-agent']);

  const user = await users.findOne({ username, password });
  if (!user) {
    return res.status(401).send('Invalid credentials');
  }

  // Store user session data, including the existing role
  req.session.userInfo = {
    userId: user._id,
    username,
    role: user.role, // This should be 'reader' after signup
    ip: req.ip,
    os: agent.os.toString(),
    browser: agent.toAgent()
  };

  // Set a cookie with the role for client access if needed
  res.cookie('user_role', user.role, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });
  res.send({role: user.role});
});

app.get('/userInfo', (req, res) => {
  if (req.session.userInfo) {
      res.json(req.session.userInfo);
  } else {
      res.status(403).json({ error: "User not logged in" });
  }
});

app.post("/logout", (req, res) => {
  if (req.session) {
      req.session.destroy((err) => {
          if (err) {
              console.error("Error destroying session:", err);
              res.status(500).send({ error: "Failed to log out" });
          } else {
              res.clearCookie("connect.sid"); // Clear the session cookie
              res.status(200).send({ message: "Logged out successfully" });
          }
      });
  } else {
      res.status(200).send({ message: "No active session to log out" });
  }
});



app.listen(port, () => console.log(`Listening on port: ${port}`));
