/// <reference path="../typings/lodash.d.ts" />

class SpeechModel {

        /**
         * 指定した日付より前のスピーチ一覧を取得します。
         * groupIdを指定した場合は、指定したグループのスピーチ一覧を取得します。
         * groupIdにnullを指定した場合は、ユーザのスピーチ一覧を取得します。
         * countに取得件数を指定します。
         */
        getSpeechListBeforeDate(userId: number, groupId: number, targetDate: Date, count: number) {
                var param = {
                        'before': util.formatDateUtc(targetDate),
                        'count': count
                };
                return this.getSpeechList(param, userId, groupId);
        }

        /**
         * 指定した日付より後のスピーチ一覧を取得します。
         * groupIdを指定した場合は、指定したグループのスピーチ一覧を取得します。
         * groupIdにnullを指定した場合は、ユーザのスピーチ一覧を取得します。
         * countに取得件数を指定します。
         */
        getSpeechListAfterDate(userId: number, groupId: number, targetDate: Date, count: number) {
                var param = {
                        'after': util.formatDateUtc(targetDate),
                        'count': count
                };
                return this.getSpeechList(param, userId, groupId);
        }

        /**
         * 指定した日付以前のスピーチ一覧を取得します。
         * groupIdを指定した場合は、指定したグループのスピーチ一覧を取得します。
         * groupIdにnullを指定した場合は、ユーザのスピーチ一覧を取得します。
         * countに取得件数を指定します。
         */
        getSpeechListUntilDate(userId: number, groupId: number, targetDate: Date, count: number) {
                var param = {
                        'until': util.formatDateUtc(targetDate),
                        'count': count
                };
                return this.getSpeechList(param, userId, groupId);
        }
        
        /**
         * 指定した日付以降スピーチ一覧を取得します。
         * groupIdを指定した場合は、指定したグループのスピーチ一覧を取得します。
         * groupIdにnullを指定した場合は、ユーザのスピーチ一覧を取得します。
         * countに取得件数を指定します。
         */
        getSpeechListSinceDate(userId: number, groupId: number, targetDate: Date, count: number) {
                var param = {
                        'since': util.formatDateUtc(targetDate),
                        'count': count
                };
                return this.getSpeechList(param, userId, groupId);
        }

        getSpeechListByKeyword(userId: number, groupId: number, date_since: Date, date_until: Date, keyword: string, count: number) {
                var param = {
                        'since': util.formatDateUtc(date_since),
                        'until': util.formatDateUtc(date_until),
                        'query': keyword,
                        'count': count
                };
                return this.getSpeechList(param, userId, groupId);
        }
        
        getSpeechList(param: any, userId: number, groupId: number) {
                if (groupId) {
                        param['group_id'] = groupId;
                } else {
                        param['user_id'] = userId;
                }
                return $.ajax({
                        type: "GET",
                        url: AppDataManager.getSpeechViewerBaseUrl() + '/speech/list',
                        headers: { 'X-AUTH-TOKEN': AppDataManager.getAuthToken() },
                        data: param
                });
        }

        getSpeechCount(userId: number, groupId: number, beginDate: Date, endDate: Date, interval: number) {
                var param = {
                        'begin': util.formatDateUtc(beginDate),
                        'end': util.formatDateUtc(endDate),
                        'interval': interval
                };
                if (!groupId) {
                        param['user_id'] = userId;
                } else {
                        param['group_id'] = groupId;
                }
                return $.ajax({
                        type: "GET",
                        url: AppDataManager.getSpeechViewerBaseUrl() + '/speech/count',
                        headers: { 'X-AUTH-TOKEN': AppDataManager.getAuthToken() },
                        data: param
                });
        }
}
