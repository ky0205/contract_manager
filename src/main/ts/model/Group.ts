class Group {	
	constructor(
		public id: number, 
		public name: string, 
		public icon: Icon,
		public model: Model,
		public owner_id: number) {
			//knockoutでiconやmodelを参照したときにエラーにならないように初期化しておく
			if(!icon){
				this.icon = new Icon(null,null,null,null,null);
			}
			if(!model){
				this.model = new Model(null,null);
			}
		}

	setName(newName : string) {
		this.name = newName;
	}
}