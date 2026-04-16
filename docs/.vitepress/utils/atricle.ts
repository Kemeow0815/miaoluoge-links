export interface ArticleSource {
	name: string
	website: string
	avatar: string
	avatarType: string
}

export interface Article {
	_id: string
	id: string
	title: string
	link: string
	date: string
	author: string
	summary: string
	source?: ArticleSource
}
