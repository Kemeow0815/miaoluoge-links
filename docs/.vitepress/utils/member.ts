import members from '../data/members.json'
import { getDomain } from './link'

export interface Member {
    name: string
    title: string
    desc: string

    avatarType: 'github' | 'qq' | 'url' | (string & {})
    avatar: string

    github: string
    website: string
    feed: string

    screenshot?: string
}

export function getAvatarUrl(option: { avatarType: string, avatar: string }) {
    const { avatarType: type, avatar } = option
    if (type === 'github')
        return `https://avatars-githubusercontent.webp.se/${avatar}?s=96`
    if (type === 'qq')
        return `https://q1.qlogo.cn/g?b=qq&nk=${avatar}&s=4`
    if (type === 'url')
        return avatar
    return ''
}

const membersByFeed: Record<string, Member> = members.reduce((acc, member) => {
    if (member.feed)
        acc[getDomain(member.feed)] = member
    return acc
}, {} as Record<string, Member>)

export function getMemberByFeed(feed: string) {
    return membersByFeed[getDomain(feed)] ?? {}
}
