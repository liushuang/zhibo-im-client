<template>
<div>
  <el-image style="width: 100px;height:100px;" :src="memberInfo.headImgUrl">

  </el-image>
  {{this.memberInfo.username}}
  {{this.memberInfo.unreadCount}}
  <button @click="$emit('pickup-member', memberInfo)">pick</button>
</div>
</template>

<script>
export default {
  name: "UnreadMember",
  props:{
    memberInfo:Object
  },
  data(){
    return{

    }
  }
}
</script>

<style scoped>

</style>