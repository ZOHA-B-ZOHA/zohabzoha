const api_main = {
  request: null,
  response: {
    data: {
      achievement: 0.5,
    },
  },
};

const api_authenticate = {
  request: {
    data: {
      phoneNumber: '01012345678',
    },
  },
  response: {
    data: {
      achievement: 0.51,
      currentUser: {
        phoneNumber: '01012345678',
        purchaseQuantity: {
          firstRound: 3,
          secondRound: 2,
        },
        purchaseCount: {
          firstRound: 5,
          secondRound: 4,
        },
      },
    },
  },
};

const api_rankings = {
  request: {
    data: {
      phoneNumber: '01012345678',
    },
  },
  response: {
    data: {
      rankings: {
        first: {
          quantity: 6,
          userPhoneNumbers: [
            '01011112222',
            '01012345678',
          ],
        },
        second: {
          quantity: 5,
          userPhoneNumbers: [
            '01022221111',
            '01022221112',
          ],
        },
        third: {
          quantity: 4,
          userPhoneNumbers: [
            '01022221110',
          ],
        },
      },
    },
  },
};

const api_verify = {
  request: {
    data: {
      phoneNumber: '01012345678',
      branch: '도서관점', // 생각해 보니까 이 정보를 QR코드에 넣을 수도 있겠다
      purchaseQuantity: 10,
      verificationCode: 'zohabzohafighting',
    },
  },
  response: {
    data: {
      achievement: 0.52,
      justEarned: true,
      purchaseCountNow: 5,
      purchaseQuantity: {
        firstRound: 3,
        secondRound: 5,
      },
      purchaseCount: {
        firstRound: 5,
        secondRound: 5,
      },
    },
  },
};

const api_rewards = {
  request: {
    data: {
      phoneNumber: '01012345678',
    },
  },
  response: {
    data: {
      rewards: {
        firstRoundPlus: 'used',
        firstRoundFree: 'expired',
        secondRoundPlus: 'unused',
        secondRoundFree: null,
      },
    },
  },
};

const api_redeem = {
  request: {
    data: {
      phoneNumber: '1234567890',
      rewardType: 'secondRoundPlus',
    },
  },
  response: {
    data: {
      rewards: {
        firstRoundPlus: 'used', // null|'unavailable'|'unused'|'used'|'expired'
        firstRoundFree: 'expired',
        secondRoundPlus: 'used',
        secondRoundFree: null,
      },
    },
  },
};

export {
  api_main,
  api_authenticate,
  api_rankings,
  api_verify,
  api_rewards,
  api_redeem,
};
