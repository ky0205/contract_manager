/// <reference path="../typings/jquery.d.ts" />
/// <reference path="../typings/knockout.d.ts" />
/// <reference path="../typings/lodash.d.ts" />

class CreateGroupViewModel {
	
	userModel: UserModel;
	groupModel: GroupModel;
	
	userId: number;
	
	contractId: KnockoutObservable<string> = ko.observable<string>(); //契約ID
	groupName: KnockoutObservable<string> = ko.observable<string>("");
	selectedIconId: KnockoutObservable<number> = ko.observable<number>(-1);
	iconlist: KnockoutObservableArray<Icon> = ko.observableArray<Icon>([]); //設定可能なアイコンリスト
	selectedModelId: KnockoutObservable<number> = ko.observable<number>(); //設定したモデルID
	modellist: KnockoutObservableArray<Model> = ko.observableArray<Model>(); 
	currentModelId: number; //現在のモデルID
	blockUI: KnockoutObservable<boolean> = ko.observable<boolean>(false);
	
	// エラーメッセージ
	errGroupName: KnockoutObservable<string> = ko.observable<string>("");
	errorMessage: KnockoutObservable<string> = ko.observable<string>("");
	
	constructor() {
        //ライフサイクル処理開始
        LifecycleHandler.init();
		
		// model初期化
		this.userModel = new UserModel();
		this.groupModel = new GroupModel();
		
		// thisのbind
		this.onCreateButtonClicked = this.onCreateButtonClicked.bind(this);
		this.onClickIcon = this.onClickIcon.bind(this);
		
		// 初期表示
		this.updateCurrentInfo();
	}

	/**
	 * 初期画面表示に必要な情報を取得します。
	 */
	updateCurrentInfo() {
		this.contractId(AppDataManager.getContractId());
		this.userModel.getMyself().then((userJson) => {
			this.userId = userJson.id;
			return this.groupModel.getAvailabeGroupIconList();
		}).then((iconListJson) => {
			// アイコンリスト表示
			_.forEach((iconListJson), (iconJson: any) => {
				var icon = new Icon(iconJson.id, iconJson.filename, iconJson.icon_type, null, null);
				this.iconlist.push(icon);
				if (this.selectedIconId() === -1) {
					this.selectedIconId(icon.id);
				}
			});
			return this.userModel.getAvailableModelList();
		}).then((modelListJson) => {
			// モデルリスト表示
			var tempModelList: Model[] = [];
			_.forEach((modelListJson), (modelJson: any) => {
				var model = new Model(modelJson.model_id, modelJson.name);
				tempModelList.push(model);				
            });
			this.modellist(tempModelList);
		}).fail((jqXHR: JQueryXHR, textStatus, errorThrown) => {
			if (jqXHR.status === 401) {
				// 認証失敗
				this.errorMessage("認証に失敗しました。");
			} else {
				this.errorMessage("サーバエラーが発生しました(" + jqXHR.status + ")。");
			}
		});
	}
	
	/**
	 * 新規グループを作成します。
	 */
	onCreateButtonClicked() {
		// 入力チェック
		var validateResult = true;
		if (!this.validateGroupName()) {
			validateResult = false;
		}
		
		if (validateResult) {
			var icon = new Icon(this.selectedIconId(), null, null, null, null);
			var model = new Model(this.selectedModelId(), null);
			var group = new Group(-1, this.groupName(), icon, model, this.userId);

			this.blockUI(true); // 連打防止

			this.groupModel.createGroup(group).then((result) => {
				this.backToGroupListPage();
			}).fail((jqXHR: JQueryXHR, textStatus, errorThrown) => {
				this.blockUI(false);
				if (jqXHR.status === 401) {
					// 認証失敗
					this.errorMessage("認証に失敗しました");
				} else {
					this.errorMessage("サーバエラーが発生しました(" + jqXHR.status + ")。");
				}
			});
			
		}
	}

	/**
	 * アイコンを設定します。
	 */
	onClickIcon(data) {
		this.selectedIconId(data.id);
	}
	
	/**
	 * モデルを設定します。
	 */
	onSelectModel(model_id: number) {
		this.selectedModelId(model_id);
	}
	
	/**
	 * グループ一覧画面に遷移します。
	 */
	backToGroupListPage() {
		window.location.href = "group_list.html";
	}
	
	/** バリデーション */
	
	// グループ名
	validateGroupName(): boolean {
		if (!this.groupName()) {
			this.errGroupName("グループ名を入力してください。");
			return false;
		}
		this.errGroupName("");
		return true;
	}
}
