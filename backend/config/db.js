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
    let result;
    try {
        connection.connect();
        connection.query('SELECT SUM(quantity) FROM users', (err, rows, fields) => {
            if (!err) {
                result = rows;
            } else {
                console.log(err);
            }
        });
    } catch (err) {
        throw err;
    } finally {
        if (connection) connection.end();
        return result;
    }
}

// 휴대폰 번호로 지갑주소 가져오기
async function getWalletAddress(phoneNumber) {
    let result;
    try {
        connection.connect();
        connection.query('SELECT address FROM wallet WHERE phoneNumber=?', [phoneNumber], (err, rows, fields) => {
            if (!err) {
                result = rows;
            } else {
                console.log(err);
            }
        });
    } catch (err) {
        throw err;
    } finally {
        if (connection) connection.end();
        return result;
    }
}

// 1회차 유저정보 가져오기
async function getUserInfoForFirstRound(phoneNumber) {
    let result;
    try {
        connection.connect();
        connection.query('SELECT * FROM users WHERE phoneNumber=? AND round=1', [phoneNumber], (err, rows, fields) => {
            if (!err) {
                result = rows;
            } else {
                console.log(err);
            }
        });
    } catch (err) {
        throw err;
    } finally {
        if (connection) connection.end();
        return result;
    }
}

// 2회차 유저정보 가져오기
async function getUserInfoForSecondRound(phoneNumber) {
    let result;
    try {
        connection.connect();
        connection.query('SELECT * FROM users WHERE phoneNumber=? AND round=2', [phoneNumber], (err, rows, fields) => {
            if (!err) {
                result = rows;
            } else {
                console.log(err);
            }
        });
    } catch (err) {
        throw err;
    } finally {
        if (connection) connection.end();
        return result;
    }
} 

// 몇번째 구매인지
async function checkNumberOfPurchased(phoneNumber) {
    let result;
    try {
        connection.connect();
        connection.query('SELECT COUNT(phoneNumber) FROM users WHERE phoneNumber=?', [phoneNumber], (err, rows, fields) => {
            if (!err) {
                result = rows;
            } else {
                console.log(err);
            }
        });
    } catch (err) {
        throw err;
    } finally {
        if (connection) connection.end();
        return result;
    }
}

// 1라운드 순위
async function getRankForFirstRound() {
    let result;
    try {
        connection.connect();
        connection.query('SELECT sum_quantity, phoneNumber FROM (SELECT phoneNumber, SUM(quantity) AS sum_quantity, round FROM users WHERE round=1 GROUP BY phoneNumber)t ORDER BY sum_quantity desc limit 3', (err, rows, fields) => {
            if (!err) {
                result = rows;
            } else {
                console.log(err);
            }
        });
    } catch (err) {
        throw err;
    } finally {
        if (connection) connection.end();
        return result;
    }
}

// 2라운드 순위
async function getRankForSecondRound() {
    let result;
    try {
        connection.connect();
        connection.query('SELECT sum_quantity, phoneNumber FROM (SELECT phoneNumber, SUM(quantity) AS sum_quantity, round FROM users WHERE round=2 GROUP BY phoneNumber)t ORDER BY sum_quantity desc limit 3', (err, rows, fields) => {
            if (!err) {
                result = rows;
            } else {
                console.log(err);
            }
        });
    } catch (err) {
        throw err;
    } finally {
        if (connection) connection.end();
        return result;
    }
}

// 구매 기록하기
async function setBuying(phoneNumber, quantity, place, round) {
    let result;
    try {
        connection.connect();
        connection.query('INSERT INTO nodejs.users(phoneNumber, quantity, place, round)', [phoneNumber, quantity, place, round], (err, rows, fields) => {
            if (!err) {
                result = rows;
            } else {
                console.log(err);
            }
        });
    } catch (err) {
        throw err;
    } finally {
        if (connection) connection.end();
        return result;
    }
}

// 지갑 생성
async function setWalletAddress(phoneNumber, address, publicKey) {
    let result;
    try {
        connection.connect();
        connection.query('INSERT INTO nodejs.wallet(phoneNumber, address, publicKey)', [phoneNumber, address, publicKey], (err, rows, fields) => {
            if (!err) {
                result = rows;
            } else {
                console.log(err);
            }
        });
    } catch (err) {
        throw err;
    } finally {
        if (connection) connection.end();
        return result;
    }
} 

module.exports = { 
    getAllQuantaties, getWalletAddress, getUserInfoForFirstRound, 
    getUserInfoForSecondRound, checkNumberOfPurchased, getRankForFirstRound, 
    getRankForSecondRound, setBuying, setWalletAddress
}
