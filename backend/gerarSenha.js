const bcrypt = require('bcrypt');

const senhaNova = 'WVile2O26!'; // coloque a senha que você quer

bcrypt.hash(senhaNova, 10)
    .then(hash => {
        console.log("Novo hash:");
        console.log(hash);
    })
    .catch(err => console.error(err));
