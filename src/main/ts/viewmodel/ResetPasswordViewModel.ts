/// <reference path="../typings/jquery.d.ts" />
/// <reference path="../typings/knockout.d.ts" />
/// <reference path="../typings/lodash.d.ts" />
/// <reference path="../typings/md5.d.ts" />

class ResetPasswordViewModel {
	// model
	userModel: UserModel;
	
	passCode: string;
	isCreateUserSucceed: KnockoutObservable<boolean> = ko.observable<boolean>(false);
	
	//画面項目
	password: KnockoutObservable<string> = ko.observable<string>("");
	rePassword: KnockoutObservable<string> = ko.observable<string>("");
	errorMessage: KnockoutObservable<string> = ko.observable<string>("");
	
	constructor() {
		//model初期化
        this.userModel = new UserModel();

		//パスコード取得
		var params = util.getUrlVars();
        this.passCode = params.pass_code;
		
		this.resetPassword = this.resetPassword.bind(this);
	}
	
	resetPassword() {
		//validate
		var validateResult = true;
		
		if (!this.validatePassword()) {
			validateResult = false;
		} else if (!this.validateRePassword()) {
			validateResult = false;
		}
		
		if (validateResult) {
			this.userModel.resetPassword(CybozuLabs.MD5.calc(this.password()), this.passCode).done((userJson) => {
				alert(userJson.account + "のパスワードを変更しました。");
				window.close();
			}).fail((jqXHR: JQueryXHR, textStatus, errorThrown) => {
				this.errorMessage("サーバエラーが発生しました(" + jqXHR.status + ")。");
			})
		}
	}
	
	validatePassword(): boolean {
		if (!this.password()) {
			this.errorMessage("パスワードを入力してください。")
			return false;
		}
		if (!this.password().match(/^[a-zA-Z0-9-/:-@\[-\`\{-\~]+$/)) {
			this.errorMessage("パスワードに利用可能な文字は、半角英数記号で、8文字以上32文字以内です。");
			return false;
		}
		if (this.password().length < 8 || this.password().length > 32) {
			this.errorMessage("パスワードに利用可能な文字は、半角英数記号で、8文字以上32文字以内です。");
			return false;
		}
		this.errorMessage(""); //エラーメッセージクリア
		console.log("pass ok");
		return true;
	}
	
	validateRePassword(): boolean {
		if (!this.rePassword()) {
			this.errorMessage("パスワードの確認を入力してください。");
			return false;
		}
		if (this.password() !== this.rePassword()) {
			this.errorMessage("パスワードが一致しません。");
			return false;
		}
		this.errorMessage(""); //エラーメッセージクリア
		return true;
	}
}