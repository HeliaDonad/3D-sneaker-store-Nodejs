const express = require('express');
const router = express.Router();
const { Configuration, OpenAIApi } = require('openai');

// Configure OpenAI with the API key from the environment variables
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

/**
 * POST /api/v1/openai/generate-image
 * Route to generate an image based on a given prompt
 */
router.post('/generate-image', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        // Call OpenAI's image generation API
        const response = await openai.createImage({
            prompt: prompt,
            n: 1,
            size: "1024x1024",
        });

        const image = response.data.data[0].url; // Extract the image URL
        res.status(200).json({ image });
    } catch (error) {
        console.error('Error generating image:', error.message);

        // Return error details to help debug
        res.status(500).json({
            error: 'Failed to generate image',
            details: error.response ? error.response.data : error.message,
        });
    }
});

module.exports = router;
