/// <reference path="../typings/moment.d.ts" />

class AutoLoginUtil{
    autoLoginTimer: number;
    pollingIntervalMinutes: number; //自動ログインの実行間隔(分)
    
    constructor(minutes: number = 5) {
        //thisのバインド
        this.startAutoLogin = this.startAutoLogin.bind(this);
        this.stopAutoLogin = this.stopAutoLogin.bind(this);
        this.validAndUpdateAuthkey = this.validAndUpdateAuthkey.bind(this);
        
        //自動ログインの実行間隔(デフォルトは5分)
        this.pollingIntervalMinutes = minutes;
    }
    
    /**
     * 自動ログインを開始します。
     */
    startAutoLogin() {
        console.log("自動ログイン開始:"+ new Date().toISOString());
        //定期的にauthTokenの有効チェック&無効な場合はauthTokenの更新を行う。
        
        //初回実行
        this.validAndUpdateAuthkey();
        //定期実行
        this.autoLoginTimer = setInterval(
			this.validAndUpdateAuthkey, 
			this.pollingIntervalMinutes * 60 * 1000
		);
    }
 
    /**
     * 自動ログインを終了します。
     */
    stopAutoLogin() {
        clearTimeout(this.autoLoginTimer);
    }
	
     /**
    * 認証キーの有効性を検証し、認証キーが無効な場合は更新する
    */
    validAndUpdateAuthkey() {
        this.execCheckAuthTokenAPI().then((result) => {
            //認証キーは有効。何もしない。
            console.log("認証キーは有効です。:" + AppDataManager.getAuthToken());
        }).fail((jqXHR: JQueryXHR, textStatus, errorThrown) => {
            if (jqXHR.status === 401) {
                console.log("認証キーが無効です。:" + AppDataManager.getAuthToken());
                //再ログイン。
                return this.reLogin().then((result) => {
                    //ローカルストレージのauthTokenを更新する。
                    AppDataManager.setAuthToken(result.token_key);
                    console.log("認証キー更新完了:"+AppDataManager.getAuthToken());
                }).fail((jqXHR: JQueryXHR, textStatus, errorThrown) => {
                    //再認証失敗。あきらめる。
                    console.log("自動ログイン失敗");
                });
            }
        });
    }
    
    /**
     * 認証キーの有効せいを確認するためのRESTAPI実行
     * (とりあえず/user/selfを使う)
     */
    execCheckAuthTokenAPI() {
        return $.ajax({
            type: "GET",
            url: AppDataManager.getSpeechViewerBaseUrl() + '/user/self',
            headers: { 'X-AUTH-TOKEN': AppDataManager.getAuthToken() }
        });
    }

    /**
     * 再ログインします。
     */
    reLogin() {
        //ローカルストレージからログイン情報を取得
        var contractId = AppDataManager.getContractId();
        var account = AppDataManager.getLoginUserInfo().account;
        var password = AppDataManager.getLoginUserInfo().password;
        
        return $.ajax({
			type: "POST",
			url: AppDataManager.getSpeechViewerBaseUrl() + "/authenticate",
			contentType: "application/json",
			data: JSON.stringify({
				contract_id: contractId,
				account: account,
				password: password
			}),
		})
    }
}
