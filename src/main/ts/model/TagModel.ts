/// <reference path="../typings/jquery.d.ts" />

class TagModel{
        getTagList(userId: number, groupId: number, beginDateStr: string, endDateStr: string, count: number, totalTime: number) {

                var param = {
                        'begin_date': beginDateStr,
                        'end_date': endDateStr,
                        'count': count,
                        'total_time': totalTime
                };

                if (groupId) {
                        param['group_id'] = groupId;
                } else {
                        param['user_id'] = userId;
                }
                
                return $.ajax({
                        type: "GET",
                        url: AppDataManager.getSpeechViewerBaseUrl() + '/tag/list',
                        headers: { 'X-AUTH-TOKEN': AppDataManager.getAuthToken() },
                        data: param
                });

        }
}
