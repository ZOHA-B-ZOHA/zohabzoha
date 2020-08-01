const express = require('express');
const router = express.Router();
const path = require("path");
const request = require('request');
const config = require('../config/config.json');
const db = require('../config/db');
const Caver = require('caver-js');
const caver = new Caver('https://api.baobab.klaytn.net:8651/'); // 사용시에는 cypress로 바꾸자!!

/* GET home page. */
router.get('/', function (req, res, next) {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
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
      else if (rows[0] == null) {
        // KAS로 wallet 생성
        request(creatingWalletOptions, (error, response, body) => {
          if (error) {
            console.log('kas create wallet error ', error);
          } else if (response.statusCode == 200) {
            // db에 새 지갑주소 등록
            db.conn.query('INSERT INTO wallet VALUES (?, ?, ?)', [req.body.phoneNumber, JSON.parse(body).result.address, JSON.parse(body).result.public_key], (err, rows, fields) => {
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
              } else {
                console.log('set address error ', err);
              }
            });
          } else {
            console.log('please try again KAS');
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
      }
    });
  } catch (e) {
    throw e
  }
});

/* 적립하는 api */
router.post('/api/verify', async(req, res, next) => {
  try {
    // get achievement
    let responseAchievment = await getAllAchievement();
    
    if (req.body.verificationCode == 'zohabzohafighting') { // 여기에 qr code 값을 넣장
      // db에 구매내역 기록
      db.conn.query('INSERT INTO users (phoneNumber, quantity, place, round) VALUES (?, ?, ?, ?)', [req.body.phoneNumber, req.body.purchaseQuantity, req.body.branch, req.body.round], (err, rows, fields) => {
        if (!err) {
          // 기록 후 지금까지의 구매 횟수 출력
          db.conn.query('SELECT SUM(quantity) AS countNumber FROM users WHERE phoneNumber=?', [req.body.phoneNumber], (err, rows, fields) => {
            if (!err) {
              console.log('count rows ', rows[0]);
              // 기록하고 구매내역 출력했으면
              res.json({
                "achievement": responseAchievment,
                "justEarned": true,
                "purchaseCount": rows[0].countNumber
              });
            } else {
              console.log('check count error ', err);
            }
          });
        } else {
          console.log('insert qunatities error ', err);
        }
      });
    } else {
      res.json({ "msg": 'invalid password' });
    }
  } catch (e) {
    throw e
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
