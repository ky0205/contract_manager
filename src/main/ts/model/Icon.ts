/// <reference path="../typings/knockout.d.ts" />

class Icon {
	iconPath: string;
	
	constructor(
		public id: number, 
		public filename: string, 
		public icon_type: number,
		public owner_user_id: number, 
		public owner_group_id: number) {
			this.iconPath = 'icon/' + this.filename;
	}
}