/// <reference path="../typings/lodash.d.ts" />

class GroupModel{
	createGroup(group: Group) {
		return $.ajax({
			type: "POST",
			url: AppDataManager.getSpeechViewerBaseUrl() + "/group",
			contentType: "application/json",
			headers: { 'X-AUTH-TOKEN': AppDataManager.getAuthToken() },
			data: JSON.stringify({
				name: group.name,
				icon_id: group.icon.id,
				model_id: group.model.id
			})
		});
	}

	getGroupList(query: string) {
		var param = {};
		if (query) {
			param['query'] = query;
		}
		return $.ajax({
			type: "GET",
			url: AppDataManager.getSpeechViewerBaseUrl() + "/group/list",
			headers: { 'X-AUTH-TOKEN': AppDataManager.getAuthToken() },
			data: param
		});
	}

	getGroup(id: number) {
		return $.ajax({
			type: "GET",
			url: AppDataManager.getSpeechViewerBaseUrl() + '/group/' + id,
			headers: { 'X-AUTH-TOKEN': AppDataManager.getAuthToken() }
		});
	}
	
	getMemberList(groupId: number){
		return $.ajax({
			type: "GET",
			url: AppDataManager.getSpeechViewerBaseUrl() + '/group/' + groupId + '/user/list',
			headers: { 'X-AUTH-TOKEN': AppDataManager.getAuthToken() }
		});
	}

	addMember(id: number, userlist: User[]) {
		var userIdlist: number[] = [];
		/*_.forEach(userlist, (user: any) => {
			userIdlist.push(user.id);
		});*/
		console.log(JSON.stringify(userIdlist));

		return $.ajax({
			type: "PUT",
			url: AppDataManager.getSpeechViewerBaseUrl() + "/group/" + id + "/user",
			contentType: "application/json",
			headers: { 'X-AUTH-TOKEN': AppDataManager.getAuthToken() },
			data: JSON.stringify(userlist)
			//data: JSON.stringify(userIdlist)
		});
	}
	
	deleteMember(id:number,userlist: User[]) {
		var userIdlist: number[] = [];
		_.forEach(userlist, (user: any) => {
			userIdlist.push(user.id);
		});
		console.log('deleteMember userIdList=' + JSON.stringify(userIdlist));

		return $.ajax({
			type: "DELETE",
			url: AppDataManager.getSpeechViewerBaseUrl() + "/group/" + id + "/user",
			contentType: "application/json",
			headers: { 'X-AUTH-TOKEN': AppDataManager.getAuthToken() },
			data: JSON.stringify(userIdlist)
		});
	}

	deleteGroup(id: number) {
		return $.ajax({
			type: "DELETE",
			url: AppDataManager.getSpeechViewerBaseUrl() + "/group/" + id,
			contentType: "application/json",
			headers: { 'X-AUTH-TOKEN': AppDataManager.getAuthToken() }
		})
	}
	
	/**
	 * 利用可能なアイコンリスト(組み込みアイコン)
	 */
	getAvailabeGroupIconList() {
		return $.ajax({
			type: "GET",
			url: AppDataManager.getSpeechViewerBaseUrl() + '/group/availableicons'
		});
	}
	
	modifyGroup(group: Group) {
		return $.ajax({
			type: "PUT",
			url: AppDataManager.getSpeechViewerBaseUrl() + "/group/" + group.id,
			contentType: "application/json",
			headers: { 'X-AUTH-TOKEN': AppDataManager.getAuthToken() },
			data: JSON.stringify({
				id: group.id,
				name: group.name,
				icon_id: group.icon.id,
				model_id: group.model.id
			})
		});
	}


}
