let MySqli = require('mysqli');

let conn = new MySqli({
    host: 'localhost',
    post: '3306',
    user: 'root',
    passwd: '123456',
    db: 'mega_shop'
});

let db = conn.emit(false, '');

module.exports = {
    database: db
}
