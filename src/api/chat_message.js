import request from '@/api/request'

export function getUserChatMessage(data) {
  return request({
    url: '/chat/user/message',
    method: 'post',
    data
  })
}

export function getMemberChatMessage(data) {
  return request({
    url: '/chat/member/message',
    method: 'post',
    data
  })
}

export function getUnreadMessageList(token) {
  return request({
    url: `/user/unreadMessageList?token=${token}`,
    method: 'get',
  })
}