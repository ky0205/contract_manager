/// <reference path="../typings/knockout.d.ts" />

class User {
	
	constructor(
		public registration_key: string, 
		public contractid: string, 
		public id: number, 
		public account: string, 
		public password: string,
		public mailaddress: string, 
		public dispname: string, 
		public icon: Icon,
		public model: Model,
		public role_id: number) {
			//knockoutでiconやmodelを参照したときにエラーにならないように初期化しておく
			if(!icon){
				this.icon = new Icon(null,null,null,null,null);
			}
			if(!model){
				this.model = new Model(null,null);
			}
	}

	enableDelMemberButton : KnockoutObservable<boolean> = ko.observable<boolean>(false);

}