/// <reference path="../typings/jquery.d.ts" />
/// <reference path="../typings/knockout.d.ts" />
/// <reference path="../typings/lodash.d.ts" />

class UserModel{

	getUserList(query: string) {
		return $.ajax({
			type: "GET",
			url: AppDataManager.getSpeechViewerBaseUrl() + '/user/list',
			headers: { 'X-AUTH-TOKEN': AppDataManager.getAuthToken() },
			data: {
				'query': query
			}
		});
	}

	getMyself() {
		return $.ajax({
			type: "GET",
			url: AppDataManager.getSpeechViewerBaseUrl() + '/user/self',
			headers: { 'X-AUTH-TOKEN': AppDataManager.getAuthToken() }
		});
	}

	/**
	 * ユーザを作成します(仮登録)。
	 * model_idにマイナス値を指定するとデフォルトのモデルを自動で割り当てる。
	 */
	createUser(user: User) {
		return $.ajax({
			type: "POST",
			url: AppDataManager.getSpeechViewerBaseUrl() + "/user",
			contentType: "application/json",
			headers: {'X-AUTH-TOKEN': AppDataManager.getAuthToken()},
			data: JSON.stringify({
				registration_key: user.registration_key,
				contract_id: user.contractid,
				account: user.account,
				name: user.dispname,
				password: user.password,
				mail_address: user.mailaddress,
				icon_id: user.icon.id,
				model_id: -1
			})
		});
	}
	
	/**
	 * 仮登録したユーザを本登録します。
	 */
	createUserDetermined(passCode: string){
		return $.ajax({
			type: "GET",
			url: AppDataManager.getSpeechViewerBaseUrl() + '/user/registration/' + passCode
		});
	}

	/**
	 * ユーザ情報を変更します。
	 */
	modifyProfile(user: User) {
		return $.ajax({
			type: "PUT",
			url: AppDataManager.getSpeechViewerBaseUrl() + "/user/" + user.id,
			contentType: "application/json",
			headers: {'X-AUTH-TOKEN': AppDataManager.getAuthToken()},
			data: JSON.stringify({
				id: user.id,
				account: user.account,
				name: user.dispname,
				mail_address: user.mailaddress,
				icon_id: user.icon.id,
				model_id: user.model.id
			})
		});
	}

	/**
	 * パスワードを変更します。
	 */
	modifyPassword(userid: number, oldPassword: string, newPassword: string) {
		console.log( AppDataManager.getSpeechViewerBaseUrl() + "/user/" + userid + "/password");
		return $.ajax({
			type: "PUT",
			url: AppDataManager.getSpeechViewerBaseUrl() + "/user/" + userid + "/password", // TODO APIができたら正しいURLに変更
			contentType: "application/json",
			headers: {'X-AUTH-TOKEN': AppDataManager.getAuthToken()},
			data: JSON.stringify({
				'old_password': oldPassword,
				'password': newPassword
			})
		})
	}
	
	/**
	 * 利用可能なアイコンリスト(組み込みアイコン + 自分が登録したアイコン(TODO:次バージョン))
	 * (TODO: UserModelには入れないほうがよい？)
	 */
	getAvailabeUserIconList() {
		return $.ajax({
			type: "GET",
			url: AppDataManager.getSpeechViewerBaseUrl() + '/user/availableicons'
		});
	}
	
	/**
	 * 利用可能なモデルリストを取得します。(TODO: UserModelには入れないほうがよい？)
	 */
	getAvailableModelList(){
		return $.ajax({
			type: "GET",
			url: AppDataManager.getSpeechViewerBaseUrl() + '/model/list',
			headers: { 'X-AUTH-TOKEN': AppDataManager.getAuthToken() }
		});
	}
	
	/**
	 * パスワード再発行依頼を実行します。
	 * 成功すると指定したメールアドレス宛にパスワード再発行画面へのURLが記載されたメールが送信されます。
	 */
	requestResetPassword(user: User){
		return $.ajax({
			type: "PUT",
			url: AppDataManager.getSpeechViewerBaseUrl() + "/user",
			contentType: "application/json",
			data: JSON.stringify({
				registration_key: user.registration_key,
				contract_id: user.contractid,
				account: user.account,
				mail_address: user.mailaddress
			})
		});
	}

	/**
	 * パスワードを再発行します。
	 */
	resetPassword(password: string, passcode: string) {
		return $.ajax({
			type: "PUT",
			url: AppDataManager.getSpeechViewerBaseUrl() + '/user/registration',
			contentType: "application/json",
			data: JSON.stringify({
				'password': password,
				'pass_code': passcode
			})
		});
	}
}
