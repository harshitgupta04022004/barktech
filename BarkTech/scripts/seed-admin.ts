/**
 * Seed admin accounts for Bark Technologies.
 *
 * Usage: npx tsx scripts/seed-admin.ts
 * Run from the BarkTech/ directory.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'BarkTech';

const admins = [
  {
    email: 'harshitguptafebruary42004@gmail.com',
    password: '0402@HGupta',
    name: 'Harshit Gupta',
    role: 'super_admin',
  },
  {
    email: 'harshitgupta040204@gmail.com',
    password: '0402@HGupta',
    name: 'Harshit Gupta',
    role: 'admin',
  },
];

async function seed() {
  console.log('Connecting to MongoDB...');
  console.log(`URI: ${MONGODB_URI.substring(0, 40)}...`);
  console.log(`DB: ${MONGODB_DB_NAME}`);

  try {
    await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });
    console.log('Connected to MongoDB.');
  } catch (err: any) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }

  const db = mongoose.connection.db!;
  const usersCollection = db.collection('users');

  for (const admin of admins) {
    const existing = await usersCollection.findOne({ email: admin.email });
    if (existing) {
      console.log(`User ${admin.email} already exists, updating...`);
      const hashedPassword = await bcrypt.hash(admin.password, 12);
      await usersCollection.updateOne(
        { email: admin.email },
        {
          $set: {
            passwordHash: hashedPassword,
            role: admin.role,
            isActive: true,
            fullName: admin.name,
            isVerified: true,
          },
        },
      );
      console.log(`Updated ${admin.email} (${admin.role})`);
    } else {
      const hashedPassword = await bcrypt.hash(admin.password, 12);
      await usersCollection.insertOne({
        email: admin.email,
        passwordHash: hashedPassword,
        fullName: admin.name,
        role: admin.role,
        isActive: true,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`Created ${admin.email} (${admin.role})`);
    }
  }

  console.log('\nSeeding complete! Admin accounts:');
  for (const admin of admins) {
    console.log(`  ${admin.email} / ${admin.password} (${admin.role})`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
