const _ = require('lodash');
const fs = require('fs');
const path = require('path');

let extractTimeFromText = (date, note) => {
    let time = {date};

    let timers = [{
        re: /练琴(.*)小时/g,
        unit: 'h',
    }, {
        re: /练琴(.*)分钟/g,
        unit: 'm',
    }];

    _.each(timers, (timer) => {
        let match = timer.re.exec(note);
        if (match && match[1].length < 8) {
            time = _.extend(time, {
                text: match[1],
                unit: timer.unit,
            });
        }
    });

    let summary = note.split('\n')[2] || note;
    if (summary && summary.match(/上课/)) time.attendClass = true;
    if (summary && summary.match(/授课/)) time.giveClass = true;

    return time;
}

let practiceTime = (f) => {
    let date = f.split('.')[0];
    let year = date.slice(0, 4);
    f = path.join('../', year, f);
    let note = fs.readFileSync(f);
    note = note.toString();

    let time = extractTimeFromText(date, note);

    return time;
}

let practiceTimes2015 = () => {
    let f = '2015.md';
    f = path.join('../2015', f);
    let note2015 = fs.readFileSync(f);
    note2015 = note2015.toString();

    let notes = note2015.split('\n');
    let date, time, content;

    let times = _.compact(_.map(notes, (note) => {
        [date, time, content] = note.split(' ');
        if (!time) return;

        time = extractTimeFromText(date, time);
        return time;
    }));

    return times;
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

    summary.text =
      `总计: ` +
      `练琴${summary.days}天，` +
      `${summary.hours.toFixed(2)}小时，` +
      `上课${summary.attendClass}次，` +
      `授课${summary.giveClass}次`

    return summary;
}

let formatDistribution = (dist) => {
    dist = _.sortBy(_.toPairs(dist), (p) => p[0]);
    let byMonth = [];

    _.each(dist, (record) => {
        let date = record[0];
        let stats = record[1];
        let year = date.slice(0, 4);
        byMonth.push({
            year,
            info: `${year}年${parseInt(date.slice(4))}月: ` +
                `练琴${stats.days}天，` +
                `${stats.hours.toFixed(2)}小时，` +
                `上课${stats.attendClass}次，` +
                `授课${stats.giveClass}次`
        });
    });

    let byYear = [];
    let byYearRecords = _.groupBy(dist, (record) => {
        let date = record[0];
        return date.slice(0, 4);
    });

    _.each(byYearRecords, (records, year) => {
        let stats = _.map(records, (r) => r[1]);
        byYear.push({
            year,
            info: `${year}年: ` +
                `练琴${_.sumBy(stats, (s) => s.days)}天，` +
                `${(_.sumBy(stats, (s) => s.hours).toFixed(2))}小时，` +
                `上课${_.sumBy(stats, (s) => s.attendClass)}次，` +
                `授课${_.sumBy(stats, (s) => s.giveClass)}次`
        });
    });

    return {byMonth, byYear};
}

let stats = (cb) => {
    let dir = path.join('..');
    let years = _.filter(fs.readdirSync(dir), (d) => {
        return d.match(/20\d{2}/g) && d != '2015';
    });
    let files = _.flatten(_.map(years, (y) => {
        return fs.readdirSync(path.join('..', y));
    }));

    // notes are all with filename `yyyymmdd.md`
    files = _.filter(files, (f) => {
        return f.match(/\d+\.md/g);
    });

    files = _.filter(files, (f) => f != '2015.md');
    let times = _.map(files, (f) => {
        return practiceTime(f);
    });

    let times2015 = practiceTimes2015();

    times = _.union(times2015, times);

    let total = 0;
    _.each(times, (time) => {
        total += parseTime(time);
    });

    //times = _.filter(times, (t) => t.date < '20160101');
    let dist = parseDistribution(times);
    let {byMonth, byYear} = formatDistribution(dist);

    let y = byMonth[0].year;
    console.log('------');
    console.log(`${y}年`);
    console.log('------');
    _.each(byMonth, (m) => {
        if (m.year != y) {
            y = m.year;
            console.log('------');
            console.log(`${y}年`);
            console.log('------');
        }
        console.log(m.info)
    });
    console.log();
    _.each(byYear, (y) => console.log(y.info));
    console.log();
    console.log(sumDistribution(dist).text);

    cb();
}

stats((err) => {
    if (err) console.log(err);
    console.log('done.');

    setTimeout(() => {
        process.exit();
    }, 1000);
});

