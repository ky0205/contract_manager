/// <reference path="../typings/jquery.d.ts" />
/// <reference path="../typings/knockout.d.ts" />
/// <reference path="../typings/lodash.d.ts" />
/// <reference path="../typings/md5.d.ts" />

class LoginViewModel {
	//model
	loginModel: LoginModel;
	userModel: UserModel;
	
	//画面項目
	contractId: KnockoutObservable<string> = ko.observable<string>(""); //契約ID
	account: KnockoutObservable<string> = ko.observable<string>(""); // アカウント
	password: KnockoutObservable<string> = ko.observable<string>(""); //パスワード
	
	//エラーメッセージ
	errContractId: KnockoutObservable<string> = ko.observable<string>(""); //契約ID
	errAccount: KnockoutObservable<string> = ko.observable<string>(""); // アカウント
	errPassword: KnockoutObservable<string> = ko.observable<string>(""); //パスワード
	errorMessage: KnockoutObservable<string> = ko.observable<string>("");

	constructor() {
		//model初期化
		this.loginModel = new LoginModel();
		this.login = this.login.bind(this);
		
		var userInfo = AppDataManager.getLoginUserInfo();
		if (userInfo && userInfo.account && userInfo.contractid && userInfo.password) {
			this.loginAndSaveUserInfo(userInfo.contractid, userInfo.account, userInfo.password, (jqXHR: JQueryXHR, textStatus, errorThrown) => {
				//ローカルストレージ初期化
				AppDataManager.clearAppData();
			});
		} else {
			//ローカルストレージ初期化
			AppDataManager.clearAppData();
		}
		
	}
	
	/**
	 * ログインします
	 */
	login() {
		this.errorMessage(""); //エラーメッセージは一旦クリア
		
		// 入力チェック
		var validateResult = true;
		//契約ID
		if (!this.validateContractId()) {
			validateResult = false;
		}
		//アカウント
		if (!this.validateAccount()) {
			validateResult = false;
		}
		//パスワード
		if (!this.validatePasswd()) {
			validateResult = false;
		}
		
		//入力内容に問題がなければログイン実行
		if (validateResult) {
			this.loginAndSaveUserInfo(this.contractId(), this.account(), CybozuLabs.MD5.calc(this.password()), (jqXHR: JQueryXHR, textStatus, errorThrown) => {
				if(jqXHR.status === 401){
					this.errorMessage("契約ID、アカウントまたはパスワードが正しくありません");
				}else{
					this.errorMessage("サーバでエラーが発生しました("+ jqXHR.status +")");
				}
			});
		}
	}
	
	loginAndSaveUserInfo(contractId:string, account:string, md5HashedPassword:string, failHandler:any) {
		this.loginModel.login(contractId, account, md5HashedPassword).then((loginJson) => {
			//認証結果から認証トークンと契約IDをローカルストレージにセット
			AppDataManager.setAuthToken(loginJson.token_key);
			AppDataManager.setContractId(loginJson.contract_id);
			//ログインユーザ情報取得
			this.userModel = new UserModel();
			return this.userModel.getMyself();
		}).then((userJson) => {
			//ログインユーザ情報をローカルストレージに格納
			AppDataManager.setLoginUserInfo(userJson);
			AppDataManager.setPassword(md5HashedPassword); //パスワードはuserJsonのレスポンスに含まれないので入力値をセット
			//タグクラウド画面に遷移
			window.location.href = "tag_cloud.html";
		}).fail(failHandler);
	}
	
	/**画面遷移メソッド*/
	/**
	 * アカウント登録画面に遷移します。
	 */
	moveToRegisterAccountPage(){
		window.location.href = "create_account.html";
	}
	
	/**
	 * パスワード再発行画面に遷移します。
	 */
	moveToForgetPasswordPage(){
		window.location.href = "forget_password.html";
	}
	
	/** バリデーションメソッド */
	//契約ID
	validateContractId(): boolean {
		if (!this.contractId()) {
			this.errContractId("契約IDを入力してください。");
			return false;
		}
		this.errContractId(""); //エラーメッセージクリア
		return true;
	}
	//アカウント
	validateAccount(): boolean {
		if (!this.account()) {
			this.errAccount("アカウントを入力してください。");
			return false;
		}
		this.errAccount(""); //エラーメッセージクリア
		return true;
	}
	//パスワード
	validatePasswd(): boolean {
		if (!this.password()) {
			this.errPassword("パスワードを入力してください。");
			return false;
		}
		this.errPassword(""); //エラーメッセージクリア
		return true;
	}
}
