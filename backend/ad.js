const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const useragent = require('useragent');
const MongoStore = require('connect-mongo');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const mongoURI = "mongodb://localhost:27017";
const client = new MongoClient(mongoURI);

app.use(cookieParser());
app.use(express.json())

app.use(
  session({
    secret: 'secretKey',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: mongoURI, dbName: 'dailyBugleSessions' }),
    cookie: { httpOnly: true },
  })
);

app.post('/event', async (req, res) => {
  const db = client.db('dailyBugle');
  const events = db.collection('adEvents');

  try {
      const userInfo = req.session?.userInfo || { userId: 'anonymous' }; // Handle anonymous users
      const userAgent = useragent.parse(req.headers['user-agent']);
      
      const event = {
          userId: userInfo.userId,
          userIp: req.ip,
          browser: userAgent.toAgent(),
          os: userAgent.os.toString(),
          articleId: req.body.articleId,
          eventType: req.body.eventType,
          created: new Date()
      };

      await events.insertOne(event);
      res.status(201).send({ message: "Ad event recorded successfully" });
  } catch (error) {
      console.error("Error recording ad event:", error);
      res.status(500).send({ error: "Failed to record ad event" });
  }
});

app.listen(4002, () => console.log('Article service running on port 4002'));