const express = require('express');
const authenticate = require('../middleware/auth');

const router = express.Router();

// Search for geographical locations
router.get('/autocomplete', authenticate, async (req, res) => {
    try {
        const query = String(req.query.q || '').trim();

        const type = req.query.type === 'country'
            ? 'country'
            : 'city';

        if (query.length < 2) {
            return res.json([]);
        }

        if (query.length > 100) {
            return res.status(400).json({
                message: 'Search query is too long.'
            });
        }

        const apiKey = process.env.GEOAPIFY_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                message: 'Location service is not configured.'
            });
        }

        const params = new URLSearchParams({
            text: query,
            type,
            format: 'json',
            lang: 'en',
            limit: '6',
            apiKey
        });

        const response = await fetch(
            `https://api.geoapify.com/v1/geocode/autocomplete?${params}`,
            {
                signal: AbortSignal.timeout(8000)
            }
        );

        if (!response.ok) {
            return res.status(502).json({
                message: 'Location search is temporarily unavailable.'
            });
        }

        const data = await response.json();

        const locations = (data.results || [])
            .filter(place => place.place_id)
            .map(place => {
                const name =
                    place.city ||
                    place.name ||
                    place.country;

                const label = [
                    name,
                    type === 'city' ? place.state : null,
                    place.country
                ]
                    .filter(Boolean)
                    .filter((value, index, array) =>
                        array.indexOf(value) === index
                    )
                    .join(', ');

                return {
                    placeId: place.place_id,
                    name,
                    label,
                    city: place.city || '',
                    state: place.state || '',
                    country: place.country || '',
                    countryCode: place.country_code || '',
                    latitude: place.lat,
                    longitude: place.lon,
                    type
                };
            });

        const uniqueLocations = [
            ...new Map(
                locations.map(place => [
                    place.placeId,
                    place
                ])
            ).values()
        ];

        res.json(uniqueLocations);

    } catch (error) {
        console.error(
            'Location autocomplete failed:',
            error.name
        );

        res.status(502).json({
            message: 'Unable to search locations.'
        });
    }
});

module.exports = router;