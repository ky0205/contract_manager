/// <reference path="../typings/jquery.d.ts" />
/// <reference path="../typings/knockout.d.ts" />
/// <reference path="../typings/lodash.d.ts" />

class ModifyGroupViewModel {
	//model
	userModel: UserModel;
	groupModel: GroupModel;
	
	//画面項目
	group: KnockoutObservable<Group> = ko.observable<Group>(new Group(null,null,null,null,null));
	memberList: KnockoutObservableArray<User> = ko.observableArray<User>([]);
	errorMessage: KnockoutObservable<string> = ko.observable<string>();
	searchKeyword: KnockoutObservable<string> = ko.observable<string>("");
	selectedIconId: KnockoutObservable<number> = ko.observable<number>(); //アイコンID
	iconlist: KnockoutObservableArray<Icon> = ko.observableArray<Icon>([]); //設定可能なアイコンリスト
	selectedModelId: KnockoutObservable<number> = ko.observable<number>(); //モデルID
	currentModelId: number;
	selectedRoleId: KnockoutObservable<string> = ko.observable<string>("3");
	modellist: KnockoutObservableArray<Model> = ko.observableArray<Model>([]); //設定可能なモデルリスト
	initialMemberList: User[] = [];
	hasGroupAdminRole : KnockoutObservable<boolean> = ko.observable<boolean>(false);

	constructor() {
        //ライフサイクル処理開始
        LifecycleHandler.init();
		
		this.onAddMemberButtonClicked = this.onAddMemberButtonClicked.bind(this);
		this.onDelMemberButtonClicked = this.onDelMemberButtonClicked.bind(this);
		this.onClickIcon = this.onClickIcon.bind(this);
		this.updateSelectModel = this.updateSelectModel.bind(this);
		
		//model初期化
		this.userModel = new UserModel();
		this.groupModel = new GroupModel();
		
		//ローカルストレージから現在選択中のグループID(ユーザログの場合はnull)を取得
        var groupId = AppDataManager.getSelectedGroupId();
		
		//初期表示
		this.groupModel.getGroup(groupId).then((groupJson) => {
			//グループ情報取得&表示
			var icon = new Icon(
				groupJson.icon.id, 
				groupJson.icon.filename,
				groupJson.icon.icon_type, 
				-1, 
				-1);
			var grp = new Group(
				groupJson.id,
				groupJson.name,
				icon, 
				groupJson.model_id, 
				groupJson.owner_id
				);
			this.group(grp);
			this.selectedModelId(groupJson.model_id);
			this.currentModelId = groupJson.model_id;
			this.selectedIconId(groupJson.icon.id);
			return this.groupModel.getMemberList(groupId);
		}).then((userListJson) => {
			//グループに所属するユーザリスト取得
			var tmpUsrList: User[] = [];
			_.forEach(userListJson, (userJson: any) => {
				var icon = new Icon(null, userJson.icon.filename, null, null, null);
				var user = new User(null,null,userJson.id,userJson.account,null,userJson.mail_address,userJson.name, icon, null,userJson.role_id);
				tmpUsrList.push(user);
				this.initialMemberList.push(user);
			});

			//メンバーリスト更新
			this.updateMember(tmpUsrList);

			return this.userModel.getAvailableModelList();
		}).then((modelListJson) => {
			//モデルリスト表示
			_.forEach((modelListJson), (modelJson: any) => {
				var model = new Model(modelJson.model_id, modelJson.name);
				this.modellist.push(model);
				//現在設定されているモデルを選択状態にする`
				if(model.id === this.selectedModelId()){
					this.selectedModelId(model.id);
				}
            });
			return this.groupModel.getAvailabeGroupIconList();
		}).then((iconListJson) => {
			//アイコンリスト表示
			_.forEach((iconListJson), (iconJson: any) => {
				var icon = new Icon(iconJson.id, iconJson.filename, iconJson.icon_type, null, null);
				this.iconlist.push(icon);
            });
		}).fail((jqXHR: JQueryXHR, textStatus, errorThrown) => {
			if (jqXHR.status === 401) {
				// 認証失敗
				this.errorMessage("認証に失敗しました。");
			} else {
				this.errorMessage("サーバエラーが発生しました(" + jqXHR.status + ")。");
			}
		});

		var jqelem : any = $('#newMember');

		this.userModel.getUserList('').done( (userList) => {
			var candidate = [];
			_.forEach((userList),(u:any) => {
				candidate.push({ 'label' : u.account , 'value' : u.account });
			});
			jqelem.autocomplete({
				source : candidate
			});
		}).fail( (error) => {
		});

	}
	
	updateMember( userList : User[] ) {

		var selfUser = AppDataManager.getLoginUserInfo();
		var groupAdminUserCount = 0;

		_.forEach(userList, (u) => {
			if (u.role_id <= 2 ) {
				if ( selfUser.id === u.id ) {
					this.hasGroupAdminRole( true );
				}
				groupAdminUserCount++;
			}
		});
		
		_.forEach(userList , (u) => {
			if (this.hasGroupAdminRole()) {
				u.enableDelMemberButton(true);
			} else if (selfUser.id === u.id) {
				u.enableDelMemberButton(true);
			} else {
				u.enableDelMemberButton(false);
			}
			// グループ管理者が1名のとき、グループ管理者の削除ボタンを非表示にする
			if (u.role_id === 2 && groupAdminUserCount === 1) {
				u.enableDelMemberButton(false);
			}
		});
	
		this.memberList(userList);

	}
	
	onAddMemberButtonClicked() {

		var jqelem : any = $('#newMember'); 
		var newMemberAccount = jqelem.val();
		var memList : User[] = this.memberList();
		var alreadyExist = false;
		_.forEach((memList),(m) => {
			if (m.account === newMemberAccount) {
				alreadyExist = true;
			}
		});

		if (!alreadyExist) {
			this.userModel.getUserList(newMemberAccount).done( (userList) => {
				_.forEach( (userList) , (u:any) => {
					if (u.account === newMemberAccount) {
						var icon = new Icon(null, u.icon.filename, null, null, null);
						var user = new User(null,null,u.id,u.account,null,u.mail_address,u.name, icon, null, +this.selectedRoleId());
						memList.push(user);
						this.updateMember(memList);
					}
				});
			}).fail((jqXHR: JQueryXHR, textStatus, errorThrown) => {
				if (jqXHR.status === 401) {
					// 認証失敗
					this.errorMessage("認証に失敗しました。");
				} else {
					this.errorMessage("サーバエラーが発生しました(" + jqXHR.status + ")。");
				}
			});
		}
	}
	
	onDelMemberButtonClicked(data:User) {
		var modifiedMemberList = _.remove(this.memberList(), (u) => {
			if (u.account === data.account) {
				return false;
			}
			return true;
		});
		this.updateMember(modifiedMemberList);
	}
	
	diff( userList1 : User[] , userList2 : User[] ) {
		return _.filter( userList1 , (u1) => {
			var found : any = _.find( userList2 , (u2) => {
				if (u1.id === u2.id) {
					return true;
				}
				return false;
			});
			if (found) {
				return false;
			} else {
				return true;
			}
		});
	}

	onModifyGroupButtonClicked() {

		var dialog : any = $('#modify-group-dlg');

		dialog.dialog({
			modal : true ,
			width : 700 ,
			buttons : {
				'変更': () => {
					var groupId = AppDataManager.getSelectedGroupId();
					var delMembers = this.diff(this.initialMemberList, this.memberList());
					var newMembers = this.diff(this.memberList(), this.initialMemberList);

					var deleteMemberStatus: any = "empty";
					if (delMembers.length > 0) {
						deleteMemberStatus = this.groupModel.deleteMember(groupId, delMembers);
					}

					var addMemberStatus: any = "empty";
					if (newMembers.length > 0) {
						addMemberStatus = this.groupModel.addMember(groupId, newMembers);
					}

					var oldGroup = this.group();
					var modGroupStatus: any = "empty";
					if (oldGroup.icon.id !== this.selectedIconId() || oldGroup.model.id !== this.selectedModelId()) {
						var newIcon = new Icon(this.selectedIconId(), null, null, -1, -1);
						var newModel = new Model(this.selectedModelId(), null);
						var grp = new Group(oldGroup.id, oldGroup.name, newIcon, newModel, oldGroup.owner_id);
						modGroupStatus = this.groupModel.modifyGroup(grp);
					}

					$.when(deleteMemberStatus, addMemberStatus, modGroupStatus).done((r1, r2, r3) => {
						window.location.href = 'group_list.html';
					}).fail((jqXHR: JQueryXHR) => {
						if (jqXHR.status === 401) {
							// 認証失敗
							this.errorMessage("認証に失敗しました。");
						} else {
							this.errorMessage("サーバエラーが発生しました(" + jqXHR.status + ")。");
						}
					});

					dialog.dialog('close');
				} ,
				'キャンセル' : () => {
					dialog.dialog('close');
				}
			}
		});

	}

	onCancelButtonClicked() {
		window.location.href = 'group_list.html';
	}

	onDeleleGroupButtonClicked() {

		var dialog : any = $('#delete-group-dlg');

		dialog.dialog({
			modal : true ,
			width : 700 ,
			buttons : {
				'削除' : () => {
			        var groupId = AppDataManager.getSelectedGroupId();
					this.groupModel.deleteGroup(groupId).done((result) => {
						window.location.href = 'group_list.html';
					}).fail((jqXHR: JQueryXHR) => {
						if (jqXHR.status === 401) {
							// 認証失敗
							this.errorMessage("認証に失敗しました。");
						} else {
							this.errorMessage("サーバエラーが発生しました(" + jqXHR.status + ")。");
						}
					});
					dialog.dialog('close');
				} ,
				'キャンセル' : () => {
					dialog.dialog('close');
				}
			}
		});

	}

	/**
	 * アイコンを設定します。
	 */
	onClickIcon(data) {
		this.selectedIconId(data.id);
	}

	updateSelectModel(option, model){
		if(model.id === this.currentModelId){
			this.selectedModelId(this.currentModelId);
		}
	}
	
}
