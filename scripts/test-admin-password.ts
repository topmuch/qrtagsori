// Test bcrypt hash for the default admin password
import bcrypt from 'bcryptjs';

const password = 'Admin12345!';
const storedHash = '$2b$10$5JnNkrnAaKKWV6kw5Ya9X.yCPqhCi4qTEFTQ37fGRUIORU9nSx9Dq';

console.log('Testing password:', password);
console.log('Against hash:', storedHash);
console.log('Match:', bcrypt.compareSync(password, storedHash));

// Generate a fresh hash for Admin12345!
const freshHash = bcrypt.hashSync(password, 10);
console.log('\nFresh hash for "Admin12345!":', freshHash);
console.log('Verify fresh hash:', bcrypt.compareSync(password, freshHash));
