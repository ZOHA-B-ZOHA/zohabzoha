<template>
  <header>
    <router-link to="/" v-if="$route.name === 'Earn' || $route.name === 'Verification' || $route.name === 'About'">
      <img alt="뒤로 가기" src="../assets/arrow.png" width="24" />
    </router-link>
    <div v-else class="fake left"></div>
    <img v-if="$route.name === 'Home'" alt="조합조하 로고" src="../assets/logo.png" width="100" />
    <div v-else-if="$route.name === 'Earn'">적립하기</div>
    <div v-else-if="$route.name === 'About'">내 정보</div>
    <div v-else-if="$route.name === 'Verification'">QR코드 인증하기</div>
    <button v-if="$route.name === 'Home'" class="ranking" v-bind:class="{ hidden: !user }" @click="toggleRanking">
      랭킹
      <div class="leaderBoard hidden">
        <!-- <div v-for="ranking in rankings" v-bind:key="ranking.phoneNumber">
          <div v-if="ranking.phoneNumber === user.phoneNumber">{{ ranking.purchaseQuantity }}(나)</div>
          <div v-else>{{ ranking.purchaseQuantity }}</div>
        </div> -->
        <div v-if="rankings">{{ rankings.first.quantity }}, {{ rankings.first.userPhoneNumbers.length }}</div>
        <div v-if="rankings">{{ rankings.second.quantity }}, {{ rankings.second.userPhoneNumbers.length }}</div>
        <div v-if="rankings">{{ rankings.third.quantity }}, {{ rankings.third.userPhoneNumbers.length }}</div>
      </div>
    </button>
    <div v-else class="fake right"></div>
  </header>
</template>

<script>
import axios from 'axios';
// import { api_rankings } from '../../fakeData';

export default {
  name: 'Header',
  props: {
    user: Object,
  },
  data: function() {
    return {
      rankings: null,
    };
  },
  methods: {
    toggleRanking: function(e) {
      const leaderBoard = e.target.childNodes[1]; // 순서로 찾는 건 좀 불안정하긴 한데,, 의미상으로는 이게 지금 좀 더 이해하기 쉬움
      console.log(leaderBoard)
      if (!this.rankings) this.getRankings();
      leaderBoard.classList.toggle('hidden');
    },
    getRankings: function() { // 랭킹 버튼을 눌렀을 때
      axios.post(`${process.env.VUE_APP_URL}/rankings`, { phoneNumber: this.user.phoneNumber })
      .then((response) => {
        console.log(response);
        this.rankings = response.data.rankings;
      })
      .catch((error) => {
        console.log(error);
      });
      // dummy data ver.
      // this.rankings = api_rankings.response.data.rankings;
    },
  },
}
</script>

<style scoped>
header {
  width: 100%;
  height: 60px;
  margin-bottom: 24px;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
a {
  /* width: 25px;
  height: 25px; */
  width: 50px;
  height: 50px;
  background: none;
  /* margin-left: 18px; */
  margin-bottom: 0px;
  line-height: 0px;
  /* cursor:  */
  filter: none;
}
img {
  margin-top: 12px;
}
a img {
  margin-left: 18px;
}
header div {
  font-size: 24px;
  color: white;
}
button {
  /* v-bind를 쓰려고 id 대신 class를 쓰기는 했는데,, */
  width: 50px;
  height: 50px;
  /* width: 21px;
  height: 25px; */
  /* 이미지는 css background로 넣기.
  근데 누를 수 있는 건 명확하게 누를 수 있다고 표시를 해 주는 게 더 좋을 듯 */
  border-radius: 50%;
  padding: 0px;
  margin: 10px 12px 0px 0px;
  /* margin-bottom: 0px;
  margin-right: 12px; */
}
.hidden {
  visibility: hidden;
}
.leaderBoard {
  color: lime;
}
/* header::after {
  content: "invisible";
  width: 43px;
  height:25px;
  visibility: hidden;
} */
.fake {
  content: 'fake block';
  /* width: 43px;
  height:25px; */
  width: 50px;
  height:50px;
  visibility: hidden;
}
.left {
  margin-left: 12px;
}
</style>
