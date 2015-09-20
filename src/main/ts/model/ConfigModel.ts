/// <reference path="../typings/jquery.d.ts" />
/// <reference path="../typings/knockout.d.ts" />
/// <reference path="../typings/lodash.d.ts" />

class ConfigModel {
	getApplicationVersion() {
		return $.ajax({
			type: "GET",
			url: AppDataManager.getSpeechViewerBaseUrl() + '/version'
		})
	}
}