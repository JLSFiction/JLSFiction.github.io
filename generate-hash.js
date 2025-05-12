const bcrypt = require('bcryptjs');
const password = 'Valinor583';
const hash = bcrypt.hashSync(password, 10);
console.log(hash);