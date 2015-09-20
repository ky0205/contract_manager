/// <reference path="../typings/knockout.d.ts" />

class Speech {
	constructor(
		public id: number, 
		public content: string, 
		public begin_date: Date,
		public end_date: Date,
		public session_key: string,
		public speechUser: User,
		public speechGroup: Group) {
	}
}
