<template>
  <div class="hello">
    <div class="chat_background">
      <el-button @click="moreMessage">加载更多</el-button>
      <div v-for="m in messageList" :key="m.id">
        <div v-if="m.senderType === 3" class="chat_message_left">
          <img alt="admin" src="@/assets/default_avatar.png" style="width: 40px;height:40px;">
          {{ m.message }}
        </div>
        <div v-else class="chat_message_right">
          {{ m.message }}
          <el-image style="width: 40px;height:40px;" :src="memberInfo.headImgUrl"></el-image>
        </div>
      </div>
    </div>
    <div>
      token: <input v-model="token" width="600px"/>
    </div>
    <div>
      targetAnchorId = <input v-model="anchorId" />
    </div>
    <div>
      targetMcnId = <input v-model="mcnId" />
    </div>
    <div>
      connectionStatus: {{connectionStatus}}
    </div>
    <div>
      <button @click="connect" >Connect</button>
    </div>


    <div>
      message: <el-input type="textarea" v-model="message" />
    </div>
    <div>
      messageType:
      <el-select v-model="messageType" placeholder="messageType">
        <el-option
            v-for="item in messageTypeOptions"
            :key="item"
            :label="item"
            :value="item">
        </el-option>
      </el-select>
    </div>
    <button @click="sendMessage" :disabled="message.length === 0">Send</button>
  </div>
</template>

<script>
import {getCurrentMemberInfo} from "@/api/user";
import {getMemberChatMessage} from "@/api/chat_message";

export default {
  name: "Member",
  data(){
    return{
      text:'',
      anchorId:1,
      mcnId:2,
      websocketObj: null,
      token:'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJhdXRoMCIsInVzZXJJZCI6MSwibWVtYmVySWQiOjF9.aTpLMCn05kwy1zloc2yu4jsaEU6rj-7R-k-jfXZYEYg',
      message:'',
      messageType:'0',//0: 主播 1：mcn
      messageTypeOptions:[
        '0',// anchor发起的消息
        '1',// mcn发起的消息
        '2'// 法律咨询
      ],
      connectionStatus:'closed',
      messageList:[],
      memberInfo:{}
    }
  },
  mounted() {
    getCurrentMemberInfo(this.token).then(data => {
      this.memberInfo = data.result
    })
  },
  methods:{
    connect(){
      this.websocketObj = new WebSocket(`ws://localhost:18080/websocket/member?token=${this.token}&mcnId=${this.mcnId}&type=${this.messageType}`);
      this.websocketObj.onmessage = this.websocketonmessage;
      this.websocketObj.onopen = this.websocketonopen;
      this.websocketObj.onerror = this.websocketonerror;
      this.websocketObj.onclose = this.websocketonclose;
    },
    sendMessage(){
      let chatMessage = {
        message: this.message,
        mcnId: this.mcnId,
        messageType: this.messageType,
        senderType: this.messageType,
      }
      this.messageList.push(chatMessage);
      this.websocketObj.send(JSON.stringify(chatMessage))
    },
    websocketonmessage(e) {
      let message = JSON.parse(e.data);
      this.messageList.push(message)
    },
    websocketonopen() {
      this.connectionStatus = 'connected'
      this.moreMessage();
    },
    // 通信发生错误时触发
    websocketonerror() {
      this.connectionStatus = 'error'
    },
    websocketonclose(){
      this.connectionStatus = 'closed'
    },
    moreMessage(){
      let offset = 0;
      if(this.messageList.length > 0){
        offset = this.messageList[0].id;
      }
      let request = {
        type: this.messageType,
        anchorId: this.anchorId,
        mcnId: this.mcnId,
        token: this.token,
        offset: offset,
      }
      getMemberChatMessage(request).then(response => {
        this.messageList = response.result.concat(this.messageList);
      })
    }
  }
}
</script>

<style scoped>
.chat_background{
  flex-wrap: wrap;
  width: 500px;
}

.chat_message_left{
  display: flex;
  width:100%;
  justify-content: flex-start;
}
.chat_message_right{
  display: flex;
  width:100%;
  justify-content: flex-end;
}
</style>