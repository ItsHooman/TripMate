const mongoose = require('mongoose');
const Event = require('./models/Event');

const events = [
    {
        name: 'Beach Party in Malibu',
        destination: 'Malibu, CA',
        type: 'Party',
        startDate: new Date('2025-03-15'),
        attendees: 30,
        image: 'https://images.pexels.com/photos/7149144/pexels-photo-7149144.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        description: 'A fun beach party with music, drinks, and games.',
        difficulty: 'Easy',
        packingList: ['Sunscreen', 'Towel', 'Beachwear'],
        host: {
            name: 'John Doe',
            email: 'johndoe@example.com',
            phone: '123-456-7890',
        },
        gallery: [
            'https://images.unsplash.com/photo-1638226050413-27c99200d67a?q=80&w=2154&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1631012202313-32a77a595004?q=80&w=2338&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1611244806964-91d204d4a2a7?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        ],
        schedule: ['3:00 PM - Arrival', '4:00 PM - Games', '6:00 PM - Dinner'],
        reviews: [
            {
                author: 'Alice Johnson',
                text: 'Amazing event! Loved the vibes.',
            },
        ],
    },
    {
        name: 'Hiking in the Rockies',
        destination: 'Banff, Canada',
        type: 'Adventure',
        startDate: new Date('2025-04-10'),
        attendees: 15,
        image: 'https://images.pexels.com/photos/1128334/pexels-photo-1128334.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        description: 'An adventurous hiking trip through the Rockies.',
        difficulty: 'Moderate',
        packingList: ['Hiking boots', 'Water bottle', 'Snacks', 'Map'],
        host: {
            name: 'Jane Smith',
            email: 'janesmith@example.com',
            phone: '987-654-3210',
        },
        gallery: [
            'https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=2187&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1593739742226-5e5e2fdb1f1c?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        ],
        schedule: ['7:00 AM - Meetup', '8:00 AM - Start hike', '12:00 PM - Lunch break'],
        reviews: [
            {
                author: 'Michael Brown',
                text: 'Challenging but worth it. Amazing views!',
            },
        ],
    },
    {
        name: 'Camping',
        destination: 'Cairns, Australia',
        type: 'Adventure',
        startDate: new Date('2025-05-05'),
        attendees: 10,
        image: 'https://images.pexels.com/photos/5364971/pexels-photo-5364971.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        description: 'Enjoy a night under the stars in Cairns.',
        difficulty: 'Easy',
        packingList: ['Tent', 'Sleeping bag', 'Flashlight'],
        host: {
            name: 'Emily Davis',
            email: 'emilydavis@example.com',
            phone: '555-123-4567',
        },
        gallery: [
            'https://images.unsplash.com/photo-1533086723868-6060511e4168?q=80&w=2188&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1731325467873-cb8de805563c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjE3fHxjYW1waW5nfGVufDB8fDB8fHwy',
        ],
        schedule: ['5:00 PM - Set up tents', '6:00 PM - Bonfire', '8:00 PM - Stargazing'],
        reviews: [
            {
                author: 'Chris Green',
                text: 'Very relaxing and well-organized.',
            },
        ],
    },
];


const seed = async () => {
    try {
        await mongoose.connect('mongodb+srv://Pegah:Peg%40h2002ghm@cluster2.tnlbc.mongodb.net/Tripmate?retryWrites=true&w=majority', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        await Event.deleteMany();
        await Event.insertMany(events);

        console.log('Sample events seeded!');
        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding events:', error);
    }
};

seed();
