const bcrypt = require('bcryptjs');
const User = require('../models/User');

const DEFAULT_ADMIN = {
  fullName: 'RLP Admin',
  email: 'admin@rlp.com',
  password: 'Admin@123',
  mobileNumber: '9999999999',
  dob: new Date('1990-01-01T00:00:00.000Z'),
  gender: 'Male',
  voterId: 'RLPADMIN01',
  address: 'RLP State Office, Jaipur',
  state: 'Rajasthan',
  district: 'Jaipur',
  city: 'Jaipur',
  pincode: '302001',
  role: 'admin',
};

async function ensureDefaultAdmin() {
  const existingAdmin = await User.findOne({ email: DEFAULT_ADMIN.email });
  const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 12);

  if (!existingAdmin) {
    await User.create({
      ...DEFAULT_ADMIN,
      password: hashedPassword,
    });
    console.log('Default admin account created');
    return;
  }

  existingAdmin.fullName = existingAdmin.fullName || DEFAULT_ADMIN.fullName;
  existingAdmin.email = DEFAULT_ADMIN.email;
  existingAdmin.mobileNumber = existingAdmin.mobileNumber || DEFAULT_ADMIN.mobileNumber;
  existingAdmin.dob = existingAdmin.dob || DEFAULT_ADMIN.dob;
  existingAdmin.gender = existingAdmin.gender || DEFAULT_ADMIN.gender;
  existingAdmin.voterId = existingAdmin.voterId || DEFAULT_ADMIN.voterId;
  existingAdmin.address = existingAdmin.address || DEFAULT_ADMIN.address;
  existingAdmin.state = existingAdmin.state || DEFAULT_ADMIN.state;
  existingAdmin.district = existingAdmin.district || DEFAULT_ADMIN.district;
  existingAdmin.city = existingAdmin.city || DEFAULT_ADMIN.city;
  existingAdmin.pincode = existingAdmin.pincode || DEFAULT_ADMIN.pincode;
  existingAdmin.role = 'admin';
  existingAdmin.password = hashedPassword;
  await existingAdmin.save();
  console.log('Default admin account ensured');
}

module.exports = { ensureDefaultAdmin };
