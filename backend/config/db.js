const mysql = require('mysql');

const conn = mysql.createConnection({
    host: '172.31.9.255',
    user: 'root',
    password: '1234',
    database: 'nodejs',
    port: '1823'
});


// 총 구매 수량 체크
async function getAllQuantaties() {
    let result;
    try {
        conn.query('SELECT SUM(quantity) FROM users', (err, rows, fields) => {
            if (!err) {
                result = rows;
                console.log('quantities ', result);
                return result;
            } else {
                console.log(err);
            }
        });
    } catch (err) {
        throw err;
    }
}

// 휴대폰 번호로 지갑주소 가져오기
async function getWalletAddress(phoneNumber) {
    let result;
    try {
        conn.query('SELECT address FROM wallet WHERE phoneNumber=?', [phoneNumber], (err, rows, fields) => {
            if (!err) {
                result = rows;
                console.log('address ', rows[0]);
                return result;
            } else {
                console.log(err);
            }
        });
    } catch (err) {
        throw err;
    }
}

// 1회차 유저정보 가져오기
async function getUserInfoForFirstRound(phoneNumber) {
    let result;
    try {
        conn.query('SELECT SUM(quantity) FROM users WHERE phoneNumber=? AND round=1', [phoneNumber], (err, rows, fields) => {
            if (!err) {
                result = rows;
                console.log('1st user info ', result);
                return result;
            } else {
                console.log(err);
            }
        });
    } catch (err) {
        throw err;
    }
}

// 2회차 유저정보 가져오기
async function getUserInfoForSecondRound(phoneNumber) {
    let result;
    try {
        conn.query('SELECT SUM(quantity) FROM users WHERE phoneNumber=? AND round=2', [phoneNumber], (err, rows, fields) => {
            if (!err) {
                result = rows;
                console.log('2nd user info ', result);
                return result;
            } else {
                console.log(err);
            }
        });
    } catch (err) {
        throw err;
    }
}

// 몇번째 구매인지
async function checkNumberOfPurchased(phoneNumber) {
    let result;
    try {
        conn.query('SELECT COUNT(phoneNumber) FROM users WHERE phoneNumber=?', [phoneNumber], (err, rows, fields) => {
            if (!err) {
                result = rows;
                console.log('achievment ', result);
                return result;
            } else {
                console.log(err);
            }
        });
    } catch (err) {
        throw err;
    }
}

// 1라운드 순위
async function getRankForFirstRound() {
    let result;
    try {
        conn.query('SELECT sum_quantity, phoneNumber FROM (SELECT phoneNumber, SUM(quantity) AS sum_quantity, round FROM users WHERE round=1 GROUP BY phoneNumber)t ORDER BY sum_quantity desc limit 3', (err, rows, fields) => {
            if (!err) {
                result = rows;
                console.log('1st ranking ', result);
                return result;
            } else {
                console.log(err);
            }
        });
    } catch (err) {
        throw err;
    }
}

// 2라운드 순위
async function getRankForSecondRound() {
    let result;
    try {
        conn.query('SELECT sum_quantity, phoneNumber FROM (SELECT phoneNumber, SUM(quantity) AS sum_quantity, round FROM users WHERE round=2 GROUP BY phoneNumber)t ORDER BY sum_quantity desc limit 3', (err, rows, fields) => {
            if (!err) {
                result = rows;
                console.log('2nd ranking ', result);
                return result;
            } else {
                console.log(err);
            }
        });
    } catch (err) {
        throw err;
    }
}

// 구매 기록하기
async function setBuying(phoneNumber, quantity, place, round) {
    let result;
    try {
        conn.query('INSERT INTO users VALUES (phoneNumber=?, quantity=?, place=?, round=?)', [phoneNumber, quantity, place, round], (err, rows, fields) => {
            if (!err) {
                result = rows;
                console.log('insert buying ', result);
                return result;
            } else {
                console.log(err);
            }
        });
    } catch (err) {
        throw err;
    }
}

// 지갑 생성
async function setWalletAddress(phoneNumber, address, publicKey) {
    let result;
    try {
        conn.query('INSERT INTO wallet VALUES (phoneNumber=?, address=?, publicKey=?)', [phoneNumber, address, publicKey], (err, rows, fields) => {
            if (!err) {
                result = rows;
                console.log('insert wallet ', result);
                return result;
            } else {
                console.log(err);
            }
        });
    } catch (err) {
        throw err;
    }
}

module.exports = {
    getAllQuantaties, getWalletAddress, getUserInfoForFirstRound,
    getUserInfoForSecondRound, checkNumberOfPurchased, getRankForFirstRound,
    getRankForSecondRound, setBuying, setWalletAddress, conn
}
