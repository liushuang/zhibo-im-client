import request from '@/api/request'

export function pickupMember(data) {
  return request({
    url: '/user/pickup',
    method: 'post',
    data
  })
}

export function hangupMember(data) {
  return request({
    url: '/user/hangup',
    method: 'post',
    data
  })
}

export async function getMemberInfo(memberId) {
  return request({
    url: `/member/info/${memberId}`,
    method: 'get',
  })
}

export function getCurrentMemberInfo(token) {
  return request({
    url: `/member/currentInfo?token=${token}`,
    method: 'get',
  })
}