<template>
  <main>
    <!-- <form action="/verify"> -->
    <!-- submit 버튼 안 써도 접근성을 유지할 수 있나....? 잘 모르겠다 ㅠㅠ -->
    <!-- 근데 이상하게 action을 써서 넘어가면 유저 정보가 안 넘어간다.... -->
    <form @submit.prevent>
      <section>
        <label for="branch" class="label">구매 지점</label>
        <select id="branch" name="branch" v-model="branch">
          <option value="도서관점">도서관점</option>
          <option value="137동점">137동점</option>
          <option value="자하연점">자하연점</option>
          <option value="동원관점">동원관점</option>
        </select>
      </section>
      <section>
        <label for="quantity" class="label">구매 수량</label>
        <div id="container">
          <button @click="subtractOne">−</button>
          <input id="quantity" name="quantity" type="number" min="1" v-model="quantity" />
          <button @click="addOne">+</button>
        </div>
      </section>
      <!-- <router-link :to="{ path: '/verify', query: { branch, quantity }}">적립하기</router-link> -->
      <button type="submit" @click="isModalVisible = true">적립하기</button>
    </form>
    <Modal v-if="isModalVisible" type="beforeVerification" :query="{ branch, quantity }" />
  </main>
</template>

<script>
import Modal from '../components/Modal';

export default {
  name: "Earn",
  components: {
    Modal,
  },
  props: {
    user: Object,
  },
  data: function() {
    return {
      branch: '도서관점',
      quantity: 1,
      isModalVisible: false,
    }
  },
  methods: {
    addOne: function(e) {
      e.preventDefault() // 왜 이게 template에서는 안 먹히는 거지?
      this.quantity++
    },
    subtractOne: function(e) {
      e.preventDefault()
      if (this.quantity > 1) this.quantity--
    },
  },
}
</script>

<style scoped>
header::after { /* 꼼수... 도대체 이건 어떻게 해결하는 게 정석일까 */
  content: "invisible";
  width: 43px;
  height:25px;
  visibility: hidden;
}
#container {
  width: 315px;
  display: flex;
  justify-content: space-between;
}
#container button {
  width: 50px;
  font-size: 24px;
}
#container input {
  width: 200px;
}
form {
  flex: 1;
}
form button, a {
  margin-top: auto;
  margin-bottom: 35px;
}
select {
  /* border-radius: 10px; */
  width: 315px;
  height: 50px;
  border: none;
  padding: 0px 10px; /* 여긴 아직 디자인이 안 나와서 내가 알아서 함 */
  /* box-sizing: border-box; makes padding inclusive */
  color: #E26C67;
  background-color: white;
  filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
  margin-bottom: 25px;
  /* font-size: 16px; */
}
option {
  width: 200px;
}
</style>
