/// <reference path="../typings/jquery.d.ts" />
/// <reference path="../typings/knockout.d.ts" />
/// <reference path="../typings/lodash.d.ts" />

class GroupListViewModel {
	//model
	groupModel: GroupModel;
	userModel: UserModel;
	
	//画面項目
	groupViewModelList: KnockoutObservableArray<GroupViewModel> = ko.observableArray([]); //グループリスト
	errorMessage: KnockoutObservable<string> = ko.observable<string>("");

	selectedGroupId: KnockoutObservable<number> = ko.observable<number>(-1);
	isSearchMode: KnockoutObservable<boolean> = ko.observable<boolean>(false);
	searchKeyword: KnockoutObservable<string> = ko.observable<string>("");
	contentDisp: KnockoutComputed<string>;
	
	constructor() {
        //ライフサイクル処理開始
        LifecycleHandler.init();
		
		//モデル初期化
		this.userModel = new UserModel();
		this.groupModel = new GroupModel();
		
		//ローカルストレージから現在選択中のグループID(ユーザログの場合はnull)を取得
		this.selectedGroupId(AppDataManager.getSelectedGroupId());

		//グループリスト表示
		this.searchKeyword(""); //検索クエリなし(全件)
		this.updateGrouplist();
	}
	
	/**
	 * グループリストを検索・表示します。
	 */
	updateGrouplist(){
		var gvml: GroupViewModel[] = [];
		
		//ユーザログをリストの先頭に表示
		var loginUser:User = AppDataManager.getLoginUserInfo();
		console.log("selectedGroupid="+this.selectedGroupId());
		if(!this.selectedGroupId()){
			//groupIdがない場合はユーザログが選択状態
			gvml.push(new GroupViewModel(-1, loginUser.dispname+ "のログ", loginUser.icon, true, true));
		}else{
			gvml.push(new GroupViewModel(-1, loginUser.dispname+ "のログ", loginUser.icon, true, false));
		}
		this.groupViewModelList(gvml);
		
		//ユーザログの後ろにグループリストを表示
		this.groupModel.getGroupList(this.searchKeyword()).then((groupListJson) => {
			//グループリスト取得
			_.forEach(groupListJson, (groupJson: any) => {
				var icon = new Icon(null, groupJson.icon.filename, null, null, null);
				if(groupJson.id == this.selectedGroupId()){
					//選択状態のグループ
					gvml.push(new GroupViewModel(groupJson.id, groupJson.name, icon, false, true));
				}else{
					//非選択状態のグループ
					gvml.push(new GroupViewModel(groupJson.id, groupJson.name, icon, false, false));
				}
			});
			//グループリスト更新
			this.groupViewModelList(gvml);
		}).fail((jqXHR: JQueryXHR, textStatus, errorThrown) => {
            this.errorMessage("サーバーエラーが発生しました。("+ jqXHR.state +")");
        });
	}
	
	showCreateGroup() {
		window.location.href = "create_group.html";
	}
	
	showConfig() {
		//ローカルストレージに遷移前の画面情報をセット
        AppDataManager.setBeforeView("group_list.html");
		window.location.href = "config.html";
	}
	
	onSearchButtonClick() {
        //検索モードのON/OFF
        if (this.isSearchMode()) {
            this.isSearchMode(false);
			//全件表示(検索クエリなし)に戻す
            this.searchKeyword("");
			this.updateGrouplist(); 
        } else {
            this.isSearchMode(true);
        }
    }
}
