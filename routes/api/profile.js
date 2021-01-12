const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile')
const User = require('../../models/User')
const { check, validationResult } = require('express-validator');
const request = require('request');
const config = require('config');



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
        profileFileds.user = req.user.id;
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
                profile = await Profile.findOneAndUpdate(
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

router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avater']);
        res.json(profiles);
    } catch (err) {
        console.error(err.massage);
        res.status(500).send('Server Erorr');
    }
});

router.delete('/', auth, async (req, res) => {
    try {
        await Profile.findOneAndRemove({ user: req.user.id });
        await User.findOneAndRemove({ _id: req.user.id });
        res.json({ msg: 'User was deleted' });
    } catch (err) {
        console.error(err.massage);
        res.status(500).send('Server Erorr');
    }
});


// @route    PUT api/profile/experience
// @desc     Add profile experience
// @access   Private
router.put(
    '/experience',
    auth,
    check('title', 'Title is required').notEmpty(),
    check('company', 'Company is required').notEmpty(),
    check('from', 'From date is required and needs to be from the past')
        .notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        } = req.body;

        const newExp = {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id });
            console.log(newExp)

            profile.experience.unshift(newExp);
            console.log(newExp)
            await profile.save();

            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id })

        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex, 1);

        await profile.save()

        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


router.put(
    '/education',
    auth,
    check('school', 'School is required').notEmpty(),
    check('degree', 'Degree is required').notEmpty(),
    check('fieldofstudy', 'Field Of Study is required').notEmpty(),
    check('from', 'From date is required and needs to be from the past').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        } = req.body;

        const newEduc = {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id });

            profile.education.unshift(newEduc);

            await profile.save();

            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);
router.delete('/education/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id })

        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.exp_id);

        profile.education.splice(removeIndex, 1);

        await profile.save()

        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/github/:username', (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/
            repos?per_page=5&sort=created:asc&client_id=
            ${config.get('githubClientId')}&client_secret=
            ${config.get('githubSecret')}`,
            method: 'GET',
            headers: { 'user-agent': 'node.js' }
        };

        request(options, (error, response, body) => {
            if (error) console.error(error);

            if (response.statusCode !== 200) {
                return res.status(404).json({ msg: 'no github profile found' });
            }
            res.json(JSON.parse(body));
        });

    } catch (err) {
        console.error(err.massage);
        res.status(500).send('Server Error')
    }
});


module.exports = router; 