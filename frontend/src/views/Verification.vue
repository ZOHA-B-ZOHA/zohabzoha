<template>
  <main>
    <canvas id="scanner" width="300" height="300">이 브라우저는 Javascript Canvas API를 지원하지 않습니다.</canvas>
    <div id="result">QR코드를 인식시켜 주세요.</div>
    <!-- 뭔가 부가적인 설명이 더 필요할 것 같긴 하다 -->
    <Modal v-if="isModalVisible" :type="modalType" />
  </main>
</template>

<script>
import jsQR from 'jsqr';
import axios from 'axios';
// import { api_verify } from '../../fakeData';
import Modal from '../components/Modal';

export default {
  name: 'Verification',
  components: {
    Modal,
  },
  props: {
    user: Object,
  },
  data: function() {
    return {
      ctx: null,
      video: null,
      isModalVisible: false,
      modalType: '',
    };
  },
  mounted: function() {
    const video = document.createElement("video");
    this.video = video;
    const canvas = document.getElementById('scanner'); // 또는 $ref나 $el을 사용할 수도 있다고 하네
    const ctx = canvas.getContext('2d');
    this.ctx = ctx;
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then((stream) => {
      video.srcObject = stream;
      video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
      video.play();
      this.scan();
    })
    .catch((error) => {
      console.log(error);
    });
  },
  methods: {
    scan: function() {
      const { ctx, video } = this;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // 여길 어떻게 해야 하지... 비디오 어떻게 자르지?
        // 일단 실제 핸드폰으로 테스트해 보기
        // 그냥 핸드폰 카메라의 가운데만 보이게 자르면 될까
        ctx.drawImage(video, 0, 0, ctx.canvas.width, ctx.canvas.height, 0, 0, ctx.canvas.width, ctx.canvas.height);
      }

      const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });

      if (result) {
        // 디자인 시안대로 꺾쇠 표시 넣는 건 일단 나중에,,,,
        const pos = result.location;
        ctx.beginPath();
        ctx.moveTo(pos.topLeftCorner.x, pos.topLeftCorner.y);
        ctx.lineTo(pos.bottomLeftCorner.x, pos.bottomLeftCorner.y);
        ctx.stroke();
        ctx.lineTo(pos.bottomRightCorner.x, pos.bottomRightCorner.y);
        ctx.stroke();
        ctx.lineTo(pos.topRightCorner.x, pos.topRightCorner.y);
        ctx.stroke();
        ctx.lineTo(pos.topLeftCorner.x, pos.topLeftCorner.y);
        ctx.stroke();

        document.getElementById('result').innerText = result.data;
        // 실제로는 바로 적립하도록 넘어가야 함!
        axios.post(`${process.env.VUE_APP_URL}/verify`, {
          phoneNumber: this.user.phoneNumber, // console.log(121212, this.$route.query);
          branch: this.$route.query.branch,
          purchaseQuantity: this.$route.query.quantity,
          verificationCode: result.data
        }, { headers: {  } })
        .then((response) => {
          console.log(response)
          // 이 이후에 redirect하면서 팝업이랑 반짝이 띄워 줘야 함. 업데이트된 게이지바도 반영하고
          this.$emit('updateUserInfo', response.data.purchaseCount, response.data.purchaseQuantity);
          const purchaseCountNow = response.data.purchaseCountNow;
          if (purchaseCountNow === 1) {
            this.modalType = 'firstPurchase';
            this.isModalVisible = true;
          } else if (purchaseCountNow === 2) {
            this.modalType = 'secondPurchase';
            this.isModalVisible = true;
          } else if (purchaseCountNow === 3) {
            this.modalType = 'thirdPurchase';
            this.isModalVisible = true;
          } else if (purchaseCountNow >= 4) {
            this.modalType = 'fourthOrMorePurchase';
            this.isModalVisible = true;
          } else {
            console.log('error');
          }
        })
        .catch((error) => {
          console.log(error);
        });
        // dummy data ver.
        // this.$emit('updateUserInfo', api_verify.response.data.purchaseCount, api_verify.response.data.purchaseQuantity);
        // const purchaseCountNow = api_verify.response.data.purchaseCountNow;
        // if (purchaseCountNow === 1) {
        //   this.modalType = 'firstPurchase';
        //   this.isModalVisible = true;
        // } else if (purchaseCountNow === 2) {
        //   this.modalType = 'secondPurchase';
        //   this.isModalVisible = true;
        // } else if (purchaseCountNow === 3) {
        //   this.modalType = 'thirdPurchase';
        //   this.isModalVisible = true;
        // } else if (purchaseCountNow >= 4) {
        //   this.modalType = 'fourthOrMorePurchase';
        //   this.isModalVisible = true;
        // } else {
        //   console.log('error');
        // }
      } else {
        document.getElementById('result').innerText = 'QR코드를 인식시켜 주세요.';
      }

      // https://stackoverflow.com/questions/8771919/rangeerror-with-requestanimationframe
      // 함수에 인자를 집어넣기 위해 함수를 실행시키면 안 됨. 그래서 인자도 컴포넌트의 data로 넘김.
      // requestAnimationFrame(this.scan(ctx, video));
      requestAnimationFrame(this.scan);
    },
  },
}
</script>

<style scoped>
#result {
  color: #ffffff;
}
</style>
