var express = require('express');
var router = express.Router();
var cheerio = require('cheerio');
var fs = require('fs');
var request = require('request');
var Promise = require('bluebird');
var config = require('./config');
const verifyEmail = require('./util/myUtil').verifyEmail;
const mailAPI = require('./nodemailer').mailAPI;
const schedule = require('node-schedule');



/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.get('/getPages', function(req, res, next) {
    request('http://www.cnblogs.com/', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // console.log(body) // Show the HTML for the Google homepage.
            const $ = cheerio.load(body);
            // const result = $('.v-align-middle').html();
            const arrays = [];
            $('.titlelnk').each((index, value) => {
                arrays.push({index: index, href: value.attribs.href, title: value.children[0].data});
            });
            res.render('index', { title: arrays });
        } else {
            return res.render('index', { title: 'error' });
        }
    })
});


router.get('/getCnblogsPages', function(req, res, next) {

    const email_url = req.query.email_url;
    if(!email_url || !verifyEmail(email_url)) return res.send("邮箱地址出错");

    request('http://www.cnblogs.com/', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // console.log(body) // Show the HTML for the Google homepage.
            const $ = cheerio.load(body);
            let result = `<ul>`;
            $('.titlelnk').each((index, value) => {
                result += renderHtm(index, value);
            });
            result += `</ul>`;
            mailAPI.sendMail(config.mail.mailServerMe, {
                to: email_url,
                subject: '博客园首页20篇文章',
                text: "11",
                html: result,
                type: "mail",
                typeMessage: "Me"
            }, function(err, info) {
                if(err) return res.render('index', { title: 'error' });
                return res.send("OK");
            });
        } else {
            return res.send("error");
        }
    })
});


router.get('/getCron', function(req, res, next) {

    let startTime = new Date(Date.now() + 5000);
    let endTime = new Date(startTime.getTime() + 5000);
    // var j = schedule.scheduleJob({ start: startTime, end: endTime, rule: '* * * * * *' }, function(){
    var j = schedule.scheduleJob('* 10 8 * * *', function(){
        console.log("send mail");
        request
            .get('http://115.159.70.195:3000/getCnblogsPages?email_url=maduar@163.com')
            .on('error', function(err) {
                console.log(err)
            })
    });

    return res.send("set cron OK!");
});

function renderHtm(index, value) {
    const tmp = Number(index) + 1;
    const title = value.children[0].data;
    const href = value.attribs.href;
    const result = `<li>${tmp}: <a href="${href}">${title}</a></li>`;
    return result;
}


module.exports = router;