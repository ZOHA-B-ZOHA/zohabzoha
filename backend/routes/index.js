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
					"currentUser": {
						"phoneNumber": req.body.phoneNumber,
						"purchaseCount": {
							"firstRound": responseRoundOneUserCounts,
							"seconRound": responseRoundTwoUserCounts
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
				// qr code 값이 맞으면
				if (req.body.verificationCode == config.auth.qrCodePassword) {
					// db에 구매내역 기록
					db.conn.query('INSERT INTO users (phoneNumber, quantity, place, round) VALUES (?, ?, ?, ?)', [req.body.phoneNumber, req.body.purchaseQuantity, req.body.branch, round], (err, rows, fields) => {
						if (!err) {
							// 기록 후 지금까지의 구매 수량 출력
							db.conn.query('SELECT SUM(quantity) AS sumQuantities FROM users WHERE phoneNumber=? GROUP BY round', [req.body.phoneNumber], async (err, rows, fields) => {
								if (!err) {
									// 지금까지의 구매 횟수 출력
									let counts = await getBuyingCounts(round, req.body.phoneNumber);
									// 목표치 달성 다시 확인
									let checkMission = await getAllAchievement(round);
									// round 1 user counts
									let responseRoundOneUserCounts = await getRoundOneCounts(req.body.phoneNumber);
									// round 2 user counts
									let responseRoundTwoUserCounts = await getRoundTwoCounts(req.body.phoneNumber);

									if (checkMission >= 1) {

										// 쿠폰 발급
										await mintFreeCoupon(round);
										await mintPlusCoupon(round);
										if (round == 1) {
											res.json({
												"achievement": checkMission,
												"justEarned": true,
												"purchaseCountNow": counts,
												"purchaseQuantity": {
													"firstRound": rows[0].sumQuantities,
													"secondRound": 0
												},
												"purchaseCount": {
													"firstRound": responseRoundOneUserCounts,
													"secoundRound": responseRoundTwoUserCounts
												}
											});
										}
										else if (round == 2) {
											res.json({
												"achievement": checkMission,
												"justEarned": true,
												"purchaseCountNow": counts,
												"purchaseQuantity": {
													"firstRound": rows[0].sumQuantities,
													"secondRound": rows[1].sumQuantities
												},
												"purchaseCount": {
													"firstRound": responseRoundOneUserCounts,
													"secoundRound": responseRoundTwoUserCounts
												}
											});
										}
									} else {
										if (round == 1) {
											res.json({
												"achievement": checkMission,
												"justEarned": true,
												"purchaseCountNow": counts,
												"purchaseQuantity": {
													"firstRound": rows[0].sumQuantities,
													"secondRound": 0
												},
												"purchaseCount": {
													"firstRound": responseRoundOneUserCounts,
													"secondRound": responseRoundTwoUserCounts
												}
											});

										}
										else if (round == 2) {
											res.json({
												"achievement": checkMission,
												"justEarned": true,
												"purchaseCountNow": counts,
												"purchaseQuantity": {
													"firstRound": rows[0].sumQuantities,
													"secondRound": rows[1].sumQuantities
												},
												"purchaseCount": {
													"firstRound": responseRoundOneUserCounts,
													"secondRound": responseRoundTwoUserCounts
												}
											});
										}
									}
								} else {
									console.log('check quantity error ', err);
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

				// 쿠폰 발급하기
				await mintFreeCoupon(round);
				await mintPlusCoupon(round);
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

	if (couponDate == 'outOfOrder') {
		// 쿠폰 만료 기입
		await insertExpired(couponDate);
		// 쿠폰기간 체크
		let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
		res.json({
			rewards: {
				"firstRoundPlus": tokenStatus[0].token1_plus,
				"firstRooundFree": tokenStatus[0].token1_free,
				"secondRoundPlus": tokenStatus[0].token2_plus,
				"secondRoundFree": tokenStatus[0].token2_free
			}
		})
	}
	else if (couponDate == 1) {
		// 쿠폰기간 체크
		let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
		res.json({
			rewards: {
				"firstRoundPlus": tokenStatus[0].token1_plus,
				"firstRooundFree": tokenStatus[0].token1_free,
				"secondRoundPlus": tokenStatus[0].token2_plus,
				"secondRoundFree": tokenStatus[0].token2_free
			}
		})
	}
	else if (couponDate == 12) {
		// 쿠폰기간 체크
		let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
		res.json({
			rewards: {
				"firstRoundPlus": tokenStatus[0].token1_plus,
				"firstRooundFree": tokenStatus[0].token1_free,
				"secondRoundPlus": tokenStatus[0].token2_plus,
				"secondRoundFree": tokenStatus[0].token2_free
			}
		})
	}
	else if (couponDate == 2) {
		// 쿠폰 만료 기입
		await insertExpired(couponDate);
		// 쿠폰기간 체크
		let tokenStatus = await checkTokenStatus(req.body.phoneNumber);
		res.json({
			rewards: {
				"firstRoundPlus": tokenStatus[0].token1_plus,
				"firstRooundFree": tokenStatus[0].token1_free,
				"secondRoundPlus": tokenStatus[0].token2_plus,
				"secondRoundFree": tokenStatus[0].token2_free
			}
		})
	}
});

/* 쿠폰 사용 */
router.post('/api/redeem', async (req, res, next) => {
	// 쿠폰 기간 체크
	let couponDate = await calculateCouponDate();

	// 모든 쿠폰 사용 불가
	if (couponDate == 'outOfOrder') {

		// 2차 쿠폰 만료
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

		}
		else {
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
				if (round == 1) {
					//resolve((rows[0].sumQuantities / 4862).toFixed(4))
					resolve((rows[0].sumQuantities / 338).toFixed(4))
				}
				else if (round == 2) {
					resolve((rows[0].sumQuantities / 5968).toFixed(4))
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
		db.conn.query('SELECT sumQuantities, phoneNumber, ranking FROM(SELECT sumQuantities, phoneNumber, (@rank:=IF(@last > sumQuantities, @rank:=@rank+1, @rank)) AS ranking, (@last:=sumQuantities) FROM (SELECT phoneNumber, SUM(quantity) AS sumQuantities, round FROM users WHERE round=1 GROUP BY phoneNumber)t, (SELECT @rank:=1, @last:=0) AS b ORDER BY sumQuantities DESC)n WHERE ranking < 4;', (err, rows, fields) => {
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
		db.conn.query('SELECT sumQuantities, phoneNumber, ranking FROM(SELECT sumQuantities, phoneNumber, (@rank:=IF(@last > sumQuantities, @rank:=@rank+1, @rank)) AS ranking, (@last:=sumQuantities) FROM (SELECT phoneNumber, SUM(quantity) AS sumQuantities, round FROM users WHERE round=2 GROUP BY phoneNumber)t, (SELECT @rank:=1, @last:=0) AS b ORDER BY sumQuantities DESC)n WHERE ranking < 4;', (err, rows, fields) => {
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

/* plus 쿠폰 발급 */
async function mintPlusCoupon(round) {
	return new Promise(async (resolve, reject) => {

		// 체인에서 token 발급

		// db 값 unused로 변경
		if (round == 1) {
			db.conn.query('SELECT COUNT(quantity) AS counts, phoneNumber FROM users GROUP BY phoneNumber having counts >= 3', (err, rows, fields) => {
				if (err) {
					reject('get counts error ', err)
				} else {
					console.log('round one plus coupon ', rows)
					
					for (let i = 0; i < rows.length; i++) {
						db.conn.query('UPDATE users SET token1_plus="unused" WHERE token1_plus is null AND phoneNumber=?', [rows[i].phoneNumber], (err, result, fields) => {
							if (err) {
								reject('insert round1 unused error ', err)
							} else {
								resolve(rows)
								console.log('round1 plus ', result)
							}
						})
					}
				}
			})			
		}
		else if (round == 2) {
			db.conn.query('UPDATE users SET token2_plus = "unused" WHERE token2_plus is null AND quantity >=3', (err, rows, fields) => {
				if (err) {
					reject('insert round2 unused error ', err);
				} else {
					resolve(rows)
				}
			});
		}
	});
};

/* free 쿠폰 발급 */
async function mintFreeCoupon(round) {
	return new Promise(async (resolve, resject) => {
		
		// 체인에서 token 발급

		// db 값 unused로 변경
		if (round == 1) {
			let roundOneRanker = await getRoundOneRanking();
			console.log(roundOneRanker)
			for (let i = 0; i < roundOneRanker.length; i++) {
				db.conn.query('UPDATE users SET token1_free="used" WHERE token1_free="unused"  AND phoneNumber=?', [roundOneRanker[i].phoneNumber], (err, rows, fields) => {
					if (err) {
						reject('insert unused error i ', err)
					} else {
						resolve(rows)
						console.log(roundOneRanker[i].phoneNumber)
						console.log('round one free coupon ', rows)
					}
				})
			}

		}
		else if (round == 2) {
			let roundTwoRanker = await getRoundTwoRanking();
			console.log(roundTwoRanker)
			for (let j = 0; j < roundTwoRanker.length; j++) {
				db.conn.query('UPDATE users SET token2_free = "unused" WHERE token2_free is null AND phoneNumber=?', [roundTwoRanker[j].phoneNumber], (err, rows, fields) => {
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
			db.conn.query('UPDATE users SET token1_plus = "expired" WHERE token1_plus = "unused"', (err, rows, fields) => {
				if (err) {
					reject('insert expired token1_plus error ', err);
				} else {
					db.conn.query('UPDATE users SET token1_free = "expired" WHERE token1_free = "unused"', (err, rows, fields) => {
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
			db.conn.query('UPDATE users SET token2_plus = "expired" WHERE token2_plus = "unused"', (err, rows, fields) => {
				if (err) {
					reject('insert expired token2_plus error ', err);
				} else {
					db.conn.query('UPDATE users SET token2_free = "expired" WHERE token2_free = "unused"', (err, rows, fields) => {
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
		if (moment().isBetween('2020-08-05', '2020-08-08', 'date', '[]'/*'2020-08-10', '2020-08-14', 'date', '[]'*/) == true) {
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
		if (moment().isBetween('2020-08-05', '2020-08-08', 'date', '[]'/*'2020-08-18', '2020-08-24', 'date', '[]'*/) == true) {
			resolve(1);
		} else if (moment().isBetween('2020-08-25', '2020-08-31', 'date', '[]') == true) {
			resolve(12);
		} else if (moment().isBetween('2020-09-01', '2020-09-08', 'date', '[]') == true) {
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

		let tx = caver.transaction.decode("0x31f90143808505d21dba00830f424094cddd2f0b23f033eb85afe5510e5285261bf681548094b5ff3f8b19f917f0290d8eead466edb779cd61d3b864bb16f4430000000000000000000000007930978144dfca9dfb66c5aeae94eb1472299df600000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002f847f8458207f6a039de716bb64c5081e442343ff1e9e9de80d24e7a8c48ef0a452a5b3cf2afdc91a01bfd30d3258b4321154d37418d4a8a85c7ffb83f260ef75c9ecf4ba33960b685941b71a63903e35371e2fc41c6012effb99b9a2c0ff847f8458207f5a020d39dd1b1cc322c86633accf559561ee9d48930fd9a57e19a9a4a5ce18069a5a033398aa469fa48744462e23d60579d96a7ab8672d997954a339cf3f874ce65fc");
		const signed = await caver.wallet.signAsFeePayer('0x64297AE00b82e819c3AcD658cCF6EA3ee18Bc038', tx);
		const receipt = await caver.rpc.klay.sendRawTransaction(signed)
		console.log(receipt);
		// tokenContract.methods.getTokenList('01087754055', 1).call((error, result) => {
		// 	if (error) {
		// 		throw error
		// 	} else {
		// 		console.log('1', result)
		// 		console.log('2', result['0'])
		// 		console.log('3', Object.keys(result));
		// 	}
		// })

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
