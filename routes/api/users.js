const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');

const User = require('../../models/User')

router.post('/', [
    check('name', 'name is required')
        .not()
        .isEmpty(),
    check('email', 'must include a valid mail')
        .isEmail(),
    check('password', 'please enter a password more then 6 characters')
        .isLength({ min: 6 })
],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }
        const { name, email, password } = req.body;
        try {
            let user = await User.findOne({ email });

            if (user) {
                res.status(400).json({ errors: [{ msg: 'User alrady exists' }] })
            }

            const avatar = gravatar.url(email, {
                s: '200',
                r: 'pg',
                d: 'mm'
            });

            user = new User({
                name,
                email,
                avatar,
                password
            });

            const salt = await bcrypt.genSalt(10);

            user.password = await bcrypt.hash(password, salt);

            await user.save()

            // return jsonwebtoken 
            res.send('User route')

        } catch (err) {
            console.error(err.message)
            res.status(500).send('server error')
        }

    });
module.exports = router;