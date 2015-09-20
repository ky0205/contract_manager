/// <reference path="../typings/jquery.d.ts" />
/// <reference path="../typings/knockout.d.ts" />
/// <reference path="../typings/lodash.d.ts" />

class RegistrationAccountViewModel {
	// model
	userModel: UserModel;
	
	passCode: string;
	isCreateUserSucceed: KnockoutObservable<boolean> = ko.observable<boolean>(false);
	
	//画面項目
	account: KnockoutObservable<string> = ko.observable<string>(""); // アカウント
	mailAddress: KnockoutObservable<string> = ko.observable<string>(""); //メールアドレス
	displayName: KnockoutObservable<string> = ko.observable<string>(""); //表示名
	errorMessage: KnockoutObservable<string> = ko.observable<string>("");
	
	constructor() {
		//model初期化
        this.userModel = new UserModel();

		//パスコード取得
		var params = util.getUrlVars();
        this.passCode = params.pass_code;
		
		if(this.passCode){
			//アカウント本登録実行
			this.userModel.createUserDetermined(this.passCode).done((userJson) => {
				this.account(userJson.account);
				this.mailAddress(userJson.mail_address);
				this.displayName(userJson.name);
				this.isCreateUserSucceed(true);
			}).fail((jqXHR: JQueryXHR, textStatus, errorThrown) => {
				this.errorMessage("サーバエラーが発生しました(" + jqXHR.status + ")。");
				this.isCreateUserSucceed(false);
			});
		}else{
			//パスコード指定なし
			this.isCreateUserSucceed(false);
			this.errorMessage("無効なURLです。");
		}
	}
	
}