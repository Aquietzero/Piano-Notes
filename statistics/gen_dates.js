const _ = require('lodash');
const fs = require('fs');
const path = require('path');

let genDates = (callback) => {
    let f = path.join('../2015.md');

    let dates = [];
    let from = new Date('2015-01-21');
    let to = new Date('2016-01-01');

    while (from < to) {
        dates.push(
            from.getFullYear() +
            ('0' + (from.getMonth()+1)).slice(-2) +
            ('0' + from.getDate()).slice(-2)
        );
        from.setDate(from.getDate() + 1);
    }

    let file = fs.writeFileSync(f, dates.join('\n'));
    callback();
}

genDates((err) => {
    console.log('done.');
    process.exit();
});
