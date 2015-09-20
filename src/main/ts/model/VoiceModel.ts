declare var recorderPlugin: any;

class VoiceModel{
	startTime(beginDate: Date, groupId: number, userId: number) {
		return $.ajax({
			type: "PUT",
			url: AppDataManager.getSpeechViewerBaseUrl() + "/voice/start_time",
			contentType: "application/json",
			headers: { 'X-AUTH-TOKEN': AppDataManager.getAuthToken() },
			data: JSON.stringify({
				begin_date: util.formatDateUtc(beginDate),
				group_id: groupId,
				user_id: userId
			})
		})
	}

	isRecording = false;

	startRecording(sessionKey: string) {
		if (this.isRecording) {
			return;
		}
		recorderPlugin.initVoiceRecord();
		recorderPlugin.startRecord(AppDataManager.getSpeechViewerBaseUrl(), sessionKey, AppDataManager.getAuthToken());
		this.isRecording = true;
	}

	endRecording() {
		if (!this.isRecording) {
			return;
		}
		recorderPlugin.stopRecord();
		this.isRecording = false;
	}

	endTime(endDate: Date, sessionKey: string) {
		return $.ajax({
			type: "PUT",
			url: AppDataManager.getSpeechViewerBaseUrl() + "/voice/end_time?session_key=" + sessionKey,
			contentType: "application/json",
			headers: { 'X-AUTH-TOKEN': AppDataManager.getAuthToken() },
			data: JSON.stringify({
				end_date: util.formatDateUtc(endDate)
			})
		})
	}

	/**
	 * 指定した日付より前の音声一覧を取得します。
	 * groupIdを指定した場合は、指定したグループの音声一覧を取得します。
	 * groupIdに0以下を指定した場合は、ユーザの音声一覧を取得します。
	 * countに取得件数を指定します。
	 */
	getVoiceListBeforeDate(userId: number, groupId: number, targetDate: Date, count: number) {
		var param = {
			'end_date': util.formatDateUtc(targetDate),
			'count': count
		};
		if (groupId) {
			param['group_id'] = groupId;
		} else {
			param['user_id'] = userId;
		}
		return $.ajax({
			type: "GET",
			url: AppDataManager.getSpeechViewerBaseUrl() + '/voice/list',
			headers: { 'X-AUTH-TOKEN': AppDataManager.getAuthToken() },
			data: param
		});
	}

	/**
	 * 指定した日付より後の音声一覧を取得します。
	 * groupIdを指定した場合は、指定したグループの音声一覧を取得します。
	 * groupIdに0以下を指定した場合は、ユーザの音声一覧を取得します。
	 * countに取得件数を指定します。
	 */
	getVoiceListAfterDate(userId: number, groupId: number, targetDate: Date, count: number) {
		var param = {
			'begin_date': util.formatDateUtc(targetDate),
			'count': count
		};
		if (groupId) {
			param['group_id'] = groupId;
		} else {
			param['user_id'] = userId;
		}
		return $.ajax({
			type: "GET",
			url: AppDataManager.getSpeechViewerBaseUrl() + '/voice/list',
			headers: { 'X-AUTH-TOKEN': AppDataManager.getAuthToken() },
			data: param
		});
	}

	getVoiceAudioUrl(sessionKey: string, beginDate: Date, endDate: Date) {
		console.log("sessionKey = " + sessionKey);
        var beginDateStr = util.formatDateUtc(beginDate);
        var url = AppDataManager.getSpeechViewerBaseUrl() + '/voice' +
			'?X-AUTH-TOKEN=' + AppDataManager.getAuthToken() +
			'&session_key=' + sessionKey +
			'&begin_date=' + beginDateStr;
		if (endDate) {
	        var endDateStr = util.formatDateUtc(endDate);
			url += '&end_date=' + endDateStr;
		}
		return url;
	}
}

var updateAudioVolumeFunc: Function;

function updateAudioVolume(volume) {
	if (updateAudioVolumeFunc) {
		updateAudioVolumeFunc(volume);
	}
}

function setUpdateAudioVolumeFunc(func: Function) {
	updateAudioVolumeFunc = func;
}

var updateRecogTmpResultFunc: Function;
var recogResultErrorFunc: Function;

function updateRecognizedResult(resultStr: string) {
	if (resultStr.length <= 0) {
		return;
	}
	//console.log(resultStr);
	var result = JSON.parse(resultStr);
	var data = result;
	if (!data) {
		return;
	}
	_.forEach((data), (d: any) => {
		var type: string = d.type;
		if (type === "TMP_RESULT") {
			var result: string = d.result;
			if (updateRecogTmpResultFunc) {
				updateRecogTmpResultFunc(result);
			}
		} else if (type === "RESULT" || type === "SOS") {
			if (updateRecogTmpResultFunc) {
				updateRecogTmpResultFunc("");
			}
		}
	});
}

/**
 * PutVoiceエラー時のコールバック関数
 */
function recogResultError(errorStr: string) {
	console.log("error : " + errorStr);
	if (recogResultErrorFunc) {
		recogResultErrorFunc();
	}
}

function setUpdateRecogTmpResultFunc(func: Function) {
	updateRecogTmpResultFunc = func;
}

function setRecogResultErrorFunc(func: Function) {
	recogResultErrorFunc = func;
}


