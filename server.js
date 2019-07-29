var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();
var scrapeUrl = "https://www.allkpop.com/"
// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
// mongoose.connect("mongodb://localhost/unit18Populater", { useNewUrlParser: true });

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);

// Routes
app.get("/", function (req, res) {
    axios.get(scrapeUrl).then(function (response) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(response.data);

        var data = {}
        data.articles = []
        // Now, we grab every h2 within an article tag, and do the following:
        $("article .width95").each(function (i, element) {
            //onsole.log($(".title",element).children("a").text());

            // Save an empty result object
            var result = {};

            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(".title", element)
                .children("a")
                .text()
            result.link = scrapeUrl + $(".title", element)
                .children("a")
                .attr("href")
            result.summary = $(".title", element)
                .children("p")
                .text();

            result.summary = JSON.stringify(result.summary)
            data.articles.push(result)
        });

        res.render("article", data);

    });
})
// A GET route for scraping the echoJS website
app.get("/scrape", function (req, res) {
    // First, we grab the body of the html with axios
    axios.get(scrapeUrl).then(function (response) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(response.data);
        //console.log($);

        // Now, we grab every h2 within an article tag, and do the following:
        $("article .width95").each(function (i, element) {
            // console.log($(".title",element).children("a").text());

            // Save an empty result object
            var result = {};

            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(".title", element)
                .children("a")
                .text()
            result.link = scrapeUrl + $(".title", element)
                .children("a")
                .attr("href")
            result.summary = $(".title", element)
                .children("p")
                .text();

            // // Create a new Article using the `result` object built from scraping
            // db.Article.create(result)
            //     .then(function (dbArticle) {
            //         // View the added result in the console
            //     })
            //     .catch(function (err) {
            //         // If an error occurred, log it
            //         console.log(err);
            //     });
        });

        // Send a message to the client
        res.send("Scrape Complete");
    });
});

app.post("/articles", function (req, res) {
    db.Article.create(req.body)
        .then(function (dbArticle) {
            // View the added result in the console
            console.log(dbArticle)
            res.json({ "Result": "Success" })
        })
        .catch(function (err) {
            // If an error occurred, log it
            if (err.code === 11000) {

                res.json({ "Result": "Duplicate" })
            }
            else {
                res.json({ "Result": "Failed" })

            }
        });
});
// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
    // Grab every document in the Articles collection
    db.Article.find({})
        .then(function (dbArticle) {
            // If we were able to successfully find Articles, send them back to the client
            //res.json(dbArticle);
            var data = {}
            data.articles = dbArticle
            console.log(dbArticle)
            res.render("saved", data);

        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.findOne({ _id: req.params.id })
        // ..and populate all of the notes associated with it
        .populate("note")
        .exec(function(err, doc){
            console.log(doc)
            res.json(note);

        })
        .then(function (dbArticle) {
            //console.log(dbArticle)


            // If we were able to successfully find an Article with the given id, send it back to the client
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

app.get("/note/:id", function (req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Note.findOne({ _id: req.params.id })
        .then(function (note) {
            res.json(note);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

app.delete("/note/:id", function (req, res) {
    db.Note.remove({ _id: req.params.id })
        .then(function () {
            res.render("saved")
        })
})

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
        .then(function (dbNote) {
            console.log(dbNote)
            // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
        })
        .then(function (dbArticle) {
            // If we were able to successfully update an Article, send it back to the client
            res.render("saved");
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

app.get("/clearDb", function (req, res) {
    db.Article.remove({})
        .then(function () {
            res.render("article")
        })
})

app.delete("/article/:id", function (req, res) {
    db.Article.remove({ _id: req.params.id })
        .then(function () {
            res.render("saved")
        })
})


// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});
