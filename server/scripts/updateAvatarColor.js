const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');

const updateAvatarColor = async () => {
  const isApply = process.argv.includes('--apply');

  try {
    await connectDB();

    const filter = {
      avatar: {
        $regex: /api\.dicebear\.com.*backgroundColor=6c5ce7/,
      },
    };

    const matchingCount = await User.countDocuments(filter);

    if (!isApply) {
      console.log(`Dry run: found ${matchingCount} user(s) matching backgroundColor=6c5ce7.`);
      console.log('To apply the changes, run with --apply');
      return;
    }

    if (matchingCount === 0) {
      console.log('No users found matching backgroundColor=6c5ce7. Nothing to update.');
      return;
    }

    const result = await User.updateMany(filter, [
      {
        $set: {
          avatar: {
            $replaceAll: {
              input: '$avatar',
              find: 'backgroundColor=6c5ce7',
              replacement: 'backgroundColor=0ea5e9',
            },
          },
        },
      },
    ]);

    console.log(`Updated ${result.modifiedCount} user avatar(s) to backgroundColor=0ea5e9.`);
  } catch (error) {
    console.error('updateAvatarColor failed:', error.message);
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.disconnect();
    } catch (_) {}
  }
};

if (require.main === module) {
  updateAvatarColor().then(() => {
    process.exit(process.exitCode || 0);
  });
}

module.exports = updateAvatarColor;
