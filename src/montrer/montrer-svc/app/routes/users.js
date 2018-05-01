var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', (req, res, next) => {
  res.send({"name":"someuser", "password":"somepassword"});
});

module.exports = router;
