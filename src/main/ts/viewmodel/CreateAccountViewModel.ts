/// <reference path="../typings/jquery.d.ts" />
/// <reference path="../typings/knockout.d.ts" />
/// <reference path="../typings/lodash.d.ts" />
/// <reference path="../typings/md5.d.ts" />

class CreateAccountViewModel {
	// model
	userModel: UserModel;
	user: User;
	
	//画面項目 
	registrationKey: KnockoutObservable<string> = ko.observable<string>(""); //登録キー
	contractId: KnockoutObservable<string> = ko.observable<string>(""); //契約ID 
	account: KnockoutObservable<string> = ko.observable<string>(""); // アカウント
	passwd: KnockoutObservable<string> = ko.observable<string>(""); //パスワード
	rePasswd: KnockoutObservable<string> = ko.observable<string>(""); //パスワード確認
	mailAddress: KnockoutObservable<string> = ko.observable<string>(""); //メールアドレス
	displayName: KnockoutObservable<string> = ko.observable<string>(""); //表示名
	selectedIconId: KnockoutObservable<number> = ko.observable<number>(-1); //アイコンID
	iconlist: KnockoutObservableArray<Icon> = ko.observableArray<Icon>([]); //設定可能なアイコンリスト
	isSubmitButtonClicked: KnockoutObservable<boolean> = ko.observable<boolean>(false);
	
	//エラーメッセージ
	errRegistrationKey: KnockoutObservable<string> = ko.observable<string>(""); //登録キー
	errContractId: KnockoutObservable<string> = ko.observable<string>(""); //契約ID
	errAccount: KnockoutObservable<string> = ko.observable<string>(""); // アカウント
	errPasswd: KnockoutObservable<string> = ko.observable<string>(""); //パスワード
	errRePasswd: KnockoutObservable<string> = ko.observable<string>(""); //パスワード確認
	errMailAddress: KnockoutObservable<string> = ko.observable<string>(""); //メールアドレス
	errDisplayName: KnockoutObservable<string> = ko.observable<string>(""); //表示名
	errSelectedIconId: KnockoutObservable<string> = ko.observable<string>(""); //アイコン
	errorMessage: KnockoutObservable<string> = ko.observable<string>("");

	constructor() {
		//model初期化
        this.userModel = new UserModel();

		//thisのbind
		this.createAccount = this.createAccount.bind(this);
		this.showLogin = this.showLogin.bind(this);
		this.onClickIcon = this.onClickIcon.bind(this);

		//初期表示
		this.updateCurrentConfig();
	}
	
	/**
	 * 初期表示
	 */
	updateCurrentConfig() {

		this.userModel.getAvailabeUserIconList().then((iconListJson) => {
			//アイコンリスト表示
			_.forEach((iconListJson), (iconJson: any) => {
				var icon = new Icon(iconJson.id, iconJson.filename, iconJson.icon_type, null, null);
				this.iconlist.push(icon);
				//1個目のアイコンをチェック状態にする`
				if (this.selectedIconId() === -1) {
					this.selectedIconId(icon.id);
				}
            });
		}).fail((err) => {
			if (err.status === 401) {
				// 認証失敗
				this.errorMessage("認証に失敗しました");
			} else {
				//TODO: エラー処理
				this.errorMessage("サーバエラー");
			}
		});
	}
	
	/**
	 * アカウントを登録します(仮登録)
	 */
	createAccount() {
		this.isSubmitButtonClicked(true);
		
		// 入力チェック
		var validateResult = true;
		//認証キー
		if(!this.validateRegistrationKey()){
			validateResult = false;
		}
		//契約ID
		if(!this.validateContractId()){
			validateResult = false;
		}
		//アカウント
		if(!this.validateAccount()){
			validateResult = false;
		}
		//表示名
		if(!this.validateDisplayName()){
			validateResult = false;
		}
		//パスワード
		if(!this.validatePasswd()){
			validateResult = false;
		}
		//パスワードの確認
		if(!this.validateRePasswd()){
			validateResult = false;
		}
		//メールアドレス
		if(!this.validateMailAddress()){
			validateResult = false;
		}
		//アイコン
		if(!this.validateSelectedIconId()){
			validateResult = false;
		}
		
		//入力内容に問題がなければ登録実行
		if (validateResult) {
			//登録情報生成	
			var icon = new Icon(this.selectedIconId(), null, -1, -1, -1);
			var model = new Model(-1, null); //idにマイナス値を指定するとデフォルトモデルを設定
			this.user = new User(
				this.registrationKey(),
				this.contractId(),
				-1,
				this.account(),
				CybozuLabs.MD5.calc(this.passwd()),
				this.mailAddress(),
				this.displayName(),
				icon,
				model,
				null
				);
		
			//登録実行
			this.userModel.createUser(this.user).done((result) => {
				alert("登録情報をメール送信しました。メールの内容に従って本登録してください。");
				window.location.href = "login.html";
			}).fail((jqXHR: JQueryXHR, textStatus, errorThrown) => {
				if (jqXHR.status == 400) {
					var str : string = jqXHR.responseJSON.message;
					if (str.indexOf('1007') !== -1) {
						this.errorMessage("指定したアカウントは既に使用されています。");
					} /*else if (str.indexOf('1008') !== -1) {
						this.errorMessage("アカウントの登録可能数を超えています。");
					}*/ else {
						this.errorMessage("登録キーまたは契約IDが正しくありません。");
					}
				} else {
					this.errorMessage("サーバエラーが発生しました(" + jqXHR.status + ")。");
				}
				this.isSubmitButtonClicked(false);
			});
		} else {
			this.isSubmitButtonClicked(false);
		}
	}
	
	/**
	 * アイコンを設定します。
	 */
	onClickIcon(data) {
		this.selectedIconId(data.id);
	}
	
	/** 画面遷移メソッド  */
	
	/**
	 * ログイン画面に遷移します。
	 */
	showLogin() {
		window.location.href = "login.html";
	}
	
	/** バリデーションメソッド */
	
	//登録キー
	validateRegistrationKey(): boolean {
		if (!this.registrationKey()) {
			this.errRegistrationKey("登録キーを入力してください");
			return false;
		}
		this.errRegistrationKey(""); //エラーメッセージクリア
		return true;
	}
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
		if (!this.account().match(/^[a-zA-Z0-9_\.\-]+$/)) {
			this.errAccount("アカウントに利用可能な文字は、半角英数記号(ドット、ハイフン、アンダースコア)です。");
			return false;
		}
		if (this.account().length < 4 || this.account().length > 32) {
			this.errAccount("アカウントは4文字以上32文字以内です");
			return false;
		}
		this.errAccount(""); //エラーメッセージクリア
		return true;
	}
	//表示名
	validateDisplayName(): boolean {
		if (!this.displayName()) {
			this.errDisplayName("表示名を入力してください。");
			return false;
		}
		this.errDisplayName(""); //エラーメッセージクリア
		return true;
	}
	//パスワード
	validatePasswd(): boolean {
		if (!this.passwd()) {
			this.errPasswd("パスワードを入力してください。");
			return false;
		}
		if (!this.passwd().match(/^[a-zA-Z0-9-/:-@\[-\`\{-\~]+$/)) {
			this.errPasswd("パスワードに利用可能な文字は、半角英数記号で、8文字以上32文字以内です。");
			return false;
		}
		if (this.passwd().length < 8 || this.passwd().length > 32) {
			this.errPasswd("パスワードに利用可能な文字は、半角英数記号で、8文字以上32文字以内です。");
			return false;
		}
		this.errPasswd(""); //エラーメッセージクリア
		return true;
	}
	//パスワードの確認
	validateRePasswd(): boolean {
		if (!this.rePasswd()) {
			this.errRePasswd("パスワードの確認を入力してください。");
			return false;
		}
		if (this.rePasswd() !== this.passwd()) {
			this.errRePasswd("パスワードが一致しません。");
			return false;
		}
		this.errRePasswd(""); //エラーメッセージクリア
		return true;
	}
	//メールアドレス
	validateMailAddress(): boolean {
		if (!this.mailAddress()) {
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
	//アイコン
	validateSelectedIconId(): boolean {
		if (this.selectedIconId() == -1) {
			this.errSelectedIconId("アイコンを選択してください。");
			return false;
		}
		this.errSelectedIconId(""); //エラーメッセージクリア
		return true;
	}
}