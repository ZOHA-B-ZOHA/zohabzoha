const mysql = require('mysql');

const connection = mysql.createConnection({
    host: '52.78.6.243',
    user: 'root',
    password: '1234',
    database: 'nodejs',
    port: '1823'  
});

// 총 구매 수량 체크
async function getAllQuantaties() {
    try {
        connection.connect();
        connection.query('SELECT SUM(quantity) FROM users');
        connection.end();
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.end();
        return result;
    }
}

// 휴대폰 번호로 지갑주소 가져오기
async function getWalletAddress(phoneNumber) {
    try {
        connection.connect();
        connection.query('SELECT address FROM wallet WHERE phoneNumber=?', [phoneNumber]);
        connection.end();
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.end();
        return result;
    }
}

// 1회차 유저정보 가져오기
async function getUserInfoForFirstRound(phoneNumber) {
    try {
        connection.connect();
        connection.query('SELECT * FROM users WHERE phoneNumber=? AND round=1', [phoneNumber]);
        connection.end();
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.end();
        return result;
    }
}

// 2회차 유저정보 가져오기
async function getUserInfoForSecondRound(phoneNumber) {
    try {
        connection.connect();
        connection.query('SELECT * FROM users WHERE phoneNumber=? AND round=2', [phoneNumber]);
        connection.end();
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.end();
        return result;
    }
} 

// 몇번째 구매인지
async function checkNumberOfPurchased(phoneNumber) {
    try {
        connection.connect();
        connection.query('SELECT COUNT(phoneNumber) FROM users WHERE phoneNumber=?', [phoneNumber]);
        connection.end();
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.end();
        return result;
    }
}

// 1라운드 순위
async function getRankForFirstRound() {
    try {
        connection.connect();
        connection.query('SELECT sum_quantity, phoneNumber FROM (SELECT phoneNumber, SUM(quantity) AS sum_quantity, round FROM users WHERE round=1 GROUP BY phoneNumber)t ORDER BY sum_quantity desc limit 3');
        connection.end();
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.end();
        return result;
    }
}

// 2라운드 순위
async function getRankForSecondRound() {
    try {
        connection.connect();
        connection.query('SELECT sum_quantity, phoneNumber FROM (SELECT phoneNumber, SUM(quantity) AS sum_quantity, round FROM users WHERE round=2 GROUP BY phoneNumber)t ORDER BY sum_quantity desc limit 3');
        connection.end();
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.end();
        return result;
    }
}

// 구매 기록하기
async function setBuying(phoneNumber, quantity, place, round) {
    try {
        connection.connect();
        connection.query('INSERT INTO nodejs.users(phoneNumber, quantity, place, round)', [phoneNumber, quantity, place, round]);
        connection.end();
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.end();
        return result;
    }
}

// 지갑 생성
async function setWalletAddress(phoneNumber, address, publicKey) {
    try {
        connection.connect();
        connection.query('INSERT INTO nodejs.wallet(phoneNumber, address, publicKey)', [phoneNumber, address, publicKey]);
        connection.end();
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.end();
        return result;
    }
} 

module.exports = { 
    getAllQuantaties, getWalletAddress, getUserInfoForFirstRound, 
    getUserInfoForSecondRound, checkNumberOfPurchased, getRankForFirstRound, 
    getRankForSecondRound, setBuying, setWalletAddress
}
