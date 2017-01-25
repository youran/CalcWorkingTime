const httpntlm = require('httpntlm');
const $ = require('cheerio');
const moment = require('moment');

let args = process.argv.slice(2);

let dropRestTime = (str) => {
    if (str.slice(0, 2) === '12') {
        return '12:0:0';
    }
    return str;
};

let calcTime = (enter, leave) => {
    let pos1 = enter.lastIndexOf(':'), pos2 = leave.lastIndexOf(':')
    enter = dropRestTime(enter);
    enter = enter.slice(0, pos1) + ':0';
    leave = dropRestTime(leave);
    leave = leave.slice(0, pos2) + ':0';

    let enterDate = new Date(moment(enter, 'H:m:s'));
    let leaveDate = new Date(moment(leave, 'H:m:s'));
    console.log(enterDate.toString());
    console.log(leaveDate.toString());

    let diffMin = (leaveDate.getTime() - enterDate.getTime()) / (1000 * 60);
    if (enterDate.getHours() <= 12 && leaveDate.getHours() >= 13) {
        diffMin -= 60;
    }

    console.log(diffMin);
    return diffMin;
};


httpntlm.get({
    url: 'http://13.187.243.2/ASP/working_time/Timequery_debug.asp',
    username: 'your_username',
    password: 'your_password',
    workstation: '',
    domain: ''
}, (err, res) => {
    if(err) {
        return err;
    }

   // console.log(res.headers);
    //console.log(res.body);
    let $rows = $(res.body).find('.tblcell');
    let totalTime = 0, expectedTime = 0;

    //console.log($rows.length);
    $rows.each((index, elem) => {
        let $elem = $(elem);
        if (!$elem.find('font').length) {
            return;
        }

        //console.log($elem.find('.subTitle').length);
        let enterTime = $elem.find('font').eq(1).html().trim(),
            leaveTime = $elem.find('font').eq(2).html().trim();

        //console.log(enterTime);
        totalTime += calcTime(enterTime, leaveTime);
        expectedTime += (8 * 60);
    });

    totalTime = totalTime + args[0] * 8 * 60;
    console.log('已工作: ' + totalTime + ' 分');
    console.log('(含当天)共需工作: ' + expectedTime + ' 分');
    if (totalTime < expectedTime) {
        console.log('(含当天)仍需工作: ' + (expectedTime - totalTime) + ' 分');
    } else {
        console.log('已加班: ' + (totalTime - expectedTime) + ' 分');
    }
});
