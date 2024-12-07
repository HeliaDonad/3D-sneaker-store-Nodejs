const express = require('express');
const { Configuration, OpenAIApi } = require('openai');
const router = express.Router();

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY, // Zorg ervoor dat deze sleutel correct is ingesteld in je .env
    organization: "org-5dxXojyYeoGSGwGySX18dOMj", // Optioneel: organisatie-ID
});
const openai = new OpenAIApi(configuration);

// POST endpoint voor het genereren van een schoenafbeelding
router.post('/generate-image', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        const response = await openai.createImage({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
        });

        const imageUrl = response.data.data[0].url;
        res.json({ imageUrl });
    } catch (error) {
        console.error("Error generating image:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Failed to generate image" });
    }
});

module.exports = router;
