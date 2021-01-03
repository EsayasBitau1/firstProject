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
        res.json(profile);
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
   }
    catch (err) {
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
    check('from', 'From date is required and needs to be from the past').notEmpty(),
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

            profile.experience.unshift(req.body);

            await profile.save();

            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route    DELETE api/profile/experience/:exp_id
// @desc     Delete experience from profile
// @access   Private

router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const foundProfile = await Profile.findOne({ user: req.user.id });

        foundProfile.experience = foundProfile.experience.filter(
            (exp) => exp._id.toString() !== req.params.exp_id
        );

        await foundProfile.save();
        return res.status(200).json(foundProfile);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router; 