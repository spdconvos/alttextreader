/** @format */

const express = require("express");
const Twitter = require("twitter-lite");
const fs = require("fs");
const jsonParser = require("body-parser").json();
const fetch = require("node-fetch");
const type = require("file-type").fromBuffer;

if (!fs.existsSync(__dirname + "/error_logs")) {
    fs.mkdirSync(__dirname + "/error_logs");
}

const app = express();
app.use(express.static("public"));

const user = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
});

var client;
if (process.env.TWITTER_BEARER_TOKEN == "") {
    user.getBearerToken()
        .then(response => {
            console.log({ response });
            client = new Twitter({
                bearer_token: response.access_token,
            });
        })
        .catch(e => {
            console.error(e.errors);
            process.exit(1);
        });
} else {
    client = new Twitter({
        bearer_token: process.env.TWITTER_BEARER_TOKEN,
    });
}

app.get("/", (req, resp) => {
    resp.sendFile(__dirname + "/views/index.html");
});

app.get("/results", (req, resp) => {
    console.dir(req);
    resp.sendFile(__dirname + "/views/index.html");
});

app.get("/alttext", async (req, resp) => {
    let json = { images: [] };
    let id = req.query.link.match(/(?<=status\/)\d+/);
    if (id == null) {
        id = req.query.link.match(/\d+/);
    }
    if (id == null) {
        console.log(req.query.link, typeof req.query.link);
        json.errors = ["No ID found"];
        resp.json(json);
        return;
    }

    client
        .get(`statuses/show`, {
            id: id[0],
            include_ext_alt_text: true,
            trim_user: true,
            include_entities: true,
            tweet_mode: "extended",
        })
        .then(async tweet => {
            console.log(`Getting tweet with id: ${id[0]}`);
            if (tweet.extended_entities.hasOwnProperty("media")) {
                for (let i = 0; i < tweet.extended_entities.media.length; i++) {
                    if (tweet.extended_entities.media[i].type != "photo") {
                        continue;
                    }

                    let obj = {};

                    let img = await fetch(
                        tweet.extended_entities.media[i].media_url_https
                    )
                        .then(imgResponse => {
                            return imgResponse.arrayBuffer();
                        })
                        .then(async arrayBuffer => {
                            let buffer = Buffer.from(arrayBuffer);
                            let mime = (await type(buffer)).mime;
                            let data = buffer.toString("base64");
                            obj.src = `data:${mime};base64,${data}`;
                        })
                        .catch(err => {
                            console.error(
                                `Error making URI, defaulting to twitter: ${{
                                    err,
                                }}`
                            );
                            obj.uri =
                                tweet.extended_entities.media[
                                    i
                                ].media_url_https;
                        });
                    obj.text = tweet.extended_entities.media[i].ext_alt_text;

                    json.images.push(obj);
                }
            } else {
                if (json.errors === undefined)
                    json.errors = ["No media in tweet"];
                else json.errors.push("No media in tweet");
            }

            resp.json(json);
        })
        .catch(err => {
            console.error(`Error getting tweet:`);
            console.dir(err);
        });
});

app.post("/error", jsonParser, async (req, resp) => {
    let time = new Date();
    let str = JSON.stringify(
        {
            time: time.toLocaleString,
            "user agent": req.headers["user-agent"],
            error: req.body,
        },
        null,
        4
    );
    let file = `${__dirname}/error_logs/error_${time
        .toISOString()
        .replace(/[:\-\.]/g, "_")}.json`;

    fs.writeFile(file, str, err => {
        if (err) console.error(err);
    });
});

const listener = app.listen(process.env.PORT, () => {
    console.log(
        `Started up on port: ${listener.address().address}:${
            listener.address().port
        }`
    );
});
