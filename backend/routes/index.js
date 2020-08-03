// contract ABI
let abi = [
	{
		"constant": true,
		"inputs": [
			{
				"name": "interfaceId",
				"type": "bytes4"
			}
		],
		"name": "supportsInterface",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "getApproved",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "to",
				"type": "address"
			},
			{
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "approve",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "from",
				"type": "address"
			},
			{
				"name": "to",
				"type": "address"
			},
			{
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "transferFrom",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "from",
				"type": "address"
			},
			{
				"name": "to",
				"type": "address"
			},
			{
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "safeTransferFrom",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "ownerOf",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "owner",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "to",
				"type": "address"
			},
			{
				"name": "approved",
				"type": "bool"
			}
		],
		"name": "setApprovalForAll",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "from",
				"type": "address"
			},
			{
				"name": "to",
				"type": "address"
			},
			{
				"name": "tokenId",
				"type": "uint256"
			},
			{
				"name": "_data",
				"type": "bytes"
			}
		],
		"name": "safeTransferFrom",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "owner",
				"type": "address"
			},
			{
				"name": "operator",
				"type": "address"
			}
		],
		"name": "isApprovedForAll",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"name": "to",
				"type": "address"
			},
			{
				"indexed": true,
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "Transfer",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"name": "approved",
				"type": "address"
			},
			{
				"indexed": true,
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "Approval",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"name": "operator",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "approved",
				"type": "bool"
			}
		],
		"name": "ApprovalForAll",
		"type": "event"
	}
];
const express = require('express');
const router = express.Router();
const path = require("path");
const request = require('request');
const config = require('../config/config.json');
const db = require('../config/db');
const Caver = require('caver-js');
const caver = new Caver('https://api.baobab.klaytn.net:8651/'); // 사용시에는 cypress로 바꾸자!!
const tokenContract = new caver.contract(abi, '0xABfE9127F9BC5CE975da7b1d36b3a34d18AC3E9f');

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
            // session 에 지갑주속 등록
            req.session.address = JSON.parse(body).result.address;

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
        // session 에 지갑주소 등록
        req.session.address = rows[0].address;

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

/* 랭킹 호출 api */
router.post('/api/rankings', async(req, res, next) => {
  try {
    // 1라운드 랭킹 쿼리
    let roundOneRanking = await getRoundOneRanking();
    // 2라운드 랭킹 쿼리
    let roundTwoRanking = await getRoundTwoRanking();

    // response
    // 각각 객체이며 0~9 값으로 이루어져 있습니다. 사용법은 아래와 같습니다
    // roundOneRanking[0].sum_quantity (1라운드의 1등의 구매 량)
    // roundTwonRanking[3].phoneNumber (2랴운드 4등의 휴대폰 번호)
    res.json({
      "firstRoundRanking": roundOneRanking,
      "secondRoundRanking": roundTwoRanking
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
      // chain에 구매내역 기록
      
      // db에 구매내역 기록
      db.conn.query('INSERT INTO users (phoneNumber, quantity, place, round) VALUES (?, ?, ?, ?)', [req.body.phoneNumber, req.body.purchaseQuantity, req.body.branch, req.body.round], (err, rows, fields) => {
        if (!err) {
          // 기록 후 지금까지의 구매 횟수 출력
          db.conn.query('SELECT SUM(quantity) AS countNumber FROM users WHERE phoneNumber=? GROUP BY round', [req.body.phoneNumber], (err, rows, fields) => {
            if (!err) {
              // 기록하고 구매내역 출력했으면
              res.json({
                "achievement": responseAchievment,
                "justEarned": true,
                "purchaseCount": {
                  "firstRoundCount": rows[0].countNumber,
                  "secondRoundCount": rows[1].countNumber
                }
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

/* 해당 유저의 토큰 목록을 받아옴 */
router.post('/api/rewards', (req, res, next) => {

});

/* 쿠폰 사용 */
router.post('/api/redeem', (req, res, next) => {

});

/* 토큰 발급 시스템 (끝남을 받아야 함) */
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

/* 1라운드 등 수 10등까지 */
async function getRoundOneRanking() {
  return new Promise((resolve, reject) => {
    db.conn.query('SELECT sum_quantity, phoneNumber FROM (SELECT phoneNumber, SUM(quantity) AS sum_quantity, round FROM users WHERE round=1 GROUP BY phoneNumber)t ORDER BY sum_quantity desc limit 10', (err, rows, fields) => {
      if (!err) {
        resolve(rows);
      } else {
        reject('get 1st ranking ', err);
      }
    })
  });
};

/* 2라운드 등 수 10등까지 */
async function getRoundTwoRanking() {
  return new Promise((resolve, reject) => {
    db.conn.query('SELECT sum_quantity, phoneNumber FROM (SELECT phoneNumber, SUM(quantity) AS sum_quantity, round FROM users WHERE round=2 GROUP BY phoneNumber)n ORDER BY sum_quantity desc limit 10', (err, rows, fields) => {
      if (!err) {
        resolve(rows);
      } else {
        reject('get 2nd ranking ', err);
      }
    })
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

// practice caver-js
// router.get('/contracts', (res, req, next) => {
//   tokenContract.methods.balanceOf('0x7930978144dfca9dfb66c5aeae94eb1472299df6').call().then(console.log)
// });

module.exports = router;