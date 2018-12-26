const _ = require('lodash');
const fs = require('fs');
const path = require('path');


let parseKeywords = (f) => {
    let date = f.split('.')[0];
    f = path.join('../', f);
    let note = fs.readFileSync(f);
    note = note.toString();

    let keywords = [];
    if (note.match(/599/g)) keywords.push('czerny 599');
    if (note.match(/849/g)) keywords.push('czerny 849');
    if (note.match(/299/g)) keywords.push('czerny 299');
    if (note.match(/小巴赫/g)) keywords.push('bach');
    if (note.match(/二部/g)) keywords.push('inventions');
    if (note.match(/三部/g)) keywords.push('sinfornias');

    let types = ['奏鸣曲', '夜曲', '小奏鸣曲'];
    let composers = ['贝多芬', '莫扎特', '克莱门蒂', '海顿', '肖邦', '斯卡拉蒂'];

    let pieceKeywords = _.union(types, composers);
    let wordRange = 10;
    _.each(pieceKeywords, (k) => {
        let index = note.search(RegExp(k, 'g'));
        if (index > 0) {
            from = index - wordRange;
            to = index + k.length + wordRange;
            from = from < 0 ? 0 : from;
            to = to > note.length ? note.length : to;
            keywords.push(`...${note.slice(from, to)}...`);
        }
    });

    return keywords;
}

let progressAnalysis = (cb) => {
    let dir = path.join('../');
    let files = fs.readdirSync(dir);

    // notes are all with filename `yyyymmdd.md`
    files = _.filter(files, (f) => {
        return f.match(/\d+\.md/g);
    });

    files = _.filter(files, (f) => f != '2015.md');
    _.each(files, (f) => {
        let keywords = parseKeywords(f);
        console.log(f, keywords);
    });

    cb();
}

progressAnalysis((err) => {
    if (err) console.log(err);
    console.log('done.');

    setTimeout(() => {
        process.exit();
    }, 1000);
});

