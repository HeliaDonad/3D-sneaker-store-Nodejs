const express = require('express');
const { Configuration, OpenAIApi } = require('openai');
const router = express.Router();

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY, // Zorg ervoor dat deze in je .env-bestand staat
});
const openai = new OpenAIApi(configuration);

router.post('/generate-image', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Geen prompt meegegeven.' });
        }

        const response = await openai.createImage({
            prompt,
            n: 1,
            size: '1024x1024',
            response_format: 'b64_json',
        });

        const image = response.data.data[0].b64_json;
        res.json({ image });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Fout bij het genereren van de afbeelding.' });
    }
});

module.exports = router;