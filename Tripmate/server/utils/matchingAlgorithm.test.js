const assert = require('node:assert/strict');

const {
    calculateCompatibility,
    calculateDestinationSimilarity,
    calculateDistanceKm,
} = require('./matchingAlgorithm');

const toronto = {
    placeId: 'toronto',
    label: 'Toronto, Ontario, Canada',
    countryCode: 'ca',
    latitude: 43.6532,
    longitude: -79.3832,
    type: 'city'
};

const mississauga = {
    placeId: 'mississauga',
    label: 'Mississauga, Ontario, Canada',
    countryCode: 'ca',
    latitude: 43.5890,
    longitude: -79.6441,
    type: 'city'
};

const barcelona = {
    placeId: 'barcelona',
    label: 'Barcelona, Spain',
    countryCode: 'es',
    type: 'city'
};

const spain = {
    placeId: 'spain',
    label: 'Spain',
    countryCode: 'es',
    type: 'country'
};

const madrid = {
    placeId: 'madrid',
    label: 'Madrid, Spain',
    countryCode: 'es',
    type: 'city'
};

const tokyo = {
    placeId: 'tokyo',
    label: 'Tokyo, Japan',
    countryCode: 'jp',
    type: 'city'
};

function createProfile(destinations, location) {
    return {
        name: 'Test Traveler',

        interests: [
            'food',
            'music',
            'adventure'
        ],

        travelStyle: 'Group',

        location: location.label,

        locationDetails: location,

        preferredDestinations:
            destinations.map(place => place.label),

        destinationDetails: destinations
    };
}

const profile1 = createProfile(
    [barcelona],
    toronto
);

const profile2 = createProfile(
    [spain],
    mississauga
);

// Exact destination
assert.equal(
    calculateDestinationSimilarity(
        profile1,
        profile1
    ).score,
    1
);

// City and country
assert.equal(
    calculateDestinationSimilarity(
        profile1,
        profile2
    ).score,
    0.75
);

// Different cities in same country
assert.equal(
    calculateDestinationSimilarity(
        profile1,
        createProfile([madrid], toronto)
    ).score,
    0.25
);

// Different countries
assert.equal(
    calculateDestinationSimilarity(
        profile1,
        createProfile([tokyo], toronto)
    ).score,
    0
);

// Nearby home cities
const distance = calculateDistanceKm(
    toronto,
    mississauga
);

assert.ok(distance > 0 && distance < 50);

// Prevent duplicate country matching
const multipleCities = createProfile(
    [barcelona, madrid],
    toronto
);

const countryMatch =
    calculateDestinationSimilarity(
        multipleCities,
        profile2
    );

assert.equal(
    countryMatch.relatedDestinations.length,
    1
);

// Overall compatibility
const result = calculateCompatibility(
    profile1,
    profile2
);

assert.equal(result.similarityScore, 89);
assert.equal(result.breakdown.destinations, 75);
assert.equal(result.breakdown.location, 80);

// Symmetrical scoring
assert.equal(
    calculateCompatibility(
        profile2,
        profile1
    ).similarityScore,
    result.similarityScore
);

// Older profile compatibility
const legacyProfile = {
    name: 'Legacy Traveler',
    interests: ['food', 'music', 'adventure'],
    preferredDestinations: ['Barcelona, Spain'],
    location: toronto.label,
    travelStyle: 'Group'
};

assert.equal(
    calculateCompatibility(
        profile1,
        legacyProfile
    ).similarityScore,
    100
);

console.log('All matching algorithm tests passed!');
console.log('Distance:', distance.toFixed(2), 'km');
console.log('Compatibility:', result);