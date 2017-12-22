var express = require('express');
var router = express.Router();

/* GET home page. */

router.get("/", async (req, res) => {
  try {
    console.log(req.session);
    if (req.session.passport && req.session.passport.user) {
      let currentUser = await User.findById(req.session.passport.user);
      console.log("here")
      console.log(currentUser.displayName)
      let user = currentUser.displayName
   
      console.log(places2)
      //rendering user event search values set in post route
      res.render("welcome/index", {
        user: user, places1: places1, places2: places2
      });
    } else {
      res.redirect("/login");
    }
  } catch (err) {
    console.log(err);
  }
});




module.exports = router;
