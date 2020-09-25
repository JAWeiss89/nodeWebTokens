const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const User = require("../models/user")
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");


/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post("/login", async (req, res, next) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
          throw new ExpressError("Username and password required", 400);
        }
        const authenticated = await User.authenticate;
        if (authenticated) {
            await User.updateLoginTimestamp(username);
            const token = jwt.sign({ username }, SECRET_KEY)
            return res.json({ message : "Logged in!", token})
        }

    } catch(e) {
        next(e);
    }
})



/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post("/register", async (req, res, next) => {
    try {
        const { username, password, first_name, last_name, phone } = req.body;
        const registeredUser = await User.register(username, password, first_name, last_name, phone);

        const token = jwt.sign({username: registeredUser.username}, SECRET_KEY)
        return res.json({ message : "User Registered!", token })

    } catch(e) {
        next(e);
    }
})



module.exports = router;

