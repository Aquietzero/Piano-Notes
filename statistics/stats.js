const _ = require('lodash');
const fs = require('fs');
const path = require('path');

let practiceTime = (f) => {
    let date = f.split('.')[0];
    f = path.join('../', f);
    let timers = [{
        re: /练琴(.*)小时/g,
        unit: 'h',
    }, {
        re: /练琴(.*)分钟/g,
        unit: 'm',
    }]
    let note = fs.readFileSync(f);
    note = note.toString();

    let time = {date};
    _.each(timers, (timer) => {
        let match = timer.re.exec(note);
        if (match && match[1].length < 8) {
            time = _.extend(time, {
                text: match[1],
                unit: timer.unit,
            });
        }
    });

    return time;
}

let parseTime = (time) => {
    if (!time.text) return 0;

    let t;
    if (_.indexOf(time.text, '小时') > -1) {
        let {h, m} = time.text.split('小时');
        t = parseFloat(h) + parseFloat(m)/60;
    } else if (_.indexOf(time.text, '半') > -1) {
        t = 0.5;
    } else if (time.unit == 'h') {
        t = parseFloat(time.text);
    } else if (time.unit == 'm') {
        t = parseFloat(time.text) / 60;
    } else {
        console.log(time);
    }

    return t;
}

let parseDistribution = (times) => {
    let dist = {};

    _.each(times, (time) => {
        console.log(time.date);
        let key = time.date.slice(0, 6);
        dist[key] = dist[key] || {
            days: 0,
            hours: 0,
        };

        let h = parseTime(time);
        if (h) {
            dist[key].days += 1;
            dist[key].hours += h;
        }
    });

    return dist;
}

let stats = (cb) => {
    let dir = path.join('../');
    let files = fs.readdirSync(dir);

    // notes are all with filename `yyyymmdd.md`
    files = _.filter(files, (f) => {
        return f.match(/\d+\.md/g);
    });

    let times = _.map(files, (f) => {
        return practiceTime(f);
    });

    let total = 0;
    _.each(times, (time) => {
        total += parseTime(time);
    });

    console.log(total.toFixed(2));
    console.log(parseDistribution(times));

    cb();
}

stats((err) => {
    if (err) console.log(err);
    console.log('done.');
    process.exit();
});

