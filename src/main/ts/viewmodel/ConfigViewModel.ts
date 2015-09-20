/// <reference path="../typings/jquery.d.ts" />
/// <reference path="../typings/knockout.d.ts" />
/// <reference path="../typings/lodash.d.ts" />

class ConfigViewModel {
	// model
	userModel : UserModel;
	configModel : ConfigModel;
	
	ref: string;
	targetdate: string;
	groupid: string;

	contractId: KnockoutObservable<string> = ko.observable<string>(); //契約ID
	userId: KnockoutObservable<number> = ko.observable<number>(); //ユーザID
	account: KnockoutObservable<string> = ko.observable<string>(); //アカウント
	mailAddress: KnockoutObservable<string> = ko.observable<string>(); //表示名
	displayName: KnockoutObservable<string> = ko.observable<string>(); //メールアドレス
	selectedIconId: KnockoutObservable<number> = ko.observable<number>(); //アイコンID
	iconlist: KnockoutObservableArray<Icon> = ko.observableArray<Icon>([]); //設定可能なアイコンリスト
	selectedModelId: KnockoutObservable<number> = ko.observable<number>(-1); //設定したモデルID
	currentModelId: number; //現在のモデルID
	modellist: KnockoutObservableArray<Model> = ko.observableArray<Model>([]); //設定可能なモデルリスト
	appVersion: KnockoutObservable<string> = ko.observable<string>("");
	
	// エラーメッセージ
	errDispName: KnockoutObservable<string> = ko.observable<string>("");
	errorMessage: KnockoutObservable<string> = ko.observable<string>("");
	
	constructor() {
        //ライフサイクル処理開始
        LifecycleHandler.init();
		
		//model初期化
        this.userModel = new UserModel();
		this.configModel = new ConfigModel();

		//thisのbind
		this.onSetButtonClicked = this.onSetButtonClicked.bind(this);
		this.onChangePasswordButtonClicked = this.onChangePasswordButtonClicked.bind(this);
		this.onLogoutButtonClicked = this.onLogoutButtonClicked.bind(this);
		this.updateCurrentConfig = this.updateCurrentConfig.bind(this);
		this.onClickIcon = this.onClickIcon.bind(this);
		this.updateSelectModel = this.updateSelectModel.bind(this);

		//初期表示
		this.updateCurrentConfig();
	}

	/**
	 * 現在の設定情報を表示します
	 */
	updateCurrentConfig() {
		//ローカルストレージから契約ID、ログインユーザ情報を取得
		var contractId = AppDataManager.getContractId();
        var loginUser:User = AppDataManager.getLoginUserInfo();
		
		//ユーザ情報表示
		this.contractId(contractId);
		this.userId(loginUser.id);
		this.account(loginUser.account);
		this.mailAddress(loginUser.mailaddress);
		this.displayName(loginUser.dispname);
		this.currentModelId = loginUser.model.id;
		
		this.userModel.getAvailabeUserIconList().then((iconListJson) => {
			//アイコンリスト表示
			_.forEach((iconListJson), (iconJson: any) => {
				var icon = new Icon(iconJson.id, iconJson.filename, iconJson.icon_type, null, null);
				this.iconlist.push(icon);
            });
			this.selectedIconId(loginUser.icon.id);
			return this.userModel.getAvailableModelList();
		}).then((modelListJson) => {
			//モデルリスト表示
			var tempModelList: Model[] = [];
			_.forEach((modelListJson), (modelJson: any) => {
				var model = new Model(modelJson.model_id, modelJson.name);
				tempModelList.push(model);				
            });
			this.modellist(tempModelList);
			return this.configModel.getApplicationVersion();
		}).then((version) => {
			// アプリケーションバージョン表示
			this.appVersion(version);
		}).fail((jqXHR: JQueryXHR, textStatus, errorThrown) => {
			if (jqXHR.status === 401) {
				// 認証失敗
				this.errorMessage("認証に失敗しました");
			} else {
				// サーバーエラー
				this.errorMessage("サーバでエラーが発生しました(" + jqXHR.status + ")。");
			}
		});
	}
	
	/**
	 * 設定情報を変更します
	 */
	onSetButtonClicked() {
		// 入力チェック
		if (this.validateDispName()) {
			//設定情報作成
			var icon = new Icon(this.selectedIconId(), null, null, null, null);
			var model = new Model(this.selectedModelId(), null);
			var user = new User(
				null,
				null,
				this.userId(),
				this.account(),
				null,
				this.mailAddress(),
				this.displayName(),
				icon,
				model,
				null);
			
			//設定変更実行
			this.userModel.modifyProfile(user).done((userJson) => {
				//変更したユーザ情報をローカルストレージに反映
				AppDataManager.setLoginUserInfo(userJson);
				//前の画面に遷移
				this.backToPreviousPage();
			}).fail((jqXHR: JQueryXHR, textStatus, errorThrown) => {
				if (jqXHR.status === 401) {
					// 認証失敗
					this.errorMessage("認証に失敗しました");
				} else {
					// サーバーエラー
					this.errorMessage("サーバでエラーが発生しました(" + jqXHR.status + ")。");
				}
			});
		}
	}
	
	/**
	 * アイコンを設定します。
	 */
	onClickIcon(icon_id : number){
		this.selectedIconId(icon_id);
	}
	
	/**
	 * モデルを設定します。
	 */
	onSelectModel(model_id: number) {
		this.selectedModelId(model_id);
	}
	
	updateSelectModel(option, model){
		if(model.id === this.currentModelId){
			this.selectedModelId(this.currentModelId);
		}
	}
	
	/**
	 * 遷移元ページに戻ります
	 */
	backToPreviousPage() {
		window.location.href = AppDataManager.getBeforeView();
	}

	/**
	 * パスワード変更画面に遷移します。
	 */
	onChangePasswordButtonClicked() {
		window.location.href = "modify_password.html";
	}

	/**
	 * ログアウトします(ログイン画面に遷移)
	 */
	onLogoutButtonClicked() {
		//ローカルストレージの情報をクリア
		AppDataManager.clearAppData();
		//ログイン画面に遷移
		window.location.href = 'login.html';
	}

	// バリデーション：表示名
	validateDispName(): boolean {
		if (!this.displayName()) {
			this.errDispName("表示名を入力してください。");
			return false;
		}
		this.errDispName("");
		return true;
	}
	
}
