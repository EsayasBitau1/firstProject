const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile')
const User = require('../../models/User')
const { check, validationResult } = require('express-validator');



router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']
        );
        if (!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user' })
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/',
    [
        auth,
        [
            check('status', 'status is required')
                .not()
                .isEmpty(),
            check('skills', 'skill is required')
                .not()
                .isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }
        const {
            company,
            website,
            location,
            status,
            skills,
            bio,
            githubusername,
            twitter,
            youtube,
            facebook,
            instagram,
            linkedin
        } = req.body;

        const profileFileds = {};
        profileFileds.user = req.body.id;
        if (company) profileFileds.company = company;
        if (website) profileFileds.website = website;
        if (location) profileFileds.location = location;
        if (status) profileFileds.status = status;
        if (bio) profileFileds.bio = bio;
        if (githubusername) profileFileds.githubusername = githubusername;
        if (skills) {
            profileFileds.skills = skills.split(',').map(skill => skill.trim())
        }
        profileFileds.social = {};
        if (twitter) profileFileds.social.twitter = twitter
        if (facebook) profileFileds.social.facebook = facebook
        if (instagram) profileFileds.social.instagram = instagram
        if (linkedin) profileFileds.social.linkedin = linkedin
        if (youtube) profileFileds.social.youtube = youtube

        try {
            let profile = await Profile.findOne({ user: req.user.id });

            if (profile) {
                //update Profile
                profile = await Profile.findByIdAndUpdate(
                    { user: req.user.id },
                    { $set: profileFileds },
                    { new: true }
                );
                return res.json(profile);
            }

            //create Profile
            profile = new Profile(profileFileds);

            await profile.save();
            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error')
        }
    }
);
module.exports = router; 