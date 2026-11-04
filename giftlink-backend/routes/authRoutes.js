// Step 1 - Task 2: Import necessary packages

const express = require('express');
const app = express();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const connectToDatabase = require('../models/db');
const router = express.Router();
const dotenv = require('dotenv');
const pino = require('pino'); // Import Pino logger

//Step 1 - Task 3: Create a Pino logger instance
const logger = pino(); 
dotenv.config();

//Step 1 - Task 4: Create JWT secret
const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res) => {
    try {
        // Task 1: Connect to `giftsdb` in MongoDB through `connectToDatabase` in `db.js`
		const db = await connectToDatabase();

        // Task 2: Access MongoDB collection
		const collection = db.collection("users");

		//Task 3: Check for existing email
		const existingEmail = await collection.findOne({
            email: req.body.email
        });

        if (existingEmail) {
            return res.status(400).json({
                error: "Email already exists"
            });
        }

		const salt = await bcryptjs.genSalt(10);
        const hash = await bcryptjs.hash(req.body.password, salt);
		const email = req.body.email;

		const newUser = await collection.insertOne({
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: hash,
            createdAt: new Date(),
        });
        
		const payload = {
            user: {
                id: newUser.insertedId.toString(),
            },
        };

        const authtoken = jwt.sign(payload, JWT_SECRET, {
            expiresIn: '1h'
        });
        logger.info('User registered successfully');
        res.json({authtoken,email});
    } catch (e) {
        logger.error(e);
        return res.status(500).send('Internal server error');
    }

    
});

router.post('/login', async (req, res) => {
    try {

        // Task 1: Connect to giftsdb
        const db = await connectToDatabase();

        // Task 2: Access users collection
        const collection = db.collection("users");

        // Task 3: Check for user credentials
        const theUser = await collection.findOne({
            email: req.body.email
        });

        // Task 7: User not found
        if (!theUser) {
            logger.error('User not found');
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Task 4: Verify password
        const result = await bcryptjs.compare(
            req.body.password,
            theUser.password
        );

        if (!result) {
            logger.error('Passwords do not match');
            return res.status(404).json({
                error: 'Wrong password'
            });
        }

        // Task 5: Fetch details
        const userName = theUser.firstName;
        const userEmail = theUser.email;

        // Task 6: Create JWT
        const payload = {
            user: {
                id: theUser._id.toString()
            }
        };

        const authtoken = jwt.sign(
            payload,
            JWT_SECRET,
            {
                expiresIn: '1h'
            }
        );

        logger.info(`User ${userEmail} logged in successfully`);

        res.json({
            authtoken,
            userName,
            userEmail
        });

    } catch (e) {
        logger.error(e);
        return res.status(500).send('Internal server error');
    }
});


module.exports = router;
