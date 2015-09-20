/// <reference path="../typings/moment.d.ts" />

class AppDataManager {
	/**
	 * 接続先SpeechViewerサーバURLをセットします。
	 */
	static setSpeechViewerBaseUrl(baseUrl: string){
		localStorage.setItem("baseUrl", baseUrl);
	}
	
	/**
	 * 接続先SpeechViewerサーバURLを取得します。
	 */
	static getSpeechViewerBaseUrl():string {
		var baseurl = localStorage.getItem("baseUrl");
		if(baseurl){
			return baseurl;
		}else{
			return Config.baseUrl;
		}
	}
	
	/**
	 * 認証キーをセットします。
	 */
	static setAuthToken(authToken: string){
		localStorage.setItem("authToken", authToken);
	}
	
	/**
	 * 認証キーを取得します。
	 */
	static getAuthToken():string {
		return localStorage.getItem("authToken");
	}
	
	/**
	 * 契約IDをセットします。
	 */
	static setContractId(contractId: string){
		localStorage.setItem("contractId", contractId);
	}
	
	/**
	 * 契約IDを取得します。
	 */
	static getContractId():string {
		return localStorage.getItem("contractId");
	}
	
	/**
	 * ローカルストレージの全ての情報を削除します。
	 */
	static clearAppData():void{
		/**
		//ログインユーザ情報
		localStorage.removeItem("contractId");
		localStorage.removeItem("userId");
		localStorage.removeItem("account");
		localStorage.removeItem("password");
		localStorage.removeItem("name");
		localStorage.removeItem("mailAddress");
		localStorage.removeItem("iconId");
		localStorage.removeItem("iconFilename");
		localStorage.removeItem("iconType");
		localStorage.removeItem("modelId");
		localStorage.removeItem("modelName");
		//選択グループ
		localStorage.removeItem("selectedGroupId");
		//遷移元画面
		localStorage.removeItem("ref");
		//タグクラウド画面表示状態
		localStorage.removeItem("tagcloudViewTargetDate");
		//タイムライン画面表示状態
		localStorage.removeItem("timelineViewTargetDate");
		localStorage.removeItem("timelineViewCount");
		* */
		localStorage.clear();
	}
	
	/**
	 * ログインユーザ情報をセットします。
	 */
	static setLoginUserInfo(userJson: any):void{
		localStorage.setItem("userId", userJson.id);
		localStorage.setItem("account", userJson.account);
		localStorage.setItem("name", userJson.name);
		localStorage.setItem("mailAddress", userJson.mail_address);
		localStorage.setItem("iconId", userJson.icon.id);
		localStorage.setItem("iconFilename", userJson.icon.filename);
		localStorage.setItem("iconType", userJson.icon.icon_type);
		localStorage.setItem("modelId", userJson.model_id);
	}
	
	/**
	 * パスワードをセットします。(TODO:パスワードの暗号化orハッシュ化対応)
	 */
	static setPassword(password: string):void{
		localStorage.setItem("password", password);
	}
	
	/**
	 * ログインユーザ情報を取得します。
	 */
	static getLoginUserInfo():User{
		var icon = new Icon(
			+localStorage.getItem("iconId"),
			localStorage.getItem("iconFilename"),
			+localStorage.getItem("iconType"),
			null,null
		);
		var model = new Model(
			+localStorage.getItem("modelId"),
			localStorage.getItem("modelName")
		);
		var user = new User(
			null,
			localStorage.getItem("contractId"),
			+localStorage.getItem("userId"),
			localStorage.getItem("account"),
			localStorage.getItem("password"),
			localStorage.getItem("mailAddress"),
			localStorage.getItem("name"),
			icon,
			model,
			+localStorage.getItem("roleId")
		);
		
		return user;
	}
	
	/**
	 * 択中のグループIDをセットします。
	 * ユーザログを選択する場合はgroupIdにnullを指定します。
	 */
	static setSelectedGroupId(groupId: number):void{
		if(groupId){
			localStorage.setItem("selectedGroupId", groupId.toString());
		}else{
			//localStorage.setItem("selectedGroupId", null);
			localStorage.removeItem("selectedGroupId");
		}
	}
	
	/**
	 * 選択中のグループIDを取得します。
	 * ユーザログが選択されてる場合はnullを返します。
	 */
	static getSelectedGroupId():number{
		var groupIdStr = localStorage.getItem("selectedGroupId");
		if(groupIdStr){
			return groupIdStr;
		}else{
			return null;
		}
	}
	
	/**
	 * タグクラウド画面表示日時をセットします。
	 */
	static setTagCloudViewTargetDate(targetDate: Date):void{
		localStorage.setItem("tagcloudViewTargetDate", moment(targetDate).utc().format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]"));
	}
	
	/**
	 * タグクラウド画面の画面表示日時を「YYYY-MM-DD[T]HH:mm:ss.SSS[Z]」形式の文字列で取得します。
	 * タグクラウド画面の画面表示日時が設定されていない場合は現在日時を返します。
	 */
	static getTagCloudViewTargetDate():string {
		var targetDate = localStorage.getItem("tagcloudViewTargetDate");
		if(targetDate){
			return targetDate;
		}else{
			//デフォルトとして現在日時を返却
			return moment(new Date()).utc().format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]");
		}
	}
	
	/**
	 * タイムライン画面表示日時をセットします。
	 */
	static setTimelineViewTargetDate(targetDate: Date):void{
		if(targetDate){
			localStorage.setItem("timelineViewTargetDate", moment(targetDate).utc().format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]"));
		}else{
			//localStorage.setItem("timelineViewTargetDate", null);
			localStorage.removeItem("timelineViewTargetDate");
		}
	}
	
	/**
	 * タイムライン画面の画面表示日時を「YYYY-MM-DD[T]HH:mm:ss.SSS[Z]」形式の文字列で取得します。
	 * タグクラウド画面の画面表示日時が設定されていない場合は現在日時を返します。
	 */
	static getTimelineViewTargetDateByUtcString():string {
		var targetDate = localStorage.getItem("timelineViewTargetDate");
		if(targetDate){
			return targetDate;
		}else{
			//デフォルトとして現在日時を返却
			return moment(new Date()).utc().format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]");
		}
	}
	
	/**
	 * 
	 */
	static getTimelineViewTargetDate():Date {
		var targetDate:string = localStorage.getItem("timelineViewTargetDate"); //UTCフォーマットの時刻
		if(targetDate){
			return moment(targetDate).toDate();
		}else{
			//デフォルトとして現在日時を返却
			return new Date();
		}
	}
	
	/**
	 * タイムライン画面の表示件数をセットします。
	 */
	static setTimelineViewCount(count: number):void{
		localStorage.setItem("timelineViewCount", count.toString());
	}
	
	/**
	 * タイムライン画面の表示件数を取得します。
	 * 設定されていない場合はデフォルトとして10を返します。
	 */
	static getTimelineViewCount():number {
		var count = localStorage.getItem("timelineViewCount");
		if(count){
			return count;
		}else{
			//デフォルト10件
			return 10;
		}
	}
	
	/**
	 * 一つ前の画面(html名)をセットします。
	 */
	static setBeforeView(viewName: string){
		localStorage.setItem("ref", viewName);
	}
	
	/**
	 * 一つ前の画面(html名)を返します。
	 */
	static getBeforeView():string {
		return localStorage.getItem("ref");
	}
	
	/**
	 * グループリスト画面への遷移元画面(html名)をセットします。
	 */
	 static setBeforeGroupListView(viewName: string) {
		 localStorage.setItem("groupRef", viewName);
	 }
	 
	 /**
	  * 
	  */
	  static getBeforeGroupListView():string {
		  return localStorage.getItem("groupRef");
	  }
}
