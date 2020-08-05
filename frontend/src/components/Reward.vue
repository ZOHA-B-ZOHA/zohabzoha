<template>
  <div>
    <img :alt="imgAlt" :src="imgSrc"  width="120" @click="triggerModal" />
  </div>
</template>

<script>
export default {
  name: 'Reward',
  props: {
    type: String,
    status: String,
  },
  data: function() {
    return {
      imgAlt: '',
      imgSrc: '',
    };
  },
  created: function() {
    this.setImg();
  },
  watch: {
    status: function() {
      this.setImg();
    },
  },
  methods: {
    triggerModal: function() {
      if (this.status === 'unused') this.$emit('triggerModal', this.type);
    },
    setImg: function() {
      if (this.type === 'firstRoundPlus' || this.type === 'secondRoundPlus') {
        switch (this.status) {
          case 'unused':
            this.imgAlt = '사용할 수 있는 원 플러스 원 쿠폰';
            this.imgSrc = require('../assets/images/plus_unused.png');
            break;
          case 'used':
            this.imgAlt = '이미 사용한 원 플러스 원 쿠폰';
            this.imgSrc = require('../assets/images/plus_used.png');
            break;
          case 'expired':
            this.imgAlt = '사용 기한이 지난 원 플러스 원 쿠폰';
            this.imgSrc = require('../assets/images/plus_expired.png');
            break;
          default:
            break;
        }
      } else if (this.type === 'firstRoundFree' || this.type === 'secondRoundFree') {
        switch (this.status) {
          case 'unused':
            this.imgAlt = '사용할 수 있는 무료 쿠폰';
            this.imgSrc = require('../assets/images/free_unused.png');
            break;
          case 'used':
            this.imgAlt = '이미 사용한 무료 쿠폰';
            this.imgSrc = require('../assets/images/free_unused.png');
            break;
          case 'expired':
            this.imgAlt = '사용 기한이 지난 무료 쿠폰';
            this.imgSrc = require('../assets/images/free_expired.png');
            break;
          default:
            break;
        }
      }
    }
  }
}
</script>

<style scoped>
div {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-bottom: 20px;
}
</style>
