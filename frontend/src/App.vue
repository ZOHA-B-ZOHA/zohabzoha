<template>
  <div id="app">
    <Header :user="currentUser" />
    <router-view :user="currentUser" :achievement="achievement" v-on:getPhoneNumber="authenticate" v-on:updateUserInfo="updateCurrentUser" />
  </div>
</template>

<script>
import Header from './components/Header';
import axios from 'axios';
// import { api_main, api_authenticate } from '../fakeData';

export default {
  name: 'App',
  components: {
    Header,
  },
  data: function() {
    return {
      currentUser: null,
      achievement: 0,
      justEarned: false,
    }
  },
  created: function() {
    axios.get(`${process.env.VUE_APP_URL}/`)
    .then((response) => {
      console.log(response)
      this.achievement = response.data.achievement;
    })
    .catch((error) => {
      console.log(error)
    });
    // dummy data ver.
    // this.achievement = api_main.response.data.achievement;
  },
  methods: {
    authenticate: function(phoneNumber) {
      axios.post(`${process.env.VUE_APP_URL}/authenticate`, { phoneNumber })
      .then((response) => {
        console.log(response)
        this.achievement = response.data.achievement;
        this.currentUser = response.data.currentUser;
      })
      .catch((error) => {
        console.log(error)
      });
      // dummy data ver.
      // this.achievement = api_authenticate.response.data.achievement;
      // this.currentUser = api_authenticate.response.data.currentUser;
    },
    updateCurrentUser: function(purchaseCount, purchaseQuantity) {
      this.currentUser.purchaseCount = purchaseCount;
      this.currentUser.purchaseQuantity = purchaseQuantity;
    },
  }
}
</script>

<style>
@font-face {
  font-family: NanumSquareRound;
  /* src: url(./assets/NanumSquareRoundR.ttf) format("ttf"); */
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_two@1.0/NanumSquareRound.woff') format('woff');
  font-weight: normal;
}
@font-face {
  font-family: NanumSquareRound;
  src: url(./assets/NanumSquareRoundB.ttf) format("ttf");
  font-weight: bold;
}
* {
  font-family: NanumSquareRound;
  /* font-weight: bold; */
}
body {
  margin: 0px;
}
#app {
  height: 100vh;
  text-align: center;
  background: linear-gradient(180deg, #FFB88C 0%, #DE6262 99.7%);
  display: flex;
  flex-direction: column;
  align-items: center;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
main {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
}
section {
  display: flex;
  flex-direction: column;
  align-items: center;
}
form {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.label {
  width: 315px;
  text-align: left;
  color: white;
  font-size: 16px;
  line-height: 36px;
}
input {
  width: 315px;
  height: 50px;
  border: none;
  padding: 0px 10px; /* 여긴 아직 디자인이 안 나와서 내가 알아서 함 */
  box-sizing: border-box; /* makes padding inclusive */
  color: #B42828;
  background-color: white;
  filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
  margin-bottom: 25px;
}
a, button {
  width: 315px;
  height: 50px;
  border: none;
  color: #B42828; /* #E26C67; */;
  background-color: white;
  filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
  text-decoration: none;
  margin-bottom: 25px;
  line-height: 50px; /* to center the text in a tag vertically */
  font-size: 16px;
}
</style>
