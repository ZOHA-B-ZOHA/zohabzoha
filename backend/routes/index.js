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
  let responseAchievment, responseRoundOneUserInfo, responseRoundTwoUserInfo;

  // get achievement
  db.conn.query('SELECT SUM(quantity) AS sumQuantities  FROM users', (err, rows, fields) => {
    if (!err) {
      console.log('responseAchievment ', rows[0]);
      //rows[0].SUM(quantity) = responseAchievment;
    } else {
      console.log('get achievement error ', err);
    }
  });

  // round 1 quantity
  db.conn.query('SELECT SUM(quantity) AS sumQuantities  FROM users WHERE phoneNumber=? AND round=1', [req.body.phoneNumber], (err, rows, fields) => {
    if (!err) {
      console.log('express 1st quantities ', rows[0]);
      //rows[0].SUM(quantity) = responseRoundOneUserInfo;
    } else {
      console.log('get 1st userinfo error ', err);
    }
  });

  // round 2 quantity
  db.conn.query('SELECT SUM(quantity) AS sumQuantities  FROM users WHERE phoneNumber=? AND round=2', [req.body.phoneNumber], (err, rows, fields) => {
    if (!err) {
      console.log('express 2nd quantities ', rows[0]);
      //rows[0].SUM(quantity) = responseRoundTwoUserInfo;
    } else {
      console.log('get 2nd userinfo error ', err);
    }
  });

  // get wallet address
  await db.getWalletAddress(req.body.phoneNumber, (err, rows) => {
    // get address error
    if (err) {
      console.log('get wallet address error ', err);
    }
    // 전화번호 데이터가 없을 때 
    else if (!rows) {
      // KAS 로 wallet 생성
      request(creatingWalletOptions, (error, response, body) => {
        let address, publicKey;
        if (error) {
          throw new Error(error);
        }
        else if (response.statusCode == 200) {
          JSON.parse(body).result.address = address;
          JSON.parse(body).result.public_key = publicKey
	console.log('들어옴')
	console.log(address);
	console.log(publicKey);
          // db 에 새 지갑주소 등록
          db.setWalletAddress(req.phoneNumber, address, publicKey, (err, rows) => {
            if (err) {
              console.log('set wallet address error ', err);
            }
            else {
              console.log('set address success ', rows);
              res.send('sending3!');
            }
          });
          // res.json({
          //   "achievement": responseAchievment,
          //   "justEarned": false,
          //   "currentUser": {
          //     "phoneNumber": req.phoneNumber,
          //     "purchaseQuantity": {
          //       "firstRound": responseRoundOneUserInfo,
          //       "secondRound": responseRoundTwoUserInfo
          //     }
          //   }
          // });
          res.send('sending2!');
          console.log('ahhahaha');
        }
      });
    }
    // 전화번호 데이터가 있을 때
    else {
      // res.json({
      //   "achievement": responseAchievment,
      //   "justEarned": false,
      //   "currentUser": {
      //     "phoneNumber": req.phoneNumber,
      //     "purchaseQuantity": {
      //       "firstRound": responseRoundOneUserInfo,
      //       "secondRound": responseRoundTwoUserInfo
      //     }
      //   }
      // });
      res.send('sending!');
      console.log('되나아아아아');
    }
  });
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
