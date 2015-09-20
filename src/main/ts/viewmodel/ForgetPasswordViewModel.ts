/// <reference path="../typings/jquery.d.ts" />
/// <reference path="../typings/knockout.d.ts" />
/// <reference path="../typings/lodash.d.ts" />

class ForgetPasswordViewModel {
	//model
	userModel: UserModel;
	
	//画面項目 
	registrationKey: KnockoutObservable<string> = ko.observable<string>("");
	contractId: KnockoutObservable<string> = ko.observable<string>("");
	account: KnockoutObservable<string> = ko.observable<string>("");
	mailAddress: KnockoutObservable<string> = ko.observable<string>("");
	isSendButtonClicked: KnockoutObservable<boolean> = ko.observable<boolean>(false);
	
	//エラー
	errRegistrationKey: KnockoutObservable<string> = ko.observable<string>(""); //登録キー
	errContractId: KnockoutObservable<string> = ko.observable<string>(""); //契約ID
	errAccount: KnockoutObservable<string> = ko.observable<string>(""); //アカウント
	errMailAddress: KnockoutObservable<string> = ko.observable<string>(""); //メールアドレス
	errorMessage: KnockoutObservable<string> = ko.observable<string>("");

	constructor() {
		//model初期化
		this.userModel = new UserModel();
		
		//thisのバインド
		this.requestResetPassword = this.requestResetPassword.bind(this);
	}
	
	/**
	 * パスワード再発行を依頼します。
	 */
	requestResetPassword() {
		this.isSendButtonClicked(true);
		
		// 入力チェック
		var validateResult = true;
		//登録キー
		if (!this.validateRegistrationKey()) {
			validateResult = false;
		}
		//契約ID
		if (!this.validateContractId()) {
			validateResult = false;
		}
		//アカウント
		if (!this.validateAccount()) {
			validateResult = false;
		}
		//メールアドレス
		if (!this.validateMailAddress()) {
			validateResult = false;
		}
		
		//入力内容に問題がなければパスワード再発行依頼実行
		if (validateResult) {
			var user = new User(this.registrationKey(), this.contractId(), null, this.account(), null, this.mailAddress(), null, null, null, null);
			this.userModel.requestResetPassword(user).done((result) => {
				alert("メールを送信しました。")
				window.location.href = 'login.html';
			}).fail((jqXHR: JQueryXHR, textStatus, errorThrown) => {
				this.isSendButtonClicked(false);
				if (jqXHR.status === 400) {
					// 指定されたアカウントがhitしない
					this.errorMessage("アカウントが見つかりませんでした。入力項目をご確認ください。");
				} else {
					this.errorMessage("サーバエラーが発生しました(" + jqXHR.status + ")。");
				}
			});
		} else {
			this.isSendButtonClicked(false);
		}
	}

	/**
	 * ログイン画面に戻ります。
	 */
	returnToLoginView() {
		window.location.href = 'login.html';
	}
	
	/** バリデーションメソッド */
	
	//登録キー
	validateRegistrationKey(): boolean {
		if (!this.registrationKey() || this.registrationKey() === "") {
			this.errRegistrationKey("登録キーを入力してください。");
			return false;
		}
		this.errRegistrationKey(""); //エラーメッセージクリア
		return true;
	}
	//契約ID
	validateContractId(): boolean {
		if (!this.contractId() || this.contractId() === "") {
			this.errContractId("契約IDを入力してください。");
			return false;
		}
		this.errContractId(""); //エラーメッセージクリア
		return true;
	}
	//アカウント
	validateAccount(): boolean {
		if (!this.account() || this.account() === "") {
			this.errAccount("アカウントを入力してください。");
			return false;
		}
		this.errAccount(""); //エラーメッセージクリア
		return true;
	}
	//メールアドレス
	validateMailAddress(): boolean {
		if (!this.mailAddress() || this.mailAddress() === "") {
			this.errMailAddress("メールアドレスを入力してください。");
			return false;
		}
		if (!this.mailAddress().match(/\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/)) {
			this.errMailAddress("メールアドレスの形式が正しくありません。");
			return false;
		}
		this.errMailAddress(""); //エラーメッセージクリア
		return true;
	}

}
