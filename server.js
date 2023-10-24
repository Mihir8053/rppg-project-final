const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const app = express();
const port = 5000; // Replace with your desired port

// Enable file uploads with express-fileupload
app.use(fileUpload());

// Enable JSON parsing for incoming requests
app.use(express.json());
app.use(cors());

// Define a route to handle video uploads and send random data to the frontend
app.post('/upload-video', (req, res) => {
    if (!req.files || !req.files.video) {
        return res.status(400).json({ error: 'No video file uploaded.' });
    }

    // Generate random heart rate (between 60 and 100) and RPPG signals (an array of random values)
    const heartRate = Math.floor(Math.random() * (100 - 60 + 1) + 60);
    const rppgSignals = Array.from({ length: 100 }, () => Math.random() * 10);

    const videoFile = req.files.video; // The uploaded video file
    // You can access its properties like videoFile.name, videoFile.data, etc.
    console.log('Heart Rate:', heartRate);
    console.log('RPPG Signals:', rppgSignals);

    // Perform your processing on the video and data here
    // For example, you can save the video to disk, process it, or perform any other desired actions.

    // Send heart rate and RPPG signals as part of the response to the client
    res.json({
        message: 'Video uploaded and processed successfully',
        heartRate,
        rppgSignals,
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
