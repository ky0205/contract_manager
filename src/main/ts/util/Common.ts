module util {
    export function getUrlVars(): any {
        var vars = {}, max = 0, hash = [], array = "";
        var url = window.location.search;

        //?を取り除くため、1から始める。複数のクエリ文字列に対応するため、&で区切る
        hash = url.slice(1).split('&');
        max = hash.length;
        for (var i = 0; i < max; i++) {
            array = hash[i].split('=');    //keyと値に分割。
            //vars.push(array[0]);    //末尾にクエリ文字列のkeyを挿入。
            vars[array[0]] = array[1];    //先ほど確保したkeyに、値を代入。
        }

        return vars;
    }
    
    export function clamp(v: number, min: number, max: number) {
        if (v < min) {
            return min;
        } else if (v > max) {
            return max;
        } else {
            return v;
        }
    }

    export function formatMillis(millis: number) {
        return moment(millis).format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]");
    }

    export function formatMillisUtc(millis: number) {
        return moment(millis).utc().format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]");
    }

    export function formatDateUtc(date: Date) {
        return moment(date).utc().format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]");
    }
    
    export function escapeRegularExpression(target: string) {
        var tmp = target.replace( /\\/g , '\\\\' )
                    .replace( /\|/g , '\\|' )
                    .replace( /\^/g , '\\^' )
                    .replace( /\$/g , '\\$' )
                    .replace( /\//g , '\\/' )
                    .replace( /\?/g , '\\?' )
                    .replace( /\./g , '\\.' )
                    .replace( /\+/g , '\\+' )
                    .replace( /\*/g , '\\*' )
                    .replace( /\(/g , '\\(' )
                    .replace( /\)/g , '\\)' )
                    .replace( /\[/g , '\\[' )
                    .replace( /\]/g , '\\]' );
        return tmp;
    }

}

class ErrorMessageHandler {
    clearErrorMessageTimeout: number;

    constructor(public errorMessage: KnockoutObservable<string>) { }

    set(message: string) {
        if (!message) {
            return false;
        }
        this.errorMessage(message);
        if (this.clearErrorMessageTimeout) {
            clearTimeout(this.clearErrorMessageTimeout);
        }
        this.clearErrorMessageTimeout = setTimeout(() => {
            this.errorMessage('');
        }, 2000);
        return true;
    }

    setByHttpStatus(status: number): boolean {
        var msg: string = null;
        /*switch (status) {
            case 400:
                msg = 'エラーが発生しました。';
                break;
            case 401:
            case 403:
                msg = '認証に失敗しました。';
                break;
            case 500:
                msg = 'サーバーでエラーが発生しました。';
                break;
            case 503:
                msg = 'サーバーが込み合っています。時間を置いてログインしなおしてください。';
                break;
        }*/
        if (status === 401) {
            msg = '認証に失敗しました。';
        } else {
            msg = 'サーバーエラーが発生しました(' + status + ')。';
        }
        return this.set(msg);
    }
}
