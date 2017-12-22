const express = require("express");
const app = express();
const path = require("path");
const favicon = require("serve-favicon");
const User = require("./models/User");
const auth = require("./auth");
const expressSession = require("express-session");
const flash = require("express-flash");
var fetch = require("node-fetch");
var index = require("./routes/index");
//var users = require('./routes/users');
const server = require("http").createServer(app);
const io = require("socket.io")(server);
require("dotenv").load();
let userSpeak
app.use(
  "/socket.io",
  express.static(__dirname + "node_modules/socket.io-client/dist/")
);

// Local

app.locals.appName = "Date Planner";

// ----------------------------------------
// Passport
// ----------------------------------------
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
app.use(passport.initialize());
app.use(passport.session());

// ----------------------------------------
// Logging
// ----------------------------------------
const morgan = require("morgan");
const morganToolkit = require("morgan-toolkit")(morgan, {
  req: ["cookies" /*, 'signedCookies' */]
});

app.use(morganToolkit());

// ----------------------------------------
// Template Engine
// ----------------------------------------
const expressHandlebars = require("express-handlebars");
const helpers = require("./helpers");

const hbs = expressHandlebars.create({
  helpers: helpers,
  partialsDir: "views/",
  defaultLayout: "application"
});

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

// ----------------------------------------
// Flash Messages
// ----------------------------------------
const flashMessages = require("express-flash-messages");
app.use(flashMessages());

// ----------------------------------------
// Body Parser
// ----------------------------------------
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ----------------------------------------
// Sessions/Cookies
// ----------------------------------------
const cookieParser = require("cookie-parser");

app.use(cookieParser());

// ----------------------------------------
// Express Session
// ----------------------------------------
app.use(flash());
app.use(
  expressSession({
    secret: process.env.secret || "keyboard cat",
    saveUninitialized: false,
    resave: false
  })
);

// ----------------------------------------
//middleware to connect to MongoDB via mongoose in your `app.js`
// ----------------------------------------
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/chainsaw");
app.use((req, res, next) => {
  if (mongoose.connection.readyState) {
    next();
  } else {
    require("./mongo")().then(() => next());
  }
});

// ----------------------------------------
// Public
// ----------------------------------------
app.use(express.static(`${__dirname}/public`));

// --------------------------------------
//Passport Strategies
//---------------------------------------
//---------------------
//** Strategy
//---------------------
passport.use(
  new LocalStrategy({ usernameField: "email" }, function(
    email,
    password,
    done
  ) {
    User.findOne({ email }, function(err, user) {
      if (err) return done(err);
      if (!user || !user.validPassword(password)) {
        return done(null, false, { message: "Invalid email/password" });
      }
      return done(null, user);
    });
  })
);

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

//---------------------------
//**Facebook Strategy
//---------------------------
passport.use(
  new FacebookStrategy(
    {
      clientID: "153994628557132",
      clientSecret: "ec815c0d8fd0668c51668028fda4a069",
      callbackURL: "http://localhost:3000/auth/facebook/callback",
      profileFields: [
        "id",
        "cover",
        "picture",
        "displayName",
        "email",
        "birthday",
        "friends",
        "first_name",
        "last_name",
        "middle_name",
        "gender",
        "link"
      ]
    },
    function(accessToken, refreshToken, profile, done) {
      const facebookId = profile.id;
      const displayName = profile.displayName;
      const email = profile.emails[0].value;
      const photo = profile.photos[0].value;
      console.log(displayName);
      User.findOne({ facebookId }, function(err, user) {
        if (err) return done(err);

        if (!user) {
          user = new User({
            facebookId,
            displayName,
            email,
            photo
          });
          user.save((err, user) => {
            if (err) return done(err);
            done(null, user);
          });
        } else {
          // Otherwise, return the extant user.
          done(null, user);
        }
      });
    }
  )
);

let places1 = [];
let places2 = [];
// ----------------------------------------
//Routes
// ----------------------------------------

app.get("/", async (req, res) => {
  try {
    console.log(req.session);

    if (req.session.passport && req.session.passport.user) {
      let currentUser = await User.findById(req.session.passport.user);
      console.log("here");
      console.log(currentUser);
      let user = currentUser.displayName;
      let userSpeak = currentUser.displayName
      console.log(userSpeak)
      console.log("!?!")
      let messages = [];

      //rendering user event search values set in post route
      res.render("welcome/index", {
        user: user,
        places1: places1,
        places2: places2
      });
    } else {
      res.redirect("/login");
    }
  } catch (err) {
    console.log(err);
  }
});

io.on("connection", client => {
  console.log(userSpeak);
  console.log("hi!!");

  client.on("chat", data => {
    console.log(data);
    console.log("!!!!!");
    io.emit("new message", data);
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
  })
);

app.post("/register", (req, res, next) => {
  const { email, password } = req.body;
  const user = new User({ email, password, displayName:email });
  console.log(user);
  user.save(err => {
    res.redirect("/login");
  });
});

app.post("/search", async (req, res, next) => {
  const search = req.body.zip;
  console.log(req.body);
  console.log("here--------------");
  const places = req.body.places;
  const event = req.body.events;
  console.log(req.body.events);
  await fetch(
    `https://api.yelp.com/v3/businesses/search?categories=${places}&location=${
      search
    }`,
    {
      method: "GET",
      headers: {
        authorization:
          "Bearer " +
          "mc1UezCpWL1FIHY4kw8OoBKUe4pFHhBFLHc3_HGRFirhKXj6ipE7xb8JM65gwB61qgU5ruL6UwlahnukuS0dcOFPgV-EBzKlRiAKYf7hfKEG8FW9qw7Sy_-tLUQ8WnYx"
      }
    }
  )
    .then(res => res.json())
    .then(resJSON => {
      places1 = resJSON.businesses;
      places1 = places1.slice(0, 10);
    })

    .catch(err => {
      console.log("err", err);
    });

  await fetch(
    `http://api.eventful.com/json/events/search?app_key=F4sk7TsmpZDcgs7z&category=${
      event
    }&location=${search}&date=Today`,
    {
      method: "GET"
    }
  )
    .then(res => res.json())
    .then(resJSON => {
      places2 = resJSON.events.event;
    })

    .catch(err => {
      console.log("err", err);
    });

  res.redirect("back");
});

app.get("/logout", async function(req, res) {
  await req.logout();
  places1 = [];
  places2 = [];
  res.redirect("login");
});

app.get(
  "/auth/facebook",
  passport.authenticate("facebook", {
    authType: "rerequest",
    scope: ["user_friends", "email", "public_profile"]
  })
);

app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", {
    successRedirect: "/",
    failureRedirect: "/login"
  })
);

server.listen(3000);

module.exports = app;
