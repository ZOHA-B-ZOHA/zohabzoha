const express = require('express');
const router = express.Router();
const path = require("path");
const request = require('request');
const config = require('../config/config.json');
const db = require('../config/db');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
  console.log('index page is open');
});

/* 전화번호 입력 후 접속 */
router.post('/api/authenticate', async (req, res, next) => {
  try {
    // get achievement
    let responseAchievment = await getAllAchievement();

    // round 1 quantity
    let responseRoundOneUserInfo = await getRoundOneQuantities(req.body.phoneNumber);

    // round 2 quantity
    let responseRoundTwoUserInfo = await getRoundTwoQuantities(req.body.phoneNumber);

    // get wallet address
    db.conn.query('SELECT address FROM wallet WHERE phoneNumber=?', [req.body.phoneNumber], (err, rows, fields) => {
      if (err) {
        console.log('get wallet address error ', err);
      }
      // 등록된 전화번호가 없으면
      else if (!rows || rows == undefined) {
        // KAS로 wallet 생성
        request(creatingWalletOptions, (error, response, body) => {
          let address, publicKey;
          if (error) {
            console.log('kas create wallet error ', error);
          } else if (response.statusCode == 200) {
            JSON.parse(body).result.address = address;
            JSON.parse(body).result.public_key = publicKey
            // db에 새 지갑주소 등록
            db.conn.query('INSERT INTO wallet VALUES (phoneNumber=?, address=?, publicKey=?)', [req.body.phoneNumber, address, publicKey], (err, rows, fields) => {
              if (!err) {
                res.json({
                  "achievement": responseAchievment,
                  "justEarned": false,
                  "currentUser": {
                    "phoneNumber": req.body.phoneNumber,
                    "purchaseQuantity": {
                      "firstRound": responseRoundOneUserInfo,
                      "secondRound": responseRoundTwoUserInfo
                    }
                  }
                });
                db.conn.end();
              } else {
                console.log('set address error ', err);
              }
            });
          }
        });
      }
      // 등록된 전화번호가 존재하면
      else {
        res.json({
          "achievement": responseAchievment,
          "justEarned": false,
          "currentUser": {
            "phoneNumber": req.body.phoneNumber,
            "purchaseQuantity": {
              "firstRound": responseRoundOneUserInfo,
              "secondRound": responseRoundTwoUserInfo
            }
          }
        });
        db.conn.end();
      }
    });
  } catch (e) {
    throw e
  }
});

/* 적립하는 api */
router.post('/api/verify', (req, res, next) => {
  if (res.verificationCode == 'zohabzohafighting') { // 여기에 qr code 값을 넣장
    db.setBuying(res.phoneNumber, res.purchaseQuantity, res.branch, '라운드 값?')
      .then((result) => {

      })
  } else {
    res.json({ msg: 'invalid password' });
  }
});

/* 쿠폰 사용 */
router.post('/api/redeem', (req, res, next) => {

});

/* 토큰 발급 시스템 */
router.post('', (req, res, next) => {

});

/* 현재 총 잔 수 */
async function getAllAchievement() {
  return new Promise((resolve, reject) => {
    db.conn.query('SELECT SUM(quantity) AS sumQuantities  FROM users', (err, rows, fields) => {
      if (!err) {
        console.log('responseAchievment ', rows[0]);
        resolve(rows[0].sumQuantities)
      }
      else {
        reject('get achievement error ', err);
      }
    });
  });
};

/* 유저가 구매한 1라운드 잔 수 */
async function getRoundOneQuantities(phoneNumber) {
  return new Promise((resolve, reject) => {
    db.conn.query('SELECT SUM(quantity) AS sumQuantities  FROM users WHERE phoneNumber=? AND round=1', [phoneNumber], (err, rows, fields) => {
      if (!err) {
        console.log('express 1st quantities ', rows[0].sumQuantities);
        resolve(rows[0].sumQuantities)
      } else {
        reject('get 1st userinfo error ', err);
      }
    });
  });
};

/* 유저가 구매한 2라운드 잔 수 */
async function getRoundTwoQuantities(phoneNumber) {
  return new Promise((resolve, reject) => {
    db.conn.query('SELECT SUM(quantity) AS sumQuantities  FROM users WHERE phoneNumber=? AND round=2', [phoneNumber], (err, rows, fields) => {
      if (!err) {
        console.log('express 2nd quantities ', rows[0].sumQuantities);
        resolve(rows[0].sumQuantities)
      } else {
        reject('get 2nd userinfo error ', err);
      }
    });
  });
};

/* request options */
const creatingWalletOptions = {
  method: "POST",
  preambleCRLF: true,
  postambleCRLF: true,
  url: 'https://wallet-api.beta.klaytn.io/v2/account',
  headers: {
    'Content-type': 'application/json',
    'x-krn': 'krn:1001:wallet:116:account:default',
    'Authorization': 'Basic ' + config.kasAuth
  }
};

/* check date */
function checkDate() {
  let today = new Date();
  let month = today.getUTCMonth;
  let date = today.getUTCDate;
  return
};

module.exports = router;
