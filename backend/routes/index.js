const express = require('express');
const router = express.Router();
const path = require("path");
const request = require('request');
const config = require('../config/config.json');
const db = require('../config/db');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
	console.log('index page is open');
});

// 전화번호 입력 후 접속
router.post('/api/authenticate', (req, res, next) => { 
console.log(req.body);
 // 전화번호에 지갑주소 있는지 확인
  db.getWalletAddress(req.body.phoneNumber)
    .then((result) => {
	console.log(result);
	if (result) {
        console.log('get wallet success result ', result);
	// 전체 구매 수 측정
        db.getAllQuantaties().then((response) => {
          console.log('get all quantities ', response);
        }, (err) => {
          console.log('get quantaties error ', err)
        });
  // 1회차 유저정보 호출
  db.getUserInfoForFirstRound(req.body.phoneNumber)
        .then((result) => {
          console.log(result);
        });
  // 2회차 유저정보 호출
  db.getUserInfoForSecondRound(req.body.phoneNumber)
        .then((result) => {
          console.log(result);
        });
    // 전화번호 존재하지 않으면      
    } else {
       request(creatingWalletOptions, (error, response, body) => {
         if (error) {
           throw new Error(error);
         } else if (response.statusCode == 200) {
           //response.body.result.address = address;
           //response.body.result.public_key = publicKey;
		console.log('parsing', JSON.parse(body).result);  
	       db.setWalletAddress(req.phoneNumber, JSON.parse(body).result.address, JSON.parse(body).result.public_key)
             .then((err) => {
               console.log('set wallet address error ', err);
             }, (result) => {
		console.log('set wallet address result', result);
	});
         } else {
           console.log('fail to request creating wallet ', response);
         }
       });
    }
  }, (err) => {
    console.log('get wallet address error ', err);
  });
});

// 적립하는 api
router.post('/api/verify', (req, res, next) => {
  if (res.verificationCode == 'corgi') { // 여기에 qr code 값을 넣장
    db.setBuying(res.phoneNumber, res.purchaseQuantity, res.branch, '라운드 값?')
      .then((result) => {

      })
  } else {
    req.json({msg: 'invalid password'});
  }
});

// 쿠폰 사용
router.post('/api/redeem', (req, res, next) => {

});

// 토큰 발급 시스템
router.post('', (req, res, next) => {

});

// request options
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

// check date
function checkDate() {
  let today = new Date();
  let month = today.getUTCMonth;
  let date = today.getUTCDate;
  return
};

module.exports = router;
