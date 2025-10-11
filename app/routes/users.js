const router = require("express").Router();

router.get("/", (req, res) => {
    res.send("user route /user")
})

module.exports = router;
