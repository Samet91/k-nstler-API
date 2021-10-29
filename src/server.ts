import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
//import cookieParser from 'cookie-parser';
import { connectDatabase, getArtistsCollection } from './utils/database';

if (!process.env.MONGODB_URI) {
  throw new Error('No MONGODB_URI provided');
}

const app = express();
const port = 3000;

app.use((request, _response, next) => {
  console.log('Request received', request.url);
  next();
});

//Middleware for parsing application/json
app.use(express.json());
//Middleware for parsing cookies
//app.use(cookieParser());

// app.post('/api/artists', async (request, response) => {
//   const artists = request.body;
//   await getArtistsCollection().insertMany(artists);
//   response.send('upload successful');
// });

// add one artist
app.post('/api/artists', async (request, response) => {
  const newArtist = request.body;
  const artistsCollection = getArtistsCollection();
  const existingArtistName = await artistsCollection.findOne({
    name: newArtist.name,
  });

  if (!existingArtistName) {
    const insertedObject = await artistsCollection.insertOne(newArtist);
    response
      .status(200)
      .send(`${newArtist.name} with Id: ${insertedObject.insertedId} added.`);
  } else {
    response.status(409).send('Artist already exists.');
  }
});
// delete one artist
app.delete('/api/artists/:name', async (request, response) => {
  const urlName = request.params.name;
  const existingArtist = await getArtistsCollection().findOne({
    name: urlName,
  });
  if (existingArtist) {
    getArtistsCollection().deleteOne({ name: urlName });
    response.send(`${urlName} deleted`);
  } else {
    response.status(404).send('artist not found');
  }
});

//delete all artist
app.delete('/api/artists', async (request, response) => {
  const artists = request.params;
  const numberOfArtists = await getArtistsCollection().countDocuments();
  if (numberOfArtists) {
    getArtistsCollection().deleteMany(artists);
    response.send('deleted all Artists');
  } else {
    response.status(404).send('no Artists found');
  }
});

// find one artist
app.get('/api/artists/:name', async (request, response) => {
  const artistName = request.params.name;
  const existingArtist = await getArtistsCollection().findOne({
    name: artistName,
  });
  if (existingArtist) {
    response.status(200).send(existingArtist);
  } else {
    response.status(404).send("sorry can't find this artist.");
  }
});

app.patch('/api/artists/:name', async (request, response) => {
  const artistsCollection = getArtistsCollection();
  const newField = request.body;
  const artist = request.params.name;

  const updated = await artistsCollection.updateOne(
    { name: artist },
    { $set: newField }
  );
  if (updated.matchedCount === 0) {
    response.status(404).send('Artist not found');
    return;
  }
  response.send('Updated artist.');
});

// find all artists
app.get('/api/artists', async (_request, response) => {
  const userDoc = await getArtistsCollection().find().toArray();
  response.send(userDoc);
});

app.get('/', (_req, res) => {
  res.send('Hello World!');
});

connectDatabase(process.env.MONGODB_URI).then(() =>
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  })
);
