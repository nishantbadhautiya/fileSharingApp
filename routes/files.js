const express = require('express');
const router = express.Router();
const multer = require('multer')
const path = require('path');
const File = require('../models/file');
const { v4: uuidv4 } = require('uuid');


let storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'uploads/')
    },
    filename: (req, file, callback) => {
        const uniqueName = `${Date.now()}-${(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        callback(null, uniqueName);
    }
})
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1000000 * 100
    }
}).single('myfile');


router.post('/', (req, res) => {
    // store file
    upload(req, res, async (err) => {
        //validate request
        if (!req.file) {
            return res.json({ error: "please select minimum one file" });
        }
        if (err) {
            return res.status(500).send({ error: err.message });
        }
        console.log(req.file);
        //store given information into mongodb database
        const file = new File({
            filename: req.file.filename,
            uuid: uuidv4(),
            path: req.file.path,
            size: req.file.size
        })
        const response = await file.save();
        //response --> Download Link
        return res.json({ file: `${process.env.APP_BASE_URL}/files/${response.uuid}` })
    })
})

router.post('/send', async (req, res) => {
    // console.log(req.body);
    const { uuid, emailto, emailfrom } = req.body;
    // validate request
    if (!uuid || !emailto || !emailfrom) {
        return res.status(422).send({ error: "All fields are required" });
    }
    // Get data from database
    const file = await File.findOne({ uuid: uuid });
    // if (file.sender) {
    //     return res.status(201).send({ error: "Email already send " });
    // }
    file.sender = emailfrom;
    file.receiver = emailto;
    const response = await file.save();
    // Send email
    const sendMail = require('../services/emailService');
    sendMail({
        from: emailfrom,
        to: emailto,
        subject: "Inshare file sharing",
        text: `${emailfrom} shared a file with you`,
        html: require('../services/emailTemplate')({
            emailFrom: emailfrom,
            downloadLink: `${process.env.APP_BASE_URL}/files/download/${file.uuid}`,
            size: parseInt(file.size / 1024) + 'KB',
            expires: '24 Hours'
        })
    })
    return res.send({success: true});
})


module.exports = router;