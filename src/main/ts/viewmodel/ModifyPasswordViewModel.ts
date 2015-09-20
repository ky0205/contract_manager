/// <reference path="../typings/jquery.d.ts" />
/// <reference path="../typings/knockout.d.ts" />
/// <reference path="../typings/lodash.d.ts" />
/// <reference path="../typings/md5.d.ts" />

class ModifyPasswordViewModel {
	userModel: UserModel;

	userid: number;

	oldPassword: KnockoutObservable<string> = ko.observable<string>("");
	newPassword: KnockoutObservable<string> = ko.observable<string>("");
	rePassword: KnockoutObservable<string> = ko.observable<string>("");
	
	errorMessage: KnockoutObservable<string> = ko.observable<string>("");
	errOldPassword: KnockoutObservable<string> = ko.observable<string>("");
	errNewPassword: KnockoutObservable<string> = ko.observable<string>("");
	errRePassword: KnockoutObservable<string> = ko.observable<string>("");

	constructor() {
        //ライフサイクル処理開始
        LifecycleHandler.init();
		
		//モデル初期化
        this.userModel = new UserModel();
		
		//thisのバインド
		this.onModifyPaswordButtonClicked = this.onModifyPaswordButtonClicked.bind(this);
		this.onCancelButtonClicked = this.onCancelButtonClicked.bind(this);
		
		//ローカルストレージからログインユーザ、現在選択中のグループID(ユーザログの場合はnull)、画面表示日時、発話件数を取得
        var loginUser: User = AppDataManager.getLoginUserInfo();
		this.userid = loginUser.id;
	}
	
	onModifyPaswordButtonClicked() {
		// 入力チェック
		var validateResult = true;
		// 現在のパスワード
		if (!this.validateOldPassword()) {
			validateResult = false;
		}
		// 新しいパスワード
		if (!this.validateNewPassword()) {
			validateResult = false;
		}
		// 新しいパスワードの確認
		if (!this.validateRePassword()) {
			validateResult = false;
		}
		
		//入力内容に問題がなければパスワード変更実行
		if (validateResult) {
			this.userModel.modifyPassword(
				this.userid,
				CybozuLabs.MD5.calc(this.oldPassword()), 
				CybozuLabs.MD5.calc(this.newPassword())).done((result) => {
				//ローカルストレージのパスワードを変更
				AppDataManager.setPassword(CybozuLabs.MD5.calc(this.newPassword()));
				//前の画面に遷移
				this.backToPreviousPage();
			}).fail((jqXHR: JQueryXHR, textStatus, errorThrown) => {
				if (jqXHR.status === 401) {
					// 認証失敗
					this.errorMessage("認証に失敗しました。");
				} else if (jqXHR.status === 400) {
					this.errorMessage("使用中のパスワードを正しく入力してください。");
				} else {
					this.errorMessage("サーバエラーが発生しました(" + jqXHR.status + ")。");
				}
			});
		}
	}
	
	/** 画面遷移メソッド  */

	/**
	 * 前の画面(設定画面)に遷移します。
	 */
	onCancelButtonClicked() {
		this.backToPreviousPage();
	}
	
	/**
	 * 設定画面に遷移します。
	 */
	backToPreviousPage() {
		window.location.href = "config.html";
	}

	
	/** バリデーションメソッド */
	
	//現在のパスワード
	validateOldPassword(): boolean {
		if (!this.oldPassword()) {
			this.errOldPassword("使用中のパスワードを入力してください。");
			return false;
		}
		this.errOldPassword(""); //エラーメッセージクリア
		return true;
	}
	//新しいパスワード
	validateNewPassword(): boolean {
		if (!this.newPassword()) {
			this.errNewPassword("新しいパスワードを入力してください。");
			return false;
		}
		if (!this.newPassword().match(/^[a-zA-Z0-9-/:-@\[-\`\{-\~]+$/)) {
			this.errNewPassword("新しいパスワードに利用可能な文字は、半角英数記号で、8文字以上32文字以内です。");
			return false;
		}
		if (this.newPassword().length < 8 || this.newPassword().length > 32) {
			this.errNewPassword("新しいパスワードに利用可能な文字は、半角英数記号で、8文字以上32文字以内です。");
			return false;
		}
		this.errNewPassword(""); //エラーメッセージクリア
		return true;
	}
	//新しいパスワードの確認
	validateRePassword(): boolean {
		if (!this.rePassword()) {
			this.errRePassword("パスワードの確認を入力してください。");
			return false;
		}
		if (this.newPassword() !== this.rePassword()) {
			this.errRePassword("パスワードが一致しません。");
			return false;
		}
		this.errRePassword(""); //エラーメッセージクリア
		return true;
	}

}
