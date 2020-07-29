const express = require('express');
const router = express.Router();
const path = require("path");
const request = require('request');
const config = require('../config/config.json');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});

// 전화번호 입력 후 접속
router.post('/api/authenticate', (req, res, next) => {
  
  // 전화번호에 지갑주소 있는지 확인
  if (req.phoneNumber) {
    res.json({
      data: {
        achievement: 10,
        justEarned: false,
        currentUser: {
          phoneNumber: req.phoneNumber,
          purchaseQuantity: {
            firstRound: 1,
            secondRound: 2
          },
          rewards: [
            {
              round: 'first',
              type: 'free'
            }
          ]
        }
      }
    })
  } else {
    request(creatingWalletOptions, (err, res) => {
      if (err) {
        console.log('creating wallet error', err)
      } else {
        console.log('creating wallet succeess', res.body)
      }
    })
  }
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
