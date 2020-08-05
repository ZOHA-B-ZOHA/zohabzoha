const mysql = require('mysql');

const conn = mysql.createConnection({
    host: '172.31.9.255',
    user: 'root',
    password: '1234',
    database: 'nodejs',
    port: '1823'
});

module.exports = { conn }
