import express from "express"
import expressListEndpoints from "express-list-endpoints"
import cors from "cors"
import mongoose from "mongoose"
import netflixData from "./data/netflix-titles.json"
import dotenv from "dotenv"

dotenv.config()

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/project-mongo"
mongoose
  .connect(mongoUrl)
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("Error connecting to MongoDB:", error))

mongoose.Promise = Promise

// Set Schema
const { Schema } = mongoose

const netflixSchema = new Schema({
  show_id: Number,
  title: String,
  director: String,
  cast: String,
  country: String,
  date_added: Date,
  release_year: Number,
  rating: String,
  duration: String,
  listed_in: String,
  description: String,
  type: String,
})

const NetflixModel = mongoose.model("Netflix", netflixSchema)

// Set Seed
if (process.env.RESET_DATABASE) {
  const seedDatabase = async () => {
    await NetflixModel.deleteMany()
    netflixData.forEach((netflix) => {
      new NetflixModel(netflix).save()
    })
  }
  seedDatabase()
}

const port = process.env.PORT || 8080
const app = express()

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
  const endpoints = expressListEndpoints(app)
  res.json(endpoints)
})

// Endpoint to return all movies
app.get("/movies", async (req, res) => {
  try {
    const movies = await NetflixModel.find({ type: "Movie" })
    res.json(movies)
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" })
  }
})

// Endpoint to return data by country
app.get("/country", async (req, res) => {
  try {
    const mediaByCountry = await NetflixModel.aggregate([
      { $group: { _id: "$country", media: { $push: "$$ROOT" } } },
    ])
    const formattedData = mediaByCountry.reduce((acc, curr) => {
      acc[curr._id] = curr.media
      return acc
    }, {})
    res.json(formattedData)
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" })
  }
})

// Endpoint to return movie by ID
app.get("/movies/:id", async (req, res) => {
  const { id } = req.params
  try {
    const movie = await NetflixModel.findOne({
      show_id: Number(id),
      type: "Movie",
    })
    if (movie) {
      res.json(movie)
    } else {
      res.status(404).json({ message: "Movie not found" })
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" })
  }
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
