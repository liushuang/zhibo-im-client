<template>
  <div class="hello">
    <div>
      Anchor:{{ unreadAnchors.length }}
      <unread-member v-for="anchor in unreadAnchors" :key="anchor.memberKey" :memberInfo="anchor" v-on:pickup-member="pickup"></unread-member>
    </div>
    <div>
      MCN:
      <unread-member v-for="mcn in unreadMcns" :key="mcn.memberKey" :memberInfo="mcn" v-on:pickup-member="pickup"></unread-member>
    </div>
    <div>
      LAW:
      <unread-member v-for="law in unreadLaws" :key="law.memberKey" :memberInfo="law" v-on:pickup-member="pickup"></unread-member>
    </div>
    <div>
      token: <input v-model="token" width="600px" />
    </div>
    <div>
      <p>Status: {{ connectionStatus}}</p>
      <button @click="connect">Connect</button>
    </div>


    <el-tabs v-model="pickedMemberName" type="card" editable @edit="handleRemoveMember">
      <el-tab-pane
          :key="member.memberKey"
          v-for="member in pickedMembers"
          :label="member.username"
          :name="member.memberKey"
      >
        <el-input
            type="textarea"
            :rows="2"
            placeholder="请输入内容"
            v-model="member.inputMessage">
        </el-input>
        <el-button @click="sendMessage(member)" :disabled="member.inputMessage.length === 0">SendMessage</el-button>

        <div class="chat_background">
          <el-button @click="moreMessage(member)">加载更多</el-button>
          <div v-for="m in member.messageList" :key="m.memberKey">
            <div v-if="m.senderType === 3" class="chat_message_right">
              {{ m.message }}
              <img alt="admin" src="@/assets/default_avatar.png" style="width: 40px;height:40px;">
            </div>
            <div v-else class="chat_message_left">
              <el-image style="width: 40px;height:40px;" :src="member.headImgUrl"></el-image>
              {{ m.message }}
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

  </div>
</template>

<script>
import UnreadMember from "@/components/UnreadMember";
import {getMemberInfo, hangupMember, pickupMember} from "@/api/user";
import {getUnreadMessageList, getUserChatMessage} from "@/api/chat_message";

export default {
  name: 'User',
  components: {UnreadMember},
  props: {
    msg: String
  },
  data() {
    return {
      websocketObj: null,
      token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJhdXRoMCIsInVzZXJJZCI6MSwibWVtYmVySWQiOjF9.aTpLMCn05kwy1zloc2yu4jsaEU6rj-7R-k-jfXZYEYg',
      message: '',
      messageType: '0',
      messageTypeOptions: [
        '0',
        '1',
        '2'
      ],
      connectionStatus: 'closed',
      unreadAnchors: [],
      unreadMcns: [],
      unreadLaws: [],
      pickedMembers:[],
      pickedMemberName: '',
      memberInfoMap:{},
      userInfo:{},
      init:false,// 初始化第一次需要加载未读消息列表
    }
  },
  mounted() {
    // 刷新页面断开ws连接
    window.onbeforeunload = function(){
      if(this.connectionStatus === 'connected'){
        this.websocketObj.close();
        this.websocketonclose();
      }
      return "";
    }
  },
  methods: {
    connect() {
      console.log(this.token)
      this.websocketObj = new WebSocket(`ws://localhost:18080/websocket/user?token=${this.token}`);
      this.websocketObj.onmessage = this.websocketonmessage;
      this.websocketObj.onopen = this.websocketonopen;
      this.websocketObj.onerror = this.websocketonerror;
      this.websocketObj.onclose = this.websocketonclose;
    },
    sendMessage(pickedMember) {
      let chatMessage = {
        type: pickedMember.type,
        anchorId: pickedMember.anchorId,
        mcnId: pickedMember.mcnId,
        message: pickedMember.inputMessage,
        senderType: 3,
      }
      this.websocketObj.send(JSON.stringify(chatMessage));
      pickedMember.messageList.push(chatMessage);
    },
    async websocketonmessage(e) {
      let message = JSON.parse(e.data)
      message.memberKey = `${message.type}_${message.anchorId}_${message.mcnId}`

      function existUnread(list, memberKey) {
        for (let i = 0; i < list.length; i++) {
          if (list[i].memberKey === memberKey) {
            return i;
          }
        }
        return -1;
      }

      if (!this.memberInfoMap[message.senderId]) {
        await getMemberInfo(message.senderId).then(data => {
          this.memberInfoMap[message.senderId] = data.result
        })
      }

      if (message.broadcast) {
        // 主播发送的消息
        if (message.type === 0) {
          let index = existUnread(this.unreadAnchors, message.memberKey)
          // 没有未读信息，则增加一条，并且将未读数+1
          if (index === -1) {
            message.unreadCount = 1;
            message.headImgUrl = this.memberInfoMap[message.senderId].headImgUrl;
            message.username = this.memberInfoMap[message.senderId].username;
            this.unreadAnchors.push(message)
          } else {
            this.unreadAnchors[index].unreadCount++;
          }
        } else if (message.type === 1) {
          // mcn发送的消息
          let index = existUnread(this.unreadMcns, message.memberKey)
          // 没有未读信息，则增加一条，并且将未读数+1
          if (index === -1) {
            message.unreadCount = 1;
            message.headImgUrl = this.memberInfoMap[message.senderId].headImgUrl;
            message.username = this.memberInfoMap[message.senderId].username;
            this.unreadMcns.push(message)
          } else {
            this.unreadMcns[index].unreadCount++;
          }
          this.unreadMcns.push(message)
        } else if (message.type === 2) {
          // 法律咨询
          let index = existUnread(this.unreadLaws, message.memberKey)
          // 没有未读信息，则增加一条，并且将未读数+1
          if (index === -1) {
            message.unreadCount = 1;
            message.headImgUrl = this.memberInfoMap[message.senderId].headImgUrl;
            message.username = this.memberInfoMap[message.senderId].username;
            this.unreadLaws.push(message)
          } else {
            this.unreadLaws[index].unreadCount++;
          }
        }
      }else{
        for (let i = 0; i < this.pickedMembers.length; i++) {
          if (this.pickedMembers[i].memberKey === message.memberKey) {
            this.pickedMembers[i].messageList.push(message)
          }
        }
      }
    },
    websocketonopen() {
      this.connectionStatus = 'connected'
      if(!this.init){
        getUnreadMessageList(this.token).then(data => {
          this.init = true;
          let chatList = data.result;
          for (let i = 0; i < chatList.length; i++) {
            let chat = chatList[i];
            chat.memberKey = `${chat.type}_${chat.anchorId}_${chat.mcnId}`
            if (chat.type === 0) {
              this.unreadAnchors.push(chat);
            } else if (chat.type === 1) {
              this.unreadMcns.push(chat);
            } else if (chat.type === 2) {
              this.unreadLaws.push(chat);
            } else {
              console.log("unknown chat type", chat);
            }
          }
        })
      }

    },
    // 通信发生错误时触发
    websocketonerror() {
      this.connectionStatus = 'error'
      console.log("出现错误");
    },
    websocketonclose() {
      console.log("connection close");
      this.connectionStatus = 'closed'
    },
    pickup: function (memberInfo) {
      let data = {
        type: memberInfo.type,
        anchorId: memberInfo.anchorId,
        mcnId: memberInfo.mcnId,
        token: this.token,
      }
      pickupMember(data)

      getUserChatMessage(data).then((data)=>{
        let pickedMemberName = `${memberInfo.type}_${memberInfo.anchorId}_${memberInfo.mcnId}`
        // 移除未读消息对应的这个人
        if (memberInfo.type === 0) {
          this.unreadAnchors = this.unreadAnchors.filter(anchor => anchor.memberKey !== pickedMemberName)
        } else if (memberInfo.type === 1) {
          this.unreadMcns = this.unreadMcns.filter(anchor => anchor.memberKey !== pickedMemberName)
        } else if (memberInfo.type === 2) {
          this.unreadLaws = this.unreadLaws.filter(anchor => anchor.memberKey !== pickedMemberName)
        }
        let pickedMember ={
          type: memberInfo.type,
          anchorId: memberInfo.anchorId,
          mcnId: memberInfo.mcnId,
          inputMessage:'',
          memberKey: pickedMemberName,
          username: memberInfo.username,
          headImgUrl: memberInfo.headImgUrl,
          messageList:data.result,
        }
        this.pickedMembers.push(pickedMember);
        this.pickedMemberName = pickedMemberName;
      })
    },

    moreMessage(memberInfo){
      let offset = 0;
      if(memberInfo.messageList.length > 0){
        offset = memberInfo.messageList[0].id;
      }
      let data = {
        type: memberInfo.type,
        anchorId: memberInfo.anchorId,
        mcnId: memberInfo.mcnId,
        token: this.token,
        offset: offset,
      }
      getUserChatMessage(data).then(response => {
        memberInfo.messageList = response.result.concat(memberInfo.messageList);
      })
    },
    handleRemoveMember(targetName, action) {
      if (action === 'remove') {
        let data = {
          type: targetName.split("_")[0],
          anchorId: targetName.split("_")[1],
          mcnId: targetName.split("_")[2],
          token: this.token,
        }
        hangupMember(data);
        let tabs = this.pickedMembers;
        let activeName = this.pickedMemberName;
        if (activeName === targetName) {
          tabs.forEach((tab, index) => {
            if (tab.memberKey === targetName) {
              let nextTab = tabs[index + 1] || tabs[index - 1];
              if (nextTab) {
                activeName = nextTab.name;
              }
            }
          });
        }

        this.pickedMemberName = activeName;
        this.pickedMembers = tabs.filter(tab => tab.memberKey !== targetName);
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
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
