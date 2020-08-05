<template>
  <main>
    <GaugeBar :achievement="achievement" />
    <nav v-if="user">
      <router-link to="/earn">적립하기</router-link>
      <router-link to="/about">마이페이지</router-link>
    </nav>
    <section v-else>
      <form @submit.prevent="handleSubmit">
        <label for="phoneNumber" class="label">전화번호 입력</label>
        <p><img width="12" src="../assets/icon_alert.png" alt="주의" />전화번호 입력 시 개인정보 수집에 동의하는 것으로 간주됩니다.<br />개인정보는 리워드 지급에만 사용되며, 이벤트 종료 후 한 달 이내로 파기합니다.</p>
        <div>
          <input id="phoneNumber" type="text" name="phoneNumber" placeholder="예) 01012345678" pattern="01\d\d{3,4}\d{4}" />
          <button type="submit">확인</button>
        </div>
      </form>
    </section>
  </main>
</template>

<script>
import GaugeBar from '../components/GaugeBar';

export default {
  name: 'Home',
  components: {
    GaugeBar,
  },
  props: {
    user: Object,
    achievement: Number,
  },
  data: function() {
    return {
      rankings: null,
    };
  },
  methods: {
    handleSubmit: function(e) {
      this.$emit('getPhoneNumber', e.target.phoneNumber.value) // e.target.elements.phoneNumber.value
    },
  },
};
</script>

<style scoped>
nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 14px;
}
nav a:last-child {
  margin-bottom: 35px;
}
form button {
  margin-bottom: 35px;
}
p {
  width: 315px;
  margin-top: 0px;
  color: white;
  font-size: 10px;
  text-align: left;
  margin-bottom: 12px;
}
img {
  vertical-align: -30%;
  margin-right: 2px;
}
div {
  display: flex;
  width: 315px;
}
input {
  width: 215px;
}
button {
  width: 100px;
}
</style>
