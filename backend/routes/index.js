const express = require('express');
const router = express.Router();
const path = require("path");
const request = require('request');
const config = require('../config/config.js');
const db = require('../config/db');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
const crypto = require('crypto');
const chain = require('../../chain');

/* GET home page. */
router.get('/', function (req, res, next) {
	res.sendFile(path.join(__dirname, "../public", "index.html"));
	db.conn.connect();
});

/* 게이지 새로고침 */
router.get('/api', async (req, res, next) => {
	try {
		let round = await calculateDate();

		if (round == 'outOfOrder') {
			let responseAchievment = await getAllAchievement(round);
			res.json({
				"achievement": responseAchievment
			});
		}
		else if (round == 1) {
			let responseAchievment = await getAllAchievement(round);
			res.json({
				"achievement": responseAchievment
			});
		}
		else if (round == 2) {
			let responseAchievment = await getAllAchievement(round);
			res.json({
				"achievement": responseAchievment
			});
		}
	}
	catch (e) {
		throw e
	}
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
		// round 1 user counts
		let responseRoundOneUserCounts = await getRoundOneCounts(req.body.phoneNumber);
		// round 2 user counts
		let responseRoundTwoUserCounts = await getRoundTwoCounts(req.body.phoneNumber);

		// get wallet address
		db.conn.query('SELECT address FROM wallet WHERE phoneNumber=?', [req.body.phoneNumber], async (err, rows, fields) => {
			if (err) {
				console.log('get wallet address error ', err);
			}
			// 등록된 전화번호가 없으면
			else if (rows[0] == null) {
				// KAS로 wallet 생성
				let wallet = await createWalletWithKAS();
				// db에 새 지갑주소 등록
				db.conn.query('INSERT INTO wallet VALUES (?, ?, ?)', [req.body.phoneNumber, JSON.parse(wallet).result.address, JSON.parse(wallet).result.public_key], (err, rows, fields) => {
					if (!err) {
						res.json({
							"achievement": responseAchievment,
							"currentUser": {
								"phoneNumber": req.body.phoneNumber,
								"purchaseCount": {
									"firstRound": responseRoundOneUserCounts,
									"secondRound": responseRoundTwoUserCounts
								},
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
			}
			// 등록된 전화번호가 존재하면
			else {
				res.json({
					"achievement": responseAchievment,
					"currentUser": {
						"phoneNumber": req.body.phoneNumber,
						"purchaseCount": {
							"firstRound": responseRoundOneUserCounts,
							"secondRound": responseRoundTwoUserCounts
						},
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
		// 라운드 체크
		let round = await calculateDate();

		if (round == 'outOfOrder') {
			res.send('event is outdated')
		}
		else if (round == 1) {
			// 1라운드 랭킹 쿼리
			let roundOneRanking = await getRoundOneRanking();

			// 값 넣기
			function putValuesToRoundOneRanking() {
				return new Promise(async (resolve, reject) => {
					let rankings = {
						first: {
							quantity: 0,
							userPhoneNumbers: []
						},
						second: {
							quantity: 0,
							userPhoneNumbers: []
						},
						third: {
							quantity: 0,
							userPhoneNumbers: []
						}
					}
					for (let i = 0; i < roundOneRanking.length; i++) {
						if (roundOneRanking[i].ranking == '1') {
							rankings.first.quantity = roundOneRanking[i].sumQuantities
							let cryptoNumber1 = await cipherPhoneNumber(roundOneRanking[i].phoneNumber)
							rankings.first.userPhoneNumbers.push(cryptoNumber1)
						}
						else if (roundOneRanking[i].ranking == '2') {
							rankings.second.quantity = roundOneRanking[i].sumQuantities
							let cryptoNumber2 = await cipherPhoneNumber(roundOneRanking[i].phoneNumber)
							rankings.second.userPhoneNumbers.push(cryptoNumber2)
						}
						else if (roundOneRanking[i].ranking == '3') {
							rankings.third.quantity = roundOneRanking[i].sumQuantities
							let cryptoNumber3 = await cipherPhoneNumber(roundOneRanking[i].phoneNumber)
							rankings.third.userPhoneNumbers.push(cryptoNumber3)
						}
					}
					resolve(rankings)
				});
			};
			let rankingData = await putValuesToRoundOneRanking();

			res.json({
				"rankings": rankingData
			})
		}
		else if (round == 2) {
			// 2라운드 랭킹 쿼리
			let roundOneRanking = await getRoundTwoRanking();

			// 값 넣기
			function putValuesToRoundTwoRanking() {
				return new Promise(async (resolve, reject) => {
					let rankings = {
						first: {
							quantity: 0,
							userPhoneNumbers: []
						},
						second: {
							quantity: 0,
							userPhoneNumbers: []
						},
						third: {
							quantity: 0,
							userPhoneNumbers: []
						}
					}

					for (let i = 0; i < roundOneRanking.length; i++) {
						if (roundOneRanking[i].ranking == '1') {
							rankings.first.quantity = roundOneRanking[i].sumQuantities
							let cryptoNumber1 = await cipherPhoneNumber(roundOneRanking[i].phoneNumber)
							rankings.first.userPhoneNumbers.push(cryptoNumber1)
						}
						else if (roundOneRanking[i].ranking == '2') {
							rankings.second.quantity = roundOneRanking[i].sumQuantities
							let cryptoNumber2 = await cipherPhoneNumber(roundOneRanking[i].phoneNumber)
							rankings.second.userPhoneNumbers.push(cryptoNumber2)
						}
						else if (roundOneRanking[i].ranking == '3') {
							rankings.third.quantity = roundOneRanking[i].sumQuantities
							let cryptoNumber3 = await cipherPhoneNumber(roundOneRanking[i].phoneNumber)
							rankings.third.userPhoneNumbers.push(cryptoNumber3)
						}
					}
					resolve(rankings)
				});
			};
			let rankingData = await putValuesToRoundTwoRanking();

			res.json({
				"rankings": rankingData
			})
		}
	} catch (e) {
		throw e
	}
});

/* 적립하는 api */
router.post('/api/verify', async (req, res, next) => {
	try {
		// get today's date
		let round = await calculateDate();

		// 행사 시기가 아니면 결제 x
		if (round == 'outOfOrder') {
			res.send('verify is out of order!');
		} else {
			// get achievement
			let responseAchievment = await getAllAchievement(round);

			// 목표치 달성 전이면
			if (responseAchievment < 1) {
				// db에 구매내역 기록
				db.conn.query('INSERT INTO users (phoneNumber, quantity, place, round) VALUES (?, ?, ?, ?)', [req.body.phoneNumber, req.body.purchaseQuantity, req.body.branch, round], async (err, rows, fields) => {
					if (!err) {
						// get wallet address('0x' 형태로 잘 나옴)
						let address = await getWalletAddress(req.body.phoneNumber)
						// chain에 구매내역 기록
						chain.updateRecord(address, round, req.body.purchaseQuantity)
						// 지금까지의 구매 횟수 출력
						let counts = await getBuyingCounts(round, req.body.phoneNumber);
						// round 1 user quantities
						let responseRoundOneQuantities = await getRoundOneQuantities(req.body.phoneNumber);
						// round 2 user quantities
						let responseRoundTwoQuantities = await getRoundTwoQuantities(req.body.phoneNumber);
						// round 1 user counts
						let responseRoundOneUserCounts = await getRoundOneCounts(req.body.phoneNumber);
						// round 2 user counts
						let responseRoundTwoUserCounts = await getRoundTwoCounts(req.body.phoneNumber);
						// 목표치 달성 다시 확인
						let checkMission = await getAllAchievement(round);

						// 목표 달성하면
						if (checkMission >= 1) {
							// 쿠폰 발급
							await mintFreeCoupon(round);
							await mintPlusCoupon(round);

							res.json({
								"achievement": checkMission,
								"justEarned": true,
								"purchaseCountNow": counts,
								"purchaseQuantity": {
									"firstRound": responseRoundOneQuantities,
									"secondRound": responseRoundTwoQuantities
								},
								"purchaseCount": {
									"firstRound": responseRoundOneUserCounts,
									"secondRound": responseRoundTwoUserCounts
								}
							});
						}
						// 목표 달성 전이면
						else {
							res.json({
								"achievement": checkMission,
								"justEarned": true,
								"purchaseCountNow": counts,
								"purchaseQuantity": {
									"firstRound": responseRoundOneQuantities,
									"secondRound": responseRoundTwoQuantities
								},
								"purchaseCount": {
									"firstRound": responseRoundOneUserCounts,
									"secondRound": responseRoundTwoUserCounts
								}
							});
						}
					}
					else {
						console.log('insert qunatities error ', err);
					}
				});
			}
			else if (responseAchievment >= 1) {
				res.send("mission is complete")
			}
		}
	} catch (e) {
		throw e
	}
});

/* 해당 유저의 토큰 목록을 받아옴 */
router.post('/api/rewards', async (req, res, next) => {
	try {
		// 쿠폰기간 체크
		let couponDate = await calculateCouponDate();

		if (couponDate == 'outOfOrder' || couponDate == 2) {
			// 쿠폰 만료 기입
			await insertExpired(couponDate);

			// 유저 쿠폰토큰 상태 쿼리
			let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
			if (tokenStatus[0] == undefined) {
				res.json({
					rewards: {
						"firstRoundPlus": null,
						"firstRoundFree": null,
						"secondRoundPlus": null,
						"secondRoundFree": null
					}
				})
			}
			else {
				res.json({
					rewards: {
						"firstRoundPlus": tokenStatus[0].token1_plus,
						"firstRoundFree": tokenStatus[0].token1_free,
						"secondRoundPlus": tokenStatus[0].token2_plus,
						"secondRoundFree": tokenStatus[0].token2_free
					}
				})
			}
		}
		else if (couponDate == 1 || couponDate == 12) {
			// 유저 쿠폰토큰 상태 쿼리
			let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
			if (tokenStatus[0] == undefined) {
				res.json({
					rewards: {
						"firstRoundPlus": null,
						"firstRoundFree": null,
						"secondRoundPlus": null,
						"secondRoundFree": null
					}
				})
			}
			else {
				res.json({
					rewards: {
						"firstRoundPlus": tokenStatus[0].token1_plus,
						"firstRoundFree": tokenStatus[0].token1_free,
						"secondRoundPlus": tokenStatus[0].token2_plus,
						"secondRoundFree": tokenStatus[0].token2_free
					}
				})
			}
		}
	}
	catch (e) {
		throw e
	}
});

/* 쿠폰 사용 */
router.post('/api/redeem', async (req, res, next) => {
	try {
		// 쿠폰 기간 체크
		let couponDate = await calculateCouponDate();

		// 모든 쿠폰 사용 불가
		if (couponDate == 'outOfOrder') {

			// 2차 쿠폰 만료
			await insertExpired(couponDate);

			//check status
			let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
			res.json({
				rewards: {
					"firstRoundPlus": tokenStatus[0].token1_plus,
					"firstRoundFree": tokenStatus[0].token1_free,
					"secondRoundPlus": tokenStatus[0].token2_plus,
					"secondRoundFree": tokenStatus[0].token2_free
				}
			})
		}
		// 1라운드 쿠폰만 사용가능하면
		else if (couponDate == 1) {
			// 1라운드 쿠폰이면
			if (req.body.rewardType == 'firstRoundPlus' || req.body.rewardType == 'firstRoundFree') {
				// use round 1 plus
				if (req.body.rewardType == 'firstRoundPlus') {
					// get wallet address
					let address = await getWalletAddress(req.body.phoneNumber)
					// transfer first round plus
					let transferNFT = chain.transferFrom(address, parseInt(req.body.phoneNumber + "1"))
					console.log(transferNFT)
					db.conn.query('UPDATE users SET token1_plus="used" WHERE token1_plus="unused" AND phoneNumber=?', [req.body.phoneNumber], (err, rows, fields) => {
						if (err) {
							throw err
						} else {
							return rows
						}
					})
					//check status
					let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
					res.json({
						rewards: {
							"firstRoundPlus": tokenStatus[0].token1_plus,
							"firstRoundFree": tokenStatus[0].token1_free,
							"secondRoundPlus": tokenStatus[0].token2_plus,
							"secondRoundFree": tokenStatus[0].token2_free
						}
					})
				}
				// use round 1 free
				else if (req.body.rewardType == 'firstRoundFree') {
					// get wallet address
					let address = await getWalletAddress(req.body.phoneNumber)
					// transfer first free plus
					chain.transferFrom(parseInt(address, req.body.phoneNumber + "2"))
					db.conn.query('UPDATE users SET token1_free="used" WHERE token1_free="unused" AND phoneNumber=?', [req.body.phoneNumber], (err, rows, fields) => {
						if (err) {
							throw err
						} else {
							return rows
						}
					})
					//check status
					let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
					res.json({
						rewards: {
							"firstRoundPlus": tokenStatus[0].token1_plus,
							"firstRoundFree": tokenStatus[0].token1_free,
							"secondRoundPlus": tokenStatus[0].token2_plus,
							"secondRoundFree": tokenStatus[0].token2_free
						}
					})
				}

			}
			// 2라운드 쿠폰이면
			else {
				//check status
				let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
				res.json({
					rewards: {
						"firstRoundPlus": tokenStatus[0].token1_plus,
						"firstRoundFree": tokenStatus[0].token1_free,
						"secondRoundPlus": tokenStatus[0].token2_plus,
						"secondRoundFree": tokenStatus[0].token2_free
					}
				})
			}
		}
		// 1 2 라운드 모든 쿠폰 사용가능하면
		else if (couponDate == 12) {
			// 1라운드 plus coupon 사용
			if (req.body.rewardType == 'firstRoundPlus') {
				// get wallet address
				let address = await getWalletAddress(req.body.phoneNumber)
				// transfer first round plus
				chain.transferFrom(parseInt(address, req.body.phoneNumber + "1"))
				db.conn.query('UPDATE users SET token1_plus="used" WHERE token1_plus="unused" AND phoneNumber=?', [req.body.phoneNumber], (err, rows, fields) => {
					if (err) {
						throw err
					} else {
						return rows
					}
				})
				//check status
				let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
				res.json({
					rewards: {
						"firstRoundPlus": tokenStatus[0].token1_plus,
						"firstRoundFree": tokenStatus[0].token1_free,
						"secondRoundPlus": tokenStatus[0].token2_plus,
						"secondRoundFree": tokenStatus[0].token2_free
					}
				})
			}
			// 1라운드 free coupon 사용
			else if (req.body.rewardType == 'firstRoundFree') {
				// get wallet address
				let address = await getWalletAddress(req.body.phoneNumber)
				// transfer first round plus
				chain.transferFrom(address, parseInt(req.body.phoneNumber + "2"))
				db.conn.query('UPDATE users SET token1_free="used" WHERE token1_free="unused" AND phoneNumber=?', [req.body.phoneNumber], (err, rows, fields) => {
					if (err) {
						throw err
					} else {
						return rows
					}
				})
				//check status
				let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
				res.json({
					rewards: {
						"firstRoundPlus": tokenStatus[0].token1_plus,
						"firstRoundFree": tokenStatus[0].token1_free,
						"secondRoundPlus": tokenStatus[0].token2_plus,
						"secondRoundFree": tokenStatus[0].token2_free
					}
				})
			}
			// 2라운드 plus coupon 사용
			else if (req.body.rewardType == 'secondRoundPlus') {
				// get wallet address
				let address = await getWalletAddress(req.body.phoneNumber)
				// transfer first round plus
				chain.transferFrom(address, parseInt(req.body.phoneNumber + "3"))
				db.conn.query('UPDATE users SET token2_plus="used" WHERE token2_plus="unused" AND phoneNumber=?', [req.body.phoneNumber], (err, rows, fields) => {
					if (err) {
						throw err
					} else {
						return rows
					}
				})
				//check status
				let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
				res.json({
					rewards: {
						"firstRoundPlus": tokenStatus[0].token1_plus,
						"firstRoundFree": tokenStatus[0].token1_free,
						"secondRoundPlus": tokenStatus[0].token2_plus,
						"secondRoundFree": tokenStatus[0].token2_free
					}
				})
			}
			// 2라운드 free coupon 사용
			else if (req.body.rewardType == 'secondRoundFree') {
				// get wallet address
				let address = await getWalletAddress(req.body.phoneNumber)
				// transfer first round plus
				chain.transferFrom(address, parseInt(req.body.phoneNumber + "4"))
				db.conn.query('UPDATE users SET token2_free="used" WHERE token2_free="unused" AND phoneNumber=?', [req.body.phoneNumber], (err, rows, fields) => {
					if (err) {
						throw err
					} else {
						return rows
					}
				})
				//check status
				let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
				res.json({
					rewards: {
						"firstRoundPlus": tokenStatus[0].token1_plus,
						"firstRoundFree": tokenStatus[0].token1_free,
						"secondRoundPlus": tokenStatus[0].token2_plus,
						"secondRoundFree": tokenStatus[0].token2_free
					}
				})
			}
		}
		// 2 라운드 쿠폰만 사용가능하면
		else if (couponDate == 2) {
			// 2라운드 쿠폰이면
			if (req.body.rewardType == 'secondRoundPlus' || req.body.rewardType == 'secondRoundFree') {

				// 2라운드 plus coupon 사용
				if (req.body.rewardType == 'secondRoundPlus') {
					// get wallet address
					let address = await getWalletAddress(req.body.phoneNumber)
					// transfer first round plus
					chain.transferFrom(address, parseInt(req.body.phoneNumber + "3"))
					db.conn.query('UPDATE users SET token2_plus="used" WHERE token2_plus="unused" AND phoneNumber=?', [req.body.phoneNumber], (err, rows, fields) => {
						if (err) {
							throw err
						} else {
							return rows
						}
					})
					//check status
					let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
					res.json({
						rewards: {
							"firstRoundPlus": tokenStatus[0].token1_plus,
							"firstRoundFree": tokenStatus[0].token1_free,
							"secondRoundPlus": tokenStatus[0].token2_plus,
							"secondRoundFree": tokenStatus[0].token2_free
						}
					})
				}
				// 2라운드 free coupon 사용
				else if (req.body.rewardType == 'secondRoundFree') {
					// get wallet address
					let address = await getWalletAddress(req.body.phoneNumber)
					// transfer first round plus
					chain.transferFrom(address, parseInt(req.body.phoneNumber + "4"))
					db.conn.query('UPDATE users SET token2_free="used" WHERE token2_free="unused" AND phoneNumber=?', [req.body.phoneNumber], (err, rows, fields) => {
						if (err) {
							throw err
						} else {
							return rows
						}
					})
					//check status
					let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
					res.json({
						rewards: {
							"firstRoundPlus": tokenStatus[0].token1_plus,
							"firstRoundFree": tokenStatus[0].token1_free,
							"secondRoundPlus": tokenStatus[0].token2_plus,
							"secondRoundFree": tokenStatus[0].token2_free
						}
					})
				}

			}
			// 1라운드 쿠폰이면
			else {
				// 1차 쿠폰 만료
				await insertExpired(couponDate);

				//check status
				let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
				res.json({
					rewards: {
						"firstRoundPlus": tokenStatus[0].token1_plus,
						"firstRoundFree": tokenStatus[0].token1_free,
						"secondRoundPlus": tokenStatus[0].token2_plus,
						"secondRoundFree": tokenStatus[0].token2_free
					}
				})
			}
		}
	}
	catch (e) {
		throw e
	}
});

router.post('/test', async (req, res, next) => {
	let address = await getWalletAddress(req.body.phoneNumber);
	console.log(address)
	db.conn.query('SELECT phoneNumber FROM users', (err, rows, fields) => {
		if (!err) {
			console.log(rows)
		} else {
			throw err
		}
	})
})

/****************************************************************************************************************************/

/* 현재 총 잔 수 */
async function getAllAchievement(round) {
	return new Promise((resolve, reject) => {
		db.conn.query('SELECT SUM(quantity) AS sumQuantities FROM users WHERE round=?', [round], (err, rows, fields) => {
			if (!err) {
				if (round == 1) {
					//resolve((rows[0].sumQuantities / 4862).toFixed(4))
					resolve((rows[0].sumQuantities / 130).toFixed(4))
				}
				else if (round == 2) {
					resolve((rows[0].sumQuantities / 5968).toFixed(4))
					//resolve((rows[0].sumQuantities / 35).toFixed(4))
				}
				else if (round == 'outOfOrder') {
					resolve('event is outdated')
				}
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

/* 1라운드 구매 횟 수*/
async function getRoundOneCounts(phoneNumber) {
	return new Promise((resolve, reject) => {
		db.conn.query('SELECT COUNT(quantity) AS counts FROM users WHERE phoneNumber=? AND round=1', [phoneNumber], (err, rows, fields) => {
			if (!err) {
				resolve(rows[0].counts)
			} else {
				reject('get 1st counts error ', err)
			}
		})
	});
};

/* 2라운드 구매 횟수*/
async function getRoundTwoCounts(phoneNumber) {
	return new Promise((resolve, reject) => {
		db.conn.query('SELECT COUNT(quantity) AS counts FROM users WHERE phoneNumber=? AND round=2', [phoneNumber], (err, rows, fields) => {
			if (!err) {
				resolve(rows[0].counts)
			} else {
				reject('get 2st counts error ', err)
			}
		})
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

/* 1라운드 랭킹 */
async function getRoundOneRanking() {
	return new Promise((resolve, reject) => {
		db.conn.query('SELECT sumQuantities, phoneNumber, ranking FROM(SELECT sumQuantities, phoneNumber, (@rank:=IF(@last > sumQuantities, @rank:=@rank+1, @rank)) AS ranking, (@last:=sumQuantities) FROM (SELECT phoneNumber, SUM(quantity) AS sumQuantities, round FROM users WHERE round=1 GROUP BY phoneNumber)t, (SELECT @rank:=1, @last:=0) AS b ORDER BY sumQuantities DESC)n WHERE ranking < 4', (err, rows, fields) => {
			if (!err) {
				resolve(rows);
			} else {
				reject('get 1st ranking ', err);
			}
		})
	});
};


/* 2라운드 랭킹 */
async function getRoundTwoRanking() {
	return new Promise((resolve, reject) => {
		db.conn.query('SELECT sumQuantities, phoneNumber, ranking FROM(SELECT sumQuantities, phoneNumber, (@rank:=IF(@last > sumQuantities, @rank:=@rank+1, @rank)) AS ranking, (@last:=sumQuantities) FROM (SELECT phoneNumber, SUM(quantity) AS sumQuantities, round FROM users WHERE round=2 GROUP BY phoneNumber)t, (SELECT @rank:=1, @last:=0) AS b ORDER BY sumQuantities DESC)n WHERE ranking < 4', (err, rows, fields) => {
			if (!err) {
				resolve(rows);
			} else {
				reject('get 2nd ranking ', err);
			}
		})
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

/* 유저 지갑 호출 */
async function getWalletAddress(phoneNumber) {
	return new Promise((resolve, reject) => {
		db.conn.query('SELECT address FROM wallet WHERE phoneNumber=?', [phoneNumber], (err, rows, fields) => {
			if (!err) {
				resolve(rows[0].address);
			} else {
				reject('get wallet address error db ', err)
			}
		})
	});
};

/* plus 쿠폰 발급 */
async function mintPlusCoupon(round) {
	return new Promise(async (resolve, reject) => {

		// db 값 unused로 변경
		if (round == 1) {
			db.conn.query('SELECT COUNT(quantity) AS counts, phoneNumber FROM users where round=1 GROUP BY phoneNumber having counts >= 3', async (err, rows, fields) => {
				if (err) {
					reject('get counts error ', err)
				} else {
					for (let i = 0; i < rows.length; i++) {
						// nft 발급
						let address = await getWalletAddress(rows[i].phoneNumber);
						let tokenId = parseInt(rows[i].phoneNumber + '1')
						chain.mintToken(address, tokenId, round, 'firstRoundPlus')

						db.conn.query('UPDATE users SET token1_plus="unused" WHERE token1_plus is null AND phoneNumber=?', [rows[i].phoneNumber], (err, result, fields) => {
							if (err) {
								reject('insert round1 unused error ', err)
							} else {
								resolve(result)
							}
						})
					}
				}
			})
		}
		else if (round == 2) {
			db.conn.query('SELECT COUNT(quantity) AS counts, phoneNumber FROM users where round=2 GROUP BY phoneNumber having counts >= 3', async (err, rows, fields) => {
				if (err) {
					reject('insert round2 unused error ', err);
				} else {
					for (let i = 0; i < rows.length; i++) {
						// nft 발급
						let address = await getWalletAddress(rows[i].phoneNumber);
						let tokenId = parseInt(rows[i].phoneNumber + '3')
						chain.mintToken(address, tokenId, round, 'secondRoundPlus')

						db.conn.query('UPDATE users SET token2_plus="unused" WHERE token2_plus is null AND phoneNumber=?', [rows[i].phoneNumber], (err, result, fields) => {
							if (err) {
								reject('insert round2 unused error ', err)
							} else {
								resolve(result)
							}
						})
					}
				}
			});
		}
	});
};

/* free 쿠폰 발급 */
async function mintFreeCoupon(round) {
	return new Promise(async (resolve, resject) => {

		// db 값 unused로 변경
		if (round == 1) {
			let roundOneRanker = await getRoundOneRanking();

			for (let i = 0; i < roundOneRanker.length; i++) {
				// nft 발급
				let address = await getWalletAddress(roundOneRanker[i].phoneNumber);
				let tokenId = parseInt(roundOneRanker[i].phoneNumber + '2')
				let coupon = await chain.mintToken(address, tokenId, round, 'firstRoundFree')
				console.log('되라아앙아아아잉 \n', coupon)

				db.conn.query('UPDATE users SET token1_free="unused" WHERE token1_free is null  AND phoneNumber=?', [roundOneRanker[i].phoneNumber], (err, rows, fields) => {
					if (err) {
						reject('insert unused error i ', err)
					} else {
						resolve(rows)
					}
				})
			}

		}
		else if (round == 2) {
			let roundTwoRanker = await getRoundTwoRanking();

			for (let j = 0; j < roundTwoRanker.length; j++) {
				// nft 발급
				let address = await getWalletAddress(roundTwoRanker[j].phoneNumber);
				let tokenId = parseInt(roundTwoRanker[j].phoneNumber + '4')
				chain.mintToken(address, tokenId, round, 'secondRoundFree')

				db.conn.query('UPDATE users SET token2_free="unused" WHERE token2_free is null AND phoneNumber=?', [roundTwoRanker[j].phoneNumber], (err, rows, fields) => {
					if (err) {
						reject('insert unused error j ', err)
					} else {
						resolve(rows)
					}
				})
			}
		}
	})
}

/* 발급된 쿠폰의 사용기간이 종료되었을 때 */
async function insertExpired(couponDate) {
	return new Promise((resolve, reject) => {
		if (couponDate == 2) {
			db.conn.query('UPDATE users SET token1_plus="expired" WHERE token1_plus="unused"', (err, rows, fields) => {
				if (err) {
					reject('insert expired token1_plus error ', err);
				} else {
					db.conn.query('UPDATE users SET token1_free="expired" WHERE token1_free="unused"', (err, rows, fields) => {
						if (err) {
							reject('insert expired token1_free error ', err);
						} else {
							resolve(rows)
						}
					})
				}
			})
		}
		else if (couponDate == 'outOfOrder') {
			db.conn.query('UPDATE users SET token2_plus="expired" WHERE token2_plus="unused"', (err, rows, fields) => {
				if (err) {
					reject('insert expired token2_plus error ', err);
				} else {
					db.conn.query('UPDATE users SET token2_free="expired" WHERE token2_free="unused"', (err, rows, fields) => {
						if (err) {
							reject('insert expired token2_free error ', err);
						} else {
							resolve(rows)
						}
					})
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
		} else if (moment().isBetween('2020-08-18', '2020-08-24', 'date', '[]') == true) {
			resolve(2);
		} else {
			resolve('outOfOrder');
		}
	});
};

/* 쿠폰 기간 계산 */
async function calculateCouponDate() {
	return new Promise((resolve, reject) => {
		if (moment().isBetween('2020-08-11', '2020-08-12', 'date', '[]' /*'2020-08-18', '2020-08-24', 'date', '[]'*/) == true) {
			resolve(1);
		} else if (moment().isBetween('2020-08-25', '2020-08-31', 'date', '[]') == true) {
			resolve(12);
		} else if (moment().isBetween('2020-09-01', '2020-09-07', 'date', '[]') == true) {
			resolve(2);
		} else {
			resolve('outOfOrder');
		}
	});
};

/* KAS 지갑 생성 */
async function createWalletWithKAS() {
	return new Promise((resolve, reject) => {
		request(creatingWalletOptions, (error, response, body) => {
			if (error) {
				reject('kas error ', error)
			}
			else if (response.statusCode == 200) {
				resolve(body)
			}
		})
	})
}

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
		'x-krn': 'krn:8217:wallet:116:account:default',
		'Authorization': 'Basic ' + config.auth.kasAuth
	}
};

module.exports = router;
