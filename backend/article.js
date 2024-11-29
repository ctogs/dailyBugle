const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const mongoURI = "mongodb://host.docker.internal:27017";
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

app.get('/', (req, res) => {
    if (req.session.userInfo) {
        const { userId, role, ip, os } = req.session.userInfo;
        res.send(`User ID: ${userId}, Role: ${role}, IP: ${ip}, OS: ${os}`);
    } else {
        res.status(403).send('You are not logged in.');
    }
});

app.get('/singleStory', async (req, res) => {
  const db = client.db('dailyBugle')
  const articles = db.collection('articles')
  const id = req.query.story
  let article;
  if (!id) article = (await articles.aggregate([{ $sample: { size: 1 } }]).toArray()).at(0)
  else article = await articles.findOne({ "_id": new ObjectId(id) })

  if (!article) res.send("No article found")
  else res.send(article)
})

app.get('/stories', async (req, res) => {
  const db = client.db('dailyBugle');
  const articles = db.collection('articles');
  let filter = {}
  filter._id = { $ne: new ObjectId(req.query.story)}

  try {
    const allArticles = await articles.find(filter).toArray();
    res.send(allArticles);
  } catch (error) {
    console.error("Error retrieving articles:", error);
    res.status(500).send({ error: "An error occurred while retrieving articles" });
  }
});

app.post('/stories', async (req, res) => {
  const db = client.db('dailyBugle');
  const articles = db.collection('articles');

  const { title, teaser, body, categories } = req.body;

  if (!title || !teaser || !body) {
    return res.status(400).send({ error: "Title, teaser, and body are required" });
  }

  const newArticle = {
    title,
    teaser,
    body,
    created: new Date(),
    edited: new Date(),
    categories: categories || [],
    comments: []  // Initialize with an empty comments array
  };

  try {
    const result = await articles.insertOne(newArticle);
    res.status(201).send(result.insertedId); // Send the newly created article
  } catch (error) {
    console.error("Error creating article:", error);
    res.status(500).send({ error: "An error occurred while creating the article" });
  }
});

app.put('/stories/:id', async (req, res) => {
  const db = client.db('dailyBugle');
  const articles = db.collection('articles');
  const { id } = req.params;
  const { title, teaser, body, categories } = req.body;

  if (!title && !teaser && !body && !categories) {
    return res.status(400).send({ error: "At least one field (title, teaser, body, or categories) is required to update" });
  }

  const updateFields = {
    ...(title && { title }),
    ...(teaser && { teaser }),
    ...(body && { body }),
    ...(categories && { categories }),
    edited: new Date() // Update the edited timestamp
  };

  try {
    const result = await articles.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ error: "Article not found" });
    }
    res.send(new ObjectId(id));
  } catch (error) {
    console.error("Error updating article:", error);
    res.status(500).send({ error: "An error occurred while updating the article" });
  }
});

app.post("/stories/:id/comment", async (req, res) => {
  const db = client.db('dailyBugle');
  const articles = db.collection('articles');
  const comments = db.collection('comments');

  const comment = {
    comment: req.body.comment,
    date: new Date(),
    username: req.session.userInfo.username
  };

  try {
    const commentsResult = await comments.insertOne(comment);

    // Update the article to include this comment in the comments array
    await articles.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $push: { comments: { _id: commentsResult.insertedId, username: req.body.username, ...comment } } }
    );

    res.status(201).send({ message: "Comment added successfully" });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).send({ error: "An error occurred while adding the comment" });
  }
});

app.listen(4001, () => console.log('Article service running on port 4001'));
