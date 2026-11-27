const WEIGHTS = {
    destinations: 0.40,
    interests: 0.35,
    travelStyle: 0.20,
    location: 0.05,
};

// Normalize text
function normalizeText(value) {
    return typeof value === 'string'
        ? value.toLowerCase().trim().replace(/\s+/g, ' ')
        : '';
}

// Normalize lists and remove duplicates
function normalizeList(value) {
    const items = Array.isArray(value)
        ? value
        : typeof value === 'string'
            ? value.split(',')
            : [];

    return [...new Set(
        items.map(normalizeText).filter(Boolean)
    )];
}

// Find exact shared items
function getSharedItems(list1, list2) {
    const first = normalizeList(list1);
    const second = new Set(normalizeList(list2));

    return first.filter(item => second.has(item));
}

// Cosine similarity for interests
function calculateCosineSimilarity(list1, list2) {
    const first = normalizeList(list1);
    const second = normalizeList(list2);

    if (!first.length || !second.length) {
        return 0;
    }

    const shared = getSharedItems(first, second);

    return shared.length /
        Math.sqrt(first.length * second.length);
}

// Compare travel styles
function calculateTravelStyleSimilarity(style1, style2) {
    const first = normalizeText(style1);
    const second = normalizeText(style2);

    if (!first || !second) return 0;

    if (first === second) return 1;

    const flexibleStyles = ['flexible', 'both'];

    if (
        flexibleStyles.includes(first) ||
        flexibleStyles.includes(second)
    ) {
        return 0.75;
    }

    return 0;
}

// Validate geographical coordinates
function hasValidCoordinates(place) {
    return Boolean(
        place &&
        Number.isFinite(place.latitude) &&
        Number.isFinite(place.longitude) &&
        place.latitude >= -90 &&
        place.latitude <= 90 &&
        place.longitude >= -180 &&
        place.longitude <= 180
    );
}

// Calculate distance between two geographical points
// using the Haversine formula
function calculateDistanceKm(first, second) {
    if (
        !hasValidCoordinates(first) ||
        !hasValidCoordinates(second)
    ) {
        return null;
    }

    const earthRadius = 6371;

    const toRadians = degrees =>
        degrees * Math.PI / 180;

    const latitudeDifference = toRadians(
        second.latitude - first.latitude
    );

    const longitudeDifference = toRadians(
        second.longitude - first.longitude
    );

    const latitude1 = toRadians(first.latitude);
    const latitude2 = toRadians(second.latitude);

    const a =
        Math.sin(latitudeDifference / 2) ** 2 +
        Math.cos(latitude1) *
        Math.cos(latitude2) *
        Math.sin(longitudeDifference / 2) ** 2;

    const safeA = Math.min(1, Math.max(0, a));

    const c = 2 * Math.atan2(
        Math.sqrt(safeA),
        Math.sqrt(1 - safeA)
    );

    return earthRadius * c;
}

// Compare home locations
function calculateLocationSimilarity(profile1, profile2) {
    const first = profile1.locationDetails;
    const second = profile2.locationDetails;

    const firstLabel = normalizeText(profile1.location);
    const secondLabel = normalizeText(profile2.location);

    const samePlaceId = Boolean(
        first?.placeId &&
        second?.placeId &&
        first.placeId === second.placeId
    );

    const distance = calculateDistanceKm(first, second);

    // Exact geographical match
    if (samePlaceId) {
        return {
            score: 1,
            distanceKm: distance
        };
    }

    // Backward compatibility with older profiles
    if (
        (!first?.placeId || !second?.placeId) &&
        firstLabel &&
        firstLabel === secondLabel
    ) {
        return {
            score: 1,
            distanceKm: distance
        };
    }

    if (distance === null) {
        return {
            score: 0,
            distanceKm: null
        };
    }

    let score = 0;

    if (distance <= 50) {
        score = 0.80;
    } else if (distance <= 100) {
        score = 0.60;
    } else if (distance <= 250) {
        score = 0.30;
    }

    return {
        score,
        distanceKm: Math.round(distance)
    };
}

// Combine structured and legacy destinations
function getDestinations(profile) {
    const labels = normalizeList(
        profile.preferredDestinations
    );

    const details = Array.isArray(
        profile.destinationDetails
    )
        ? profile.destinationDetails
        : [];

    const destinations = [];
    const seenIds = new Set();

    for (const label of labels) {
        const place = details.find(
            item =>
                normalizeText(item?.label) === label
        );

        if (place?.placeId) {
            if (seenIds.has(place.placeId)) {
                continue;
            }

            seenIds.add(place.placeId);
        }

        destinations.push({
            ...place,
            label
        });
    }

    return destinations;
}

// Compare two individual destinations
function compareDestinations(first, second) {
    const firstLabel = normalizeText(first.label);
    const secondLabel = normalizeText(second.label);

    // Exact geographical ID match
    if (
        first.placeId &&
        second.placeId &&
        first.placeId === second.placeId
    ) {
        return 1;
    }

    // Exact text match for older profiles
    if (
        (!first.placeId || !second.placeId) &&
        firstLabel &&
        firstLabel === secondLabel
    ) {
        return 1;
    }

    const firstCountry = normalizeText(
        first.countryCode
    );

    const secondCountry = normalizeText(
        second.countryCode
    );

    if (
        !firstCountry ||
        !secondCountry ||
        firstCountry !== secondCountry
    ) {
        return 0;
    }

    // Same country
    if (
        first.type === 'country' &&
        second.type === 'country'
    ) {
        return 1;
    }

    // City and its country
    if (
        (first.type === 'city' &&
            second.type === 'country') ||
        (first.type === 'country' &&
            second.type === 'city')
    ) {
        return 0.75;
    }

    // Different cities in the same country
    if (
        first.type === 'city' &&
        second.type === 'city'
    ) {
        return 0.25;
    }

    return 0;
}

// Find the best one-to-one destination combinations
function calculateDestinationSimilarity(profile1, profile2) {
    const first = getDestinations(profile1);
    const second = getDestinations(profile2);

    if (!first.length || !second.length) {
        return {
            score: 0,
            relatedDestinations: []
        };
    }

    const matrix = first.map(destination1 =>
        second.map(destination2 =>
            compareDestinations(
                destination1,
                destination2
            )
        )
    );

    const memo = new Map();

    function findBest(index, usedMask) {
        if (index >= first.length) {
            return {
                total: 0,
                pairs: []
            };
        }

        const key = `${index}:${usedMask}`;

        if (memo.has(key)) {
            return memo.get(key);
        }

        // Allow a destination to remain unmatched
        let best = findBest(index + 1, usedMask);

        for (let j = 0; j < second.length; j++) {
            const alreadyUsed =
                (usedMask & (1 << j)) !== 0;

            const score = matrix[index][j];

            if (alreadyUsed || score === 0) {
                continue;
            }

            const remaining = findBest(
                index + 1,
                usedMask | (1 << j)
            );

            const total = score + remaining.total;

            if (total > best.total) {
                best = {
                    total,
                    pairs: [
                        {
                            yourDestination:
                                first[index].label,

                            theirDestination:
                                second[j].label,

                            compatibility:
                                Math.round(score * 100)
                        },
                        ...remaining.pairs
                    ]
                };
            }
        }

        memo.set(key, best);

        return best;
    }

    const best = findBest(0, 0);

    return {
        score:
            best.total /
            Math.sqrt(first.length * second.length),

        relatedDestinations: best.pairs
    };
}

// Check whether a profile is complete
function isProfileComplete(profile) {
    if (!profile) return false;

    return Boolean(
        normalizeText(profile.name) &&
        normalizeList(profile.interests).length > 0 &&
        getDestinations(profile).length > 0
    );
}

// Main compatibility calculation
function calculateCompatibility(profile1, profile2) {
    const interestsScore = calculateCosineSimilarity(
        profile1.interests,
        profile2.interests
    );

    const destinationResult =
        calculateDestinationSimilarity(
            profile1,
            profile2
        );

    const destinationsScore =
        destinationResult.score;

    const travelStyleScore =
        calculateTravelStyleSimilarity(
            profile1.travelStyle,
            profile2.travelStyle
        );

    const locationResult =
        calculateLocationSimilarity(
            profile1,
            profile2
        );

    const locationScore = locationResult.score;

    const sharedInterests = getSharedItems(
        profile1.interests,
        profile2.interests
    );

    const sharedDestinations = getSharedItems(
        profile1.preferredDestinations,
        profile2.preferredDestinations
    );

    const totalScore =
        interestsScore * WEIGHTS.interests +
        destinationsScore * WEIGHTS.destinations +
        travelStyleScore * WEIGHTS.travelStyle +
        locationScore * WEIGHTS.location;

    const similarityScore = Math.min(
        100,
        Math.max(0, Math.round(totalScore * 100))
    );

    let matchLabel;

    if (similarityScore >= 90) {
        matchLabel = 'Exceptional match';
    } else if (similarityScore >= 75) {
        matchLabel = 'Great match';
    } else if (similarityScore >= 50) {
        matchLabel = 'Good match';
    } else if (similarityScore >= 25) {
        matchLabel = 'Potential match';
    } else {
        matchLabel = 'Limited compatibility';
    }

    return {
        similarityScore,
        matchLabel,

        sharedInterests,
        sharedDestinations,

        relatedDestinations:
            destinationResult.relatedDestinations,

        distanceKm: locationResult.distanceKm,

        sameTravelStyle: travelStyleScore === 1,
        sameLocation: locationScore === 1,

        breakdown: {
            interests: Math.round(
                interestsScore * 100
            ),

            destinations: Math.round(
                destinationsScore * 100
            ),

            travelStyle: Math.round(
                travelStyleScore * 100
            ),

            location: Math.round(
                locationScore * 100
            ),
        },
    };
}

module.exports = {
    calculateCompatibility,
    isProfileComplete,
    normalizeList,
    calculateDistanceKm,
    calculateDestinationSimilarity,
};