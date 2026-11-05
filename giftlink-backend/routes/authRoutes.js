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
    console.log('LOGIN ROUTE HIT');
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


router.put(
    '/update',
    [
        body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
        body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
        body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ],
    async (req, res) => {

        // Task 2: Validate the input
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            logger.error('Validation errors in update request', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        try {

            // Task 3: Check if email exists in headers
            const email = req.headers.email;

            if (!email) {
                logger.error('Email not found in the request headers');
                return res.status(400).json({
                    error: 'Email not found in the request headers'
                });
            }

            // Task 4: Connect to MongoDB
            const db = await connectToDatabase();
            const collection = db.collection('users');

            // Task 5: Find user credentials
            const existingUser = await collection.findOne({ email });

            if (!existingUser) {
                logger.error('User not found');
                return res.status(404).json({
                    error: 'User not found'
                });
            }

            // Update fields only if provided
            if (req.body.firstName) {
                existingUser.firstName = req.body.firstName;
            }

            if (req.body.lastName) {
                existingUser.lastName = req.body.lastName;
            }

            if (req.body.password) {
                const salt = await bcryptjs.genSalt(10);
                existingUser.password = await bcryptjs.hash(
                    req.body.password,
                    salt
                );
            }

            existingUser.updatedAt = new Date();

            // Task 6: Update user credentials
            const updateResult = await collection.findOneAndUpdate(
                { email },
                { $set: existingUser },
                { returnDocument: 'after' }
            );

            const updatedUser = updateResult.value || updateResult;

            // Task 7: Create JWT authentication
            const payload = {
                user: {
                    id: updatedUser._id.toString(),
                },
            };

            const authtoken = jwt.sign(payload, JWT_SECRET);

            logger.info(`User ${email} updated successfully`);

            res.json({ authtoken });

        } catch (e) {
            logger.error(e);
            return res.status(500).send('Internal server error');
        }
    }
);


module.exports = router;
