/// <reference path="../typings/knockout.d.ts" />

class GroupViewModel {
	constructor(
		public id: number, 
		public name: string, 
		public icon: Icon,
		public isPersonalLog: boolean = false,
		public isSelected: boolean = false) {
		
		this.selectTargetView = this.selectTargetView.bind(this);
	}
	
	selectTargetView() {
		//ローカルストレージに選択したグループIDを設定
		if(this.isPersonalLog){
			//ユーザログの場合はnullをセット
			AppDataManager.setSelectedGroupId(null);
		}else{
			//グループログ
			AppDataManager.setSelectedGroupId(this.id);
		}
		
		//画面遷移
		window.location.href = AppDataManager.getBeforeGroupListView();
		
	}
	
	showGroupConfig() {
		//ローカルストレージに選択したグループIDを設定
		if(this.isPersonalLog){
			//ユーザログの場合はnullをセット
			AppDataManager.setSelectedGroupId(null);
		}else{
			//グループログ
			AppDataManager.setSelectedGroupId(this.id);
		}
		
		//画面遷移
		window.location.href = "modify_group.html";
	}
	
}
