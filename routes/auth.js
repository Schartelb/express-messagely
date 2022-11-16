const express = require("express");
const router = new express.Router();
const jwt = require("jsonwebtoken");

const { SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");
const User = require("../models/user");

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post("/login", async function (req, res, next) {
    try {
        const { username, password } = req.body
        if (await User.authenticate(username, password)) {
            const token = jwt.sign({username}, SECRET_KEY)
            User.updateLoginTimestamp(username)
            console.log({token})
            return res.json({token})
        } else {
            return res.status(400).json({ msg: "Incorrect Username/Password" })
        }
    } catch (err) {
        return next(err)
    }
})



/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post("/register", async function (req, res, next) {
    try {
        const { username, password, first_name, last_name, phone } = req.body;
        // console.log(username, password, first_name, last_name, phone)
        const newUser = await User.register({username, password, first_name, last_name, phone})
        await User.updateLoginTimestamp(username)
        const token = jwt.sign({username}, SECRET_KEY)
        return res.json({token})
    } catch (err) {
        return next(err);
    }
});

module.exports = router