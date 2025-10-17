// admin/generate_hash.js
const bcrypt = require('bcryptjs');

//const password = 'Valinor583';
const password = 'RastinEtheril159';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error generating hash:', err);
        return;
    }
    console.log('Generated hash:', hash);
});