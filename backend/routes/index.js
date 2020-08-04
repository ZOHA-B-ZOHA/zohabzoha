const express = require('express');
const router = express.Router();
const path = require("path");
const request = require('request');
const config = require('../config/config.js');
const db = require('../config/db');
const moment = require('moment');
const crypto = require('crypto');
const abi = require('../config/abi');
const Caver = require('caver-js');
const caver = new Caver('https://api.baobab.klaytn.net:8651/'); // 사용시에는 cypress로 바꾸자!!
const tokenContract = new caver.klay.Contract(abi.abi, '0xcddd2f0b23f033eb85AFE5510e5285261bF68154');

/* GET home page. */
router.get('/', function (req, res, next) {
	res.sendFile(path.join(__dirname, "../public", "index.html"));
});

/* 게이지 새로고침 */
router.get('/api', async (req, res, next) => {
	let round = await calculateDate();
	let responseAchievment = await getAllAchievement(round);

	res.json({
		"achievement": responseAchievment
	});
});

/* 전화번호 입력 후 접속 */
router.post('/api/authenticate', async (req, res, next) => {
	try {
		// get round
		let round = await calculateDate()

		// get achievement
		let responseAchievment = await getAllAchievement(round);

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
router.post('/api/rankings', async (req, res, next) => {
	try {
		// 1라운드 랭킹 쿼리
		let roundOneRanking = await getRoundOneRanking();
		// 2라운드 랭킹 쿼리
		let roundTwoRanking = await getRoundTwoRanking();

		// 전화번호 암호화
		for (let i = 0; i < 5; i++) {
			let cryptoNumber1 = await cipherPhoneNumber(roundOneRanking[i].phoneNumber)
			roundOneRanking[i].phoneNumber = cryptoNumber1
			let cryptoNumber2 = await cipherPhoneNumber(roundTwoRanking[i].phoneNumber)
			roundTwoRanking[i].phoneNumber = cryptoNumber2
		}

		// response
		// 각각 객체이며 0~4 값으로 이루어져 있습니다. 사용법은 아래와 같습니다
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
router.post('/api/verify', async (req, res, next) => {
	try {
		// get today's date
		let round = await calculateDate();

		// get achievement
		let responseAchievment = await getAllAchievement(round);

		// 행사 시기가 아니면 결제 x
		if (round == 'outOfOrder') {
			res.send('verify is out of order!');
		} else {
			// 목표치 달성 전이면
			if (responseAchievment < 1) {
				if (req.body.verificationCode == config.auth.qrCodePassword) { // 여기에 qr code 값을 넣장

					// db에 구매내역 기록
					db.conn.query('INSERT INTO users (phoneNumber, quantity, place, round) VALUES (?, ?, ?, ?)', [req.body.phoneNumber, req.body.purchaseQuantity, req.body.branch, round], (err, rows, fields) => {
						if (!err) {
							// 기록 후 지금까지의 구매 수량 출력
							db.conn.query('SELECT SUM(quantity) AS countNumber FROM users WHERE phoneNumber=? GROUP BY round', [req.body.phoneNumber], async (err, rows, fields) => {
								if (!err) {
									// 지금까지의 구매 횟수 출력
									let counts = await getBuyingCounts(round, req.body.phoneNumber);

									// 조건에 맞다면 unavailable 입력
									await insertUnavailable(req.body.phoneNumber, counts, round);

									// 목표치 달성 다시 확인
									let checkMission = await getAllAchievement(round);

									if (checkMission >= 1) {

										// 토큰 발급
										await insertUnused(round);

										res.json({
											"achievement": responseAchievment,
											"justEarned": true,
											"purchaseCount": counts,
											"purchaseQuantity": {
												"firstRoundCount": rows[0].countNumber,
												"secondRoundCount": rows[1].countNumber
											},
											"complete": true
										});
									} else {
										res.json({
											"achievement": responseAchievment,
											"justEarned": true,
											"purchaseCount": counts,
											"purchaseQuantity": {
												"firstRoundCount": rows[0].countNumber,
												"secondRoundCount": rows[1].countNumber
											},
											"complete": false
										});
									}
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
			} else if (responseAchievment >= 1) {
				res.send("mission is complete")
			}
		}
	} catch (e) {
		throw e
	}
});

/* 해당 유저의 토큰 목록을 받아옴 */
router.post('/api/rewards', async (req, res, next) => {
	// 쿠폰 기간 체크
	let couponDate = await calculateCouponDate();
	let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
	let firstRoundPlus = tokenStatus[0].token1_plus;
	let firstRoundFree = tokenStatus[0].token1_free;
	let secondRoundPlus = tokenStatus[0].token2_plus;
	let secondRoundFree = tokenStatus[0].token2_free;
	res.json({
		rewards: {
			"firstRoundPlus": firstRoundPlus,
			"firstRooundFree": firstRoundFree,
			"secondRoundPlus": secondRoundPlus,
			"secondRoundFree": secondRoundFree
		}
	})
});

/* 쿠폰 사용 */
router.post('/api/redeem', async (req, res, next) => {
	// 쿠폰 기간 체크
	let couponDate = await calculateCouponDate();
	console.log(typeof(couponDate))
	// 모든 쿠폰 사용 불가
	if (couponDate == 'outOfOrder') {
		console.log('여긴 맞을 듯')
		// 2차 쿠폰 만료
		await insertExpired(couponDate);
		console.log('여기로 와야 함')
		//check status
		let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
		res.json({
			"firstRoundPlus": tokenStatus[0].token1_plus,
			"firstRoundFree": tokenStatus[0].token1_free,
			"secondRoundPlus": tokenStatus[0].token2_plus,
			"secondRoundFree": tokenStatus[0].token2_free
		})
	}
	else if (couponDate == 1) {
		if (req.body.rewardType == 'firstRoundPlus' || req.body.rewardType == 'firstRoundFree') {
			// use round 1 plus
			if (req.body.rewardType == 'firstRoundPlus') {
				db.conn.query('UPDATE users SET token1_plus = "used" WHERE token1_plus = "unused" AND phoneNumber=?', [req.body.phoneNumber], (err, rows, fields) => {
					if (err) {
						throw err
					}
				})
				//check status
				let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
				res.json({
					"firstRoundPlus": tokenStatus[0].token1_plus,
					"firstRoundFree": tokenStatus[0].token1_free,
					"secondRoundPlus": tokenStatus[0].token2_plus,
					"secondRoundFree": tokenStatus[0].token2_free
				})
			}
			// use round 1 free
			else if (req.body.rewardType == 'firstRoundFree') {
				db.conn.query('UPDATE users SET token1_free = "used" WHERE token1_free = "unused" AND phoneNumber=?', [req.body.phoneNumber], (err, rows, fields) => {
					if (err) {
						throw err
					}
				})
				//check status
				let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
				res.json({
					"firstRoundPlus": tokenStatus[0].token1_plus,
					"firstRoundFree": tokenStatus[0].token1_free,
					"secondRoundPlus": tokenStatus[0].token2_plus,
					"secondRoundFree": tokenStatus[0].token2_free
				})
			}

		} else {
			//check status
			let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
			res.json({
				"firstRoundPlus": tokenStatus[0].token1_plus,
				"firstRoundFree": tokenStatus[0].token1_free,
				"secondRoundPlus": tokenStatus[0].token2_plus,
				"secondRoundFree": tokenStatus[0].token2_free
			})
		}
	}
	else if (couponDate == 12) {

		if (req.body.rewardType == 'firstRoundPlus') {
			db.conn.query('UPDATE users SET token1_plus = "used" WHERE token1_plus = "unused" AND phoneNumber=?', [req.body.phoneNumber], (err, rows, fields) => {
				if (err) {
					throw err
				}
			})
			//check status
			let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
			res.json({
				"firstRoundPlus": tokenStatus[0].token1_plus,
				"firstRoundFree": tokenStatus[0].token1_free,
				"secondRoundPlus": tokenStatus[0].token2_plus,
				"secondRoundFree": tokenStatus[0].token2_free
			})
		}
		else if (req.body.rewardType == 'firstRoundFree') {
			db.conn.query('UPDATE users SET token1_free = "used" WHERE token1_free = "unused" AND phoneNumber=?', [req.body.phoneNumber], (err, rows, fields) => {
				if (err) {
					throw err
				}
			})
			//check status
			let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
			res.json({
				"firstRoundPlus": tokenStatus[0].token1_plus,
				"firstRoundFree": tokenStatus[0].token1_free,
				"secondRoundPlus": tokenStatus[0].token2_plus,
				"secondRoundFree": tokenStatus[0].token2_free
			})
		}
		else if (req.body.rewardType == 'secondRoundPlus') {
			db.conn.query('UPDATE users SET token2_plus = "used" WHERE token2_plus = "unused" AND phoneNumber=?', [req.body.phoneNumber], (err, rows, fields) => {
				if (err) {
					throw err
				}
			})
			//check status
			let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
			res.json({
				"firstRoundPlus": tokenStatus[0].token1_plus,
				"firstRoundFree": tokenStatus[0].token1_free,
				"secondRoundPlus": tokenStatus[0].token2_plus,
				"secondRoundFree": tokenStatus[0].token2_free
			})
		}
		else if (req.body.rewardType == 'secondRoundFree') {
			db.conn.query('UPDATE users SET token2_free = "used" WHERE token2_free = "unused" AND phoneNumber=?', [req.body.phoneNumber], (err, rows, fields) => {
				if (err) {
					throw err
				}
			})
			//check status
			let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
			res.json({
				"firstRoundPlus": tokenStatus[0].token1_plus,
				"firstRoundFree": tokenStatus[0].token1_free,
				"secondRoundPlus": tokenStatus[0].token2_plus,
				"secondRoundFree": tokenStatus[0].token2_free
			})
		}
	}
	else if (couponDate == 2) {
		if (req.body.rewardType == 'secondRoundPlus' || req.body.rewardType == 'secondRoundFree') {

			if (req.body.rewardType == 'secondRoundPlus') {
				db.conn.query('UPDATE users SET token2_plus = "used" WHERE token2_plus = "unused" AND phoneNumber=?', [req.body.phoneNumber], (err, rows, fields) => {
					if (err) {
						throw err
					}
				})
				//check status
				let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
				res.json({
					"firstRoundPlus": tokenStatus[0].token1_plus,
					"firstRoundFree": tokenStatus[0].token1_free,
					"secondRoundPlus": tokenStatus[0].token2_plus,
					"secondRoundFree": tokenStatus[0].token2_free
				})
			}
			else if (req.body.rewardType == 'secondRoundFree') {
				db.conn.query('UPDATE users SET token2_free = "used" WHERE token2_free = "unused" AND phoneNumber=?', [req.body.phoneNumber], (err, rows, fields) => {
					if (err) {
						throw err
					}
				})
				//check status
				let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
				res.json({
					"firstRoundPlus": tokenStatus[0].token1_plus,
					"firstRoundFree": tokenStatus[0].token1_free,
					"secondRoundPlus": tokenStatus[0].token2_plus,
					"secondRoundFree": tokenStatus[0].token2_free
				})
			}

		} else {
			// 1차 쿠폰 만료
			await insertExpired(couponDate);

			//check status
			let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
			res.json({
				"firstRoundPlus": tokenStatus[0].token1_plus,
				"firstRoundFree": tokenStatus[0].token1_free,
				"secondRoundPlus": tokenStatus[0].token2_plus,
				"secondRoundFree": tokenStatus[0].token2_free
			})
		}
	} 
});

/****************************************************************************************************************************/

/* 현재 총 잔 수 */
async function getAllAchievement(round) {
	return new Promise((resolve, reject) => {
		db.conn.query('SELECT SUM(quantity) AS sumQuantities FROM users WHERE round=?', [round], (err, rows, fields) => {
			if (!err) {
				resolve((rows[0].sumQuantities / 5415).toFixed(3))
			}
			else {
				reject('get achievement error ', err);
			}
		});
	});
};

/* 유저가 구매한 횟 수 */
async function getBuyingCounts(round, phoneNumber) {
	return new Promise((resolve, reject) => {
		if (round == 1) {
			db.conn.query('SELECT COUNT(id) AS counts FROM users where phoneNumber=? AND round=1', [phoneNumber], (err, rows, fields) => {
				if (err) {
					throw err;
				} else {
					resolve(rows[0].counts);
				}
			})
		} else if (round == 2) {
			db.conn.query('SELECT COUNT(id) AS counts FROM users where phoneNumber=? AND round=2', [phoneNumber], (err, rows, fields) => {
				if (err) {
					throw err;
				} else {
					resolve(rows[0].counts);
				}
			})
		}
	})
}

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

/* 1라운드 등 수 5등까지 */
async function getRoundOneRanking() {
	return new Promise((resolve, reject) => {
		db.conn.query('SELECT sum_quantity, phoneNumber FROM (SELECT phoneNumber, SUM(quantity) AS sum_quantity, round FROM users WHERE round=1 GROUP BY phoneNumber)t ORDER BY sum_quantity desc limit 5', (err, rows, fields) => {
			if (!err) {
				resolve(rows);
			} else {
				reject('get 1st ranking ', err);
			}
		})
	});
};

/* 2라운드 등 수 5등까지 */
async function getRoundTwoRanking() {
	return new Promise((resolve, reject) => {
		db.conn.query('SELECT sum_quantity, phoneNumber FROM (SELECT phoneNumber, SUM(quantity) AS sum_quantity, round FROM users WHERE round=2 GROUP BY phoneNumber)n ORDER BY sum_quantity desc limit 5', (err, rows, fields) => {
			if (!err) {
				resolve(rows);
			} else {
				reject('get 2nd ranking ', err);
			}
		})
	});
};

/* 3회 구매 시 DB 값 변경 */
async function insertUnavailable(phoneNumber, counts, round) {
	return new Promise((resolve, reject) => {
		if (round == 1) {
			db.conn.query('SELECT token1_plus FROM users WHERE phoneNumber=?', [phoneNumber], (err, rows, fields) => {
				if (!err && rows[0].token1_plus == null && counts >= 3) {
					db.conn.query('UPDATE users SET token1_plus = "unavailable" WHERE token1_plus is null AND phoneNumber=?'[phoneNumber], (err, rows, fields) => {
						if (!err) {
							resolve(rows)
						} else {
							reject('insert unavailable error ', err)
						}
					})
				} else {
					reject('get token1_plus error ', err)
				}
			})
		}
		else if (round == 2) {
			db.conn.query('SELECT token2_plus FROM users WHERE phoneNumber=?', [phoneNumber], (err, rows, fields) => {
				if (!err && rows[0].token1_plus == null && counts >= 3) {
					db.conn.query('UPDATE users SET token2_plus = "unavailable" WHERE token2_plus is null AND phoneNumber=?'[phoneNumber], (err, rows, fields) => {
						if (!err) {
							resolve(rows)
						} else {
							reject('insert unavailable error ', err)
						}
					})
				} else {
					reject('get token1_plus error ', err)
				}
			})
		}
	});
};

/* 쿠폰상태 확인 */
async function checkTokenStatus(phoneNumber) {
	return new Promise((resolve, reject) => {
		db.conn.query('SELECT token1_plus, token1_free, token2_plus, token2_free FROM users WHERE phoneNumber=?', [phoneNumber], (err, rows, fields) => {
			if (!err) {
				resolve(rows);
			} else {
				reject('checkt token status error ', err);
			}
		})
	});
};

/* 쿠폰 발급 (사용하지 않았을 때) */
async function insertUnused(round) {
	return new Promise(async(resolve, reject) => {
		let ranking = await getRoundOneRanking();

		// 체인에서 token 발급

		// db 값 unused 로 변경
		if (round == 1) {
			db.conn.query('UPDATE users SET token1_plus = "unused" WHERE token1_plus = "unavailable"', (err, rows, fields) => {
				if (err) {
					reject('insert unused error ', err);
				}
			})
			for (let i = 0; i < 5; i++) {
				db.conn.query('UPDATE users SET token1_free = "unused" WHERE token1_free is null AND phoneNumber=?', [ranking[i].phoneNumber], (err, rows, fields) => {
					if (err) {
						reject('insert unused error i ', err)
					}
				})
			}
		}
		else if (round == 2) {
			db.conn.query('UPDATE users SET token2_plus = "unused" WHERE token2_plus = "unavailable"', (err, rows, fields) => {
				if (err) {
					reject('insert unused error ', err);
				}
			})
			for (let j = 0; j < 5; j++) {
				db.conn.query('UPDATE users SET token2_free = "unused" WHERE token2_free is null AND phoneNumber=?', [ranking[j].phoneNumber], (err, rows, fields) => {
					if (err) {
						reject('insert unused error j ', err)
					}
				})
			}
		}
	});
};

/* 발급된 쿠폰의 사용기간이 종료되었을 때 */
async function insertExpired(couponDate) {
	return new Promise((resolve, reject) => {
		if (couponDate == 2) {
			db.conn.query('UPDATE users SET token1_plus = "expired" WHERE token1_plus = "unused"', (err, rows, fields) => {
				if (err) {
					reject('insert expired token1_plus error ', err);
				}
			})
			db.conn.query('UPDATE users SET token1_free = "expired" WHERE token1_free = "unused"', (err, rows, fields) => {
				if (err) {
					reject('insert expired token1_free error ', err);
				}
			})
		}
		else if (couponDate == 'outOfOrder') {
			db.conn.query('UPDATE users SET token2_plus = "expired" WHERE token2_plus = "unused"', (err, rows, fields) => {
				if (err) {
					reject('insert expired token2_plus error ', err);
				}
			})
			db.conn.query('UPDATE users SET token2_free = "expired" WHERE token2_free = "unused"', (err, rows, fields) => {
				if (err) {
					reject('insert expired token2_free error ', err);
				}
			})
		}
	});
};

/* 라운드 계산 */
async function calculateDate() {
	return new Promise((resolve, reject) => {
		if (moment().isBetween('2020-08-10', '2020-08-14', 'date', '[]') == true) {
			resolve(1);
		} else if (moment().isBetween('2020-08-18', '2020-08-21', 'date', '[]') == true) {
			resolve(2);
		} else {
			resolve('outOfOrder');
		}
	});
};

/* 쿠폰 기간 계산 */
async function calculateCouponDate() {
	return new Promise((resolve, reject) => {
		if (moment().isBetween('2020-08-17', '2020-08-23', 'date', '[]') == true) {
			resolve(1);
		} else if (moment().isBetween('2020-08-24', '2020-08-30', 'date', '[]') == true) {
			resolve(12);
		} else if (moment().isBetween('2020-08-31', '2020-09-07', 'date', '[]') == true) {
			resolve(2);
		} else {
			resolve('outOfOrder');
		}
	});
};

/* 전화번호 암호화 */
async function cipherPhoneNumber(phoneNumber) {
	return new Promise((resolve, reject) => {
		const key = config.auth.encryptKey;
		const pass = crypto.createHash('sha256').update(String(key)).digest('base64').substr(0, 32);
		const iv = Buffer.from(key.slice(0, 16));
		const cipher = crypto.createCipheriv('aes-256-cbc', pass, iv);
		let result = cipher.update(phoneNumber, 'utf8', 'base64');
		result += cipher.final('base64');
		resolve(result);
	});
};

/* 전화번호 복호화 */
async function decipherPhoneNumber(cipheredPhoneNumber) {
	return new Promise((resolve, reject) => {
		const key = config.auth.encryptKey;
		const pass = crypto.createHash('sha256').update(String(key)).digest('base64').substr(0, 32);
		const iv = Buffer.from(key.slice(0, 16));
		const decipher = crypto.createDecipheriv('aes-256-cbc', pass, iv);
		let result = decipher.update(cipheredPhoneNumber, 'base64', 'utf8');
		result += decipher.final('utf8');
		resolve(result);
	});
};

/* request options */
// create wallet
const creatingWalletOptions = {
	method: "POST",
	preambleCRLF: true,
	postambleCRLF: true,
	url: 'https://wallet-api.beta.klaytn.io/v2/account',
	headers: {
		'Content-type': 'application/json',
		'x-krn': 'krn:1001:wallet:116:account:default',
		'Authorization': 'Basic ' + config.auth.kasAuth
	}
};


const contractUpdateRecordOptions = {
	method: "POST",
	preambleCRLF: true,
	postambleCRLF: true,
	url: 'https://wallet-api.beta.klaytn.io/v2/tx/contract/execute',
	headers: {
		'Content-type': 'application/json',
		'x-krn': 'krn:1001:wallet:116:account:default',
		'Authorization': 'Basic ' + config.auth.kasAuth
	},
	body: JSON.stringify({
		"from": "0x64297AE00b82e819c3AcD658cCF6EA3ee18Bc038",
		"value": "0x0",
		"to": "0xcddd2f0b23f033eb85AFE5510e5285261bF68154",
		"input": "0xbb16f4430000000000000000000000007930978144dfca9dfb66c5aeae94eb1472299df600000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002",
		"nonce": 0,
		"gas_limit": 2000000,
		"submit": true,
		"fee_ratio": 0
	})
};

// practice caver-js
router.post('/contracts', async (req, res, next) => {
	try {
		let encode = tokenContract.methods.updateRecord('0x7930978144dfca9dfb66c5aeae94eb1472299df6', 1, 2).encodeABI()
		tokenContract.methods.getTokenList('01087754055', 1).call((error, result) => {
			if (error) {
				throw error
			} else {
				console.log('1', result)
				console.log('2', result['0'])
				console.log('3', Object.keys(result));
			}
		})

		// tokenContract.methods.updateRecord('0x7930978144dfca9dfb66c5aeae94eb1472299df6', 1, 1).send({from: '0x64297AE00b82e819c3AcD658cCF6EA3ee18Bc038', gas: 2000000}, (error, receipt) => {
		// 	if (error) {
		// 		throw error
		// 	} else {
		// 		console.log(receipt)
		// 	}
		// })

		// request(contractUpdateRecordOptions, (error, response) => {
		// 	if (error) {
		// 		throw error
		// 	} else {
		// 		console.log(response.body)
		// 	}
		// })
	} catch (e) {
		throw e
	}
});

module.exports = router;
