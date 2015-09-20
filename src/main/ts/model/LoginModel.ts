class LoginModel {
	login(contractId: string, account: string, password: string) {
		return $.ajax({
			beforeSend: function(){}, //本APIの場合はbeforeSendを解除する(beforeSendの無限ループを防ぐ)
			type: "POST",
			url: AppDataManager.getSpeechViewerBaseUrl() + "/authenticate",
			contentType: "application/json",
			data: JSON.stringify({
				contract_id: contractId,
				account: account,
				password: password
			}),
		});
	}
}
