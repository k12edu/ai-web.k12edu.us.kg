<template>
  <div class="nav" v-if="!isLogIn">
    <div class="log-in">
      <button class="login-btn">Google 登入</button>
    </div>
  </div>
  
  <div class="nav" v-if="isLogIn">
    <div class="log-in" @click="logout">
    <button class="login-btn2">登出</button>
  </div>
  </div>
</template>

<script>
export default {
  name: "MessageItem",
  props: {
    content: {
      type: String,
      required: true,
    },
  },
  inject: ['isLogIn','logout']
};
</script>

<style scoped>
.nav {
  display: flex;
  justify-content: flex-end; /* 右對齊 */
  width: 100%;
}

.log-in {
  margin: 5px;
}

.login-btn {
  padding: 10px 20px;
  background-color: #4285f4; /* Google 的藍色 */
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
}

.login-btn:hover {
  background-color: #357ae8; /* 滑鼠懸停時的顏色 */
  transform: scale(1.05); /* 輕微放大效果 */
}

.login-btn:active {
  transform: scale(1); /* 按下時恢復原狀 */
}

.login-btn2 {
  padding: 10px 20px;
  background-color: #e72c2c; /* Google 的藍色 */
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
}

.login-btn2:hover {
  background-color: #cb1717; /* 滑鼠懸停時的顏色 */
  transform: scale(1.05); /* 輕微放大效果 */
}

.login-btn2:active {
  transform: scale(1); /* 按下時恢復原狀 */
}

p {
  margin: 0;
}
</style>
