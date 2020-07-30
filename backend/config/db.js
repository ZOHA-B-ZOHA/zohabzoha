const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: '52.78.6.243',
    user: 'root',
    password: '1234',
    database: 'nodejs',
    port: '1823'  
});

// 총 구매 수량 체크
async function getAllQuantaties() {
    let conn, result;
    try {
        conn = await pool.getConnection();
        conn.query('USE nodejs');
        result = await conn.query('SELECT SUM(quantity) FROM users');
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.end();
        return result;
    }
}

// 휴대폰 번호로 지갑주소 가져오기
async function getWalletAddress(phoneNumber) {
    let conn, result;
    try {
        conn = await pool.getConnection();
        conn.query('USE nodejs');
        result = await conn.query('SELECT address FROM wallet WHERE phoneNumber=?', [phoneNumber])
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.end();
        return result;
    }
}

// 1회차 유저정보 가져오기
async function getUserInfoForFirstRound(phoneNumber) {
    let conn, result;
    try {
        conn = await pool.getConnection();
        conn.query('USE nodejs');
        result = await conn.query('SELECT * FROM users WHERE phoneNumber=? AND round=1', [phoneNumber]);
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.end();
        return result;
    }
}

// 2회차 유저정보 가져오기
async function getUserInfoForSecondRound(phoneNumber) {
    let conn, result;
    try {
        conn = await pool.getConnection();
        conn.query('USE nodejs');
        result = await conn.query('SELECT * FROM users WHERE phoneNumber=? AND round=2', [phoneNumber]);
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.end();
        return result;
    }
} 

// 몇번째 구매인지
async function checkNumberOfPurchased(phoneNumber) {
    let conn, result;
    try {
        conn = await pool.getConnection();
        conn.query('USE nodejs');
        result = await conn.query('SELECT COUNT(phoneNumber) FROM users WHERE phoneNumber=?', [phoneNumber]);
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.end();
        return result;
    }
}

// 1라운드 순위
async function getRankForFirstRound() {
    let conn, result;
    try {
        conn = await pool.getConnection();
        conn.query('USE nodejs');
        result = await conn.query('SELECT sum_quantity, phoneNumber FROM (SELECT phoneNumber, SUM(quantity) AS sum_quantity, round FROM users WHERE round=1 GROUP BY phoneNumber)t ORDER BY sum_quantity desc limit 3');
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.end();
        return result;
    }
}

// 2라운드 순위
async function getRankForSecondRound() {
    let conn, result;
    try {
        conn = await pool.getConnection();
        conn.query('USE nodejs');
        result = await conn.query('SELECT sum_quantity, phoneNumber FROM (SELECT phoneNumber, SUM(quantity) AS sum_quantity, round FROM users WHERE round=2 GROUP BY phoneNumber)t ORDER BY sum_quantity desc limit 3');
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.end();
        return result;
    }
}

// 구매 기록하기
async function setBuying(phoneNumber, quantity, place, round) {
    let conn, result;
    try {
        conn = await pool.getConnection();
        conn.query('USE nodejs');
        result = await conn.query('INSERT INTO nodejs.users(phoneNumber, quantity, place, round)', [phoneNumber, quantity, place, round]);
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.end();
        return result;
    }
}

// 지갑 생성
async function setWalletAddress(phoneNumber, address, publicKey) {
    let conn, result;
    try {
        conn = await pool.getConnection();
        conn.query('USE nodejs');
        result = await conn.query('INSERT INTO nodejs.wallet(phoneNumber, address, publicKey)', [phoneNumber, address, publicKey]);
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
