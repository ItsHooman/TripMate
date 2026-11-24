
const WEIGHTS = {
    destinations: 0.40,
    interests: 0.35,
    travelStyle: 0.20,
    location: 0.05,
};

// Normalize text for consistent comparisons
function normalizeText(value) {
    return typeof value === 'string'
        ? value.toLowerCase().trim().replace(/\s+/g, ' ')
        : '';
}

// Normalize arrays and remove duplicate values
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

// Find shared interests or destinations
function getSharedItems(list1, list2) {
    const first = normalizeList(list1);
    const second = new Set(normalizeList(list2));

    return first.filter(item => second.has(item));
}

// Cosine similarity for lists
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

// Compare locations
function calculateLocationSimilarity(location1, location2) {
    const first = normalizeText(location1);
    const second = normalizeText(location2);

    if (!first || !second) return 0;

    return first === second ? 1 : 0;
}

// Check whether a profile has enough matching information
function isProfileComplete(profile) {
    if (!profile) return false;

    return Boolean(
        normalizeText(profile.name) &&
        normalizeList(profile.interests).length > 0 &&
        normalizeList(profile.preferredDestinations).length > 0
    );
}

// Main compatibility calculation
function calculateCompatibility(profile1, profile2) {
    const interestsScore = calculateCosineSimilarity(
        profile1.interests,
        profile2.interests
    );

    const destinationsScore = calculateCosineSimilarity(
        profile1.preferredDestinations,
        profile2.preferredDestinations
    );

    const travelStyleScore = calculateTravelStyleSimilarity(
        profile1.travelStyle,
        profile2.travelStyle
    );

    const locationScore = calculateLocationSimilarity(
        profile1.location,
        profile2.location
    );

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
        sameTravelStyle: travelStyleScore === 1,
        sameLocation: locationScore === 1,

        breakdown: {
            interests: Math.round(interestsScore * 100),
            destinations: Math.round(destinationsScore * 100),
            travelStyle: Math.round(travelStyleScore * 100),
            location: Math.round(locationScore * 100),
        },
    };
}

module.exports = {
    calculateCompatibility,
    isProfileComplete,
    normalizeList,
};
