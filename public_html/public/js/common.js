/**

Author By. Jin-Yong, Lee

**/

/***************************
 * [숫자 3개마다 콤마]
 * @param number              숫자
 * @return 3개마다 콤마가 찍힌 문자열
****************************/
function _numberWithCommas(number) {
     return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/***************************
* [일정 수준의 길이까지 허용하고 후에 ... 붙임]
* @param msg                  문자열
* @param length               허용할 길이
* @return 문자열
****************************/
function _trimDotString(msg, length) {
     return (msg.length > length) ? msg.substring(0, length) + "..." : msg;
}

/***************************
 * [포맷 메소드 추가]
 * 날짜 포멧 출력
****************************/
Date.prototype.format = function (f) {
     if (!this.valueOf())     return " ";

     var weekNAme = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
     var d = this;

     return f.replace(/(yyyy|yy|MM|dd|E|hh|mm|ss|a\/p)/gi, function($1) {
          switch ($1) {
               case "yyyy": return d.getFullYear();
               case "yy": return (d.getFullYear() % 1000).zf(2);
               case "MM": return (d.getMonth() + 1).zf(2);
               case "dd": return d.getDate().zf(2);
               case "E": return weekName[d.getDay()];
               case "HH": return d.getHours().zf(2);
               case "hh": return ((h = d.getHours() % 12) ? h : 12).zf(2);
               case "mm": return d.getMinutes().zf(2);
               case "ss": return d.getSeconds().zf(2);
               case "a/p": return d.getHours() < 12 ? "오전" : "오후";
               default: return $1;
          }
     });
};
String.prototype.string = function (len) { var s = '', i = 0; while (i++ < len) { s += this; } return s; };
String.prototype.zf = function (len) { return "0".string(len - this.length) + this; };
Number.prototype.zf = function (len) { return this.toString().zf(len); };
