const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); 

const adminData = {
  name: 'Admin1',
  email: 'admin@example.com',
  password: 'adminpassword', 
  role: 'admin', 
};

async function seedAdmin() {
  try {
    // Connect to the MongoDB database
    await mongoose.connect('mongodb+srv://Pegah:Peg%40h2002ghm@cluster2.tnlbc.mongodb.net/Tripmate?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Check if an admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('Admin already exists');
      return;
    }

    // Hash the admin password
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    // Create the new admin user
    const newAdmin = new User({
      ...adminData,
      password: hashedPassword, // Save the hashed password
    });

    // Save the admin user to the database
    await newAdmin.save();
    console.log('Admin user seeded successfully');

    // Close the connection
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding admin user:', error);
    mongoose.connection.close();
  }
}

// Run the seeding script
seedAdmin();
