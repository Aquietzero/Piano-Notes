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

    let summary = note.split('\n')[2];
    let time = {date};
    if (summary.match(/上课/)) time.attendClass = true;
    if (summary.match(/授课/)) time.giveClass = true;

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
    if (time.text.match(/小时/g)) {
        let [h, m] = time.text.split('小时');
        t = parseFloat(h) + parseFloat(m)/60;
    } else if (time.text.match(/半/g)) {
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
        let key = time.date.slice(0, 6);
        if (!dist[key]) {
            dist[key] = {
                days: 0,
                hours: 0,
                attendClass: 0,
                giveClass: 0,
            };
        }

        let h = parseTime(time);
        if (h) {
            dist[key].days += 1;
            dist[key].hours += h;
        }
        if (time.attendClass) dist[key].attendClass += 1;
        if (time.giveClass) dist[key].giveClass += 1;
    });

    return dist;
}

let sumDistribution = (dist) => {
    let summary = {};
    _.each(dist, (stats, date) => {
        _.each(stats, (val, key) => {
            summary[key] = summary[key] || 0;
            summary[key] += val;
        });
    });

    return summary;
}

let formatDistribution = (dist) => {
    _.each(dist, (stats, date) => {
        console.log(
            `${date.slice(0, 4)}年${parseInt(date.slice(4))}月: ` +
            `练琴${stats.days}天，` +
            `${stats.hours.toFixed(2)}小时，` +
            `上课${stats.attendClass}次，` +
            `授课${stats.giveClass}次`
        );
    });
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

    let dist = parseDistribution(times);
    formatDistribution(dist);
    console.log(sumDistribution(dist));

    cb();
}

stats((err) => {
    if (err) console.log(err);
    console.log('done.');
    process.exit();
});

